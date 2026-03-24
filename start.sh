#!/bin/bash

echo "启动测试管理平台..."
echo "================================"

# 启动服务器
echo "启动服务器 (端口 3000)..."
cd /workspaces/test-management-platform/server
npm start &
SERVER_PID=$!

# 等待服务器启动
sleep 3

# 启动客户端开发服务器
echo "启动客户端开发服务器 (端口 5173)..."
cd /workspaces/test-management-platform/client
npm run dev &
CLIENT_PID=$!

echo "================================"
echo "应用已启动!"
echo "✅ 服务器: http://localhost:3000"
echo "✅ 前端应用: http://localhost:5173"
echo ""
echo "在Codespaces中，您将看到一个'打开在浏览器中'的提示"
echo "点击它来查看应用的公网地址"
echo ""
echo "按 Ctrl+C 停止应用"

# 等待进程
wait
