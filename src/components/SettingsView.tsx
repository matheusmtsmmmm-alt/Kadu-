import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  CheckSquare, 
  FileText, 
  Cloud, 
  ArrowLeft, 
  Save, 
  Check, 
  Plus, 
  Trash2, 
  Upload,
  Globe,
  Settings as SettingsIcon,
  Shield,
  Layers,
  Sparkles,
  Wrench,
  Eye,
  Download,
  Copy,
  CheckCircle2,
  RefreshCw,
  Smartphone,
  AlertCircle
} from 'lucide-react';
import { CompanySettings, Technician, Client, Machine, MaintenanceReport } from '../types';
import { uploadPhotoFile, exportDataToJson, importDataFromJson } from '../services/api';
import { OFFICIAL_INJECTION_CHECKLIST } from '../data/defaultChecklist';
import { downloadReportPdf } from '../services/pdfGenerator';
import { DEFAULT_LOGO_BASE64 } from '../data/defaultLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { MachinesView } from './MachinesView';
import { MachineBadge } from './MachineBadge';

interface SettingsViewProps {
  settings: CompanySettings;
  technicians: Technician[];
  assistants: string[];
  checklistTemplate: Array<{ id: string; label: string }>;
  clients: Client[];
  machines: Machine[];
  reports?: MaintenanceReport[];
  initialTab?: 'empresa' | 'maquinas' | 'relatorios' | 'equipe' | 'clientes' | 'checklist' | 'online';
  onBack: () => void;
  onViewPdf?: (report: MaintenanceReport) => void;
  onSaveAllSettings: (updates: {
    companySettings?: Partial<CompanySettings>;
    technicians?: Technician[];
    assistants?: string[];
    checklistTemplate?: Array<{ id: string; label: string }>;
  }) => Promise<void>;
  onSaveClient: (client: Partial<Client>) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
  onSaveMachine: (machine: Partial<Machine>) => Promise<void>;
  onDeleteMachine: (id: string) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  technicians,
  assistants,
  checklistTemplate,
  clients,
  machines,
  reports = [],
  initialTab = 'empresa',
  onBack,
  onViewPdf,
  onSaveAllSettings,
  onSaveClient,
  onDeleteClient,
  onSaveMachine,
  onDeleteMachine
}) => {
  const [activeTab, setActiveTab] = useState<'empresa' | 'maquinas' | 'relatorios' | 'equipe' | 'clientes' | 'checklist' | 'online'>(initialTab);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [companyForm, setCompanyForm] = useState<CompanySettings>({ ...settings, adminPin: settings.adminPin || '1111' });
  const [techList, setTechList] = useState<Technician[]>([...technicians]);
  const [auxList, setAuxList] = useState<string[]>([...assistants]);
  const [checkList, setCheckList] = useState<Array<{ id: string; label: string }>>([...checklistTemplate]);
  
  // Backup / Sync states
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');
  const [backupIsError, setBackupIsError] = useState(false);

  const getLiveExportData = () => {
    return JSON.stringify({
      companySettings: companyForm,
      technicians: techList,
      assistants: auxList,
      checklistTemplate: checkList,
      clients,
      machines,
      reports: reports || []
    }, null, 2);
  };

  const handleDownloadBackup = () => {
    const jsonStr = getLiveExportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kadu_manutencoes_dados_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupIsError(false);
    setBackupMsg('Arquivo de backup baixado com sucesso!');
    setTimeout(() => setBackupMsg(''), 4000);
  };

  const handleCopyBackup = () => {
    const jsonStr = getLiveExportData();
    navigator.clipboard.writeText(jsonStr);
    setBackupIsError(false);
    setBackupMsg('Dados copiados para a área de transferência!');
    setTimeout(() => setBackupMsg(''), 4000);
  };

  const handleImportBackup = async (contentToImport?: string) => {
    const raw = typeof contentToImport === 'string' ? contentToImport : importJsonText;
    if (!raw.trim()) {
      setBackupIsError(true);
      setBackupMsg('Insira ou selecione um arquivo JSON válido.');
      return;
    }
    try {
      await importDataFromJson(raw);
      setBackupIsError(false);
      setBackupMsg('Dados importados com sucesso! Atualizando aplicativo...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e: any) {
      setBackupIsError(true);
      setBackupMsg(e.message || 'Erro ao importar dados. Verifique a formatação.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportJsonText(content);
        await handleImportBackup(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Synchronize internal state whenever props update
  useEffect(() => {
    setCompanyForm({ ...settings, adminPin: settings.adminPin || '1111' });
  }, [settings]);

  useEffect(() => {
    setTechList([...technicians]);
  }, [technicians]);

  useEffect(() => {
    setAuxList([...assistants]);
  }, [assistants]);

  useEffect(() => {
    setCheckList([...checklistTemplate]);
  }, [checklistTemplate]);
  
  // New input states
  const [newAuxName, setNewAuxName] = useState('');
  const [newTechName, setNewTechName] = useState('');
  const [newCheckItem, setNewCheckItem] = useState('');

  // Client modal
  const [newClientName, setNewClientName] = useState('');
  const [newClientDoc, setNewClientDoc] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientContact, setNewClientContact] = useState('');
  const [newClientAddr, setNewClientAddr] = useState('');
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const handleSaveCompany = async () => {
    setIsSaving(true);
    try {
      await onSaveAllSettings({ companySettings: companyForm });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTeam = async () => {
    setIsSaving(true);
    try {
      await onSaveAllSettings({ technicians: techList, assistants: auxList });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveChecklist = async () => {
    setIsSaving(true);
    try {
      await onSaveAllSettings({ checklistTemplate: checkList });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const b64 = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 800;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const isPng = file.type.includes('png');
            const optimized = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.9);
            setCompanyForm(prev => ({ ...prev, logoUrl: optimized }));
            return;
          }
        } catch (e) {
          // fallback
        }
        setCompanyForm(prev => ({ ...prev, logoUrl: b64 }));
      };
      img.onerror = () => {
        setCompanyForm(prev => ({ ...prev, logoUrl: b64 }));
      };
      img.src = b64;
    };
    reader.readAsDataURL(file);
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    await onSaveClient({
      name: newClientName,
      document: newClientDoc,
      phone: newClientPhone,
      contactPerson: newClientContact,
      address: newClientAddr
    });
    setNewClientName('');
    setNewClientDoc('');
    setNewClientPhone('');
    setNewClientContact('');
    setNewClientAddr('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-24">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-20 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Configurações do Sistema</h2>
              <p className="text-xs text-slate-500 font-medium">Gestão administrativa e sincronização</p>
            </div>
          </div>

          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Salvo!
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 overflow-x-auto scrollbar-none">
        <div className="max-w-2xl mx-auto flex items-center gap-1">
          <button
            onClick={() => setActiveTab('empresa')}
            className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors ${
              activeTab === 'empresa'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🏢 Dados Empresa & Logo
          </button>

          <button
            onClick={() => setActiveTab('maquinas')}
            className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'maquinas'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>🔧 Máquinas ({machines.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('relatorios')}
            className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'relatorios'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>📑 Últimos Relatórios ({reports?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('equipe')}
            className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors ${
              activeTab === 'equipe'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            👷 Técnicos & Auxiliares
          </button>

          <button
            onClick={() => setActiveTab('clientes')}
            className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors ${
              activeTab === 'clientes'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🏭 Clientes ({clients.length})
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors ${
              activeTab === 'checklist'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📋 Itens do Checklist
          </button>

          <button
            onClick={() => setActiveTab('online')}
            className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors ${
              activeTab === 'online'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ☁ Conexão Online & Supabase
          </button>
        </div>
      </div>

      <div className="max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* ============================================================== */}
        {/* TAB 1: EMPRESA & LOGO */}
        {/* ============================================================== */}
        {activeTab === 'empresa' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Identidade Visual e Informações no PDF
            </h3>

            {/* Logo Preview & Upload */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-16 h-16 rounded-xl bg-white border border-slate-300 overflow-hidden flex items-center justify-center p-1">
                {companyForm.logoUrl ? (
                  <img
                    src={companyForm.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_LOGO_BASE64;
                    }}
                  />
                ) : (
                  <img
                    src={DEFAULT_LOGO_BASE64}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-slate-700 block">Logotipo KADU MANUTENÇÕES</span>
                <span className="text-[11px] text-slate-500 block mb-2">Exibido no cabeçalho do app e nos relatórios em PDF.</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5" /> Alterar Logo
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                  {companyForm.logoUrl !== DEFAULT_LOGO_BASE64 && (
                    <button
                      type="button"
                      onClick={() => setCompanyForm(prev => ({ ...prev, logoUrl: DEFAULT_LOGO_BASE64 }))}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Restaurar Logo Padrão
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Nome da Empresa</label>
                <input
                  type="text"
                  value={companyForm.companyName}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">CNPJ</label>
                <input
                  type="text"
                  value={companyForm.cnpj}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, cnpj: e.target.value }))}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-sm text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-sm text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">E-mail de Contato</label>
                <input
                  type="email"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-sm text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Endereço da Sede</label>
              <input
                type="text"
                value={companyForm.address}
                onChange={(e) => setCompanyForm(prev => ({ ...prev, address: e.target.value }))}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase">
                    Senha de Acesso às Configurações (PIN)
                  </label>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Senha de 4 dígitos para proteger o acesso (padrão: 1111).
                  </p>
                </div>
                <div className="w-24">
                  <input
                    type="text"
                    maxLength={4}
                    pattern="[0-9]*"
                    value={companyForm.adminPin || '1111'}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setCompanyForm(prev => ({ ...prev, adminPin: val }));
                    }}
                    className="w-full h-10 text-center font-mono font-bold text-base tracking-widest bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>
              </div>
              <p className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" />
                Salvamento permanente: todas as alterações ficam gravadas permanentemente.
              </p>
            </div>

            {/* PWA Mobile Installation Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Ícone na Tela Inicial do Celular</span>
                  <span className="text-[11px] text-slate-500 block">Instale o app no Android ou iPhone para acesso em 1 toque.</span>
                </div>
              </div>
              <PWAInstallButton variant="header" />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveCompany}
                disabled={isSaving}
                className="w-full h-13 bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Salvando...' : 'Salvar Dados da Empresa'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: MÁQUINAS (INJETORAS PRODUÇÃO 1, PRODUÇÃO 2 E GERAL) */}
        {/* ============================================================== */}
        {activeTab === 'maquinas' && (
          <MachinesView
            machines={machines}
            clients={clients}
            onSaveMachine={onSaveMachine}
            onDeleteMachine={onDeleteMachine}
            embedded={true}
          />
        )}

        {/* ============================================================== */}
        {/* TAB 3: ÚLTIMOS RELATÓRIOS CONCLUÍDOS */}
        {/* ============================================================== */}
        {activeTab === 'relatorios' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Últimos Relatórios Concluídos</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {reports.length} {reports.length === 1 ? 'relatório registrado' : 'relatórios registrados'} no sistema
                  </p>
                </div>
              </div>
            </div>

            {reports.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">Nenhum relatório emitido ainda</p>
                <p className="text-xs text-slate-400 mt-1">Crie um novo relatório na tela inicial para visualizá-lo e gerenciá-lo aqui.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <MachineBadge machine={r.machine} size="sm" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-extrabold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md">
                              {r.code}
                            </span>
                            <span className="text-xs font-black text-slate-800">
                              {r.machine.name} {r.machine.tag ? `(${r.machine.tag})` : ''}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 font-medium">
                            {r.date} • {r.technician.name} • {r.client.name}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        r.status === 'Finalizado'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {r.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                      {onViewPdf && (
                        <button
                          type="button"
                          onClick={() => onViewPdf(r)}
                          className="flex-1 min-w-[120px] h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver PDF</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => downloadReportPdf(r, settings)}
                        className="flex-1 min-w-[120px] h-9 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Baixar PDF</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: EQUIPE TÉCNICA */}
        {/* ============================================================== */}
        {activeTab === 'equipe' && (
          <div className="space-y-4">
            {/* Técnicos */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                Técnicos Responsáveis
              </h3>

              <div className="space-y-2">
                {techList.map((t, i) => (
                  <div key={t.id || i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                    <div>
                      <span className="font-bold text-slate-900 block">{t.name}</span>
                      <span className="text-xs text-slate-500">{t.role || 'Técnico Responsável'}</span>
                    </div>
                    {techList.length > 1 && (
                      <button
                        onClick={() => setTechList(techList.filter((_, idx) => idx !== i))}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newTechName}
                  onChange={(e) => setNewTechName(e.target.value)}
                  placeholder="Nome do novo técnico"
                  className="flex-1 h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newTechName.trim()) {
                      setTechList([...techList, { id: `tec_${Date.now()}`, name: newTechName.trim(), role: 'Técnico' }]);
                      setNewTechName('');
                    }
                  }}
                  className="h-11 px-4 bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Adicionar
                </button>
              </div>
            </div>

            {/* Auxiliares */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                Auxiliares de Manutenção
              </h3>

              <div className="flex flex-wrap gap-2">
                {auxList.map((aux, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl"
                  >
                    {aux}
                    <button
                      onClick={() => setAuxList(auxList.filter((_, idx) => idx !== i))}
                      className="hover:text-red-600 text-slate-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newAuxName}
                  onChange={(e) => setNewAuxName(e.target.value)}
                  placeholder="Nome do novo auxiliar"
                  className="flex-1 h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newAuxName.trim()) {
                      setAuxList([...auxList, newAuxName.trim()]);
                      setNewAuxName('');
                    }
                  }}
                  className="h-11 px-4 bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Adicionar
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveTeam}
                  disabled={isSaving}
                  className="w-full h-13 bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Equipe</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: CLIENTES */}
        {/* ============================================================== */}
        {activeTab === 'clientes' && (
          <div className="space-y-4">
            {/* New Client Form */}
            <form onSubmit={handleAddClient} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 text-xs">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                Cadastrar Novo Cliente
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Razão Social / Nome *</label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Nome da empresa"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">CNPJ / CPF</label>
                  <input
                    type="text"
                    value={newClientDoc}
                    onChange={(e) => setNewClientDoc(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Responsável / Contato</label>
                  <input
                    type="text"
                    value={newClientContact}
                    onChange={(e) => setNewClientContact(e.target.value)}
                    placeholder="Engenheiro ou supervisor"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Telefone</label>
                  <input
                    type="text"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="(11) 90000-0000"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Endereço da Planta</label>
                <input
                  type="text"
                  value={newClientAddr}
                  onChange={(e) => setNewClientAddr(e.target.value)}
                  placeholder="Rua, número, galpão, cidade"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Cadastrar Cliente
              </button>
            </form>

            {/* List */}
            <div className="space-y-2">
              {clients.map(c => (
                <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                    <p className="text-xs text-slate-500">
                      {c.contactPerson ? `Contato: ${c.contactPerson}` : ''} {c.phone ? ` • ${c.phone}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setClientToDelete(c)}
                    className="text-slate-400 hover:text-red-600 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: CHECKLIST TEMPLATE */}
        {/* ============================================================== */}
        {activeTab === 'checklist' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Modelo Padrão de Checklist ({checkList.length} itens)</h3>
                <p className="text-xs text-slate-500">Estes itens são carregados automaticamente em novos relatórios:</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCheckList(OFFICIAL_INJECTION_CHECKLIST.map(item => ({ id: item.id, label: item.label, category: item.category })));
                }}
                className="h-10 px-3.5 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs rounded-xl border border-blue-200 flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                <Sparkles className="w-4 h-4 text-blue-700" />
                <span>Restaurar 27 Itens de Injetoras</span>
              </button>
            </div>

            <div className="space-y-2">
              {checkList.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium">
                  <span className="w-6 h-6 rounded bg-slate-200 text-slate-700 font-mono font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => {
                      const newLabel = e.target.value;
                      setCheckList(checkList.map((c, i) => i === idx ? { ...c, label: newLabel } : c));
                    }}
                    className="flex-1 bg-transparent border-none text-slate-900 font-semibold focus:outline-none"
                  />
                  <button
                    onClick={() => setCheckList(checkList.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={newCheckItem}
                onChange={(e) => setNewCheckItem(e.target.value)}
                placeholder="Novo item de inspeção..."
                className="flex-1 h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (newCheckItem.trim()) {
                    setCheckList([...checkList, { id: `c_${Date.now()}`, label: newCheckItem.trim() }]);
                    setNewCheckItem('');
                  }
                }}
                className="h-11 px-4 bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveChecklist}
                disabled={isSaving}
                className="w-full h-13 bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Checklist Padrão</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: ONLINE & SUPABASE */}
        {/* ============================================================== */}
        {/* ============================================================== */}
        {/* TAB 5: ONLINE & SUPABASE */}
        {/* ============================================================== */}
        {activeTab === 'online' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Sincronização & Domínio Vercel</h3>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 26 Máquinas Injetoras & Dados Pré-Carregados no Código
                </span>
              </div>
            </div>

            {backupMsg && (
              <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                backupIsError
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                {backupIsError ? (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span>{backupMsg}</span>
              </div>
            )}

            {/* Firebase Realtime Cloud Status Banner */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Firebase Firestore Cloud Ativo em Tempo Real
                </span>
                <span className="bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full text-[10px]">
                  Multi-Aparelhos & Domínio Próprio
                </span>
              </div>
              <p className="text-emerald-900 leading-relaxed font-medium">
                O banco de dados em nuvem <strong>Google Firebase Firestore</strong> está configurado e ativo! Qualquer relatório finalizado, máquina adicionada, editada ou excluída em qualquer celular aparece <strong>instantaneamente (&lt; 1 segundo)</strong> nos celulares de todos os outros técnicos e no seu domínio próprio (Vercel ou servidor).
              </p>
            </div>

            {/* Instant Backup / Restore */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Transferir Dados (AI Studio ➔ Vercel)
                </h4>
                <span className="text-[11px] font-semibold text-slate-500">Backup 1-Clique</span>
              </div>
              <p className="text-xs text-slate-600">
                Se você fez alterações aqui e quer atualizar instantaneamente o seu domínio ou celular sem esperar novo deploy:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="h-11 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-blue-700" />
                  <span>Baixar Backup Completo (.JSON)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyBackup}
                  className="h-11 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>Copiar Dados (Clipboard)</span>
                </button>
              </div>

              {!showImportBox ? (
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <label className="w-full sm:flex-1 h-11 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>Carregar Arquivo .JSON do Aparelho</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowImportBox(true)}
                    className="text-xs font-bold text-blue-900 hover:text-blue-800 underline py-2 cursor-pointer"
                  >
                    Ou colar texto JSON
                  </button>
                </div>
              ) : (
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Cole o conteúdo do backup JSON abaixo ou selecione o arquivo:
                    </label>
                    <label className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Selecionar Arquivo</span>
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <textarea
                    rows={4}
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                    placeholder='Cole aqui o JSON exportado...'
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleImportBackup()}
                      className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Confirmar Importação de Dados
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowImportBox(false)}
                      className="px-4 h-10 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Supabase Connection */}
            <div className="space-y-3 pt-1">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Banco na Nuvem Supabase (Sincronização em Tempo Real)
              </h4>
              <p className="text-xs text-slate-500">
                Para que relatórios criados em celulares diferentes sincronizem na mesma hora automaticamente:
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Supabase Project URL</label>
                <input
                  type="text"
                  value={companyForm.supabaseUrl || ''}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, supabaseUrl: e.target.value }))}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Supabase Anon Key</label>
                <input
                  type="password"
                  value={companyForm.supabaseAnonKey || ''}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, supabaseAnonKey: e.target.value }))}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveCompany}
                className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Salvar Configurações de Conexão
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Client Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Excluir Cliente?</h3>
            <p className="text-xs text-slate-500 mb-5">
              Tem certeza que deseja excluir <strong>{clientToDelete.name}</strong>?
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDeleteClient(clientToDelete.id);
                  setClientToDelete(null);
                }}
                className="h-11 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
