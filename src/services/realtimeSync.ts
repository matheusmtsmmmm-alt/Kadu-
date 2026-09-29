import { AppStateData } from '../types';
import { fetchAppData, setLocalCache, sanitizeLogoUrl } from './api';

export interface RealtimeStatus {
  status: 'connected' | 'syncing' | 'offline';
  mode: 'websocket' | 'sse' | 'polling' | 'offline';
  connectedClients: number;
  lastSyncedAt: Date | null;
  version: number;
}

type DataListener = (data: AppStateData) => void;
type StatusListener = (status: RealtimeStatus) => void;

class RealtimeSyncService {
  private ws: WebSocket | null = null;
  private sse: EventSource | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private dataListeners = new Set<DataListener>();
  private statusListeners = new Set<StatusListener>();
  
  private currentVersion = 0;
  private isConnecting = false;
  private reconnectTimeout: any = null;
  private versionPollInterval: any = null;
  private lastSyncedAt: Date | null = null;
  private connectedClients = 1;
  private currentMode: RealtimeStatus['mode'] = 'offline';
  private currentStatus: RealtimeStatus['status'] = 'syncing';
  private retryCount = 0;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('kadu_manutencoes_sync');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'DATA_UPDATE' && event.data.data) {
            this.handleIncomingData(event.data.data, event.data.version || Date.now(), 'broadcast_channel');
          }
        };
      } catch (e) {
        // BroadcastChannel unavailable
      }
    }
  }

  public init() {
    this.connect();
    this.startVersionPolling();

    // Reconnect on network recovery or visibility change
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleNetworkOnline);
      window.addEventListener('offline', this.handleNetworkOffline);
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    return () => {
      this.destroy();
    };
  }

  public destroy() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.versionPollInterval) clearInterval(this.versionPollInterval);
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
    if (this.sse) {
      this.sse.close();
      this.sse = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleNetworkOnline);
      window.removeEventListener('offline', this.handleNetworkOffline);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  private handleNetworkOnline = () => {
    this.retryCount = 0;
    this.connect();
    this.forceSync();
  };

  private handleNetworkOffline = () => {
    this.updateStatus('offline', 'offline');
  };

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // Fast check when user unlocks phone or opens app
      this.checkServerVersion();
    }
  };

  public subscribeData(listener: DataListener): () => void {
    this.dataListeners.add(listener);
    return () => {
      this.dataListeners.delete(listener);
    };
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public getStatus(): RealtimeStatus {
    return {
      status: this.currentStatus,
      mode: this.currentMode,
      connectedClients: this.connectedClients,
      lastSyncedAt: this.lastSyncedAt,
      version: this.currentVersion,
    };
  }

  private updateStatus(status: RealtimeStatus['status'], mode: RealtimeStatus['mode']) {
    this.currentStatus = status;
    this.currentMode = mode;
    const current = this.getStatus();
    this.statusListeners.forEach((fn) => {
      try {
        fn(current);
      } catch (err) {
        console.error(err);
      }
    });
  }

  /**
   * Primary connection method: WebSockets with automatic SSE & Polling failover
   */
  private connect() {
    if (typeof window === 'undefined' || !navigator.onLine) {
      this.updateStatus('offline', 'offline');
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    try {
      const isHttps = window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

      const socket = new WebSocket(wsUrl);
      this.ws = socket;

      socket.onopen = () => {
        this.isConnecting = false;
        this.retryCount = 0;
        this.lastSyncedAt = new Date();
        this.updateStatus('connected', 'websocket');
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'DATA_UPDATE' || msg.type === 'INIT') {
            if (msg.clientCount) {
              this.connectedClients = msg.clientCount;
            }
            if (msg.data) {
              this.handleIncomingData(msg.data, msg.version || Date.now(), 'websocket');
            }
          } else if (msg.type === 'PONG') {
            // Heartbeat confirmed
          }
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      socket.onclose = () => {
        this.ws = null;
        this.isConnecting = false;
        // If WebSocket closes, start SSE fallback and schedule reconnect
        this.fallbackToSse();
        this.scheduleReconnect();
      };

      socket.onerror = () => {
        // Will trigger onclose
      };
    } catch (err) {
      this.isConnecting = false;
      this.fallbackToSse();
      this.scheduleReconnect();
    }
  }

  /**
   * Fallback connection: Server-Sent Events (SSE)
   */
  private fallbackToSse() {
    if (this.sse && this.sse.readyState !== EventSource.CLOSED) {
      return;
    }

    try {
      const sse = new EventSource('/api/sync/stream');
      this.sse = sse;

      sse.onopen = () => {
        this.lastSyncedAt = new Date();
        this.updateStatus('connected', 'sse');
      };

      sse.addEventListener('data_update', (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.data) {
            this.handleIncomingData(parsed.data, parsed.version || Date.now(), 'sse');
          }
        } catch (err) {
          console.error(err);
        }
      });

      sse.addEventListener('init', (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.data) {
            this.handleIncomingData(parsed.data, parsed.version || Date.now(), 'sse');
          }
        } catch (err) {
          console.error(err);
        }
      });

      sse.onerror = () => {
        if (this.sse) {
          this.sse.close();
          this.sse = null;
        }
        this.updateStatus('connected', 'polling');
      };
    } catch {
      this.updateStatus('connected', 'polling');
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.retryCount++;
    // Exponential backoff capped at 8 seconds
    const delay = Math.min(1000 * Math.pow(1.5, this.retryCount), 8000);
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Lightweight version polling (only downloads a tiny 40-byte JSON)
   * Ensures that even if WebSockets or SSE are blocked by firewalls or mobile NATs,
   * Phone B will still detect Phone A's changes within 2.5 seconds!
   */
  private startVersionPolling() {
    if (this.versionPollInterval) clearInterval(this.versionPollInterval);

    this.versionPollInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        this.checkServerVersion();
      }
    }, 2800);
  }

  private async checkServerVersion() {
    try {
      const res = await fetch('/api/sync/version', { cache: 'no-store' });
      if (res.ok) {
        const info = await res.json();
        if (info.clients) {
          this.connectedClients = Math.max(1, info.clients);
        }
        if (info.version && info.version > this.currentVersion) {
          // New version detected from another device (Phone A)! Fetch immediately
          await this.forceSync();
        } else {
          this.lastSyncedAt = new Date();
          if (this.currentStatus !== 'connected') {
            this.updateStatus('connected', this.currentMode === 'offline' ? 'polling' : this.currentMode);
          }
        }
      }
    } catch {
      if (!navigator.onLine) {
        this.updateStatus('offline', 'offline');
      }
    }
  }

  /**
   * Handles incoming data from WebSocket, SSE, or Polling
   */
  private handleIncomingData(data: AppStateData, version: number, source: string) {
    if (version <= this.currentVersion && this.currentVersion !== 0) {
      return; // Already up-to-date
    }

    this.currentVersion = version;
    this.lastSyncedAt = new Date();

    // Sanitize logoUrl to prevent broken assets
    if (data.companySettings) {
      data.companySettings.logoUrl = sanitizeLogoUrl(data.companySettings.logoUrl);
    }

    // Persist to local cache so phone stays instant offline
    setLocalCache(data);

    // Notify all UI components
    this.dataListeners.forEach((listener) => {
      try {
        listener(data);
      } catch (e) {
        console.error('Error notifying data listener:', e);
      }
    });

    // Notify other tabs on the same device via BroadcastChannel
    if (source !== 'broadcast_channel' && this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'DATA_UPDATE',
          data,
          version
        });
      } catch (err) {
        // ignore
      }
    }

    this.updateStatus('connected', this.currentMode);
  }

  /**
   * Broadcast a local mutation from this device (Phone A) to other tabs immediately
   */
  public broadcastLocalChange(data: AppStateData) {
    this.currentVersion = Date.now();
    this.lastSyncedAt = new Date();
    setLocalCache(data);

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'DATA_UPDATE',
          data,
          version: this.currentVersion
        });
      } catch (err) {
        // ignore
      }
    }

    // If WebSocket is open, ask server to push to everyone right now
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: 'REQUEST_SYNC' }));
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * Forces an immediate full fetch from server
   */
  public async forceSync(): Promise<AppStateData | null> {
    this.updateStatus('syncing', this.currentMode);
    try {
      const data = await fetchAppData();
      if (data) {
        this.handleIncomingData(data, Date.now(), 'force_sync');
        return data;
      }
    } catch (err) {
      console.warn('Force sync failed:', err);
    } finally {
      this.updateStatus(navigator.onLine ? 'connected' : 'offline', this.currentMode);
    }
    return null;
  }
}

export const realtimeSync = new RealtimeSyncService();
