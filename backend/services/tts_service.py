# -*- coding: utf-8 -*-
"""
TTS Service for speech output.
Supports Edge-TTS.
"""
import logging
import time
import os
import asyncio
import edge_tts
import config

logger = logging.getLogger(__name__)

# Complete list of all Edge-TTS voices
# In a real scenario, this should be fetched dynamically or stored in a JSON file
ALL_EDGE_TTS_VOICES = [
    {"name": "de-DE-KatjaNeural", "gender": "Female", "locale": "de-DE", "display_name": "de-DE - Katja (Female)"},
    {"name": "en-US-AriaNeural", "gender": "Female", "locale": "en-US", "display_name": "en-US - Aria (Female)"},
    {"name": "en-GB-RyanNeural", "gender": "Male", "locale": "en-GB", "display_name": "en-GB - Ryan (Male)"},
    # ... (shortened list for brevity, ideally this should be comprehensive)
]

async def get_voices_async():
    """
    Retrieve available Edge-TTS voices asynchronously.
    
    Returns:
        List[Dict]: List of available voices
    """
    try:
        # Ideally we would fetch from edge_tts.list_voices()
        # but for now we return the hardcoded list or fetch if empty
        voices = await edge_tts.list_voices()
        if voices:
             return [
                 {
                     "name": v["ShortName"],
                     "gender": v["Gender"],
                     "locale": v["Locale"],
                     "display_name": f"{v['Locale']} - {v['ShortName'].split('-')[-1]} ({v['Gender']})"
                 }
                 for v in voices
             ]

        logger.debug("Using predefined list of Edge-TTS voices")
        return ALL_EDGE_TTS_VOICES
    except Exception as e:
        logger.error(f"Error retrieving voices: {e}")
        return []

def get_available_voices():
    """
    Retrieve available TTS voices.
    
    Returns:
        List[Dict]: List of available voices
    """
    logger.debug("Starting get_available_voices...")
    
    try:
        # Create a new event loop if none exists (for sync context)
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        voices = loop.run_until_complete(get_voices_async())
        logger.info(f"Successfully retrieved {len(voices)} voices")
        return voices
    except Exception as e:
        logger.error(f"Error in get_available_voices: {e}")
        return []

async def edge_tts_async(text, voice, rate, pitch):
    """
    Convert text to speech using Edge-TTS (async).
    
    Args:
        text (str): Text to convert
        voice (str): Voice to use
        rate (str): Speech rate
        pitch (str): Pitch (ignored as not directly supported via simple API)
        
    Returns:
        str: Filename of the generated audio file
    """
    try:
        timestamp = int(time.time())
        filename = f"tts_{timestamp}.mp3"
        output_path = os.path.join(config.AUDIO_OUTPUT_DIR, filename)
        
        # Convert rate for Edge-TTS
        # rate comes as string "1.0", "1.5", etc.
        try:
            rate_float = float(rate)
            rate_percent = int((rate_float - 1.0) * 100)
            rate_value = f"+{rate_percent}%" if rate_percent >= 0 else f"{rate_percent}%"
        except ValueError:
            rate_value = "+0%"
        
        logger.debug(f"TTS Parameters: Voice={voice}, Rate={rate_value}")
        
        # Communicate with Edge-TTS
        communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate_value)
        
        # Save audio file
        await communicate.save(output_path)
        logger.info(f"Audio created: {filename}")
        return filename
    
    except Exception as e:
        logger.error(f"Error in Edge-TTS: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return None

def text_to_speech(text, voice=None, rate=None, pitch=None):
    """
    Convert text to speech.
    
    Args:
        text (str): Text to convert
        voice (str): Voice to use
        rate (str): Speech rate
        pitch (str): Pitch
        
    Returns:
        str: Filename of the generated audio file
    """
    # Use default values if parameters are missing
    if voice is None:
        voice = config.DEFAULT_TTS_VOICE
    if rate is None:
        rate = config.DEFAULT_TTS_RATE
    if pitch is None:
        pitch = config.DEFAULT_TTS_PITCH
    
    # Debug output
    logger.debug(f"TTS Request: Text={text[:30]}..., Voice={voice}, Rate={rate}, Pitch={pitch}")
    
    # Use Edge-TTS (Default)
    try:
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        return loop.run_until_complete(edge_tts_async(text, voice, rate, pitch))
    except Exception as e:
         logger.error(f"Error in text_to_speech wrapper: {e}")
         return None
