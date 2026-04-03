import { useState } from "react";
import { fetchQuiz } from "../api/chatApi.js";
import { useAppStore } from "../store/useAppStore.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { GraduationCap, Activity, CheckCircle2, XCircle, HelpCircle, Trophy, Binary, Shapes } from "lucide-react";

const DIFFICULTIES = ["easy", "medium", "hard"];

export default function Quizzes() {
  const activeFileIds = useAppStore((state) => state.activeFileIds);
  const [difficulty, setDifficulty] = useState("medium");
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [revealed, setRevealed] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user, fetchLiveUsage, incrementGuestUsage, setShowAuthModal } = useAuthStore();

  async function handleGenerate() {
    if (activeFileIds.length === 0) {
      alert("Please upload some documents in the Library first.");
      return;
    }
    setLoading(true);
    setQuestions([]);
    setSelectedOptions({});
    setRevealed({});
    setError("");
    try {
      const result = await fetchQuiz(activeFileIds, difficulty, count);
      setQuestions(result.questions);
      fetchLiveUsage(); // Refresh live quota
      if (!user) incrementGuestUsage();
    } catch (err) {
      if (err.code === "GUEST_LIMIT_REACHED" || err.code === "LIMIT_REACHED") {
        setShowAuthModal(true);
      } else {
        setError(err.message || "Failed to generate quiz.");
      }
    } finally {
      setLoading(false);
    }
  }

  function revealAnswer(idx) {
    setRevealed((prev) => ({ ...prev, [idx]: true }));
  }

  function handleOptionSelect(qIdx, optionLabel) {
    if (revealed[qIdx]) return;
    setSelectedOptions((prev) => ({ ...prev, [qIdx]: optionLabel }));
  }

  const score = Object.entries(revealed).reduce((acc, [idx, isRevealed]) => {
    if (isRevealed && selectedOptions[idx] === questions[idx]?.answer) return acc + 1;
    return acc;
  }, 0);

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px w-12 bg-violet-500/50" />
          <span className="text-[12px] font-bold uppercase tracking-widest text-violet-400">Knowledge Check</span>
        </div>
        <h1 className="text-5xl font-black text-white leading-tight">
          Assessment <span className="italic serif text-zinc-400 font-light pl-2">System</span>
        </h1>
        <p className="text-zinc-400 text-base max-w-xl font-medium leading-relaxed">
          Generate custom quizzes based on your study materials to reinforce learning and reveal knowledge gaps.
        </p>
      </header>

      <div className="bento-grid">
        {/* Configuration Panel */}
        <div className="bento-item col-span-12 md:col-span-4 bg-[#0d0d0f] flex flex-col justify-between hover:border-violet-500/20 transition-colors">
          <div className="space-y-10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                <Shapes className="h-4 w-4" />
              </div>
              <h3 className="text-[12px] font-bold text-white uppercase tracking-widest">Quiz Options</h3>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <p className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest">Difficulty</p>
                <div className="flex gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`flex-1 py-3 px-2 text-xs font-bold uppercase tracking-widest rounded-xl border transition-all duration-300 ${difficulty === d
                          ? "border-violet-500 bg-violet-500/10 text-white shadow-lg shadow-violet-500/10"
                          : "border-white/5 bg-transparent text-zinc-500 hover:border-white/10 hover:bg-white/[0.02]"
                        }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest">Number of Questions</p>
                <div className="flex items-center justify-between py-4 px-6 bg-white/[0.02] rounded-xl border border-white/5 shadow-inner">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="flex-1 accent-violet-500 mr-6"
                  />
                  <span className="text-xl font-bold text-white mono w-6 text-center">{count}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 mt-8">
            <button
              onClick={handleGenerate}
              disabled={loading || activeFileIds.length === 0}
              className="w-full rounded-2xl bg-white py-4 text-sm font-bold text-black transition-all duration-300 hover:bg-violet-500 hover:text-white active:scale-95 uppercase tracking-widest shadow-xl disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black flex items-center justify-center gap-2"
            >
              {loading ? <Activity className="h-4 w-4 animate-spin" /> : <Shapes className="h-4 w-4" />}
              Generate Quiz
            </button>
          </div>
        </div>

        {/* Results / Status Block */}
        <div className="bento-item col-span-12 md:col-span-8 flex flex-col md:flex-row items-center justify-between gap-8 hover:border-white/10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-violet-400" />
              <h3 className="text-2xl font-bold text-white tracking-tight">Your Score</h3>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
              Answer the questions below to see how well you know the material.
            </p>
          </div>
          <div className="text-center md:text-right bg-white/[0.02] p-6 rounded-2xl border border-white/5">
            <p className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Total Score</p>
            <p className="text-6xl font-black text-white leading-none">
              {score}<span className="text-zinc-700">/</span><span className="text-zinc-400">{questions.length || "0"}</span>
            </p>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="bento-item col-span-12 bg-[#121215]/80 backdrop-blur-md flex flex-col items-center justify-center py-24 space-y-6">
            <div className="h-14 w-14 animate-spin rounded-full border-2 border-violet-500 border-t-transparent shadow-[0_0_20px_rgba(139,92,246,0.3)]" />
            <div className="text-center space-y-3">
              <p className="text-xl font-bold tracking-tight text-white">Generating Quiz Questions</p>
              <p className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest">Analyzing {activeFileIds.length} uploaded documents</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bento-item col-span-12 bg-rose-500/10 border-rose-500/20 text-center py-12 rounded-2xl">
            <div className="inline-flex p-3 rounded-full bg-rose-500/20 text-rose-500 mb-4">
              <Shapes className="h-6 w-6" />
            </div>
            <p className="text-[12px] font-bold text-rose-400 uppercase tracking-widest mb-2">Error Generating Quiz</p>
            <p className="text-sm font-medium text-rose-300">{error}</p>
          </div>
        )}

        {/* Question Feed */}
        {questions.map((q, idx) => (
          <div key={idx} className="bento-item col-span-12 md:col-span-6 space-y-8 hover:border-white/10 transition-colors">
            <div className="flex items-start gap-4 pb-4 border-b border-white/5">
              <span className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 text-sm font-bold text-violet-400">
                {idx + 1}
              </span>
              <h3 className="text-base font-medium text-zinc-200 leading-relaxed mt-1">
                {q.question}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {q.options.map((opt) => {
                const isRevealed = revealed[idx];
                const isSelected = selectedOptions[idx] === opt.label;
                const isCorrect = opt.label === q.answer;

                let styles = "border-white/5 bg-white/[0.02] text-zinc-400 hover:border-white/10 hover:bg-white/[0.04] active:scale-[0.99]";
                if (isSelected) styles = "border-violet-500/50 bg-violet-500/10 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.1)]";
                if (isRevealed) {
                  if (isCorrect) styles = "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
                  else if (isSelected) styles = "border-rose-500/50 bg-rose-500/10 text-rose-400  shadow-[0_0_15px_rgba(244,63,94,0.1)]";
                  else styles = "border-white/5 opacity-30 text-zinc-600";
                }

                return (
                  <button
                    key={opt.label}
                    disabled={isRevealed}
                    onClick={() => handleOptionSelect(idx, opt.label)}
                    className={`flex items-center gap-4 rounded-2xl border p-4 text-left text-sm transition-all duration-300 ${styles}`}
                  >
                    <span className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg bg-black/40 font-bold uppercase text-xs">
                      {opt.label}
                    </span>
                    <span className="flex-1 font-medium">{opt.text}</span>
                    {isRevealed && isCorrect && <CheckCircle2 className="h-5 w-5" />}
                    {isRevealed && isSelected && !isCorrect && <XCircle className="h-5 w-5" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-white/5">
              {!revealed[idx] ? (
               <button
                  onClick={() => revealAnswer(idx)}
                  disabled={!selectedOptions[idx]}
                  className="w-full text-xs font-bold text-violet-400 hover:text-violet-300 disabled:opacity-20 uppercase tracking-widest flex items-center justify-center gap-2 py-3 bg-violet-500/5 hover:bg-violet-500/10 rounded-xl transition-all"
                >
                  <HelpCircle className="h-4 w-4" />
                  Check Answer
                </button>
              ) : (
                <div className="w-full rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-5 mt-2 shadow-inner">
                  <p className="text-[12px] font-bold text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2"><HelpCircle className="h-4 w-4" /> System Feedback</p>
                  <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                    {q.explanation || `The correct answer is ${q.answer}. Review the summary for more details.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

        {!loading && questions.length === 0 && !error && (
          <div className="bento-item col-span-12 py-32 bg-transparent border-dashed border-white/10 flex flex-col items-center justify-center space-y-6 opacity-40 hover:opacity-100 hover:border-violet-500/30 transition-all duration-500">
            <Shapes className="h-20 w-20 text-zinc-400" />
            <p className="text-sm font-bold text-zinc-300 uppercase tracking-widest">Select options and click "Generate Quiz"</p>
          </div>
        )}
      </div>
    </div>
  );
}


