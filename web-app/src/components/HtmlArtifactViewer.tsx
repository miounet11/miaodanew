import React, { useState, useRef, useEffect } from 'react'
import { 
  IconX, 
  IconCode, 
  IconEye, 
  IconCopy, 
  IconDownload,
  IconCheck
} from '@tabler/icons-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface HtmlArtifactViewerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  htmlContent: string
}

const HtmlArtifactViewer: React.FC<HtmlArtifactViewerProps> = ({
  isOpen,
  onClose,
  title,
  htmlContent
}) => {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview')
  const [copied, setCopied] = useState(false)
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
    if (iframeRef.current && viewMode === 'preview') {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(htmlContent)
        doc.close()
      }
    }
  }, [htmlContent, viewMode])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-[1200px] h-[85vh] p-0 overflow-hidden bg-main-view border-main-view-fg/10">
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-main-view-fg/10 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <IconCode size={16} className="text-white" />
            </div>
            <h2 className="text-lg font-semibold text-main-view-fg/90">{title}</h2>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 视图切换按钮 */}
            <div className="flex rounded-lg border border-main-view-fg/10 bg-main-view p-0.5">
              <Button
                variant={viewMode === 'preview' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('preview')}
                className="px-3 py-1.5 h-7 text-xs"
              >
                <IconEye size={14} className="mr-1.5" />
                预览
              </Button>
              <Button
                variant={viewMode === 'code' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('code')}
                className="px-3 py-1.5 h-7 text-xs"
              >
                <IconCode size={14} className="mr-1.5" />
                代码
              </Button>
            </div>
            
            {/* 操作按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 w-8 p-0"
              title="复制代码"
            >
              {copied ? (
                <IconCheck size={18} className="text-green-500" />
              ) : (
                <IconCopy size={18} />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-8 w-8 p-0"
              title="下载 HTML 文件"
            >
              <IconDownload size={18} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              title="关闭"
            >
              <IconX size={18} />
            </Button>
          </div>
        </div>
        
        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden">
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
            <div className="h-full overflow-auto bg-gray-950 p-6">
              <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-words">
                <code>{htmlContent}</code>
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default HtmlArtifactViewer