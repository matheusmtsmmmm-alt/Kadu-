import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, ZoomIn, X, Plus } from 'lucide-react';
import { ReportPhoto } from '../types';
import { uploadPhotoFile } from '../services/api';

interface PhotoUploaderProps {
  title: string;
  photos: ReportPhoto[];
  onChange: (photos: ReportPhoto[]) => void;
  accentBadge?: string;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  title,
  photos,
  onChange,
  accentBadge
}) => {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedPhotoForZoom, setSelectedPhotoForZoom] = useState<ReportPhoto | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Compress image before saving to optimize performance & storage
  const processImageFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1280;
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
            // High quality JPEG
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            resolve(dataUrl);
          }
        };
        img.onerror = reject;
        img.src = dataUrl;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsProcessing(true);

    try {
      const newItems: ReportPhoto[] = [];
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const compressedBase64 = await processImageFile(file);
        
        // Persist to backend/Supabase storage
        const savedUrl = await uploadPhotoFile(compressedBase64);

        newItems.push({
          id: `ph_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          url: savedUrl,
          caption: '',
          timestamp: timeStr
        });
      }

      onChange([...photos, ...newItems]);
    } catch (err) {
      console.error('Error handling photos:', err);
    } finally {
      setIsProcessing(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (id: string) => {
    onChange(photos.filter(p => p.id !== id));
  };

  const handleCaptionChange = (id: string, caption: string) => {
    onChange(photos.map(p => p.id === id ? { ...p, caption } : p));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {title}
            </h3>
            {accentBadge && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                {accentBadge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {photos.length === 0 ? 'Nenhuma foto adicionada ainda' : `${photos.length} ${photos.length === 1 ? 'foto registrada' : 'fotos registradas'}`}
          </p>
        </div>

        {/* Counter */}
        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
          {photos.length} fotos
        </span>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isProcessing}
          className="h-14 flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl active:scale-[0.98] transition-all shadow-sm"
        >
          <Camera className="w-5 h-5 text-blue-200" />
          <span className="text-sm">Tirar Foto</span>
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={isProcessing}
          className="h-14 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl border border-slate-300 active:scale-[0.98] transition-all"
        >
          <ImageIcon className="w-5 h-5 text-slate-600" />
          <span className="text-sm">Da Galeria</span>
        </button>
      </div>

      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {isProcessing && (
        <div className="p-4 mb-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center gap-3">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-blue-900">Processando e otimizando fotos...</span>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length === 0 ? (
        <div
          onClick={() => galleryInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
            <Plus className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Toque para adicionar fotos</p>
          <p className="text-xs text-slate-400 mt-1">Câmera ou Galeria do celular</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {photos.map((item, index) => (
            <div
              key={item.id}
              className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col"
            >
              {/* Image preview with action overlays */}
              <div className="relative aspect-[4/3] bg-slate-900">
                <img
                  src={item.url}
                  alt={`Registro ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Number badge */}
                <div className="absolute top-2 left-2 bg-slate-950/80 text-white text-xs font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                  #{index + 1}
                </div>

                {/* Actions */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedPhotoForZoom(item)}
                    className="w-8 h-8 rounded-full bg-slate-950/70 text-white hover:bg-slate-950 flex items-center justify-center backdrop-blur-sm transition-colors"
                    title="Ampliar foto"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(item.id)}
                    className="w-8 h-8 rounded-full bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                    title="Excluir foto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {item.timestamp && (
                  <div className="absolute bottom-2 right-2 bg-slate-950/70 text-white text-[10px] font-mono px-1.5 py-0.5 rounded backdrop-blur-sm">
                    {item.timestamp}
                  </div>
                )}
              </div>

              {/* Caption input */}
              <div className="p-2.5 bg-white border-t border-slate-200 flex-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Legenda da Foto
                </label>
                <input
                  type="text"
                  value={item.caption || ''}
                  onChange={(e) => handleCaptionChange(item.id, e.target.value)}
                  placeholder="Ex: Cilindro hidráulico com vazamento"
                  className="w-full h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Zoom Preview */}
      {selectedPhotoForZoom && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setSelectedPhotoForZoom(null)}
              className="absolute -top-12 right-0 text-white hover:text-slate-300 p-2 flex items-center gap-1 text-sm font-semibold"
            >
              <X className="w-6 h-6" /> Fechar
            </button>
            <img
              src={selectedPhotoForZoom.url}
              alt="Ampliada"
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            {selectedPhotoForZoom.caption && (
              <p className="text-white text-sm font-medium mt-3 bg-slate-900/80 px-4 py-2 rounded-lg text-center">
                {selectedPhotoForZoom.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
