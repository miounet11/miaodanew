import React, { useRef, useEffect, useState } from 'react'
import { IconCode, IconExternalLink, IconCopy, IconDownload, IconRefresh, IconMaximize, IconMinimize } from '@tabler/icons-react'
import { analyzeHtmlContent, prepareHtmlForIframe, type HtmlAnalysis } from '@/lib/htmlDetector'

interface HtmlArtifactProps {
  content: string
  analysis?: HtmlAnalysis
  className?: string
  defaultExpanded?: boolean
  compact?: boolean
  onExpand?: () => void
}

const HtmlArtifact: React.FC<HtmlArtifactProps> = ({
  content,
  analysis: providedAnalysis,
  className = '',
  defaultExpanded = false,
  compact = false,
  onExpand
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [isCopied, setIsCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 分析 HTML 内容
  const analysis = providedAnalysis || analyzeHtmlContent(content)
  
  // 准备用于 iframe 的 HTML
  const preparedHtml = prepareHtmlForIframe(content)
  
  useEffect(() => {
    if (!compact && iframeRef.current && preparedHtml) {
      try {
        // 使用 srcdoc 渲染 HTML
        iframeRef.current.srcdoc = preparedHtml
        setIsLoading(false)
        setError(null)
      } catch (err) {
        console.error('Failed to render HTML:', err)
        setError('无法渲染 HTML 内容')
        setIsLoading(false)
      }
    }
  }, [preparedHtml, compact])
  
  // 处理复制
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(content)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }
  
  // 处理下载
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    const blob = new Blob([preparedHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${analysis.title || 'document'}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  // 处理刷新
  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (iframeRef.current) {
      setIsLoading(true)
      iframeRef.current.srcdoc = preparedHtml
    }
  }
  
  // 紧凑模式 - 只显示可点击的卡片
  if (compact) {
    return (
      <div className="relative my-2 w-full">
        <button
          onClick={onExpand}
          className="group relative flex w-full items-center gap-3 rounded-lg border border-main-view-fg/8 bg-main-view-fg/[0.02] hover:bg-main-view-fg/[0.04] p-3 text-left transition-all duration-200"
        >
          {/* 图标容器 */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-blue-500/90 to-blue-600/90">
            <IconCode size={16} className="text-white" />
          </div>
          
          {/* 文本内容 */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-main-view-fg/85 truncate">
              {analysis.title}
            </h3>
            <p className="text-xs text-main-view-fg/50 mt-0.5">
              {analysis.description} • {analysis.lineCount} 行 • 点击查看
            </p>
          </div>
          
          {/* 标签 */}
          <div className="flex items-center gap-1">
            {analysis.hasJavaScript && (
              <span className="text-xs px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded">
                JS
              </span>
            )}
            {analysis.hasStyles && (
              <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                CSS
              </span>
            )}
          </div>
          
          {/* 展开图标 */}
          <div className="flex items-center text-main-view-fg/30 group-hover:text-main-view-fg/50 transition-colors">
            <IconExternalLink size={16} />
          </div>
        </button>
      </div>
    )
  }
  
  // 完整模式 - 带 iframe 预览
  return (
    <div className={`html-artifact ${className} my-4`}>
      {/* 头部工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
        <div className="flex items-center gap-2">
          <IconCode className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {analysis.title}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {analysis.description} • {analysis.lineCount} 行
          </span>
          {analysis.hasJavaScript && (
            <span className="text-xs px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded">
              JS
            </span>
          )}
          {analysis.hasStyles && (
            <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
              CSS
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="刷新"
          >
            <IconRefresh className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title={isCopied ? '已复制' : '复制代码'}
          >
            <IconCopy className={`w-4 h-4 ${isCopied ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}`} />
          </button>
          
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="下载 HTML"
          >
            <IconDownload className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title={isExpanded ? '收起' : '展开'}
          >
            {isExpanded ? (
              <IconMinimize className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <IconMaximize className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>
      </div>
      
      {/* iframe 容器 */}
      <div className={`relative bg-white dark:bg-gray-900 border border-t-0 border-gray-200 dark:border-gray-700 rounded-b-lg overflow-hidden transition-all duration-300 ${
        isExpanded ? 'h-[600px]' : 'h-[300px]'
      }`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
            <div className="text-sm text-gray-500 dark:text-gray-400">加载中...</div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/20">
            <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError('加载失败')
            setIsLoading(false)
          }}
        />
      </div>
    </div>
  )
}

export default HtmlArtifact