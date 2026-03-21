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
    allow_origins=["http://localhost:3000", "http://localhost:3002", "http://localhost:3001"],
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
        model="llama-3.3-70b-versatile",
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
        model="llama-3.3-70b-versatile",
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
        model="llama-3.3-70b-versatile",
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

import json

@app.get("/api/dashboard/{user_id}")
async def get_dashboard(user_id: str):
    past = await recall(user_id, "all past errors, mistakes, hints, and solved problems")
    past_text = str(past) if past else "No history yet"

    system_prompt = """You are a data analysis engine for the Kernel's Slap coding mentor. 
Based on the student's history, generate a strict JSON payload for their dashboard.
The JSON must have this exact structure:
{
  "stats": {"solved": 24, "mistakes": 32, "improvement": "78%"},
  "errorData": [
    {"skill": "Recursion", "mistakes": 8},
    {"skill": "Arrays", "mistakes": 3},
    {"skill": "Loops", "mistakes": 6},
    {"skill": "Logic", "mistakes": 4},
    {"skill": "Syntax", "mistakes": 2}
  ],
  "progressData": [
    {"day": "Mon", "solved": 2, "mistakes": 5},
    {"day": "Tue", "solved": 3, "mistakes": 4},
    {"day": "Wed", "solved": 4, "mistakes": 3},
    {"day": "Thu", "solved": 5, "mistakes": 2},
    {"day": "Fri", "solved": 6, "mistakes": 1}
  ],
  "learningPath": [
    {"topic": "Arrays", "status": "done"},
    {"topic": "Loops", "status": "done"},
    {"topic": "Recursion", "status": "current"},
    {"topic": "Trees", "status": "next"},
    {"topic": "Graphs", "status": "locked"}
  ]
}
If history is empty or short, invent realistic but low generic starting numbers. However, heavily skew the data to reflect whatever mistakes and solutions are explicitly found in the history."""
    
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Student history: {past_text}"}
        ],
        response_format={"type": "json_object"}
    )
    
    return json.loads(response.choices[0].message.content)

import subprocess
import tempfile

@app.post("/api/execute")
async def execute_code(payload: dict):
    code = payload.get("code", "")
    language = payload.get("language", "python")

    if language.lower() != "python":
        return {"output": "", "error": f"Language {language} not supported locally", "status": "error"}

    # Run the python code safely in a temporary file
    with tempfile.NamedTemporaryFile(suffix=".py", delete=False, mode="w", encoding="utf-8") as temp_file:
        temp_file.write(code)
        temp_path = temp_file.name

    try:
        # Execute the python script
        result = subprocess.run(
            ["python", temp_path],
            capture_output=True,
            text=True,
            timeout=10  # 10 second timeout for safety
        )
        
        output = result.stdout
        error = result.stderr
        
        # Clean up the temp file
        import os
        os.remove(temp_path)

        if not output and not error:
            output = "Code executed successfully with no output."

        return {
            "output": output,
            "error": error,
            "status": "success" if result.returncode == 0 else "error"
        }
    except subprocess.TimeoutExpired:
        import os
        os.remove(temp_path)
        return {
            "output": "",
            "error": "Execution timed out (10s limit)",
            "status": "error"
        }
    except Exception as e:
        import os
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return {
            "output": "",
            "error": str(e),
            "status": "error"
        }