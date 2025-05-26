@echo off
REM =============================================
REM Ollama UI - Automatic Starter
REM =============================================

echo.
echo ========================================
echo   Starting Ollama UI
echo ========================================
echo.

REM Set window title
title Ollama UI Starter

REM Check if we're in the correct directory
if not exist "backend\app.py" (
    echo [ERROR] Not in Ollama UI main directory!
    echo [INFO] Please run the batch file in the ollama-ui\ folder
    echo.
    pause
    exit /b 1
)

echo [*] Checking Ollama status...

REM Check if Ollama is running
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Ollama is not running - starting Ollama...
    echo.
    
    REM Start Ollama in background
    start /min "Ollama Server" ollama serve
    
    REM Wait 3 seconds
    timeout /t 3 /nobreak >nul
    
    REM Check again
    curl -s http://localhost:11434/api/tags >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Could not start Ollama!
        echo [INFO] Please install Ollama from: https://ollama.ai
        echo.
        pause
        exit /b 1
    )
)

echo [OK] Ollama is running

REM Change to backend directory
cd /d "%~dp0backend"

echo [*] Activating Python Virtual Environment...

REM Check if venv exists
if not exist "venv\" (
    echo [WARNING] Virtual Environment not found - creating it...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Error creating Virtual Environment!
        echo [INFO] Is Python installed? Check: python --version
        echo.
        pause
        exit /b 1
    )
    echo [OK] Virtual Environment created
)

REM Activate Virtual Environment
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo [ERROR] Error activating Virtual Environment!
    echo.
    pause
    exit /b 1
)

echo [OK] Virtual Environment activated

REM Check if dependencies are installed
if not exist "venv\Lib\site-packages\flask\" (
    echo [*] Installing dependencies...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo [ERROR] Error installing dependencies!
        echo.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
)

echo [*] Starting Ollama UI Backend...
echo.
echo ========================================
echo   Ollama UI is ready!
echo   URL: http://localhost:5000
echo   Stop: Ctrl+C
echo ========================================
echo.

REM Open browser after 2 seconds
start "" timeout /t 2 /nobreak >nul && start http://localhost:5000

REM Start Flask App
python app.py

REM If we reach here, something went wrong
echo.
echo [WARNING] Backend was terminated
echo.
pause