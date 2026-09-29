import { AppStateData, MaintenanceReport, Machine, Client, Technician, CompanySettings } from '../types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { INITIAL_APP_DATA } from '../data/initialData';
import { DEFAULT_LOGO_BASE64 } from '../data/defaultLogo';

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

// Ensure logoUrl is always valid and never breaks on custom domain or Vercel
export function sanitizeLogoUrl(logoUrl?: string): string {
  if (!logoUrl) return DEFAULT_LOGO_BASE64;
  // If it points to broken Vite /src/ path or missing asset, recover with embedded base64
  if (
    logoUrl.startsWith('/src/assets') || 
    (logoUrl.includes('kadu_logo_1790525097159.jpg') && !logoUrl.startsWith('data:')) ||
    logoUrl.startsWith('/uploads/')
  ) {
    return DEFAULT_LOGO_BASE64;
  }
  return logoUrl;
}

// Local cache helper functions
export function getLocalCache(): AppStateData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: AppStateData = JSON.parse(raw);
    
    // Safety check: ensure machines array is populated with default machines if empty
    if (parsed && Array.isArray(parsed.machines)) {
      for (const m of INITIAL_APP_DATA.machines) {
        if (!parsed.machines.some(existing => existing.id === m.id || existing.name === m.name)) {
          parsed.machines.push(m);
        }
      }
    }

    // Auto-heal logoUrl in cached companySettings so custom domain never has missing logo
    if (parsed && parsed.companySettings) {
      parsed.companySettings.logoUrl = sanitizeLogoUrl(parsed.companySettings.logoUrl);
    }

    return parsed;
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
  const current = getLocalCache() || INITIAL_APP_DATA;
  const next = updater(current);
  saveToLocalCache(next);
}

export async function fetchAppData(): Promise<AppStateData> {
  const localData = getLocalCache();

  try {
    const res = await fetch('/api/data', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const serverData: AppStateData = await res.json();

    // Baseline initialized with all default machines and entities
    const baseMachines = [...(serverData.machines?.length ? serverData.machines : INITIAL_APP_DATA.machines)];
    for (const m of INITIAL_APP_DATA.machines) {
      if (!baseMachines.some(existing => existing.id === m.id || existing.name === m.name)) {
        baseMachines.push(m);
      }
    }

    const baseClients = [...(serverData.clients?.length ? serverData.clients : INITIAL_APP_DATA.clients)];
    for (const c of INITIAL_APP_DATA.clients) {
      if (!baseClients.some(existing => existing.id === c.id || existing.name === c.name)) {
        baseClients.push(c);
      }
    }

    const baseTechnicians = serverData.technicians?.length ? serverData.technicians : INITIAL_APP_DATA.technicians;
    const baseAssistants = serverData.assistants?.length ? serverData.assistants : INITIAL_APP_DATA.assistants;
    const baseReports = serverData.reports?.length ? serverData.reports : INITIAL_APP_DATA.reports;

    let mergedData: AppStateData = {
      reports: [...baseReports],
      machines: [...baseMachines],
      clients: [...baseClients],
      technicians: [...baseTechnicians],
      assistants: [...baseAssistants],
      checklistTemplate: serverData.checklistTemplate || INITIAL_APP_DATA.checklistTemplate,
      companySettings: {
        ...INITIAL_APP_DATA.companySettings,
        ...(serverData.companySettings || {})
      }
    };

    // If client has local modifications, merge on top
    if (localData) {
      for (const locRep of localData.reports || []) {
        const sIndex = mergedData.reports.findIndex(r => r.id === locRep.id);
        if (sIndex < 0) {
          mergedData.reports.unshift(locRep);
        } else {
          const locTime = new Date(locRep.updatedAt || locRep.createdAt || 0).getTime();
          const srvTime = new Date(mergedData.reports[sIndex].updatedAt || mergedData.reports[sIndex].createdAt || 0).getTime();
          if (locTime > srvTime) {
            mergedData.reports[sIndex] = locRep;
          }
        }
      }

      for (const locMach of localData.machines || []) {
        if (!mergedData.machines.some(m => m.id === locMach.id)) {
          mergedData.machines.unshift(locMach);
        }
      }

      for (const locCli of localData.clients || []) {
        if (!mergedData.clients.some(c => c.id === locCli.id)) {
          mergedData.clients.unshift(locCli);
        }
      }

      if (localData.companySettings) {
        mergedData.companySettings = {
          ...mergedData.companySettings,
          ...localData.companySettings
        };
      }
    }

    if (mergedData.companySettings) {
      mergedData.companySettings.logoUrl = sanitizeLogoUrl(mergedData.companySettings.logoUrl);
    }

    saveToLocalCache(mergedData);
    return mergedData;
  } catch (err) {
    console.warn('Backend API offline or running in static Vercel mode. Using embedded data + cache:', err);
    
    // Foolproof fallback: always return all default data merged with whatever is in cache
    let fallback = localData;
    if (!fallback) {
      fallback = INITIAL_APP_DATA;
    } else {
      // Ensure all 26 machines exist in fallback
      for (const m of INITIAL_APP_DATA.machines) {
        if (!fallback.machines.some(existing => existing.id === m.id || existing.name === m.name)) {
          fallback.machines.push(m);
        }
      }
    }

    if (fallback.companySettings) {
      fallback.companySettings.logoUrl = sanitizeLogoUrl(fallback.companySettings.logoUrl);
    }

    saveToLocalCache(fallback);
    return fallback;
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
    if (res.ok) {
      const data = await res.json();
      if (data.url && !data.url.startsWith('/uploads/')) {
        return data.url;
      }
    }
  } catch (err) {
    // ignore
  }
  return base64;
}

export function exportDataToJson(): string {
  const current = getLocalCache() || INITIAL_APP_DATA;
  return JSON.stringify(current, null, 2);
}

export async function importDataFromJson(jsonStr: string): Promise<AppStateData> {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Formato JSON inválido.');
    }
    const cleanData: AppStateData = {
      reports: Array.isArray(parsed.reports) ? parsed.reports : INITIAL_APP_DATA.reports,
      machines: Array.isArray(parsed.machines) && parsed.machines.length > 0 ? parsed.machines : INITIAL_APP_DATA.machines,
      clients: Array.isArray(parsed.clients) && parsed.clients.length > 0 ? parsed.clients : INITIAL_APP_DATA.clients,
      technicians: Array.isArray(parsed.technicians) && parsed.technicians.length > 0 ? parsed.technicians : INITIAL_APP_DATA.technicians,
      assistants: Array.isArray(parsed.assistants) ? parsed.assistants : INITIAL_APP_DATA.assistants,
      checklistTemplate: Array.isArray(parsed.checklistTemplate) ? parsed.checklistTemplate : INITIAL_APP_DATA.checklistTemplate,
      companySettings: parsed.companySettings || INITIAL_APP_DATA.companySettings
    };
    saveToLocalCache(cleanData);
    
    // Also try saving to server if connected
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData)
      });
    } catch (e) {
      // server offline
    }
    
    return cleanData;
  } catch (err: any) {
    throw new Error(`Erro ao importar dados: ${err.message}`);
  }
}

