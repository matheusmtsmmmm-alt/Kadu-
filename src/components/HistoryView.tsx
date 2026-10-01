import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  FileText, 
  Download, 
  Share2, 
  Eye, 
  ArrowLeft,
  X,
  Send,
  Mail,
  Trash2
} from 'lucide-react';
import { MaintenanceReport, CompanySettings } from '../types';
import { downloadReportPdf, shareReportPdf } from '../services/pdfGenerator';
import { MachineBadge } from './MachineBadge';

interface HistoryViewProps {
  reports: MaintenanceReport[];
  settings: CompanySettings;
  onBack: () => void;
  onViewPdf: (report: MaintenanceReport) => void;
  onDeleteReport: (id: string) => Promise<void>;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  reports,
  settings,
  onBack,
  onViewPdf,
  onDeleteReport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Finalizado' | 'Em andamento'>('all');
  const [selectedReport, setSelectedReport] = useState<MaintenanceReport | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [whatsappReport, setWhatsappReport] = useState<MaintenanceReport | null>(null);
  const [emailReport, setEmailReport] = useState<MaintenanceReport | null>(null);
  const [whatsappText, setWhatsappText] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Filter reports
  const filteredReports = reports.filter(r => {
    const matchesSearch = 
      r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.machine.tag && r.machine.tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.technician.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDownload = async (report: MaintenanceReport) => {
    setActionLoading(true);
    try {
      await downloadReportPdf(report, settings);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleShare = async (report: MaintenanceReport) => {
    setActionLoading(true);
    try {
      await shareReportPdf(report, settings);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenWhatsapp = (report: MaintenanceReport) => {
    const tagPart = report.machine.tag ? `[${report.machine.tag}] ` : '';
    const msg = `Olá! Segue o relatório de manutenção da máquina *${tagPart}${report.machine.name}*, realizado em *${report.date}* pela Kadu Manutenções.\n\nCódigo do Relatório: *${report.code}*\nTécnico: *${report.technician.name}*\nSituação: *${report.equipmentStatus}*\n\nAtenciosamente,\n*Kadu Manutenções*`;
    setWhatsappText(msg);
    setWhatsappReport(report);
  };

  const handleSendWhatsapp = () => {
    const encoded = encodeURIComponent(whatsappText);
    const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    const a = document.createElement('a');
    a.href = waUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setWhatsappReport(null);
  };

  const handleOpenEmail = (report: MaintenanceReport) => {
    const tagPart = report.machine.tag ? ` (${report.machine.tag})` : '';
    const subject = `Relatório de Manutenção - Máquina ${report.machine.tag || report.machine.name} - ${report.date}`;
    const body = `Olá,\n\nSegue em anexo o relatório de manutenção referente à máquina ${report.machine.name}${tagPart}.\n\nNúmero do Relatório: ${report.code}\nData de Realização: ${report.date}\nTécnico Responsável: ${report.technician.name}\nSituação Final: ${report.equipmentStatus}\n\nAtenciosamente,\nKadu Manutenções\n${settings.phone} | ${settings.email}`;
    setEmailTo(report.client.phone?.includes('@') ? report.client.phone : '');
    setEmailSubject(subject);
    setEmailBody(body);
    setEmailReport(report);
  };

  const handleSendEmail = async () => {
    if (emailReport) {
      await downloadReportPdf(emailReport, settings);
    }
    const mailto = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    const a = document.createElement('a');
    a.href = mailto;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setEmailReport(null);
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;
    await onDeleteReport(reportToDelete);
    if (selectedReport?.id === reportToDelete) {
      setSelectedReport(null);
    }
    setReportToDelete(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-20">
      {/* Header */}
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
              <h2 className="text-lg font-extrabold text-slate-900">Histórico de Relatórios</h2>
              <p className="text-xs text-slate-500 font-medium">{filteredReports.length} relatórios cadastrados</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Search & Filter */}
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por máquina, nº relatório, cliente ou técnico..."
              className="w-full h-12 pl-11 pr-4 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-600 transition-colors shadow-xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Segmented status filter */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({reports.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Finalizado')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                statusFilter === 'Finalizado'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Finalizados
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Em andamento')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                statusFilter === 'Em andamento'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pendentes
            </button>
          </div>
        </div>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-base font-bold text-slate-700">Nenhum relatório encontrado</p>
            <p className="text-xs text-slate-400 mt-1">Tente ajustar a busca ou filtre por outro status.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-start gap-3.5">
                  <MachineBadge machine={report.machine} size="md" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black tracking-wider text-blue-900 font-mono">
                        RELATÓRIO {report.code}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          report.status === 'Finalizado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug truncate">
                      {report.machine.name} {report.machine.tag ? `(${report.machine.tag})` : ''}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium truncate">
                      Cliente: {report.client.name}
                    </p>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 mt-2">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {report.date}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Técnico: {report.technician.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Big Clean Action Button as requested in spec: [ ABRIR ] */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReport(report)}
                    className="flex-1 h-12 bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-xs"
                  >
                    <FileText className="w-4 h-4 text-blue-200" />
                    <span>ABRIR RELATÓRIO</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportToDelete(report.id)}
                    className="w-12 h-12 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center border border-slate-200 transition-colors"
                    title="Excluir relatório"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail / Action Modal when clicking [ ABRIR ] */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-xs font-bold text-blue-900 font-mono">
                  {selectedReport.code}
                </span>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  {selectedReport.machine.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 mb-5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div><strong className="text-slate-500">Cliente:</strong> <span className="text-slate-900 font-bold">{selectedReport.client.name}</span></div>
                <div><strong className="text-slate-500">Data:</strong> <span className="text-slate-800">{selectedReport.date}</span></div>
                <div><strong className="text-slate-500">Técnico:</strong> <span className="text-slate-800">{selectedReport.technician.name}</span></div>
                <div><strong className="text-slate-500">Fotos:</strong> <span className="text-slate-800 font-semibold">{selectedReport.photosBefore.length} Antes / {selectedReport.photosAfter.length} Depois</span></div>
                <div><strong className="text-slate-500">Status:</strong> <span className="text-emerald-700 font-bold">{selectedReport.equipmentStatus} ({selectedReport.status})</span></div>
              </div>
            </div>

            {/* Exactly as requested in prompt:
                [ VISUALIZAR ]
                [ BAIXAR PDF ]
                [ COMPARTILHAR ]
                [ WHATSAPP ]
                [ E-MAIL ]
            */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  onViewPdf(selectedReport);
                  setSelectedReport(null);
                }}
                className="w-full h-13 bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition-all"
              >
                <Eye className="w-5 h-5 text-blue-200" />
                <span>VISUALIZAR PDF</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownload(selectedReport)}
                disabled={actionLoading}
                className="w-full h-13 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition-all"
              >
                <Download className="w-5 h-5 text-slate-300" />
                <span>BAIXAR PDF</span>
              </button>

              <button
                type="button"
                onClick={() => handleShare(selectedReport)}
                disabled={actionLoading}
                className="w-full h-13 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-sm rounded-xl border border-slate-300 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <Share2 className="w-5 h-5 text-slate-600" />
                <span>COMPARTILHAR</span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenWhatsapp(selectedReport);
                    setSelectedReport(null);
                  }}
                  className="h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition-all"
                >
                  <Send className="w-4 h-4 text-emerald-100" />
                  <span>WHATSAPP</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleOpenEmail(selectedReport);
                    setSelectedReport(null);
                  }}
                  className="h-12 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-300 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <Mail className="w-4 h-4 text-slate-600" />
                  <span>E-MAIL</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {reportToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Excluir Relatório?</h3>
            <p className="text-xs text-slate-500 mb-5">
              Esta ação removerá este relatório permanentemente de todos os dispositivos.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setReportToDelete(null)}
                className="h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="h-11 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {whatsappReport && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Enviar pelo WhatsApp</h3>
              </div>
              <button onClick={() => setWhatsappReport(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-2">Mensagem que será enviada:</p>
            <textarea
              rows={6}
              value={whatsappText}
              onChange={(e) => setWhatsappText(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 mb-4 focus:bg-white focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWhatsappReport(null)}
                className="h-11 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendWhatsapp}
                className="h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Send className="w-4 h-4" /> Abrir no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {emailReport && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-900" />
                <h3 className="text-base font-bold text-slate-900">Enviar por E-mail</h3>
              </div>
              <button onClick={() => setEmailReport(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 mb-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Para (E-mail do Cliente):</label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="cliente@empresa.com.br"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Assunto:</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Mensagem:</label>
                <textarea
                  rows={4}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEmailReport(null)}
                className="h-11 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                className="h-11 bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Mail className="w-4 h-4" /> Abrir no E-mail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
