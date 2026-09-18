/**
 * NovelAI & WebUI Image Metadata Parser
 * Extracts prompt, negative prompt, seed, sampler, steps, cfg scale, and artist tags from PNG/JPEG image files.
 */

import { parseRawPromptInput, ParsedPromptData } from './promptParser';

export interface ExtractedImageMetadata {
  hasMetadata: boolean;
  software?: string;
  prompt: string;
  negativePrompt: string;
  steps?: number;
  scale?: number;
  seed?: number;
  sampler?: string;
  width?: number;
  height?: number;
  model?: string;
  rawJson?: any;
  thumbnailUrl: string;
  parsedPromptData: ParsedPromptData;
}

/**
 * Extracts metadata from a PNG ArrayBuffer by inspecting PNG chunks (tEXt, iTXt, zTXt)
 */
export async function parseImageFile(file: File): Promise<ExtractedImageMetadata> {
  const thumbnailUrl = URL.createObjectURL(file);
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  let rawPrompt = '';
  let rawNegative = '';
  let software = '';
  let steps: number | undefined;
  let scale: number | undefined;
  let seed: number | undefined;
  let sampler: string | undefined;
  let width: number | undefined;
  let height: number | undefined;
  let model: string | undefined;
  let rawJson: any = null;

  // Check if it's a PNG: signature [137, 80, 78, 71, 13, 10, 26, 10]
  const isPng =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;

  if (isPng) {
    const dataView = new DataView(buffer);
    let offset = 8;
    const textDecoder = new TextDecoder('utf-8');

    while (offset < buffer.byteLength - 8) {
      const length = dataView.getUint32(offset);
      const type = String.fromCharCode(
        bytes[offset + 4],
        bytes[offset + 5],
        bytes[offset + 6],
        bytes[offset + 7]
      );

      const chunkDataStart = offset + 8;
      const chunkData = bytes.subarray(chunkDataStart, chunkDataStart + length);

      if (type === 'tEXt' || type === 'iTXt') {
        // Find null separator
        let nullIdx = 0;
        while (nullIdx < chunkData.length && chunkData[nullIdx] !== 0) {
          nullIdx++;
        }
        const keyword = textDecoder.decode(chunkData.subarray(0, nullIdx)).trim();
        let textContent = '';

        if (type === 'tEXt') {
          textContent = textDecoder.decode(chunkData.subarray(nullIdx + 1));
        } else if (type === 'iTXt') {
          // iTXt format: keyword \0 compressionFlag compressionMethod langTag \0 transKey \0 text
          const compressionFlag = chunkData[nullIdx + 1];
          let nextNull = nullIdx + 3;
          while (nextNull < chunkData.length && chunkData[nextNull] !== 0) nextNull++;
          nextNull++; // skip transKey null
          while (nextNull < chunkData.length && chunkData[nextNull] !== 0) nextNull++;
          nextNull++;

          if (compressionFlag === 0) {
            textContent = textDecoder.decode(chunkData.subarray(nextNull));
          } else {
            // Compressed iTXt - attempt browser DecompressionStream or scan
            try {
              if (typeof DecompressionStream !== 'undefined') {
                const ds = new DecompressionStream('deflate');
                const writer = ds.writable.getWriter();
                writer.write(chunkData.subarray(nextNull));
                writer.close();
                const decompressed = await new Response(ds.readable).arrayBuffer();
                textContent = textDecoder.decode(decompressed);
              }
            } catch {
              // Fallback to text decoding
            }
          }
        }

        // NovelAI format:
        // Keyword: Description -> raw prompt
        // Keyword: Comment -> JSON { prompt, uc, steps, sampler, seed, scale, ... }
        // Keyword: Software -> "NovelAI"
        if (keyword === 'Software') {
          software = textContent.trim();
        } else if (keyword === 'Description') {
          if (!rawPrompt) rawPrompt = textContent.trim();
        } else if (keyword === 'Comment') {
          try {
            const parsed = JSON.parse(textContent);
            rawJson = parsed;
            if (parsed.prompt) rawPrompt = parsed.prompt;
            if (parsed.uc) rawNegative = parsed.uc;
            if (parsed.steps) steps = parsed.steps;
            if (parsed.scale) scale = parsed.scale;
            if (parsed.seed) seed = parsed.seed;
            if (parsed.sampler) sampler = parsed.sampler;
            if (parsed.width) width = parsed.width;
            if (parsed.height) height = parsed.height;
            if (parsed.Source || parsed.model) model = parsed.Source || parsed.model;
            software = software || 'NovelAI';
          } catch {
            // Not json, might be raw string
            if (!rawPrompt) rawPrompt = textContent.trim();
          }
        } else if (keyword === 'parameters') {
          // WebUI / Stable Diffusion standard format
          software = software || 'Stable Diffusion / WebUI';
          rawPrompt = textContent.trim();
        } else if (keyword === 'prompt' && !rawPrompt) {
          rawPrompt = textContent.trim();
        }
      }

      // Move to next chunk (Length + Type(4) + Length + CRC(4))
      offset += 12 + length;
    }
  }

  // Fallback: Scan text in binary if no chunks gave prompt (or if JPEG/WebP)
  if (!rawPrompt) {
    try {
      const textDecoder = new TextDecoder('utf-8', { fatal: false });
      const fullText = textDecoder.decode(bytes.subarray(0, Math.min(bytes.length, 500000)));

      // Check NovelAI JSON signature in binary
      const jsonMatch = fullText.match(/\{"prompt"\s*:\s*".*?"(?:\s*,\s*"uc"\s*:\s*".*?")?.*?\}/s);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          rawJson = parsed;
          if (parsed.prompt) rawPrompt = parsed.prompt;
          if (parsed.uc) rawNegative = parsed.uc;
          if (parsed.steps) steps = parsed.steps;
          if (parsed.scale) scale = parsed.scale;
          if (parsed.seed) seed = parsed.seed;
          if (parsed.sampler) sampler = parsed.sampler;
          software = 'NovelAI';
        } catch {
          // Ignore
        }
      }

      // Check WebUI "parameters" signature
      if (!rawPrompt) {
        const paramMatch = fullText.match(/parameters[\0\s]+([\s\S]*?)(?=(?:Steps:|\0))/i);
        if (paramMatch) {
          rawPrompt = paramMatch[1].trim();
          software = 'WebUI / SD';
        }
      }
    } catch {
      // Ignore scan failure
    }
  }

  // Assemble full text to pass into parseRawPromptInput
  let fullPromptString = rawPrompt;
  if (rawNegative && !fullPromptString.toLowerCase().includes('negative prompt:')) {
    fullPromptString += `\nNegative prompt: ${rawNegative}`;
  }
  if (steps && !fullPromptString.toLowerCase().includes('steps:')) {
    fullPromptString += `\nSteps: ${steps}, Sampler: ${sampler || 'Euler'}, CFG scale: ${scale || 5}, Seed: ${seed || 0}`;
  }

  const parsedPromptData = parseRawPromptInput(fullPromptString);

  return {
    hasMetadata: Boolean(rawPrompt || parsedPromptData.artists.length > 0),
    software: software || (parsedPromptData.artists.length > 0 ? 'NovelAI' : undefined),
    prompt: rawPrompt,
    negativePrompt: rawNegative || parsedPromptData.negativePrompt,
    steps: steps || parsedPromptData.extractedParameters.steps,
    scale: scale || parsedPromptData.extractedParameters.scale,
    seed: seed || parsedPromptData.extractedParameters.seed,
    sampler: sampler || parsedPromptData.extractedParameters.sampler,
    width: width || parsedPromptData.extractedParameters.width,
    height: height || parsedPromptData.extractedParameters.height,
    model: model || parsedPromptData.extractedParameters.model,
    rawJson,
    thumbnailUrl,
    parsedPromptData,
  };
}
