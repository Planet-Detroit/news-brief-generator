"use client";

import { useState, FormEvent } from "react";

const TEAM_MEMBERS = ["Nina", "Dustin"];

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [customName, setCustomName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const effectiveName = userName === "__custom" ? customName.trim() : userName;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!effectiveName) {
      setError("Please select your name");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, userId: effectiveName }),
      });

      if (res.ok) {
        window.location.href = "/";
      } else {
        setError("Invalid password");
        setPassword("");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Planet Detroit</h1>
          <p className="text-sm text-gray-500 mt-1">News Brief Generator</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          {/* Name selector */}
          <label
            htmlFor="userName"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Who&apos;s working today?
          </label>
          <select
            id="userName"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2982c4] focus:border-transparent bg-white"
          >
            <option value="">Select your name</option>
            {TEAM_MEMBERS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            <option value="__custom">Other...</option>
          </select>

          {userName === "__custom" && (
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Enter your name"
              className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2982c4] focus:border-transparent"
            />
          )}

          {/* Password */}
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-2 mt-4"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter newsroom password"
            autoFocus
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2982c4] focus:border-transparent"
          />

          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password || !effectiveName}
            className="mt-4 w-full py-2 px-4 bg-[#2982c4] text-white text-sm font-medium rounded-lg hover:bg-[#2371a8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
