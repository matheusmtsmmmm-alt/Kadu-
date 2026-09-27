import { AppStateData, MaintenanceReport, Machine, Client, Technician, CompanySettings } from '../types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const CACHE_KEY = 'kadu_manutencoes_local_cache_v1';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(url?: string, key?: string): SupabaseClient | null {
  if (url && key) {
    if (!supabaseInstance) {
      try {
        supabaseInstance = createClient(url, key);
      } catch (err) {
        console.error('Failed to init Supabase client:', err);
      }
    }
    return supabaseInstance;
  }
  return null;
}

export async function fetchAppData(): Promise<AppStateData> {
  try {
    const res = await fetch('/api/data', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data: AppStateData = await res.json();
    
    // Save backup to local cache
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
      // ignore quota errors
    }
    return data;
  } catch (err) {
    console.warn('API fetch failed, attempting cached fallback:', err);
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
    throw err;
  }
}

export async function saveReport(report: Partial<MaintenanceReport>): Promise<{ success: boolean; report: MaintenanceReport }> {
  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to save report to server:', err);
    throw err;
  }
}

export async function deleteReport(id: string): Promise<{ success: boolean; id: string }> {
  const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function saveMachine(machine: Partial<Machine>): Promise<{ success: boolean; machine: Machine }> {
  const res = await fetch('/api/machines', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(machine)
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function deleteMachine(id: string): Promise<{ success: boolean; id: string }> {
  const res = await fetch(`/api/machines/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function saveClient(client: Partial<Client>): Promise<{ success: boolean; client: Client }> {
  const res = await fetch('/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(client)
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function deleteClient(id: string): Promise<{ success: boolean; id: string }> {
  const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function saveSettings(settings: {
  companySettings?: Partial<CompanySettings>;
  technicians?: Technician[];
  assistants?: string[];
  checklistTemplate?: Array<{ id: string; label: string }>;
}): Promise<{ success: boolean; data: AppStateData }> {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function uploadPhotoFile(base64: string): Promise<string> {
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64 })
    });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.url;
  } catch (err) {
    console.warn('Backend upload failed, keeping base64 for self-contained portability:', err);
    return base64;
  }
}
