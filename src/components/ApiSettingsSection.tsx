import React, { useState } from 'react';
import {
  Key,
  Eye,
  EyeOff,
  Trash2,
  Sliders,
  Dices,
  Play,
  FlaskConical,
  Lock,
  Unlock,
  ShieldCheck,
} from 'lucide-react';
import { GenerationParams } from '../types';
import {
  AVAILABLE_MODELS,
  AVAILABLE_SAMPLERS,
  AVAILABLE_NOISE_SCHEDULES,
  RESOLUTION_PRESETS,
} from '../constants/presets';

interface ApiSettingsSectionProps {
  params: GenerationParams;
  onChangeParams: (updates: Partial<GenerationParams>) => void;
  onClearApiKey: () => void;
  isGenerating: boolean;
  onTriggerGenerate: (simulate?: boolean) => void;
}

export const ApiSettingsSection: React.FC<ApiSettingsSectionProps> = ({
  params,
  onChangeParams,
  onClearApiKey,
  isGenerating,
  onTriggerGenerate,
}) => {
  const [showKey, setShowKey] = useState(false);
  const [isSeedLocked, setIsSeedLocked] = useState(params.seed !== null && params.seed !== undefined);

  const handleRandomSeed = () => {
    const randomVal = Math.floor(Math.random() * 4294967295);
    onChangeParams({ seed: randomVal });
    setIsSeedLocked(true);
  };

  const handleToggleSeedLock = () => {
    if (isSeedLocked) {
      setIsSeedLocked(false);
      onChangeParams({ seed: null });
    } else {
      setIsSeedLocked(true);
      if (params.seed === null || params.seed === undefined) {
        onChangeParams({ seed: Math.floor(Math.random() * 4294967295) });
      }
    }
  };

  return (
    <div id="section-api-settings" className="space-y-4">
      {/* NovelAI API Key Box */}
      <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-[#0A84FF]" />
            <span className="text-xs font-semibold text-white tracking-wide">
              NovelAI API Key
            </span>
          </div>
          <span className="text-[11px] text-[#30D158] flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> 本地安全保存
          </span>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <input
              id="input-novelai-apikey"
              type={showKey ? 'text' : 'password'}
              value={params.apiKey}
              onChange={(e) => onChangeParams({ apiKey: e.target.value })}
              placeholder="pst-..."
              className="w-full pl-3 pr-20 py-2 bg-[#2C2C2E] border border-white/5 rounded-xl text-xs sm:text-sm font-mono text-white placeholder-[#636366] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                id="btn-toggle-apikey-visibility"
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1.5 text-[#8E8E93] hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title={showKey ? '隐藏' : '显示'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {params.apiKey && (
                <button
                  id="btn-clear-apikey"
                  type="button"
                  onClick={onClearApiKey}
                  className="p-1.5 text-[#8E8E93] hover:text-[#FF453A] rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title="清空"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <p className="text-[11px] text-[#8E8E93]">
            Key 仅保存于本地浏览器 localStorage，直连官方/反代，不经任何第三方中转。
          </p>
        </div>
      </div>

      {/* Model & Generation Parameters Card */}
      <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-4 shadow-sm space-y-3.5">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <Sliders className="w-4 h-4 text-[#0A84FF]" />
          <span className="text-xs font-semibold text-white tracking-wide">
            生成参数配置
          </span>
        </div>

        {/* Model Selection */}
        <div className="space-y-1.5">
          <label htmlFor="select-model" className="text-xs text-[#8E8E93] font-medium">
            模型版本
          </label>
          <select
            id="select-model"
            value={params.model}
            onChange={(e) => onChangeParams({ model: e.target.value })}
            className="w-full px-3 py-2 bg-[#2C2C2E] border border-white/5 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF] cursor-pointer"
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Resolution presets */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8E8E93] font-medium">
              画幅比例
            </span>
            <span className="text-xs font-mono text-[#0A84FF]">
              {params.width} × {params.height}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {RESOLUTION_PRESETS.map((res) => {
              const isMatch = params.width === res.width && params.height === res.height;
              return (
                <button
                  key={res.label}
                  type="button"
                  onClick={() => onChangeParams({ width: res.width, height: res.height })}
                  className={`px-2 py-1.5 text-center text-xs rounded-xl border transition-all cursor-pointer ${
                    isMatch
                      ? 'bg-[#007AFF] border-[#007AFF] text-white font-medium shadow-sm'
                      : 'bg-[#2C2C2E] border-white/5 text-[#8E8E93] hover:text-white hover:bg-[#3A3A3C]'
                  }`}
                >
                  {res.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Steps & Scale */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Steps */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="slider-steps" className="text-xs text-[#8E8E93]">步数 (Steps)</label>
              <span className="text-xs font-mono text-white">{params.steps}</span>
            </div>
            <input
              id="slider-steps"
              type="range"
              min="10"
              max="50"
              step="1"
              value={params.steps}
              onChange={(e) => onChangeParams({ steps: parseInt(e.target.value) || 28 })}
              className="w-full accent-[#007AFF] h-1.5 bg-[#3A3A3C] rounded-lg cursor-pointer"
            />
          </div>

          {/* Scale / Guidance */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="slider-scale" className="text-xs text-[#8E8E93]">CFG Scale</label>
              <span className="text-xs font-mono text-white">{params.scale}</span>
            </div>
            <input
              id="slider-scale"
              type="range"
              min="1"
              max="15"
              step="0.5"
              value={params.scale}
              onChange={(e) => onChangeParams({ scale: parseFloat(e.target.value) || 5 })}
              className="w-full accent-[#007AFF] h-1.5 bg-[#3A3A3C] rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Sampler */}
        <div className="space-y-1.5 pt-1">
          <label htmlFor="select-sampler" className="text-xs text-[#8E8E93]">
            采样器 (Sampler)
          </label>
          <select
            id="select-sampler"
            value={params.sampler}
            onChange={(e) => onChangeParams({ sampler: e.target.value })}
            className="w-full px-3 py-2 bg-[#2C2C2E] border border-white/5 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF] cursor-pointer"
          >
            {AVAILABLE_SAMPLERS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Noise schedule & CFG rescale */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-1.5">
            <label htmlFor="select-noise-schedule" className="text-xs text-[#8E8E93]">噪声表</label>
            <select
              id="select-noise-schedule"
              value={params.noiseSchedule || 'karras'}
              onChange={(e) => onChangeParams({ noiseSchedule: e.target.value })}
              className="w-full px-2 py-2 bg-[#2C2C2E] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF] cursor-pointer"
            >
              {AVAILABLE_NOISE_SCHEDULES.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>{schedule.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="slider-rescale" className="text-xs text-[#8E8E93]">Rescale</label>
              <span className="text-xs font-mono text-white">{params.rescale ?? 0}</span>
            </div>
            <input
              id="slider-rescale"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={params.rescale ?? 0}
              onChange={(e) => onChangeParams({ rescale: parseFloat(e.target.value) || 0 })}
              className="w-full accent-[#007AFF] h-1.5 bg-[#3A3A3C] rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Seed */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <label htmlFor="input-seed" className="text-xs text-[#8E8E93]">种子 (Seed)</label>
            <button
              type="button"
              onClick={handleToggleSeedLock}
              className="text-xs text-[#8E8E93] hover:text-white flex items-center gap-1 cursor-pointer"
              title={isSeedLocked ? '解锁为随机' : '固定 Seed'}
            >
              {isSeedLocked ? (
                <>
                  <Lock className="w-3 h-3 text-[#FF9F0A]" />
                  <span>已固定</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3 text-[#8E8E93]" />
                  <span>随机</span>
                </>
              )}
            </button>
          </div>
          <div className="flex gap-2">
            <input
              id="input-seed"
              type="text"
              value={params.seed !== null && params.seed !== undefined ? params.seed : ''}
              placeholder="留空则随机"
              onChange={(e) => {
                const val = e.target.value.trim();
                if (!val) {
                  onChangeParams({ seed: null });
                  setIsSeedLocked(false);
                } else {
                  const num = parseInt(val);
                  if (!isNaN(num)) {
                    onChangeParams({ seed: num });
                    setIsSeedLocked(true);
                  }
                }
              }}
              className="flex-1 px-3 py-2 bg-[#2C2C2E] border border-white/5 rounded-xl text-xs sm:text-sm font-mono text-white placeholder-[#636366] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            />
            <button
              id="btn-random-seed"
              type="button"
              onClick={handleRandomSeed}
              className="px-3 py-2 bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white rounded-xl text-xs border border-white/10 flex items-center gap-1 transition-colors cursor-pointer"
              title="随机新种子"
            >
              <Dices className="w-4 h-4 text-[#0A84FF]" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons: iOS Clean Style */}
      <div className="space-y-2 pt-1">
        {/* Real Generation Button: Primary iOS Blue */}
        <button
          id="btn-trigger-generate"
          type="button"
          disabled={isGenerating}
          onClick={() => onTriggerGenerate(false)}
          className="w-full py-3.5 px-4 bg-[#007AFF] hover:bg-[#0069D9] active:scale-[0.98] text-white font-semibold text-sm rounded-2xl shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>正在生成中...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>真实生成 (调用 API)</span>
            </>
          )}
        </button>

        {/* Free Simulation Dry-Run Button */}
        <button
          id="btn-trigger-simulate"
          type="button"
          disabled={isGenerating}
          onClick={() => onTriggerGenerate(true)}
          className="w-full py-2.5 px-3 bg-[#1C1C1E] hover:bg-[#2C2C2E] active:scale-[0.98] border border-white/10 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          title="无需消耗点数，测试格式与效果"
        >
          <FlaskConical className="w-3.5 h-3.5 text-[#0A84FF]" />
          <span>免点数 · 模拟测试画作</span>
        </button>
      </div>
    </div>
  );
};
