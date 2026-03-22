# 🚀 Kernel's Slap — Comprehensive Hackathon Guide

This document is your master cheat sheet for the Microsoft National Level Hackathon. It explains exactly how to test the platform, how to present the live dashboard to judges, and the deep technical explanations of how we solved the stateless learning problem.

---

## 🏗️ 1. How to Test the Website

If you want to manually test the AI's features or walk a judge through the platform, perform this exact sequence of actions:

1. **Open the App:** Navigate to `http://localhost:3000`.
2. **Type Buggy Code:** In the Code Editor, paste a Python function with an obvious flaw. 
   *(Example: Write a recursive Fibonacci function but intentionally "forget" the base case).*
3. **Test Feature 1 (Pre-mortem Check):** Click `⚠️ Pre-mortem Check`. Do not run the code first.
   * *What to show:* The AI scanning the written code, pinging your history, and actively warning you about the missing base case *before* disaster strikes.
4. **Test Feature 2 (Execution Error):** Click `▶ Run Code`.
   * *What to show:* The secure local Python sandbox executing the code and throwing the exact Error traceback in the Output panel.
5. **Test Feature 3 (Memory Hint):** Click `💡 Get Hint`.
   * *What to show:* The AI pulling up the exact error and formatting a personalized hint. If the user previously responded well to "Analogies", it will generate an Analogy hint instead of a Direct code fix.
6. **Test Feature 4 (Success Tracking):** Fix the code based on the hint, run it to get a clean output, and click `✅ Solved!`.
   * *What to show:* This button fires off the `learn()` function, immediately logging your success criteria back into Hindsight memory.

---

## 📊 2. How to Show the Dashboard Working

To get the biggest "wow" factor from the judges, you need to prove the Dashboard generates **Live Dynamic UI** rather than pre-programmed animations.

**The "Fresh Judge" Trick:**
If you show the dashboard 5 times, it will pile up 5 different histories and look chaotic. To give every judge a perfect "Day 1 to Day 2" progress curve:
1. Open `frontend/src/app/page.tsx` (Line 14) and `frontend/src/app/dashboard/page.tsx` (Line 23).
2. Change `const USER_ID = "user_1";` to `"judge_1"` (or `"judge_2"`, etc).
3. Do the code test in Section 1. 
4. Then click **View Dashboard**. 

**Explaining the Dashboard to Judges:**
* **Error DNA Radar Chart:** *"This isn't a static graphic. Our backend reaches into the Hindsight Semantic Database, compiles every syntax error I've made locally, and uses Llama-3.3 to dynamically map my specific weaknesses on this radar grid."*
* **Learning Path:** *"Most curriculum is static. Our learning path reads the Hindsight JSON payload and actively 'locks' advanced topics until the AI confirms I have completely cleared my Error DNA radar."*

---

## ⚙️ 3. How the System Actually Works (The Architecture)

Our system is broken into three asynchronous layers to ensure lightning-fast responses:
1. **The User Layer (Next.js 14 + Monaco):** A highly responsive SSR frontend mimicking VS Code. When a user types code, the Monaco editor tracks it in real time. We styled it using advanced Tailwind CSS gradients and glow effects for a premium feel.
2. **The Orchestrator (FastAPI Python):** This is the brain stem. It intercepts requests from Next.js, manages the secure local `subprocess` execution (bypassing rate-limited external APIs like Piston), and formats prompts.
3. **The AI Layer (Hindsight + Groq Llama-3.3):** The fastest LLM inference engine globally, paired directly with Vectorize.io's semantic memory database.

---

## 🧠 4. Deep Dive: How the AI "Remembers"

The core differentiator of Kernel's Slap is that it is a **Stateful AI**. It is powered by three specific Hindsight Cloud functions:

1. **`retain()` — Capturing Mistakes:** Whenever a user hits "Get Hint" on an error, FastAPI packages the `user_id`, the buggy code, the traceback, and the exact hint generated into a JSON object and POSTs it to the Hindsight cloud. It stores the *context*, not just the text.
2. **`recall()` — Active Identification:** Before the LLM generates a Pre-Mortem warning, it fires `recall(user_id, "past mistakes")`. Hindsight uses vector search to retrieve the exact JSON files of that student's past failures and injects them directly into the Llama 3.3 prompt. 
3. **`learn()` — Behavioral Adaptation:** When the user clicks "Solved!", the AI logs whether the *style* of the hint (Analogy, Socratic, Code Example) actually helped. If Code Examples consistently fail, the agent permanently alters its personality to stop giving code examples to that specific student.

---

## 🏆 5. How We Solved the Hackathon Problem (The Pitch Narrative)

**The Problem:** Platforms like LeetCode and HackerRank treat every student as a total stranger every time they log in. If you make an off-by-one array error 20 times over 3 months, standard platforms will give you the exact same generic hint 20 times. There is zero continuity, zero pattern recognition, and zero personal tracking.

**Our Massive Solution:** We eliminated "Stateless Coding." 

With Kernel's Slap, the platform *knows* you. By integrating Hindsight memory into the core execution loop, we built an AI that:
1. Actively intercepts mistakes before you run the code.
2. Builds a mathematical "Error DNA fingerprint" of your weakest syntax structures.
3. Automatically adapts its teaching communication style (Code vs Analogy) based on your psychological history.
4. Generates targeted challenges specifically designed to attack your weakest recorded topic.

Instead of generic hints for a massive crowd, Kernel's Slap provides a 1-to-1, intimate mentor that actively learns how *you* learn.

---

## 🧪 6. The 10-Step Interactive Test Suite

To definitively prove to the judges that Kernel's Slap is **Stateful** and actually tracking your history, paste these 10 code snippets into the Code Editor one by one and watch the AI's behavior change in real-time.

### Test 1: The Initial Syntax Error
* **Code:** 
  ```python
  def greet(name)
      return "Hello " + name
  greet("Alice")
  ```
* **Action:** Click `▶ Run Code` then `💡 Get Hint`.
* **System Behavior:** The code will fail (missing colon). The AI will capture this syntax error into Hindsight.

### Test 2: The Logic Error
* **Code:** 
  ```python
  count = 10
  while count > 0:
      print(count)
      # forgot to decrement count
  ```
* **Action:** Click `⚠️ Pre-mortem Check`.
* **System Behavior:** The AI scans the code, checks your history, and warns you about the infinite loop before you crash your browser. Fix it, run it, and click `✅ Solved!`.

### Test 3: The Edge Case
* **Code:**
  ```python
  def get_average(scores):
      return sum(scores) / len(scores)
  
  print(get_average([]))
  ```
* **Action:** Click `▶ Run Code` then `💡 Get Hint`.
* **System Behavior:** Throws `ZeroDivisionError`. The AI generates a personalized hint.

### Test 4: The Core Weakness (Recursion)
* **Code:**
  ```python
  def factorial(n):
      return n * factorial(n-1)
  ```
* **Action:** Click `▶ Run Code` then `💡 Get Hint`.
* **System Behavior:** Throws a RecursionError. The AI gives you a hint. *Do not click Solved!*

### Test 5: The Repeating Pattern
* **Code:**
  ```python
  def fibonacci(n):
      return fibonacci(n-1) + fibonacci(n-2)
  ```
* **Action:** Click `⚠️ Pre-mortem Check`.
* **System Behavior:** **The Jaw-Drop Moment.** The AI recalls Test 4 from Hindsight. Instead of a generic warning, it explicitly says: *"I see you are struggling with recursion again. Just like your factorial function, you forgot the base case here!"*

### Test 6: Hint Style Adaptation
* **Code:** (Leave the Fibonacci code)
* **Action:** Run it to crash, then click `💡 Get Hint`.
* **System Behavior:** Because previous direct hints didn't lead to a "Solved!" click, the AI adapts its personality. It will switch to an **Analogy** or **Socratic** question to try a new teaching method on you.

### Test 7: Resolving the Weakness
* **Code:**
  ```python
  def fibonacci(n):
      if n <= 1: return n
      return fibonacci(n-1) + fibonacci(n-2)
  print(fibonacci(5))
  ```
* **Action:** Click `▶ Run Code` then `✅ Solved!`.
* **System Behavior:** The code succeeds. `learn()` routes the success back to Hindsight, logging that the Analogy hint style worked for you.

### Test 8: Generating a Custom Challenge
* **Action:** Delete all code. Click `🎯 Generate Targeted Challenge`.
* **System Behavior:** The LLM checks your Hindsight vector memory. Seeing the heavy struggle with Recursion and ZeroDivision, it will dynamically invent a *brand new Recursion problem* with edge cases specifically targeted to your exact weaknesses.

### Test 9: Solving the Custom Challenge
* **Code:** Write the correct solution to the challenge it just gave you.
* **Action:** Click `▶ Run Code` then `✅ Solved!`.
* **System Behavior:** The system logs your absolute mastery of the topic.

### Test 10: The Dashboard Proof
* **Action:** Click `View Dashboard`.
* **System Behavior:** Watch the Llama-3.3 model synthesize the JSON live. Your **Error DNA Radar Chart** will show massive spikes in Recursion and Syntax errors. Your Weekly Progress bar will show your mistakes vs solved ratio exactly mapping to the 9 tests you just performed! The Dynamic Learning Path will show 'Recursion' transitioning to 'Done'.
