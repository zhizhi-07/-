import React from 'react';
import { ShieldAlert, RotateCcw, KeyRound, Sparkles, Wand2, Sliders } from 'lucide-react';

interface NavbarProps {
  hasApiKey: boolean;
  onOpenParser: () => void;
  onOpenBlacklist: () => void;
  onResetAll: () => void;
  onScrollToApi: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  hasApiKey,
  onOpenParser,
  onOpenBlacklist,
  onResetAll,
  onScrollToApi,
}) => {
  return (
    <header
      id="app-navbar"
      className="sticky top-0 z-40 w-full bg-black/80 backdrop-blur-xl border-b border-white/10 text-white select-none"
    >
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-14 flex items-center justify-between gap-2">
        {/* Left: iOS App Title */}
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-[#0A84FF] to-[#0060DF] flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0">
            <Sliders className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-sm sm:text-base tracking-tight text-white whitespace-nowrap">
              NovelAI V5
            </span>
            <span className="text-xs text-[#8E8E93] font-normal hidden xs:inline whitespace-nowrap">
              画师配比
            </span>
          </div>
        </div>

        {/* Right: iOS Actions (Clean, whitespace-nowrap, never squished) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* iOS Primary Action: Parse / 一键解析 */}
          <button
            id="nav-btn-open-parser"
            type="button"
            onClick={onOpenParser}
            className="h-8 px-3 rounded-full bg-[#007AFF] hover:bg-[#0069D9] active:scale-95 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap shrink-0 cursor-pointer"
            title="一键粘贴提示词，自动识别画师与参数填入"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>解析填入</span>
          </button>

          {/* iOS Secondary Action: Blacklist / 黑名单 */}
          <button
            id="nav-btn-blacklist"
            type="button"
            onClick={onOpenBlacklist}
            className="h-8 px-2.5 sm:px-3 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] active:scale-95 text-[#EBEBF5] text-xs font-medium flex items-center gap-1 border border-white/10 transition-all whitespace-nowrap shrink-0 cursor-pointer"
            title="画师避错黑名单与平替词"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#FF9F0A]" />
            <span className="hidden sm:inline">黑名单</span>
          </button>

          {/* API Key Status Pill */}
          <button
            id="nav-btn-api-status"
            type="button"
            onClick={onScrollToApi}
            className={`h-8 px-2.5 rounded-full text-xs font-medium flex items-center gap-1.5 border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              hasApiKey
                ? 'bg-[#30D158]/15 border-[#30D158]/30 text-[#30D158] hover:bg-[#30D158]/25'
                : 'bg-[#1C1C1E] border-white/10 text-[#8E8E93] hover:text-white hover:bg-[#2C2C2E]'
            }`}
            title={hasApiKey ? 'API Key 已配置' : '配置 NovelAI API Key'}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{hasApiKey ? '已填 Key' : '设置 Key'}</span>
          </button>

          {/* Reset button: Clean circular button */}
          <button
            id="nav-btn-reset-defaults"
            type="button"
            onClick={onResetAll}
            className="w-8 h-8 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] active:scale-95 border border-white/10 text-[#8E8E93] hover:text-white flex items-center justify-center transition-all shrink-0 cursor-pointer"
            title="恢复默认设置"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
