"use client";
import { useState, useEffect, useCallback } from "react";

export interface SRSCard {
  id: string;
  level: number; // 0-5 (0=ยังไม่รู้, 5=จำได้ดีมาก)
  nextReview: number; // timestamp
  totalReviews: number;
  correctCount: number;
}

export interface SRSState {
  cards: Record<string, SRSCard>;
}

const LEVEL_INTERVALS = [0, 1, 3, 7, 14, 30]; // วัน
export const CRAM_INTERVALS = [0, 5, 15, 30, 60, 120]; // นาที (สำหรับ session 2 ชม)

function getIntervalMs(level: number, cram = false): number {
  if (cram) {
    const minutes = CRAM_INTERVALS[Math.min(level, 5)];
    return minutes * 60 * 1000;
  }
  const days = LEVEL_INTERVALS[Math.min(level, 5)];
  return days * 24 * 60 * 60 * 1000;
}

export function useSRS(storageKey: string = "japan-srs") {
  const [state, setState] = useState<SRSState>({ cards: {} });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          setState(JSON.parse(saved));
        }
      } catch {
        // ignore
      }
      setIsLoaded(true);
    }
  }, [storageKey]);

  const save = useCallback(
    (newState: SRSState) => {
      setState(newState);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKey, JSON.stringify(newState));
        } catch {
          // ignore
        }
      }
    },
    [storageKey]
  );

  const getCard = useCallback(
    (id: string): SRSCard => {
      return (
        state.cards[id] || {
          id,
          level: 0,
          nextReview: 0,
          totalReviews: 0,
          correctCount: 0,
        }
      );
    },
    [state.cards]
  );

  const updateCard = useCallback(
    (id: string, correct: boolean, cram = false) => {
      const card = getCard(id);
      const newLevel = correct
        ? Math.min(card.level + 1, 5)
        : Math.max(card.level - 1, 0);
      const newCard: SRSCard = {
        ...card,
        level: newLevel,
        nextReview: Date.now() + getIntervalMs(newLevel, cram),
        totalReviews: card.totalReviews + 1,
        correctCount: card.correctCount + (correct ? 1 : 0),
      };
      const newState = {
        ...state,
        cards: { ...state.cards, [id]: newCard },
      };
      save(newState);
    },
    [getCard, save, state]
  );

  const getDueCards = useCallback(
    (ids: string[]): string[] => {
      const now = Date.now();
      return ids.filter((id) => {
        const card = state.cards[id];
        if (!card) return true; // ยังไม่เคยเรียน
        return card.nextReview <= now;
      });
    },
    [state.cards]
  );

  const getStats = useCallback(
    (ids: string[]) => {
      const now = Date.now();
      let mastered = 0;
      let learning = 0;
      let notStarted = 0;
      let due = 0;

      ids.forEach((id) => {
        const card = state.cards[id];
        if (!card) {
          notStarted++;
          due++;
        } else if (card.level >= 4) {
          mastered++;
          if (card.nextReview <= now) due++;
        } else if (card.level > 0) {
          learning++;
          if (card.nextReview <= now) due++;
        } else {
          notStarted++;
          due++;
        }
      });

      return { mastered, learning, notStarted, due, total: ids.length };
    },
    [state.cards]
  );

  const resetAll = useCallback(() => {
    const newState = { cards: {} };
    save(newState);
  }, [save]);

  return {
    isLoaded,
    getCard,
    updateCard,
    getDueCards,
    getStats,
    resetAll,
    state,
  };
}
