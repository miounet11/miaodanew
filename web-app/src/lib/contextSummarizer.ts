/**
 * AI 上下文总结生成器
 * 使用 AI 模型自动生成对话总结
 */

import { extractKeyPoints } from './contextManager'

export interface SummaryRequest {
  messages: any[]
  language?: 'zh' | 'en'
  maxLength?: number
}

export interface SummaryResponse {
  summary: string
  keyPoints: string[]
  topics: string[]
  sentiment?: 'positive' | 'neutral' | 'negative'
}

/**
 * 生成对话总结的提示词模板
 */
function getSummaryPrompt(messages: any[], language: 'zh' | 'en'): string {
  const messageContent = messages
    .map(msg => `${msg.role === 'user' ? '用户' : 'AI'}: ${msg.content}`)
    .join('\n')
  
  if (language === 'zh') {
    return `请分析以下对话内容，生成一个简洁的总结。

对话内容：
${messageContent}

请提供：
1. 一段简洁的总结（不超过200字）
2. 关键要点列表（3-5个）
3. 讨论的主要话题
4. 对话的整体情感倾向（积极/中性/消极）

请用JSON格式返回，包含以下字段：
{
  "summary": "总结内容",
  "keyPoints": ["要点1", "要点2", ...],
  "topics": ["话题1", "话题2", ...],
  "sentiment": "positive/neutral/negative"
}`
  } else {
    return `Please analyze the following conversation and generate a concise summary.

Conversation:
${messageContent}

Please provide:
1. A concise summary (max 200 words)
2. Key points list (3-5 items)
3. Main topics discussed
4. Overall sentiment (positive/neutral/negative)

Return in JSON format with these fields:
{
  "summary": "summary content",
  "keyPoints": ["point1", "point2", ...],
  "topics": ["topic1", "topic2", ...],
  "sentiment": "positive/neutral/negative"
}`
  }
}

/**
 * 使用本地规则生成总结（备用方案）
 */
export function generateLocalSummary(messages: any[]): SummaryResponse {
  if (!messages || messages.length === 0) {
    return {
      summary: '暂无对话内容',
      keyPoints: [],
      topics: [],
      sentiment: 'neutral'
    }
  }

  // 提取关键信息
  const keyPoints = extractKeyPoints(messages)
  
  // 分析话题
  const topics = new Set<string>()
  messages.forEach(msg => {
    // 检测技术相关话题
    if (/代码|编程|开发|bug|错误|功能|实现|优化/.test(msg.content)) {
      topics.add('技术开发')
    }
    if (/设计|界面|UI|UX|用户体验|布局|样式/.test(msg.content)) {
      topics.add('界面设计')
    }
    if (/数据|数据库|API|接口|服务|请求/.test(msg.content)) {
      topics.add('数据处理')
    }
    if (/测试|调试|部署|发布|构建|打包/.test(msg.content)) {
      topics.add('工程实践')
    }
    if (/学习|教程|文档|帮助|解释|理解/.test(msg.content)) {
      topics.add('学习指导')
    }
  })

  // 生成简单总结
  const userMessages = messages.filter(m => m.role === 'user')
  const aiMessages = messages.filter(m => m.role === 'assistant')
  
  let summary = `对话包含 ${userMessages.length} 条用户消息和 ${aiMessages.length} 条 AI 回复。`
  
  if (topics.size > 0) {
    summary += `主要讨论了${Array.from(topics).join('、')}等话题。`
  }
  
  if (keyPoints.length > 0) {
    summary += `涉及${keyPoints.slice(0, 3).join('、')}等内容。`
  }

  // 分析情感倾向
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
  const positiveWords = /成功|完成|很好|优秀|完美|解决|实现|满意/
  const negativeWords = /失败|错误|问题|bug|无法|不能|困难|糟糕/
  
  let positiveCount = 0
  let negativeCount = 0
  
  messages.forEach(msg => {
    if (positiveWords.test(msg.content)) positiveCount++
    if (negativeWords.test(msg.content)) negativeCount++
  })
  
  if (positiveCount > negativeCount * 1.5) {
    sentiment = 'positive'
  } else if (negativeCount > positiveCount * 1.5) {
    sentiment = 'negative'
  }

  return {
    summary,
    keyPoints: keyPoints.slice(0, 5),
    topics: Array.from(topics),
    sentiment
  }
}

/**
 * 使用 AI 模型生成总结
 */
export async function generateAISummary(
  messages: any[],
  modelService?: any,
  language: 'zh' | 'en' = 'zh'
): Promise<SummaryResponse> {
  try {
    if (!modelService) {
      // 如果没有提供模型服务，使用本地生成
      return generateLocalSummary(messages)
    }

    const prompt = getSummaryPrompt(messages, language)
    
    // 调用 AI 模型
    const response = await modelService.complete({
      messages: [
        {
          role: 'system',
          content: '你是一个专业的对话分析助手，擅长总结和提取关键信息。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    })

    // 解析 AI 响应
    try {
      const result = JSON.parse(response.content)
      return {
        summary: result.summary || '总结生成失败',
        keyPoints: result.keyPoints || [],
        topics: result.topics || [],
        sentiment: result.sentiment || 'neutral'
      }
    } catch (parseError) {
      // 如果解析失败，返回原始内容作为总结
      return {
        summary: response.content.slice(0, 200),
        keyPoints: extractKeyPoints(messages),
        topics: [],
        sentiment: 'neutral'
      }
    }
  } catch (error) {
    console.error('AI summary generation failed:', error)
    // 降级到本地生成
    return generateLocalSummary(messages)
  }
}

/**
 * 更新现有总结
 */
export async function updateSummary(
  existingSummary: string,
  newMessages: any[],
  modelService?: any
): Promise<string> {
  if (!modelService) {
    // 简单追加新内容
    const newInfo = generateLocalSummary(newMessages)
    return `${existingSummary}\n\n更新：${newInfo.summary}`
  }

  try {
    const response = await modelService.complete({
      messages: [
        {
          role: 'system',
          content: '你是一个专业的对话分析助手。请基于现有总结和新的对话内容，生成更新后的总结。'
        },
        {
          role: 'user',
          content: `现有总结：\n${existingSummary}\n\n新的对话内容：\n${newMessages.map(m => `${m.role}: ${m.content}`).join('\n')}\n\n请生成更新后的总结（不超过300字）：`
        }
      ],
      temperature: 0.3,
      max_tokens: 400
    })

    return response.content
  } catch (error) {
    console.error('Summary update failed:', error)
    const newInfo = generateLocalSummary(newMessages)
    return `${existingSummary}\n\n更新：${newInfo.summary}`
  }
}

/**
 * 生成对话标题
 */
export async function generateTitle(
  messages: any[],
  modelService?: any
): Promise<string> {
  if (!messages || messages.length === 0) {
    return '新对话'
  }

  const firstUserMessage = messages.find(m => m.role === 'user')
  if (!firstUserMessage) {
    return '新对话'
  }

  // 简单提取前30个字符作为标题
  const simpleTitle = firstUserMessage.content
    .replace(/\n/g, ' ')
    .slice(0, 30)
    .trim()

  if (!modelService) {
    return simpleTitle || '新对话'
  }

  try {
    const response = await modelService.complete({
      messages: [
        {
          role: 'system',
          content: '请为对话生成一个简短的标题（不超过20字）'
        },
        {
          role: 'user',
          content: `对话内容：${firstUserMessage.content.slice(0, 200)}`
        }
      ],
      temperature: 0.5,
      max_tokens: 30
    })

    return response.content.trim() || simpleTitle
  } catch (error) {
    return simpleTitle || '新对话'
  }
}