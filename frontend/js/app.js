/**
 * Hauptanwendung für das Ollama UI Frontend.
 * Initialisiert und koordiniert alle Module.
 */

class App {
  constructor() {
    // Services initialisieren
    this.api = new ApiClient();
    this.themeManager = new ThemeManager();
    this.chatManager = new ChatManager(this.api);
    this.memoryManager = new MemoryManager(this.api);
    this.ttsController = new TTSController();
    
    // UI-Controller initialisieren
    this.uiController = new UIController({
      api: this.api,
      themeManager: this.themeManager,
      chatManager: this.chatManager,
      memoryManager: this.memoryManager,
      ttsController: this.ttsController
    });
    
    // ⭐ NEUE Zeile: Global verfügbar machen für removeImage Funktionalität
    window.uiController = this.uiController;
	
    // Event-Listener einrichten
    this.setupEventListeners();
    
    // App initialisieren
    this.initialize();
  }
  
  /**
   * Event-Listener für die Anwendung einrichten.
   */
  setupEventListeners() {
    // Globale Event-Listener
    document.addEventListener('DOMContentLoaded', () => {
      this.uiController.renderUI();
    });
    
    // Error-Handling
    window.addEventListener('error', (event) => {
      console.error('Globaler Fehler:', event.error);
      this.uiController.showError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    });
  }
  
  /**
   * Anwendung initialisieren.
   */
  async initialize() {
    try {
      console.log('Initialisiere Ollama UI...');
      
      // Theme aus dem lokalen Speicher laden
      this.themeManager.loadThemePreference();
      
      // Modelle und Stimmen laden
      await Promise.all([
        this.loadModels(),
        this.loadVoices()
      ]);
      
      console.log('Initialisierung abgeschlossen.');
    } catch (error) {
      console.error('Fehler bei der Initialisierung:', error);
      this.uiController.showError('Fehler beim Starten der Anwendung. Bitte überprüfe die Serververbindung.');
    }
  }
  
  /**
   * Verfügbare Modelle laden.
   */
  async loadModels() {
    try {
      const models = await this.api.getModels();
      this.uiController.populateModelSelect(models);
    } catch (error) {
      console.error('Fehler beim Laden der Modelle:', error);
      this.uiController.showError('Die Modelle konnten nicht geladen werden. Bitte überprüfe die Verbindung zu Ollama.');
    }
  }
  
  /**
   * Verfügbare TTS-Stimmen laden.
   */
  async loadVoices() {
    try {
      const voices = await this.api.getVoices();
      this.uiController.populateVoiceSelect(voices);
    } catch (error) {
      console.error('Fehler beim Laden der Stimmen:', error);
      this.uiController.showError('Die TTS-Stimmen konnten nicht geladen werden.');
    }
  }
}

// App-Instanz erstellen und starten
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
