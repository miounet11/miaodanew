#!/bin/bash
# Miaoda Windows 专业安装包构建脚本
# 支持 32位/64位，NSIS/MSI 安装包，便携版 ZIP

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Miaoda Windows 专业安装包构建器${NC}"

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.."; pwd)"
cd "$PROJECT_ROOT"

# 构建产物目录
DIST_DIR="$PROJECT_ROOT/dist"
WINDOWS_DIST="$DIST_DIR/windows-packages"
BUILD_DATE=$(date '+%Y-%m-%d %H:%M:%S')
VERSION=$(grep '^version = ' src-tauri/Cargo.toml | sed 's/version = "\(.*\)"/\1/')

echo -e "${BLUE}📦 构建配置${NC}"
echo "  项目根目录: $PROJECT_ROOT"
echo "  版本号: $VERSION"
echo "  构建时间: $BUILD_DATE"
echo "  输出目录: $WINDOWS_DIST"

# 清理并创建输出目录
echo -e "${BLUE}🧹 清理构建目录...${NC}"
rm -rf "$WINDOWS_DIST"
mkdir -p "$WINDOWS_DIST"/{x64,x86,portable}

# 构建目标配置
TARGETS=("x86_64-pc-windows-msvc" "i686-pc-windows-msvc")
ARCHITECTURES=("x64" "x86")

# 构建函数
build_for_target() {
    local target=$1
    local arch=$2
    
    echo -e "${GREEN}🔨 构建 $arch 版本 ($target)...${NC}"
    
    # 添加构建目标
    rustup target add $target
    
    # 检查前端构建产物是否存在
    echo -e "${BLUE}🔍 检查前端构建产物...${NC}"
    if [ ! -d "web-app/dist" ]; then
        echo -e "${YELLOW}⚠️  前端构建产物不存在，使用简化构建流程${NC}"
        # 使用已有的构建产物或跳过前端构建
    else
        echo -e "${GREEN}✅ 前端构建产物已存在${NC}"
    fi
    
    # 使用 Tauri CLI 构建完整安装包
    echo -e "${BLUE}📋 构建 Tauri 应用...${NC}"
    yarn tauri build --target $target || {
        echo -e "${YELLOW}⚠️  Tauri 打包失败，尝试仅编译二进制文件${NC}"
        cd src-tauri
        cargo build --release --target $target
        cd ..
        
        # 手动创建便携版
        create_portable_version $target $arch
        return
    }
    
    # 复制构建产物
    copy_build_artifacts $target $arch
}

# 复制构建产物函数
copy_build_artifacts() {
    local target=$1
    local arch=$2
    local target_dir="$WINDOWS_DIST/$arch"
    
    echo -e "${BLUE}📋 复制 $arch 构建产物...${NC}"
    
    # 查找并复制安装包
    find src-tauri/target/$target/release/bundle -name "*.msi" -exec cp {} "$target_dir/" \; 2>/dev/null || true
    find src-tauri/target/$target/release/bundle -name "*.exe" -exec cp {} "$target_dir/" \; 2>/dev/null || true
    
    # 复制主程序用于便携版
    if [ -f "src-tauri/target/$target/release/miaoda.exe" ]; then
        cp "src-tauri/target/$target/release/miaoda.exe" "$WINDOWS_DIST/portable/miaoda-$arch.exe"
    fi
}

# 创建便携版函数
create_portable_version() {
    local target=$1
    local arch=$2
    
    echo -e "${BLUE}📦 创建 $arch 便携版...${NC}"
    
    local portable_dir="$WINDOWS_DIST/portable/miaoda-$arch"
    mkdir -p "$portable_dir"
    
    # 复制主程序
    if [ -f "src-tauri/target/$target/release/miaoda.exe" ]; then
        cp "src-tauri/target/$target/release/miaoda.exe" "$portable_dir/"
        echo "  ✅ miaoda.exe"
    fi
    
    # 复制依赖工具（如果存在）
    if [ -f "src-tauri/resources/bin/bun-$target.exe" ]; then
        cp "src-tauri/resources/bin/bun-$target.exe" "$portable_dir/bun.exe"
        echo "  ✅ bun.exe"
    fi
    
    if [ -f "src-tauri/resources/bin/uv-$target.exe" ]; then
        cp "src-tauri/resources/bin/uv-$target.exe" "$portable_dir/uv.exe"
        echo "  ✅ uv.exe"
    fi
    
    # 创建启动脚本
    cat > "$portable_dir/启动.bat" << 'EOF'
@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo 正在启动 Miaoda...
start "" miaoda.exe
EOF
    
    # 创建说明文件
    cat > "$portable_dir/README.txt" << EOF
Miaoda Windows 便携版 v$VERSION
================================

使用说明：
1. 双击 miaoda.exe 或 启动.bat 运行应用
2. 本版本为便携版，可直接运行，无需安装
3. 确保 Windows 7 及以上版本

系统要求：
- Windows 7 SP1 / Windows 8 / Windows 10 / Windows 11
- 架构: $arch
- WebView2 运行时（首次运行时会自动安装）

构建信息：
- 版本: $VERSION
- 构建时间: $BUILD_DATE
- 架构: $arch ($target)

更多信息请访问：https://github.com/miounet11/miaodanew
EOF
    
    # 创建 ZIP 压缩包
    cd "$WINDOWS_DIST/portable"
    zip -r "miaoda-v$VERSION-windows-$arch-portable.zip" "miaoda-$arch/"
    cd "$PROJECT_ROOT"
    
    echo "  ✅ 便携版 ZIP: miaoda-v$VERSION-windows-$arch-portable.zip"
}

# 创建安装包摘要
create_release_summary() {
    cat > "$WINDOWS_DIST/RELEASE_NOTES.md" << EOF
# Miaoda Windows 发行版 v$VERSION

## 📦 安装包说明

### 🖥️ 标准安装包
- **miaoda-v$VERSION-x64.msi** - 64位标准安装包（推荐）
- **miaoda-v$VERSION-x86.msi** - 32位标准安装包

### 📁 便携版
- **miaoda-v$VERSION-windows-x64-portable.zip** - 64位便携版
- **miaoda-v$VERSION-windows-x86-portable.zip** - 32位便携版

## 🎯 兼容性

### 系统要求
- **操作系统**: Windows 7 SP1 / 8 / 10 / 11
- **架构**: x64 (推荐) / x86
- **WebView2**: 自动安装最新版本

### 安装建议
1. **新用户**: 推荐使用 64位标准安装包 (msi)
2. **便携使用**: 使用对应架构的便携版 (zip)
3. **企业部署**: 支持静默安装和批量部署

## 🚀 安装方式

### 标准安装
1. 下载对应架构的 .msi 文件
2. 双击运行，按向导安装
3. 支持自定义安装路径

### 便携版使用
1. 下载对应架构的 .zip 文件
2. 解压到任意目录
3. 运行 miaoda.exe 或 启动.bat

## 📋 版本信息
- **版本号**: $VERSION
- **构建时间**: $BUILD_DATE
- **支持语言**: 简体中文、English

## 🔗 获取支持
- GitHub: https://github.com/miounet11/miaodanew
- 问题反馈: https://github.com/miounet11/miaodanew/issues
EOF
}

# 主构建流程
echo -e "${GREEN}🏗️  开始多架构构建...${NC}"

# 构建所有目标架构
for i in "${!TARGETS[@]}"; do
    target="${TARGETS[$i]}"
    arch="${ARCHITECTURES[$i]}"
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    build_for_target "$target" "$arch"
done

# 创建发行说明
echo -e "${BLUE}📋 生成发行说明...${NC}"
create_release_summary

# 显示构建结果
echo -e "${GREEN}🎉 Windows 安装包构建完成！${NC}"
echo ""
echo -e "${BLUE}📊 构建结果:${NC}"
echo "├── 标准安装包:"
ls -lh "$WINDOWS_DIST"/{x64,x86}/*.{msi,exe} 2>/dev/null | sed 's/^/│   /' || echo "│   (未生成标准安装包)"
echo "├── 便携版:"
ls -lh "$WINDOWS_DIST/portable"/*.zip 2>/dev/null | sed 's/^/│   /' || echo "│   (未生成便携版)"
echo "└── 文档:"
ls -lh "$WINDOWS_DIST"/*.md 2>/dev/null | sed 's/^/    /'

echo ""
echo -e "${BLUE}📍 构建产物位置:${NC}"
echo "  $WINDOWS_DIST"
echo ""
echo -e "${BLUE}📖 使用建议:${NC}"
echo "  1. 个人用户: 下载 64位 msi 安装包"
echo "  2. 便携使用: 下载对应架构的 zip 文件"
echo "  3. 兼容性要求: 32位版本支持更多老旧系统"

echo -e "${GREEN}✨ 构建流程全部完成！${NC}"