"use client";
import Link from "next/link";
import { useSRS } from "@/hooks/useSRS";
import { vocabulary, greetings } from "@/data/vocabulary";
import { useEffect, useState } from "react";

const allIds = vocabulary.map((v) => v.id);

const studyModes = [
  {
    href: "/flashcard",
    title: "บัตรคำศัพท์",
    titleJP: "単語カード",
    description: "Flashcard + SRS จำให้เร็วที่สุด",
    icon: "🃏",
    color: "from-red-500 to-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
  },
  {
    href: "/quiz",
    title: "แบบทดสอบ",
    titleJP: "クイズ",
    description: "ฝึกข้อสอบจริง ทุกรูปแบบ",
    icon: "✏️",
    color: "from-amber-500 to-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
  },
  {
    href: "/progress",
    title: "ความก้าวหน้า",
    titleJP: "進捗",
    description: "ติดตามการเรียนและสถิติ",
    icon: "📊",
    color: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
  },
];

export default function Home() {
  const { getStats, isLoaded } = useSRS();
  const [stats, setStats] = useState({
    mastered: 0,
    learning: 0,
    notStarted: 0,
    due: 0,
    total: 0,
  });
  const [greetingIdx, setGreetingIdx] = useState(0);

  useEffect(() => {
    if (isLoaded) {
      setStats(getStats(allIds));
    }
  }, [isLoaded, getStats]);

  useEffect(() => {
    const t = setInterval(() => {
      setGreetingIdx((i) => (i + 1) % greetings.length);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const masteredPct = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;
  const learnedPct = stats.total > 0 ? Math.round(((stats.mastered + stats.learning) / stats.total) * 100) : 0;

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 bg-red-600 text-white text-xs font-medium px-3 py-1 rounded-full mb-3">
          <span>📅</span>
          <span>กลางภาค บท 1–3</span>
        </div>
        <h1 className="font-jp text-4xl font-bold text-gray-900 mb-1">日本語</h1>
        <p className="text-gray-500 text-sm">ท่องภาษาญี่ปุ่น ใน 1 วัน</p>

        {/* Rotating greeting */}
        <div className="mt-4 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
          <p className="font-jp text-2xl font-medium text-gray-900">
            {greetings[greetingIdx].japanese}
          </p>
          <p className="text-sm text-gray-400 mt-1">{greetings[greetingIdx].thai}</p>
          <p className="text-xs text-gray-300">{greetings[greetingIdx].reading}</p>
        </div>
      </div>

      {/* Overall progress */}
      {isLoaded && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">ความก้าวหน้ารวม</h2>
            <span className="text-red-600 font-bold text-lg">{masteredPct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
            <div
              className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-700"
              style={{ width: `${learnedPct}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-lg font-bold text-gray-400">{stats.notStarted}</p>
              <p className="text-xs text-gray-400">ยังไม่เรียน</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-2">
              <p className="text-lg font-bold text-amber-600">{stats.learning}</p>
              <p className="text-xs text-amber-600">กำลังเรียน</p>
            </div>
            <div className="bg-green-50 rounded-lg p-2">
              <p className="text-lg font-bold text-green-600">{stats.mastered}</p>
              <p className="text-xs text-green-600">จำได้แล้ว</p>
            </div>
          </div>
          {stats.due > 0 && (
            <Link
              href="/flashcard"
              className="mt-3 flex items-center justify-center gap-2 bg-red-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-red-700 transition-colors btn-press"
            >
              <span>🔔</span>
              <span>มี {stats.due} คำที่ต้องทบทวน!</span>
            </Link>
          )}
        </div>
      )}

      {/* Quick tip */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-4 text-white">
        <p className="font-semibold text-sm mb-1">💡 เทคนิคท่องใน 1 วัน</p>
        <p className="text-sm text-red-100 leading-relaxed">
          เรียน Flashcard → ทำ Quiz → กลับมาทบทวนคำที่ผิด → ทำซ้ำ 3 รอบ
          ระบบ SRS จะช่วยให้จำได้เร็วขึ้น!
        </p>
      </div>

      {/* Study modes */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-700 text-sm px-1">เลือกโหมดเรียน</h2>
        {studyModes.map((mode) => (
          <Link
            key={mode.href}
            href={mode.href}
            className={`flex items-center gap-4 p-4 bg-white rounded-2xl border ${mode.border} shadow-sm hover:shadow-md transition-all duration-200 btn-press`}
          >
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center text-2xl shadow-sm flex-shrink-0`}
            >
              {mode.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900">{mode.title}</p>
                <p className={`font-jp text-xs ${mode.text} font-medium`}>{mode.titleJP}</p>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{mode.description}</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Chapter overview */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <h2 className="font-semibold text-gray-800 mb-3">เนื้อหาที่ต้องสอบ</h2>
        <div className="space-y-2">
          {[1, 2, 3].map((ch) => {
            const chVocab = vocabulary.filter((v) => v.chapter === ch);
            const chStats = isLoaded ? getStats(chVocab.map((v) => v.id)) : null;
            const chPct = chStats ? Math.round((chStats.mastered / chStats.total) * 100) : 0;
            const chTopics: Record<number, string> = {
              1: "แนะนำตัว, อาชีพ, สัญชาติ",
              2: "สิ่งของรอบตัว, this/that/that over there",
              3: "สถานที่, ทิศทาง, ราคา",
            };
            return (
              <div key={ch} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <span className="font-jp text-sm font-bold text-red-600">{ch}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm text-gray-700">
                      บทที่ {ch} · {chTopics[ch]}
                    </p>
                    <span className="text-xs text-gray-400">{chPct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-red-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${chPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vocabulary count */}
      <div className="text-center text-xs text-gray-400 pb-2">
        คำศัพท์ทั้งหมด {vocabulary.length} คำ · บทที่ 1–3
      </div>
    </div>
  );
}
