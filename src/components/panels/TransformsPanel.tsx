import React from 'react';
import { Dataset, ThemeMode } from '../../types';
import { AVAILABLE_TRANSFORMS } from '../../core/transforms';

interface TransformsPanelProps {
  activeDataset: Dataset | null;
  theme: ThemeMode;
  onUpdateDataset: (id: string, updates: Partial<Dataset>) => void;
}

export const TransformsPanel: React.FC<TransformsPanelProps> = ({
  activeDataset,
  theme,
  onUpdateDataset,
}) => {
  const isDark = theme === 'dark';

  if (!activeDataset) {
    return (
      <div className={`text-xs text-center py-4 ${isDark ? 'text-[#8b949e]' : 'text-slate-500'}`}>
        Select a dataset to apply mathematical signal processing.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {AVAILABLE_TRANSFORMS.map((tf) => {
        const isActive = activeDataset.activeTransforms.includes(tf.id);
        const isNormalize = tf.id === 'normalize_custom' || tf.id === 'normalize_01';
        const normMin = activeDataset.transformParams?.normalize?.min ?? 0;
        const normMax = activeDataset.transformParams?.normalize?.max ?? 1;

        return (
          <div
            key={tf.id}
            className={`p-2 rounded-lg border transition-all ${
              isActive
                ? isDark
                  ? 'bg-[#242731] border-[#00adb5]/40 text-white shadow-xs'
                  : 'bg-sky-50 border-sky-300 text-slate-950 shadow-xs'
                : isDark
                ? 'bg-[#14161b] border-transparent text-[#8b949e]'
                : 'bg-[#f8fafc] border-transparent text-slate-700'
            }`}
          >
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => {
                  let nextT = [...activeDataset.activeTransforms];
                  if (e.target.checked) {
                    nextT.push(tf.id);
                  } else {
                    nextT = nextT.filter((t) => t !== tf.id);
                  }
                  onUpdateDataset(activeDataset.id, { activeTransforms: nextT });
                }}
                className="mt-0.5 rounded text-[#0284c7] focus:ring-0"
              />
              <div className="flex-1">
                <div className="font-semibold text-xs">{tf.name}</div>
                <div className={`text-[10px] leading-tight ${isDark ? 'text-[#6b7280]' : 'text-slate-500'}`}>
                  {tf.description}
                </div>
              </div>
            </label>

            {/* Configurable Range Inputs for Normalization */}
            {isActive && isNormalize && (
              <div className={`mt-2 pt-2 border-t flex items-center justify-between gap-2 ${isDark ? 'border-[#2e323e]' : 'border-sky-200'}`}>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] ${isDark ? 'text-[#8b949e]' : 'text-slate-600'}`}>Min:</span>
                  <input
                    type="number"
                    value={normMin}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      onUpdateDataset(activeDataset.id, {
                        transformParams: {
                          ...activeDataset.transformParams,
                          normalize: { min: val, max: normMax },
                        },
                      });
                    }}
                    className={`w-14 text-center font-mono border rounded px-1 py-0.5 text-[11px] focus:outline-none ${
                      isDark
                        ? 'bg-[#121316] border-[#2e323e] text-white focus:border-[#00adb5]'
                        : 'bg-white border-[#cbd5e1] text-slate-900 focus:border-[#0284c7]'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] ${isDark ? 'text-[#8b949e]' : 'text-slate-600'}`}>Max:</span>
                  <input
                    type="number"
                    value={normMax}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 1;
                      onUpdateDataset(activeDataset.id, {
                        transformParams: {
                          ...activeDataset.transformParams,
                          normalize: { min: normMin, max: val },
                        },
                      });
                    }}
                    className={`w-14 text-center font-mono border rounded px-1 py-0.5 text-[11px] focus:outline-none ${
                      isDark
                        ? 'bg-[#121316] border-[#2e323e] text-white focus:border-[#00adb5]'
                        : 'bg-white border-[#cbd5e1] text-slate-900 focus:border-[#0284c7]'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
