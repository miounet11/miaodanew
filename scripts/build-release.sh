#!/bin/bash
# Miaoda 完整构建脚本 - 生产版本发布
# 用途：一键构建包含完整前端的桌面应用安装包

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 开始构建
echo -e "${GREEN}
╔══════════════════════════════════════════╗
║     Miaoda 完整构建流程 v3.0.1          ║
╚══════════════════════════════════════════╝
${NC}"

# 1. 环境检查
log_info "步骤 1/10: 检查构建环境..."
node_version=$(node --version)
yarn_version=$(yarn --version)
log_success "Node.js: $node_version"
log_success "Yarn: $yarn_version"

# 检查 Rust
if command -v rustc &> /dev/null; then
    rust_version=$(rustc --version)
    log_success "Rust: $rust_version"
else
    log_error "Rust 未安装！请先安装 Rust"
    exit 1
fi

# 2. 清理旧构建
log_info "步骤 2/10: 清理旧构建产物..."
rm -rf web-app/dist-web
rm -rf web-app/dist
rm -rf src-tauri/target/*/release/bundle
log_success "清理完成"

# 3. 配置 Yarn
log_info "步骤 3/10: 配置 Yarn..."
corepack enable
corepack prepare yarn@4.5.3 --activate
yarn config set -H enableImmutableInstalls false
log_success "Yarn 配置完成"

# 4. 安装依赖
log_info "步骤 4/10: 安装项目依赖..."
yarn install
log_success "依赖安装完成"

# 5. 构建核心组件
log_info "步骤 5/10: 构建核心组件..."
log_info "  - 构建 Tauri 插件..."
yarn build:tauri:plugin:api

log_info "  - 构建 Core 库..."
yarn build:core

log_info "  - 构建扩展..."
yarn build:extensions
yarn build:extensions-web
log_success "核心组件构建完成"

# 6. 下载资源
log_info "步骤 6/10: 下载必要资源..."
yarn download:bin
yarn download:lib
log_success "资源下载完成"

# 7. 准备资源文件
log_info "步骤 7/10: 准备资源文件..."
yarn copy:assets:tauri
yarn build:icon
log_success "资源准备完成"

# 8. 构建前端
log_info "步骤 8/10: 构建前端应用..."
yarn build:web-app

# 验证前端构建
if [ ! -f "web-app/dist-web/index.html" ]; then
    log_error "前端构建失败！未找到 index.html"
    exit 1
fi

# 检查是否包含错误页面
if grep -q "Miaoda Web - Build Failed" web-app/dist-web/index.html; then
    log_error "前端构建生成了错误页面！"
    exit 1
fi

log_success "前端构建成功"

# 9. 验证 Tauri 配置
log_info "步骤 9/10: 验证配置文件..."

# 检查 frontendDist 路径
frontend_dist=$(grep -o '"frontendDist": "[^"]*"' src-tauri/tauri.conf.json | cut -d'"' -f4)
if [ "$frontend_dist" != "../web-app/dist-web" ]; then
    log_warning "修正 frontendDist 路径..."
    sed -i '' 's|"frontendDist": ".*"|"frontendDist": "../web-app/dist-web"|' src-tauri/tauri.conf.json
fi

log_success "配置验证完成"

# 10. 构建 Tauri 应用
log_info "步骤 10/10: 构建桌面应用..."

# 检测操作系统
OS_TYPE=$(uname -s)
case "$OS_TYPE" in
    Darwin*)
        log_info "检测到 macOS，构建 macOS 版本..."
        yarn build:tauri:darwin
        
        # 查找构建产物
        DMG_PATH=$(find src-tauri/target -name "*.dmg" -type f | head -1)
        APP_PATH=$(find src-tauri/target -name "miaoda.app" -type d | head -1)
        ;;
    Linux*)
        log_info "检测到 Linux，构建 Linux 版本..."
        yarn build:tauri:linux
        ;;
    MINGW*|CYGWIN*|MSYS*)
        log_info "检测到 Windows，构建 Windows 版本..."
        yarn build:tauri:win32
        ;;
    *)
        log_error "未知操作系统: $OS_TYPE"
        exit 1
        ;;
esac

# 构建完成
echo -e "${GREEN}
╔══════════════════════════════════════════╗
║         ✅ 构建成功完成！                ║
╚══════════════════════════════════════════╝
${NC}"

# 显示构建产物位置
log_success "构建产物位置："
if [ -n "$DMG_PATH" ]; then
    log_info "  DMG 安装包: $DMG_PATH"
    log_info "  大小: $(du -h "$DMG_PATH" | cut -f1)"
fi
if [ -n "$APP_PATH" ]; then
    log_info "  应用程序包: $APP_PATH"
    log_info "  大小: $(du -sh "$APP_PATH" | cut -f1)"
fi

# 构建信息
echo -e "${BLUE}
构建信息：
  版本: 3.0.1
  时间: $(date)
  平台: $OS_TYPE
${NC}"

# 后续步骤提示
echo -e "${YELLOW}
后续步骤：
1. 测试安装包是否正常工作
2. 验证前端界面显示正确
3. 检查自动更新功能
4. 准备发布到 GitHub Releases
${NC}"