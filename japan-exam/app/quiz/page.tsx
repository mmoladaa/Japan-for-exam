"use client";
import { useState, useCallback, useMemo } from "react";
import {
  sentenceQuestions,
  conjunctionQuestions,
  expressionQuestions,
  grammarPatterns,
  sentenceQAQuestions,
  counterQuestions,
  translateThJpQuestions,
  additionalSentenceQuestions,
  additionalConjunctionQuestions,
  additionalExpressionQuestions,
  additionalNumberQuestions,
  additionalSentenceQAQuestions,
  QuizQuestion,
} from "@/data/quizData";
import { numberPractice, vocabulary } from "@/data/vocabulary";

type QuizMode =
  | "menu" | "vocab-mc" | "grammar" | "conjunction" | "expression"
  | "number" | "sentence-qa" | "counter" | "translate-th-jp" | "vocab-type"
  | "complete";

interface AnswerRecord { answer: string; correct: boolean; }

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

function buildChoices(question: QuizQuestion, allAnswers: string[]): string[] {
  if (question.choices) return shuffle(question.choices);
  const wrong = shuffle(allAnswers.filter((a) => a !== question.answer)).slice(0, 3);
  return shuffle([question.answer, ...wrong]);
}

// Normalize romaji for flexible comparison with multiple variations support
const normalizeRomaji = (s: string) => {
  const normalized = s.toLowerCase()
    .replace(/[\[\]~\-\s]/g, "")
    .replace(/ā|あー/g, "a")
    .replace(/ī|いー/g, "i")
    .replace(/ū|う/g, "u")
    .replace(/ē|えー/g, "e")
    .replace(/ō|おー/g, "o")
    .replace(/ch/g, "ti")
    .replace(/shi/g, "si")
    .replace(/tsu/g, "tu")
    .replace(/fu/g, "hu")
    .replace(/uu/g, "u")
    .replace(/oo/g, "o")
    .replace(/ou/g, "o");
  return normalized;
};

// Check if romanji input matches Japanese answer with multiple variation tolerance
const isRomajiMatch = (userInput: string, japaneseAnswer: string): boolean => {
  const normalized = normalizeRomaji(userInput);
  const answerNorm = normalizeRomaji(japaneseAnswer);

  // Exact match after normalization
  if (normalized === answerNorm) return true;

  // Check if input is a substring (for partial answers)
  if (answerNorm.includes(normalized) && normalized.length >= 3) return true;

  return false;
};

// Convert romanji to katakana for display
const romajiToKatakana = (romaji: string): string => {
  const map: { [key: string]: string } = {
    // Vowels
    'a': 'ア', 'i': 'イ', 'u': 'ウ', 'e': 'エ', 'o': 'オ',
    // K-group
    'ka': 'カ', 'ki': 'キ', 'ku': 'ク', 'ke': 'ケ', 'ko': 'コ',
    'kya': 'キャ', 'kyi': 'キィ', 'kyu': 'キュ', 'kye': 'キェ', 'kyo': 'キョ',
    // G-group
    'ga': 'ガ', 'gi': 'ギ', 'gu': 'グ', 'ge': 'ゲ', 'go': 'ゴ',
    'gya': 'ギャ', 'gyi': 'ギィ', 'gyu': 'ギュ', 'gye': 'ギェ', 'gyo': 'ギョ',
    // S-group (both シ and シ variants)
    'sa': 'サ', 'si': 'シ', 'su': 'ス', 'se': 'セ', 'so': 'ソ',
    'shi': 'シ', 'sya': 'シャ', 'syi': 'シィ', 'syu': 'シュ', 'sye': 'シェ', 'syo': 'ショ',
    // Z-group
    'za': 'ザ', 'zi': 'ジ', 'zu': 'ズ', 'ze': 'ゼ', 'zo': 'ゾ',
    'ja': 'ジャ', 'jyi': 'ジィ', 'ju': 'ジュ', 'jye': 'ジェ', 'jo': 'ジョ',
    // T-group
    'ta': 'タ', 'ti': 'チ', 'tu': 'ツ', 'te': 'テ', 'to': 'ト',
    'chi': 'チ', 'tsu': 'ツ', 'tya': 'チャ', 'tyi': 'チィ', 'tyu': 'チュ', 'tye': 'チェ', 'tyo': 'チョ',
    // D-group
    'da': 'ダ', 'di': 'ヂ', 'du': 'ヅ', 'de': 'デ', 'do': 'ド',
    'dya': 'ヂャ', 'dyi': 'ヂィ', 'dyu': 'ヂュ', 'dye': 'ヂェ', 'dyo': 'ヂョ',
    // N-group
    'na': 'ナ', 'ni': 'ニ', 'nu': 'ヌ', 'ne': 'ネ', 'no': 'ノ',
    'nya': 'ニャ', 'nyi': 'ニィ', 'nyu': 'ニュ', 'nye': 'ニェ', 'nyo': 'ニョ',
    // H-group
    'ha': 'ハ', 'hi': 'ヒ', 'hu': 'フ', 'he': 'ヘ', 'ho': 'ホ',
    'hya': 'ヒャ', 'hyi': 'ヒィ', 'hyu': 'ヒュ', 'hye': 'ヒェ', 'hyo': 'ヒョ',
    'fa': 'ファ', 'fi': 'フィ', 'fe': 'フェ', 'fo': 'フォ', 'fu': 'フ',
    // B-group
    'ba': 'バ', 'bi': 'ビ', 'bu': 'ブ', 'be': 'ベ', 'bo': 'ボ',
    'bya': 'ビャ', 'byi': 'ビィ', 'byu': 'ビュ', 'bye': 'ビェ', 'byo': 'ビョ',
    // P-group
    'pa': 'パ', 'pi': 'ピ', 'pu': 'プ', 'pe': 'ペ', 'po': 'ポ',
    'pya': 'ピャ', 'pyi': 'ピィ', 'pyu': 'ピュ', 'pye': 'ピェ', 'pyo': 'ピョ',
    // M-group
    'ma': 'マ', 'mi': 'ミ', 'mu': 'ム', 'me': 'メ', 'mo': 'モ',
    'mya': 'ミャ', 'myi': 'ミィ', 'myu': 'ミュ', 'mye': 'ミェ', 'myo': 'ミョ',
    // Y-group
    'ya': 'ヤ', 'yi': 'イ', 'yu': 'ユ', 'yo': 'ヨ',
    // R-group
    'ra': 'ラ', 'ri': 'リ', 'ru': 'ル', 're': 'レ', 'ro': 'ロ',
    'rya': 'リャ', 'ryi': 'リィ', 'ryu': 'リュ', 'rye': 'リェ', 'ryo': 'リョ',
    // W-group
    'wa': 'ワ', 'wi': 'ウィ', 'we': 'ウェ', 'wo': 'ヲ', 'n': 'ン',
  };

  let result = '';
  let i = 0;
  const lower = romaji.toLowerCase();

  while (i < lower.length) {
    let matched = false;
    for (let len = 3; len >= 1; len--) {
      const substr = lower.substring(i, i + len);
      if (map[substr]) {
        result += map[substr];
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      result += lower[i];
      i++;
    }
  }

  return result;
};

// Convert romanji to hiragana for display
const romajiToHiragana = (romaji: string): string => {
  const map: { [key: string]: string } = {
    // Vowels
    'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',
    // K-group
    'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
    'kya': 'きゃ', 'kyi': 'きぃ', 'kyu': 'きゅ', 'kye': 'きぇ', 'kyo': 'きょ',
    // G-group
    'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
    'gya': 'ぎゃ', 'gyi': 'ぎぃ', 'gyu': 'ぎゅ', 'gye': 'ぎぇ', 'gyo': 'ぎょ',
    // S-group (both し and し variants)
    'sa': 'さ', 'si': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
    'shi': 'し', 'sya': 'しゃ', 'syi': 'しぃ', 'syu': 'しゅ', 'sye': 'しぇ', 'syo': 'しょ',
    // Z-group
    'za': 'ざ', 'zi': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
    'ja': 'じゃ', 'jyi': 'じぃ', 'ju': 'じゅ', 'jye': 'じぇ', 'jo': 'じょ',
    // T-group
    'ta': 'た', 'ti': 'ち', 'tu': 'つ', 'te': 'て', 'to': 'と',
    'chi': 'ち', 'tsu': 'つ', 'tya': 'ちゃ', 'tyi': 'ちぃ', 'tyu': 'ちゅ', 'tye': 'ちぇ', 'tyo': 'ちょ',
    // D-group
    'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど',
    'dya': 'ぢゃ', 'dyi': 'ぢぃ', 'dyu': 'ぢゅ', 'dye': 'ぢぇ', 'dyo': 'ぢょ',
    // N-group
    'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
    'nya': 'にゃ', 'nyi': 'にぃ', 'nyu': 'にゅ', 'nye': 'にぇ', 'nyo': 'にょ',
    // H-group
    'ha': 'は', 'hi': 'ひ', 'hu': 'ふ', 'he': 'へ', 'ho': 'ほ',
    'hya': 'ひゃ', 'hyi': 'ひぃ', 'hyu': 'ひゅ', 'hye': 'ひぇ', 'hyo': 'ひょ',
    'fa': 'ふぁ', 'fi': 'ふぃ', 'fe': 'ふぇ', 'fo': 'ふぉ', 'fu': 'ふ',
    // B-group
    'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
    'bya': 'びゃ', 'byi': 'びぃ', 'byu': 'びゅ', 'bye': 'びぇ', 'byo': 'びょ',
    // P-group
    'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
    'pya': 'ぴゃ', 'pyi': 'ぴぃ', 'pyu': 'ぴゅ', 'pye': 'ぴぇ', 'pyo': 'ぴょ',
    // M-group
    'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
    'mya': 'みゃ', 'myi': 'みぃ', 'myu': 'みゅ', 'mye': 'みぇ', 'myo': 'みょ',
    // Y-group
    'ya': 'や', 'yi': 'い', 'yu': 'ゆ', 'yo': 'よ',
    // R-group
    'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
    'rya': 'りゃ', 'ryi': 'りぃ', 'ryu': 'りゅ', 'rye': 'りぇ', 'ryo': 'りょ',
    // W-group
    'wa': 'わ', 'wi': 'ゐ', 'we': 'ゑ', 'wo': 'を', 'n': 'ん',
  };

  let result = '';
  let i = 0;
  const lower = romaji.toLowerCase();

  while (i < lower.length) {
    let matched = false;
    // Try 3-character combinations first
    for (let len = 3; len >= 1; len--) {
      const substr = lower.substring(i, i + len);
      if (map[substr]) {
        result += map[substr];
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      result += lower[i];
      i++;
    }
  }

  return result;
};

export default function QuizPage() {
  const [mode, setMode] = useState<QuizMode>("menu");
  const [lastMode, setLastMode] = useState<QuizMode>("vocab-mc");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [perQuestionResult, setPerQuestionResult] = useState<Record<number, AnswerRecord>>({});
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
          [...sentenceQuestions, ...additionalSentenceQuestions].filter(
            (q) => q.type === "multiple-choice" && (chapterFilter === 0 || q.chapter === chapterFilter)
          )
        ).slice(0, 20);
      } else if (newMode === "grammar") {
        qs = shuffle(
          [...sentenceQuestions, ...additionalSentenceQuestions].filter(
            (q) => q.type === "fill-blank" && (chapterFilter === 0 || q.chapter === chapterFilter)
          )
        ).slice(0, 15);
      } else if (newMode === "conjunction") {
        qs = shuffle(
          [...conjunctionQuestions, ...additionalConjunctionQuestions].filter((q) => chapterFilter === 0 || q.chapter === chapterFilter)
        );
      } else if (newMode === "expression") {
        qs = shuffle(
          [...expressionQuestions, ...additionalExpressionQuestions].filter((q) => chapterFilter === 0 || q.chapter === chapterFilter)
        );
      } else if (newMode === "sentence-qa") {
        qs = shuffle(
          [...sentenceQAQuestions, ...additionalSentenceQAQuestions].filter((q) => chapterFilter === 0 || q.chapter === chapterFilter)
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
        qs = shuffle(numberPractice)
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
      } else if (newMode === "vocab-type") {
        const pool = shuffle(
          vocabulary.filter(
            (v) =>
              (chapterFilter === 0 || v.chapter === chapterFilter) &&
              v.category !== "สำนวน"
          )
        ).slice(0, 15);
        qs = pool.map((v, i) => {
          const cleanReading = v.reading
            .split(" / ")[0]
            .replace(/\[.*?\]/g, "")
            .replace(/~/g, "")
            .trim()
            .toLowerCase();
          return {
            id: `vt-${i}`,
            type: "fill-blank" as const,
            chapter: v.chapter,
            question: v.thai.split(",")[0].trim(),
            questionThai: `บท ${v.chapter} · ${v.category}`,
            answer: cleanReading,
            hint: v.japanese + (v.kanji && v.kanji !== v.japanese ? ` (${v.kanji})` : ""),
            explanation: `${v.japanese} = ${v.reading}`,
          };
        });
      }
      if (qs.length === 0) return;
      setQuestions(qs);
      setCurrentIdx(0);
      setInputValue("");
      setPerQuestionResult({});
      setLastMode(newMode);
      setMode(newMode);
    },
    [chapterFilter]
  );

  // ── Derived state ──────────────────────────────────────
  const currentQ = questions[currentIdx];
  const currentAnswer = perQuestionResult[currentIdx];
  const showAnswer = !!currentAnswer;
  const selected = currentAnswer?.answer ?? null;
  const isCorrect = currentAnswer?.correct ?? false;
  const isFillBlank = currentQ?.type === "fill-blank" || currentQ?.type === "translate";
  const allAnswers = questions.map((q) => q.answer);
  const choices = currentQ ? buildChoices(currentQ, allAnswers) : [];

  const correctCount = useMemo(
    () => Object.values(perQuestionResult).filter((r) => r.correct).length,
    [perQuestionResult]
  );
  const wrongCount = useMemo(
    () => Object.values(perQuestionResult).filter((r) => !r.correct).length,
    [perQuestionResult]
  );

  // ── Handlers ───────────────────────────────────────────
  const handleSelect = (choice: string) => {
    if (showAnswer) return;
    const isCorr = choice === currentQ.answer;
    setPerQuestionResult((prev) => ({ ...prev, [currentIdx]: { answer: choice, correct: isCorr } }));
  };

  const handleFillSubmit = () => {
    if (!inputValue.trim()) return;
    const val = inputValue.trim();
    let isCorr = false;

    if (mode === "vocab-type") {
      // Romanji input - use flexible matching
      isCorr = isRomajiMatch(val, currentQ.answer);
    } else {
      // Japanese input - exact match or spaces ignored
      isCorr =
        val === currentQ.answer ||
        val.replace(/\s/g, "") === currentQ.answer.replace(/\s/g, "");
    }

    setPerQuestionResult((prev) => ({ ...prev, [currentIdx]: { answer: val, correct: isCorr } }));
  };

  const goNext = () => {
    if (currentIdx + 1 >= questions.length) {
      if (mode === "grammar") {
        const pct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
        const newDone = grammarDone + 1;
        const newBest = Math.max(grammarBest, pct);
        setGrammarDone(newDone);
        setGrammarBest(newBest);
        try { localStorage.setItem("japan-grammar-progress", JSON.stringify({ done: newDone, best: newBest })); } catch { /* ignore */ }
      }
      setMode("complete");
    } else {
      setCurrentIdx((i) => i + 1);
      setInputValue("");
    }
  };

  const handleBack = () => {
    if (currentIdx > 0) { setCurrentIdx((i) => i - 1); setInputValue(""); }
  };

  const handleSkip = () => {
    if (currentIdx + 1 >= questions.length) setMode("complete");
    else { setCurrentIdx((i) => i + 1); setInputValue(""); }
  };

  const clearAnswer = () => {
    setPerQuestionResult((prev) => { const next = { ...prev }; delete next[currentIdx]; return next; });
    setInputValue("");
  };

  // ── Menu ──────────────────────────────────────────────
  if (mode === "menu") {
    const modes = [
      {
        key: "vocab-type" as QuizMode,
        title: "พิมพ์ Romaji",
        titleJP: "ローマ字入力",
        desc: "เห็นความหมายไทย → พิมพ์ romaji",
        icon: "⌨️",
        count: vocabulary.filter((v) => chapterFilter === 0 || v.chapter === chapterFilter).length,
      },
      {
        key: "vocab-mc" as QuizMode,
        title: "เลือกตอบ ประโยค",
        titleJP: "文の選択問題",
        desc: "เติม particle / เลือกคำตอบที่ถูก",
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
        icon: "🗣️",
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
    const total = questions.length;
    const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const skippedCount = total - Object.keys(perQuestionResult).length;
    const missedQs = questions.filter((q, i) => !perQuestionResult[i]?.correct);
    return (
      <div className="px-4 py-6 space-y-6">
        <div className="text-center">
          <div className="text-6xl mb-3">{pct >= 80 ? "🎉" : pct >= 60 ? "😊" : "💪"}</div>
          <h2 className="text-2xl font-bold text-gray-900">
            {pct >= 80 ? "เยี่ยมมาก!" : pct >= 60 ? "ทำได้ดี!" : "ฝึกต่อนะ!"}
          </h2>
          <p className="text-gray-500 mt-1">
            ถูก {correctCount} / {total} ข้อ ({pct}%)
            {skippedCount > 0 && <span className="text-gray-400 text-sm"> · ข้าม {skippedCount} ข้อ</span>}
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
        {missedQs.length > 0 && (
          <div>
            <p className="font-semibold text-gray-700 mb-2">📌 ข้อที่ผิด / ข้าม</p>
            <div className="space-y-2">
              {missedQs.map((q) => (
                <div key={q.id} className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className={`text-sm text-gray-800 ${lastMode !== "vocab-type" ? "font-jp" : ""}`}>{q.question}</p>
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
            onClick={() => startQuiz(lastMode)}
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

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Header with progress / close */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>ข้อ {currentIdx + 1} / {questions.length}</span>
            <span>✅ {correctCount} &nbsp; ❌ {wrongCount}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-red-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <button
          onClick={() => setMode("menu")}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="ออก"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
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
            {mode === "vocab-type" && (
              <span className="text-xs bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full font-jp">ローマ字</span>
            )}
          </div>
          <p className={`${mode === "vocab-type" ? "text-2xl font-semibold" : "font-jp text-xl"} text-gray-900 leading-relaxed`}>
            {currentQ.question}
          </p>
          {currentQ.questionThai && (
            <p className="text-sm text-gray-500 mt-1">{currentQ.questionThai}</p>
          )}
          {mode === "vocab-type" && !showAnswer && (
            <div className="text-xs text-blue-600 bg-blue-50 rounded-lg px-2 py-1 mt-3 space-y-0.5">
              <p>📖 <strong>ひらがな (Hiragana)</strong>: Native Japanese words, grammar particles, verbs</p>
              <p>🌏 <strong>カタカナ (Katakana)</strong>: Foreign words (เช่น アメリカ, エンジニア, ペン)</p>
            </div>
          )}
        </div>
      )}

      {/* Fill-blank input */}
      {isFillBlank && !showAnswer && (
        <div className="space-y-2">
          <div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFillSubmit()}
              placeholder={mode === "vocab-type" ? "พิมพ์ romaji เช่น gakusei…" : "พิมพ์คำตอบ…"}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            {mode === "vocab-type" && inputValue.trim() && (
              <div className="text-sm text-gray-500 mt-2 px-1 space-y-1">
                <div>📝 ひらがな: <span className="font-jp text-lg text-gray-700 font-medium">{romajiToHiragana(inputValue)}</span></div>
                <div>📝 カタカナ: <span className="font-jp text-lg text-blue-700 font-medium">{romajiToKatakana(inputValue)}</span></div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBack}
              disabled={currentIdx === 0}
              className="px-3 py-3 border border-gray-200 text-gray-500 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-25 transition-colors btn-press"
              title="ย้อนกลับ"
            >
              ← ย้อน
            </button>
            <button
              onClick={handleSkip}
              className="flex-1 border border-gray-200 text-gray-500 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors btn-press"
            >
              ข้าม →
            </button>
            <button
              onClick={handleFillSubmit}
              disabled={!inputValue.trim()}
              className="flex-[2] bg-red-600 text-white py-3 rounded-xl font-semibold disabled:opacity-40 hover:bg-red-700 transition-colors btn-press"
            >
              ตรวจคำตอบ
            </button>
          </div>
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
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleBack}
              disabled={currentIdx === 0}
              className="px-3 py-3 border border-gray-200 text-gray-500 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-25 transition-colors btn-press"
              title="ย้อนกลับ"
            >
              ← ย้อน
            </button>
            <button
              onClick={handleSkip}
              className="flex-1 border border-gray-200 text-gray-500 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors btn-press"
            >
              ข้าม →
            </button>
          </div>
        </div>
      )}

      {/* Answer feedback */}
      {showAnswer && currentQ && (
        <div className={`rounded-2xl p-4 space-y-3 bounce-in ${isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl">{isCorrect ? "✅" : "❌"}</span>
            <p className={`font-semibold ${isCorrect ? "text-green-700" : "text-red-700"}`}>
              {isCorrect ? "ถูกต้อง!" : "ผิด"}
            </p>
            {!isCorrect && selected && mode === "vocab-type" && (
              <div className="text-sm text-gray-500 w-full space-y-1">
                <p>คุณตอบ: <span className="font-jp">{selected}</span></p>
                <p className="text-xs text-gray-400">ひらがな = <span className="font-jp text-gray-600">{romajiToHiragana(selected)}</span></p>
                <p className="text-xs text-gray-400">カタカナ = <span className="font-jp text-blue-600">{romajiToKatakana(selected)}</span></p>
              </div>
            )}
            {!isCorrect && selected && mode !== "vocab-type" && (
              <p className="text-sm text-gray-500">คุณตอบ: <span className="font-jp">{selected}</span></p>
            )}
          </div>
          {!isCorrect && (
            <div className="text-sm text-gray-600 space-y-1">
              <p>คำตอบที่ถูก: <span className="font-jp font-bold text-red-700">{currentQ.answer}</span></p>
              {mode === "vocab-type" && (
                <>
                  <p className="text-xs text-gray-500">ひらがな = <span className="font-jp text-gray-700 font-medium">{romajiToHiragana(currentQ.answer)}</span></p>
                  <p className="text-xs text-gray-500">カタカナ = <span className="font-jp text-blue-700 font-medium">{romajiToKatakana(currentQ.answer)}</span></p>
                </>
              )}
            </div>
          )}
          {currentQ.explanation && (
            <p className="text-sm text-gray-500 border-t border-gray-200 pt-2">
              💡 {currentQ.explanation}
            </p>
          )}
          <div className="flex gap-2">
            {!isCorrect && (
              <button
                onClick={clearAnswer}
                className="flex-1 border border-red-200 text-red-500 py-3 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors btn-press"
              >
                ลองใหม่
              </button>
            )}
            <button
              onClick={handleBack}
              disabled={currentIdx === 0}
              className="px-3 py-3 border border-gray-200 text-gray-500 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-25 transition-colors btn-press"
              title="ย้อนกลับ"
            >
              ← ย้อน
            </button>
            <button
              onClick={goNext}
              className={`font-semibold py-3 rounded-xl transition-colors btn-press ${isCorrect ? "flex-1 bg-green-500 text-white hover:bg-green-600" : "flex-[2] bg-red-600 text-white hover:bg-red-700"}`}
            >
              {currentIdx + 1 >= questions.length ? "ดูผลลัพธ์" : "ข้อถัดไป →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
