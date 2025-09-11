# 本地 Windows 构建指南

> 在本地环境生成 Miaoda Windows 安装包的完整指南

## 📋 前置需求

### Windows 系统环境

1. **Windows 10/11** (推荐 Windows 11)
2. **PowerShell 5.1+** 或 **PowerShell Core 7+**

### 必需工具

```powershell
# 1. 安装 Node.js (20.18.0)
# 从官网下载: https://nodejs.org/
# 或使用 winget:
winget install OpenJS.NodeJS

# 2. 启用 Corepack 并安装 Yarn 4
corepack enable
corepack prepare yarn@4.5.3 --activate
yarn --version  # 应该显示 4.5.3

# 3. 安装 Rust (1.77.2)
# 从官网下载: https://rustup.rs/
# 或使用命令:
winget install Rustlang.Rustup

# 4. 安装 Git
winget install Git.Git

# 5. 安装 Visual Studio Build Tools (可选但推荐)
# 下载 Visual Studio Installer，选择 C++ build tools
```

### Rust 工具链配置

```powershell
# 安装指定版本的 Rust
rustup install 1.77.2
rustup default 1.77.2

# 添加 Windows 目标
rustup target add x86_64-pc-windows-msvc

# 验证安装
rustc --version  # 应该显示 1.77.2
cargo --version
```

## 🚀 构建步骤

### 1. 克隆项目

```powershell
# 克隆项目到本地
git clone https://github.com/miounet11/miaodanew.git
cd miaodanew

# 切换到最新分支
git checkout main
git pull origin main
```

### 2. 安装依赖

```powershell
# 使用 Yarn 安装所有依赖
yarn install

# 如果遇到网络问题，可以配置镜像:
# yarn config set npmRegistryServer https://registry.npmmirror.com
# yarn config set yarnPath .yarn/releases/yarn-4.5.3.cjs
```

### 3. 下载必需的二进制文件

```powershell
# 下载 Vulkan 库和工具
node scripts/download-lib.mjs
node scripts/download-bin.mjs

# 验证下载的文件
ls src-tauri/resources/lib/     # 应该有 vulkan-1.dll
ls src-tauri/resources/bin/     # 应该有 bun 和 uv 可执行文件
```

### 4. 构建前端

```powershell
# 按顺序构建各个模块
yarn build:core
yarn build:extensions-web  
yarn build:web
```

### 5. 构建 Tauri 应用

```powershell
# 方式1: 使用项目脚本 (推荐)
yarn build:tauri

# 方式2: 直接使用 Tauri CLI
cd src-tauri
cargo tauri build --target x86_64-pc-windows-msvc

# 方式3: 如果上述失败，尝试调试构建
cargo tauri build --verbose --target x86_64-pc-windows-msvc
```

## 📦 构建产物

成功构建后，你会在以下位置找到安装包：

```
src-tauri/target/release/bundle/nsis/
├── Miaoda_0.6.6_x64_en-US.msi        # Windows 安装程序
├── Miaoda_0.6.6_x64_en-US.msi.sig    # 数字签名文件（如果配置了）
└── ...其他文件
```

## 🛠️ 故障排除

### 常见问题及解决方案

#### 1. Yarn 版本问题
```powershell
# 错误: "packageManager": "yarn@4.5.3" 版本不匹配
# 解决:
corepack enable
corepack prepare yarn@4.5.3 --activate
yarn --version
```

#### 2. Rust 编译错误
```powershell
# 清理并重新构建
cd src-tauri
cargo clean
cargo build --release

# 如果仍有问题，检查 Rust 版本
rustc --version  # 必须是 1.77.2
```

#### 3. 缺少系统依赖
```powershell
# 安装 Microsoft C++ Build Tools
# 从 Visual Studio Installer 安装 "MSVC v143 - VS 2022 C++ x64/x86 build tools"

# 或者安装完整的 Visual Studio Community
```

#### 4. 网络连接问题
```powershell
# 配置代理（如果需要）
$env:HTTP_PROXY = "http://proxy:port"
$env:HTTPS_PROXY = "http://proxy:port"

# 或使用国内镜像
yarn config set npmRegistryServer https://registry.npmmirror.com
```

#### 5. 磁盘空间不足
```powershell
# 清理 Rust 缓存
cargo clean
rustup toolchain list
# rustup toolchain uninstall <不需要的版本>

# 清理 Yarn 缓存
yarn cache clean
```

## 🔧 高级配置

### 启用代码签名（可选）

如果你有代码签名证书：

```powershell
# 设置环境变量
$env:TAURI_SIGNING_PRIVATE_KEY = "你的私钥内容"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "私钥密码"

# 然后正常构建
yarn build:tauri
```

### 自定义构建配置

编辑 `src-tauri/tauri.conf.json` 来自定义：

```json
{
  "bundle": {
    "targets": ["msi"],
    "windows": {
      "certificateThumbprint": "你的证书指纹",
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.comodoca.com"
    }
  }
}
```

### 性能优化构建

```powershell
# 启用并行构建
$env:CARGO_BUILD_JOBS = "4"  # 根据你的CPU核心数调整

# 启用链接时优化
$env:RUSTFLAGS = "-C target-cpu=native -C opt-level=3"

# 使用发布配置构建
cargo tauri build --config src-tauri/tauri.conf.json
```

## 📊 构建时间预估

根据硬件配置，预期构建时间：

- **快速机器** (16GB RAM, SSD, 8+ 核): 10-15 分钟
- **中等机器** (8GB RAM, SSD, 4-6 核): 15-25 分钟  
- **较慢机器** (4GB RAM, HDD, 2-4 核): 25-40 分钟

首次构建会更慢，因为需要下载和编译所有依赖。

## 🎯 验证构建结果

```powershell
# 检查生成的可执行文件
.\src-tauri\target\release\miaoda.exe --version

# 测试安装程序
.\src-tauri\target\release\bundle\nsis\Miaoda_0.6.6_x64_en-US.msi
```

## 🔄 自动化脚本

为了简化流程，你可以创建一个自动化构建脚本 `build-windows.ps1`：

```powershell
#!/usr/bin/env pwsh
# Windows 本地构建脚本

Write-Host "🚀 开始 Miaoda Windows 构建流程" -ForegroundColor Green

# 1. 检查环境
Write-Host "📋 检查构建环境..." -ForegroundColor Yellow
node --version
yarn --version
rustc --version

# 2. 安装依赖
Write-Host "📦 安装项目依赖..." -ForegroundColor Yellow
yarn install

# 3. 下载二进制文件
Write-Host "⬇️ 下载必需文件..." -ForegroundColor Yellow
node scripts/download-lib.mjs
node scripts/download-bin.mjs

# 4. 构建前端
Write-Host "🏗️ 构建前端应用..." -ForegroundColor Yellow
yarn build:core
yarn build:extensions-web
yarn build:web

# 5. 构建 Tauri
Write-Host "🦀 构建 Tauri 应用..." -ForegroundColor Yellow
yarn build:tauri

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 构建成功！" -ForegroundColor Green
    Write-Host "📦 安装包位置: src-tauri/target/release/bundle/nsis/" -ForegroundColor Cyan
} else {
    Write-Host "❌ 构建失败，退出码: $LASTEXITCODE" -ForegroundColor Red
}
```

保存为 `build-windows.ps1` 后，直接运行：

```powershell
.\build-windows.ps1
```

这样你就可以完全避开 GitHub Actions 的问题，在本地生成高质量的 Windows 安装包了！