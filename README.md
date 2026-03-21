<h1 align="center">
  Kernel's Slap 🧠<br>
  <img src="https://img.shields.io/badge/Powered%20By-Hindsight%20Memory-8A2BE2?style=for-the-badge" />
</h1>

<p align="center">
  <strong>An AI Coding Mentor That Remembers How You Think, Fail, and Improve.</strong><br>
  <em>Built for the Microsoft National Level Hackathon (Problem #3)</em>
</p>

## 🔥 The Problem
Coding platforms treat every student like a stranger. Every session, every problem, every hint is generated identically for 10,000 different students. 

When you make an off-by-one error on Monday, and the exact same error on Wednesday, standard platforms have absolutely zero continuity. They don't detect the pattern. They don't track your learning trajectory. They don't adapt to your learning style.

## 🚀 The Solution: Kernel's Slap
Kernel's Slap is a stateful, personalized AI mentor. Powered by **Hindsight Memory**, it actively remembers every mistake, success, and hint you interact with across your entire lifetime on the platform.

### ✨ Key Features
* ⚠️ **Pre-Mortem Warning System:** The agent scans your code *before* you run it, cross-references it with your historical `Error DNA`, and warns you about bugs you are statistically likely to make.
* 🧬 **Real-Time Error DNA Dashboard:** A live-synthesized radar chart and progress tracker built natively from your semantic memory, highlighting your precise weaknesses (e.g., Recursion vs. Arrays).
* 💡 **Hint Style Learning:** The LLM actively monitors which hint styles (Direct, Analogy, Code Example, Socratic) actually helped you solve the problem, and permanently adapts its teaching style to match your brain.
* 🎯 **Dynamic Challenge Generation:** Skips static curriculums to instantly generate custom Python challenges deeply targeted at the algorithms you fail most often.

## 🛠️ System Architecture

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | `Next.js 14`, `Tailwind CSS`, `Monaco` | Dark-mode IDE, Live Dashboard, Syntax Editor |
| **Backend** | `FastAPI (Python)` | Async API endpoint orchestration |
| **AI Engine** | `Groq (Llama-3.3-70b)` | Ultra-fast semantic reasoning and JSON synthesis |
| **Memory** | `Hindsight Cloud` | `retain()`, `recall()`, and `learn()` logic |
| **Execution** | `Python Subprocess` | Secure, local sandbox code execution |

## ⚙️ How to Run Locally

### 1. Start the Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:3000` to start interacting with your personalized mentor.
