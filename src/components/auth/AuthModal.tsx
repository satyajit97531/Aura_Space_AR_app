import React, { useState, useEffect } from "react";
import { useStore } from "../../store/useStore";
import {
  X,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
}

type AuthMode = "login" | "signup" | "forgot";
type SignupStep = "details" | "otp";
type ForgotStep = "request" | "verify";

// RFC 5322 compatible strict email validator
function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const clean = email.trim().toLowerCase();
  if (clean.length < 5 || clean.length > 254) return false;
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!regex.test(clean)) return false;
  const parts = clean.split("@");
  if (parts.length !== 2) return false;
  const domainParts = parts[1].split(".");
  if (domainParts.length < 2) return false;
  const tld = domainParts[domainParts.length - 1];
  return tld.length >= 2 && /^[a-zA-Z]+$/.test(tld);
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = "login",
}) => {
  const { setCurrentUser } = useStore();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [signupStep, setSignupStep] = useState<SignupStep>("details");
  const [forgotStep, setForgotStep] = useState<ForgotStep>("request");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Sync mode and reset state on open
  useEffect(() => {
    setMode(initialMode);
    setSignupStep("details");
    setForgotStep("request");
    setError(null);
    setSuccessMsg(null);
    setOtp("");
    setResendCooldown(0);
  }, [initialMode, isOpen]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Safe JSON API fetch wrapper preventing "Unexpected token" errors
  const safeAuthFetch = async (url: string, options: RequestInit): Promise<any> => {
    let res: Response;
    try {
      res = await fetch(url, options);
    } catch {
      throw new Error("Network connection error. Please verify your connection.");
    }

    const rawText = await res.text();
    let data: any = null;

    try {
      data = JSON.parse(rawText);
    } catch {
      if (res.status === 404) {
        throw new Error("Authentication route not found (404). Please ensure latest vercel.json is deployed.");
      }
      if (res.status >= 500) {
        throw new Error(`Server error (${res.status}). If deployed on Vercel, check Serverless Function logs.`);
      }
      throw new Error(`Unexpected response (${res.status}): ${rawText.slice(0, 100)}`);
    }

    if (!res.ok || (data && data.success === false)) {
      throw new Error(data?.error || `Request failed (${res.status})`);
    }

    return data;
  };

  // 1. Send OTP helper
  const handleSendOtp = async (purpose: "signup" | "forgot_password") => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your email address.");
      return false;
    }
    if (!validateEmail(cleanEmail)) {
      setError("Please enter a valid email address (e.g., name@example.com).");
      return false;
    }

    if (purpose === "signup") {
      if (!name.trim()) {
        setError("Please enter your full name.");
        return false;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return false;
      }
    }

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const data = await safeAuthFetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, purpose }),
      });

      setResendCooldown(25);
      setSuccessMsg(data.message || `Verification code dispatched to ${cleanEmail}`);
      if (purpose === "signup") {
        setSignupStep("otp");
      } else {
        setForgotStep("verify");
      }
      return true;
    } catch (err: any) {
      setError(err.message || "Could not send verification code. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Complete Signup with OTP
  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      setError("Please enter the 6-digit verification code sent to your email.");
      return;
    }

    setIsLoading(true);

    try {
      const data = await safeAuthFetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: cleanEmail,
          password,
          otp: cleanOtp,
        }),
      });

      setSuccessMsg("Account verified & created successfully! Welcome to AuraSpace.");
      setCurrentUser(data.user);

      setTimeout(() => {
        onClose();
        setName("");
        setPassword("");
        setOtp("");
        setSuccessMsg(null);
      }, 700);
    } catch (err: any) {
      setError(err.message || "Signup failed. Please verify code.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Regular Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    if (!validateEmail(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      const data = await safeAuthFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      setSuccessMsg("Welcome back! Loading your personal spatial workspace...");
      setCurrentUser(data.user);

      setTimeout(() => {
        onClose();
        setPassword("");
        setSuccessMsg(null);
      }, 700);
    } catch (err: any) {
      setError(err.message || "Failed to sign in.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Instant Login via OTP
  const handleInstantOtpLogin = async () => {
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      setError("Please enter the 6-digit verification code sent to your email.");
      return;
    }

    setIsLoading(true);

    try {
      const data = await safeAuthFetch("/api/auth/login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
      });

      setSuccessMsg("Verification confirmed! Welcome back to AuraSpace.");
      setCurrentUser(data.user);

      setTimeout(() => {
        onClose();
        setPassword("");
        setOtp("");
        setSuccessMsg(null);
      }, 700);
    } catch (err: any) {
      setError(err.message || "Failed to sign in with code.");
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Reset Password & Login via OTP
  const handleResetPasswordWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      setError("Please enter the 6-digit verification code sent to your email.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const data = await safeAuthFetch("/api/auth/reset-password-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          otp: cleanOtp,
          newPassword,
        }),
      });

      setSuccessMsg("Password reset successfully! Logging you in...");
      setCurrentUser(data.user);

      setTimeout(() => {
        onClose();
        setPassword("");
        setNewPassword("");
        setOtp("");
        setSuccessMsg(null);
      }, 700);
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="auth-modal-card"
        className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-stone-100"
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              {mode === "forgot" ? <KeyRound className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                {mode === "login"
                  ? "Sign In to AuraSpace"
                  : mode === "signup"
                  ? "Create AuraSpace Account"
                  : "Account Recovery & OTP Login"}
              </h2>
              <p className="text-xs text-stone-400">
                {mode === "login"
                  ? "Access your private blueprints & personal workspace"
                  : mode === "signup"
                  ? "Verified email keeps your spatial designs secure"
                  : "Recover your account with a secure email verification code"}
              </p>
            </div>
          </div>
          <button
            id="auth-modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Mode Tabs (Visible when in login or signup) */}
        {mode !== "forgot" && (
          <div className="flex p-1.5 mx-5 mt-4 bg-stone-950/60 rounded-xl border border-stone-800/80">
            <button
              id="auth-tab-login"
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                mode === "login"
                  ? "bg-stone-800 text-amber-300 font-semibold shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              Sign In
            </button>
            <button
              id="auth-tab-signup"
              type="button"
              onClick={() => {
                setMode("signup");
                setSignupStep("details");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                mode === "signup"
                  ? "bg-stone-800 text-amber-300 font-semibold shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              Create Account (Verified)
            </button>
          </div>
        )}

        {/* Global Feedback Banners */}
        <div className="px-5 pt-3">
          {error && (
            <div
              id="auth-error-banner"
              className="p-3 bg-red-950/50 border border-red-800/50 rounded-xl text-xs text-red-300 flex items-start gap-2.5 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              id="auth-success-banner"
              className="p-3 bg-emerald-950/50 border border-emerald-800/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* MODE 1: PASSWORD LOGIN                                   */}
        {/* ======================================================== */}
        {mode === "login" && (
          <form onSubmit={handlePasswordLogin} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. designer@auraspace.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-stone-300">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setForgotStep("request");
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Forgot password / Sign in with OTP?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password-input"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition-all active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In to Private Account</span>
              )}
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* MODE 2: SIGNUP (TWO-STEP: DETAILS -> EMAIL OTP)          */}
        {/* ======================================================== */}
        {mode === "signup" && signupStep === "details" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendOtp("signup");
            }}
            className="p-5 space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="signup-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Satyajit Samanta"
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                Valid Email Address (For OTP Verification)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="signup-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 transition-colors"
                />
              </div>
              <p className="text-[10px] text-stone-500 mt-1">
                We will dispatch a secure 6-digit confirmation code to verify this email.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">Create Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="signup-password-input"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-10 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="signup-send-otp-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition-all active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validating Email & Sending Code...</span>
                </>
              ) : (
                <span>Send 6-Digit Email Verification Code</span>
              )}
            </button>
          </form>
        )}

        {/* SIGNUP STEP 2: ENTER OTP */}
        {mode === "signup" && signupStep === "otp" && (
          <form onSubmit={handleCompleteSignup} className="p-5 space-y-4">
            <div className="p-3 bg-stone-950/80 border border-stone-800/80 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">
                  Verifying Email
                </p>
                <p className="text-xs text-stone-200 font-medium truncate max-w-[240px]">{email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSignupStep("details")}
                className="text-[11px] text-stone-400 hover:text-amber-400 transition-colors"
              >
                Change Email
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                Enter 6-Digit Verification Code
              </label>
              <input
                id="signup-otp-input"
                type="text"
                required
                maxLength={6}
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full py-3 bg-stone-950 border border-stone-800 rounded-xl text-center text-xl font-mono tracking-[0.5em] text-amber-400 placeholder:text-stone-700 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 transition-colors"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-400">
              <span>Didn't receive code?</span>
              <button
                type="button"
                disabled={resendCooldown > 0 || isLoading}
                onClick={() => handleSendOtp("signup")}
                className="text-amber-400 hover:text-amber-300 disabled:opacity-40 transition-colors font-medium flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
              </button>
            </div>

            <button
              id="signup-verify-btn"
              type="submit"
              disabled={isLoading || otp.length < 6}
              className="w-full mt-2 py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition-all active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying & Creating Account...</span>
                </>
              ) : (
                <span>Verify & Activate Account</span>
              )}
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* MODE 3: FORGOT PASSWORD / OTP LOGIN                      */}
        {/* ======================================================== */}
        {mode === "forgot" && forgotStep === "request" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendOtp("forgot_password");
            }}
            className="p-5 space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="forgot-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 transition-colors"
                />
              </div>
              <p className="text-[10px] text-stone-500 mt-1">
                We'll dispatch a 6-digit one-time code allowing you to sign in instantly or set a new password.
              </p>
            </div>

            <button
              id="forgot-send-otp-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition-all active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking Account & Sending Code...</span>
                </>
              ) : (
                <span>Send One-Time Login Code</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccessMsg(null);
              }}
              className="w-full py-2 text-xs text-stone-400 hover:text-stone-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Password Login</span>
            </button>
          </form>
        )}

        {/* FORGOT STEP 2: VERIFY OTP + INSTANT LOGIN OR RESET PASSWORD */}
        {mode === "forgot" && forgotStep === "verify" && (
          <div className="p-5 space-y-4">
            <div className="p-3 bg-stone-950/80 border border-stone-800/80 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">
                  Verification Destination
                </p>
                <p className="text-xs text-stone-200 font-medium truncate max-w-[240px]">{email}</p>
              </div>
              <button
                type="button"
                onClick={() => setForgotStep("request")}
                className="text-[11px] text-stone-400 hover:text-amber-400 transition-colors"
              >
                Change Email
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                Enter 6-Digit OTP Code
              </label>
              <input
                id="forgot-otp-input"
                type="text"
                required
                maxLength={6}
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full py-3 bg-stone-950 border border-stone-800 rounded-xl text-center text-xl font-mono tracking-[0.5em] text-amber-400 placeholder:text-stone-700 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 transition-colors"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-400">
              <span>Didn't receive code?</span>
              <button
                type="button"
                disabled={resendCooldown > 0 || isLoading}
                onClick={() => handleSendOtp("forgot_password")}
                className="text-amber-400 hover:text-amber-300 disabled:opacity-40 transition-colors font-medium flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
              </button>
            </div>

            {/* Quick Option 1: Instant Login with OTP */}
            <button
              id="instant-otp-login-btn"
              type="button"
              disabled={isLoading || otp.length < 6}
              onClick={handleInstantOtpLogin}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition-all active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Instant Sign In with OTP</span>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 h-px bg-stone-800" />
              <span className="text-[10px] text-stone-500 uppercase tracking-wider">or set new password</span>
              <div className="flex-1 h-px bg-stone-800" />
            </div>

            {/* Option 2: Set New Password */}
            <form onSubmit={handleResetPasswordWithOtp} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  New Password (Optional)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="forgot-new-password-input"
                    type={showNewPassword ? "text" : "password"}
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-10 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="reset-password-submit-btn"
                type="submit"
                disabled={isLoading || otp.length < 6 || newPassword.length < 6}
                className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 font-medium rounded-xl text-xs flex items-center justify-center gap-2 border border-stone-700/60 transition-colors"
              >
                <span>Save New Password & Log In</span>
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccessMsg(null);
              }}
              className="w-full py-1 text-xs text-stone-400 hover:text-stone-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Password Login</span>
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="px-5 py-3.5 bg-stone-950/40 border-t border-stone-800 text-[11px] text-stone-400 text-center">
          {mode === "login" ? (
            <p>
              Don't have an account yet?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setSignupStep("details");
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-amber-400 hover:underline font-medium"
              >
                Create verified account
              </button>
            </p>
          ) : mode === "signup" ? (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-amber-400 hover:underline font-medium"
              >
                Sign in here
              </button>
            </p>
          ) : (
            <p>
              Remembered your credentials?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-amber-400 hover:underline font-medium"
              >
                Back to sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
