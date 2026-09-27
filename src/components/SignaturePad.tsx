import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Check, PenTool } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  initialValue?: string;
  onSave: (dataUrl: string) => void;
  signerName: string;
  onSignerNameChange?: (name: string) => void;
  signerDocument?: string;
  onSignerDocumentChange?: (doc: string) => void;
  documentLabel?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  label,
  initialValue = '',
  onSave,
  signerName,
  onSignerNameChange,
  signerDocument,
  onSignerDocumentChange,
  documentLabel = 'Documento / Cargo'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(Boolean(initialValue));
  const [savedData, setSavedData] = useState(initialValue);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0f172a';

    if (initialValue) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = initialValue;
    }
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveCurrentCanvas();
  };

  const saveCurrentCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSavedData(dataUrl);
    onSave(dataUrl);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSavedData('');
    onSave('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PenTool className="w-5 h-5 text-blue-900" />
          <h4 className="text-base font-bold text-slate-900">{label}</h4>
        </div>
        {hasSignature && (
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-md">
            <Check className="w-3.5 h-3.5" /> Assinado
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Nome Completo
          </label>
          <input
            type="text"
            value={signerName}
            onChange={(e) => onSignerNameChange && onSignerNameChange(e.target.value)}
            placeholder="Nome de quem assina"
            className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
          />
        </div>

        {onSignerDocumentChange && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {documentLabel}
            </label>
            <input
              type="text"
              value={signerDocument || ''}
              onChange={(e) => onSignerDocumentChange(e.target.value)}
              placeholder="Ex: CPF, RG ou Cargo"
              className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
            />
          </div>
        )}
      </div>

      <div className="relative">
        <p className="text-xs text-slate-500 mb-1.5 font-medium">
          Assine na caixa abaixo com o dedo ou caneta touch:
        </p>
        <div className="relative border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50/50 touch-none">
          <canvas
            ref={canvasRef}
            className="w-full h-40 cursor-crosshair block touch-none"
            style={{ touchAction: 'none' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          <div className="pointer-events-none absolute bottom-5 left-8 right-8 border-b border-slate-300 flex justify-center pb-1">
            <span className="text-[11px] text-slate-400 font-medium select-none">
              Linha de assinatura
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-2">
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Limpar Assinatura
        </button>
        <span className="text-xs text-slate-400">
          {hasSignature ? 'Assinatura registrada' : 'Aguardando assinatura'}
        </span>
      </div>
    </div>
  );
};
