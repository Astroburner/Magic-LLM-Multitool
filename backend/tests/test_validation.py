# -*- coding: utf-8 -*-
import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from utils.validation import validate_chat_payload, validate_memory_payload

def test_validate_chat_payload():
    print("Testing validate_chat_payload...")

    # Valid payload
    valid_payload = {
        "message": "Hello",
        "model": "llama2",
        "temperature": 0.7,
        "context": [],
        "images": [],
        "files": [],
        "enable_tts": True,
        "voice": "de-DE-KatjaNeural",
        "rate": "1.0",
        "pitch": "1.0"
    }
    is_valid, error = validate_chat_payload(valid_payload)
    assert is_valid is True, f"Valid payload failed: {error}"

    # Missing message
    invalid_payload = {"model": "llama2"}
    is_valid, error = validate_chat_payload(invalid_payload)
    assert is_valid is False
    assert "Nachricht ('message') darf nicht leer sein" in error

    # Invalid message type
    invalid_payload = {"message": 123}
    is_valid, error = validate_chat_payload(invalid_payload)
    assert is_valid is False
    assert "must be a string" in error.lower() or "muss ein string sein" in error.lower()

    # Invalid temperature
    invalid_payload = {"message": "hi", "temperature": "hot"}
    is_valid, error = validate_chat_payload(invalid_payload)
    assert is_valid is False
    assert "Temperatur" in error

    # Temperature out of range
    invalid_payload = {"message": "hi", "temperature": 2.5}
    is_valid, error = validate_chat_payload(invalid_payload)
    assert is_valid is False
    assert "zwischen 0.0 und 2.0" in error

    # Invalid context type
    invalid_payload = {"message": "hi", "context": "not a list"}
    is_valid, error = validate_chat_payload(invalid_payload)
    assert is_valid is False
    assert "Kontext" in error

    # Too many messages in context
    invalid_payload = {"message": "hi", "context": [{} for _ in range(201)]}
    is_valid, error = validate_chat_payload(invalid_payload)
    assert is_valid is False
    assert "max. 200" in error

    # Too many images
    invalid_payload = {"message": "hi", "images": [{} for _ in range(11)]}
    is_valid, error = validate_chat_payload(invalid_payload)
    assert is_valid is False
    assert "max. 10" in error

    print("validate_chat_payload tests passed!")

def test_validate_memory_payload():
    print("Testing validate_memory_payload...")

    # Valid payload
    valid_payload = {"text": "Remember this"}
    is_valid, error = validate_memory_payload(valid_payload)
    assert is_valid is True, f"Valid payload failed: {error}"

    # Missing text
    invalid_payload = {}
    is_valid, error = validate_memory_payload(invalid_payload)
    assert is_valid is False
    assert "Erinnerungstext" in error

    # Empty text
    invalid_payload = {"text": "  "}
    is_valid, error = validate_memory_payload(invalid_payload)
    assert is_valid is False
    assert "darf nicht leer sein" in error

    # Text too long
    invalid_payload = {"text": "a" * 10001}
    is_valid, error = validate_memory_payload(invalid_payload)
    assert is_valid is False
    assert "zu lang" in error

    print("validate_memory_payload tests passed!")

if __name__ == "__main__":
    try:
        test_validate_chat_payload()
        test_validate_memory_payload()
        print("\nAll validation tests passed successfully!")
    except AssertionError as e:
        print(f"\nTest failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nAn error occurred: {e}")
        sys.exit(1)
