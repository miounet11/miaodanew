#!/bin/bash
# Miaoda macOS 构建脚本

set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

DIST_DIR="$PROJECT_ROOT/dist"
MACOS_DIST="$DIST_DIR/macos"
VERSION=$(grep '"version"' src-tauri/Cargo.toml | sed 's/.*"\(.*\)".*/\1/')

echo "🍎 构建 Miaoda macOS 版本 v$VERSION"

rm -rf "$MACOS_DIST"
mkdir -p "$MACOS_DIST"

# 构建应用
npx @tauri-apps/cli@2.5.0 build

# 查找生成的 .app 文件
find src-tauri/target/release/bundle -name "*.app" -exec cp -r {} "$MACOS_DIST/" \;

# 查找生成的 .dmg 文件并复制到外部分发目录
DMG_EXTERNAL_PATH="/Users/lu/Documents/miaodanew/外部分发dmg"
mkdir -p "$DMG_EXTERNAL_PATH"
find src-tauri/target/release/bundle -name "*.dmg" -exec cp {} "$DMG_EXTERNAL_PATH/" \;
find src-tauri/target/release/bundle -name "*.dmg" -exec cp {} "$MACOS_DIST/" \;

echo "✅ macOS 构建完成，文件位于: $MACOS_DIST"
ls -la "$MACOS_DIST"
