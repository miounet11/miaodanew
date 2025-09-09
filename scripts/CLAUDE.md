[根目录](../CLAUDE.md) > **scripts**

# Scripts 模块文档

> 构建、下载和部署脚本集合

## 模块职责

Scripts 模块为 Miaoda 项目提供自动化工具链，包括：
- 第三方库和二进制文件下载
- 平台特定的依赖管理
- 国际化文件完整性检查
- 构建工具链管理
- 开发环境配置

## 入口与启动

### 主要脚本
- `download-lib.mjs` - 下载 Vulkan 图形库
- `download-bin.mjs` - 下载二进制工具（bun, uv）
- `find-missing-translations.js` - 检查缺失的翻译
- `find-missing-i18n-key.js` - 检查 i18n 键值

### 执行命令
```bash
# 下载 Vulkan 库
node scripts/download-lib.mjs

# 下载二进制工具
node scripts/download-bin.mjs

# 检查翻译完整性
node scripts/find-missing-translations.js

# 检查 i18n 键值
node scripts/find-missing-i18n-key.js
```

## 对外接口

### 库下载接口
```javascript
// download-lib.mjs
- 自动检测平台 (Linux/Windows)
- 下载 libvulkan.so / vulkan-1.dll
- 复制到 src-tauri/resources/lib
- 支持重定向处理
```

### 二进制工具下载
```javascript
// download-bin.mjs  
- 下载 bun (JavaScript 运行时)
- 下载 uv (Python 包管理器)
- 平台自适应 (aarch64-apple-darwin 等)
- 自动解压和权限设置
```

### 国际化检查
```javascript
// 翻译完整性验证
- 扫描源码中的 i18n 键值
- 对比各语言文件完整性
- 报告缺失的翻译项
- 批量检查多语言支持
```

## 关键依赖与配置

### 核心依赖
- **Node.js** - JavaScript 运行时
- **cpx** - 文件复制工具
- **https** - 文件下载
- **fs/path** - 文件系统操作

### 平台检测
```javascript
const platform = os.platform() // 'darwin', 'linux', 'win32'
const arch = os.arch()         // 'x64', 'arm64'
```

### 下载配置
```javascript
// Vulkan 库源
const url = `https://catalog.jan.ai/${filename}`

// 工具下载源
- bun: GitHub Releases
- uv: GitHub Releases
- 自动选择最新版本
```

## 数据模型

### 目录结构
```
scripts/
├── dist/                    # 下载缓存目录
│   ├── bun-darwin-aarch64/  # Bun 二进制
│   ├── uv-aarch64-apple-darwin/ # UV 工具
│   └── *.tar.gz            # 压缩包
├── *.mjs                   # ES 模块脚本
└── *.js                    # CommonJS 脚本
```

### 下载文件
- **libvulkan.so** - Linux Vulkan 库
- **vulkan-1.dll** - Windows Vulkan 库  
- **bun** - JavaScript 运行时和包管理器
- **uv** - Python 虚拟环境和包管理器

### 配置文件
- 自动从远程获取最新版本
- 支持断点续传
- 文件完整性验证

## 测试与质量

### 当前状态
- ❌ 单元测试 - 未配置
- ❌ 集成测试 - 未配置
- ✅ 错误处理 - 基本实现
- ✅ 日志输出 - 详细日志

### 质量特性
- **平台兼容性检查**
- **网络错误重试**
- **文件存在性验证**
- **权限设置处理**

### 建议改进
1. 添加脚本单元测试
2. 文件哈希验证
3. 下载进度显示
4. 自动版本更新检查

## 常见问题 (FAQ)

### Q: download-lib.mjs 下载失败怎么办？
A: 检查网络连接，确认 `https://catalog.jan.ai` 可访问，脚本会自动处理重定向。

### Q: 为什么只支持 x64 架构？
A: `download-lib.mjs` 中有架构检查 `if (arch != 'x64') return`，可根据需要修改。

### Q: 如何添加新的下载工具？
A: 参考 `download-bin.mjs` 的结构，添加新的下载逻辑和平台检测。

### Q: i18n 检查脚本如何工作？
A: 扫描源码中的翻译键值，对比语言文件，报告缺失项。

### Q: 下载的文件存储在哪里？
A: 临时文件在 `scripts/dist/`，最终文件复制到目标位置（如 `src-tauri/resources/lib`）。

## 相关文件清单

### 核心脚本
- `download-lib.mjs` - Vulkan 库下载
- `download-bin.mjs` - 二进制工具下载
- `find-missing-translations.js` - 翻译检查
- `find-missing-i18n-key.js` - i18n 键值检查

### 下载文件
- `dist/bun-*` - Bun 工具链
- `dist/uv-*` - UV Python 工具
- `dist/*.tar.gz` - 压缩包文件

### 目标文件
- `src-tauri/resources/lib/` - Vulkan 库目标位置

## 变更记录 (Changelog)

### 2025-09-08
- 完成 Scripts 模块文档化
- 分析下载和构建脚本架构
- 整理平台适配逻辑
- 识别 i18n 检查工具功能
- 添加使用指南和常见问题解答