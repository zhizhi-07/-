import { ArtistSlot } from '../types';

export const INITIAL_SLOTS: ArtistSlot[] = [
  {
    id: 'slot-a',
    slotKey: 'A',
    role: 'main',
    roleLabel: '主风格',
    description: '控制整体画风、脸型、审美基调 (推荐 1.0 - 1.4)',
    name: 'fonmant',
    weight: 1.25,
    enabled: true,
  },
  {
    id: 'slot-b',
    slotKey: 'B',
    role: 'coloring',
    roleLabel: '色彩 / 上色',
    description: '控制色彩倾向、光泽、画面氛围 (推荐 0.7 - 1.0)',
    name: 'kkato',
    weight: 0.85,
    enabled: true,
  },
  {
    id: 'slot-c',
    slotKey: 'C',
    role: 'lineart',
    roleLabel: '线条 / 轮廓',
    description: '控制线条质感与笔触（易冲撞，建议低权 0.2 - 0.5）',
    name: '',
    weight: 0.35,
    enabled: true,
  },
  {
    id: 'slot-d',
    slotKey: 'D',
    role: 'lighting',
    roleLabel: '光影 / 细节',
    description: '丰富光影层次、景深与画面细节密度 (推荐 0.3 - 0.6)',
    name: '',
    weight: 0.45,
    enabled: true,
  },
];

export const PRESET_MODES: Record<string, never> = {};
/*
  clean: {
    id: 'clean',
    name: '干净模式',
    tagline: '清爽线条 · 柔和纯净',
    description: '线条清晰纤巧，色彩通透柔和，适合插画与唯美人像',
    weights: {
      main: 1.15,
      coloring: 0.8,
      lineart: 0.35,
      lighting: 0.4,
    },
    styleTags: 'clean lineart, delicate lineart, soft coloring, medium complexity, simple background',
  },
  rich: {
    id: 'rich',
    name: '浓郁模式',
    tagline: '厚涂层次 · 戏剧光影',
    description: '色彩饱满厚重，层次丰富，具有较强光影对比与视觉冲击',
    weights: {
      main: 1.45,
      coloring: 1.0,
      lineart: 0.55,
      lighting: 0.7,
    },
    styleTags: 'high complexity, depthness, detailed background, rich colors, dramatic lighting',
  },
  conservative: {
    id: 'conservative',
    name: '保守模式',
    tagline: '低权防炸 · 稳定保底',
    description: '保守权重组合，防止线条杂乱或色彩溢出，适合调试新画师',
    weights: {
      main: 1.0,
      coloring: 0.6,
      lineart: 0.2,
      lighting: 0.25,
    },
    styleTags: 'clean lineart, soft coloring, simple background',
  },
  sketch: {
    id: 'sketch',
    name: '速写线稿',
    tagline: '黑白线稿 · 速写阴影',
    description: '强控黑白线稿轮廓与素描阴影结构，适合黑白速写与草图线稿',
    weights: {
      main: 1.8,
      coloring: 0.9,
      lineart: 1.6,
      lighting: 1.5,
    },
    styleTags: 'clean rough sketch, simple black line art, subtl grey shading',
  },
}; */

/* export const SKETCH_7_ARTISTS_SLOTS: ArtistSlot[] = [
  {
    id: 'slot-1',
    slotKey: '1',
    role: 'main',
    roleLabel: '画师 1',
    description: '主风格骨架 (1.80)',
    name: 'juumou_(c5buf)',
    weight: 1.8,
    enabled: true,
  },
  {
    id: 'slot-2',
    slotKey: '2',
    role: 'coloring',
    roleLabel: '画师 2',
    description: '辅助层次 (0.90)',
    name: 'guigui_rongrong',
    weight: 0.9,
    enabled: true,
  },
  {
    id: 'slot-3',
    slotKey: '3',
    role: 'lineart',
    roleLabel: '画师 3',
    description: '线稿控制 (0.80)',
    name: 'wuyu16',
    weight: 0.8,
    enabled: true,
  },
  {
    id: 'slot-4',
    slotKey: '4',
    role: 'lighting',
    roleLabel: '画师 4',
    description: '光影细节 (1.60)',
    name: 'luckyboysquad',
    weight: 1.6,
    enabled: true,
  },
  {
    id: 'slot-5',
    slotKey: '5',
    role: 'custom',
    roleLabel: '画师 5',
    description: '素描调味 (0.60)',
    name: 'honnryou_hanaru',
    weight: 0.6,
    enabled: true,
  },
  {
    id: 'slot-6',
    slotKey: '6',
    role: 'custom',
    roleLabel: '画师 6',
    description: '质感结构 (1.10)',
    name: 'suzumi_(ccroquette)',
    weight: 1.1,
    enabled: true,
  },
  {
    id: 'slot-7',
    slotKey: '7',
    role: 'custom',
    roleLabel: '画师 7',
    description: '笔触造型 (1.50)',
    name: 'rourow',
    weight: 1.5,
    enabled: true,
  },
]; */

export const DEFAULT_QUALITY_PREFIX =
  'masterpiece, best quality, amazing quality, year 2025, year 2026, no text,';

export const DEFAULT_SUBJECT_PROMPT = '1girl, solo, looking at viewer,';

export const DEFAULT_NEGATIVE_PROMPT =
  'nsfw, lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page, lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page, lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page, lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page, lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page, lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page, text, logo, signature, watermark, too many watermarks,artist:matsunaga kouyou::, artist:xinzoruo,artist:milkpanda, artist collaboration,\nchibi, 1990s (style),\nbad anatomy, distorted anatomy, disfigured, bad hands, missing finger, extra digits, mutation, extra arms, extra legs, long neck, bad feet, very displeasing, undetailed eyes,\nmultiple views, negative space, blank page,\nvariant set, large variant set, 4koma, 2koma, oekaki,\nhalftone, screentone, artistic error, film grain, scan artifacts, jpeg artifacts, chromatic aberration, dithering, disorganized colors,\nlowres, worst quality, bad quality, cheesy, sloppiness, unfinished, Incomplete,-2::chibi::,large breasts, huge breasts,bad face,ugly,deformed,worst quality,oily skin,dark,high contrast,tight pants,Limbs that disappear out of nowhere,childish stature,The proportions are incorrect,limbs are fused together,The face does not match the body,black face, Eye-catching bright red, extra people, incorrect eyes, red lips, red face, red ears, honey';

export const DEFAULT_BLACKLIST: string[] = ['eubneung10571'];

export const DEFAULT_REPLACEMENT_TAGS =
  'clean lineart, crisp lineart, thin lineart, delicate lineart, refined lineart';

export const AVAILABLE_MODELS = [
  { id: 'nai-diffusion-5-full', label: 'NAI 5 Full（最新，无过滤）', desc: 'NovelAI V5 完整模型' },
  { id: 'nai-diffusion-5-curated', label: 'NovelAI V5 Curated', desc: '精选训练集，风格更受控' },
  { id: 'nai-diffusion-4-full', label: 'NovelAI V4 Full', desc: '经典 V4 旗舰模型' },
];

export const AVAILABLE_SAMPLERS = [
  { id: 'k_euler', label: 'Euler' },
  { id: 'k_euler_ancestral', label: 'Euler Ancestral' },
  { id: 'k_dpmpp_2m', label: 'DPM++ 2M' },
  { id: 'k_dpmpp_sde', label: 'DPM++ SDE' },
  { id: 'ddim', label: 'DDIM' },
];

export const AVAILABLE_NOISE_SCHEDULES = [
  { id: 'karras', label: 'Karras (官网常用)' },
  { id: 'native', label: 'Native' },
];

export const RESOLUTION_PRESETS = [
  { label: '1024 × 1024 (1:1 正方)', width: 1024, height: 1024 },
  { label: '832 × 1216 (竖屏人像)', width: 832, height: 1216 },
  { label: '1216 × 832 (横屏壁纸)', width: 1216, height: 832 },
  { label: '896 × 1152 (3:4 标准)', width: 896, height: 1152 },
];
