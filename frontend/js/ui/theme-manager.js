/**
 * Theme-Manager für die Ollama Chat-Anwendung.
 * Verwaltet das Erscheinungsbild (hell/dunkel).
 */

class ThemeManager {
  constructor() {
    this.darkModeToggle = document.getElementById('dark-mode');
  }
  
  /**
   * Theme-Präferenz aus dem lokalen Speicher laden.
   */
  loadThemePreference() {
    const darkMode = localStorage.getItem('ollama_ui_dark_mode') !== 'false'; // Standard: true
    
    if (this.darkModeToggle) {
      this.darkModeToggle.checked = darkMode;
    }
    
    this.applyTheme(darkMode);
  }
  
  /**
   * Zwischen hellem und dunklem Theme wechseln.
   */
  toggleTheme() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    this.applyTheme(!isDarkMode);
    
    if (this.darkModeToggle) {
      this.darkModeToggle.checked = !isDarkMode;
    }
    
    localStorage.setItem('ollama_ui_dark_mode', !isDarkMode);
  }
  
  /**
   * Das angegebene Theme anwenden.
   * 
   * @param {boolean} darkMode - Ob das dunkle Theme angewendet werden soll
   */
  applyTheme(darkMode) {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
  }
}
