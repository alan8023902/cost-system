@echo off
chcp 65001
cls
echo ========================================
echo 成本管理系统后端 - UTF-8编码启动
echo ========================================
echo.

cd /d d:\项目需求\建材成本管理系统\cost-system\cost-backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev

pause
