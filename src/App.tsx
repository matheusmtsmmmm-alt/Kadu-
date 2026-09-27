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
  Sparkles
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

type ActiveView = 'home' | 'new_report' | 'history' | 'machines' | 'settings';

export default function App() {
  const [data, setData] = useState<AppStateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('home');

  // Modals
  const [justFinishedReport, setJustFinishedReport] = useState<MaintenanceReport | null>(null);
  const [viewingPdfReport, setViewingPdfReport] = useState<MaintenanceReport | null>(null);

  // Initial load & periodic background sync (every 6 seconds for multi-device live sync)
  const loadData = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) setIsLoading(true);
    setIsSyncing(true);
    try {
      const appData = await fetchAppData();
      setData(appData);
    } catch (err) {
      console.error('Data sync failed:', err);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadData(true);

    // Live background polling for multi-user synchronization across phones & tablets
    const interval = setInterval(() => {
      loadData(false);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Handlers for New Report
  const handleFinishNewReport = async (newReport: MaintenanceReport) => {
    const res = await saveReport(newReport);
    if (res.success && res.report) {
      await loadData(false);
      setActiveView('home');
      setJustFinishedReport(res.report);
    }
  };

  const handleDeleteReport = async (id: string) => {
    await deleteReport(id);
    await loadData(false);
  };

  // Handlers for Machines
  const handleSaveMachine = async (mach: Partial<Machine>) => {
    await saveMachine(mach);
    await loadData(false);
  };

  const handleDeleteMachine = async (id: string) => {
    await deleteMachine(id);
    await loadData(false);
  };

  // Handlers for Clients
  const handleSaveClient = async (cli: Partial<Client>) => {
    await saveClient(cli);
    await loadData(false);
  };

  const handleDeleteClient = async (id: string) => {
    await deleteClient(id);
    await loadData(false);
  };

  // Handlers for Settings
  const handleSaveAllSettings = async (updates: any) => {
    await saveSettings(updates);
    await loadData(false);
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
    logoUrl: '/src/assets/images/kadu_logo_1790525097159.jpg',
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
          <header className="bg-slate-900 text-white pt-5 pb-7 px-4 sm:px-6 shadow-md border-b border-slate-800">
            <div className="max-w-xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {company.logoUrl && (
                    <img
                      src={company.logoUrl}
                      alt="Logo"
                      className="w-11 h-11 rounded-xl object-contain bg-white/10 p-1 border border-white/20"
                    />
                  )}
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-white">
                      KADU MANUTENÇÕES
                    </h1>
                    <p className="text-[11px] text-slate-300 font-medium tracking-wide mt-1">
                      Sistema Técnico de Relatórios de Campo
                    </p>
                  </div>
                </div>

                {/* Multi-device sync indicator */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadData(false)}
                    title="Sincronizar agora"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-[11px] font-semibold text-emerald-400 border border-slate-700 hover:bg-slate-700 transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{isSyncing ? 'Sincronizando' : 'Online'}</span>
                    <RefreshCw className={`w-3 h-3 text-slate-400 ${isSyncing ? 'animate-spin' : ''}`} />
                  </button>
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

              <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 text-center shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight block">
                  Máquinas
                </span>
                <span className="text-2xl font-black text-blue-900 block mt-0.5 tabular-nums">
                  {totalMachines}
                </span>
              </div>
            </section>

            {/* Big Action Buttons as explicitly requested in prompt:
                [ + NOVO RELATÓRIO ]
                [ HISTÓRICO ]
                [ MÁQUINAS ]
                [ ⚙ CONFIGURAÇÕES ]
            */}
            <nav aria-label="Ações principais" className="flex flex-col gap-3">
              {/* 1. NOVO RELATÓRIO (HERO CTA) */}
              <button
                type="button"
                onClick={() => setActiveView('new_report')}
                className="w-full h-18 bg-blue-900 hover:bg-blue-800 active:scale-[0.98] text-white font-extrabold text-lg sm:text-xl rounded-2xl flex items-center justify-between px-6 shadow-xl shadow-blue-950/20 transition-all border border-blue-800 group"
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
                className="w-full h-16 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-900 font-black text-base sm:text-lg rounded-2xl flex items-center justify-between px-6 border border-slate-200/90 shadow-xs transition-all"
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

              {/* 3. MÁQUINAS */}
              <button
                type="button"
                onClick={() => setActiveView('machines')}
                className="w-full h-16 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-900 font-black text-base sm:text-lg rounded-2xl flex items-center justify-between px-6 border border-slate-200/90 shadow-xs transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="block leading-tight">MÁQUINAS</span>
                    <span className="text-xs text-slate-500 font-medium">
                      Equipamentos cadastrados e TAGs
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full tabular-nums">
                  {totalMachines}
                </span>
              </button>

              {/* 4. CONFIGURAÇÕES */}
              <button
                type="button"
                onClick={() => setActiveView('settings')}
                className="w-full h-16 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-900 font-black text-base sm:text-lg rounded-2xl flex items-center justify-between px-6 border border-slate-200/90 shadow-xs transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <SettingsIcon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="block leading-tight">CONFIGURAÇÕES</span>
                    <span className="text-xs text-slate-500 font-medium">
                      Equipe, checklist, logo e dados
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
            </nav>

            {/* Quick Recent Reports Stream */}
            {data && data.reports.length > 0 && (
              <section aria-label="Relatórios recentes" className="pt-2">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Últimos Relatórios Concluídos
                  </span>
                  <button
                    onClick={() => setActiveView('history')}
                    className="text-xs font-bold text-blue-900 hover:underline"
                  >
                    Ver todos
                  </button>
                </div>

                <div className="space-y-2.5">
                  {data.reports.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      onClick={() => setViewingPdfReport(r)}
                      className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:border-blue-400 transition-all shadow-2xs active:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-extrabold font-mono text-blue-900">{r.code}</span>
                            <span className="text-xs font-bold text-slate-800 truncate max-w-[160px] sm:max-w-xs">{r.machine.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {r.date}  •  {r.technician.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                          PDF Pronto
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Footer info */}
            <footer className="mt-auto pt-6 text-center text-xs text-slate-400">
              <p className="font-semibold text-slate-500">
                Kadu Manutenções  •  Versão Online Sincronizada
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
      {/* 4. MÁQUINAS VIEW */}
      {/* ============================================================== */}
      {activeView === 'machines' && data && (
        <MachinesView
          machines={data.machines}
          clients={data.clients}
          onBack={() => setActiveView('home')}
          onSaveMachine={handleSaveMachine}
          onDeleteMachine={handleDeleteMachine}
        />
      )}

      {/* ============================================================== */}
      {/* 5. CONFIGURAÇÕES VIEW */}
      {/* ============================================================== */}
      {activeView === 'settings' && data && (
        <SettingsView
          settings={company}
          technicians={data.technicians}
          assistants={data.assistants}
          checklistTemplate={data.checklistTemplate}
          clients={data.clients}
          machines={data.machines}
          onBack={() => setActiveView('home')}
          onSaveAllSettings={handleSaveAllSettings}
          onSaveClient={handleSaveClient}
          onDeleteClient={handleDeleteClient}
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
          onViewPdf={() => {
            setViewingPdfReport(justFinishedReport);
            setJustFinishedReport(null);
          }}
        />
      )}

      {/* ============================================================== */}
      {/* PDF VIEWER MODAL */}
      {/* ============================================================== */}
      {viewingPdfReport && (
        <PdfViewerModal
          report={viewingPdfReport}
          settings={company}
          onClose={() => setViewingPdfReport(null)}
        />
      )}
    </div>
  );
}
