@echo off
REM =============================================
REM Ollama UI - Automatic Starter
REM =============================================

echo.
echo ========================================
echo   🚀 Starting Ollama UI
echo ========================================
echo.

REM Enable colored output
for /f "tokens=*" %%i in ('echo prompt $E^|"%SystemRoot%\system32\cmd.exe"') do set "ESC=%%i"

REM Set window title
title Ollama UI Starter

REM Check if we're in the correct directory
if not exist "backend\app.py" (
    echo %ESC%[91m❌ Error: Not in Ollama UI main directory!%ESC%[0m
    echo %ESC%[93m💡 Please run the batch file in the ollama-ui\ folder%ESC%[0m
    echo.
    pause
    exit /b 1
)

echo %ESC%[96m🔍 Checking Ollama status...%ESC%[0m

REM Check if Ollama is running
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo %ESC%[93m⚠️  Ollama is not running - starting Ollama...%ESC%[0m
    echo.
    
    REM Start Ollama in background
    start /min "Ollama Server" ollama serve
    
    REM Wait 3 seconds
    timeout /t 3 /nobreak >nul
    
    REM Check again
    curl -s http://localhost:11434/api/tags >nul 2>&1
    if %errorlevel% neq 0 (
        echo %ESC%[91m❌ Could not start Ollama!%ESC%[0m
        echo %ESC%[93m💡 Please install Ollama from: https://ollama.ai%ESC%[0m
        echo.
        pause
        exit /b 1
    )
)

echo %ESC%[92m✅ Ollama is running%ESC%[0m

REM Change to backend directory
cd /d "%~dp0backend"

echo %ESC%[96m🐍 Activating Python Virtual Environment...%ESC%[0m

REM Check if venv exists
if not exist "venv\" (
    echo %ESC%[93m⚠️  Virtual Environment not found - creating it...%ESC%[0m
    python -m venv venv
    if %errorlevel% neq 0 (
        echo %ESC%[91m❌ Error creating Virtual Environment!%ESC%[0m
        echo %ESC%[93m💡 Is Python installed? Check: python --version%ESC%[0m
        echo.
        pause
        exit /b 1
    )
    echo %ESC%[92m✅ Virtual Environment created%ESC%[0m
)

REM Activate Virtual Environment
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo %ESC%[91m❌ Error activating Virtual Environment!%ESC%[0m
    echo.
    pause
    exit /b 1
)

echo %ESC%[92m✅ Virtual Environment activated%ESC%[0m

REM Check if dependencies are installed
if not exist "venv\Lib\site-packages\flask\" (
    echo %ESC%[96m📦 Installing dependencies...%ESC%[0m
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo %ESC%[91m❌ Error installing dependencies!%ESC%[0m
        echo.
        pause
        exit /b 1
    )
    echo %ESC%[92m✅ Dependencies installed%ESC%[0m
)

echo %ESC%[96m🚀 Starting Ollama UI Backend...%ESC%[0m
echo.
echo %ESC%[92m========================================%ESC%[0m
echo %ESC%[92m  ✨ Ollama UI is ready!%ESC%[0m
echo %ESC%[92m  🌐 URL: http://localhost:5000%ESC%[0m
echo %ESC%[92m  🛑 Stop: Ctrl+C%ESC%[0m
echo %ESC%[92m========================================%ESC%[0m
echo.

REM Open browser after 2 seconds
start "" timeout /t 2 /nobreak >nul && start http://localhost:5000

REM Start Flask App
python app.py

REM If we reach here, something went wrong
echo.
echo %ESC%[93m⚠️  Backend was terminated%ESC%[0m
echo.
pause