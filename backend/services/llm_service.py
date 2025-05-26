# -*- coding: utf-8 -*-
"""
LLM-Service für die Ollama-Integration.
Verwaltet die Kommunikation mit dem Ollama-Backend.
"""
import logging
import requests
import json
from typing import List, Dict, Any, Optional
import config

logger = logging.getLogger(__name__)

def get_available_models() -> List[str]:
    """
    Verfügbare Ollama-Modelle abrufen.
    
    Returns:
        List[str]: Liste der verfügbaren Modellnamen
    """
    try:
        response = requests.get(f"{config.OLLAMA_BASE_URL}/api/tags")
        if response.status_code == 200:
            models_data = response.json()
            return [model["name"] for model in models_data.get("models", [])]
        else:
            logger.error(f"Fehler beim Abrufen der Modelle: {response.status_code} {response.text}")
            return []
    except Exception as e:
        logger.error(f"Fehler bei der Verbindung zu Ollama: {e}")
        return []

def query_ollama(
    model_name: str, 
    prompt: str, 
    system_prompt: str = "", 
    temperature: float = 0.7,
    context: Optional[List[Dict[str, str]]] = None,
    images: Optional[List[Dict[str, str]]] = None  # ⭐ NEU: Bilder-Parameter
) -> str:
    """
    Eine Anfrage an das Ollama-Modell stellen.
    
    Args:
        model_name (str): Name des zu verwendenden Modells
        prompt (str): Benutzeranfrage
        system_prompt (str, optional): Systemaufforderung für das Modell
        temperature (float, optional): Temperaturparameter für die Antwortgenerierung
        context (List[Dict[str, str]], optional): Konversationskontext
        images (List[Dict[str, str]], optional): Bilder für multimodale Modelle
        
    Returns:
        str: Antwort des Modells
    """
    try:
        # Basis-Anfragedaten
        request_data = {
            'model': model_name,
            'prompt': prompt,
            'stream': False,
            'options': {
                'temperature': temperature,
                'num_gpu': 1,  # GPU verwenden
                'gpu_layers': 99  # Maximale GPU-Nutzung
            }
        }
        
        # Systemanweisung hinzufügen, wenn vorhanden
        if system_prompt:
            request_data['system'] = system_prompt
        
        # ⭐ NEU: Bilder hinzufügen für multimodale Modelle
        if images and len(images) > 0:
            request_data['images'] = []
            for image in images:
                # Base64-Daten direkt verwenden (ohne data:image/... Präfix)
                image_data = image.get('data', '')
                if image_data:
                    request_data['images'].append(image_data)
            logger.info(f"Bilder hinzugefügt: {len(request_data['images'])} Bilder für multimodales Modell")
        
        logger.info(f"Sende Anfrage an Ollama: {model_name}")
        # Debug-Ausgabe OHNE Bilder (zu groß für Logs)
        debug_data = {k: v for k, v in request_data.items() if k != 'images'}
        if 'images' in request_data:
            debug_data['images'] = f"[{len(request_data['images'])} images - hidden from logs]"
        logger.debug(f"Anfragedaten: {json.dumps(debug_data, indent=2, default=str)}")
        
        response = requests.post(
            f"{config.OLLAMA_BASE_URL}/api/generate",
            json=request_data
        )
        
        logger.debug(f"Antwort-Status: {response.status_code}")
        
        if response.status_code == 200:
            return response.json().get('response', '')
        else:
            logger.error(f"Ollama-Fehler: {response.status_code} {response.text}")
            return f"Fehler bei der Kommunikation mit dem Modell: {response.status_code}"
    
    except Exception as e:
        logger.error(f"Fehler bei der Anfrage an Ollama: {e}")
        return f"Fehler bei der Verbindung zum Modell: {str(e)}"