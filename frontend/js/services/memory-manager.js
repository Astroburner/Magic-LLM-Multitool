/**
 * Memory-Manager für die Ollama Chat-Anwendung.
 * Verwaltet das Langzeitgedächtnis.
 */

class MemoryManager {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.memories = [];
  }
  
  /**
   * Alle gespeicherten Erinnerungen abrufen.
   * 
   * @returns {Promise<Array>} - Liste der Erinnerungen
   */
  async getMemories() {
    try {
      this.memories = await this.apiClient.getMemories();
      return this.memories;
    } catch (error) {
      console.error('Fehler beim Abrufen der Erinnerungen:', error);
      throw error;
    }
  }
  
  /**
   * Eine neue Erinnerung speichern.
   * 
   * @param {string} text - Der Text der Erinnerung
   * @returns {Promise<Object>} - Die Antwort des Servers
   */
  async saveMemory(text) {
    try {
      const result = await this.apiClient.saveMemory(text);
      await this.getMemories(); // Erinnerungen aktualisieren
      return result;
    } catch (error) {
      console.error('Fehler beim Speichern der Erinnerung:', error);
      throw error;
    }
  }
  
  /**
   * Erinnerungen nach Stichworten suchen.
   * 
   * @param {string} keyword - Das Stichwort
   * @returns {Array} - Liste der passenden Erinnerungen
   */
  searchMemories(keyword) {
    if (!keyword || !this.memories.length) {
      return [];
    }
    
    const lowerKeyword = keyword.toLowerCase();
    return this.memories.filter(memory => 
      memory.text.toLowerCase().includes(lowerKeyword)
    );
  }
  
  /**
   * Erinnerungen als Kontext für die Anfrage formatieren.
   * 
   * @returns {string} - Formatierter Erinnerungskontext
   */
  getMemoriesAsContext() {
    if (!this.memories.length) {
      return '';
    }
    
    return this.memories.map(memory => 
      `[${memory.date}] ${memory.text}`
    ).join('\n\n');
  }
}
