import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  Sliders,
  ZoomIn,
  X,
  Plus,
  RefreshCw,
  Info,
} from 'lucide-react';
import { parseImageFile } from '../utils/imageMetadataParser';

export interface CharacterReferenceData {
  imageUrl: string;
  name: string;
  useForI2I: boolean;
  strength: number; // 0.1 - 0.95
  noise: number; // 0.0 - 0.4
  file?: File;
}

interface CharacterReferenceSectionProps {
  characterData: CharacterReferenceData | null;
  onUpdateCharacterData: (data: CharacterReferenceData | null) => void;
  onAppendSubjectTag: (tag: string) => void;
  onParseImageMeta?: (file: File) => void;
}

const COMMON_CHARACTER_TAG_CHIPS = [
  { group: '发色', tags: ['white hair', 'black hair', 'silver hair', 'blonde hair', 'blue hair', 'pink hair'] },
  { group: '瞳色', tags: ['blue eyes', 'red eyes', 'golden eyes', 'green eyes', 'purple eyes'] },
  { group: '发型', tags: ['twin tails', 'ponytail', 'long hair', 'short hair', 'ahoge', 'braid'] },
  { group: '服饰', tags: ['school uniform', 'sailor dress', 'kimono', 'hoodie', 'white dress', 'oversized sweater'] },
];

export const CharacterReferenceSection: React.FC<CharacterReferenceSectionProps> = ({
  characterData,
  onUpdateCharacterData,
  onAppendSubjectTag,
  onParseImageMeta,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const handleFileChange = (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    onUpdateCharacterData({
      imageUrl,
      name: file.name,
      useForI2I: true,
      strength: 0.45,
      noise: 0.05,
      file,
    });
  };

  return (
    <div id="section-character-reference" className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-4 space-y-3.5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
            人物参考图 (Character Reference)
          </span>
          <span className="text-[10px] text-[#30D158] font-medium bg-[#30D158]/10 px-1.5 py-0.5 rounded-full">
            {characterData ? '已加载参考' : '未加载'}
          </span>
        </div>

        {characterData && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-[#0A84FF] hover:text-[#409CFF] flex items-center gap-1 font-medium cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              更换
            </button>
            <button
              type="button"
              onClick={() => onUpdateCharacterData(null)}
              className="text-xs text-[#FF453A] hover:text-[#FF6961] flex items-center gap-1 font-medium cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              移除
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
        }}
      />

      {/* Upload Zone or Image Preview */}
      {!characterData ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/15 hover:border-[#007AFF]/60 bg-[#000000]/40 hover:bg-[#000000]/60 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2"
        >
          <div className="w-9 h-9 rounded-full bg-[#2C2C2E] flex items-center justify-center text-[#0A84FF]">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-white">点击或拖拽上传人物原画 / 设定图</p>
            <p className="text-[10px] text-[#8E8E93] mt-0.5">
              上传后默认作为人物图参与 Image-to-Image 生成，也可读取图片内置 Prompt
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Preview Card */}
          <div className="p-3 bg-[#000000] border border-white/10 rounded-xl flex items-center gap-3">
            <div className="relative group shrink-0">
              <img
                src={characterData.imageUrl}
                alt="Character Reference"
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-white/10"
              />
              <button
                type="button"
                onClick={() => setIsZoomOpen(true)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity text-white cursor-pointer"
                title="查看大图"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <div className="min-w-0 flex-1 space-y-1 text-xs">
              <div className="text-white font-medium truncate flex items-center justify-between">
                <span className="truncate">{characterData.name}</span>
                <span className="text-[10px] text-[#8E8E93] shrink-0">人物立绘</span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {onParseImageMeta && characterData.file && (
                  <button
                    type="button"
                    onClick={() => onParseImageMeta(characterData.file!)}
                    className="px-2 py-1 rounded-md bg-[#2C2C2E] hover:bg-[#3A3A3C] text-[11px] text-[#0A84FF] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-[#30D158]" />
                    读取该图Prompt
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(true)}
                  className="px-2 py-1 rounded-md bg-[#2C2C2E] hover:bg-[#3A3A3C] text-[11px] text-[#8E8E93] hover:text-white cursor-pointer transition-colors"
                >
                  放大查看
                </button>
              </div>
            </div>
          </div>

          {/* i2i Toggle Switch */}
          <div className="p-3 bg-[#2C2C2E]/60 border border-white/5 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#0A84FF]" />
                <span className="text-xs font-medium text-white">使用人物图生成 (Image-to-Image)</span>
              </div>

              {/* iOS Switch */}
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={characterData.useForI2I}
                  onChange={(e) =>
                    onUpdateCharacterData({
                      ...characterData,
                      useForI2I: e.target.checked,
                    })
                  }
                  className="sr-only"
                />
                <div
                  className={`w-10 h-5 rounded-full transition-colors duration-200 ease-in-out ${
                    characterData.useForI2I ? 'bg-[#30D158]' : 'bg-[#39393D]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out mt-0.5 ${
                      characterData.useForI2I ? 'translate-x-5.5' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </label>
            </div>

            {characterData.useForI2I && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#8E8E93]">重绘幅度 (Strength)</span>
                  <span className="text-[#0A84FF] font-mono font-semibold">{characterData.strength.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-[#8E8E93]">
                  已启用：Strength 越低越贴近人物原图；Noise 建议保持较低以减少伪影。
                </p>
                <input
                  type="range"
                  min="0.1"
                  max="0.95"
                  step="0.05"
                  value={characterData.strength}
                  onChange={(e) =>
                    onUpdateCharacterData({
                      ...characterData,
                      strength: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-[#007AFF] cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-[#636366]">
                  <span>0.2 保原图姿态</span>
                  <span>0.65 标准平衡</span>
                  <span>0.9 强重绘</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-[#8E8E93]">细节噪声 (Noise)</span>
                  <span className="text-[#0A84FF] font-mono font-semibold">{characterData.noise.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.4"
                  step="0.05"
                  value={characterData.noise}
                  onChange={(e) =>
                    onUpdateCharacterData({
                      ...characterData,
                      noise: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-[#007AFF] cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Character Tags Suggestion */}
      <div className="space-y-1.5 pt-1 border-t border-white/5">
        <div className="text-[11px] text-[#8E8E93] flex items-center justify-between">
          <span>角色特征词速填（点击注入主体词）：</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {COMMON_CHARACTER_TAG_CHIPS.flatMap((g) => g.tags).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onAppendSubjectTag(tag)}
              className="px-2 py-0.5 rounded-md bg-[#2C2C2E] hover:bg-[#3A3A3C] text-[10px] font-mono text-[#EBEBF5] hover:text-[#0A84FF] border border-white/5 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-2.5 h-2.5 opacity-60" />
              <span>{tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox Zoom Modal */}
      {isZoomOpen && characterData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-[#1C1C1E] border border-white/15 rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-2 border-b border-white/10 mb-2">
              <span className="text-xs font-semibold text-white truncate">{characterData.name}</span>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="p-1 rounded-lg text-[#8E8E93] hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={characterData.imageUrl}
              alt="Zoomed Reference"
              className="max-w-full max-h-[75vh] object-contain rounded-xl mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};
