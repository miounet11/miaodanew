[根目录](../CLAUDE.md) > **web-app**

# @miaoda/web-app - 主应用界面

> Miaoda 的主要用户界面，基于 React 19 构建的现代化 AI 对话应用

## 模块职责

Web-app 模块是 Miaoda 的主要用户界面层，负责：

- 🎨 **用户界面**：提供完整的 AI 对话界面体验
- 🧭 **路由管理**：基于 TanStack Router 的单页应用路由
- 🎪 **状态管理**：使用 Zustand 管理全局应用状态
- 🌍 **国际化**：支持中英文切换的多语言界面
- 📱 **响应式设计**：支持桌面端和移动端的自适应布局
- 🔌 **扩展集成**：与 core 和 extensions-web 模块的无缝集成

## 入口与启动

### 应用入口

- **主入口**: `src/main.tsx` - React 应用启动入口
- **路由根组件**: `src/routes/__root.tsx` - 应用布局和提供者
- **样式入口**: `src/index.css` - 全局样式和 Tailwind 配置
- **国际化配置**: `src/i18n/index.ts` - i18next 配置

### 开发启动

```bash
# 桌面应用开发模式
yarn dev

# Web 应用开发模式  
yarn dev:web-app

# 构建生产版本
yarn build:web
```

### 路由结构

```typescript
// 主要路由
- / (index.tsx)                   # 主对话界面
- /assistant                      # 助手管理
- /system-monitor                 # 系统监控
- /logs                          # 日志查看
- /threads/$threadId             # 对话线程详情
- /hub                          # 模型市场首页
- /hub/$modelId                 # 模型详情页
- /local-api-server/logs        # 本地 API 服务器日志
- /settings/*                   # 设置页面组
  ├── /settings/general         # 通用设置
  ├── /settings/appearance      # 外观设置
  ├── /settings/privacy         # 隐私设置
  ├── /settings/shortcuts       # 快捷键设置
  ├── /settings/hardware        # 硬件设置
  ├── /settings/extensions      # 扩展管理
  ├── /settings/mcp-servers     # MCP 服务器配置
  ├── /settings/https-proxy     # HTTPS 代理设置
  ├── /settings/local-api-server # 本地 API 服务器
  └── /settings/providers/*     # 提供商配置
```

## 对外接口

### 核心页面组件

| 路由 | 组件 | 功能描述 |
|------|------|----------|
| **/** | `routes/index.tsx` | 主对话界面，AI 聊天功能 |
| **/assistant** | `routes/assistant.tsx` | 助手配置和管理 |
| **/system-monitor** | `routes/system-monitor.tsx` | 系统资源监控 |
| **/logs** | `routes/logs.tsx` | 应用日志查看 |
| **/threads/$threadId** | `routes/threads/$threadId.tsx` | 对话线程详情 |
| **/hub** | `routes/hub/index.tsx` | 模型市场和下载 |
| **/hub/$modelId** | `routes/hub/$modelId.tsx` | 模型详情和下载 |
| **/settings/*** | `routes/settings/*.tsx` | 各种设置页面 |

### 服务层架构

Web-app 采用分层服务架构，通过适配器模式支持不同平台：

```typescript
// 服务层结构
src/services/
├── app/                    # 应用核心服务
│   ├── default.ts         # 默认实现
│   ├── tauri.ts          # Tauri 桌面端实现
│   ├── web.ts            # Web 端实现
│   └── types.ts          # 类型定义
├── assistants/           # 助手管理服务
├── core/                 # 核心功能服务
├── messages/             # 消息处理服务
├── models/               # 模型管理服务
├── providers/            # 提供商管理服务
├── threads/              # 对话线程服务
├── hardware/             # 硬件监控服务
├── events/               # 事件系统服务
├── mcp/                  # MCP 服务器集成
├── theme/                # 主题管理服务
├── window/               # 窗口管理服务
├── dialog/               # 对话框服务
├── deeplink/             # 深度链接服务
├── updater/              # 应用更新服务
├── analytic/             # 分析统计服务
└── index.ts              # 服务集成入口
```

### 共享组件库

```typescript
// UI 组件 (基于 Radix UI)
import {
  Button,
  Dialog,
  Dropdown,
  Progress,
  Slider,
  Switch,
  Tooltip
} from '@/components/ui'

// 业务组件
import {
  LeftPanel,          // 侧边栏面板
  ChatInput,          // 聊天输入框
  MessageList,        // 消息列表
  ModelSelector,      // 模型选择器
  LanguageSwitcher    // 语言切换器
} from '@/containers'
```

### Hooks API

```typescript
// 核心 Hooks
import {
  useChat,           // 聊天功能
  useModelLoad,      // 模型加载
  useCompletion,     // 文本补全
  useLeftPanel,      // 侧边栏控制
  useAnalytic,       // 分析统计
  useSmallScreen     // 响应式检测
} from '@/hooks'
```

## 关键依赖与配置

### 核心技术栈

```json
{
  "dependencies": {
    "react": "^19.0.0",                    // React 19
    "react-dom": "^19.0.0",               
    "@tanstack/react-router": "^1.116.0", // 路由管理
    "zustand": "^5.0.3",                  // 状态管理
    "i18next": "^25.0.1",                 // 国际化
    "react-i18next": "^15.5.1",
    "@tauri-apps/api": "^2.5.0",          // Tauri 集成
    "@radix-ui/react-*": "^1.*",          // UI 组件库
    "framer-motion": "^12.23.12",         // 动画库
    "lucide-react": "^0.536.0",           // 图标库
    "tailwindcss": "^4.1.4"               // 样式框架
  }
}
```

### 服务层配置

```typescript
// 服务适配器选择
const serviceConfig = {
  platform: IS_TAURI ? 'tauri' : 'web',
  services: {
    app: IS_TAURI ? TauriAppService : WebAppService,
    hardware: IS_TAURI ? TauriHardwareService : DefaultHardwareService,
    window: IS_TAURI ? TauriWindowService : WebWindowService,
    // 更多服务映射...
  }
}
```

### 构建配置

- **构建工具**: Vite 6.3.0
- **TypeScript**: 5.8.3 严格模式
- **样式处理**: Tailwind CSS 4.1.4
- **代码分割**: TanStack Router 自动代码分割
- **热重载**: Vite HMR + React Fast Refresh

### 环境变量

```typescript
// 构建时注入的环境变量
declare global {
  const IS_TAURI: boolean          // 是否在 Tauri 环境
  const IS_WEB_APP: boolean        // 是否为 Web 应用
  const IS_MACOS: boolean          // 是否为 macOS
  const VERSION: string            // 应用版本
  const MODEL_CATALOG_URL: string  // 模型目录 URL
}
```

## 数据模型

### 全局状态结构

```typescript
// Zustand Store 结构
interface AppState {
  // 用户设置
  settings: {
    theme: 'light' | 'dark' | 'system'
    language: 'zh' | 'en'
    appearance: AppearanceSettings
  }
  
  // 聊天状态
  chat: {
    activeThreadId: string | null
    messages: MessageEntity[]
    isLoading: boolean
    currentModel: ModelEntity | null
  }
  
  // UI 状态
  ui: {
    leftPanelOpen: boolean
    leftPanelSize: number
    isSmallScreen: boolean
  }
}
```

### 服务类型定义

```typescript
// 服务接口规范
interface ServiceInterface<T> {
  initialize(): Promise<void>
  cleanup(): Promise<void>
  getStatus(): ServiceStatus
  // 具体服务方法
}

// 硬件服务示例
interface HardwareService {
  getSystemInfo(): Promise<SystemInfo>
  getCpuUsage(): Promise<number>
  getMemoryUsage(): Promise<MemoryInfo>
  getGpuInfo(): Promise<GpuInfo[]>
}

// 消息服务示例
interface MessageService {
  sendMessage(message: MessageEntity): Promise<MessageEntity>
  getThreadMessages(threadId: string): Promise<MessageEntity[]>
  deleteMessage(messageId: string): Promise<boolean>
}
```

### 路由状态

```typescript
// TanStack Router 状态
interface RouterState {
  location: {
    pathname: string
    search: Record<string, any>
    hash: string
  }
  matches: RouteMatch[]
  pendingMatches: RouteMatch[]
}
```

### 主题和外观

```typescript
// 主题配置
interface ThemeConfig {
  primary: string
  secondary: string
  background: string
  foreground: string
  muted: string
  accent: string
  destructive: string
  border: string
  input: string
  ring: string
}
```

## 测试与质量

### 测试框架

```json
{
  "devDependencies": {
    "vitest": "^3.1.3",                      // 测试运行器
    "@testing-library/react": "^16.3.0",     // React 测试工具
    "@testing-library/jest-dom": "^6.6.3",   // DOM 断言
    "@testing-library/user-event": "^14.6.1", // 用户交互模拟
    "jsdom": "^26.1.0"                       // DOM 模拟环境
  }
}
```

### 测试策略

- **组件测试**: 所有 UI 组件的渲染和交互测试
- **Hook 测试**: 自定义 Hook 的逻辑测试
- **服务测试**: 各服务层的单元测试
- **路由测试**: 页面路由和导航测试
- **集成测试**: 页面级别的功能测试
- **可视化测试**: 关键界面的快照测试

### 代码质量工具

```bash
# 代码检查
yarn lint

# 类型检查
yarn typecheck  

# 测试运行
yarn test

# 测试覆盖率
yarn test:coverage
```

## 常见问题 (FAQ)

### Q: 如何添加新的路由页面？

A: 在 `src/routes/` 目录下创建新的 `.tsx` 文件：

```typescript
// src/routes/new-page.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/new-page')({
  component: NewPageComponent,
})

function NewPageComponent() {
  return <div>新页面内容</div>
}
```

### Q: 如何添加新的服务？

A: 按照服务层架构创建新服务：

```typescript
// src/services/my-service/types.ts
export interface MyService {
  doSomething(): Promise<void>
}

// src/services/my-service/default.ts
export class DefaultMyService implements MyService {
  async doSomething() {
    // 默认实现
  }
}

// src/services/my-service/tauri.ts
export class TauriMyService implements MyService {
  async doSomething() {
    // Tauri 特定实现
  }
}
```

### Q: 如何使用全局状态？

A: 通过 Zustand store 访问和修改状态：

```typescript
import { useAppStore } from '@/stores/appStore'

function MyComponent() {
  const { theme, setTheme } = useAppStore()
  
  return (
    <button onClick={() => setTheme('dark')}>
      当前主题: {theme}
    </button>
  )
}
```

### Q: 如何添加国际化文本？

A: 在 i18n 文件中添加翻译，然后使用 hook：

```typescript
// src/i18n/locales/zh.json
{
  "common": {
    "save": "保存",
    "cancel": "取消"
  }
}

// 组件中使用
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  
  return <button>{t('common.save')}</button>
}
```

### Q: 如何与 Tauri 后端通信？

A: 使用 Tauri API 调用后端命令：

```typescript
import { invoke } from '@tauri-apps/api/core'

// 调用后端命令
const result = await invoke('get_system_info')

// 监听后端事件
import { listen } from '@tauri-apps/api/event'

listen('model-loaded', (event) => {
  console.log('模型已加载:', event.payload)
})
```

### Q: 如何自定义主题样式？

A: 修改 Tailwind CSS 配置和 CSS 变量：

```css
/* src/index.css */
:root {
  --primary: 222.2 84% 4.9%;
  --primary-foreground: 210 40% 98%;
  /* 更多主题变量 */
}

[data-theme="dark"] {
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 84% 4.9%;
}
```

## 相关文件清单

### 核心源码结构

```
src/
├── main.tsx                    # 应用入口
├── index.css                   # 全局样式
├── i18n/                       # 国际化
│   ├── index.ts               # i18n 配置
│   ├── locales/               # 语言文件
│   └── TranslationContext.tsx # 翻译上下文
├── routes/                     # 路由页面
│   ├── __root.tsx             # 根布局
│   ├── index.tsx              # 主页
│   ├── assistant.tsx          # 助手页
│   ├── system-monitor.tsx     # 监控页
│   ├── logs.tsx               # 日志页
│   ├── threads/$threadId.tsx  # 对话线程
│   ├── hub/                   # 模型市场
│   │   ├── index.tsx          # 市场首页
│   │   └── $modelId.tsx       # 模型详情
│   ├── local-api-server/      # 本地 API 服务器
│   │   └── logs.tsx           # 服务器日志
│   └── settings/              # 设置页面
│       ├── general.tsx        # 通用设置
│       ├── appearance.tsx     # 外观设置
│       ├── privacy.tsx        # 隐私设置
│       ├── shortcuts.tsx      # 快捷键设置
│       ├── hardware.tsx       # 硬件设置
│       ├── extensions.tsx     # 扩展管理
│       ├── mcp-servers.tsx    # MCP 服务器
│       ├── https-proxy.tsx    # HTTPS 代理
│       ├── local-api-server.tsx # 本地 API 服务器
│       └── providers/         # 提供商配置
├── components/                 # UI 组件
│   ├── ui/                    # 基础 UI 组件
│   └── [specific]/            # 业务组件
├── containers/                 # 容器组件
│   ├── LeftPanel.tsx          # 侧边栏
│   ├── LanguageSwitcher.tsx   # 语言切换
│   └── dialogs/               # 对话框组件
├── hooks/                      # 自定义 Hooks
│   ├── useChat.ts             # 聊天功能
│   ├── useModelLoad.ts        # 模型加载
│   └── useCompletion.ts       # 文本补全
├── services/                   # 服务层
│   ├── index.ts               # 服务集成
│   ├── app/                   # 应用服务
│   ├── assistants/            # 助手服务
│   ├── core/                  # 核心服务
│   ├── messages/              # 消息服务
│   ├── models/                # 模型服务
│   ├── providers/             # 提供商服务
│   ├── threads/               # 线程服务
│   ├── hardware/              # 硬件服务
│   ├── events/                # 事件服务
│   ├── mcp/                   # MCP 服务
│   ├── theme/                 # 主题服务
│   ├── window/                # 窗口服务
│   ├── dialog/                # 对话框服务
│   ├── deeplink/              # 深度链接服务
│   ├── updater/               # 更新服务
│   └── analytic/              # 分析服务
├── providers/                  # 上下文提供者
│   ├── ThemeProvider.tsx      # 主题提供者
│   ├── DataProvider.tsx       # 数据提供者
│   └── ExtensionProvider.tsx  # 扩展提供者
├── lib/                        # 工具函数
│   ├── utils.ts               # 通用工具
│   ├── completion.ts          # 补全逻辑
│   └── platform/              # 平台相关
├── types/                      # 类型定义
│   └── app.d.ts               # 应用类型
└── constants/                  # 常量定义
    └── routes.ts              # 路由常量
```

### 配置文件

```
├── package.json                # 包配置
├── tsconfig.json              # TypeScript 配置
├── tsconfig.web.json          # Web 构建配置
├── vite.config.ts             # Vite 主配置
├── vite.config.web.ts         # Vite Web 配置
├── tailwind.config.js         # Tailwind 配置
└── eslint.config.js           # ESLint 配置
```

## 变更记录 (Changelog)

### 2025-09-08 - 增量更新

- 📑 补充详细的路由结构分析
- 🔧 完善服务层架构文档
- 🎯 添加设置页面和 MCP 集成说明
- 📋 增强服务接口类型定义
- 🧪 扩展测试策略和质量保证

### 2025-09-08 - 模块文档初始化

- 📝 创建 Web-app 模块完整技术文档
- 🎨 梳理 UI 组件和路由结构
- 🔧 整理开发环境和构建配置
- 📋 建立常见问题解答和最佳实践