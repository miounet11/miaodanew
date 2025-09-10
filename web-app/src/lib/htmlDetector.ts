/**
 * HTML 内容检测工具
 * 用于智能检测和处理 HTML artifacts
 */

export interface HtmlAnalysis {
  isComplete: boolean
  hasHtmlTag: boolean
  hasHeadTag: boolean
  hasBodyTag: boolean
  hasDoctype: boolean
  hasJavaScript: boolean
  hasStyles: boolean
  title: string
  description: string
  lineCount: number
  type: 'complete' | 'fragment' | 'snippet' | 'none'
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
  
  // 检查是否包含 JavaScript
  const hasScriptTag = /<script[\s>]/i.test(trimmedContent)
  const hasInlineEvents = /\son\w+\s*=/i.test(trimmedContent)
  const hasJavaScript = hasScriptTag || hasInlineEvents
  
  // 检查是否包含样式
  const hasStyleTag = /<style[\s>]/i.test(trimmedContent)
  const hasInlineStyle = /\sstyle\s*=/i.test(trimmedContent)
  const hasStylesheetLink = /<link[^>]+rel\s*=\s*["']stylesheet["']/i.test(trimmedContent)
  const hasStyles = hasStyleTag || hasInlineStyle || hasStylesheetLink
  
  // 提取标题
  const titleMatch = trimmedContent.match(/<title[^>]*>([^<]*)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : 'HTML Document'
  
  // 计算行数
  const lineCount = trimmedContent.split('\n').length
  
  // 判断文档类型
  let type: 'complete' | 'fragment' | 'snippet' | 'none' = 'none'
  let isComplete = false
  
  if (!isHtmlContent(trimmedContent)) {
    type = 'none'
  } else if (hasDoctype || (hasHtmlTag && hasBodyTag) || (hasHeadTag && hasBodyTag)) {
    type = 'complete'
    isComplete = true
  } else if (lineCount > 10) {
    type = 'fragment'
  } else {
    type = 'snippet'
  }
  
  // 生成描述
  let description = 'HTML Content'
  switch (type) {
    case 'complete':
      description = hasDoctype ? 'Complete HTML Document' : 'HTML Page'
      break
    case 'fragment':
      description = 'HTML Fragment'
      break
    case 'snippet':
      description = 'HTML Snippet'
      break
    default:
      description = 'Text Content'
  }
  
  return {
    isComplete,
    hasHtmlTag,
    hasHeadTag,
    hasBodyTag,
    hasDoctype,
    hasJavaScript,
    hasStyles,
    title,
    description,
    lineCount,
    type
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

/**
 * 准备 HTML 内容用于 iframe 渲染
 */
export function prepareHtmlForIframe(html: string): string {
  const analysis = analyzeHtmlContent(html)
  
  // 如果已经是完整文档，直接返回
  if (analysis.isComplete) {
    return html
  }
  
  // 如果是片段或代码片段，包装成完整文档
  if (analysis.type === 'fragment' || analysis.type === 'snippet') {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${analysis.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 
                         'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            padding: 20px;
            line-height: 1.6;
            color: #333;
            background: #fff;
        }
        h1, h2, h3, h4, h5, h6 {
            margin-top: 1em;
            margin-bottom: 0.5em;
        }
        p {
            margin-bottom: 1em;
        }
        img {
            max-width: 100%;
            height: auto;
        }
        pre {
            background: #f5f5f5;
            padding: 12px;
            border-radius: 4px;
            overflow-x: auto;
            margin-bottom: 1em;
        }
        code {
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
        }
        pre code {
            background: none;
            padding: 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1em;
        }
        th, td {
            padding: 8px 12px;
            border: 1px solid #ddd;
            text-align: left;
        }
        th {
            background: #f5f5f5;
            font-weight: 600;
        }
        a {
            color: #0066cc;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        blockquote {
            border-left: 4px solid #ddd;
            padding-left: 1em;
            margin: 1em 0;
            color: #666;
        }
        ul, ol {
            margin-bottom: 1em;
            padding-left: 2em;
        }
        li {
            margin-bottom: 0.25em;
        }
    </style>
</head>
<body>
    ${html}
</body>
</html>`
  }
  
  // 不是 HTML 内容，返回空字符串
  return ''
}

/**
 * 从 Markdown 代码块中提取 HTML
 */
export function extractHtmlFromMarkdown(markdown: string): string | null {
  // 匹配 ```html 代码块
  const htmlCodeBlockPattern = /```html\n([\s\S]*?)\n```/
  const match = markdown.match(htmlCodeBlockPattern)
  
  if (match && match[1]) {
    return match[1].trim()
  }
  
  return null
}

/**
 * 检测消息内容中的 HTML artifacts
 */
export interface HtmlArtifact {
  id: string
  content: string
  analysis: HtmlAnalysis
  sourceType: 'direct' | 'codeblock'
}

/**
 * 从消息内容中检测和提取 HTML artifacts
 */
export function detectHtmlArtifacts(content: string): HtmlArtifact[] {
  const artifacts: HtmlArtifact[] = []
  
  // 首先尝试从 Markdown 代码块中提取
  const htmlFromCodeBlock = extractHtmlFromMarkdown(content)
  if (htmlFromCodeBlock) {
    const analysis = analyzeHtmlContent(htmlFromCodeBlock)
    if (analysis.type !== 'none') {
      artifacts.push({
        id: generateArtifactId(),
        content: htmlFromCodeBlock,
        analysis,
        sourceType: 'codeblock'
      })
    }
  }
  
  // 如果没有代码块，检查整个内容是否为 HTML
  if (artifacts.length === 0) {
    const analysis = analyzeHtmlContent(content)
    if (analysis.type !== 'none' && analysis.type !== 'snippet') {
      artifacts.push({
        id: generateArtifactId(),
        content,
        analysis,
        sourceType: 'direct'
      })
    }
  }
  
  return artifacts
}