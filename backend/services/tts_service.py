# -*- coding: utf-8 -*-
"""
TTS-Service für die Sprachausgabe.
Unterstützt Edge-TTS und optional Whisper.
"""
import logging
import time
import os
import asyncio
import edge_tts
from edge_tts import VoicesManager  # VoicesManager-Import hinzugefügt
import config

logger = logging.getLogger(__name__)

# Versuchen Sie, Whisper TTS zu importieren, wenn verfügbar
try:
    from whisper_tts import WhisperTTS
    import torch
    WHISPER_AVAILABLE = True
    logger.info("Whisper TTS erfolgreich importiert")
except ImportError:
    WHISPER_AVAILABLE = False
    logger.warning("Whisper TTS nicht verfügbar. Nur Edge-TTS wird verwendet.")

# Versuchen Sie, Coqui TTS zu importieren, wenn verfügbar
try:
    from TTS.api import TTS
    COQUI_TTS_AVAILABLE = True
    logger.info("Coqui TTS erfolgreich importiert")
except ImportError:
    COQUI_TTS_AVAILABLE = False
    logger.warning("Coqui TTS nicht verfügbar")

# Vollständige Liste aller Edge-TTS-Stimmen
ALL_EDGE_TTS_VOICES = [
    {"name": "af-ZA-AdriNeural", "gender": "Female", "locale": "af-ZA", "display_name": "af-ZA - Adri (Female)"},
    {"name": "af-ZA-WillemNeural", "gender": "Male", "locale": "af-ZA", "display_name": "af-ZA - Willem (Male)"},
    {"name": "sq-AL-AnilaNeural", "gender": "Female", "locale": "sq-AL", "display_name": "sq-AL - Anila (Female)"},
    {"name": "sq-AL-IlirNeural", "gender": "Male", "locale": "sq-AL", "display_name": "sq-AL - Ilir (Male)"},
    {"name": "ar-DZ-AminaNeural", "gender": "Female", "locale": "ar-DZ", "display_name": "ar-DZ - Amina (Female)"},
    {"name": "ar-DZ-IsmaelNeural", "gender": "Male", "locale": "ar-DZ", "display_name": "ar-DZ - Ismael (Male)"},
    {"name": "ar-BH-AliNeural", "gender": "Male", "locale": "ar-BH", "display_name": "ar-BH - Ali (Male)"},
    {"name": "ar-BH-LailaNeural", "gender": "Female", "locale": "ar-BH", "display_name": "ar-BH - Laila (Female)"},
    {"name": "ar-EG-SalmaNeural", "gender": "Female", "locale": "ar-EG", "display_name": "ar-EG - Salma (Female)"},
    {"name": "ar-EG-ShakirNeural", "gender": "Male", "locale": "ar-EG", "display_name": "ar-EG - Shakir (Male)"},
    {"name": "bg-BG-BorislavNeural", "gender": "Male", "locale": "bg-BG", "display_name": "bg-BG - Borislav (Male)"},
    {"name": "bg-BG-KalinaNeural", "gender": "Female", "locale": "bg-BG", "display_name": "bg-BG - Kalina (Female)"},
    {"name": "ca-ES-EnricNeural", "gender": "Male", "locale": "ca-ES", "display_name": "ca-ES - Enric (Male)"},
    {"name": "ca-ES-JoanaNeural", "gender": "Female", "locale": "ca-ES", "display_name": "ca-ES - Joana (Female)"},
    {"name": "zh-HK-HiuGaaiNeural", "gender": "Female", "locale": "zh-HK", "display_name": "zh-HK - HiuGaai (Female)"},
    {"name": "zh-HK-HiuMaanNeural", "gender": "Female", "locale": "zh-HK", "display_name": "zh-HK - HiuMaan (Female)"},
    {"name": "zh-HK-WanLungNeural", "gender": "Male", "locale": "zh-HK", "display_name": "zh-HK - WanLung (Male)"},
    {"name": "zh-CN-XiaoxiaoNeural", "gender": "Female", "locale": "zh-CN", "display_name": "zh-CN - Xiaoxiao (Female)"},
    {"name": "zh-CN-YunyangNeural", "gender": "Male", "locale": "zh-CN", "display_name": "zh-CN - Yunyang (Male)"},
    {"name": "zh-TW-HsiaoChenNeural", "gender": "Female", "locale": "zh-TW", "display_name": "zh-TW - HsiaoChen (Female)"},
    {"name": "zh-TW-YunJheNeural", "gender": "Male", "locale": "zh-TW", "display_name": "zh-TW - YunJhe (Male)"},
    {"name": "hr-HR-GabrijelaNeural", "gender": "Female", "locale": "hr-HR", "display_name": "hr-HR - Gabrijela (Female)"},
    {"name": "hr-HR-SreckoNeural", "gender": "Male", "locale": "hr-HR", "display_name": "hr-HR - Srecko (Male)"},
    {"name": "cs-CZ-AntoninNeural", "gender": "Male", "locale": "cs-CZ", "display_name": "cs-CZ - Antonin (Male)"},
    {"name": "cs-CZ-VlastaNeural", "gender": "Female", "locale": "cs-CZ", "display_name": "cs-CZ - Vlasta (Female)"},
    {"name": "da-DK-ChristelNeural", "gender": "Female", "locale": "da-DK", "display_name": "da-DK - Christel (Female)"},
    {"name": "da-DK-JeppeNeural", "gender": "Male", "locale": "da-DK", "display_name": "da-DK - Jeppe (Male)"},
    {"name": "nl-BE-ArnaudNeural", "gender": "Male", "locale": "nl-BE", "display_name": "nl-BE - Arnaud (Male)"},
    {"name": "nl-BE-DenaNeural", "gender": "Female", "locale": "nl-BE", "display_name": "nl-BE - Dena (Female)"},
    {"name": "nl-NL-ColetteNeural", "gender": "Female", "locale": "nl-NL", "display_name": "nl-NL - Colette (Female)"},
    {"name": "nl-NL-FennaNeural", "gender": "Female", "locale": "nl-NL", "display_name": "nl-NL - Fenna (Female)"},
    {"name": "nl-NL-MaartenNeural", "gender": "Male", "locale": "nl-NL", "display_name": "nl-NL - Maarten (Male)"},
    {"name": "en-AU-NatashaNeural", "gender": "Female", "locale": "en-AU", "display_name": "en-AU - Natasha (Female)"},
    {"name": "en-AU-WilliamNeural", "gender": "Male", "locale": "en-AU", "display_name": "en-AU - William (Male)"},
    {"name": "en-CA-ClaraNeural", "gender": "Female", "locale": "en-CA", "display_name": "en-CA - Clara (Female)"},
    {"name": "en-CA-LiamNeural", "gender": "Male", "locale": "en-CA", "display_name": "en-CA - Liam (Male)"},
    {"name": "en-HK-SamNeural", "gender": "Male", "locale": "en-HK", "display_name": "en-HK - Sam (Male)"},
    {"name": "en-HK-YanNeural", "gender": "Female", "locale": "en-HK", "display_name": "en-HK - Yan (Female)"},
    {"name": "en-IN-NeerjaNeural", "gender": "Female", "locale": "en-IN", "display_name": "en-IN - Neerja (Female)"},
    {"name": "en-IN-PrabhatNeural", "gender": "Male", "locale": "en-IN", "display_name": "en-IN - Prabhat (Male)"},
    {"name": "en-IE-ConnorNeural", "gender": "Male", "locale": "en-IE", "display_name": "en-IE - Connor (Male)"},
    {"name": "en-IE-EmilyNeural", "gender": "Female", "locale": "en-IE", "display_name": "en-IE - Emily (Female)"},
    {"name": "en-GB-LibbyNeural", "gender": "Female", "locale": "en-GB", "display_name": "en-GB - Libby (Female)"},
    {"name": "en-GB-RyanNeural", "gender": "Male", "locale": "en-GB", "display_name": "en-GB - Ryan (Male)"},
    {"name": "en-GB-SoniaNeural", "gender": "Female", "locale": "en-GB", "display_name": "en-GB - Sonia (Female)"},
    {"name": "en-US-AriaNeural", "gender": "Female", "locale": "en-US", "display_name": "en-US - Aria (Female)"},
    {"name": "en-US-GuyNeural", "gender": "Male", "locale": "en-US", "display_name": "en-US - Guy (Male)"},
    {"name": "en-US-JennyNeural", "gender": "Female", "locale": "en-US", "display_name": "en-US - Jenny (Female)"},
    {"name": "et-EE-AnuNeural", "gender": "Female", "locale": "et-EE", "display_name": "et-EE - Anu (Female)"},
    {"name": "et-EE-KertNeural", "gender": "Male", "locale": "et-EE", "display_name": "et-EE - Kert (Male)"},
    {"name": "fi-FI-HarriNeural", "gender": "Male", "locale": "fi-FI", "display_name": "fi-FI - Harri (Male)"},
    {"name": "fi-FI-NooraNeural", "gender": "Female", "locale": "fi-FI", "display_name": "fi-FI - Noora (Female)"},
    {"name": "fr-BE-CharlineNeural", "gender": "Female", "locale": "fr-BE", "display_name": "fr-BE - Charline (Female)"},
    {"name": "fr-BE-GerardNeural", "gender": "Male", "locale": "fr-BE", "display_name": "fr-BE - Gerard (Male)"},
    {"name": "fr-CA-SylvieNeural", "gender": "Female", "locale": "fr-CA", "display_name": "fr-CA - Sylvie (Female)"},
    {"name": "fr-CA-JeanNeural", "gender": "Male", "locale": "fr-CA", "display_name": "fr-CA - Jean (Male)"},
    {"name": "fr-FR-DeniseNeural", "gender": "Female", "locale": "fr-FR", "display_name": "fr-FR - Denise (Female)"},
    {"name": "fr-FR-HenriNeural", "gender": "Male", "locale": "fr-FR", "display_name": "fr-FR - Henri (Male)"},
    {"name": "de-AT-IngridNeural", "gender": "Female", "locale": "de-AT", "display_name": "de-AT - Ingrid (Female)"},
    {"name": "de-AT-JonasNeural", "gender": "Male", "locale": "de-AT", "display_name": "de-AT - Jonas (Male)"},
    {"name": "de-DE-KatjaNeural", "gender": "Female", "locale": "de-DE", "display_name": "de-DE - Katja (Female)"},
    {"name": "de-DE-ConradNeural", "gender": "Male", "locale": "de-DE", "display_name": "de-DE - Conrad (Male)"},
    {"name": "de-CH-LeniNeural", "gender": "Female", "locale": "de-CH", "display_name": "de-CH - Leni (Female)"},
    {"name": "de-CH-JanNeural", "gender": "Male", "locale": "de-CH", "display_name": "de-CH - Jan (Male)"},
    {"name": "el-GR-AthinaNeural", "gender": "Female", "locale": "el-GR", "display_name": "el-GR - Athina (Female)"},
    {"name": "el-GR-NestorasNeural", "gender": "Male", "locale": "el-GR", "display_name": "el-GR - Nestoras (Male)"},
    {"name": "he-IL-AvriNeural", "gender": "Male", "locale": "he-IL", "display_name": "he-IL - Avri (Male)"},
    {"name": "he-IL-HilaNeural", "gender": "Female", "locale": "he-IL", "display_name": "he-IL - Hila (Female)"},
    {"name": "hi-IN-MadhurNeural", "gender": "Male", "locale": "hi-IN", "display_name": "hi-IN - Madhur (Male)"},
    {"name": "hi-IN-SwaraNeural", "gender": "Female", "locale": "hi-IN", "display_name": "hi-IN - Swara (Female)"},
    {"name": "hu-HU-NoemiNeural", "gender": "Female", "locale": "hu-HU", "display_name": "hu-HU - Noemi (Female)"},
    {"name": "hu-HU-TamasNeural", "gender": "Male", "locale": "hu-HU", "display_name": "hu-HU - Tamas (Male)"},
    {"name": "id-ID-ArdiNeural", "gender": "Male", "locale": "id-ID", "display_name": "id-ID - Ardi (Male)"},
    {"name": "id-ID-GadisNeural", "gender": "Female", "locale": "id-ID", "display_name": "id-ID - Gadis (Female)"},
    {"name": "it-IT-DiegoNeural", "gender": "Male", "locale": "it-IT", "display_name": "it-IT - Diego (Male)"},
    {"name": "it-IT-ElsaNeural", "gender": "Female", "locale": "it-IT", "display_name": "it-IT - Elsa (Female)"},
    {"name": "it-IT-IsabellaNeural", "gender": "Female", "locale": "it-IT", "display_name": "it-IT - Isabella (Female)"},
    {"name": "ja-JP-KeitaNeural", "gender": "Male", "locale": "ja-JP", "display_name": "ja-JP - Keita (Male)"},
    {"name": "ja-JP-NanamiNeural", "gender": "Female", "locale": "ja-JP", "display_name": "ja-JP - Nanami (Female)"},
    {"name": "ko-KR-InJoonNeural", "gender": "Male", "locale": "ko-KR", "display_name": "ko-KR - InJoon (Male)"},
    {"name": "ko-KR-SunHiNeural", "gender": "Female", "locale": "ko-KR", "display_name": "ko-KR - SunHi (Female)"},
    {"name": "pl-PL-MarekNeural", "gender": "Male", "locale": "pl-PL", "display_name": "pl-PL - Marek (Male)"},
    {"name": "pl-PL-ZofiaNeural", "gender": "Female", "locale": "pl-PL", "display_name": "pl-PL - Zofia (Female)"},
    {"name": "pt-BR-AntonioNeural", "gender": "Male", "locale": "pt-BR", "display_name": "pt-BR - Antonio (Male)"},
    {"name": "pt-BR-FranciscaNeural", "gender": "Female", "locale": "pt-BR", "display_name": "pt-BR - Francisca (Female)"},
    {"name": "pt-PT-DuarteNeural", "gender": "Male", "locale": "pt-PT", "display_name": "pt-PT - Duarte (Male)"},
    {"name": "pt-PT-RaquelNeural", "gender": "Female", "locale": "pt-PT", "display_name": "pt-PT - Raquel (Female)"},
    {"name": "ro-RO-AlinaNeural", "gender": "Female", "locale": "ro-RO", "display_name": "ro-RO - Alina (Female)"},
    {"name": "ro-RO-EmilNeural", "gender": "Male", "locale": "ro-RO", "display_name": "ro-RO - Emil (Male)"},
    {"name": "ru-RU-DmitryNeural", "gender": "Male", "locale": "ru-RU", "display_name": "ru-RU - Dmitry (Male)"},
    {"name": "ru-RU-SvetlanaNeural", "gender": "Female", "locale": "ru-RU", "display_name": "ru-RU - Svetlana (Female)"},
    {"name": "sk-SK-LukasNeural", "gender": "Male", "locale": "sk-SK", "display_name": "sk-SK - Lukas (Male)"},
    {"name": "sk-SK-ViktoriaNeural", "gender": "Female", "locale": "sk-SK", "display_name": "sk-SK - Viktoria (Female)"},
    {"name": "sl-SI-PetraNeural", "gender": "Female", "locale": "sl-SI", "display_name": "sl-SI - Petra (Female)"},
    {"name": "sl-SI-RokNeural", "gender": "Male", "locale": "sl-SI", "display_name": "sl-SI - Rok (Male)"},
    {"name": "es-AR-ElenaNeural", "gender": "Female", "locale": "es-AR", "display_name": "es-AR - Elena (Female)"},
    {"name": "es-AR-TomasNeural", "gender": "Male", "locale": "es-AR", "display_name": "es-AR - Tomas (Male)"},
    {"name": "es-CO-GonzaloNeural", "gender": "Male", "locale": "es-CO", "display_name": "es-CO - Gonzalo (Male)"},
    {"name": "es-CO-SalomeNeural", "gender": "Female", "locale": "es-CO", "display_name": "es-CO - Salome (Female)"},
    {"name": "es-MX-DaliaNeural", "gender": "Female", "locale": "es-MX", "display_name": "es-MX - Dalia (Female)"},
    {"name": "es-MX-JorgeNeural", "gender": "Male", "locale": "es-MX", "display_name": "es-MX - Jorge (Male)"},
    {"name": "es-ES-AlvaroNeural", "gender": "Male", "locale": "es-ES", "display_name": "es-ES - Alvaro (Male)"},
    {"name": "es-ES-ElviraNeural", "gender": "Female", "locale": "es-ES", "display_name": "es-ES - Elvira (Female)"},
    {"name": "sv-SE-HilleviNeural", "gender": "Female", "locale": "sv-SE", "display_name": "sv-SE - Hillevi (Female)"},
    {"name": "sv-SE-MattiasNeural", "gender": "Male", "locale": "sv-SE", "display_name": "sv-SE - Mattias (Male)"},
    {"name": "ta-IN-PallaviNeural", "gender": "Female", "locale": "ta-IN", "display_name": "ta-IN - Pallavi (Female)"},
    {"name": "ta-IN-ValluvarNeural", "gender": "Male", "locale": "ta-IN", "display_name": "ta-IN - Valluvar (Male)"},
    {"name": "te-IN-MohanNeural", "gender": "Male", "locale": "te-IN", "display_name": "te-IN - Mohan (Male)"},
    {"name": "te-IN-ShrutiNeural", "gender": "Female", "locale": "te-IN", "display_name": "te-IN - Shruti (Female)"},
    {"name": "th-TH-NiwatNeural", "gender": "Male", "locale": "th-TH", "display_name": "th-TH - Niwat (Male)"},
    {"name": "th-TH-PremwadeeNeural", "gender": "Female", "locale": "th-TH", "display_name": "th-TH - Premwadee (Female)"},
    {"name": "tr-TR-AhmetNeural", "gender": "Male", "locale": "tr-TR", "display_name": "tr-TR - Ahmet (Male)"},
    {"name": "tr-TR-EmelNeural", "gender": "Female", "locale": "tr-TR", "display_name": "tr-TR - Emel (Female)"},
    {"name": "uk-UA-OstapNeural", "gender": "Male", "locale": "uk-UA", "display_name": "uk-UA - Ostap (Male)"},
    {"name": "uk-UA-PolinaNeural", "gender": "Female", "locale": "uk-UA", "display_name": "uk-UA - Polina (Female)"},
    {"name": "vi-VN-HoaiMyNeural", "gender": "Female", "locale": "vi-VN", "display_name": "vi-VN - HoaiMy (Female)"},
    {"name": "vi-VN-NamMinhNeural", "gender": "Male", "locale": "vi-VN", "display_name": "vi-VN - NamMinh (Male)"}
]

async def get_voices_async():
    """
    Verfügbare Edge-TTS-Stimmen asynchron abrufen.
    
    Returns:
        List[Dict]: Liste der verfügbaren Stimmen
    """
    try:
        logger.debug("Verwende vordefinierte Liste von Edge-TTS-Stimmen")
        return ALL_EDGE_TTS_VOICES
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der Stimmen: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return []

def get_available_voices():
    """
    Verfügbare TTS-Stimmen abrufen.
    
    Returns:
        List[Dict]: Liste der verfügbaren Stimmen
    """
    logger.debug("Starte get_available_voices...")
    
    try:
        voices = asyncio.run(get_voices_async())
        logger.info(f"Erfolgreich {len(voices)} Stimmen abgerufen")
        return voices
    except Exception as e:
        logger.error(f"Fehler in get_available_voices: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return []

async def edge_tts_async(text, voice, rate, pitch):
    """
    Text mit Edge-TTS in Sprache umwandeln (async).
    
    Args:
        text (str): Umzuwandelnder Text
        voice (str): Zu verwendende Stimme
        rate (str): Sprechgeschwindigkeit
        pitch (str): Tonhöhe (wird ignoriert, da nicht direkt unterstützt)
        
    Returns:
        str: Dateiname der generierten Audiodatei
    """
    try:
        timestamp = int(time.time())
        filename = f"tts_{timestamp}.mp3"
        output_path = os.path.join(config.AUDIO_OUTPUT_DIR, filename)
        
        # Konvertiere die Rate für Edge-TTS
        rate_percent = int((float(rate) - 1.0) * 100)
        rate_value = f"+{rate_percent}%" if rate_percent >= 0 else f"{rate_percent}%" 
        
        logger.debug(f"TTS-Parameter: Voice={voice}, Rate={rate_value}")
        
        # Kommunizieren mit Edge-TTS nur mit Rate (pitch wird nicht direkt unterstützt)
        communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate_value)
        
        # Speichere die Audiodatei
        await communicate.save(output_path)
        logger.info(f"Audio erstellt: {filename}")
        return filename
    
    except Exception as e:
        logger.error(f"Fehler bei Edge-TTS: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return None

def text_to_speech(text, voice=None, rate=None, pitch=None):
    """
    Text in Sprache umwandeln.
    
    Args:
        text (str): Umzuwandelnder Text
        voice (str): Zu verwendende Stimme
        rate (str): Sprechgeschwindigkeit
        pitch (str): Tonhöhe
        
    Returns:
        str: Dateiname der generierten Audiodatei
    """
    # Standardwerte verwenden, wenn Parameter nicht angegeben sind
    if voice is None:
        voice = config.DEFAULT_TTS_VOICE
    if rate is None:
        rate = config.DEFAULT_TTS_RATE
    if pitch is None:
        pitch = config.DEFAULT_TTS_PITCH
    
    # Debug-Ausgabe
    logger.debug(f"TTS-Anfrage: Text={text[:30]}..., Voice={voice}, Rate={rate}, Pitch={pitch}")
    
    # Edge-TTS verwenden (Standard)
    return asyncio.run(edge_tts_async(text, voice, rate, pitch))

def whisper_tts(text, voice="en-US-Neural2-F"):
    """
    Text mit Whisper TTS in Sprache umwandeln.
    
    Args:
        text (str): Umzuwandelnder Text
        voice (str): Zu verwendende Stimme
        
    Returns:
        str: Dateiname der generierten Audiodatei
    """
    if not WHISPER_AVAILABLE:
        logger.error("Whisper TTS nicht verfügbar")
        return None
    
    try:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model = WhisperTTS.from_pretrained("openai/whisper-large-v2").to(device)
        
        # Sprache generieren
        audio = model.generate_speech(text, voice=voice)
        
        # In Datei speichern
        timestamp = int(time.time())
        filename = f"whisper_tts_{timestamp}.wav"
        filepath = os.path.join(config.AUDIO_OUTPUT_DIR, filename)
        
        import soundfile as sf
        sf.write(filepath, audio, 24000)
        
        return filename
    
    except Exception as e:
        logger.error(f"Fehler bei Whisper TTS: {e}")
        return None
