import sys
import unittest
from unittest.mock import MagicMock, patch

# Mock dependencies that are not available in the environment
sys.modules['whisper_tts'] = MagicMock()
sys.modules['torch'] = MagicMock()
sys.modules['edge_tts'] = MagicMock()
sys.modules['soundfile'] = MagicMock()

# Import the service after mocking
# We need to make sure WHISPER_AVAILABLE is True for the test
with patch('backend.services.tts_service.WHISPER_AVAILABLE', True):
    from backend.services.tts_service import whisper_tts
    import backend.services.tts_service as tts_service

class TestWhisperOptimization(unittest.TestCase):
    def setUp(self):
        # Reset global state before each test
        tts_service.WHISPER_MODEL = None
        # Mock WhisperTTS.from_pretrained
        self.mock_whisper_tts_class = sys.modules['whisper_tts'].WhisperTTS
        self.mock_whisper_tts_class.reset_mock()
        self.mock_model = MagicMock()
        self.mock_whisper_tts_class.from_pretrained.return_value = self.mock_model
        self.mock_model.to.return_value = self.mock_model
        self.mock_model.generate_speech.return_value = [0.1, 0.2, 0.3]

    def test_lazy_loading_only_once(self):
        # Call whisper_tts multiple times
        with patch('backend.services.tts_service.WHISPER_AVAILABLE', True):
            whisper_tts("Hello world")
            whisper_tts("Second call")
            whisper_tts("Third call")

        # Verify from_pretrained was called exactly once
        self.mock_whisper_tts_class.from_pretrained.assert_called_once_with("openai/whisper-large-v2")
        # Verify generate_speech was called 3 times
        self.assertEqual(self.mock_model.generate_speech.call_count, 3)

    def test_thread_safety(self):
        import threading

        # Reset state
        tts_service.WHISPER_MODEL = None

        # Number of threads
        N = 10
        barrier = threading.Barrier(N)

        def call_whisper():
            barrier.wait()
            with patch('backend.services.tts_service.WHISPER_AVAILABLE', True):
                whisper_tts("Thread test")

        threads = [threading.Thread(target=call_whisper) for _ in range(N)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        # Still should only be called once
        self.mock_whisper_tts_class.from_pretrained.assert_called_once()

if __name__ == '__main__':
    unittest.main()
