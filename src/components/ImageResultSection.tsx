import React, { useState } from 'react';
import {
  Download,
  AlertCircle,
  Clock,
  Copy,
  Check,
  Maximize,
  X,
  ImageIcon,
  Sparkles,
} from 'lucide-react';
import { GenerationHistoryItem } from '../types';

interface ImageResultSectionProps {
  currentResult: GenerationHistoryItem | null;
  history: GenerationHistoryItem[];
  error: string | null;
  isGenerating: boolean;
  onSelectHistoryItem: (item: GenerationHistoryItem) => void;
  onClearHistory: () => void;
}

export const ImageResultSection: React.FC<ImageResultSectionProps> = ({
  currentResult,
  history,
  error,
  isGenerating,
  onSelectHistoryItem,
  onClearHistory,
}) => {
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleCopySeed = (seed: number) => {
    navigator.clipboard.writeText(seed.toString());
    setCopiedSeed(true);
    setTimeout(() => setCopiedSeed(false), 2000);
  };

  const handleDownload = (imageUrl: string, seed: number) => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `novelai-v5-${seed}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div id="section-image-result" className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#0A84FF]" />
          <h2 className="text-sm font-semibold text-white tracking-wide">
            生成结果与历史相册
          </h2>
        </div>
        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="text-xs text-[#8E8E93] hover:text-[#FF453A] transition-colors cursor-pointer"
          >
            清空历史 ({history.length})
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div
          id="generation-error-banner"
          className="p-3.5 bg-[#FF453A]/15 border border-[#FF453A]/30 rounded-xl text-[#FF453A] text-xs space-y-1 shadow-sm"
        >
          <div className="flex items-center gap-1.5 font-semibold text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>生成错误与提示</span>
          </div>
          <p className="leading-relaxed pl-5 whitespace-pre-line text-[#EBEBF5]/90">{error}</p>
        </div>
      )}

      {/* Main Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Image Box */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center min-h-[360px] bg-[#000000] border border-white/5 rounded-2xl p-3 relative overflow-hidden">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-[#0A84FF]/20 border-t-[#0A84FF] rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-white">正在向 NovelAI 请求绘图中...</p>
              <p className="text-xs text-[#8E8E93]">根据选择的采样步数与模型计算中，请稍候</p>
            </div>
          ) : currentResult ? (
            <div className="w-full flex flex-col items-center space-y-3">
              <div className="relative group max-h-[560px] overflow-hidden rounded-xl bg-[#1C1C1E]">
                <img
                  id="preview-generated-image"
                  src={currentResult.imageUrl}
                  alt="NovelAI Output"
                  className="max-h-[520px] w-auto object-contain rounded-xl shadow-lg"
                />
                {/* Overlay actions */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 backdrop-blur-md p-1.5 rounded-full border border-white/10">
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="p-1.5 text-[#EBEBF5] hover:text-white rounded-full hover:bg-white/15 transition-colors cursor-pointer"
                    title="全屏放大查看"
                  >
                    <Maximize className="w-4 h-4" />
                  </button>
                  <button
                    id="btn-download-image"
                    type="button"
                    onClick={() => handleDownload(currentResult.imageUrl, currentResult.seed)}
                    className="p-1.5 text-[#EBEBF5] hover:text-white rounded-full hover:bg-white/15 transition-colors cursor-pointer"
                    title="保存原图"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick actions bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 w-full px-2 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs text-[#8E8E93]">
                  <span>Seed:</span>
                  <span className="font-mono text-white font-semibold">{currentResult.seed}</span>
                  <button
                    type="button"
                    onClick={() => handleCopySeed(currentResult.seed)}
                    className="text-[#8E8E93] hover:text-white p-1 cursor-pointer"
                    title="复制种子"
                  >
                    {copiedSeed ? (
                      <Check className="w-3.5 h-3.5 text-[#30D158]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(currentResult.imageUrl, currentResult.seed)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#007AFF] hover:bg-[#0069D9] text-white text-xs font-medium rounded-full transition-all shadow-sm cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    保存图片
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-[#636366] space-y-2">
              <ImageIcon className="w-10 h-10 stroke-[1.5]" />
              <p className="text-sm font-medium text-[#8E8E93]">暂无生成图片</p>
              <p className="text-xs text-[#636366] max-w-sm">
                点击右侧“真实生成”或“免点数模拟测试”即可在此查看出图效果。
              </p>
            </div>
          )}
        </div>

        {/* Metadata & History sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Current Meta */}
          {currentResult && (
            <div className="bg-[#000000] border border-white/5 rounded-2xl p-3.5 space-y-2">
              <div className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
                生图参数
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#1C1C1E] p-2 rounded-xl">
                  <div className="text-[#8E8E93] text-[10px]">模型</div>
                  <div className="font-mono text-white truncate">{currentResult.model}</div>
                </div>
                <div className="bg-[#1C1C1E] p-2 rounded-xl">
                  <div className="text-[#8E8E93] text-[10px]">分辨率</div>
                  <div className="font-mono text-white">
                    {currentResult.width} × {currentResult.height}
                  </div>
                </div>
                <div className="bg-[#1C1C1E] p-2 rounded-xl">
                  <div className="text-[#8E8E93] text-[10px]">步数 / CFG</div>
                  <div className="font-mono text-white">
                    {currentResult.steps} 步 / {currentResult.scale}
                  </div>
                </div>
                <div className="bg-[#1C1C1E] p-2 rounded-xl">
                  <div className="text-[#8E8E93] text-[10px]">采样器</div>
                  <div className="font-mono text-white truncate">{currentResult.sampler}</div>
                </div>
              </div>
            </div>
          )}

          {/* History Gallery */}
          <div className="bg-[#000000] border border-white/5 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                历史快照 ({history.length})
              </div>
            </div>

            {history.length === 0 ? (
              <div className="p-4 border border-dashed border-white/10 rounded-xl text-center text-xs text-[#636366]">
                暂无历史生成记录
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-[260px] overflow-y-auto p-0.5">
                {history.map((item) => {
                  const isSelected = currentResult?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectHistoryItem(item)}
                      className={`relative aspect-square rounded-xl overflow-hidden border transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-[#007AFF] ring-2 ring-[#007AFF]/40'
                          : 'border-white/10 hover:border-white/25'
                      }`}
                    >
                      <img
                        src={item.imageUrl}
                        alt={`Seed: ${item.seed}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 text-[9px] font-mono text-[#EBEBF5] truncate text-left">
                        {item.seed}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && currentResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-10 right-0 p-2 text-[#8E8E93] hover:text-white cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={currentResult.imageUrl}
              alt="Full Preview"
              className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
