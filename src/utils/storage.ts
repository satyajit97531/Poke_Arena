import { GameMode, HighScoreRecord, PlayerProfile, RegionId, Trophy } from '../types/pokemon';
import { INITIAL_TROPHIES } from '../data/trophies';

const PROFILE_KEY = 'pokesilhouette_player_profile';
const HIGH_SCORES_KEY = 'pokesilhouette_high_scores';
const TROPHIES_KEY = 'pokesilhouette_trophies';

export function getStoredProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }

  const defaultProfile: PlayerProfile = {
    name: 'Red',
    totalGames: 0,
    totalWins: 0,
    totalCorrect: 0,
    totalGuesses: 0,
    bestStreak: 0,
    totalScore: 0,
    trophies: [],
    highScores: {
      classic: 0,
      blitz: 0,
      survival: 0,
      zen: 0,
    },
    regionalMastery: {
      all: { correct: 0, total: 0 },
      kanto: { correct: 0, total: 0 },
      johto: { correct: 0, total: 0 },
      hoenn: { correct: 0, total: 0 },
      sinnoh: { correct: 0, total: 0 },
      unova: { correct: 0, total: 0 },
      kalos: { correct: 0, total: 0 },
      alola: { correct: 0, total: 0 },
      galar: { correct: 0, total: 0 },
      hisui: { correct: 0, total: 0 },
      paldea: { correct: 0, total: 0 },
    },
  };
  saveProfile(defaultProfile);
  return defaultProfile;
}

export function saveProfile(profile: PlayerProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

// Bot / Seed rival accounts to purge so only real players who played are ranked
const BOT_NAMES = new Set(['cynthia', 'leon', 'steven', 'nemona', 'blue', 'lance']);
const BOT_IDS = new Set(['1', '2', '3', '4', '5', '6']);

export function cleanHighScores(records: HighScoreRecord[]): HighScoreRecord[] {
  if (!Array.isArray(records)) return [];
  return records.filter((r) => {
    if (!r) return false;
    if (BOT_IDS.has(String(r.id))) return false;
    const name = String(r.playerName || '').toLowerCase().trim();
    if (BOT_NAMES.has(name)) return false;
    if (typeof r.score !== 'number' || r.score <= 0) return false;
    return true;
  });
}

export function getStoredHighScores(): HighScoreRecord[] {
  try {
    const raw = localStorage.getItem(HIGH_SCORES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = cleanHighScores(parsed);
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(cleaned));
        }
        return cleaned;
      }
    }
  } catch {
    // fallback
  }

  return [];
}

export function addHighScore(record: Omit<HighScoreRecord, 'id' | 'date'>): HighScoreRecord[] {
  const current = getStoredHighScores();
  const newRecord: HighScoreRecord = {
    ...record,
    id: 'hs_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    date: new Date().toISOString().split('T')[0],
  };

  const updated = cleanHighScores([newRecord, ...current])
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);

  try {
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }

  // Push to server in background so other players can see real scores
  try {
    fetch('/api/highscores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord),
    }).catch(() => {});
  } catch {
    // ignore
  }

  return updated;
}

export function getStoredTrophies(): Trophy[] {
  try {
    const raw = localStorage.getItem(TROPHIES_KEY);
    if (raw) {
      const storedMap: Record<string, Partial<Trophy>> = JSON.parse(raw);
      return INITIAL_TROPHIES.map((t) => {
        const found = storedMap[t.id];
        if (found) {
          return {
            ...t,
            unlocked: found.unlocked ?? t.unlocked,
            unlockedAt: found.unlockedAt ?? t.unlockedAt,
            progress: found.progress ?? t.progress,
          };
        }
        return t;
      });
    }
  } catch {
    // fallback
  }

  return INITIAL_TROPHIES;
}

export function saveTrophies(trophies: Trophy[]) {
  try {
    const map: Record<string, { unlocked: boolean; unlockedAt?: string; progress: number }> = {};
    trophies.forEach((t) => {
      map[t.id] = { unlocked: t.unlocked, unlockedAt: t.unlockedAt, progress: t.progress };
    });
    localStorage.setItem(TROPHIES_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}
