import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { 
  getDocumentTypeDisplayName, 
  getDocumentTypeIcon,
  type DocumentType 
} from '@/lib/documentDetector'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface DocumentViewerPanelProps {
  isOpen: boolean
  onClose: () => void
  content: string
  documentType: DocumentType
  language: string
  title?: string
}

export function DocumentViewerPanel({
  isOpen,
  onClose,
  content,
  documentType,
  language,
  title
}: DocumentViewerPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('code')
  
  // 监听 ESC 键关闭面板
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])
  
  // 根据文档类型决定是否可以预览
  const canPreview = documentType === 'html' || documentType === 'markdown'
  
  // 渲染预览内容
  const renderPreview = () => {
    if (documentType === 'html') {
      return (
        <iframe
          srcDoc={content}
          className="w-full h-full bg-white"
          sandbox="allow-scripts allow-same-origin"
          title="HTML Preview"
        />
      )
    } else if (documentType === 'markdown') {
      // TODO: 使用 markdown 渲染器
      return (
        <div className="p-6 text-main-view-fg">
          <p className="text-main-view-fg/50">Markdown 预览即将支持</p>
        </div>
      )
    }
    return null
  }
  
  const displayName = getDocumentTypeDisplayName(documentType)
  const icon = getDocumentTypeIcon(documentType)
  
  return (
    <>
      {/* 背景遮罩 */}
      <div
        className={cn(
          'fixed inset-0 bg-black/30 backdrop-blur-sm z-30 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      
      {/* 侧边面板 */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full bg-main-view border-l border-main-view-fg/10 shadow-2xl z-40 transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]',
          isCollapsed ? 'w-12' : 'w-full md:w-1/2 lg:w-[600px] xl:w-[700px]',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* 折叠按钮 */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full bg-main-view border border-main-view-fg/10 rounded-l-lg p-2 hover:bg-main-view-fg/5 transition-colors z-50"
        >
          <svg
            className={cn(
              'w-4 h-4 text-main-view-fg transition-transform duration-200',
              isCollapsed ? 'rotate-180' : ''
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
        
        {!isCollapsed && (
          <div className="h-full flex flex-col">
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 border-b border-main-view-fg/10">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <div>
                  <h3 className="font-semibold text-main-view-fg">
                    {title || `${displayName} 文档`}
                  </h3>
                  <p className="text-xs text-main-view-fg/50 mt-0.5">
                    {displayName} · {content.split('\n').length} 行
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* 视图切换 */}
                {canPreview && (
                  <div className="flex bg-main-view-fg/5 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('code')}
                      className={cn(
                        'px-3 py-1 text-sm rounded transition-colors',
                        viewMode === 'code'
                          ? 'bg-main-view-fg/10 text-main-view-fg'
                          : 'text-main-view-fg/50 hover:text-main-view-fg'
                      )}
                    >
                      代码
                    </button>
                    <button
                      onClick={() => setViewMode('preview')}
                      className={cn(
                        'px-3 py-1 text-sm rounded transition-colors',
                        viewMode === 'preview'
                          ? 'bg-main-view-fg/10 text-main-view-fg'
                          : 'text-main-view-fg/50 hover:text-main-view-fg'
                      )}
                    >
                      预览
                    </button>
                  </div>
                )}
                
                {/* 复制按钮 */}
                <button
                  onClick={() => navigator.clipboard.writeText(content)}
                  className="p-2 hover:bg-main-view-fg/5 rounded-lg transition-colors"
                  title="复制代码"
                >
                  <svg
                    className="w-4 h-4 text-main-view-fg/50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
                
                {/* 关闭按钮 */}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-main-view-fg/5 rounded-lg transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-main-view-fg/50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* 内容区域 */}
            <div className="flex-1 overflow-auto">
              {viewMode === 'preview' && canPreview ? (
                renderPreview()
              ) : (
                <div className="h-full">
                  <SyntaxHighlighter
                    language={language}
                    style={oneDark}
                    customStyle={{
                      margin: 0,
                      padding: '1.5rem',
                      background: 'transparent',
                      fontSize: '0.875rem',
                      height: '100%'
                    }}
                    showLineNumbers={true}
                    wrapLines={true}
                    lineProps={{
                      style: { wordBreak: 'break-word', whiteSpace: 'pre-wrap' }
                    }}
                  >
                    {content}
                  </SyntaxHighlighter>
                </div>
              )}
            </div>
            
            {/* 底部操作栏 */}
            <div className="p-4 border-t border-main-view-fg/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-main-view-fg/50">
                  <span>{language}</span>
                  <span>{content.length} 字符</span>
                </div>
                <button
                  className="px-4 py-1.5 bg-main-view-fg/10 hover:bg-main-view-fg/15 text-main-view-fg text-sm rounded-lg transition-colors"
                  onClick={() => {
                    // TODO: 实现发布功能
                    console.log('发布文档')
                  }}
                >
                  发布
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}