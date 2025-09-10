import React from 'react'
import { IconCode, IconExternalLink } from '@tabler/icons-react'

interface HtmlArtifactProps {
  id: string
  title: string
  description?: string
  htmlContent: string
  onExpand: (id: string, content: string) => void
}

const HtmlArtifact: React.FC<HtmlArtifactProps> = ({ 
  id, 
  title, 
  description = '交互式 HTML 文档',
  htmlContent,
  onExpand 
}) => {
  return (
    <div className="relative my-2 w-full">
      <button
        onClick={() => onExpand(id, htmlContent)}
        className="group relative flex w-full items-center gap-3 rounded-lg border border-main-view-fg/8 bg-main-view-fg/[0.02] hover:bg-main-view-fg/[0.04] p-3 text-left transition-all duration-200"
      >
        {/* 图标容器 - 更小更精致 */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-blue-500/90 to-blue-600/90">
          <IconCode size={16} className="text-white" />
        </div>
        
        {/* 文本内容 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-main-view-fg/85 truncate">
            {title}
          </h3>
          <p className="text-xs text-main-view-fg/50 mt-0.5">
            {description} • 点击查看
          </p>
        </div>
        
        {/* 展开图标 */}
        <div className="flex items-center text-main-view-fg/30 group-hover:text-main-view-fg/50 transition-colors">
          <IconExternalLink size={16} />
        </div>
      </button>
    </div>
  )
}

export default HtmlArtifact