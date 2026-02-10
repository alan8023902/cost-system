@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..") do set "ROOT_DIR=%%~fI"
set "DIST_DIR=%ROOT_DIR%\deploy\dist"

if exist "%DIST_DIR%" rmdir /s /q "%DIST_DIR%"
mkdir "%DIST_DIR%"

call "%SCRIPT_DIR%package-backend.bat"
if errorlevel 1 exit /b 1

call "%SCRIPT_DIR%package-frontend.bat"
if errorlevel 1 exit /b 1

mkdir "%DIST_DIR%\nginx"
copy "%ROOT_DIR%\deploy\nginx\cost-system.conf.template" "%DIST_DIR%\nginx\cost-system.conf.template" >nul

echo [OK] All deployment artifacts generated under %DIST_DIR%
exit /b 0
