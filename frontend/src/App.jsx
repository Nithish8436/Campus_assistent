import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, MessageSquare, BookOpen, GraduationCap, Database } from "lucide-react";
import { routes } from "./routes.js";
import ContextHub from "./components/ContextHub.jsx";
import { useAppStore } from "./store/useAppStore.js";
import { useAuthStore } from "./store/useAuthStore.js";
import { useEffect } from "react";
import AuthModal from "./components/AuthModal.jsx";
import { LogOut, User } from "lucide-react";

const navItems = [
  { to: routes.dashboard, icon: LayoutDashboard, label: "Library" },
  { to: routes.chat, icon: MessageSquare, label: "Workspace" },
  { to: routes.summaries, icon: BookOpen, label: "Summaries" },
  { to: routes.quizzes, icon: GraduationCap, label: "Quizzes" }
];

const inkBleedVariants = {
  initial: { clipPath: "circle(0% at 50% 50%)", opacity: 0 },
  animate: { clipPath: "circle(150% at 50% 50%)", opacity: 1 },
  exit: { clipPath: "circle(0% at 50% 50%)", opacity: 0 }
};

export default function App() {
  const location = useLocation();
  const [isHubOpen, setIsHubOpen] = useState(false);
  const { activeFileIds } = useAppStore();
  const { user, initialize, signOut, setShowAuthModal } = useAuthStore();

  useEffect(() => {
    const unsub = initialize();
    return () => unsub && typeof unsub === "function" && unsub();
  }, [initialize]);

  return (
    <div className="relative min-h-screen bg-[#09090b] selection:bg-violet-500/30 overflow-x-hidden">
      {/* Structural Backdrop */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] select-none"
        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12 pt-12 pb-40">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={inkBleedVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Command Dock */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <nav className="command-dock">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `dock-item group ${isActive ? "active" : ""}`}
            >
              <item.icon className="h-5 w-5" />
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#121215] text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl border border-white/10">
                {item.label}
              </div>
            </NavLink>
          ))}

          <div className="w-[1px] h-8 bg-white/10 mx-2" />

          <button
            onClick={() => setIsHubOpen(true)}
            className={`dock-item group relative`}
          >
            <Database className="h-5 w-5" />
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#121215] text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl border border-white/10">
              Context Hub
            </div>
            {activeFileIds.length > 0 && (
              <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.8)]"></span>
              </span>
            )}
          </button>

          <div className="w-[1px] h-8 bg-white/10 mx-2" />

          {user ? (
            <button
              onClick={() => signOut()}
              className="dock-item group relative"
            >
              <LogOut className="h-5 w-5 text-zinc-400 group-hover:text-red-400 transition-colors" />
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#121215] text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl border border-white/10">
                Sign Out ({user.email.split("@")[0]})
              </div>
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="dock-item group relative"
            >
              <User className="h-5 w-5" />
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#121215] text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl border border-white/10">
                Sign In
              </div>
            </button>
          )}
        </nav>
      </div>

      <ContextHub isOpen={isHubOpen} setIsOpen={setIsHubOpen} />
      <AuthModal />
    </div>
  );
}



