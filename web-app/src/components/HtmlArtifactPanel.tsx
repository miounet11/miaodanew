import React, { useState, useRef, useEffect } from 'react'
import { 
  IconX, 
  IconCode, 
  IconEye, 
  IconCopy, 
  IconDownload,
  IconCheck,
  IconChevronLeft,
  IconChevronRight
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface HtmlArtifactPanelProps {
  isOpen: boolean
  onClose: () => void
  title: string
  htmlContent: string
  position?: 'right' | 'bottom'
}

const HtmlArtifactPanel: React.FC<HtmlArtifactPanelProps> = ({
  isOpen,
  onClose,
  title,
  htmlContent,
  position = 'right'
}) => {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview')
  const [copied, setCopied] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // 重置复制状态
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  // 复制到剪贴板
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent)
      setCopied(true)
      toast.success('代码已复制到剪贴板')
    } catch (err) {
      toast.error('复制失败，请重试')
    }
  }

  // 下载 HTML 文件
  const handleDownload = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('文件已开始下载')
  }

  // 更新 iframe 内容
  useEffect(() => {
    if (iframeRef.current && viewMode === 'preview' && isOpen) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(htmlContent)
        doc.close()
      }
    }
  }, [htmlContent, viewMode, isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* 背景遮罩 - 仅在移动端显示 */}
      {isOpen && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}
      
      <div
        className={cn(
          'fixed bg-main-view border-l border-main-view-fg/10 shadow-2xl z-40',
          'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          position === 'right' ? [
            'top-0 right-0 h-full',
            isCollapsed ? 'w-12' : 'w-full md:w-1/2 lg:w-[600px] xl:w-[700px]',
            isOpen ? 'translate-x-0' : 'translate-x-full',
          ] : [
            'bottom-0 left-0 right-0',
            isCollapsed ? 'h-12' : 'h-[70vh] md:h-1/2 max-h-[600px]',
            isOpen ? 'translate-y-0' : 'translate-y-full',
          ]
        )}
      >
      {/* 折叠按钮 */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          'absolute bg-main-view border border-main-view-fg/10 rounded-lg p-1.5 hover:bg-main-view-fg/5 transition-all',
          position === 'right' 
            ? 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2'
            : 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2'
        )}
      >
        {position === 'right' ? (
          isCollapsed ? <IconChevronLeft size={16} /> : <IconChevronRight size={16} />
        ) : (
          isCollapsed ? <IconChevronRight size={16} className="rotate-90" /> : <IconChevronLeft size={16} className="rotate-90" />
        )}
      </button>

      {!isCollapsed && (
        <>
          {/* 顶部工具栏 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-main-view-fg/10 bg-gradient-to-r from-blue-50/20 to-purple-50/20 dark:from-blue-950/10 dark:to-purple-950/10">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <IconCode size={14} className="text-white" />
              </div>
              <h3 className="text-sm font-semibold text-main-view-fg/90 truncate max-w-[300px]">
                {title}
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              {/* 视图切换按钮 */}
              <div className="flex rounded-lg border border-main-view-fg/10 bg-main-view/50 p-0.5">
                <Button
                  variant={viewMode === 'preview' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('preview')}
                  className="px-2 py-1 h-6 text-xs"
                >
                  <IconEye size={12} className="mr-1" />
                  预览
                </Button>
                <Button
                  variant={viewMode === 'code' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('code')}
                  className="px-2 py-1 h-6 text-xs"
                >
                  <IconCode size={12} className="mr-1" />
                  代码
                </Button>
              </div>
              
              {/* 操作按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 w-7 p-0"
                title="复制代码"
              >
                {copied ? (
                  <IconCheck size={16} className="text-green-500" />
                ) : (
                  <IconCopy size={16} />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-7 w-7 p-0"
                title="下载 HTML 文件"
              >
                <IconDownload size={16} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-7 w-7 p-0"
                title="关闭"
              >
                <IconX size={16} />
              </Button>
            </div>
          </div>
          
          {/* 内容区域 */}
          <div className="h-[calc(100%-52px)] overflow-hidden">
            {viewMode === 'preview' ? (
              <div className="h-full bg-white dark:bg-gray-900">
                <iframe
                  ref={iframeRef}
                  className="w-full h-full border-0"
                  title={title}
                  sandbox="allow-scripts allow-same-origin allow-forms"
                />
              </div>
            ) : (
              <div className="h-full overflow-auto bg-gray-950 p-4">
                <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-words">
                  <code>{htmlContent}</code>
                </pre>
              </div>
            )}
          </div>
        </>
      )}
      </div>
    </>
  )
}

export default HtmlArtifactPanel