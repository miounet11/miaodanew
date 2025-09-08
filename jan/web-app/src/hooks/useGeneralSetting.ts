import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { localStorageKey } from '@/constants/localStorage'
import { ExtensionManager } from '@/lib/extension'
import type { Language } from '@/types/app'

type LeftPanelStoreState = {
  currentLanguage: Language
  spellCheckChatInput: boolean
  huggingfaceToken?: string
  setHuggingfaceToken: (token: string) => void
  setSpellCheckChatInput: (value: boolean) => void
  setCurrentLanguage: (value: Language) => void
}

export const useGeneralSetting = create<LeftPanelStoreState>()(
  persist(
    (set) => ({
      currentLanguage: 'zh-CN',
      spellCheckChatInput: true,
      huggingfaceToken: undefined,
      setSpellCheckChatInput: (value) => set({ spellCheckChatInput: value }),
      setCurrentLanguage: (value) => set({ currentLanguage: value }),
      setHuggingfaceToken: (token) => {
        set({ huggingfaceToken: token })
        ExtensionManager.getInstance()
          .getByName('@miaoda/download-extension')
          ?.getSettings()
          .then((settings) => {
            if (settings) {
              const newSettings = settings.map((e) => {
                if (e.key === 'hf-token') {
                  e.controllerProps.value = token
                }
                return e
              })
              ExtensionManager.getInstance()
                .getByName('@miaoda/download-extension')
                ?.updateSettings(newSettings)
            }
          })
      },
    }),
    {
      name: localStorageKey.settingGeneral,
      storage: createJSONStorage(() => localStorage),
    }
  )
)
