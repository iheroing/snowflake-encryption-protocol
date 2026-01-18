#!/bin/bash

echo "❄️  雪花加密协议 - Snowflake Encryption Protocol"
echo "================================================"
echo ""
echo "🚀 正在启动开发服务器..."
echo ""

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    npm install
    echo ""
fi

echo "✨ 启动应用..."
echo ""
echo "💡 提示："
echo "   - 访问浏览器打开显示的地址"
echo "   - 按 Ctrl+C 停止服务器"
echo "   - 查看 START_HERE.md 了解更多"
echo ""
echo "================================================"
echo ""

npm run dev
