# 🚀 Ollama UI - Advanced Chat Interface

A modern, feature-rich web interface for Ollama with memory system, TTS, speech recognition, and multimodal support.

![Ollama UI Screenshot](https://via.placeholder.com/800x400?text=Ollama+UI+Screenshot)

## ✨ Features

### 🤖 **AI Chat**
- **Multiple LLM Models** - Support for all Ollama models
- **Real-time Chat** - Fast, responsive conversations  
- **Context Memory** - Maintains conversation history
- **Custom System Prompts** - Personalize AI behavior

### 🧠 **Long-term Memory System**
- **Smart Memory Commands** - `/remember`, `/memories`, natural language
- **Persistent Storage** - JSON-based memory with timestamps
- **Intelligent Integration** - AI naturally incorporates memories
- **Context-aware Responses** - Remembers important information across sessions

### 🔊 **Text-to-Speech (TTS)**
- **117+ Voices** - Microsoft Edge TTS integration
- **Multi-language Support** - German, English, French, Spanish, and more
- **Adjustable Speed & Pitch** - Customize voice output
- **Real-time Audio** - Instant speech synthesis

### 🎤 **Speech Recognition**
- **Voice Input** - Browser-based speech-to-text
- **Multi-language Recognition** - 8+ language support
- **Visual Feedback** - Live recording indicator

### 🖼️ **Multimodal Support**
- **Image Upload** - Drag & drop or click to upload
- **Vision Models** - Support for LLaVA and multimodal models
- **Image Preview** - See uploaded images before sending

### 🎨 **Modern UI/UX**
- **Dark/Light Mode** - Elegant theme switching
- **Responsive Design** - Works on desktop and mobile
- **Custom Avatars** - Personalize user and AI avatars
- **Collapsible Settings** - Clean, organized interface
- **Real-time Updates** - Live status indicators

## 🛠️ Installation

### Prerequisites
- **Python 3.8+**
- **Ollama** installed and running
- **Modern web browser**

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/ollama-ui.git
cd ollama-ui
```

### 2. Install Dependencies
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux  
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Start Ollama
```bash
ollama serve
ollama pull llama2  # or your preferred model
```

### 4. Start Backend
```bash
cd backend
python app.py
```

### 5. Open in Browser
Navigate to: `http://localhost:5000`

## 📁 Project Structure

```
ollama-ui/
├── backend/                 # Python Flask Backend
│   ├── app.py              # Main application
│   ├── config.py           # Configuration
│   ├── requirements.txt    # Dependencies
│   └── services/           # Backend services
│       ├── llm_service.py      # Ollama integration
│       ├── tts_service.py      # Text-to-Speech
│       ├── memory_service.py   # Memory management
│       └── memory_manager.py   # Memory logic
├── frontend/               # HTML/CSS/JavaScript
│   ├── index.html         # Main interface
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript modules
│   └── assets/            # Static files
└── data/                   # Data storage
    └── memories/              # Memory files
```

## 🚀 Usage

### Basic Chat
1. Select a model from the sidebar
2. Type your message and press Enter
3. Enjoy AI responses with optional TTS

### Memory Commands
```bash
# Save memories
/remember I love chocolate cake
Merke dir: Mein Geburtstag ist am 15. März
Remember: My favorite color is blue

# Recall memories  
/memories
Was weißt du noch?
What do you remember?
```

### Voice Features
- **Speech Input**: Click microphone button
- **TTS Output**: Enable in settings, choose voice
- **Multi-language**: Select recognition language

### Image Support
- **Upload**: Drag & drop or click camera icon
- **Preview**: See images before sending
- **Vision Models**: Use LLaVA or similar models

## ⚙️ Configuration

### Backend Settings (`backend/config.py`)
```python
OLLAMA_BASE_URL = "http://localhost:11434"  # Ollama server
HOST = "127.0.0.1"                          # Server host
PORT = 5000                                 # Server port
DEFAULT_MODEL = "llama2"                    # Default LLM
DEFAULT_TTS_VOICE = "de-DE-KatjaNeural"     # Default voice
```

### Frontend Settings
- Accessible via sidebar settings
- Persistent browser storage
- Real-time updates

## 🔧 Development

### Adding New Features
1. **Backend**: Add routes in `app.py`
2. **Frontend**: Extend services in `js/services/`
3. **UI**: Update components in `js/ui/`
4. **Styles**: Modify CSS in `css/`

### API Endpoints
- `GET /api/models` - Available models
- `GET /api/voices` - TTS voices  
- `POST /api/chat` - Send message
- `POST /api/memory` - Save memory
- `GET /api/memories` - Get memories

## 🐛 Troubleshooting

### Common Issues

**Models not loading**
- Ensure Ollama is running: `ollama serve`
- Check Ollama URL in config: `http://localhost:11434`

**TTS not working**
- Check internet connection (Edge TTS requires online access)
- Try different voice in settings

**Memory errors**
- Check file permissions in `data/memories/` folder
- Verify JSON syntax in memory files

**CORS errors**
- Restart backend server
- Check if Flask-CORS is installed

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ollama** - Local LLM runtime
- **Microsoft Edge TTS** - Text-to-Speech service
- **Flask** - Web framework
- **Inter Font** - Typography
- **JetBrains Mono** - Code font

## 🔮 Roadmap

- [ ] **Multi-user Support** - User sessions
- [ ] **Plugin System** - Extensible architecture  
- [ ] **RAG Integration** - Document chat
- [ ] **Voice Cloning** - Custom TTS voices
- [ ] **Mobile App** - React Native/Flutter
- [ ] **Docker Support** - Easy deployment
- [ ] **Cloud Integration** - Backup & sync

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/ollama-ui/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ollama-ui/discussions)
- **Email**: your.email@example.com

---

**⭐ Star this repo if you find it useful!**