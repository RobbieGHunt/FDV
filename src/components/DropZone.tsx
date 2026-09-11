import React from 'react';
import { UploadCloud } from 'lucide-react';
import { ThemeMode } from '../types';

interface DropZoneProps {
  isDragging: boolean;
  theme?: ThemeMode;
}

export const DropZone: React.FC<DropZoneProps> = ({ isDragging, theme = 'dark' }) => {
  if (!isDragging) return null;

  const isDark = theme === 'dark';

  return (
    <div
      className={`fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-8 animate-fade-in border-4 border-dashed m-3 rounded-2xl pointer-events-none transition-all ${
        isDark
          ? 'bg-[#121316]/90 border-[#00adb5]'
          : 'bg-white/90 border-[#0284c7] shadow-2xl shadow-sky-500/10'
      }`}
    >
      <div className="flex flex-col items-center justify-center text-center max-w-md pointer-events-none">
        <div
          className={`w-20 h-20 rounded-full border flex items-center justify-center mb-4 shadow-2xl animate-bounce ${
            isDark
              ? 'bg-[#00adb5]/10 border-[#00adb5]/40 text-[#00adb5] shadow-[#00adb5]/20'
              : 'bg-sky-500/10 border-sky-500/40 text-[#0284c7] shadow-sky-500/20'
          }`}
        >
          <UploadCloud className="w-10 h-10" />
        </div>
        <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Drop your Data File(s) Here
        </h2>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-[#9ca3af]' : 'text-slate-600'}`}>
          FDV will automatically detect delimiters, header lines, columns, and immediately plot your curves.
        </p>
        <div className={`mt-4 flex items-center gap-2 text-xs ${isDark ? 'text-[#6b7280]' : 'text-slate-500'}`}>
          <span className={`px-2 py-1 rounded border font-mono ${isDark ? 'bg-[#1a1c22] border-[#2e323e]' : 'bg-slate-100 border-slate-300'}`}>.csv</span>
          <span className={`px-2 py-1 rounded border font-mono ${isDark ? 'bg-[#1a1c22] border-[#2e323e]' : 'bg-slate-100 border-slate-300'}`}>.tsv</span>
          <span className={`px-2 py-1 rounded border font-mono ${isDark ? 'bg-[#1a1c22] border-[#2e323e]' : 'bg-slate-100 border-slate-300'}`}>.txt</span>
          <span className={`px-2 py-1 rounded border font-mono ${isDark ? 'bg-[#1a1c22] border-[#2e323e]' : 'bg-slate-100 border-slate-300'}`}>.xy</span>
          <span className={`px-2 py-1 rounded border font-mono ${isDark ? 'bg-[#1a1c22] border-[#2e323e]' : 'bg-slate-100 border-slate-300'}`}>.dat</span>
          <span className={`px-2 py-1 rounded border font-mono ${isDark ? 'bg-[#1a1c22] border-[#2e323e]' : 'bg-slate-100 border-slate-300'}`}>.asc</span>
        </div>
      </div>
    </div>
  );
};

