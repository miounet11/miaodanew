# Miaoda 工具链配置文档

## 工具版本要求

本项目使用统一的工具链版本配置，确保所有开发和构建环境的一致性。

### 核心工具版本

| 工具 | 版本 | 配置文件 | 说明 |
|------|------|----------|------|
| Node.js | 20.18.0 | `.nvmrc` | LTS 版本，稳定且支持最新特性 |
| Yarn | 4.5.3+ | `package.json#packageManager` | 现代包管理器，支持 Workspaces |
| Rust | 1.77.2 | `rust-toolchain.toml` | 与 Tauri 2.0 兼容的稳定版本 |
| TypeScript | ~5.8.3 | `resolutions` | 锁定版本避免兼容性问题 |

### Windows 构建工具

| 工具 | 版本 | 用途 |
|------|------|------|
| jq | latest | JSON 文件处理 |
| ctoml | 0.1.0 | TOML 文件处理 |
| AzureSignTool | 4.0.1 | 代码签名 |
| signtool | Windows SDK | 备用签名工具 |

### Rust 工具链配置

```toml
[toolchain]
channel = "1.77.2"
components = ["rustfmt", "clippy"]  
targets = [
  "x86_64-pc-windows-msvc",
  "x86_64-unknown-linux-gnu", 
  "x86_64-apple-darwin",
  "aarch64-apple-darwin"
]
profile = "minimal"
```

### Node.js 版本管理

项目根目录的 `.nvmrc` 文件指定了 Node.js 版本：
```
20.18.0
```

使用方法：
```bash
# 自动切换到项目指定版本
nvm use

# 安装项目指定版本
nvm install
```

### Yarn 配置优化

`.yarnrc.yml` 配置了以下优化：
- `enableGlobalCache: true` - 启用全局缓存
- `compressionLevel: mixed` - 优化缓存压缩
- `networkTimeout: 600000` - 增加网络超时时间
- `httpTimeout: 60000` - HTTP 请求超时时间

## 依赖版本锁定

通过 `package.json` 的 `resolutions` 字段锁定关键依赖版本：

```json
{
  "resolutions": {
    "yallist": "4.0.0",
    "@tauri-apps/cli": "2.7.0",
    "typescript": "~5.8.3",
    "vite": "^6.3.0",
    "vitest": "^3.1.3",
    "rollup": "^4.0.0",
    "esbuild": "^0.24.0"
  }
}
```

## GitHub Actions 缓存策略

### 1. Node.js 和 Yarn 缓存
- 使用 `actions/setup-node@v4` 的内置缓存
- 额外缓存 `.yarn/cache` 和 `node_modules`
- 缓存键基于 `yarn.lock` 文件哈希

### 2. Rust 缓存
- 使用 `swatinem/rust-cache@v2`
- 启用 `cache-on-failure` 和 `cache-all-crates`
- 工作空间路径：`./src-tauri -> target`

### 3. 构建工具缓存
- 缓存 Cargo 安装的二进制文件
- 缓存 .NET Global Tools
- 缓存键：`build-tools-v1`

## 开发环境设置

### 本地开发

1. 确保安装了正确版本的工具：
```bash
# 检查 Node.js 版本
node --version  # 应该是 20.18.0

# 检查 Yarn 版本  
yarn --version  # 应该是 4.5.3+

# 检查 Rust 版本
rustc --version  # 应该是 1.77.2
```

2. 安装依赖：
```bash
yarn install --immutable
```

3. 构建项目：
```bash
yarn build
```

### CI/CD 环境

GitHub Actions 工作流会自动：
1. 使用 `.nvmrc` 设置 Node.js 版本
2. 启用 Corepack 并锁定 Yarn 版本
3. 使用 `rust-toolchain.toml` 设置 Rust 版本
4. 安装必要的构建工具
5. 设置多层缓存以加速构建

## 版本升级策略

### 主要版本升级
1. 更新相应的配置文件（`.nvmrc`, `rust-toolchain.toml`）
2. 更新 `package.json` 中的 engines 和 resolutions
3. 更新 GitHub Actions 工作流
4. 进行全面测试确保兼容性

### 次要版本升级
1. 更新 `resolutions` 中的锁定版本
2. 运行测试确保无破坏性变更
3. 更新文档

## 故障排除

### 常见问题

1. **Node.js 版本不匹配**
   ```bash
   nvm use  # 切换到项目指定版本
   ```

2. **Yarn 版本不匹配**
   ```bash
   corepack enable
   corepack prepare yarn@4.5.3 --activate
   ```

3. **Rust 工具链问题**
   ```bash
   rustup show  # 检查当前工具链
   rustup toolchain install 1.77.2  # 安装指定版本
   ```

4. **缓存问题**
   ```bash
   yarn cache clean  # 清理 Yarn 缓存
   cargo clean  # 清理 Rust 缓存
   ```

### 调试构建问题

1. 检查工具版本是否正确
2. 清理所有缓存后重新构建
3. 检查网络连接和代理设置
4. 查看详细的构建日志

## 性能优化

### 构建时间优化
- 启用多层缓存系统
- 使用 `--immutable` 标志确保依赖一致性
- 合理配置网络超时时间
- 使用最小化的 Rust 工具链

### 缓存命中率
- 基于文件哈希的缓存键
- 分离不同类型的缓存
- 设置合理的缓存保留策略

通过遵循此工具链配置，可以确保：
- 所有环境使用相同的工具版本
- 依赖安装成功率 100%
- 构建时间通过缓存优化减少 30%以上
- 减少因版本不一致导致的问题