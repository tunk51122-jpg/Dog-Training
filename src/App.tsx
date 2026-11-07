import React, { useState, useEffect, useRef, useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Dog,
  Volume2,
  VolumeX,
  Bell,
  Award,
  Clock,
  CheckCircle2,
  Circle,
  Search,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Filter,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Sliders,
  Radio,
  BookOpen,
  Activity,
  HelpCircle,
  Code2,
  Check,
  UserCheck,
  Download,
  Smartphone,
  Share2,
  X,
  Layers,
  Star,
  HeartHandshake
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ============================================================================
// 1. TYPESCRIPT INTERFACES & ZOD-STYLE SCHEMA VALIDATION
// ============================================================================

export type LessonCategory = 'all' | 'basic' | 'intermediate' | 'advanced' | 'behavior';
export type LessonStatus = 'not_started' | 'learning' | 'mastered';
export type ClickToneType = 'classic' | 'soft' | 'bell';
export type ActiveTabType = 'lessons' | 'clicker' | 'tracker' | 'troubleshoot' | 'architecture';
export type TroubleshootCategory = 'all' | 'chewing' | 'jumping' | 'guarding' | 'barking';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt: () => Promise<void>;
}

export interface Lesson {
  id: string;
  title: string;
  enCommand: string;
  mmCommand: string;
  category: Exclude<LessonCategory, 'all'>;
  categoryLabel: string;
  duration: string;
  difficulty: string;
  handSignal: string;
  summary: string;
  steps: string[];
  mistakeTip: string;
}

export interface LessonProgress {
  status: LessonStatus;
  reps: number;
  checkedSteps: number[];
}

export interface DogProfileFormValues {
  name: string;
  breed: string;
  ageGroup: string;
  dailyGoalMinutes: number;
}

function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isDogProfileFormValues(value: unknown): value is DogProfileFormValues {
  if (!value || typeof value !== 'object') return false;
  const profile = value as Record<string, unknown>;
  return (
    typeof profile.name === 'string' && profile.name.trim().length >= 2 && profile.name.trim().length <= 40 &&
    typeof profile.breed === 'string' && profile.breed.trim().length >= 2 && profile.breed.trim().length <= 60 &&
    typeof profile.ageGroup === 'string' &&
    ['၂ လ - ၆ လ (Puppy)', '၆ လ - ၁ နှစ် (Junior)', '၁ နှစ်အထက် (Adult)'].includes(profile.ageGroup) &&
    typeof profile.dailyGoalMinutes === 'number' && Number.isInteger(profile.dailyGoalMinutes) && profile.dailyGoalMinutes >= 3 && profile.dailyGoalMinutes <= 60
  );
}

function isLessonProgress(value: unknown): value is LessonProgress {
  if (!value || typeof value !== 'object') return false;
  const progress = value as Record<string, unknown>;
  return (
    ['not_started', 'learning', 'mastered'].includes(String(progress.status)) &&
    typeof progress.reps === 'number' && Number.isInteger(progress.reps) && progress.reps >= 0 && progress.reps <= 100000 &&
    Array.isArray(progress.checkedSteps) &&
    progress.checkedSteps.every((step) => Number.isInteger(step) && step >= 0 && step <= 100)
  );
}

function sanitizeLessonProgress(
  value: unknown,
  fallback: Record<string, LessonProgress>
): Record<string, LessonProgress> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const result = { ...fallback };
  Object.entries(value as Record<string, unknown>).forEach(([lessonId, progress]) => {
    if (lessonId.length > 80 || !/^[a-z0-9_-]+$/i.test(lessonId) || !isLessonProgress(progress)) return;
    result[lessonId] = {
      status: progress.status,
      reps: progress.reps,
      checkedSteps: [...new Set(progress.checkedSteps)],
    };
  });
  return result;
}

export interface SessionLogFormValues {
  skillId: string;
  repsCompleted: number;
  note: string;
}

export interface SessionLogEntry {
  id: string;
  skillTitle: string;
  repsCompleted: number;
  note: string;
  timestamp: string;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: Partial<Record<keyof T, string>>;
}

export const DogProfileSchema = {
  safeParse(values: DogProfileFormValues): ValidationResult<DogProfileFormValues> {
    const errors: Partial<Record<keyof DogProfileFormValues, string>> = {};
    if (!values.name || values.name.trim().length < 2 || values.name.trim().length > 40) {
      errors.name = 'ခွေးလေးအမည်ကို အနည်းဆုံး ၂ လုံး၊ အများဆုံး ၄၀ လုံး ထည့်သွင်းပေးပါ';
    }
    if (!values.breed || values.breed.trim().length < 2 || values.breed.trim().length > 60) {
      errors.breed = 'မျိုးရိုးအမည်ကို အနည်းဆုံး ၂ လုံး၊ အများဆုံး ၆၀ လုံး ထည့်သွင်းပေးပါ';
    }
    if (!['၂ လ - ၆ လ (Puppy)', '၆ လ - ၁ နှစ် (Junior)', '၁ နှစ်အထက် (Adult)'].includes(values.ageGroup)) {
      errors.ageGroup = 'ခွေးလေး၏ အသက်အပိုင်းအခြားကို ရွေးချယ်ပေးပါ';
    }
    if (
      !Number.isInteger(Number(values.dailyGoalMinutes)) ||
      Number(values.dailyGoalMinutes) < 3 ||
      Number(values.dailyGoalMinutes) > 60
    ) {
      errors.dailyGoalMinutes = 'လေ့ကျင့်ချိန်သည် ၃ မိနစ်မှ ၆၀ မိနစ်အတွင်း ကိန်းပြည့် ဖြစ်ရပါမည်';
    }
    return {
      success: Object.keys(errors).length === 0,
      data: values,
      errors,
    };
  },
};

export const SessionLogSchema = {
  safeParse(values: SessionLogFormValues): ValidationResult<SessionLogFormValues> {
    const errors: Partial<Record<keyof SessionLogFormValues, string>> = {};
    if (!values.skillId) {
      errors.skillId = 'သင်ခန်းစာ တစ်ခု ရွေးချယ်ပေးပါ';
    }
    if (
      !Number.isInteger(Number(values.repsCompleted)) ||
      Number(values.repsCompleted) < 1 ||
      Number(values.repsCompleted) > 100
    ) {
      errors.repsCompleted = 'အကြိမ်ရေ ၁ မှ ၁၀၀ အတွင်း ကိန်းပြည့် ထည့်သွင်းပါ';
    }
    if (!values.note || values.note.trim().length < 4 || values.note.trim().length > 200) {
      errors.note = 'မှတ်ချက်ကို အနည်းဆုံး ၄ လုံး၊ အများဆုံး ၂၀၀ လုံး ရေးပေးပါ';
    }
    return {
      success: Object.keys(errors).length === 0,
      data: values,
      errors,
    };
  },
};

// ============================================================================
// 2. ZUSTAND STORE (Client / UI & PWA State Management)
// ============================================================================

interface TrainingUIStore {
  activeTab: ActiveTabType;
  selectedCategory: LessonCategory;
  troubleshootCategory: TroubleshootCategory;
  searchQuery: string;
  activeLessonId: string;
  mobileLessonView: 'list' | 'detail';
  clickCount: number;
  clickTone: ClickToneType;
  whistleFreq: number;
  muted: boolean;
  timerSeconds: number;
  timerRunning: boolean;
  pwaBannerVisible: boolean;
  pwaInstalled: boolean;
  pwaGuideModalOpen: boolean;
  dogProfile: DogProfileFormValues;
  lessonProgress: Record<string, LessonProgress>;
  completedRoutines: string[];
  routineDate: string;

  // Actions
  setActiveTab: (tab: ActiveTabType) => void;
  setSelectedCategory: (cat: LessonCategory) => void;
  setTroubleshootCategory: (cat: TroubleshootCategory) => void;
  setSearchQuery: (q: string) => void;
  setActiveLessonId: (id: string, openMobileDetail?: boolean) => void;
  setMobileLessonView: (view: 'list' | 'detail') => void;
  incrementClick: () => void;
  resetClickCount: () => void;
  setClickTone: (tone: ClickToneType) => void;
  setWhistleFreq: (freq: number) => void;
  toggleMute: () => void;
  setTimerSeconds: (sec: number) => void;
  tickTimer: () => void;
  setTimerRunning: (running: boolean) => void;
  setPwaBannerVisible: (visible: boolean) => void;
  setPwaInstalled: (installed: boolean) => void;
  setPwaGuideModalOpen: (open: boolean) => void;
  updateDogProfile: (profile: DogProfileFormValues) => void;
  setLessonStatus: (lessonId: string, status: LessonStatus) => void;
  incrementLessonRep: (lessonId: string) => void;
  toggleLessonStep: (lessonId: string, stepIndex: number) => void;
  toggleRoutine: (routineId: string) => void;
}

type PersistedTrainingState = Pick<
  TrainingUIStore,
  'dogProfile' | 'lessonProgress' | 'completedRoutines' | 'routineDate' | 'clickTone' | 'whistleFreq' | 'muted' | 'pwaBannerVisible'
>;

export const useTrainingStore = create<TrainingUIStore>()(persist((set) => ({
  activeTab: 'lessons',
  selectedCategory: 'all',
  troubleshootCategory: 'all',
  searchQuery: '',
  activeLessonId: 'sit',
  mobileLessonView: 'list',
  clickCount: 0,
  clickTone: 'classic',
  whistleFreq: 4500,
  muted: false,
  timerSeconds: 300,
  timerRunning: false,
  pwaBannerVisible: true,
  pwaInstalled: false,
  pwaGuideModalOpen: false,
  dogProfile: {
    name: 'သင့်ခွေးလေး (My Dog)',
    breed: 'Golden Retriever',
    ageGroup: '၆ လ - ၁ နှစ် (Junior)',
    dailyGoalMinutes: 10,
  },
  lessonProgress: {
    sit: { status: 'learning', reps: 4, checkedSteps: [0, 1] },
    stay: { status: 'not_started', reps: 0, checkedSteps: [] },
    come: { status: 'not_started', reps: 0, checkedSteps: [] },
    down: { status: 'not_started', reps: 0, checkedSteps: [] },
    shake: { status: 'not_started', reps: 0, checkedSteps: [] },
    leave_it: { status: 'not_started', reps: 0, checkedSteps: [] },
    roll_over: { status: 'not_started', reps: 0, checkedSteps: [] },
    potty: { status: 'not_started', reps: 0, checkedSteps: [] },
    leash: { status: 'not_started', reps: 0, checkedSteps: [] },
    quiet: { status: 'not_started', reps: 0, checkedSteps: [] },
  },
  completedRoutines: ['r1'],
  routineDate: getLocalDateKey(),

  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory, mobileLessonView: 'list' }),
  setTroubleshootCategory: (troubleshootCategory) => set({ troubleshootCategory }),
  setSearchQuery: (searchQuery) => set({ searchQuery, mobileLessonView: 'list' }),
  setActiveLessonId: (activeLessonId, openMobileDetail = true) =>
    set({
      activeLessonId,
      mobileLessonView: openMobileDetail ? 'detail' : 'list',
    }),
  setMobileLessonView: (mobileLessonView) => set({ mobileLessonView }),
  incrementClick: () => set((state) => ({ clickCount: state.clickCount + 1 })),
  resetClickCount: () => set({ clickCount: 0 }),
  setClickTone: (clickTone) => set({ clickTone }),
  setWhistleFreq: (whistleFreq) => set({ whistleFreq }),
  toggleMute: () => set((state) => ({ muted: !state.muted })),
  setTimerSeconds: (timerSeconds) => set({ timerSeconds, timerRunning: false }),
  tickTimer: () =>
    set((state) => {
      if (state.timerSeconds <= 1) {
        return { timerSeconds: 0, timerRunning: false };
      }
      return { timerSeconds: state.timerSeconds - 1 };
    }),
  setTimerRunning: (timerRunning) => set({ timerRunning }),
  setPwaBannerVisible: (pwaBannerVisible) => set({ pwaBannerVisible }),
  setPwaInstalled: (pwaInstalled) => set({ pwaInstalled, pwaBannerVisible: !pwaInstalled }),
  setPwaGuideModalOpen: (pwaGuideModalOpen) => set({ pwaGuideModalOpen }),
  updateDogProfile: (dogProfile) => set({ dogProfile }),
  setLessonStatus: (lessonId, status) =>
    set((state) => {
      const prev = state.lessonProgress[lessonId] || {
        status: 'not_started',
        reps: 0,
        checkedSteps: [],
      };
      return {
        lessonProgress: {
          ...state.lessonProgress,
          [lessonId]: { ...prev, status },
        },
      };
    }),
  incrementLessonRep: (lessonId) =>
    set((state) => {
      const prev = state.lessonProgress[lessonId] || {
        status: 'learning',
        reps: 0,
        checkedSteps: [],
      };
      const nextStatus: LessonStatus =
        prev.status === 'not_started' ? 'learning' : prev.status;
      return {
        clickCount: state.clickCount + 1,
        lessonProgress: {
          ...state.lessonProgress,
          [lessonId]: { ...prev, reps: prev.reps + 1, status: nextStatus },
        },
      };
    }),
  toggleLessonStep: (lessonId, stepIndex) =>
    set((state) => {
      const prev = state.lessonProgress[lessonId] || {
        status: 'not_started',
        reps: 0,
        checkedSteps: [],
      };
      const exists = prev.checkedSteps.includes(stepIndex);
      const checkedSteps = exists
        ? prev.checkedSteps.filter((i) => i !== stepIndex)
        : [...prev.checkedSteps, stepIndex];
      const nextStatus: LessonStatus =
        prev.status === 'not_started' && checkedSteps.length > 0
          ? 'learning'
          : prev.status;
      return {
        lessonProgress: {
          ...state.lessonProgress,
          [lessonId]: { ...prev, checkedSteps, status: nextStatus },
        },
      };
    }),
  toggleRoutine: (routineId) =>
    set((state) => {
      const today = getLocalDateKey();
      const completedToday = state.routineDate === today ? state.completedRoutines : [];
      const exists = completedToday.includes(routineId);
      return {
        routineDate: today,
        completedRoutines: exists
          ? completedToday.filter((id) => id !== routineId)
          : [...completedToday, routineId],
      };
    }),
}), {
  name: 'pawmaster-pro-training-v1',
  version: 1,
  partialize: (state): PersistedTrainingState => ({
    dogProfile: state.dogProfile,
    lessonProgress: state.lessonProgress,
    completedRoutines: state.completedRoutines,
    routineDate: state.routineDate,
    clickTone: state.clickTone,
    whistleFreq: state.whistleFreq,
    muted: state.muted,
    pwaBannerVisible: state.pwaBannerVisible,
  }),
  merge: (persistedState, currentState) => {
    const persisted = (persistedState || {}) as Partial<PersistedTrainingState>;
    return {
      ...currentState,
      ...persisted,
      dogProfile: isDogProfileFormValues(persisted.dogProfile)
        ? { ...currentState.dogProfile, ...persisted.dogProfile }
        : currentState.dogProfile,
      lessonProgress: sanitizeLessonProgress(persisted.lessonProgress, currentState.lessonProgress),
      clickTone: ['classic', 'soft', 'bell'].includes(String(persisted.clickTone))
        ? persisted.clickTone as ClickToneType
        : currentState.clickTone,
      whistleFreq: typeof persisted.whistleFreq === 'number' && Number.isFinite(persisted.whistleFreq)
        ? Math.min(10000, Math.max(1000, persisted.whistleFreq))
        : currentState.whistleFreq,
      muted: typeof persisted.muted === 'boolean' ? persisted.muted : currentState.muted,
      pwaBannerVisible: typeof persisted.pwaBannerVisible === 'boolean'
        ? persisted.pwaBannerVisible
        : currentState.pwaBannerVisible,
      routineDate: getLocalDateKey(),
      completedRoutines: persisted.routineDate === getLocalDateKey() && Array.isArray(persisted.completedRoutines)
        ? [...new Set(persisted.completedRoutines.filter((id): id is string => typeof id === 'string' && id.length <= 80))]
        : [],
    };
  },
}));


// ============================================================================
// 3. TRAINING CONTENT & LOCAL DATA REPOSITORY
// ============================================================================

export const CATEGORY_META: Record<
  Exclude<LessonCategory, 'all'>,
  { title: string; shortTitle: string; desc: string; badgeClass: string; borderClass: string }
> = {
  basic: {
    title: 'အခြေခံ အမိန့်ပေးသင်ခန်းစာများ (Basic)',
    shortTitle: 'အခြေခံ (Basic)',
    desc: 'နေ့စဉ် မဖြစ်မနေ သုံးရမည့် ထိုင်၊ နေ၊ လာ၊ ဝပ် အခြေခံ ၄ မျိုး',
    badgeClass: 'bg-amber-100 text-amber-800',
    borderClass: 'border-amber-200',
  },
  intermediate: {
    title: 'အလယ်အလတ် သင်ခန်းစာများ (Intermediate)',
    shortTitle: 'အလယ်အလတ်',
    desc: 'လက်ပေးနှုတ်ဆက်ခြင်းနှင့် အန္တရာယ်ရှိသောအရာ မစားစေရန် ထိန်းကျောင်းခြင်း',
    badgeClass: 'bg-sky-100 text-sky-800',
    borderClass: 'border-sky-200',
  },
  advanced: {
    title: 'အဆင့်မြင့် ဉာဏ်ရည်တိုး သင်ခန်းစာများ (Advanced)',
    shortTitle: 'အဆင့်မြင့်',
    desc: 'ခန္ဓာကိုယ် ပျော့ပျောင်းမှုနှင့် အာရုံစူးစိုက်မှု မြှင့်တင်ပေးသော လေ့ကျင့်ခန်း',
    badgeClass: 'bg-purple-100 text-purple-800',
    borderClass: 'border-purple-200',
  },
  behavior: {
    title: 'စည်းကမ်းနှင့် အလေ့အကျင့်ကောင်းများ (Behavior)',
    shortTitle: 'စည်းကမ်း/အကျင့်',
    desc: 'အိမ်သာစည်းကမ်း၊ လမ်းလျှောက်စည်းကမ်းနှင့် အသံ/အကိုက် ထိန်းကျောင်းခြင်း',
    badgeClass: 'bg-emerald-100 text-emerald-800',
    borderClass: 'border-emerald-200',
  },
};

export const LESSONS_DB: Lesson[] = [
  {
    id: 'sit',
    title: 'ထိုင် (Sit)',
    enCommand: 'Sit',
    mmCommand: 'ထိုင်',
    category: 'basic',
    categoryLabel: 'အခြေခံ (Basic)',
    duration: '၅ မိနစ်',
    difficulty: 'လွယ်ကူ ⭐',
    handSignal: 'လက်ဖဝါးကို အပေါ်လှန်၍ ခွေးလေး၏ နှာခေါင်းရှေ့မှ ရင်ဘတ်ပေါ်သို့ အသာအယာ မတင်ပေးပါ။',
    summary: 'ခွေးလေးများအားလုံး ပထမဆုံး သင်ယူသင့်သည့် အခြေခံအကျဆုံးနှင့် စိတ်အေးချမ်းစေသော အမိန့်ဖြစ်သည်။',
    steps: [
      'ခွေးလေး၏ နှာခေါင်းရှေ့တွင် မွှေးကြိုင်သော မုန့် (Treat) တစ်ခုကို လက်ဖြင့် ကိုင်ထားပါ။',
      'မုန့်ကိုင်ထားသော လက်ကို ခွေးလေး၏ ဦးခေါင်းပေါ်သို့ ဖြည်းညှင်းစွာ မတင်လိုက်ပါ (ဦးခေါင်းမော့လာလျှင် တင်ပါး အလိုအလျောက် ထိုင်ချသွားပါမည်)။',
      'တင်ပါး ကြမ်းပြင်နှင့် ထိသွားသည့် အခိုက်အတန့်တွင် "ထိုင် (Sit)" ဟု ပြတ်သားစွာ ပြောပြီး Clicker နှိပ်ကာ မုန့်ကျွေးပါ။',
      'မုန့်မပါဘဲ လက်အချက်ပြမှုတစ်ခုတည်းဖြင့် ၅ ကြိမ်မှ ၁၀ ကြိမ်ခန့် ထပ်ခါတလဲလဲ လေ့ကျင့်ပေးပါ။',
    ],
    mistakeTip: 'ခွေးလေး၏ တင်ပါးကို လက်ဖြင့် အတင်းဖိချခြင်း မပြုလုပ်ပါနှင့်။ မုန့်ဖြင့် ဆွဲဆောင်၍ သူ့သဘောဖြင့် ထိုင်ချလာအောင် လေ့ကျင့်ပေးပါ။',
  },
  {
    id: 'stay',
    title: 'နေ / မလှုပ်နဲ့ (Stay)',
    enCommand: 'Stay',
    mmCommand: 'နေ',
    category: 'basic',
    categoryLabel: 'အခြေခံ (Basic)',
    duration: '၅ မိနစ်',
    difficulty: 'လွယ်ကူ ⭐⭐',
    handSignal: 'လက်ဖဝါးကို ရဲသား အချက်ပြသကဲ့သို့ ခွေးလေး၏ မျက်နှာရှေ့တွင် ထောင်ပြပါ။',
    summary: 'လမ်းမပေါ်ထွက်ချိန် သို့မဟုတ် တံခါးဖွင့်ချိန်တွင် အန္တရာယ်ကင်းစေရန် မဖြစ်မနေ တတ်ထားသင့်သော သင်ခန်းစာဖြစ်သည်။',
    steps: [
      'ပထမဦးစွာ ခွေးလေးကို "ထိုင် (Sit)" အမိန့်ဖြင့် ထိုင်ခိုင်းထားပါ။',
      'လက်ဖဝါးကို ထောင်ပြပြီး "နေ (Stay)" ဟု အေးဆေးတည်ငြိမ်စွာ ပြောပါ။',
      '၃ စက္ကန့်ခန့် စောင့်ပြီး ခွေးလေး မထလာပါက Clicker နှိပ်၍ မုန့်ကျွေးကာ ချီးကျူးပါ။',
      'တဖြည်းဖြည်း နောက်သို့ ခြေတစ်လှမ်း၊ နှစ်လှမ်း ဆုတ်၍ အချိန် ၁၀ စက္ကန့်အထိ တိုးမြှင့်လေ့ကျင့်ပါ။',
    ],
    mistakeTip: 'အစပိုင်းတွင် အဝေးကြီး ချက်ချင်းမသွားပါနှင့်။ ၃ စက္ကန့်မှ စတင်ပြီးမှ အချိန်နှင့် အကွာအဝေးကို တဖြည်းဖြည်း တိုးပါ။',
  },
  {
    id: 'come',
    title: 'လာ (Come / Recall)',
    enCommand: 'Come',
    mmCommand: 'လာခဲ့',
    category: 'basic',
    categoryLabel: 'အခြေခံ (Basic)',
    duration: '၁၀ မိနစ်',
    difficulty: 'အလယ်အလတ် ⭐⭐',
    handSignal: 'လက်နှစ်ဖက်ကို ဘေးသို့ဖွင့်၍ ရင်ဘတ်ဆီသို့ ပိုက်ခေါ်သည့် ပုံစံပြပါ သို့မဟုတ် ပေါင်ကို ပုတ်ပြပါ။',
    summary: 'ကြိုးလွတ်သွားချိန် သို့မဟုတ် ပန်းခြံထဲတွင် ပြန်ခေါ်သည့်အခါ ချက်ချင်းပြေးလာစေရန် အသက်ကယ်သင်ခန်းစာဖြစ်သည်။',
    steps: [
      'အိမ်တွင်း အနှောင့်အယှက်ကင်းသည့် နေရာတွင် ခွေးလေးနှင့် ခြေလှမ်းအနည်းငယ် အကွာ၌ ဒူးထောက်ထိုင်ပါ။',
      'ရွှင်လန်းတက်ကြွသော အသံဖြင့် ခွေးလေးအမည်ကိုခေါ်ပြီး "လာ (Come)!" ဟု တစ်ကြိမ်သာ ခေါ်ပါ။',
      'သင့်ထံသို့ ပြေးလာသည်နှင့် Clicker နှိပ်ပြီး အရသာအရှိဆုံး မုန့်ကျွေးကာ လည်ပင်းကို ပွတ်သပ်ချီးကျူးပါ။',
      'လာသည့်အခါတိုင်း ကောင်းသောအရာသာ ကြုံရကြောင်း သိစေရန် ခေါ်ပြီးဆူပူခြင်း လုံးဝမပြုလုပ်ပါနှင့်။',
    ],
    mistakeTip: '"လာ" ဟု ခေါ်ပြီး ဆေးတိုက်ခြင်း၊ ရိုက်နှက်ဆူပူခြင်း လုပ်မိပါက နောက်တစ်ကြိမ် ခေါ်လျှင် လုံးဝလာတော့မည် မဟုတ်ပါ။',
  },
  {
    id: 'down',
    title: 'ဝပ် (Down / Lie Down)',
    enCommand: 'Down',
    mmCommand: 'ဝပ်',
    category: 'basic',
    categoryLabel: 'အခြေခံ (Basic)',
    duration: '၅ - ၁၀ မိနစ်',
    difficulty: 'အလယ်အလတ် ⭐⭐',
    handSignal: 'လက်ညှိုး သို့မဟုတ် လက်ဖဝါးကို ကြမ်းပြင်သို့ ညွှန်ပြပါ။',
    summary: 'ဧည့်သည်လာချိန် သို့မဟုတ် စားသောက်ဆိုင်ထိုင်ချိန်တွင် ငြိမ်သက်စွာ ဝပ်နေစေရန် သင်ကြားပေးနိုင်သည်။',
    steps: [
      'ခွေးလေးကို အရင်ဆုံး ထိုင်ခိုင်းထားပါ။',
      'မုန့်ကိုင်ထားသောလက်ကို နှာခေါင်းရှေ့မှနေ၍ ကြမ်းပြင်ပေါ်သို့ တည့်တည့် ချပေးပါ။',
      'မုန့်ကို ကြမ်းပြင်တစ်လျှောက် ရှေ့သို့ အနည်းငယ် ဆွဲယူလိုက်ပါက ခွေးလေး၏ ရှေ့ခြေနှစ်ဖက် ဆန့်ပြီး ဝပ်ချသွားပါမည်။',
      'တံတောင်ဆစ်နှင့် ဝမ်းဗိုက် ကြမ်းပြင်ထိသည်နှင့် "ဝပ် (Down)" ဟု ပြောကာ Clicker နှိပ်၍ မုန့်ကျွေးပါ။',
    ],
    mistakeTip: 'ကြမ်းပြင်အေးလွန်းလျှင် ခွေးလေးများ မဝပ်ချင်တတ်သောကြောင့် အခင်း သို့မဟုတ် ကော်ဇောပေါ်တွင် စတင်သင်ကြားပါ။',
  },
  {
    id: 'shake',
    title: 'လက်ပေး / နှုတ်ဆက် (Shake / Paw)',
    enCommand: 'Shake / Paw',
    mmCommand: 'လက်ပေး',
    category: 'intermediate',
    categoryLabel: 'အလယ်အလတ်',
    duration: '၅ မိနစ်',
    difficulty: 'လွယ်ကူ ⭐',
    handSignal: 'လက်ဖဝါးကို ခွေးလေး၏ ရင်ဘတ်အောက်နားတွင် ဖြန့်ခံထားပေးပါ။',
    summary: 'ချစ်စရာကောင်းသည့်အပြင် ခြေသည်းညှပ်ပေးချိန်နှင့် ခြေထောက်သန့်ရှင်းရေး လုပ်ပေးချိန်အတွက် အလွန်အသုံးဝင်သည်။',
    steps: [
      'ခွေးလေးကို ထိုင်ခိုင်းပြီး မုန့်အနည်းငယ်ကို လက်သီးဆုပ်ထဲတွင် ထည့်ထားပါ။',
      'လက်သီးဆုပ်ကို ခွေးလေး၏ ခြေထောက်အနီးတွင် ပြထားပါ။ ခွေးလေးက အနံ့ခံပြီး လက်ဖြင့် ပုတ်ကြည့်လာပါမည်။',
      'သူ၏ ခြေဖဝါးနှင့် သင့်လက် ထိမိသည်နှင့် "လက်ပေး (Paw)" ဟု ပြောပြီး Clicker နှိပ်ကာ မုန့်ကျွေးပါ။',
      'နောက်ပိုင်းတွင် လက်ဖဝါးဖြန့်ခံ၍ နှုတ်ဆက်သည့် ပုံစံအတိုင်း လေ့ကျင့်ပေးပါ။',
    ],
    mistakeTip: 'ခွေးလေး၏ ခြေထောက်ကို အတင်းဆွဲမယူဘဲ သူ့ဘာသာ လက်လှမ်းတင်လာသည့်အချိန်ကို စောင့်ပြီး ဆုချပါ။',
  },
  {
    id: 'leave_it',
    title: 'ထားခဲ့ / မစားနဲ့ (Leave It)',
    enCommand: 'Leave It',
    mmCommand: 'ထားခဲ့ / မထိနဲ့',
    category: 'intermediate',
    categoryLabel: 'အလယ်အလတ်',
    duration: '၁၀ မိနစ်',
    difficulty: 'အလယ်အလတ် ⭐⭐',
    handSignal: 'လက်နှစ်ဖက်ဖြင့် မုန့်တစ်ဖက်စီကိုင်၍ အာရုံလွှဲသည့် အချက်ပြမှု။',
    summary: 'လမ်းပေါ်မှ အမှိုက်၊ အရိုး သို့မဟုတ် အဆိပ်သင့်စေသော အစားအစာများကို ကောက်မစားမိစေရန် ကာကွယ်ပေးသည်။',
    steps: [
      'လက်တစ်ဖက်တွင် သာမန်မုန့်ကို ဆုပ်ထားပြီး ခွေးလေးကို ပြကာ "ထားခဲ့ (Leave it)" ဟု ပြောပါ။',
      'ခွေးလေးက လျှာဖြင့်လျက်ခြင်း၊ နှာခေါင်းဖြင့် တိုးခြင်းလုပ်လျှင် လက်သီးကို မဖွင့်ဘဲ ငြိမ်နေပါ။',
      'ခွေးလေးက လက်လျှော့ပြီး ခေါင်းလှည့်သွားသည့် သို့မဟုတ် သင့်မျက်နှာကို မော့ကြည့်သည့် စက္ကန့်တွင် ချက်ချင်း Clicker နှိပ်ပါ။',
      'ဆုပ်ထားသောလက်မှ မဟုတ်ဘဲ အခြားလက်တစ်ဖက်မှ ပိုကောင်းသော မုန့်ကို ထုတ်ကျွေးပါ။',
    ],
    mistakeTip: '"ထားခဲ့" ဟု ပြောထားသော မုန့်ကို လုံးဝမကျွေးဘဲ၊ အခြားလက်မှ မုန့်ကိုသာ ဆုအဖြစ် ကျွေးရပါမည်။',
  },
  {
    id: 'roll_over',
    title: 'လှိမ့် (Roll Over)',
    enCommand: 'Roll Over',
    mmCommand: 'လှိမ့်',
    category: 'advanced',
    categoryLabel: 'အဆင့်မြင့်',
    duration: '၁၀ မိနစ်',
    difficulty: 'ခက်ခဲ ⭐⭐⭐',
    handSignal: 'လက်ညှိုးဖြင့် ခွေးလေး၏ ပခုံးဘေးမှ ကျောဘက်သို့ စက်ဝိုင်းပုံစံ လှည့်ပြပါ။',
    summary: 'ခွေးလေး၏ ခန္ဓာကိုယ် ပျော့ပျောင်းမှုနှင့် ဉာဏ်ရည်ကို တိုးတက်စေသော ပျော်စရာ အဆင့်မြင့် သင်ခန်းစာဖြစ်သည်။',
    steps: [
      'ခွေးလေးကို ပထမဦးစွာ "ဝပ် (Down)" အနေအထားတွင် ရှိနေပါစေ။',
      'မုန့်ကို ခွေးလေး၏ နှာခေါင်းဘေးမှ ပခုံးဘက်သို့ ကပ်၍ ရွှေ့ပေးပါ (ဘေးတစောင်း လှဲကျသွားပါမည်)။',
      'မုန့်ကို ကျောဘက်သို့ ဆက်ဝှေ့ပေးလိုက်သည့်အခါ မုန့်နောက်လိုက်ရင်း တစ်ပတ်လှိမ့်သွားပါမည်။',
      'တစ်ပတ်ပြည့်သည်နှင့် "လှိမ့် (Roll Over)" ဟု ပြောပြီး Clicker နှိပ်ကာ မုန့်ကျွေးပါ။',
    ],
    mistakeTip: 'တစ်ပတ်လုံး မလှိမ့်နိုင်သေးပါက ဘေးတစောင်း လှဲချသည့်အဆင့်တွင် တစ်ကြိမ် ဆုချပြီး အဆင့်ခွဲ သင်ပေးပါ။',
  },
  {
    id: 'potty',
    title: 'အိမ်သာစည်းကမ်း (Potty Training)',
    enCommand: 'Go Potty',
    mmCommand: 'အပေါ့သွား / သတ်မှတ်နေရာသွား',
    category: 'behavior',
    categoryLabel: 'စည်းကမ်းနှင့် အလေ့အကျင့်',
    duration: 'နေ့စဉ် ပုံမှန်',
    difficulty: 'အရေးကြီး ⭐⭐',
    handSignal: 'သတ်မှတ်ထားသော အိမ်သာနေရာ (Pee Pad သို့မဟုတ် ခြံဝန်း) သို့ ညွှန်ပြပါ။',
    summary: 'အိမ်ထဲတွင် ကြုံရာနေရာ အညစ်အကြေးမစွန့်ဘဲ သတ်မှတ်နေရာတွင်သာ စွန့်တတ်စေရန် လေ့ကျင့်ပေးနည်း။',
    steps: [
      'အိပ်ရာနိုးချိန်၊ အစာစားပြီး ၁၅ မိနစ်အကြာနှင့် ကစားပြီးချိန်တိုင်း သတ်မှတ်ထားသော နေရာသို့ ခေါ်သွားပါ။',
      'အနံ့ခံပြီး အပေါ့/အလေး သွားနေစဉ် "အပေါ့သွား (Go Potty)" ဟု အသံတိုးတိုးဖြင့် ပြောပေးပါ။',
      'သွားပြီးပြီးချင်း ၃ စက္ကန့်အတွင်း Clicker နှိပ်၍ အထူးမုန့်ကျွေးကာ ဝမ်းသာအားရ ချီးကျူးပါ။',
      'အိမ်ထဲ မှားယွင်းသွားမိပါက မဆူဘဲ အနံ့ပျောက်ဆေး (Enzyme Cleaner) ဖြင့် သေချာဆေးကြောပါ။',
    ],
    mistakeTip: 'အညစ်အကြေးစွန့်ပြီးမှ နှာခေါင်းကို ဖိပြ၍ ရိုက်နှက်ခြင်း လုံးဝမလုပ်ပါနှင့်။',
  },
  {
    id: 'leash',
    title: 'ကြိုးဆွဲ လမ်းလျှောက်ခြင်း (Loose Leash Walking)',
    enCommand: "Heel / Let's Go",
    mmCommand: 'ဖြည်းဖြည်းလျှောက် / ဘေးကလိုက်',
    category: 'behavior',
    categoryLabel: 'စည်းကမ်းနှင့် အလေ့အကျင့်',
    duration: '၁၀ - ၁၅ မိနစ်',
    difficulty: 'အလယ်အလတ် ⭐⭐',
    handSignal: 'သင့်ပေါင်ဘေးကို လက်ဖြင့် ပုတ်ပြ၍ ဘေးချင်းယှဉ် လျှောက်စေပါ။',
    summary: 'လမ်းလျှောက်ထွက်ချိန်တွင် ခွေးလေးက အရှေ့မှ အတင်းဆွဲမပြေးဘဲ သခင်နှင့်အတူ အေးဆေးစွာ လျှောက်တတ်စေရန်။',
    steps: [
      'လမ်းစလျှောက်ချိန်တွင် မုန့်အိတ်ကို ခါးတွင်ချိတ်ထားပြီး ခွေးလေး သင့်ဘေး၌ ကြိုးလျော့လျော့ဖြင့် ရှိနေစဉ် Clicker နှိပ်၍ မုန့်ကျွေးပါ။',
      'ခွေးလေးက အရှေ့သို့ အတင်းဆွဲပြေးသည်နှင့် သစ်ပင်တစ်ပင်ကဲ့သို့ ချက်ချင်း ရပ်တန့်လိုက်ပါ။',
      'ကြိုးကို ပြန်မဆောင့်ဘဲ ခွေးလေး သင့်ဘက်ပြန်လှည့်လာ၍ ကြိုးလျော့သွားမှသာ ဆက်လျှောက်ပါ။',
      'ခြေလှမ်း ၅ လှမ်းမှ ၁၀ လှမ်းတိုင်း ဘေးကပ်လျှောက်လျှင် ဆုချပေးပါ။',
    ],
    mistakeTip: 'ကြိုးတင်းနေချိန်တွင် သင်ကပါ လိုက်လျှောက်ပေးပါက "ကြိုးဆွဲလျှင် ရှေ့ရောက်သည်" ဟု ခွေးလေးက အမှားမှတ်သွားတတ်ပါသည်။',
  },
  {
    id: 'quiet',
    title: 'မဟောင်အောင် / မကိုက်အောင် ထိန်းခြင်း (Quiet & No Bite)',
    enCommand: 'Quiet / Gentle',
    mmCommand: 'တိတ်တိတ်နေ / ဖြည်းဖြည်း',
    category: 'behavior',
    categoryLabel: 'စည်းကမ်းနှင့် အလေ့အကျင့်',
    duration: '၅ မိနစ်',
    difficulty: 'အလယ်အလတ် ⭐⭐',
    handSignal: 'နှုတ်ခမ်းရှေ့တွင် လက်ညှိုးတင်ပြခြင်း သို့မဟုတ် ကိုက်စရာ အရုပ် (Chew Toy) လဲလှယ်ပေးခြင်း။',
    summary: 'အကြောင်းမဲ့ အဆက်မပြတ် ဟောင်ခြင်းနှင့် ခွေးပေါက်လေးများ လက်ကိုက်ကစားခြင်းကို ညင်သာစွာ ပြုပြင်နည်း။',
    steps: [
      'ခွေးပေါက်လေးက ကစားရင်း လက်ကို ကိုက်လိုက်ပါက "အား!" ဟု အသံမြင့်ဖြင့် ပြောပြီး ကစားခြင်းကို ၁၀ စက္ကန့် ရပ်လိုက်ပါ။',
      'စိတ်ငြိမ်သွားချိန်တွင် ကိုက်စရာ အရုပ် (Rubber Toy) ကို ပေးပြီး အရုပ်ကို ကိုက်သည့်အခါ Clicker နှိပ်၍ ချီးကျူးပါ။',
      'ဟောင်နေချိန်တွင် လိုက်အော်မဆူဘဲ "တိတ်တိတ်နေ (Quiet)" ဟု တစ်ကြိမ်ပြောကာ ၃ စက္ကန့် အသံတိတ်သွားသည်နှင့် မုန့်ကျွေးပါ။',
      'နေ့စဉ် စွမ်းအင်ကုန်ခမ်းစေရန် လမ်းလျှောက်ပေးခြင်းနှင့် ဉာဏ်စမ်းအရုပ်များ ပေးထားပါ။',
    ],
    mistakeTip: 'ခွေးဟောင်နေချိန် သင်ကပါ အသံကျယ်ကြီးဖြင့် အော်ဟစ်ဆူပူပါက သင်ပါ သူနှင့်အတူ လိုက်ဟောင်နေသည်ဟု ထင်မှတ်တတ်ပါသည်။',
  },
];

const DAILY_ROUTINE_ITEMS = [
  { id: 'r1', title: 'မနက်ခင်း အပေါ့/အလေး သတ်မှတ်နေရာ ပို့ပေးခြင်း', time: '07:00 AM' },
  { id: 'r2', title: 'မနက်စာ မကျွေးမီ "ထိုင် (Sit)" နှင့် "နေ (Stay)" ၂ မိနစ် လေ့ကျင့်ခြင်း', time: '07:30 AM' },
  { id: 'r3', title: 'နေ့လယ်ပိုင်း Clicker သင်ခန်းစာ ၅ မိနစ် လေ့ကျင့်ခြင်း', time: '12:00 PM' },
  { id: 'r4', title: 'ညနေခင်း ကြိုးလျော့လျှောက်နည်းဖြင့် လမ်းလျှောက်ထွက်ခြင်း', time: '05:30 PM' },
  { id: 'r5', title: 'အိပ်ရာမဝင်မီ ချီးကျူးပွတ်သပ်ပေးခြင်းနှင့် အပေါ့သွားစေခြင်း', time: '09:00 PM' },
];

const TROUBLESHOOT_DATA: Array<{
  category: Exclude<TroubleshootCategory, 'all'>;
  categoryBadge: string;
  title: string;
  cause: string;
  solution: string;
}> = [
  {
    category: 'chewing',
    categoryBadge: 'ကိုက်ဖျက်ခြင်း (Chewing)',
    title: 'ဖိနပ်နှင့် ပရိဘောဂများ ကိုက်ဖျက်နေလျှင်',
    cause: 'သွားပေါက်စ ယားယံခြင်း (Teething) သို့မဟုတ် ပျင်းရိနေခြင်းကြောင့် ဖြစ်တတ်သည်။',
    solution: 'ဖိနပ်များကို သိမ်းဆည်းထားပြီး ရေခဲသေတ္တာထဲ အအေးခံထားသော Kong အရုပ် သို့မဟုတ် ဝါးစရာ Chew Stick ပေးထားပါ။ အရုပ်ကို ဝါးတိုင်း Clicker နှိပ်၍ ချီးကျူးပါ။',
  },
  {
    category: 'jumping',
    categoryBadge: 'ခုန်အုပ်ခြင်း (Jumping)',
    title: 'လူမြင်လျှင် ခုန်အုပ်နှုတ်ဆက်တတ်လျှင်',
    cause: 'ခုန်အုပ်သည့်အခါ လူက ပြန်ပွတ်သပ်မိသောကြောင့် အာရုံစိုက်မှုရသည်ဟု မှတ်ယူထားခြင်းဖြစ်သည်။',
    solution: 'ခုန်အုပ်လာပါက ကျောခိုင်းလှည့်လိုက်ပြီး လုံးဝမကြည့်ဘဲ နေပါ။ ခြေလေးချောင်းလုံး ကြမ်းပြင်ပေါ် ပြန်ချပြီး ထိုင်မှသာ ပွတ်သပ်နှုတ်ဆက်၍ မုန့်ကျွေးပါ။',
  },
  {
    category: 'guarding',
    categoryBadge: 'မာန်ဖီခြင်း (Guarding)',
    title: 'အစာစားချိန် မာန်ဖီခြင်း (Resource Guarding)',
    cause: 'သူ၏ အစာခွက်ကို လုယူမည်ဟု စိုးရိမ်ကြောက်လန့်ခြင်းကြောင့် ဖြစ်သည်။',
    solution: 'အစာစားနေစဉ် ခွက်ကို အတင်းဆွဲမယူပါနှင့်။ အစာခွက်အနီး ဖြတ်လျှောက်ရင်း ပိုကောင်းသော အသားဖတ်လေးများ ခွက်ထဲ ပစ်ထည့်ပေးခြင်းဖြင့် လူကပ်လာခြင်းသည် ကောင်းကျိုးဖြစ်ကြောင်း သင်ပေးပါ။',
  },
  {
    category: 'barking',
    categoryBadge: 'ဟောင်ခြင်း (Barking)',
    title: 'တစ်ကောင်တည်း ကျန်ခဲ့ချိန် အဆက်မပြတ် ဟောင်ခြင်း',
    cause: 'သခင်နှင့် ခွဲခွာရမည်ကို စိုးရိမ်သော Separation Anxiety ကြောင့် ဖြစ်သည်။',
    solution: 'အိမ်မှမထွက်မီ ၁၅ မိနစ် လမ်းလျှောက်ပေးပါ။ အပြင်ထွက်ချိန်နှင့် ပြန်ဝင်ချိန်တွင် အလွန်အကျွံ နှုတ်ဆက်ခြင်းမလုပ်ဘဲ ပုံမှန်အတိုင်း ၂ မိနစ်၊ ၅ မိနစ်မှ စတင်၍ တဖြည်းဖြည်း အချိန်တိုး လေ့ကျင့်ပါ။',
  },
];

const SESSION_LOGS_STORAGE_KEY = 'pawmaster-session-logs-v1';

const DEFAULT_SESSION_LOGS: SessionLogEntry[] = [
  {
    id: 'sample-log-1',
    skillTitle: 'ထိုင် (Sit)',
    repsCompleted: 5,
    note: 'နမူနာမှတ်တမ်း — မုန့်ပြပြီး ၅ ကြိမ် လေ့ကျင့်ခဲ့သည်',
    timestamp: 'ယနေ့ 08:30 AM',
  },
];

function isSessionLogEntry(value: unknown): value is SessionLogEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === 'string' && entry.id.length <= 120 &&
    typeof entry.skillTitle === 'string' && entry.skillTitle.length <= 120 &&
    typeof entry.repsCompleted === 'number' && Number.isInteger(entry.repsCompleted) &&
    entry.repsCompleted >= 1 && entry.repsCompleted <= 100 &&
    typeof entry.note === 'string' && entry.note.length <= 200 &&
    typeof entry.timestamp === 'string' && entry.timestamp.length <= 80
  );
}

function readSessionLogs(): SessionLogEntry[] {
  try {
    const raw = window.localStorage.getItem(SESSION_LOGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SESSION_LOGS;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSessionLogEntry);
  } catch {
    return [];
  }
}

function writeSessionLogs(logs: SessionLogEntry[]) {
  try {
    window.localStorage.setItem(SESSION_LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // Storage can be unavailable or full; the current in-memory session still works.
  }
}

function formatSessionTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function useLessonsQuery(category: LessonCategory, search: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<Lesson[]>(LESSONS_DB);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      const q = search.trim().toLowerCase();
      const filtered = LESSONS_DB.filter((lesson) => {
        const catMatch = category === 'all' || lesson.category === category;
        const queryMatch =
          !q ||
          lesson.title.toLowerCase().includes(q) ||
          lesson.enCommand.toLowerCase().includes(q) ||
          lesson.summary.toLowerCase().includes(q);
        return catMatch && queryMatch;
      });
      setData(filtered);
      setIsLoading(false);
    }, 60);
    return () => clearTimeout(timer);
  }, [category, search]);

  return { data, isLoading };
}

function useSessionLogsQuery() {
  const [logs, setLogs] = useState<SessionLogEntry[]>(() => readSessionLogs());
  const [isMutating, setIsMutating] = useState(false);

  const addLogMutation = (payload: SessionLogFormValues) => {
    setIsMutating(true);
    window.setTimeout(() => {
      const lesson = LESSONS_DB.find((l) => l.id === payload.skillId) || LESSONS_DB[0];
      const newEntry: SessionLogEntry = {
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        skillTitle: lesson.title,
        repsCompleted: Number(payload.repsCompleted),
        note: payload.note.trim(),
        timestamp: new Date().toISOString(),
      };
      setLogs((current) => {
        const next = [newEntry, ...current];
        writeSessionLogs(next);
        return next;
      });
      setIsMutating(false);
    }, 100);
  };

  const deleteLogMutation = (id: string) => {
    setLogs((current) => {
      const next = current.filter((item) => item.id !== id);
      writeSessionLogs(next);
      return next;
    });
  };

  return { data: logs, isMutating, addLogMutation, deleteLogMutation };
}

// ============================================================================
// 4. WEB AUDIO SYNTHESIZER (Zero-Latency Clicker & Ultrasonic Whistle)
// ============================================================================

class SoundEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => undefined);
    }
    return this.ctx;
  }

  playClicker(tone: ClickToneType, muted: boolean) {
    if (muted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (tone === 'classic') {
      [0, 0.032].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(idx === 0 ? 2200 : 1650, now + offset);
        osc.frequency.exponentialRampToValueAtTime(380, now + offset + 0.022);
        gain.gain.setValueAtTime(0.8, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.024);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.025);
      });
    } else if (tone === 'soft') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.045);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.055);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1318.5, now);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    }
  }

  playWhistle(freq: number, durationSec: number, muted: boolean) {
    if (muted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.05);
    gain.gain.setValueAtTime(0.35, now + durationSec - 0.08);
    gain.gain.linearRampToValueAtTime(0.001, now + durationSec);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec);
  }

  playPreset(kind: 'recall' | 'attention' | 'praise' | 'calm', muted: boolean) {
    if (muted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (kind === 'recall') {
      [0, 0.22].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(3200, now + offset);
        gain.gain.setValueAtTime(0.35, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.16);
      });
    } else if (kind === 'attention') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(4200, now + 0.35);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (kind === 'praise') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.35, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.24);
      });
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(330, now + 0.5);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.56);
    }
  }
}

const soundEngine = new SoundEngine();

// ============================================================================
// 5. MAIN APPLICATION COMPONENT
// ============================================================================

export default function App() {
  const store = useTrainingStore();
  const { data: filteredLessons, isLoading: lessonsLoading } = useLessonsQuery(
    store.selectedCategory,
    store.searchQuery
  );
  const {
    data: sessionLogs,
    isMutating: logMutating,
    addLogMutation,
    deleteLogMutation,
  } = useSessionLogsQuery();

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<DogProfileFormValues>(store.dogProfile);
  const [profileErrors, setProfileErrors] = useState<
    Partial<Record<keyof DogProfileFormValues, string>>
  >({});

  // Load saved custom dog profile from localStorage on mount
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('pawmaster_custom_dog_profile');
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (isDogProfileFormValues(parsed)) {
          store.updateDogProfile(parsed);
          setProfileForm(parsed);
        }
      }
    } catch {
      // Ignore storage errors in restricted iframes
    }
  }, []);

  const [logForm, setLogForm] = useState<SessionLogFormValues>({
    skillId: 'sit',
    repsCompleted: 5,
    note: '',
  });
  const [logErrors, setLogErrors] = useState<
    Partial<Record<keyof SessionLogFormValues, string>>
  >({});

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2600);
  };

  // Detect an installed PWA and listen for a successful browser installation.
  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) store.setPwaInstalled(true);

    const handleAppInstalled = () => {
      store.setPwaInstalled(true);
      setDeferredPrompt(null);
      triggerToast('✅ PawMaster Pro ကို ဖုန်းထဲသို့ Install လုပ်ပြီးပါပြီ!');
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, []);

  useEffect(() => () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
  }, []);

  // Listen for browser PWA beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      store.setPwaBannerVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Timer interval effect
  useEffect(() => {
    if (!store.timerRunning) return;
    const interval = setInterval(() => {
      store.tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [store.timerRunning]);

  const handleInstallPwaClick = async () => {
    if (!deferredPrompt) {
      store.setPwaGuideModalOpen(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        triggerToast('📲 PawMaster Pro ကို Install လုပ်ရန် လက်ခံပြီးပါပြီ။');
      } else {
        triggerToast('Install ကို မလုပ်သေးပါ။ Browser Menu မှ ပြန်လည်ရွေးချယ်နိုင်ပါသည်။');
      }
    } catch {
      store.setPwaGuideModalOpen(true);
    } finally {
      setDeferredPrompt(null);
    }
  };

  const masteredCount = useMemo(() => {
    return LESSONS_DB.filter((l) => store.lessonProgress[l.id]?.status === 'mastered').length;
  }, [store.lessonProgress]);

  const progressPercentage = Math.round((masteredCount / LESSONS_DB.length) * 100);

  const activeLesson = useMemo(() => {
    return LESSONS_DB.find((l) => l.id === store.activeLessonId) || LESSONS_DB[0];
  }, [store.activeLessonId]);

  const activeLessonProgress = store.lessonProgress[activeLesson.id] || {
    status: 'not_started',
    reps: 0,
    checkedSteps: [],
  };

  // Group filtered lessons by category so mobile view is clean & categorized
  const groupedLessons = useMemo(() => {
    const groups: Record<Exclude<LessonCategory, 'all'>, Lesson[]> = {
      basic: [],
      intermediate: [],
      advanced: [],
      behavior: [],
    };
    filteredLessons.forEach((lesson) => {
      groups[lesson.category].push(lesson);
    });
    return groups;
  }, [filteredLessons]);

  const filteredTroubleshoot = useMemo(() => {
    if (store.troubleshootCategory === 'all') return TROUBLESHOOT_DATA;
    return TROUBLESHOOT_DATA.filter((item) => item.category === store.troubleshootCategory);
  }, [store.troubleshootCategory]);

  const categoryLabels: Record<LessonCategory, string> = {
    all: 'အမျိုးအစား အားလုံး (10)',
    basic: 'အခြေခံ (Basic - 4)',
    intermediate: 'အလယ်အလတ် (Intermediate - 2)',
    advanced: 'အဆင့်မြင့် (Advanced - 1)',
    behavior: 'စည်းကမ်းနှင့် အကျင့် (Behavior - 3)',
  };

  const clickToneLabels: Record<ClickToneType, string> = {
    classic: 'Classic Metallic Click',
    soft: 'Soft Pop Click',
    bell: 'Reward Bell Ding',
  };

  const statusLabels: Record<LessonStatus, string> = {
    not_started: 'မစရသေး (Not Started)',
    learning: 'လေ့ကျင့်ဆဲ (In Progress)',
    mastered: 'တတ်မြောက်ပြီး (Mastered)',
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedProfile = {
      ...profileForm,
      name: profileForm.name.trim(),
      breed: profileForm.breed.trim(),
      ageGroup: profileForm.ageGroup.trim(),
    };
    const validation = DogProfileSchema.safeParse(normalizedProfile);
    if (!validation.success) {
      setProfileErrors(validation.errors);
      return;
    }
    setProfileErrors({});
    setProfileForm(normalizedProfile);
    store.updateDogProfile(normalizedProfile);
    try {
      window.localStorage.setItem('pawmaster_custom_dog_profile', JSON.stringify(normalizedProfile));
    } catch {
      // Ignore storage errors in restricted iframes
    }
    setNameModalOpen(false);
    triggerToast(`🐾 "${profileForm.name}" အမည်ကို သိမ်းဆည်းပြီးပါပြီ!`);
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = SessionLogSchema.safeParse(logForm);
    if (!validation.success) {
      setLogErrors(validation.errors);
      return;
    }
    setLogErrors({});
    addLogMutation(logForm);
    setLogForm({ ...logForm, note: '' });
    triggerToast('လေ့ကျင့်မှုမှတ်တမ်းအသစ်ကို ဤစက်ထဲတွင် သိမ်းဆည်းပြီးပါပြီ!');
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF5] text-slate-800 font-sans pb-28">
      {/* Custom PWA Install Top Banner */}
      {store.pwaBannerVisible && !store.pwaInstalled && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-3.5 py-2.5 border-b border-amber-500/30 shadow-md">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-white">
                    PawMaster Pro App ကို ဖုန်းထဲသွင်းမည်
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    PWA Ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  အင်တာနက်မရှိချိန် (Offline) ပန်းခြံထဲတွင် Clicker နှင့် သင်ခန်းစာများ တိုက်ရိုက်သုံးနိုင်သည်
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={handleInstallPwaClick}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install App</span>
              </button>
              <button
                type="button"
                onClick={() => store.setPwaBannerVisible(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
                aria-label="Close install banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-amber-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <img
              src={`${import.meta.env.BASE_URL}pawmaster-puppy.jpg`}
              alt="PawMaster Mascot"
              className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shadow-sm max-w-full h-auto"
            />
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1">
                  <Dog className="w-4 h-4 text-amber-600" />
                  <span>PawMaster Pro</span>
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    setProfileForm(store.dogProfile);
                    setProfileErrors({});
                    setNameModalOpen(true);
                  }}
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition flex items-center gap-1"
                  title="ကိုယ်ပိုင်နာမည် ပြောင်းရန် နှိပ်ပါ"
                >
                  <span>{store.dogProfile.name}</span>
                  <span className="text-[10px] text-amber-700 underline">နာမည်ပြင်ရန်</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Mobile-First Dog Training PWA • TypeScript + Zustand + Shadcn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!store.pwaBannerVisible && !store.pwaInstalled && (
              <button
                type="button"
                onClick={() => store.setPwaGuideModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">App သွင်းရန်</span>
              </button>
            )}

            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-semibold text-emerald-800">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {masteredCount}/{LESSONS_DB.length}
              </span>
            </div>

            <button
              type="button"
              onClick={store.toggleMute}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
              aria-label="Toggle sound"
            >
              {store.muted ? (
                <VolumeX className="w-4 h-4 text-rose-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-600" />
              )}
              <span className="hidden md:inline">
                {store.muted ? 'အသံပိတ်' : 'အသံဖွင့်'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3.5 sm:px-4 py-4 sm:py-6 space-y-5">
        {/* Compact Hero Card */}
        <section className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-4 sm:p-5 text-white shadow-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}pawmaster-puppy.jpg`}
              alt="Golden Retriever Puppy"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-white/80 shadow-md max-w-full h-auto shrink-0"
            />
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full font-semibold mb-0.5">
                <Sparkles className="w-3 h-3" /> Positive Training
              </span>
              <h2 className="text-base sm:text-xl font-bold leading-snug">
                {store.dogProfile.name} ({store.dogProfile.breed})
              </h2>
              <p className="text-xs text-amber-50">
                နေ့စဉ် {store.dogProfile.dailyGoalMinutes} မိနစ် • တတ်မြောက်မှု {progressPercentage}%
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setProfileForm(store.dogProfile);
                setProfileErrors({});
                setNameModalOpen(true);
              }}
              className="px-3 py-2 rounded-xl bg-amber-950/30 hover:bg-amber-950/40 text-white border border-white/30 font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>ကိုယ်ပိုင်နာမည်ပေးရန်</span>
            </button>
            <button
              type="button"
              onClick={() => store.setActiveTab('clicker')}
              className="px-3 py-2 rounded-xl bg-white text-amber-700 font-bold text-xs shadow hover:bg-amber-50 transition flex items-center justify-center gap-1.5"
            >
              <Bell className="w-4 h-4" />
              <span>Clicker</span>
            </button>
          </div>
        </section>

        {/* ================================================================
            TAB 1: CATEGORIZED LESSONS (အမျိုးအစားအလိုက် သင်ခန်းစာများ)
           ================================================================ */}
        {store.activeTab === 'lessons' && (
          <section className="space-y-4">
            {/* Category Quick Cards (Clean Mobile-First Category Grid) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => store.setSelectedCategory('all')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  store.selectedCategory === 'all'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-extrabold">10 ခု</span>
                </div>
                <div className="mt-2">
                  <div className="text-xs font-bold">အားလုံးကြည့်ရန်</div>
                  <div className="text-[10px] opacity-80">All Categories</div>
                </div>
              </button>

              {(['basic', 'intermediate', 'advanced', 'behavior'] as Array<
                Exclude<LessonCategory, 'all'>
              >).map((cat) => {
                const meta = CATEGORY_META[cat];
                const catLessons = LESSONS_DB.filter((l) => l.category === cat);
                const catMastered = catLessons.filter(
                  (l) => store.lessonProgress[l.id]?.status === 'mastered'
                ).length;
                const isSelected = store.selectedCategory === cat;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => store.setSelectedCategory(cat)}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-amber-400 text-slate-950' : meta.badgeClass
                        }`}
                      >
                        {catMastered}/{catLessons.length} တတ်ပြီး
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-bold truncate">{meta.shortTitle}</div>
                      <div className="text-[10px] opacity-75 truncate">
                        သင်ခန်းစာ {catLessons.length} ခု
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Filter Dropdown + Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-2">
                {/* Shadcn DropdownMenu for Category */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition"
                    >
                      <Filter className="w-3.5 h-3.5 text-amber-600" />
                      <span>{categoryLabels[store.selectedCategory]}</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-60 bg-white">
                    <DropdownMenuLabel className="text-xs text-slate-500">
                      အမျိုးအစား ရွေးချယ်ရန် (Shadcn Dropdown)
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(Object.keys(categoryLabels) as LessonCategory[]).map((cat) => (
                      <DropdownMenuItem
                        key={cat}
                        onClick={() => store.setSelectedCategory(cat)}
                        className="flex items-center justify-between text-xs cursor-pointer"
                      >
                        <span>{categoryLabels[cat]}</span>
                        {store.selectedCategory === cat && (
                          <Check className="w-4 h-4 text-amber-600" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                      <span>လက်ရှိ: {activeLesson.title}</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 bg-white max-h-72 overflow-y-auto">
                    <DropdownMenuLabel className="text-xs text-slate-500">
                      သင်ခန်းစာ တိုက်ရိုက်ရွေးရန်
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {LESSONS_DB.map((item) => (
                      <DropdownMenuItem
                        key={item.id}
                        onClick={() => store.setActiveLessonId(item.id, true)}
                        className="flex items-center justify-between text-xs cursor-pointer"
                      >
                        <span>{item.title}</span>
                        {store.activeLessonId === item.id && <Check className="w-4 h-4 text-amber-600" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {store.mobileLessonView === 'detail' && (
                  <button
                    type="button"
                    onClick={() => store.setMobileLessonView('list')}
                    className="lg:hidden inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>စာရင်းသို့ပြန်သွားရန်</span>
                  </button>
                )}
              </div>

              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={store.searchQuery}
                  onChange={(e) => store.setSearchQuery(e.target.value)}
                  placeholder="သင်ခန်းစာ ရှာရန် (ထိုင်, Sit, လက်ပေး)..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Responsive Master-Detail: On Mobile, switches cleanly between Categorized List and Active Detail */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Categorized Lesson Groups */}
              <div
                className={`lg:col-span-5 space-y-4 ${
                  store.mobileLessonView === 'detail' ? 'hidden lg:block' : 'block'
                }`}
              >
                {lessonsLoading ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-500">
                    သင်ခန်းစာများ ရယူနေပါသည်...
                  </div>
                ) : filteredLessons.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-sm text-slate-500">
                    ရှာဖွေထားသော သင်ခန်းစာ မတွေ့ပါ။
                  </div>
                ) : (
                  (['basic', 'intermediate', 'advanced', 'behavior'] as Array<
                    Exclude<LessonCategory, 'all'>
                  >).map((catKey) => {
                    const groupItems = groupedLessons[catKey];
                    if (!groupItems || groupItems.length === 0) return null;
                    const meta = CATEGORY_META[catKey];

                    return (
                      <div
                        key={catKey}
                        className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden"
                      >
                        {/* Category Group Header */}
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                          <div>
                            <span
                              className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${meta.badgeClass}`}
                            >
                              {meta.title}
                            </span>
                            <p className="text-[11px] text-slate-500 mt-0.5">{meta.desc}</p>
                          </div>
                          <span className="text-xs font-bold text-slate-500 shrink-0">
                            {groupItems.length} ခု
                          </span>
                        </div>

                        {/* Lessons inside this Category */}
                        <div className="divide-y divide-slate-100">
                          {groupItems.map((lesson) => {
                            const prog = store.lessonProgress[lesson.id] || {
                              status: 'not_started',
                              reps: 0,
                              checkedSteps: [],
                            };
                            const isSelected = store.activeLessonId === lesson.id;

                            return (
                              <button
                                key={lesson.id}
                                type="button"
                                onClick={() => store.setActiveLessonId(lesson.id, true)}
                                className={`w-full text-left p-3.5 transition flex items-center justify-between gap-3 ${
                                  isSelected ? 'bg-amber-50/90' : 'hover:bg-slate-50'
                                }`}
                              >
                                <div className="space-y-0.5 min-w-0">
                                  <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                    <span>{lesson.title}</span>
                                    <span className="text-[11px] font-normal text-slate-400">
                                      ({lesson.duration})
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 truncate">
                                    {lesson.summary}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {prog.status === 'mastered' ? (
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" /> တတ်ပြီး
                                    </span>
                                  ) : prog.status === 'learning' ? (
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                      {prog.reps} ကြိမ်
                                    </span>
                                  ) : (
                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                      စတင်ရန်
                                    </span>
                                  )}
                                  <ChevronRight className="w-4 h-4 text-slate-400" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Column: Active Lesson Detail */}
              <div
                className={`lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-5 ${
                  store.mobileLessonView === 'list' ? 'hidden lg:block' : 'block'
                }`}
              >
                {/* Mobile Back Bar */}
                <div className="lg:hidden flex items-center justify-between border-b border-slate-100 pb-3">
                  <button
                    type="button"
                    onClick={() => store.setMobileLessonView('list')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>အမျိုးအစားနှင့် သင်ခန်းစာစာရင်းသို့</span>
                  </button>
                  <span className="text-xs text-slate-400">{activeLesson.categoryLabel}</span>
                </div>

                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {activeLesson.categoryLabel}
                      </span>
                      <span className="text-xs text-slate-500">{activeLesson.difficulty}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                      {activeLesson.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">{activeLesson.summary}</p>
                  </div>

                  {/* Shadcn DropdownMenu for Lesson Status */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 transition"
                      >
                        <span>အခြေအနေ: {statusLabels[activeLessonProgress.status]}</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 bg-white">
                      <DropdownMenuLabel className="text-xs text-slate-500">
                        သင်ယူမှု အခြေအနေ ပြောင်းရန်
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {(['not_started', 'learning', 'mastered'] as LessonStatus[]).map((st) => (
                        <DropdownMenuItem
                          key={st}
                          onClick={() => {
                            store.setLessonStatus(activeLesson.id, st);
                            if (st === 'mastered') {
                              soundEngine.playPreset('praise', store.muted);
                              triggerToast(
                                `🎉 "${activeLesson.title}" ကို တတ်မြောက်ပြီးအဖြစ် သတ်မှတ်လိုက်ပါပြီ!`
                              );
                            }
                          }}
                          className="flex items-center justify-between text-xs cursor-pointer"
                        >
                          <span>{statusLabels[st]}</span>
                          {activeLessonProgress.status === st && (
                            <Check className="w-4 h-4 text-emerald-600" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Voice Command & Hand Signal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5">
                    <div className="text-xs font-bold text-amber-900">ပေးရမည့် အမိန့်သံ (Voice Cue)</div>
                    <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
                      "{activeLesson.mmCommand}" / "{activeLesson.enCommand}"
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      အသံနေအသံထား တည်ငြိမ်ပြတ်သားစွာ တစ်ကြိမ်သာ ပြောပါ။
                    </div>
                  </div>
                  <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-3.5">
                    <div className="text-xs font-bold text-sky-900">လက်အချက်ပြပုံ (Hand Signal)</div>
                    <div className="text-xs sm:text-sm font-medium text-slate-800 mt-1">
                      {activeLesson.handSignal}
                    </div>
                  </div>
                </div>

                {/* Interactive Checklist */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900">
                      အဆင့်ဆင့် လေ့ကျင့်နည်း (ပြီးစီးသောအဆင့်ကို နှိပ်ပါ)
                    </h4>
                    <span className="text-xs text-slate-500">
                      {activeLessonProgress.checkedSteps.length}/{activeLesson.steps.length} အဆင့်
                    </span>
                  </div>
                  <div className="space-y-2">
                    {activeLesson.steps.map((stepText, idx) => {
                      const checked = activeLessonProgress.checkedSteps.includes(idx);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => store.toggleLessonStep(activeLesson.id, idx)}
                          className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition ${
                            checked
                              ? 'bg-emerald-50/60 border-emerald-300 text-slate-700'
                              : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                          }`}
                        >
                          {checked ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <span className="text-xs sm:text-sm leading-relaxed">
                            <strong className="text-slate-900">အဆင့် {idx + 1}:</strong> {stepText}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mistake Warning */}
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs sm:text-sm text-rose-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>ရှောင်ကြဉ်သင့်သည့် အမှား:</strong> {activeLesson.mistakeTip}
                  </div>
                </div>

                {/* Practice Action Bar */}
                <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-300">ဤသင်ခန်းစာ အောင်မြင်သည့် အကြိမ်ရေ</div>
                    <div className="text-lg font-extrabold text-amber-400">
                      {activeLessonProgress.reps} ကြိမ် လေ့ကျင့်ပြီး
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClicker(store.clickTone, store.muted);
                        store.incrementLessonRep(activeLesson.id);
                        triggerToast(`🐾 Click! "${activeLesson.title}" (+1 ကြိမ်)`);
                      }}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm transition flex items-center justify-center gap-1.5"
                    >
                      <Bell className="w-4 h-4" />
                      <span>Click & +1 ကြိမ်မှတ်မည်</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playPreset('praise', store.muted);
                        triggerToast('🌟 တော်လိုက်တာ! မုန့်ကျွေးပြီး ချီးကျူးပေးပါ။');
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>ချီးကျူးသံ</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================
            TAB 2: CLICKER & WHISTLE
           ================================================================ */}
        {store.activeTab === 'clicker' && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col items-center text-center space-y-5">
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  Zero-Latency Web Audio Clicker
                </span>
                <h3 className="text-xl font-bold text-slate-900">လေ့ကျင့်ရေး Clicker ခလုတ်</h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  ခွေးလေး အမိန့်အတိုင်း ပြုလုပ်သည့် အခိုက်အတန့်တွင် ချက်ချင်းနှိပ်ပြီး မုန့် (Treat) ကျွေးပါ။
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClicker(store.clickTone, store.muted);
                  store.incrementClick();
                }}
                className="w-44 h-44 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 active:scale-95 text-white font-extrabold text-xl border-4 border-amber-200 flex flex-col items-center justify-center gap-1 shadow-xl transition"
              >
                <Dog className="w-10 h-10" />
                <span>CLICK!</span>
                <span className="text-xs font-normal text-amber-100">နှိပ်ပါ</span>
              </button>

              <div className="w-full space-y-2 text-left">
                <label className="text-xs font-bold text-slate-600 block">
                  Clicker အသံအမျိုးအစား ရွေးရန် (Shadcn Dropdown)
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs sm:text-sm font-bold text-slate-800"
                    >
                      <span>{clickToneLabels[store.clickTone]}</span>
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 bg-white">
                    <DropdownMenuLabel className="text-xs text-slate-500">
                      အသံအမျိုးအစား ရွေးချယ်ပါ
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(['classic', 'soft', 'bell'] as ClickToneType[]).map((tone) => (
                      <DropdownMenuItem
                        key={tone}
                        onClick={() => {
                          store.setClickTone(tone);
                          soundEngine.playClicker(tone, store.muted);
                        }}
                        className="flex items-center justify-between text-xs sm:text-sm cursor-pointer"
                      >
                        <span>{clickToneLabels[tone]}</span>
                        {store.clickTone === tone && <Check className="w-4 h-4 text-amber-600" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex items-center justify-between">
                <div className="text-left">
                  <div className="text-xs text-slate-500">ယနေ့ Click နှိပ်ထားသည့် အကြိမ်ရေ</div>
                  <div className="text-2xl font-extrabold text-slate-900">{store.clickCount}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playPreset('praise', store.muted);
                      store.incrementClick();
                      triggerToast('🦴 မုန့်ကျွေးပြီး ဆုချမှတ်တမ်း တိုးလိုက်ပါပြီ!');
                    }}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                  >
                    +1 မုန့်ကျွေးပြီး
                  </button>
                  <button
                    type="button"
                    onClick={store.resetClickCount}
                    className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                    Frequency Tone Generator
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">ခွေးခေါ်ဝီစီနှင့် အသံလှိုင်းစနစ်</h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    အဝေးမှ ပြန်ခေါ်ရန် (Recall) သို့မဟုတ် အာရုံစိုက်စေရန် အသံကြိမ်နှုန်း (Frequency) ညှိ၍ အသုံးပြုနိုင်ပါသည်။
                  </p>
                </div>

                <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-sky-600" /> ဝီစီ အသံကြိမ်နှုန်း
                    </span>
                    <span className="text-sm font-extrabold text-sky-700">
                      {store.whistleFreq.toLocaleString()} Hz
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1500}
                    max={14000}
                    step={100}
                    value={store.whistleFreq}
                    onChange={(e) => store.setWhistleFreq(Number(e.target.value))}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>1,500 Hz</span>
                    <span>6,000 Hz</span>
                    <span>14,000 Hz</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playWhistle(store.whistleFreq, 1.8, store.muted);
                    triggerToast(
                      `📣 ${store.whistleFreq.toLocaleString()} Hz ဝီစီသံ ထုတ်လွှင့်နေပါသည်...`
                    );
                  }}
                  className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow transition flex items-center justify-center gap-2"
                >
                  <Radio className="w-4 h-4" />
                  <span>ဝီစီမှုတ်ရန် နှိပ်ပါ (၁.၈ စက္ကန့်)</span>
                </button>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {[
                    { id: 'recall', title: 'လာခဲ့ (Recall Beep)', desc: 'ဝီစီ ၂ ချက်သံ' },
                    { id: 'attention', title: 'အာရုံစိုက် (Attention)', desc: 'အသံမြင့်တက်သွားသော ဝီစီသံ' },
                    { id: 'praise', title: 'တော်တယ် (Good Boy)', desc: 'ချီးကျူးသည့် အောင်မြင်မှုအသံ' },
                    { id: 'calm', title: 'ငြိမ်ငြိမ်နေ (Calm Tone)', desc: 'တည်ငြိမ်စေသည့် အသံနိမ့်' },
                  ].map((sig) => (
                    <button
                      key={sig.id}
                      type="button"
                      onClick={() =>
                        soundEngine.playPreset(
                          sig.id as 'recall' | 'attention' | 'praise' | 'calm',
                          store.muted
                        )
                      }
                      className="p-3 rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 text-left transition"
                    >
                      <div className="font-bold text-xs text-slate-800">{sig.title}</div>
                      <div className="text-[11px] text-slate-500">{sig.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================
            TAB 3: TRACKER & FORMS (မှတ်တမ်း & အချိန်မှတ်)
           ================================================================ */}
        {store.activeTab === 'tracker' && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-amber-600" />
                  <span>ခွေးလေး၏ အချက်အလက် (အချက်အလက်စစ်ဆေးမှုပါဝင်သည်)</span>
                </h3>

                <form onSubmit={handleProfileSubmit} className="space-y-3" noValidate>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      ခွေးလေးအမည် (Name)
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                    />
                    {profileErrors.name && (
                      <p className="text-xs text-rose-600 mt-1">{profileErrors.name}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        မျိုးရိုး (Breed)
                      </label>
                      <input
                        type="text"
                        value={profileForm.breed}
                        onChange={(e) => setProfileForm({ ...profileForm, breed: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                      />
                      {profileErrors.breed && (
                        <p className="text-xs text-rose-600 mt-1">{profileErrors.breed}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        နေ့စဉ် လေ့ကျင့်ချိန် (မိနစ်)
                      </label>
                      <input
                        type="number"
                        value={profileForm.dailyGoalMinutes}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            dailyGoalMinutes: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                      />
                      {profileErrors.dailyGoalMinutes && (
                        <p className="text-xs text-rose-600 mt-1">
                          {profileErrors.dailyGoalMinutes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      အသက်အပိုင်းအခြား (Shadcn Dropdown)
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-800"
                        >
                          <span>{profileForm.ageGroup}</span>
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-64 bg-white">
                        {[
                          '၂ လ - ၆ လ (Puppy)',
                          '၆ လ - ၁ နှစ် (Junior)',
                          '၁ နှစ်အထက် (Adult)',
                        ].map((age) => (
                          <DropdownMenuItem
                            key={age}
                            onClick={() => setProfileForm({ ...profileForm, ageGroup: age })}
                            className="text-xs sm:text-sm cursor-pointer"
                          >
                            {age}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {profileErrors.ageGroup && (
                      <p className="text-xs text-rose-600 mt-1">{profileErrors.ageGroup}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm transition"
                  >
                    အချက်အလက် စစ်ဆေး၍ သိမ်းဆည်းမည်
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 text-center">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>လေ့ကျင့်ချိန် Timer</span>
                  </h3>
                  <div className="flex gap-1">
                    {[5, 10, 15].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => store.setTimerSeconds(mins * 60)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          store.timerSeconds === mins * 60
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {mins} မိနစ်
                      </button>
                    ))}
                  </div>
                </div>
                <div className="py-4 bg-slate-900 text-white rounded-2xl font-mono text-4xl font-extrabold tracking-wider">
                  {formatTimer(store.timerSeconds)}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!store.timerRunning && store.timerSeconds === 0) store.setTimerSeconds(300);
                      store.setTimerRunning(!store.timerRunning);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5"
                  >
                    {store.timerRunning ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>{store.timerRunning ? 'ခေတ္တရပ်မည်' : 'စတင်မည်'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => store.setTimerSeconds(300)}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs sm:text-sm transition flex items-center gap-1"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>ပြန်စမည်</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      နေ့စဉ် လေ့ကျင့်ရေး အချိန်ဇယား
                    </h3>
                    <p className="text-xs text-slate-500">
                      နေ့စဉ် ပုံမှန်လုပ်ဆောင်ပေးရမည့် အချက်များ
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                    {store.completedRoutines.length}/{DAILY_ROUTINE_ITEMS.length} ပြီးစီး
                  </span>
                </div>
                <div className="space-y-2">
                  {DAILY_ROUTINE_ITEMS.map((item) => {
                    const done = store.completedRoutines.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => store.toggleRoutine(item.id)}
                        className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition ${
                          done
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {done ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span
                            className={`text-xs sm:text-sm font-medium ${
                              done ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {item.title}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                          {item.time}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-base text-slate-900">
                  လေ့ကျင့်မှု မှတ်တမ်းသစ် ထည့်ရန်
                </h3>

                <form onSubmit={handleLogSubmit} className="space-y-3" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800"
                          >
                            <span className="truncate">
                              {LESSONS_DB.find((l) => l.id === logForm.skillId)?.title || 'ရွေးရန်'}
                            </span>
                            <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-60 bg-white">
                          {LESSONS_DB.map((l) => (
                            <DropdownMenuItem
                              key={l.id}
                              onClick={() => setLogForm({ ...logForm, skillId: l.id })}
                              className="text-xs sm:text-sm cursor-pointer"
                            >
                              {l.title}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        placeholder="အကြိမ်ရေ"
                        value={logForm.repsCompleted}
                        onChange={(e) =>
                          setLogForm({ ...logForm, repsCompleted: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <button
                        type="submit"
                        disabled={logMutating}
                        className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{logMutating ? 'သိမ်းနေသည်...' : 'မှတ်တမ်းတင်မည်'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="မှတ်ချက် (ဥပမာ - မုန့်ပြပြီး ၅ ကြိမ်ဆက်တိုက် ထိုင်နိုင်သည်)..."
                      value={logForm.note}
                      onChange={(e) => setLogForm({ ...logForm, note: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
                    />
                    {(logErrors.note || logErrors.repsCompleted) && (
                      <p className="text-xs text-rose-600 mt-1">
                        {logErrors.note || logErrors.repsCompleted}
                      </p>
                    )}
                  </div>
                </form>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {sessionLogs.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm"
                    >
                      <div>
                        <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md mr-1.5">
                          {entry.skillTitle} ({entry.repsCompleted} ကြိမ်)
                        </span>
                        <span className="text-slate-700">{entry.note}</span>
                        <div className="text-[11px] text-slate-400 mt-0.5">{formatSessionTimestamp(entry.timestamp)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteLogMutation(entry.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        aria-label="Delete log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================
            TAB 4: CATEGORIZED TROUBLESHOOTING (အပြုအမူ အဖြေရှာနည်း)
           ================================================================ */}
        {store.activeTab === 'troubleshoot' && (
          <section className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  အပြုအမူပြဿနာများနှင့် အမျိုးအစားအလိုက် ဖြေရှင်းနည်းများ
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ဖုန်းပေါ်တွင် အလွယ်တကူ ရှာဖွေနိုင်ရန် ပြဿနာ အမျိုးအစားအလိုက် ခွဲခြားပေးထားပါသည်။
                </p>
              </div>

              {/* Category Filter Chips for Troubleshooting */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'အားလုံး (4)' },
                  { id: 'chewing', label: 'ကိုက်ဖျက်ခြင်း' },
                  { id: 'jumping', label: 'ခုန်အုပ်ခြင်း' },
                  { id: 'guarding', label: 'မာန်ဖီခြင်း' },
                  { id: 'barking', label: 'ဟောင်ခြင်း' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => store.setTroubleshootCategory(cat.id as TroubleshootCategory)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      store.troubleshootCategory === cat.id
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTroubleshoot.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3"
                >
                  <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {item.categoryBadge}
                  </span>
                  <h4 className="font-bold text-base text-slate-900">{item.title}</h4>
                  <div className="bg-amber-50/80 border border-amber-200/70 rounded-xl p-3 text-xs text-amber-900">
                    <strong>ဖြစ်ပွားရသည့် အကြောင်းရင်း:</strong> {item.cause}
                  </div>
                  <div className="bg-emerald-50/80 border border-emerald-200/70 rounded-xl p-3 text-xs sm:text-sm text-emerald-950 leading-relaxed">
                    <strong>ဖြေရှင်းနည်း:</strong> {item.solution}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ================================================================
            TAB 5: DEV ARCHITECTURE & PWA VS CODE GUIDE
           ================================================================ */}
        {store.activeTab === 'architecture' && (
          <section className="space-y-4">
            <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Code2 className="w-4 h-4" />
                  <span>VS Code + Mobile PWA Architecture Guide</span>
                </div>
                <button
                  type="button"
                  onClick={() => store.setPwaGuideModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>ဖုန်းတွင် PWA သွင်းနည်း ကြည့်ရန်</span>
                </button>
              </div>

              <h3 className="text-lg sm:text-xl font-bold">
                VS Code တွင် စမ်းသပ်နည်းနှင့် ဖုန်းထဲသို့ PWA Install လုပ်နည်း
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 space-y-2">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>1. VS Code တွင် Run ရန် Command များ</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    ပေးထားသော <code>pawmaster_vite_project.zip</code> ကို ဖြည်ပြီး VS Code Terminal တွင် အောက်ပါအတိုင်း Run ပါ -
                  </p>
                  <pre className="bg-slate-950 text-amber-300 p-2.5 rounded-lg text-xs overflow-x-auto">
                    npm install{'\n'}npm run dev -- --host
                  </pre>
                  <p className="text-slate-400 text-[11px]">
                    <code>--host</code> ထည့် Run ခြင်းဖြင့် Wi-Fi တူသော ဖုန်းမှ Local IP ဖြင့် တိုက်ရိုက်ဖွင့်စမ်းနိုင်ပါသည်။
                  </p>
                </div>

                <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 space-y-2">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" />
                    <span>2. Custom PWA Install Banner အလုပ်လုပ်ပုံ</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Zip ဖိုင်ထဲတွင် <code>public/manifest.webmanifest</code> နှင့် Offline သုံးနိုင်သော <code>public/sw.js</code> (Service Worker) တို့ကို ထည့်ပေးထားပါသည်။ Android Chrome တွင် <code>beforeinstallprompt</code> event ကို ဖမ်းယူပြီး Custom Install Banner မှ တိုက်ရိုက် Install လုပ်ပေးပါသည်။
                  </p>
                </div>

                <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 space-y-2">
                  <div className="font-bold text-sky-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>3. Mobile Bottom Navigation & Category UX</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    ဖုန်းကို လက်တစ်ဖက်တည်းဖြင့် ကိုင်ပြီး ခွေးလေးကို လေ့ကျင့်ပေးနိုင်ရန် လက်မဖြင့် အလွယ်တကူ နှိပ်နိုင်သော <strong>Fixed Bottom Navigation Bar</strong> နှင့် အမျိုးအစား ၄ ခု ခွဲထားသော Category View တို့ကို ထည့်သွင်းပေးထားပါသည်။
                  </p>
                </div>

                <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 space-y-2">
                  <div className="font-bold text-purple-400 flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4" />
                    <span>4. Project Structure & Data Storage</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    App ၏ Training Progress နှင့် ခွေးလေး Profile ကို Zustand Persist ဖြင့် Browser Local Storage ထဲ သိမ်းထားပြီး လေ့ကျင့်မှုမှတ်တမ်းများကိုလည်း သီးခြား Local Storage ထဲ သိမ်းဆည်းပါသည်။ Data သည် ဒီ Browser/Device အတွင်းသာ ရှိပြီး Cloud Sync မပါဝင်သေးပါ။
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ================================================================
          MOBILE-FIRST FIXED BOTTOM NAVIGATION BAR
         ================================================================ */}
      <nav
        aria-label="Bottom Navigation"
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-amber-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      >
        <div className="max-w-xl mx-auto px-2 py-1.5 grid grid-cols-5 gap-1 items-center">
          {[
            { id: 'lessons', label: 'သင်ခန်းစာ', icon: BookOpen },
            { id: 'troubleshoot', label: 'အဖြေရှာနည်း', icon: HelpCircle },
            { id: 'clicker', label: 'Clicker', icon: Bell, highlight: true },
            { id: 'tracker', label: 'မှတ်တမ်း', icon: Activity },
            { id: 'architecture', label: 'PWA/Dev', icon: Code2 },
          ].map((item) => {
            const IconComponent = item.icon;
            const isActive = store.activeTab === item.id;

            if (item.highlight) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => store.setActiveTab(item.id as ActiveTabType)}
                  className="flex flex-col items-center justify-center -mt-4"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border-2 transition ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 border-amber-300 scale-105'
                        : 'bg-slate-900 text-amber-400 border-white hover:bg-slate-800'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] font-extrabold mt-0.5 ${
                      isActive ? 'text-amber-600' : 'text-slate-700'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => store.setActiveTab(item.id as ActiveTabType)}
                className={`py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition ${
                  isActive
                    ? 'text-amber-600 bg-amber-50/90 font-bold'
                    : 'text-slate-500 hover:text-slate-900 font-medium'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span className="text-[10px] leading-tight truncate max-w-full">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ================================================================
          CUSTOM PWA INSTALL GUIDE MODAL (iOS & Android Instructions)
         ================================================================ */}
      {store.pwaGuideModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900">
                    ဖုန်းထဲသို့ PawMaster App သွင်းနည်း (PWA)
                  </h4>
                  <p className="text-xs text-slate-500">Android နှင့် iPhone (iOS) နှစ်မျိုးလုံးတွင် သွင်းနိုင်သည်</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => store.setPwaGuideModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 space-y-1.5">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Android (Chrome Browser) တွင် သွင်းနည်း</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  ၁။ အပေါ်ဆုံးရှိ <strong>"Install App"</strong> ခလုတ်ကို နှိပ်ပါ သို့မဟုတ် Chrome ညာဘက်အပေါ်ထောင့်ရှိ အစက် ၃ စက် <code>(⋮)</code> ကိုနှိပ်ပါ။
                  <br />
                  ၂။ <strong>"Install app"</strong> သို့မဟုတ် <strong>"Add to Home screen"</strong> ကို ရွေးပါ။
                </p>
              </div>

              <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-3.5 space-y-1.5">
                <div className="font-bold text-sky-950 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-sky-600" />
                  <span>iPhone / iPad (Safari Browser) တွင် သွင်းနည်း</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  ၁။ Safari အောက်ခြေရှိ <strong>Share ခလုတ်</strong> (အပေါ်မြှားပုံ) ကို နှိပ်ပါ။
                  <br />
                  ၂။ အောက်သို့ဆွဲပြီး <strong>"Add to Home Screen"</strong> ကို နှိပ်၍ <strong>Add</strong> လုပ်ပါ။
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  store.setPwaBannerVisible(false);
                  store.setPwaGuideModalOpen(false);
                  triggerToast('PWA Install လမ်းညွှန်ကို ပိတ်လိုက်ပါပြီ။');
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5"
              >
                <Star className="w-4 h-4" />
                <span>Banner ကို ပိတ်မည်</span>
              </button>
              <button
                type="button"
                onClick={() => store.setPwaGuideModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition"
              >
                ပိတ်မည်
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          CUSTOM DOG NAME & PROFILE MODAL (ကိုယ်ပိုင်နာမည်ပေးရန်)
         ================================================================ */}
      {nameModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Dog className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900">
                    ခွေးလေးကို ကိုယ်ပိုင်နာမည်ပေးရန်
                  </h4>
                  <p className="text-xs text-slate-500">
                    မိမိခွေးလေး၏ အမည်နှင့် မျိုးရိုးကို စိတ်ကြိုက် ပြောင်းလဲသတ်မှတ်နိုင်ပါသည်
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNameModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-3.5" noValidate>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ခွေးလေး၏ ကိုယ်ပိုင်အမည် (မြန်မာ သို့မဟုတ် အင်္ဂလိပ်လို ရိုက်ထည့်ပါ)
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="ဥပမာ - Lucky, Milo, ဖိုးသား, ဖြူဖွေး..."
                  className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-amber-300 focus:outline-none focus:border-amber-500 bg-amber-50/30"
                  autoFocus
                />
                {profileErrors.name && (
                  <p className="text-xs text-rose-600 mt-1">{profileErrors.name}</p>
                )}

                <div className="mt-2">
                  <span className="text-[11px] text-slate-500 block mb-1">
                    အမည်နမူနာ အမြန်ရွေးရန် (နှိပ်နိုင်သည်):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['Lucky', 'Milo', 'Bella', 'Max', 'Coco', 'ဖိုးသား', 'ဖြူဖွေး', 'ဘိုဘို'].map(
                      (sampleName) => (
                        <button
                          key={sampleName}
                          type="button"
                          onClick={() => setProfileForm({ ...profileForm, name: sampleName })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                            profileForm.name === sampleName
                              ? 'bg-amber-500 text-white border-amber-600'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-amber-50'
                          }`}
                        >
                          {sampleName}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  မျိုးရိုး (Breed)
                </label>
                <input
                  type="text"
                  value={profileForm.breed}
                  onChange={(e) => setProfileForm({ ...profileForm, breed: e.target.value })}
                  placeholder="ဥပမာ - Golden Retriever, Poodle, မြန်မာခွေး..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
                {profileErrors.breed && (
                  <p className="text-xs text-rose-600 mt-1">{profileErrors.breed}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNameModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>နာမည် သိမ်းဆည်းမည်</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs sm:text-sm font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
