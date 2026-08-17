import React from 'react';
import { UploadCloud, FileSpreadsheet, Plus } from 'lucide-react';

interface DropZoneProps {
  isDragging: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ isDragging }) => {
  if (!isDragging) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#121316]/90 backdrop-blur-md flex items-center justify-center p-8 animate-fade-in border-4 border-dashed border-[#00adb5] m-3 rounded-2xl pointer-events-none"
    >
      <div className="flex flex-col items-center justify-center text-center max-w-md pointer-events-none">
        <div className="w-20 h-20 rounded-full bg-[#00adb5]/10 border border-[#00adb5]/40 flex items-center justify-center mb-4 text-[#00adb5] shadow-2xl shadow-[#00adb5]/20 animate-bounce">
          <UploadCloud className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Drop your Data File(s) Here</h2>
        <p className="text-sm text-[#9ca3af] leading-relaxed">
          FDV will automatically detect delimiters, header lines, columns, and immediately plot your curves.
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs text-[#6b7280]">
          <span className="px-2 py-1 bg-[#1a1c22] rounded border border-[#2e323e]">.csv</span>
          <span className="px-2 py-1 bg-[#1a1c22] rounded border border-[#2e323e]">.tsv</span>
          <span className="px-2 py-1 bg-[#1a1c22] rounded border border-[#2e323e]">.txt</span>
          <span className="px-2 py-1 bg-[#1a1c22] rounded border border-[#2e323e]">.xy</span>
          <span className="px-2 py-1 bg-[#1a1c22] rounded border border-[#2e323e]">.dat</span>
        </div>
      </div>
    </div>
  );
};
