import { getServiceHub } from '@/hooks/useServiceHub'
import { Assistant as CoreAssistant } from '@miaoda/core'
import { create } from 'zustand'
import { localStorageKey } from '@/constants/localStorage'

interface AssistantState {
  assistants: Assistant[]
  currentAssistant: Assistant
  addAssistant: (assistant: Assistant) => void
  updateAssistant: (assistant: Assistant) => void
  deleteAssistant: (id: string) => void
  setCurrentAssistant: (assistant: Assistant, saveToStorage?: boolean) => void
  setAssistants: (assistants: Assistant[]) => void
  getLastUsedAssistant: () => string | null
  setLastUsedAssistant: (assistantId: string) => void
  initializeWithLastUsed: () => void
}

// Helper functions for localStorage
const getLastUsedAssistantId = (): string | null => {
  try {
    return localStorage.getItem(localStorageKey.lastUsedAssistant)
  } catch (error) {
    console.debug('Failed to get last used assistant from localStorage:', error)
    return null
  }
}

const setLastUsedAssistantId = (assistantId: string) => {
  try {
    localStorage.setItem(localStorageKey.lastUsedAssistant, assistantId)
  } catch (error) {
    console.debug('Failed to set last used assistant in localStorage:', error)
  }
}

export const defaultAssistant: Assistant = {
  id: 'miaoda',
  name: 'Miaoda',
  created_at: 1747029866.542,
  parameters: {},
  avatar: '🤖',
  description:
    'Miaoda 是一个智能的 AI 助手，可以帮助您处理各种复杂的任务和问题。',
  instructions:
    '你是 Miaoda，一个友好且专业的 AI 助手。你的主要目标是尽最大努力帮助用户解决问题和完成任务。\n\n回答时请遵循以下原则：\n- 当你有相关知识时，直接给出答案\n- 保持简洁、清晰、有帮助\n- 当不确定时，诚实地告知用户，而不是编造答案\n\n如果有可用的工具：\n- 只在工具能真正为回答增加价值时使用\n- 当用户明确要求时使用工具（例如："搜索..."、"计算..."、"运行这段代码"）\n- 对于你不知道或需要验证的信息使用工具\n- 不要仅因为工具可用就使用它们\n\n使用工具时：\n- 一次使用一个工具并等待结果\n- 使用实际值作为参数，而不是变量名\n- 从每个结果中学习，然后决定下一步\n- 避免使用相同参数重复调用同一个工具\n\n记住：大多数问题都可以不使用工具就能回答。先思考是否真的需要使用工具。\n\n当前日期：{{current_date}}',
}

export const useAssistant = create<AssistantState>()((set, get) => ({
  assistants: [defaultAssistant],
  currentAssistant: defaultAssistant,
  addAssistant: (assistant) => {
    set({ assistants: [...get().assistants, assistant] })
    getServiceHub().assistants().createAssistant(assistant as unknown as CoreAssistant).catch((error) => {
      console.error('Failed to create assistant:', error)
    })
  },
  updateAssistant: (assistant) => {
    const state = get()
    set({
      assistants: state.assistants.map((a) =>
        a.id === assistant.id ? assistant : a
      ),
      // Update currentAssistant if it's the same assistant being updated
      currentAssistant:
        state.currentAssistant.id === assistant.id
          ? assistant
          : state.currentAssistant,
    })
    // Create assistant already cover update logic
    getServiceHub().assistants().createAssistant(assistant as unknown as CoreAssistant).catch((error) => {
      console.error('Failed to update assistant:', error)
    })
  },
  deleteAssistant: (id) => {
    const state = get()
    getServiceHub().assistants().deleteAssistant(
      state.assistants.find((e) => e.id === id) as unknown as CoreAssistant
    ).catch((error) => {
      console.error('Failed to delete assistant:', error)
    })

    // Check if we're deleting the current assistant
    const wasCurrentAssistant = state.currentAssistant.id === id

    set({ assistants: state.assistants.filter((a) => a.id !== id) })

    // If the deleted assistant was current, fallback to default and update localStorage
    if (wasCurrentAssistant) {
      set({ currentAssistant: defaultAssistant })
      setLastUsedAssistantId(defaultAssistant.id)
    }
  },
  setCurrentAssistant: (assistant, saveToStorage = true) => {
    set({ currentAssistant: assistant })
    if (saveToStorage) {
      setLastUsedAssistantId(assistant.id)
    }
  },
  setAssistants: (assistants) => {
    set({ assistants })
  },
  getLastUsedAssistant: () => {
    return getLastUsedAssistantId()
  },
  setLastUsedAssistant: (assistantId) => {
    setLastUsedAssistantId(assistantId)
  },
  initializeWithLastUsed: () => {
    const lastUsedId = getLastUsedAssistantId()
    if (lastUsedId) {
      const lastUsedAssistant = get().assistants.find(
        (a) => a.id === lastUsedId
      )
      if (lastUsedAssistant) {
        set({ currentAssistant: lastUsedAssistant })
      } else {
        // Fallback to default if last used assistant was deleted
        set({ currentAssistant: defaultAssistant })
        setLastUsedAssistantId(defaultAssistant.id)
      }
    }
  },
}))
