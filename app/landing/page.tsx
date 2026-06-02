"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const features = [
  {
    icon: "💬",
    title: "AI Chat Tutor",
    desc: "Ask anything and get instant intelligent answers powered by advanced AI.",
  },
  {
    icon: "📄",
    title: "PDF Intelligence",
    desc: "Upload your notes or books and ask questions directly from the content.",
  },
  {
    icon: "🎤",
    title: "Voice Conversation",
    desc: "Talk to AI naturally with voice input and get spoken responses back.",
  },
  {
    icon: "📊",
    title: "Chat History",
    desc: "All your conversations are saved and accessible anytime.",
  },
  {
    icon: "🌐",
    title: "Google Login",
    desc: "Sign in instantly with your Google account — no signup needed.",
  },
  {
    icon: "🔒",
    title: "Secure & Private",
    desc: "Your data is protected with JWT authentication and secure storage.",
  },
];

const stats = [
  { value: "100%", label: "Free to Use" },
  { value: "AI", label: "Powered" },
  { value: "24/7", label: "Available" },
  { value: "∞", label: "Questions" },
];

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [typedText, setTypedText] = useState("");
  const fullText = "Your AI-Powered Learning Assistant";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">

      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-gray-900/95 backdrop-blur border-b border-gray-800" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <span className="font-bold text-blue-400 text-lg">AI Learning Assistant</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/auth")} className="text-gray-400 hover:text-white text-sm transition">
              Login
            </button>
            <button onClick={() => router.push("/auth")} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-sm font-semibold transition">
              Get Started →
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative">
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-2 text-sm text-blue-400 mb-6">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
            Powered by LLaMA AI
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
            <span className="text-white">{typedText}</span>
            <span className="animate-pulse text-blue-400">|</span>
          </h1>

          <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-6 sm:mb-10">
            Chat with AI, upload PDFs, ask questions from your notes, use voice — all in one place. Learn smarter, not harder.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={() => router.push("/auth")}
              className="bg-blue-600 hover:bg-blue-700 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition transform hover:scale-105 w-full sm:w-auto">
              🚀 Start Learning Free
            </button>
            <button
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              className="bg-gray-800 hover:bg-gray-700 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition w-full sm:w-auto">
              See Features ↓
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-gray-600">
          ↓
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-gray-800 bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <div key={i}>
              <p className="text-4xl font-bold text-blue-400">{s.value}</p>
              <p className="text-gray-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Learn</h2>
            <p className="text-gray-400 text-lg">Powerful AI features designed for students and learners</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-blue-500/50 transition group">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-blue-400 transition">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center relative">
        <div className="absolute inset-0 bg-blue-600/5 pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Ready to Learn Smarter?</h2>
          <p className="text-gray-400 mb-8">Join thousands of students using AI to study better.</p>
          <button
            onClick={() => router.push("/auth")}
            className="bg-blue-600 hover:bg-blue-700 px-10 py-4 rounded-2xl font-bold text-lg transition transform hover:scale-105"
          >
            🚀 Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-gray-600 text-sm">
        <p>🤖 AI Learning Assistant — Built with Next.js + Django + LLaMA AI</p>
      </footer>
    </div>
  );
}
