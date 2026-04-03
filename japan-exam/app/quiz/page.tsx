"use client";
import { useState, useCallback } from "react";
import {
  sentenceQuestions,
  conjunctionQuestions,
  expressionQuestions,
  grammarPatterns,
  sentenceQAQuestions,
  counterQuestions,
  translateThJpQuestions,
  QuizQuestion,
} from "@/data/quizData";
import { numberPractice } from "@/data/vocabulary";

type QuizMode = "menu" | "vocab-mc" | "grammar" | "conjunction" | "expression" | "number" | "sentence-qa" | "counter" | "translate-th-jp" | "complete";

interface QuizResult {
  correct: number;
  wrong: number;
  total: number;
  missed: QuizQuestion[];
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildChoices(question: QuizQuestion, allAnswers: string[]): string[] {
  if (question.choices) return shuffle(question.choices);
  const wrong = shuffle(allAnswers.filter((a) => a !== question.answer)).slice(0, 3);
  return shuffle([question.answer, ...wrong]);
}

export default function QuizPage() {
  const [mode, setMode] = useState<QuizMode>("menu");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [result, setResult] = useState<QuizResult>({ correct: 0, wrong: 0, total: 0, missed: [] });
  const [chapterFilter, setChapterFilter] = useState<0 | 1 | 2 | 3>(0);
  const [grammarDone, setGrammarDone] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("japan-grammar-progress");
        if (saved) return JSON.parse(saved).done ?? 0;
      } catch { /* ignore */ }
    }
    return 0;
  });
  const [grammarBest, setGrammarBest] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("japan-grammar-progress");
        if (saved) return JSON.parse(saved).best ?? 0;
      } catch { /* ignore */ }
    }
    return 0;
  });

  const startQuiz = useCallback(
    (newMode: QuizMode) => {
      let qs: QuizQuestion[] = [];
      if (newMode === "vocab-mc") {
        qs = shuffle(
          sentenceQuestions.filter(
            (q) => q.type === "multiple-choice" && (chapterFilter === 0 || q.chapter === chapterFilter)
          )
        ).slice(0, 10);
      } else if (newMode === "grammar") {
        qs = shuffle(
          sentenceQuestions.filter(
            (q) => q.type === "fill-blank" && (chapterFilter === 0 || q.chapter === chapterFilter)
          )
        ).slice(0, 8);
      } else if (newMode === "conjunction") {
        qs = shuffle(
          conjunctionQuestions.filter((q) => chapterFilter === 0 || q.chapter === chapterFilter)
        );
      } else if (newMode === "expression") {
        qs = shuffle(
          expressionQuestions.filter((q) => chapterFilter === 0 || q.chapter === chapterFilter)
        );
      } else if (newMode === "sentence-qa") {
        qs = shuffle(
          sentenceQAQuestions.filter((q) => chapterFilter === 0 || q.chapter === chapterFilter)
        );
      } else if (newMode === "counter") {
        qs = shuffle(
          counterQuestions.filter((q) => chapterFilter === 0 || q.chapter === chapterFilter)
        );
      } else if (newMode === "translate-th-jp") {
        qs = shuffle(
          translateThJpQuestions.filter((q) => chapterFilter === 0 || q.chapter === chapterFilter)
        );
      } else if (newMode === "number") {
        const numQs: QuizQuestion[] = shuffle(numberPractice)
          .slice(0, 10)
          .map((n, i) => ({
            id: `num-${i}`,
            type: "multiple-choice" as const,
            chapter: 3,
            question: `${n.japanese} อ่านว่าอะไร?`,
            answer: n.thai,
            choices: [
              n.thai,
              ...shuffle(numberPractice.filter((x) => x.thai !== n.thai))
                .slice(0, 3)
                .map((x) => x.thai),
            ],
          }));
        qs = numQs;
      }
      if (qs.length === 0) return;
      setQuestions(qs);
      setCurrentIdx(0);
      setSelected(null);
      setInputValue("");
      setShowAnswer(false);
      setResult({ correct: 0, wrong: 0, total: qs.length, missed: [] });
      setMode(newMode);
    },
    [chapterFilter]
  );

  const currentQ = questions[currentIdx];

  const handleSelect = (choice: string) => {
    if (selected) return;
    setSelected(choice);
    setShowAnswer(true);
    const isCorrect = choice === currentQ.answer;
    setResult((r) => ({
      ...r,
      correct: r.correct + (isCorrect ? 1 : 0),
      wrong: r.wrong + (isCorrect ? 0 : 1),
      missed: isCorrect ? r.missed : [...r.missed, currentQ],
    }));
  };

  const handleFillSubmit = () => {
    if (!inputValue.trim()) return;
    const isCorrect =
      inputValue.trim() === currentQ.answer ||
      inputValue.trim().replace(/\s/g, "") === currentQ.answer.replace(/\s/g, "");
    setSelected(inputValue.trim());
    setShowAnswer(true);
    setResult((r) => ({
      ...r,
      correct: r.correct + (isCorrect ? 1 : 0),
      wrong: r.wrong + (isCorrect ? 0 : 1),
      missed: isCorrect ? r.missed : [...r.missed, currentQ],
    }));
  };

  const handleNext = () => {
    if (currentIdx + 1 >= questions.length) {
      // Save grammar progress if in grammar mode
      if (mode === "grammar") {
        const pct = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
        const newDone = grammarDone + 1;
        const newBest = Math.max(grammarBest, pct);
        setGrammarDone(newDone);
        setGrammarBest(newBest);
        try {
          localStorage.setItem("japan-grammar-progress", JSON.stringify({ done: newDone, best: newBest }));
        } catch { /* ignore */ }
      }
      setMode("complete");
    } else {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setInputValue("");
      setShowAnswer(false);
    }
  };

  const allAnswers = questions.map((q) => q.answer);
  const choices = currentQ ? buildChoices(currentQ, allAnswers) : [];

  // ── Menu ──────────────────────────────────────────────
  if (mode === "menu") {
    const modes = [
      {
        key: "vocab-mc" as QuizMode,
        title: "เลือกตอบ ประโยค",
        titleJP: "文の選択問題",
        desc: "เติม particle / เลือก คำตอบที่ถูก",
        icon: "📝",
        count: sentenceQuestions.filter((q) => q.type === "multiple-choice").length,
      },
      {
        key: "grammar" as QuizMode,
        title: "เติมคำในช่องว่าง",
        titleJP: "空欄補充",
        desc: "เติม particle หรือคำที่หายไปในประโยค",
        icon: "✏️",
        count: sentenceQuestions.filter((q) => q.type === "fill-blank").length,
        badge: grammarDone > 0 ? `ทำแล้ว ${grammarDone} ครั้ง · Best ${grammarBest}%` : null,
      },
      {
        key: "conjunction" as QuizMode,
        title: "คำเชื่อม (Particle)",
        titleJP: "接続詞・助詞",
        desc: "เติม は / も / の / か ในประโยค",
        icon: "🔗",
        count: conjunctionQuestions.length,
      },
      {
        key: "expression" as QuizMode,
        title: "สำนวนและการทักทาย",
        titleJP: "表現・挨拶",
        desc: "เลือกสำนวนที่เหมาะสมกับสถานการณ์",
        icon: "💬",
        count: expressionQuestions.length,
      },
      {
        key: "number" as QuizMode,
        title: "ตัวเลขและราคา",
        titleJP: "数字・値段",
        desc: "ฝึกอ่านตัวเลขและราคาสินค้าภาษาญี่ปุ่น",
        icon: "🔢",
        count: numberPractice.length,
      },
      {
        key: "sentence-qa" as QuizMode,
        title: "ตอบคำถามประโยคสมบูรณ์",
        titleJP: "完全文で答える",
        desc: "เลือกประโยคคำตอบที่ถูกต้องสมบูรณ์",
        icon: "💬",
        count: sentenceQAQuestions.length,
      },
      {
        key: "counter" as QuizMode,
        title: "ชั้น · อายุ · เงิน",
        titleJP: "助数詞",
        desc: "ฝึกนับชั้น (かい) อายุ (さい) และราคา (えん)",
        icon: "🔢",
        count: counterQuestions.length,
      },
      {
        key: "translate-th-jp" as QuizMode,
        title: "แปล ไทย → ญี่ปุ่น",
        titleJP: "タイ語→日本語",
        desc: "เลือกประโยคภาษาญี่ปุ่นที่ตรงกับความหมาย",
        icon: "🔄",
        count: translateThJpQuestions.length,
      },
    ];

    return (
      <div className="px-4 py-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">แบบทดสอบ</h1>
          <p className="text-sm text-gray-500 font-jp">クイズ</p>
        </div>

        {/* Chapter filter */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {([0, 1, 2, 3] as const).map((ch) => (
            <button
              key={ch}
              onClick={() => setChapterFilter(ch)}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${chapterFilter === ch ? "bg-white text-red-600 shadow-sm" : "text-gray-500"}`}
            >
              {ch === 0 ? "ทั้งหมด" : `บท ${ch}`}
            </button>
          ))}
        </div>

        {/* Grammar patterns reference */}
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-3">
          <p className="text-xs font-semibold text-amber-700 mb-2">📌 โครงสร้างไวยากรณ์ บท 1-3</p>
          <div className="space-y-1.5">
            {grammarPatterns
              .filter((p) => chapterFilter === 0 || p.chapter === chapterFilter)
              .slice(0, 4)
              .map((p) => (
                <div key={p.id} className="text-xs">
                  <span className="font-jp font-medium text-gray-800">{p.pattern}</span>
                  <span className="text-gray-500 ml-2">→ {p.exampleThai}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Quiz modes */}
        <div className="space-y-2">
          {modes.map((m) => (
            <button
              key={m.key}
              onClick={() => startQuiz(m.key)}
              className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-red-200 transition-all text-left btn-press"
            >
              <span className="text-2xl">{m.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 text-sm">{m.title}</p>
                  <span className="font-jp text-xs text-gray-400">{m.titleJP}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                {"badge" in m && m.badge && (
                  <span className="inline-block mt-1 text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{m.badge}</span>
                )}
              </div>
              <span className="text-xs text-gray-300 bg-gray-50 px-2 py-1 rounded-full">{m.count} ข้อ</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Complete ───────────────────────────────────────────
  if (mode === "complete") {
    const pct = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
    return (
      <div className="px-4 py-6 space-y-6">
        <div className="text-center">
          <div className="text-6xl mb-3">{pct >= 80 ? "🎉" : pct >= 60 ? "😊" : "💪"}</div>
          <h2 className="text-2xl font-bold text-gray-900">
            {pct >= 80 ? "เยี่ยมมาก!" : pct >= 60 ? "ทำได้ดี!" : "ฝึกต่อนะ!"}
          </h2>
          <p className="text-gray-500 mt-1">
            ถูก {result.correct} / {result.total} ข้อ ({pct}%)
          </p>
        </div>

        {/* Score bar */}
        <div className="w-full bg-gray-100 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-700 ${pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Missed questions */}
        {result.missed.length > 0 && (
          <div>
            <p className="font-semibold text-gray-700 mb-2">📌 ข้อที่ผิด (ต้องทบทวน)</p>
            <div className="space-y-2">
              {result.missed.map((q) => (
                <div key={q.id} className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="font-jp text-sm text-gray-800">{q.question}</p>
                  <p className="text-sm font-semibold text-red-600 mt-1">
                    เฉลย: <span className="font-jp">{q.answer}</span>
                  </p>
                  {q.explanation && (
                    <p className="text-xs text-gray-500 mt-1">{q.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setMode("menu")}
            className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors btn-press"
          >
            เมนู
          </button>
          <button
            onClick={() => startQuiz(mode === "complete" ? "vocab-mc" : mode)}
            className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors btn-press"
          >
            ทำอีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  // ── Quiz ───────────────────────────────────────────────
  const progress = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;
  const isCorrect = selected === currentQ?.answer;
  const isFillBlank = currentQ?.type === "fill-blank" || currentQ?.type === "translate";

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => setMode("menu")} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>ข้อ {currentIdx + 1} / {questions.length}</span>
            <span>✅ {result.correct} &nbsp; ❌ {result.wrong}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-red-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Question card */}
      {currentQ && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              บทที่ {currentQ.chapter}
            </span>
            <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">
              {currentQ.type === "multiple-choice" ? "เลือกตอบ" :
               currentQ.type === "fill-blank" ? "เติมคำ" : "แปล"}
            </span>
          </div>
          <p className="font-jp text-xl text-gray-900 leading-relaxed mb-1">{currentQ.question}</p>
          {currentQ.questionThai && (
            <p className="text-sm text-gray-500 mt-1">{currentQ.questionThai}</p>
          )}
          {currentQ.hint && !showAnswer && (
            <p className="text-xs text-gray-400 mt-2">💡 {currentQ.hint}</p>
          )}
        </div>
      )}

      {/* Fill blank input */}
      {isFillBlank && !showAnswer && (
        <div className="space-y-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFillSubmit()}
            placeholder="พิมพ์คำตอบ..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 font-jp text-gray-900 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            autoFocus
          />
          <button
            onClick={handleFillSubmit}
            disabled={!inputValue.trim()}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold disabled:opacity-40 hover:bg-red-700 transition-colors btn-press"
          >
            ตรวจคำตอบ
          </button>
        </div>
      )}

      {/* Multiple choice */}
      {!isFillBlank && !showAnswer && (
        <div className="space-y-2">
          {choices.map((choice) => (
            <button
              key={choice}
              onClick={() => handleSelect(choice)}
              className="w-full text-left px-4 py-3.5 rounded-xl border border-gray-200 font-jp text-gray-800 hover:border-red-300 hover:bg-red-50 transition-all btn-press bg-white"
            >
              {choice}
            </button>
          ))}
        </div>
      )}

      {/* Answer feedback */}
      {showAnswer && currentQ && (
        <div className={`rounded-2xl p-4 space-y-3 bounce-in ${isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{isCorrect ? "✅" : "❌"}</span>
            <p className={`font-semibold ${isCorrect ? "text-green-700" : "text-red-700"}`}>
              {isCorrect ? "ถูกต้อง!" : "ผิด"}
            </p>
          </div>
          {!isCorrect && (
            <div>
              <p className="text-sm text-gray-600">
                คำตอบที่ถูก: <span className="font-jp font-bold text-red-700">{currentQ.answer}</span>
              </p>
            </div>
          )}
          {currentQ.explanation && (
            <p className="text-sm text-gray-500 border-t border-gray-200 pt-2 mt-2">
              💡 {currentQ.explanation}
            </p>
          )}
          <button
            onClick={handleNext}
            className={`w-full py-3 rounded-xl font-semibold transition-colors btn-press ${isCorrect ? "bg-green-500 text-white hover:bg-green-600" : "bg-red-600 text-white hover:bg-red-700"}`}
          >
            {currentIdx + 1 >= questions.length ? "ดูผลลัพธ์" : "ข้อถัดไป →"}
          </button>
        </div>
      )}
    </div>
  );
}
