import React from 'react';
import { Dataset, ThemeMode } from '../../types';

interface MetadataPanelProps {
  activeDataset: Dataset | null;
  theme: ThemeMode;
}

export const MetadataPanel: React.FC<MetadataPanelProps> = ({
  activeDataset,
  theme,
}) => {
  const isDark = theme === 'dark';

  if (!activeDataset) {
    return (
      <div className={`text-xs text-center py-4 ${isDark ? 'text-[#8b949e]' : 'text-slate-500'}`}>
        Select a dataset to view file metadata.
      </div>
    );
  }

  const metadataEntries = Object.entries(activeDataset.metadata || {});

  if (metadataEntries.length === 0) {
    return (
      <div className={`text-xs text-center py-3 font-mono ${isDark ? 'text-[#6b7280]' : 'text-slate-400'}`}>
        No header metadata found in file.
      </div>
    );
  }

  return (
    <div className="space-y-1.5 text-[11px] font-mono max-h-48 overflow-y-auto pr-1">
      {metadataEntries.map(([k, v]) => (
        <div
          key={k}
          className={`flex items-center justify-between gap-2 p-1 rounded ${
            isDark ? 'hover:bg-[#20232c]' : 'hover:bg-slate-100'
          }`}
        >
          <span className={`truncate max-w-[130px] font-medium ${isDark ? 'text-[#8b949e]' : 'text-slate-600'}`}>
            {k}:
          </span>
          <span className={`truncate max-w-[150px] font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`} title={v}>
            {v}
          </span>
        </div>
      ))}
    </div>
  );
};
