/**
 * UI Controller for the Ollama Chat Application.
 * Manages user interface and interactions.
 */

class UIController {
  constructor({ api, themeManager, chatManager, memoryManager, ttsController }) {
    // Services
    this.api = api;
    this.themeManager = themeManager;
    this.chatManager = chatManager;
    this.memoryManager = memoryManager;
    this.ttsController = ttsController;
    
    // DOM Elements
    this.messageContainer = document.getElementById('message-container');
    this.userInput = document.getElementById('user-input');
    this.sendBtn = document.getElementById('send-btn');
    this.micBtn = document.getElementById('mic-btn');
    
    // Image Upload Elements
    this.imageUploadBtn = document.getElementById('image-upload-btn');
    this.imageUpload = document.getElementById('image-upload');
    this.imagePreviewContainer = document.getElementById('image-preview-container');
    
    // File Upload Elements
    this.fileUploadBtn = document.getElementById('file-upload-btn');
    this.fileUpload = document.getElementById('file-upload');
    this.filePreviewContainer = document.getElementById('file-preview-container');

    // Avatar Elements
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
    this.selectedImages = [];
    this.selectedFiles = [];

    // Avatar Data
    this.userAvatar = null;
    this.aiAvatar = null;
    
    // Setup Event Listeners
    this.setupEventListeners();
    
    // Load Saved Settings
    this.loadSettings();
  }
  
  /**
   * Setup event listeners for UI elements.
   */
  setupEventListeners() {
    // Send Message
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // Speech Recognition
    this.micBtn.addEventListener('click', () => this.toggleSpeechRecognition());
    
    // Image Upload
    this.imageUploadBtn.addEventListener('click', () => this.imageUpload.click());
    this.imageUpload.addEventListener('change', (e) => this.handleImageSelection(e.target.files));
    
    // File Upload
    this.fileUploadBtn.addEventListener('click', () => this.fileUpload.click());
    this.fileUpload.addEventListener('change', (e) => this.handleFileSelection(e.target.files));

    // Drag & Drop
    this.userInput.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.userInput.addEventListener('drop', (e) => this.handleDrop(e));
    
    // Avatar Events
    this.userAvatarBtn.addEventListener('click', () => this.userAvatarUpload.click());
    this.userAvatarUpload.addEventListener('change', (e) => this.handleAvatarUpload(e, 'user'));
    this.userAvatarReset.addEventListener('click', () => this.resetAvatar('user'));
    
    this.aiAvatarBtn.addEventListener('click', () => this.aiAvatarUpload.click());
    this.aiAvatarUpload.addEventListener('change', (e) => this.handleAvatarUpload(e, 'ai'));
    this.aiAvatarReset.addEventListener('click', () => this.resetAvatar('ai'));
    
    // Settings Updates
    this.modelSelect.addEventListener('change', () => this.saveSettings());
    this.voiceSelect.addEventListener('change', () => this.saveSettings());
    this.speechLanguageSelect.addEventListener('change', () => this.saveSettings());
    this.systemPrompt.addEventListener('change', () => this.saveSettings());
    
    // Sliders
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
    
    // Checkboxes
    this.enableTts.addEventListener('change', () => this.saveSettings());
    this.darkModeToggle.addEventListener('change', () => {
      this.themeManager.toggleTheme();
      this.saveSettings();
    });
    
    // Actions
    this.clearChatBtn.addEventListener('click', () => this.clearChat());
    this.toggleSidebarBtn.addEventListener('click', () => this.toggleSidebar());
    
    // Auto-Resize Textarea
    this.userInput.addEventListener('input', () => {
      this.autoResizeTextarea();
      
      // Memory Command Live Detection
      const message = this.userInput.value.trim();
      if (message.length > 5) {
        this.showMemoryHint(message);
      }
    });
  }
  
  /**
   * Initialize and render UI.
   */
  renderUI() {
    // Load chat history
    this.chatManager.loadChatHistory().forEach(message => {
      this.addMessageToUI(message.role, message.content);
    });
    
    // Restore sidebar state
    const isSidebarHidden = localStorage.getItem('ollama_ui_sidebar_hidden') === 'true';
    if (isSidebarHidden) {
      document.querySelector('.app-container').classList.add('sidebar-hidden');
    }
  }
  
  /**
   * Load saved settings.
   */
  loadSettings() {
    // Dark Mode
    const darkMode = localStorage.getItem('ollama_ui_dark_mode') !== 'false';
    this.darkModeToggle.checked = darkMode;
    
    // TTS Enabled
    const ttsEnabled = localStorage.getItem('ollama_ui_tts_enabled') !== 'false';
    this.enableTts.checked = ttsEnabled;
    
    // Speech Language
    const speechLanguage = localStorage.getItem('ollama_ui_speech_language') || 'de-DE';
    if (this.speechLanguageSelect) {
        this.speechLanguageSelect.value = speechLanguage;
    }
    
    // Load Avatars
    this.loadAvatars();
    
    // Temperature
    const temperature = localStorage.getItem('ollama_ui_temperature') || '0.7';
    this.temperatureSlider.value = temperature;
    this.temperatureValue.textContent = temperature;
    
    // TTS Rate
    const rate = localStorage.getItem('ollama_ui_tts_rate') || '1.0';
    this.rateSlider.value = rate;
    this.rateValue.textContent = rate;
    
    // TTS Pitch
    const pitch = localStorage.getItem('ollama_ui_tts_pitch') || '1.0';
    this.pitchSlider.value = pitch;
    this.pitchValue.textContent = pitch;
    
    // System Prompt
    const systemPrompt = localStorage.getItem('ollama_ui_system_prompt') || 'You are a helpful assistant.';
    this.systemPrompt.value = systemPrompt;
    
    // Context Length
    const contextLength = localStorage.getItem('ollama_ui_context_length') || '10';
    this.contextLengthSlider.value = contextLength;
    this.contextLengthValue.textContent = contextLength;
  }
  
  /**
   * Save settings to local storage.
   */
  saveSettings() {
    localStorage.setItem('ollama_ui_dark_mode', this.darkModeToggle.checked);
    
    if (this.modelSelect.value) {
      localStorage.setItem('ollama_ui_model', this.modelSelect.value);
    }
    
    if (this.userAvatar) {
        localStorage.setItem('ollama_ui_user_avatar', this.userAvatar);
    }
    if (this.aiAvatar) {
        localStorage.setItem('ollama_ui_ai_avatar', this.aiAvatar);
    }
    
    if (this.voiceSelect.value) {
      localStorage.setItem('ollama_ui_voice', this.voiceSelect.value);
    }
    
    if (this.speechLanguageSelect && this.speechLanguageSelect.value) {
        localStorage.setItem('ollama_ui_speech_language', this.speechLanguageSelect.value);
    }
    
    localStorage.setItem('ollama_ui_tts_enabled', this.enableTts.checked);
    localStorage.setItem('ollama_ui_temperature', this.temperatureSlider.value);
    localStorage.setItem('ollama_ui_tts_rate', this.rateSlider.value);
    localStorage.setItem('ollama_ui_tts_pitch', this.pitchSlider.value);
    localStorage.setItem('ollama_ui_system_prompt', this.systemPrompt.value);
    localStorage.setItem('ollama_ui_context_length', this.contextLengthSlider.value);
  }
  
  /**
   * Send message.
   */
  async sendMessage(customMessage = null) {
    let message = customMessage || this.userInput.value.trim();
    
    if ((!message && this.selectedImages.length === 0 && this.selectedFiles.length === 0) || this.isProcessing) {
      return;
    }
    
    // Memory Command Detection
    const isMemoryCmd = this.api.isMemoryCommand(message);
    
    // Reset input
    this.userInput.value = '';
    this.autoResizeTextarea();
    this.isProcessing = true;
    
    // Show user message (with images if any)
    // Note: Files are handled separately in message construction but not shown as inline images
    this.addMessageToUI('user', message, this.selectedImages);
    this.showTypingIndicator();
    
    // Set placeholder
    if (isMemoryCmd) {
      this.userInput.placeholder = 'Processing memory...';
    } else if (this.selectedFiles.length > 0) {
      this.userInput.placeholder = 'Analyzing files...';
    } else {
      this.userInput.placeholder = 'Waiting for response...';
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
      
      // Get Chat Context
      const context = this.chatManager.getChatContext(contextLength);
      
      // Prepare Images and Files
      const imageData = await this.prepareImagesForUpload();
      const fileData = await this.prepareFilesForUpload();
      
      // Construct parameters
      const params = {
        model: selectedModel,
        message,
        system_prompt: systemPromptText,
        temperature,
        enable_tts: enableTts,
        voice,
        rate,
        pitch,
        context,
        images: imageData,
        files: fileData // Unified handling
      };

      // Send Request
      const response = await this.chatManager.sendMessage(params);
      
      // Handle Memory Actions
      if (response.memory_action === 'save') {
        this.showNotification('💾 Memory saved!', 'success');
      } else if (response.memory_action === 'recall') {
        this.showNotification('🧠 Memories recalled!', 'info');
      }
      
      // Show Response
      if (response.has_reasoning) {
        this.addReasoningMessageToUI(response.response, response.reasoning);
      } else {
        this.addMessageToUI('assistant', response.response);
      }
      
      // Play Audio
      if (enableTts && response.audio_file) {
        this.ttsController.playAudio(response.audio_file);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      this.showError('Error sending message. Please try again.');
    } finally {
      this.isProcessing = false;
      this.userInput.placeholder = 'Write a message...';
      this.sendBtn.disabled = false;
      this.userInput.focus();
      this.hideTypingIndicator();
      
      // Clear attachments
      this.clearImages();
      this.clearFiles();
    }
  }
  
  /**
   * Add message to UI.
   */
  addMessageToUI(role, content, images = []) {
    const messageEl = document.createElement('div');
    messageEl.classList.add('message', `${role}-message`);
    
    // Avatar
    const avatarEl = document.createElement('div');
    avatarEl.classList.add('message-avatar');
    
    if (role === 'user' && this.userAvatar) {
      const imgEl = document.createElement('img');
      imgEl.src = this.userAvatar;
      imgEl.alt = 'User Avatar';
      avatarEl.appendChild(imgEl);
    } else if (role === 'assistant' && this.aiAvatar) {
      const imgEl = document.createElement('img');
      imgEl.src = this.aiAvatar;
      imgEl.alt = 'AI Avatar';
      avatarEl.appendChild(imgEl);
    } else {
      avatarEl.textContent = role === 'user' ? 'U' : 'AI';
    }
    
    messageEl.appendChild(avatarEl);
    
    // Content
    const contentEl = document.createElement('div');
    contentEl.classList.add('message-content');
    
    // Images
    if (images && images.length > 0) {
      const imagesContainer = document.createElement('div');
      imagesContainer.classList.add('message-images');
      
      if (typeof images[0] === 'object' && images[0].data) {
        // New image objects (with base64 data)
        images.forEach(image => {
          const imgEl = document.createElement('img');
          imgEl.src = `data:${image.type};base64,${image.data}`;
          imgEl.alt = image.name;
          imgEl.classList.add('message-image');
          imagesContainer.appendChild(imgEl);
        });
      } else {
        // Legacy/Direct file objects
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
    
    // Text
    if (content) {
      const textContainer = document.createElement('div');
      const formattedContent = this.formatMessage(content);
      textContainer.innerHTML = formattedContent;
      contentEl.appendChild(textContainer);
    }
    
    messageEl.appendChild(contentEl);
    this.messageContainer.appendChild(messageEl);
    
    // Scroll to bottom
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    
    // Save to history
    if (role === 'user' || role === 'assistant') {
      this.chatManager.addMessageToHistory(role, content);
    }
  }
  
  /**
   * Format message text.
   */
  formatMessage(text) {
    // Code blocks
    let formatted = text.replace(/```([\s\S]*?)```/g, (match, code) => {
      return `<pre><code>${this.escapeHtml(code)}</code></pre>`;
    });
    
    // Inline code
    formatted = formatted.replace(/`([^`]+)`/g, (match, code) => {
      return `<code class="inline-code">${this.escapeHtml(code)}</code>`;
    });
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  }
  
  /**
   * Escape HTML characters.
   */
  escapeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }
  
  /**
   * Show error notification.
   */
  showError(message) {
    this.showNotification(message, 'error');
  }
  
  /**
   * Show notification with type.
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.classList.add('notification');
    
    if (type === 'error') {
      notification.classList.add('error');
    } else if (type === 'success') {
      notification.classList.add('success');
    } else if (type === 'warning') {
      notification.classList.add('warning');
    }
    
    notification.textContent = message;
    
    this.notificationContainer.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        if (notification.parentNode) {
          this.notificationContainer.removeChild(notification);
        }
      }, 300);
    }, 3000 + (type === 'error' ? 2000 : 0));
  }
  
  /**
   * Clear chat history.
   */
  clearChat() {
    if (confirm('Do you really want to delete the entire chat history?')) {
      this.messageContainer.innerHTML = `
        <div class="welcome-message">
          <h2>Welcome to Astroburner's Magic Tool!</h2>
          <p>🤖 Select a model in the settings.</p>
          <p>🗣️ Select a language in the settings.</p>
          <p>🔊 Select a TTS in the settings and start the conversation.</p>
        </div>
      `;
      
      this.chatManager.clearChatHistory();
      this.showNotification('Chat history has been deleted.');
    }
  }
  
  /**
   * Toggle sidebar visibility.
   */
  toggleSidebar() {
    const appContainer = document.querySelector('.app-container');
    appContainer.classList.toggle('sidebar-hidden');
    localStorage.setItem('ollama_ui_sidebar_hidden', appContainer.classList.contains('sidebar-hidden'));
  }
  
  /**
   * Auto-resize textarea.
   */
  autoResizeTextarea() {
    this.userInput.style.height = 'auto';
    this.userInput.style.height = `${Math.min(this.userInput.scrollHeight, 200)}px`;
  }
  
  /**
   * Populate model select.
   */
  populateModelSelect(models) {
    if (!models || models.length === 0) {
      this.modelSelect.innerHTML = '<option value="">No models available</option>';
      return;
    }
    
    this.modelSelect.innerHTML = '';
    
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      this.modelSelect.appendChild(option);
    });
    
    const savedModel = localStorage.getItem('ollama_ui_model');
    if (savedModel && models.includes(savedModel)) {
      this.modelSelect.value = savedModel;
    } else if (models.length > 0) {
      this.modelSelect.value = models[0];
    }
  }
  
  /**
   * Populate voice select.
   */
  populateVoiceSelect(voices) {
    if (!voices || voices.length === 0) {
      this.voiceSelect.innerHTML = '<option value="">No voices available</option>';
      return;
    }
    
    this.voiceSelect.innerHTML = '';
    
    const voicesByLocale = voices.reduce((acc, voice) => {
      const locale = voice.locale;
      if (!acc[locale]) {
        acc[locale] = [];
      }
      acc[locale].push(voice);
      return acc;
    }, {});
    
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
    
    const savedVoice = localStorage.getItem('ollama_ui_voice');
    if (savedVoice) {
      this.voiceSelect.value = savedVoice;
    } else {
      const germanVoices = voices.filter(voice => voice.locale.startsWith('de-'));
      if (germanVoices.length > 0) {
        this.voiceSelect.value = germanVoices[0].name;
      } else {
        this.voiceSelect.value = voices[0].name;
      }
    }
  }
  
  /**
   * Toggle speech recognition.
   */
  toggleSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      this.showError('Speech recognition is not supported in this browser.');
      return;
    }
    
    if (this.isSpeechRecognitionActive) {
      this.stopSpeechRecognition();
    } else {
      this.startSpeechRecognition();
    }
  }
  
  /**
   * Start speech recognition.
   */
  startSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    const selectedLang = this.speechLanguageSelect?.value || 'de-DE';
    this.recognition.lang = selectedLang;
    
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    
    this.recognition.onstart = () => {
      this.isSpeechRecognitionActive = true;
      this.micBtn.classList.add('active');
      this.speechStatus.classList.add('active');
      this.userInput.placeholder = 'Speak now...';
    };
    
    this.recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      
      this.userInput.value = transcript;
      this.autoResizeTextarea();
    };
    
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.showError(`Speech error: ${event.error}`);
      this.stopSpeechRecognition();
    };
    
    this.recognition.onend = () => {
      this.stopSpeechRecognition();
      
      if (this.userInput.value.trim() !== '') {
        setTimeout(() => this.sendMessage(), 500);
      }
    };
    
    this.recognition.start();
  }
  
  /**
   * Stop speech recognition.
   */
  stopSpeechRecognition() {
    if (this.recognition) {
      this.recognition.stop();
    }
    
    this.isSpeechRecognitionActive = false;
    this.micBtn.classList.remove('active');
    this.speechStatus.classList.remove('active');
    this.userInput.placeholder = 'Write a message...';
  }
  
  /**
   * Handle image selection.
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
   * Create image preview.
   */
  createImagePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewDiv = document.createElement('div');
      previewDiv.className = 'image-preview-item';

      const img = document.createElement('img');
      img.src = e.target.result;
      img.alt = 'Preview';

      const btn = document.createElement('button');
      btn.className = 'remove-image-btn';
      btn.title = 'Remove image';
      btn.textContent = '×';
      btn.addEventListener('click', () => this.removeImage(file.name));

      const span = document.createElement('span');
      span.className = 'image-name';
      span.textContent = file.name;

      previewDiv.appendChild(img);
      previewDiv.appendChild(btn);
      previewDiv.appendChild(span);

      this.imagePreviewContainer.appendChild(previewDiv);
    };
    reader.readAsDataURL(file);
  }
  
  /**
   * Remove image.
   */
  removeImage(fileName) {
    this.selectedImages = this.selectedImages.filter(file => file.name !== fileName);
    
    const previewItems = this.imagePreviewContainer.querySelectorAll('.image-preview-item');
    previewItems.forEach(item => {
      const imageName = item.querySelector('.image-name').textContent;
      if (imageName === fileName) {
        item.remove();
      }
    });
    
    if (this.selectedImages.length === 0) {
      this.imagePreviewContainer.style.display = 'none';
    }
  }
  
  /**
   * Handle drag over.
   */
  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    this.userInput.classList.add('drag-over');
  }
  
  /**
   * Handle drop.
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
   * Prepare images for upload.
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
            data: e.target.result.split(',')[1] // Base64
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
    
    return Promise.all(imagePromises);
  }
  
  /**
   * Clear all images.
   */
  clearImages() {
    this.selectedImages = [];
    this.imagePreviewContainer.innerHTML = '';
    this.imagePreviewContainer.style.display = 'none';
  }
  
  /**
   * Handle avatar upload.
   */
  handleAvatarUpload(event, type) {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
        this.showError('Please select a valid image file.');
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
        this.showNotification(`${type === 'user' ? 'Your' : 'AI'} avatar updated!`, 'success');
    };
    
    reader.readAsDataURL(file);
  }

  /**
   * Reset avatar.
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
    
    this.showNotification(`${type === 'user' ? 'Your' : 'AI'} avatar reset!`, 'info');
  }

  /**
   * Load stored avatars.
   */
  loadAvatars() {
    const savedUserAvatar = localStorage.getItem('ollama_ui_user_avatar');
    if (savedUserAvatar) {
        this.userAvatar = savedUserAvatar;
        this.userAvatarPreview.src = savedUserAvatar;
        this.userAvatarPreview.classList.add('loaded');
    }
    
    const savedAiAvatar = localStorage.getItem('ollama_ui_ai_avatar');
    if (savedAiAvatar) {
        this.aiAvatar = savedAiAvatar;
        this.aiAvatarPreview.src = savedAiAvatar;
        this.aiAvatarPreview.classList.add('loaded');
    }
  }
  
  /**
   * Show memory hint.
   */
  showMemoryHint(message) {
    const isMemoryCmd = this.api.isMemoryCommand(message);
    
    if (isMemoryCmd) {
      this.userInput.style.borderColor = '#4CAF50';
      this.userInput.style.boxShadow = '0 0 5px rgba(76, 175, 80, 0.3)';
      
      setTimeout(() => {
        this.userInput.style.borderColor = '';
        this.userInput.style.boxShadow = '';
      }, 2000);
    }
  }

  /**
   * Show memory stats.
   */
  async showMemoryStats() {
    try {
      const memories = await this.memoryManager.getMemories();
      this.showNotification(`📚 ${memories.length} memories stored`, 'info');
    } catch (error) {
      console.error('Error retrieving memory stats:', error);
    }
  }

  /**
   * Check services availability.
   */
  checkServices() {
    const requiredServices = ['api', 'themeManager', 'chatManager', 'memoryManager', 'ttsController'];
    const missingServices = requiredServices.filter(service => !this[service]);
    
    if (missingServices.length > 0) {
      console.warn('Missing Services:', missingServices);
      this.showError(`Missing Services: ${missingServices.join(', ')}`);
      return false;
    }
    
    return true;
  }

  /**
   * Show debug info.
   */
  showDebugInfo() {
    const info = {
      selectedImages: this.selectedImages.length,
      selectedFiles: this.selectedFiles.length,
      userAvatar: !!this.userAvatar,
      aiAvatar: !!this.aiAvatar,
      speechLanguage: this.speechLanguageSelect?.value,
      model: this.modelSelect?.value,
      voice: this.voiceSelect?.value,
      isProcessing: this.isProcessing,
      isSpeechActive: this.isSpeechRecognitionActive
    };
    
    console.table(info);
    this.showNotification('Debug info logged to console', 'info');
  }

  /**
   * Handle keyboard shortcuts.
   */
  handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + Enter = Send
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.sendMessage();
    }
    
    // Ctrl/Cmd + M = Memory Stats
    if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
      event.preventDefault();
      this.showMemoryStats();
    }
    
    // Ctrl/Cmd + D = Debug Info
    if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
      event.preventDefault();
      this.showDebugInfo();
    }
    
    // ESC = Stop Speech
    if (event.key === 'Escape' && this.isSpeechRecognitionActive) {
      event.preventDefault();
      this.stopSpeechRecognition();
    }
  }

  /**
   * Initialize keyboard shortcuts.
   */
  initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
  }

  /**
   * Initialize Controller.
   */
  initialize() {
    if (!this.checkServices()) {
      return false;
    }
    
    this.initKeyboardShortcuts();
    this.renderUI();
    
    console.log('🚀 UIController initialized!');
    return true;
  }

  /**
   * File Selection Handler.
   */
  handleFileSelection(files) {
    Array.from(files).forEach(file => {
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
   * Create file preview.
   */
  createFilePreview(file) {
    const previewDiv = document.createElement('div');
    previewDiv.className = 'file-preview-item';

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    const getFileExtension = (filename) => {
      return filename.split('.').pop().toUpperCase();
    };
    
    // Build HTML structure programmatically to avoid inline handlers
    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-info';

    const fileNameDiv = document.createElement('div');
    fileNameDiv.className = 'file-name';
    fileNameDiv.textContent = file.name;

    const fileDetails = document.createElement('div');
    fileDetails.className = 'file-details';

    const fileTypeSpan = document.createElement('span');
    fileTypeSpan.className = 'file-type';
    fileTypeSpan.textContent = getFileExtension(file.name);

    const fileSizeSpan = document.createElement('span');
    fileSizeSpan.textContent = formatFileSize(file.size);
    
    fileDetails.appendChild(fileTypeSpan);
    fileDetails.appendChild(fileSizeSpan);

    fileInfo.appendChild(fileNameDiv);
    fileInfo.appendChild(fileDetails);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-file-btn';
    removeBtn.title = 'Remove file';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => this.removeFile(file.name));

    previewDiv.appendChild(fileInfo);
    previewDiv.appendChild(removeBtn);

    this.filePreviewContainer.appendChild(previewDiv);

    // Add Analyze Button if not exists
    if (!this.filePreviewContainer.querySelector('.analyze-files-btn')) {
      const analyzeBtn = document.createElement('button');
      analyzeBtn.className = 'analyze-files-btn';
      analyzeBtn.textContent = '🔍 Analyze Files';
      analyzeBtn.addEventListener('click', () => this.analyzeFiles());
      this.filePreviewContainer.appendChild(analyzeBtn);
    }
  }

  /**
   * Remove file.
   */
  removeFile(fileName) {
    this.selectedFiles = this.selectedFiles.filter(file => file.name !== fileName);
    
    const previewItems = this.filePreviewContainer.querySelectorAll('.file-preview-item');
    previewItems.forEach(item => {
      const fileNameEl = item.querySelector('.file-name');
      if (fileNameEl && fileNameEl.textContent === fileName) {
        item.remove();
      }
    });
    
    if (this.selectedFiles.length === 0) {
      this.filePreviewContainer.style.display = 'none';
    }
  }

  /**
   * Analyze files.
   */
  analyzeFiles() {
    if (this.selectedFiles.length === 0) {
      this.showError('No files selected for analysis');
      return;
    }
    
    const message = `Please analyze the uploaded files and provide insights about their content, structure, and any important information.`;
    this.sendMessage(message);
  }

  /**
   * Prepare files for upload.
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
            data: e.target.result.split(',')[1] // Base64
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    return Promise.all(filePromises);
  }

  /**
   * Clear all files.
   */
  clearFiles() {
    this.selectedFiles = [];
    this.filePreviewContainer.innerHTML = '';
    this.filePreviewContainer.style.display = 'none';
  }

  /**
   * Show Typing Indicator.
   */
  showTypingIndicator() {
    this.hideTypingIndicator();
    
    const typingEl = document.createElement('div');
    typingEl.classList.add('message', 'assistant-message', 'typing-indicator-message');
    typingEl.id = 'typing-indicator';
    
    const avatarEl = document.createElement('div');
    avatarEl.classList.add('typing-indicator-avatar');
    
    if (this.aiAvatar) {
      const imgEl = document.createElement('img');
      imgEl.src = this.aiAvatar;
      imgEl.alt = 'AI Avatar';
      avatarEl.appendChild(imgEl);
    } else {
      avatarEl.textContent = 'AI';
    }

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
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
  }

  /**
   * Hide Typing Indicator.
   */
  hideTypingIndicator() {
    const existingIndicator = document.getElementById('typing-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
  }

  /**
   * Add Reasoning Message.
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
    
    // Content
    const contentEl = document.createElement('div');
    contentEl.classList.add('message-content');

    // Reasoning Container
    if (reasoning) {
      const reasoningContainer = document.createElement('div');
      reasoningContainer.className = 'reasoning-container';

      const header = document.createElement('div');
      header.className = 'reasoning-header';
      header.innerHTML = `
        <div class="reasoning-title">
          <span class="reasoning-icon">🧠</span>
          <span>Reasoning Process</span>
          <span class="reasoning-badge">Click to expand</span>
        </div>
        <span class="reasoning-toggle">▼</span>
      `;

      const content = document.createElement('div');
      content.className = 'reasoning-content';
      content.innerHTML = this.escapeHtml(reasoning);

      header.addEventListener('click', () => {
        content.classList.toggle('expanded');
        header.querySelector('.reasoning-toggle').classList.toggle('expanded');
      });

      reasoningContainer.appendChild(header);
      reasoningContainer.appendChild(content);
      contentEl.appendChild(reasoningContainer);
    }

    // Final Answer
    const answerDiv = document.createElement('div');
    answerDiv.innerHTML = this.formatMessage(answer);
    contentEl.appendChild(answerDiv);

    messageEl.appendChild(contentEl);
    this.messageContainer.appendChild(messageEl);

    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;

    // Save to history
    this.chatManager.addMessageToHistory('assistant', answer);
  }
}
