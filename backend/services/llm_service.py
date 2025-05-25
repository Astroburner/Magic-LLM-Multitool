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
    context: Optional[List[Dict[str, str]]] = None
) -> str:
    """
    Eine Anfrage an das Ollama-Modell stellen.
    
    Args:
        model_name (str): Name des zu verwendenden Modells
        prompt (str): Benutzeranfrage
        system_prompt (str, optional): Systemaufforderung für das Modell
        temperature (float, optional): Temperaturparameter für die Antwortgenerierung
        context (List[Dict[str, str]], optional): Konversationskontext
        
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
        
        logger.info(f"Sende Anfrage an Ollama: {model_name}")
        logger.debug(f"Anfragedaten: {json.dumps(request_data, indent=2)}")
        
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
