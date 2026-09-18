import React, { useState, useMemo, useRef } from 'react';
import {
  Wand2,
  X,
  Check,
  ArrowRight,
  Sliders,
  Layers,
  UploadCloud,
  Image as ImageIcon,
  Sparkles,
  Info,
  FileText,
} from 'lucide-react';
import { parseRawPromptInput, ParsedPromptData } from '../utils/promptParser';
import { parseImageFile, ExtractedImageMetadata } from '../utils/imageMetadataParser';
import { ArtistSlot, GenerationParams } from '../types';

interface PromptParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: {
    slots: ArtistSlot[];
    subjectPrompt?: string;
    stylePrompt?: string;
    qualityPrompt?: string;
    negativePrompt?: string;
    params?: Partial<GenerationParams>;
    referenceImage?: string;
  }) => void;
  currentSlots: ArtistSlot[];
}

const PRESET_SNIPPETS = [
  {
    title: '7画师深空双人宴会 (当前实测)',
    desc: 'bm94199 + qianben shan + flamma + nixiaozi + solipsist + kirochy + iotaectoplasm',
    text: `0.8::artist:bm94199 ::, 1.5::artist:qianben shan ::, 1::artist:flamma (immortalemignis)::, 1::artist:nixiaozi::, 0.8::solipsist::, 1.2::kirochy::, 1.2::iotaectoplasm::, Love and Deepspace style, year 2025, very aesthetic, masterpiece, no text,
{1girl, yellow curly hair, blue eyes, red mole under right eye} & {other, (blue eyes:0.1), (mole:0.1)}, 1boy 1girl, banquet hall, blurred chandelier lights, soft warm spotlight, upper body, very aesthetic,masterpiece,newest,high-quality,Aesthetic,excellent,perspective,shadows,high-quality,bestquality,filterclear,style hazy,ultra detailed,high resolution,notext. An intimate, tense upper body shot of a man and a woman confronting each other amidst the warm banquet background.`,
  },
  {
    title: '7画师黑白线稿速写 (黑白实测)',
    desc: 'juumou + guigui + wuyu16 + luckyboysquad + honnryou + suzumi + rourow',
    text: '1.8::artist juumou_(c5buf) ::,0.9::artist guigui_rongrong ::,0.8::artist wuyu16 ::,1.6::artist luckyboysquad::,0.6::artist honnryou_hanaru::,1.1::artist suzumi_(ccroquette) ::,1.5::artist rourow ::,,clean rough sketch, simple black line art, subtl grey shading, solo, portrait \n\n, very aesthetic, masterpiece, no text',
  },
  {
    title: '7画师厚涂色彩串 (彩色实测)',
    desc: 'seapall + wlop + serafleur + kirochy + shuishuisama...',
    text: '0.8::artistseapall::,0.9::artistwlop::,0.8::artistserafleur::,1.1::artistkirochy::,1.2::artistshuishuisama::,0.7::artistzero_q_0q::,0.5::artistjacknife::,notext,masterpiece,2.5d',
  },
];

const DEFAULT_ROLE_MAP: Array<{ role: any; roleLabel: string }> = [
  { role: 'main', roleLabel: '整体主控' },
  { role: 'coloring', roleLabel: '色彩基调' },
  { role: 'lineart', roleLabel: '线条轮廓' },
  { role: 'lighting', roleLabel: '光影质感' },
  { role: 'custom', roleLabel: '笔触细节' },
  { role: 'custom', roleLabel: '辅助画师 6' },
  { role: 'custom', roleLabel: '辅助画师 7' },
  { role: 'custom', roleLabel: '辅助画师 8' },
  { role: 'custom', roleLabel: '辅助画师 9' },
  { role: 'custom', roleLabel: '辅助画师 10' },
];

export const PromptParserModal: React.FC<PromptParserModalProps> = ({
  isOpen,
  onClose,
  onApply,
  currentSlots,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [rawText, setRawText] = useState('');
  const [fillSubject, setFillSubject] = useState(true);
  const [fillStyle, setFillStyle] = useState(true);
  const [fillQuality, setFillQuality] = useState(true);
  const [fillNegative, setFillNegative] = useState(true);
  const [fillParams, setFillParams] = useState(true);
  const [treatRawWordsAsArtists, setTreatRawWordsAsArtists] = useState(false);

  // Image parsing states
  const [isParsingImage, setIsParsingImage] = useState(false);
  const [uploadedImageMeta, setUploadedImageMeta] = useState<ExtractedImageMetadata | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsedData: ParsedPromptData = useMemo(() => {
    let textToParse = rawText;
    if (treatRawWordsAsArtists && !textToParse.includes('artist') && !textToParse.includes('::')) {
      textToParse = textToParse
        .split(/[,，\n]+/)
        .map((part) => {
          const trimmed = part.trim();
          if (!trimmed) return '';
          if (trimmed.toLowerCase().startsWith('artist:')) return trimmed;
          return `artist:${trimmed}`;
        })
        .filter(Boolean)
        .join(', ');
    }
    return parseRawPromptInput(textToParse);
  }, [rawText, treatRawWordsAsArtists]);

  if (!isOpen) return null;

  const handleImageUpload = async (file: File) => {
    setImageError(null);
    setIsParsingImage(true);
    try {
      const meta = await parseImageFile(file);
      setUploadedImageMeta(meta);

      if (meta.hasMetadata && meta.prompt) {
        setRawText(meta.prompt);
        setActiveTab('text');
      } else {
        setImageError('未在此图片中解析到 NovelAI / WebUI 元数据，但已保留该图片作为人物参考。');
      }
    } catch (err: any) {
      setImageError(err?.message || '读取图片失败，请重试');
    } finally {
      setIsParsingImage(false);
    }
  };

  const handleApply = () => {
    let newSlots: ArtistSlot[] = [];

    if (parsedData.artists.length > 0) {
      // Create or update slots for ALL parsed artists (no limit!)
      newSlots = parsedData.artists.map((parsedArtist, index) => {
        const existing = currentSlots[index];
        const roleInfo = DEFAULT_ROLE_MAP[index] || {
          role: 'custom',
          roleLabel: `画师 ${index + 1}`,
        };

        return {
          id: existing?.id || `slot-${Date.now()}-${index}`,
          slotKey: String(index + 1),
          role: existing?.role || roleInfo.role,
          roleLabel: existing?.roleLabel || roleInfo.roleLabel,
          description: existing?.description || '',
          name: parsedArtist.name,
          weight: parsedArtist.weight,
          enabled: true,
        };
      });
    } else {
      newSlots = currentSlots;
    }

    onApply({
      slots: newSlots,
      subjectPrompt: fillSubject && parsedData.subjectPrompt ? parsedData.subjectPrompt : undefined,
      stylePrompt: fillStyle && parsedData.stylePrompt !== undefined ? parsedData.stylePrompt : undefined,
      qualityPrompt: fillQuality && parsedData.qualityPrompt !== undefined ? parsedData.qualityPrompt : undefined,
      negativePrompt: fillNegative && parsedData.negativePrompt ? parsedData.negativePrompt : undefined,
      params:
        fillParams && Object.keys(parsedData.extractedParameters).length > 0
          ? parsedData.extractedParameters
          : undefined,
      referenceImage: uploadedImageMeta?.thumbnailUrl,
    });

    onClose();
  };

  return (
    <div
      id="prompt-parser-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        id="prompt-parser-modal-content"
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-[#1C1C1E] border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Grabber (Mobile) */}
        <div className="w-9 h-1 bg-[#48484A] rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* iOS Navigation Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="text-[#0A84FF] hover:text-[#409CFF] text-sm font-medium cursor-pointer"
          >
            取消
          </button>

          {/* Segmented control in header */}
          <div className="flex bg-[#2C2C2E] p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                activeTab === 'text' ? 'bg-[#007AFF] text-white font-semibold' : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              文本解析
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('image')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'image' ? 'bg-[#007AFF] text-white font-semibold' : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              上传图片解析
            </button>
          </div>

          <button
            type="button"
            onClick={handleApply}
            disabled={parsedData.artists.length === 0 && !parsedData.subjectPrompt}
            className="text-sm font-semibold text-[#0A84FF] disabled:text-[#636366] disabled:cursor-not-allowed cursor-pointer"
          >
            填入
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'image' ? (
            /* Upload Image Tab */
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) handleImageUpload(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/15 hover:border-[#007AFF]/60 bg-[#000000]/60 hover:bg-[#000000]/80 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleImageUpload(e.target.files[0]);
                  }}
                />
                <div className="w-12 h-12 rounded-full bg-[#2C2C2E] flex items-center justify-center text-[#0A84FF]">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">点击或拖拽图片到此处解析</p>
                  <p className="text-xs text-[#8E8E93] mt-1">
                    自动读取 NovelAI 或 WebUI 原图内置的 Prompt、负面词、画师权重及生图参数
                  </p>
                </div>
                {isParsingImage && (
                  <div className="text-xs text-[#0A84FF] animate-pulse font-medium">正在读取图片元数据...</div>
                )}
              </div>

              {imageError && (
                <div className="p-3 bg-[#FF453A]/10 border border-[#FF453A]/30 rounded-xl text-xs text-[#FF453A] flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{imageError}</span>
                </div>
              )}

              {uploadedImageMeta && (
                <div className="p-3 bg-[#2C2C2E] rounded-xl flex items-center gap-3 border border-white/10">
                  <img
                    src={uploadedImageMeta.thumbnailUrl}
                    alt="Uploaded"
                    className="w-16 h-16 object-cover rounded-lg border border-white/10 shrink-0"
                  />
                  <div className="min-w-0 flex-1 text-xs">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#30D158]" />
                      <span>{uploadedImageMeta.software || 'AI 生成图片'}</span>
                    </div>
                    <p className="text-[#8E8E93] truncate mt-0.5 font-mono">
                      {uploadedImageMeta.prompt || '已读取图像，可作为人物参考'}
                    </p>
                    {uploadedImageMeta.steps && (
                      <div className="text-[11px] text-[#AEAEB2] mt-1 flex gap-2">
                        <span>步数: {uploadedImageMeta.steps}</span>
                        <span>CFG: {uploadedImageMeta.scale}</span>
                        {uploadedImageMeta.seed !== undefined && <span>Seed: {uploadedImageMeta.seed}</span>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Text Parsing Tab */
            <>
              {/* Quick Examples */}
              <div className="space-y-1.5">
                <span className="text-xs text-[#8E8E93] font-medium">示例参考（点击快速载入）：</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PRESET_SNIPPETS.map((snippet, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRawText(snippet.text)}
                      className="p-2.5 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-left transition-colors border border-white/5 cursor-pointer"
                    >
                      <div className="text-xs font-semibold text-white truncate">{snippet.title}</div>
                      <div className="text-[10px] text-[#8E8E93] truncate mt-0.5 font-mono">{snippet.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Raw Text Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="raw-prompt-textarea" className="text-[#8E8E93] font-medium">
                    粘贴 Prompt 或画师权重串：
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-[#8E8E93] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={treatRawWordsAsArtists}
                      onChange={(e) => setTreatRawWordsAsArtists(e.target.checked)}
                      className="rounded accent-[#007AFF]"
                    />
                    <span>纯画师名自动前缀</span>
                  </label>
                </div>

                <textarea
                  id="raw-prompt-textarea"
                  rows={4}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="全面兼容 NovelAI 权重语法，例如：&#10;0.8::artistseapall::, 0.9::artistwlop::, 1.1::artistkirochy::, notext, masterpiece, 2.5d&#10;也支持 {artist:wlop:1.2} 或带有 Negative prompt: ... Steps: 28 的完整日志"
                  className="w-full p-3 bg-[#000000] border border-white/10 rounded-xl text-white text-xs sm:text-sm font-mono leading-relaxed placeholder:text-[#636366] focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                />
              </div>
            </>
          )}

          {/* Parsed Result Preview */}
          <div className="p-3.5 rounded-xl bg-[#000000] border border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-semibold text-[#8E8E93] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#0A84FF]" />
                识别结果预览
              </span>
              <span className="text-xs text-[#30D158] font-semibold">
                {parsedData.artists.length > 0 ? `已识别 ${parsedData.artists.length} 个画师` : '等待输入'}
              </span>
            </div>

            {/* Extracted Slots Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto">
              {parsedData.artists.length === 0 ? (
                <div className="col-span-full py-4 text-center text-xs text-[#636366]">
                  粘贴上方示例或您自己的画师串即可自动解析识别
                </div>
              ) : (
                parsedData.artists.map((artist, index) => {
                  const roleLabel = DEFAULT_ROLE_MAP[index]?.roleLabel || `画师 ${index + 1}`;
                  return (
                    <div
                      key={index}
                      className="p-2.5 rounded-xl border bg-[#1C1C1E] border-white/15 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-5 h-5 rounded bg-[#2C2C2E] text-white font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                          {index + 1}
                        </span>
                        <div className="truncate">
                          <span className="text-[10px] text-[#8E8E93] block">{roleLabel}</span>
                          <span className="font-mono text-white truncate block font-medium">
                            {artist.name}
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full bg-[#007AFF]/20 text-[#0A84FF] text-xs font-mono font-semibold shrink-0">
                        {artist.weight.toFixed(2)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Subject, Style, and Negative preview */}
            {(parsedData.subjectPrompt || parsedData.qualityPrompt || parsedData.stylePrompt || parsedData.negativePrompt) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 text-xs">
                {parsedData.qualityPrompt && (
                  <div className="p-2 rounded-lg bg-[#1C1C1E]">
                    <div className="text-[10px] text-[#8E8E93]">质量/前缀词</div>
                    <div className="text-[#30D158] font-mono text-xs truncate mt-0.5" title={parsedData.qualityPrompt}>
                      {parsedData.qualityPrompt}
                    </div>
                  </div>
                )}
                {parsedData.stylePrompt && (
                  <div className="p-2 rounded-lg bg-[#1C1C1E]">
                    <div className="text-[10px] text-[#8E8E93]">风格/线稿词</div>
                    <div className="text-[#0A84FF] font-mono text-xs truncate mt-0.5" title={parsedData.stylePrompt}>
                      {parsedData.stylePrompt}
                    </div>
                  </div>
                )}
                {parsedData.subjectPrompt && (
                  <div className="p-2 rounded-lg bg-[#1C1C1E]">
                    <div className="text-[10px] text-[#8E8E93]">主体/画面词</div>
                    <div className="text-white font-mono text-xs truncate mt-0.5" title={parsedData.subjectPrompt}>
                      {parsedData.subjectPrompt}
                    </div>
                  </div>
                )}
                {parsedData.negativePrompt && (
                  <div className="p-2 rounded-lg bg-[#1C1C1E]">
                    <div className="text-[10px] text-[#8E8E93]">负面词</div>
                    <div className="text-[#FF453A] font-mono text-xs truncate mt-0.5" title={parsedData.negativePrompt}>
                      {parsedData.negativePrompt}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sync Toggles */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#8E8E93] pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={fillSubject}
                onChange={(e) => setFillSubject(e.target.checked)}
                className="rounded accent-[#007AFF]"
              />
              <span className="text-[#EBEBF5]">覆盖画面主体词</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={fillStyle}
                onChange={(e) => setFillStyle(e.target.checked)}
                className="rounded accent-[#007AFF]"
              />
              <span className="text-[#EBEBF5]">覆盖风格/线稿词</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={fillQuality}
                onChange={(e) => setFillQuality(e.target.checked)}
                className="rounded accent-[#007AFF]"
              />
              <span className="text-[#EBEBF5]">覆盖质量/前缀词</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={fillNegative}
                onChange={(e) => setFillNegative(e.target.checked)}
                className="rounded accent-[#007AFF]"
              />
              <span className="text-[#EBEBF5]">覆盖负面词</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={fillParams}
                onChange={(e) => setFillParams(e.target.checked)}
                className="rounded accent-[#007AFF]"
              />
              <span className="text-[#EBEBF5]">同步参数</span>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between gap-3 bg-[#1C1C1E] shrink-0">
          <span className="text-xs text-[#8E8E93]">
            {parsedData.artists.length > 0 ? `将自动生成 ${parsedData.artists.length} 个槽位` : '支持任意多位画师混合'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-[#8E8E93] hover:text-white cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={parsedData.artists.length === 0 && !parsedData.subjectPrompt}
              className="px-5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0069D9] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              填入全部 {parsedData.artists.length > 0 ? `${parsedData.artists.length} 位画师` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
