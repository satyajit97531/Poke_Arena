export interface Note {
  pitch: number; // Hz
  duration: number; // seconds
}

export interface SongTrack {
  id: string;
  title: string;
  origin: string;
  description: string;
  unlockCondition: string;
  isUnlockedByDefault?: boolean;
  tempo: number; // BPM
  melody: Note[];
  bass: Note[];
}

// Frequency constants
const C4 = 261.63;
const D4 = 293.66;
const E4 = 329.63;
const F4 = 349.23;
const G4 = 392.00;
const A4 = 440.00;
const B4 = 493.88;
const C5 = 523.25;
const D5 = 587.33;
const E5 = 659.25;
const F5 = 698.46;
const G5 = 783.99;
const A5 = 880.00;
const B5 = 987.77;
const C6 = 1046.50;
const D6 = 1174.66;
const REST = 0;

export const POKEMON_TRACKS: SongTrack[] = [
  {
    id: 'pallet_town',
    title: 'Pallet Town Nostalgia',
    origin: 'Kanto (Red/Blue/FireRed)',
    description: 'The cozy, gentle melody of starting your journey in your hometown.',
    unlockCondition: 'Unlocked by default',
    isUnlockedByDefault: true,
    tempo: 108,
    melody: [
      { pitch: E5, duration: 0.35 },
      { pitch: G5, duration: 0.35 },
      { pitch: A5, duration: 0.5 },
      { pitch: G5, duration: 0.25 },
      { pitch: E5, duration: 0.35 },
      { pitch: D5, duration: 0.35 },
      { pitch: C5, duration: 0.7 },
      { pitch: REST, duration: 0.2 },
      { pitch: D5, duration: 0.35 },
      { pitch: E5, duration: 0.35 },
      { pitch: F5, duration: 0.35 },
      { pitch: E5, duration: 0.35 },
      { pitch: D5, duration: 0.7 },
      { pitch: REST, duration: 0.3 },
    ],
    bass: [
      { pitch: C4, duration: 0.7 },
      { pitch: G4, duration: 0.7 },
      { pitch: A4, duration: 0.7 },
      { pitch: F4, duration: 0.7 },
      { pitch: G4, duration: 0.7 },
      { pitch: C4, duration: 0.7 },
    ],
  },
  {
    id: 'gym_leader_battle',
    title: 'Gym Leader Battle Rush',
    origin: 'Kanto & Johto Battle',
    description: 'High octane pulse-pounding rhythm of an intense badge showdown.',
    unlockCondition: 'Win 3 Silhouette rounds or reach 1,500 points',
    tempo: 140,
    melody: [
      { pitch: A4, duration: 0.18 },
      { pitch: A4, duration: 0.18 },
      { pitch: C5, duration: 0.18 },
      { pitch: D5, duration: 0.18 },
      { pitch: E5, duration: 0.36 },
      { pitch: D5, duration: 0.18 },
      { pitch: C5, duration: 0.18 },
      { pitch: D5, duration: 0.36 },
      { pitch: REST, duration: 0.1 },
      { pitch: E5, duration: 0.18 },
      { pitch: G5, duration: 0.18 },
      { pitch: A5, duration: 0.4 },
      { pitch: G5, duration: 0.2 },
      { pitch: E5, duration: 0.4 },
    ],
    bass: [
      { pitch: A4 / 2, duration: 0.18 },
      { pitch: A4 / 2, duration: 0.18 },
      { pitch: E4, duration: 0.18 },
      { pitch: A4 / 2, duration: 0.18 },
      { pitch: F4, duration: 0.18 },
      { pitch: G4, duration: 0.18 },
    ],
  },
  {
    id: 'sinnoh_route',
    title: 'Route 201 Sinnoh Breeze',
    origin: 'Sinnoh (Diamond/Pearl/Platinum)',
    description: 'Joyful, bouncy spring melody across the sparkling fields of Sinnoh.',
    unlockCondition: 'Complete an Evolution Line puzzle',
    tempo: 124,
    melody: [
      { pitch: G5, duration: 0.25 },
      { pitch: E5, duration: 0.25 },
      { pitch: C5, duration: 0.25 },
      { pitch: D5, duration: 0.25 },
      { pitch: E5, duration: 0.5 },
      { pitch: G5, duration: 0.5 },
      { pitch: A5, duration: 0.25 },
      { pitch: C6, duration: 0.25 },
      { pitch: B5, duration: 0.5 },
      { pitch: G5, duration: 0.5 },
    ],
    bass: [
      { pitch: C4, duration: 0.5 },
      { pitch: E4, duration: 0.5 },
      { pitch: F4, duration: 0.5 },
      { pitch: G4, duration: 0.5 },
    ],
  },
  {
    id: 'area_zero',
    title: 'Area Zero Paradox Synth',
    origin: 'Paldea (Scarlet/Violet)',
    description: 'Deep, mysterious echoing electronic arpeggio from the Great Crater.',
    unlockCondition: 'Conquer Legendary Arena or Hard Mode',
    tempo: 115,
    melody: [
      { pitch: D5, duration: 0.2 },
      { pitch: F5, duration: 0.2 },
      { pitch: A5, duration: 0.2 },
      { pitch: D6, duration: 0.4 },
      { pitch: C6, duration: 0.2 },
      { pitch: A5, duration: 0.3 },
      { pitch: F5, duration: 0.3 },
      { pitch: G5, duration: 0.3 },
      { pitch: E5, duration: 0.5 },
    ],
    bass: [
      { pitch: D4 / 2, duration: 0.4 },
      { pitch: A4 / 2, duration: 0.4 },
      { pitch: D4, duration: 0.4 },
      { pitch: C4, duration: 0.4 },
    ],
  },
  {
    id: 'lavender_mystery',
    title: 'Lavender Town Mystery',
    origin: 'Kanto (Ghost Tower)',
    description: 'The legendary eerie harmonic chimes that sent shivers down millions of spines.',
    unlockCondition: 'Guess 5 Ghost or Dark type Pokémon correctly',
    tempo: 96,
    melody: [
      { pitch: B5, duration: 0.4 },
      { pitch: G5, duration: 0.4 },
      { pitch: F5, duration: 0.4 },
      { pitch: B4, duration: 0.6 },
      { pitch: C5, duration: 0.4 },
      { pitch: E5, duration: 0.4 },
      { pitch: G5, duration: 0.4 },
      { pitch: B5, duration: 0.6 },
    ],
    bass: [
      { pitch: C4, duration: 0.8 },
      { pitch: B4 / 2, duration: 0.8 },
      { pitch: C4, duration: 0.8 },
      { pitch: G4 / 2, duration: 0.8 },
    ],
  },
  {
    id: 'cynthia_theme',
    title: "Champion Cynthia's Piano",
    origin: 'Sinnoh (Diamond/Pearl/Platinum)',
    description: 'Dramatic classical arpeggios that preceded the most challenging battle in Pokémon history.',
    unlockCondition: 'Conquer Extreme mode or reach a 10-win streak',
    tempo: 132,
    melody: [
      { pitch: D5, duration: 0.18 },
      { pitch: F5, duration: 0.18 },
      { pitch: A5, duration: 0.18 },
      { pitch: D6, duration: 0.36 },
      { pitch: C6, duration: 0.18 },
      { pitch: B5, duration: 0.18 },
      { pitch: A5, duration: 0.36 },
      { pitch: G5, duration: 0.18 },
      { pitch: F5, duration: 0.18 },
      { pitch: E5, duration: 0.54 },
    ],
    bass: [
      { pitch: D4 / 2, duration: 0.36 },
      { pitch: A4 / 2, duration: 0.36 },
      { pitch: F4 / 2, duration: 0.36 },
      { pitch: G4 / 2, duration: 0.36 },
      { pitch: A4 / 2, duration: 0.54 },
    ],
  },
  {
    id: 'pokemon_center',
    title: 'Pokémon Center Healing Waltz',
    origin: 'Universal Pokémon Center',
    description: 'The comforting, beloved restorative tune that heals your tired Pokémon party.',
    unlockCondition: 'Unlocked by default',
    isUnlockedByDefault: true,
    tempo: 110,
    melody: [
      { pitch: C5, duration: 0.3 },
      { pitch: E5, duration: 0.3 },
      { pitch: G5, duration: 0.4 },
      { pitch: C6, duration: 0.5 },
      { pitch: B5, duration: 0.3 },
      { pitch: G5, duration: 0.3 },
      { pitch: A5, duration: 0.5 },
      { pitch: F5, duration: 0.4 },
      { pitch: D5, duration: 0.5 },
    ],
    bass: [
      { pitch: C4, duration: 0.6 },
      { pitch: E4, duration: 0.6 },
      { pitch: F4, duration: 0.6 },
      { pitch: G4, duration: 0.6 },
    ],
  },
  {
    id: 'littleroot_town',
    title: 'Littleroot Town Harmony',
    origin: 'Hoenn (Ruby/Sapphire/Emerald)',
    description: 'Gentle acoustic winds rustling through the seaside greenery of Hoenn.',
    unlockCondition: 'Correctly identify 5 Gen 3 (Hoenn) Pokémon',
    tempo: 104,
    melody: [
      { pitch: E5, duration: 0.4 },
      { pitch: G5, duration: 0.2 },
      { pitch: C6, duration: 0.4 },
      { pitch: B5, duration: 0.4 },
      { pitch: A5, duration: 0.4 },
      { pitch: G5, duration: 0.6 },
      { pitch: F5, duration: 0.3 },
      { pitch: E5, duration: 0.3 },
      { pitch: D5, duration: 0.6 },
    ],
    bass: [
      { pitch: C4, duration: 0.8 },
      { pitch: G4, duration: 0.8 },
      { pitch: F4, duration: 0.8 },
      { pitch: G4, duration: 0.8 },
    ],
  },
  {
    id: 'red_battle',
    title: 'Battle! Mt. Silver (vs Red)',
    origin: 'Johto Peak (Gold/Silver/HGSS)',
    description: 'High-voltage chiptune anthem of standing in the snow atop Mt. Silver facing Trainer Red.',
    unlockCondition: 'Conquer Legendary Arena or score 3,000+ points',
    tempo: 152,
    melody: [
      { pitch: E5, duration: 0.15 },
      { pitch: E5, duration: 0.15 },
      { pitch: G5, duration: 0.15 },
      { pitch: A5, duration: 0.3 },
      { pitch: G5, duration: 0.15 },
      { pitch: F5, duration: 0.15 },
      { pitch: E5, duration: 0.3 },
      { pitch: D5, duration: 0.15 },
      { pitch: E5, duration: 0.3 },
      { pitch: B5, duration: 0.4 },
    ],
    bass: [
      { pitch: E4 / 2, duration: 0.3 },
      { pitch: B4 / 2, duration: 0.3 },
      { pitch: C4, duration: 0.3 },
      { pitch: D4, duration: 0.3 },
    ],
  },
];
