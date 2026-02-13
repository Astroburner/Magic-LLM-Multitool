# -*- coding: utf-8 -*-
"""
Memory Service for long-term memory management.
"""
import logging
import json
import os
import shutil
import threading
from datetime import datetime
from pathlib import Path
import config

logger = logging.getLogger(__name__)

# Path to memory file
MEMORIES_FILE = config.MEMORIES_DIR / "long_term_memories.json"

# Lock for thread safety
file_lock = threading.Lock()

def _ensure_memories_file():
    """Ensures that the memory file exists."""
    try:
        if not MEMORIES_FILE.exists():
            if config.DEBUG:
                print(f"📁 Creating directory: {MEMORIES_FILE.parent}")
            MEMORIES_FILE.parent.mkdir(parents=True, exist_ok=True)
            
            if config.DEBUG:
                print(f"📄 Creating file: {MEMORIES_FILE}")
            
            with file_lock:
                with open(MEMORIES_FILE, 'w', encoding='utf-8') as f:
                    json.dump([], f, ensure_ascii=False, indent=2)

            if config.DEBUG:
                print("✅ Memory file created successfully!")
        else:
            if config.DEBUG:
                print("✅ Memory file already exists!")
            
        return True
        
    except Exception as e:
        logger.error(f"Error ensuring memory file: {e}")
        return False

def save_memory(text):
    """Save a new memory."""
    try:
        if config.DEBUG:
            print(f"💾 Saving memory: {text[:50]}...")
        
        if not _ensure_memories_file():
            logger.error("Could not create memory file!")
            return False
        
        with file_lock:
            # Load current memories
            try:
                with open(MEMORIES_FILE, 'r', encoding='utf-8') as f:
                    memories = json.load(f)
            except (FileNotFoundError, json.JSONDecodeError):
                logger.warning("Creating new memory list")
                memories = []

            # Add new memory
            new_memory = {
                "id": len(memories) + 1,
                "timestamp": datetime.now().isoformat(),
                "text": text
            }
            memories.append(new_memory)

            # Backup
            backup_file = MEMORIES_FILE.with_suffix('.json.backup')
            if MEMORIES_FILE.exists():
                shutil.copy2(MEMORIES_FILE, backup_file)

            # Write new file
            with open(MEMORIES_FILE, 'w', encoding='utf-8') as f:
                json.dump(memories, f, ensure_ascii=False, indent=2)
        
        if config.DEBUG:
            print(f"✅ Memory #{new_memory['id']} saved successfully!")
        logger.info(f"Memory saved: {text[:100]}")
        return True
        
    except Exception as e:
        logger.error(f"Error saving memory: {e}")
        return False

def get_memories():
    """Retrieve all memories."""
    try:
        if not _ensure_memories_file():
            return []
        
        with file_lock:
            with open(MEMORIES_FILE, 'r', encoding='utf-8') as f:
                memories = json.load(f)
        
        if config.DEBUG:
            print(f"📚 {len(memories)} memories loaded")
        return memories
        
    except Exception as e:
        logger.error(f"Error loading memories: {e}")
        return []

def clear_memories():
    """Delete all memories."""
    try:
        with file_lock:
            with open(MEMORIES_FILE, 'w', encoding='utf-8') as f:
                json.dump([], f, ensure_ascii=False, indent=2)
        
        if config.DEBUG:
            print("🗑️ All memories deleted!")
        return True
        
    except Exception as e:
        logger.error(f"Error clearing memories: {e}")
        return False

# Test function
def test_memory_service():
    """Test the Memory Service"""
    print("\n🧪 === Memory Service Test ===")
    
    # Test 1: Check directory and file
    print("\n1. Testing file creation...")
    success = _ensure_memories_file()
    
    if not success:
        print("❌ Test failed - cannot create file!")
        return
    
    # Test 2: Save memory
    print("\n2. Testing memory saving...")
    test_text = f"Test memory from {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    save_memory(test_text)
    
    # Test 3: Load memories
    print("\n3. Testing memory loading...")
    memories = get_memories()
    print(f"Loaded memories: {len(memories)}")
    
    for memory in memories[-3:]:  # Show last 3
        print(f"  - ID {memory.get('id', '?')}: {memory.get('text', '')[:50]}...")
    
    print("\n✅ Memory Service Test completed!")

if __name__ == "__main__":
    test_memory_service()
