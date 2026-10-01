import React from 'react';

export function extractMachineCode(mach: { name?: string; tag?: string; pavilhao?: string }): {
  code: string;
  isLetter: boolean;
  pavilhao: string;
} {
  const tag = (mach.tag || '').trim().toUpperCase();
  const name = (mach.name || '').trim().toUpperCase();
  const str = `${tag} ${name}`;

  // Match letter: e.g. "INJ. A", "INJ. B", etc.
  const letterMatch = str.match(/INJ\.?\s*([A-O])\b/) || str.match(/\b([A-O])\b/);
  // Match number: e.g. "INJ. 01", "INJ. 13", etc.
  const numberMatch = str.match(/INJ\.?\s*(\d{1,2})\b/) || str.match(/\b(\d{1,2})\b/);

  if (mach.pavilhao === 'P2' && letterMatch) {
    return { code: letterMatch[1], isLetter: true, pavilhao: 'P2' };
  }
  if (mach.pavilhao === 'P1' && numberMatch) {
    const num = parseInt(numberMatch[1], 10);
    return { code: num < 10 ? `0${num}` : `${num}`, isLetter: false, pavilhao: 'P1' };
  }

  if (letterMatch && !numberMatch) {
    return { code: letterMatch[1], isLetter: true, pavilhao: 'P2' };
  }
  if (numberMatch) {
    const num = parseInt(numberMatch[1], 10);
    return { code: num < 10 ? `0${num}` : `${num}`, isLetter: false, pavilhao: 'P1' };
  }
  if (letterMatch) {
    return { code: letterMatch[1], isLetter: true, pavilhao: 'P2' };
  }

  const clean = (tag || name.slice(0, 3) || 'MQ').replace('INJ.', '').trim();
  return { code: clean, isLetter: false, pavilhao: mach.pavilhao || '' };
}

interface MachineBadgeProps {
  machine: {
    name?: string;
    tag?: string;
    pavilhao?: string;
    tonnage?: string;
  };
  size?: 'xs' | 'sm' | 'md' | 'lg';
  selected?: boolean;
  className?: string;
}

export const MachineBadge: React.FC<MachineBadgeProps> = ({
  machine,
  size = 'md',
  selected = false,
  className = ''
}) => {
  const { code, isLetter, pavilhao } = extractMachineCode(machine);

  // Pavilion 1 (Numbers): Blue / Indigo theme
  // Pavilion 2 (Letters): Amber / Orange theme
  const isP2 = isLetter || pavilhao === 'P2';

  if (size === 'xs') {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-lg font-black tracking-tight shrink-0 shadow-xs border ${
          isP2
            ? 'bg-amber-500 text-slate-950 border-amber-400'
            : 'bg-blue-900 text-white border-blue-700'
        } ${selected ? 'ring-2 ring-white' : ''} px-2 py-0.5 text-xs font-mono ${className}`}
      >
        <span>{code}</span>
      </div>
    );
  }

  if (size === 'sm') {
    return (
      <div
        className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-sm border transition-all ${
          isP2
            ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white border-amber-400'
            : 'bg-gradient-to-br from-blue-900 to-indigo-950 text-white border-blue-700'
        } ${selected ? 'ring-2 ring-blue-400 scale-105' : ''} ${className}`}
      >
        <span className="text-[8px] font-black uppercase tracking-wider opacity-85 leading-none mb-0.5">
          {isP2 ? 'P2' : 'P1'}
        </span>
        <span className="text-base font-black tracking-tight leading-none font-mono">
          {code}
        </span>
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div
        className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-md border-2 transition-all ${
          isP2
            ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 text-white border-amber-300 shadow-amber-900/20'
            : 'bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white border-blue-500/40 shadow-blue-950/30'
        } ${className}`}
      >
        <div className="flex items-center gap-1 opacity-90 mb-0.5">
          <span className="text-[9px] font-black uppercase tracking-widest px-1 py-0.2 rounded bg-black/25">
            {isP2 ? 'PRODUÇÃO 2' : 'PRODUÇÃO 1'}
          </span>
        </div>
        <span className="text-3xl sm:text-4xl font-black tracking-tight leading-none font-mono drop-shadow-sm">
          {code}
        </span>
      </div>
    );
  }

  // Default: 'md' (w-14 h-14)
  return (
    <div
      className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-sm border-2 transition-all ${
        isP2
          ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 text-white border-amber-300 shadow-amber-900/15'
          : 'bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white border-blue-500/40 shadow-blue-950/20'
      } ${selected ? 'ring-2 ring-blue-400 scale-105' : ''} ${className}`}
    >
      <span className="text-[9px] font-black uppercase tracking-widest opacity-80 leading-none mb-0.5">
        {isP2 ? 'P2' : 'P1'}
      </span>
      <span className="text-2xl font-black tracking-tight leading-none font-mono">
        {code}
      </span>
    </div>
  );
};
