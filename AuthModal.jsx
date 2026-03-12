"use client";
// components/AuthModal.jsx
// Firebase Authentication — Email Magic Link + Phone OTP

import { useState } from "react";
import { sendEmailOTP, sendPhoneOTP, verifyPhoneOTP, setupRecaptcha } from "../lib/firebase";

export default function AuthModal({ onClose, onSuccess, darkMode = true }) {
  const [mode, setMode] = useState("email"); // "email" | "phone"
  const [step, setStep] = useState("input"); // "input" | "otp"
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const dm = darkMode;
  const card = dm ? "#13131f" : "#ffffff";
  const border = dm ? "#2a2a3d" : "#e0e4f0";
  const text = dm ? "#e8e8ff" : "#1a1a2e";
  const sub = dm ? "#8888aa" : "#6666aa";
  const accent = "#6c63ff";
  const inputStyle = { background: dm ? "#1a1a2e" : "#f5f5ff", border: `1px solid ${border}`, borderRadius: 10, padding: "14px 16px", color: text, fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box" };
  const btnStyle = { width: "100%", padding: 14, borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer", border: "none", background: "linear-gradient(135deg, #6c63ff, #00d4ff)", color: "#fff" };

  // ─── Send Email OTP ─────────────────────────────────────────────────────────
  const handleSendEmail = async () => {
    if (!email || !email.includes("@")) return setError("Please enter a valid email");
    setLoading(true);
    setError("");
    try {
      await sendEmailOTP(email);
      setSuccess(`✅ Magic link sent to ${email}! Check your inbox and click the link.`);
      setStep("otp");
    } catch (err) {
      setError(err.message || "Failed to send email. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Send Phone OTP ─────────────────────────────────────────────────────────
  const handleSendPhone = async () => {
    const fullPhone = phone.startsWith("+") ? phone : `+91${phone}`; // Default India
    if (fullPhone.length < 10) return setError("Enter valid phone number with country code");
    setLoading(true);
    setError("");
    try {
      setupRecaptcha("recaptcha-container");
      await sendPhoneOTP(fullPhone);
      setStep("otp");
      setSuccess(`OTP sent to ${fullPhone}`);
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // ─── Verify Phone OTP ───────────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) return setError("Enter complete 6-digit OTP");
    setLoading(true);
    setError("");
    try {
      const user = await verifyPhoneOTP(otpString);
      onSuccess?.(user);
      onClose?.();
    } catch (err) {
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
    if (!val && i > 0) document.getElementById(`otp-${i - 1}`)?.focus();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 20, padding: 36, width: "100%", maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📍</div>
          <h2 style={{ color: text, fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Welcome to BookNBuy</h2>
          <p style={{ color: sub, fontSize: 14 }}>Sign in to continue</p>
        </div>

        {step === "input" && (
          <>
            {/* Mode Toggle */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, background: dm ? "#0a0a0f" : "#f0f0ff", padding: 4, borderRadius: 12 }}>
              {["email", "phone"].map((m) => (
                <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, background: mode === m ? `linear-gradient(135deg, ${accent}, #00d4ff)` : "transparent", color: mode === m ? "#fff" : sub, transition: "all 0.2s" }}>
                  {m === "email" ? "📧 Email" : "📱 Phone"}
                </button>
              ))}
            </div>

            {mode === "email" ? (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: sub, marginBottom: 8, display: "block" }}>EMAIL ADDRESS</label>
                <input style={inputStyle} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendEmail()} />
                <p style={{ fontSize: 12, color: sub, marginTop: 8 }}>We'll send a magic link to your email. One click to sign in — no password needed.</p>
              </div>
            ) : (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: sub, marginBottom: 8, display: "block" }}>PHONE NUMBER</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <select style={{ ...inputStyle, width: "auto", minWidth: 90 }}>
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+44">🇬🇧 +44</option>
                  </select>
                  <input style={{ ...inputStyle, flex: 1 }} type="tel" placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={10} />
                </div>
              </div>
            )}

            {error && <div style={{ color: "#ff4444", fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}

            <button style={btnStyle} onClick={mode === "email" ? handleSendEmail : handleSendPhone} disabled={loading}>
              {loading ? "Sending..." : mode === "email" ? "Send Magic Link →" : "Send OTP →"}
            </button>

            {/* Invisible reCAPTCHA container for phone auth */}
            <div id="recaptcha-container" />
          </>
        )}

        {step === "otp" && (
          <>
            {success && <div style={{ background: "#00e67622", border: "1px solid #00e676", borderRadius: 10, padding: "12px 16px", fontSize: 14, color: "#00e676", marginBottom: 20 }}>{success}</div>}

            {mode === "phone" && (
              <>
                <p style={{ color: sub, fontSize: 14, textAlign: "center", marginBottom: 24 }}>
                  Enter the 6-digit OTP sent to <strong style={{ color: text }}>{phone}</strong>
                </p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
                  {otp.map((v, i) => (
                    <input key={i} id={`otp-${i}`} style={{ ...inputStyle, width: 48, textAlign: "center", fontSize: 22, fontWeight: 700, padding: "12px 0" }} maxLength={1} value={v} onChange={(e) => handleOtpChange(i, e.target.value)} />
                  ))}
                </div>
                {error && <div style={{ color: "#ff4444", fontSize: 13, marginBottom: 16, textAlign: "center" }}>⚠️ {error}</div>}
                <button style={btnStyle} onClick={handleVerifyOTP} disabled={loading || otp.join("").length !== 6}>
                  {loading ? "Verifying..." : "Verify OTP & Sign In ✓"}
                </button>
                <div style={{ textAlign: "center", marginTop: 12, fontSize: 13, color: sub }}>
                  Didn't receive it? <span style={{ color: accent, cursor: "pointer" }} onClick={() => setStep("input")}>Resend OTP</span>
                </div>
              </>
            )}

            {mode === "email" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
                <p style={{ color: sub, lineHeight: 1.7, fontSize: 15 }}>Check your inbox for the magic link. Click it to sign in automatically. The link expires in 10 minutes.</p>
                <button style={{ ...btnStyle, marginTop: 20, background: "transparent", border: `1px solid ${border}`, color: sub }} onClick={() => setStep("input")}>
                  ← Back
                </button>
              </div>
            )}
          </>
        )}

        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 20, background: "none", border: "none", color: sub, fontSize: 20, cursor: "pointer" }}>✕</button>
      </div>
    </div>
  );
}
