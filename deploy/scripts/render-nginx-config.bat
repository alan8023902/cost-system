@echo off
setlocal

if "%~1"=="" (
  echo Usage: %~nx0 ^<domain^> [cert_path] [key_path]
  exit /b 1
)

set "DOMAIN=%~1"
set "CERT_PATH=%~2"
set "KEY_PATH=%~3"

if "%CERT_PATH%"=="" set "CERT_PATH=/etc/nginx/ssl/%DOMAIN%.crt"
if "%KEY_PATH%"=="" set "KEY_PATH=/etc/nginx/ssl/%DOMAIN%.key"

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "DEPLOY_DIR=%%~fI"
set "TEMPLATE=%DEPLOY_DIR%\nginx\cost-system.conf.template"
set "OUTPUT=%DEPLOY_DIR%\nginx\cost-system.%DOMAIN%.conf"

if not exist "%TEMPLATE%" (
  echo [ERROR] Template not found: %TEMPLATE%
  exit /b 1
)

powershell.exe -NoProfile -Command "$content = Get-Content -Raw -Encoding UTF8 '%TEMPLATE%'; $content = $content.Replace('__DOMAIN__', '%DOMAIN%').Replace('__SSL_CERT_PATH__', '%CERT_PATH%').Replace('__SSL_KEY_PATH__', '%KEY_PATH%'); Set-Content -Encoding UTF8 '%OUTPUT%' $content"
if errorlevel 1 (
  echo [ERROR] Failed to render nginx config.
  exit /b 1
)

echo [OK] Generated nginx config: %OUTPUT%
exit /b 0
