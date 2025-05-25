/**
 * Chat-Manager für die Ollama Chat-Anwendung.
 * Verwaltet den Chat-Verlauf und die Kommunikation mit dem Modell.
 */

class ChatManager {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.chatHistory = [];
    this.loadChatHistory();
  }
  
  /**
   * Chat-Verlauf aus dem lokalen Speicher laden.
   * 
   * @returns {Array} - Der geladene Chat-Verlauf
   */
  loadChatHistory() {
    try {
      const savedChat = localStorage.getItem('ollama_ui_chat_history');
      if (savedChat) {
        this.chatHistory = JSON.parse(savedChat);
      }
    } catch (error) {
      console.error('Fehler beim Laden des Chat-Verlaufs:', error);
      this.chatHistory = [];
    }
    
    return this.chatHistory;
  }
  
  /**
   * Chat-Verlauf im lokalen Speicher speichern.
   */
  saveChatHistory() {
    try {
      localStorage.setItem('ollama_ui_chat_history', JSON.stringify(this.chatHistory));
    } catch (error) {
      console.error('Fehler beim Speichern des Chat-Verlaufs:', error);
    }
  }
  
  /**
   * Eine Nachricht zum Chat-Verlauf hinzufügen.
   * 
   * @param {string} role - Die Rolle des Absenders (user oder assistant)
   * @param {string} content - Der Inhalt der Nachricht
   */
  addMessageToHistory(role, content) {
    this.chatHistory.push({ role, content });
    this.saveChatHistory();
  }
  
  /**
   * Den Chat-Verlauf löschen.
   */
  clearChatHistory() {
    this.chatHistory = [];
    this.saveChatHistory();
  }
  
  /**
   * Chat-Kontext für die Anfrage erstellen.
   * 
   * @param {number} contextLength - Die Anzahl der vergangenen Nachrichten für den Kontext
   * @returns {Array} - Der Chat-Kontext
   */
  getChatContext(contextLength) {
    if (contextLength <= 0) {
      return [];
    }
    
    // Die letzten N Nachrichten abrufen
    return this.chatHistory.slice(-contextLength);
  }
  
  /**
   * Eine Nachricht an das Modell senden.
   * 
   * @param {Object} params - Parameter für die Chat-Anfrage
   * @returns {Promise<Object>} - Die Antwort des Modells
   */
  async sendMessage(params) {
    // Überprüfen, ob der Text ein Befehl ist
    const message = params.message.trim();
    
    // Befehl /remember verarbeiten
    if (message.startsWith('/remember ')) {
      const memoryText = message.substring('/remember '.length).trim();
      if (memoryText) {
        try {
          // Zuerst an das LLM senden, damit es die Erinnerung verarbeiten kann
          const llmParams = {...params};
          
          // Spezifischen System-Prompt für Erinnerungsverarbeitung hinzufügen
          const memorySystemPrompt = `${params.system_prompt || ''}
          
Du sollst eine Erinnerung für dein Langzeitgedächtnis verarbeiten und formatieren.
Der Benutzer teilt dir eine Erinnerung oder Information mit, die du dir merken sollst.
Deine Aufgabe:
1. Verstehe den Kontext und die Bedeutung der Information
2. Formuliere sie in der ersten oder dritten Person, wie es am besten passt
3. Formatiere die Information klar und präzise
4. Gib deine Interpretation der Erinnerung zurück, ohne zusätzliche Kommentare
5. Frage NICHT nach mehr Informationen, arbeite mit dem, was gegeben ist
6. Antworte NUR mit dem formatierten Erinnerungstext, keine Einleitungen oder Schlussfolgerungen`;
          
          llmParams.message = `Verarbeite diese Erinnerung für mein Langzeitgedächtnis: "${memoryText}"`;
          llmParams.system_prompt = memorySystemPrompt;
          
          // LLM-Anfrage senden
          const llmResponse = await this.apiClient.sendChatMessage(llmParams);
          
          // Verarbeitete Erinnerung extrahieren und speichern
          const processedMemory = llmResponse.response.trim();
          await this.apiClient.saveMemory(processedMemory);
          
          return {
            response: `✅ Erinnerung verarbeitet und gespeichert:\n\n"${processedMemory}"`,
            audio_file: llmResponse.audio_file // Die Audio-Antwort des LLM weitergeben
          };
          
        } catch (error) {
          console.error('Fehler beim Verarbeiten der Erinnerung:', error);
          return {
            response: `❌ Fehler beim Verarbeiten der Erinnerung: ${error.message}`,
            audio_file: null
          };
        }
      } else {
        return {
          response: "⚠️ Bitte gib nach dem /remember-Befehl einen Text ein, der gespeichert werden soll.",
          audio_file: null
        };
      }
    }
    
    // Erinnerungen anzeigen mit /memories
    if (message === '/memories') {
      try {
        const memories = await this.apiClient.getMemories();
        if (memories.length === 0) {
          return {
            response: "Es sind noch keine Erinnerungen gespeichert.",
            audio_file: null
          };
        }
        
        const formattedMemories = memories.map(memory => 
          `[${memory.date}] ${memory.text}`
        ).join('\n\n');
        
        return {
          response: `## Gespeicherte Erinnerungen\n\n${formattedMemories}`,
          audio_file: null
        };
      } catch (error) {
        console.error('Fehler beim Abrufen der Erinnerungen:', error);
        return {
          response: `❌ Fehler beim Abrufen der Erinnerungen: ${error.message}`,
          audio_file: null
        };
      }
    }
    
    // Wenn es kein Befehl ist, die Nachricht normal senden
    return this.apiClient.sendChatMessage(params);
  }
}
