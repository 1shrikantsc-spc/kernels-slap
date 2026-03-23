"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Editor from "@monaco-editor/react";
import { Brain, Zap, Target, BarChart2, CheckCircle, Code, GraduationCap, Sparkles, XCircle, Star, PenTool, Trophy } from "lucide-react";
import { useAuth } from "../context/AuthContext";

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

export default function ChallengePage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();

  const [code, setCode] = useState("# Click 'Generate Challenge' to start!\n");
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState<any>(null);
  const [feedback, setFeedback] = useState<"none" | "success" | "error">("none");
  const [stars, setStars] = useState<number | null>(null);

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

  const generateChallenge = async () => {
    setLoading(true);
    setChallenge(null);
    setFeedback("none");
    try {
      const res = await fetch(`${API}/api/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: USER_ID }),
      });
      const data = await res.json();
      setChallenge(data);
      if (data.code_snippet) {
        setCode(data.code_snippet);
      }
    } catch (err) {
      console.error("Failed to generate challenge", err);
    }
    setLoading(false);
  };

  const checkSolution = async () => {
    if (!challenge || !challenge.solution) return;
    
    // Normalize code for comparison
    const normalize = (c: string) => c.replace(/\s+/g, " ").replace(/#.*$/gm, "").trim();
    
    if (normalize(code) === normalize(challenge.solution)) {
      setFeedback("success");
      setLoading(true);
      // Award a star/solve
      const res = await fetch(`${API}/api/solve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: USER_ID, problem: code, hint_helped: false }),
      });
      const data = await res.json();
      setStars(data.total_solved);
      setLoading(false);
    } else {
      setFeedback("error");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const catColor = (cat: string) => CATEGORY_COLORS[cat] || CATEGORY_COLORS["Other"];

  return (
    <main className="ks-bg min-h-screen text-white p-5 overflow-x-hidden">
      <div className="glow glow-violet" style={{ top: "15%", left: "10%" }} />
      <div className="glow glow-pink" style={{ bottom: "20%", right: "10%" }} />

      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10 fade-in max-w-5xl mx-auto">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
              Targeted Practice
            </h1>
            <Target className="w-8 h-8 text-fuchsia-400" />
          </div>
          <p className="text-sm font-semibold text-gray-300 flex items-center gap-1.5 mt-1">
            <Zap className="w-4 h-4 text-yellow-400" /> Predicts coding mistakes BEFORE execution using your past behavior
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl font-bold border border-gray-700 transition-all">
            <Code className="w-4 h-4" /> Editor
          </Link>
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl font-bold border border-gray-700 transition-all">
            Dashboard <BarChart2 className="w-4 h-4" />
          </Link>
          <button onClick={handleLogout} className="text-sm bg-gray-900/50 hover:bg-red-900/50 text-gray-400 hover:text-red-300 px-4 py-2 rounded-xl font-medium transition-all border border-gray-800 hover:border-red-800">
            Logout
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 relative z-10 max-w-5xl mx-auto">
        {/* Left: Challenge Info */}
        <div className="flex flex-col gap-5 fade-in">
          
          <button 
            onClick={generateChallenge} 
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-700 to-fuchsia-700 hover:from-violet-600 hover:to-fuchsia-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-fuchsia-900/30 transition-all hover:scale-[1.02] border border-violet-500/30"
          >
            {loading ? "Analyzing Memory..." : <><Target className="w-5 h-5"/> Generate Custom Challenge</>}
          </button>

          {!challenge && !loading && (
            <div className="glass-card p-8 text-center flex flex-col items-center justify-center">
               <GraduationCap className="w-16 h-16 text-gray-500 mb-4 opacity-80" />
               <h3 className="text-xl font-bold text-gray-200 mb-2">Ready to practice?</h3>
               <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                 Click the button above. The AI will analyze your past mistakes and generate a "fill-in-the-blank" challenge specifically designed for you.
               </p>
            </div>
          )}

          {challenge && (
            <div className="glass-card p-6 border-violet-500/30 shadow-lg shadow-violet-900/20">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${catColor(challenge.category)}`}>
                  {challenge.category}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${DIFFICULTY_COLORS[challenge.difficulty] || ""}`}>
                  {challenge.difficulty}
                </span>
                {challenge.mistake_count > 0 && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/60 text-amber-300 border border-amber-700/50 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Generated from your last {challenge.mistake_count} {challenge.category.toLowerCase()} mistakes
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-gray-100 mb-3">{challenge.challenge}</h3>
              
              {challenge.hint && (
                <div className="bg-violet-950/40 border border-violet-800/50 rounded-xl p-4 mt-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-violet-500 rounded-l-full" />
                  <p className="text-violet-400 text-xs font-bold uppercase tracking-wider mb-1">Mentor Hint</p>
                  <p className="text-violet-200 text-sm italic">&quot;{challenge.hint}&quot;</p>
                </div>
              )}
            </div>
          )}

          {/* Feedback Area */}
          {feedback === "success" && (
            <div className="bg-gradient-to-r from-emerald-900/80 to-teal-900/80 border-2 border-emerald-500 rounded-2xl p-6 shadow-2xl shadow-emerald-900/50 text-center animate-[bounce_0.5s_ease-in-out]">
              <Trophy className="w-12 h-12 mx-auto text-emerald-300 mb-3 animate-pulse" />
              <h2 className="text-2xl font-black text-emerald-300 mb-2 tracking-tight">PERFECT!</h2>
              {stars !== null && (
                 <div className="flex items-center justify-center gap-2 bg-emerald-950 border border-emerald-700 rounded-full px-4 py-1 mt-2 w-fit mx-auto">
                    <span className="text-emerald-400 font-bold flex items-center gap-1"><Star className="w-4 h-4"/> Total Stars: {stars}</span>
                    <span className="text-emerald-200/50">|</span>
                    <span className="text-emerald-300 font-bold">Level {Math.floor(stars / 5) + 1}</span>
                 </div>
              )}
            </div>
          )}

          {feedback === "error" && challenge?.solution && (
            <div className="bg-red-950/40 border border-red-800/50 rounded-2xl p-5 fade-in">
              <h3 className="text-red-400 font-bold flex items-center gap-2 mb-3">
                <XCircle className="w-5 h-5" /> Almost there...
              </h3>
              <p className="text-red-200 text-sm mb-4">That wasn't quite right. Here is the correct solution to learn from:</p>
              <div className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-700 overflow-x-auto">
                <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">{challenge.solution}</pre>
              </div>
            </div>
          )}

        </div>

        {/* Right: Editor */}
        <div className="flex flex-col gap-4 fade-in-delay">
          <div className="glass-card overflow-hidden h-[450px] flex flex-col shadow-2xl">
            <div className="bg-gray-900/80 px-4 py-3 text-sm text-gray-300 font-bold border-b border-gray-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-violet-400" /> Fill in the Blanks (<code className="text-violet-300 bg-violet-900/50 px-1 rounded">___</code>)
              </div>
            </div>
            
            <div className="flex-1 relative">
              <Editor
                defaultLanguage="python"
                theme="vs-dark"
                value={code}
                onChange={(val) => {
                  setCode(val || "");
                  if (feedback !== "none") setFeedback("none");
                }}
                options={{ 
                  fontSize: 15, 
                  lineHeight: 24,
                  minimap: { enabled: false }, 
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                  wordWrap: "on"
                }}
              />
              {loading && !challenge && (
                 <div className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm flex items-center justify-center z-10">
                   <span className="spinner" />
                 </div>
              )}
            </div>
          </div>

          <button 
            onClick={checkSolution}
            disabled={!challenge || feedback === "success"}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
              !challenge || feedback === "success" 
                ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-500/50 shadow-emerald-900/30"
            }`}
          >
            <Sparkles className="w-4 h-4" /> Check Your Answer
          </button>
        </div>
      </div>
    </main>
  );
}
