import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fetchSummary } from "../api/chatApi.js";
import { useAppStore } from "../store/useAppStore.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { BookOpen, Activity, Zap, ScrollText, Layers, FileSearch, Hash, Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const MODES = [
  { value: "detailed", label: "01 Detailed Report" },
  { value: "bullets", label: "02 Atomic Bullets" },
  { value: "simple", label: "03 Core Concepts" },
  { value: "exam", label: "04 Exam Blueprint" },
];

export default function Summaries() {
  const activeFileIds = useAppStore((state) => state.activeFileIds);
  const [mode, setMode] = useState("detailed");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const summaryRef = useRef(null);
  const { user, fetchLiveUsage, incrementGuestUsage, setShowAuthModal } = useAuthStore();

  async function handleGenerate() {
    if (activeFileIds.length === 0) {
      alert("Please upload some documents in the Library first.");
      return;
    }

    setLoading(true);
    setSummary("");
    setError("");
    try {
      const data = await fetchSummary(activeFileIds[0], mode);
      setSummary(data.summary);
      fetchLiveUsage(); // Refresh live quota
      if (!user) incrementGuestUsage();
    } catch (err) {
      if (err.code === "GUEST_LIMIT_REACHED" || err.code === "LIMIT_REACHED") {
        setShowAuthModal(true);
      } else {
        setError(err.message || "Failed to generate summary. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    if (!summary || !summaryRef.current) return;
    setExporting(true);
    try {
      const element = summaryRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          const content = clonedDoc.getElementById("pdf-export-content");
          if (content) {
            // Setup base styling
            content.style.padding = "60px 80px";
            content.style.background = "#ffffff";
            content.style.color = "#000000";
            content.style.width = "1000px";
            content.style.textAlign = "justify";

            // Add Header
            const header = clonedDoc.createElement("div");
            header.style.marginBottom = "40px";
            header.style.borderBottom = "2px solid #8b5cf6";
            header.style.paddingBottom = "20px";
            header.innerHTML = `
                <h1 style="font-size: 32px; font-weight: 900; color: #1a1a1a; margin: 0; padding: 0;">Smart Campus <span style="font-style: italic; font-family: serif; color: #8b5cf6;">Assistant</span></h1>
                <p style="font-size: 14px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 2px; margin: 8px 0 0 0;">Academic Context Analysis</p>
            `;
            content.prepend(header);

            // Set all text to black for readability and justify
            const texts = content.querySelectorAll("*");
            texts.forEach(t => {
                t.style.color = "#1a1a1a";
                t.style.borderColor = "#e5e7eb";
                if (t.tagName === "P" || t.tagName === "LI") {
                    t.style.textAlign = "justify";
                    t.style.lineHeight = "1.8";
                }
            });
            const strongs = content.querySelectorAll("strong");
            strongs.forEach(s => s.style.color = "#8b5cf6");
          }
        }
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`Summary_${mode}_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("PDF Export failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px w-12 bg-violet-500/50" />
          <span className="text-[12px] font-bold uppercase tracking-widest text-violet-400">Study Material</span>
        </div>
        <h1 className="text-5xl font-black text-white leading-tight">
          Study <span className="italic serif text-zinc-400 font-light pl-2">Summaries</span>
        </h1>
        <p className="text-zinc-400 text-base max-w-xl font-medium leading-relaxed">
          Automatically extract insights from your documents. Choose your preferred format below.
        </p>
      </header>

      <div className="bento-grid">
        {/* Configuration Panel */}
        <div className="bento-item col-span-12 md:col-span-4 bg-[#0d0d0f] flex flex-col justify-between hover:border-violet-500/20 transition-all">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                <Layers className="h-4 w-4" />
              </div>
              <h3 className="text-[12px] font-bold text-white uppercase tracking-widest">Summary Style</h3>
            </div>

            <div className="space-y-3">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border transition-all duration-300 ${mode === m.value
                      ? "border-violet-500 bg-violet-500/10 text-white shadow-lg"
                      : "border-white/5 bg-transparent text-zinc-500 hover:border-white/10 hover:text-zinc-300 hover:bg-white/[0.02]"
                    }`}
                >
                  <span className="text-xs font-bold uppercase tracking-widest">{m.label}</span>
                  <div className={`h-2.5 w-2.5 rounded-full transition-colors ${mode === m.value ? "bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,1)]" : "bg-zinc-800"}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 mt-8">
            <button
              onClick={handleGenerate}
              disabled={loading || activeFileIds.length === 0}
              className="w-full rounded-2xl bg-white py-4 text-sm font-bold text-black transition-all hover:bg-violet-500 hover:text-white active:scale-95 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl"
            >
              {loading ? <Activity className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Generate Summary
            </button>
          </div>
        </div>

        {/* Output Console */}
        <div className="bento-item col-span-12 md:col-span-8 !p-0 flex flex-col min-h-[500px] hover:border-white/10 transition-colors">
          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-3">
              <FileSearch className="h-4 w-4 text-zinc-500" />
              <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest">Summary Result</span>
            </div>
          </div>

          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            {loading && (
              <div className="space-y-6">
                <div className="h-4 w-1/3 animate-pulse rounded-full bg-violet-500/20" />
                <div className="space-y-4">
                  <div className="h-3 w-full animate-pulse rounded-full bg-white/5" />
                  <div className="h-3 w-full animate-pulse rounded-full bg-white/5" />
                  <div className="h-3 w-2/3 animate-pulse rounded-full bg-white/5" />
                </div>
                <p className="text-[12px] font-bold text-violet-400 uppercase tracking-widest flex justify-center items-center gap-2 pt-10">
                  <Activity className="h-4 w-4 animate-spin" /> Generating summary...
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-6 space-y-2 text-center">
                <h4 className="text-[12px] font-bold text-rose-400 uppercase tracking-widest">Error Generating Summary</h4>
                <p className="text-sm font-medium text-rose-300/80">{error}</p>
              </div>
            )}

            {summary && !loading && (
              <div 
                ref={summaryRef}
                id="pdf-export-content"
                className="prose prose-invert max-w-none prose-p:leading-relaxed prose-p:text-zinc-300 prose-headings:text-white prose-headings:serif prose-headings:italic prose-strong:text-violet-400 prose-ul:list-disc prose-li:text-zinc-300"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {summary}
                </ReactMarkdown>
              </div>
            )}

            {!summary && !loading && !error && (
              <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-40">
                <ScrollText className="h-12 w-12 text-zinc-400" />
                <div className="text-center space-y-1">
                  <p className="text-lg font-bold tracking-tight text-white">Ready to Summarize</p>
                  <p className="text-sm text-zinc-400">Your documents will be summarized here.</p>
                </div>
              </div>
            )}
          </div>

          {summary && !loading && (
            <div className="p-4 border-t border-white/5 bg-[#0d0d0f]/50 flex justify-end backdrop-blur-md">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="text-[12px] font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors border border-white/5 rounded-xl px-5 py-3 flex items-center gap-2 hover:bg-white/10 shadow-sm disabled:opacity-50"
              >
                {exporting ? (
                  <Activity className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {exporting ? "Generating PDF..." : "Export Document"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


