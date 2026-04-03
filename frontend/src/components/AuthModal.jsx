import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, ShieldCheck, Trophy } from "lucide-react";
import AuthForm from "./AuthForm";
import { useAuthStore } from "../store/useAuthStore";

export default function AuthModal() {
  const { showAuthModal, setShowAuthModal, guestUsage } = useAuthStore();
  const isLimitReached = guestUsage >= 3;

  if (!showAuthModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-[#0d0d0f] border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative"
      >
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-violet-600/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-600/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="p-8">
          <button
            onClick={() => setShowAuthModal(false)}
            className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {isLimitReached ? (
            <div className="mb-8 space-y-4">
              <div className="h-12 w-12 bg-violet-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Trophy className="h-6 w-6 text-violet-400" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Free Limit Reached!</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                You've experienced the potential of the Smart Campus Assistant. Join our community to unlock **50 free actions** every month.
              </p>
              
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-400" />
                  <span className="text-[11px] text-zinc-300 font-medium">50 Monthly Tokens</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-violet-400" />
                  <span className="text-[11px] text-zinc-300 font-medium">Private Storage</span>
                </div>
              </div>
            </div>
          ) : null}

          <AuthForm onSuccess={() => setShowAuthModal(false)} />
        </div>
      </motion.div>
    </div>
  );
}
