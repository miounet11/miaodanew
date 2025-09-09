import { create } from 'zustand'

type ModelLoadState = {
  modelLoadError?: string | import('@/types/app').ErrorObject
  setModelLoadError: (error: string | import('@/types/app').ErrorObject | undefined) => void
}

export const useModelLoad = create<ModelLoadState>()((set) => ({
  modelLoadError: undefined,
  setModelLoadError: (error) => set({ modelLoadError: error }),
}))
