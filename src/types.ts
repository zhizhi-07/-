export type ArtistRole = 'main' | 'coloring' | 'lineart' | 'lighting' | 'custom';

export type ArtistPrefixStyle = 'space' | 'colon' | 'merged' | 'none';

export interface ArtistSlot {
  id: string;
  slotKey: string; // e.g. 'A', 'B', 'C', 'D' or '1', '2'
  role: ArtistRole;
  roleLabel: string;
  description: string;
  name: string;
  weight: number;
  enabled: boolean;
}

export type PresetMode = 'clean' | 'rich' | 'conservative' | 'sketch' | 'single' | 'custom';

export interface PresetConfig {
  id: PresetMode;
  name: string;
  tagline: string;
  description: string;
  weights: {
    main: number;
    coloring: number;
    lineart: number;
    lighting: number;
  };
  styleTags: string;
}

export interface GenerationParams {
  apiKey: string;
  model: string;
  width: number;
  height: number;
  steps: number;
  scale: number;
  sampler: string;
  seed?: number | null;
}

export interface GenerationHistoryItem {
  id: string;
  timestamp: number;
  imageUrl: string;
  prompt: string;
  negativePrompt: string;
  seed: number;
  model: string;
  width: number;
  height: number;
  steps: number;
  scale: number;
  sampler: string;
}
