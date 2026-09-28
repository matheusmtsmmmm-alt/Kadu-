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
  Download
} from 'lucide-react';
import { CompanySettings, Technician, Client, Machine, MaintenanceReport } from '../types';
import { uploadPhotoFile } from '../services/api';
import { OFFICIAL_INJECTION_CHECKLIST } from '../data/defaultChecklist';
import { downloadReportPdf } from '../services/pdfGenerator';
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
      const uploadedUrl = await uploadPhotoFile(b64);
      setCompanyForm(prev => ({ ...prev, logoUrl: uploadedUrl }));
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
                  <img src={companyForm.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-slate-700 block">Logotipo KADU MANUTENÇÕES</span>
                <span className="text-[11px] text-slate-500 block mb-2">Exibido no cabeçalho dos relatórios em PDF.</span>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors shadow-xs">
                  <Upload className="w-3.5 h-3.5" /> Alterar Logo
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
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
        {/* TAB 2: MÁQUINAS (INJETORAS PAVILHÃO 1, PAVILHÃO 2 E GERAL) */}
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
        {activeTab === 'online' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Sincronização Online Multi-dispositivo</h3>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  🟢 Servidor Online Conectado (Celular 1, Celular 2, Tablet, PC)
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
              <p className="font-semibold text-slate-700">
                Como funciona o acesso simultâneo:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>Todos os aparelhos (celulares dos técnicos, tablets e computadores) compartilham os mesmos dados online.</li>
                <li>Ao finalizar um relatório ou cadastrar uma máquina em um celular, todos os demais aparelhos recebem as atualizações.</li>
                <li>As fotos e assinaturas são gravadas em storage online e organizadas automaticamente no PDF.</li>
              </ul>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Configuração Direta Supabase (Opcional)
              </h4>
              <p className="text-xs text-slate-500">
                Se desejar apontar diretamente para seu próprio projeto Supabase na nuvem:
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
                className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl"
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
