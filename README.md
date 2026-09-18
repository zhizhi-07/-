# NovelAI V5 画师串生成插件 / 网页工具 (Web & API Tool)

这是一个专为 **NovelAI V5** 打造的可视化画师串生成与测试工具。旨在解决画师权重难以把控、容易炸图或产生彩噪杂波的问题。通过明确的角色分工（主风格、上色、线条、光影），自动生成合规的 NovelAI V5 权重提示词，并提供直连 NovelAI 真实 API 生成图片以及免点数模拟测试。

---

## 🌟 核心功能特性

1. **画师职责槽位分工**：
   - **槽位 A（主风格画师）**：默认权重 `1.25`，控制整体画风、面部审美基调。
   - **槽位 B（上色画师）**：默认权重 `0.85`，控制色彩柔和度与环境色调。
   - **槽位 C（线条画师）**：默认权重 `0.4`（线条画师权重大极易炸图，默认以低权控线）。
   - **槽位 D（光影/细节画师）**：默认权重 `0.5`，控制细节密度与明暗反差。
   - 支持动态新增自定义辅助槽位，每个槽位均配有独立开关、滑块/数值输入、一键清空与一键加入黑名单。

2. **NovelAI V5 画师串格式规范**：
   - 标准格式：`权重::artist:画师名::,`（例如 `1.25::artist:fonmant::, 0.85::artist:kkato::,`）。
   - 提供 `artist:` 前缀切换开关（关闭时输出 `1.25::fonmant::,`）。
   - 自动去除首尾空格与多余冒号，空画师自动过滤，权重精准保留最多两位小数。

3. **预设风格模式**：
   - **单画师测试模式**：一键隔离单个画师，便于精准排查导致画面花斑或噪点的画师 tag。

4. **严格组合顺序与负面词**：
   - 组合顺序：`画师串` → `固定质量前缀` → `风格补充词` → `主体 Prompt`。
   - 包含完整的负面提示词（Negative Prompt），支持自由编辑与一键复制。

5. **画师黑名单与自动平替词**：
   - 针对导致乱码的画师 tag（如 `eubneung10571`），自动拦截并不输出到 prompt 中。
   - 触发黑名单时在界面醒目告警，并可自动注入画质平替词（`clean lineart, crisp lineart, thin lineart, delicate lineart, refined lineart`）。

6. **NovelAI API 真实接口与安全**：
   - 后端提供 `POST /api/generate` 代理路由。
   - API Key 保存在浏览器本地 `localStorage`，不会被硬编码，更不会被打印至控制台或服务端日志。
   - 解构 NovelAI 返回的 ZIP 压缩流并直接提取 PNG 图片，提供下载、种子复制与生成历史留存。
   - 提供“模拟测试”按钮，免消耗 Anlas 即可检验组合效果与格式。

---

## 📁 项目文件结构

```text
├── .env.example                     # 环境变量示例 (包含可选 NOVELAI_API_KEY)
├── index.html                       # 前端入口 HTML
├── metadata.json                    # 应用元数据声明
├── package.json                     # 项目依赖与启动脚本
├── server.ts                        # 后端 Express 服务 (代理 /api/generate 与 Vite 挂载)
├── src/
│   ├── main.tsx                     # React 渲染入口
│   ├── App.tsx                      # 核心工作区主页面 (三栏布局 + 结果预览)
│   ├── index.css                    # Tailwind CSS 样式配置
│   ├── types.ts                     # TypeScript 接口与类型定义
│   ├── constants/
│   │   └── presets.ts               # 风格模式预设、采样器、分辨率、默认提示词
│   ├── utils/
│   │   └── promptBuilder.ts         # V5 画师串格式化、黑名单过滤、平替词注入逻辑
│   └── components/
│       ├── Navbar.tsx               # 顶部导航栏 (Key状态、重置与快捷操作)
│       ├── ArtistSlotsSection.tsx   # 左侧栏：风格预设模式与画师槽位
│       ├── PromptPreviewSection.tsx # 中间栏：Prompt 预览、合并与快速复制
│       ├── ApiSettingsSection.tsx   # 右侧栏：API 凭据、模型参数与触发按钮
│       ├── ImageResultSection.tsx   # 底部栏：生成大图预览、参数元数据与历史记录
│       └── BlacklistModal.tsx       # 黑名单与替代词配置浮层
├── tsconfig.json                    # TypeScript 配置
└── vite.config.ts                   # Vite 构建配置
```

---

## 🚀 安装与运行命令

### 1. 安装依赖
```bash
npm install
```

### 2. 本地开发运行
```bash
npm run dev
```
开发服务器将在 `http://localhost:3000` 启动，集成了 Express API 后端与 Vite 前端热载中间件。

### 3. 生产环境构建与启动
```bash
npm run build
npm run start
```

---

## 🔒 API Key 安全说明

1. **客户端安全**：输入 API Key 时默认采用密码掩码，提供一键清除功能，仅持久化在本地浏览器 `localStorage` 中。
2. **服务端代理**：请求 NovelAI 官方接口时由 Node.js 后端进行转发（避免浏览器 CORS 跨域问题），后端 `generateWithNovelAI()` 方法中严禁记录任何包含敏感 Key 的 `console.log`。
3. **环境配置（可选）**：如果希望作为团队私有服务运行，亦可在 `.env` 中设置 `NOVELAI_API_KEY=your_key` 作为全局备用。

---

## 📡 后端生成接口规格

- **端点**：`POST /api/generate`
- **请求体 (Request Body)**：
```json
{
  "apiKey": "pst-xxxxxxxxxxxx",
  "prompt": "1.25::artist:fonmant::, 0.85::artist:kkato::,\nmasterpiece, best quality,\nclean lineart, soft coloring,\n1girl, solo, looking at viewer,",
  "negativePrompt": "worst quality, low quality, lowres, messy lineart, blurry",
  "width": 1024,
  "height": 1024,
  "steps": 28,
  "scale": 5,
  "sampler": "k_euler",
  "model": "nai-diffusion-5-full",
  "seed": 12345678,
  "simulate": false
}
```
- **成功响应 (Response)**：
```json
{
  "success": true,
  "image": "data:image/png;base64,iVBORw0KGgo...",
  "seed": 12345678
}
```
