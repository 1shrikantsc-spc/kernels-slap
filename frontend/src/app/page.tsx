"use client";
import { useState } from "react";
import Editor from "@monaco-editor/react";

export default function Home() {
  const [code, setCode] = useState("# Write your code here\n");
  const [hint, setHint] = useState("");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);

  const API = "http://127.0.0.1:8000";
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-purple-400">
          CodeMentor AI 🧠
        </h1>
        <span className="text-sm text-gray-400">
          Powered by Hindsight Memory
        </span>
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
          <div className="flex gap-2">
            <button
              onClick={getWarning}
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2 rounded-lg font-medium"
            >
              ⚠️ Pre-mortem Check
            </button>
            <button
              onClick={getHint}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg font-medium"
            >
              💡 Get Hint
            </button>
            <button
              onClick={markSolved}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-medium"
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