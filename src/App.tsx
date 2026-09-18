import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArtistSlot, GenerationHistoryItem, GenerationParams, PresetMode } from './types';
import {
  INITIAL_SLOTS,
  DEFAULT_QUALITY_PREFIX,
  DEFAULT_SUBJECT_PROMPT,
  DEFAULT_NEGATIVE_PROMPT,
  DEFAULT_BLACKLIST,
  DEFAULT_REPLACEMENT_TAGS,
  PRESET_MODES,
} from './constants/presets';
import { buildPrompt, ArtistPrefixStyle } from './utils/promptBuilder';
import { executeGeneration } from './utils/generationService';
import { Navbar } from './components/Navbar';
import { ArtistSlotsSection } from './components/ArtistSlotsSection';
import { CharacterReferenceSection, CharacterReferenceData } from './components/CharacterReferenceSection';
import { PromptPreviewSection } from './components/PromptPreviewSection';
import { ApiSettingsSection } from './components/ApiSettingsSection';
import { ImageResultSection } from './components/ImageResultSection';
import { BlacklistModal } from './components/BlacklistModal';
import { PromptParserModal } from './components/PromptParserModal';
import { parseImageFile } from './utils/imageMetadataParser';

const LOCAL_STORAGE_KEY_API = 'novelai_user_apikey';
const LOCAL_STORAGE_KEY_SLOTS = 'novelai_artist_slots_v1';
const LOCAL_STORAGE_KEY_BLACKLIST = 'novelai_artist_blacklist_v1';
const LOCAL_STORAGE_KEY_REPLACEMENTS = 'novelai_replacement_tags_v1';

export default function App() {
  // --- Artist Slots State ---
  const [slots, setSlots] = useState<ArtistSlot[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY_SLOTS);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return INITIAL_SLOTS;
  });

  // --- Modes & Toggles ---
  const [activeMode, setActiveMode] = useState<PresetMode>('clean');
  const [singleTestSlotId, setSingleTestSlotId] = useState<string>('slot-a');
  const [useArtistPrefix, setUseArtistPrefix] = useState<boolean>(true);
  const [prefixStyle, setPrefixStyle] = useState<ArtistPrefixStyle>('space');

  // --- Character Reference (人物图片上传与垫图) ---
  const [characterData, setCharacterData] = useState<CharacterReferenceData | null>(null);

  // --- Prompt Components ---
  const [qualityPrefix, setQualityPrefix] = useState<string>(DEFAULT_QUALITY_PREFIX);
  const [styleTags, setStyleTags] = useState<string>(PRESET_MODES.clean.styleTags);
  const [subjectPrompt, setSubjectPrompt] = useState<string>(DEFAULT_SUBJECT_PROMPT);
  const [negativePrompt, setNegativePrompt] = useState<string>(DEFAULT_NEGATIVE_PROMPT);

  // --- Blacklist & Replacements ---
  const [blacklist, setBlacklist] = useState<string[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY_BLACKLIST);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return DEFAULT_BLACKLIST;
  });

  const [replacementTags, setReplacementTags] = useState<string>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY_REPLACEMENTS);
      if (cached) return cached;
    } catch {
      // ignore
    }
    return DEFAULT_REPLACEMENT_TAGS;
  });

  const [isBlacklistModalOpen, setIsBlacklistModalOpen] = useState<boolean>(false);
  const [isParserModalOpen, setIsParserModalOpen] = useState<boolean>(false);

  // --- Generation API Parameters ---
  const [generationParams, setGenerationParams] = useState<GenerationParams>(() => {
    let savedKey = '';
    try {
      savedKey = localStorage.getItem(LOCAL_STORAGE_KEY_API) || '';
    } catch {
      // ignore
    }
    return {
      apiKey: savedKey,
      model: 'nai-diffusion-5-full',
      width: 1024,
      height: 1024,
      steps: 28,
      scale: 5,
      sampler: 'k_euler',
      seed: null,
    };
  });

  // --- Image Generation Status & History ---
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<GenerationHistoryItem | null>(null);
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);

  const apiSectionRef = useRef<HTMLDivElement>(null);

  // Persist Slots
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_SLOTS, JSON.stringify(slots));
    } catch {
      // ignore
    }
  }, [slots]);

  // Persist Blacklist & Replacements
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_BLACKLIST, JSON.stringify(blacklist));
    } catch {
      // ignore
    }
  }, [blacklist]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_REPLACEMENTS, replacementTags);
    } catch {
      // ignore
    }
  }, [replacementTags]);

  // Persist API Key to localStorage
  useEffect(() => {
    try {
      if (generationParams.apiKey) {
        localStorage.setItem(LOCAL_STORAGE_KEY_API, generationParams.apiKey);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY_API);
      }
    } catch {
      // ignore
    }
  }, [generationParams.apiKey]);

  // Mode Selection Handler
  const handleSelectMode = (mode: PresetMode) => {
    setActiveMode(mode);

    if (mode === 'single') {
      return;
    }

    if (mode in PRESET_MODES) {
      const cfg = PRESET_MODES[mode as 'clean' | 'rich' | 'conservative' | 'sketch'];
      setSlots((prev) =>
        prev.map((slot) => {
          if (slot.role === 'main') return { ...slot, weight: cfg.weights.main };
          if (slot.role === 'coloring') return { ...slot, weight: cfg.weights.coloring };
          if (slot.role === 'lineart') return { ...slot, weight: cfg.weights.lineart };
          if (slot.role === 'lighting') return { ...slot, weight: cfg.weights.lighting };
          return slot;
        })
      );
      setStyleTags(cfg.styleTags);
    }
  };

  // Build the live prompt
  const promptResult = useMemo(() => {
    return buildPrompt({
      slots,
      activeMode,
      singleTestSlotId,
      useArtistPrefix,
      prefixStyle,
      qualityPrefix,
      styleTags,
      subjectPrompt,
      blacklist,
      replacementTags,
    });
  }, [
    slots,
    activeMode,
    singleTestSlotId,
    useArtistPrefix,
    prefixStyle,
    qualityPrefix,
    styleTags,
    subjectPrompt,
    blacklist,
    replacementTags,
  ]);

  // Slot operations
  const handleUpdateSlot = (id: string, updates: Partial<ArtistSlot>) => {
    setSlots((prev) =>
      prev.map((slot) => {
        if (slot.id === id) {
          return { ...slot, ...updates };
        }
        return slot;
      })
    );
  };

  const handleClearSlot = (id: string) => {
    handleUpdateSlot(id, { name: '' });
  };

  const handleAddSlotToBlacklist = (artistName: string) => {
    const trimmed = artistName.trim();
    if (!trimmed) return;
    if (!blacklist.includes(trimmed)) {
      setBlacklist((prev) => [...prev, trimmed]);
    }
  };

  const handleAddCustomSlot = () => {
    const newIndex = slots.length + 1;
    const newSlot: ArtistSlot = {
      id: `custom-slot-${Date.now()}`,
      slotKey: String(newIndex),
      role: 'custom',
      roleLabel: `画师 ${newIndex}`,
      description: '自定义画师槽位',
      name: '',
      weight: 0.8,
      enabled: true,
    };
    setSlots((prev) => [...prev, newSlot]);
  };

  const handleRemoveCustomSlot = (id: string) => {
    if (slots.length <= 1) return;
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const scrollToApi = () => {
    apiSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Append character tag to subject prompt
  const handleAppendSubjectTag = (tag: string) => {
    setSubjectPrompt((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return tag;
      if (trimmed.includes(tag)) return prev;
      return `${trimmed}, ${tag}`;
    });
  };

  // Apply parsed prompt data
  const handleApplyParsedData = (data: {
    slots: ArtistSlot[];
    subjectPrompt?: string;
    stylePrompt?: string;
    qualityPrompt?: string;
    negativePrompt?: string;
    params?: Partial<GenerationParams>;
    referenceImage?: string;
  }) => {
    setSlots(data.slots);
    if (data.subjectPrompt !== undefined) {
      setSubjectPrompt(data.subjectPrompt);
    }
    if (data.stylePrompt !== undefined) {
      setStyleTags(data.stylePrompt);
    }
    if (data.qualityPrompt !== undefined && data.qualityPrompt.trim()) {
      setQualityPrefix(data.qualityPrompt);
    }
    if (data.negativePrompt !== undefined) {
      setNegativePrompt(data.negativePrompt);
    }
    if (data.params) {
      setGenerationParams((prev) => ({ ...prev, ...data.params }));
    }
    if (data.referenceImage) {
      setCharacterData({
        imageUrl: data.referenceImage,
        name: '已解析图片',
        useForI2I: false,
        strength: 0.65,
        noise: 0.0,
      });
    }
  };

  // Reset all to defaults
  const handleResetAll = () => {
    if (window.confirm('确定要恢复全部画师槽位和提示词为默认值吗？')) {
      setSlots(INITIAL_SLOTS);
      setActiveMode('clean');
      setStyleTags(PRESET_MODES.clean.styleTags);
      setQualityPrefix(DEFAULT_QUALITY_PREFIX);
      setSubjectPrompt(DEFAULT_SUBJECT_PROMPT);
      setNegativePrompt(DEFAULT_NEGATIVE_PROMPT);
      setUseArtistPrefix(true);
      setPrefixStyle('colon');
      setCharacterData(null);
      setGenerationError(null);
    }
  };

  const handleClearPrompts = () => {
    setSlots((prev) => prev.map((s) => ({ ...s, name: '' })));
  };

  const handleClearApiKey = () => {
    setGenerationParams((prev) => ({ ...prev, apiKey: '' }));
  };

  // Generation Trigger Handler
  const handleTriggerGenerate = async (simulate: boolean) => {
    setGenerationError(null);

    if (!promptResult.fullPositivePrompt.trim()) {
      setGenerationError('正面 Prompt 不能为空，请至少启用一个有效画师或填写主体/质量词。');
      return;
    }

    if (!simulate && !generationParams.apiKey.trim()) {
      setGenerationError('请先在右侧输入您的 NovelAI API Key，或点击“免点数 · 格式校验与模拟试画”进行免点数测试。');
      scrollToApi();
      return;
    }

    setIsGenerating(true);

    try {
      // If character reference has useForI2I enabled, convert file/blob or URL
      let initImageBase64: string | undefined = undefined;
      if (characterData?.useForI2I && characterData.imageUrl) {
        if (characterData.file) {
          const reader = new FileReader();
          initImageBase64 = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(characterData.file!);
          });
        } else {
          initImageBase64 = characterData.imageUrl;
        }
      }

      const result = await executeGeneration({
        apiKey: generationParams.apiKey.trim(),
        prompt: promptResult.fullPositivePrompt,
        negativePrompt: negativePrompt,
        slots,
        params: generationParams,
        simulate,
        initImage: initImageBase64,
        strength: characterData?.strength ?? 0.65,
        noise: characterData?.noise ?? 0.0,
      });

      if (!result.success || !result.image) {
        setGenerationError(result.error || '生成请求未完成，请检查网络或参数配置。');
        setIsGenerating(false);
        return;
      }

      const newItem: GenerationHistoryItem = {
        id: `gen-${Date.now()}`,
        timestamp: Date.now(),
        imageUrl: result.image,
        prompt: promptResult.fullPositivePrompt,
        negativePrompt: negativePrompt,
        seed: result.seed,
        model: generationParams.model,
        width: generationParams.width,
        height: generationParams.height,
        steps: generationParams.steps,
        scale: generationParams.scale,
        sampler: generationParams.sampler,
      };

      setCurrentResult(newItem);
      setHistory((prev) => [newItem, ...prev.slice(0, 19)]); // keep last 20
    } catch (err: any) {
      setGenerationError(err?.message || '生成过程发生异常，请重试。');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#F2F2F7] flex flex-col font-sans selection:bg-[#007AFF]/30 selection:text-[#0A84FF]">
      {/* Top Navigation */}
      <Navbar
        hasApiKey={Boolean(generationParams.apiKey.trim())}
        onOpenParser={() => setIsParserModalOpen(true)}
        onOpenBlacklist={() => setIsBlacklistModalOpen(true)}
        onResetAll={handleResetAll}
        onScrollToApi={scrollToApi}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3.5 sm:px-6 py-5 space-y-5">
        {/* Top 3-Column Layout: Left (Slots & Reference) | Middle (Prompt Preview) | Right (API Params & Trigger) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: 4 columns - Artist Slots & Character Reference */}
          <div className="lg:col-span-4 space-y-4">
            <ArtistSlotsSection
              slots={slots}
              activeMode={activeMode}
              onSelectMode={handleSelectMode}
              singleTestSlotId={singleTestSlotId}
              onSelectSingleTestSlot={setSingleTestSlotId}
              useArtistPrefix={useArtistPrefix}
              prefixStyle={prefixStyle}
              onToggleArtistPrefix={setUseArtistPrefix}
              onChangePrefixStyle={setPrefixStyle}
              onUpdateSlot={handleUpdateSlot}
              onClearSlot={handleClearSlot}
              onAddSlotToBlacklist={handleAddSlotToBlacklist}
              onAddCustomSlot={handleAddCustomSlot}
              onRemoveCustomSlot={handleRemoveCustomSlot}
              onOpenParser={() => setIsParserModalOpen(true)}
            />

            {/* Character Reference Section (人物图片上传与特征速填) */}
            <CharacterReferenceSection
              characterData={characterData}
              onUpdateCharacterData={setCharacterData}
              onAppendSubjectTag={handleAppendSubjectTag}
              onParseImageMeta={async (file) => {
                try {
                  const meta = await parseImageFile(file);
                  if (meta.hasMetadata && meta.prompt) {
                    setIsParserModalOpen(true);
                  } else {
                    alert('已读取该人物图像，但未检测到内嵌的 AI 提示词元数据。');
                  }
                } catch {
                  alert('读取图片元数据失败');
                }
              }}
            />
          </div>

          {/* Middle: 5 columns - Prompt Preview & Assembly */}
          <div className="lg:col-span-5">
            <PromptPreviewSection
              promptResult={promptResult}
              qualityPrefix={qualityPrefix}
              onChangeQualityPrefix={setQualityPrefix}
              styleTags={styleTags}
              onChangeStyleTags={setStyleTags}
              subjectPrompt={subjectPrompt}
              onChangeSubjectPrompt={setSubjectPrompt}
              negativePrompt={negativePrompt}
              onChangeNegativePrompt={setNegativePrompt}
              onClearAll={handleClearPrompts}
              generationParams={generationParams}
              onOpenBlacklistModal={() => setIsBlacklistModalOpen(true)}
              onOpenParser={() => setIsParserModalOpen(true)}
            />
          </div>

          {/* Right: 3 columns - API Settings & Generator */}
          <div className="lg:col-span-3" ref={apiSectionRef}>
            <ApiSettingsSection
              params={generationParams}
              onChangeParams={(updates) =>
                setGenerationParams((prev) => ({ ...prev, ...updates }))
              }
              onClearApiKey={handleClearApiKey}
              isGenerating={isGenerating}
              onTriggerGenerate={handleTriggerGenerate}
            />
          </div>
        </div>

        {/* Bottom Section: Image Preview & History */}
        <div className="pt-1">
          <ImageResultSection
            currentResult={currentResult}
            history={history}
            error={generationError}
            isGenerating={isGenerating}
            onSelectHistoryItem={setCurrentResult}
            onClearHistory={() => setHistory([])}
          />
        </div>
      </main>

      {/* iOS Footer */}
      <footer className="border-t border-white/10 bg-[#000000] py-4 text-center text-xs text-[#8E8E93]">
        NovelAI V5 画师串生成器 · 本地私密存储 · 兼容 NovelAI V5 / V4 权重语法
      </footer>

      {/* Blacklist Modal */}
      <BlacklistModal
        isOpen={isBlacklistModalOpen}
        onClose={() => setIsBlacklistModalOpen(false)}
        blacklist={blacklist}
        onAddBlacklist={(tag) => {
          if (!blacklist.includes(tag)) setBlacklist((prev) => [...prev, tag]);
        }}
        onRemoveBlacklist={(tag) => {
          setBlacklist((prev) => prev.filter((t) => t !== tag));
        }}
        replacementTags={replacementTags}
        onUpdateReplacementTags={setReplacementTags}
      />

      {/* One-Click Prompt Parser Modal */}
      <PromptParserModal
        isOpen={isParserModalOpen}
        onClose={() => setIsParserModalOpen(false)}
        onApply={handleApplyParsedData}
        currentSlots={slots}
      />
    </div>
  );
}
