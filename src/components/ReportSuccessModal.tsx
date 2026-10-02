import React, { useState } from 'react';
import { 
  CheckCircle2, 
  FileText, 
  Download, 
  Send, 
  Mail, 
  Home, 
  X,
  Copy,
  ExternalLink,
  Eye
} from 'lucide-react';
import { MaintenanceReport, CompanySettings } from '../types';
import { downloadReportPdf, shareReportPdf } from '../services/pdfGenerator';

interface ReportSuccessModalProps {
  report: MaintenanceReport;
  settings: CompanySettings;
  onClose: () => void;
}

export const ReportSuccessModal: React.FC<ReportSuccessModalProps> = ({
  report,
  settings,
  onClose
}) => {
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // WhatsApp formatted message template
  const defaultWaMsg = `Olá! Segue o relatório de manutenção da máquina *${report.machine.tag ? `[${report.machine.tag}] ` : ''}${report.machine.name}*, realizado em *${report.date}* pela Kadu Manutenções.\n\nCódigo do Relatório: *${report.code}*\nTécnico: *${report.technician.name}*\nStatus: *${report.equipmentStatus}*\n\nAtenciosamente,\n*Kadu Manutenções*`;
  const [whatsappText, setWhatsappText] = useState(defaultWaMsg);

  // Email formatted message template
  const defaultSubject = `Relatório de Manutenção - Máquina ${report.machine.tag || report.machine.name} - ${report.date}`;
  const defaultEmailBody = `Olá,\n\nSegue em anexo o relatório de manutenção referente à máquina ${report.machine.name} (${report.machine.tag || 'S/N'}).\n\nNúmero do Relatório: ${report.code}\nData de Realização: ${report.date}\nTécnico Responsável: ${report.technician.name}\nSituação Final: ${report.equipmentStatus}\n\nAtenciosamente,\nKadu Manutenções\n${settings.phone} | ${settings.email}`;
  
  const [emailTo, setEmailTo] = useState(report.client.phone?.includes('@') ? report.client.phone : '');
  const [emailSubject, setEmailSubject] = useState(defaultSubject);
  const [emailBody, setEmailBody] = useState(defaultEmailBody);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadReportPdf(report, settings);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendWhatsapp = async () => {
    // Attempt native file share first if supported so PDF is attached
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await shareReportPdf(report, settings);
      } catch {
        // continue to whatsapp link
      }
    }
    const encoded = encodeURIComponent(whatsappText);
    const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    const a = document.createElement('a');
    a.href = waUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setShowWhatsappModal(false);
  };

  const handleSendEmail = async () => {
    // Download PDF so the technician has the file ready to attach
    await downloadReportPdf(report, settings);
    const mailto = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    const a = document.createElement('a');
    a.href = mailto;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setShowEmailModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Success Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            Sincronizado Online
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">
            RELATÓRIO FINALIZADO
          </h2>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            {report.code}  •  {report.machine.name}
          </p>
        </div>

        {/* Action Buttons: Baixar, WhatsApp, E-mail */}
        <div className="space-y-3">
          {/* 1. Baixar PDF */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full h-14 bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-base rounded-2xl flex items-center justify-center gap-3 shadow-md shadow-blue-950/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Download className="w-5 h-5 text-blue-200" />
            <span>{isDownloading ? 'Gerando Arquivo...' : 'BAIXAR PDF'}</span>
          </button>

          {/* 2. Enviar pelo WhatsApp */}
          <button
            type="button"
            onClick={() => setShowWhatsappModal(true)}
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base rounded-2xl flex items-center justify-center gap-3 shadow-md shadow-emerald-950/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Send className="w-5 h-5 text-emerald-200" />
            <span>ENVIAR PELO WHATSAPP</span>
          </button>

          {/* 3. Enviar por E-mail */}
          <button
            type="button"
            onClick={() => setShowEmailModal(true)}
            className="w-full h-14 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-base rounded-2xl border border-slate-300 flex items-center justify-center gap-3 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Mail className="w-5 h-5 text-slate-600" />
            <span>ENVIAR POR E-MAIL</span>
          </button>
        </div>

        {/* Back to Home */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-900 transition-colors"
          >
            <Home className="w-4 h-4" />
            Voltar para a Tela Inicial
          </button>
        </div>
      </div>

      {/* WhatsApp Modal with editable text */}
      {showWhatsappModal && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-base">
                <Send className="w-5 h-5" /> Enviar pelo WhatsApp
              </div>
              <button
                onClick={() => setShowWhatsappModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-2">
              Você pode conferir ou editar a mensagem antes de abrir o WhatsApp:
            </p>

            <textarea
              rows={6}
              value={whatsappText}
              onChange={(e) => setWhatsappText(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none mb-4"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowWhatsappModal(false)}
                className="flex-1 h-12 bg-slate-100 text-slate-700 font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendWhatsapp}
                className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4" /> Abrir WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal with recipient, subject & body */}
      {showEmailModal && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-blue-900 font-extrabold text-base">
                <Mail className="w-5 h-5" /> Enviar por E-mail
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Destinatário (E-mail)</label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="cliente@empresa.com.br"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Assunto</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Mensagem</label>
                <textarea
                  rows={4}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-700 shrink-0" />
                <span>O PDF é baixado automaticamente para ser anexado ao seu e-mail.</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="flex-1 h-12 bg-slate-100 text-slate-700 font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                className="flex-1 h-12 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-sm"
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
