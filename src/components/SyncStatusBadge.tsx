import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Smartphone, 
  CheckCircle2, 
  Cloud, 
  X, 
  Zap,
  Info
} from 'lucide-react';
import { RealtimeStatus } from '../services/realtimeSync';

interface SyncStatusBadgeProps {
  status: RealtimeStatus;
  isSyncing: boolean;
  onForceSync: () => Promise<void>;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  status,
  isSyncing,
  onForceSync
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [manualSyncing, setManualSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(false);

  const handleManualSync = async () => {
    setManualSyncing(true);
    try {
      await onForceSync();
      setSyncFeedback(true);
      setTimeout(() => setSyncFeedback(false), 2000);
    } finally {
      setManualSyncing(false);
    }
  };

  const isConnected = status.status === 'connected' && navigator.onLine;
  const isOffline = status.status === 'offline' || !navigator.onLine;

  const modeLabel = status.mode === 'websocket' 
    ? 'WebSocket (Instantâneo 0ms)' 
    : status.mode === 'sse' 
    ? 'Stream Contínuo (Nuvem)' 
    : status.mode === 'polling' 
    ? 'Verificação Rápida' 
    : 'Local Offline';

  return (
    <>
      {/* 
        Compact, sleek, calm, non-jittering button!
        NO animate-pulse, NO text length toggles that shake the layout.
      */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title="Status da sincronização em tempo real entre celulares"
        className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 text-white text-[10px] font-bold transition-all shadow-xs select-none touch-manipulation cursor-pointer shrink-0"
      >
        {/* Solid calm status indicator dot */}
        <span className="relative flex h-1.5 w-1.5 items-center justify-center shrink-0">
          {isConnected && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          )}
          <span 
            className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
              isOffline
                ? 'bg-rose-500'
                : isSyncing || manualSyncing
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`} 
          />
        </span>

        {/* Stable text that never resizes or causes layout shifts */}
        <span className="tracking-tight text-[10px] font-bold text-slate-200 whitespace-nowrap">
          {isOffline ? 'Offline' : 'Tempo Real'}
        </span>

        {/* Subtle icon */}
        {isSyncing || manualSyncing ? (
          <RefreshCw className="w-2.5 h-2.5 text-amber-400 animate-spin shrink-0" />
        ) : isOffline ? (
          <WifiOff className="w-2.5 h-2.5 text-rose-400 shrink-0" />
        ) : (
          <Zap className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
        )}
      </button>

      {/* Informative Modal showing multi-device synchronization details */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                  isOffline ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {isOffline ? <WifiOff className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                    Sincronização de Aparelhos
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Multi-dispositivos Kadu Manutenções
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation box: Celular A <-> Celular B */}
            <div className="mt-4 p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs text-blue-900 leading-relaxed">
                <span className="font-bold block text-blue-950 mb-0.5">Sincronia Automática:</span>
                Quando o <strong>Celular A</strong> cria ou altera um relatório, máquina ou cliente, o <strong>Celular B</strong> atualiza instantaneamente na tela sem precisar recarregar.
              </div>
            </div>

            {/* Details list */}
            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-slate-500 font-medium">Estado da Conexão:</span>
                <span className={`font-bold flex items-center gap-1.5 ${
                  isOffline ? 'text-rose-600' : 'text-emerald-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                  {isOffline ? 'Sem internet (Offline)' : 'Conectado em Tempo Real'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-slate-500 font-medium">Canal de Transmissão:</span>
                <span className="font-bold text-slate-800 text-[11px]">
                  {modeLabel}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-slate-500 font-medium">Aparelhos Ativos:</span>
                <span className="font-bold text-slate-800">
                  {status.connectedClients} {status.connectedClients === 1 ? 'dispositivo' : 'dispositivos'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-slate-500 font-medium">Última Sincronização:</span>
                <span className="font-bold text-slate-800">
                  {status.lastSyncedAt ? status.lastSyncedAt.toLocaleTimeString('pt-BR') : 'Agora'}
                </span>
              </div>
            </div>

            {/* Manual Sync Button */}
            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={manualSyncing || isOffline}
                className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${manualSyncing ? 'animate-spin' : ''}`} />
                {manualSyncing ? 'Sincronizando agora...' : 'Forçar Sincronização Agora'}
              </button>

              {syncFeedback && (
                <div className="text-center text-[11px] font-bold text-emerald-600 flex items-center justify-center gap-1.5 py-1 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Todos os dados atualizados com sucesso!
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full mt-2 py-2 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
