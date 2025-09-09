[根目录](../CLAUDE.md) > **core**

# @miaoda/core - 核心功能库

> Miaoda 应用的核心功能库，提供类型定义、浏览器扩展、AI 推理引擎等基础能力

## 模块职责

Core 模块是 Miaoda 生态系统的基础层，负责：

- 🔧 **类型系统**：为整个应用提供 TypeScript 类型定义
- 🌐 **浏览器扩展**：实现浏览器环境下的核心功能
- 🤖 **AI 引擎**：提供多种 AI 推理引擎的抽象和实现
- 📡 **事件系统**：基于 RxJS 的响应式事件处理
- 💾 **文件系统**：浏览器环境下的文件操作抽象
- 🧩 **扩展管理**：扩展插件的加载和管理机制

## 入口与启动

### 主入口文件

- **主入口**: `src/index.ts` - 导出所有公共 API
- **浏览器入口**: `src/browser/index.ts` - 浏览器特定功能
- **类型入口**: `src/types/index.ts` - 所有类型定义

### 构建配置

```typescript
// 构建入口 - rolldown.config.mjs
export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'esm'
  }
}
```

## 对外接口

### 核心 API

| API 类别 | 导出路径 | 功能描述 |
|----------|----------|----------|
| **类型定义** | `@miaoda/core/types` | 所有 TypeScript 类型和接口 |
| **浏览器核心** | `@miaoda/core/browser` | 浏览器环境核心功能 |
| **事件系统** | `@miaoda/core/events` | RxJS 基础的事件处理 |
| **文件系统** | `@miaoda/core/fs` | 文件操作抽象 |
| **扩展系统** | `@miaoda/core/extension` | 扩展加载和管理 |

### 核心类型定义

```typescript
// 主要实体类型
export type {
  // 助手相关
  AssistantEntity,
  AssistantInterface,
  AssistantEvent,
  
  // 消息相关
  MessageEntity,
  MessageInterface, 
  MessageEvent,
  MessageRequestType,
  
  // 模型相关
  ModelEntity,
  ModelInterface,
  ModelEvent,
  ModelImport,
  ModelSource,
  
  // 推理相关
  InferenceEntity,
  InferenceInterface,
  InferenceEvent,
  
  // 配置相关
  AppConfigEntity,
  AppConfigEvent,
  
  // 线程相关
  ThreadEntity,
  ThreadInterface,
  
  // 其他
  SystemResourceInfo,
  SettingComponent
} from './types'
```

### AI 推理引擎

```typescript
// 引擎抽象
import { AIEngine, EngineManager } from '@miaoda/core/browser/extensions/engines'

// 支持的引擎类型
- LocalOAIEngine: 本地 OpenAI 兼容引擎
- RemoteOAIEngine: 远程 OpenAI 兼容引擎  
- OAIEngine: 通用 OpenAI 引擎基类
```

## 关键依赖与配置

### 核心依赖

```json
{
  "dependencies": {
    "rxjs": "^7.8.1",           // 响应式编程
    "ulidx": "^2.3.0"           // 唯一 ID 生成
  },
  "devDependencies": {
    "typescript": "^5.8.3",      // TypeScript 编译
    "rolldown": "1.0.0-beta.1",  // 现代打包工具
    "vitest": "^2.1.8"           // 测试框架
  }
}
```

### TypeScript 配置

- **目标版本**: ES2022
- **模块系统**: ESNext  
- **严格模式**: 全面启用
- **路径映射**: 支持相对路径导入

### 构建配置

- **构建工具**: Rolldown (替代 Rollup)
- **输出格式**: ESM
- **类型生成**: 自动生成 `.d.ts` 文件
- **Tree Shaking**: 完全支持

## 数据模型

### 核心实体关系

```typescript
// 助手 -> 线程 -> 消息 关系链
AssistantEntity {
  id: string
  name: string
  instructions: string
  model: ModelEntity
}

ThreadEntity {
  id: string
  title: string
  assistantId: string
  messages: MessageEntity[]
}

MessageEntity {
  id: string  
  threadId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: number
}
```

### 模型定义结构

```typescript
ModelEntity {
  id: string
  name: string
  description?: string
  format: 'gguf' | 'safetensors' | 'bin'
  source: ModelSource
  parameters: {
    max_tokens?: number
    temperature?: number
    top_p?: number
    // ...更多参数
  }
}
```

## 测试与质量

### 测试策略

- **单元测试覆盖**: 所有公共 API 和核心逻辑
- **类型测试**: TypeScript 类型正确性验证
- **集成测试**: 与浏览器环境的集成测试

### 测试工具链

```bash
# 运行测试
yarn test

# 测试覆盖率
yarn test:coverage

# 监听模式
yarn test:watch
```

### 质量保证

- **ESLint**: 代码风格检查
- **TypeScript**: 静态类型检查  
- **Vitest**: 现代测试框架
- **Coverage**: 测试覆盖率报告

## 常见问题 (FAQ)

### Q: 如何添加新的类型定义？

A: 在 `src/types/` 对应子目录下添加类型文件，并在相应的 `index.ts` 中导出。

### Q: 如何实现新的 AI 引擎？

A: 继承 `AIEngine` 基类并实现必要方法：

```typescript
import { AIEngine } from '@miaoda/core/browser/extensions/engines'

export class CustomEngine extends AIEngine {
  async inference(request: InferenceRequest): Promise<InferenceResponse> {
    // 实现推理逻辑
  }
}
```

### Q: 如何处理异步事件？

A: 使用 RxJS 观察者模式：

```typescript
import { events } from '@miaoda/core/browser'

// 监听事件
events.on('model:loaded', (model) => {
  console.log('模型已加载:', model.name)
})

// 发送事件
events.emit('model:loading', { modelId: 'gpt-3.5' })
```

### Q: 如何在浏览器环境访问文件系统？

A: 使用 Core 提供的文件系统抽象：

```typescript
import { fs } from '@miaoda/core/browser'

// 读取文件
const content = await fs.readFile('/path/to/file')

// 写入文件
await fs.writeFile('/path/to/file', content)
```

## 相关文件清单

### 核心源码

```
src/
├── index.ts                    # 主入口
├── types/                      # 类型定义
│   ├── assistant/             # 助手相关类型
│   ├── message/               # 消息相关类型
│   ├── model/                 # 模型相关类型
│   ├── inference/             # 推理相关类型
│   ├── thread/                # 线程相关类型
│   ├── config/                # 配置相关类型
│   └── index.ts               # 类型导出
├── browser/                   # 浏览器实现
│   ├── core.ts               # 核心功能
│   ├── events.ts             # 事件系统
│   ├── fs.ts                 # 文件系统
│   ├── extension.ts          # 扩展系统
│   ├── extensions/           # 内置扩展
│   │   ├── engines/         # AI 引擎
│   │   ├── assistant.ts     # 助手扩展
│   │   ├── conversational.ts # 对话扩展
│   │   └── inference.ts     # 推理扩展
│   └── models/              # 模型管理
│       ├── manager.ts       # 模型管理器
│       └── utils.ts         # 工具函数
└── test/                     # 测试设置
    └── setup.ts             # 测试环境配置
```

### 配置文件

```
├── package.json              # 包配置
├── tsconfig.json             # TypeScript 配置
├── rolldown.config.mjs       # 构建配置
├── vitest.config.ts          # 测试配置
└── eslint.config.js          # 代码检查配置
```

## 变更记录 (Changelog)

### 2025-09-08 - 模块文档初始化

- 📝 创建 Core 模块完整技术文档
- 🔧 梳理类型系统和 API 接口
- 🧪 整理测试策略和质量保证流程
- 📋 建立常见问题解答和文件清单