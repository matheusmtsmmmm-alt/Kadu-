import React, { useState } from 'react';
import { 
  Building2, 
  Wrench, 
  UserCheck, 
  Clock, 
  FileText, 
  CheckSquare, 
  Camera, 
  PenTool, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Check, 
  AlertCircle,
  HelpCircle,
  Calendar,
  Sparkles
} from 'lucide-react';
import { 
  MaintenanceReport, 
  Machine, 
  Client, 
  Technician, 
  ChecklistItem, 
  MaintenanceType, 
  EquipmentStatus 
} from '../types';
import { StepProgressBar } from './StepProgressBar';
import { PhotoUploader } from './PhotoUploader';
import { SignaturePad } from './SignaturePad';
import { OFFICIAL_INJECTION_CHECKLIST } from '../data/defaultChecklist';

interface NewReportWizardProps {
  existingMachines: Machine[];
  existingClients: Client[];
  existingTechnicians: Technician[];
  existingAssistants: string[];
  checklistTemplate: Array<{ id: string; label: string; category?: string }>;
  onCancel: () => void;
  onFinish: (report: MaintenanceReport) => Promise<void>;
}

const STEP_TITLES = [
  'Cliente e Máquina',
  'Técnico e Horários',
  'Descrição dos Serviços',
  'Checklist de Inspeção',
  'Fotos Antes e Depois',
  'Observações e Assinatura',
  'Revisão e Finalização'
];

export const NewReportWizard: React.FC<NewReportWizardProps> = ({
  existingMachines,
  existingClients,
  existingTechnicians,
  existingAssistants,
  checklistTemplate,
  onCancel,
  onFinish
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [quickPavilhao, setQuickPavilhao] = useState<'P1' | 'P2' | 'TODAS'>('P1');
  const [selectedChecklistCategory, setSelectedChecklistCategory] = useState<'TODOS' | 'Hidráulica' | 'Mecânica' | 'Elétrica' | 'Segurança'>('TODOS');

  // Use official 27 injection molding checklist items as baseline or default
  const baseTemplate = (checklistTemplate && checklistTemplate.length >= 20)
    ? checklistTemplate
    : OFFICIAL_INJECTION_CHECKLIST;

  const todayStr = new Date().toISOString().split('T')[0];
  const nowTime = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

  // Form State
  const [reportData, setReportData] = useState<MaintenanceReport>({
    id: `rel_${Date.now()}`,
    code: '',
    date: todayStr,
    status: 'Finalizado',
    client: {
      id: existingClients[0]?.id || `cli_${Date.now()}`,
      name: existingClients[0]?.name || '',
      document: existingClients[0]?.document || '',
      phone: existingClients[0]?.phone || '',
      address: existingClients[0]?.address || '',
      contactPerson: existingClients[0]?.contactPerson || ''
    },
    machine: {
      id: existingMachines[0]?.id || `maq_${Date.now()}`,
      name: existingMachines[0]?.name || '',
      model: existingMachines[0]?.model || '',
      serialNumber: existingMachines[0]?.serialNumber || '',
      tag: existingMachines[0]?.tag || '',
      clientName: existingClients[0]?.name || '',
      horometer: existingMachines[0]?.horometer || '',
      location: existingMachines[0]?.location || '',
      manufacturer: existingMachines[0]?.manufacturer || ''
    },
    technician: {
      id: existingTechnicians[0]?.id || 'tec_1',
      name: existingTechnicians[0]?.name || 'Carlos Eduardo (Kadu)',
      phone: existingTechnicians[0]?.phone || '',
      role: 'Técnico Responsável'
    },
    assistants: [],
    times: {
      date: todayStr,
      startTime: '08:00',
      endTime: nowTime
    },
    maintenanceType: 'Preventiva',
    equipmentStatus: 'Operacional',
    description: '',
    partsReplaced: '',
    checklist: baseTemplate.map((item, idx) => ({
      id: item.id || `c${idx + 1}`,
      label: item.label,
      category: item.category || (idx < 10 ? 'Hidráulica' : idx < 18 ? 'Mecânica' : idx < 22 ? 'Elétrica' : 'Segurança'),
      status: 'conforme',
      notes: ''
    })),
    photosBefore: [],
    photosAfter: [],
    observations: '',
    futureRecommendations: '',
    signatures: {
      technician: {
        name: existingTechnicians[0]?.name || 'Carlos Eduardo (Kadu)',
        signatureImage: '',
        date: todayStr
      },
      clientResponsible: {
        name: existingClients[0]?.contactPerson || '',
        document: '',
        signatureImage: '',
        date: todayStr
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Machine quick selection helper
  const handleSelectMachine = (mach: Machine) => {
    // Find matching client if exists
    const matchingClient = existingClients.find(c => c.name.toLowerCase() === (mach.clientName || '').toLowerCase());

    setReportData(prev => ({
      ...prev,
      machine: { ...mach },
      client: matchingClient ? { ...matchingClient } : prev.client
    }));
  };

  // Client quick selection helper
  const handleSelectClient = (cli: Client) => {
    setReportData(prev => ({
      ...prev,
      client: { ...cli },
      signatures: {
        ...prev.signatures,
        clientResponsible: {
          ...prev.signatures.clientResponsible,
          name: cli.contactPerson || prev.signatures.clientResponsible.name
        }
      }
    }));
  };

  // Checklist quick actions
  const setAllChecklist = (status: 'conforme' | 'nao_conforme' | 'nao_aplica', forCategory?: string) => {
    setReportData(prev => ({
      ...prev,
      checklist: prev.checklist.map(item => {
        if (!forCategory || forCategory === 'TODOS' || item.category === forCategory) {
          return { ...item, status };
        }
        return item;
      })
    }));
  };

  const updateChecklistItem = (id: string, updates: Partial<ChecklistItem>) => {
    setReportData(prev => ({
      ...prev,
      checklist: prev.checklist.map(item => item.id === id ? { ...item, ...updates } : item)
    }));
  };

  // Validation before advancing
  const validateStep = (step: number): boolean => {
    setErrorMsg('');
    if (step === 1) {
      if (!reportData.machine.name.trim()) {
        setErrorMsg('Informe ou selecione o nome da máquina.');
        return false;
      }
      if (!reportData.client.name.trim()) {
        setErrorMsg('Informe ou selecione o nome do cliente.');
        return false;
      }
    }
    if (step === 2) {
      if (!reportData.technician.name.trim()) {
        setErrorMsg('Informe o nome do técnico responsável.');
        return false;
      }
    }
    if (step === 3) {
      if (!reportData.description.trim()) {
        setErrorMsg('Preencha a descrição do serviço realizado.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 7) {
        setCurrentStep(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePrev = () => {
    setErrorMsg('');
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onCancel();
    }
  };

  const handleFinishReport = async () => {
    setIsSubmitting(true);
    try {
      await onFinish(reportData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao finalizar relatório.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-28">
      {/* Top Progress bar */}
      <StepProgressBar
        currentStep={currentStep}
        totalSteps={7}
        stepTitles={STEP_TITLES}
      />

      <div className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6">
        {errorMsg && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* ETAPA 1: CLIENTE E MÁQUINA */}
        {/* ============================================================== */}
        {currentStep === 1 && (
          <div className="space-y-5">
            {/* Quick machine selector with Pavilion tabs */}
            {existingMachines.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                    ⚡ Seleção Rápida de Injetora:
                  </label>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    Toque para preencher tudo
                  </span>
                </div>

                {/* Pavilion tabs */}
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setQuickPavilhao('P1')}
                    className={`py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      quickPavilhao === 'P1'
                        ? 'bg-blue-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Pavilhão 1 (P1)</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      quickPavilhao === 'P1' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      1 a 13
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickPavilhao('P2')}
                    className={`py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      quickPavilhao === 'P2'
                        ? 'bg-blue-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Pavilhão 2 (P2)</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      quickPavilhao === 'P2' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      A até O
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickPavilhao('TODAS')}
                    className={`py-2 text-xs font-black rounded-lg transition-all ${
                      quickPavilhao === 'TODAS'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Todas ({existingMachines.length})
                  </button>
                </div>

                {/* Machines grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                  {existingMachines
                    .filter(m => {
                      if (quickPavilhao === 'P1') {
                        return m.pavilhao === 'P1' || m.location?.includes('P1') || (m.tag && m.tag.includes('0') && parseInt(m.tag.replace(/\D/g, '') || '0') <= 13);
                      }
                      if (quickPavilhao === 'P2') {
                        return m.pavilhao === 'P2' || m.location?.includes('P2') || (m.tag && /[A-O]/i.test(m.tag.replace('INJ.', '').trim()));
                      }
                      return true;
                    })
                    .map(m => {
                      const isSelected = reportData.machine.name === m.name || (reportData.machine.tag && reportData.machine.tag === m.tag);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleSelectMachine(m)}
                          className={`p-2.5 text-left rounded-xl border transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-blue-900 text-white border-blue-900 shadow-md ring-2 ring-blue-500/50'
                              : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-blue-50/60 hover:border-blue-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 w-full mb-1">
                            <span className={`text-[11px] font-mono font-black px-1.5 py-0.5 rounded ${
                              isSelected ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-900'
                            }`}>
                              {m.tag || m.name.split('-')[0].trim()}
                            </span>
                            {m.tonnage && (
                              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                isSelected ? 'bg-amber-400 text-slate-950 font-black' : 'bg-amber-100 text-amber-950 border border-amber-300'
                              }`}>
                                {m.tonnage}
                              </span>
                            )}
                          </div>
                          <span className={`text-xs font-bold leading-tight line-clamp-1 ${
                            isSelected ? 'text-blue-100' : 'text-slate-700'
                          }`}>
                            {m.model || m.name}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Máquina Details */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-blue-900" />
                  <h3 className="text-base font-bold text-slate-900">Dados do Equipamento / Máquina</h3>
                </div>
                {reportData.machine.tonnage && (
                  <span className="text-xs font-black text-amber-950 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-lg">
                    {reportData.machine.tonnage}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome ou Identificação da Máquina *
                </label>
                <input
                  type="text"
                  value={reportData.machine.name}
                  onChange={(e) => setReportData(prev => ({
                    ...prev,
                    machine: { ...prev.machine, name: e.target.value }
                  }))}
                  placeholder="Ex: INJ. 01 - STARMACH 55"
                  className="w-full h-12 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Modelo do Equipamento
                  </label>
                  <input
                    type="text"
                    value={reportData.machine.model}
                    onChange={(e) => setReportData(prev => ({
                      ...prev,
                      machine: { ...prev.machine, model: e.target.value }
                    }))}
                    placeholder="Ex: STARMACH 55 / HAITIAN MA 2500"
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    TAG / Identificação
                  </label>
                  <input
                    type="text"
                    value={reportData.machine.tag || ''}
                    onChange={(e) => setReportData(prev => ({
                      ...prev,
                      machine: { ...prev.machine, tag: e.target.value }
                    }))}
                    placeholder="Ex: INJ. 01 ou INJ. A"
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-blue-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tonelagem (t)
                  </label>
                  <input
                    type="text"
                    value={reportData.machine.tonnage || ''}
                    onChange={(e) => setReportData(prev => ({
                      ...prev,
                      machine: { ...prev.machine, tonnage: e.target.value }
                    }))}
                    placeholder="Ex: 55 t, 120 t, 200 t, 250 t, 320 t..."
                    className="w-full h-11 px-3 bg-amber-50/60 border border-amber-300 rounded-xl text-sm font-bold text-amber-950 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Pavilhão
                  </label>
                  <select
                    value={reportData.machine.pavilhao || (reportData.machine.location?.includes('P2') ? 'P2' : 'P1')}
                    onChange={(e) => {
                      const pav = e.target.value;
                      setReportData(prev => ({
                        ...prev,
                        machine: {
                          ...prev.machine,
                          pavilhao: pav,
                          location: pav === 'P1' ? 'Pavilhão 1 (P1)' : pav === 'P2' ? 'Pavilhão 2 (P2)' : prev.machine.location
                        }
                      }));
                    }}
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                  >
                    <option value="P1">Pavilhão 1 (P1 - 01 a 13)</option>
                    <option value="P2">Pavilhão 2 (P2 - A até O)</option>
                    <option value="Geral">Geral / Outro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nº de Série / Fabricante
                  </label>
                  <input
                    type="text"
                    value={reportData.machine.serialNumber || reportData.machine.manufacturer || ''}
                    onChange={(e) => setReportData(prev => ({
                      ...prev,
                      machine: { ...prev.machine, serialNumber: e.target.value, manufacturer: e.target.value }
                    }))}
                    placeholder="Ex: Starmach, Haitian, Tianjian..."
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Horímetro / Horas de Trabalho
                  </label>
                  <input
                    type="text"
                    value={reportData.machine.horometer || ''}
                    onChange={(e) => setReportData(prev => ({
                      ...prev,
                      machine: { ...prev.machine, horometer: e.target.value }
                    }))}
                    placeholder="Ex: 4.850h"
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Localização / Setor na Planta
                </label>
                <input
                  type="text"
                  value={reportData.machine.location || ''}
                  onChange={(e) => setReportData(prev => ({
                    ...prev,
                    machine: { ...prev.machine, location: e.target.value }
                  }))}
                  placeholder="Ex: Pavilhão 1 (P1)"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Cliente Details */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building2 className="w-5 h-5 text-blue-900" />
                <h3 className="text-base font-bold text-slate-900">Dados do Cliente</h3>
              </div>

              {existingClients.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Clientes Recentes:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {existingClients.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectClient(c)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                          reportData.client.name === c.name
                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome do Cliente / Razão Social *
                </label>
                <input
                  type="text"
                  value={reportData.client.name}
                  onChange={(e) => setReportData(prev => ({
                    ...prev,
                    client: { ...prev.client, name: e.target.value }
                  }))}
                  placeholder="Ex: Indústria Metalúrgica Alvorada"
                  className="w-full h-12 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    CNPJ ou CPF
                  </label>
                  <input
                    type="text"
                    value={reportData.client.document || ''}
                    onChange={(e) => setReportData(prev => ({
                      ...prev,
                      client: { ...prev.client, document: e.target.value }
                    }))}
                    placeholder="00.000.000/0000-00"
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Responsável / Contato
                  </label>
                  <input
                    type="text"
                    value={reportData.client.contactPerson || ''}
                    onChange={(e) => setReportData(prev => ({
                      ...prev,
                      client: { ...prev.client, contactPerson: e.target.value }
                    }))}
                    placeholder="Ex: Eng. Marcos Rocha"
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Endereço da Planta / Empresa
                </label>
                <input
                  type="text"
                  value={reportData.client.address || ''}
                  onChange={(e) => setReportData(prev => ({
                    ...prev,
                    client: { ...prev.client, address: e.target.value }
                  }))}
                  placeholder="Rua, número, galpão, cidade"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ETAPA 2: TÉCNICO E AUXILIARES */}
        {/* ============================================================== */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <UserCheck className="w-5 h-5 text-blue-900" />
                <h3 className="text-base font-bold text-slate-900">Técnico Responsável</h3>
              </div>

              {existingTechnicians.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Selecione o Técnico:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {existingTechnicians.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setReportData(prev => ({
                          ...prev,
                          technician: { ...t },
                          signatures: {
                            ...prev.signatures,
                            technician: {
                              ...prev.signatures.technician,
                              name: t.name
                            }
                          }
                        }))}
                        className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                          reportData.technician.name === t.name
                            ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome do Técnico Responsável *
                </label>
                <input
                  type="text"
                  value={reportData.technician.name}
                  onChange={(e) => setReportData(prev => ({
                    ...prev,
                    technician: { ...prev.technician, name: e.target.value }
                  }))}
                  placeholder="Nome do técnico"
                  className="w-full h-12 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Auxiliares */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <label className="block text-base font-bold text-slate-900">
                Auxiliares / Integrantes da Equipe
              </label>
              <p className="text-xs text-slate-500">
                Toque nos nomes para adicionar ou remover da equipe desta manutenção:
              </p>

              <div className="flex flex-wrap gap-2">
                {existingAssistants.map(aux => {
                  const isIncluded = reportData.assistants.includes(aux);
                  return (
                    <button
                      key={aux}
                      type="button"
                      onClick={() => {
                        setReportData(prev => ({
                          ...prev,
                          assistants: isIncluded
                            ? prev.assistants.filter(a => a !== aux)
                            : [...prev.assistants, aux]
                        }));
                      }}
                      className={`h-11 px-4 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all ${
                        isIncluded
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {isIncluded && <Check className="w-4 h-4" />}
                      {aux}
                    </button>
                  );
                })}
              </div>

              {/* Add custom assistant */}
              <div className="pt-2">
                <input
                  type="text"
                  placeholder="Digitar outro auxiliar e pressionar Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const val = e.currentTarget.value.trim();
                      if (!reportData.assistants.includes(val)) {
                        setReportData(prev => ({
                          ...prev,
                          assistants: [...prev.assistants, val]
                        }));
                      }
                      e.currentTarget.value = '';
                    }
                  }}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Horários */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Clock className="w-5 h-5 text-blue-900" />
                <h3 className="text-base font-bold text-slate-900">Data e Horários da Intervenção</h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Data do Serviço
                </label>
                <input
                  type="date"
                  value={reportData.times.date}
                  onChange={(e) => setReportData(prev => ({
                    ...prev,
                    date: e.target.value,
                    times: { ...prev.times, date: e.target.value }
                  }))}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Horário Início
                  </label>
                  <input
                    type="time"
                    value={reportData.times.startTime}
                    onChange={(e) => setReportData(prev => ({
                      ...prev,
                      times: { ...prev.times, startTime: e.target.value }
                    }))}
                    className="w-full h-12 px-3 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Horário Término
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const now = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
                        setReportData(prev => ({
                          ...prev,
                          times: { ...prev.times, endTime: now }
                        }));
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                    >
                      Agora
                    </button>
                  </div>
                  <input
                    type="time"
                    value={reportData.times.endTime}
                    onChange={(e) => setReportData(prev => ({
                      ...prev,
                      times: { ...prev.times, endTime: e.target.value }
                    }))}
                    className="w-full h-12 px-3 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ETAPA 3: DESCRIÇÃO DA MANUTENÇÃO */}
        {/* ============================================================== */}
        {currentStep === 3 && (
          <div className="space-y-5">
            {/* Tipo de manutenção */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tipo de Manutenção
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {(['Preventiva', 'Corretiva', 'Preditiva', 'Instalação', 'Emergencial'] as MaintenanceType[]).map(type => {
                  const isSelected = reportData.maintenanceType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setReportData(prev => ({ ...prev, maintenanceType: type }))}
                      className={`h-13 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status do equipamento */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Status Final do Equipamento
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setReportData(prev => ({ ...prev, equipmentStatus: 'Operacional' }))}
                  className={`h-14 py-2 px-3 rounded-xl border font-bold text-xs sm:text-sm flex flex-col items-center justify-center transition-all ${
                    reportData.equipmentStatus === 'Operacional'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>🟢 Operacional</span>
                  <span className="text-[10px] opacity-80">100% Liberada</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportData(prev => ({ ...prev, equipmentStatus: 'Parcial' }))}
                  className={`h-14 py-2 px-3 rounded-xl border font-bold text-xs sm:text-sm flex flex-col items-center justify-center transition-all ${
                    reportData.equipmentStatus === 'Parcial'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>🟡 Parcial</span>
                  <span className="text-[10px] opacity-80">Com restrição</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportData(prev => ({ ...prev, equipmentStatus: 'Inoperante' }))}
                  className={`h-14 py-2 px-3 rounded-xl border font-bold text-xs sm:text-sm flex flex-col items-center justify-center transition-all ${
                    reportData.equipmentStatus === 'Inoperante'
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>🔴 Inoperante</span>
                  <span className="text-[10px] opacity-80">Parada / Aguardo</span>
                </button>
              </div>
            </div>

            {/* Descrição detalhada */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Descrição dos Serviços Executados *
                </label>
              </div>

              {/* Quick suggestions templates for Injection Molding Machines */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Modelos Rápidos de Texto Técnico:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setReportData(prev => ({
                      ...prev,
                      description: 'Revisão preventiva periódica em injetora. Inspeção completa do sistema hidráulico, bombas e filtros. Reaperto mecânico de placas, tirantes e joelheira. Verificação de resistências, termopares e conexões do painel elétrico. Testes de segurança e ciclo operacional em vazio 100% aprovados.',
                      partsReplaced: prev.partsReplaced || 'Elemento filtrante de retorno, anéis O-Ring de vedação, graxa para joelheira.'
                    }))}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-blue-600" /> Preventiva Injetora Completa
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportData(prev => ({
                      ...prev,
                      description: 'Inspeção e manutenção do circuito hidráulico. Limpeza do filtro de sucção, substituição do elemento filtrante de retorno e dreno de condensados. Aferição da pressão de trabalho da bomba e proporcional sem vazamentos.',
                      partsReplaced: prev.partsReplaced || 'Filtro de retorno hidráulico, 20L Óleo ISO VG 68.'
                    }))}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition-colors"
                  >
                    Hidráulica & Filtros
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportData(prev => ({
                      ...prev,
                      description: 'Revisão mecânica do conjunto de fechamento. Lubrificação e engraxamento de colunas, buchas e articulações da joelheira. Verificação de alinhamento e paralelismo entre placas fixa e móvel.',
                      partsReplaced: prev.partsReplaced || 'Graxa especial para altas cargas e articulações.'
                    }))}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition-colors"
                  >
                    Mecânica & Joelheira
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportData(prev => ({
                      ...prev,
                      description: 'Inspeção e teste dos dispositivos de segurança (NR-12). Verificação de travas mecânicas das portas frontal e traseira, micro-chaves elétricas, válvula de segurança hidráulica de fechamento e botões de emergência com parada imediata.',
                    }))}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition-colors"
                  >
                    Segurança & NR-12
                  </button>
                </div>
              </div>

              <textarea
                rows={5}
                value={reportData.description}
                onChange={(e) => setReportData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva de forma clara os serviços realizados, ajustes, medições e procedimentos executados pelo time técnico..."
                className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
              />
            </div>

            {/* Peças e materiais */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Peças e Materiais Substituídos / Utilizados
              </label>
              <textarea
                rows={3}
                value={reportData.partsReplaced || ''}
                onChange={(e) => setReportData(prev => ({ ...prev, partsReplaced: e.target.value }))}
                placeholder="Ex: Filtro de ar mod. 22B, 15L Óleo ISO VG 68, Anéis de vedação Viton..."
                className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ETAPA 4: CHECKLIST (27 ITENS OFICIAIS DE INJETORAS) */}
        {/* ============================================================== */}
        {currentStep === 4 && (() => {
          const conformeCount = reportData.checklist.filter(i => i.status === 'conforme').length;
          const naoConformeCount = reportData.checklist.filter(i => i.status === 'nao_conforme').length;
          const naoAplicaCount = reportData.checklist.filter(i => i.status === 'nao_aplica').length;

          const filteredChecklist = reportData.checklist.filter(item => {
            if (selectedChecklistCategory === 'TODOS') return true;
            return item.category === selectedChecklistCategory;
          });

          return (
            <div className="space-y-4">
              {/* Header Box */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Checklist Técnico de Injetora (27 Itens)
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Toque rápido para selecionar a conformidade de cada item:
                    </p>
                  </div>

                  {/* Summary Pills */}
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <span className="px-2 py-0.8 rounded-lg bg-emerald-100 text-emerald-800">
                      {conformeCount} Conformes
                    </span>
                    {naoConformeCount > 0 && (
                      <span className="px-2 py-0.8 rounded-lg bg-red-100 text-red-800">
                        {naoConformeCount} Não Conformes
                      </span>
                    )}
                    {naoAplicaCount > 0 && (
                      <span className="px-2 py-0.8 rounded-lg bg-slate-100 text-slate-700">
                        {naoAplicaCount} N/A
                      </span>
                    )}
                  </div>
                </div>

                {/* Fast Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAllChecklist('conforme')}
                    className="h-10 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Check className="w-4 h-4 stroke-[3]" /> Marcar Todos Conforme (27)
                  </button>

                  {selectedChecklistCategory !== 'TODOS' && (
                    <button
                      type="button"
                      onClick={() => setAllChecklist('conforme', selectedChecklistCategory)}
                      className="h-10 px-3 bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold text-xs rounded-xl transition-all"
                    >
                      Marcar {selectedChecklistCategory} Conforme
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setAllChecklist('nao_aplica')}
                    className="h-10 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                  >
                    Marcar Todos N/A
                  </button>
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="grid grid-cols-5 gap-1.5 bg-slate-200/80 p-1.5 rounded-2xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedChecklistCategory('TODOS')}
                  className={`py-2 px-1 rounded-xl text-center transition-all ${
                    selectedChecklistCategory === 'TODOS'
                      ? 'bg-blue-900 text-white shadow-xs font-black'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  TODOS (27)
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedChecklistCategory('Hidráulica')}
                  className={`py-2 px-1 rounded-xl text-center transition-all ${
                    selectedChecklistCategory === 'Hidráulica'
                      ? 'bg-blue-900 text-white shadow-xs font-black'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  HIDRÁULICA (10)
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedChecklistCategory('Mecânica')}
                  className={`py-2 px-1 rounded-xl text-center transition-all ${
                    selectedChecklistCategory === 'Mecânica'
                      ? 'bg-blue-900 text-white shadow-xs font-black'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  MECÂNICA (8)
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedChecklistCategory('Elétrica')}
                  className={`py-2 px-1 rounded-xl text-center transition-all ${
                    selectedChecklistCategory === 'Elétrica'
                      ? 'bg-blue-900 text-white shadow-xs font-black'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  ELÉTRICA (4)
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedChecklistCategory('Segurança')}
                  className={`py-2 px-1 rounded-xl text-center transition-all ${
                    selectedChecklistCategory === 'Segurança'
                      ? 'bg-blue-900 text-white shadow-xs font-black'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  SEGURANÇA (5)
                </button>
              </div>

              {/* Checklist Items List */}
              <div className="space-y-3">
                {filteredChecklist.map((item) => {
                  const globalIdx = reportData.checklist.findIndex(i => i.id === item.id);
                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2.5 mb-2.5">
                        <div className="flex items-start gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 font-mono text-xs font-black flex items-center justify-center shrink-0">
                            {String(globalIdx + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <span className="text-sm font-bold text-slate-900 leading-snug block">
                              {item.label}
                            </span>
                            {item.category && (
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                {item.category}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Current Status Pill */}
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                            item.status === 'conforme'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'nao_conforme'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.status === 'conforme' ? 'Conforme' : item.status === 'nao_conforme' ? 'Não Conforme' : 'N/A'}
                        </span>
                      </div>

                      {/* 3 Large Touch Buttons (Mobile Friendly) */}
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => updateChecklistItem(item.id, { status: 'conforme' })}
                          className={`h-12 rounded-xl text-xs font-black flex items-center justify-center border transition-all active:scale-[0.98] ${
                            item.status === 'conforme'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-400/30'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50'
                          }`}
                        >
                          Conforme
                        </button>

                        <button
                          type="button"
                          onClick={() => updateChecklistItem(item.id, { status: 'nao_conforme' })}
                          className={`h-12 rounded-xl text-xs font-black flex items-center justify-center border transition-all active:scale-[0.98] ${
                            item.status === 'nao_conforme'
                              ? 'bg-red-600 text-white border-red-600 shadow-xs ring-2 ring-red-400/30'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-red-50'
                          }`}
                        >
                          Não Conforme
                        </button>

                        <button
                          type="button"
                          onClick={() => updateChecklistItem(item.id, { status: 'nao_aplica' })}
                          className={`h-12 rounded-xl text-xs font-black flex items-center justify-center border transition-all active:scale-[0.98] ${
                            item.status === 'nao_aplica'
                              ? 'bg-slate-700 text-white border-slate-700 shadow-xs ring-2 ring-slate-400/30'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Não se Aplica
                        </button>
                      </div>

                      {/* Optional notes */}
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => updateChecklistItem(item.id, { notes: e.target.value })}
                        placeholder="Observação técnica deste item (opcional)..."
                        className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ============================================================== */}
        {/* ETAPA 5: FOTOS */}
        {/* ============================================================== */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <PhotoUploader
              title="FOTOS ANTES DA MANUTENÇÃO"
              photos={reportData.photosBefore}
              onChange={(photos) => setReportData(prev => ({ ...prev, photosBefore: photos }))}
              accentBadge="Antes"
            />

            <PhotoUploader
              title="FOTOS DEPOIS DA MANUTENÇÃO"
              photos={reportData.photosAfter}
              onChange={(photos) => setReportData(prev => ({ ...prev, photosAfter: photos }))}
              accentBadge="Depois"
            />
          </div>
        )}

        {/* ============================================================== */}
        {/* ETAPA 6: OBSERVAÇÕES E ASSINATURAS */}
        {/* ============================================================== */}
        {currentStep === 6 && (
          <div className="space-y-5">
            {/* Observações gerais */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Observações Técnicas Gerais
              </label>
              <textarea
                rows={3}
                value={reportData.observations || ''}
                onChange={(e) => setReportData(prev => ({ ...prev, observations: e.target.value }))}
                placeholder="Ex: Equipamento testado e liberado para produção sem pendências..."
                className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
              />
            </div>

            {/* Recomendações futuras */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Recomendações Futuras e Preventivas
              </label>
              <textarea
                rows={3}
                value={reportData.futureRecommendations || ''}
                onChange={(e) => setReportData(prev => ({ ...prev, futureRecommendations: e.target.value }))}
                placeholder="Ex: Próxima troca de fluido hidráulico prevista para 500h de trabalho..."
                className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
              />
            </div>

            {/* Assinatura do Técnico */}
            <SignaturePad
              label="Assinatura do Técnico Responsável"
              initialValue={reportData.signatures.technician.signatureImage}
              signerName={reportData.signatures.technician.name}
              onSignerNameChange={(name) => setReportData(prev => ({
                ...prev,
                signatures: {
                  ...prev.signatures,
                  technician: { ...prev.signatures.technician, name }
                }
              }))}
              onSave={(dataUrl) => setReportData(prev => ({
                ...prev,
                signatures: {
                  ...prev.signatures,
                  technician: { ...prev.signatures.technician, signatureImage: dataUrl }
                }
              }))}
            />

            {/* Assinatura do Cliente */}
            <SignaturePad
              label="Assinatura do Responsável pelo Cliente"
              initialValue={reportData.signatures.clientResponsible.signatureImage}
              signerName={reportData.signatures.clientResponsible.name}
              onSignerNameChange={(name) => setReportData(prev => ({
                ...prev,
                signatures: {
                  ...prev.signatures,
                  clientResponsible: { ...prev.signatures.clientResponsible, name }
                }
              }))}
              signerDocument={reportData.signatures.clientResponsible.document}
              onSignerDocumentChange={(doc) => setReportData(prev => ({
                ...prev,
                signatures: {
                  ...prev.signatures,
                  clientResponsible: { ...prev.signatures.clientResponsible, document: doc }
                }
              }))}
              documentLabel="CPF / RG / Cargo do Cliente"
              onSave={(dataUrl) => setReportData(prev => ({
                ...prev,
                signatures: {
                  ...prev.signatures,
                  clientResponsible: { ...prev.signatures.clientResponsible, signatureImage: dataUrl }
                }
              }))}
            />
          </div>
        )}

        {/* ============================================================== */}
        {/* ETAPA 7: REVISÃO E FINALIZAÇÃO */}
        {/* ============================================================== */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Conferência do Relatório
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">
                    {reportData.machine.name}
                  </h3>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  {reportData.equipmentStatus}
                </span>
              </div>

              {/* Summary Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block font-bold">CLIENTE</span>
                  <span className="font-bold text-slate-800 text-sm">{reportData.client.name}</span>
                  <span className="text-slate-500 block">{reportData.client.contactPerson}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block font-bold">MÁQUINA</span>
                  <span className="font-bold text-slate-800 text-sm">{reportData.machine.tag || reportData.machine.model}</span>
                  <span className="text-slate-500 block">Horímetro: {reportData.machine.horometer || '---'}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block font-bold">TÉCNICO</span>
                  <span className="font-bold text-slate-800">{reportData.technician.name}</span>
                  <span className="text-slate-500 block">{reportData.times.startTime} às {reportData.times.endTime}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block font-bold">TIPO DE SERVIÇO</span>
                  <span className="font-bold text-blue-900">{reportData.maintenanceType}</span>
                  <span className="text-slate-500 block">{reportData.date}</span>
                </div>
              </div>

              {/* Checklist & Photos Counts */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block font-bold">CHECKLIST</span>
                  <span className="text-base font-extrabold text-slate-800">
                    {reportData.checklist.filter(c => c.status === 'conforme').length}/{reportData.checklist.length}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">Conformes</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block font-bold">FOTOS ANTES</span>
                  <span className="text-base font-extrabold text-blue-900">
                    {reportData.photosBefore.length}
                  </span>
                  <span className="text-[10px] text-slate-500">Registradas</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block font-bold">FOTOS DEPOIS</span>
                  <span className="text-base font-extrabold text-blue-900">
                    {reportData.photosAfter.length}
                  </span>
                  <span className="text-[10px] text-slate-500">Registradas</span>
                </div>
              </div>

              {/* Assinaturas Status */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${reportData.signatures.technician.signatureImage ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className="font-bold text-slate-700">Assinatura Técnico: {reportData.signatures.technician.signatureImage ? 'OK' : 'Pendente'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${reportData.signatures.clientResponsible.signatureImage ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className="font-bold text-slate-700">Assinatura Cliente: {reportData.signatures.clientResponsible.signatureImage ? 'OK' : 'Pendente'}</span>
                </div>
              </div>

              {/* Big Finalize Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFinishReport}
                  disabled={isSubmitting}
                  className="w-full h-16 bg-blue-900 hover:bg-blue-800 active:scale-[0.98] text-white text-base sm:text-lg font-extrabold rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-blue-950/20 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sincronizando e Gerando PDF...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      <span>FINALIZAR E GERAR RELATÓRIO</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* FIXED BOTTOM NAVIGATION BAR */}
      {/* ============================================================== */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:p-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={isSubmitting}
            className="h-14 px-5 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-800 font-extrabold rounded-xl border border-slate-300 flex items-center justify-center gap-2 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
            <span className="text-sm sm:text-base">{currentStep === 1 ? 'Cancelar' : 'Voltar'}</span>
          </button>

          {currentStep < 7 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 h-14 bg-blue-900 hover:bg-blue-800 active:scale-[0.98] text-white font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-950/10 transition-all"
            >
              <span className="text-sm sm:text-base">Continuar</span>
              <ArrowRight className="w-5 h-5 text-blue-200" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishReport}
              disabled={isSubmitting}
              className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-950/10 transition-all"
            >
              <Check className="w-5 h-5" />
              <span className="text-sm sm:text-base">Finalizar Relatório</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
