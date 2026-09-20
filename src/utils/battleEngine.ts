import { Pokemon } from '../types/pokemon';
import { CURATED_POKEMON, LEGENDARY_POKEMON } from '../data/pokemonData';

export interface BattleMatchup {
  id: string;
  pokemonA: Pokemon;
  pokemonB: Pokemon;
  winner: 'A' | 'B' | 'TIE';
  winProbabilityA: number; // e.g. 78%
  winProbabilityB: number; // e.g. 22%
  primaryReason: string;
  typeMultiplierAtoB: number;
  typeMultiplierBtoA: number;
  powerScoreA: number;
  powerScoreB: number;
}

// Canonical type effectiveness chart (attacker -> defender)
const TYPE_CHART: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

function getAttackMultiplier(atkType: string, defTypes: string[]): number {
  let mult = 1.0;
  const chart = TYPE_CHART[atkType.toLowerCase()];
  if (!chart) return 1.0;
  for (const dt of defTypes) {
    const d = dt.toLowerCase();
    if (chart[d] !== undefined) {
      mult *= chart[d];
    }
  }
  return mult;
}

function getMaxTypeEffectiveness(attackerTypes: string[], defenderTypes: string[]): number {
  let maxMult = 1.0;
  for (const at of attackerTypes) {
    const m = getAttackMultiplier(at, defenderTypes);
    if (m > maxMult) maxMult = m;
  }
  return maxMult;
}

export function evaluateBattle(pokemonA: Pokemon, pokemonB: Pokemon): BattleMatchup {
  // 1. Calculate Base Power
  let powerA = 450;
  let powerB = 450;

  if (pokemonA.isLegendary) powerA += 260;
  if (pokemonA.isMythical) powerA += 240;
  if (pokemonA.isParadox) powerA += 180;
  if (pokemonA.isStarter) powerA += 80;

  if (pokemonB.isLegendary) powerB += 260;
  if (pokemonB.isMythical) powerB += 240;
  if (pokemonB.isParadox) powerB += 180;
  if (pokemonB.isStarter) powerB += 80;

  // Weight & Height physical momentum bonus
  powerA += Math.min(60, Math.floor(pokemonA.weight / 15));
  powerB += Math.min(60, Math.floor(pokemonB.weight / 15));

  // 2. Type effectiveness
  const multAtoB = getMaxTypeEffectiveness(pokemonA.types, pokemonB.types);
  const multBtoA = getMaxTypeEffectiveness(pokemonB.types, pokemonA.types);

  // Apply offensive multiplier with strong weight
  const effectiveScoreA = powerA * (multAtoB >= 2 ? 1.55 : multAtoB === 0 ? 0.35 : multAtoB < 1 ? 0.75 : 1.0);
  const effectiveScoreB = powerB * (multBtoA >= 2 ? 1.55 : multBtoA === 0 ? 0.35 : multBtoA < 1 ? 0.75 : 1.0);

  const total = effectiveScoreA + effectiveScoreB;
  const winProbabilityA = Math.min(96, Math.max(4, Math.round((effectiveScoreA / total) * 100)));
  const winProbabilityB = 100 - winProbabilityA;

  let winner: 'A' | 'B' | 'TIE' = 'TIE';
  let primaryReason = '';

  if (winProbabilityA >= 55) {
    winner = 'A';
    if (multAtoB >= 2) {
      primaryReason = `${pokemonA.displayName}'s ${pokemonA.types.join('/')} typing deals Super-Effective (2x) damage against ${pokemonB.displayName}!`;
    } else if (multBtoA === 0) {
      primaryReason = `${pokemonA.displayName} is completely immune to ${pokemonB.displayName}'s primary elemental attacks!`;
    } else if (pokemonA.isLegendary || pokemonA.isMythical) {
      primaryReason = `${pokemonA.displayName}'s overwhelming Legendary combat power and supreme stats triumph!`;
    } else {
      primaryReason = `${pokemonA.displayName} holds superior offensive velocity and combat stats over ${pokemonB.displayName}!`;
    }
  } else if (winProbabilityB >= 55) {
    winner = 'B';
    if (multBtoA >= 2) {
      primaryReason = `${pokemonB.displayName}'s ${pokemonB.types.join('/')} typing deals Super-Effective (2x) damage against ${pokemonA.displayName}!`;
    } else if (multAtoB === 0) {
      primaryReason = `${pokemonB.displayName} is completely immune to ${pokemonA.displayName}'s primary elemental attacks!`;
    } else if (pokemonB.isLegendary || pokemonB.isMythical) {
      primaryReason = `${pokemonB.displayName}'s overwhelming Legendary combat power and supreme stats triumph!`;
    } else {
      primaryReason = `${pokemonB.displayName} holds superior offensive velocity and combat stats over ${pokemonA.displayName}!`;
    }
  } else {
    winner = effectiveScoreA >= effectiveScoreB ? 'A' : 'B';
    primaryReason = `Extremely close clash! ${winner === 'A' ? pokemonA.displayName : pokemonB.displayName} narrowly edges ahead through combat momentum.`;
  }

  return {
    id: `battle_${pokemonA.id}_vs_${pokemonB.id}`,
    pokemonA,
    pokemonB,
    winner,
    winProbabilityA,
    winProbabilityB,
    primaryReason,
    typeMultiplierAtoB: multAtoB,
    typeMultiplierBtoA: multBtoA,
    powerScoreA: Math.round(effectiveScoreA),
    powerScoreB: Math.round(effectiveScoreB),
  };
}

export function generateRandomMatchup(isExtreme: boolean = false): BattleMatchup {
  const pool = isExtreme ? [...CURATED_POKEMON, ...LEGENDARY_POKEMON] : CURATED_POKEMON;

  let pokemonA: Pokemon;
  let pokemonB: Pokemon;
  let attempts = 0;

  do {
    pokemonA = pool[Math.floor(Math.random() * pool.length)];
    pokemonB = pool[Math.floor(Math.random() * pool.length)];
    attempts++;
  } while (pokemonA.id === pokemonB.id && attempts < 20);

  return evaluateBattle(pokemonA, pokemonB);
}
