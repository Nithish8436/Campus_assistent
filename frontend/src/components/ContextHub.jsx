import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, X, GraduationCap, CheckCircle2 } from "lucide-react";
import { useAppStore } from "../store/useAppStore.js";
import { fetchFileList } from "../api/chatApi.js";
import { uploadStudyFiles } from "../api/uploadApi.js";

export default function ContextHub({ isOpen, setIsOpen }) {
    const [files, setFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const { activeFileIds, setActiveFileIds } = useAppStore();

    useEffect(() => {
        if (isOpen) {
            loadFiles();
        }
    }, [isOpen]);

    async function loadFiles() {
        try {
            const result = await fetchFileList();
            setFiles(result.files || []);
        } catch (err) {
            console.error("Failed to load files:", err);
        }
    }

    async function onFileChange(e) {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        setIsUploading(true);
        try {
            await uploadStudyFiles(selectedFiles);
            await loadFiles();
        } catch (err) {
            alert("Upload failed: " + err.message);
        } finally {
            setIsUploading(false);
        }
    }

    const toggleFile = (id) => {
        if (activeFileIds.includes(id)) {
            setActiveFileIds(activeFileIds.filter(fid => fid !== id));
        } else {
            setActiveFileIds([...activeFileIds, id]);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-[#09090b]/90 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.98, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.98, opacity: 0, y: 10 }}
                        className="w-full max-w-3xl overflow-hidden rounded-sm border border-white/10 bg-[#121215] shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/5 px-8 py-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white serif tracking-tight">Manuscript Library</h2>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Select Active Context</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-full p-2 hover:bg-white/5 transition-colors"
                            >
                                <X className="h-5 w-5 text-zinc-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
                            {/* File List */}
                            <div className="col-span-3 max-h-[450px] overflow-y-auto border-r border-white/5 p-8 space-y-4">
                                <label className="flex cursor-pointer items-center justify-center gap-3 rounded-sm border border-dashed border-white/10 p-6 transition-all hover:border-violet-500/50 hover:bg-white/5 group">
                                    <div className="p-2 rounded-full bg-zinc-800 text-zinc-400 group-hover:bg-violet-500/20 group-hover:text-violet-400 transition-all">
                                        <Plus className="h-4 w-4" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-white">Ingest Document</p>
                                        <p className="text-[10px] text-zinc-500">PDF, DOCX supported</p>
                                    </div>
                                    <input type="file" multiple className="hidden" onChange={onFileChange} disabled={isUploading} />
                                </label>

                                {isUploading && (
                                    <div className="flex items-center justify-center py-4 gap-3 bg-white/5 rounded-sm">
                                        <div className="h-3 w-3 animate-spin rounded-full border border-violet-500 border-t-transparent"></div>
                                        <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Architecting Knowledge...</span>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {files.map(file => (
                                        <div
                                            key={file.id}
                                            onClick={() => toggleFile(file.id)}
                                            className={`group flex items-center justify-between rounded-sm p-4 transition-all cursor-pointer border ${activeFileIds.includes(file.id)
                                                ? 'border-violet-500/50 bg-violet-500/5'
                                                : 'border-white/5 bg-transparent hover:border-white/20'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <FileText className={`h-5 w-5 shrink-0 ${activeFileIds.includes(file.id) ? 'text-violet-400' : 'text-zinc-600'}`} />
                                                <div className="overflow-hidden">
                                                    <p className="truncate text-sm font-medium text-zinc-200">{file.original_name}</p>
                                                    <p className="text-[10px] text-zinc-600 font-bold uppercase">{(file.size_bytes / 1024).toFixed(1)} KB</p>
                                                </div>
                                            </div>
                                            {activeFileIds.includes(file.id) && (
                                                <CheckCircle2 className="h-4 w-4 text-violet-500" />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {!isUploading && files.length === 0 && (
                                    <div className="py-20 text-center space-y-2 opacity-20 italic">
                                        <FileText className="mx-auto h-8 w-8" />
                                        <p className="text-xs">Archive is empty.</p>
                                    </div>
                                )}
                            </div>

                            {/* Status / Meta area */}
                            <div className="col-span-2 bg-[#0d0d0f] p-10 flex flex-col justify-between">
                                <div className="space-y-6">
                                    <div className="h-12 w-12 rounded-sm bg-violet-500/10 flex items-center justify-center text-violet-500 border border-violet-500/20">
                                        <GraduationCap className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold text-white serif italic">Academic Integrity</h3>
                                        <p className="text-xs text-zinc-500 leading-relaxed">
                                            All responses are grounded in the curated context provided above. Higher context volume may increase synthesis time.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-10 border-t border-white/5 space-y-4">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Selections</p>
                                        <p className="text-xl font-bold text-white mono">{activeFileIds.length}</p>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-full rounded-sm bg-white py-4 text-xs font-black text-black transition-all hover:bg-zinc-200 active:scale-[0.98] uppercase tracking-[0.2em]"
                                    >
                                        Confirm Context
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

