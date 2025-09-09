[根目录](../CLAUDE.md) > **extensions-web**

# @miaoda/extensions-web - Web 扩展功能

> 为 Miaoda Web 应用提供扩展功能和插件系统

## 模块职责

Extensions-web 模块为 Web 环境提供专门的扩展功能，负责：

- 🔌 **Web 扩展系统**：为 Web 应用提供插件架构
- 🌐 **浏览器适配**：处理浏览器环境特有的功能需求
- 📦 **模块化扩展**：可插拔的功能模块系统
- 🔗 **核心集成**：与 @miaoda/core 的无缝集成
- ⚡ **性能优化**：针对 Web 环境的性能优化扩展

## 入口与启动

### 模块入口

- **主入口**: `src/index.ts` - 导出所有 Web 扩展 API
- **类型入口**: `dist/index.d.ts` - TypeScript 类型定义
- **构建产物**: `dist/index.mjs` - ESM 格式的构建输出

### 依赖关系

```typescript
// 对等依赖
import type { Core } from '@miaoda/core'
import { useStore } from 'zustand'

// 模块导出
export * from './extensions'
export * from './utils'
export * from './types'
```

## 对外接口

### 主要导出

```typescript
// 扩展基类
export abstract class WebExtension {
  abstract name: string
  abstract version: string
  abstract activate(): Promise<void>
  abstract deactivate(): Promise<void>
}

// 扩展管理器
export class WebExtensionManager {
  register(extension: WebExtension): void
  unregister(extensionName: string): void
  getExtension(name: string): WebExtension | undefined
  getAllExtensions(): WebExtension[]
}

// 工具函数
export const extensionUtils = {
  isWebEnvironment(): boolean
  getBrowserInfo(): BrowserInfo
  getWebCapabilities(): WebCapabilities
}
```

### 扩展类型定义

```typescript
// Web 扩展接口
interface IWebExtension {
  readonly id: string
  readonly name: string
  readonly version: string
  readonly description?: string
  readonly dependencies?: string[]
  
  // 生命周期方法
  activate(context: WebExtensionContext): Promise<void>
  deactivate(): Promise<void>
  
  // 配置方法
  getConfiguration?(): ExtensionConfiguration
  updateConfiguration?(config: Partial<ExtensionConfiguration>): void
}

// Web 扩展上下文
interface WebExtensionContext {
  readonly api: WebExtensionAPI
  readonly storage: WebStorage
  readonly logger: Logger
  readonly eventBus: EventBus
}
```

## 关键依赖与配置

### 核心依赖

```json
{
  "peerDependencies": {
    "@miaoda/core": "*",        // 核心模块
    "zustand": "^5.0.0"         // 状态管理
  },
  "devDependencies": {
    "typescript": "^5.3.3",     // TypeScript
    "vite": "^5.0.0",          // 构建工具
    "vitest": "^2.0.0"         // 测试框架
  }
}
```

### 构建配置

```typescript
// vite.config.ts
export default defineConfig({
  lib: {
    entry: 'src/index.ts',
    name: 'MiaodaExtensionsWeb',
    formats: ['es'],
    fileName: 'index'
  },
  rollupOptions: {
    external: ['@miaoda/core', 'zustand'],
    output: {
      globals: {
        '@miaoda/core': 'MiaodaCore',
        'zustand': 'Zustand'
      }
    }
  }
})
```

### TypeScript 配置

- **目标版本**: ES2022
- **模块系统**: ESNext
- **声明文件**: 自动生成
- **路径解析**: 支持相对导入

## 数据模型

### 扩展注册表

```typescript
// 扩展注册信息
interface ExtensionRegistry {
  extensions: Map<string, WebExtension>
  metadata: Map<string, ExtensionMetadata>
  dependencies: Map<string, string[]>
  loadOrder: string[]
}

// 扩展元数据
interface ExtensionMetadata {
  id: string
  name: string
  version: string
  author?: string
  homepage?: string
  repository?: string
  license?: string
  keywords?: string[]
  engines?: {
    miaoda?: string
    node?: string
    browser?: string
  }
}
```

### 扩展配置

```typescript
// 扩展配置结构
interface ExtensionConfiguration {
  enabled: boolean
  autoStart: boolean
  priority: number
  settings: Record<string, any>
  permissions: ExtensionPermission[]
}

// 扩展权限
type ExtensionPermission = 
  | 'storage:read'
  | 'storage:write'
  | 'network:request'
  | 'dom:access'
  | 'events:listen'
  | 'events:emit'
```

### 事件系统

```typescript
// 扩展事件类型
type ExtensionEvent = 
  | 'extension:registered'
  | 'extension:activated'
  | 'extension:deactivated'
  | 'extension:error'
  | 'extension:configured'

// 事件数据
interface ExtensionEventData {
  extensionId: string
  extensionName: string
  timestamp: number
  data?: any
}
```

## 测试与质量

### 测试策略

- **单元测试**: 所有扩展基类和工具函数
- **集成测试**: 扩展管理器和生命周期测试
- **模拟测试**: 浏览器环境模拟测试

### 测试工具

```bash
# 运行测试
yarn test

# 类型检查
yarn typecheck

# 构建测试
yarn build
```

### 质量保证

- **TypeScript**: 严格类型检查
- **ESM 兼容**: 现代模块系统支持
- **Tree Shaking**: 支持按需导入
- **向后兼容**: 保持 API 稳定性

## 常见问题 (FAQ)

### Q: 如何创建一个 Web 扩展？

A: 继承 WebExtension 基类并实现必要方法：

```typescript
import { WebExtension, WebExtensionContext } from '@miaoda/extensions-web'

export class MyWebExtension extends WebExtension {
  name = 'my-web-extension'
  version = '1.0.0'
  
  async activate(context: WebExtensionContext): Promise<void> {
    // 扩展激活逻辑
    context.logger.info('扩展已激活')
  }
  
  async deactivate(): Promise<void> {
    // 扩展停用逻辑
    console.log('扩展已停用')
  }
}
```

### Q: 如何注册和使用扩展？

A: 通过扩展管理器注册：

```typescript
import { WebExtensionManager } from '@miaoda/extensions-web'
import { MyWebExtension } from './my-extension'

const manager = new WebExtensionManager()
const extension = new MyWebExtension()

// 注册扩展
manager.register(extension)

// 激活扩展
await extension.activate(context)
```

### Q: 如何在扩展中访问核心功能？

A: 通过扩展上下文访问：

```typescript
export class MyExtension extends WebExtension {
  async activate(context: WebExtensionContext): Promise<void> {
    // 访问 API
    const models = await context.api.getModels()
    
    // 访问存储
    const config = await context.storage.get('config')
    
    // 监听事件
    context.eventBus.on('model:loaded', this.onModelLoaded)
  }
  
  private onModelLoaded = (model: any) => {
    console.log('模型已加载:', model.name)
  }
}
```

### Q: 如何处理扩展依赖？

A: 在扩展元数据中声明依赖：

```typescript
export class MyExtension extends WebExtension {
  dependencies = ['core-extension', 'ui-extension']
  
  async activate(context: WebExtensionContext): Promise<void> {
    // 确保依赖已加载
    const coreExt = context.api.getExtension('core-extension')
    if (!coreExt) {
      throw new Error('Core extension not found')
    }
  }
}
```

## 相关文件清单

### 核心源码

```
src/
├── index.ts                   # 主入口文件
├── extensions/                # 扩展实现
│   ├── base/                 # 基础扩展类
│   │   ├── WebExtension.ts   # 扩展基类
│   │   └── index.ts          # 基类导出
│   ├── manager/              # 扩展管理
│   │   ├── WebExtensionManager.ts  # 管理器
│   │   ├── registry.ts       # 注册表
│   │   └── index.ts          # 管理导出
│   └── index.ts              # 扩展总导出
├── utils/                    # 工具函数
│   ├── browser.ts           # 浏览器检测
│   ├── capabilities.ts      # 能力检测
│   ├── storage.ts           # 存储工具
│   └── index.ts             # 工具导出
├── types/                   # 类型定义
│   ├── extension.ts         # 扩展类型
│   ├── context.ts           # 上下文类型
│   ├── events.ts            # 事件类型
│   └── index.ts             # 类型导出
└── __tests__/               # 测试文件
    ├── extensions.test.ts   # 扩展测试
    ├── manager.test.ts      # 管理器测试
    └── utils.test.ts        # 工具测试
```

### 配置文件

```
├── package.json              # 包配置
├── tsconfig.json             # TypeScript 配置
├── vite.config.ts            # Vite 构建配置
├── vitest.config.ts          # Vitest 测试配置
└── README.md                 # 模块说明
```

### 构建产物

```
dist/
├── index.mjs                 # ESM 构建输出
├── index.d.ts                # TypeScript 声明文件
└── types/                    # 详细类型声明
    ├── extension.d.ts
    ├── context.d.ts
    └── events.d.ts
```

## 变更记录 (Changelog)

### 2025-09-08 - 模块文档初始化

- 📝 创建 Extensions-web 模块技术文档
- 🔌 梳理扩展系统架构和 API 设计
- 🧪 建立测试策略和质量保证流程
- 📋 整理开发指南和最佳实践