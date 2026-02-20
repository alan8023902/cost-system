@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..") do set "ROOT_DIR=%%~fI"
set "BACKEND_DIR=%ROOT_DIR%\cost-backend"
set "OUTPUT_DIR=%ROOT_DIR%\deploy\dist\backend"

if not exist "%BACKEND_DIR%\pom.xml" (
  echo [ERROR] Backend project not found: %BACKEND_DIR%
  exit /b 1
)

echo [INFO] Building backend...
pushd "%BACKEND_DIR%"
call mvn clean package -DskipTests
if errorlevel 1 (
  popd
  echo [ERROR] Backend build failed.
  exit /b 1
)

set "JAR_FILE="
for /f "delims=" %%F in ('dir /b /a-d "target\*.jar" ^| findstr /i /v "original-"') do set "JAR_FILE=%BACKEND_DIR%\target\%%F"
popd

if "%JAR_FILE%"=="" (
  echo [ERROR] No backend jar found under target\
  exit /b 1
)

if exist "%OUTPUT_DIR%" rmdir /s /q "%OUTPUT_DIR%"
mkdir "%OUTPUT_DIR%"

copy "%JAR_FILE%" "%OUTPUT_DIR%\cost-system-backend.jar" >nul
copy "%BACKEND_DIR%\src\main\resources\application.yml" "%OUTPUT_DIR%\application.yml" >nul
if exist "%BACKEND_DIR%\src\main\resources\application-dev.yml" copy "%BACKEND_DIR%\src\main\resources\application-dev.yml" "%OUTPUT_DIR%\application-dev.yml" >nul

echo [OK] Backend package generated: %OUTPUT_DIR%
exit /b 0
