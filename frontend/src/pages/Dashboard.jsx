import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UploadDropzone from "../components/UploadDropzone.jsx";
import { uploadStudyFiles } from "../api/uploadApi.js";
import { useAppStore } from "../store/useAppStore.js";
import { ScrollText, Binary, ShieldCheck, ArrowRight, Activity } from "lucide-react";
import { routes } from "../routes.js";

export default function Dashboard() {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const { activeFileIds, addActiveFileIds } = useAppStore();

  async function handleFilesAdded(files) {
    setError("");
    setIsUploading(true);
    try {
      const response = await uploadStudyFiles(files);
      if (response && response.files) {
        const newIds = response.files.map(f => f.id);
        addActiveFileIds(newIds);
      }
    } catch (uploadError) {
      setError(uploadError.message || "Upload failed. Verify backend status.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px w-12 bg-violet-500/50" />
          <span className="text-[12px] font-bold uppercase tracking-widest text-violet-400">Library Setup</span>
        </div>
        <h1 className="text-5xl font-black text-white leading-tight">
          Study <span className="italic serif text-zinc-400 font-light pl-2">Dashboard</span>
        </h1>
        <p className="text-zinc-400 text-base max-w-xl font-medium leading-relaxed">
          Organize your academic materials. Upload your study documents to get started with the smart campus assistant.
        </p>
      </header>

      {/* Bento Grid Architecture */}
      <div className="bento-grid">
        {/* Primary Action: Ingestion */}
        <div className="bento-item col-span-12 md:col-span-8 group hover:border-violet-500/30 transition-all duration-500">
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 transition-colors group-hover:bg-violet-500/20">
                <ScrollText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">Upload Documents</h2>
                <p className="text-[12px] font-bold text-zinc-500 uppercase tracking-wide">Drag & drop your files here</p>
              </div>
            </div>

            <div className="relative">
              <UploadDropzone onFilesAdded={handleFilesAdded} />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl backdrop-blur-md bg-black/60 z-20 transition-all">
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                    <span className="text-sm font-bold text-violet-400 uppercase tracking-widest">Uploading Documents...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700 blur-xl pointer-events-none">
            <ScrollText className="h-96 w-96 text-violet-300" />
          </div>
        </div>

        {/* Secondary Info: Engine Specs */}
        <div className="bento-item col-span-12 md:col-span-4 flex flex-col justify-between hover:border-blue-500/30">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Binary className="h-4 w-4" />
              </div>
              <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-wide">Processing Core</span>
            </div>
            <h3 className="text-3xl font-bold text-white tracking-tight">System <br /><span className="text-blue-400">Analytics</span></h3>
            <p className="text-sm text-zinc-400 leading-relaxed pt-2">
              High-speed inference for immediate document processing and contextual data retrieval.
            </p>
          </div>
          <div className="pt-8 mt-8 border-t border-white/5">
            <div className="flex justify-between items-center text-sm font-bold uppercase tracking-wide">
              <span className="text-zinc-500">Latency</span>
              <span className="text-emerald-400 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />Ultra-Low</span>
            </div>
          </div>
        </div>

        {/* System Stats Block */}
        <div className="bento-item col-span-12 md:col-span-4 hover:border-emerald-500/30">
          <div className="space-y-6">
            <div className="p-3 w-fit rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-zinc-500 uppercase tracking-wide mb-2">Privacy Preserved</p>
              <h4 className="text-xl font-bold text-white tracking-wide">Local Processing</h4>
              <p className="text-sm text-zinc-400 leading-relaxed mt-3">
                Your documents are processed securely and discarded when your study session ends. No persistent tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Link/Call to Action */}
        <div
          onClick={() => navigate(routes.chat)}
          className="bento-item col-span-12 md:col-span-8 flex flex-col md:flex-row items-center justify-between gap-8 hover:bg-violet-500/[0.03] group border-transparent hover:border-violet-500/30 transition-all duration-500 cursor-pointer"
        >
          <div className="space-y-3">
            <h3 className="text-3xl font-bold text-white tracking-tight group-hover:text-violet-300 transition-colors">
              Start Studying
            </h3>
            <p className="text-sm text-zinc-400 font-medium tracking-wide">
              Currently tracking <span className="text-violet-400 font-bold">{activeFileIds.length}</span> active documents in your session.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white text-black group-hover:bg-violet-500 group-hover:text-white transition-all duration-500 shadow-2xl group-hover:scale-110 group-active:scale-95">
            <ArrowRight className="h-6 w-6" />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-400 tracking-wide flex items-center justify-center gap-2">
          <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          Error: {error}
        </div>
      )}
    </div>
  );
}
