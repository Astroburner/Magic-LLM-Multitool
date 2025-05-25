/**
 * Konfigurationsmodul für die Ollama UI Frontend-Anwendung.
 * Enthält alle Einstellungen und Standardwerte.
 */

const Config = {
  // API-Endpunkte
  API_BASE_URL: "/api",
  MODELS_ENDPOINT: "/api/models",
  VOICES_ENDPOINT: "/api/voices",
  CHAT_ENDPOINT: "/api/chat",
  MEMORY_ENDPOINT: "/api/memory",
  MEMORIES_ENDPOINT: "/api/memories",
  
  // Standardeinstellungen für LLM
  DEFAULT_MODEL: "llama2",
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 2000,
  
  // Chat-Einstellungen
  MAX_CONTEXT_MESSAGES: 200,
  DEFAULT_CONTEXT_MESSAGES: 10,
  
  // TTS-Einstellungen
  DEFAULT_TTS_ENABLED: true,
  DEFAULT_TTS_VOICE: "de-DE-KatjaNeural",
  DEFAULT_TTS_RATE: "1.0",
  DEFAULT_TTS_PITCH: "1.0",
  
  // Erscheinungsbild
  DEFAULT_DARK_MODE: true,
  
  // Standardsystemprompt
  DEFAULT_SYSTEM_PROMPT: "Du bist ein hilfreicher Assistent.",
  
  // Speicherorte
  STORAGE_KEYS: {
    DARK_MODE: "ollama_ui_dark_mode",
    SELECTED_MODEL: "ollama_ui_model",
    SELECTED_VOICE: "ollama_ui_voice",
    TTS_ENABLED: "ollama_ui_tts_enabled",
    TTS_RATE: "ollama_ui_tts_rate",
    TTS_PITCH: "ollama_ui_tts_pitch",
    SYSTEM_PROMPT: "ollama_ui_system_prompt",
    CONTEXT_LENGTH: "ollama_ui_context_length",
    TEMPERATURE: "ollama_ui_temperature"
  }
};

export default Config;
