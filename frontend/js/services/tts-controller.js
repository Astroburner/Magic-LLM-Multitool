/**
 * TTS Controller for the Ollama Chat Application.
 * Manages Text-to-Speech functionality.
 */

class TTSController {
  constructor() {
    this.audioElement = null;
    this.isPlaying = false;
    this.stopButton = document.getElementById('stop-tts-btn');
    
    // Event Listeners for Stop Button
    if (this.stopButton) {
      this.stopButton.addEventListener('click', () => this.stopAudio());
    }
  }
  
  /**
   * Play an audio file.
   * 
   * @param {string} filename - The filename of the audio file to play
   */
  playAudio(filename) {
    // Stop current audio playback if any
    this.stopAudio();
    
    // Create new audio element
    this.audioElement = new Audio(`/assets/audio/${filename}`);
    
    this.audioElement.onplay = () => {
      this.isPlaying = true;
      // Show Stop Button
      if (this.stopButton) {
        this.stopButton.style.display = 'flex'; // Changed to flex for better alignment
      }
    };
    
    this.audioElement.onended = () => {
      this.isPlaying = false;
      this.audioElement = null;
      // Hide Stop Button
      if (this.stopButton) {
        this.stopButton.style.display = 'none';
      }
    };
    
    this.audioElement.onerror = (error) => {
      console.error('Error playing audio:', error);
      this.isPlaying = false;
      this.audioElement = null;
      // Hide Stop Button
      if (this.stopButton) {
        this.stopButton.style.display = 'none';
      }
    };
    
    this.audioElement.play().catch(error => {
      console.error('Error starting audio playback:', error);
    });
  }
  
  /**
   * Stop current audio playback.
   */
  stopAudio() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement = null; // Ensure element is cleared
      this.isPlaying = false;

      // Hide Stop Button
      if (this.stopButton) {
        this.stopButton.style.display = 'none';
      }
    }
  }
}
