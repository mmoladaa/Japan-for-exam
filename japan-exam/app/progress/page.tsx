"use client";
import { useMemo, useState } from "react";
import { useSRS } from "@/hooks/useSRS";
import { vocabulary } from "@/data/vocabulary";
import { grammarPatterns } from "@/data/quizData";

const allIds = vocabulary.map((v) => v.id);

const LEVEL_LABELS = ["ไม่รู้", "เริ่มรู้", "พอรู้", "จำได้", "จำได้ดี", "จำแม่น"];
const LEVEL_COLORS = [
  "bg-gray-200 text-gray-600",
  "bg-red-200 text-red-700",
  "bg-amber-200 text-amber-700",
  "bg-yellow-200 text-yellow-700",
  "bg-lime-200 text-lime-700",
  "bg-green-200 text-green-700",
];

export default function ProgressPage() {
  const { getStats, getCard, resetAll, isLoaded } = useSRS();
  const stats = useMemo(
    () => isLoaded ? getStats(allIds) : { mastered: 0, learning: 0, notStarted: 0, due: 0, total: 0 },
    [isLoaded, getStats]
  );
  const chapterStats = useMemo(() => isLoaded ? {
    1: getStats(vocabulary.filter((v) => v.chapter === 1).map((v) => v.id)),
    2: getStats(vocabulary.filter((v) => v.chapter === 2).map((v) => v.id)),
    3: getStats(vocabulary.filter((v) => v.chapter === 3).map((v) => v.id)),
  } : {}, [isLoaded, getStats]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeChapter, setActiveChapter] = useState<number>(0);
  const [grammarDone] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("japan-grammar-progress");
        if (saved) return JSON.parse(saved).done ?? 0;
      } catch { /* ignore */ }
    }
    return 0;
  });
  const [grammarBest] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("japan-grammar-progress");
        if (saved) return JSON.parse(saved).best ?? 0;
      } catch { /* ignore */ }
    }
    return 0;
  });
  const [excludedIds, setExcludedIds] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("japan-vocab-exclude");
        if (saved) return new Set<string>(JSON.parse(saved));
      } catch { /* ignore */ }
    }
    return new Set<string>();
  });
  const [editMode, setEditMode] = useState(false);

  const toggleExclude = (id: string) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try { localStorage.setItem("japan-vocab-exclude", JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };

  const masteredPct = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;

  // Level distribution
  const levelDist = [0, 1, 2, 3, 4, 5].map((lvl) => ({
    level: lvl,
    count: allIds.filter((id) => getCard(id).level === lvl).length,
  }));

  const filteredVocab = activeChapter === 0 ? vocabulary : vocabulary.filter((v) => v.chapter === activeChapter);

  const chapterInfo: Record<number, { name: string; topic: string; color: string }> = {
    1: { name: "บทที่ 1", topic: "แนะนำตัว · อาชีพ", color: "text-red-600" },
    2: { name: "บทที่ 2", topic: "สิ่งของรอบตัว", color: "text-amber-600" },
    3: { name: "บทที่ 3", topic: "สถานที่ · ราคา", color: "text-emerald-600" },
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">ความก้าวหน้า</h1>
        <p className="text-sm text-gray-500 font-jp">進捗・学習記録</p>
      </div>

      {/* Overall stats */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">ภาพรวมทั้งหมด</h2>
          <span className="text-2xl font-bold text-red-600">{masteredPct}%</span>
        </div>

        {/* Big progress circle simulation */}
        <div className="flex items-center justify-center mb-4">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#f5f5f4" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke="#ef4444"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - masteredPct / 100)}`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">{stats.mastered}</span>
              <span className="text-xs text-gray-400">/{stats.total}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { count: stats.notStarted, label: "ยังไม่เรียน", color: "text-gray-500", bg: "bg-gray-50" },
            { count: stats.learning, label: "กำลังเรียน", color: "text-amber-600", bg: "bg-amber-50" },
            { count: stats.mastered, label: "จำได้แล้ว", color: "text-green-600", bg: "bg-green-50" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl p-3`}>
              <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
              <p className={`text-xs ${s.color}`}>{s.label}</p>
            </div>
          ))}
        </div>

        {stats.due > 0 && (
          <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
            <span>🔔</span>
            <p className="text-sm text-red-700 font-medium">มี {stats.due} คำที่ถึงเวลาต้องทบทวน!</p>
          </div>
        )}
      </div>

      {/* Per chapter */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <h2 className="font-semibold text-gray-800 mb-3">แยกตามบท</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((ch) => {
            const cs = chapterStats[ch];
            if (!cs) return null;
            const pct = cs.total > 0 ? Math.round((cs.mastered / cs.total) * 100) : 0;
            const ci = chapterInfo[ch];
            return (
              <div key={ch}>
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <span className={`text-sm font-semibold ${ci.color}`}>{ci.name}</span>
                    <span className="text-xs text-gray-400 ml-2">{ci.topic}</span>
                  </div>
                  <span className="text-xs text-gray-500">{cs.mastered}/{cs.total} ({pct}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-red-400 to-red-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Level distribution */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <h2 className="font-semibold text-gray-800 mb-3">ระดับความจำ (SRS)</h2>
        <div className="space-y-2">
          {levelDist.map(({ level, count }) => {
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <div key={level} className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full w-16 text-center font-medium ${LEVEL_COLORS[level]}`}>
                  {LEVEL_LABELS[level]}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-red-400 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grammar progress */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">ความก้าวหน้าไวยากรณ์</h2>
          {grammarDone > 0 && (
            <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">
              ทำแล้ว {grammarDone} ครั้ง · Best {grammarBest}%
            </span>
          )}
        </div>
        <div className="space-y-2">
          {grammarPatterns.map((p) => (
            <div key={p.id} className="flex items-start gap-3 p-2 rounded-xl bg-gray-50">
              <span className={`mt-0.5 text-xs px-2 py-0.5 rounded-full whitespace-nowrap font-medium ${grammarDone > 0 ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                {grammarDone > 0 ? "ฝึกแล้ว" : "ยังไม่ฝึก"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-jp text-sm font-medium text-gray-800">{p.pattern}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.exampleThai}</p>
              </div>
              <span className="text-xs text-gray-300 bg-gray-100 px-1.5 py-0.5 rounded-full">บท{p.chapter}</span>
            </div>
          ))}
        </div>
        {grammarDone === 0 && (
          <p className="text-xs text-gray-400 text-center mt-3">ไปที่ แบบทดสอบ → เติมคำในช่องว่าง เพื่อเริ่มฝึกไวยากรณ์</p>
        )}
      </div>

      {/* Vocabulary table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-800">รายการคำศัพท์</h2>
            <button
              onClick={() => setEditMode((v) => !v)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${editMode ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              {editMode ? "✓ เสร็จแล้ว" : "เลือกคำ ☑"}
            </button>
          </div>
          {editMode && (
            <p className="text-xs text-gray-400 mb-2">
              กดเพื่อ <span className="text-red-500">ตัดออก</span> จาก Flashcard · {excludedIds.size > 0 ? `ตัดออก ${excludedIds.size} คำ` : "ยังไม่ตัดคำใดออก"}
            </p>
          )}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {([0, 1, 2, 3] as const).map((ch) => (
              <button
                key={ch}
                onClick={() => setActiveChapter(ch)}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${activeChapter === ch ? "bg-white text-red-600 shadow-sm" : "text-gray-500"}`}
              >
                {ch === 0 ? "ทั้งหมด" : `บท ${ch}`}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
          {filteredVocab.map((vocab) => {
            const card = getCard(vocab.id);
            const excluded = excludedIds.has(vocab.id);
            return (
              <div
                key={vocab.id}
                className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${editMode ? "cursor-pointer active:bg-gray-50" : ""} ${excluded ? "opacity-40" : ""}`}
                onClick={editMode ? () => toggleExclude(vocab.id) : undefined}
              >
                {editMode && (
                  <div className={`w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 ${excluded ? "border-red-400 bg-red-50" : "border-green-400 bg-green-50"}`}>
                    {excluded ? <span className="text-red-500 text-xs">✕</span> : <span className="text-green-500 text-xs">✓</span>}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`font-jp text-sm font-medium ${excluded ? "line-through text-gray-400" : "text-gray-900"}`}>{vocab.japanese}</p>
                  <p className="text-xs text-gray-400 truncate">{vocab.thai}</p>
                </div>
                {!editMode && (
                  <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${LEVEL_COLORS[card.level]}`}>
                    {LEVEL_LABELS[card.level]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {editMode && excludedIds.size > 0 && (
          <div className="p-3 border-t border-gray-100">
            <button
              onClick={() => {
                setExcludedIds(new Set());
                try { localStorage.removeItem("japan-vocab-exclude"); } catch { /* ignore */ }
              }}
              className="w-full text-xs text-gray-400 py-2 rounded-xl border border-dashed border-gray-200 hover:text-red-400 hover:border-red-200 transition-colors"
            >
              เอาคำที่ตัดออกทั้งหมดกลับมา ({excludedIds.size} คำ)
            </button>
          </div>
        )}
      </div>

      {/* Reset */}
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full text-gray-400 text-sm py-3 rounded-xl border border-dashed border-gray-200 hover:border-red-200 hover:text-red-400 transition-colors"
        >
          รีเซ็ตข้อมูลการเรียนทั้งหมด
        </button>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
          <p className="text-sm text-red-700 font-medium text-center">ยืนยันการรีเซ็ตข้อมูลทั้งหมด?</p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium"
            >
              ยกเลิก
            </button>
            <button
              onClick={() => { resetAll(); setShowConfirm(false); }}
              className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium"
            >
              รีเซ็ต
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
