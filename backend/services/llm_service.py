# -*- coding: utf-8 -*-
"""
LLM-Service für die Ollama-Integration.
Verwaltet die Kommunikation mit dem Ollama-Backend.
"""
import logging
import requests
import json
import re
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

def parse_reasoning_response(response_text: str) -> dict:
    """
    Parst Reasoning-LLM Antworten und trennt Reasoning von Final Answer.
    """
    
    # Verschiedene Reasoning-Pattern erkennen
    reasoning_patterns = [
        # <thinking>...</thinking>
        r'<thinking>(.*?)</thinking>(.*?)$',
        # <reasoning>...</reasoning>
        r'<reasoning>(.*?)</reasoning>(.*?)$',
        # **Reasoning:** ... **Answer:**
        r'\*\*Reasoning:\*\*(.*?)\*\*Answer:\*\*(.*?)$',
        # **Thinking:** ... **Response:**
        r'\*\*Thinking:\*\*(.*?)\*\*Response:\*\*(.*?)$',
        # Let me think... [final answer]
        r'(Let me think.*?(?=\n\n|\[|Final|Answer))(.*?)$',
        # Reasoning: ... Answer:
        r'Reasoning:(.*?)Answer:(.*?)$',
        # ⭐ PHI-4 Pattern: "To determine..." (first paragraph as reasoning)
        r'^(To determine.*?(?=\n\n|\d+\.|So the answer|Therefore))(.*?)$',
        # ⭐ Step-by-step Pattern
        r'^(.*?(?:step by step|digit by digit|compare).*?(?=So the answer|Therefore|The answer is))(.*?)$',
    ]
    
    # Debug: Log die ersten 200 Zeichen der Response
    logger.debug(f"Response Preview: {response_text[:200]}...")
    
    for i, pattern in enumerate(reasoning_patterns):
        match = re.search(pattern, response_text, re.DOTALL | re.IGNORECASE)
        if match:
            reasoning = match.group(1).strip()
            answer = match.group(2).strip()
            
            if reasoning and answer and len(reasoning) > 50:  # Mindestlänge für Reasoning
                logger.info(f"Reasoning-LLM Response erkannt (Pattern {i+1}) - Reasoning und Answer getrennt")
                logger.debug(f"Reasoning: {reasoning[:100]}...")
                logger.debug(f"Answer: {answer[:100]}...")
                return {
                    "reasoning": reasoning,
                    "answer": answer,
                    "has_reasoning": True
                }
    
    # ⭐ Fallback: Wenn mehr als 300 Zeichen, versuche automatische Trennung
    if len(response_text) > 300:
        lines = response_text.split('\n\n')
        if len(lines) >= 2:
            # Erste Hälfte als Reasoning, letzte Hälfte als Answer
            mid_point = len(lines) // 2
            reasoning = '\n\n'.join(lines[:mid_point])
            answer = '\n\n'.join(lines[mid_point:])
            
            if len(reasoning) > 100 and len(answer) > 50:
                logger.info("Reasoning-LLM Response erkannt (Fallback-Trennung)")
                return {
                    "reasoning": reasoning,
                    "answer": answer,
                    "has_reasoning": True
                }
    
    # Kein Reasoning-Pattern gefunden
    logger.debug("Kein Reasoning-Pattern erkannt - normale Response")
    return {
        "reasoning": "",
        "answer": response_text,
        "has_reasoning": False
    }

def query_ollama(
    model_name: str, 
    prompt: str, 
    system_prompt: str = "", 
    temperature: float = 0.7,
    context: Optional[List[Dict[str, str]]] = None,
    images: Optional[List[Dict[str, str]]] = None
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
        str: Antwort des Modells (nur die finale Antwort)
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
        
        # Bilder hinzufügen für multimodale Modelle
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
            raw_response = response.json().get('response', '')
            
            # Reasoning-LLM Response parsen
            parsed_response = parse_reasoning_response(raw_response)
            
            # ⭐ NUR die finale Antwort zurückgeben (für Rückwärtskompatibilität)
            return parsed_response["answer"]
            
        else:
            logger.error(f"Ollama-Fehler: {response.status_code} {response.text}")
            return f"Fehler bei der Kommunikation mit dem Modell: {response.status_code}"
    
    except Exception as e:
        logger.error(f"Fehler bei der Anfrage an Ollama: {e}")
        return f"Fehler bei der Verbindung zum Modell: {str(e)}"

def query_ollama_with_reasoning(
    model_name: str, 
    prompt: str, 
    system_prompt: str = "", 
    temperature: float = 0.7,
    context: Optional[List[Dict[str, str]]] = None,
    images: Optional[List[Dict[str, str]]] = None
) -> dict:
    """
    Eine Anfrage an das Ollama-Modell stellen MIT Reasoning-Support.
    
    Returns:
        dict: {"reasoning": str, "answer": str, "has_reasoning": bool}
    """
    try:
        # Basis-Anfragedaten
        request_data = {
            'model': model_name,
            'prompt': prompt,
            'stream': False,
            'options': {
                'temperature': temperature,
                'num_gpu': 1,
                'gpu_layers': 99
            }
        }
        
        if system_prompt:
            request_data['system'] = system_prompt
        
        if images and len(images) > 0:
            request_data['images'] = []
            for image in images:
                image_data = image.get('data', '')
                if image_data:
                    request_data['images'].append(image_data)
            logger.info(f"Bilder hinzugefügt: {len(request_data['images'])} Bilder")
        
        logger.info(f"Sende Reasoning-Anfrage an Ollama: {model_name}")
        
        response = requests.post(
            f"{config.OLLAMA_BASE_URL}/api/generate",
            json=request_data
        )
        
        if response.status_code == 200:
            raw_response = response.json().get('response', '')
            
            # Reasoning-Response parsen
            parsed_response = parse_reasoning_response(raw_response)
            return parsed_response
            
        else:
            logger.error(f"Ollama-Fehler: {response.status_code} {response.text}")
            return {
                "reasoning": "",
                "answer": f"Fehler: {response.status_code}",
                "has_reasoning": False
            }
    
    except Exception as e:
        logger.error(f"Fehler bei Reasoning-Anfrage: {e}")
        return {
            "reasoning": "",
            "answer": f"Fehler: {str(e)}",
            "has_reasoning": False
        }