import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  IconFile,
  IconFileCode,
  IconBulb,
  IconBook,
  IconHistory,
  IconSettings,
  IconSearch,
  IconServer,
  IconTool,
} from '@tabler/icons-react'
// import { ScrollArea } from '@/components/ui/scroll-area' // 使用原生滚动
import { Badge } from '@/components/ui/badge'
import { useContextManager } from '@/lib/contextManager'
import { useServiceHub } from '@/hooks/useServiceHub'

export interface MentionItem {
  id: string
  type: 'file' | 'rule' | 'knowledge' | 'context' | 'mcp' | 'mcp-tool' | 'resource'
  name: string
  description?: string
  path?: string
  server?: string
  toolName?: string
  metadata?: any
}

interface MentionSelectorProps {
  isOpen: boolean
  query: string
  position: { x: number; y: number }
  onSelect: (item: MentionItem) => void
  onClose: () => void
  containerRef?: React.RefObject<HTMLElement>
}

export function MentionSelector({
  isOpen,
  query,
  position,
  onSelect,
  onClose,
  containerRef,
}: MentionSelectorProps) {
  const [items, setItems] = useState<MentionItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const selectorRef = useRef<HTMLDivElement>(null)
  const { rules, knowledge, resources } = useContextManager()
  const serviceHub = useServiceHub()

  // 获取所有可提及的项目
  const fetchMentionItems = useCallback(async () => {
    setLoading(true)
    const allItems: MentionItem[] = []
    
    try {
      // 1. 添加规则
      rules
        .filter(rule => rule.active)
        .forEach(rule => {
          allItems.push({
            id: rule.id,
            type: 'rule',
            name: rule.name,
            description: rule.description,
          })
        })
      
      // 2. 添加知识库
      knowledge.forEach(item => {
        allItems.push({
          id: item.id,
          type: 'knowledge',
          name: item.title,
          description: item.content.slice(0, 100),
        })
      })
      
      // 3. 添加已有资源
      resources.forEach(resource => {
        allItems.push({
          id: resource.id,
          type: 'resource',
          name: resource.name,
          description: resource.path,
          path: resource.path,
        })
      })
      
      // 4. 获取 MCP 工具和服务器
      try {
        // 获取 MCP 工具
        const mcpTools = await serviceHub.mcp().getTools()
        if (mcpTools && mcpTools.length > 0) {
          mcpTools.forEach(tool => {
            allItems.push({
              id: `mcp-tool-${tool.name}`,
              type: 'mcp-tool',
              name: tool.name,
              description: tool.description,
              server: tool.server,
              toolName: tool.name,
              metadata: tool,
            })
          })
        }
        
        // 获取已连接的 MCP 服务器
        const connectedServers = await serviceHub.mcp().getConnectedServers()
        if (connectedServers && connectedServers.length > 0) {
          connectedServers.forEach(server => {
            allItems.push({
              id: `mcp-server-${server}`,
              type: 'mcp',
              name: server,
              description: 'MCP 服务器',
              server: server,
            })
          })
        }
      } catch (error) {
        console.error('Failed to fetch MCP resources:', error)
      }
      
      // 5. 添加一些快捷选项
      allItems.push({
        id: 'claude-md',
        type: 'file',
        name: 'CLAUDE.md',
        description: '项目上下文文档',
        path: './CLAUDE.md',
      })
      
      // 过滤匹配的项目
      const filtered = query
        ? allItems.filter(item =>
            item.name.toLowerCase().includes(query.toLowerCase()) ||
            item.description?.toLowerCase().includes(query.toLowerCase())
          )
        : allItems.slice(0, 10) // 默认显示前10个
      
      setItems(filtered)
    } finally {
      setLoading(false)
    }
  }, [query, rules, knowledge, resources, serviceHub])

  // 当打开或查询变化时，获取项目
  useEffect(() => {
    if (isOpen) {
      fetchMentionItems()
      setSelectedIndex(0)
    }
  }, [isOpen, query, fetchMentionItems])

  // 键盘导航
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % items.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev - 1 + items.length) % items.length)
          break
        case 'Enter':
          e.preventDefault()
          if (items[selectedIndex]) {
            onSelect(items[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
        case 'Tab':
          e.preventDefault()
          if (items[selectedIndex]) {
            onSelect(items[selectedIndex])
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, items, selectedIndex, onSelect, onClose])

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const getItemIcon = (type: MentionItem['type']) => {
    switch (type) {
      case 'file':
        return <IconFileCode className="w-4 h-4" />
      case 'rule':
        return <IconBulb className="w-4 h-4" />
      case 'knowledge':
        return <IconBook className="w-4 h-4" />
      case 'context':
        return <IconHistory className="w-4 h-4" />
      case 'mcp':
        return <IconServer className="w-4 h-4" />
      case 'mcp-tool':
        return <IconTool className="w-4 h-4" />
      case 'resource':
        return <IconFile className="w-4 h-4" />
      default:
        return <IconSettings className="w-4 h-4" />
    }
  }

  const getTypeLabel = (type: MentionItem['type']) => {
    switch (type) {
      case 'file':
        return '文件'
      case 'rule':
        return '规则'
      case 'knowledge':
        return '知识'
      case 'context':
        return '上下文'
      case 'mcp':
        return 'MCP 服务器'
      case 'mcp-tool':
        return 'MCP 工具'
      case 'resource':
        return '资源'
      default:
        return '其他'
    }
  }

  // 计算位置
  const containerRect = containerRef?.current?.getBoundingClientRect()
  const adjustedPosition = {
    x: containerRect ? position.x - containerRect.left : position.x,
    y: containerRect ? position.y - containerRect.top - 200 : position.y - 200,
  }

  return (
    <div
      ref={selectorRef}
      className={cn(
        'absolute z-50 w-80 bg-main-view border border-main-view-fg/10 rounded-lg shadow-xl',
        'animate-in fade-in-0 zoom-in-95'
      )}
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      {/* 搜索提示 */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-main-view-fg/10">
        <IconSearch className="w-4 h-4 text-main-view-fg/50" />
        <span className="text-sm text-main-view-fg/70">
          {query ? `搜索 "${query}"` : '输入关键词搜索'}
        </span>
      </div>

      {/* 项目列表 */}
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-main-view-fg/50">
            加载中...
          </div>
        ) : items.length === 0 ? (
          <div className="p-4 text-center text-sm text-main-view-fg/50">
            没有找到匹配的项目
          </div>
        ) : (
          <div className="p-1">
            {items.map((item, index) => (
              <button
                key={item.id}
                className={cn(
                  'w-full flex items-start gap-3 px-3 py-2 rounded-md transition-colors text-left',
                  selectedIndex === index
                    ? 'bg-main-view-fg/10'
                    : 'hover:bg-main-view-fg/5'
                )}
                onClick={() => onSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="text-main-view-fg/60 mt-0.5">
                  {getItemIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-main-view-fg truncate">
                      {item.name}
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1 h-4">
                      {getTypeLabel(item.type)}
                    </Badge>
                    {item.server && (
                      <Badge variant="outline" className="text-[10px] px-1 h-4">
                        {item.server}
                      </Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-main-view-fg/60 truncate mt-0.5">
                      {item.description}
                    </p>
                  )}
                  {item.path && (
                    <p className="text-xs text-main-view-fg/40 truncate">
                      {item.path}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 快捷键提示 */}
      <div className="flex items-center gap-3 px-3 py-2 border-t border-main-view-fg/10 text-xs text-main-view-fg/50">
        <span>↑↓ 导航</span>
        <span>↵ 选择</span>
        <span>Esc 关闭</span>
      </div>
    </div>
  )
}