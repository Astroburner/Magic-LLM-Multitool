/**
 * Configuration module for the Ollama UI Frontend.
 * Contains all settings and default values.
 */

window.Config = {
  // API Endpoints
  API_BASE_URL: "/api",
  MODELS_ENDPOINT: "/api/models",
  VOICES_ENDPOINT: "/api/voices",
  CHAT_ENDPOINT: "/api/chat",
  MEMORY_ENDPOINT: "/api/memory",
  MEMORIES_ENDPOINT: "/api/memories",
  
  // Default LLM Settings
  DEFAULT_MODEL: "llama2",
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 2000,
  
  // Chat Settings
  MAX_CONTEXT_MESSAGES: 200,
  DEFAULT_CONTEXT_MESSAGES: 10,
  
  // TTS Settings
  DEFAULT_TTS_ENABLED: true,
  DEFAULT_TTS_VOICE: "de-DE-KatjaNeural",
  DEFAULT_TTS_RATE: "1.0",
  DEFAULT_TTS_PITCH: "1.0",
  
  // Appearance
  DEFAULT_DARK_MODE: true,
  
  // Default System Prompt
  DEFAULT_SYSTEM_PROMPT: "You are a helpful assistant.",
  
  // Storage Keys
  STORAGE_KEYS: {
    DARK_MODE: "ollama_ui_dark_mode",
    SELECTED_MODEL: "ollama_ui_model",
    SELECTED_VOICE: "ollama_ui_voice",
    TTS_ENABLED: "ollama_ui_tts_enabled",
    TTS_RATE: "ollama_ui_tts_rate",
    TTS_PITCH: "ollama_ui_tts_pitch",
    SYSTEM_PROMPT: "ollama_ui_system_prompt",
    CONTEXT_LENGTH: "ollama_ui_context_length",
    TEMPERATURE: "ollama_ui_temperature",
    USER_AVATAR: "ollama_ui_user_avatar",
    AI_AVATAR: "ollama_ui_ai_avatar",
    SPEECH_LANGUAGE: "ollama_ui_speech_language",
    SIDEBAR_HIDDEN: "ollama_ui_sidebar_hidden"
  }
};
