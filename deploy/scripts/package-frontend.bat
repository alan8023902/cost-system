@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..") do set "ROOT_DIR=%%~fI"
set "FRONTEND_DIR=%ROOT_DIR%\cost-frontend"
set "OUTPUT_DIR=%ROOT_DIR%\deploy\dist\frontend"

if not exist "%FRONTEND_DIR%\package.json" (
  echo [ERROR] Frontend project not found: %FRONTEND_DIR%
  exit /b 1
)

echo [INFO] Building frontend...
pushd "%FRONTEND_DIR%"
if not exist "node_modules" (
  call npm ci
  if errorlevel 1 (
    popd
    echo [ERROR] npm ci failed.
    exit /b 1
  )
)

call npm run build
if errorlevel 1 (
  popd
  echo [ERROR] Frontend build failed.
  exit /b 1
)
popd

if not exist "%FRONTEND_DIR%\dist\index.html" (
  echo [ERROR] Frontend dist output not found.
  exit /b 1
)

if exist "%OUTPUT_DIR%" rmdir /s /q "%OUTPUT_DIR%"
mkdir "%OUTPUT_DIR%"
xcopy "%FRONTEND_DIR%\dist\*" "%OUTPUT_DIR%\" /E /I /Y >nul

echo [OK] Frontend package generated: %OUTPUT_DIR%
exit /b 0
