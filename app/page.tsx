"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface ChatItem { role: string; text: string; time: string; feedback?: string; }
interface HistoryItem { message: string; reply: string; created_at: string; }
interface QuizItem { question: string; options: string[]; answer: string; }
interface FlashcardItem { question: string; answer: string; }

export default function Home() {
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdf, setPdf] = useState<File | null>(null);
  const [pdfQuestion, setPdfQuestion] = useState("");
  const [tab, setTab] = useState("chat");
  const [username, setUsername] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
const [sidebarOpen, setSidebarOpen] = useState(true);
  const [listening, setListening] = useState(false);
  const [voiceOutput, setVoiceOutput] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [volume, setVolume] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState("female");
  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [pdfSummary, setPdfSummary] = useState("");
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // সেশন লোড হওয়া পর্যন্ত অপেক্ষা করুন

    const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    const user = localStorage.getItem("username") || sessionStorage.getItem("username");

    if (!t && !session) {
      router.push("/landing");
    } else {
      if (session?.user) {
        setUsername(session.user.name || "User");
      } else {
        setUsername(user || "User");
      }
      if (t) loadHistory(t);
    }

    // Load voices
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    // Mobile sidebar auto-close
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
        setMobileMenuOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [session, status, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadHistory(t?: string) {
    const token = t || localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    const res = await fetch("http://127.0.0.1:8000/api/history/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setHistory(data.history || []);
  }

  async function deleteHistory() {
    if (!confirm("Delete all chat history?")) return;
    const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    await fetch("http://127.0.0.1:8000/api/delete-history/", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${t}` },
    });
    setHistory([]);
    setMessages([]);
  }

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("username");
    router.push("/auth");
  }

  function speakText(text: string) {
    if (!voiceOutput) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = selectedVoice === "female" ? 1.3 : 0.9;
    utterance.volume = volume;

    const voices = window.speechSynthesis.getVoices();
    let chosenVoice;

    if (selectedVoice === "female") {
      chosenVoice = voices.find(v =>
        v.name.includes("Female") ||
        v.name.includes("Zira") ||
        v.name.includes("Susan") ||
        v.name.includes("Samantha") ||
        v.name.includes("Google UK English Female") ||
        v.name.includes("Google US English")
      );
    } else {
      chosenVoice = voices.find(v =>
        v.name.includes("Male") ||
        v.name.includes("David") ||
        v.name.includes("Mark") ||
        v.name.includes("Google UK English Male")
      );
    }

    if (chosenVoice) utterance.voice = chosenVoice;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  function startListening() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input. Please use Chrome.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      sendMessage(transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  }

  async function sendMessage(messageText?: string) {
    const text = messageText || input;
    if (!text.trim()) return;
    const userMessage = { role: "user", text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");

    // English improvement check
    const englishFeedback = await getEnglishFeedback(text);

    const res = await fetch(`http://127.0.0.1:8000/api/chat/?message=${encodeURIComponent(text)}`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    const data = await res.json();
    const aiMsg = { role: "ai", text: data.reply, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), feedback: englishFeedback };
    setMessages((prev) => [...prev, aiMsg]);
    setLoading(false);
    loadHistory();
    setTimeout(() => speakText(data.reply), 1000);
  }

  async function getEnglishFeedback(text: string) {
    const words = text.trim().split(" ");
    if (words.length < 3) return null;
    const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    const prompt = `Analyze this English sentence for grammar and pronunciation mistakes: "${text}"

Respond in this exact format:
✅ Corrected: [corrected sentence]
📝 Mistakes: [list mistakes briefly]
💡 Better way: [more natural/advanced version]`;
    const res = await fetch(`http://127.0.0.1:8000/api/chat/?message=${encodeURIComponent(prompt)}`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    const data = await res.json();
    return data.reply;
  }

  async function askPdf() {
    if (!pdf || !pdfQuestion.trim()) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("pdf", pdf);
    formData.append("question", pdfQuestion);
    const res = await fetch("http://127.0.0.1:8000/api/ask-pdf/", { method: "POST", body: formData });
    const data = await res.json();
    setMessages((prev) => [
      ...prev,
      { role: "user", text: `📄 ${pdfQuestion}`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      { role: "ai", text: data.reply, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    ]);
    setPdfQuestion("");
    setLoading(false);
    speakText(data.reply);
  }

  async function generateQuiz() {
    if (!pdf) return alert("Please upload a PDF first in the 'Ask PDF' tab.");
    setLoading(true);
    const formData = new FormData();
    formData.append("pdf", pdf);
    const res = await fetch("http://127.0.0.1:8000/api/generate-quiz/", { method: "POST", body: formData });
    const data = await res.json();
    setQuiz(data.quiz || []);
    setLoading(false);
  }

  async function summarizePdf() {
    if (!pdf) return alert("Please upload a PDF first.");
    setLoading(true);
    const formData = new FormData();
    formData.append("pdf", pdf);
    formData.append("question", "Give me a concise summary of this document in 5-6 sentences in Bengali and English.");
    const res = await fetch("http://127.0.0.1:8000/api/ask-pdf/", { method: "POST", body: formData });
    const data = await res.json();
    setPdfSummary(data.reply || "");
    setLoading(false);
    speakText(data.reply);
  }

  async function generateFlashcards() {
    if (!pdf) return alert("Please upload a PDF first.");
    setLoading(true);
    const formData = new FormData();
    formData.append("pdf", pdf);
    formData.append("question", "Extract 10 key concepts as flashcards. Format: question::answer (one per line)");
    const res = await fetch("http://127.0.0.1:8000/api/ask-pdf/", { method: "POST", body: formData });
    const data = await res.json();
    
    const lines = data.reply?.split("\n").filter((l: string) => l.includes("::")) || [];
    const cards: FlashcardItem[] = lines.map((line: string) => {
      const [q, a] = line.split("::");
      return { question: q?.trim() || "", answer: a?.trim() || "" };
    }).slice(0, 10);
    
    setFlashcards(cards);
    setShowFlashcards(true);
    setLoading(false);
  }

  const avatarLetter = username.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-white text-gray-900 flex">

      {/* Sidebar overlay for mobile */}
      <div className={`fixed inset-0 bg-black/30 z-40 md:hidden ${sidebarOpen || mobileMenuOpen ? "block" : "hidden"}`}
           onClick={() => { setSidebarOpen(false); setMobileMenuOpen(false); }}></div>
      
      {/* Sidebar */}
      <div className={`${sidebarOpen || mobileMenuOpen ? "block" : "hidden"} md:block w-64 bg-gray-50 border-r border-gray-200 flex flex-col fixed md:relative h-full z-50 md:z-auto`}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-blue-600">🤖 AI Learning</h1>
            <p className="text-xs text-gray-500">Assistant</p>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-gray-500 hover:text-gray-800">✕</button>
        </div>

          <div className="p-4 border-b border-gray-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-sm text-blue-600">
              {avatarLetter}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{username}</p>
              <p className="text-xs text-green-500">● Online</p>
            </div>
          </div>

          <div className="p-3 flex flex-col gap-1">
            <button onClick={() => setTab("chat")} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${tab === "chat" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"}`}>
              💬 Chat
            </button>
            <button onClick={() => setTab("pdf")} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${tab === "pdf" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"}`}>
              📄 Ask PDF
            </button>
            <button onClick={() => setTab("flashcards")} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${tab === "flashcards" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"}`}>
              📇 Flashcards
            </button>
            <button onClick={() => setTab("quiz")} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${tab === "quiz" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"}`}>
              📝 AI Quiz
            </button>
          </div>

          {/* Volume */}
          <div className="px-4 py-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">🔊 Volume</p>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
            <p className="text-xs text-gray-500 mt-3 mb-2">🗣 Voice</p>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedVoice("female")}
                className={`flex-1 py-1 rounded-lg text-xs transition ${selectedVoice === "female" ? "bg-pink-100 text-pink-700" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}
              >
                👩 Female
              </button>
              <button
                onClick={() => setSelectedVoice("male")}
                className={`flex-1 py-1 rounded-lg text-xs transition ${selectedVoice === "male" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}
              >
                👨 Male
              </button>
            </div>
          </div>

          {/* History */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex justify-between items-center mb-2 px-2">
              <p className="text-xs text-gray-500 uppercase">Recent Chats</p>
              {history.length > 0 && (
                <button onClick={deleteHistory} className="text-xs text-red-500 hover:text-red-400 transition">
                  🗑 Clear
                </button>
              )}
            </div>
            {history.length === 0 && <p className="text-xs text-gray-500 px-2">No history yet</p>}
            {history.map((h, i) => (
              <div key={i} onClick={() => setMessages([
                { role: "user", text: h.message, time: h.created_at },
                { role: "ai", text: h.reply, time: h.created_at },
              ])} className="px-3 py-2 rounded-xl cursor-pointer hover:bg-gray-200 transition mb-1">
                <p className="text-xs text-gray-700 truncate">{h.message}</p>
                <p className="text-xs text-gray-500">{h.created_at}</p>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-gray-200">
            <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-gray-100 transition">
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col md:ml-0 ml-0">

{/* Top bar */}
          <div className="h-14 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <button onClick={() => { setSidebarOpen(!sidebarOpen); setMobileMenuOpen(!mobileMenuOpen); }} className="text-gray-500 hover:text-gray-800 transition text-lg">☰</button>
              <h2 className="font-semibold text-gray-700">{tab === "chat" ? "💬 AI Chat" : tab === "pdf" ? "📄 Ask PDF" : tab === "flashcards" ? "📇 Flashcards" : "📝 AI Quiz"}</h2>
            </div>
            <div className="flex items-center gap-2">
              {speaking && (
                <button onClick={stopSpeaking} className="bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg text-xs transition">
                  ⏹ Stop
                </button>
              )}
              <button
                onClick={() => { setVoiceOutput(!voiceOutput); stopSpeaking(); }}
                className={`px-3 py-1 rounded-lg text-xs transition ${voiceOutput ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}
              >
                {voiceOutput ? "🔊 Voice ON" : "🔇 Voice OFF"}
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-white">
          {tab !== "quiz" && tab !== "flashcards" && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-5xl mb-4">🤖</div>
              <h2 className="text-xl font-bold text-gray-700">Hello, {username}!</h2>
              <p className="text-gray-500 mt-2">Type or use 🎤 mic to start chatting.</p>
            </div>
          )}
          {tab !== "quiz" && tab !== "flashcards" && messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${msg.role === "user" ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-700"}`}>
                {msg.role === "user" ? avatarLetter : "🤖"}
              </div>
              <div className={`max-w-[70%] flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-sm" : "bg-gray-200 text-gray-800 rounded-tl-sm"}`}>
                  {msg.text}
                </div>
                {msg.feedback && (
                  <div className="mt-2 bg-yellow-100 border border-yellow-300 rounded-xl px-3 py-2 text-xs text-yellow-800 whitespace-pre-wrap max-w-full">
                    <p className="font-bold text-yellow-600 mb-1">📊 English Feedback</p>
                    {msg.feedback}
                  </div>
                )}
                <span className="text-xs text-gray-500 mt-1">{msg.time}</span>
              </div>
            </div>
          ))}

          {tab === "quiz" && (
            <div className="max-w-3xl mx-auto w-full py-4 px-2 sm:px-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-8 gap-3">
                <h3 className="text-xl font-bold text-blue-600">Knowledge Check</h3>
                <button onClick={generateQuiz} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-sm font-bold transition w-full sm:w-auto text-white">
                  {loading ? "Generating..." : "Generate from PDF"}
                </button>
              </div>
              {quiz.length === 0 && !loading && (
                <div className="text-center py-10 sm:py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
                  <p className="text-gray-500 px-4">Upload a PDF in the PDF tab first, then click 'Generate' to start your quiz.</p>
                </div>
              )}
              <div className="space-y-4 sm:space-y-6">
                {quiz.map((q, idx) => (
                  <div key={idx} className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow">
                    <p className="font-semibold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">{idx + 1}. {q.question}</p>
                    <div className="grid grid-cols-1 gap-2">
                      {q.options.map((opt, oIdx) => (
                        <button key={oIdx} onClick={() => alert(opt === q.answer ? "Correct! 🎉" : `Wrong! The correct answer is: ${q.answer}`)}
                          className="text-left bg-gray-100 hover:bg-gray-200 p-3 rounded-xl text-xs sm:text-sm transition border border-gray-300 hover:border-blue-400">
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm">🤖</div>
              <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 sm:p-4 bg-gray-900 border-t border-gray-800">
          {tab === "chat" && (
            <div className="flex gap-2 max-w-4xl mx-auto">
              <button
                onClick={startListening}
                className={`px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition text-lg ${listening ? "bg-red-600 animate-pulse" : "bg-gray-700 hover:bg-gray-600"}`}>
                {listening ? "⏹" : "🎤"}
              </button>
              <input
                className="flex-1 bg-gray-800 text-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder={listening ? "🎤 Listening..." : "Type or click 🎤 to speak..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={() => sendMessage()} className="bg-blue-600 hover:bg-blue-700 px-4 sm:px-5 py-2 sm:py-3 rounded-xl font-semibold transition text-sm">
                Send ➤
              </button>
            </div>
          )}
          {tab === "pdf" && (
            <div className="flex flex-col gap-2 sm:gap-3 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <label className="bg-gray-100 hover:bg-gray-200 px-3 sm:px-4 py-1 sm:py-2 rounded-xl text-xs sm:text-sm cursor-pointer transition">
                  📎 Upload PDF
                  <input type="file" accept=".pdf" onChange={(e) => setPdf(e.target.files?.[0] || null)} className="hidden" />
                </label>
                {pdf && <span className="text-green-600 text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none">✅ {pdf.name}</span>}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  className="flex-1 bg-gray-100 text-gray-800 rounded-xl px-3 sm:px-4 py-2 sm:py-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Ask a question about the PDF..."
                  value={pdfQuestion}
                  onChange={(e) => setPdfQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && askPdf()}
                />
                <button onClick={askPdf} className="bg-blue-600 hover:bg-blue-700 px-4 sm:px-5 py-2 sm:py-3 rounded-xl font-semibold transition text-sm text-white">
                  Ask ➤
                </button>
              </div>
              {pdf && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button onClick={summarizePdf} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl font-semibold transition text-sm text-white">
                    📋 Summarize PDF
                  </button>
                  <button onClick={generateQuiz} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl font-semibold transition text-sm text-white">
                    📝 Generate Quiz
                  </button>
                </div>
              )}
              {pdfSummary && (
                <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{pdfSummary}</p>
                </div>
              )}
            </div>
          )}
          {tab === "flashcards" && (
            <div className="max-w-3xl mx-auto w-full py-4 px-2 sm:px-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-8 gap-3">
                <h3 className="text-xl font-bold text-blue-600">📇 Flashcards</h3>
                <button onClick={generateFlashcards} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl text-sm font-bold transition w-full sm:w-auto text-white">
                  {loading ? "Generating..." : "Generate from PDF"}
                </button>
              </div>
              {flashcards.length === 0 && !loading && (
                <div className="text-center py-10 sm:py-20 bg-gray-900 rounded-3xl border border-dashed border-gray-800">
                  <p className="text-gray-500 px-4">Upload a PDF in the PDF tab first, then click "Generate" to create flashcards.</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {flashcards.map((card, idx) => (
                  <div key={idx} className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <p className="font-semibold text-blue-400 mb-2 text-sm">Q: {card.question}</p>
                    <p className="text-gray-300 text-xs">A: {card.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
