/**
 * NovelAI V5 Prompt Parser & Auto-fill Engine
 * 
 * Supports parsing:
 * 1. Raw prompt tag strings (e.g. "artist:fonmant, {artist:kkato:0.9}, [artist:wlop], 1girl, garden")
 * 2. NovelAI / Stable Diffusion full image metadata logs:
 *    Prompt: ...
 *    Negative prompt: ...
 *    Steps: 28, Sampler: Euler, CFG scale: 5, Seed: 123456, Size: 1024x1024, Model: nai-diffusion-5-full
 * 3. Tag weight notations:
 *    - Curly braces: {tag} (+5%), {{tag}} (+10%), {tag:1.2}
 *    - Square brackets: [tag] (-5%), [[tag]] (-10%), [tag:0.6]
 *    - Parentheses: (tag:1.3)
 *    - Prefixes: "artist:", "art by ", "drawn by "
 */

export interface ParsedArtist {
  rawTag: string;
  name: string;
  weight: number;
  suggestedRole?: 'main' | 'coloring' | 'lineart' | 'lighting';
}

export interface ParsedPromptData {
  artists: ParsedArtist[];
  qualityPrompt: string;
  stylePrompt: string;
  subjectPrompt: string;
  negativePrompt: string;
  extractedParameters: {
    steps?: number;
    scale?: number;
    seed?: number;
    width?: number;
    height?: number;
    sampler?: string;
    model?: string;
  };
  totalDetectedTags: number;
}

export const COMMON_QUALITY_TAGS = [
  'masterpiece',
  'best quality',
  'bestquality',
  'amazing quality',
  'great quality',
  'high quality',
  'high-quality',
  'highquality',
  'normal quality',
  'bad quality',
  'worst quality',
  'very aesthetic',
  'aesthetic',
  'year 2025',
  'year 2026',
  'year 2024',
  'newest',
  'absurdres',
  'highres',
  'high res',
  'high resolution',
  'high-resolution',
  'ultra detailed',
  'ultra-detailed',
  'no text',
  'notext',
  'filterclear',
  'excellent',
];

export const COMMON_STYLE_TAGS = [
  'clean rough sketch',
  'rough sketch',
  'sketch',
  'simple black line art',
  'black line art',
  'clean lineart',
  'delicate lineart',
  'thick lineart',
  'lineart',
  'line art',
  'subtl grey shading',
  'subtle grey shading',
  'grey shading',
  'gray shading',
  'shading',
  'monochrome',
  'grayscale',
  'ink',
  'traditional media',
  '2.5d',
  'anime coloring',
  'soft coloring',
  'flat color',
  'flat colors',
  'dramatic lighting',
  'cinematic lighting',
  'rim light',
  'backlighting',
  'high complexity',
  'depthness',
  'detailed background',
  'simple background',
  'white background',
  'black background',
  'perspective',
  'shadows',
  'style hazy',
  'hazy',
];

export const COMMON_SUBJECT_WORDS = [
  '1girl', '2girls', '3girls', '4girls', '5girls',
  '1boy', '2boys', '3boys',
  '1other', 'solo', 'multiple girls', 'multiple boys',
  'breasts', 'hair', 'eyes', 'dress', 'shirt', 'skirt', 'pants', 'jacket', 'shoes',
  'upper body', 'lower body', 'full body', 'portrait', 'close-up', 'cowboy shot',
  'looking at viewer', 'sitting', 'standing', 'lying', 'walking', 'smile', 'blush',
  'background', 'scenery', 'outdoors', 'indoors', 'sky', 'cloud', 'flower', 'water',
  'tree', 'sunlight', 'night', 'day', 'street', 'room'
];

/**
 * Checks if a token is a generic subject keyword (so we don't mistakenly treat 1girl as an artist)
 */
export function isGenericSubjectWord(cleanTag: string): boolean {
  const lower = cleanTag.toLowerCase().trim();
  return COMMON_SUBJECT_WORDS.some((w) => lower === w || lower.startsWith(w + ' '));
}

/**
 * Checks if a token is a quality tag (supports variations like best quality / bestquality / notext.)
 */
export function isQualityTag(cleanTag: string): boolean {
  const norm = cleanTag.toLowerCase().trim().replace(/[.]+$/, '');
  const compact = norm.replace(/[\s\-_]+/g, '');
  return COMMON_QUALITY_TAGS.some((q) => {
    const qNorm = q.toLowerCase();
    const qCompact = qNorm.replace(/[\s\-_]+/g, '');
    return norm === qNorm || compact === qCompact;
  });
}

/**
 * Checks if a token is related to drawing style / rendering medium
 */
export function isStyleTag(cleanTag: string): boolean {
  const lower = cleanTag.toLowerCase().trim().replace(/[.]+$/, '');
  if (COMMON_STYLE_TAGS.some((s) => lower === s || lower.startsWith(s))) {
    return true;
  }
  // Check common style keywords
  if (
    lower.includes('sketch') ||
    lower.includes('line art') ||
    lower.includes('lineart') ||
    lower.includes('shading') ||
    lower.includes('monochrome') ||
    lower.includes('grayscale') ||
    lower.includes('coloring') ||
    lower.includes('perspective') ||
    lower.includes('shadows') ||
    lower.includes('hazy')
  ) {
    return true;
  }
  return false;
}

/**
 * Smart Tokenizer:
 * Splits prompt text into tokens by commas, newlines, semicolons, and sentence-ending periods.
 * Crucially:
 * - Keeps NovelAI character binding blocks like `{tag1, tag2} & {tag3, tag4}` unbroken.
 * - Keeps nested braces/brackets intact.
 * - Splits sentence enders like "notext. An intimate..." into "notext" and "An intimate".
 */
export function splitPromptTokens(text: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let braceDepth = 0; // {}
  let bracketDepth = 0; // []
  let parenDepth = 0; // ()

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const prev = i > 0 ? text[i - 1] : '';
    const next = i < text.length - 1 ? text[i + 1] : '';

    if (ch === '{') braceDepth++;
    else if (ch === '}') braceDepth = Math.max(0, braceDepth - 1);
    else if (ch === '[') bracketDepth++;
    else if (ch === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (ch === '(') parenDepth++;
    else if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);

    const isInsideGroup = braceDepth > 0 || bracketDepth > 0 || parenDepth > 0;

    let isDelimiter = false;
    if (!isInsideGroup) {
      if (
        ch === ',' ||
        ch === '，' ||
        ch === ';' ||
        ch === '；' ||
        ch === '\n' ||
        ch === '\r' ||
        ch === '。'
      ) {
        isDelimiter = true;
      } else if (ch === '.' && /\s/.test(next) && !/\d/.test(prev)) {
        // e.g. "notext. An intimate" -> split before "An intimate"
        isDelimiter = true;
      }
    }

    if (isDelimiter) {
      const trimmed = current.trim();
      if (trimmed) tokens.push(trimmed);
      current = '';
    } else {
      current += ch;
    }
  }

  const last = current.trim();
  if (last) tokens.push(last);
  return tokens;
}

/**
 * Calculates weight from wrapped brackets, NovelAI :: syntax, or explicit weight format
 * e.g.:
 *  - 1.8::artist juumou_(c5buf) :: -> weight: 1.8, artist: juumou_(c5buf)
 *  - 0.8::artist:bm94199 :: -> weight: 0.8, artist: bm94199
 *  - 0.8::solipsist:: -> weight: 0.8, artist: solipsist
 *  - 1.2::kirochy:: -> weight: 1.2, artist: kirochy
 *  - {artist:wlop:1.2} -> weight: 1.2, artist: wlop
 *  - {{{tag}}} -> 1.15, [tag] -> 0.95
 */
export function extractTagAndWeight(raw: string): {
  cleanTag: string;
  weight: number;
  isArtist: boolean;
  artistName: string;
  hasDoubleColonWeight: boolean;
} {
  let str = raw.trim();
  let weight = 1.0;
  let hasDoubleColonWeight = false;

  // 1. NovelAI double colon syntax: 1.8::artist juumou_(c5buf) :: or 0.8::solipsist:: or 0.8::tag
  const naiFrontWeightMatch = str.match(/^([0-9.]+)\s*::\s*(.+?)(?:\s*::)?$/);
  if (naiFrontWeightMatch) {
    const candidateVal = parseFloat(naiFrontWeightMatch[1]);
    if (!isNaN(candidateVal)) {
      weight = Math.min(Math.max(candidateVal, 0.05), 3.0);
      str = naiFrontWeightMatch[2].trim();
      hasDoubleColonWeight = true;
    }
  }

  // 2. Reverse NovelAI double colon syntax: tag::0.8 or ::tag::0.8
  const naiRearWeightMatch = str.match(/^(?:::)?\s*(.+?)\s*::\s*([0-9.]+)$/);
  if (naiRearWeightMatch) {
    const candidateVal = parseFloat(naiRearWeightMatch[2]);
    if (!isNaN(candidateVal)) {
      weight = Math.min(Math.max(candidateVal, 0.05), 3.0);
      str = naiRearWeightMatch[1].trim();
      hasDoubleColonWeight = true;
    }
  }

  // 3. Surrounded by ::tag:: without explicit outer weight
  if (str.startsWith('::') && str.endsWith('::')) {
    str = str.slice(2, -2).trim();
    hasDoubleColonWeight = true;
  }

  // 4. Check explicit weight like (tag:1.25) or {tag:1.25} or tag:1.25
  const explicitMatch = str.match(/^[({[]?(.+?):([0-9.]+)[)}\]]?$/);
  if (explicitMatch) {
    const candidateTag = explicitMatch[1].trim();
    const candidateVal = parseFloat(explicitMatch[2]);
    // Ensure it's not "artist:wlop" where "wlop" is the name!
    if (!isNaN(candidateVal) && !candidateTag.toLowerCase().startsWith('artist')) {
      str = candidateTag;
      weight = Math.min(Math.max(candidateVal, 0.05), 3.0);
    }
  }

  // 5. Count leading & trailing braces {}
  let openBraces = 0;
  while (str.startsWith('{') && str.endsWith('}')) {
    openBraces++;
    str = str.slice(1, -1).trim();
  }

  // 6. Count leading & trailing brackets []
  let openBrackets = 0;
  while (str.startsWith('[') && str.endsWith(']')) {
    openBrackets++;
    str = str.slice(1, -1).trim();
  }

  // 7. Check outer parentheses only if they wrap non-artist tags, e.g. (tag)
  // Be careful NOT to strip (tag) if it's a Danbooru name like juumou_(c5buf) or flamma (immortalemignis)
  if (str.startsWith('(') && str.endsWith(')') && !str.includes('_(') && !str.includes(' (')) {
    openBraces++;
    str = str.slice(1, -1).trim();
  }

  // 8. Check internal weight again if syntax was {artist:wlop:1.2}
  const innerWeightMatch = str.match(/^(.+?):([0-9.]+)$/);
  if (innerWeightMatch) {
    const val = parseFloat(innerWeightMatch[2]);
    if (!isNaN(val)) {
      str = innerWeightMatch[1].trim();
      weight = Math.min(Math.max(val, 0.05), 3.0);
    }
  }

  if (openBraces > 0 && weight === 1.0) {
    // NovelAI: each {} is 1.05x
    weight = Math.round(Math.pow(1.05, openBraces) * 100) / 100;
  } else if (openBrackets > 0 && weight === 1.0) {
    // NovelAI: each [] is 0.95x
    weight = Math.round(Math.pow(0.95, openBrackets) * 100) / 100;
  }

  // Clean remaining colons from ends
  str = str.replace(/^:+|:+$/g, '').trim();

  // 9. Check if it's an artist tag
  let isArtist = false;
  let artistName = '';

  const lower = str.toLowerCase();
  if (lower.startsWith('artist:')) {
    isArtist = true;
    artistName = str.slice(7).trim();
  } else if (lower.startsWith('artist_')) {
    isArtist = true;
    artistName = str.slice(7).trim();
  } else if (lower.startsWith('artist ')) {
    isArtist = true;
    artistName = str.slice(7).trim();
  } else if (lower.startsWith('art by ')) {
    isArtist = true;
    artistName = str.slice(7).trim();
  } else if (lower.startsWith('drawn by ')) {
    isArtist = true;
    artistName = str.slice(9).trim();
  } else if (lower.startsWith('by ')) {
    isArtist = true;
    artistName = str.slice(3).trim();
  } else if (/^artist([a-zA-Z0-9_].*)$/i.test(str)) {
    // Matches "artistseapall", "artistwlop", "artistkirochy", etc. without colon
    const m = str.match(/^artist([a-zA-Z0-9_].*)$/i);
    const candidate = m ? m[1].trim() : '';
    // Exclude common words like "artistic", "artistique"
    if (candidate && !/^(ic|ique|s|ry)$/i.test(candidate)) {
      isArtist = true;
      artistName = candidate;
    }
  } else if (
    hasDoubleColonWeight &&
    !isQualityTag(str) &&
    !isStyleTag(str) &&
    !isGenericSubjectWord(str)
  ) {
    // NovelAI syntax: e.g. "0.8::solipsist::", "1.2::kirochy::", "1.2::iotaectoplasm::"
    // User weighted an artist tag with double colons without repeating "artist:"
    isArtist = true;
    artistName = str;
  }

  // Clean artistName: strip outer colons and whitespace, but preserve Danbooru parentheses like juumou_(c5buf) and flamma (immortalemignis)
  if (artistName) {
    artistName = artistName.replace(/^[:\s]+|[:\s]+$/g, '').trim();
    while (
      (artistName.startsWith('{') && artistName.endsWith('}')) ||
      (artistName.startsWith('[') && artistName.endsWith(']'))
    ) {
      artistName = artistName.slice(1, -1).trim();
    }
  }

  return {
    cleanTag: str,
    weight: Math.round(weight * 100) / 100,
    isArtist,
    artistName,
    hasDoubleColonWeight,
  };
}

/**
 * Main parser entry point
 */
export function parseRawPromptInput(rawInput: string): ParsedPromptData {
  if (!rawInput || !rawInput.trim()) {
    return {
      artists: [],
      qualityPrompt: '',
      stylePrompt: '',
      subjectPrompt: '',
      negativePrompt: '',
      extractedParameters: {},
      totalDetectedTags: 0,
    };
  }

  const text = rawInput.trim();
  let positivePart = text;
  let negativePart = '';
  let metadataPart = '';

  // 1. Separate NovelAI / WebUI sections
  // Format check: "Negative prompt: ...", "Negative: ...", "Undesired Content: ...", "uc: ..."
  const negativeRegex = /(?:negative\s*prompt|negative|undesired\s*content|uc)\s*:\s*([\s\S]*?)(?=(?:\n(?:steps|sampler|cfg|seed|size|model)\s*:)|$)/i;
  const negMatch = positivePart.match(negativeRegex);
  if (negMatch) {
    negativePart = negMatch[1].trim();
    // Trim negative prompt from positivePart
    const splitIndex = positivePart.indexOf(negMatch[0]);
    metadataPart = positivePart.slice(splitIndex + negMatch[0].length);
    positivePart = positivePart.slice(0, splitIndex).trim();
  }

  // Check if positive part starts with "Prompt: "
  if (/^prompt\s*:\s*/i.test(positivePart)) {
    positivePart = positivePart.replace(/^prompt\s*:\s*/i, '').trim();
  }

  // 2. Extract metadata parameters (Steps, Sampler, CFG scale, Seed, Size, Model)
  const fullTextForMeta = text;
  const params: ParsedPromptData['extractedParameters'] = {};

  const stepsMatch = fullTextForMeta.match(/steps\s*:\s*(\d+)/i);
  if (stepsMatch) params.steps = parseInt(stepsMatch[1], 10);

  const scaleMatch = fullTextForMeta.match(/(?:cfg\s*scale|scale)\s*:\s*([0-9.]+)/i);
  if (scaleMatch) params.scale = parseFloat(scaleMatch[1]);

  const seedMatch = fullTextForMeta.match(/seed\s*:\s*(\d+)/i);
  if (seedMatch) params.seed = parseInt(seedMatch[1], 10);

  const sizeMatch = fullTextForMeta.match(/(?:size|resolution)\s*:\s*(\d+)\s*[x×]\s*(\d+)/i);
  if (sizeMatch) {
    params.width = parseInt(sizeMatch[1], 10);
    params.height = parseInt(sizeMatch[2], 10);
  }

  const samplerMatch = fullTextForMeta.match(/sampler\s*:\s*([a-zA-Z0-9_+]+)/i);
  if (samplerMatch) {
    const sName = samplerMatch[1].toLowerCase();
    if (sName.includes('euler_a') || sName.includes('ancestral')) params.sampler = 'k_euler_ancestral';
    else if (sName.includes('euler')) params.sampler = 'k_euler';
    else if (sName.includes('dpmpp_2m') || sName.includes('dpm++_2m')) params.sampler = 'k_dpmpp_2m';
    else if (sName.includes('dpmpp_sde') || sName.includes('sde')) params.sampler = 'k_dpmpp_sde';
    else if (sName.includes('ddim')) params.sampler = 'ddim';
  }

  const modelMatch = fullTextForMeta.match(/model\s*:\s*([a-zA-Z0-9_-]+)/i);
  if (modelMatch) {
    const mName = modelMatch[1].toLowerCase();
    if (mName.includes('v5') || mName.includes('5-full')) params.model = 'nai-diffusion-5-full';
    else if (mName.includes('curated')) params.model = 'nai-diffusion-5-curated';
    else if (mName.includes('v4') || mName.includes('4-full')) params.model = 'nai-diffusion-4-full';
  }

  // 3. Tokenize positive prompt using smart tokenizer
  const rawTokens = splitPromptTokens(positivePart);

  const artists: ParsedArtist[] = [];
  const qualityTags: string[] = [];
  const styleTags: string[] = [];
  const subjectTags: string[] = [];

  const seenQuality = new Set<string>();
  const seenStyle = new Set<string>();

  const roleOrder: Array<'main' | 'coloring' | 'lineart' | 'lighting'> = [
    'main',
    'coloring',
    'lineart',
    'lighting',
  ];

  rawTokens.forEach((token) => {
    // If token is purely conversational Chinese (e.g. "完整的应该差不多吧", "差不多吧"), skip it
    if (/^[\u4e00-\u9fa5\s，。！？、]+$/.test(token)) {
      return;
    }

    const parsed = extractTagAndWeight(token);

    if (parsed.isArtist) {
      const suggestedRole = roleOrder[artists.length] || 'lighting';
      artists.push({
        rawTag: token,
        name: parsed.artistName,
        weight: parsed.weight,
        suggestedRole,
      });
    } else if (isQualityTag(parsed.cleanTag)) {
      // Deduplicate quality tags case-insensitively and without punctuation
      const key = parsed.cleanTag.toLowerCase().replace(/[\s\-_.]+/g, '');
      if (!seenQuality.has(key)) {
        seenQuality.add(key);
        // Trim trailing periods (e.g. "notext." -> "notext")
        qualityTags.push(parsed.cleanTag.replace(/[.]+$/, ''));
      }
    } else if (isStyleTag(parsed.cleanTag)) {
      const key = parsed.cleanTag.toLowerCase().replace(/[\s\-_.]+/g, '');
      if (!seenStyle.has(key)) {
        seenStyle.add(key);
        styleTags.push(token);
      }
    } else {
      subjectTags.push(token);
    }
  });

  return {
    artists,
    qualityPrompt: qualityTags.join(', '),
    stylePrompt: styleTags.join(', '),
    subjectPrompt: subjectTags.join(', '),
    negativePrompt: negativePart,
    extractedParameters: params,
    totalDetectedTags: rawTokens.length,
  };
}
