import React, { useState } from 'react';
import { ArtistSlot, PresetMode, SavedArtist } from '../types';
import { ArtistPrefixStyle } from '../utils/promptBuilder';
import {
  Sparkles,
  Check,
  Trash2,
  ShieldAlert,
  Radio,
  Plus,
  Info,
  Wand2,
  ChevronDown,
  HelpCircle,
  UserRound,
  PlayCircle,
  Bookmark,
  X,
} from 'lucide-react';

interface ArtistSlotsSectionProps {
  slots: ArtistSlot[];
  activeMode: PresetMode;
  onSelectMode: (mode: PresetMode) => void;
  singleTestSlotId: string;
  onSelectSingleTestSlot: (id: string) => void;
  useArtistPrefix: boolean;
  prefixStyle?: ArtistPrefixStyle;
  onToggleArtistPrefix: (val: boolean) => void;
  onChangePrefixStyle?: (style: ArtistPrefixStyle) => void;
  onUpdateSlot: (id: string, updates: Partial<ArtistSlot>) => void;
  onClearSlot: (id: string) => void;
  onAddSlotToBlacklist: (name: string) => void;
  onAddCustomSlot: () => void;
  onRemoveCustomSlot: (id: string) => void;
  onSaveArtist: (slot: ArtistSlot) => void;
  onTestSlot: (slot: ArtistSlot) => void;
  onOpenParser?: () => void;
  savedArtists: SavedArtist[];
  onUseSavedArtist: (artist: SavedArtist) => void;
  onDeleteSavedArtist: (id: string) => void;
}

const AVAILABLE_ROLES = [
  '整体主控',
  '色彩基调',
  '线条轮廓',
  '光影质感',
  '笔触细节',
  '意境氛围',
  '服饰配饰',
  '自由画师',
];

export const ArtistSlotsSection: React.FC<ArtistSlotsSectionProps> = ({
  slots,
  activeMode,
  onSelectMode,
  singleTestSlotId,
  onSelectSingleTestSlot,
  useArtistPrefix,
  prefixStyle = 'colon',
  onToggleArtistPrefix,
  onChangePrefixStyle,
  onUpdateSlot,
  onClearSlot,
  onAddSlotToBlacklist,
  onAddCustomSlot,
  onRemoveCustomSlot,
  onSaveArtist,
  onTestSlot,
  onOpenParser,
  savedArtists,
  onUseSavedArtist,
  onDeleteSavedArtist,
}) => {
  const [showLogicExplanation, setShowLogicExplanation] = useState(false);

  return (
    <div id="section-artist-slots" className="space-y-4">
      {/* iOS Style Presets & Controls Card */}
      <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-4 space-y-3.5 shadow-sm">
        {/* Header: Title & Prefix format selector */}
        <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
              预设模式
            </span>
            <button
              type="button"
              onClick={() => setShowLogicExplanation(!showLogicExplanation)}
              className="text-[#8E8E93] hover:text-[#0A84FF] transition-colors cursor-pointer"
              title="查看画师权重与通道真实逻辑"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Prefix format selector */}
          <div className="flex items-center gap-1.5 text-xs text-[#8E8E93]">
            <span className="text-xs text-[#AEAEB2] hidden sm:inline">语法格式:</span>
            <div className="flex bg-[#2C2C2E] p-0.5 rounded-lg text-[11px] font-mono">
              <button
                type="button"
                onClick={() => {
                  onToggleArtistPrefix(true);
                  onChangePrefixStyle?.('space');
                }}
                className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                  useArtistPrefix && prefixStyle === 'space'
                    ? 'bg-[#007AFF] text-white font-semibold'
                    : 'text-[#8E8E93] hover:text-white'
                }`}
                title="例如 1.8::artist juumou_(c5buf) :: (NovelAI V5 官方空格语法)"
              >
                artist name
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleArtistPrefix(true);
                  onChangePrefixStyle?.('colon');
                }}
                className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                  useArtistPrefix && prefixStyle === 'colon'
                    ? 'bg-[#007AFF] text-white font-semibold'
                    : 'text-[#8E8E93] hover:text-white'
                }`}
                title="例如 1.2::artist:wlop::"
              >
                artist:name
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleArtistPrefix(true);
                  onChangePrefixStyle?.('merged');
                }}
                className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                  useArtistPrefix && prefixStyle === 'merged'
                    ? 'bg-[#007AFF] text-white font-semibold'
                    : 'text-[#8E8E93] hover:text-white'
                }`}
                title="例如 1.2::artistwlop:: (紧凑语法)"
              >
                artistname
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleArtistPrefix(false);
                  onChangePrefixStyle?.('none');
                }}
                className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                  !useArtistPrefix
                    ? 'bg-[#007AFF] text-white font-semibold'
                    : 'text-[#8E8E93] hover:text-white'
                }`}
                title="例如 1.2::wlop:: (无前缀)"
              >
                纯画师名
              </button>
            </div>
          </div>
        </div>

        {/* Real Mechanism Tip */}
        {showLogicExplanation && (
          <div className="p-3 bg-[#0A84FF]/10 border border-[#0A84FF]/25 rounded-xl text-xs text-[#D1E9FF] leading-relaxed space-y-1 animate-fade-in">
            <div className="font-semibold text-[#409CFF] flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              这真的是控制线条的吗？—— 关于画师权重的真实机制
            </div>
            <p>
              在 NovelAI V5 / V4 中，并没有底层硬件层面的“独立线条通道”或“纯上色通道”。所有画师词都在潜空间中同时影响构图、色彩、线条与光影。
            </p>
            <p className="text-[#8E8E93]">
              槽位角色（如整体基底、色彩、线条）是方便创作者建立工作流的心理锚点。画面最终呈现是各位画师词权重相乘交融的结果，您可以自由设定任意数量与角色的画师。
            </p>
          </div>
        )}

        {/* Single Test Mode */}
        <div className="p-1 bg-[#2C2C2E] rounded-xl">
          <button
            id="btn-mode-single"
            type="button"
            onClick={() => onSelectMode('single')}
            className={`py-2 px-2 rounded-lg text-xs font-medium transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
              activeMode === 'single'
                ? 'bg-[#FF453A] text-white shadow-sm font-semibold'
                : 'text-[#AEAEB2] hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="whitespace-nowrap">单画师排查</span>
            <span className="text-[10px] opacity-75 hidden sm:inline">独立测试</span>
          </button>
        </div>

        {activeMode === 'single' && (
          <div className="p-3 bg-[#FF453A]/10 border border-[#FF453A]/25 rounded-xl text-xs text-[#FF453A] flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>已启用单画师排查。仅下方被选中的画师生效，用于快速测试画师是否炸图或相克。</span>
          </div>
        )}
      </div>

      {/* Artist Slots List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider flex items-center gap-1.5">
            <span>画师混合槽位</span>
            <span className="text-[#636366] text-xs font-normal">
              ({slots.filter((s) => s.enabled && s.name.trim()).length}/{slots.length} 生效)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenParser && (
              <button
                type="button"
                onClick={onOpenParser}
                className="text-xs text-[#0A84FF] hover:text-[#409CFF] flex items-center gap-1 font-medium cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                解析填入
              </button>
            )}
            <button
              id="btn-add-custom-slot"
              type="button"
              onClick={onAddCustomSlot}
              className="text-xs text-[#8E8E93] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              添加槽位
            </button>
          </div>
        </div>

        {slots.map((slot, index) => {
          const isSlotIsolated = activeMode === 'single' && singleTestSlotId === slot.id;
          const isMutedBySingleMode = activeMode === 'single' && singleTestSlotId !== slot.id;

          return (
            <div
              key={slot.id}
              id={`card-slot-${slot.id}`}
              className={`border rounded-2xl p-3.5 transition-all relative ${
                isSlotIsolated
                  ? 'bg-[#1C1C1E] border-[#FF453A]/60 ring-1 ring-[#FF453A]/30 shadow-md'
                  : isMutedBySingleMode
                  ? 'bg-[#151516] border-white/5 opacity-50'
                  : slot.enabled
                  ? 'bg-[#1C1C1E] border-white/10 shadow-sm'
                  : 'bg-[#141416] border-white/5 opacity-60'
              }`}
            >
              {/* Header row: Checkbox, slot index badge, role selector, actions */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {/* Enable circular checkbox */}
                  <button
                    id={`toggle-enable-${slot.id}`}
                    type="button"
                    onClick={() => onUpdateSlot(slot.id, { enabled: !slot.enabled })}
                    className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                      slot.enabled
                        ? 'bg-[#007AFF] border-[#007AFF] text-white'
                        : 'border-[#636366] bg-transparent text-transparent'
                    }`}
                    title={slot.enabled ? '停用此槽位' : '启用此槽位'}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </button>

                  {/* Slot Number badge */}
                  <span className="w-5 h-5 rounded-md bg-[#2C2C2E] text-white font-mono text-[11px] font-bold flex items-center justify-center">
                    {index + 1}
                  </span>

                  {/* Role Selector */}
                  <select
                    value={slot.roleLabel}
                    onChange={(e) => onUpdateSlot(slot.id, { roleLabel: e.target.value })}
                    className="bg-[#2C2C2E] text-white text-xs font-medium px-2 py-0.5 rounded-lg border border-white/10 focus:outline-none focus:ring-1 focus:ring-[#007AFF] cursor-pointer"
                  >
                    {AVAILABLE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                    {!AVAILABLE_ROLES.includes(slot.roleLabel) && (
                      <option value={slot.roleLabel}>{slot.roleLabel}</option>
                    )}
                  </select>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-1.5">
                  {activeMode === 'single' && (
                    <button
                      type="button"
                      onClick={() => onSelectSingleTestSlot(slot.id)}
                      className={`px-2 py-1 text-xs rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                        isSlotIsolated
                          ? 'bg-[#FF453A] text-white font-medium'
                          : 'bg-[#2C2C2E] text-[#8E8E93] hover:text-white'
                      }`}
                    >
                      <Radio className="w-3 h-3" />
                      {isSlotIsolated ? '独测中' : '测试此项'}
                    </button>
                  )}

                  {slot.name.trim() && (
                    <>
                      <button
                        type="button"
                        onClick={() => onSaveArtist(slot)}
                        className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#30D158] hover:bg-[#2C2C2E] transition-colors cursor-pointer"
                        title="保存到画师库"
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onTestSlot(slot)}
                        className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#0A84FF] hover:bg-[#2C2C2E] transition-colors cursor-pointer"
                        title="只用这个画师单独生图"
                      >
                        <PlayCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {slot.name.trim() && (
                    <button
                      id={`btn-blacklist-${slot.id}`}
                      type="button"
                      onClick={() => onAddSlotToBlacklist(slot.name)}
                      className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#FF9F0A] hover:bg-[#2C2C2E] transition-colors cursor-pointer"
                      title={`加入黑名单: ${slot.name}`}
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    id={`btn-clear-${slot.id}`}
                    type="button"
                    onClick={() => onClearSlot(slot.id)}
                    className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#FF453A] hover:bg-[#2C2C2E] transition-colors cursor-pointer"
                    title="清空画师名称"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {slots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveCustomSlot(slot.id)}
                      className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#FF453A] hover:bg-[#FF453A]/15 transition-colors cursor-pointer text-xs"
                      title="删除此槽位"
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>

              {/* Inputs: Tag and Weight Slider */}
              <div className="space-y-2.5">
                <input
                  id={`input-artist-name-${slot.id}`}
                  type="text"
                  value={slot.name}
                  onChange={(e) => onUpdateSlot(slot.id, { name: e.target.value })}
                  placeholder="画师名 (如: seapall, wlop, serafleur, kirochy)"
                  className="w-full px-3 py-2 bg-[#2C2C2E] border border-white/5 rounded-xl text-xs sm:text-sm font-mono text-white placeholder-[#636366] focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all"
                />

                {/* Weight slider & Number display */}
                <div className="flex items-center gap-3 bg-[#242426] p-2 rounded-xl">
                  <span className="text-xs text-[#8E8E93] shrink-0 w-8">权重</span>
                  <input
                    id={`slider-weight-${slot.id}`}
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.05"
                    value={slot.weight}
                    onChange={(e) =>
                      onUpdateSlot(slot.id, { weight: parseFloat(e.target.value) || 0.1 })
                    }
                    className="flex-1 accent-[#007AFF] h-1.5 bg-[#3A3A3C] rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center">
                    <input
                      id={`input-weight-number-${slot.id}`}
                      type="number"
                      min="0.05"
                      max="3.0"
                      step="0.05"
                      value={slot.weight}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          onUpdateSlot(slot.id, { weight: Math.max(0.05, Math.min(3.0, val)) });
                        }
                      }}
                      className="w-14 px-1.5 py-1 bg-[#2C2C2E] border border-white/10 rounded-lg text-center text-xs font-mono font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Saved Artist Library */}
      <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserRound className="w-4 h-4 text-[#0A84FF]" />
            <span className="text-xs font-semibold text-white">画师库</span>
          </div>
          <span className="text-[10px] text-[#8E8E93]">点击头像快速填入</span>
        </div>
        {savedArtists.length === 0 ? (
          <p className="text-[11px] text-[#636366]">在画师槽位右上角点击书签，即可保存常用画师。</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {savedArtists.map((artist) => (
              <div key={artist.id} className="group flex items-center gap-2 p-2 rounded-xl bg-[#2C2C2E] border border-white/5">
                <button
                  type="button"
                  onClick={() => onUseSavedArtist(artist)}
                  className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] text-white font-bold text-sm flex items-center justify-center cursor-pointer"
                  title={`填入 ${artist.name}`}
                >
                  {artist.name.slice(0, 1).toUpperCase()}
                </button>
                <button type="button" onClick={() => onUseSavedArtist(artist)} className="min-w-0 flex-1 text-left cursor-pointer">
                  <div className="text-xs text-white truncate">{artist.name}</div>
                  <div className="text-[10px] text-[#8E8E93]">权重 {artist.weight.toFixed(2)} · 快速填入</div>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteSavedArtist(artist.id)}
                  className="p-1 text-[#636366] hover:text-[#FF453A] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="从画师库删除"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
