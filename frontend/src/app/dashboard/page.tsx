"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip,
} from "recharts";
import { Brain, Zap, Target, BarChart2, CheckCircle, Code, Dna, Activity, Clock, Map } from "lucide-react";
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

function catColor(cat: string) {
  return CATEGORY_COLORS[cat] || CATEGORY_COLORS["Other"];
}

export default function Dashboard() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [greeting, setGreeting] = useState("");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch(`/api/greeting/${user.user_id}`).then((r) => r.json()).catch(() => ({ greeting: "Welcome! Start coding to see your personalized stats." })),
      fetch(`/api/dashboard/${user.user_id}`).then((r) => r.json()).catch(() => null),
    ]).then(([greetingData, dashData]) => {
      setGreeting(greetingData.greeting);
      setDashboardData(dashData);
      setDataLoading(false);
    });
  }, [user]);

  if (isLoading || !user) {
    return <main className="ks-bg min-h-screen flex items-center justify-center"><span className="spinner" /></main>;
  }

  const eData: any[] = dashboardData?.errorData || [];
  const pData: any[] = dashboardData?.progressData || [];
  const stats = dashboardData?.stats || { solved: 0, mistakes: 0, improvement: "0%" };
  const lPath: any[] = dashboardData?.learningPath || [];
  const recentMistakes: any[] = dashboardData?.recentMistakes || [];
  const topWeakness: string | null = dashboardData?.topWeakness || null;

  const handleLogout = () => { logout(); router.push("/login"); };

  return (
    <main className="ks-bg min-h-screen text-white p-5">
      <div className="glow glow-purple" style={{ top: "5%", left: "-5%" }} />
      <div className="glow glow-pink" style={{ bottom: "10%", right: "-5%" }} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10 fade-in">
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
          <a href="/" className="flex items-center gap-1.5 text-sm bg-purple-600/80 hover:bg-purple-500 transition-all px-4 py-2 rounded-xl font-bold border border-purple-500/30">
            <Code className="w-4 h-4" /> Editor
          </a>
          <button onClick={handleLogout} className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl font-medium transition-all border border-gray-700">
            Logout
          </button>
        </div>
      </div>

      {/* AI Greeting */}
      <div className="glass-card p-4 mb-5 relative z-10 fade-in">
        <h2 className="text-purple-400 font-bold mb-1 flex items-center gap-2 text-sm">
          <Brain className="w-4 h-4" /> AI Mentor Says — personalized for {user.display_name}
        </h2>
        {dataLoading ? (
          <div className="flex items-center gap-2"><span className="spinner" /><p className="text-gray-500 text-sm">Loading your real stats...</p></div>
        ) : (
          <p className="text-gray-200 text-sm leading-relaxed">{greeting}</p>
        )}
      </div>

      {/* Top Weakness Alert */}
      {topWeakness && !dataLoading && (
        <div className={`flex items-center gap-3 rounded-xl p-3.5 mb-5 relative z-10 border ${catColor(topWeakness)}`}>
          <Target className="w-8 h-8 opacity-80" />
          <div>
            <p className="font-bold text-sm">Your Top Weakness: {topWeakness}</p>
            <p className="text-xs opacity-80">Click <strong>Generate Challenge</strong> in the editor to get a practice problem targeting this!</p>
          </div>
        </div>
      )}

      {/* Stats — REAL numbers */}
      <div className="grid grid-cols-3 gap-4 mb-5 relative z-10 fade-in">
        {[
          { value: stats.solved,      label: "Problems Solved",      color: "text-green-400",  bg: "from-green-950/60 to-emerald-950/40", border: "border-green-800/40", note: "actual count" },
          { value: stats.mistakes,    label: "Mistakes Remembered",  color: "text-amber-400",  bg: "from-amber-950/60 to-yellow-950/40",  border: "border-amber-800/40", note: "actual count" },
          { value: stats.improvement, label: "Improvement Rate",     color: "text-purple-400", bg: "from-purple-950/60 to-pink-950/40",   border: "border-purple-800/40", note: "solved ÷ (solved + mistakes)" },
        ].map((s) => (
          <div key={s.label} className={`bg-gradient-to-br ${s.bg} border ${s.border} rounded-xl p-5 text-center`}>
            <p className={`text-3xl font-black ${s.color} ${dataLoading ? "blur-sm opacity-50" : ""} transition-all duration-500`}>{s.value}</p>
            <p className="text-gray-400 text-xs mt-1 font-medium">{s.label}</p>
            <p className="text-gray-600 text-xs mt-0.5 italic">{s.note}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-5 mb-5 relative z-10 fade-in-delay">
        {/* Error DNA Radar — REAL categories */}
        <div className="glass-card p-5">
          <h3 className="text-white font-bold mb-1 flex items-center gap-2"><Dna className="w-5 h-5 text-purple-400" /> Real-Time Error DNA</h3>
          <p className="text-amber-400 text-xs font-bold mb-3 flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4" /> Based on REAL mistakes — not AI guesses
          </p>
          {dataLoading ? (
            <div className="h-56 flex items-center justify-center"><span className="spinner" /></div>
          ) : eData.length === 0 || (eData.length === 1 && eData[0].skill === "No mistakes yet") ? (
            <div className="h-56 flex items-center justify-center">
              <p className="text-gray-600 text-sm text-center">No mistakes tracked yet.<br/>Run some code and use Get Hint!</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={eData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                <Radar name="Mistakes" dataKey="mistakes" stroke="#A855F7" fill="#A855F7" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Weekly Progress — REAL daily counts */}
        <div className="glass-card p-5">
          <h3 className="text-white font-bold mb-1 flex items-center gap-2"><Activity className="w-5 h-5 text-green-400" /> Weekly Progress</h3>
          <p className="text-gray-600 text-xs mb-3">Real counts per day from your activity</p>
          {dataLoading ? (
            <div className="h-56 flex items-center justify-center"><span className="spinner" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pData}>
                <XAxis dataKey="day" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0f0f1a", border: "1px solid #374151", borderRadius: "10px" }} labelStyle={{ color: "#d1d5db" }} />
                <Bar dataKey="solved" fill="#22C55E" radius={4} name="Solved" />
                <Bar dataKey="mistakes" fill="#EF4444" radius={4} name="Mistakes" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Mistakes Timeline */}
      <div className="glass-card p-5 mb-5 relative z-10 fade-in-delay">
        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" /> Recent Mistakes Timeline
          <span className="text-gray-600 text-xs font-normal">— exactly what you got wrong</span>
        </h3>
        {dataLoading ? (
          <div className="flex items-center gap-2"><span className="spinner" /><p className="text-gray-600 text-sm">Loading...</p></div>
        ) : recentMistakes.length === 0 ? (
          <p className="text-gray-600 text-sm">No mistakes tracked yet. Run some code and click Get Hint!</p>
        ) : (
          <div className="space-y-2">
            {recentMistakes.map((m: any, i: number) => (
              <div key={i} className="flex items-start gap-3 bg-gray-900/40 rounded-xl p-3 border border-gray-800/40">
                <span className={`px-2 py-1 rounded-lg text-xs font-bold border whitespace-nowrap ${catColor(m.category)}`}>
                  {m.category}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-300 text-xs font-mono truncate">{m.error || "Unknown error"}</p>
                  {m.code_snippet && (
                    <p className="text-gray-600 text-xs font-mono truncate mt-0.5">{m.code_snippet}</p>
                  )}
                </div>
                <span className="text-gray-600 text-xs whitespace-nowrap">{m.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Learning Path */}
      <div className="glass-card p-5 relative z-10 fade-in-delay">
        <h3 className="text-white font-bold mb-1 flex items-center gap-2">
          <Map className="w-5 h-5 text-amber-400" /> Dynamic Learning Path
        </h3>
        <p className="text-gray-600 text-xs mb-3">Ordered by your real mistake data — topics you struggle with come first</p>
        {dataLoading ? (
          <div className="flex items-center gap-2"><span className="spinner" /></div>
        ) : lPath.length === 0 ? (
          <p className="text-gray-600 text-sm">Use the app first to generate your personalized learning path!</p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {lPath.map((item: any) => (
              <div key={item.topic} className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                item.status === "done"    ? "bg-green-900/50 text-green-300 border-green-700/50"
                : item.status === "current" ? "bg-purple-900/60 text-purple-300 border-purple-500/50 shadow-lg shadow-purple-900/30 scale-105"
                : item.status === "next"    ? "bg-amber-900/50 text-amber-300 border-amber-700/50"
                                            : "bg-gray-800/50 text-gray-500 border-gray-700/30"
              }`}>
                {item.status === "done" && <CheckCircle className="w-4 h-4 inline mr-1" />}
                {item.status === "current" && <Activity className="w-4 h-4 inline mr-1" />}
                {item.status === "next" && <Brain className="w-4 h-4 inline mr-1" />}
                {item.topic}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}