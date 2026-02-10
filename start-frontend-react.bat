@echo off
chcp 65001 > nul
title 启动React前端

echo ========================================
echo   启动 React 前端 (端口 38443)
echo ========================================

cd /d "d:\项目需求\建材成本管理系统\cost-system\cost-frontend-react"

if not exist "node_modules" (
    echo [安装依赖中...]
    call npm install --legacy-peer-deps
)

echo [启动开发服务器...]
npm run dev

pause
