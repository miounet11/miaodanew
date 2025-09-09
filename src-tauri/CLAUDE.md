[根目录](../CLAUDE.md) > **src-tauri**

# Miaoda Tauri 桌面端

> 基于 Rust + Tauri 2.0 构建的桌面应用后端，提供系统集成和原生功能

## 模块职责

Src-tauri 模块是 Miaoda 桌面应用的后端核心，负责：

- 🦀 **Rust 后端**：高性能的桌面应用后端服务
- 🪟 **系统集成**：与操作系统的深度集成（文件系统、进程管理等）
- 🔌 **原生插件**：硬件监控、LLaMA.cpp 集成等原生插件
- 🔗 **前后端通信**：与 React 前端的高效通信桥梁
- 📦 **应用打包**：跨平台桌面应用的构建和分发
- 🛡️ **安全管理**：权限控制和安全策略

## 入口与启动

### 应用入口

- **主入口**: `src/main.rs` - Tauri 应用主函数
- **库入口**: `src/lib.rs` - 应用逻辑库
- **构建脚本**: `build.rs` - 构建时脚本
- **配置文件**: `tauri.conf.json` - Tauri 应用配置

### 核心配置

```toml
# Cargo.toml
[package]
name = "Miaoda"
version = "0.6.599"
description = "Use offline LLMs with your own data..."
authors = ["miaoda <service@miaoda.xin>"]
license = "MIT"
edition = "2021"
```

### 启动方式

```bash
# 开发模式
yarn dev:tauri

# 构建应用
yarn build:tauri

# 特定平台构建
yarn build:tauri:darwin   # macOS
yarn build:tauri:win32    # Windows  
yarn build:tauri:linux    # Linux
```

## 对外接口

### Tauri 命令 API

```rust
// 主要导出的命令
#[tauri::command]
async fn get_system_info() -> Result<SystemInfo, String>

#[tauri::command] 
async fn load_llama_model(model_path: String) -> Result<(), String>

#[tauri::command]
async fn get_hardware_usage() -> Result<HardwareUsage, String>

#[tauri::command]
async fn manage_process(action: ProcessAction) -> Result<ProcessResult, String>
```

### 插件系统

| 插件名称 | 功能描述 | 状态 |
|----------|----------|------|
| **tauri-plugin-hardware** | 硬件信息监控 | ✅ 稳定 |
| **tauri-plugin-llamacpp** | LLaMA.cpp 集成 | ✅ 稳定 |
| **tauri-plugin-store** | 本地数据存储 | ✅ 稳定 |
| **tauri-plugin-shell** | 系统命令执行 | ✅ 稳定 |
| **tauri-plugin-updater** | 应用自动更新 | ✅ 稳定 |

### 事件系统

```rust
// 主要事件类型
pub enum AppEvent {
    ModelLoaded(ModelInfo),
    ModelLoadError(String), 
    SystemResourceUpdated(ResourceInfo),
    ProcessStatusChanged(ProcessStatus),
    ConfigurationChanged(Config),
}

// 事件发送示例
app.emit_all("model-loaded", ModelInfo { ... })?;
```

## 关键依赖与配置

### 核心依赖

```toml
[dependencies]
# Tauri 核心
tauri = { version = "2.5.0", features = [...] }

# 系统操作
dirs = "6.0.0"
fix-path-env = { git = "https://github.com/tauri-apps/fix-path-env-rs" }

# 网络和 HTTP
reqwest = { version = "0.11", features = ["json", "blocking", "stream"] }
hyper = { version = "0.14", features = ["server"] }

# 异步运行时
tokio = { version = "1", features = ["full"] }
futures-util = "0.3.31"

# 序列化
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
serde_yaml = "0.9.34"

# 错误处理
thiserror = "2.0.12"

# 其他工具
uuid = { version = "1.7", features = ["v4"] }
tar = "0.4"
flate2 = "1.0"
```

### 平台特定依赖

```toml
# Unix 系统
[target.'cfg(unix)'.dependencies]
nix = "=0.30.1"

# Windows 系统  
[target.'cfg(windows)'.dependencies]
libc = "0.2.172"
windows-sys = { version = "0.60.2", features = ["Win32_Storage_FileSystem"] }

# 非移动端平台
[target.'cfg(not(any(target_os = "android", target_os = "ios")))'.dependencies]
tauri-plugin-updater = "2"
tauri-plugin-single-instance = { version = "2.0.0", features = ["deep-link"] }
```

### Tauri 配置

```json
// tauri.conf.json (简化)
{
  "productName": "Miaoda",
  "version": "0.6.599",
  "identifier": "ai.miaoda.app",
  "bundle": {
    "targets": ["dmg", "msi", "appimage"],
    "icon": ["icons/icon.png"]
  },
  "security": {
    "csp": "default-src 'self' 'unsafe-inline' data: blob: tauri:"
  }
}
```

## 数据模型

### 系统信息结构

```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    pub os: String,
    pub arch: String,
    pub cpu_count: usize,
    pub total_memory: u64,
    pub available_memory: u64,
    pub gpu_info: Vec<GpuInfo>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GpuInfo {
    pub name: String,
    pub vendor: String,
    pub memory: Option<u64>,
    pub driver_version: Option<String>,
}
```

### 模型管理结构

```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct ModelSession {
    pub id: String,
    pub model_path: String,
    pub status: ModelStatus,
    pub port: Option<u16>,
    pub process_id: Option<u32>,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ModelStatus {
    Loading,
    Loaded,
    Failed(String),
    Unloaded,
}
```

### 硬件监控结构

```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct HardwareUsage {
    pub cpu_usage: f32,
    pub memory_usage: MemoryUsage,
    pub gpu_usage: Vec<GpuUsage>,
    pub disk_usage: Vec<DiskUsage>,
    pub temperature: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MemoryUsage {
    pub used: u64,
    pub total: u64,
    pub percent: f32,
}
```

## 测试与质量

### 测试策略

- **单元测试**: 核心业务逻辑测试
- **集成测试**: 插件和系统集成测试
- **平台测试**: 多平台兼容性测试
- **性能测试**: 系统资源使用测试

### 测试工具

```bash
# Rust 测试
cargo test

# 特定平台测试
cargo test --target x86_64-apple-darwin

# 发布模式测试
cargo test --release
```

### 构建和分发

```bash
# 构建 Tauri 应用
tauri build

# 构建插件
cd plugins/tauri-plugin-hardware && cargo build --release
cd plugins/tauri-plugin-llamacpp && cargo build --release
```

## 常见问题 (FAQ)

### Q: 如何添加新的 Tauri 命令？

A: 在 Rust 代码中定义命令函数并注册：

```rust
#[tauri::command]
async fn my_custom_command(param: String) -> Result<String, String> {
    // 命令逻辑
    Ok(format!("处理参数: {}", param))
}

// 在 main.rs 中注册
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            my_custom_command,
            // 其他命令...
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Q: 如何在前端调用 Rust 命令？

A: 使用 Tauri API：

```typescript
import { invoke } from '@tauri-apps/api/core'

// 调用 Rust 命令
const result = await invoke<string>('my_custom_command', {
  param: 'hello world'
})

console.log(result) // "处理参数: hello world"
```

### Q: 如何处理系统事件？

A: 监听系统事件：

```typescript
import { listen } from '@tauri-apps/api/event'

// 监听自定义事件
const unlisten = await listen('system-resource-updated', (event) => {
  console.log('系统资源更新:', event.payload)
})

// 取消监听
unlisten()
```

### Q: 如何开发自定义插件？

A: 创建新的插件目录和 Cargo.toml：

```toml
# plugins/tauri-plugin-custom/Cargo.toml
[package]
name = "tauri-plugin-custom"
version = "0.1.0"
edition = "2021"

[dependencies]
tauri = "2.0"
serde = { version = "1.0", features = ["derive"] }
```

```rust
// plugins/tauri-plugin-custom/src/lib.rs
use tauri::{plugin::Builder, Runtime};

#[tauri::command]
async fn custom_function() -> Result<String, String> {
    Ok("自定义功能".to_string())
}

pub fn init<R: Runtime>() -> tauri::plugin::TauriPlugin<R> {
    Builder::new("custom")
        .invoke_handler(tauri::generate_handler![custom_function])
        .build()
}
```

## 相关文件清单

### 核心源码结构

```
src-tauri/
├── src/
│   ├── main.rs                # 主入口
│   ├── lib.rs                 # 库入口
│   ├── commands/              # Tauri 命令
│   ├── events/                # 事件处理
│   ├── utils/                 # 工具函数
│   └── config/                # 配置管理
├── plugins/                   # 自定义插件
│   ├── tauri-plugin-hardware/ # 硬件监控插件
│   │   ├── src/
│   │   ├── Cargo.toml
│   │   └── package.json
│   └── tauri-plugin-llamacpp/ # LLaMA.cpp 插件
│       ├── src/
│       ├── Cargo.toml
│       └── package.json
├── utils/                     # 工具库
│   ├── src/lib.rs
│   └── Cargo.toml
├── resources/                 # 应用资源
│   ├── pre-install/          # 预安装文件
│   └── bin/                  # 二进制文件
└── icons/                    # 应用图标
    └── icon.png
```

### 配置文件

```
├── Cargo.toml                # Rust 项目配置
├── tauri.conf.json           # Tauri 应用配置
├── build.rs                  # 构建脚本
├── permissions/              # 权限配置
└── build-utils/              # 构建工具
    ├── shim-linuxdeploy.sh
    └── buildAppImage.sh
```

### 构建产物

```
target/
├── debug/                    # 调试构建
├── release/                  # 发布构建
└── [target-triple]/          # 平台特定构建
    ├── debug/
    └── release/
```

## 变更记录 (Changelog)

### 2025-09-08 - 模块文档初始化

- 📝 创建 Tauri 桌面端模块技术文档
- 🦀 梳理 Rust 后端架构和插件系统
- 🔧 整理构建配置和平台支持
- 📋 建立开发指南和常见问题解答