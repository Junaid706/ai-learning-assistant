"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  // Handle NextAuth Google session
  useEffect(() => {
    if (status === "authenticated" && session?.accessToken) {
      fetch("http://127.0.0.1:8000/api/google-auth/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: session.accessToken }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.tokens) {
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem("access_token", data.tokens.access);
            storage.setItem("username", session.user?.name || session.user?.email || "User");
            router.push("/");
          }
        });
    }
  }, [status, session, rememberMe, router]);

  async function handleSubmit() {
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");

    const endpoint = isLogin ? "login" : "register";
    const res = await fetch(`http://127.0.0.1:8000/api/${endpoint}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("access_token", data.tokens.access);
    storage.setItem("username", username);
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      <h1 className="text-3xl font-bold mb-2 text-blue-400">AI Learning Assistant</h1>
      <p className="text-gray-400 mb-8">{isLogin ? "Welcome back!" : "Create your account"}</p>

      <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-8 flex flex-col gap-4">
        <input
          className="bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 pr-12"
            placeholder="Password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-sm"
          >
            {showPassword ? "🙈 Hide" : "👁 Show"}
          </button>
        </div>

        {isLogin && (
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-400">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 accent-blue-500"
            />
            Remember me
          </label>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold transition disabled:opacity-50"
        >
          {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
        </button>

        <p className="text-center text-gray-400 text-sm">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span
            onClick={() => { setIsLogin(!isLogin); setError(""); setUsername(""); setPassword(""); }}
            className="text-blue-400 cursor-pointer hover:underline"
          >
            {isLogin ? "Sign Up" : "Login"}
          </span>
        </p>

        {isLogin && (
          <p className="text-center text-xs">
            <span onClick={() => router.push("/forgot-password")} className="text-blue-400 cursor-pointer hover:underline">
              Forgot Password?
            </span>
          </p>
        )}

        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-gray-700"></div>
          <span className="text-xs text-gray-500">or</span>
          <div className="flex-1 h-px bg-gray-700"></div>
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="flex items-center justify-center gap-3 bg-white text-gray-900 py-3 rounded-xl font-semibold transition hover:bg-gray-100"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />
          Continue with Google
        </button>
      </div>
    </div>
  );
}
