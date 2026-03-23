"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { user, login, isLoading } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && user) router.push("/dashboard");
  }, [user, isLoading, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, display_name: displayName || username }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Registration failed");
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

  if (isLoading) {
    return (
      <main className="ks-bg min-h-screen flex items-center justify-center">
        <span className="spinner" />
      </main>
    );
  }

  return (
    <main className="ks-bg min-h-screen flex items-center justify-center p-4">
      <div className="glow glow-purple" style={{ top: "10%", right: "20%" }} />
      <div className="glow glow-pink" style={{ bottom: "15%", left: "10%" }} />

      <div className="glass-card w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-2">
            Join Kernel&apos;s Slap 🚀
          </h1>
          <p className="text-gray-400 text-sm">Your coding journey begins here</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1.5">Display Name</label>
            <input
              id="reg-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Shrikant"
              className="ks-input"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1.5">Username <span className="text-red-400">*</span></label>
            <input
              id="reg-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="shrikant_dev"
              required
              className="ks-input"
            />
            <p className="text-gray-600 text-xs mt-1">Lowercase letters, numbers, underscores only</p>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1.5">Password <span className="text-red-400">*</span></label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••• (min. 4 chars)"
              required
              minLength={4}
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
            id="reg-submit"
            type="submit"
            disabled={loading}
            className="ks-btn-primary w-full py-3 text-base font-bold mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="spinner" /> Creating account...
              </span>
            ) : (
              "Create Account →"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-3 text-center">
          <p className="text-gray-500 text-sm">
            Want to see the product first?{" "}
            <Link href="/landing" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
              View landing page
            </Link>
          </p>
        </div>

        {/* Info cards */}
        <div className="mt-6 grid grid-cols-3 gap-2">
          {[
            { icon: "🧠", label: "Hindsight\nMemory" },
            { icon: "🧬", label: "Error\nDNA" },
            { icon: "🤖", label: "AI\nMentor" },
          ].map((item) => (
            <div key={item.label} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3 text-center">
              <p className="text-2xl mb-1">{item.icon}</p>
              <p className="text-gray-400 text-xs whitespace-pre-line leading-tight">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
