# -*- coding: utf-8 -*-
"""
Hauptanwendungsdatei für die Ollama UI Backend-Anwendung.
Definiert Flask-Routen und koordiniert die Services.
"""
import logging
import os
from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS
import config
from services.llm_service import query_ollama, get_available_models
from services.tts_service import text_to_speech, get_available_voices
from services.memory_service import save_memory, get_memories

## Logging konfigurieren
logging.basicConfig(
    level=logging.DEBUG,  # Von INFO auf DEBUG geändert für detailliertere Logs
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Flask-App initialisieren
app = Flask(__name__, static_folder='../frontend')

# CORS aktivieren für Frontend-Backend-Kommunikation
CORS(app)

@app.route('/api/models', methods=['GET'])
def get_models():
    """Verfügbare Ollama-Modelle abrufen."""
    try:
        models = get_available_models()
        return jsonify({"models": models})
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der Modelle: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/voices', methods=['GET'])
def get_voices():
    """Verfügbare TTS-Stimmen abrufen."""
    try:
        voices = get_available_voices()
        return jsonify({"voices": voices})
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der Stimmen: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """Chat-Anfrage verarbeiten."""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Keine Daten erhalten"}), 400
            
        model = data.get('model', config.DEFAULT_MODEL)
        message = data.get('message', '')
        system_prompt = data.get('system_prompt', '')
        temperature = float(data.get('temperature', config.DEFAULT_TEMPERATURE))
        context = data.get('context', [])
        images = data.get('images', [])  # ⭐ Bilder aus Frontend
        
        # ⭐ Memory-Kontext laden und intelligent verarbeiten
        from services.memory_service import get_memories
        try:
            memories = get_memories()
            if memories:
                # Nur die letzten 5 Erinnerungen verwenden
                recent_memories = memories[-5:]
                
                # Memory-Kontext für natürliche Integration vorbereiten
                memory_texts = []
                for mem in recent_memories:
                    timestamp = mem.get('timestamp', '')[:10]
                    text = mem.get('text', '').strip('"')  # Anführungszeichen entfernen
                    memory_texts.append(f"• {text}")
                
                memory_context = "\n".join(memory_texts)
                
                system_prompt += f"""

=== BACKGROUND KNOWLEDGE (Du weißt folgendes) ===
{memory_context}

ANWEISUNG: Diese Informationen sind Teil deines Wissens. Verwende sie natürlich in Gesprächen, aber zitiere sie nicht wörtlich. Integriere sie wie eigene Erinnerungen und antworte in deinen eigenen Worten.
"""
                logger.info(f"Memory-Kontext hinzugefügt: {len(recent_memories)} Erinnerungen")
        except Exception as memory_error:
            logger.warning(f"Fehler beim Laden der Erinnerungen: {memory_error}")
        
        # LLM-Anfrage stellen
        response = query_ollama(model, message, system_prompt, temperature, context, images)
        
        # TTS aktivieren, wenn gewünscht
        audio_file = None
        if data.get('enable_tts', True):
            voice = data.get('voice', config.DEFAULT_TTS_VOICE)
            rate = data.get('rate', config.DEFAULT_TTS_RATE)
            pitch = data.get('pitch', config.DEFAULT_TTS_PITCH)
            audio_file = text_to_speech(response, voice, rate, pitch)
        
        return jsonify({
            "response": response,
            "audio_file": audio_file
        })
    except Exception as e:
        logger.error(f"Fehler bei der Chat-Verarbeitung: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/memory', methods=['POST'])
def add_memory():
    """Neue Erinnerung speichern."""
    try:
        data = request.json
        memory_text = data.get('text', '')
        
        if not memory_text:
            return jsonify({"error": "Keine Erinnerung angegeben"}), 400
        
        save_memory(memory_text)
        return jsonify({"success": True})
    except Exception as e:
        logger.error(f"Fehler beim Speichern der Erinnerung: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/memories', methods=['GET'])
def retrieve_memories():
    """Gespeicherte Erinnerungen abrufen."""
    try:
        memories = get_memories()
        return jsonify({"memories": memories})
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der Erinnerungen: {e}")
        return jsonify({"error": str(e)}), 500

# Audiodateien bereitstellen
@app.route('/assets/audio/<path:filename>')
def serve_audio(filename):
    """Audiodateien bereitstellen."""
    try:
        return send_from_directory(config.AUDIO_OUTPUT_DIR, filename)
    except Exception as e:
        logger.error(f"Fehler beim Bereitstellen der Audiodatei: {e}")
        abort(404)

# Hauptseite bereitstellen
@app.route('/')
def serve_index():
    """Hauptseite der Anwendung."""
    return send_from_directory('../frontend', 'index.html')

# Andere statische Dateien bereitstellen
@app.route('/<path:path>')
def serve_static_files(path):
    """Statische Dateien bereitstellen."""
    return send_from_directory('../frontend', path)

if __name__ == "__main__":
    app.run(host='127.0.0.1', port=5000)