/**
 * UI-Controller für die Ollama Chat-Anwendung.
 * Verwaltet die Benutzeroberfläche und Benutzerinteraktionen.
 */

class UIController {
  constructor({ api, themeManager, chatManager, memoryManager, ttsController }) {
    // Services
    this.api = api;
    this.themeManager = themeManager;
    this.chatManager = chatManager;
    this.memoryManager = memoryManager;
    this.ttsController = ttsController;
    
    // DOM-Elemente
    this.messageContainer = document.getElementById('message-container');
    this.userInput = document.getElementById('user-input');
    this.sendBtn = document.getElementById('send-btn');
    this.micBtn = document.getElementById('mic-btn');
    
    // Bild-Upload Elemente
    this.imageUploadBtn = document.getElementById('image-upload-btn');
    this.imageUpload = document.getElementById('image-upload');
    this.imagePreviewContainer = document.getElementById('image-preview-container');
	
	// ⭐ File-Upload Elemente
	this.fileUploadBtn = document.getElementById('file-upload-btn');
	this.fileUpload = document.getElementById('file-upload');
	this.filePreviewContainer = document.getElementById('file-preview-container');
    
    // ⭐ Avatar-Elemente
    this.userAvatarBtn = document.getElementById('user-avatar-btn');
    this.userAvatarUpload = document.getElementById('user-avatar-upload');
    this.userAvatarPreview = document.getElementById('user-avatar-preview');
    this.userAvatarReset = document.getElementById('user-avatar-reset');
    this.aiAvatarBtn = document.getElementById('ai-avatar-btn');
    this.aiAvatarUpload = document.getElementById('ai-avatar-upload');
    this.aiAvatarPreview = document.getElementById('ai-avatar-preview');
    this.aiAvatarReset = document.getElementById('ai-avatar-reset');
    
    this.modelSelect = document.getElementById('model-select');
    this.voiceSelect = document.getElementById('voice-select');
    this.speechLanguageSelect = document.getElementById('speech-language');
    this.systemPrompt = document.getElementById('system-prompt');
    this.temperatureSlider = document.getElementById('temperature');
    this.temperatureValue = document.getElementById('temperature-value');
    this.rateSlider = document.getElementById('rate');
    this.rateValue = document.getElementById('rate-value');
    this.pitchSlider = document.getElementById('pitch');
    this.pitchValue = document.getElementById('pitch-value');
    this.enableTts = document.getElementById('enable-tts');
    this.darkModeToggle = document.getElementById('dark-mode');
    this.clearChatBtn = document.getElementById('clear-chat-btn');
    this.contextLengthSlider = document.getElementById('context-length');
    this.contextLengthValue = document.getElementById('context-length-value');
    this.toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    this.notificationContainer = document.getElementById('notification-container');
    this.speechStatus = document.getElementById('speech-status');
    
    // Flags
    this.isProcessing = false;
    this.isSpeechRecognitionActive = false;
    this.selectedImages = []; // Array für ausgewählte Bilder
    this.selectedFiles = []; // ⭐ Array für ausgewählte Dateien
	
    // ⭐ Avatar-Daten
    this.userAvatar = null;
    this.aiAvatar = null;
    
    // Event-Listener einrichten
    this.setupEventListeners();
    
    // Gespeicherte Einstellungen laden
    this.loadSettings();
  }
  
  /**
   * Event-Listener für die UI-Elemente einrichten.
   */
  setupEventListeners() {
    // Nachricht senden
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // Spracherkennung
    this.micBtn.addEventListener('click', () => this.toggleSpeechRecognition());
    
    // Bild-Upload Event-Listener
    this.imageUploadBtn.addEventListener('click', () => this.imageUpload.click());
    this.imageUpload.addEventListener('change', (e) => this.handleImageSelection(e.target.files));
    
	// ⭐ File-Upload Event-Listener
	this.fileUploadBtn.addEventListener('click', () => this.fileUpload.click());
	this.fileUpload.addEventListener('change', (e) => this.handleFileSelection(e.target.files));
	
    // Drag & Drop Support
    this.userInput.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.userInput.addEventListener('drop', (e) => this.handleDrop(e));
    
    // ⭐ Avatar Event-Listener
    this.userAvatarBtn.addEventListener('click', () => this.userAvatarUpload.click());
    this.userAvatarUpload.addEventListener('change', (e) => this.handleAvatarUpload(e, 'user'));
    this.userAvatarReset.addEventListener('click', () => this.resetAvatar('user'));
    
    this.aiAvatarBtn.addEventListener('click', () => this.aiAvatarUpload.click());
    this.aiAvatarUpload.addEventListener('change', (e) => this.handleAvatarUpload(e, 'ai'));
    this.aiAvatarReset.addEventListener('click', () => this.resetAvatar('ai'));
    
    // Einstellungen aktualisieren
    this.modelSelect.addEventListener('change', () => this.saveSettings());
    this.voiceSelect.addEventListener('change', () => this.saveSettings());
    this.speechLanguageSelect.addEventListener('change', () => this.saveSettings());
    this.systemPrompt.addEventListener('change', () => this.saveSettings());
    
    // Slider-Ereignisse
    this.temperatureSlider.addEventListener('input', () => {
      this.temperatureValue.textContent = this.temperatureSlider.value;
      this.saveSettings();
    });
    
    this.rateSlider.addEventListener('input', () => {
      this.rateValue.textContent = this.rateSlider.value;
      this.saveSettings();
    });
    
    this.pitchSlider.addEventListener('input', () => {
      this.pitchValue.textContent = this.pitchSlider.value;
      this.saveSettings();
    });
    
    this.contextLengthSlider.addEventListener('input', () => {
      this.contextLengthValue.textContent = this.contextLengthSlider.value;
      this.saveSettings();
    });
    
    // Checkboxen
    this.enableTts.addEventListener('change', () => this.saveSettings());
    this.darkModeToggle.addEventListener('change', () => {
      this.themeManager.toggleTheme();
      this.saveSettings();
    });
    
    // Aktionen
    this.clearChatBtn.addEventListener('click', () => this.clearChat());
    this.toggleSidebarBtn.addEventListener('click', () => this.toggleSidebar());
    
    // Auto-Resize für Textarea mit Memory-Erkennung
    this.userInput.addEventListener('input', () => {
      this.autoResizeTextarea();
      
      // ⭐ Memory-Command Live-Erkennung
      const message = this.userInput.value.trim();
      if (message.length > 5) { // Nur bei längeren Nachrichten prüfen
        this.showMemoryHint(message);
      }
    });
  }
  
  /**
   * UI initialisieren und rendern.
   */
  renderUI() {
    // Gespeicherte Chat-Nachrichten laden
    this.chatManager.loadChatHistory().forEach(message => {
      this.addMessageToUI(message.role, message.content);
    });
    
    // Sidebar-Status wiederherstellen
    const isSidebarHidden = localStorage.getItem('ollama_ui_sidebar_hidden') === 'true';
    if (isSidebarHidden) {
      document.querySelector('.app-container').classList.add('sidebar-hidden');
    }
  }
  
  /**
   * Gespeicherte Einstellungen laden.
   */
  loadSettings() {
    // Dunkelmodus
    const darkMode = localStorage.getItem('ollama_ui_dark_mode') !== 'false';
    this.darkModeToggle.checked = darkMode;
    
    // TTS aktiviert
    const ttsEnabled = localStorage.getItem('ollama_ui_tts_enabled') !== 'false';
    this.enableTts.checked = ttsEnabled;
    
    // Speech Language
    const speechLanguage = localStorage.getItem('ollama_ui_speech_language') || 'de-DE';
    if (this.speechLanguageSelect) {
        this.speechLanguageSelect.value = speechLanguage;
    }
    
    // ⭐ Avatar-Einstellungen laden
    this.loadAvatars();
    
    // Temperatur
    const temperature = localStorage.getItem('ollama_ui_temperature') || '0.7';
    this.temperatureSlider.value = temperature;
    this.temperatureValue.textContent = temperature;
    
    // TTS-Rate
    const rate = localStorage.getItem('ollama_ui_tts_rate') || '1.0';
    this.rateSlider.value = rate;
    this.rateValue.textContent = rate;
    
    // TTS-Pitch
    const pitch = localStorage.getItem('ollama_ui_tts_pitch') || '1.0';
    this.pitchSlider.value = pitch;
    this.pitchValue.textContent = pitch;
    
    // System Prompt
    const systemPrompt = localStorage.getItem('ollama_ui_system_prompt') || 'Du bist ein hilfreicher Assistent.';
    this.systemPrompt.value = systemPrompt;
    
    // Kontext-Länge
    const contextLength = localStorage.getItem('ollama_ui_context_length') || '10';
    this.contextLengthSlider.value = contextLength;
    this.contextLengthValue.textContent = contextLength;
  }
  
  /**
   * Einstellungen speichern.
   */
  saveSettings() {
    // Dunkelmodus
    localStorage.setItem('ollama_ui_dark_mode', this.darkModeToggle.checked);
    
    // Ausgewähltes Modell
    if (this.modelSelect.value) {
      localStorage.setItem('ollama_ui_model', this.modelSelect.value);
    }
    
    // ⭐ Avatar-Speicherung
    if (this.userAvatar) {
        localStorage.setItem('ollama_ui_user_avatar', this.userAvatar);
    }
    if (this.aiAvatar) {
        localStorage.setItem('ollama_ui_ai_avatar', this.aiAvatar);
    }
    
    // Ausgewählte Stimme
    if (this.voiceSelect.value) {
      localStorage.setItem('ollama_ui_voice', this.voiceSelect.value);
    }
    
    // Speech Language
    if (this.speechLanguageSelect && this.speechLanguageSelect.value) {
        localStorage.setItem('ollama_ui_speech_language', this.speechLanguageSelect.value);
    }
    
    // TTS aktiviert
    localStorage.setItem('ollama_ui_tts_enabled', this.enableTts.checked);
    
    // Temperatur
    localStorage.setItem('ollama_ui_temperature', this.temperatureSlider.value);
    
    // TTS-Rate
    localStorage.setItem('ollama_ui_tts_rate', this.rateSlider.value);
    
    // TTS-Pitch
    localStorage.setItem('ollama_ui_tts_pitch', this.pitchSlider.value);
    
    // System Prompt
    localStorage.setItem('ollama_ui_system_prompt', this.systemPrompt.value);
    
    // Kontext-Länge
    localStorage.setItem('ollama_ui_context_length', this.contextLengthSlider.value);
  }
  
  /**
   * Nachricht senden.
   */
  async sendMessage() {
    const message = this.userInput.value.trim();
    
    if ((!message && this.selectedImages.length === 0) || this.isProcessing) {
      return;
    }
    
    // ⭐ Memory-Command Erkennung
    const isMemoryCmd = this.api.isMemoryCommand(message);
    
    // Benutzereingabe zurücksetzen und verarbeiten
    this.userInput.value = '';
    this.autoResizeTextarea();
    this.isProcessing = true;
    
    // Benutzeränderungen anzeigen (mit Bildern falls vorhanden)
    this.addMessageToUI('user', message, this.selectedImages);
	this.showTypingIndicator();
    
    // ⭐ Unterschiedliche Placeholder für Memory-Befehle
    if (isMemoryCmd) {
      this.userInput.placeholder = 'Verarbeite Memory-Befehl...';
    } else {
      this.userInput.placeholder = 'Warte auf Antwort...';
    }
    
    this.sendBtn.disabled = true;
    
    try {
      const selectedModel = this.modelSelect.value || 'llama2';
      const systemPromptText = this.systemPrompt.value;
      const temperature = parseFloat(this.temperatureSlider.value);
      const enableTts = this.enableTts.checked;
      const voice = this.voiceSelect.value || 'de-DE-KatjaNeural';
      const rate = this.rateSlider.value;
      const pitch = this.pitchSlider.value;
      const contextLength = parseInt(this.contextLengthSlider.value);
      
      // Chat-Kontext abrufen
      const context = this.chatManager.getChatContext(contextLength);
      
      // Bilder für das Backend vorbereiten
      const imageData = await this.prepareImagesForUpload();
      
      // LLM-Anfrage
      const response = await this.chatManager.sendMessage({
        model: selectedModel,
        message,
        system_prompt: systemPromptText,
        temperature,
        enable_tts: enableTts,
        voice,
        rate,
        pitch,
        context,
        images: imageData // Bilder hinzufügen
      });
      
      // ⭐ Memory-Aktion verarbeiten und entsprechende Benachrichtigung anzeigen
      if (response.memory_action === 'save') {
        this.showNotification('💾 Erinnerung wurde gespeichert!', 'success');
        console.log('Memory saved successfully');
      } else if (response.memory_action === 'recall') {
        this.showNotification('🧠 Erinnerungen wurden abgerufen!', 'info');
        console.log('Memories recalled successfully');
      }
      
      // Antwort anzeigen
	// ⭐ Antwort mit Reasoning anzeigen
		if (response.has_reasoning) {
		  this.addReasoningMessageToUI(response.response, response.reasoning);
		} else {
		  this.addMessageToUI('assistant', response.response);
		}
      
      // Audio abspielen, wenn TTS aktiviert ist
      if (enableTts && response.audio_file) {
        this.ttsController.playAudio(response.audio_file);
      }
      
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
      this.showError('Fehler beim Senden der Nachricht. Bitte versuche es erneut.');
    } finally {
      this.isProcessing = false;
      this.userInput.placeholder = 'Schreibe eine Nachricht...';
      this.sendBtn.disabled = false;
      this.userInput.focus();
	  this.hideTypingIndicator();
      
      // Bilder nach dem Senden löschen
      this.clearImages();
    }
  }
  
  /**
   * Eine Nachricht zur UI hinzufügen.
   */
  addMessageToUI(role, content, images = []) {
    const messageEl = document.createElement('div');
    messageEl.classList.add('message', `${role}-message`);
    
    // ⭐ Avatar mit Bild oder Fallback
    const avatarEl = document.createElement('div');
    avatarEl.classList.add('message-avatar');
    
    if (role === 'user' && this.userAvatar) {
      // User Avatar mit Bild
      const imgEl = document.createElement('img');
      imgEl.src = this.userAvatar;
      imgEl.alt = 'User Avatar';
      avatarEl.appendChild(imgEl);
    } else if (role === 'assistant' && this.aiAvatar) {
      // AI Avatar mit Bild
      const imgEl = document.createElement('img');
      imgEl.src = this.aiAvatar;
      imgEl.alt = 'AI Avatar';
      avatarEl.appendChild(imgEl);
    } else {
      // Fallback Text-Avatar
      avatarEl.textContent = role === 'user' ? 'U' : 'AI';
    }
    
    messageEl.appendChild(avatarEl);
    
    // Nachrichteninhalt
    const contentEl = document.createElement('div');
    contentEl.classList.add('message-content');
    
    // Bilder in Nachricht anzeigen
    if (images && images.length > 0) {
      const imagesContainer = document.createElement('div');
      imagesContainer.classList.add('message-images');
      
      if (typeof images[0] === 'object' && images[0].data) {
        // Neue Bilder (File-Objekte mit data)
        images.forEach(image => {
          const imgEl = document.createElement('img');
          imgEl.src = `data:${image.type};base64,${image.data}`;
          imgEl.alt = image.name;
          imgEl.classList.add('message-image');
          imagesContainer.appendChild(imgEl);
        });
      } else {
        // Legacy: File-Objekte direkt
        images.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const imgEl = document.createElement('img');
            imgEl.src = e.target.result;
            imgEl.alt = file.name;
            imgEl.classList.add('message-image');
            imagesContainer.appendChild(imgEl);
          };
          reader.readAsDataURL(file);
        });
      }
      
      contentEl.appendChild(imagesContainer);
    }
    
    // Text-Inhalt
    if (content) {
      const textContainer = document.createElement('div');
      const formattedContent = this.formatMessage(content);
      textContainer.innerHTML = formattedContent;
      contentEl.appendChild(textContainer);
    }
    
    messageEl.appendChild(contentEl);
    this.messageContainer.appendChild(messageEl);
    
    // Zum Ende scrollen
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    
    // Chat-Verlauf speichern
    if (role === 'user' || role === 'assistant') {
      this.chatManager.addMessageToHistory(role, content);
    }
  }
  
  /**
   * Nachrichtentext formatieren.
   */
  formatMessage(text) {
    // Code-Blöcke formatieren
    let formatted = text.replace(/```([\s\S]*?)```/g, (match, code) => {
      return `<pre><code>${this.escapeHtml(code)}</code></pre>`;
    });
    
    // Inline-Code formatieren
    formatted = formatted.replace(/`([^`]+)`/g, (match, code) => {
      return `<code class="inline-code">${this.escapeHtml(code)}</code>`;
    });
    
    // Zeilenumbrüche beibehalten
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  }
  
  /**
   * HTML-Zeichen escapen.
   */
  escapeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }
  
  /**
   * Fehler anzeigen.
   */
  showError(message) {
    const notification = document.createElement('div');
    notification.classList.add('notification', 'error');
    notification.textContent = message;
    
    this.notificationContainer.appendChild(notification);
    
    // Nach 5 Sekunden automatisch entfernen
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        if (notification.parentNode) {
          this.notificationContainer.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }
  
  /**
   * ⭐ Erweiterte Benachrichtigung mit Typ.
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.classList.add('notification');
    
    // Typ-spezifische Klassen
    if (type === 'error') {
      notification.classList.add('error');
    } else if (type === 'success') {
      notification.classList.add('success');
    } else if (type === 'warning') {
      notification.classList.add('warning');
    }
    
    notification.textContent = message;
    
    this.notificationContainer.appendChild(notification);
    
    // Nach 3 Sekunden automatisch entfernen
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        if (notification.parentNode) {
          this.notificationContainer.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
  
  /**
   * Chat löschen.
   */
  clearChat() {
    // Bestätigung anfordern
    if (confirm('Do you really want to delete the entire chat history?')) {
      // Chat-Container leeren
      this.messageContainer.innerHTML = `
        <div class="welcome-message">
          <h2>Welcome to Astroburner's Magic Tool!</h2>
          <p>🤖 Select a model in the settings.</p>
          <p>🗣️ Select a language in the settings.</p>
          <p>🔊 Select a TTS in the settings and start the conversation.</p>
          <p><strong>💾 Memory Commands:</strong></p>
          <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
            <li><code>/remember [text]</code> - Save information</li>
            <li><code>Merke dir: [text]</code> - Speichere Info (DE)</li>
            <li><code>Remember: [text]</code> - Save info (EN)</li>
            <li><code>Was weißt du noch?</code> - Recall memories (DE)</li>
            <li><code>What do you remember?</code> - Recall memories (EN)</li>
          </ul>
        </div>
      `;
      
      // Chat-Verlauf zurücksetzen
      this.chatManager.clearChatHistory();
      
      this.showNotification('Chat history has been deleted.');
    }
  }
  
  /**
   * Seitenleiste ein-/ausblenden.
   */
  toggleSidebar() {
    const appContainer = document.querySelector('.app-container');
    appContainer.classList.toggle('sidebar-hidden');
    
    // Sidebar-Status speichern
    localStorage.setItem('ollama_ui_sidebar_hidden', appContainer.classList.contains('sidebar-hidden'));
  }
  
  /**
   * Textarea automatisch vergrößern.
   */
  autoResizeTextarea() {
    this.userInput.style.height = 'auto';
    this.userInput.style.height = `${Math.min(this.userInput.scrollHeight, 200)}px`;
  }
  
  /**
   * Modell-Auswahl füllen.
   */
  populateModelSelect(models) {
    if (!models || models.length === 0) {
      this.modelSelect.innerHTML = '<option value="">Keine Modelle verfügbar</option>';
      return;
    }
    
    this.modelSelect.innerHTML = '';
    
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      this.modelSelect.appendChild(option);
    });
    
    // Gespeichertes Modell auswählen
    const savedModel = localStorage.getItem('ollama_ui_model');
    if (savedModel && models.includes(savedModel)) {
      this.modelSelect.value = savedModel;
    } else if (models.length > 0) {
      this.modelSelect.value = models[0];
    }
  }
  
  /**
   * Stimmen-Auswahl füllen.
   */
  populateVoiceSelect(voices) {
    if (!voices || voices.length === 0) {
      this.voiceSelect.innerHTML = '<option value="">Keine Stimmen verfügbar</option>';
      return;
    }
    
    this.voiceSelect.innerHTML = '';
    
    // Stimmen nach Sprache gruppieren
    const voicesByLocale = voices.reduce((acc, voice) => {
      const locale = voice.locale;
      if (!acc[locale]) {
        acc[locale] = [];
      }
      acc[locale].push(voice);
      return acc;
    }, {});
    
    // Optgroups für jede Sprache erstellen
    Object.keys(voicesByLocale).sort().forEach(locale => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = locale;
      
      voicesByLocale[locale].forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.name;
        option.textContent = `${voice.display_name}`;
        optgroup.appendChild(option);
      });
      
      this.voiceSelect.appendChild(optgroup);
    });
    
    // Gespeicherte Stimme auswählen
    const savedVoice = localStorage.getItem('ollama_ui_voice');
    if (savedVoice) {
      this.voiceSelect.value = savedVoice;
    } else {
      // Standardmäßig deutsche Stimme auswählen, wenn verfügbar
      const germanVoices = voices.filter(voice => voice.locale.startsWith('de-'));
      if (germanVoices.length > 0) {
        this.voiceSelect.value = germanVoices[0].name;
      } else {
        this.voiceSelect.value = voices[0].name;
      }
    }
  }
  
  /**
   * Spracherkennung ein-/ausschalten.
   */
  toggleSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      this.showError('Spracherkennung wird in diesem Browser nicht unterstützt.');
      return;
    }
    
    if (this.isSpeechRecognitionActive) {
      this.stopSpeechRecognition();
    } else {
      this.startSpeechRecognition();
    }
  }
  
  /**
   * Spracherkennung starten.
   */
  startSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    // Sprache aus Dropdown lesen
    const selectedLang = this.speechLanguageSelect?.value || 'de-DE';
    this.recognition.lang = selectedLang;
    
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    
    this.recognition.onstart = () => {
      this.isSpeechRecognitionActive = true;
      this.micBtn.classList.add('active');
      this.speechStatus.classList.add('active');
      this.userInput.placeholder = 'Spreche jetzt...';
    };
    
    this.recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      
      this.userInput.value = transcript;
      this.autoResizeTextarea();
    };
    
    this.recognition.onerror = (event) => {
      console.error('Spracherkennungsfehler:', event.error);
      this.showError(`Spracherkennungsfehler: ${event.error}`);
      this.stopSpeechRecognition();
    };
    
    this.recognition.onend = () => {
      this.stopSpeechRecognition();
      
      // Wenn Text erkannt wurde, automatisch senden
      if (this.userInput.value.trim() !== '') {
        setTimeout(() => this.sendMessage(), 500);
      }
    };
    
    this.recognition.start();
  }
  
  /**
   * Spracherkennung stoppen.
   */
  stopSpeechRecognition() {
    if (this.recognition) {
      this.recognition.stop();
    }
    
    this.isSpeechRecognitionActive = false;
    this.micBtn.classList.remove('active');
    this.speechStatus.classList.remove('active');
    this.userInput.placeholder = 'Schreibe eine Nachricht...';
  }
  
  /**
   * Bild-Auswahl verarbeiten.
   */
  handleImageSelection(files) {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        this.selectedImages.push(file);
        this.createImagePreview(file);
      }
    });
    
    if (this.selectedImages.length > 0) {
      this.imagePreviewContainer.style.display = 'flex';
    }
  }
  
  /**
   * Bild-Vorschau erstellen.
   */
  createImagePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewDiv = document.createElement('div');
      previewDiv.className = 'image-preview-item';
      previewDiv.innerHTML = `
        <img src="${e.target.result}" alt="Preview" />
        <button class="remove-image-btn" onclick="window.uiController.removeImage('${file.name}')" title="Bild entfernen">×</button>
        <span class="image-name">${file.name}</span>
      `;
      this.imagePreviewContainer.appendChild(previewDiv);
    };
    reader.readAsDataURL(file);
  }
  
  /**
   * Bild aus Vorschau entfernen.
   */
  removeImage(fileName) {
    // Bild aus Array entfernen
    this.selectedImages = this.selectedImages.filter(file => file.name !== fileName);
    
    // Vorschau-Element entfernen
    const previewItems = this.imagePreviewContainer.querySelectorAll('.image-preview-item');
    previewItems.forEach(item => {
      const imageName = item.querySelector('.image-name').textContent;
      if (imageName === fileName) {
        item.remove();
      }
    });
    
    // Container verstecken wenn keine Bilder mehr da sind
    if (this.selectedImages.length === 0) {
      this.imagePreviewContainer.style.display = 'none';
    }
  }
  
  /**
   * Drag Over Event verarbeiten.
   */
  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    this.userInput.classList.add('drag-over');
  }
  
  /**
   * Drop Event verarbeiten.
   */
  handleDrop(e) {
    e.preventDefault();
    this.userInput.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      this.handleImageSelection(files);
    }
  }
  
  /**
   * Bilder für Upload vorbereiten.
   */
  async prepareImagesForUpload() {
    const imagePromises = this.selectedImages.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            name: file.name,
            type: file.type,
            size: file.size,
            data: e.target.result.split(',')[1] // Base64 ohne "data:image/...;base64," Teil
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
    
    return Promise.all(imagePromises);
  }
  
  /**
   * Alle Bilder löschen.
   */
  clearImages() {
    this.selectedImages = [];
    this.imagePreviewContainer.innerHTML = '';
    this.imagePreviewContainer.style.display = 'none';
  }
  
  /**
   * ⭐ Avatar-Upload verarbeiten.
   */
  handleAvatarUpload(event, type) {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
        this.showError('Bitte wähle eine gültige Bilddatei aus.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const avatarData = e.target.result;
        
        if (type === 'user') {
            this.userAvatar = avatarData;
            this.userAvatarPreview.src = avatarData;
            this.userAvatarPreview.classList.add('loaded');
        } else {
            this.aiAvatar = avatarData;
            this.aiAvatarPreview.src = avatarData;
            this.aiAvatarPreview.classList.add('loaded');
        }
        
        this.saveSettings();
        this.showNotification(`${type === 'user' ? 'Dein' : 'AI'} Avatar wurde aktualisiert!`, 'success');
    };
    
    reader.readAsDataURL(file);
  }

  /**
   * ⭐ Avatar zurücksetzen.
   */
  resetAvatar(type) {
    if (type === 'user') {
        this.userAvatar = null;
        this.userAvatarPreview.src = '';
        this.userAvatarPreview.classList.remove('loaded');
        localStorage.removeItem('ollama_ui_user_avatar');
    } else {
        this.aiAvatar = null;
        this.aiAvatarPreview.src = '';
        this.aiAvatarPreview.classList.remove('loaded');
        localStorage.removeItem('ollama_ui_ai_avatar');
    }
    
    this.showNotification(`${type === 'user' ? 'Dein' : 'AI'} Avatar wurde zurückgesetzt!`, 'info');
  }

  /**
   * ⭐ Gespeicherte Avatare laden.
   */
  loadAvatars() {
    // User Avatar laden
    const savedUserAvatar = localStorage.getItem('ollama_ui_user_avatar');
    if (savedUserAvatar) {
        this.userAvatar = savedUserAvatar;
        this.userAvatarPreview.src = savedUserAvatar;
        this.userAvatarPreview.classList.add('loaded');
    }
    
    // AI Avatar laden
    const savedAiAvatar = localStorage.getItem('ollama_ui_ai_avatar');
    if (savedAiAvatar) {
        this.aiAvatar = savedAiAvatar;
        this.aiAvatarPreview.src = savedAiAvatar;
        this.aiAvatarPreview.classList.add('loaded');
    }
  }
  
  /**
   * ⭐ Memory-Helper Methoden
   */

  /**
   * Prüft ob eine Nachricht ein Memory-Befehl ist (Frontend-Erkennung).
   */
  isMemoryCommand(message) {
    return this.api.isMemoryCommand(message);
  }

  /**
   * Zeigt Memory-spezifische UI-Hinweise an.
   */
  showMemoryHint(message) {
    const isMemoryCmd = this.isMemoryCommand(message);
    
    if (isMemoryCmd) {
      // Visueller Hinweis für Memory-Befehle
      this.userInput.style.borderColor = '#4CAF50'; // Grüner Rahmen
      this.userInput.style.boxShadow = '0 0 5px rgba(76, 175, 80, 0.3)';
      
      // Nach kurzer Zeit zurücksetzen
      setTimeout(() => {
        this.userInput.style.borderColor = '';
        this.userInput.style.boxShadow = '';
      }, 2000);
    }
  }

  /**
   * Memory-Statistiken anzeigen (optional).
   */
  async showMemoryStats() {
    try {
      const memories = await this.memoryManager.getMemories();
      this.showNotification(`📚 ${memories.length} Erinnerungen gespeichert`, 'info');
    } catch (error) {
      console.error('Fehler beim Abrufen der Memory-Statistiken:', error);
    }
  }

  /**
   * ⭐ Zusätzliche Utility-Methoden
   */

  /**
   * Überprüft ob alle notwendigen Services verfügbar sind.
   */
  checkServices() {
    const requiredServices = ['api', 'themeManager', 'chatManager', 'memoryManager', 'ttsController'];
    const missingServices = requiredServices.filter(service => !this[service]);
    
    if (missingServices.length > 0) {
      console.warn('Fehlende Services:', missingServices);
      this.showError(`Fehlende Services: ${missingServices.join(', ')}`);
      return false;
    }
    
    return true;
  }

  /**
   * Debuginfo für Entwickler anzeigen.
   */
  showDebugInfo() {
    const info = {
      selectedImages: this.selectedImages.length,
      userAvatar: !!this.userAvatar,
      aiAvatar: !!this.aiAvatar,
      speechLanguage: this.speechLanguageSelect?.value,
      model: this.modelSelect?.value,
      voice: this.voiceSelect?.value,
      isProcessing: this.isProcessing,
      isSpeechActive: this.isSpeechRecognitionActive
    };
    
    console.table(info);
    this.showNotification('Debug-Info in Konsole ausgegeben', 'info');
  }

  /**
   * Keyboard-Shortcuts handhaben.
   */
  handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + Enter = Nachricht senden
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.sendMessage();
    }
    
    // Ctrl/Cmd + M = Memory-Statistiken anzeigen
    if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
      event.preventDefault();
      this.showMemoryStats();
    }
    
    // Ctrl/Cmd + D = Debug-Info
    if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
      event.preventDefault();
      this.showDebugInfo();
    }
    
    // ESC = Spracherkennung stoppen
    if (event.key === 'Escape' && this.isSpeechRecognitionActive) {
      event.preventDefault();
      this.stopSpeechRecognition();
    }
  }

  /**
   * Initialisiert Keyboard-Shortcuts.
   */
  initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
  }

  /**
   * ⭐ Erweiterte Initialisierung
   */
  initialize() {
    // Services prüfen
    if (!this.checkServices()) {
      return false;
    }
    
    // Keyboard-Shortcuts aktivieren
    this.initKeyboardShortcuts();
    
    // UI rendern
    this.renderUI();
    
    console.log('🚀 UIController erfolgreich initialisiert!');
    console.log('💡 Keyboard-Shortcuts:');
    console.log('   Ctrl/Cmd + Enter = Nachricht senden');
    console.log('   Ctrl/Cmd + M = Memory-Statistiken');
    console.log('   Ctrl/Cmd + D = Debug-Info');
    console.log('   ESC = Spracherkennung stoppen');
    
    return true;
  }

  /**
   * ⭐ Cleanup-Methoden für Speicher-Management
   */
  cleanup() {
    // Event-Listener entfernen
    if (this.recognition) {
      this.recognition.abort();
      this.recognition = null;
    }
    
    // Temporäre Daten löschen
    this.clearImages();
    
    // Status zurücksetzen
    this.isProcessing = false;
    this.isSpeechRecognitionActive = false;
    
    console.log('🧹 UIController cleanup completed');
  }

  /**
   * ⭐ Error-Recovery Methoden
   */
  recoverFromError() {
    // Versuche UI-Status zu normalisieren
    this.isProcessing = false;
    this.sendBtn.disabled = false;
    this.userInput.placeholder = 'Schreibe eine Nachricht...';
    
    // Spracherkennung stoppen falls aktiv
    if (this.isSpeechRecognitionActive) {
      this.stopSpeechRecognition();
    }
    
    // Bilder löschen falls vorhanden
    this.clearImages();
    
    this.showNotification('🔄 System wurde zurückgesetzt', 'info');
  }
  /**
 * ⭐ FILE-UPLOAD METHODEN
 */

/**
 * Datei-Auswahl verarbeiten.
 */
handleFileSelection(files) {
  Array.from(files).forEach(file => {
    // Prüfe Dateigröße (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.showError(`File too large: ${file.name} (max 10MB)`);
      return;
    }
    
    this.selectedFiles.push(file);
    this.createFilePreview(file);
  });
  
  if (this.selectedFiles.length > 0) {
    this.filePreviewContainer.style.display = 'flex';
  }
}

/**
 * Datei-Vorschau erstellen.
 */
createFilePreview(file) {
  const previewDiv = document.createElement('div');
  previewDiv.className = 'file-preview-item';
  
  // Dateigröße formatieren
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Dateierweiterung extrahieren
  const getFileExtension = (filename) => {
    return filename.split('.').pop().toUpperCase();
  };
  
  previewDiv.innerHTML = `
    <div class="file-info">
      <div class="file-name">${file.name}</div>
      <div class="file-details">
        <span class="file-type">${getFileExtension(file.name)}</span>
        <span>${formatFileSize(file.size)}</span>
      </div>
    </div>
    <button class="remove-file-btn" onclick="window.uiController.removeFile('${file.name}')" title="Remove file">×</button>
  `;
  
  this.filePreviewContainer.appendChild(previewDiv);
  
  // Analyze-Button hinzufügen (nur einmal)
  if (!this.filePreviewContainer.querySelector('.analyze-files-btn')) {
    const analyzeBtn = document.createElement('button');
    analyzeBtn.className = 'analyze-files-btn';
    analyzeBtn.textContent = '🔍 Analyze Files';
    analyzeBtn.onclick = () => this.analyzeFiles();
    this.filePreviewContainer.appendChild(analyzeBtn);
  }
}

/**
 * Datei aus Vorschau entfernen.
 */
removeFile(fileName) {
  // Datei aus Array entfernen
  this.selectedFiles = this.selectedFiles.filter(file => file.name !== fileName);
  
  // Vorschau-Element entfernen
  const previewItems = this.filePreviewContainer.querySelectorAll('.file-preview-item');
  previewItems.forEach(item => {
    const fileNameEl = item.querySelector('.file-name');
    if (fileNameEl && fileNameEl.textContent === fileName) {
      item.remove();
    }
  });
  
  // Container verstecken wenn keine Dateien mehr da sind
  if (this.selectedFiles.length === 0) {
    this.filePreviewContainer.style.display = 'none';
  }
}

/**
 * Dateien analysieren.
 */
async analyzeFiles() {
  if (this.selectedFiles.length === 0) {
    this.showError('No files selected for analysis');
    return;
  }
  
  try {
    // Dateien für Upload vorbereiten
    const fileData = await this.prepareFilesForUpload();
    
    // Nachricht mit Dateien senden
    const message = `Please analyze the uploaded files and provide insights about their content, structure, and any important information.`;
    
    // Temporär die normale sendMessage verwenden, aber mit Files
    await this.sendMessageWithFiles(message, fileData);
    
  } catch (error) {
    console.error('Error analyzing files:', error);
    this.showError('Error analyzing files: ' + error.message);
  }
}

/**
 * Dateien für Upload vorbereiten.
 */
async prepareFilesForUpload() {
  const filePromises = this.selectedFiles.map(file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result.split(',')[1] // Base64 ohne "data:..." Teil
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  });
  
  return Promise.all(filePromises);
}

/**
 * Nachricht mit Dateien senden.
 */
async sendMessageWithFiles(message, fileData) {
  this.isProcessing = true;
  this.userInput.placeholder = 'Analyzing files...';
  this.sendBtn.disabled = true;
  
  // Benutzer-Nachricht anzeigen
  this.addMessageToUI('user', message);
  this.showTypingIndicator();
  
  try {
    const selectedModel = this.modelSelect.value || 'llama2';
    const systemPromptText = this.systemPrompt.value;
    const temperature = parseFloat(this.temperatureSlider.value);
    const enableTts = this.enableTts.checked;
    const voice = this.voiceSelect.value || 'de-DE-KatjaNeural';
    const rate = this.rateSlider.value;
    const pitch = this.pitchSlider.value;
    const contextLength = parseInt(this.contextLengthSlider.value);
    
    // Chat-Kontext abrufen
    const context = this.chatManager.getChatContext(contextLength);
    
    // Backend-Anfrage mit Dateien
    const response = await this.chatManager.sendMessage({
      model: selectedModel,
      message,
      system_prompt: systemPromptText,
      temperature,
      enable_tts: enableTts,
      voice,
      rate,
      pitch,
      context,
      files: fileData // ⭐ Dateien hinzufügen
    });
   
   
    // Audio abspielen, wenn TTS aktiviert ist
    if (enableTts && response.audio_file) {
      this.ttsController.playAudio(response.audio_file);
    }
    
  } catch (error) {
    console.error('Error sending message with files:', error);
    this.showError('Error analyzing files: ' + error.message);
  } finally {
    this.isProcessing = false;
    this.userInput.placeholder = 'Write a message...';
    this.sendBtn.disabled = false;
    
    // Dateien nach dem Senden löschen
    this.hideTypingIndicator();
	this.clearFiles();
  }
}

/**
 * Alle Dateien löschen.
 */
clearFiles() {
  this.selectedFiles = [];
  this.filePreviewContainer.innerHTML = '';
  this.filePreviewContainer.style.display = 'none';
}
/**
 * ⭐ TYPING INDICATOR METHODEN
 */

/**
 * Typing Indicator anzeigen.
 */
showTypingIndicator() {
  // Remove existing typing indicator
  this.hideTypingIndicator();
  
  const typingEl = document.createElement('div');
  typingEl.classList.add('message', 'assistant-message', 'typing-indicator-message');
  typingEl.id = 'typing-indicator';
  
  // Avatar für Typing Indicator
  const avatarEl = document.createElement('div');
  avatarEl.classList.add('typing-indicator-avatar');
  
  if (this.aiAvatar) {
    // AI Avatar mit Bild
    const imgEl = document.createElement('img');
    imgEl.src = this.aiAvatar;
    imgEl.alt = 'AI Avatar';
    avatarEl.appendChild(imgEl);
  } else {
    // Fallback Text-Avatar
    avatarEl.textContent = 'AI';
  }
  
  // Typing Content
  const contentEl = document.createElement('div');
  contentEl.classList.add('typing-indicator');
  contentEl.innerHTML = `
    <div class="typing-indicator-content">
      <p class="typing-text">is typing...</p>
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
  
  typingEl.appendChild(avatarEl);
  typingEl.appendChild(contentEl);
  
  this.messageContainer.appendChild(typingEl);
  
  // Zum Ende scrollen
  this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
}

/**
 * Typing Indicator entfernen.
 */
hideTypingIndicator() {
  const existingIndicator = document.getElementById('typing-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }
}

/**
 * ⭐ REASONING MESSAGE METHODEN
 */

/**
 * Reasoning-Nachricht zur UI hinzufügen.
 */
addReasoningMessageToUI(answer, reasoning) {
  const messageEl = document.createElement('div');
  messageEl.classList.add('message', 'assistant-message');
  
  // Avatar
  const avatarEl = document.createElement('div');
  avatarEl.classList.add('message-avatar');
  
  if (this.aiAvatar) {
    const imgEl = document.createElement('img');
    imgEl.src = this.aiAvatar;
    imgEl.alt = 'AI Avatar';
    avatarEl.appendChild(imgEl);
  } else {
    avatarEl.textContent = 'AI';
  }
  
  messageEl.appendChild(avatarEl);
  
  // Message Content
  const contentEl = document.createElement('div');
  contentEl.classList.add('message-content');
  
  // Reasoning Container (aufklappbar)
  if (reasoning) {
    const reasoningContainer = document.createElement('div');
    reasoningContainer.className = 'reasoning-container';
    reasoningContainer.innerHTML = `
      <div class="reasoning-header" onclick="this.parentElement.querySelector('.reasoning-content').classList.toggle('expanded'); this.querySelector('.reasoning-toggle').classList.toggle('expanded');">
        <div class="reasoning-title">
          <span class="reasoning-icon">🧠</span>
          <span>Reasoning Process</span>
          <span class="reasoning-badge">Click to expand</span>
        </div>
        <span class="reasoning-toggle">▼</span>
      </div>
      <div class="reasoning-content">${this.escapeHtml(reasoning)}</div>
    `;
    contentEl.appendChild(reasoningContainer);
  }
  
  // Final Answer
  const answerDiv = document.createElement('div');
  const formattedAnswer = this.formatMessage(answer);
  answerDiv.innerHTML = formattedAnswer;
  contentEl.appendChild(answerDiv);
  
  messageEl.appendChild(contentEl);
  this.messageContainer.appendChild(messageEl);
  
  // Zum Ende scrollen
  this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
  
  // Chat-Verlauf speichern (nur die Final Answer)
  this.chatManager.addMessageToHistory('assistant', answer);
}

}
