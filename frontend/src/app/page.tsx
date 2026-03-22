"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Editor from "@monaco-editor/react";
import { Brain, Zap, Target, BarChart2, CheckCircle, AlertTriangle, Lightbulb, Play, Code, Flame } from "lucide-react";
import { useAuth } from "./context/AuthContext";

const CATEGORY_COLORS: Record<string, string> = {
  Recursion:    "bg-red-900/60 border-red-600/50 text-red-300",
  Syntax:       "bg-yellow-900/60 border-yellow-600/50 text-yellow-300",
  Logic:        "bg-orange-900/60 border-orange-600/50 text-orange-300",
  Arrays:       "bg-blue-900/60 border-blue-600/50 text-blue-300",
  "Edge Cases": "bg-pink-900/60 border-pink-600/50 text-pink-300",
  Loops:        "bg-cyan-900/60 border-cyan-600/50 text-cyan-300",
  Strings:      "bg-teal-900/60 border-teal-600/50 text-teal-300",
  Other:        "bg-gray-800/60 border-gray-600/50 text-gray-300",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy:   "text-green-400 bg-green-900/40 border-green-700/50",
  medium: "text-amber-400 bg-amber-900/40 border-amber-700/50",
  hard:   "text-red-400 bg-red-900/40 border-red-700/50",
};

export default function Home() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();

  const [code, setCode] = useState("# Write your code here\n");
  const [hint, setHint] = useState("");
  const [hintCategory, setHintCategory] = useState("");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [outputError, setOutputError] = useState("");
  const [runCategory, setRunCategory] = useState(""); // category detected from running code
  const [solvedCount, setSolvedCount] = useState<number | null>(null);
  const [hintMistakeCount, setHintMistakeCount] = useState<number>(0);

  const API = "";

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <main className="ks-bg min-h-screen flex items-center justify-center">
        <span className="spinner" />
      </main>
    );
  }

  const USER_ID = user.user_id;

  const runCode = async () => {
    setLoading(true);
    setRunCategory("");
    const res = await fetch(`${API}/api/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language: "python" }),
    });
    const data = await res.json();
    setOutput(data.output || "");
    setOutputError(data.error || "");
    if (data.error_category) setRunCategory(data.error_category);
    setLoading(false);
  };

  const getHint = async () => {
    setLoading(true);
    const errorToSend = outputError || "general error";
    const res = await fetch(`${API}/api/hint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: USER_ID, code, error: errorToSend }),
    });
    const data = await res.json();
    setHint(data.hint);
    setHintCategory(data.category || "");
    setHintMistakeCount(data.mistake_count || 0);
    setLoading(false);
  };

  const getWarning = async () => {
    setLoading(true);
    const res = await fetch(`${API}/api/premortem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: USER_ID, code }),
    });
    const data = await res.json();
    setWarning(data.warning);
    setLoading(false);
  };

  const markSolved = async () => {
    setLoading(true);
    const res = await fetch(`${API}/api/solve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: USER_ID, problem: code, hint_helped: true }),
    });
    const data = await res.json();
    setSolvedCount(data.total_solved);
    // Clear the panels to show the celebration
    setHint("");
    setWarning("");
    setHintCategory("");
    setHintMistakeCount(0);
    setRunCategory("");
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const catColor = (cat: string) => CATEGORY_COLORS[cat] || CATEGORY_COLORS["Other"];

  const isEmpty = !hint && !warning && !loading && !output && !outputError && solvedCount === null;

  return (
    <main className="ks-bg min-h-screen text-white p-5">
      <div className="glow glow-purple" style={{ top: "5%", left: "-5%" }} />
      <div className="glow glow-pink" style={{ bottom: "10%", right: "-5%" }} />

      {/* Header */}
      <div className="flex items-center justify-between xl:items-start mb-5 relative z-10 fade-in">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent tracking-tight">
              Kernel&apos;s Slap
            </h1>
            <Brain className="w-8 h-8 text-pink-400" />
          </div>
          <p className="text-sm font-semibold text-gray-300 flex items-center gap-1.5 mt-1">
            <Zap className="w-4 h-4 text-yellow-400" /> Predicts coding mistakes BEFORE execution using your past behavior
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-gray-900/60 border border-gray-700 rounded-xl px-3 py-1.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
              {user.display_name[0].toUpperCase()}
            </div>
            <span className="text-sm text-gray-300 font-medium">{user.display_name}</span>
          </div>
          <Link href="/challenge" className="flex items-center gap-1.5 text-sm bg-violet-600/80 hover:bg-violet-500 transition-all shadow-lg shadow-violet-500/20 px-4 py-2 rounded-xl font-bold border border-violet-500/30">
            Challenges <Target className="w-4 h-4" />
          </Link>
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm bg-purple-600/80 hover:bg-purple-500 transition-all shadow-lg shadow-purple-500/20 px-4 py-2 rounded-xl font-bold border border-purple-500/30">
            Dashboard <BarChart2 className="w-4 h-4" />
          </Link>
          <button onClick={handleLogout} className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl font-medium transition-all border border-gray-700">
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 relative z-10">
        {/* Left: Editor */}
        <div className="flex flex-col gap-3 fade-in">
          <div className="glass-card overflow-hidden">
            <div className="bg-gray-900/80 px-4 py-2.5 text-sm text-gray-400 font-medium border-b border-gray-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-green-400" /> Python Editor
              </div>
              <div className="text-xs font-bold text-gray-500 tracking-wider">
                Predict → Run → Learn → Improve
              </div>
            </div>
            <Editor
              height="360px"
              defaultLanguage="python"
              theme="vs-dark"
              onChange={(val) => {
                setCode(val || "");
                setWarning("");
                setHint("");
                setHintMistakeCount(0);
                setOutput("");
                setOutputError("");
                setRunCategory("");
              }}
              options={{ fontSize: 14, minimap: { enabled: false }, padding: { top: 12 }, scrollBeyondLastLine: false }}
            />
          </div>

          {/* Buttons — 2x3 grid */}
          <div className="grid grid-cols-3 gap-2">
            <button onClick={runCode} className="flex items-center justify-center gap-2 bg-emerald-700/80 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-bold transition-all hover:-translate-y-0.5 shadow-lg shadow-emerald-900/30 border border-emerald-600/30 text-sm">
              <Play className="w-4 h-4" /> Run
            </button>
            <button onClick={getWarning} className="flex items-center justify-center gap-2 bg-amber-700/80 hover:bg-amber-600 text-white py-2.5 rounded-xl font-bold transition-all hover:-translate-y-0.5 shadow-lg shadow-amber-900/30 border border-amber-600/30 text-sm">
              <AlertTriangle className="w-4 h-4" /> Pre-mortem
            </button>
            <button onClick={getHint} className="flex items-center justify-center gap-2 bg-purple-700/80 hover:bg-purple-600 text-white py-2.5 rounded-xl font-bold transition-all hover:-translate-y-0.5 shadow-lg shadow-purple-900/30 border border-purple-600/30 text-sm">
              <Lightbulb className="w-4 h-4" /> Get Hint
            </button>
            <button onClick={markSolved} className="flex items-center justify-center gap-2 col-span-3 bg-blue-700/80 hover:bg-blue-600 text-white py-2.5 rounded-xl font-bold transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-900/30 border border-blue-600/30 text-sm">
              <CheckCircle className="w-4 h-4" /> Mark as Solved!
            </button>
          </div>
        </div>

        {/* Right: AI Panel */}
        <div className="flex flex-col gap-3 fade-in-delay">

          {/* Loading */}
          {loading && (
            <div className="glass-card p-5 flex items-center gap-3">
              <span className="spinner" />
              <p className="text-gray-400 text-sm">AI is thinking using your memory...</p>
            </div>
          )}

          {/* Solved celebration */}
          {solvedCount !== null && !loading && (
            <div className="bg-gradient-to-br from-green-950/70 to-emerald-950/40 border border-green-600/50 rounded-xl p-4">
              <h3 className="text-green-400 font-bold mb-1 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Problem Solved!</h3>
              <p className="text-green-200 text-sm">Memory updated. You&apos;ve now solved <strong>{solvedCount}</strong> problem{solvedCount !== 1 ? "s" : ""}!</p>
              <button onClick={() => setSolvedCount(null)} className="text-xs text-green-500 mt-2 hover:text-green-300 transition-colors">← Dismiss</button>
            </div>
          )}

          {/* Run Output */}
          {(output || outputError) && !loading && (
            <div className="glass-card p-4">
              {outputError && (
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-red-400 font-bold text-sm flex items-center gap-1"><Zap className="w-4 h-4" /> Error Detected</span>
                  {runCategory && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${catColor(runCategory)}`}>
                      {runCategory}
                    </span>
                  )}
                </div>
              )}
              {output && (
                <>
                  <h3 className="text-gray-400 font-bold mb-1 text-sm flex items-center gap-1">
                    <Play className="w-3 h-3 text-green-400" /> Output
                  </h3>
                  <pre className="text-green-400 text-sm whitespace-pre-wrap font-mono">{output}</pre>
                </>
              )}
              {outputError && (
                <pre className="text-red-400 text-xs whitespace-pre-wrap font-mono mt-1 border-t border-gray-800 pt-2">
                  {outputError}
                </pre>
              )}
              {runCategory && outputError && (
                <div className="text-gray-500 text-xs mt-2 flex items-center gap-1.5">
                  <Lightbulb className="w-3 h-3 text-purple-400" /> Click <strong>Get Hint</strong> — AI will give personalized advice for your <strong>{runCategory}</strong> weakness
                </div>
              )}
            </div>
          )}

          {/* Warning Box */}
          {warning && !loading && (
            <div className="bg-amber-950/60 border border-amber-600/50 rounded-xl p-4 backdrop-blur-sm">
              <h3 className="text-amber-400 font-bold mb-2 flex items-center gap-2">
                ⚠️ Prediction <span className="text-amber-200/70 text-xs font-normal">(based on your past mistakes)</span>
              </h3>
              <p className="text-amber-200 text-sm leading-relaxed">{warning}</p>
              <div className="mt-3 flex items-center gap-1 text-amber-500/80 text-xs font-bold bg-amber-950 px-2 py-1 rounded w-fit border border-amber-900/50">
                🧠 Learned from your history
              </div>
            </div>
          )}

          {/* Hint Box */}
          {hint && !loading && (
            <div className="bg-purple-950/60 border border-purple-500/40 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-purple-400 font-bold">💡 Personalized Hint</h3>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 mb-3">
                <p className="text-purple-200 text-sm leading-relaxed font-mono whitespace-pre-wrap">{hint}</p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 bg-purple-900/30 px-3 py-1.5 rounded-lg border border-purple-800/40 fit-content w-fit">
                  <span className="text-purple-400 text-sm">🧠 Stored:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${catColor(hintCategory)}`}>
                    {hintCategory} error (count: {hintMistakeCount})
                  </span>
                </div>
                {hintMistakeCount >= 3 && (
                  <div className="flex items-center gap-2 bg-red-950/40 px-3 py-1.5 rounded-lg border border-red-800/40 w-fit">
                    <span className="text-red-400 text-sm">🔥 Pattern Detected:</span>
                    <span className="text-red-200 text-xs">You frequently make syntax mistakes in {hintCategory.toLowerCase()}</span>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* Empty state */}
          {isEmpty && (
            <div className="glass-card p-8 text-center">
              <Brain className="w-16 h-16 mx-auto text-purple-400 mb-3" />
              <p className="text-gray-300 font-semibold mb-1">Welcome, {user.display_name}!</p>
              <p className="text-gray-500 text-sm mb-4">Write code, run it, then use the AI buttons below.</p>
              <div className="space-y-2">
                <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-lg p-2.5 text-left">
                  <p className="text-emerald-400 text-xs font-semibold flex items-center gap-1"><Play className="w-3 h-3"/> Run → <AlertTriangle className="w-3 h-3"/> Pre-mortem → <Lightbulb className="w-3 h-3"/> Get Hint</p>
                  <p className="text-gray-600 text-xs mt-1">Each hint saves your mistake with category to memory</p>
                </div>
                <div className="bg-violet-950/40 border border-violet-800/40 rounded-lg p-2.5 text-left">
                  <p className="text-violet-400 text-xs font-semibold flex items-center gap-1"><Target className="w-3 h-3"/> Challenges</p>
                  <p className="text-gray-600 text-xs mt-1">Switch to the Challenges page to practice your weak spots</p>
                </div>
                <div className="bg-blue-950/40 border border-blue-800/40 rounded-lg p-2.5 text-left">
                  <p className="text-blue-400 text-xs font-semibold flex items-center gap-1"><BarChart2 className="w-3 h-3"/> Dashboard</p>
                  <p className="text-gray-600 text-xs mt-1">See your real Error DNA, actual counts, weekly progress</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}