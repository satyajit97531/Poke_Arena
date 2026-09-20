import { EvolutionChain, Pokemon, PokemonType, RegionId } from '../types/pokemon';
import rawAllPokemon from './allPokemon.json';
import { EXTENDED_EVOLUTION_CHAINS } from './evolutionChains';

export const OFFICIAL_ARTWORK_URL = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

export const SHINY_ARTWORK_URL = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`;

export const POKEMON_CRY_URL = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;

export const ALL_1025_POKEMON: Pokemon[] = (rawAllPokemon as Array<{
  id: number;
  name: string;
  displayName: string;
  types: string[];
  generation: number;
  region: string;
  species: string;
  height: number;
  weight: number;
  moves: string[];
  isStarter?: boolean;
  isLegendary?: boolean;
  isMythical?: boolean;
  isParadox?: boolean;
  isRegionalForm?: boolean;
  flavorText?: string;
}>).map((p) => ({
  id: p.id,
  name: p.name,
  displayName: p.displayName,
  types: p.types as PokemonType[],
  generation: p.generation,
  region: p.region as RegionId,
  species: p.species,
  height: p.height,
  weight: p.weight,
  flavorText: p.flavorText || `National Pokédex #${p.id}. ${p.species}. Native to the ${p.region.toUpperCase()} region.`,
  moves: p.moves && p.moves.length > 0 ? p.moves : ['Tackle', 'Quick Attack', 'Protect', 'Swift'],
  isStarter: !!p.isStarter,
  isLegendary: !!p.isLegendary,
  isMythical: !!p.isMythical,
  isParadox: !!p.isParadox,
  isRegionalForm: !!p.isRegionalForm,
  artwork: OFFICIAL_ARTWORK_URL(p.id),
  shinyArtwork: SHINY_ARTWORK_URL(p.id),
  cryUrl: POKEMON_CRY_URL(p.id),
}));

export const CURATED_POKEMON: Pokemon[] = ALL_1025_POKEMON;

// ===================== EVOLUTION CHAINS =====================
export const EVOLUTION_CHAINS: EvolutionChain[] = EXTENDED_EVOLUTION_CHAINS;

export function getPokemonByRegion(region: RegionId): Pokemon[] {
  if (region === 'all') return CURATED_POKEMON;
  return CURATED_POKEMON.filter((p) => p.region === region);
}

export function getLegendaryPokemon(): Pokemon[] {
  return CURATED_POKEMON.filter((p) => p.isLegendary || p.isMythical || p.isParadox);
}

export function getRegionalFormsPokemon(): Pokemon[] {
  return CURATED_POKEMON.filter((p) => p.isRegionalForm || p.region === 'paldea' || p.region === 'hisui' || p.region === 'galar');
}

export const LEGENDARY_POKEMON: Pokemon[] = CURATED_POKEMON.filter((p) => p.isLegendary || p.isMythical || p.isParadox);
export const REGIONAL_FORMS_POKEMON: Pokemon[] = CURATED_POKEMON.filter((p) => p.isRegionalForm || p.region === 'paldea' || p.region === 'hisui' || p.region === 'galar');
