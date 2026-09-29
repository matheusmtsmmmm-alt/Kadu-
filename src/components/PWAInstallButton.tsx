import React, { useState } from 'react';
import { Smartphone, Download, Share2, PlusSquare, X, CheckCircle, ArrowDown } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'settings';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already installed and running standalone as an app on home screen, hide
  if (isInstalled) {
    return null;
  }

  // Header compact button
  if (variant === 'header') {
    return (
      <>
        <button
          type="button"
          onClick={async () => {
            if (isInstallable) {
              await install();
            } else {
              setShowGuide(true);
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          title="Baixar App para a tela inicial"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Baixar App</span>
        </button>

        {showGuide && (
          <InstallGuideModal isIOS={isIOS} onClose={() => setShowGuide(false)} />
        )}
      </>
    );
  }

  // Banner variant on home screen
  return (
    <>
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-blue-950 text-white p-4 rounded-2xl border border-blue-800/60 shadow-md relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center shrink-0 mt-0.5">
              <Smartphone className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">Instalar no Celular</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Coloque o ícone da Kadu Manutenções na tela inicial do seu celular para acesso rápido em 1 toque.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              if (isInstallable) {
                await install();
              } else {
                setShowGuide(true);
              }
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar</span>
          </button>
        </div>
      </div>

      {showGuide && (
        <InstallGuideModal isIOS={isIOS} onClose={() => setShowGuide(false)} />
      )}
    </>
  );
};

interface InstallGuideModalProps {
  isIOS: boolean;
  onClose: () => void;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ isIOS, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-slate-900 animate-in fade-in zoom-in-95 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 bg-blue-100 text-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Smartphone className="w-6 h-6" />
        </div>

        <h3 className="text-base font-extrabold text-center text-slate-900">
          Como colocar o ícone na tela inicial
        </h3>
        <p className="text-xs text-slate-500 text-center mt-1 mb-4">
          Siga os passos simples abaixo no seu aparelho:
        </p>

        {isIOS ? (
          /* Instruções para iPhone / iPad */
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                1
              </span>
              <p className="text-slate-700 leading-relaxed">
                Abra este aplicativo no navegador <strong>Safari</strong> do iPhone.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                2
              </span>
              <p className="text-slate-700 leading-relaxed flex items-center gap-1.5 flex-wrap">
                Toque no botão <strong>Compartilhar</strong>
                <Share2 className="w-4 h-4 text-blue-600 inline" />
                (quadrado com seta para cima na barra inferior).
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                3
              </span>
              <p className="text-slate-700 leading-relaxed flex items-center gap-1.5 flex-wrap">
                Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>
                <PlusSquare className="w-4 h-4 text-blue-600 inline" />.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                4
              </span>
              <p className="text-slate-700 leading-relaxed">
                Toque em <strong>Adicionar</strong> no canto superior direito. Pronto!
              </p>
            </div>
          </div>
        ) : (
          /* Instruções para Android / Google Chrome */
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                1
              </span>
              <p className="text-slate-700 leading-relaxed">
                No navegador (Google Chrome), toque nos <strong>3 pontinhos</strong> (⋮) no topo direito.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                2
              </span>
              <p className="text-slate-700 leading-relaxed">
                Toque em <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                3
              </span>
              <p className="text-slate-700 leading-relaxed">
                Confirme em <strong>Instalar</strong>. O ícone da Kadu Manutenções aparecerá na tela do seu celular!
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full h-11 bg-blue-900 hover:bg-blue-800 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center cursor-pointer"
        >
          Entendi
        </button>
      </div>
    </div>
  );
};
