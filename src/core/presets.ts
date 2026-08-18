import { PlotPresetId } from '../types';

export interface PlotPreset {
  id: PlotPresetId;
  name: string;
  description: string;
  iconName: string;
}

export const PLOT_PRESETS: PlotPreset[] = [
  {
    id: 'auto',
    name: 'Smart Auto',
    description: 'Automatically chooses optimal axes scaling and series format.',
    iconName: 'Sparkles',
  },
  {
    id: 'line',
    name: 'Line Plot',
    description: 'Continuous smooth or linear connected lines.',
    iconName: 'TrendingUp',
  },
  {
    id: 'scatter',
    name: 'Scatter Points',
    description: 'Discrete point markers without connecting lines.',
    iconName: 'CircleDot',
  },
  {
    id: 'line_scatter',
    name: 'Line + Points',
    description: 'Overlay of connecting line traces with point markers.',
    iconName: 'Activity',
  },
  {
    id: 'area',
    name: 'Filled Area',
    description: 'Filled area under the curve to zero baseline.',
    iconName: 'Layers',
  },
  {
    id: 'polar',
    name: 'Polar Plot (r, θ)',
    description: 'Polar coordinates plot with angular (θ) and radial (r) axes.',
    iconName: 'Compass',
  },
  {
    id: 'waterfall',
    name: 'Waterfall / Stacked',
    description: 'Offset multiple datasets vertically for easy comparison.',
    iconName: 'AlignJustify',
  },
];
