import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAppStore } from "../store/useAppStore.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { sendChatMessage } from "../api/chatApi.js";
import { MessageSquare, Send, Terminal, FileText, User, LogIn, Zap } from "lucide-react";

export default function Chat() {
  const activeFileIds = useAppStore((state) => state.activeFileIds);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);
  const { user, usage, fetchLiveUsage, guestUsage, incrementGuestUsage, setShowAuthModal } = useAuthStore();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    if (activeFileIds.length === 0) {
      alert("Please upload some documents in the Library first.");
      return;
    }
    
    // Enforcement: Pre-check guest limits
    if (!user && guestUsage >= 3) {
      setShowAuthModal(true);
      return;
    }

    const userMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setIsLoading(true);

    try {
      setMessages((prev) => [...prev, { role: "assistant", content: "..." }]);

      await sendChatMessage(question, activeFileIds, (currentText) => {
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: "assistant", content: currentText };
          return newMessages;
        });
      });

      fetchLiveUsage(); // Refresh live quota
      if (!user) incrementGuestUsage();
    } catch (err) {
      console.error("Chat flow error:", err);
      // The error now has 'code' because of chatApi changes
      if (err.code === "GUEST_LIMIT_REACHED" || err.code === "LIMIT_REACHED") {
        setMessages((prev) => prev.slice(0, -1)); // Remove the "..." message
        setShowAuthModal(true);
      } else {
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: "assistant", content: `System Error: ${err.message || "Unknown anomaly detected."}` };
          return newMessages;
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header Info Strip */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 px-2">
        <div className="flex items-center gap-4">
          <div className="h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">Interactive Console</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-zinc-500 uppercase">Context</span>
            <span className="text-[12px] font-bold text-violet-400">{activeFileIds.length} Documents</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-zinc-500 uppercase">Status</span>
            <span className="text-[12px] font-bold text-emerald-400">Secure</span>
          </div>
        </div>
      </div>

      <div className="bento-grid min-h-[65vh]">
        {/* Chat Console */}
        <div className="bento-item col-span-12 md:col-span-9 !p-0 flex flex-col hover:border-white/10 transition-colors">
          {/* Scroll Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scroll-smooth custom-scrollbar"
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-30 py-20 pointer-events-none">
                <Terminal className="h-14 w-14 text-violet-400" />
                <div className="space-y-2">
                  <p className="text-2xl font-bold tracking-tight">What would you like to explore?</p>
                  <p className="text-sm uppercase tracking-widest font-bold text-zinc-400">Query your uploaded documents</p>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] space-y-2 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                  <div className={`flex items-center gap-2 opacity-50 mb-1 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`h-px w-4 ${msg.role === "user" ? "bg-zinc-400" : "bg-violet-400"}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      {msg.role === "user" ? "YOU" : "SYSTEM"}
                    </span>
                  </div>
                  <div className={`rounded-2xl p-5 ${
                    msg.role === "user"
                      ? "bg-white text-black font-medium text-sm leading-relaxed rounded-tr-sm shadow-xl"
                      : "bg-[#16161a]/80 backdrop-blur-md border border-white/5 text-zinc-200 text-sm leading-relaxed rounded-tl-sm shadow-xl"
                  }`}>
                    {msg.role === "user" ? (
                      <p className="text-black text-sm font-medium leading-relaxed">{msg.content}</p>
                    ) : (
                      <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/5 prose-code:text-violet-400">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="inline-flex gap-2 p-4 bg-[#16161a]/80 rounded-2xl rounded-tl-sm backdrop-blur-md border border-white/5 shadow-xl">
                  <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                  <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse delay-75" />
                  <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse delay-150" />
                </div>
              </div>
            )}
          </div>

          {/* Input Unit */}
          <div className="p-4 md:p-6 border-t border-white/5 bg-[#0d0d0f]/50 backdrop-blur-md">
            <form onSubmit={handleSubmit} className="relative group flex items-center justify-center">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-6 pr-16 text-base text-white placeholder-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={isLoading || !question.trim()}
                className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center rounded-xl bg-white text-black hover:bg-violet-500 hover:text-white disabled:opacity-30 disabled:bg-white/10 disabled:text-zinc-500 transition-colors shadow-sm"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="hidden md:flex col-span-3 flex-col gap-4">

          {/* WHO YOU ARE */}
          <div className="bento-item bg-[#0d0d0f] !p-5">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border ${
                user
                  ? "bg-violet-500/10 border-violet-500/20 text-violet-400"
                  : "bg-zinc-800/50 border-white/10 text-zinc-400"
              }`}>
                {user ? <User className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {user ? "Signed In" : "Guest Mode"}
                </p>
                <p className="text-sm font-semibold text-white truncate">
                  {user ? user.email : "Sign in to save your library"}
                </p>
              </div>
            </div>
          </div>

          {/* ACTIVE DOCUMENTS */}
          <div className="bento-item bg-[#0d0d0f] !p-5 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Active Documents</p>
            {activeFileIds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 opacity-30 gap-2">
                <FileText className="h-8 w-8 text-zinc-500" />
                <p className="text-[11px] text-zinc-500 text-center">No documents selected.<br />Open Context Hub to add some.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeFileIds.map((id, i) => (
                  <div key={id} className="flex items-center gap-2 p-2 rounded-lg bg-violet-500/5 border border-violet-500/20">
                    <FileText className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                    <span className="text-[11px] font-medium text-violet-300 truncate">Document {i + 1}</span>
                  </div>
                ))}
                <p className="text-[10px] text-zinc-600 pt-1">{activeFileIds.length} document{activeFileIds.length !== 1 ? 's' : ''} in context</p>
              </div>
            )}
          </div>

          {/* USAGE QUOTA */}
          <div className="bento-item bg-[#0d0d0f] !p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Usage Quota</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                user ? "bg-violet-500/20 text-violet-400" : "bg-zinc-700/50 text-zinc-400"
              }`}>
                {usage?.role === "member" ? "Member" : "Guest"}
              </span>
            </div>
            
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  usage?.percent >= 100 ? "bg-red-500" : "bg-violet-500"
                }`}
                style={{ width: `${Math.min(usage?.percent || 0, 100)}%` }}
              />
            </div>
            
            <p className="text-[10px] text-zinc-500 text-right">
              {usage ? (
                <span className={usage.percent >= 100 ? "text-red-400 font-semibold" : ""}>
                    {usage.used}/{usage.limit} {usage.role === "member" ? "actions this month" : "free actions used"}
                </span>
              ) : (
                "Loading..."
              )}
            </p>
            
            {!user && usage?.percent >= 100 && (
              <button
                onClick={() => setShowAuthModal(true)}
                className="mt-3 w-full text-[11px] font-bold text-center py-2 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <Zap className="h-3 w-3" /> Sign up for 50 free actions
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}


