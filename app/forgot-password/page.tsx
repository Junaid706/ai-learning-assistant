"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function sendOtp() {
    if (!email) return setError("Email required");
    setLoading(true);
    const res = await fetch("http://127.0.0.1:8000/api/send-otp/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setStep(2);
      setError("");
      alert(`OTP sent! Demo code: ${data.otp}`);
    } else {
      setError(data.error);
    }
  }

  async function resetPassword() {
    if (!otp || !newPassword) return setError("All fields required");
    if (newPassword !== confirmPassword) return setError("Passwords do not match");
    
    setLoading(true);
    const res = await fetch("http://127.0.0.1:8000/api/reset-password/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, new_password: newPassword }),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/auth"), 2000);
    } else {
      const data = await res.json();
      setError(data.error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold mb-6 text-blue-400">Reset Password</h1>
      
      {step === 1 && (
        <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-6 flex flex-col gap-4">
          <input
            type="email"
            className="bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button onClick={sendOtp} disabled={loading} className="bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold transition">
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </div>
      )}
      
      {step === 2 && (
        <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-6 flex flex-col gap-4">
          <input
            type="text"
            className="bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <input
            type="password"
            className="bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            type="password"
            className="bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button onClick={resetPassword} disabled={loading} className="bg-green-600 hover:bg-green-700 py-3 rounded-xl font-semibold transition">
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </div>
      )}
      
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      {success && <p className="text-green-400 text-sm mt-2">Password reset! Redirecting...</p>}
      
      <button onClick={() => router.push("/auth")} className="mt-4 text-gray-400 hover:text-white text-sm">
        Back to Login
      </button>
    </div>
  );
}