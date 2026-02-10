@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..") do set "ROOT_DIR=%%~fI"

if exist "%ROOT_DIR%\cost-frontend\node_modules" rmdir /s /q "%ROOT_DIR%\cost-frontend\node_modules"
if exist "%ROOT_DIR%\cost-frontend\dist" rmdir /s /q "%ROOT_DIR%\cost-frontend\dist"
if exist "%ROOT_DIR%\cost-backend\target" rmdir /s /q "%ROOT_DIR%\cost-backend\target"
if exist "%ROOT_DIR%\cost-backend\logs" rmdir /s /q "%ROOT_DIR%\cost-backend\logs"
if exist "%ROOT_DIR%\deploy\dist" rmdir /s /q "%ROOT_DIR%\deploy\dist"

echo [OK] Build artifacts cleaned.
exit /b 0
