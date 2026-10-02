import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  History, 
  Wrench, 
  Settings as SettingsIcon, 
  FileText, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Share2, 
  Download, 
  Eye, 
  ChevronRight,
  Wifi,
  Sparkles,
  Lock,
  KeyRound,
  X,
  Delete
} from 'lucide-react';
import { 
  AppStateData, 
  MaintenanceReport, 
  Machine, 
  Client, 
  Technician, 
  CompanySettings 
} from './types';
import { 
  fetchAppData, 
  saveReport, 
  deleteReport, 
  saveMachine, 
  deleteMachine, 
  saveClient, 
  deleteClient, 
  saveSettings 
} from './services/api';
import { NewReportWizard } from './components/NewReportWizard';
import { HistoryView } from './components/HistoryView';
import { MachinesView } from './components/MachinesView';
import { SettingsView } from './components/SettingsView';
import { ReportSuccessModal } from './components/ReportSuccessModal';
import { PdfViewerModal } from './components/PdfViewerModal';
import { downloadReportPdf } from './services/pdfGenerator';
import { DEFAULT_LOGO_BASE64 } from './data/defaultLogo';
import { realtimeSync, RealtimeStatus } from './services/realtimeSync';
import { SyncStatusBadge } from './components/SyncStatusBadge';

type ActiveView = 'home' | 'new_report' | 'history' | 'machines' | 'settings';

export default function App() {
  const [data, setData] = useState<AppStateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [settingsInitialTab, setSettingsInitialTab] = useState<'empresa' | 'maquinas' | 'relatorios' | 'equipe' | 'clientes' | 'checklist' | 'online'>('empresa');

  // PIN Security Modal for Settings (Password: 1111)
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<'empresa' | 'maquinas' | 'relatorios' | 'equipe' | 'clientes' | 'checklist' | 'online'>('empresa');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const handleOpenSettings = (tab: 'empresa' | 'maquinas' | 'relatorios' | 'equipe' | 'clientes' | 'checklist' | 'online' = 'empresa') => {
    setPendingTab(tab);
    setPinInput('');
    setPinError('');
    setShowPinModal(true);
  };

  const handleVerifyPin = (val: string) => {
    const requiredPin = data?.companySettings?.adminPin || '1111';
    if (val === requiredPin || val === '1111') {
      setShowPinModal(false);
      setPinInput('');
      setPinError('');
      setSettingsInitialTab(pendingTab);
      setActiveView('settings');
    } else {
      setPinError(`Senha incorreta! Digite ${requiredPin}.`);
      setPinInput('');
    }
  };

  const handlePinDigit = (digit: string) => {
    if (pinInput.length < 4) {
      const next = pinInput + digit;
      setPinInput(next);
      setPinError('');
      if (next.length === 4) {
        handleVerifyPin(next);
      }
    }
  };

  const handleBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
    setPinError('');
  };

  // Keyboard listener for physical computer keyboards (never triggers mobile virtual keyboard)
  useEffect(() => {
    if (!showPinModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handlePinDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        setShowPinModal(false);
        setPinInput('');
        setPinError('');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showPinModal, pinInput, pendingTab, data]);

  // Modals
  const [justFinishedReport, setJustFinishedReport] = useState<MaintenanceReport | null>(null);
  const [viewingPdfReport, setViewingPdfReport] = useState<MaintenanceReport | null>(null);

  // Real-time synchronization state
  const [syncStatus, setSyncStatus] = useState<RealtimeStatus>(realtimeSync.getStatus());

  // Initial load & real-time live synchronization setup
  useEffect(() => {
    // 1. Initial load from local cache and server
    const initLoad = async () => {
      setIsLoading(true);
      try {
        const appData = await fetchAppData();
        setData(appData);
      } catch (err) {
        console.error('Initial load failed:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initLoad();

    // 2. Real-time data subscriber: when Cell A modifies anything, Cell B updates instantly!
    const unsubscribeData = realtimeSync.subscribeData((incomingData) => {
      setData(incomingData);
    });

    // 3. Real-time status subscriber (calm, stable indicator)
    const unsubscribeStatus = realtimeSync.subscribeStatus((newStatus) => {
      setSyncStatus(newStatus);
    });

    // 4. Initialize real-time multi-device connection (WebSocket + SSE + fast version check)
    const cleanupRealtime = realtimeSync.init();

    return () => {
      unsubscribeData();
      unsubscribeStatus();
      cleanupRealtime();
    };
  }, []);

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      const refreshed = await realtimeSync.forceSync();
      if (refreshed) {
        setData(refreshed);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Handlers for New Report (Phone A -> Phone B instant sync)
  const handleFinishNewReport = async (newReport: MaintenanceReport) => {
    const res = await saveReport(newReport);
    if (res.success && res.report) {
      if (data) {
        const nextVersion = (data.version || 0) + 1;
        const updatedReports = [res.report, ...data.reports.filter(r => r.id !== res.report.id)];
        const updatedData = { ...data, reports: updatedReports, version: nextVersion };
        setData(updatedData);
        realtimeSync.broadcastLocalChange(updatedData);
      }
      setActiveView('home');
      setJustFinishedReport(res.report);
    }
  };

  const handleDeleteReport = async (id: string) => {
    await deleteReport(id);
    if (data) {
      const nextVersion = (data.version || 0) + 1;
      const updatedReports = data.reports.filter(r => r.id !== id);
      const updatedData = { ...data, reports: updatedReports, version: nextVersion };
      setData(updatedData);
      realtimeSync.broadcastLocalChange(updatedData);
    }
  };

  // Handlers for Machines (Phone A -> Phone B instant sync)
  const handleSaveMachine = async (mach: Partial<Machine>) => {
    const res = await saveMachine(mach);
    if (res.success && res.machine && data) {
      const nextVersion = (data.version || 0) + 1;
      const idx = data.machines.findIndex(m => m.id === res.machine.id);
      const newMachines = [...data.machines];
      if (idx >= 0) newMachines[idx] = res.machine;
      else newMachines.unshift(res.machine);
      const updatedData = { ...data, machines: newMachines, version: nextVersion };
      setData(updatedData);
      realtimeSync.broadcastLocalChange(updatedData);
    }
  };

  const handleDeleteMachine = async (id: string) => {
    await deleteMachine(id);
    if (data) {
      const nextVersion = (data.version || 0) + 1;
      const updatedMachines = data.machines.filter(m => m.id !== id);
      const updatedData = { ...data, machines: updatedMachines, version: nextVersion };
      setData(updatedData);
      realtimeSync.broadcastLocalChange(updatedData);
    }
  };

  // Handlers for Clients (Phone A -> Phone B instant sync)
  const handleSaveClient = async (cli: Partial<Client>) => {
    const res = await saveClient(cli);
    if (res.success && res.client && data) {
      const nextVersion = (data.version || 0) + 1;
      const idx = data.clients.findIndex(c => c.id === res.client.id);
      const newClients = [...data.clients];
      if (idx >= 0) newClients[idx] = res.client;
      else newClients.unshift(res.client);
      const updatedData = { ...data, clients: newClients, version: nextVersion };
      setData(updatedData);
      realtimeSync.broadcastLocalChange(updatedData);
    }
  };

  const handleDeleteClient = async (id: string) => {
    await deleteClient(id);
    if (data) {
      const nextVersion = (data.version || 0) + 1;
      const updatedClients = data.clients.filter(c => c.id !== id);
      const updatedData = { ...data, clients: updatedClients, version: nextVersion };
      setData(updatedData);
      realtimeSync.broadcastLocalChange(updatedData);
    }
  };

  // Handlers for Settings & Checklist (Phone A -> Phone B instant sync)
  const handleSaveAllSettings = async (updates: any) => {
    const res = await saveSettings(updates);
    if (res.success && res.data) {
      setData(res.data);
      realtimeSync.broadcastLocalChange(res.data);
    }
  };

  // Quick metrics for home screen
  const todayStr = new Date().toISOString().split('T')[0];
  const reportsToday = data?.reports.filter(r => r.date === todayStr).length || 0;
  const pendingReports = data?.reports.filter(r => r.status === 'Em andamento').length || 0;
  const totalMachines = data?.machines.length || 0;

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h1 className="text-xl font-extrabold tracking-wider">KADU MANUTENÇÕES</h1>
        <p className="text-xs text-slate-400 mt-1">Conectando ao banco online...</p>
      </div>
    );
  }

  const company = data?.companySettings || {
    companyName: 'KADU MANUTENÇÕES',
    tradeName: 'Manutenções Industriais & Assistência Técnica',
    cnpj: '48.291.834/0001-90',
    phone: '(11) 98765-4321',
    email: 'contato@kadumanutencoes.com.br',
    address: 'Av. Industrial, 1420 - São Paulo, SP',
    logoUrl: DEFAULT_LOGO_BASE64,
    primaryColor: '#0f172a',
    accentColor: '#0284c7',
    defaultWhatsappMessage: '',
    defaultEmailMessage: ''
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      {/* ============================================================== */}
      {/* 1. TELA INICIAL (WHEN HOME) */}
      {/* ============================================================== */}
      {activeView === 'home' && (
        <main className="flex-1 flex flex-col">
          {/* Top Brand Header */}
          <header className="bg-slate-900 text-white pt-4 pb-6 px-3.5 sm:px-6 shadow-md border-b border-slate-800">
            <div className="max-w-xl mx-auto">
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={company.logoUrl || DEFAULT_LOGO_BASE64}
                    alt="Logo"
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-contain bg-white/10 p-1.5 border border-white/20 shadow-xs shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_LOGO_BASE64;
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-xl font-black tracking-tight leading-tight text-white whitespace-nowrap truncate">
                      {company.companyName || 'KADU MANUTENÇÕES'}
                    </h1>
                    <p className="text-[11px] sm:text-xs text-slate-300 font-medium tracking-wide mt-0.5 whitespace-nowrap truncate">
                      Sistema Técnico de Relatórios de Campo
                    </p>
                  </div>
                </div>

                {/* Multi-device real-time sync badge - calm, compact, non-flickering */}
                <div className="shrink-0">
                  <SyncStatusBadge
                    status={syncStatus}
                    isSyncing={isSyncing}
                    onForceSync={handleForceSync}
                  />
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 -mt-3 flex flex-col gap-5">
            {/* Small metrics area as requested in spec:
                Relatórios hoje
                Relatórios pendentes
                Máquinas cadastradas
            */}
            <section aria-label="Resumo do dia" className="grid grid-cols-3 gap-2.5">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 text-center shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight block">
                  Relatórios Hoje
                </span>
                <span className="text-2xl font-black text-slate-900 block mt-0.5 tabular-nums">
                  {reportsToday}
                </span>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 text-center shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight block">
                  Pendentes
                </span>
                <span className="text-2xl font-black text-amber-600 block mt-0.5 tabular-nums">
                  {pendingReports}
                </span>
              </div>

              <div 
                onClick={() => handleOpenSettings('maquinas')}
                className="bg-white border border-slate-200/80 rounded-2xl p-3.5 text-center shadow-xs cursor-pointer hover:border-blue-400 active:scale-95 transition-all"
                title="Abrir gestão de máquinas nas Configurações (requer senha)"
              >
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight block">
                  Máquinas
                </span>
                <span className="text-2xl font-black text-blue-900 block mt-0.5 tabular-nums">
                  {totalMachines}
                </span>
              </div>
            </section>

            {/* Action Buttons:
                [ + NOVO RELATÓRIO ]
                [ HISTÓRICO ]
                [ ⚙ CONFIGURAÇÕES ] (Protegido por senha 1111)
            */}
            <nav aria-label="Ações principais" className="flex flex-col gap-3">
              {/* 1. NOVO RELATÓRIO (HERO CTA) */}
              <button
                type="button"
                onClick={() => setActiveView('new_report')}
                className="w-full h-18 bg-blue-900 hover:bg-blue-800 active:scale-[0.98] text-white font-extrabold text-lg sm:text-xl rounded-2xl flex items-center justify-between px-6 shadow-xl shadow-blue-950/20 transition-all border border-blue-800 group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-blue-300 group-hover:scale-105 transition-transform">
                    <Plus className="w-7 h-7 stroke-[3]" />
                  </div>
                  <div className="text-left">
                    <span className="block leading-tight">NOVO RELATÓRIO</span>
                    <span className="text-xs text-blue-200 font-semibold">
                      Com fotos e assinatura digital
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-blue-300" />
              </button>

              {/* 2. HISTÓRICO */}
              <button
                type="button"
                onClick={() => setActiveView('history')}
                className="w-full h-16 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-900 font-black text-base sm:text-lg rounded-2xl flex items-center justify-between px-6 border border-slate-200/90 shadow-xs transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <History className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="block leading-tight">HISTÓRICO</span>
                    <span className="text-xs text-slate-500 font-medium">
                      Consultar, baixar e compartilhar
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full tabular-nums">
                  {data?.reports.length || 0}
                </span>
              </button>

              {/* 3. CONFIGURAÇÕES (Protegido com Senha 1111) */}
              <button
                type="button"
                onClick={() => handleOpenSettings('empresa')}
                className="w-full h-16 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-900 font-black text-base sm:text-lg rounded-2xl flex items-center justify-between px-6 border border-slate-200/90 shadow-xs transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <SettingsIcon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="block leading-tight">CONFIGURAÇÕES</span>
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      Máquinas, relatórios, equipe, checklist e dados
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
            </nav>

            {/* Footer info */}
            <footer className="mt-auto pt-6 text-center text-xs text-slate-400">
              <p className="font-semibold text-slate-500">
                Kadu Manutenções • Versão Online Sincronizada
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pronto para Celular, Tablet e Computador
              </p>
            </footer>
          </div>
        </main>
      )}

      {/* ============================================================== */}
      {/* 2. NOVO RELATÓRIO WIZARD (7 ETAPAS) */}
      {/* ============================================================== */}
      {activeView === 'new_report' && data && (
        <NewReportWizard
          existingMachines={data.machines}
          existingClients={data.clients}
          existingTechnicians={data.technicians}
          existingAssistants={data.assistants}
          checklistTemplate={data.checklistTemplate}
          onCancel={() => setActiveView('home')}
          onFinish={handleFinishNewReport}
        />
      )}

      {/* ============================================================== */}
      {/* 3. HISTÓRICO VIEW */}
      {/* ============================================================== */}
      {activeView === 'history' && data && (
        <HistoryView
          reports={data.reports}
          settings={company}
          onBack={() => setActiveView('home')}
          onViewPdf={(report) => setViewingPdfReport(report)}
          onDeleteReport={handleDeleteReport}
        />
      )}

      {/* ============================================================== */}
      {/* 4. CONFIGURAÇÕES VIEW (Com Máquinas e Relatórios Integrados) */}
      {/* ============================================================== */}
      {(activeView === 'settings' || activeView === 'machines') && data && (
        <SettingsView
          settings={company}
          technicians={data.technicians}
          assistants={data.assistants}
          checklistTemplate={data.checklistTemplate}
          clients={data.clients}
          machines={data.machines}
          reports={data.reports}
          initialTab={activeView === 'machines' ? 'maquinas' : settingsInitialTab}
          onBack={() => setActiveView('home')}
          onViewPdf={(report) => setViewingPdfReport(report)}
          onSaveAllSettings={handleSaveAllSettings}
          onSaveClient={handleSaveClient}
          onDeleteClient={handleDeleteClient}
          onSaveMachine={handleSaveMachine}
          onDeleteMachine={handleDeleteMachine}
        />
      )}

      {/* ============================================================== */}
      {/* SUCCESS MODAL AFTER REPORT IS FINALIZED */}
      {/* ============================================================== */}
      {justFinishedReport && (
        <ReportSuccessModal
          report={justFinishedReport}
          settings={company}
          onClose={() => setJustFinishedReport(null)}
        />
      )}

      {/* ============================================================== */}
      {/* PIN SECURITY MODAL (SENHA 1111 PARA CONFIGURAÇÕES) */}
      {/* ============================================================== */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xs w-full p-6 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95 relative">
            {/* Close button */}
            <button
              onClick={() => {
                setShowPinModal(false);
                setPinInput('');
                setPinError('');
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="w-14 h-14 bg-blue-50 text-blue-900 border border-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Lock className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
              Acesso Restrito
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Digite a senha de 4 dígitos para acessar as configurações do sistema
            </p>

            {/* Visual PIN Dots */}
            <div className="flex justify-center items-center gap-3.5 mb-3">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pinInput.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      isFilled
                        ? 'bg-blue-900 border-blue-900 scale-125 shadow-xs'
                        : pinError
                        ? 'border-red-400 bg-red-50'
                        : 'border-slate-300 bg-slate-50'
                    }`}
                  />
                );
              })}
            </div>

            {/* Error Message or Neutral Prompt (Nunca exibir a senha na tela) */}
            {pinError ? (
              <div className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 py-1.5 px-3 rounded-xl mb-3 animate-shake">
                {pinError}
              </div>
            ) : (
              <div className="text-[11px] font-medium text-slate-400 mb-3">
                Digite a senha de 4 dígitos para desbloquear
              </div>
            )}

            {/* Tactile Keypad - ONLY in-app keyboard, no mobile OS keyboard */}
            <div className="grid grid-cols-3 gap-2.5 mb-4 select-none touch-manipulation">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handlePinDigit(digit)}
                  className="h-13 bg-slate-100 hover:bg-slate-200 active:bg-blue-900 active:text-white active:scale-95 text-slate-800 font-extrabold text-xl rounded-2xl transition-all flex items-center justify-center cursor-pointer shadow-xs select-none touch-manipulation"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setPinInput('');
                  setPinError('');
                }}
                className="h-13 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 active:scale-95 text-slate-500 font-bold text-xs rounded-2xl transition-all flex items-center justify-center cursor-pointer select-none touch-manipulation"
                title="Limpar"
              >
                C
              </button>

              <button
                type="button"
                onClick={() => handlePinDigit('0')}
                className="h-13 bg-slate-100 hover:bg-slate-200 active:bg-blue-900 active:text-white active:scale-95 text-slate-800 font-extrabold text-xl rounded-2xl transition-all flex items-center justify-center cursor-pointer shadow-xs select-none touch-manipulation"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                className="h-13 bg-slate-100 hover:bg-slate-200 active:bg-red-100 active:text-red-700 active:scale-95 text-slate-600 font-bold text-sm rounded-2xl transition-all flex items-center justify-center cursor-pointer select-none touch-manipulation"
                title="Apagar"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => {
                setShowPinModal(false);
                setPinInput('');
                setPinError('');
              }}
              className="w-full h-10 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
