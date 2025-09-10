#!/bin/bash
# Miaoda macOS 安装脚本
# 用于解决 macOS Gatekeeper 安全限制

echo "🚀 Miaoda macOS 安装助手"
echo "=============================="
echo ""

# 检查是否为 macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ 错误: 此脚本仅适用于 macOS 系统"
    exit 1
fi

# 检查是否存在应用
APP_PATH="/Applications/Miaoda.app"

if [ -d "$APP_PATH" ]; then
    echo "✅ 发现已安装的 Miaoda 应用"
    echo "📍 位置: $APP_PATH"
    echo ""
    
    # 询问是否要解除安全限制
    read -p "是否要解除 macOS 安全限制以允许应用运行？(y/n): " choice
    case "$choice" in 
      y|Y|yes|Yes|YES ) 
        echo ""
        echo "🔓 正在解除 macOS 安全限制..."
        
        # 移除隔离属性
        echo "移除隔离标记..."
        sudo xattr -rd com.apple.quarantine "$APP_PATH" 2>/dev/null || true
        
        # 允许应用运行
        echo "允许应用运行..."
        sudo spctl --add --label "Miaoda" "$APP_PATH" 2>/dev/null || true
        
        echo ""
        echo "✅ 安全限制已解除！"
        echo "🎉 现在可以正常运行 Miaoda 了"
        echo ""
        
        # 询问是否要启动应用
        read -p "是否要立即启动 Miaoda？(y/n): " launch
        case "$launch" in 
          y|Y|yes|Yes|YES ) 
            echo "🚀 正在启动 Miaoda..."
            open "$APP_PATH"
            ;;
          * ) 
            echo "ℹ️  你可以在启动台或应用程序文件夹中找到 Miaoda"
            ;;
        esac
        ;;
      * ) 
        echo "❌ 取消操作"
        echo "ℹ️  如需手动解除限制，请运行："
        echo "   sudo xattr -rd com.apple.quarantine '$APP_PATH'"
        ;;
    esac
else
    echo "❌ 未找到 Miaoda 应用"
    echo ""
    echo "请先按照以下步骤安装 Miaoda："
    echo "1. 双击 miaoda_0.6.599_aarch64.dmg 文件"
    echo "2. 将 Miaoda.app 拖拽到应用程序文件夹"
    echo "3. 重新运行此脚本"
    echo ""
    echo "💡 如果无法打开 DMG 文件，请右键选择"打开""
fi

echo ""
echo "📚 更多帮助信息请查看："
echo "   https://github.com/miounet11/miaoda/blob/main/docs/MACOS_INSTALL_GUIDE.md"
echo ""
echo "🐛 遇到问题？请反馈至："
echo "   https://github.com/miounet11/miaoda/issues"