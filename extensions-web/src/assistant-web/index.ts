/**
 * Web Assistant Extension
 * Implements assistant management using IndexedDB
 */

import { Assistant, AssistantExtension } from '@miaoda/core'
import { getSharedDB } from '../shared/db'

export default class AssistantExtensionWeb extends AssistantExtension {
  private db: IDBDatabase | null = null

  private defaultAssistant: Assistant = {
    avatar: '🤖',
    thread_location: undefined,
    id: 'miaoda',
    object: 'assistant',
    created_at: Date.now() / 1000,
    name: 'Miaoda',
    description:
      'Miaoda 是一个智能的 AI 助手，可以帮助您处理各种复杂的任务和问题。',
    model: 'grok-3',
    instructions:
      '你是 Miaoda，一个友好且专业的 AI 助手。你的主要目标是尽最大努力帮助用户解决问题和完成任务。\n\n' +
      '回答时请遵循以下原则：\n' +
      '- 当你有相关知识时，直接给出答案\n' +
      '- 保持简洁、清晰、有帮助\n' +
      '- 当不确定时，诚实地告知用户，而不是编造答案\n\n' +
      '如果有可用的工具：\n' +
      '- 只在工具能真正为回答增加价值时使用\n' +
      '- 当用户明确要求时使用工具（例如："搜索..."、"计算..."、"运行这段代码"）\n' +
      '- 对于你不知道或需要验证的信息使用工具\n' +
      '- 不要仅因为工具可用就使用它们\n\n' +
      '使用工具时：\n' +
      '- 一次使用一个工具并等待结果\n' +
      '- 使用实际值作为参数，而不是变量名\n' +
      '- 从每个结果中学习，然后决定下一步\n' +
      '- 避免使用相同参数重复调用同一个工具\n\n' +
      '记住：大多数问题都可以不使用工具就能回答。先思考是否真的需要使用工具。\n\n' +
      '当前日期：{{current_date}}',
    tools: [
      {
        type: 'retrieval',
        enabled: false,
        useTimeWeightedRetriever: false,
        settings: {
          top_k: 2,
          chunk_size: 1024,
          chunk_overlap: 64,
          retrieval_template: `使用以下上下文来回答最后的问题。
{context}
问题：{question}
有用的答案：`,
        },
      },
    ],
    file_ids: [],
    metadata: undefined,
  }

  async onLoad() {
    console.log('Loading Web Assistant Extension')
    this.db = await getSharedDB()
    
    // Create default assistant if none exist
    const assistants = await this.getAssistants()
    if (assistants.length === 0) {
      await this.createAssistant(this.defaultAssistant)
    }
  }

  onUnload() {
    // Don't close shared DB, other extensions might be using it
    this.db = null
  }

  private ensureDB(): void {
    if (!this.db) {
      throw new Error('Database not initialized. Call onLoad() first.')
    }
  }

  async getAssistants(): Promise<Assistant[]> {
    this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['assistants'], 'readonly')
      const store = transaction.objectStore('assistants')
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result || [])
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  async createAssistant(assistant: Assistant): Promise<void> {
    this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['assistants'], 'readwrite')
      const store = transaction.objectStore('assistants')
      
      const assistantToStore = {
        ...assistant,
        created_at: assistant.created_at || Date.now() / 1000,
      }
      
      const request = store.add(assistantToStore)

      request.onsuccess = () => {
        console.log('Assistant created:', assistant.id)
        resolve()
      }

      request.onerror = () => {
        console.error('Failed to create assistant:', request.error)
        reject(request.error)
      }
    })
  }

  async updateAssistant(id: string, assistant: Partial<Assistant>): Promise<void> {
    this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['assistants'], 'readwrite')
      const store = transaction.objectStore('assistants')
      
      // First get the existing assistant
      const getRequest = store.get(id)
      
      getRequest.onsuccess = () => {
        const existingAssistant = getRequest.result
        if (!existingAssistant) {
          reject(new Error(`Assistant with id ${id} not found`))
          return
        }
        
        const updatedAssistant = {
          ...existingAssistant,
          ...assistant,
          id, // Ensure ID doesn't change
        }
        
        const putRequest = store.put(updatedAssistant)
        
        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      }
      
      getRequest.onerror = () => {
        reject(getRequest.error)
      }
    })
  }

  async deleteAssistant(assistant: Assistant): Promise<void> {
    this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['assistants'], 'readwrite')
      const store = transaction.objectStore('assistants')
      const request = store.delete(assistant.id)

      request.onsuccess = () => {
        console.log('Assistant deleted:', assistant.id)
        resolve()
      }

      request.onerror = () => {
        console.error('Failed to delete assistant:', request.error)
        reject(request.error)
      }
    })
  }

  async getAssistant(id: string): Promise<Assistant | null> {
    this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['assistants'], 'readonly')
      const store = transaction.objectStore('assistants')
      const request = store.get(id)

      request.onsuccess = () => {
        resolve(request.result || null)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }
}