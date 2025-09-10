import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useContextManager } from '@/lib/contextManager'
import {
  IconBrain,
  IconBook,
  IconFiles,
  IconBulb,
  IconPlus,
  IconEdit,
  IconTrash,
  IconPin,
  IconPinFilled,
  IconChevronRight,
  IconChevronDown,
  IconX,
  IconSettings,
  IconRefresh,
  IconDownload,
  IconUpload,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// import { ScrollArea } from '@/components/ui/scroll-area' // 使用原生滚动
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import TextareaAutosize from 'react-textarea-autosize'

interface ContextPanelProps {
  threadId?: string
  messages?: any[]
  className?: string
}

export function ContextPanel({ threadId, messages = [], className }: ContextPanelProps) {
  const {
    currentSummary,
    rules,
    resources,
    knowledge,
    isPanelOpen,
    activeTab,
    generateSummary,
    updateSummary,
    toggleRule,
    addRule,
    deleteRule,
    pinResource,
    unpinResource,
    togglePanel,
    setActiveTab,
    getActiveRules,
  } = useContextManager()

  const [editingSummary, setEditingSummary] = useState(false)
  const [summaryText, setSummaryText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const activeRules = getActiveRules()
  const pinnedResources = resources.filter(r => r.pinned)
  const unpinnedResources = resources.filter(r => !r.pinned)

  // 自动生成总结
  useEffect(() => {
    if (threadId && messages.length > 0 && !currentSummary) {
      handleGenerateSummary()
    }
  }, [threadId, messages.length])

  // 同步总结文本
  useEffect(() => {
    if (currentSummary) {
      setSummaryText(currentSummary.content)
    }
  }, [currentSummary])

  const handleGenerateSummary = async () => {
    if (!threadId) return
    setIsGenerating(true)
    try {
      await generateSummary(threadId, messages)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveSummary = () => {
    if (currentSummary) {
      updateSummary(currentSummary.id, summaryText)
      setEditingSummary(false)
    }
  }

  if (!isPanelOpen) {
    return (
      <button
        onClick={togglePanel}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-main-view border border-main-view-fg/10 rounded-l-lg p-2 hover:bg-main-view-fg/5 transition-colors z-30"
      >
        <IconChevronRight className="w-4 h-4 text-main-view-fg" />
      </button>
    )
  }

  return (
    <div
      className={cn(
        'fixed right-0 top-0 h-full bg-main-view border-l border-main-view-fg/10 shadow-xl z-30',
        'w-80 transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]',
        isPanelOpen ? 'translate-x-0' : 'translate-x-full',
        className
      )}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-main-view-fg/10">
        <div className="flex items-center gap-2">
          <IconBrain className="w-5 h-5 text-main-view-fg" />
          <h3 className="font-semibold text-main-view-fg">智能上下文</h3>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleGenerateSummary}
                  disabled={isGenerating}
                >
                  <IconRefresh className={cn("w-4 h-4", isGenerating && "animate-spin")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>重新生成总结</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={togglePanel}
                >
                  <IconX className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>关闭面板</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col h-[calc(100%-64px)]">
        <TabsList className="grid w-full grid-cols-4 p-1">
          <TabsTrigger value="summary" className="text-xs">
            <IconBrain className="w-3 h-3 mr-1" />
            总结
          </TabsTrigger>
          <TabsTrigger value="rules" className="text-xs">
            <IconBulb className="w-3 h-3 mr-1" />
            规则
            {activeRules.length > 0 && (
              <Badge variant="secondary" className="ml-1 px-1 h-4 text-[10px]">
                {activeRules.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resources" className="text-xs">
            <IconFiles className="w-3 h-3 mr-1" />
            资源
            {resources.length > 0 && (
              <Badge variant="secondary" className="ml-1 px-1 h-4 text-[10px]">
                {resources.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="text-xs">
            <IconBook className="w-3 h-3 mr-1" />
            知识
          </TabsTrigger>
        </TabsList>

        {/* 总结标签页 */}
        <TabsContent value="summary" className="flex-1 p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-main-view-fg">对话总结</h4>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setEditingSummary(!editingSummary)}
              >
                <IconEdit className="w-3 h-3" />
              </Button>
            </div>
            
            {editingSummary ? (
              <div className="space-y-2">
                <TextareaAutosize
                  value={summaryText}
                  onChange={(e) => setSummaryText(e.target.value)}
                  className="w-full p-2 text-sm bg-main-view-fg/5 border border-main-view-fg/10 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-main-view-fg/20"
                  minRows={3}
                  maxRows={10}
                  placeholder="输入对话总结..."
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveSummary}
                    className="text-xs"
                  >
                    保存
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingSummary(false)
                      setSummaryText(currentSummary?.content || '')
                    }}
                    className="text-xs"
                  >
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-main-view-fg/5 rounded-lg">
                <p className="text-sm text-main-view-fg/80 whitespace-pre-wrap">
                  {currentSummary?.content || '暂无总结，点击刷新按钮生成'}
                </p>
                {currentSummary?.autoGenerated && (
                  <Badge variant="outline" className="mt-2 text-[10px]">
                    AI 生成
                  </Badge>
                )}
              </div>
            )}
            
            {/* 关键点 */}
            {currentSummary?.keyPoints && currentSummary.keyPoints.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-main-view-fg">关键信息</h4>
                <div className="flex flex-wrap gap-1">
                  {currentSummary.keyPoints.map((point, index) => (
                    <Badge key={index} variant="secondary" className="text-[10px]">
                      {point}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* 规则标签页 */}
        <TabsContent value="rules" className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    rule.active
                      ? "bg-main-view-fg/5 border-main-view-fg/20"
                      : "bg-main-view-fg/[0.02] border-main-view-fg/10"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-medium text-main-view-fg">
                          {rule.name}
                        </h5>
                        <Badge
                          variant={rule.type === 'global' ? 'default' : 'secondary'}
                          className="text-[10px] px-1 h-4"
                        >
                          {rule.type === 'global' ? '全局' : rule.type === 'project' ? '项目' : '对话'}
                        </Badge>
                      </div>
                      <p className="text-xs text-main-view-fg/60">
                        {rule.description}
                      </p>
                      <p className="text-xs text-main-view-fg/80 italic">
                        "{rule.content}"
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={rule.active}
                        onCheckedChange={() => toggleRule(rule.id)}
                        className="scale-75"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <IconTrash className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  // TODO: 打开添加规则对话框
                  console.log('Add rule')
                }}
              >
                <IconPlus className="w-3 h-3 mr-1" />
                添加规则
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* 资源标签页 */}
        <TabsContent value="resources" className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-3">
              {/* 固定资源 */}
              {pinnedResources.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-main-view-fg/60 uppercase">固定</h4>
                  {pinnedResources.map((resource) => (
                    <ResourceItem
                      key={resource.id}
                      resource={resource}
                      onPin={() => unpinResource(resource.id)}
                      isPinned={true}
                    />
                  ))}
                </div>
              )}
              
              {/* 其他资源 */}
              {unpinnedResources.length > 0 && (
                <div className="space-y-2">
                  {pinnedResources.length > 0 && (
                    <h4 className="text-xs font-medium text-main-view-fg/60 uppercase">其他</h4>
                  )}
                  {unpinnedResources.map((resource) => (
                    <ResourceItem
                      key={resource.id}
                      resource={resource}
                      onPin={() => pinResource(resource.id)}
                      isPinned={false}
                    />
                  ))}
                </div>
              )}
              
              {resources.length === 0 && (
                <div className="text-center py-8">
                  <IconFiles className="w-8 h-8 text-main-view-fg/20 mx-auto mb-2" />
                  <p className="text-sm text-main-view-fg/50">暂无引用资源</p>
                  <p className="text-xs text-main-view-fg/40 mt-1">
                    在输入框中使用 @ 引用资源
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* 知识标签页 */}
        <TabsContent value="knowledge" className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-3">
              {knowledge.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-main-view-fg/5 rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <h5 className="text-sm font-medium text-main-view-fg">
                      {item.title}
                    </h5>
                    <Badge variant="outline" className="text-[10px]">
                      {item.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-main-view-fg/70 line-clamp-3">
                    {item.content}
                  </p>
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {knowledge.length === 0 && (
                <div className="text-center py-8">
                  <IconBook className="w-8 h-8 text-main-view-fg/20 mx-auto mb-2" />
                  <p className="text-sm text-main-view-fg/50">暂无项目知识</p>
                  <p className="text-xs text-main-view-fg/40 mt-1">
                    添加文档、规范等知识内容
                  </p>
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  // TODO: 打开添加知识对话框
                  console.log('Add knowledge')
                }}
              >
                <IconPlus className="w-3 h-3 mr-1" />
                添加知识
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// 资源项组件
function ResourceItem({
  resource,
  onPin,
  isPinned,
}: {
  resource: any
  onPin: () => void
  isPinned: boolean
}) {
  const getResourceIcon = () => {
    switch (resource.type) {
      case 'file':
        return <IconFiles className="w-4 h-4" />
      case 'mcp':
        return <IconSettings className="w-4 h-4" />
      default:
        return <IconFiles className="w-4 h-4" />
    }
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-main-view-fg/[0.02] hover:bg-main-view-fg/5 rounded-md transition-colors">
      <div className="text-main-view-fg/60">{getResourceIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-main-view-fg truncate">{resource.name}</p>
        {resource.path && (
          <p className="text-xs text-main-view-fg/50 truncate">{resource.path}</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={onPin}
      >
        {isPinned ? (
          <IconPinFilled className="w-3 h-3" />
        ) : (
          <IconPin className="w-3 h-3" />
        )}
      </Button>
    </div>
  )
}