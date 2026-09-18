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

export const DEFAULT_QUALITY_PREFIX =
  'masterpiece, best quality, amazing quality, year 2025, year 2026, no text,';

export const DEFAULT_SUBJECT_PROMPT = '1girl, solo, looking at viewer,';

export const DEFAULT_NEGATIVE_PROMPT =
  'nsfw, lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page, lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page, lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page, lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page, lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page, lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page, text, logo, signature, watermark, too many watermarks,artist:matsunaga kouyou::, artist:xinzoruo,artist:milkpanda, artist collaboration,\nchibi, 1990s (style),\nbad anatomy, distorted anatomy, disfigured, bad hands, missing finger, extra digits, mutation, extra arms, extra legs, long neck, bad feet, very displeasing, undetailed eyes,\nmultiple views, negative space, blank page,\nvariant set, large variant set, 4koma, 2koma, oekaki,\nhalftone, screentone, artistic error, film grain, scan artifacts, jpeg artifacts, chromatic aberration, dithering, disorganized colors,\nlowres, worst quality, bad quality, cheesy, sloppiness, unfinished, Incomplete,-2::chibi::,large breasts, huge breasts,bad face,ugly,deformed,worst quality,oily skin,dark,high contrast,tight pants,Limbs that disappear out of nowhere,childish stature,The proportions are incorrect,limbs are fused together,The face does not match the body,black face, Eye-catching bright red, extra people, incorrect eyes, red lips, red face, red ears, honey';

export const DEFAULT_BLACKLIST: string[] = ['eubneung10571'];

export const DEFAULT_REPLACEMENT_TAGS =
  'clean lineart, crisp lineart, thin lineart, delicate lineart, refined lineart';

export const AVAILABLE_MODELS = [
  { id: 'nai-diffusion-5-full', label: 'NovelAI V5 Full (推荐)', desc: '最新旗舰完整模型，色彩与构图表现最强' },
  { id: 'nai-diffusion-5-curated', label: 'NovelAI V5 Curated', desc: '精选训练集，风格更受控' },
  { id: 'nai-diffusion-4-full', label: 'NovelAI V4 Full', desc: '经典 V4 旗舰模型' },
];

export const AVAILABLE_SAMPLERS = [
  { id: 'k_euler_ancestral', label: 'Euler Ancestral (官网推荐)' },
  { id: 'k_dpmpp_2m', label: 'DPM++ 2M (官网推荐)' },
  { id: 'k_euler', label: 'Euler' },
  { id: 'k_dpmpp_sde', label: 'DPM++ SDE' },
  { id: 'ddim', label: 'DDIM' },
];

export const RESOLUTION_PRESETS = [
  { label: '1024 × 1024 (1:1 正方)', width: 1024, height: 1024 },
  { label: '832 × 1216 (竖屏人像)', width: 832, height: 1216 },
  { label: '1216 × 832 (横屏壁纸)', width: 1216, height: 832 },
  { label: '896 × 1152 (3:4 标准)', width: 896, height: 1152 },
];
