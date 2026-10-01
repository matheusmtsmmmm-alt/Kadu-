export interface Client {
  id: string;
  name: string;
  document?: string; // CNPJ / CPF
  phone?: string;
  address?: string;
  contactPerson?: string;
}

export interface Machine {
  id: string;
  name: string;
  model: string;
  tonnage?: string;
  pavilhao?: 'P1' | 'P2' | string;
  serialNumber?: string;
  tag?: string;
  clientName?: string;
  horometer?: string;
  location?: string;
  manufacturer?: string;
}

export interface Technician {
  id: string;
  name: string;
  phone?: string;
  role?: string;
}

export type ChecklistStatus = 'conforme' | 'nao_conforme' | 'nao_aplica';

export interface ChecklistItem {
  id: string;
  label: string;
  status: ChecklistStatus;
  notes?: string;
  category?: string;
}

export interface ReportPhoto {
  id: string;
  url: string; // base64 or server/storage URL
  caption?: string;
  timestamp?: string;
}

export interface SignatureData {
  name: string;
  document?: string;
  signatureImage: string; // data:image/png;base64,...
  date: string;
}

export type MaintenanceType = 'Preventiva' | 'Corretiva' | 'Preditiva' | 'Instalação' | 'Emergencial';
export type EquipmentStatus = 'Operacional' | 'Parcial' | 'Inoperante';
export type ReportStatus = 'Finalizado' | 'Em andamento';

export interface MaintenanceReport {
  id: string;
  code: string; // e.g. #0038
  date: string; // YYYY-MM-DD
  status: ReportStatus;
  
  // Step 1: Cliente e Máquina
  client: Client;
  machine: Machine;

  // Step 2: Técnico e Auxiliares
  technician: Technician;
  assistants: string[];
  times: {
    date: string;
    startTime: string;
    endTime: string;
  };

  // Step 3: Descrição da Manutenção
  maintenanceType: MaintenanceType;
  equipmentStatus: EquipmentStatus;
  description: string;
  partsReplaced?: string;

  // Step 4: Checklist
  checklist: ChecklistItem[];

  // Step 5: Fotos
  photosBefore: ReportPhoto[];
  photosAfter: ReportPhoto[];

  // Step 6: Observações e Assinaturas
  observations?: string;
  futureRecommendations?: string;
  signatures: {
    technician: SignatureData;
    clientResponsible: SignatureData;
  };

  createdAt: string;
  updatedAt: string;
}

export interface CompanySettings {
  companyName: string;
  tradeName: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  defaultWhatsappMessage: string;
  defaultEmailMessage: string;
  adminPin?: string;
}

export interface AppStateData {
  reports: MaintenanceReport[];
  machines: Machine[];
  clients: Client[];
  technicians: Technician[];
  assistants: string[];
  checklistTemplate: Array<{ id: string; label: string; category?: string }>;
  companySettings: CompanySettings;
  version?: number;
  lastModified?: string;
}
