import asyncio
import sys

from app.config import get_settings
from app.core.ollama_client import OllamaClient, OllamaUnavailableError


async def main() -> int:
    settings = get_settings()
    client = OllamaClient(settings)

    status = await client.status()
    print(f"Ollama reachable: {status['reachable']}")
    print(f"Model {status['model']} installed: {status['modelInstalled']}")
    if not status["reachable"]:
        print("Start Ollama first, then run this script again.")
        return 1
    if not status["modelInstalled"]:
        print(f"Run: ollama pull {status['model']}")
        return 1

    try:
        answer = await client.generate("Reply with one short sentence confirming you are ready.")
    except OllamaUnavailableError as exc:
        print(f"Generation failed: {exc}")
        return 1

    print(f"Model reply: {answer.strip()}")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
