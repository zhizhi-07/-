import { ArtistSlot, ArtistPrefixStyle } from '../types';

export type { ArtistPrefixStyle };

export interface PromptBuildResult {
  artistString: string;
  fullPositivePrompt: string;
  skippedBlacklisted: string[];
  activeArtistsCount: number;
  hasBlacklisted: boolean;
}

/**
 * Normalizes an artist name:
 * - Trims leading/trailing whitespace
 * - Strips leading weight prefix like 1.8:: or 0.8::
 * - Strips 'artist:', 'artist_', 'artist ' or 'artist' prefix (e.g. artistseapall -> seapall, artist juumou_(c5buf) -> juumou_(c5buf))
 * - Preserves Danbooru parentheses like juumou_(c5buf) and suzumi_(ccroquette)
 * - Strips surrounding colons and outer wrapper brackets
 */
export function cleanArtistName(rawName: string): string {
  if (!rawName) return '';
  let cleaned = rawName.trim();

  // Strip leading NovelAI weight if present: 1.8::tag:: or 1.8::tag or 1.8::tag ::
  const weightMatch = cleaned.match(/^([0-9.]+)\s*::\s*(.+?)\s*(?:::)?$/);
  if (weightMatch) {
    cleaned = weightMatch[2].trim();
  }

  // Strip surrounding colons if any
  cleaned = cleaned.replace(/^:+|:+$/g, '').trim();

  // Strip leading 'artist:' / 'artist ' / 'artist_' / 'artistname' (case-insensitive)
  if (/^artist:\s*/i.test(cleaned)) {
    cleaned = cleaned.replace(/^artist:\s*/i, '').trim();
  } else if (/^artist_\s*/i.test(cleaned)) {
    cleaned = cleaned.replace(/^artist_\s*/i, '').trim();
  } else if (/^artist\s+/i.test(cleaned)) {
    cleaned = cleaned.replace(/^artist\s+/i, '').trim();
  } else if (/^artist([a-zA-Z0-9_].*)$/i.test(cleaned)) {
    // Check if it's merged "artistname" (like artistseapall -> seapall, artistwlop -> wlop)
    const m = cleaned.match(/^artist([a-zA-Z0-9_].*)$/i);
    const candidate = m ? m[1].trim() : '';
    if (candidate && !/^(ic|ique|s|ry)$/i.test(candidate)) {
      cleaned = candidate;
    }
  }

  // Strip outer colons and whitespace
  cleaned = cleaned.replace(/^[:\s]+|[:\s]+$/g, '').trim();

  // Strip matching outer brackets only if they wrap the whole string (e.g. {artist:wlop})
  while (
    (cleaned.startsWith('{') && cleaned.endsWith('}')) ||
    (cleaned.startsWith('[') && cleaned.endsWith(']'))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  return cleaned;
}

/**
 * Builds the NovelAI V5 prompt components according to the specifications.
 */
export function buildPrompt(params: {
  slots: ArtistSlot[];
  activeMode?: string;
  singleTestSlotId?: string;
  useArtistPrefix: boolean;
  prefixStyle?: ArtistPrefixStyle;
  qualityPrefix: string;
  styleTags: string;
  subjectPrompt: string;
  blacklist: string[];
  replacementTags: string;
}): PromptBuildResult {
  const {
    slots,
    activeMode,
    singleTestSlotId,
    useArtistPrefix,
    prefixStyle = 'space',
    qualityPrefix,
    styleTags,
    subjectPrompt,
    blacklist,
    replacementTags,
  } = params;

  const normalizedBlacklist = new Set(
    blacklist.map((b) => cleanArtistName(b).toLowerCase()).filter(Boolean)
  );

  const artistTokens: string[] = [];
  const skippedBlacklisted: string[] = [];
  let activeArtistsCount = 0;

  const effectiveSlots =
    activeMode === 'single' && singleTestSlotId
      ? slots.filter((s) => s.id === singleTestSlotId)
      : slots;

  for (const slot of effectiveSlots) {
    if (!slot.enabled) continue;

    const cleanedName = cleanArtistName(slot.name);
    if (!cleanedName) continue;

    // Check against blacklist
    if (normalizedBlacklist.has(cleanedName.toLowerCase())) {
      skippedBlacklisted.push(cleanedName);
      continue;
    }

    activeArtistsCount++;

    // Format weight with max 2 decimals, avoiding trailing zeroes like 1.20 -> 1.2
    const formattedWeight = Number(Math.max(0.05, Math.min(3.0, slot.weight)).toFixed(2));

    // Construct tag format according to prefixStyle:
    // 'space':  1.8::artist juumou_(c5buf) :: (NovelAI V5 官方空格语法)
    // 'colon':  1.8::artist:juumou_(c5buf)::
    // 'merged': 1.8::artistjuumou_(c5buf)::
    // 'none':   1.8::juumou_(c5buf)::
    if (!useArtistPrefix || prefixStyle === 'none') {
      artistTokens.push(`${formattedWeight}::${cleanedName}::`);
    } else if (prefixStyle === 'space') {
      artistTokens.push(`${formattedWeight}::artist ${cleanedName} ::`);
    } else if (prefixStyle === 'merged') {
      artistTokens.push(`${formattedWeight}::artist${cleanedName}::`);
    } else {
      artistTokens.push(`${formattedWeight}::artist:${cleanedName}::`);
    }
  }

  // Join artist tokens with comma and space
  let artistString = artistTokens.length > 0 ? artistTokens.join(', ') : '';

  // If any blacklisted artists were skipped and replacement tags exist, include replacement tags
  const cleanReplacements = (replacementTags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .join(', ');

  // Positive prompt components in exact specified order:
  // 1. 画师串
  // 2. 固定质量前缀
  // 3. 风格补充词 (with replacement tags if blacklisted artists detected)
  // 4. 主体 prompt
  const segments: string[] = [];

  if (artistString) {
    segments.push(artistString);
  }

  const cleanQuality = (qualityPrefix || '').trim().replace(/,+$/, '');
  if (cleanQuality) {
    segments.push(cleanQuality);
  }

  // Combine style tags and any triggered replacement tags
  const styleParts: string[] = [];
  const trimmedStyleTags = (styleTags || '').trim().replace(/,+$/, '');
  if (trimmedStyleTags) {
    styleParts.push(trimmedStyleTags);
  }
  if (skippedBlacklisted.length > 0 && cleanReplacements) {
    styleParts.push(cleanReplacements);
  }

  if (styleParts.length > 0) {
    segments.push(styleParts.join(', '));
  }

  const cleanSubject = (subjectPrompt || '').trim().replace(/,+$/, '');
  if (cleanSubject) {
    segments.push(cleanSubject);
  }

  // Final positive prompt: join with comma, ensuring trailing comma style if customary
  const fullPositivePrompt = segments.length > 0 ? `${segments.join(',\n')},` : '';

  return {
    artistString: artistTokens.length > 0 ? `${artistTokens.join(',\n')},` : '',
    fullPositivePrompt,
    skippedBlacklisted,
    activeArtistsCount,
    hasBlacklisted: skippedBlacklisted.length > 0,
  };
}
