import { useState } from "react";
import { supabase, isSupabaseConfigured } from "../api/supabaseClient";
import { LogIn, UserPlus, Loader2, AlertCircle, KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";

// view: "login" | "signup" | "forgot" | "forgot_sent"
export default function AuthForm({ onSuccess }) {
  const [view, setView] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    if (!isSupabaseConfigured || !supabase) {
      setError("Authentication is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.local and restart Vite.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (view === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (onSuccess) onSuccess();

      } else if (view === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Verification email sent! Please check your inbox.");
        if (onSuccess) onSuccess();

      } else if (view === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setView("forgot_sent");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Forgot Sent confirmation screen ─────────────────────────────────────────
  if (view === "forgot_sent") {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="h-14 w-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Check your inbox</h2>
          <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
            We sent a password reset link to <span className="text-violet-400 font-semibold">{email}</span>.
            Click the link in the email to set a new password.
          </p>
        </div>
        <button
          onClick={() => { setView("login"); setEmail(""); setError(""); }}
          className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 mx-auto"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
        </button>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────────
  const isForgot = view === "forgot";
  const isLogin  = view === "login";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {isLogin ? "Welcome Back" : isForgot ? "Reset Password" : "Create Account"}
        </h2>
        <p className="text-zinc-400 text-sm mt-2">
          {isLogin
            ? "Continue your academic journey"
            : isForgot
            ? "We'll email you a secure reset link"
            : "Join the community and get 50 free tokens"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
            placeholder="student@campus.edu"
          />
        </div>

        {/* Password (hidden on forgot) */}
        {!isForgot && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1 mr-1">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Password</label>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => { setView("forgot"); setError(""); }}
                  className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition-colors uppercase tracking-wider"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
              placeholder="••••••••"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-violet-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isForgot ? (
            <KeyRound className="h-5 w-5" />
          ) : isLogin ? (
            <LogIn className="h-5 w-5" />
          ) : (
            <UserPlus className="h-5 w-5" />
          )}
          {isForgot ? "Send Reset Link" : isLogin ? "Sign In" : "Sign Up"}
        </button>
      </form>

      {/* Footer link */}
      <div className="text-center space-y-2">
        {isForgot ? (
          <button
            onClick={() => { setView("login"); setError(""); }}
            className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 mx-auto"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
          </button>
        ) : (
          <button
            onClick={() => { setView(isLogin ? "signup" : "login"); setError(""); }}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        )}
      </div>
    </div>
  );
}
