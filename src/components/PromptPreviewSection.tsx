import React, { useState } from 'react';
import {
  Copy,
  Check,
  FileJson,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  Sliders,
  Wand2,
  Shield,
  Layers,
  FileText,
} from 'lucide-react';
import { PromptBuildResult } from '../utils/promptBuilder';
import { GenerationParams } from '../types';

interface PromptPreviewSectionProps {
  promptResult: PromptBuildResult;
  qualityPrefix: string;
  onChangeQualityPrefix: (val: string) => void;
  styleTags: string;
  onChangeStyleTags: (val: string) => void;
  subjectPrompt: string;
  onChangeSubjectPrompt: (val: string) => void;
  negativePrompt: string;
  onChangeNegativePrompt: (val: string) => void;
  onClearAll: () => void;
  generationParams: GenerationParams;
  onOpenBlacklistModal: () => void;
  onOpenParser?: () => void;
}

export const PromptPreviewSection: React.FC<PromptPreviewSectionProps> = ({
  promptResult,
  qualityPrefix,
  onChangeQualityPrefix,
  styleTags,
  onChangeStyleTags,
  subjectPrompt,
  onChangeSubjectPrompt,
  negativePrompt,
  onChangeNegativePrompt,
  onClearAll,
  generationParams,
  onOpenBlacklistModal,
  onOpenParser,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const triggerCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyJson = () => {
    const payload = {
      prompt: promptResult.fullPositivePrompt,
      negative_prompt: negativePrompt,
      model: generationParams.model,
      width: generationParams.width,
      height: generationParams.height,
      steps: generationParams.steps,
      scale: generationParams.scale,
      sampler: generationParams.sampler,
      seed: generationParams.seed ?? 'random',
    };
    triggerCopy(JSON.stringify(payload, null, 2), 'json');
  };

  return (
    <div id="section-prompt-preview" className="space-y-4">
      {/* Blacklist Alert Banner */}
      {promptResult.hasBlacklisted && (
        <div
          id="alert-blacklist-detected"
          className="p-3 bg-[#FF9F0A]/10 border border-[#FF9F0A]/30 rounded-2xl text-[#FF9F0A] text-xs flex items-center justify-between gap-3 shadow-sm animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#FF9F0A]" />
            <div>
              <span className="font-semibold">黑名单过滤已触发：</span>
              <span>
                跳过 {promptResult.skippedBlacklisted.join(', ')}，已自动补充防炸平替词。
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenBlacklistModal}
            className="text-xs text-[#FF9F0A] underline shrink-0 cursor-pointer"
          >
            设置
          </button>
        </div>
      )}

      {/* iOS Action Bar */}
      <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white tracking-wide">
            提示词预览与汇聚
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Quick Parser Button */}
          {onOpenParser && (
            <button
              type="button"
              onClick={onOpenParser}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-[#0A84FF] bg-[#0A84FF]/15 hover:bg-[#0A84FF]/25 transition-all cursor-pointer"
              title="粘贴整段提示词解析"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>解析填入</span>
            </button>
          )}

          {/* Copy Positive Button */}
          <button
            id="btn-copy-positive-prompt"
            type="button"
            onClick={() => triggerCopy(promptResult.fullPositivePrompt, 'positive')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              copiedType === 'positive'
                ? 'bg-[#30D158] text-black font-semibold'
                : 'bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white'
            }`}
          >
            {copiedType === 'positive' ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>已复制</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>复制正面 Prompt</span>
              </>
            )}
          </button>

          {/* Copy Negative Button */}
          <button
            id="btn-copy-negative-prompt"
            type="button"
            onClick={() => triggerCopy(negativePrompt, 'negative')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              copiedType === 'negative'
                ? 'bg-[#30D158] text-black font-semibold'
                : 'bg-[#2C2C2E] hover:bg-[#3A3A3C] text-[#EBEBF5]'
            }`}
          >
            {copiedType === 'negative' ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>已复制负面</span>
              </>
            ) : (
              <>
                <Shield className="w-3.5 h-3.5" />
                <span>复制负面</span>
              </>
            )}
          </button>

          {/* Copy JSON */}
          <button
            id="btn-copy-json-params"
            type="button"
            onClick={handleCopyJson}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              copiedType === 'json'
                ? 'bg-[#30D158] text-black'
                : 'bg-[#2C2C2E] hover:bg-[#3A3A3C] text-[#8E8E93]'
            }`}
            title="复制包含尺寸、步数、采样的完整 JSON"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">JSON</span>
          </button>

          {/* Clear Prompts */}
          <button
            id="btn-clear-all-prompts"
            type="button"
            onClick={onClearAll}
            className="p-1.5 rounded-full bg-[#2C2C2E] hover:bg-[#3A3A3C] text-[#8E8E93] hover:text-white transition-all cursor-pointer"
            title="清空所有画师名称"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Generated Artist String Box */}
      <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="preview-artist-string" className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
            画师串 (NovelAI V5 格式)
          </label>
          <span className="text-xs text-[#8E8E93]">
            {promptResult.activeArtistsCount} 位画师生效
          </span>
        </div>
        <div
          id="preview-artist-string"
          className="p-3 bg-[#000000] border border-white/10 rounded-xl text-xs sm:text-sm font-mono text-[#0A84FF] whitespace-pre-wrap leading-relaxed select-all min-h-[46px] flex items-center"
        >
          {promptResult.artistString || (
            <span className="text-[#636366] font-sans">
              （暂无生效画师，请在左侧填写或点击“解析填入”）
            </span>
          )}
        </div>
      </div>

      {/* Final Combined Positive Prompt Preview */}
      <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="preview-full-positive" className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
            完整正面 Prompt (依序拼装)
          </label>
          <span className="text-[11px] text-[#636366]">
            画师串 → 质量前缀 → 风格修饰 → 画面主体
          </span>
        </div>
        <textarea
          id="preview-full-positive"
          readOnly
          rows={3}
          value={promptResult.fullPositivePrompt}
          className="w-full p-3 bg-[#000000] border border-white/10 rounded-xl text-xs sm:text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF] leading-relaxed resize-y select-all"
          placeholder="正面 Prompt 汇聚区..."
        />
      </div>

      {/* Editable Component Prompt Blocks (iOS Grouped Style) */}
      <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-3.5 space-y-3">
        {/* Quality Prefix */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="input-quality-prefix" className="text-xs font-medium text-[#8E8E93]">
              质量前缀 (Quality)
            </label>
            <span className="text-[10px] text-[#636366]">画质与年代标签</span>
          </div>
          <input
            id="input-quality-prefix"
            type="text"
            value={qualityPrefix}
            onChange={(e) => onChangeQualityPrefix(e.target.value)}
            className="w-full px-3 py-2 bg-[#2C2C2E] border border-white/5 rounded-xl text-xs sm:text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
          />
        </div>

        {/* Style Modifiers */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="input-style-tags" className="text-xs font-medium text-[#8E8E93]">
              风格修饰词 (Style Modifiers)
            </label>
            <span className="text-[10px] text-[#636366]">线条、色彩氛围</span>
          </div>
          <input
            id="input-style-tags"
            type="text"
            value={styleTags}
            onChange={(e) => onChangeStyleTags(e.target.value)}
            className="w-full px-3 py-2 bg-[#2C2C2E] border border-white/5 rounded-xl text-xs sm:text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
          />
        </div>

        {/* Subject Prompt */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="input-subject-prompt" className="text-xs font-medium text-[#8E8E93]">
              画面主体与角色 (Subject)
            </label>
            <span className="text-[10px] text-[#636366]">人物、动作、服装、背景</span>
          </div>
          <input
            id="input-subject-prompt"
            type="text"
            value={subjectPrompt}
            onChange={(e) => onChangeSubjectPrompt(e.target.value)}
            className="w-full px-3 py-2 bg-[#2C2C2E] border border-white/5 rounded-xl text-xs sm:text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
          />
        </div>
      </div>

      {/* Negative Prompt Box */}
      <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="input-negative-prompt" className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
            负面提示词 (Negative Prompt)
          </label>
          <span className="text-[11px] text-[#636366]">过滤畸形与低画质</span>
        </div>
        <textarea
          id="input-negative-prompt"
          rows={2}
          value={negativePrompt}
          onChange={(e) => onChangeNegativePrompt(e.target.value)}
          className="w-full p-3 bg-[#000000] border border-white/10 rounded-xl text-xs sm:text-sm font-mono text-[#FF453A] focus:outline-none focus:ring-1 focus:ring-[#FF453A] leading-relaxed resize-y"
        />
      </div>
    </div>
  );
};
