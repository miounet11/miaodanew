/**
 * 文档检测工具 - 识别各种类型的完整文档
 */

export interface DocumentAnalysis {
  isComplete: boolean
  documentType: DocumentType
  language: string
  title?: string
  lineCount: number
  hasMainStructure: boolean
  confidence: number // 0-1 置信度
}

export type DocumentType = 
  | 'html'
  | 'javascript'
  | 'typescript'
  | 'react'
  | 'vue'
  | 'css'
  | 'scss'
  | 'json'
  | 'markdown'
  | 'python'
  | 'java'
  | 'cpp'
  | 'rust'
  | 'go'
  | 'sql'
  | 'yaml'
  | 'xml'
  | 'shell'
  | 'other'

// 文档完整性判断规则
const DOCUMENT_PATTERNS: Record<string, {
  minLines: number
  patterns: RegExp[]
  mainStructures: RegExp[]
  fileExtension?: string
}> = {
  javascript: {
    minLines: 10,
    patterns: [
      /^(import|export|require|module\.exports)/m,
      /function\s+\w+\s*\(/,
      /class\s+\w+/,
      /const\s+\w+\s*=/,
    ],
    mainStructures: [
      /export\s+default/,
      /module\.exports/,
      /class\s+\w+.*\{[\s\S]*constructor/,
      /function\s+main\s*\(/,
    ],
    fileExtension: '.js'
  },
  typescript: {
    minLines: 10,
    patterns: [
      /^(import|export|require)/m,
      /interface\s+\w+/,
      /type\s+\w+\s*=/,
      /class\s+\w+/,
      /:\s*(string|number|boolean|any|void)/,
    ],
    mainStructures: [
      /export\s+default/,
      /export\s+class/,
      /export\s+interface/,
      /export\s+type/,
    ],
    fileExtension: '.ts'
  },
  react: {
    minLines: 8,
    patterns: [
      /import\s+.*React/,
      /from\s+['"]react['"]/,
      /export\s+default\s+function/,
      /const\s+\w+\s*=\s*\(\)\s*=>\s*\{/,
      /<\w+\s*\/?>/, // JSX
    ],
    mainStructures: [
      /export\s+default/,
      /function\s+\w+\s*\(.*\)\s*\{[\s\S]*return\s*\(/,
      /const\s+\w+\s*=.*=>[\s\S]*return\s*\(/,
    ],
    fileExtension: '.tsx'
  },
  vue: {
    minLines: 10,
    patterns: [
      /<template>/,
      /<script>/,
      /<style/,
      /export\s+default\s*\{/,
    ],
    mainStructures: [
      /<template>[\s\S]*<\/template>/,
      /<script.*>[\s\S]*<\/script>/,
    ],
    fileExtension: '.vue'
  },
  css: {
    minLines: 10,
    patterns: [
      /[.#]\w+\s*\{/,
      /:\s*\w+\s*;/,
      /@media/,
      /@import/,
    ],
    mainStructures: [
      /:root\s*\{/,
      /body\s*\{/,
      /\*\s*\{/,
    ],
    fileExtension: '.css'
  },
  python: {
    minLines: 10,
    patterns: [
      /^(import|from)\s+\w+/m,
      /def\s+\w+\s*\(/,
      /class\s+\w+/,
      /if\s+__name__\s*==\s*['"]__main__['"]/,
    ],
    mainStructures: [
      /if\s+__name__\s*==\s*['"]__main__['"]/,
      /def\s+main\s*\(/,
      /class\s+\w+.*:/,
    ],
    fileExtension: '.py'
  },
  java: {
    minLines: 10,
    patterns: [
      /^(import|package)\s+[\w.]+/m,
      /public\s+class\s+\w+/,
      /public\s+static\s+void\s+main/,
      /private\s+\w+\s+\w+/,
    ],
    mainStructures: [
      /public\s+static\s+void\s+main/,
      /public\s+class\s+\w+/,
    ],
    fileExtension: '.java'
  },
  json: {
    minLines: 5,
    patterns: [
      /^\s*\{/,
      /^\s*\[/,
      /"\w+":\s*["{[\d]/,
    ],
    mainStructures: [
      /^\s*\{[\s\S]*\}\s*$/,
      /^\s*\[[\s\S]*\]\s*$/,
    ],
    fileExtension: '.json'
  },
  markdown: {
    minLines: 5,
    patterns: [
      /^#{1,6}\s+/m,
      /^\*\s+/m,
      /^\d+\.\s+/m,
      /\[.*\]\(.*\)/,
      /```/,
    ],
    mainStructures: [
      /^#\s+/m, // 一级标题
    ],
    fileExtension: '.md'
  },
  sql: {
    minLines: 5,
    patterns: [
      /^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)/im,
      /FROM\s+\w+/i,
      /WHERE\s+/i,
    ],
    mainStructures: [
      /CREATE\s+(TABLE|DATABASE|VIEW)/i,
      /SELECT\s+.*FROM/i,
    ],
    fileExtension: '.sql'
  },
  yaml: {
    minLines: 5,
    patterns: [
      /^\w+:/m,
      /^\s+-\s+/m,
      /^\s+\w+:\s*/m,
    ],
    mainStructures: [
      /^version:/m,
      /^name:/m,
      /^services:/m,
    ],
    fileExtension: '.yaml'
  },
  xml: {
    minLines: 5,
    patterns: [
      /<\?xml/,
      /<\w+>/,
      /<\/\w+>/,
    ],
    mainStructures: [
      /<\?xml.*\?>/,
      /<!DOCTYPE/,
    ],
    fileExtension: '.xml'
  },
  shell: {
    minLines: 5,
    patterns: [
      /^#!/,
      /\$\w+/,
      /echo\s+/,
      /if\s+\[/,
    ],
    mainStructures: [
      /^#!\/bin\/(bash|sh)/,
    ],
    fileExtension: '.sh'
  },
  rust: {
    minLines: 10,
    patterns: [
      /^use\s+/m,
      /fn\s+\w+/,
      /struct\s+\w+/,
      /impl\s+/,
      /let\s+mut\s+/,
    ],
    mainStructures: [
      /fn\s+main\s*\(/,
      /pub\s+fn/,
      /pub\s+struct/,
    ],
    fileExtension: '.rs'
  },
  go: {
    minLines: 10,
    patterns: [
      /^package\s+/m,
      /^import\s+/m,
      /func\s+\w+/,
      /type\s+\w+\s+struct/,
    ],
    mainStructures: [
      /func\s+main\s*\(/,
      /package\s+main/,
    ],
    fileExtension: '.go'
  },
  cpp: {
    minLines: 10,
    patterns: [
      /^#include\s+[<"]/m,
      /int\s+main\s*\(/,
      /class\s+\w+/,
      /namespace\s+\w+/,
    ],
    mainStructures: [
      /int\s+main\s*\(/,
      /class\s+\w+.*\{/,
    ],
    fileExtension: '.cpp'
  }
}

/**
 * 检测文档类型
 */
function detectDocumentType(content: string, language?: string): DocumentType {
  
  // 首先检查语言提示
  if (language) {
    const langMap: Record<string, DocumentType> = {
      'html': 'html',
      'javascript': 'javascript',
      'js': 'javascript',
      'typescript': 'typescript',
      'ts': 'typescript',
      'tsx': 'react',
      'jsx': 'react',
      'vue': 'vue',
      'css': 'css',
      'scss': 'scss',
      'sass': 'scss',
      'json': 'json',
      'markdown': 'markdown',
      'md': 'markdown',
      'python': 'python',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c++': 'cpp',
      'rust': 'rust',
      'rs': 'rust',
      'go': 'go',
      'sql': 'sql',
      'yaml': 'yaml',
      'yml': 'yaml',
      'xml': 'xml',
      'shell': 'shell',
      'bash': 'shell',
      'sh': 'shell',
    }
    
    const detectedType = langMap[language.toLowerCase()]
    if (detectedType) {
      // 特殊处理：区分 React 和普通 JS/TS
      if (detectedType === 'javascript' || detectedType === 'typescript') {
        if (/<\w+\s*\/?>/.test(content) || /import.*from\s+['"]react['"]/.test(content)) {
          return 'react'
        }
      }
      return detectedType
    }
  }
  
  // 基于内容的启发式检测
  let bestMatch: { type: DocumentType; score: number } = { type: 'other', score: 0 }
  
  for (const [type, rules] of Object.entries(DOCUMENT_PATTERNS)) {
    let score = 0
    
    // 检查模式匹配
    for (const pattern of rules.patterns) {
      if (pattern.test(content)) {
        score += 1
      }
    }
    
    // 检查主要结构
    for (const structure of rules.mainStructures) {
      if (structure.test(content)) {
        score += 3 // 主要结构权重更高
      }
    }
    
    if (score > bestMatch.score) {
      bestMatch = { type: type as DocumentType, score }
    }
  }
  
  // 如果得分太低，返回 other
  if (bestMatch.score < 2) {
    return 'other'
  }
  
  return bestMatch.type
}

/**
 * 提取文档标题
 */
function extractTitle(content: string, documentType: DocumentType): string | undefined {
  const lines = content.split('\n').slice(0, 10) // 只看前10行
  
  switch (documentType) {
    case 'html':
      const titleMatch = content.match(/<title>(.*?)<\/title>/i)
      if (titleMatch) return titleMatch[1]
      break
      
    case 'javascript':
    case 'typescript':
    case 'react':
      // 查找导出的主要函数或类名
      const exportMatch = content.match(/export\s+default\s+(?:function\s+)?(\w+)/)
      if (exportMatch) return exportMatch[1]
      
      // 查找主要类名
      const classMatch = content.match(/class\s+(\w+)/)
      if (classMatch) return classMatch[1]
      break
      
    case 'python':
      // 查找主要类或函数
      const pyClassMatch = content.match(/class\s+(\w+)/)
      if (pyClassMatch) return pyClassMatch[1]
      
      const pyFuncMatch = content.match(/def\s+(\w+)/)
      if (pyFuncMatch && pyFuncMatch[1] !== '__init__') return pyFuncMatch[1]
      break
      
    case 'markdown':
      // 查找一级标题
      const mdTitleMatch = content.match(/^#\s+(.+)$/m)
      if (mdTitleMatch) return mdTitleMatch[1]
      break
      
    case 'json':
      // 尝试解析并获取 name 或 title 字段
      try {
        const parsed = JSON.parse(content)
        return parsed.name || parsed.title || undefined
      } catch {
        // 解析失败，返回 undefined
      }
      break
  }
  
  // 默认：使用第一行非空内容
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('#') && !trimmed.startsWith('/*')) {
      return trimmed.slice(0, 50) // 限制长度
    }
  }
  
  return undefined
}

/**
 * 分析文档内容
 */
export function analyzeDocumentContent(
  content: string,
  language?: string
): DocumentAnalysis {
  const trimmedContent = content.trim()
  const lines = trimmedContent.split('\n')
  const lineCount = lines.length
  
  // 检测文档类型
  const documentType = detectDocumentType(trimmedContent, language)
  
  // 如果是 HTML，使用专门的 HTML 检测逻辑
  if (documentType === 'html' || language === 'html') {
    const hasDoctype = /<!DOCTYPE\s+html/i.test(trimmedContent)
    const hasHtmlTag = /<html[\s>]/i.test(trimmedContent)
    const hasBodyTag = /<body[\s>]/i.test(trimmedContent)
    
    const isComplete = hasDoctype || (hasHtmlTag && hasBodyTag) || lineCount > 20
    
    return {
      isComplete,
      documentType: 'html',
      language: 'html',
      title: extractTitle(trimmedContent, 'html'),
      lineCount,
      hasMainStructure: hasDoctype || (hasHtmlTag && hasBodyTag),
      confidence: isComplete ? 0.9 : 0.3
    }
  }
  
  // 其他文档类型的检测
  const rules = DOCUMENT_PATTERNS[documentType]
  if (!rules) {
    return {
      isComplete: false,
      documentType: 'other',
      language: language || 'plaintext',
      lineCount,
      hasMainStructure: false,
      confidence: 0.1
    }
  }
  
  // 检查是否有主要结构
  let hasMainStructure = false
  for (const structure of rules.mainStructures) {
    if (structure.test(trimmedContent)) {
      hasMainStructure = true
      break
    }
  }
  
  // 计算匹配的模式数量
  let matchedPatterns = 0
  for (const pattern of rules.patterns) {
    if (pattern.test(trimmedContent)) {
      matchedPatterns++
    }
  }
  
  // 计算置信度
  const patternScore = Math.min(matchedPatterns / rules.patterns.length, 1)
  const lineScore = Math.min(lineCount / (rules.minLines * 2), 1)
  const structureScore = hasMainStructure ? 1 : 0.3
  
  const confidence = (patternScore * 0.3 + lineScore * 0.2 + structureScore * 0.5)
  
  // 判断是否是完整文档
  const isComplete = 
    lineCount >= rules.minLines &&
    (hasMainStructure || matchedPatterns >= 2) &&
    confidence > 0.5
  
  return {
    isComplete,
    documentType,
    language: language || documentType,
    title: extractTitle(trimmedContent, documentType),
    lineCount,
    hasMainStructure,
    confidence
  }
}

/**
 * 获取文档类型的显示名称
 */
export function getDocumentTypeDisplayName(type: DocumentType): string {
  const displayNames: Record<DocumentType, string> = {
    html: 'HTML',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    react: 'React',
    vue: 'Vue',
    css: 'CSS',
    scss: 'SCSS',
    json: 'JSON',
    markdown: 'Markdown',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
    rust: 'Rust',
    go: 'Go',
    sql: 'SQL',
    yaml: 'YAML',
    xml: 'XML',
    shell: 'Shell',
    other: 'Document'
  }
  
  return displayNames[type] || 'Document'
}

/**
 * 获取文档类型的图标
 */
export function getDocumentTypeIcon(type: DocumentType): string {
  const icons: Record<DocumentType, string> = {
    html: '🌐',
    javascript: '📜',
    typescript: '📘',
    react: '⚛️',
    vue: '💚',
    css: '🎨',
    scss: '🎨',
    json: '📋',
    markdown: '📝',
    python: '🐍',
    java: '☕',
    cpp: '⚙️',
    rust: '🦀',
    go: '🐹',
    sql: '🗄️',
    yaml: '📄',
    xml: '📃',
    shell: '🐚',
    other: '📄'
  }
  
  return icons[type] || '📄'
}