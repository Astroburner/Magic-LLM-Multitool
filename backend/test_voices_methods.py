import asyncio
from edge_tts import VoicesManager

async def main():
    try:
        print("Verfügbare Methoden und Attribute von VoicesManager:")
        voices_manager = VoicesManager()
        print(dir(voices_manager))
        
        # Überprüfe die Dokumentation oder Hilfe, falls verfügbar
        print("\nHilfe für VoicesManager:")
        help(VoicesManager)
        
    except Exception as e:
        print(f"Fehler: {e}")
        import traceback
        print(traceback.format_exc())

if __name__ == "__main__":
    asyncio.run(main())
