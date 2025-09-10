#!/bin/bash

echo "🚀 构建 Windows 版本 Miaoda"
echo "================================"

# 选择构建方式
echo "请选择构建方式:"
echo "1. 使用 Docker（推荐，需要 Docker Desktop）"
echo "2. 使用 GitHub Actions（需要推送到 GitHub）"
echo "3. 使用虚拟机（需要 Windows 虚拟机）"
read -p "请输入选项 (1/2/3): " choice

case $choice in
  1)
    echo "📦 使用 Docker 构建..."
    
    # 检查 Docker 是否安装
    if ! command -v docker &> /dev/null; then
      echo "❌ Docker 未安装。请先安装 Docker Desktop："
      echo "   https://www.docker.com/products/docker-desktop"
      exit 1
    fi
    
    # 构建 Docker 镜像
    echo "🔨 构建 Docker 镜像..."
    docker build -f Dockerfile.windows -t miaoda-windows-builder .
    
    # 运行构建
    echo "🏗️ 开始构建 Windows 安装包..."
    docker run --rm -v $(pwd):/app miaoda-windows-builder
    
    echo "✅ 构建完成！安装包位于 src-tauri/target/x86_64-pc-windows-gnu/release/bundle/"
    ;;
    
  2)
    echo "📤 使用 GitHub Actions..."
    echo ""
    echo "请执行以下步骤："
    echo "1. 确保代码已提交到 GitHub"
    echo "2. 创建一个新的标签："
    echo "   git tag v0.6.599"
    echo "   git push origin v0.6.599"
    echo "3. 访问 GitHub Actions 页面查看构建进度"
    echo "4. 构建完成后，在 Releases 页面下载安装包"
    ;;
    
  3)
    echo "💻 使用虚拟机..."
    echo ""
    echo "请在 Windows 虚拟机或实体机上执行以下步骤："
    echo ""
    echo "1. 安装必要工具："
    echo "   - Node.js 20+: https://nodejs.org/"
    echo "   - Rust: https://rustup.rs/"
    echo "   - Visual Studio 2022 Build Tools"
    echo ""
    echo "2. 克隆项目："
    echo "   git clone https://github.com/yourusername/miaodanew.git"
    echo "   cd miaodanew"
    echo ""
    echo "3. 安装依赖："
    echo "   yarn install"
    echo ""
    echo "4. 构建应用："
    echo "   yarn tauri build"
    echo ""
    echo "5. 安装包将在以下位置生成："
    echo "   src-tauri\\target\\release\\bundle\\"
    ;;
    
  *)
    echo "❌ 无效选项"
    exit 1
    ;;
esac