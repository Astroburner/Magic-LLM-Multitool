/**
 * API-Client für die Ollama Chat-Anwendung.
 * Verwaltet die Kommunikation mit dem Backend.
 */

class ApiClient {
  constructor() {
    // API-Endpunkte
    this.API_BASE_URL = "/api";
    this.MODELS_ENDPOINT = "/api/models";
    this.VOICES_ENDPOINT = "/api/voices";
    this.CHAT_ENDPOINT = "/api/chat";
    this.MEMORY_ENDPOINT = "/api/memory";
    this.MEMORIES_ENDPOINT = "/api/memories";
  }

  /**
   * Fehler beim Abrufen von API-Daten behandeln.
   * @param {Response} response - Die Antwort der Anfrage
   * @returns {Promise} - Die Antwort als JSON oder wirft einen Fehler
   */
  async handleResponse(response) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP-Fehler: ${response.status}`);
    }
    return data;
  }

  /**
   * Verfügbare Modelle abrufen.
   * @returns {Promise<Array>} - Liste der verfügbaren Modelle
   */
	async getModels() {
	  try {
		const response = await fetch(this.MODELS_ENDPOINT);
		const data = await this.handleResponse(response);
		// Das Backend gibt {models: [...]} zurück, wir brauchen nur die Liste
		return data.models || [];
	  } catch (error) {
		console.error('Fehler beim Abrufen der Modelle:', error);
		throw error;
	  }
	}

  /**
   * Verfügbare TTS-Stimmen abrufen.
   * @returns {Promise<Array>} - Liste der verfügbaren Stimmen
   */
  async getVoices() {
    try {
      const response = await fetch(this.VOICES_ENDPOINT);
      const data = await this.handleResponse(response);
      return data.voices || [];
    } catch (error) {
      console.error('Fehler beim Abrufen der Stimmen:', error);
      throw error;
    }
  }

  /**
   * Chat-Nachricht senden.
   * @param {Object} data - Die Chat-Daten
   * @returns {Promise<Object>} - Die Antwort des Chats
   */
  async sendChatMessage(data) {
    try {
      const response = await fetch(this.CHAT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Fehler beim Senden der Chat-Nachricht:', error);
      throw error;
    }
  }

  /**
   * ⭐ NEUE Memory-Funktionen
   */

  /**
   * Erinnerungen vom Server abrufen.
   * @returns {Promise<Array>} - Liste der Erinnerungen
   */
  async getMemories() {
    try {
      const response = await fetch(this.MEMORIES_ENDPOINT);
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Fehler beim Abrufen der Erinnerungen:', error);
      throw error;
    }
  }

  /**
   * Neue Erinnerung speichern.
   * @param {string} text - Der Text der Erinnerung
   * @returns {Promise<Object>} - Die Antwort des Servers
   */
  async saveMemory(text) {
    try {
      const response = await fetch(this.MEMORY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Fehler beim Speichern der Erinnerung:', error);
      throw error;
    }
  }

  /**
   * Prüft ob eine Nachricht ein Memory-Befehl ist.
   * @param {string} message - Die zu prüfende Nachricht
   * @returns {boolean} - True wenn Memory-Befehl
   */
  isMemoryCommand(message) {
    const memoryKeywords = [
      '/remember', '/merken', '/recall', '/memory', '/memories',
      'merke dir', 'erinnere dich', 'remember this', 'save this',
      'was weißt du noch', 'what do you remember', 'vergiss nicht'
    ];
    
    const lowerMessage = message.toLowerCase();
    return memoryKeywords.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
  }
}
