import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  IconChevronDown,
  IconChevronUp,
  IconFile,
  IconFileText,
  IconCode,
  IconX,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

export interface CollapsedContentItem {
  id: string
  type: 'text' | 'file' | 'code'
  title: string
  content: string
  lineCount?: number
  fileType?: string
  fileName?: string
  collapsed: boolean
}

interface CollapsedContentProps {
  item: CollapsedContentItem
  onRemove: (id: string) => void
  onToggle: (id: string) => void
  className?: string
}

export function CollapsedContent({
  item,
  onRemove,
  onToggle,
  className
}: CollapsedContentProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  // 获取图标
  const getIcon = () => {
    switch (item.type) {
      case 'file':
        return <IconFile className="w-4 h-4" />
      case 'code':
        return <IconCode className="w-4 h-4" />
      default:
        return <IconFileText className="w-4 h-4" />
    }
  }
  
  // 获取显示标题
  const getDisplayTitle = () => {
    if (item.fileName) {
      return item.fileName
    }
    if (item.type === 'text' && item.lineCount) {
      return `Pasted text #${item.id} +${item.lineCount} lines`
    }
    return item.title
  }
  
  // 获取预览内容
  const getPreviewContent = () => {
    if (item.collapsed) {
      const lines = item.content.split('\n')
      return lines.slice(0, 3).join('\n')
    }
    return item.content
  }
  
  return (
    <div
      className={cn(
        'relative mb-2 rounded-lg border border-main-view-fg/10 bg-main-view-fg/[0.02] transition-all',
        isHovered && 'bg-main-view-fg/[0.04]',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 头部 */}
      <div
        className="flex items-center gap-2 p-2 cursor-pointer"
        onClick={() => onToggle(item.id)}
      >
        {/* 图标 */}
        <div className="text-main-view-fg/60">
          {getIcon()}
        </div>
        
        {/* 标题 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-main-view-fg truncate">
            {getDisplayTitle()}
          </p>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex items-center gap-1">
          {/* 展开/折叠按钮 */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation()
              onToggle(item.id)
            }}
          >
            {item.collapsed ? (
              <IconChevronDown className="w-3 h-3" />
            ) : (
              <IconChevronUp className="w-3 h-3" />
            )}
          </Button>
          
          {/* 删除按钮 */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation()
              onRemove(item.id)
            }}
          >
            <IconX className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      {/* 内容预览 */}
      {!item.collapsed && (
        <div className="px-2 pb-2">
          <pre className="text-xs text-main-view-fg/70 font-mono whitespace-pre-wrap break-words max-h-48 overflow-y-auto p-2 bg-main-view-fg/[0.02] rounded">
            {getPreviewContent()}
          </pre>
        </div>
      )}
      
      {/* 折叠时的渐变遮罩 */}
      {item.collapsed && item.lineCount && item.lineCount > 3 && (
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-main-view via-main-view/80 to-transparent pointer-events-none rounded-b-lg" />
      )}
    </div>
  )
}

/**
 * 创建折叠内容项
 */
export function createCollapsedContentItem(
  content: string,
  type: 'text' | 'file' | 'code' = 'text',
  fileName?: string
): CollapsedContentItem {
  const lines = content.split('\n')
  const lineCount = lines.length
  
  // 生成唯一 ID
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  
  // 根据内容长度决定是否默认折叠
  const shouldCollapse = lineCount > 10
  
  return {
    id,
    type,
    title: fileName || `Content ${id}`,
    content,
    lineCount,
    fileName,
    collapsed: shouldCollapse
  }
}

/**
 * 检测文件类型
 */
export function detectFileType(fileName: string): 'code' | 'text' | 'file' {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  const codeExtensions = [
    'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'go', 
    'rs', 'php', 'rb', 'swift', 'kt', 'scala', 'r', 'sql', 'sh', 
    'bash', 'ps1', 'yaml', 'yml', 'json', 'xml', 'html', 'css', 
    'scss', 'less', 'vue', 'dart'
  ]
  
  const textExtensions = ['txt', 'md', 'log', 'csv', 'ini', 'conf', 'cfg']
  
  if (extension && codeExtensions.includes(extension)) {
    return 'code'
  }
  if (extension && textExtensions.includes(extension)) {
    return 'text'
  }
  
  return 'file'
}