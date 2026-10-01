import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  onSnapshot, 
  getDocFromServer,
  Firestore
} from 'firebase/firestore';
import { AppStateData, MaintenanceReport, Machine, Client, Technician, CompanySettings } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App & Firestore
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const isFirebaseConfigured = Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Error: ', JSON.stringify(errInfo));
}

// Initial connection test
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const testDoc = doc(db, 'settings', 'company');
    await getDocFromServer(testDoc);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'settings/company');
    return false;
  }
}

/**
 * Subscribe to all Firestore collections in real-time.
 * Synchronizes instantly across all mobile phones on any domain or Vercel.
 */
export function subscribeToFirestore(
  onDataChange: (data: Partial<AppStateData>) => void,
  onStatusChange?: (status: 'connected' | 'syncing' | 'offline') => void
): () => void {
  let isReportsLoaded = false;
  let isMachinesLoaded = false;
  let isClientsLoaded = false;
  let isTechsLoaded = false;
  let isSettingsLoaded = false;

  const currentData: {
    reports: MaintenanceReport[];
    machines: Machine[];
    clients: Client[];
    technicians: Technician[];
    assistants: string[];
    checklistTemplate: any[];
    companySettings?: CompanySettings;
  } = {
    reports: [],
    machines: [],
    clients: [],
    technicians: [],
    assistants: [],
    checklistTemplate: []
  };

  const notify = () => {
    if (onStatusChange) onStatusChange('connected');
    onDataChange({
      reports: currentData.reports,
      machines: currentData.machines,
      clients: currentData.clients,
      technicians: currentData.technicians,
      assistants: currentData.assistants,
      checklistTemplate: currentData.checklistTemplate,
      companySettings: currentData.companySettings
    });
  };

  // 1. Reports listener
  const unsubReports = onSnapshot(collection(db, 'reports'), (snapshot) => {
    const reports: MaintenanceReport[] = [];
    snapshot.forEach(docSnap => {
      reports.push(docSnap.data() as MaintenanceReport);
    });
    // Sort latest first
    reports.sort((a, b) => {
      const tA = new Date(a.date || a.createdAt || 0).getTime();
      const tB = new Date(b.date || b.createdAt || 0).getTime();
      return tB - tA;
    });
    currentData.reports = reports;
    isReportsLoaded = true;
    notify();
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'reports');
  });

  // 2. Machines listener
  const unsubMachines = onSnapshot(collection(db, 'machines'), (snapshot) => {
    const machines: Machine[] = [];
    snapshot.forEach(docSnap => {
      const m = docSnap.data() as Machine;
      // Filter out any compressor or maq_3
      if (m.id !== 'maq_3' && m.tag !== 'MQ-03' && !m.name?.includes('Compressor')) {
        machines.push(m);
      }
    });
    currentData.machines = machines;
    isMachinesLoaded = true;
    notify();
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'machines');
  });

  // 3. Clients listener
  const unsubClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
    const clients: Client[] = [];
    snapshot.forEach(docSnap => {
      clients.push(docSnap.data() as Client);
    });
    currentData.clients = clients;
    isClientsLoaded = true;
    notify();
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'clients');
  });

  // 4. Technicians listener
  const unsubTechs = onSnapshot(collection(db, 'technicians'), (snapshot) => {
    const techs: Technician[] = [];
    snapshot.forEach(docSnap => {
      techs.push(docSnap.data() as Technician);
    });
    currentData.technicians = techs;
    isTechsLoaded = true;
    notify();
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'technicians');
  });

  // 5. Settings document listener
  const unsubSettings = onSnapshot(doc(db, 'settings', 'company'), (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.companySettings) {
        currentData.companySettings = data.companySettings;
      }
      if (Array.isArray(data.checklistTemplate)) {
        currentData.checklistTemplate = data.checklistTemplate;
      }
      if (Array.isArray(data.assistants)) {
        currentData.assistants = data.assistants;
      }
    }
    isSettingsLoaded = true;
    notify();
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'settings/company');
  });

  return () => {
    unsubReports();
    unsubMachines();
    unsubClients();
    unsubTechs();
    unsubSettings();
  };
}

// -------------------------------------------------------------
// Direct Firestore Mutations (Real-time Broadcast to all Devices)
// -------------------------------------------------------------

export async function saveReportToFirestore(report: MaintenanceReport): Promise<void> {
  const path = `reports/${report.id}`;
  try {
    await setDoc(doc(db, 'reports', report.id), report);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function deleteReportFromFirestore(reportId: string): Promise<void> {
  const path = `reports/${reportId}`;
  try {
    await deleteDoc(doc(db, 'reports', reportId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

export async function saveMachineToFirestore(machine: Machine): Promise<void> {
  const path = `machines/${machine.id}`;
  try {
    await setDoc(doc(db, 'machines', machine.id), machine);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function deleteMachineFromFirestore(machineId: string): Promise<void> {
  const path = `machines/${machineId}`;
  try {
    await deleteDoc(doc(db, 'machines', machineId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

export async function saveClientToFirestore(client: Client): Promise<void> {
  const path = `clients/${client.id}`;
  try {
    await setDoc(doc(db, 'clients', client.id), client);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function deleteClientFromFirestore(clientId: string): Promise<void> {
  const path = `clients/${clientId}`;
  try {
    await deleteDoc(doc(db, 'clients', clientId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

export async function saveSettingsToFirestore(payload: {
  companySettings?: CompanySettings;
  checklistTemplate?: any[];
  assistants?: string[];
}): Promise<void> {
  const path = 'settings/company';
  try {
    await setDoc(doc(db, 'settings', 'company'), {
      ...payload,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}
