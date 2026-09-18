import React, { useState } from 'react';
import { X, Plus, Trash2, ShieldAlert, Check } from 'lucide-react';

interface BlacklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  blacklist: string[];
  onAddBlacklist: (tag: string) => void;
  onRemoveBlacklist: (tag: string) => void;
  replacementTags: string;
  onUpdateReplacementTags: (tags: string) => void;
}

export const BlacklistModal: React.FC<BlacklistModalProps> = ({
  isOpen,
  onClose,
  blacklist,
  onAddBlacklist,
  onRemoveBlacklist,
  replacementTags,
  onUpdateReplacementTags,
}) => {
  const [newTag, setNewTag] = useState('');
  const [replacements, setReplacements] = useState(replacementTags);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    onAddBlacklist(newTag.trim());
    setNewTag('');
  };

  const handleSaveReplacements = () => {
    onUpdateReplacementTags(replacements);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div
      id="blacklist-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        id="blacklist-modal-content"
        className="w-full max-w-lg bg-[#1C1C1E] border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Grabber */}
        <div className="w-9 h-1 bg-[#48484A] rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* iOS Header */}
        <div className="px-4 sm:px-5 py-3 border-b border-white/10 flex items-center justify-between shrink-0">
          <span className="text-sm sm:text-base font-semibold text-white">
            画师黑名单与平替词
          </span>
          <button
            id="btn-close-blacklist-modal"
            onClick={onClose}
            className="text-[#0A84FF] hover:text-[#409CFF] text-sm font-medium cursor-pointer"
          >
            完成
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5">
          <p className="text-xs text-[#8E8E93] leading-relaxed">
            某些冷门画师词（如 <code className="text-[#FF9F0A] bg-black/50 px-1.5 py-0.5 rounded font-mono">eubneung10571</code>）在 V5 模型容易导致坏图或花屏。添加到黑名单后，生成时将自动跳过并注入下方的平替保底词。
          </p>

          {/* Add input */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              id="input-new-blacklist-tag"
              type="text"
              placeholder="输入要屏蔽的画师名 (如 eubneung10571)"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="flex-1 px-3 py-2 bg-[#2C2C2E] border border-white/5 rounded-xl text-xs sm:text-sm font-mono text-white placeholder-[#636366] focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
            />
            <button
              id="btn-add-blacklist-tag"
              type="submit"
              disabled={!newTag.trim()}
              className="px-3.5 py-2 bg-[#007AFF] hover:bg-[#0069D9] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              添加
            </button>
          </form>

          {/* Current Blacklist */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
              当前黑名单 ({blacklist.length})
            </div>
            {blacklist.length === 0 ? (
              <div className="p-3 bg-black/40 rounded-xl text-center text-xs text-[#636366]">
                暂无黑名单画师
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-black/40 rounded-xl border border-white/5">
                {blacklist.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#2C2C2E] text-[#FF453A] text-xs font-mono rounded-lg"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveBlacklist(tag)}
                      className="text-[#8E8E93] hover:text-[#FF453A] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Replacement Tags */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label htmlFor="input-replacement-tags" className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
                自动平替保底词 (触发黑名单时补充)
              </label>
              {savedSuccess && (
                <span className="text-xs text-[#30D158] flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 已保存
                </span>
              )}
            </div>
            <textarea
              id="input-replacement-tags"
              rows={3}
              value={replacements}
              onChange={(e) => setReplacements(e.target.value)}
              className="w-full px-3 py-2 bg-[#2C2C2E] border border-white/5 rounded-xl text-xs sm:text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
              placeholder="例如: clean lineart, crisp lineart, thin lineart, delicate lineart"
            />
            <div className="flex justify-end">
              <button
                id="btn-save-replacement-tags"
                type="button"
                onClick={handleSaveReplacements}
                className="px-4 py-1.5 bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                保存平替词
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
