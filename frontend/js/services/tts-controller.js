/**
 * TTS-Controller für die Ollama Chat-Anwendung.
 * Verwaltet die Text-to-Speech-Funktionalität.
 */

class TTSController {
  constructor() {
    this.audioElement = null;
    this.isPlaying = false;
    this.stopButton = document.getElementById('stop-tts-btn');
    
    // Event-Listener für den Stopp-Button
    if (this.stopButton) {
      this.stopButton.addEventListener('click', () => this.stopAudio());
    }
  }
  
  /**
   * Eine Audiodatei abspielen.
   * 
   * @param {string} filename - Der Dateiname der abzuspielenden Audiodatei
   */
  playAudio(filename) {
    // Aktuelle Audiowiedergabe stoppen, falls vorhanden
    this.stopAudio();
    
    // Neue Audiodatei erstellen und abspielen
    this.audioElement = new Audio(`/assets/audio/${filename}`);
    
    this.audioElement.onplay = () => {
      this.isPlaying = true;
      // Stopp-Button anzeigen
      if (this.stopButton) {
        this.stopButton.style.display = 'block';
      }
    };
    
    this.audioElement.onended = () => {
      this.isPlaying = false;
      this.audioElement = null;
      // Stopp-Button ausblenden
      if (this.stopButton) {
        this.stopButton.style.display = 'none';
      }
    };
    
    this.audioElement.onerror = (error) => {
      console.error('Fehler bei der Audiowiedergabe:', error);
      this.isPlaying = false;
      this.audioElement = null;
      // Stopp-Button ausblenden
      if (this.stopButton) {
        this.stopButton.style.display = 'none';
      }
    };
    
    this.audioElement.play().catch(error => {
      console.error('Fehler beim Starten der Audiowiedergabe:', error);
    });
  }
  
  /**
   * Die aktuelle Audiowiedergabe stoppen.
   */
  stopAudio() {
    if (this.audioElement && this.isPlaying) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.isPlaying = false;
      // Stopp-Button ausblenden
      if (this.stopButton) {
        this.stopButton.style.display = 'none';
      }
    }
  }
}
