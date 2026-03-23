import httpx
import asyncio

async def main():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://emkc.org/api/v2/piston/execute",
            json={
                "language": "python",
                "version": "*",
                "files": [{"content": "print('hello')"}],
                "compile_timeout": 10000,
                "run_timeout": 3000,
            },
            timeout=30
        )
        print(response.status_code)
        print(response.json())

asyncio.run(main())
 