# GitHub Actions 构建指南

本文档说明如何使用 GitHub Actions 自动构建 Miaoda 的 Windows 版本。

## 快速开始

### 1. 手动触发构建

1. 访问你的 GitHub 仓库
2. 点击 `Actions` 标签
3. 在左侧选择 `Build Windows Release`
4. 点击右侧的 `Run workflow` 按钮
5. 输入版本号（例如：0.6.599）
6. 点击 `Run workflow` 开始构建

### 2. 自动触发构建

工作流会在以下情况自动触发：

- **推送到 main 分支**：当代码推送到 main 分支时自动构建
- **创建标签**：当创建以 `v` 开头的标签时（例如：`v0.6.599`）

## 配置说明

### 环境变量和密钥

在使用前，需要在 GitHub 仓库中配置以下密钥（Settings → Secrets and variables → Actions）：

#### 可选的代码签名密钥：
- `TAURI_SIGNING_PRIVATE_KEY`: Tauri 签名私钥
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: 签名私钥密码

如果不需要代码签名，可以跳过这些配置。

### 设置代码签名（可选）

1. **生成签名密钥**：
```bash
# 安装 Tauri CLI（如果还没有安装）
cargo install tauri-cli

# 生成签名密钥对
cargo tauri signer generate -w ~/.tauri/miaoda.key

# 这会生成两个文件：
# - ~/.tauri/miaoda.key (私钥)
# - ~/.tauri/miaoda.key.pub (公钥)
```

2. **添加到 GitHub Secrets**：
```bash
# 获取私钥内容
cat ~/.tauri/miaoda.key

# 将内容复制到 GitHub Secrets:
# - 名称：TAURI_SIGNING_PRIVATE_KEY
# - 值：私钥文件的完整内容

# 如果设置了密码，也添加：
# - 名称：TAURI_SIGNING_PRIVATE_KEY_PASSWORD
# - 值：你的密码
```

3. **配置公钥**：
将公钥内容添加到 `src-tauri/tauri.conf.json`:
```json
{
  "bundle": {
    "createUpdaterArtifacts": true
  },
  "plugins": {
    "updater": {
      "pubkey": "你的公钥内容"
    }
  }
}
```

## 构建产物

### 下载构建文件

构建完成后，可以通过以下方式获取安装包：

1. **从 Actions 页面下载**：
   - 进入 Actions 标签
   - 点击对应的工作流运行记录
   - 在页面底部找到 `Artifacts` 部分
   - 下载 `miaoda-windows-版本号` 压缩包

2. **从 Release 页面下载**（仅限标签触发）：
   - 当通过标签触发构建时，会自动创建 Release
   - 访问 Releases 页面下载安装包

### 文件说明

构建会生成以下文件：
- `Miaoda_版本号_x64-setup.exe` - Windows 64位安装程序
- `Miaoda_版本号_x64-setup.exe.sig` - 签名文件（如果配置了签名）

## 常见问题

### Q: 构建失败怎么办？

检查以下几点：
1. 确保代码能在本地正常构建
2. 检查 GitHub Actions 的运行日志
3. 确认所有依赖都已正确配置

### Q: 如何加快构建速度？

工作流已配置了以下优化：
- Rust 编译缓存
- Node.js 依赖缓存
- 并行构建任务

### Q: 如何构建其他平台版本？

可以创建类似的工作流文件：
- macOS: 使用 `runs-on: macos-latest`
- Linux: 使用 `runs-on: ubuntu-latest`

## 进阶配置

### 自定义构建命令

修改 `.github/workflows/build-windows.yml` 中的构建步骤：

```yaml
- name: Build Tauri app
  run: |
    # 自定义构建命令
    yarn build:tauri --target x86_64-pc-windows-msvc
```

### 添加更多平台

创建新的工作流文件，例如 `build-macos.yml`：

```yaml
name: Build macOS Release
on:
  workflow_dispatch:
jobs:
  build-macos:
    runs-on: macos-latest
    # ... 其他配置
```

### 自动发布到其他平台

可以在工作流中添加步骤，将构建产物上传到：
- AWS S3
- Azure Blob Storage
- 自定义服务器

## 命令行触发构建

使用 GitHub CLI 触发构建：

```bash
# 安装 GitHub CLI
brew install gh  # macOS
# 或访问 https://cli.github.com/ 获取其他平台的安装方法

# 登录
gh auth login

# 触发工作流
gh workflow run build-windows.yml -f version=0.6.599
```

## 监控构建状态

```bash
# 查看工作流运行状态
gh run list --workflow=build-windows.yml

# 查看特定运行的详细信息
gh run view <run-id>

# 下载构建产物
gh run download <run-id>
```

## 故障排除

### 常见错误和解决方案

1. **错误：`yarn install` 失败**
   - 确保 `package.json` 和 `yarn.lock` 文件都已提交
   - 检查 Node.js 版本是否正确

2. **错误：Rust 编译失败**
   - 确保目标平台配置正确
   - 检查 Cargo.toml 中的依赖版本

3. **错误：签名失败**
   - 确认签名密钥已正确配置
   - 检查密钥格式是否正确

## 联系支持

如有问题，请：
1. 查看 [GitHub Actions 文档](https://docs.github.com/actions)
2. 查看 [Tauri 文档](https://tauri.app/v1/guides/)
3. 在项目中创建 Issue

---

最后更新：2025-09-10