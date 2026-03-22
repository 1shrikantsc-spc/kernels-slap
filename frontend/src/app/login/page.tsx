"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Login failed");
        setLoading(false);
        return;
      }
      login(data);
      router.push("/");
    } catch {
      setError("Could not reach server. Is the backend running?");
      setLoading(false);
    }
  };

  return (
    <main className="ks-bg min-h-screen flex items-center justify-center p-4">
      {/* Ambient glows */}
      <div className="glow glow-purple" style={{ top: "15%", left: "20%" }} />
      <div className="glow glow-pink" style={{ bottom: "20%", right: "15%" }} />

      <div className="glass-card w-full max-w-md p-8 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-2">
            Kernel&apos;s Slap 🧠
          </h1>
          <p className="text-gray-400 text-sm">Your AI coding mentor with memory</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1.5">Username</label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              required
              className="ks-input"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1.5">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="ks-input"
            />
          </div>

          {error && (
            <div className="bg-red-950 border border-red-700 rounded-xl p-3 text-red-300 text-sm flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="ks-btn-primary w-full py-3 text-base font-bold"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="spinner" /> Signing in...
              </span>
            ) : (
              "Sign In →"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            New here?{" "}
            <Link href="/register" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
              Create an account
            </Link>
          </p>
        </div>

        {/* Feature pills */}
        <div className="mt-8 flex flex-wrap gap-2 justify-center">
          {["🧬 Error DNA", "🤖 AI Hints", "🧠 Memory"].map((f) => (
            <span key={f} className="px-3 py-1 bg-gray-800/60 border border-gray-700 rounded-full text-gray-400 text-xs">
              {f}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
