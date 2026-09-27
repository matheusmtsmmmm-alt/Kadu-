import React, { useEffect, useState } from 'react';
import { X, Download, Share2, Printer, Loader2 } from 'lucide-react';
import { MaintenanceReport, CompanySettings } from '../types';
import { getReportPdfBlob, downloadReportPdf, shareReportPdf } from '../services/pdfGenerator';

interface PdfViewerModalProps {
  report: MaintenanceReport;
  settings: CompanySettings;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  report,
  settings,
  onClose
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let currentUrl = '';
    const loadPdf = async () => {
      try {
        setIsLoading(true);
        const blob = await getReportPdfBlob(report, settings);
        currentUrl = URL.createObjectURL(blob);
        setBlobUrl(currentUrl);
      } catch (err) {
        console.error('Failed to create PDF blob:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadPdf();

    return () => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [report, settings]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex flex-col">
      {/* Top bar */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              Visualização do PDF
            </h3>
            <p className="text-xs text-slate-400">
              {report.code}  •  {report.machine.name}
            </p>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadReportPdf(report, settings)}
            className="h-10 px-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Baixar</span>
          </button>

          <button
            type="button"
            onClick={() => shareReportPdf(report, settings)}
            className="h-10 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Compartilhar</span>
          </button>
        </div>
      </div>

      {/* Viewer Body */}
      <div className="flex-1 bg-slate-950 flex items-center justify-center p-2 sm:p-4 overflow-hidden relative">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 text-white">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-sm font-semibold">Renderizando PDF com fotos de alta qualidade...</span>
          </div>
        ) : blobUrl ? (
          <iframe
            src={blobUrl}
            title="Relatório PDF"
            className="w-full h-full max-w-5xl rounded-lg bg-white shadow-2xl border border-slate-800"
          />
        ) : (
          <div className="text-center text-slate-400 p-8">
            <p className="text-sm">Não foi possível carregar a prévia do PDF diretamente.</p>
            <button
              onClick={() => downloadReportPdf(report, settings)}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
            >
              Baixar Arquivo PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
