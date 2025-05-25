@echo off
REM =============================================
REM Ollama UI - Automatischer Starter
REM =============================================

echo.
echo ========================================
echo   🚀 Starte Ollama UI
echo ========================================
echo.

REM Farbige Ausgabe aktivieren
for /f "tokens=*" %%i in ('echo prompt $E^|"%SystemRoot%\system32\cmd.exe"') do set "ESC=%%i"

REM Titel setzen
title Ollama UI Starter

REM Prüfe ob wir im richtigen Verzeichnis sind
if not exist "backend\app.py" (
    echo %ESC%[91m❌ Fehler: Nicht im Ollama UI Hauptverzeichnis!%ESC%[0m
    echo %ESC%[93m💡 Bitte die Batch-Datei im ollama-ui\ Ordner ausführen%ESC%[0m
    echo.
    pause
    exit /b 1
)

echo %ESC%[96m🔍 Prüfe Ollama-Status...%ESC%[0m

REM Prüfe ob Ollama läuft
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo %ESC%[93m⚠️  Ollama läuft nicht - starte Ollama...%ESC%[0m
    echo.
    
    REM Starte Ollama im Hintergrund
    start /min "Ollama Server" ollama serve
    
    REM Warte 3 Sekunden
    timeout /t 3 /nobreak >nul
    
    REM Prüfe erneut
    curl -s http://localhost:11434/api/tags >nul 2>&1
    if %errorlevel% neq 0 (
        echo %ESC%[91m❌ Ollama konnte nicht gestartet werden!%ESC%[0m
        echo %ESC%[93m💡 Bitte installiere Ollama von: https://ollama.ai%ESC%[0m
        echo.
        pause
        exit /b 1
    )
)

echo %ESC%[92m✅ Ollama läuft%ESC%[0m

REM Wechsle ins Backend-Verzeichnis
cd /d "%~dp0backend"

echo %ESC%[96m🐍 Aktiviere Python Virtual Environment...%ESC%[0m

REM Prüfe ob venv existiert
if not exist "venv\" (
    echo %ESC%[93m⚠️  Virtual Environment nicht gefunden - erstelle es...%ESC%[0m
    python -m venv venv
    if %errorlevel% neq 0 (
        echo %ESC%[91m❌ Fehler beim Erstellen des Virtual Environment!%ESC%[0m
        echo %ESC%[93m💡 Ist Python installiert? Prüfe: python --version%ESC%[0m
        echo.
        pause
        exit /b 1
    )
    echo %ESC%[92m✅ Virtual Environment erstellt%ESC%[0m
)

REM Aktiviere Virtual Environment
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo %ESC%[91m❌ Fehler beim Aktivieren des Virtual Environment!%ESC%[0m
    echo.
    pause
    exit /b 1
)

echo %ESC%[92m✅ Virtual Environment aktiviert%ESC%[0m

REM Prüfe ob Dependencies installiert sind
if not exist "venv\Lib\site-packages\flask\" (
    echo %ESC%[96m📦 Installiere Dependencies...%ESC%[0m
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo %ESC%[91m❌ Fehler beim Installieren der Dependencies!%ESC%[0m
        echo.
        pause
        exit /b 1
    )
    echo %ESC%[92m✅ Dependencies installiert%ESC%[0m
)

echo %ESC%[96m🚀 Starte Ollama UI Backend...%ESC%[0m
echo.
echo %ESC%[92m========================================%ESC%[0m
echo %ESC%[92m  ✨ Ollama UI ist bereit!%ESC%[0m
echo %ESC%[92m  🌐 URL: http://localhost:5000%ESC%[0m
echo %ESC%[92m  🛑 Stoppen: Strg+C%ESC%[0m
echo %ESC%[92m========================================%ESC%[0m
echo.

REM Öffne Browser nach 2 Sekunden
start "" timeout /t 2 /nobreak >nul && start http://localhost:5000

REM Starte Flask App
python app.py

REM Falls das Script hier ankommt, ist etwas schief gelaufen
echo.
echo %ESC%[93m⚠️  Backend wurde beendet%ESC%[0m
echo.
pause