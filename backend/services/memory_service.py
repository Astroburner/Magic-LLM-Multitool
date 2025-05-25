# -*- coding: utf-8 -*-
"""
Memory-Service für die Verwaltung des Langzeitgedächtnisses.
"""
import logging
import json
import os
from datetime import datetime
from pathlib import Path

# Sicherer Import
try:
    import config
    MEMORIES_DIR = config.MEMORIES_DIR
    print(f"✅ Config geladen, MEMORIES_DIR: {MEMORIES_DIR}")
except Exception as e:
    # Fallback wenn config nicht funktioniert
    MEMORIES_DIR = Path(__file__).parent.parent.parent / "data" / "memories"
    print(f"⚠️  Config-Fehler ({e}), verwende Fallback: {MEMORIES_DIR}")

logger = logging.getLogger(__name__)

# Pfad zur Erinnerungsdatei
MEMORIES_FILE = MEMORIES_DIR / "long_term_memories.json"

def _ensure_memories_file():
    """Stellt sicher, dass die Erinnerungsdatei existiert."""
    try:
        print(f"🔍 Prüfe Erinnerungsdatei: {MEMORIES_FILE}")
        
        if not MEMORIES_FILE.exists():
            print(f"📁 Erstelle Verzeichnis: {MEMORIES_FILE.parent}")
            MEMORIES_FILE.parent.mkdir(parents=True, exist_ok=True)
            
            print(f"📄 Erstelle Datei: {MEMORIES_FILE}")
            with open(MEMORIES_FILE, 'w', encoding='utf-8') as f:
                json.dump([], f, ensure_ascii=False, indent=2)
            
            print("✅ Erinnerungsdatei erfolgreich erstellt!")
        else:
            print("✅ Erinnerungsdatei existiert bereits!")
            
        return True
        
    except Exception as e:
        print(f"❌ Fehler beim Erstellen der Erinnerungsdatei: {e}")
        logger.error(f"Fehler bei _ensure_memories_file: {e}")
        return False

def save_memory(text):
    """Eine neue Erinnerung speichern."""
    try:
        print(f"💾 Speichere Erinnerung: {text[:50]}...")
        
        if not _ensure_memories_file():
            print("❌ Konnte Erinnerungsdatei nicht erstellen!")
            return False
        
        # Aktuelle Erinnerungen laden
        try:
            with open(MEMORIES_FILE, 'r', encoding='utf-8') as f:
                memories = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            print("⚠️  Erstelle neue Erinnerungsliste")
            memories = []
        
        # Neue Erinnerung hinzufügen
        new_memory = {
            "id": len(memories) + 1,
            "timestamp": datetime.now().isoformat(),
            "text": text
        }
        memories.append(new_memory)
        
        # Speichern mit Backup
        backup_file = MEMORIES_FILE.with_suffix('.json.backup')
        
        # Backup erstellen
        if MEMORIES_FILE.exists():
            import shutil
            shutil.copy2(MEMORIES_FILE, backup_file)
        
        # Neue Datei schreiben
        with open(MEMORIES_FILE, 'w', encoding='utf-8') as f:
            json.dump(memories, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Erinnerung #{new_memory['id']} erfolgreich gespeichert!")
        logger.info(f"Erinnerung gespeichert: {text[:100]}")
        return True
        
    except Exception as e:
        print(f"❌ Fehler beim Speichern: {e}")
        logger.error(f"Fehler bei save_memory: {e}")
        return False

def get_memories():
    """Alle Erinnerungen abrufen."""
    try:
        if not _ensure_memories_file():
            return []
        
        with open(MEMORIES_FILE, 'r', encoding='utf-8') as f:
            memories = json.load(f)
        
        print(f"📚 {len(memories)} Erinnerungen geladen")
        return memories
        
    except Exception as e:
        print(f"❌ Fehler beim Laden: {e}")
        logger.error(f"Fehler bei get_memories: {e}")
        return []

def clear_memories():
    """Alle Erinnerungen löschen."""
    try:
        with open(MEMORIES_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f, ensure_ascii=False, indent=2)
        
        print("🗑️  Alle Erinnerungen gelöscht!")
        return True
        
    except Exception as e:
        print(f"❌ Fehler beim Löschen: {e}")
        logger.error(f"Fehler bei clear_memories: {e}")
        return False

# Test-Funktion
def test_memory_service():
    """Teste den Memory Service"""
    print("\n🧪 === Memory Service Test ===")
    
    # Test 1: Verzeichnis und Datei prüfen
    print("\n1. Teste Datei-Erstellung...")
    success = _ensure_memories_file()
    
    if not success:
        print("❌ Test fehlgeschlagen - kann Datei nicht erstellen!")
        return
    
    # Test 2: Erinnerung speichern
    print("\n2. Teste Erinnerungs-Speicherung...")
    test_text = f"Test-Erinnerung vom {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    save_memory(test_text)
    
    # Test 3: Erinnerungen laden
    print("\n3. Teste Erinnerungs-Laden...")
    memories = get_memories()
    print(f"Geladene Erinnerungen: {len(memories)}")
    
    for memory in memories[-3:]:  # Zeige letzte 3
        print(f"  - ID {memory.get('id', '?')}: {memory.get('text', '')[:50]}...")
    
    print("\n✅ Memory Service Test abgeschlossen!")

if __name__ == "__main__":
    test_memory_service()
