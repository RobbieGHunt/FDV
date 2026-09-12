import React, { useState, useEffect, useRef } from 'react';
import { X, Edit2, Check } from 'lucide-react';
import { ThemeMode } from '../types';

interface RenameModalProps {
  isOpen: boolean;
  currentName: string;
  onClose: () => void;
  onSave: (newName: string) => void;
  theme: ThemeMode;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  currentName,
  onClose,
  onSave,
  theme,
}) => {
  const [name, setName] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    setName(currentName);
  }, [currentName, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      onSave(trimmed);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-md rounded-xl border shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-[#181a20] border-[#2e323e] text-[#e1e4e8]' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 flex items-center justify-between border-b ${
            isDark ? 'border-[#2e323e] bg-[#14161b]' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Edit2 className={`w-4 h-4 ${isDark ? 'text-[#00adb5]' : 'text-[#0284c7]'}`} />
            <h3 className="text-sm font-semibold">Rename Dataset</h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-md transition-colors ${
              isDark ? 'hover:bg-[#252833] text-[#8b949e] hover:text-white' : 'hover:bg-slate-200 text-slate-500'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className={`text-xs font-medium ${isDark ? 'text-[#9ca3af]' : 'text-slate-600'}`}>
              Dataset Name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') onClose();
              }}
              className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none transition-colors ${
                isDark
                  ? 'bg-[#121316] border-[#2e323e] text-white focus:border-[#00adb5]'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-[#0284c7]'
              }`}
              placeholder="Enter new dataset name..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                isDark
                  ? 'border-[#2e323e] hover:bg-[#20232c] text-[#8b949e] hover:text-white'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark
                  ? 'bg-[#00adb5] hover:bg-[#00c4cd] text-black shadow-[#00adb5]/20'
                  : 'bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-sky-500/20'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
