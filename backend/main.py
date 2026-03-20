from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from dotenv import load_dotenv
import os
import httpx

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
HINDSIGHT_API_KEY = os.getenv("HINDSIGHT_API_KEY")
HINDSIGHT_BASE_URL = "https://api.hindsight.vectorize.io/v1"

# ─── Hindsight Memory Functions ───────────────────────

async def retain(user_id: str, data: dict):
    async with httpx.AsyncClient() as client:
        await client.post(
            f"{HINDSIGHT_BASE_URL}/retain",
            headers={"Authorization": f"Bearer {HINDSIGHT_API_KEY}"},
            json={"user_id": user_id, "data": data}
        )

async def recall(user_id: str, query: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{HINDSIGHT_BASE_URL}/recall",
            headers={"Authorization": f"Bearer {HINDSIGHT_API_KEY}"},
            json={"user_id": user_id, "query": query, "top_k": 5}
        )
        return response.json()

async def learn(user_id: str, data: dict):
    async with httpx.AsyncClient() as client:
        await client.post(
            f"{HINDSIGHT_BASE_URL}/learn",
            headers={"Authorization": f"Bearer {HINDSIGHT_API_KEY}"},
            json={"user_id": user_id, "data": data}
        )

# ─── Routes ───────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "CodeMentor AI running!"}

@app.post("/api/hint")
async def get_hint(payload: dict):
    user_id = payload.get("user_id", "user_1")
    code = payload.get("code", "")
    error = payload.get("error", "")

    # Step 1 — Recall user past mistakes
    past = await recall(user_id, f"mistakes with {error}")
    past_text = str(past) if past else "No past mistakes found"

    # Step 2 — Generate personalised hint
    response = groq_client.chat.completions.create(
        model="qwen-qwq-32b",
        messages=[
            {
                "role": "system",
                "content": f"""You are a personal coding mentor.
This student's past mistakes: {past_text}
Give a short personalised hint based on their history.
Reference their past mistakes if relevant."""
            },
            {
                "role": "user",
                "content": f"My code:\n{code}\n\nError:\n{error}\n\nGive me a hint."
            }
        ]
    )

    hint = response.choices[0].message.content

    # Step 3 — Retain this mistake
    await retain(user_id, {
        "event": "mistake",
        "code": code,
        "error": error,
        "hint_given": hint
    })

    return {"hint": hint}

@app.post("/api/premortem")
async def premortem(payload: dict):
    user_id = payload.get("user_id", "user_1")
    code = payload.get("code", "")

    # Recall past errors
    past = await recall(user_id, "common mistakes errors")
    past_text = str(past) if past else "No history yet"

    response = groq_client.chat.completions.create(
        model="qwen-qwq-32b",
        messages=[
            {
                "role": "system",
                "content": f"""You are a coding mentor.
Student's past mistakes: {past_text}
Look at their code and warn them about likely bugs BEFORE they run it.
Keep it to 1-2 lines only. Be specific."""
            },
            {
                "role": "user",
                "content": f"My code:\n{code}\n\nWhat might go wrong?"
            }
        ]
    )

    warning = response.choices[0].message.content
    return {"warning": warning}

@app.post("/api/solve")
async def solved(payload: dict):
    user_id = payload.get("user_id", "user_1")
    problem = payload.get("problem", "")
    hint_helped = payload.get("hint_helped", True)

    # Learn from outcome
    await learn(user_id, {
        "event": "solved",
        "problem": problem,
        "hint_helped": hint_helped
    })

    # Retain success
    await retain(user_id, {
        "event": "success",
        "problem": problem
    })

    return {"status": "Memory updated!"}

@app.get("/api/greeting/{user_id}")
async def greeting(user_id: str):
    past = await recall(user_id, "last session problems mistakes")
    past_text = str(past) if past else "No history yet"

    response = groq_client.chat.completions.create(
        model="qwen-qwq-32b",
        messages=[
            {
                "role": "system",
                "content": "You are a friendly coding mentor. Give a short welcome back message based on student history. Max 2 sentences."
            },
            {
                "role": "user",
                "content": f"Student history: {past_text}"
            }
        ]
    )

    return {"greeting": response.choices[0].message.content}