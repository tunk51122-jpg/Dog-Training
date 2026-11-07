import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DogProfileSchemaType } from '../schemas/trainingSchema';

export type LessonCategory = 'all' | 'basic' | 'intermediate' | 'advanced' | 'behavior';
export type ClickToneType = 'classic' | 'soft' | 'bell';

interface TrainingUIState {
  selectedCategory: LessonCategory;
  searchQuery: string;
  activeLessonId: string;
  clickCount: number;
  clickTone: ClickToneType;
  whistleFreq: number;
  muted: boolean;
  dogProfile: DogProfileSchemaType;
  setSelectedCategory: (cat: LessonCategory) => void;
  setSearchQuery: (q: string) => void;
  setActiveLessonId: (id: string) => void;
  incrementClick: () => void;
  resetClickCount: () => void;
  setClickTone: (tone: ClickToneType) => void;
  setWhistleFreq: (freq: number) => void;
  toggleMute: () => void;
  updateDogProfile: (profile: DogProfileSchemaType) => void;
}

export const useTrainingStore = create<TrainingUIState>()(
  persist(
    (set) => ({
      selectedCategory: 'all',
      searchQuery: '',
      activeLessonId: 'sit',
      clickCount: 0,
      clickTone: 'classic',
      whistleFreq: 4500,
      muted: false,
      dogProfile: {
        name: 'သင့်ခွေးလေး (My Dog)',
        breed: 'Golden Retriever',
        ageGroup: '၆ လ - ၁ နှစ် (Junior)',
        dailyGoalMinutes: 10,
      },
      setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setActiveLessonId: (activeLessonId) => set({ activeLessonId }),
      incrementClick: () => set((state) => ({ clickCount: state.clickCount + 1 })),
      resetClickCount: () => set({ clickCount: 0 }),
      setClickTone: (clickTone) => set({ clickTone }),
      setWhistleFreq: (whistleFreq) => set({ whistleFreq }),
      toggleMute: () => set((state) => ({ muted: !state.muted })),
      updateDogProfile: (dogProfile) => set({ dogProfile }),
    }),
    { name: 'pawmaster-zustand-storage' }
  )
);
