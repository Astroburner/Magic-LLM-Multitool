# -*- coding: utf-8 -*-
"""
LLM Service for Ollama integration.
Manages communication with the Ollama backend.
"""
import logging
import requests
import json
import re
from typing import List, Dict, Any, Optional, Union
import config

logger = logging.getLogger(__name__)

def get_available_models() -> List[str]:
    """
    Retrieve available Ollama models.
    
    Returns:
        List[str]: List of available model names
    """
    try:
        response = requests.get(f"{config.OLLAMA_BASE_URL}/api/tags")
        if response.status_code == 200:
            models_data = response.json()
            return [model["name"] for model in models_data.get("models", [])]
        else:
            logger.error(f"Error retrieving models: {response.status_code} {response.text}")
            return []
    except Exception as e:
        logger.error(f"Error connecting to Ollama: {e}")
        return []

def parse_reasoning_response(response_text: str) -> dict:
    """
    Parses Reasoning-LLM responses and separates reasoning from final answer.
    """
    
    # Recognize different reasoning patterns
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
        # PHI-4 Pattern: "To determine..." (first paragraph as reasoning)
        r'^(To determine.*?(?=\n\n|\d+\.|So the answer|Therefore))(.*?)$',
        # Step-by-step Pattern
        r'^(.*?(?:step by step|digit by digit|compare).*?(?=So the answer|Therefore|The answer is))(.*?)$',
    ]
    
    # Debug: Log the first 200 characters of the response
    logger.debug(f"Response Preview: {response_text[:200]}...")
    
    for i, pattern in enumerate(reasoning_patterns):
        match = re.search(pattern, response_text, re.DOTALL | re.IGNORECASE)
        if match:
            reasoning = match.group(1).strip()
            answer = match.group(2).strip()
            
            if reasoning and answer and len(reasoning) > 50:  # Minimum length for reasoning
                logger.info(f"Reasoning-LLM Response detected (Pattern {i+1}) - Reasoning and Answer separated")
                logger.debug(f"Reasoning: {reasoning[:100]}...")
                logger.debug(f"Answer: {answer[:100]}...")
                return {
                    "reasoning": reasoning,
                    "answer": answer,
                    "has_reasoning": True
                }
    
    # Fallback: If more than 300 characters, try automatic separation
    if len(response_text) > 300:
        lines = response_text.split('\n\n')
        if len(lines) >= 2:
            # First half as reasoning, last half as answer
            mid_point = len(lines) // 2
            reasoning = '\n\n'.join(lines[:mid_point])
            answer = '\n\n'.join(lines[mid_point:])
            
            if len(reasoning) > 100 and len(answer) > 50:
                logger.info("Reasoning-LLM Response detected (Fallback separation)")
                return {
                    "reasoning": reasoning,
                    "answer": answer,
                    "has_reasoning": True
                }
    
    # No reasoning pattern detected
    logger.debug("No reasoning pattern detected - normal response")
    return {
        "reasoning": "",
        "answer": response_text,
        "has_reasoning": False
    }

def _format_context_into_prompt(prompt: str, context: Optional[List[Dict[str, str]]]) -> str:
    """
    Formats the conversation history (context) into the prompt string.
    """
    if not context:
        return prompt

    formatted_history = ""
    for message in context:
        role = message.get("role", "user")
        content = message.get("content", "")
        if role == "user":
            formatted_history += f"User: {content}\n\n"
        elif role == "assistant":
            formatted_history += f"Assistant: {content}\n\n"

    return f"{formatted_history}User: {prompt}\n\nAssistant:"

def _send_ollama_request(
    model_name: str, 
    prompt: str, 
    system_prompt: str = "", 
    temperature: float = 0.7,
    context: Optional[List[Dict[str, str]]] = None,
    images: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    Helper function to send requests to Ollama.
    """
    try:
        # Format context into prompt to support chat history with /api/generate
        final_prompt = _format_context_into_prompt(prompt, context)

        # Base request data
        request_data = {
            'model': model_name,
            'prompt': final_prompt,
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
            logger.info(f"Images added: {len(request_data['images'])} images")
        
        logger.info(f"Sending request to Ollama: {model_name}")
        
        # Debug output WITHOUT images (too large for logs)
        debug_data = {k: v for k, v in request_data.items() if k != 'images'}
        if 'images' in request_data:
            debug_data['images'] = f"[{len(request_data['images'])} images - hidden from logs]"
        logger.debug(f"Request data: {json.dumps(debug_data, indent=2, default=str)}")
        
        response = requests.post(
            f"{config.OLLAMA_BASE_URL}/api/generate",
            json=request_data
        )
        
        logger.debug(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            raw_response = response.json().get('response', '')
            parsed_response = parse_reasoning_response(raw_response)
            return parsed_response
        else:
            logger.error(f"Ollama Error: {response.status_code} {response.text}")
            return {
                "reasoning": "",
                "answer": f"Error communicating with model: {response.status_code}",
                "has_reasoning": False
            }

    except Exception as e:
        logger.error(f"Error in Ollama request: {e}")
        return {
            "reasoning": "",
            "answer": f"Connection error: {str(e)}",
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
    Send a request to the Ollama model.
    Returns only the final answer string.
    """
    result = _send_ollama_request(model_name, prompt, system_prompt, temperature, context, images)
    return result["answer"]

def query_ollama_with_reasoning(
    model_name: str, 
    prompt: str, 
    system_prompt: str = "", 
    temperature: float = 0.7,
    context: Optional[List[Dict[str, str]]] = None,
    images: Optional[List[Dict[str, str]]] = None
) -> dict:
    """
    Send a request to the Ollama model with reasoning support.
    Returns a dict with answer, reasoning, and has_reasoning flag.
    """
    return _send_ollama_request(model_name, prompt, system_prompt, temperature, context, images)
