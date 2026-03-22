import httpx
import json
import asyncio

async def test_challenge():
    URL = "http://localhost:8000/api/challenge"
    PAYLOAD = {"user_id": "user_shrikant12"}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(URL, json=PAYLOAD, timeout=30.0)
            print(f"Status: {response.status_code}")
            print(json.dumps(response.json(), indent=2))
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_challenge())
