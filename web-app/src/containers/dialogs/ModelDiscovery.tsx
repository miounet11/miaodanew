import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { IconRefresh, IconLoader, IconRobot, IconSearch } from '@tabler/icons-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useServiceHub } from '@/hooks/useServiceHub'

interface ModelDiscoveryProps {
  provider: ModelProvider
  onModelsAdded?: (models: Model[]) => void
}

interface DiscoveredModel {
  id: string
  name: string
  type: ModelType
  capabilities: string[]
  selected: boolean
}

enum ModelType {
  CHAT = 'chat',
  COMPLETION = 'completion',
  EMBEDDING = 'embedding',
  VISION = 'vision',
  CODE = 'code',
  REASONING = 'reasoning',
  MULTIMODAL = 'multimodal',
  OTHER = 'other'
}

const MODEL_TYPE_LABELS: Record<ModelType, string> = {
  [ModelType.CHAT]: '对话模型',
  [ModelType.COMPLETION]: '补全模型',
  [ModelType.EMBEDDING]: '嵌入模型',
  [ModelType.VISION]: '视觉模型',
  [ModelType.CODE]: '代码模型',
  [ModelType.REASONING]: '推理模型',
  [ModelType.MULTIMODAL]: '多模态模型',
  [ModelType.OTHER]: '其他模型'
}

const MODEL_TYPE_COLORS: Record<ModelType, string> = {
  [ModelType.CHAT]: 'bg-blue-100 text-blue-800',
  [ModelType.COMPLETION]: 'bg-green-100 text-green-800',
  [ModelType.EMBEDDING]: 'bg-purple-100 text-purple-800',
  [ModelType.VISION]: 'bg-orange-100 text-orange-800',
  [ModelType.CODE]: 'bg-gray-100 text-gray-800',
  [ModelType.REASONING]: 'bg-red-100 text-red-800',
  [ModelType.MULTIMODAL]: 'bg-indigo-100 text-indigo-800',
  [ModelType.OTHER]: 'bg-yellow-100 text-yellow-800'
}

function getModelType(modelId: string): ModelType {
  const id = modelId.toLowerCase()
  
  if (id.includes('gpt') || id.includes('claude') || id.includes('chat') || id.includes('gemini')) {
    return ModelType.CHAT
  }
  if (id.includes('embedding') || id.includes('embed')) {
    return ModelType.EMBEDDING
  }
  if (id.includes('vision') || id.includes('dall-e') || id.includes('stable-diffusion')) {
    return ModelType.VISION
  }
  if (id.includes('code') || id.includes('copilot') || id.includes('codex')) {
    return ModelType.CODE
  }
  if (id.includes('reasoning') || id.includes('r1') || id.includes('think')) {
    return ModelType.REASONING
  }
  if (id.includes('multimodal') || id.includes('multi')) {
    return ModelType.MULTIMODAL
  }
  if (id.includes('completion') || id.includes('davinci') || id.includes('babbage')) {
    return ModelType.COMPLETION
  }
  
  return ModelType.OTHER
}

export function ModelDiscovery({ provider, onModelsAdded }: ModelDiscoveryProps) {
  const serviceHub = useServiceHub()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [discoveredModels, setDiscoveredModels] = useState<DiscoveredModel[]>([])
  const [typeFilter, setTypeFilter] = useState<ModelType | null>(null)
  const [searchFilter, setSearchFilter] = useState('')

  const handleDiscoverModels = async () => {
    if (!provider.base_url) {
      toast.error('错误', {
        description: '请先配置 Base URL'
      })
      return
    }

    setLoading(true)
    try {
      const modelIds = await serviceHub.providers().fetchModelsFromProvider(provider)
      
      const models: DiscoveredModel[] = modelIds.map(id => ({
        id,
        name: id,
        type: getModelType(id),
        capabilities: ['completion'], // Default capability
        selected: false
      }))

      setDiscoveredModels(models)
      toast.success('发现模型', {
        description: `发现 ${models.length} 个模型`
      })
    } catch (error) {
      console.error('Error discovering models:', error)
      toast.error('获取模型失败', {
        description: error instanceof Error ? error.message : '未知错误'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = (type?: ModelType) => {
    setDiscoveredModels(models => 
      models.map(model => ({
        ...model,
        selected: type ? (model.type === type ? true : model.selected) : true
      }))
    )
  }

  const handleDeselectAll = (type?: ModelType) => {
    setDiscoveredModels(models => 
      models.map(model => ({
        ...model,
        selected: type ? (model.type === type ? false : model.selected) : false
      }))
    )
  }

  const handleToggleModel = (modelId: string) => {
    setDiscoveredModels(models => 
      models.map(model => 
        model.id === modelId ? { ...model, selected: !model.selected } : model
      )
    )
  }

  const handleAddSelectedModels = async () => {
    const selectedModels = discoveredModels.filter(model => model.selected)
    
    if (selectedModels.length === 0) {
      toast.error('错误', {
        description: '请至少选择一个模型'
      })
      return
    }

    const newModels: Model[] = selectedModels.map(model => ({
      id: model.id,
      model: model.id,
      name: model.name,
      capabilities: model.capabilities,
      version: '1.0',
      description: `${MODEL_TYPE_LABELS[model.type]} - ${model.name}`
    }))

    onModelsAdded?.(newModels)
    setOpen(false)
    setDiscoveredModels([])
    
    toast.success('添加成功', {
      description: `已添加 ${selectedModels.length} 个模型`
    })
  }


  const modelsByType = discoveredModels.reduce((acc, model) => {
    if (!acc[model.type]) {
      acc[model.type] = []
    }
    acc[model.type].push(model)
    return acc
  }, {} as Record<ModelType, DiscoveredModel[]>)

  const selectedCount = discoveredModels.filter(model => model.selected).length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="link"
          size="sm"
          className="hover:no-underline"
        >
          <div className="cursor-pointer flex items-center justify-center rounded hover:bg-main-view-fg/15 bg-main-view-fg/10 transition-all duration-200 ease-in-out px-1.5 py-1 gap-1">
            <IconSearch size={18} className="text-main-view-fg/50" />
            <span className="text-main-view-fg/70">发现模型</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconRobot size={20} />
            发现模型 - {provider.provider}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Action Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDiscoverModels}
              disabled={loading}
            >
              {loading ? (
                <IconLoader size={16} className="animate-spin mr-2" />
              ) : (
                <IconRefresh size={16} className="mr-2" />
              )}
              {loading ? '获取中...' : '获取模型'}
            </Button>
            
            {discoveredModels.length > 0 && (
              <>
                <div className="h-4 w-px bg-border" />
                <Button variant="outline" size="sm" onClick={() => handleSelectAll()}>
                  全选
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDeselectAll()}>
                  全不选
                </Button>
                <div className="flex-1" />
                <div className="text-sm text-muted-foreground">
                  已选择 {selectedCount} / {discoveredModels.length} 个模型
                </div>
              </>
            )}
          </div>

          {/* Search and Filter */}
          {discoveredModels.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <input
                type="text"
                placeholder="搜索模型..."
                className="flex-1 min-w-[200px] px-3 py-1.5 border border-border rounded-md text-sm"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
              <select
                className="px-3 py-1.5 border border-border rounded-md text-sm"
                value={typeFilter || ''}
                onChange={(e) => setTypeFilter(e.target.value as ModelType || null)}
              >
                <option value="">所有类型</option>
                {Object.entries(MODEL_TYPE_LABELS).map(([type, label]) => (
                  <option key={type} value={type}>
                    {label} ({modelsByType[type as ModelType]?.length || 0})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Model List */}
          <div className="flex-1 overflow-hidden">
            {discoveredModels.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {loading ? '正在获取模型...' : '点击"获取模型"按钮开始发现可用模型'}
              </div>
            ) : (
              <div className="space-y-4 h-full overflow-y-auto">
                {Object.entries(modelsByType).map(([type, models]) => {
                  const typeModels = models.filter(model => 
                    (!typeFilter || model.type === typeFilter) &&
                    (!searchFilter || 
                      model.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                      model.id.toLowerCase().includes(searchFilter.toLowerCase())
                    )
                  )
                  
                  if (typeModels.length === 0) return null
                  
                  const selectedInType = typeModels.filter(model => model.selected).length
                  
                  return (
                    <div key={type} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge 
                          variant="secondary" 
                          className={cn('text-xs', MODEL_TYPE_COLORS[type as ModelType])}
                        >
                          {MODEL_TYPE_LABELS[type as ModelType]} ({typeModels.length})
                        </Badge>
                        <div className="flex-1" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectAll(type as ModelType)}
                          disabled={selectedInType === typeModels.length}
                        >
                          全选此类型
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeselectAll(type as ModelType)}
                          disabled={selectedInType === 0}
                        >
                          取消全选
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {typeModels.map(model => (
                          <div
                            key={model.id}
                            className={cn(
                              'flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors',
                              model.selected 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:bg-muted/50'
                            )}
                            onClick={() => handleToggleModel(model.id)}
                          >
                            <Checkbox 
                              checked={model.selected}
                              onCheckedChange={() => handleToggleModel(model.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate" title={model.name}>
                                {model.name}
                              </div>
                              <div className="text-xs text-muted-foreground truncate" title={model.id}>
                                {model.id}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {discoveredModels.length > 0 && (
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button 
                onClick={handleAddSelectedModels}
                disabled={selectedCount === 0}
              >
                添加选中的模型 ({selectedCount})
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}