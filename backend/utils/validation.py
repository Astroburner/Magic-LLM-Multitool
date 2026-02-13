# -*- coding: utf-8 -*-
"""
Validierungsmodul für API-Anfragen.
"""

def validate_chat_payload(data):
    """
    Validiert den Payload für den Chat-Endpunkt.
    Returns: (is_valid, error_message)
    """
    if not isinstance(data, dict):
        return False, "Payload muss ein JSON-Objekt sein"

    # Message validieren
    message = data.get('message', '')
    if 'message' in data and not isinstance(data['message'], str):
        return False, "Nachricht ('message') muss ein String sein"
    if not message or not str(message).strip():
        return False, "Nachricht ('message') darf nicht leer sein"

    # Optionale Felder validieren
    if 'model' in data and not isinstance(data['model'], str):
        return False, "Modellname ('model') muss ein String sein"

    if 'system_prompt' in data and not isinstance(data['system_prompt'], str):
        return False, "System-Prompt ('system_prompt') muss ein String sein"

    if 'temperature' in data:
        try:
            temp = float(data['temperature'])
            if temp < 0 or temp > 2:
                return False, "Temperatur ('temperature') muss zwischen 0.0 und 2.0 liegen"
        except (ValueError, TypeError):
            return False, "Temperatur ('temperature') muss eine Zahl sein"

    if 'context' in data:
        if not isinstance(data['context'], list):
            return False, "Kontext ('context') muss eine Liste sein"
        if len(data['context']) > 200:
            return False, "Zu viele Nachrichten im Kontext (max. 200)"

    if 'images' in data:
        if not isinstance(data['images'], list):
            return False, "Bilder ('images') muss eine Liste sein"
        if len(data['images']) > 10:
            return False, "Zu viele Bilder hochgeladen (max. 10)"

    if 'files' in data:
        if not isinstance(data['files'], list):
            return False, "Dateien ('files') muss eine Liste sein"
        if len(data['files']) > 10:
            return False, "Zu viele Dateien hochgeladen (max. 10)"

    if 'enable_tts' in data and not isinstance(data['enable_tts'], bool):
        return False, "TTS-Aktivierung ('enable_tts') muss ein Boolean sein"

    if 'voice' in data and not isinstance(data['voice'], str):
        return False, "Stimme ('voice') muss ein String sein"

    if 'rate' in data:
        try:
            float(data['rate'])
        except (ValueError, TypeError):
            return False, "Sprechgeschwindigkeit ('rate') muss eine Zahl (als String oder Float) sein"

    if 'pitch' in data:
        try:
            float(data['pitch'])
        except (ValueError, TypeError):
            return False, "Tonhöhe ('pitch') muss eine Zahl (als String oder Float) sein"

    return True, None

def validate_memory_payload(data):
    """
    Validiert den Payload für den Memory-Endpunkt.
    Returns: (is_valid, error_message)
    """
    if not isinstance(data, dict):
        return False, "Payload muss ein JSON-Objekt sein"

    memory_text = data.get('text', '')
    if 'text' in data and not isinstance(data['text'], str):
        return False, "Erinnerungstext ('text') muss ein String sein"
    if not memory_text or not str(memory_text).strip():
        return False, "Erinnerungstext ('text') darf nicht leer sein"
    if len(memory_text) > 10000:
        return False, "Erinnerungstext ist zu lang (max. 10000 Zeichen)"

    return True, None
