#!/bin/bash
# Miaoda Windows 构建脚本
# 用于在 macOS/Linux 上交叉编译 Windows 版本

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 开始构建 Miaoda Windows 版本...${NC}"

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# 构建产物目录
DIST_DIR="$PROJECT_ROOT/dist"
WINDOWS_DIST="$DIST_DIR/windows"
BUILD_DATE=$(date '+%Y-%m-%d %H:%M:%S')
VERSION=$(grep '"version"' src-tauri/Cargo.toml | sed 's/.*"\(.*\)".*/\1/')

echo -e "${BLUE}📦 项目信息${NC}"
echo "  项目根目录: $PROJECT_ROOT"
echo "  版本号: $VERSION"
echo "  构建时间: $BUILD_DATE"
echo "  输出目录: $WINDOWS_DIST"

# 清理并创建输出目录
echo -e "${BLUE}🧹 清理构建目录...${NC}"
rm -rf "$WINDOWS_DIST"
mkdir -p "$WINDOWS_DIST"

# 检查必要的工具
echo -e "${BLUE}🔍 检查构建环境...${NC}"

if ! command -v xwin &> /dev/null; then
    echo -e "${RED}❌ xwin 未安装，正在安装...${NC}"
    cargo install xwin
fi

if [ ! -d "/tmp/xwin" ]; then
    echo -e "${YELLOW}⚠️ Windows SDK 未找到，正在下载...${NC}"
    xwin --accept-license --arch x86_64 splat --output /tmp/xwin
fi

# 添加目标平台
echo -e "${BLUE}🎯 添加构建目标...${NC}"
rustup target add x86_64-pc-windows-msvc

# 创建临时工具
echo -e "${BLUE}🛠️ 创建构建工具...${NC}"
mkdir -p /tmp/build-tools

# 创建 lib.exe 替代脚本
cat > /tmp/build-tools/lib.exe << 'EOF'
#!/bin/bash
args=()
output=""
while [[ $# -gt 0 ]]; do
    case $1 in
        -out:*)
            output="${1#-out:}"
            ;;
        -nologo)
            ;;
        *.o|*.obj)
            args+=("$1")
            ;;
        *)
            ;;
    esac
    shift
done
if [[ -n "$output" ]]; then
    exec ar rcs "$output" "${args[@]}"
else
    exec ar rcs libdefault.a "${args[@]}"
fi
EOF
chmod +x /tmp/build-tools/lib.exe

# 创建 llvm-rc 替代工具（生成空的资源文件）
cat > /tmp/build-tools/llvm-rc << 'EOF'
#!/bin/bash
# 简单的 llvm-rc 替代工具
# 处理资源编译请求并生成空的 .lib 文件

output_file=""
while [[ $# -gt 0 ]]; do
    case $1 in
        -fo)
            output_file="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

if [[ -n "$output_file" ]]; then
    # 创建空的资源库文件
    touch "$output_file"
    # 如果输出文件是 .res，创建对应的 .lib 文件
    if [[ "$output_file" == *.res ]]; then
        lib_file="${output_file%.res}.lib"
        touch "$lib_file"
    fi
    echo "Generated empty resource file: $output_file"
else
    echo "llvm-rc: No output file specified"
fi

exit 0
EOF
chmod +x /tmp/build-tools/llvm-rc

# 设置环境变量
export PATH="/tmp/build-tools:$PATH"
export CFLAGS_x86_64_pc_windows_msvc="--target=x86_64-pc-windows-msvc -I/tmp/xwin/crt/include -I/tmp/xwin/sdk/include/ucrt -I/tmp/xwin/sdk/include/um -I/tmp/xwin/sdk/include/shared"
export INCLUDE="/tmp/xwin/crt/include:/tmp/xwin/sdk/include/ucrt:/tmp/xwin/sdk/include/um:/tmp/xwin/sdk/include/shared"
export LIB="/tmp/xwin/crt/lib/x86_64:/tmp/xwin/sdk/lib/um/x86_64:/tmp/xwin/sdk/lib/ucrt/x86_64"

# 下载 Windows 版本的依赖工具
echo -e "${BLUE}📥 下载 Windows 依赖工具...${NC}"

# 下载 bun
if [ ! -f "src-tauri/resources/bin/bun-x86_64-pc-windows-msvc.exe" ]; then
    echo "  下载 bun for Windows..."
    curl -L -o /tmp/bun-windows.zip "https://github.com/oven-sh/bun/releases/latest/download/bun-windows-x64.zip"
    cd /tmp && unzip -o bun-windows.zip
    cp bun-windows-x64/bun.exe "$PROJECT_ROOT/src-tauri/resources/bin/bun-x86_64-pc-windows-msvc.exe"
    cd "$PROJECT_ROOT"
    rm -rf /tmp/bun-windows*
fi

# 下载 uv
if [ ! -f "src-tauri/resources/bin/uv-x86_64-pc-windows-msvc.exe" ]; then
    echo "  下载 uv for Windows..."
    curl -L -o /tmp/uv-windows.zip "https://github.com/astral-sh/uv/releases/latest/download/uv-x86_64-pc-windows-msvc.zip"
    cd /tmp && unzip -o uv-windows.zip
    cp uv.exe "$PROJECT_ROOT/src-tauri/resources/bin/uv-x86_64-pc-windows-msvc.exe"
    cd "$PROJECT_ROOT"
    rm -rf /tmp/uv*
fi

# 开始构建
echo -e "${GREEN}🔨 开始编译 Windows 版本...${NC}"
echo "  目标平台: x86_64-pc-windows-msvc"
echo "  构建配置: release"

# 预创建可能缺失的资源文件目录
echo -e "${BLUE}🔧 预创建构建目录...${NC}"
mkdir -p src-tauri/target/x86_64-pc-windows-msvc/release/build

# 只编译，不进行打包（交叉编译时打包可能失败）
echo -e "${YELLOW}⚠️  交叉编译模式：仅编译二进制文件，跳过打包${NC}"
cd src-tauri

# 先运行构建脚本生成资源
echo -e "${BLUE}📋 运行构建脚本...${NC}"
cargo build --release --target x86_64-pc-windows-msvc --bin miaoda 2>&1 | tee ../build.log || {
    echo -e "${RED}❌ 编译失败，检查日志${NC}"
    
    # 尝试手动创建缺失的资源文件
    echo -e "${YELLOW}🔧 尝试修复缺失的资源文件...${NC}"
    
    # 查找构建目录并创建资源文件
    for build_dir in target/x86_64-pc-windows-msvc/release/build/Miaoda-*/out; do
        if [[ -d "$(dirname "$build_dir")" ]] && [[ ! -f "$build_dir/resource.lib" ]]; then
            echo "  创建 $build_dir/resource.lib"
            mkdir -p "$build_dir"
            # 创建空的资源库文件
            ar rcs "$build_dir/resource.lib"
        fi
    done
    
    # 重新尝试构建
    echo -e "${BLUE}🔄 重新尝试构建...${NC}"
    cargo build --release --target x86_64-pc-windows-msvc --bin miaoda || {
        echo -e "${RED}❌ 构建仍然失败${NC}"
        exit 1
    }
}
cd ..

# 检查构建结果
BUILD_EXE="src-tauri/target/x86_64-pc-windows-msvc/release/miaoda.exe"
if [ ! -f "$BUILD_EXE" ]; then
    echo -e "${RED}❌ 未找到构建产物: $BUILD_EXE${NC}"
    exit 1
fi

# 复制构建产物到 dist 目录
echo -e "${BLUE}📋 整理构建产物...${NC}"

# 复制主程序
cp "$BUILD_EXE" "$WINDOWS_DIST/"
echo "  ✅ miaoda.exe"

# 复制依赖工具
if [ -f "src-tauri/target/x86_64-pc-windows-msvc/release/bun.exe" ]; then
    cp "src-tauri/target/x86_64-pc-windows-msvc/release/bun.exe" "$WINDOWS_DIST/"
    echo "  ✅ bun.exe"
fi

if [ -f "src-tauri/target/x86_64-pc-windows-msvc/release/uv.exe" ]; then
    cp "src-tauri/target/x86_64-pc-windows-msvc/release/uv.exe" "$WINDOWS_DIST/"
    echo "  ✅ uv.exe"
fi

# 生成构建信息文件
cat > "$WINDOWS_DIST/BUILD_INFO.txt" << EOF
Miaoda Windows Build Information
================================

Build Date: $BUILD_DATE
Version: $VERSION
Target: x86_64-pc-windows-msvc
Built on: $(uname -s) $(uname -r)

Files:
$(ls -la "$WINDOWS_DIST" | grep -E '\.(exe|dll)$' | awk '{print "  " $9 " (" $5 " bytes)"}')

Usage:
  Double-click miaoda.exe to start the application
  Ensure all .exe files are in the same directory

System Requirements:
  - Windows 10/11 (64-bit)
  - 4GB RAM minimum
  - 200MB disk space
EOF

# 创建启动脚本
cat > "$WINDOWS_DIST/start.bat" << 'BATEOF'
@echo off
cd /d "%~dp0"
start miaoda.exe
BATEOF

# 显示构建结果
echo -e "${GREEN}🎉 构建成功完成！${NC}"
echo ""
echo -e "${BLUE}📊 构建结果:${NC}"
ls -lh "$WINDOWS_DIST/"
echo ""
echo -e "${BLUE}📍 构建产物位置:${NC}"
echo "  $WINDOWS_DIST"
echo ""
echo -e "${BLUE}📖 使用说明:${NC}"
echo "  1. 将 windows/ 目录下的所有文件复制到 Windows 机器"
echo "  2. 运行 miaoda.exe 启动应用"
echo "  3. 或者双击 start.bat 快捷启动"

# 清理临时文件
rm -rf /tmp/build-tools

echo -e "${GREEN}✨ 构建流程全部完成！${NC}"
