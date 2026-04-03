"use client";
import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from "react";
import { vocabulary, numberVocab, VocabItem } from "@/data/vocabulary";
import { useSRS } from "@/hooks/useSRS";

type Direction = "jp-th" | "th-jp";
type ChapterFilter = 0 | 1 | 2 | 3;

export default function FlashcardPage() {
  const { getCard, updateCard, getDueCards, getStats, isLoaded } = useSRS();
  const srsRef = useRef({ getDueCards, getCard });

  useLayoutEffect(() => {
    srsRef.current = { getDueCards, getCard };
  }, [getDueCards, getCard]);
  const [direction, setDirection] = useState<Direction>("jp-th");
  const [chapterFilter, setChapterFilter] = useState<ChapterFilter>(0);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showNumbers, setShowNumbers] = useState(false);
  const [showWordFilter, setShowWordFilter] = useState(false);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("japan-vocab-exclude");
        if (saved) return new Set<string>(JSON.parse(saved));
      } catch { /* ignore */ }
    }
    return new Set<string>();
  });
  const [flipped, setFlipped] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deck, setDeck] = useState<VocabItem[]>([]);
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0 });
  const [sessionCorrect, setSessionCorrect] = useState<Record<string, number>>({});
  const [showComplete, setShowComplete] = useState(false);
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

  const availableCategories = useMemo(() => {
    const base = chapterFilter === 0 ? vocabulary : vocabulary.filter((v) => v.chapter === chapterFilter);
    const cats = Array.from(new Set(base.map((v) => v.category)));
    return cats.sort();
  }, [chapterFilter]);

  // Full list for word-picker (no exclusion filter applied so excluded words stay visible)
  const wordPickerList = useMemo(() => {
    let base = chapterFilter === 0 ? vocabulary : vocabulary.filter((v) => v.chapter === chapterFilter);
    if (showNumbers) base = [...base, ...numberVocab];
    if (categoryFilter) base = base.filter((v) => v.category === categoryFilter);
    return base;
  }, [chapterFilter, categoryFilter, showNumbers]);

  const toggleExclude = useCallback((id: string) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem("japan-vocab-exclude", JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const buildDeck = useCallback((): VocabItem[] => {
    const { getDueCards: dueFn, getCard: cardFn } = srsRef.current;
    let base = chapterFilter === 0 ? vocabulary : vocabulary.filter((v) => v.chapter === chapterFilter);
    if (showNumbers) base = [...base, ...numberVocab];
    if (categoryFilter) base = base.filter((v) => v.category === categoryFilter);
    base = base.filter((v) => !excludedIds.has(v.id));

    const due = dueFn(base.map((v) => v.id));
    const duePriority = base.filter((v) => due.includes(v.id));
    const rest = base.filter((v) => !due.includes(v.id));

    // Split rest into learning (1-3) and mastered (4-5)
    const learningItems = rest.filter((v) => {
      const l = cardFn(v.id).level;
      return l > 0 && l < 4;
    });
    const masteredItems = rest.filter((v) => cardFn(v.id).level >= 4);
    // Include only 20% of mastered for occasional review
    const masteredSample = shuffle(masteredItems).slice(0, Math.ceil(masteredItems.length * 0.2));

    return [...shuffle(duePriority), ...shuffle(learningItems), ...masteredSample];
  }, [chapterFilter, categoryFilter, showNumbers, excludedIds]);

  useEffect(() => {
    if (!isLoaded) return;
    queueMicrotask(() => {
      setDeck(buildDeck());
      setCurrentIndex(0);
      setFlipped(false);
      setShowComplete(false);
      setSessionCorrect({});
    });
  }, [isLoaded, buildDeck]);

  const current = deck[currentIndex];

  const handleFlip = () => {
    if (!showComplete) setFlipped((f) => !f);
  };

  const handleAnswer = (correct: boolean) => {
    if (!current) return;
    updateCard(current.id, correct, true); // cram=true for in-session intervals

    if (correct) {
      const hits = (sessionCorrect[current.id] ?? 0) + 1;
      setSessionCorrect((prev) => ({ ...prev, [current.id]: hits }));
      setSessionStats((s) => ({ ...s, correct: s.correct + 1 }));
      setSlideDir("left");

      setTimeout(() => {
        setFlipped(false);
        setSlideDir(null);
        if (hits === 1) {
          // First correct: re-queue at end for confirmation
          setDeck((prev) => {
            const next = prev.filter((_, i) => i !== currentIndex);
            return [...next, current];
          });
          // currentIndex stays (next card slides in)
          if (currentIndex >= deck.length - 1) {
            setCurrentIndex(0);
          }
        } else {
          // Second correct: graduated, advance normally
          if (currentIndex + 1 >= deck.length) {
            setShowComplete(true);
          } else {
            setCurrentIndex((i) => i + 1);
          }
        }
      }, 300);
    } else {
      setSessionStats((s) => ({ ...s, wrong: s.wrong + 1 }));
      setSlideDir("right");
      setTimeout(() => {
        setFlipped(false);
        setSlideDir(null);
        // Re-queue at end
        setDeck((prev) => {
          const next = prev.filter((_, i) => i !== currentIndex);
          return [...next, current];
        });
        if (currentIndex >= deck.length - 1) {
          setCurrentIndex(0);
        }
      }, 300);
    }
  };

  const handleRestart = () => {
    setDeck(buildDeck());
    setCurrentIndex(0);
    setFlipped(false);
    setShowComplete(false);
    setSessionStats({ correct: 0, wrong: 0 });
    setSessionCorrect({});
  };

  const progress = deck.length > 0 ? ((currentIndex + 1) / deck.length) * 100 : 0;

  const allIds = (chapterFilter === 0 ? vocabulary : vocabulary.filter((v) => v.chapter === chapterFilter))
    .concat(showNumbers ? numberVocab : [])
    .map((v) => v.id);
  const stats = isLoaded ? getStats(allIds) : null;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400 text-center">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (showComplete) {
    const total = sessionStats.correct + sessionStats.wrong;
    const pct = total > 0 ? Math.round((sessionStats.correct / total) * 100) : 0;
    return (
      <div className="px-4 py-6 flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="text-6xl mb-4">{pct >= 80 ? "🎉" : pct >= 60 ? "😊" : "💪"}</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">รอบนี้เสร็จแล้ว!</h2>
        <p className="text-gray-500 mb-6">
          ถูก {sessionStats.correct} / {total} ข้อ ({pct}%)
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleRestart}
            className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors btn-press"
          >
            เรียนต่อ 🔄
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">บัตรคำศัพท์</h1>
        <p className="text-sm text-gray-500 font-jp">単語カード</p>
      </div>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        {/* Direction toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => { setDirection("jp-th"); setFlipped(false); }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${direction === "jp-th" ? "bg-white text-red-600 shadow-sm" : "text-gray-500"}`}
          >
            日→ไทย
          </button>
          <button
            onClick={() => { setDirection("th-jp"); setFlipped(false); }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${direction === "th-jp" ? "bg-white text-red-600 shadow-sm" : "text-gray-500"}`}
          >
            ไทย→日
          </button>
        </div>
        {/* Chapter filter */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {([0, 1, 2, 3] as ChapterFilter[]).map((ch) => (
            <button
              key={ch}
              onClick={() => { setChapterFilter(ch); setCategoryFilter(null); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${chapterFilter === ch ? "bg-white text-red-600 shadow-sm" : "text-gray-500"}`}
            >
              {ch === 0 ? "ทั้งหมด" : `บท ${ch}`}
            </button>
          ))}
        </div>
        {/* Numbers toggle */}
        <button
          onClick={() => setShowNumbers((v) => !v)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${showNumbers ? "bg-amber-500 text-white border-amber-500" : "bg-gray-100 text-gray-500 border-transparent"}`}
        >
          🔢 ตัวเลข
        </button>
        {/* Word picker toggle */}
        <button
          onClick={() => setShowWordFilter((v) => !v)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${showWordFilter ? "bg-indigo-500 text-white border-indigo-500" : "bg-gray-100 text-gray-500 border-transparent"}`}
        >
          ☑ เลือกคำ{excludedIds.size > 0 ? ` (−${excludedIds.size})` : ""}
        </button>
      </div>
      {/* Category filter chips */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setCategoryFilter(null)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${!categoryFilter ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-500 border-gray-200"}`}
        >
          ทุกหมวด
        </button>
        {availableCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${categoryFilter === cat ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-500 border-gray-200"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Word picker panel */}
      {showWordFilter && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">
              เลือกคำที่จะทบทวน
              <span className="ml-2 text-xs font-normal text-gray-400">
                {wordPickerList.length - wordPickerList.filter((v) => excludedIds.has(v.id)).length} / {wordPickerList.length} คำ
              </span>
            </p>
            <button
              onClick={() => {
                setExcludedIds(new Set());
                try { localStorage.removeItem("japan-vocab-exclude"); } catch { /* ignore */ }
              }}
              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
            >
              เลือกทั้งหมด
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
            {wordPickerList.map((v) => {
              const included = !excludedIds.has(v.id);
              return (
                <button
                  key={v.id}
                  onClick={() => toggleExclude(v.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${included ? "hover:bg-gray-50" : "bg-gray-50 opacity-50"}`}
                >
                  <span className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${included ? "bg-indigo-500 border-indigo-500" : "border-gray-300"}`}>
                    {included && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </span>
                  <span className="font-jp text-sm text-gray-900 flex-1">{v.japanese}</span>
                  <span className="text-xs text-gray-400 truncate max-w-[40%]">{v.thai.split(",")[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats row */}
      {stats && (
        <div className="flex gap-2 text-xs">
          <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{stats.notStarted} ยังไม่เรียน</span>
          <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded-full">{stats.learning} กำลังเรียน</span>
          <span className="bg-green-50 text-green-600 px-2 py-1 rounded-full">{stats.mastered} จำได้แล้ว</span>
        </div>
      )}

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{currentIndex + 1} / {deck.length}</span>
          <span>✅ {sessionStats.correct} &nbsp; ❌ {sessionStats.wrong}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-red-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      {current && (
        <div
          key={current.id}
          className={`card-flip cursor-pointer ${slideDir === "left" ? "opacity-0 -translate-x-8" : slideDir === "right" ? "opacity-0 translate-x-8" : ""} transition-all duration-300`}
          onClick={handleFlip}
          style={{ minHeight: 240 }}
          ref={cardRef}
        >
          <div className={`card-inner relative ${flipped ? "flipped" : ""}`} style={{ minHeight: 240 }}>
            {/* Front */}
            <div className="card-front w-full bg-white rounded-2xl border border-gray-200 shadow-md p-6 flex flex-col items-center justify-center text-center" style={{ minHeight: 240 }}>
              {/* SRS level indicator */}
              <div className="absolute top-3 right-3 flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${i < getCard(current.id).level ? "bg-green-400" : "bg-gray-200"}`}
                  />
                ))}
              </div>
              <div className="absolute top-3 left-3 flex gap-1">
                <span className="text-xs text-gray-300 bg-gray-50 px-2 py-0.5 rounded-full">
                  {current.chapter === 0 ? "ตัวเลข" : `บท ${current.chapter}`}
                </span>
                {(sessionCorrect[current.id] ?? 0) >= 1 && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✓ confirm</span>
                )}
              </div>

              {direction === "jp-th" ? (
                <>
                  <p className="font-jp text-5xl font-bold text-gray-900 mb-2">{current.japanese}</p>
                  {current.kanji && current.kanji !== current.japanese && (
                    <p className="font-jp text-lg text-gray-400">{current.kanji}</p>
                  )}
                  <p className="text-sm text-gray-300 mt-2">{current.reading}</p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-semibold text-gray-900 mb-2">{current.thai}</p>
                  <p className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">{current.category}</p>
                </>
              )}
              <p className="text-xs text-gray-300 mt-6 absolute bottom-4">แตะเพื่อดูคำตอบ 👆</p>
            </div>

            {/* Back */}
            <div className="card-back w-full bg-gradient-to-b from-red-600 to-red-700 rounded-2xl shadow-md p-6 flex flex-col items-center justify-center text-center" style={{ minHeight: 240 }}>
              {direction === "jp-th" ? (
                <>
                  <p className="text-white text-3xl font-semibold mb-2">{current.thai}</p>
                  <p className="font-jp text-white/70 text-lg">{current.japanese}</p>
                  <p className="text-white/50 text-sm mt-1">{current.reading}</p>
                </>
              ) : (
                <>
                  <p className="font-jp text-white text-5xl font-bold mb-2">{current.japanese}</p>
                  {current.kanji && current.kanji !== current.japanese && (
                    <p className="font-jp text-white/70 text-xl">{current.kanji}</p>
                  )}
                  <p className="text-white/50 text-base mt-1">{current.reading}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Answer buttons */}
      {flipped && current && (
        <div className="flex gap-3 bounce-in">
          <button
            onClick={() => handleAnswer(false)}
            className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold text-base hover:bg-red-50 hover:text-red-600 transition-colors btn-press"
          >
            ❌ ยังไม่รู้
          </button>
          <button
            onClick={() => handleAnswer(true)}
            className="flex-1 bg-green-500 text-white py-4 rounded-xl font-semibold text-base hover:bg-green-600 transition-colors btn-press"
          >
            ✅ รู้แล้ว!
          </button>
        </div>
      )}

      {/* Hint when not flipped */}
      {!flipped && current && (
        <div className="text-center">
          <p className="text-xs text-gray-400">
            หมวด: <span className="text-gray-600">{current.category}</span>
          </p>
        </div>
      )}
    </div>
  );
}
