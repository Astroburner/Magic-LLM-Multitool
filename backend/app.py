# -*- coding: utf-8 -*-
"""
Main application file for the Ollama UI Backend.
Defines Flask routes and coordinates services.
"""
import logging
from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS
import config
from services.llm_service import query_ollama, get_available_models, query_ollama_with_reasoning
from services.tts_service import text_to_speech, get_available_voices
from services.memory_service import save_memory, get_memories
from services.file_service import parse_uploaded_files, format_files_for_llm

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if config.DEBUG else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask App
app = Flask(__name__, static_folder='../frontend')

# Enable CORS for frontend-backend communication
CORS(app)

# Ensure directories exist on startup
config.ensure_directories()

@app.route('/api/models', methods=['GET'])
def get_models():
    """Retrieve available Ollama models."""
    try:
        models = get_available_models()
        return jsonify({"models": models})
    except Exception as e:
        logger.error(f"Error retrieving models: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/voices', methods=['GET'])
def get_voices():
    """Retrieve available TTS voices."""
    try:
        voices = get_available_voices()
        return jsonify({"voices": voices})
    except Exception as e:
        logger.error(f"Error retrieving voices: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """Process chat request."""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data received"}), 400
            
        model = data.get('model', config.DEFAULT_MODEL)
        message = data.get('message', '')
        system_prompt = data.get('system_prompt', '')
        temperature = float(data.get('temperature', config.DEFAULT_TEMPERATURE))
        context = data.get('context', [])
        images = data.get('images', [])
        files = data.get('files', [])
        
        # Load memory context and process intelligently
        try:
            memories = get_memories()
            if memories:
                # Use only the last 5 memories
                recent_memories = memories[-5:]
                
                # Prepare memory context for natural integration
                memory_texts = []
                for mem in recent_memories:
                    # timestamp = mem.get('timestamp', '')[:10] # Unused variable
                    text = mem.get('text', '').strip('"')  # Remove quotes
                    memory_texts.append(f"• {text}")
                
                memory_context = "\n".join(memory_texts)
                
                system_prompt += f"""

=== BACKGROUND KNOWLEDGE (You know the following) ===
{memory_context}

INSTRUCTION: This information is part of your knowledge. Use it naturally in conversations, but do not quote it verbatim. Integrate it like your own memories and answer in your own words.
"""
                logger.info(f"Memory context added: {len(recent_memories)} memories")
        except Exception as memory_error:
            logger.warning(f"Error loading memories: {memory_error}")
        
        # Process files if present
        if files:
            try:
                processed_files = parse_uploaded_files(files)
                if processed_files:
                    file_content = format_files_for_llm(processed_files)
                    # Append file content to message
                    message = f"{message}\n\n{file_content}"
                    logger.info(f"Files added: {len(processed_files)} files processed")
            except Exception as file_error:
                logger.warning(f"Error processing files: {file_error}")

        # Reasoning-LLM Support
        # Context is passed here and handled inside query_ollama_with_reasoning
        reasoning_response = query_ollama_with_reasoning(model, message, system_prompt, temperature, context, images)
        
        # Enable TTS if requested (only for Final Answer)
        audio_file = None
        if data.get('enable_tts', True):
            voice = data.get('voice', config.DEFAULT_TTS_VOICE)
            rate = data.get('rate', config.DEFAULT_TTS_RATE)
            pitch = data.get('pitch', config.DEFAULT_TTS_PITCH)
            
            # Use only the final answer for TTS
            tts_text = reasoning_response['answer']
            if tts_text:
                audio_file = text_to_speech(tts_text, voice, rate, pitch)
            
            if reasoning_response['has_reasoning']:
                logger.info("Reasoning-LLM Response - TTS only for Final Answer")

        return jsonify({
            "response": reasoning_response['answer'],
            "reasoning": reasoning_response['reasoning'],
            "has_reasoning": reasoning_response['has_reasoning'],
            "audio_file": audio_file
        })
        
    except Exception as e:
        logger.error(f"Error in chat processing: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/memory', methods=['POST'])
def add_memory():
    """Save new memory."""
    try:
        data = request.json
        memory_text = data.get('text', '')
        
        if not memory_text:
            return jsonify({"error": "No memory text provided"}), 400
        
        save_memory(memory_text)
        return jsonify({"success": True})
    except Exception as e:
        logger.error(f"Error saving memory: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/memories', methods=['GET'])
def retrieve_memories():
    """Retrieve stored memories."""
    try:
        memories = get_memories()
        return jsonify({"memories": memories})
    except Exception as e:
        logger.error(f"Error retrieving memories: {e}")
        return jsonify({"error": str(e)}), 500

# Serve audio files
@app.route('/assets/audio/<path:filename>')
def serve_audio(filename):
    """Serve audio files."""
    try:
        return send_from_directory(config.AUDIO_OUTPUT_DIR, filename)
    except Exception as e:
        logger.error(f"Error serving audio file: {e}")
        abort(404)

# Serve main page
@app.route('/')
def serve_index():
    """Serve main application page."""
    return send_from_directory('../frontend', 'index.html')

# Serve other static files
@app.route('/<path:path>')
def serve_static_files(path):
    """Serve static files."""
    return send_from_directory('../frontend', path)

if __name__ == "__main__":
    app.run(host=config.HOST, port=config.PORT)
