/**
 * HTML 内容检测工具
 * 用于区分 HTML 片段和完整的 HTML 文档
 */

export interface HtmlAnalysis {
  isComplete: boolean
  hasHtmlTag: boolean
  hasHeadTag: boolean
  hasBodyTag: boolean
  hasDoctype: boolean
  title: string
  description: string
  lineCount: number
}

/**
 * 分析 HTML 内容以确定是否为完整文档
 */
export function analyzeHtmlContent(content: string): HtmlAnalysis {
  const trimmedContent = content.trim()
  
  // 检查各种 HTML 标签
  const hasDoctype = /<!DOCTYPE\s+html/i.test(trimmedContent)
  const hasHtmlTag = /<html[\s>]/i.test(trimmedContent)
  const hasHeadTag = /<head[\s>]/i.test(trimmedContent)
  const hasBodyTag = /<body[\s>]/i.test(trimmedContent)
  
  // 提取标题
  const titleMatch = trimmedContent.match(/<title[^>]*>([^<]*)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : 'HTML Document'
  
  // 计算行数
  const lineCount = trimmedContent.split('\n').length
  
  // 判断是否为完整文档
  // 条件：有 DOCTYPE 或同时有 html 和 body 标签，或行数超过 20 行
  const isComplete = hasDoctype || 
    (hasHtmlTag && hasBodyTag) || 
    (hasHeadTag && hasBodyTag) ||
    lineCount > 20
  
  // 生成描述
  let description = 'HTML Content'
  if (isComplete) {
    description = hasDoctype ? 'Complete HTML Document' : 'HTML Page'
  } else if (lineCount <= 3) {
    description = 'HTML Snippet'
  } else {
    description = 'HTML Fragment'
  }
  
  return {
    isComplete,
    hasHtmlTag,
    hasHeadTag,
    hasBodyTag,
    hasDoctype,
    title,
    description,
    lineCount
  }
}

/**
 * 检查内容是否为 HTML
 */
export function isHtmlContent(content: string): boolean {
  const htmlPattern = /<[a-z][\s\S]*>/i
  return htmlPattern.test(content)
}

/**
 * 从 HTML 内容中提取纯文本预览
 */
export function extractTextPreview(html: string, maxLength: number = 100): string {
  // 移除 script 和 style 标签内容
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
  
  // 移除 HTML 标签
  text = text.replace(/<[^>]+>/g, ' ')
  
  // 清理多余空白
  text = text.replace(/\s+/g, ' ').trim()
  
  // 截断到最大长度
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + '...'
  }
  
  return text
}

/**
 * 生成 artifact 的唯一 ID
 */
export function generateArtifactId(): string {
  return `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}