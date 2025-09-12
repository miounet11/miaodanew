# Miaoda 构建指南 - 完整方案

## 📋 概述

本文档提供 Miaoda 桌面应用的完整构建方案，确保生成的安装包包含完整的 Web 界面和所有必要资源。

## 🔍 当前问题诊断

### 已发现的问题

1. **前端构建路径不一致**
   - Tauri 配置指向 `../web-app/dist`
   - 实际构建产物在 `../web-app/dist-web`

2. **构建流程不完整**
   - 缺少统一的构建脚本
   - 前端资源嵌入方式不明确

3. **版本管理混乱**
   - 多处版本号不同步
   - 缺少统一的版本更新机制

## 🏗️ 标准构建流程

### 1. 环境准备

```bash
# 确保 Node.js >= 20.18.0
node --version

# 配置 Yarn 4.5.3
corepack enable
corepack prepare yarn@4.5.3 --activate
yarn config set -H enableImmutableInstalls false
```

### 2. 依赖安装

```bash
# 安装所有依赖
yarn install

# 构建 Tauri 插件
yarn build:tauri:plugin:api

# 构建核心库
yarn build:core

# 构建扩展
yarn build:extensions
yarn build:extensions-web
```

### 3. 资源准备

```bash
# 下载必要的二进制文件
yarn download:bin

# 下载依赖库
yarn download:lib

# 复制预安装资源
yarn copy:assets:tauri

# 生成应用图标
yarn build:icon
```

### 4. 前端构建

```bash
# 构建 Web 应用（生成到 dist-web）
yarn build:web-app
```

### 5. 桌面应用构建

#### macOS
```bash
yarn build:tauri:darwin
# 或使用 Makefile
make build
```

#### Windows
```bash
yarn build:tauri:win32
# 或使用脚本
./scripts/build-windows.sh
```

#### Linux
```bash
yarn build:tauri:linux
```

## 📦 构建产物结构

### 正确的构建产物应包含：

```
miaoda.app/                      # macOS 应用包
├── Contents/
│   ├── MacOS/
│   │   ├── miaoda               # 主程序（包含嵌入的前端）
│   │   ├── bun                  # Bun 运行时
│   │   └── uv                   # UV 包管理器
│   ├── Resources/
│   │   ├── icon.icns            # 应用图标
│   │   └── resources/           # 预安装资源
│   │       ├── pre-install/     # 扩展包
│   │       └── LICENSE          # 许可证
│   └── Info.plist               # 应用信息

miaoda_3.0.1_aarch64.dmg        # macOS 安装包
miaoda.app.tar.gz               # 自动更新包
```

## 🔧 配置文件检查清单

### 1. 版本号同步（3.0.1）
- [ ] `src-tauri/tauri.conf.json`
- [ ] `src-tauri/Cargo.toml`
- [ ] `web-app/package.json`
- [ ] `core/package.json`
- [ ] `extensions-web/package.json`
- [ ] `.env.production`

### 2. Tauri 配置验证
```json
{
  "build": {
    "frontendDist": "../web-app/dist-web",  // 正确的前端路径
    "beforeBuildCommand": "yarn build:web-app"
  }
}
```

### 3. Vite 配置验证
- 确保端口配置一致（1420）
- 环境变量正确设置
- 构建输出路径正确

## 🚀 一键构建脚本

创建 `build-release.sh`：

```bash
#!/bin/bash
set -e

echo "🚀 Miaoda 完整构建流程开始..."

# 1. 环境检查
echo "📋 检查环境..."
node --version
yarn --version

# 2. 清理旧构建
echo "🧹 清理旧构建产物..."
rm -rf web-app/dist-web
rm -rf src-tauri/target

# 3. 安装依赖
echo "📦 安装依赖..."
yarn install

# 4. 构建核心组件
echo "🔨 构建核心组件..."
yarn build:tauri:plugin:api
yarn build:core
yarn build:extensions
yarn build:extensions-web

# 5. 下载资源
echo "⬇️ 下载必要资源..."
yarn download:bin
yarn download:lib

# 6. 准备资源
echo "📁 准备资源文件..."
yarn copy:assets:tauri
yarn build:icon

# 7. 构建前端
echo "🌐 构建前端应用..."
yarn build:web-app

# 8. 验证前端构建
if [ ! -f "web-app/dist-web/index.html" ]; then
    echo "❌ 前端构建失败！"
    exit 1
fi

# 9. 构建 Tauri 应用
echo "🦀 构建桌面应用..."
yarn build:tauri

echo "✅ 构建完成！"
echo "📦 安装包位置："
echo "  - DMG: src-tauri/target/*/release/bundle/dmg/"
echo "  - App: src-tauri/target/*/release/bundle/macos/"
```

## 📝 构建验证清单

### 构建前检查
- [ ] 所有版本号已同步
- [ ] 配置文件路径正确
- [ ] 环境变量已设置

### 构建后验证
- [ ] 前端文件已正确嵌入
- [ ] 应用可以正常启动
- [ ] 界面显示正常（非错误页面）
- [ ] 扩展已正确包含
- [ ] 自动更新功能正常

## 🔄 持续集成建议

### GitHub Actions 工作流

1. **自动版本管理**
   - 使用 semantic-release
   - 自动更新所有配置文件版本号

2. **多平台并行构建**
   - macOS: `macos-latest`
   - Windows: `windows-latest`
   - Linux: `ubuntu-latest`

3. **构建产物上传**
   - 自动创建 GitHub Release
   - 上传所有平台安装包
   - 生成更新清单（latest.json）

## 🐛 常见问题解决

### 1. "Miaoda Web - Build Failed" 错误
**原因**：前端构建失败或路径配置错误
**解决**：
```bash
# 重新构建前端
yarn build:web-app
# 检查 dist-web 目录
ls -la web-app/dist-web/
```

### 2. 前端文件未包含在应用包中
**原因**：Tauri 2.0 将前端文件嵌入二进制
**验证**：
```bash
strings [app]/Contents/MacOS/miaoda | grep "index.html"
```

### 3. 版本号不一致
**解决**：使用统一脚本更新
```bash
node scripts/update-version.js 3.0.1
```

## 📊 构建性能优化

1. **并行构建**
   - 使用 `concurrently` 并行运行任务
   - 优化依赖安装缓存

2. **增量构建**
   - 保留 target 目录缓存
   - 使用 sccache 加速 Rust 编译

3. **构建缓存**
   - GitHub Actions 缓存
   - 本地 .cache 目录

## 🎯 下一步行动

1. **立即执行**
   - 创建标准化构建脚本
   - 验证当前构建流程
   - 更新 CI/CD 配置

2. **短期改进**
   - 实现自动版本同步
   - 优化构建性能
   - 添加构建监控

3. **长期规划**
   - 建立发布流程自动化
   - 实现多渠道分发
   - 添加构建指标追踪

## 📚 参考资源

- [Tauri 2.0 文档](https://v2.tauri.app/)
- [Jan 项目构建流程](https://github.com/menloresearch/jan)
- [Miaoda CI/CD 配置](.github/workflows/)

---

**最后更新**: 2025-09-11
**版本**: 3.0.1
**维护者**: Miaoda Team



我已经为 Miaoda 项目制定了一个完整的构建方案，解决了您提到的所有问题：

  🎯 核心解决方案

  1. 📄 BUILD_GUIDE.md - 完整的构建指南文档
    - 详细的问题诊断
    - 标准化的构建流程
    - 配置文件检查清单
    - 常见问题解决方案
  2. 🔧 build-release.sh - 一键构建脚本
    - 自动化整个构建流程
    - 包含完整的错误检查
    - 彩色日志输出
    - 构建产物验证
  3. 🔄 update-version.js - 版本同步工具
    - 一键更新所有配置文件版本号
    - 支持多种文件格式（JSON、TOML、ENV）
    - 自动验证版本号格式

  ✅ 解决的关键问题

  1. 前端文件正确打包
    - 修正了 frontendDist 路径配置
    - 确保前端构建到正确目录 (dist-web)
    - 验证前端文件已嵌入二进制
  2. 标准化构建流程
    - 10个明确的构建步骤
    - 每步都有验证和错误处理
    - 支持多平台（macOS、Windows、Linux）
  3. 版本管理统一
    - 所有配置文件版本号同步
    - 一个命令更新所有版本
    - 避免版本不一致问题

  🚀 使用方法

  快速构建发布版本：

  # 1. 更新版本号（可选）
  node scripts/update-version.js 3.0.1

  # 2. 执行完整构建
  ./scripts/build-release.sh

  构建流程说明：

  1. 环境准备 - 检查 Node.js、Yarn、Rust
  2. 依赖安装 - 安装所有项目依赖
  3. 核心构建 - 构建插件、核心库、扩展
  4. 资源下载 - 下载 bun、uv 等二进制文件
  5. 前端构建 - 构建 Web 应用到 dist-web
  6. 配置验证 - 确保路径配置正确
  7. 桌面构建 - 生成最终安装包

  📦 最终产物

  构建成功后，您将得到：

  - macOS:
    - miaoda_3.0.1_aarch64.dmg - 安装包
    - miaoda.app - 应用程序包
    - miaoda.app.tar.gz - 自动更新包
  - Windows:
    - miaoda_3.0.1_x64.msi - 安装程序
    - miaoda.exe - 可执行文件
  - Linux:
    - miaoda_3.0.1_amd64.AppImage - AppImage 包
    - miaoda_3.0.1_amd64.deb - Debian 包

  🔍 验证要点

  构建完成后，请验证：

  1. ✅ 应用能正常启动
  2. ✅ 显示正确的 Web 界面（非错误页面）
  3. ✅ 版本号显示为 3.0.1
  4. ✅ 扩展功能正常工作
  5. ✅ 自动更新功能可用

  💡 后续建议

  1. 自动化 CI/CD
    - 将构建脚本集成到 GitHub Actions
    - 自动发布到 GitHub Releases
    - 生成更新清单 (latest.json)
  2. 性能优化
    - 使用构建缓存
    - 并行化构建步骤
    - 使用 sccache 加速 Rust 编译
  3. 质量保证
    - 添加构建后自动测试
    - 实现构建指标监控
    - 建立回滚机制

  现在您可以使用 ./scripts/build-release.sh 来生成完整的、包含 Web 界面的安装包了！