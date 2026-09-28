import { AppStateData, MaintenanceReport, Machine, Client, Technician, CompanySettings } from '../types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const CACHE_KEY = 'kadu_manutencoes_local_cache_v2';

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

// Local cache helper functions
export function getLocalCache(): AppStateData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse local cache:', err);
    return null;
  }
}

export function saveToLocalCache(data: AppStateData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save to local cache (quota or private mode):', err);
  }
}

function updateLocalCache(updater: (current: AppStateData) => AppStateData): void {
  const current = getLocalCache();
  if (current) {
    const next = updater(current);
    saveToLocalCache(next);
  }
}

export async function fetchAppData(): Promise<AppStateData> {
  const localData = getLocalCache();

  try {
    const res = await fetch('/api/data', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const serverData: AppStateData = await res.json();

    // If we have local data, merge carefully so client modifications are never wiped by a fresh server state
    if (localData) {
      const mergedReports = [...serverData.reports];
      // Keep any reports that exist in localData but might be missing on server
      for (const locRep of localData.reports) {
        const sIndex = mergedReports.findIndex(r => r.id === locRep.id);
        if (sIndex < 0) {
          mergedReports.unshift(locRep);
        } else {
          // If local report was updated more recently, keep local
          const locTime = new Date(locRep.updatedAt || locRep.createdAt || 0).getTime();
          const srvTime = new Date(mergedReports[sIndex].updatedAt || mergedReports[sIndex].createdAt || 0).getTime();
          if (locTime > srvTime) {
            mergedReports[sIndex] = locRep;
          }
        }
      }

      // Merge machines
      const mergedMachines = [...serverData.machines];
      for (const locMach of localData.machines) {
        if (!mergedMachines.some(m => m.id === locMach.id)) {
          mergedMachines.unshift(locMach);
        }
      }

      // Merge clients
      const mergedClients = [...serverData.clients];
      for (const locCli of localData.clients) {
        if (!mergedClients.some(c => c.id === locCli.id)) {
          mergedClients.unshift(locCli);
        }
      }

      const mergedData: AppStateData = {
        ...serverData,
        reports: mergedReports,
        machines: mergedMachines,
        clients: mergedClients,
        companySettings: {
          ...serverData.companySettings,
          ...(localData.companySettings || {})
        }
      };

      saveToLocalCache(mergedData);
      return mergedData;
    }

    // No local data yet, store server data
    saveToLocalCache(serverData);
    return serverData;
  } catch (err) {
    console.warn('API fetch failed, using local offline cache:', err);
    if (localData) {
      return localData;
    }
    throw err;
  }
}

export async function saveReport(report: Partial<MaintenanceReport>): Promise<{ success: boolean; report: MaintenanceReport }> {
  // Ensure ID and timestamps
  const finalReport: MaintenanceReport = {
    id: report.id || `rel_${Date.now()}`,
    code: report.code || `#${Date.now().toString().slice(-4)}`,
    date: report.date || new Date().toISOString().split('T')[0],
    status: report.status || 'Finalizado',
    client: report.client || { id: 'cli_0', name: 'Cliente' },
    machine: report.machine || { id: 'maq_0', name: 'Máquina', model: '' },
    technician: report.technician || { id: 'tec_0', name: 'Técnico' },
    assistants: report.assistants || [],
    times: report.times || {
      date: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '12:00'
    },
    maintenanceType: report.maintenanceType || 'Preventiva',
    equipmentStatus: report.equipmentStatus || 'Operacional',
    description: report.description || '',
    partsReplaced: report.partsReplaced || '',
    checklist: report.checklist || [],
    photosBefore: report.photosBefore || [],
    photosAfter: report.photosAfter || [],
    observations: report.observations || '',
    futureRecommendations: report.futureRecommendations || '',
    signatures: report.signatures || {
      technician: { name: '', signatureImage: '', date: '' },
      clientResponsible: { name: '', signatureImage: '', date: '' }
    },
    createdAt: report.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 1. Immediately persist to localStorage
  updateLocalCache(current => {
    const existingIdx = current.reports.findIndex(r => r.id === finalReport.id);
    const newReports = [...current.reports];
    if (existingIdx >= 0) {
      newReports[existingIdx] = finalReport;
    } else {
      newReports.unshift(finalReport);
    }
    return { ...current, reports: newReports };
  });

  // 2. Persist to server
  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalReport)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.report) {
        updateLocalCache(curr => ({
          ...curr,
          reports: curr.reports.map(r => r.id === data.report.id ? data.report : r)
        }));
        return data;
      }
    }
  } catch (err) {
    console.warn('Server save report failed, saved locally in browser:', err);
  }

  return { success: true, report: finalReport };
}

export async function deleteReport(id: string): Promise<{ success: boolean; id: string }> {
  // 1. Immediately delete from localStorage
  updateLocalCache(current => ({
    ...current,
    reports: current.reports.filter(r => r.id !== id)
  }));

  // 2. Delete on server
  try {
    const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Server delete report failed, deleted locally:', err);
  }

  return { success: true, id };
}

export async function saveMachine(machine: Partial<Machine>): Promise<{ success: boolean; machine: Machine }> {
  const finalMachine: Machine = {
    id: machine.id || `maq_${Date.now()}`,
    name: machine.name || 'Nova Máquina',
    model: machine.model || '',
    tonnage: machine.tonnage || '',
    pavilhao: machine.pavilhao || 'P1',
    serialNumber: machine.serialNumber || '',
    tag: machine.tag || '',
    clientName: machine.clientName || '',
    horometer: machine.horometer || '',
    location: machine.location || '',
    manufacturer: machine.manufacturer || ''
  };

  // 1. Immediately persist to localStorage
  updateLocalCache(current => {
    const idx = current.machines.findIndex(m => m.id === finalMachine.id);
    const newMachines = [...current.machines];
    if (idx >= 0) {
      newMachines[idx] = finalMachine;
    } else {
      newMachines.unshift(finalMachine);
    }
    return { ...current, machines: newMachines };
  });

  // 2. Persist to server
  try {
    const res = await fetch('/api/machines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalMachine)
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Server save machine failed, saved locally:', err);
  }

  return { success: true, machine: finalMachine };
}

export async function deleteMachine(id: string): Promise<{ success: boolean; id: string }> {
  // 1. Delete from localStorage
  updateLocalCache(current => ({
    ...current,
    machines: current.machines.filter(m => m.id !== id)
  }));

  // 2. Delete on server
  try {
    const res = await fetch(`/api/machines/${id}`, { method: 'DELETE' });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Server delete machine failed, deleted locally:', err);
  }

  return { success: true, id };
}

export async function saveClient(client: Partial<Client>): Promise<{ success: boolean; client: Client }> {
  const finalClient: Client = {
    id: client.id || `cli_${Date.now()}`,
    name: client.name || 'Novo Cliente',
    document: client.document || '',
    phone: client.phone || '',
    address: client.address || '',
    contactPerson: client.contactPerson || ''
  };

  // 1. Persist to localStorage
  updateLocalCache(current => {
    const idx = current.clients.findIndex(c => c.id === finalClient.id);
    const newClients = [...current.clients];
    if (idx >= 0) {
      newClients[idx] = finalClient;
    } else {
      newClients.unshift(finalClient);
    }
    return { ...current, clients: newClients };
  });

  // 2. Persist to server
  try {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalClient)
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Server save client failed, saved locally:', err);
  }

  return { success: true, client: finalClient };
}

export async function deleteClient(id: string): Promise<{ success: boolean; id: string }> {
  // 1. Delete from localStorage
  updateLocalCache(current => ({
    ...current,
    clients: current.clients.filter(c => c.id !== id)
  }));

  // 2. Delete on server
  try {
    const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Server delete client failed, deleted locally:', err);
  }

  return { success: true, id };
}

export async function saveSettings(settings: {
  companySettings?: Partial<CompanySettings>;
  technicians?: Technician[];
  assistants?: string[];
  checklistTemplate?: Array<{ id: string; label: string; category?: string }>;
}): Promise<{ success: boolean; data: any }> {
  // 1. Immediately persist to localStorage
  updateLocalCache(current => {
    return {
      ...current,
      companySettings: settings.companySettings
        ? { ...current.companySettings, ...settings.companySettings }
        : current.companySettings,
      technicians: settings.technicians || current.technicians,
      assistants: settings.assistants || current.assistants,
      checklistTemplate: settings.checklistTemplate || current.checklistTemplate
    };
  });

  // 2. Persist to server
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Server save settings failed, saved locally in browser:', err);
  }

  return { success: true, data: getLocalCache() };
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
