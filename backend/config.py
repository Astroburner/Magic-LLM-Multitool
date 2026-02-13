# -*- coding: utf-8 -*-
"""
Configuration module for the Ollama UI Backend.
"""
import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent  # /backend/
PROJECT_ROOT = BASE_DIR.parent              # /ollama-ui/
DATA_DIR = PROJECT_ROOT / "data"            # /ollama-ui/data/
MEMORIES_DIR = DATA_DIR / "memories"        # /ollama-ui/data/memories/
AUDIO_OUTPUT_DIR = PROJECT_ROOT / "frontend" / "assets" / "audio"

# Ollama settings
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_MODEL = "llama2"
DEFAULT_TEMPERATURE = 0.7
DEFAULT_MAX_TOKENS = 2000

# TTS settings
DEFAULT_TTS_VOICE = "de-DE-KatjaNeural"
DEFAULT_TTS_RATE = "1.0"
DEFAULT_TTS_PITCH = "1.0"

# Server settings
HOST = "127.0.0.1"
PORT = 5000
DEBUG = os.environ.get("DEBUG", "False").lower() == "true"

# Chat settings
MAX_CONTEXT_MESSAGES = 200

# Function to ensure directories exist
def ensure_directories():
    """Creates all necessary directories."""
    directories = [DATA_DIR, MEMORIES_DIR, AUDIO_OUTPUT_DIR]
    
    for directory in directories:
        try:
            directory.mkdir(parents=True, exist_ok=True)
            if DEBUG:
                print(f"✅ Directory created/checked: {directory}")
        except Exception as e:
            print(f"❌ Error creating {directory}: {e}")
