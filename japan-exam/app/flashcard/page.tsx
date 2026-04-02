"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { vocabulary, VocabItem } from "@/data/vocabulary";
import { useSRS } from "@/hooks/useSRS";

type Direction = "jp-th" | "th-jp";
type ChapterFilter = 0 | 1 | 2 | 3;

export default function FlashcardPage() {
  const { getCard, updateCard, getDueCards, isLoaded } = useSRS();
  const [direction, setDirection] = useState<Direction>("jp-th");
  const [chapterFilter, setChapterFilter] = useState<ChapterFilter>(0);
  const [flipped, setFlipped] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deck, setDeck] = useState<VocabItem[]>([]);
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0 });
  const [showComplete, setShowComplete] = useState(false);
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const buildDeck = useCallback(() => {
    let filtered = chapterFilter === 0 ? vocabulary : vocabulary.filter((v) => v.chapter === chapterFilter);
    const due = getDueCards(filtered.map((v) => v.id));
    const duePriority = filtered.filter((v) => due.includes(v.id));
    const rest = filtered.filter((v) => !due.includes(v.id));
    // Shuffle
    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
    return [...shuffle(duePriority), ...shuffle(rest)];
  }, [chapterFilter, getDueCards]);

  useEffect(() => {
    if (isLoaded) {
      setDeck(buildDeck());
      setCurrentIndex(0);
      setFlipped(false);
      setShowComplete(false);
    }
  }, [isLoaded, buildDeck]);

  const current = deck[currentIndex];

  const handleFlip = () => {
    if (!showComplete) setFlipped((f) => !f);
  };

  const handleAnswer = (correct: boolean) => {
    if (!current) return;
    updateCard(current.id, correct);
    setSessionStats((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      wrong: s.wrong + (correct ? 0 : 1),
    }));
    setSlideDir(correct ? "left" : "right");
    setTimeout(() => {
      setFlipped(false);
      if (currentIndex + 1 >= deck.length) {
        setShowComplete(true);
      } else {
        setCurrentIndex((i) => i + 1);
      }
      setSlideDir(null);
    }, 300);
  };

  const handleRestart = () => {
    setDeck(buildDeck());
    setCurrentIndex(0);
    setFlipped(false);
    setShowComplete(false);
    setSessionStats({ correct: 0, wrong: 0 });
  };

  const progress = deck.length > 0 ? ((currentIndex) / deck.length) * 100 : 0;

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
              onClick={() => setChapterFilter(ch)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${chapterFilter === ch ? "bg-white text-red-600 shadow-sm" : "text-gray-500"}`}
            >
              {ch === 0 ? "ทั้งหมด" : `บท ${ch}`}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{currentIndex} / {deck.length}</span>
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
              <div className="absolute top-3 left-3">
                <span className="text-xs text-gray-300 bg-gray-50 px-2 py-0.5 rounded-full">
                  บท {current.chapter}
                </span>
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
