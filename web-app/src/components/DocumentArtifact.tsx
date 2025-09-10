import { useState } from 'react'
import { 
  getDocumentTypeDisplayName, 
  getDocumentTypeIcon,
  type DocumentType 
} from '@/lib/documentDetector'

interface DocumentArtifactProps {
  content: string
  documentType: DocumentType
  language: string
  title?: string
  lineCount: number
  onView: () => void
}

export function DocumentArtifact({
  content,
  documentType,
  language,
  title,
  lineCount,
  onView
}: DocumentArtifactProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  // 获取预览内容（前几行）
  const getPreviewContent = () => {
    const lines = content.split('\n').slice(0, 4)
    return lines.join('\n')
  }
  
  const displayName = getDocumentTypeDisplayName(documentType)
  const icon = getDocumentTypeIcon(documentType)
  
  return (
    <div className="my-4 w-full">
      <button
        onClick={onView}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex w-full items-center gap-3 rounded-lg border border-main-view-fg/8 bg-main-view-fg/[0.02] hover:bg-main-view-fg/[0.04] p-3 transition-all duration-200"
      >
        {/* 图标 */}
        <div className="flex-shrink-0 text-2xl">
          {icon}
        </div>
        
        {/* 内容区域 */}
        <div className="flex-1 text-left">
          {/* 标题行 */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-main-view-fg">
              {title || `${displayName} 文档`}
            </span>
            <span className="text-xs text-main-view-fg/50 bg-main-view-fg/5 px-1.5 py-0.5 rounded">
              {displayName}
            </span>
          </div>
          
          {/* 预览代码 */}
          <div className="relative">
            <pre className="text-xs text-main-view-fg/60 font-mono overflow-hidden">
              <code className={`language-${language}`}>
                {getPreviewContent()}
              </code>
            </pre>
            
            {/* 渐变遮罩 */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-main-view via-main-view/80 to-transparent pointer-events-none" />
          </div>
          
          {/* 元信息 */}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-main-view-fg/40">
              {lineCount} 行
            </span>
            <span className="text-xs text-main-view-fg/40">
              {language}
            </span>
          </div>
        </div>
        
        {/* 查看按钮提示 */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <span className="text-xs text-main-view-fg/50">
            查看
          </span>
          <svg
            className={`w-4 h-4 text-main-view-fg/40 transition-transform duration-200 ${
              isHovered ? 'translate-x-0.5' : ''
            }`}
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
        </div>
      </button>
    </div>
  )
}