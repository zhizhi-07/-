import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import JSZip from "jszip";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// CORS headers and preflight handling for all /api routes
app.use("/api", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Parse JSON body with generous limit for prompt data
app.use(express.json({ limit: "10mb" }));

interface GenerateRequestBody {
  apiKey?: string;
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  scale?: number;
  sampler?: string;
  noiseSchedule?: string;
  rescale?: number;
  model?: string;
  seed?: number;
  simulate?: boolean;
  initImage?: string;
  strength?: number;
  noise?: number;
}

/**
 * Encapsulated NovelAI generation function.
 * 
 * NOTE & DOCUMENTATION:
 * - Real NovelAI Image Generation Endpoint:
 *   https://image.novelai.net/ai/generate-image
 * - Authentication:
 *   Header: "Authorization: Bearer <API_KEY>"
 * - Response:
 *   NovelAI typically responds with a binary ZIP archive containing the generated PNG image.
 *   If NovelAI v5 or future revisions return direct image/png or JSON base64,
 *   this function handles both zip archive extraction and raw binary/json fallbacks.
 * - API Key Safety:
 *   The API Key is never logged to stdout or persistent logs.
 */
async function generateWithNovelAI(body: GenerateRequestBody): Promise<{
  success: boolean;
  image?: string; // base64 data url
  seed?: number;
  error?: string;
  details?: any;
}> {
  // Prefer provided apiKey from request body, fallback to server environment variable NOVELAI_API_KEY
  const apiKey = (body.apiKey && body.apiKey.trim()) || process.env.NOVELAI_API_KEY || "";

  if (!apiKey && !body.simulate) {
    return {
      success: false,
      error: "未提供 NovelAI API Key。请在界面设置中输入您的 API Key，或在服务器配置 NOVELAI_API_KEY。",
    };
  }

  // Determine seed
  const actualSeed =
    typeof body.seed === "number" && !isNaN(body.seed) && body.seed >= 0
      ? Math.floor(body.seed)
      : Math.floor(Math.random() * 4294967295);

  // If simulation mode requested, return a simulated graphic
  if (body.simulate) {
    const mockSvg = `
      <svg width="${body.width || 1024}" height="${body.height || 1024}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#18181b"/>
            <stop offset="100%" stop-color="#27272a"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)"/>
        <circle cx="50%" cy="40%" r="180" fill="#3f3f46" stroke="#a1a1aa" stroke-width="4"/>
        <text x="50%" y="39%" fill="#f4f4f5" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle">NovelAI V5 模拟预览</text>
        <text x="50%" y="43%" fill="#a1a1aa" font-family="sans-serif" font-size="16" text-anchor="middle">Prompt 格式与参数验证通过</text>
        <rect x="10%" y="65%" width="80%" height="180" rx="12" fill="#09090b" stroke="#27272a"/>
        <text x="12%" y="70%" fill="#71717a" font-family="monospace" font-size="14">Seed: ${actualSeed} | Model: ${body.model || "nai-diffusion-5-full"} | Size: ${body.width}x${body.height}</text>
        <text x="12%" y="75%" fill="#e4e4e7" font-family="monospace" font-size="13">Prompt: ${(body.prompt || "").slice(0, 75)}...</text>
      </svg>
    `;
    const base64 = `data:image/svg+xml;base64,${Buffer.from(mockSvg).toString("base64")}`;
    return {
      success: true,
      image: base64,
      seed: actualSeed,
    };
  }

  // --- Official NovelAI Endpoint & Payload Construction ---
  // Target endpoint: https://image.novelai.net/ai/generate-image
  const endpoint = "https://image.novelai.net/ai/generate-image";

  // Map model selection. NovelAI models:
  // V5 Full: "nai-diffusion-5-full"
  // V5 Curated: "nai-diffusion-5-curated"
  // V4 Full: "nai-diffusion-4-full"
  const model = body.model || "nai-diffusion-5-full";
  const isV5 = !model || model.includes("5");
  const isV4 = model.includes("4");
  const isV4OrV5 = isV5 || isV4;

  const cleanInitImage = body.initImage
    ? body.initImage.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '')
    : undefined;

  const payload = {
    input: body.prompt,
    model: model,
    action: cleanInitImage ? "img2img" : "generate",
    parameters: {
      params_version: isV5 ? 4 : isV4 ? 3 : 1,
      width: body.width || 832,
      height: body.height || 1216,
      scale: body.scale !== undefined ? Number(body.scale) : 7,
      sampler: body.sampler || "k_euler",
      steps: body.steps || 28,
      n_samples: 1,
      ucPreset: 0,
      qualityToggle: false, // User defines explicit quality tags
      dynamic_thresholding: false,
      controlnet_strength: 1,
      legacy: false,
      add_original_image: true,
      cfg_rescale: body.rescale !== undefined ? Number(body.rescale) : 0,
      noise_schedule: body.noiseSchedule || "karras",
      negative_prompt: body.negativePrompt || "",
      seed: actualSeed,
      ...(cleanInitImage
        ? {
            image: cleanInitImage,
            strength: body.strength !== undefined ? Number(body.strength) : 0.65,
            noise: body.noise !== undefined ? Number(body.noise) : 0.0,
          }
        : {}),
      ...(isV4OrV5
        ? {
            characterPrompts: [],
            v4_prompt: {
              caption: {
                base_caption: body.prompt,
                char_captions: [],
              },
              use_coords: false,
              use_order: true,
            },
            v4_negative_prompt: {
              caption: {
                base_caption: body.negativePrompt || "",
                char_captions: [],
              },
            },
          }
        : {}),
    },
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "*/*",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorText = "";
      try {
        const errorJson = await response.json();
        errorText = errorJson.message || JSON.stringify(errorJson);
      } catch {
        errorText = await response.text();
      }

      let friendlyMsg = `NovelAI API 返回错误 (${response.status}): ${errorText}`;
      if (response.status === 401) {
        friendlyMsg = `API Key 认证失败 (401 Unauthorized)。请检查您的 NovelAI API Key 是否正确且具有有效 Anlas/订阅。`;
      } else if (response.status === 400) {
        friendlyMsg = `请求参数不合法 (400 Bad Request): ${errorText}`;
      } else if (response.status === 429) {
        friendlyMsg = `请求过于频繁或并发受限 (429 Rate Limit)。请稍候再试。`;
      } else if (response.status === 500) {
        friendlyMsg = `NovelAI 服务器返回 500 (Internal Server Error)：\n• 官方算力服务器可能正在维护、瞬时负载过高或 Anlas 点数不足。\n• 建议：可稍候点击重试，或使用“一键复制完整 Prompt”直接粘贴到 NovelAI 网页端生图。`;
      }

      return {
        success: false,
        error: friendlyMsg,
        details: { status: response.status, raw: errorText },
      };
    }

    const contentType = response.headers.get("content-type") || "";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // If NovelAI returned a zip archive (standard behavior for generate-image)
    if (contentType.includes("zip") || buffer.slice(0, 4).toString("hex") === "504b0304") {
      try {
        const zip = await JSZip.loadAsync(buffer);
        // Find the first image file in the zip
        const imageFiles = Object.keys(zip.files).filter((fileName) =>
          /\.(png|jpe?g|webp)$/i.test(fileName)
        );

        if (imageFiles.length === 0) {
          // Fallback: take the first non-dir file
          const anyFile = Object.keys(zip.files).find((k) => !zip.files[k].dir);
          if (anyFile) {
            const dataBase64 = await zip.files[anyFile].async("base64");
            return {
              success: true,
              image: `data:image/png;base64,${dataBase64}`,
              seed: actualSeed,
            };
          }
          return {
            success: false,
            error: "NovelAI 返回的压缩包中未找到图片文件。",
          };
        }

        const primaryImageName = imageFiles[0];
        const dataBase64 = await zip.files[primaryImageName].async("base64");
        return {
          success: true,
          image: `data:image/png;base64,${dataBase64}`,
          seed: actualSeed,
        };
      } catch (zipErr: any) {
        return {
          success: false,
          error: `解析 NovelAI 压缩包失败: ${zipErr?.message || "未知错误"}`,
        };
      }
    } else if (contentType.includes("image/")) {
      // Direct image stream
      const base64 = buffer.toString("base64");
      return {
        success: true,
        image: `data:${contentType};base64,${base64}`,
        seed: actualSeed,
      };
    } else {
      // Could be json or unexpected format
      const text = buffer.toString("utf-8");
      try {
        const json = JSON.parse(text);
        if (json.image) {
          const prefix = json.image.startsWith("data:") ? "" : "data:image/png;base64,";
          return {
            success: true,
            image: `${prefix}${json.image}`,
            seed: actualSeed,
          };
        }
      } catch {
        // Not json
      }
      return {
        success: false,
        error: `NovelAI 返回了无法识别的内容格式 (${contentType})`,
        details: text.slice(0, 500),
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: `连接 NovelAI 服务器失败: ${err?.message || "网络请求异常"}。请检查网络或代理连接。`,
    };
  }
}

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "novelai-v5-artist-generator",
    hasEnvKey: !!process.env.NOVELAI_API_KEY,
  });
});

// GET /api/generate for ping/status check
app.get("/api/generate", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "NovelAI V5 Generation Endpoint. Please send a POST request with JSON payload to generate images.",
  });
});

// Primary generation API endpoint
app.post("/api/generate", async (req: Request, res: Response) => {
  try {
    const {
      apiKey,
      prompt,
      negativePrompt,
      width,
      height,
      steps,
      scale,
      sampler,
      model,
      seed,
      simulate,
    } = req.body as GenerateRequestBody;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: "Prompt 不能为空。",
      });
    }

    const result = await generateWithNovelAI({
      apiKey,
      prompt,
      negativePrompt,
      width: width || 1024,
      height: height || 1024,
      steps: steps || 28,
      scale: scale !== undefined ? scale : 5,
      sampler: sampler || "k_euler",
      model: model || "nai-diffusion-5-full",
      seed,
      simulate,
    });

    if (!result.success) {
      return res.status(502).json(result);
    }

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: `服务器处理生成请求时发生异常: ${err?.message || "未知异常"}`,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[NovelAI V5 Prompt Tool] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
