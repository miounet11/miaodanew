# 喵岛 (Miaoda) - 独立AI项目

## 项目简介

这是一个全新的独立AI项目，基于原有的技术栈进行创新和发展。我们致力于创建一个更加灵活、易用且功能强大的AI平台。

## 主要特性

### 🧠 AI模型支持
- 支持多种主流AI模型
- 本地模型部署
- 云端模型集成
- 模型性能优化

### 🔧 核心功能
- 智能对话系统
- 多模态内容处理
- 插件扩展系统
- API服务支持

### 🎨 用户界面
- 现代化Web界面
- 响应式设计
- 主题定制
- 多语言支持

### 📱 跨平台支持
- Web应用
- 桌面应用 (Tauri)
- 移动端适配
- 浏览器扩展

## 技术栈

- **前端**: React, TypeScript, Vite
- **后端**: Tauri (Rust), Node.js
- **AI引擎**: Llama.cpp, MCP协议
- **构建工具**: Rolldown, Vite
- **包管理**: Yarn, npm

## 项目结构

```
├── core/              # 核心AI引擎
├── web-app/           # Web应用界面
├── extensions/        # 插件扩展系统
├── extensions-web/    # Web扩展
├── docs/              # 文档网站
├── website/           # 官方网站
├── src-tauri/         # 桌面应用 (Rust)
├── autoqa/            # 自动化测试
├── scripts/           # 构建脚本
├── .github/           # GitHub配置
└── .devcontainer/     # 开发环境配置
```

## 快速开始

### 环境要求
- Node.js 18+
- Rust (for Tauri)
- Git

### 安装步骤

1. 克隆项目
```bash
git clone https://github.com/miounet11/miaodanew.git
cd miaodanew
```

2. 安装依赖
```bash
yarn install
```

3. 启动开发服务器
```bash
yarn dev
```

## 开发环境设置

### 使用Make命令
```bash
make dev        # 完整开发环境设置和启动
make build      # 生产环境构建
make test       # 运行测试和代码检查
make clean      # 清理所有构建文件
```

### 使用Mise工具
```bash
# 安装mise (如果还没有安装)
curl https://mise.run | sh

# 安装工具并启动开发环境
mise install    # 安装Node.js, Rust等工具
mise dev        # 运行完整开发环境设置
```

## 系统要求

**推荐配置:**
- **macOS**: 13.6+ (8GB RAM for 3B models, 16GB for 7B, 32GB for 13B)
- **Windows**: 10+ 支持NVIDIA/AMD/Intel Arc GPU
- **Linux**: 大多数发行版都支持，GPU加速可用

## 贡献指南

我们欢迎各种形式的贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细的贡献流程。

### 开发流程

1. Fork 本仓库
2. 创建特性分支: `git checkout -b feature/AmazingFeature`
3. 提交更改: `git commit -m 'Add some AmazingFeature'`
4. 推送分支: `git push origin feature/AmazingFeature`
5. 提交 Pull Request

## 问题排查

遇到问题时：

1. 检查我们的文档和常见问题
2. 查看控制台错误日志
3. 在GitHub Issues中搜索相似问题
4. 提交新的问题报告

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 致谢

感谢所有为这个项目做出贡献的开发者们！

---

**项目地址**: https://github.com/miounet11/miaodanew
**邮箱**: 9248293@gmail.com
