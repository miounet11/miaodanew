[根目录](../CLAUDE.md) > **extensions**

# Extensions 模块文档

> 桌面端扩展系统，包含助手、对话、下载和 LlamaCpp 推理扩展

## 模块职责

Extensions 模块为 Miaoda 桌面应用提供可插拔的扩展功能，包括：
- 助手功能管理和配置
- 对话流程处理和优化
- 模型文件下载和管理
- LlamaCpp 本地推理引擎
- 硬件加速和性能监控
- 扩展生命周期管理

## 入口与启动

### 扩展目录结构
```
extensions/
├── assistant-extension/     # 助手功能扩展
├── conversational-extension/ # 对话处理扩展
├── download-extension/      # 下载管理扩展
└── llamacpp-extension/     # LlamaCpp 推理扩展
```

### 构建配置
- 每个扩展都有独立的 `rolldown.config.mjs`
- 使用 Rolldown 作为构建工具
- 支持 TypeScript 和现代 JavaScript

### 启动方式
```bash
# 构建所有扩展
yarn build:extensions

# 开发模式
yarn dev:extensions

# 单独构建特定扩展
cd extensions/llamacpp-extension
yarn build
```

## 对外接口

### AssistantExtension
```typescript
// 助手功能扩展
- 助手创建和管理
- 助手配置和个性化
- 助手行为控制
- 对话历史管理
```

### ConversationalExtension  
```typescript
// 对话处理扩展
- 消息路由和处理
- 对话上下文管理
- 多轮对话支持
- 会话状态维护
```

### DownloadExtension
```typescript
// 下载管理扩展
- 模型文件下载
- 下载进度监控
- 断点续传支持
- 文件完整性验证
```

### LlamaCppExtension
```typescript
// LlamaCpp 推理扩展
- 本地模型加载
- GPU/CPU 推理加速
- 内存管理优化
- 硬件监控集成
```

## 关键依赖与配置

### 核心依赖
- **@janhq/core** - 核心功能库
- **@janhq/tauri-plugin-hardware-api** - 硬件监控 API
- **@janhq/tauri-plugin-llamacpp-api** - LlamaCpp 集成 API

### 扩展架构
```typescript
// 扩展基类接口
interface Extension {
  name: string
  version: string
  install(): Promise<void>
  uninstall(): Promise<void>
  activate(): Promise<void>
  deactivate(): Promise<void>
}
```

### 硬件集成
- **GPU 监控** - NVIDIA/AMD GPU 使用率
- **内存管理** - 系统和 VRAM 监控
- **CPU 优化** - 多线程推理
- **温度监控** - 硬件过热保护

## 数据模型

### 扩展配置
```typescript
// 扩展元数据
interface ExtensionManifest {
  name: string
  version: string
  description: string
  author: string
  dependencies: string[]
  permissions: string[]
  entrypoint: string
}
```

### 模型管理
```typescript
// 模型信息
interface ModelInfo {
  id: string
  name: string
  size: number
  format: 'gguf' | 'safetensors'
  quantization: string
  architecture: string
  parameters: number
}
```

### 推理配置
```typescript
// LlamaCpp 配置
interface InferenceConfig {
  n_predict: number
  temperature: number
  top_p: number
  top_k: number
  repeat_penalty: number
  n_ctx: number
  n_threads: number
  use_gpu: boolean
}
```

## 测试与质量

### 当前状态
- ❌ 单元测试 - 未配置
- ❌ 集成测试 - 未配置
- ✅ 类型检查 - TypeScript 支持
- ✅ 构建验证 - Rolldown 构建

### 扩展质量
- **内存泄漏检测**
- **性能基准测试**
- **兼容性验证**
- **错误恢复机制**

### 建议改进
1. 添加扩展单元测试
2. 集成测试自动化
3. 性能回归测试
4. 扩展沙箱安全

## 常见问题 (FAQ)

### Q: 如何开发新的扩展？
A: 参考现有扩展结构，实现 Extension 接口，配置 rolldown.config.mjs。

### Q: LlamaCpp 扩展如何配置 GPU？
A: 通过 tauri-plugin-hardware-api 检测 GPU，在推理配置中启用 `use_gpu: true`。

### Q: 扩展间如何通信？
A: 通过 @janhq/core 提供的事件系统和共享状态管理。

### Q: 如何调试扩展问题？
A: 使用开发者工具，检查控制台日志，启用详细日志模式。

### Q: 扩展打包和分发？
A: 每个扩展独立构建为 JavaScript bundle，通过扩展管理器加载。

## 相关文件清单

### 扩展目录
- `assistant-extension/` - 助手功能
  - `rolldown.config.mjs` - 构建配置
  - `src/` - 源码目录
  - `node_modules/` - 依赖包

- `conversational-extension/` - 对话处理
  - `rolldown.config.mjs` - 构建配置

- `download-extension/` - 下载管理
  - `rolldown.config.mjs` - 构建配置

- `llamacpp-extension/` - LlamaCpp 推理
  - `rolldown.config.mjs` - 构建配置
  - `node_modules/` - 包含 Tauri 插件

### 共享配置
- `yarn.lock` - 依赖版本锁定
- `package.json` - 工作区配置

## 变更记录 (Changelog)

### 2025-09-08
- 完成 Extensions 模块文档化
- 分析扩展系统架构
- 整理各扩展功能职责
- 识别硬件集成方案
- 添加开发指南和常见问题解答