# -*- coding: utf-8 -*-
import pytest
import sys
import os

# Add backend to path to allow imports
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from services.memory_manager import MemoryManager

@pytest.fixture
def memory_manager():
    return MemoryManager()

def test_should_save_memory_german_triggers(memory_manager):
    # Test different German triggers
    triggers = [
        ("merke dir das ist ein test", "das ist ein test"),
        ("merk dir mein name ist jules", "mein name ist jules"),
        ("erinnere dich an den termin", "an den termin"),
        ("erinner dich an den termin", "an den termin"),
        ("behalte das im kopf", "das im kopf"),
        ("speichere meine adresse", "meine adresse"),
        ("speicher meine adresse", "meine adresse"),
        ("vergiss nicht den schlüssel", "den schlüssel"),
        ("notiere das meeting morgen", "das meeting morgen"),
        ("notier das meeting morgen", "das meeting morgen"),
        ("das ist wichtig: ich mag kaffee", "ich mag kaffee"),
        ("wichtig zu wissen: ich bin allergisch gegen nüsse", "ich bin allergisch gegen nüsse")
    ]

    for message, expected_content in triggers:
        should_save, content = memory_manager.should_save_memory(message)
        assert should_save is True, f"Failed for message: {message}"
        assert content == expected_content.lower(), f"Content mismatch for message: {message}"

def test_should_save_memory_english_triggers(memory_manager):
    # Test different English triggers
    triggers = [
        ("remember to buy milk", "to buy milk"),
        ("recall our last meeting", "our last meeting"),
        ("keep in mind that I prefer tea", "that i prefer tea"),
        ("note that the office is closed", "the office is closed"), # "note that" is trigger
        ("save this for later", "for later"),
        ("don't forget the umbrella", "the umbrella"),
        ("make sure to remember the password", "the password"),
        ("this is important: call boss", "call boss"),
        ("important to know: flight is at 10pm", "flight is at 10pm")
    ]

    for message, expected_content in triggers:
        should_save, content = memory_manager.should_save_memory(message)
        assert should_save is True, f"Failed for message: {message}"
        assert content == expected_content.lower(), f"Content mismatch for message: {message}"

def test_should_save_memory_slash_commands(memory_manager):
    # Test slash commands
    commands = [
        ("/remember buy eggs", "buy eggs"),
        ("/merken brot kaufen", "brot kaufen"),
        ("/save some notes", "some notes")
    ]

    for message, expected_content in commands:
        should_save, content = memory_manager.should_save_memory(message)
        assert should_save is True, f"Failed for message: {message}"
        assert content == expected_content.lower(), f"Content mismatch for message: {message}"

def test_should_save_memory_case_insensitivity(memory_manager):
    # Test case insensitivity
    messages = [
        "REMEMBER this",
        "Merke DIR das",
        "/SAVE everything"
    ]

    for message in messages:
        should_save, content = memory_manager.should_save_memory(message)
        assert should_save is True, f"Failed for message: {message}"

def test_should_save_memory_whitespace_handling(memory_manager):
    # Test whitespace handling
    message = "   remember    extra spaces   "
    should_save, content = memory_manager.should_save_memory(message)
    assert should_save is True
    assert content == "extra spaces"

def test_should_not_save_memory_negative_cases(memory_manager):
    # Test messages that should not trigger save
    negative_cases = [
        "hallo wie geht es dir",
        "ich bin heute müde",
        "was ist die hauptstadt von frankreich",
    ]

    for message in negative_cases:
        should_save, content = memory_manager.should_save_memory(message)
        assert should_save is False, f"Should not have saved: {message}"

def test_should_save_memory_empty_content(memory_manager):
    # Test edge case with empty content or just trigger
    # The current regex requires something after the trigger in most cases due to \s+(.+)
    should_save, content = memory_manager.should_save_memory("remember ")
    assert should_save is False
