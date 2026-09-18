import { CURATED_POKEMON, getPokemonByRegion, LEGENDARY_POKEMON, REGIONAL_FORMS_POKEMON } from '../data/pokemonData';
import { GameDifficulty, MainGameMode, Pokemon, QuizQuestion, RegionId, ShadowCropType, Trophy } from '../types/pokemon';
import { getStoredProfile, getStoredTrophies, saveProfile, saveTrophies } from './storage';

export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateQuestion(
  region: RegionId,
  excludeIds: Set<number> = new Set(),
  difficulty: GameDifficulty = 'easy',
  mode: MainGameMode = 'classic'
): QuizQuestion {
  let pool = getPokemonByRegion(region);

  // Legendary Arena Mode: target is ALWAYS legendary, mythical, or rare!
  if (mode === 'legendary') {
    pool = LEGENDARY_POKEMON.length > 0 ? LEGENDARY_POKEMON : pool;
  } else if (difficulty === 'hard') {
    // Hard Mode: user requested "also use huisian, galarian, paldian etc pokemons in this hard mode."
    pool = REGIONAL_FORMS_POKEMON.length > 0 ? REGIONAL_FORMS_POKEMON : pool;
  }

  const eligible = pool.filter((p) => !excludeIds.has(p.id));
  const candidatePool = eligible.length >= 4 ? eligible : pool;

  const target = getRandomElement(candidatePool);

  // Pick 3 distractors
  const otherPool = CURATED_POKEMON.filter((p) => p.id !== target.id);
  const distractors: Pokemon[] = [];

  // Try to pick distractors from matching regional pool if possible
  const sameRegion = otherPool.filter((p) => p.region === target.region);
  const shuffledSame = shuffleArray(sameRegion);

  while (distractors.length < 2 && shuffledSame.length > 0) {
    const pick = shuffledSame.pop()!;
    if (!distractors.some((d) => d.id === pick.id)) {
      distractors.push(pick);
    }
  }

  const remainingShuffled = shuffleArray(otherPool);
  while (distractors.length < 3 && remainingShuffled.length > 0) {
    const pick = remainingShuffled.pop()!;
    if (!distractors.some((d) => d.id === pick.id)) {
      distractors.push(pick);
    }
  }

  const options = shuffleArray([target, ...distractors]);

  // Determine shadowCrop based on difficulty:
  // Medium: Half body (upper or lower)
  // Hard: Body part (head, tail, arm, leg)
  let shadowCrop: ShadowCropType = 'full';
  if (difficulty === 'medium') {
    shadowCrop = Math.random() < 0.5 ? 'upper' : 'lower';
  } else if (difficulty === 'hard') {
    const parts: ShadowCropType[] = ['head', 'tail', 'arm', 'leg'];
    shadowCrop = parts[Math.floor(Math.random() * parts.length)];
  }

  return {
    pokemon: target,
    options,
    timeLimit: mode === 'blitz' ? 60 : 15,
    difficulty,
    shadowCrop,
    revealedHints: {
      types: true, // Elemental type hint is always on by default as requested!
      region: false,
      category: false,
      initialLetter: false,
    },
  };
}

export function calculateScore(
  timeRemaining: number,
  timeTotal: number,
  streak: number,
  mode: MainGameMode
): { points: number; multiplier: number; speedBonus: number } {
  if (mode === 'zen') {
    return { points: 50, multiplier: 1, speedBonus: 0 };
  }

  let multiplier = 1.0;
  if (streak >= 15) multiplier = 3.0;
  else if (streak >= 10) multiplier = 2.5;
  else if (streak >= 7) multiplier = 2.0;
  else if (streak >= 5) multiplier = 1.75;
  else if (streak >= 3) multiplier = 1.5;
  else if (streak >= 2) multiplier = 1.25;

  const basePoints = 100;
  const timeRatio = Math.max(0, Math.min(1, timeRemaining / timeTotal));
  const speedBonus = Math.round(timeRatio * 150);

  const rawScore = (basePoints + speedBonus) * multiplier;
  const points = Math.round(rawScore);

  return { points, multiplier, speedBonus };
}

export interface TrophyCheckEvent {
  isCorrect: boolean;
  pokemon: Pokemon;
  streak: number;
  timeRemaining: number;
  mode: MainGameMode;
  sessionScore: number;
  sessionCorrect: number;
  sessionTotal: number;
  isGameOver?: boolean;
}

export function processTrophyProgress(event: TrophyCheckEvent): Trophy[] {
  const trophies = getStoredTrophies();
  const profile = getStoredProfile();
  const newlyUnlocked: Trophy[] = [];

  // Update profile counts
  if (event.isCorrect) {
    profile.totalCorrect += 1;
    profile.bestStreak = Math.max(profile.bestStreak, event.streak);
  }
  profile.totalGuesses += 1;
  profile.totalScore += event.isCorrect ? 100 : 0;

  // Regional count
  const regKey = event.pokemon.region;
  if (profile.regionalMastery[regKey]) {
    profile.regionalMastery[regKey].total += 1;
    if (event.isCorrect) {
      profile.regionalMastery[regKey].correct += 1;
    }
  }

  if (event.isGameOver) {
    profile.totalGames += 1;
    if (event.sessionCorrect >= 7) {
      profile.totalWins += 1;
    }
  }

  // Iterate trophies
  trophies.forEach((t) => {
    if (t.unlocked) return;

    let shouldUnlock = false;

    if (t.id === 'first_catch' && event.isCorrect) {
      t.progress = 1;
      shouldUnlock = true;
    } else if (t.id === 'flame_master' && event.isCorrect && event.pokemon.types.includes('fire')) {
      t.progress = Math.min(t.maxProgress, t.progress + 1);
      if (t.progress >= t.maxProgress) shouldUnlock = true;
    } else if (t.id === 'hydro_scholar' && event.isCorrect && event.pokemon.types.includes('water')) {
      t.progress = Math.min(t.maxProgress, t.progress + 1);
      if (t.progress >= t.maxProgress) shouldUnlock = true;
    } else if (t.id === 'rapid_reflexes' && event.isCorrect && event.timeRemaining >= 13.5) {
      t.progress = 1;
      shouldUnlock = true;
    } else if (t.id === 'streak_five' && event.streak >= 5) {
      t.progress = Math.max(t.progress, event.streak);
      shouldUnlock = true;
    } else if (t.id === 'streak_ten' && event.streak >= 10) {
      t.progress = Math.max(t.progress, event.streak);
      shouldUnlock = true;
    } else if (t.id === 'kanto_veteran' && event.isCorrect && event.pokemon.region === 'kanto') {
      t.progress = Math.min(t.maxProgress, t.progress + 1);
      if (t.progress >= t.maxProgress) shouldUnlock = true;
    } else if (t.id === 'paldea_pioneer' && event.isCorrect && event.pokemon.region === 'paldea') {
      t.progress = Math.min(t.maxProgress, t.progress + 1);
      if (t.progress >= t.maxProgress) shouldUnlock = true;
    } else if (t.id === 'perfect_ten' && event.isGameOver && event.sessionCorrect === 10 && event.sessionTotal === 10) {
      t.progress = 1;
      shouldUnlock = true;
    } else if (t.id === 'legendary_conqueror' && event.isCorrect && (event.pokemon.isLegendary || event.pokemon.isMythical)) {
      t.progress = Math.min(t.maxProgress, t.progress + 1);
      if (t.progress >= t.maxProgress) shouldUnlock = true;
    }

    if (shouldUnlock) {
      t.unlocked = true;
      t.unlockedAt = new Date().toISOString();
      newlyUnlocked.push(t);
    }
  });

  saveTrophies(trophies);
  saveProfile(profile);

  return newlyUnlocked;
}
