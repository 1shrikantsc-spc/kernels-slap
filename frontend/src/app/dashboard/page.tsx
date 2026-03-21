"use client";
import { useState, useEffect } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function Dashboard() {
  const [greeting, setGreeting] = useState("");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/greeting/user_1").then((r) => r.json()).catch(() => ({ greeting: "Welcome back! Ready to practice today?" })),
      fetch("/api/dashboard/user_1").then((r) => r.json()).catch(() => null)
    ]).then(([greetingData, dashData]) => {
      setGreeting(greetingData.greeting);
      setDashboardData(dashData);
      setLoading(false);
    });
  }, []);

  const eData = dashboardData?.errorData || [{ skill: "Loading", mistakes: 0 }];
  const pData = dashboardData?.progressData || [{ day: "Mon", solved: 0, mistakes: 0 }];
  const stats = dashboardData?.stats || { solved: 0, mistakes: 0, improvement: "0%" };
  const lPath = dashboardData?.learningPath || [{ topic: "Loading", status: "locked" }];

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent tracking-tight">
          Kernel's Slap 🧠
        </h1>
        <a href="/" className="bg-purple-600 hover:bg-purple-500 hover:scale-105 transition-all shadow-lg shadow-purple-500/30 px-6 py-2 rounded-xl text-sm font-bold">Launch Editor</a>
      </div>

      <div className="bg-purple-950 border border-purple-700 rounded-xl p-4 mb-6">
        <h2 className="text-purple-400 font-bold mb-1">AI Mentor Says 👋</h2>
        {loading ? (
          <p className="text-gray-400 text-sm">Synthesizing your Hindsight memory directly from the AI...</p>
        ) : (
          <p className="text-purple-200 text-sm">{greeting}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{loading ? "-" : stats.solved}</p>
          <p className="text-gray-400 text-sm mt-1">Problems Solved</p>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-400">{loading ? "-" : stats.mistakes}</p>
          <p className="text-gray-400 text-sm mt-1">Mistakes Remembered</p>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-purple-400">{loading ? "-" : stats.improvement}</p>
          <p className="text-gray-400 text-sm mt-1">Improvement Rate</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Radar Chart */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
          <h3 className="text-white font-bold mb-4">Real-Time Error DNA 🧬</h3>
          <div className={`${loading ? 'opacity-50 blur-sm' : ''} transition-all duration-500`}>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={eData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fill: "#9CA3AF", fontSize: 12 }}
                />
                <Radar
                  name="Mistakes"
                  dataKey="mistakes"
                  stroke="#A855F7"
                  fill="#A855F7"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
          <h3 className="text-white font-bold mb-4">Weekly Progress 📈</h3>
          <div className={`${loading ? 'opacity-50 blur-sm' : ''} transition-all duration-500`}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={pData}>
                <XAxis dataKey="day" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "none",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="solved" fill="#22C55E" radius={4} name="Solved" />
                <Bar dataKey="mistakes" fill="#EF4444" radius={4} name="Mistakes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
        <h3 className="text-white font-bold mb-4">Dynamic Learning Path 🗺️</h3>
        <div className={`flex gap-3 flex-wrap ${loading ? 'opacity-50 blur-sm' : ''} transition-all duration-500`}>
          {lPath.map((item: any) => (
            <div
              key={item.topic}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                item.status === "done"
                  ? "bg-green-900 text-green-300 border border-green-600"
                  : item.status === "current"
                  ? "bg-purple-900 text-purple-300 border border-purple-500"
                  : item.status === "next"
                  ? "bg-amber-900 text-amber-300 border border-amber-600"
                  : "bg-gray-800 text-gray-500 border border-gray-600"
              }`}
            >
              {item.status === "done" && "✅ "}
              {item.status === "current" && "🔥 "}
              {item.status === "next" && "⭐ "}
              {item.status === "locked" && "🔒 "}
              {item.topic}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}