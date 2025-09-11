# Miaoda 配置管理系统

> 动态配置管理、环境适配与安全保护的完整解决方案

## 🎯 系统概述

Miaoda 配置管理系统提供了一套完整的配置管理解决方案，支持多环境配置、类型安全、配置验证、热重载和安全保护等功能。

### 核心特性

- 🌍 **多环境支持**：development / test / production 环境独立配置
- 🔒 **安全保护**：敏感信息加密存储，防止意外泄露
- 📝 **类型安全**：完整的 TypeScript 类型定义
- ✅ **配置验证**：自动验证配置完整性和正确性
- 🔄 **热重载**：开发环境配置变更实时生效
- 📊 **可视化报告**：配置状态可视化和问题诊断

## 📁 文件结构

```
├── .env.example              # 配置模板（版本控制）
├── .env.development         # 开发环境配置（版本控制）
├── .env.test               # 测试环境配置（版本控制）
├── .env.production         # 生产环境配置（版本控制）
├── .env.local              # 本地覆盖配置（不纳入版本控制）
├── core/src/types/config.ts # 配置类型定义
├── core/src/config/         # 配置管理器
├── scripts/
│   ├── config-manager.mjs   # 配置管理脚本
│   └── validate-config.mjs  # 配置验证脚本
└── CONFIG_MANAGEMENT.md     # 此文档
```

## 🚀 快速开始

### 1. 初始化配置

```bash
# 复制配置模板
cp .env.example .env.local

# 编辑本地配置
vim .env.local
```

### 2. 验证配置

```bash
# 验证所有环境配置
yarn config:validate

# 验证特定环境
yarn config:validate:env

# 生成配置报告
yarn config:report
```

### 3. 使用配置

```typescript
import { getConfig, initializeConfig } from '@miaoda/core'

// 初始化配置管理器
await initializeConfig('development')

// 获取配置值
const apiKey = getConfig<string>('external.openai.apiKey')
const port = getConfig<number>('base.port')
const debugMode = getConfig<boolean>('devTools.debug.enabled')
```

## 🔧 配置层级

配置系统采用多层级覆盖机制，优先级从低到高：

1. **默认配置** (core/src/types/config.ts)
2. **环境配置** (.env.development / .env.test / .env.production)
3. **本地配置** (.env.local)
4. **环境变量** (process.env)
5. **运行时配置** (程序动态设置)

### 配置分类

#### 🏠 基础应用配置 (BaseConfig)

```typescript
interface BaseConfig {
  appName: string           // 应用名称
  appVersion: string        // 应用版本
  environment: Environment  // 运行环境
  nodeEnv: Environment      // Node.js 环境
  port: number             // 服务端口
  isTauri: boolean         // 是否为 Tauri 环境
}
```

#### 🌐 外部服务配置 (ExternalServicesConfig)

```typescript
interface ExternalServicesConfig {
  posthog: {
    key?: string           // PostHog 分析密钥
    host?: string          // PostHog 服务地址
  }
  openai: {
    apiKey?: string        // OpenAI API 密钥
    apiBase: string        // API 基础地址
    model: string          // 默认模型
  }
  grok: {
    apiKey?: string        // Grok API 密钥
    apiBase: string        // API 基础地址
    model: string          // 默认模型
  }
  updater: {
    disabled: boolean      // 是否禁用自动更新
    endpoint?: string      // 更新服务端点
  }
}
```

#### 🎨 UI 配置 (UIConfig)

```typescript
interface UIConfig {
  theme: {
    default: Theme         // 默认主题
    syncOS: boolean        // 同步系统主题
  }
  locale: {
    default: Locale        // 默认语言
    fallback: Locale       // 后备语言
  }
  window: {
    width: number          // 窗口宽度
    height: number         // 窗口高度
    minWidth: number       // 最小宽度
    minHeight: number      // 最小高度
  }
}
```

#### 🔧 开发工具配置 (DevToolsConfig)

```typescript
interface DevToolsConfig {
  logging: {
    level: LogLevel        // 日志级别
    enableConsole: boolean // 控制台日志
    file?: string          // 日志文件路径
  }
  debug: {
    enabled: boolean       // 调试模式
    enableDevTools: boolean // 开发者工具
  }
  hmr: {
    enabled: boolean       // 热模块替换
    port: number           // HMR 端口
  }
  quality: {
    eslint: boolean        // ESLint 检查
    prettier: boolean      // Prettier 格式化
    typeCheck: boolean     // 类型检查
  }
}
```

## 🌍 环境配置

### 开发环境 (development)

- 🔍 详细日志和调试信息
- 🔄 热重载和开发者工具
- ⚡ 快速构建配置
- 🚫 禁用生产功能（自动更新等）

```bash
NODE_ENV=development
DEBUG_MODE=true
LOG_LEVEL=debug
ENABLE_CONSOLE_LOG=true
AUTO_UPDATER_DISABLED=true
```

### 测试环境 (test)

- ⚡ 最小日志输出
- 🚫 禁用外部服务
- 📊 启用覆盖率收集
- 🔧 使用 Mock 服务

```bash
NODE_ENV=test
DEBUG_MODE=false
LOG_LEVEL=warn
ENABLE_CONSOLE_LOG=false
MCP_ENABLED=false
```

### 生产环境 (production)

- 🔒 严格安全配置
- 📊 启用监控和分析
- ⚡ 优化性能配置
- 🔄 启用自动更新

```bash
NODE_ENV=production
DEBUG_MODE=false
LOG_LEVEL=info
ENABLE_PERFORMANCE_MONITORING=true
AUTO_UPDATER_DISABLED=false
```

## 🔐 安全管理

### 敏感信息保护

系统自动识别并保护以下类型的敏感信息：

- API 密钥 (`*_API_KEY`, `*_KEY`)
- 密码 (`*_PASSWORD`, `*_PASS`)
- 令牌 (`*_TOKEN`)
- 私钥 (`*_PRIVATE_KEY`)
- DSN 和端点 (`*_DSN`, `*_ENDPOINT`)

### GitHub Secrets 集成

生产环境的敏感配置通过 GitHub Secrets 管理：

```yaml
# .github/workflows/build.yml
env:
  POSTHOG_KEY: ${{ secrets.POSTHOG_KEY }}
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
```

### 配置文件保护

`.gitignore` 自动保护敏感配置文件：

```gitignore
# 环境配置保护
.env.local
.env.*.local
config-report.json
config-*.json
```

## ✅ 配置验证

### 自动验证规则

- **必需配置**：确保关键配置项不为空
- **类型验证**：数值、布尔值、URL 格式验证
- **范围检查**：端口号、百分比、尺寸范围验证
- **枚举验证**：环境、日志级别、主题等枚举值验证
- **逻辑验证**：端口冲突、配置依赖关系验证

### 验证命令

```bash
# 完整验证
yarn config:validate

# 验证配置文件存在性
yarn config:validate:files

# 验证环境配置
yarn config:validate:env

# 生成验证报告
yarn config:report
```

### 验证结果示例

```
🔍 正在验证配置...

✅ development 环境配置验证通过
⚠️  test 环境配置警告:
  - WINDOW_WIDTH: 值 600 超出推荐范围 800-1200
❌ production 环境配置验证失败:
  - POSTHOG_KEY: 必需的配置项未设置

📊 总结: 1/3 环境有效
⚠️  警告: 1 个
❌ 错误: 1 个
```

## 📊 配置报告

### 生成配置报告

```bash
# 生成完整报告
yarn config:report

# 导出特定环境配置
yarn config:export production config-prod.json

# 查看配置值
yarn config:get development PORT
```

### 报告内容

- 📈 **配置统计**：配置项数量、验证状态
- ❌ **错误诊断**：详细错误信息和修复建议
- ⚠️  **警告提醒**：潜在问题和优化建议
- 🔒 **安全检查**：敏感信息保护状态
- 📋 **配置清单**：完整配置项列表（脱敏）

## 🔄 开发工作流

### 本地开发

1. **克隆项目**
   ```bash
   git clone <repo-url>
   cd miaoda
   ```

2. **设置本地配置**
   ```bash
   cp .env.example .env.local
   # 编辑 .env.local 添加本地配置
   ```

3. **验证配置**
   ```bash
   yarn install
   yarn config:validate
   ```

4. **启动开发**
   ```bash
   yarn dev  # 自动验证配置后启动
   ```

### 添加新配置

1. **更新类型定义**
   ```typescript
   // core/src/types/config.ts
   interface MyModuleConfig {
     newSetting: string
   }
   ```

2. **更新环境文件**
   ```bash
   # .env.example
   NEW_SETTING=default_value
   
   # .env.development  
   NEW_SETTING=dev_value
   ```

3. **更新映射关系**
   ```typescript
   // core/src/config/index.ts
   const ENV_MAPPING = {
     'NEW_SETTING': 'myModule.newSetting',
     // ...
   }
   ```

4. **验证配置**
   ```bash
   yarn config:validate
   ```

### 配置迁移

版本升级时的配置迁移：

1. **检查配置差异**
   ```bash
   yarn config:report
   ```

2. **更新配置文件**
   ```bash
   # 对比新旧配置模板
   diff .env.example.old .env.example
   ```

3. **验证迁移结果**
   ```bash
   yarn config:validate
   ```

## 🛠️ API 参考

### ConfigManager 类

```typescript
class ConfigManager {
  // 加载配置
  async load(): Promise<AppConfig>
  
  // 获取配置值
  get<T>(key: string): T | undefined
  
  // 设置配置值
  async set<T>(key: string, value: T): Promise<void>
  
  // 验证配置
  validate(config: Partial<AppConfig>): ConfigValidationResult
  
  // 监听配置变更
  onChange(callback: (event: ConfigChangeEvent) => void): () => void
  
  // 重新加载配置
  async reload(): Promise<AppConfig>
}
```

### 便捷函数

```typescript
// 初始化配置管理器
await initializeConfig('development')

// 获取配置值
const value = getConfig<string>('base.appName')

// 设置配置值
await setConfig('ui.theme.default', 'dark')

// 获取全局配置管理器
const manager = getConfigManager()
```

### 配置类型

```typescript
// 环境类型
type Environment = 'development' | 'test' | 'production'

// 日志级别
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// 主题类型
type Theme = 'light' | 'dark' | 'auto'

// 语言类型  
type Locale = 'zh-CN' | 'en-US' | 'ja-JP'
```

## 🔧 命令行工具

### config-manager.mjs

```bash
# 加载配置
node scripts/config-manager.mjs load development

# 验证配置
node scripts/config-manager.mjs validate production

# 导出配置
node scripts/config-manager.mjs export test config.json

# 获取配置值
node scripts/config-manager.mjs get development PORT
```

### validate-config.mjs

```bash
# 完整验证
node scripts/validate-config.mjs

# 验证配置文件
node scripts/validate-config.mjs files

# 验证环境配置
node scripts/validate-config.mjs environments

# 生成报告
node scripts/validate-config.mjs report
```

## 🐛 故障排除

### 常见问题

#### Q: 配置验证失败，提示缺少必需配置？

```bash
❌ 必需的配置项 POSTHOG_KEY 未设置
```

**解决方案：**
1. 检查 `.env.local` 文件是否包含该配置
2. 确认环境变量是否正确设置
3. 对于生产环境，检查 GitHub Secrets 配置

#### Q: 配置加载失败，提示文件不存在？

```bash
❌ 配置文件不存在: .env.production
```

**解决方案：**
1. 确认配置文件存在且路径正确
2. 检查文件权限
3. 从 `.env.example` 复制创建缺失的配置文件

#### Q: 端口冲突错误？

```bash
❌ HMR_PORT 不能与 PORT 相同
```

**解决方案：**
1. 修改 `HMR_PORT` 使用不同端口
2. 推荐配置：`PORT=1420`, `HMR_PORT=1421`

#### Q: 配置热重载不生效？

**解决方案：**
1. 确认在开发环境：`NODE_ENV=development`
2. 重启开发服务器
3. 检查配置管理器是否正确初始化

### 调试技巧

1. **查看详细日志**
   ```bash
   DEBUG=config:* yarn dev
   ```

2. **验证配置加载**
   ```bash
   yarn config:get development PORT
   ```

3. **生成诊断报告**
   ```bash
   yarn config:report
   ```

## 📈 最佳实践

### 配置设计原则

1. **12-Factor App**：遵循十二要素应用配置原则
2. **环境隔离**：不同环境使用独立配置
3. **敏感信息分离**：密钥等敏感信息独立管理
4. **默认值合理**：提供合理的默认配置
5. **向后兼容**：配置变更保持兼容性

### 开发建议

1. **配置优先**：新功能先定义配置接口
2. **类型安全**：使用 TypeScript 确保类型安全
3. **文档同步**：配置变更及时更新文档
4. **测试覆盖**：为配置逻辑编写测试
5. **监控告警**：生产环境配置异常监控

### 安全建议

1. **最小权限**：只配置必需的权限和密钥
2. **定期轮换**：定期更换 API 密钥
3. **访问控制**：限制配置文件访问权限
4. **审计日志**：记录配置变更日志
5. **加密存储**：敏感配置加密存储

## 🔄 更新日志

### v1.0.0 (2024-09-11)
- ✨ 初始版本发布
- 🏗️ 建立完整配置管理系统
- 🔐 实现安全保护机制
- ✅ 完善配置验证功能
- 📊 提供可视化配置报告
- 🌍 支持多环境配置
- 📝 完整文档和类型定义

---

**相关文档：**
- [构建系统文档](./BUILD_SYSTEM.md)
- [项目架构文档](./CLAUDE.md)
- [安全指南](./SECURITY.md)

**技术支持：**
- 📧 技术问题：[GitHub Issues](https://github.com/miounet11/miaoda/issues)
- 📚 更多文档：[项目文档](./docs/)
- 💬 社区讨论：[GitHub Discussions](https://github.com/miounet11/miaoda/discussions)