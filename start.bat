@echo off
REM ============================================================
REM SmartDoc AI - Advanced Startup Script
REM Auto-check, auto-install, auto-start, auto-cleanup
REM ============================================================

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   SmartDoc AI - Advanced Launcher
echo ========================================
echo.

REM Kill existing processes
echo [CLEANUP] Checking for existing processes...
taskkill /F /IM electron.exe 2>NUL
taskkill /F /IM python.exe /FI "WINDOWTITLE eq SmartDoc Backend*" 2>NUL
echo [OK] Cleanup completed
echo.

REM Check if Ollama is installed
echo [CHECK] Verifying Ollama installation...
where ollama.exe >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Ollama not found!
    echo.
    echo Please install Ollama from: https://ollama.com
    echo After installation, run this script again.
    echo.
    pause
    exit /b 1
)
echo [OK] Ollama is installed
echo.

REM Check and pull required models
echo [CHECK] Verifying Ollama models...
set MODELS_OK=1

REM Check gemma4:e2b
ollama list 2>NUL | find /I "gemma4" >nul
if %ERRORLEVEL% NEQ 0 (
    echo [INSTALL] gemma4:e2b not found, pulling...
    ollama pull gemma4:e2b
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to pull gemma4:e2b
        set MODELS_OK=0
    ) else (
        echo [OK] gemma4:e2b installed
    )
) else (
    echo [OK] gemma4:e2b is available
)

REM Check nomic-embed-text:latest
ollama list 2>NUL | find /I "nomic-embed-text" >nul
if %ERRORLEVEL% NEQ 0 (
    echo [INSTALL] nomic-embed-text:latest not found, pulling...
    ollama pull nomic-embed-text:latest
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to pull nomic-embed-text:latest
        set MODELS_OK=0
    ) else (
        echo [OK] nomic-embed-text:latest installed
    )
) else (
    echo [OK] nomic-embed-text:latest is available
)

echo.

if %MODELS_OK%==0 (
    echo [ERROR] Some models failed to install
    echo Continuing anyway...
    echo.
)

REM Start Ollama in background (hidden window)
echo [START] Starting Ollama in background...
start "" /MIN ollama.exe serve
echo [OK] Ollama started
timeout /t 5 /nobreak >nul
echo.

REM Check Python
echo [CHECK] Verifying Python installation...
where python.exe >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python not found!
    echo.
    echo Please install Python 3.10+ from: https://python.org
    echo After installation, run this script again.
    echo.
    pause
    exit /b 1
)
echo [OK] Python is installed
echo.

REM Start Python Backend
echo [START] Starting Python Backend...
cd /d "%~dp0backend"
if exist "venv\Scripts\python.exe" (
    start "SmartDoc Backend" /MIN venv\Scripts\python app.py
) else (
    start "SmartDoc Backend" /MIN python app.py
)
timeout /t 3 /nobreak >nul
echo [OK] Backend started
echo.

REM Check Node.js
echo [CHECK] Verifying Node.js installation...
where node.exe >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found!
    echo.
    echo Please install Node.js 16+ from: https://nodejs.org
    echo After installation, run this script again.
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js is installed
echo.

REM Start Electron Frontend
echo [START] Starting Electron Frontend...
cd /d "%~dp0frontend"
start "" npm start
echo [OK] Frontend started
echo.

echo ========================================
echo   Application Started Successfully!
echo ========================================
echo.
echo NOTE: 
echo   - Application will open in Electron window
echo   - Ollama and Backend running in background
echo   - Close Electron window to stop everything
echo.
echo Waiting for application to close...
echo.

REM Wait for Electron to close
:wait_loop
timeout /t 2 /nobreak >nul
tasklist /FI "IMAGENAME eq electron.exe" 2>NUL | find /I /N "electron.exe">NUL
if "%ERRORLEVEL%"=="0" goto wait_loop

echo.
echo [SHUTDOWN] Application closed, stopping services...

REM Stop Backend
echo [STOP] Stopping Python Backend...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq SmartDoc Backend*" 2>NUL
echo [OK] Backend stopped

REM Stop Ollama
echo [STOP] Stopping Ollama...
taskkill /F /IM ollama.exe 2>NUL
echo [OK] Ollama stopped

echo.
echo ========================================
echo   All Services Stopped Successfully!
echo ========================================
echo.
timeout /t 2 /nobreak >nul