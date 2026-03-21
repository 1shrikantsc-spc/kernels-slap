"use client";
import { useState } from "react";
import Link from "next/link";
import Editor from "@monaco-editor/react";

export default function Home() {
  const [code, setCode] = useState("# Write your code here\n");
  const [hint, setHint] = useState("");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");

  const API = "";
  const USER_ID = "user_1";

  const getHint = async () => {
    setLoading(true);
    const res = await fetch(`${API}/api/hint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: USER_ID,
        code: code,
        error: "general error",
      }),
    });
    const data = await res.json();
    setHint(data.hint);
    setLoading(false);
  };

  const runCode = async () => {
    setLoading(true);
    const res = await fetch(`${API}/api/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: code,
        language: "python",
      }),
    });
    const data = await res.json();
    let finalOutput = data.output || "";
    if (data.error) {
      finalOutput += (finalOutput ? "\n\n--- ERROR ---\n" : "") + data.error;
    }
    setOutput(finalOutput || "No output");
    setLoading(false);
  };

  const getWarning = async () => {
    setLoading(true);
    const res = await fetch(`${API}/api/premortem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: USER_ID,
        code: code,
      }),
    });
    const data = await res.json();
    setWarning(data.warning);
    setLoading(false);
  };

  const markSolved = async () => {
    await fetch(`${API}/api/solve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: USER_ID,
        problem: code,
        hint_helped: true,
      }),
    });
    alert("Great job! Memory updated! 🎉");
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent tracking-tight">
          Kernel's Slap 🧠
        </h1>
        <Link
          href="/dashboard"
          className="text-sm bg-purple-600 hover:bg-purple-500 hover:scale-105 transition-all shadow-lg shadow-purple-500/30 px-4 py-2 rounded-lg font-bold"
        >
          View Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Left: Editor */}
        <div className="flex flex-col gap-3">
          <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
            <div className="bg-gray-800 px-4 py-2 text-sm text-gray-300">
              Code Editor
            </div>
            <Editor
              height="400px"
              defaultLanguage="python"
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{ fontSize: 14, minimap: { enabled: false } }}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={runCode}
              className="flex-1 bg-green-700 hover:bg-green-600 text-white py-3 rounded-xl font-bold transition-all hover:-translate-y-1 shadow-lg shadow-green-900/50"
            >
              ▶ Run Code
            </button>
            <button
              onClick={getWarning}
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl font-bold transition-all hover:-translate-y-1 shadow-lg shadow-amber-900/50"
            >
              ⚠️ Pre-mortem
            </button>
            <button
              onClick={getHint}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-bold transition-all hover:-translate-y-1 shadow-lg shadow-purple-900/50"
            >
              💡 Get Hint
            </button>
            <button
              onClick={markSolved}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-all hover:-translate-y-1 shadow-lg shadow-blue-900/50"
            >
              ✅ Solved!
            </button>
          </div>
        </div>

        {/* Right: AI Panel */}
        <div className="flex flex-col gap-3">
          {/* Warning Box */}
          {warning && (
            <div className="bg-amber-950 border border-amber-600 rounded-lg p-4">
              <h3 className="text-amber-400 font-bold mb-2">
                ⚠️ Pre-mortem Warning
              </h3>
              <p className="text-amber-200 text-sm">{warning}</p>
            </div>
          )}

          {/* Hint Box */}
          {hint && (
            <div className="bg-purple-950 border border-purple-600 rounded-lg p-4">
              <h3 className="text-purple-400 font-bold mb-2">
                💡 Personal Hint
              </h3>
              <p className="text-purple-200 text-sm whitespace-pre-wrap">
                {hint}
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-gray-400">🤔 Thinking...</p>
            </div>
          )}

          {/* Output Box */}
          {output && (
            <div className="bg-gray-900 border border-gray-600 rounded-lg p-4">
              <h3 className="text-gray-400 font-bold mb-2">
                ▶ Output
              </h3>
              <pre className="text-green-400 text-sm whitespace-pre-wrap">
                {output}
              </pre>
            </div>
          )}

          {/* Empty state */}
          {!hint && !warning && !loading && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 text-center">
              <p className="text-gray-500 text-sm">
                Write some code and click Pre-mortem or Get Hint!
              </p>
              <p className="text-gray-600 text-xs mt-2">
                🧠 Hindsight remembers your mistakes across sessions
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}