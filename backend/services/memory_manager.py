# -*- coding: utf-8 -*-
"""
Intelligenter Memory-Manager für Chat-Erinnerungen.
"""
import re
from datetime import datetime
from services.memory_service import save_memory, get_memories

class MemoryManager:
    def __init__(self):
        # Erkennungsmuster für Memory-Befehle
        self.memory_patterns = [
            # Deutsch
            r'(?:merke?\s+dir|erinner[e]?\s+dich|behalte?|speicher[e]?)\s+(.+)',
            r'(?:vergiss\s+nicht|notier[e]?)\s+(.+)',
            r'(?:das\s+ist\s+wichtig|wichtig\s+zu\s+wissen)[:\s]*(.+)',
            
            # Englisch  
            r'(?:remember|recall|keep\s+in\s+mind|note\s+that|save\s+this)\s+(.+)',
            r'(?:don\'t\s+forget|make\s+sure\s+to\s+remember)\s+(.+)',
            r'(?:this\s+is\s+important|important\s+to\s+know)[:\s]*(.+)',
            
            # Slash-Befehle
            r'/remember\s+(.+)',
            r'/merken\s+(.+)',
            r'/save\s+(.+)'
        ]
        
        # Abruf-Muster
        self.recall_patterns = [
            # Deutsch
            r'(?:was\s+)?(?:weißt\s+du\s+noch|erinnerst\s+du\s+dich)\s*(?:an\s+)?(.+)?',
            r'(?:was\s+hast\s+du\s+dir\s+)?(?:gemerkt|gespeichert)\s*(?:über\s+)?(.+)?',
            
            # Englisch
            r'(?:what\s+do\s+you\s+)?(?:remember|recall)\s*(?:about\s+)?(.+)?',
            r'(?:what\s+did\s+you\s+)?(?:save|store|note)\s*(?:about\s+)?(.+)?',
            
            # Slash-Befehle
            r'/recall(?:\s+(.+))?',
            r'/memory(?:\s+(.+))?',
            r'/memories'
        ]

    def should_save_memory(self, message):
        """Prüft ob eine Nachricht als Erinnerung gespeichert werden soll."""
        message_lower = message.lower().strip()
        
        for pattern in self.memory_patterns:
            match = re.search(pattern, message_lower, re.IGNORECASE)
            if match:
                content = match.group(1).strip() if match.group(1) else message
                return True, content
        
        return False, None

    def should_recall_memory(self, message):
        """Prüft ob Erinnerungen abgerufen werden sollen."""
        message_lower = message.lower().strip()
        
        for pattern in self.recall_patterns:
            match = re.search(pattern, message_lower, re.IGNORECASE)
            if match:
                search_term = match.group(1).strip() if match.group(1) else None
                return True, search_term
        
        return False, None

    def save_context_memory(self, user_message, context=None):
        """Speichert eine Kontext-Erinnerung."""
        try:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
            memory_text = f"[{timestamp}] {user_message}"
            
            if context:
                memory_text += f" | Context: {context[:100]}"
            
            save_memory(memory_text)
            return True, "✅ Erinnerung wurde gespeichert!"
            
        except Exception as e:
            return False, f"❌ Fehler beim Speichern: {e}"

    def search_memories(self, search_term=None):
        """Durchsucht gespeicherte Erinnerungen."""
        try:
            memories = get_memories()
            
            if not search_term:
                recent_memories = memories[-5:] if len(memories) > 5 else memories
                return True, recent_memories
            
            matching_memories = []
            search_lower = search_term.lower()
            
            for memory in memories:
                if search_lower in memory.get('text', '').lower():
                    matching_memories.append(memory)
            
            return True, matching_memories
            
        except Exception as e:
            return False, f"❌ Fehler beim Suchen: {e}"

    def format_memories_response(self, memories):
        """Formatiert Erinnerungen für die Antwort."""
        if not memories:
            return "🤔 Ich habe keine passenden Erinnerungen gefunden."
        
        response = "📚 **Meine Erinnerungen:**\n\n"
        
        for i, memory in enumerate(memories[-10:], 1):
            timestamp = memory.get('timestamp', 'Unbekannt')
            text = memory.get('text', '')
            
            if len(text) > 150:
                text = text[:150] + "..."
            
            response += f"**{i}.** `{timestamp[:16]}` - {text}\n\n"
        
        return response
