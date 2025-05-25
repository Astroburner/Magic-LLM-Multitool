import asyncio
from services.tts_service import text_to_speech

# Test-Text
test_text = "Dies ist ein Test für Edge TTS."

# TTS-Funktion aufrufen
audio_file = text_to_speech(test_text)
print(f"Audio-Datei erstellt: {audio_file}")
