import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useContextManager, type Rule, type Resource } from '@/lib/contextManager'
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
  IconX,
  IconSettings,
  IconRefresh,
  IconCheck,
  IconGlobe,
  IconMessage,
  IconChevronDown,
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
    // rules, // 临时注释未使用的变量
    resources,
    knowledge,
    generateSummary,
    updateSummary,
    addRule,
    updateRule,
    toggleRule,
    deleteRule,
    // addResource, // 临时注释未使用的变量
    updateResource,
    removeResource,
    pinResource,
    unpinResource,
    togglePanel,
    setActiveTab,
    getPanelState,
    getCurrentSummary,
    getActiveRules,
    getGlobalRules,
    getThreadRules,
    getGlobalResources,
    getThreadResources,
    isContextEnabled,
  } = useContextManager()
  
  // 获取当前线程的 UI 状态
  const panelState = threadId ? getPanelState(threadId) : {
    isPanelOpen: false,
    activeTab: 'summary' as const,
    currentSummary: null
  }
  const { isPanelOpen, activeTab } = panelState
  const currentSummary = threadId ? getCurrentSummary(threadId) : null

  const [editingSummary, setEditingSummary] = useState(false)
  const [summaryText, setSummaryText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null)
  const [showGlobalRules, setShowGlobalRules] = useState(true)
  const [showThreadRules, setShowThreadRules] = useState(true)
  const [showGlobalResources, setShowGlobalResources] = useState(true)
  const [showThreadResources, setShowThreadResources] = useState(true)

  // 检查智能上下文是否开启 - 必须在数据获取之前
  const contextEnabled = threadId ? isContextEnabled(threadId) : false
  if (!contextEnabled || !isPanelOpen) {
    return null
  }

  // 只有在智能上下文开启时才获取数据
  const activeRules = getActiveRules(threadId)
  const globalRules = getGlobalRules()
  const threadRules = threadId ? getThreadRules(threadId) : []
  const globalResources = getGlobalResources()
  const threadResources = threadId ? getThreadResources(threadId) : []
  // const pinnedResources = resources.filter(r => r.pinned) // 临时注释未使用的变量
  // const unpinnedResources = resources.filter(r => !r.pinned) // 临时注释未使用的变量

  // 移除自动生成总结，改为用户手动触发
  // useEffect(() => {
  //   if (threadId && messages.length > 0 && !currentSummary) {
  //     handleGenerateSummary()
  //   }
  // }, [threadId, messages.length])

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
                  onClick={() => threadId && togglePanel(threadId)}
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
      <Tabs value={activeTab} onValueChange={(v) => threadId && setActiveTab(threadId, v as any)} className="flex-1 flex flex-col h-[calc(100%-64px)]">
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
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-main-view-fg">对话总结</h4>
              <div className="flex items-center gap-1">
                {!currentSummary && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateSummary}
                    disabled={isGenerating || !threadId || messages.length === 0}
                    className="text-xs h-7"
                  >
                    {isGenerating ? (
                      <>
                        <IconRefresh className="w-3 h-3 mr-1 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <IconBrain className="w-3 h-3 mr-1" />
                        生成总结
                      </>
                    )}
                  </Button>
                )}
                {currentSummary && !editingSummary && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setEditingSummary(true)}
                  >
                    <IconEdit className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* 总结内容区域 */}
            {editingSummary ? (
              <div className="space-y-2">
                <TextareaAutosize
                  value={summaryText}
                  onChange={(e) => setSummaryText(e.target.value)}
                  className="w-full p-3 text-sm bg-main-view-fg/5 border border-main-view-fg/10 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-main-view-fg/20"
                  minRows={5}
                  maxRows={15}
                  placeholder="在此输入或编辑对话总结..."
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-main-view-fg/50">
                    总结将作为上下文发送（限制约1000 tokens）
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveSummary}
                      className="text-xs h-7"
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
                      className="text-xs h-7"
                    >
                      取消
                    </Button>
                  </div>
                </div>
              </div>
            ) : currentSummary ? (
              <div className="space-y-2">
                <div className="p-3 bg-main-view-fg/5 rounded-lg cursor-pointer hover:bg-main-view-fg/[0.07] transition-colors"
                     onClick={() => setEditingSummary(true)}>
                  <p className="text-sm text-main-view-fg/80 whitespace-pre-wrap">
                    {currentSummary.content}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {currentSummary.autoGenerated && (
                      <Badge variant="outline" className="text-[10px]">
                        AI 生成
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px]">
                      已保存
                    </Badge>
                  </div>
                  <span className="text-xs text-main-view-fg/50">
                    点击内容可编辑
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center space-y-3">
                <IconBrain className="w-12 h-12 text-main-view-fg/20 mx-auto" />
                <p className="text-sm text-main-view-fg/50">
                  {messages.length === 0 ? '开始对话后可生成总结' : '点击上方按钮生成对话总结'}
                </p>
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
            <div className="p-4 space-y-4">
              {/* 全局规则 */}
              {globalRules.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconGlobe className="w-4 h-4 text-main-view-fg/60" />
                      <h4 className="text-xs font-medium text-main-view-fg/60 uppercase">全局规则</h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => setShowGlobalRules(!showGlobalRules)}
                    >
                      <IconChevronDown className={cn("w-3 h-3 transition-transform", !showGlobalRules && "-rotate-90")} />
                    </Button>
                  </div>
                  {showGlobalRules && globalRules.map((rule) => (
                    <RuleItem
                      key={rule.id}
                      rule={rule}
                      isEditing={editingRuleId === rule.id}
                      onToggle={() => toggleRule(rule.id)}
                      onEdit={() => setEditingRuleId(rule.id)}
                      onSave={(updates) => {
                        updateRule(rule.id, updates)
                        setEditingRuleId(null)
                      }}
                      onCancel={() => setEditingRuleId(null)}
                      onDelete={() => deleteRule(rule.id)}
                    />
                  ))}
                </div>
              )}
              
              {/* 对话规则 */}
              {threadId && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconMessage className="w-4 h-4 text-main-view-fg/60" />
                      <h4 className="text-xs font-medium text-main-view-fg/60 uppercase">对话规则</h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => setShowThreadRules(!showThreadRules)}
                    >
                      <IconChevronDown className={cn("w-3 h-3 transition-transform", !showThreadRules && "-rotate-90")} />
                    </Button>
                  </div>
                  {showThreadRules && (
                    <>
                      {threadRules.map((rule) => (
                        <RuleItem
                          key={rule.id}
                          rule={rule}
                          isEditing={editingRuleId === rule.id}
                          onToggle={() => toggleRule(rule.id)}
                          onEdit={() => setEditingRuleId(rule.id)}
                          onSave={(updates) => {
                            updateRule(rule.id, updates)
                            setEditingRuleId(null)
                          }}
                          onCancel={() => setEditingRuleId(null)}
                          onDelete={() => deleteRule(rule.id)}
                        />
                      ))}
                      {threadRules.length === 0 && (
                        <p className="text-xs text-main-view-fg/40 text-center py-2">
                          暂无对话规则
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  const newRule = {
                    name: '新规则',
                    description: '规则描述',
                    type: (threadId ? 'thread' : 'global') as 'global' | 'thread',
                    threadId: threadId || undefined,
                    content: '规则内容',
                    priority: 0,
                    active: true,
                    editable: true,
                  }
                  addRule(newRule)
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
            <div className="p-4 space-y-4">
              {/* 全局资源 */}
              {globalResources.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconGlobe className="w-4 h-4 text-main-view-fg/60" />
                      <h4 className="text-xs font-medium text-main-view-fg/60 uppercase">全局资源</h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => setShowGlobalResources(!showGlobalResources)}
                    >
                      <IconChevronDown className={cn("w-3 h-3 transition-transform", !showGlobalResources && "-rotate-90")} />
                    </Button>
                  </div>
                  {showGlobalResources && globalResources.map((resource) => (
                    <ResourceItem
                      key={resource.id}
                      resource={resource}
                      isEditing={editingResourceId === resource.id}
                      onEdit={() => setEditingResourceId(resource.id)}
                      onSave={(updates) => {
                        updateResource(resource.id, updates)
                        setEditingResourceId(null)
                      }}
                      onCancel={() => setEditingResourceId(null)}
                      onPin={() => resource.pinned ? unpinResource(resource.id) : pinResource(resource.id)}
                      onDelete={() => removeResource(resource.id)}
                      isPinned={resource.pinned}
                    />
                  ))}
                </div>
              )}
              
              {/* 对话资源 */}
              {threadId && threadResources.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconMessage className="w-4 h-4 text-main-view-fg/60" />
                      <h4 className="text-xs font-medium text-main-view-fg/60 uppercase">对话资源</h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => setShowThreadResources(!showThreadResources)}
                    >
                      <IconChevronDown className={cn("w-3 h-3 transition-transform", !showThreadResources && "-rotate-90")} />
                    </Button>
                  </div>
                  {showThreadResources && threadResources.map((resource) => (
                    <ResourceItem
                      key={resource.id}
                      resource={resource}
                      isEditing={editingResourceId === resource.id}
                      onEdit={() => setEditingResourceId(resource.id)}
                      onSave={(updates) => {
                        updateResource(resource.id, updates)
                        setEditingResourceId(null)
                      }}
                      onCancel={() => setEditingResourceId(null)}
                      onPin={() => resource.pinned ? unpinResource(resource.id) : pinResource(resource.id)}
                      onDelete={() => removeResource(resource.id)}
                      isPinned={resource.pinned}
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

// 规则项组件
function RuleItem({
  rule,
  isEditing,
  onToggle,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: {
  rule: Rule
  isEditing: boolean
  onToggle: () => void
  onEdit: () => void
  onSave: (updates: Partial<Rule>) => void
  onCancel: () => void
  onDelete: () => void
}) {
  const [editData, setEditData] = useState({
    name: rule.name,
    description: rule.description,
    content: rule.content,
  })

  useEffect(() => {
    if (isEditing) {
      setEditData({
        name: rule.name,
        description: rule.description,
        content: rule.content,
      })
    }
  }, [isEditing, rule])

  if (isEditing) {
    return (
      <div className="p-3 rounded-lg border bg-main-view-fg/5 border-main-view-fg/20 space-y-2">
        <input
          type="text"
          value={editData.name}
          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          className="w-full px-2 py-1 text-sm bg-main-view-fg/5 border border-main-view-fg/10 rounded focus:outline-none focus:ring-1 focus:ring-main-view-fg/20"
          placeholder="规则名称"
        />
        <input
          type="text"
          value={editData.description}
          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          className="w-full px-2 py-1 text-xs bg-main-view-fg/5 border border-main-view-fg/10 rounded focus:outline-none focus:ring-1 focus:ring-main-view-fg/20"
          placeholder="规则描述"
        />
        <TextareaAutosize
          value={editData.content}
          onChange={(e) => setEditData({ ...editData, content: e.target.value })}
          className="w-full px-2 py-1 text-xs bg-main-view-fg/5 border border-main-view-fg/10 rounded resize-none focus:outline-none focus:ring-1 focus:ring-main-view-fg/20"
          placeholder="规则内容"
          minRows={2}
          maxRows={5}
        />
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            className="h-6 text-xs"
          >
            取消
          </Button>
          <Button
            size="sm"
            onClick={() => onSave(editData)}
            className="h-6 text-xs"
          >
            <IconCheck className="w-3 h-3 mr-1" />
            保存
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
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
              {rule.type === 'global' ? '全局' : '对话'}
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
            onCheckedChange={onToggle}
            className="scale-75"
          />
          {rule.editable !== false && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onEdit}
            >
              <IconEdit className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onDelete}
          >
            <IconTrash className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// 资源项组件
function ResourceItem({
  resource,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onPin,
  onDelete,
  isPinned,
}: {
  resource: Resource
  isEditing: boolean
  onEdit: () => void
  onSave: (updates: Partial<Resource>) => void
  onCancel: () => void
  onPin: () => void
  onDelete: () => void
  isPinned: boolean
}) {
  const [editData, setEditData] = useState({
    name: resource.name,
    path: resource.path || '',
    content: resource.content || '',
  })

  useEffect(() => {
    if (isEditing) {
      setEditData({
        name: resource.name,
        path: resource.path || '',
        content: resource.content || '',
      })
    }
  }, [isEditing, resource])

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

  if (isEditing) {
    return (
      <div className="p-3 rounded-lg border bg-main-view-fg/5 border-main-view-fg/20 space-y-2">
        <input
          type="text"
          value={editData.name}
          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          className="w-full px-2 py-1 text-sm bg-main-view-fg/5 border border-main-view-fg/10 rounded focus:outline-none focus:ring-1 focus:ring-main-view-fg/20"
          placeholder="资源名称"
        />
        {resource.type === 'file' && (
          <input
            type="text"
            value={editData.path}
            onChange={(e) => setEditData({ ...editData, path: e.target.value })}
            className="w-full px-2 py-1 text-xs bg-main-view-fg/5 border border-main-view-fg/10 rounded focus:outline-none focus:ring-1 focus:ring-main-view-fg/20"
            placeholder="文件路径"
          />
        )}
        {resource.type !== 'file' && (
          <TextareaAutosize
            value={editData.content}
            onChange={(e) => setEditData({ ...editData, content: e.target.value })}
            className="w-full px-2 py-1 text-xs bg-main-view-fg/5 border border-main-view-fg/10 rounded resize-none focus:outline-none focus:ring-1 focus:ring-main-view-fg/20"
            placeholder="资源内容"
            minRows={2}
            maxRows={5}
          />
        )}
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            className="h-6 text-xs"
          >
            取消
          </Button>
          <Button
            size="sm"
            onClick={() => onSave(editData)}
            className="h-6 text-xs"
          >
            <IconCheck className="w-3 h-3 mr-1" />
            保存
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-main-view-fg/[0.02] hover:bg-main-view-fg/5 rounded-md transition-colors">
      <div className="text-main-view-fg/60">{getResourceIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm text-main-view-fg truncate">{resource.name}</p>
          <Badge
            variant={resource.scope === 'global' ? 'default' : 'secondary'}
            className="text-[10px] px-1 h-4"
          >
            {resource.scope === 'global' ? '全局' : '对话'}
          </Badge>
        </div>
        {resource.path && (
          <p className="text-xs text-main-view-fg/50 truncate">{resource.path}</p>
        )}
      </div>
      <div className="flex items-center gap-1">
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
        {resource.editable !== false && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onEdit}
          >
            <IconEdit className="w-3 h-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onDelete}
        >
          <IconTrash className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}