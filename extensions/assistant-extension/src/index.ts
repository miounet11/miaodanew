import { Assistant, AssistantExtension, fs, joinPath } from '@miaoda/core'
export default class JanAssistantExtension extends AssistantExtension {
  async onLoad() {
    if (!(await fs.existsSync('file://assistants'))) {
      await fs.mkdir('file://assistants')
    }
    const assistants = await this.getAssistants()
    if (assistants.length === 0) {
      await this.createAssistant(this.defaultAssistant)
    }
  }

  /**
   * Called when the extension is unloaded.
   */
  onUnload(): void {}

  async getAssistants(): Promise<Assistant[]> {
    if (!(await fs.existsSync('file://assistants')))
      return [this.defaultAssistant]
    const assistants = await fs.readdirSync('file://assistants')
    const assistantsData: Assistant[] = []
    for (const assistant of assistants) {
      const assistantPath = await joinPath([
        'file://assistants',
        assistant,
        'assistant.json',
      ])
      if (!(await fs.existsSync(assistantPath))) {
        console.warn(`Assistant file not found: ${assistantPath}`)
        continue
      }
      try {
        const assistantData = JSON.parse(await fs.readFileSync(assistantPath))
        assistantsData.push(assistantData as Assistant)
      } catch (error) {
        console.error(`Failed to read assistant ${assistant}:`, error)
      }
    }
    return assistantsData
  }

  async createAssistant(assistant: Assistant): Promise<void> {
    const assistantPath = await joinPath([
      'file://assistants',
      assistant.id,
      'assistant.json',
    ])
    const assistantFolder = await joinPath(['file://assistants', assistant.id])
    if (!(await fs.existsSync(assistantFolder))) {
      await fs.mkdir(assistantFolder)
    }
    await fs.writeFileSync(assistantPath, JSON.stringify(assistant, null, 2))
  }

  async deleteAssistant(assistant: Assistant): Promise<void> {
    const assistantPath = await joinPath([
      'file://assistants',
      assistant.id,
      'assistant.json',
    ])
    if (await fs.existsSync(assistantPath)) {
      await fs.rm(assistantPath)
    }
  }

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
      '你是 Miaoda，一个友好且专业的 AI 助手。你的主要目标是尽最大努力帮助用户解决问题和完成任务。\n\n回答时请遵循以下原则：\n- 当你有相关知识时，直接给出答案\n- 保持简洁、清晰、有帮助\n- 当不确定时，诚实地告知用户，而不是编造答案\n\n如果有可用的工具：\n- 只在工具能真正为回答增加价值时使用\n- 当用户明确要求时使用工具（例如："搜索..."、"计算..."、"运行这段代码"）\n- 对于你不知道或需要验证的信息使用工具\n- 不要仅因为工具可用就使用它们\n\n使用工具时：\n- 一次使用一个工具并等待结果\n- 使用实际值作为参数，而不是变量名\n- 从每个结果中学习，然后决定下一步\n- 避免使用相同参数重复调用同一个工具\n\n记住：大多数问题都可以不使用工具就能回答。先思考是否真的需要使用工具。\n\n当前日期：{{current_date}}',
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
----------------
上下文：{CONTEXT}
----------------
问题：{QUESTION}
----------------
有用的答案：`,
        },
      },
    ],
    file_ids: [],
    metadata: undefined,
  }
}
