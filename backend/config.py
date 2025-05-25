# -*- coding: utf-8 -*-
"""
Konfigurationsmodul für die Ollama UI Backend-Anwendung.
"""
import os
from pathlib import Path

# Basisverzeichnisse - KORRIGIERT
BASE_DIR = Path(__file__).resolve().parent  # Nur 1x parent = /backend/
PROJECT_ROOT = BASE_DIR.parent              # /ollama-ui/
DATA_DIR = PROJECT_ROOT / "data"            # /ollama-ui/data/
MEMORIES_DIR = DATA_DIR / "memories"        # /ollama-ui/data/memories/
AUDIO_OUTPUT_DIR = PROJECT_ROOT / "frontend" / "assets" / "audio"

# Debug - zeige Pfade
print(f"🔍 BASE_DIR: {BASE_DIR}")
print(f"🔍 PROJECT_ROOT: {PROJECT_ROOT}")
print(f"🔍 MEMORIES_DIR: {MEMORIES_DIR}")

# Ollama-Einstellungen
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_MODEL = "llama2"
DEFAULT_TEMPERATURE = 0.7
DEFAULT_MAX_TOKENS = 2000

# TTS-Einstellungen
DEFAULT_TTS_VOICE = "de-DE-KatjaNeural"
DEFAULT_TTS_RATE = "1.0"
DEFAULT_TTS_PITCH = "1.0"

# Server-Einstellungen
HOST = "127.0.0.1"  # Localhost nur - wie du es geändert hast
PORT = 5000
DEBUG = os.environ.get("DEBUG", "False").lower() == "true"

# Chat-Einstellungen
MAX_CONTEXT_MESSAGES = 200

# Verzeichnisse erstellen
def ensure_directories():
    """Erstellt alle notwendigen Verzeichnisse."""
    directories = [DATA_DIR, MEMORIES_DIR, AUDIO_OUTPUT_DIR]
    
    for directory in directories:
        try:
            directory.mkdir(parents=True, exist_ok=True)
            print(f"✅ Verzeichnis erstellt/geprüft: {directory}")
        except Exception as e:
            print(f"❌ Fehler beim Erstellen von {directory}: {e}")

# Beim Import ausführen
ensure_directories()
