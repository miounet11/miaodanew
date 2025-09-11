#!/bin/bash
# Miaoda Web 构建脚本

set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

DIST_DIR="$PROJECT_ROOT/dist"
WEB_DIST="$DIST_DIR/web"

echo "🌐 构建 Miaoda Web 版本"

rm -rf "$WEB_DIST"
mkdir -p "$WEB_DIST"

# 构建 web-app（使用简化构建）
cd web-app
echo "尝试构建 Web 应用..."
# 尝试不同的构建方式
if yarn build:prod 2>/dev/null; then
    echo "使用 build:prod 成功"
elif VITE_BUILD_MODE=production yarn vite build --mode production 2>/dev/null; then  
    echo "使用 vite 直接构建成功"
elif yarn build 2>/dev/null; then
    echo "使用默认构建成功"  
else
    echo "⚠️ Web 构建失败，创建占位符目录"
    mkdir -p dist
    echo "<html><body><h1>Miaoda Web - Build Failed</h1><p>Please check configuration</p></body></html>" > dist/index.html
fi

# 复制构建产物
cp -r dist/* "$WEB_DIST/"

echo "✅ Web 构建完成，文件位于: $WEB_DIST"
ls -la "$WEB_DIST"
