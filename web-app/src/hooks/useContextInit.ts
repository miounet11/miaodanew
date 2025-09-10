/**
 * 上下文初始化 Hook
 * 负责初始化默认规则和加载 CLAUDE.md 文件
 */

import { useEffect, useRef } from 'react'
import { useContextManager, getDefaultRules } from '@/lib/contextManager'

export function useContextInit() {
  const initialized = useRef(false)
  const { rules, addRule, addKnowledge } = useContextManager()

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // 初始化默认规则（如果还没有规则）
    if (rules.length === 0) {
      const defaultRules = getDefaultRules()
      defaultRules.forEach(rule => {
        addRule(rule)
      })
      
      console.log('已初始化默认规则')
    }

    // 尝试加载 CLAUDE.md 文件
    loadProjectContext()
  }, [rules.length, addRule, addKnowledge])

  /**
   * 加载项目上下文文件（CLAUDE.md）
   */
  async function loadProjectContext() {
    try {
      // 尝试通过 fetch 加载 CLAUDE.md
      const response = await fetch('/CLAUDE.md')
      if (response.ok) {
        const content = await response.text()
        
        // 添加到知识库
        addKnowledge({
          title: 'CLAUDE.md - 项目上下文',
          content: content,
          type: 'documentation',
          tags: ['项目文档', '上下文', 'CLAUDE.md'],
          source: '/CLAUDE.md'
        })
        
        console.log('已加载 CLAUDE.md 项目上下文')
        
        // 解析并添加特定规则
        parseAndAddRules(content)
      }
    } catch (error) {
      console.log('未找到 CLAUDE.md 文件:', error)
    }
  }

  /**
   * 从 CLAUDE.md 内容中解析规则
   */
  function parseAndAddRules(content: string) {
    // 查找规则部分（查找 ## Rules 或 ## 规则 部分）
    const rulesMatch = content.match(/##\s*(Rules|规则|AI\s*Rules|AI\s*规则)([\s\S]*?)(?=##|$)/i)
    
    if (rulesMatch) {
      const rulesContent = rulesMatch[2]
      
      // 解析规则列表项
      const ruleItems = rulesContent.match(/[-*]\s+(.+)/g)
      
      if (ruleItems) {
        ruleItems.forEach((item, index) => {
          const ruleText = item.replace(/^[-*]\s+/, '').trim()
          
          // 跳过空行或太短的内容
          if (ruleText.length < 5) return
          
          addRule({
            name: `项目规则 ${index + 1}`,
            description: '从 CLAUDE.md 导入的规则',
            type: 'global',
            content: ruleText,
            priority: 5,
            active: true,
          })
        })
        
        console.log(`从 CLAUDE.md 导入了 ${ruleItems.length} 条规则`)
      }
    }

    // 查找重要指令部分
    const instructionsMatch = content.match(/##\s*(Important|重要|Instructions|指令)([\s\S]*?)(?=##|$)/i)
    
    if (instructionsMatch) {
      const instructionsContent = instructionsMatch[2].trim()
      
      if (instructionsContent.length > 10) {
        addRule({
          name: '项目重要指令',
          description: '从 CLAUDE.md 导入的重要指令',
          type: 'global',
          content: instructionsContent.slice(0, 500), // 限制长度
          priority: 1,
          active: true,
        })
      }
    }
  }

  return {
    loadProjectContext
  }
}

/**
 * 初始化全局规则
 */
export function initializeGlobalRules() {
  const { rules, addRule } = useContextManager.getState()
  
  if (rules.filter(r => r.type === 'global').length === 0) {
    const globalRules = [
      {
        name: '使用中文回复',
        description: '默认使用简体中文进行回复',
        type: 'global' as const,
        content: '请使用简体中文回复，除非用户明确要求使用其他语言',
        priority: 3,
        active: true,
      },
      {
        name: '代码安全',
        description: '确保代码安全性',
        type: 'global' as const,
        content: '不生成可能造成安全风险的代码，包括但不限于：硬编码密钥、SQL注入漏洞、XSS漏洞等',
        priority: 0,
        active: true,
      },
      {
        name: '遵循项目规范',
        description: '遵循项目既定的编码规范',
        type: 'global' as const,
        content: '生成的代码应遵循项目现有的编码规范，包括命名约定、文件组织、注释风格等',
        priority: 2,
        active: true,
      },
      {
        name: '保持简洁',
        description: '回答简洁明了',
        type: 'global' as const,
        content: '回答应当简洁明了，避免冗长的解释，除非用户明确要求详细说明',
        priority: 4,
        active: true,
      },
      {
        name: '主动提供帮助',
        description: '主动提供相关建议',
        type: 'global' as const,
        content: '在完成用户请求后，可以主动提供相关的优化建议或最佳实践',
        priority: 5,
        active: true,
      }
    ]
    
    globalRules.forEach(rule => addRule(rule))
    console.log('已初始化全局规则')
  }
}