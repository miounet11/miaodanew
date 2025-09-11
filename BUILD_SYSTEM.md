# Miaoda 构建系统统一指南

## 🎯 构建系统现状

Miaoda 项目已统一采用基于 **Yarn + Tauri** 的现代化构建系统，逐步废弃原有的混合构建方式。

## 📋 推荐构建命令

### Windows 构建
```bash
# 完整构建流程（推荐）
yarn build:tauri:win32

# 或者分步构建
yarn build:core
yarn build:extensions-web  
yarn build:web
yarn build:tauri:win32
```

### macOS 构建
```bash
yarn build:tauri:darwin
```

### Linux 构建
```bash
yarn build:tauri:linux
```

### 跨平台通用构建
```bash
yarn build  # 自动检测平台
```

### 开发模式
```bash
yarn dev  # 启动 Tauri 开发模式
yarn dev:web-app  # 仅启动 Web 应用开发
```

## 🔧 GitHub Actions 工作流

### 当前活跃的工作流

1. **`build-windows.yml`** ✅ **[推荐使用]**
   - 完整的中文化 Windows 构建流程
   - 支持手动触发和自动触发
   - 支持工作流调用 (`workflow_call`)
   - 使用 `yarn build:tauri:win32` 命令

2. **`jan-tauri-build.yaml`** ✅ **[主发布流程]**
   - 已更新为调用新的 `build-windows.yml`
   - 用于标签发布的完整流程

### 已废弃的工作流

1. **`template-tauri-build-windows-x64.yml`** ❌ **[已标记废弃]**
   - 原 Jan 框架的构建模板
   - 已添加废弃警告
   - 将在未来版本中移除

## 📦 构建脚本对比

| 方式 | 命令 | 状态 | 推荐度 | 说明 |
|------|------|------|--------|------|
| **Yarn (推荐)** | `yarn build:tauri:win32` | ✅ 活跃 | ⭐⭐⭐⭐⭐ | 统一、现代化 |
| **Make (兼容)** | `make build` | ⚠️ 兼容 | ⭐⭐ | 保留兼容性 |
| **直接 Tauri** | `tauri build` | ⚠️ 不完整 | ⭐ | 缺少依赖构建 |

## 🏗️ 构建步骤详解

### 完整构建流程

1. **依赖安装**
   ```bash
   yarn install
   ```

2. **核心库构建**
   ```bash
   yarn build:core
   ```

3. **Web 扩展构建**
   ```bash
   yarn build:extensions-web
   ```

4. **Web 应用构建**
   ```bash
   yarn build:web
   ```

5. **桌面应用构建**
   ```bash
   yarn build:tauri:win32  # Windows
   yarn build:tauri:darwin # macOS
   yarn build:tauri:linux  # Linux
   ```

### 开发模式启动

```bash
# 一键启动开发环境
yarn dev

# 等价于以下步骤：
yarn build:icon
yarn copy:assets:tauri
tauri dev
```

## 🎨 品牌统一说明

所有构建配置已从 "Jan" 更新为 "Miaoda"：

- ✅ 应用名称：Miaoda
- ✅ 可执行文件：miaoda.exe
- ✅ 安装包：Miaoda_x.x.x_x64-setup.exe
- ✅ 配置路径：~/miaoda/
- ✅ 缓存路径：~/.cache/miaoda*

## ⚠️ 注意事项

### Makefile 使用警告

虽然 Makefile 仍然可用，但建议使用 Yarn 脚本：

```bash
# 不推荐
make build

# 推荐
yarn build:tauri:win32
```

### 版本管理

构建时版本号会自动从以下来源获取：
1. 手动触发：用户输入的版本号
2. 标签触发：Git 标签版本号
3. 自动构建：web-app/package.json 中的版本号

### 环境变量

Windows 构建可能需要的环境变量：
- `TAURI_SIGNING_PRIVATE_KEY`：Tauri 签名私钥
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`：私钥密码

## 🔄 迁移指南

如果你之前使用其他构建方式，请按以下步骤迁移：

1. **从 Make 迁移**
   ```bash
   # 旧方式
   make build
   
   # 新方式
   yarn build:tauri:win32
   ```

2. **从原模板迁移**
   - 停止使用 `template-tauri-build-windows-x64.yml`
   - 改用 `build-windows.yml` 或直接运行 Yarn 命令

3. **CI/CD 更新**
   ```yaml
   # 旧配置
   - run: make build
   
   # 新配置
   - run: yarn build:tauri:win32
   ```

## 🐛 故障排除

### 常见问题

1. **构建失败：找不到 Rust**
   ```bash
   # 确保安装了 Rust
   rustup update stable
   ```

2. **Node.js 版本问题**
   ```bash
   # 使用 Node.js 20
   nvm use 20
   ```

3. **Yarn 版本问题**
   ```bash
   # 确保使用 Yarn 4.5.3
   corepack enable
   corepack prepare yarn@4.5.3 --activate
   ```

4. **权限问题（Linux/macOS）**
   ```bash
   chmod +x src-tauri/build-utils/*
   ```

### 清理构建缓存

```bash
# 清理所有构建缓存
make clean

# 或手动清理
rm -rf node_modules
rm -rf src-tauri/target
yarn install
```

## 📚 更多信息

- [Tauri 官方文档](https://tauri.app/v1/guides/building/)
- [Yarn Workspaces 文档](https://yarnpkg.com/features/workspaces)
- [项目架构文档](./CLAUDE.md)

---

**最后更新**: 2025-09-11  
**维护人员**: Miaoda 开发团队