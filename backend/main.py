from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from dotenv import load_dotenv
import os
import httpx
import json
import hashlib
import datetime
import subprocess
import tempfile

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

BASE_DIR = os.path.dirname(__file__)
USERS_FILE = os.path.join(BASE_DIR, "users.json")
STATS_FILE = os.path.join(BASE_DIR, "user_stats.json")

# ─── Error categories we track ────────────────────────
ERROR_CATEGORIES = ["Recursion", "Syntax", "Logic", "Arrays", "Edge Cases", "Loops", "Strings", "Other"]

# ─── User Store ───────────────────────────────────────
def load_users() -> dict:
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, "r") as f:
        return json.load(f)

def save_users(users: dict):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# ─── Real Stats Store ─────────────────────────────────
def load_stats() -> dict:
    if not os.path.exists(STATS_FILE):
        return {}
    with open(STATS_FILE, "r") as f:
        return json.load(f)

def save_stats(stats: dict):
    with open(STATS_FILE, "w") as f:
        json.dump(stats, f, indent=2)

def get_user_stats(user_id: str) -> dict:
    stats = load_stats()
    if user_id not in stats:
        stats[user_id] = {
            "solved_count": 0,
            "hints_used": 0,
            "mistakes_by_category": {cat: 0 for cat in ERROR_CATEGORIES},
            "daily_counts": {},
            "recent_mistakes": [],  # list of {category, error, code_snippet, date}
            "last_session": None
        }
        save_stats(stats)
    return stats[user_id]

def update_user_stats(user_id: str, user_stats: dict):
    stats = load_stats()
    stats[user_id] = user_stats
    save_stats(stats)

def today_str() -> str:
    return datetime.date.today().isoformat()

def ensure_today(user_stats: dict) -> dict:
    t = today_str()
    if t not in user_stats["daily_counts"]:
        user_stats["daily_counts"][t] = {"solved": 0, "mistakes": 0}
    return user_stats

# ─── Hindsight Memory Functions ───────────────────────
async def retain(user_id: str, data: dict):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                f"{HINDSIGHT_BASE_URL}/retain",
                headers={"Authorization": f"Bearer {HINDSIGHT_API_KEY}"},
                json={"user_id": user_id, "data": data}
            )
    except Exception:
        pass  # Don't fail if Hindsight is down

async def recall(user_id: str, query: str):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                f"{HINDSIGHT_BASE_URL}/recall",
                headers={"Authorization": f"Bearer {HINDSIGHT_API_KEY}"},
                json={"user_id": user_id, "query": query, "top_k": 5}
            )
            return response.json()
    except Exception:
        return None

async def learn(user_id: str, data: dict):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                f"{HINDSIGHT_BASE_URL}/learn",
                headers={"Authorization": f"Bearer {HINDSIGHT_API_KEY}"},
                json={"user_id": user_id, "data": data}
            )
    except Exception:
        pass

# ─── Error Category Detection ─────────────────────────
def detect_category_from_error(error_text: str) -> str:
    """Fast local detection from error type in stderr"""
    error_lower = error_text.lower()
    if "recursionerror" in error_lower or "maximum recursion" in error_lower:
        return "Recursion"
    if "syntaxerror" in error_lower or "indentationerror" in error_lower or "invalidsyntax" in error_lower:
        return "Syntax"
    if "zerodivisionerror" in error_lower or "indexerror" in error_lower or "keyerror" in error_lower:
        return "Edge Cases"
    if "attributeerror" in error_lower or "typeerror" in error_lower or "nameerror" in error_lower:
        return "Logic"
    if "list" in error_lower or "index" in error_lower or "array" in error_lower:
        return "Arrays"
    if "string" in error_lower or "encode" in error_lower or "decode" in error_lower:
        return "Strings"
    return None  # fallback to LLM categorization

async def categorize_with_llm(code: str, error: str) -> str:
    """Use LLM to categorize if local detection fails"""
    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{
                "role": "user",
                "content": f"""Categorize this coding error into EXACTLY ONE of these categories: {', '.join(ERROR_CATEGORIES)}
Code: {code[:300]}
Error: {error[:200]}
Reply with ONLY the category name, nothing else."""
            }],
            max_tokens=10
        )
        cat = response.choices[0].message.content.strip()
        return cat if cat in ERROR_CATEGORIES else "Other"
    except Exception:
        return "Other"

# ─── Routes ───────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "Kernel's Slap AI running!"}

# ─── Auth ─────────────────────────────────────────────
@app.post("/api/register")
async def register(payload: dict):
    username = payload.get("username", "").strip().lower()
    password = payload.get("password", "")
    display_name = payload.get("display_name", username)

    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
    if len(password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")

    users = load_users()
    if username in users:
        raise HTTPException(status_code=409, detail="Username already taken")

    user_id = f"user_{username}"
    users[username] = {
        "user_id": user_id,
        "display_name": display_name,
        "password_hash": hash_password(password),
    }
    save_users(users)

    # Initialize stats for this user
    get_user_stats(user_id)

    return {"user_id": user_id, "username": username, "display_name": display_name}

@app.post("/api/login")
async def login(payload: dict):
    username = payload.get("username", "").strip().lower()
    password = payload.get("password", "")

    users = load_users()
    user = users.get(username)

    if not user or user["password_hash"] != hash_password(password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return {
        "user_id": user["user_id"],
        "username": username,
        "display_name": user["display_name"],
    }

# ─── Hint (with real mistake tracking) ───────────────
@app.post("/api/hint")
async def get_hint(payload: dict):
    user_id = payload.get("user_id", "user_1")
    code = payload.get("code", "")
    error = payload.get("error", "")

    # Step 1 — Detect error category (fast local, fallback LLM)
    category = detect_category_from_error(error)
    if not category:
        category = await categorize_with_llm(code, error)

    # Step 2 — Recall past mistakes from Hindsight
    past = await recall(user_id, f"mistakes with {error} {category}")
    past_text = str(past) if past else "No past mistakes found"

    # Step 3 — Generate personalised hint
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": f"""You are a personal coding mentor for a student.
This student's past mistakes (from memory): {past_text}
This error is categorized as: {category}

Give an extremely short, smart response formatted exactly like this:
Error: [Short description of the error]
Fix: [Short description of the fix]
Why: [Short explanation of why this happens]

Do NOT give the full solution code. Keep it highly concise."""
            },
            {
                "role": "user",
                "content": f"My code:\n{code}\n\nError:\n{error}\n\nGive me a hint."
            }
        ],
        max_tokens=300
    )
    hint = response.choices[0].message.content

    # Step 4 — Save REAL stats to local file
    user_stats = get_user_stats(user_id)
    user_stats = ensure_today(user_stats)
    user_stats["hints_used"] = user_stats.get("hints_used", 0) + 1
    user_stats["mistakes_by_category"][category] = user_stats["mistakes_by_category"].get(category, 0) + 1
    user_stats["daily_counts"][today_str()]["mistakes"] += 1
    user_stats["last_session"] = datetime.datetime.now().isoformat()

    # Keep last 10 mistakes for the timeline
    recent = user_stats.get("recent_mistakes", [])
    recent.insert(0, {
        "category": category,
        "error": error[:120],
        "code_snippet": code[:100],
        "date": datetime.datetime.now().strftime("%b %d, %H:%M")
    })
    user_stats["recent_mistakes"] = recent[:10]
    update_user_stats(user_id, user_stats)

    # Step 5 — Also retain to Hindsight (async, non-blocking)
    await retain(user_id, {
        "event": "mistake",
        "category": category,
        "code": code[:500],
        "error": error,
        "hint_given": hint
    })

    return {
        "hint": hint, 
        "category": category, 
        "mistake_count": user_stats["mistakes_by_category"][category]
    }

# ─── Pre-mortem ───────────────────────────────────────
@app.post("/api/premortem")
async def premortem(payload: dict):
    user_id = payload.get("user_id", "user_1")
    code = payload.get("code", "")

    # Get real weakness from stats
    user_stats = get_user_stats(user_id)
    mistakes = user_stats["mistakes_by_category"]
    top_weakness = max(mistakes, key=mistakes.get) if any(mistakes.values()) else "general errors"
    total_mistakes = sum(mistakes.values())

    past = await recall(user_id, "common mistakes errors")
    past_text = str(past) if past else "No history yet"

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": f"""You are a coding mentor doing a pre-mortem review.
Student's top weakness category: {top_weakness} ({mistakes.get(top_weakness, 0)} mistakes here)
Past mistakes context: {past_text}

Analyze the CURRENT code for potential bugs before they run it.
CRITICAL: Keep it extremely short (1 sentence max). Example: "You may forget indentation inside the loop."
If no errors are obvious, return: "Looks safe, but watch out for {top_weakness} based on your past."
"""
            },
            {
                "role": "user",
                "content": f"My CURRENT code:\n{code}\n\nWhat might go wrong in this specific code?"
            }
        ],
        max_tokens=100
    )

    warning = response.choices[0].message.content
    return {"warning": warning, "top_weakness": top_weakness}

# ─── Solve (with real stats) ──────────────────────────
@app.post("/api/solve")
async def solved(payload: dict):
    user_id = payload.get("user_id", "user_1")
    problem = payload.get("problem", "")
    hint_helped = payload.get("hint_helped", True)

    # Real stat tracking
    user_stats = get_user_stats(user_id)
    user_stats = ensure_today(user_stats)
    user_stats["solved_count"] = user_stats.get("solved_count", 0) + 1
    user_stats["daily_counts"][today_str()]["solved"] += 1
    user_stats["last_session"] = datetime.datetime.now().isoformat()
    update_user_stats(user_id, user_stats)

    # Also learn in Hindsight
    await learn(user_id, {"event": "solved", "problem": problem[:300], "hint_helped": hint_helped})
    await retain(user_id, {"event": "success", "problem": problem[:300]})

    return {"status": "Memory updated!", "total_solved": user_stats["solved_count"]}

# ─── Challenge Generator (NEW) ────────────────────────
@app.post("/api/challenge")
async def generate_challenge(payload: dict):
    user_id = payload.get("user_id", "user_1")

    # Get real weakness from stats
    user_stats = get_user_stats(user_id)
    mistakes = user_stats["mistakes_by_category"]
    recent_mistakes = user_stats.get("recent_mistakes", [])
    total_mistakes = sum(mistakes.values())

    # Find the top weakness
    if total_mistakes == 0:
        top_weakness = "general Python programming"
        difficulty = "easy"
        recent_context = ""
    else:
        top_weakness = max(mistakes, key=mistakes.get)
        mistake_count = mistakes[top_weakness]
        difficulty = "hard" if mistake_count >= 5 else "medium" if mistake_count >= 2 else "easy"
        
        # Format recent mistakes for context
        recent_context = "\n".join([
            f"- Error: {m['error']} in code: {m['code_snippet']}" 
            for m in recent_mistakes if m['category'] == top_weakness
        ])[:500]

    # Also pull Hindsight context
    past = await recall(user_id, f"mistakes with {top_weakness}")
    past_context = str(past)[:400] if past else ""

    prompt = f"""You are a coding mentor generating a PERSONALIZED "Fill-in-the-blank" (cloze) Python challenge.
The student is currently struggling with: {top_weakness}
Their specific recent mistakes in this category:
{recent_context}

Other past context: {past_context}

Generate a {difficulty} Python coding challenge that targets this exact weakness.
The challenge must be a 'fill-in-the-blank' type where you provide a code snippet with one or more '___' (three underscores) placeholders.

Return ONLY a JSON object with this structure:
{{
  "challenge": "Short description of the task",
  "code_snippet": "The Python code with ___ placeholders",
  "hint": "A small hint about what goes in the blanks",
  "solution": "The full correct code"
}}
"""

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        max_tokens=600
    )

    try:
        data = json.loads(response.choices[0].message.content)
        return {
            "challenge": data.get("challenge", "Fill in the blanks!"),
            "code_snippet": data.get("code_snippet", "# Error generating code"),
            "hint": data.get("hint", ""),
            "solution": data.get("solution", ""),
            "category": top_weakness,
            "difficulty": difficulty,
            "mistake_count": mistakes.get(top_weakness, 0)
        }
    except Exception:
        return {"error": "Failed to parse AI response"}

# ─── Greeting ─────────────────────────────────────────
@app.get("/api/greeting/{user_id}")
async def greeting(user_id: str):
    user_stats = get_user_stats(user_id)
    solved = user_stats["solved_count"]
    mistakes = sum(user_stats["mistakes_by_category"].values())
    top_weakness = max(user_stats["mistakes_by_category"], key=user_stats["mistakes_by_category"].get) if mistakes > 0 else None

    context = f"Solved: {solved} problems. Total mistakes tracked: {mistakes}."
    if top_weakness and user_stats["mistakes_by_category"][top_weakness] > 0:
        context += f" Top weakness: {top_weakness} ({user_stats['mistakes_by_category'][top_weakness]} mistakes)."

    past = await recall(user_id, "last session problems mistakes")
    if past:
        context += f" Recent activity: {str(past)[:200]}"

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are a friendly coding mentor. Give a personalized welcome message based on actual student stats. Max 2 sentences. Be specific about their numbers and weakness."
            },
            {
                "role": "user",
                "content": f"Student stats: {context}"
            }
        ],
        max_tokens=80
    )

    return {"greeting": response.choices[0].message.content}

# ─── Dashboard (REAL DATA) ────────────────────────────
@app.get("/api/dashboard/{user_id}")
async def get_dashboard(user_id: str):
    user_stats = get_user_stats(user_id)

    # ── REAL stats ──
    solved = user_stats["solved_count"]
    mistakes_by_cat = user_stats["mistakes_by_category"]
    total_mistakes = sum(mistakes_by_cat.values())
    improvement = 0
    if total_mistakes > 0 and solved > 0:
        improvement = min(99, int((solved / (solved + total_mistakes)) * 100))

    # ── REAL error DNA (only show categories with > 0 mistakes) ──
    error_data = [
        {"skill": cat, "mistakes": count}
        for cat, count in mistakes_by_cat.items()
        if count > 0
    ]
    if not error_data:
        error_data = [{"skill": "No mistakes yet", "mistakes": 0}]

    # ── REAL weekly progress (last 7 days) ──
    progress_data = []
    today = datetime.date.today()
    for i in range(6, -1, -1):
        day = today - datetime.timedelta(days=i)
        day_str = day.isoformat()
        day_label = day.strftime("%a")
        counts = user_stats["daily_counts"].get(day_str, {"solved": 0, "mistakes": 0})
        progress_data.append({"day": day_label, "solved": counts["solved"], "mistakes": counts["mistakes"]})

    # ── REAL recent mistakes ──
    recent_mistakes = user_stats.get("recent_mistakes", [])

    # ── LLM only for learning path (based on REAL weaknesses) ──
    top_cats = sorted(mistakes_by_cat.items(), key=lambda x: x[1], reverse=True)
    weakness_context = ", ".join([f"{cat}: {n} mistakes" for cat, n in top_cats if n > 0]) or "No mistakes yet"

    learning_path_prompt = f"""Based on this student's REAL mistake data:
{weakness_context}
Solved: {solved} problems

Generate a JSON array of exactly 5-6 learning topics in order of priority.
Each item: {{"topic": "...", "status": "done"|"current"|"next"|"locked"}}
Topics with 0 mistakes and solved >= 2 should be "done".
The topic with MOST mistakes should be "current".
Return ONLY valid JSON array, nothing else."""

    try:
        lp_response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": learning_path_prompt}],
            response_format={"type": "json_object"},
            max_tokens=300
        )
        lp_json = json.loads(lp_response.choices[0].message.content)
        # Handle both {"items": [...]} and [...] responses
        if isinstance(lp_json, list):
            learning_path = lp_json
        elif "items" in lp_json:
            learning_path = lp_json["items"]
        elif "learning_path" in lp_json:
            learning_path = lp_json["learning_path"]
        else:
            # Get first list value
            learning_path = next((v for v in lp_json.values() if isinstance(v, list)), [])
    except Exception:
        learning_path = [
            {"topic": "Syntax", "status": "current"},
            {"topic": "Logic", "status": "next"},
            {"topic": "Recursion", "status": "locked"},
        ]

    return {
        "stats": {
            "solved": solved,
            "mistakes": total_mistakes,
            "improvement": f"{improvement}%"
        },
        "errorData": error_data,
        "progressData": progress_data,
        "learningPath": learning_path,
        "recentMistakes": recent_mistakes[:5],
        "topWeakness": top_cats[0][0] if top_cats and top_cats[0][1] > 0 else None,
    }

# ─── Code Execution ───────────────────────────────────
@app.post("/api/execute")
async def execute_code(payload: dict):
    code = payload.get("code", "")
    language = payload.get("language", "python")

    if language.lower() != "python":
        return {"output": "", "error": f"Language {language} not supported", "status": "error", "error_category": None}

    temp_path = None
    with tempfile.NamedTemporaryFile(suffix=".py", delete=False, mode="w", encoding="utf-8") as temp_file:
        temp_file.write(code)
        temp_path = temp_file.name

    try:
        result = subprocess.run(
            ["python", temp_path],
            capture_output=True,
            text=True,
            timeout=10
        )
        output = result.stdout
        error = result.stderr

        # Detect error category from stderr for instant feedback
        error_category = detect_category_from_error(error) if error else None

        os.remove(temp_path)

        if not output and not error:
            output = "Code executed successfully with no output."

        return {
            "output": output,
            "error": error,
            "status": "success" if result.returncode == 0 else "error",
            "error_category": error_category
        }
    except subprocess.TimeoutExpired:
        os.remove(temp_path)
        return {"output": "", "error": "Execution timed out (10s limit)", "status": "error", "error_category": "Logic"}
    except Exception as e:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
        return {"output": "", "error": str(e), "status": "error", "error_category": "Other"}