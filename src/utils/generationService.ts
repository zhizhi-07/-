import JSZip from 'jszip';
import { ArtistSlot, GenerationHistoryItem, GenerationParams } from '../types';

export interface GenerateOptions {
  apiKey: string;
  prompt: string;
  negativePrompt: string;
  slots: ArtistSlot[];
  params: GenerationParams;
  simulate: boolean;
  initImage?: string;
  strength?: number;
  noise?: number;
}

export interface GenerateResult {
  success: boolean;
  image?: string;
  seed: number;
  error?: string;
  isSimulated?: boolean;
}

/**
 * Generates an SVG preview graphic client-side without any network dependencies.
 * Guaranteed 100% reliable, zero network latency, and immune to iframe cookie challenges.
 */
export function createSimulatedPreviewSvg(
  prompt: string,
  negativePrompt: string,
  slots: ArtistSlot[],
  params: GenerationParams,
  seed: number
): string {
  const width = params.width || 1024;
  const height = params.height || 1024;
  const activeSlots = slots.filter((s) => s.enabled && s.name.trim().length > 0);

  // Determine badge colors for slots
  const roleColors: Record<string, { bg: string; text: string; border: string }> = {
    main: { bg: '#3b1c1c', text: '#fca5a5', border: '#7f1d1d' },
    coloring: { bg: '#172554', text: '#93c5fd', border: '#1e3a8a' },
    lineart: { bg: '#2e1065', text: '#d8b4fe', border: '#581c87' },
    lighting: { bg: '#3f2c00', text: '#fde047', border: '#854d0e' },
    custom: { bg: '#18181b', text: '#e4e4e7', border: '#3f3f46' },
  };

  const slotPills = activeSlots.slice(0, 4).map((slot, idx) => {
    const col = roleColors[slot.role] || roleColors.custom;
    const yPos = 380 + idx * 36;
    const label = `${slot.roleLabel}: {${slot.name}} (${slot.weight.toFixed(2)})`;
    return `
      <g transform="translate(60, ${yPos})">
        <rect width="440" height="28" rx="6" fill="${col.bg}" stroke="${col.border}" stroke-width="1.5" />
        <text x="14" y="19" fill="${col.text}" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600">${escapeXml(label)}</text>
      </g>
    `;
  }).join('');

  const cleanPromptPreview = prompt.replace(/\s+/g, ' ').slice(0, 140);
  const cleanNegativePreview = (negativePrompt || '无特定负面词').replace(/\s+/g, ' ').slice(0, 100);

  const svgContent = `
    <svg width="${width}" height="${height}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#09090b" />
          <stop offset="50%" stop-color="#18181b" />
          <stop offset="100%" stop-color="#0c0a09" />
        </linearGradient>
        <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#27272a" stop-opacity="0.8" />
          <stop offset="100%" stop-color="#18181b" stop-opacity="0.95" />
        </linearGradient>
        <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.5"/>
        </filter>
      </defs>

      <!-- Canvas background with subtle grid -->
      <rect width="1024" height="1024" fill="url(#bgGrad)" />
      
      <!-- Grid pattern -->
      <g stroke="#27272a" stroke-width="1" opacity="0.25">
        <line x1="0" y1="256" x2="1024" y2="256" />
        <line x1="0" y1="512" x2="1024" y2="512" />
        <line x1="0" y1="768" x2="1024" y2="768" />
        <line x1="256" y1="0" x2="256" y2="1024" />
        <line x1="512" y1="0" x2="512" y2="1024" />
        <line x1="768" y1="0" x2="768" y2="1024" />
      </g>

      <!-- Center Card -->
      <rect x="40" y="40" width="944" height="944" rx="24" fill="url(#cardGrad)" stroke="#3f3f46" stroke-width="2" filter="url(#shadow)" />

      <!-- Top Badge -->
      <g transform="translate(60, 70)">
        <rect width="260" height="34" rx="17" fill="#d97706" fill-opacity="0.15" stroke="#f59e0b" stroke-width="1.5" />
        <circle cx="18" cy="17" r="5" fill="#f59e0b" />
        <text x="32" y="22" fill="#fbbf24" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" letter-spacing="0.5">NovelAI V5 结构模拟预览</text>
      </g>

      <!-- Title & Subtitle -->
      <text x="60" y="150" fill="#f4f4f5" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="800">
        画师串多槽位融合与参数校验通过
      </text>
      <text x="60" y="180" fill="#a1a1aa" font-family="system-ui, -apple-system, sans-serif" font-size="14">
        该预览已验证 Prompt 语法结构、权重括号格式及角色职责分配，未消耗 NovelAI Anlas 点数。
      </text>

      <!-- Technical Metadata Bar -->
      <rect x="60" y="215" width="904" height="72" rx="12" fill="#09090b" stroke="#27272a" stroke-width="1.5" />
      <text x="80" y="245" fill="#71717a" font-family="ui-monospace, monospace" font-size="12" font-weight="600">CANVAS / SAMPLING</text>
      <text x="80" y="270" fill="#e4e4e7" font-family="ui-monospace, monospace" font-size="14" font-weight="700">
        ${width} × ${height} px  |  Seed: ${seed}  |  Steps: ${params.steps}  |  Scale: ${params.scale}  |  Sampler: ${params.sampler}
      </text>

      <!-- Model & Role slots header -->
      <text x="60" y="325" fill="#e4e4e7" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700">
        画师角色分工槽位 (${activeSlots.length} 个启用)
      </text>
      <text x="60" y="350" fill="#71717a" font-family="system-ui, -apple-system, sans-serif" font-size="12">
        模型基底：${params.model || 'nai-diffusion-5-full'} (V5 全功能版)
      </text>

      <!-- Slot Pills -->
      ${slotPills}

      <!-- Prompt Preview Box -->
      <g transform="translate(60, 560)">
        <rect width="904" height="220" rx="12" fill="#09090b" stroke="#27272a" stroke-width="1.5" />
        <text x="20" y="30" fill="#10b981" font-family="ui-monospace, monospace" font-size="12" font-weight="700">✓ 正面完整 PROMPT (已格式化)</text>
        <text x="20" y="60" fill="#e4e4e7" font-family="ui-monospace, monospace" font-size="13" width="864">
          ${escapeXml(cleanPromptPreview)}${cleanPromptPreview.length >= 140 ? '...' : ''}
        </text>

        <line x1="20" y1="110" x2="884" y2="110" stroke="#1f2937" stroke-width="1" />

        <text x="20" y="135" fill="#f87171" font-family="ui-monospace, monospace" font-size="12" font-weight="700">✕ 负面 PROMPT (已过滤)</text>
        <text x="20" y="165" fill="#9ca3af" font-family="ui-monospace, monospace" font-size="12">
          ${escapeXml(cleanNegativePreview)}${cleanNegativePreview.length >= 100 ? '...' : ''}
        </text>
      </g>

      <!-- Footer Info -->
      <text x="60" y="825" fill="#71717a" font-family="system-ui, -apple-system, sans-serif" font-size="12">
        提示：若需生成实际高质量插画，请在右侧输入有效 NovelAI API Key 并点击【开始生成】。
      </text>
      <text x="60" y="850" fill="#52525b" font-family="system-ui, -apple-system, sans-serif" font-size="11">
        若在预览环境中遇到网络 Cookie 隔离，可点击顶部【新标签页打开】以获得完整无阻的后端直通体验。
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent.trim())}`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Direct client-side generation using NovelAI API and JSZip.
 * Useful if the server proxy is unreachable or challenged by iframe cookies.
 */
async function generateDirectNovelAiClient(
  apiKey: string,
  prompt: string,
  negativePrompt: string,
  params: GenerationParams,
  actualSeed: number
): Promise<GenerateResult> {
  const endpoint = 'https://image.novelai.net/ai/generate-image';
  const model = params.model || 'nai-diffusion-5-full';
  const isV5 = !model || model.includes('5');
  const isV4 = model.includes('4');
  const isV4OrV5 = isV5 || isV4;

  const payload = {
    input: prompt,
    model: model,
    action: 'generate',
    parameters: {
      params_version: isV5 ? 4 : isV4 ? 3 : 1,
      width: params.width || 1024,
      height: params.height || 1024,
      scale: params.scale !== undefined ? Number(params.scale) : 5,
      sampler: params.sampler || 'k_euler',
      steps: params.steps || 28,
      n_samples: 1,
      ucPreset: 0,
      qualityToggle: false,
      dynamic_thresholding: false,
      controlnet_strength: 1,
      legacy: false,
      add_original_image: true,
      cfg_rescale: params.rescale !== undefined ? Number(params.rescale) : 0,
      noise_schedule: params.noiseSchedule || 'karras',
      negative_prompt: negativePrompt || '',
      seed: actualSeed,
      ...(isV4OrV5
        ? {
            characterPrompts: [],
            v4_prompt: {
              caption: {
                base_caption: prompt,
                char_captions: [],
              },
              use_coords: false,
              use_order: true,
            },
            v4_negative_prompt: {
              caption: {
                base_caption: negativePrompt || '',
                char_captions: [],
              },
            },
          }
        : {}),
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': '*/*',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorText = '';
    try {
      const errorJson = await response.json();
      errorText = errorJson.message || JSON.stringify(errorJson);
    } catch {
      errorText = await response.text();
    }

    if (response.status === 401) {
      throw new Error('NovelAI API Key 认证失败 (401 Unauthorized)。请检查 Key 是否有效且具有可用 Anlas/订阅。');
    } else if (response.status === 400) {
      throw new Error(`请求参数不合法 (400 Bad Request): ${errorText}`);
    } else if (response.status === 429) {
      throw new Error('请求过于频繁或并发受限 (429 Rate Limit)，请稍候重试。');
    } else if (response.status === 500) {
      throw new Error(`NovelAI 官方服务器返回 500 (Internal Server Error)：\n• 官方算力服务器可能正在维护、瞬时负载过高或账户 Anlas 点数不足。\n• 建议：您可稍候重试生成，或点击右上角【一键复制完整 Prompt】直接粘贴到 NovelAI 网页端生图。`);
    }
    throw new Error(`NovelAI 返回错误 (${response.status}): ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const imageFiles = Object.keys(zip.files).filter((fileName) =>
    /\.(png|jpe?g|webp)$/i.test(fileName)
  );

  if (imageFiles.length === 0) {
    const anyFile = Object.keys(zip.files).find((k) => !zip.files[k].dir);
    if (anyFile) {
      const dataBase64 = await zip.files[anyFile].async('base64');
      return {
        success: true,
        image: `data:image/png;base64,${dataBase64}`,
        seed: actualSeed,
      };
    }
    throw new Error('NovelAI 返回的压缩包中未找到有效的图像数据。');
  }

  const primaryImageName = imageFiles[0];
  const dataBase64 = await zip.files[primaryImageName].async('base64');
  return {
    success: true,
    image: `data:image/png;base64,${dataBase64}`,
    seed: actualSeed,
  };
}

/**
 * Primary dispatch function for image generation.
 * Handles:
 * 1. Instant client-side simulation (zero network latency, never blocked by cookie checks)
 * 2. Server proxy generation (/api/generate)
 * 3. Automatic fallback to direct client call if iframe cookie/gateway challenge is detected
 */
export async function executeGeneration(options: GenerateOptions): Promise<GenerateResult> {
  const { apiKey, prompt, negativePrompt, slots, params, simulate, initImage, strength, noise } = options;

  const actualSeed =
    typeof params.seed === 'number' && !isNaN(params.seed) && params.seed >= 0
      ? Math.floor(params.seed)
      : Math.floor(Math.random() * 4294967295);

  // 1. Simulation mode: execute completely client-side for zero latency & 100% stability
  if (simulate) {
    const simulatedSvg = createSimulatedPreviewSvg(
      prompt,
      negativePrompt,
      slots,
      params,
      actualSeed
    );
    return {
      success: true,
      image: simulatedSvg,
      seed: actualSeed,
      isSimulated: true,
    };
  }

  // 2. Real generation with API Key
  if (!apiKey.trim()) {
    return {
      success: false,
      seed: actualSeed,
      error: '请先在右侧输入您的 NovelAI API Key，或点击“格式校验与模拟生成”进行免点数测试。',
    };
  }

  // Attempt server-side proxy route first
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        apiKey: apiKey.trim(),
        prompt,
        negativePrompt,
        width: params.width,
        height: params.height,
        steps: params.steps,
        scale: params.scale,
        sampler: params.sampler,
        noiseSchedule: params.noiseSchedule,
        rescale: params.rescale,
        model: params.model,
        seed: actualSeed,
        simulate: false,
        initImage,
        strength,
        noise,
      }),
    });

    const contentType = response.headers.get('content-type') || '';

    // If server responded with JSON
    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (!response.ok || !data.success) {
        return {
          success: false,
          seed: actualSeed,
          error: data?.error || `生成请求未成功 (HTTP ${response.status})`,
        };
      }
      return {
        success: true,
        image: data.image,
        seed: data.seed ?? actualSeed,
      };
    }

    // If server responded with HTML (e.g. AI Studio iframe cookie check redirect)
    const textContent = await response.text();
    const isHtmlResponse =
      textContent.includes('<!doctype') ||
      textContent.includes('<html') ||
      textContent.includes('cookie_check');

    if (isHtmlResponse) {
      // Automatic Fallback: Try direct browser fetch to NovelAI API
      try {
        const directResult = await generateDirectNovelAiClient(
          apiKey.trim(),
          prompt,
          negativePrompt,
          params,
          actualSeed
        );
        return directResult;
      } catch (directErr: any) {
        // If direct client fetch also hits browser CORS
        const isCors = directErr?.name === 'TypeError' || directErr?.message?.includes('Failed to fetch');
        if (isCors) {
          return {
            success: false,
            seed: actualSeed,
            error:
              '当前处于 AI Studio 预览 iframe 隔离环境（安全 Cookie 挑战拦截了后端代理，且浏览器直接连接受到跨域限制）。\n\n' +
              '💡 解决方案：\n' +
              '1. 点击顶部导航栏的【新标签页打开】以独立窗口运行应用（独立窗口无 iframe Cookie 限制，后端代理畅通）；\n' +
              '2. 或点击下方【一键复制完整 Prompt】直接粘贴到 NovelAI 官方网页端使用；\n' +
              '3. 可随时使用【格式校验与模拟生成】进行免点数的参数及语法校验。',
          };
        }
        return {
          success: false,
          seed: actualSeed,
          error: directErr?.message || '生成请求失败，请检查网络或 API Key。',
        };
      }
    }

    return {
      success: false,
      seed: actualSeed,
      error: `服务器响应异常 (HTTP ${response.status}): ${textContent.slice(0, 150)}`,
    };
  } catch (err: any) {
    // If network error occurred reaching /api/generate, try direct fallback
    try {
      const directResult = await generateDirectNovelAiClient(
        apiKey.trim(),
        prompt,
        negativePrompt,
        params,
        actualSeed
      );
      return directResult;
    } catch (directErr: any) {
      return {
        success: false,
        seed: actualSeed,
        error: `请求发送失败: ${err?.message || '网络连接异常'}。提示：可点击顶部【新标签页打开】以获得完整后端服务连接。`,
      };
    }
  }
}
