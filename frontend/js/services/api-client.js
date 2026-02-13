/**
 * API Client for the Ollama Chat Application.
 * Manages communication with the backend.
 */

class ApiClient {
  constructor() {
    // API Endpoints from Config
    this.API_BASE_URL = window.Config?.API_BASE_URL || "/api";
    this.MODELS_ENDPOINT = window.Config?.MODELS_ENDPOINT || "/api/models";
    this.VOICES_ENDPOINT = window.Config?.VOICES_ENDPOINT || "/api/voices";
    this.CHAT_ENDPOINT = window.Config?.CHAT_ENDPOINT || "/api/chat";
    this.MEMORY_ENDPOINT = window.Config?.MEMORY_ENDPOINT || "/api/memory";
    this.MEMORIES_ENDPOINT = window.Config?.MEMORIES_ENDPOINT || "/api/memories";
  }

  /**
   * Handle errors when fetching API data.
   * @param {Response} response - The response from the request
   * @returns {Promise} - The response as JSON or throws an error
   */
  async handleResponse(response) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP Error: ${response.status}`);
    }
    return data;
  }

  /**
   * Retrieve available models.
   * @returns {Promise<Array>} - List of available models
   */
  async getModels() {
    try {
      const response = await fetch(this.MODELS_ENDPOINT);
      const data = await this.handleResponse(response);
      return data.models || [];
    } catch (error) {
      console.error('Error retrieving models:', error);
      throw error;
    }
  }

  /**
   * Retrieve available TTS voices.
   * @returns {Promise<Array>} - List of available voices
   */
  async getVoices() {
    try {
      const response = await fetch(this.VOICES_ENDPOINT);
      const data = await this.handleResponse(response);
      return data.voices || [];
    } catch (error) {
      console.error('Error retrieving voices:', error);
      throw error;
    }
  }

  /**
   * Send a chat message.
   * @param {Object} data - The chat data
   * @returns {Promise<Object>} - The chat response
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
      console.error('Error sending chat message:', error);
      throw error;
    }
  }

  /**
   * Memory Functions
   */

  /**
   * Retrieve memories from server.
   * @returns {Promise<Array>} - List of memories
   */
  async getMemories() {
    try {
      const response = await fetch(this.MEMORIES_ENDPOINT);
      const data = await this.handleResponse(response);
      return data.memories || []; // Ensure we return the list
    } catch (error) {
      console.error('Error retrieving memories:', error);
      throw error;
    }
  }

  /**
   * Save a new memory.
   * @param {string} text - The memory text
   * @returns {Promise<Object>} - The server response
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
      console.error('Error saving memory:', error);
      throw error;
    }
  }

  /**
   * Checks if a message is a memory command.
   * @param {string} message - The message to check
   * @returns {boolean} - True if memory command
   */
  isMemoryCommand(message) {
    const memoryKeywords = [
      '/remember', '/mark', '/recall', '/memory', '/memories',
      'remember this', 'save this',
      'what do you remember', 'do not forget'
    ];
    
    const lowerMessage = message.toLowerCase();
    return memoryKeywords.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
  }
}
