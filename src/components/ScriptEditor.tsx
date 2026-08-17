import React, { useState, useEffect } from 'react';
import {
  Code2,
  Play,
  Copy,
  Check,
  FileCode,
  SlidersHorizontal,
  Terminal,
  Type,
  AlignLeft,
  Eye,
  CheckSquare,
  Sparkles,
  Save,
  Bookmark,
  Trash2,
  FolderOpen,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import {
  Dataset,
  PlotSettings,
  ThemeMode,
  PlotPresetId,
  PlotTemplate,
  LoaderTemplate,
  TransformTemplate,
} from '../types';
import {
  getStoredTemplates,
  saveCustomTemplate,
  deleteCustomTemplate,
  getStoredLoaders,
  saveCustomLoader,
  deleteCustomLoader,
  getStoredTransforms,
  saveCustomTransform,
  deleteCustomTransform,
} from '../core/templates';

interface ScriptEditorProps {
  datasets: Dataset[];
  activeDatasetId: string | null;
  plotSettings: PlotSettings;
  activePreset: PlotPresetId;
  theme: ThemeMode;
  onUpdatePlotSettings: (settings: Partial<PlotSettings>) => void;
  onSelectPreset: (preset: PlotPresetId) => void;
  onRunScript: (scriptCode: string, scriptType: 'loader' | 'transform' | 'plotter') => void;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  datasets,
  activeDatasetId,
  plotSettings,
  activePreset,
  theme,
  onUpdatePlotSettings,
  onSelectPreset,
  onRunScript,
}) => {
  const [subTab, setSubTab] = useState<'plotters' | 'loaders' | 'transforms'>('plotters');

  // Plot Templates state
  const [plotTemplates, setPlotTemplates] = useState<PlotTemplate[]>([]);
  const [selectedPlotTemplateId, setSelectedPlotTemplateId] = useState<string>('template_xrr');
  const [newPlotTemplateName, setNewPlotTemplateName] = useState<string>('');
  const [isSavingPlotTemplate, setIsSavingPlotTemplate] = useState<boolean>(false);

  // Loader Templates state
  const [loaderTemplates, setLoaderTemplates] = useState<LoaderTemplate[]>([]);
  const [selectedLoaderTemplateId, setSelectedLoaderTemplateId] = useState<string>('loader_uvvis');
  const [newLoaderTemplateName, setNewLoaderTemplateName] = useState<string>('');
  const [isSavingLoaderTemplate, setIsSavingLoaderTemplate] = useState<boolean>(false);

  // Transform Templates state
  const [transformTemplates, setTransformTemplates] = useState<TransformTemplate[]>([]);
  const [selectedTransformTemplateId, setSelectedTransformTemplateId] = useState<string>('transform_baseline');
  const [newTransformTemplateName, setNewTransformTemplateName] = useState<string>('');
  const [isSavingTransformTemplate, setIsSavingTransformTemplate] = useState<boolean>(false);

  // Code editor state
  const [scriptCode, setScriptCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isDark = theme === 'dark';

  // Load all templates on mount
  useEffect(() => {
    const plots = getStoredTemplates();
    setPlotTemplates(plots);
    const initialPlot = plots.find((t) => t.id === 'template_xrr') || plots[0];
    if (initialPlot) {
      setSelectedPlotTemplateId(initialPlot.id);
      setScriptCode(initialPlot.customScript);
    }

    const loaders = getStoredLoaders();
    setLoaderTemplates(loaders);
    if (loaders.length > 0) setSelectedLoaderTemplateId(loaders[0].id);

    const transforms = getStoredTransforms();
    setTransformTemplates(transforms);
    if (transforms.length > 0) setSelectedTransformTemplateId(transforms[0].id);
  }, []);

  const activePlotTemplate = plotTemplates.find((t) => t.id === selectedPlotTemplateId) || plotTemplates[0];
  const activeLoaderTemplate = loaderTemplates.find((t) => t.id === selectedLoaderTemplateId) || loaderTemplates[0];
  const activeTransformTemplate = transformTemplates.find((t) => t.id === selectedTransformTemplateId) || transformTemplates[0];

  // 1. Plot Templates Handlers
  const handleSelectPlotTemplate = (templateId: string) => {
    setSelectedPlotTemplateId(templateId);
    const tmpl = plotTemplates.find((t) => t.id === templateId);
    if (tmpl) {
      setScriptCode(tmpl.customScript);
      onUpdatePlotSettings(tmpl.plotSettings);
      onSelectPreset(tmpl.plotPreset);
      setStatusMessage(`Loaded plot template "${tmpl.name}"`);
    }
  };

  const handleSavePlotTemplate = () => {
    if (!newPlotTemplateName.trim()) return;
    const newTmpl: PlotTemplate = {
      id: `custom_plot_${Date.now()}`,
      name: newPlotTemplateName.trim(),
      description: `Custom user plot template for ${plotSettings.title || 'experimental curves'}.`,
      plotPreset: activePreset,
      plotSettings: { ...plotSettings },
      defaultTransforms: [],
      customScript: scriptCode,
      isBuiltIn: false,
    };
    const updated = saveCustomTemplate(newTmpl);
    setPlotTemplates(updated);
    setSelectedPlotTemplateId(newTmpl.id);
    setNewPlotTemplateName('');
    setIsSavingPlotTemplate(false);
    setStatusMessage(`Saved plot template "${newTmpl.name}"!`);
  };

  const handleDeletePlotTemplate = (id: string) => {
    const updated = deleteCustomTemplate(id);
    setPlotTemplates(updated);
    if (selectedPlotTemplateId === id && updated.length > 0) {
      setSelectedPlotTemplateId(updated[0].id);
      setScriptCode(updated[0].customScript);
    }
    setStatusMessage(`Deleted plot template.`);
  };

  // 2. Loader Templates Handlers
  const handleSelectLoaderTemplate = (loaderId: string) => {
    setSelectedLoaderTemplateId(loaderId);
    const tmpl = loaderTemplates.find((t) => t.id === loaderId);
    if (tmpl) {
      setScriptCode(tmpl.code);
      setStatusMessage(`Loaded loader template "${tmpl.name}"`);
    }
  };

  const handleSaveLoaderTemplate = () => {
    if (!newLoaderTemplateName.trim()) return;
    const newTmpl: LoaderTemplate = {
      id: `custom_loader_${Date.now()}`,
      name: newLoaderTemplateName.trim(),
      description: 'Custom user-defined data loader script.',
      code: scriptCode,
      isBuiltIn: false,
    };
    const updated = saveCustomLoader(newTmpl);
    setLoaderTemplates(updated);
    setSelectedLoaderTemplateId(newTmpl.id);
    setNewLoaderTemplateName('');
    setIsSavingLoaderTemplate(false);
    setStatusMessage(`Saved loader template "${newTmpl.name}"!`);
  };

  const handleDeleteLoaderTemplate = (id: string) => {
    const updated = deleteCustomLoader(id);
    setLoaderTemplates(updated);
    if (selectedLoaderTemplateId === id && updated.length > 0) {
      setSelectedLoaderTemplateId(updated[0].id);
      setScriptCode(updated[0].code);
    }
    setStatusMessage(`Deleted loader template.`);
  };

  // 3. Transform Templates Handlers
  const handleSelectTransformTemplate = (transformId: string) => {
    setSelectedTransformTemplateId(transformId);
    const tmpl = transformTemplates.find((t) => t.id === transformId);
    if (tmpl) {
      setScriptCode(tmpl.code);
      setStatusMessage(`Loaded transform template "${tmpl.name}"`);
    }
  };

  const handleSaveTransformTemplate = () => {
    if (!newTransformTemplateName.trim()) return;
    const newTmpl: TransformTemplate = {
      id: `custom_transform_${Date.now()}`,
      name: newTransformTemplateName.trim(),
      description: 'Custom user-defined data transform script.',
      code: scriptCode,
      isBuiltIn: false,
    };
    const updated = saveCustomTransform(newTmpl);
    setTransformTemplates(updated);
    setSelectedTransformTemplateId(newTmpl.id);
    setNewTransformTemplateName('');
    setIsSavingTransformTemplate(false);
    setStatusMessage(`Saved transform template "${newTmpl.name}"!`);
  };

  const handleDeleteTransformTemplate = (id: string) => {
    const updated = deleteCustomTransform(id);
    setTransformTemplates(updated);
    if (selectedTransformTemplateId === id && updated.length > 0) {
      setSelectedTransformTemplateId(updated[0].id);
      setScriptCode(updated[0].code);
    }
    setStatusMessage(`Deleted transform template.`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = () => {
    onRunScript(scriptCode, subTab === 'plotters' ? 'plotter' : subTab === 'loaders' ? 'loader' : 'transform');
    setStatusMessage(`Applied script successfully.`);
  };

  return (
    <div
      className={`w-full h-full flex flex-col select-text transition-colors duration-200 ${
        isDark ? 'bg-[#121316]' : 'bg-[#ffffff]'
      }`}
    >
      {/* 1. Sub-Tab Switcher Bar */}
      <div
        className={`h-12 border-b px-4 flex items-center justify-between text-xs select-none ${
          isDark ? 'bg-[#181a20] border-[#2a2d37]' : 'bg-[#f6f8fa] border-[#d0d7de]'
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center p-0.5 rounded-lg border ${
              isDark ? 'bg-[#121316] border-[#2a2d37]' : 'bg-[#e2e8f0] border-[#cbd5e1]'
            }`}
          >
            <button
              onClick={() => {
                setSubTab('plotters');
                if (activePlotTemplate) setScriptCode(activePlotTemplate.customScript);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                subTab === 'plotters'
                  ? isDark
                    ? 'bg-[#242731] text-white shadow-sm font-medium'
                    : 'bg-white text-gray-900 shadow-sm font-medium'
                  : isDark
                  ? 'text-[#8b949e] hover:text-white'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#00adb5]" />
              <span>Plot Templates</span>
            </button>

            <button
              onClick={() => {
                setSubTab('loaders');
                if (activeLoaderTemplate) setScriptCode(activeLoaderTemplate.code);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                subTab === 'loaders'
                  ? isDark
                    ? 'bg-[#242731] text-white shadow-sm font-medium'
                    : 'bg-white text-gray-900 shadow-sm font-medium'
                  : isDark
                  ? 'text-[#8b949e] hover:text-white'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-[#2196f3]" />
              <span>Loader Templates</span>
            </button>

            <button
              onClick={() => {
                setSubTab('transforms');
                if (activeTransformTemplate) setScriptCode(activeTransformTemplate.code);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                subTab === 'transforms'
                  ? isDark
                    ? 'bg-[#242731] text-white shadow-sm font-medium'
                    : 'bg-white text-gray-900 shadow-sm font-medium'
                  : isDark
                  ? 'text-[#8b949e] hover:text-white'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-[#ff9800]" />
              <span>Transform Templates</span>
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {statusMessage && (
            <span className="text-green-400 font-mono text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{statusMessage}</span>
            </span>
          )}

          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1 rounded border transition-colors ${
              isDark
                ? 'bg-[#20232c] hover:bg-[#282c37] text-white border-[#3a3f4d]'
                : 'bg-white hover:bg-gray-100 text-gray-800 border-gray-300'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-[#8b949e]" />}
            <span>{copied ? 'Copied' : 'Copy Script'}</span>
          </button>

          <button
            onClick={handleRun}
            className="flex items-center gap-1.5 px-3.5 py-1 bg-[#00adb5] hover:bg-[#00c4cd] text-black font-semibold rounded shadow-sm transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>Apply Script</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Tab Content */}
      {subTab === 'plotters' ? (
        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
          {/* Plot Template Selector Card */}
          <div
            className={`p-5 rounded-2xl border shadow-lg space-y-4 ${
              isDark ? 'bg-[#181a20] border-[#2a2d37]' : 'bg-[#f6f8fa] border-[#d0d7de]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#00adb5] font-semibold text-sm">
                <Bookmark className="w-4 h-4" />
                <span>Experiment Plotting Templates & Scales</span>
              </div>
              <button
                onClick={() => setIsSavingPlotTemplate(!isSavingPlotTemplate)}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#242731] hover:bg-[#2e323e] text-white border border-[#3a3f4d] rounded-md text-xs transition-colors"
              >
                <Save className="w-3.5 h-3.5 text-[#ff9800]" />
                <span>Save as New Plot Template</span>
              </button>
            </div>

            {/* Template Dropdown + Scale selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[#8b949e] font-medium block mb-1">
                  Load Plot Template
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedPlotTemplateId}
                    onChange={(e) => handleSelectPlotTemplate(e.target.value)}
                    className={`flex-1 border rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#00adb5] ${
                      isDark ? 'bg-[#121316] border-[#2e323e] text-white' : 'bg-white border-gray-300 text-black'
                    }`}
                  >
                    {plotTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.isBuiltIn ? '(Built-in)' : '(Custom)'}
                      </option>
                    ))}
                  </select>

                  {activePlotTemplate && !activePlotTemplate.isBuiltIn && (
                    <button
                      onClick={() => handleDeletePlotTemplate(activePlotTemplate.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                      title="Delete custom plot template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {activePlotTemplate && (
                  <p className="text-[11px] text-[#6b7280] mt-1.5 leading-relaxed">
                    {activePlotTemplate.description}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[#8b949e] font-medium block mb-1">
                  Plot Scale Mode (Linear / Scientific Log 10^x)
                </label>
                <select
                  value={activePreset}
                  onChange={(e) => onSelectPreset(e.target.value as PlotPresetId)}
                  className={`w-full border rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#00adb5] ${
                    isDark ? 'bg-[#121316] border-[#2e323e] text-white' : 'bg-white border-gray-300 text-black'
                  }`}
                >
                  <option value="auto">Smart Auto (Auto-Detect)</option>
                  <option value="line">Linear Scale (X: Lin, Y: Lin)</option>
                  <option value="log_y">Log-Y Scale (Scientific Powers 10^x)</option>
                  <option value="log_log">Log-Log Scale (X: 10^x, Y: 10^x)</option>
                  <option value="waterfall">Waterfall (Stacked Multi-Series)</option>
                  <option value="scatter">Scatter Points</option>
                  <option value="line_scatter">Lines + Scatter Points</option>
                  <option value="area">Filled Area</option>
                </select>
              </div>
            </div>

            {/* Save New Plot Template Form */}
            {isSavingPlotTemplate && (
              <div className="p-3 bg-[#121316] border border-[#00adb5]/40 rounded-xl space-y-2 animate-fade-in">
                <span className="text-xs font-semibold text-white block">
                  Save Current Plot Layout as a New Reusable Template:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. My High-Res Raman Setup"
                    value={newPlotTemplateName}
                    onChange={(e) => setNewPlotTemplateName(e.target.value)}
                    className="flex-1 bg-[#1a1c22] border border-[#2e323e] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00adb5]"
                  />
                  <button
                    onClick={handleSavePlotTemplate}
                    disabled={!newPlotTemplateName.trim()}
                    className="px-4 py-1.5 bg-[#00adb5] hover:bg-[#00c4cd] text-black font-semibold text-xs rounded-lg transition-colors disabled:opacity-40"
                  >
                    Save Template
                  </button>
                  <button
                    onClick={() => setIsSavingPlotTemplate(false)}
                    className="px-3 py-1.5 bg-[#242731] hover:bg-[#2e323e] text-[#9ca3af] text-xs rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Plot Titles & Axes Settings Panel */}
          <div
            className={`p-5 rounded-2xl border shadow-lg space-y-4 ${
              isDark ? 'bg-[#181a20] border-[#2a2d37]' : 'bg-[#f6f8fa] border-[#d0d7de]'
            }`}
          >
            <div className="flex items-center gap-2 text-[#00adb5] font-semibold text-sm">
              <Type className="w-4 h-4" />
              <span>Plot Titles & Axis Labels</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-[#8b949e] font-medium block mb-1">Main Plot Title</label>
                <input
                  type="text"
                  placeholder="e.g. X-Ray Reflectivity Profile"
                  value={plotSettings.title}
                  onChange={(e) => onUpdatePlotSettings({ title: e.target.value })}
                  className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#00adb5] ${
                    isDark ? 'bg-[#121316] border-[#2e323e] text-white' : 'bg-white border-gray-300 text-black'
                  }`}
                />
              </div>

              <div>
                <label className="text-[#8b949e] font-medium block mb-1">X-Axis Label Override</label>
                <input
                  type="text"
                  placeholder="e.g. Q (1/Å) or TwoTheta (deg)"
                  value={plotSettings.xAxisTitle}
                  onChange={(e) => onUpdatePlotSettings({ xAxisTitle: e.target.value })}
                  className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#00adb5] ${
                    isDark ? 'bg-[#121316] border-[#2e323e] text-white' : 'bg-white border-gray-300 text-black'
                  }`}
                />
              </div>

              <div>
                <label className="text-[#8b949e] font-medium block mb-1">Y-Axis Label Override</label>
                <input
                  type="text"
                  placeholder="e.g. Reflectivity R(Q)"
                  value={plotSettings.yAxisTitle}
                  onChange={(e) => onUpdatePlotSettings({ yAxisTitle: e.target.value })}
                  className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#00adb5] ${
                    isDark ? 'bg-[#121316] border-[#2e323e] text-white' : 'bg-white border-gray-300 text-black'
                  }`}
                />
              </div>
            </div>

            {/* Legend toggle */}
            <div className="pt-3 border-t border-[#2e323e] flex items-center gap-6 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={plotSettings.showLegend}
                  onChange={(e) => onUpdatePlotSettings({ showLegend: e.target.checked })}
                  className="rounded text-[#00adb5] focus:ring-0"
                />
                <span className="font-medium">Show Plot Legend</span>
              </label>
            </div>
          </div>

          {/* Custom Plotly Script Editor Container */}
          <div
            className={`p-5 rounded-2xl border shadow-lg space-y-3 ${
              isDark ? 'bg-[#181a20] border-[#2a2d37]' : 'bg-[#f6f8fa] border-[#d0d7de]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#ff9800] font-semibold text-sm">
                <Terminal className="w-4 h-4" />
                <span>Custom Python / Plotly Layout Script</span>
              </div>
              <span className="text-[10px] text-[#6b7280] font-mono">plotters/template_plotter.py</span>
            </div>

            <textarea
              value={scriptCode}
              onChange={(e) => setScriptCode(e.target.value)}
              spellCheck={false}
              className={`w-full h-64 border rounded-xl p-4 font-mono text-xs leading-relaxed focus:outline-none focus:border-[#00adb5] resize-none ${
                isDark ? 'bg-[#121316] border-[#2e323e] text-[#e1e4e8]' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
        </div>
      ) : subTab === 'loaders' ? (
        /* Data Loaders sub-tab */
        <div className="flex-1 flex flex-col p-6 max-w-4xl mx-auto w-full space-y-4 font-mono text-sm">
          {/* Loader Template Selector */}
          <div
            className={`p-4 rounded-xl border flex flex-col gap-3 ${
              isDark ? 'bg-[#181a20] border-[#2a2d37]' : 'bg-[#f6f8fa] border-[#d0d7de]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#2196f3] font-semibold text-xs">
                <FileCode className="w-4 h-4" />
                <span>Data Loader Templates</span>
              </div>
              <button
                onClick={() => setIsSavingLoaderTemplate(!isSavingLoaderTemplate)}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#242731] hover:bg-[#2e323e] text-white border border-[#3a3f4d] rounded-md text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#2196f3]" />
                <span>Save as New Loader Template</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedLoaderTemplateId}
                onChange={(e) => handleSelectLoaderTemplate(e.target.value)}
                className={`flex-1 border rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-[#00adb5] ${
                  isDark ? 'bg-[#121316] border-[#2e323e] text-white' : 'bg-white border-gray-300 text-black'
                }`}
              >
                {loaderTemplates.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} {l.isBuiltIn ? '(Built-in)' : '(Custom)'}
                  </option>
                ))}
              </select>

              {activeLoaderTemplate && !activeLoaderTemplate.isBuiltIn && (
                <button
                  onClick={() => handleDeleteLoaderTemplate(activeLoaderTemplate.id)}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                  title="Delete custom loader template"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {activeLoaderTemplate && (
              <p className="text-[11px] text-[#6b7280] leading-relaxed">
                {activeLoaderTemplate.description}
              </p>
            )}

            {/* Save New Loader Template Form */}
            {isSavingLoaderTemplate && (
              <div className="p-3 bg-[#121316] border border-[#2196f3]/40 rounded-xl space-y-2 animate-fade-in mt-1">
                <span className="text-xs font-semibold text-white block">
                  Save Current Loader Script as a New Reusable Template:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. My Custom Raman Spectrometer Loader"
                    value={newLoaderTemplateName}
                    onChange={(e) => setNewLoaderTemplateName(e.target.value)}
                    className="flex-1 bg-[#1a1c22] border border-[#2e323e] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#2196f3]"
                  />
                  <button
                    onClick={handleSaveLoaderTemplate}
                    disabled={!newLoaderTemplateName.trim()}
                    className="px-4 py-1.5 bg-[#2196f3] hover:bg-[#1e88e5] text-white font-semibold text-xs rounded-lg transition-colors disabled:opacity-40"
                  >
                    Save Loader
                  </button>
                  <button
                    onClick={() => setIsSavingLoaderTemplate(false)}
                    className="px-3 py-1.5 bg-[#242731] hover:bg-[#2e323e] text-[#9ca3af] text-xs rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <textarea
            value={scriptCode}
            onChange={(e) => setScriptCode(e.target.value)}
            spellCheck={false}
            className={`flex-1 min-h-[300px] border rounded-xl p-4 font-mono text-xs leading-relaxed focus:outline-none focus:border-[#2196f3] resize-none ${
              isDark ? 'bg-[#16181f] border-[#2a2d37] text-[#e1e4e8]' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>
      ) : (
        /* Data Transforms sub-tab */
        <div className="flex-1 flex flex-col p-6 max-w-4xl mx-auto w-full space-y-4 font-mono text-sm">
          {/* Transform Template Selector */}
          <div
            className={`p-4 rounded-xl border flex flex-col gap-3 ${
              isDark ? 'bg-[#181a20] border-[#2a2d37]' : 'bg-[#f6f8fa] border-[#d0d7de]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#ff9800] font-semibold text-xs">
                <Code2 className="w-4 h-4" />
                <span>Data Transform Templates</span>
              </div>
              <button
                onClick={() => setIsSavingTransformTemplate(!isSavingTransformTemplate)}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#242731] hover:bg-[#2e323e] text-white border border-[#3a3f4d] rounded-md text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#ff9800]" />
                <span>Save as New Transform Template</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedTransformTemplateId}
                onChange={(e) => handleSelectTransformTemplate(e.target.value)}
                className={`flex-1 border rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-[#00adb5] ${
                  isDark ? 'bg-[#121316] border-[#2e323e] text-white' : 'bg-white border-gray-300 text-black'
                }`}
              >
                {transformTemplates.map((tr) => (
                  <option key={tr.id} value={tr.id}>
                    {tr.name} {tr.isBuiltIn ? '(Built-in)' : '(Custom)'}
                  </option>
                ))}
              </select>

              {activeTransformTemplate && !activeTransformTemplate.isBuiltIn && (
                <button
                  onClick={() => handleDeleteTransformTemplate(activeTransformTemplate.id)}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                  title="Delete custom transform template"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {activeTransformTemplate && (
              <p className="text-[11px] text-[#6b7280] leading-relaxed">
                {activeTransformTemplate.description}
              </p>
            )}

            {/* Save New Transform Template Form */}
            {isSavingTransformTemplate && (
              <div className="p-3 bg-[#121316] border border-[#ff9800]/40 rounded-xl space-y-2 animate-fade-in mt-1">
                <span className="text-xs font-semibold text-white block">
                  Save Current Transform Script as a New Reusable Template:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. My Background Subtraction & Filter"
                    value={newTransformTemplateName}
                    onChange={(e) => setNewTransformTemplateName(e.target.value)}
                    className="flex-1 bg-[#1a1c22] border border-[#2e323e] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff9800]"
                  />
                  <button
                    onClick={handleSaveTransformTemplate}
                    disabled={!newTransformTemplateName.trim()}
                    className="px-4 py-1.5 bg-[#ff9800] hover:bg-[#fb8c00] text-black font-semibold text-xs rounded-lg transition-colors disabled:opacity-40"
                  >
                    Save Transform
                  </button>
                  <button
                    onClick={() => setIsSavingTransformTemplate(false)}
                    className="px-3 py-1.5 bg-[#242731] hover:bg-[#2e323e] text-[#9ca3af] text-xs rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <textarea
            value={scriptCode}
            onChange={(e) => setScriptCode(e.target.value)}
            spellCheck={false}
            className={`flex-1 min-h-[300px] border rounded-xl p-4 font-mono text-xs leading-relaxed focus:outline-none focus:border-[#ff9800] resize-none ${
              isDark ? 'bg-[#16181f] border-[#2a2d37] text-[#e1e4e8]' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>
      )}

      {/* 3. Footer Reference */}
      <div
        className={`h-10 border-t px-4 flex items-center justify-between text-[11px] text-[#6b7280] font-mono select-none ${
          isDark ? 'bg-[#181a20] border-[#2a2d37]' : 'bg-[#f6f8fa] border-[#d0d7de]'
        }`}
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#00adb5]" />
          <span>FDV Modular Pipelines: Save & Load Custom Plotters, Loaders, and Transforms</span>
        </div>
        <span>Templates saved locally across sessions</span>
      </div>
    </div>
  );
};
