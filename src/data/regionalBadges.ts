export interface GymBadgeInfo {
  id: string;
  name: string;
  gymLeader: string;
  town: string;
  emoji: string;
  description: string;
  rewardTrophyPoints: number;
  color: string;
  region: string;
  type: string;
}

export const ALL_REGIONAL_BADGES: Record<string, GymBadgeInfo[]> = {
  Kanto: [
    { id: 'badge_boulder', name: 'Boulder Badge', gymLeader: 'Brock', town: 'Pewter City', emoji: '🪨', description: 'Pewter Gym: Rock-solid instincts', rewardTrophyPoints: 300, color: 'from-stone-400 to-zinc-600', region: 'Kanto', type: 'Rock' },
    { id: 'badge_cascade', name: 'Cascade Badge', gymLeader: 'Misty', town: 'Cerulean City', emoji: '💧', description: 'Cerulean Gym: Aquatic mastery', rewardTrophyPoints: 350, color: 'from-cyan-400 to-blue-600', region: 'Kanto', type: 'Water' },
    { id: 'badge_thunder', name: 'Thunder Badge', gymLeader: 'Lt. Surge', town: 'Vermilion City', emoji: '⚡', description: 'Vermilion Gym: Lightning reflexes', rewardTrophyPoints: 350, color: 'from-amber-300 to-yellow-500', region: 'Kanto', type: 'Electric' },
    { id: 'badge_rainbow', name: 'Rainbow Badge', gymLeader: 'Erika', town: 'Celadon City', emoji: '🌈', description: 'Celadon Gym: Botanical harmony', rewardTrophyPoints: 400, color: 'from-emerald-400 via-pink-400 to-cyan-400', region: 'Kanto', type: 'Grass' },
    { id: 'badge_soul', name: 'Soul Badge', gymLeader: 'Koga', town: 'Fuchsia City', emoji: '💖', description: 'Fuchsia Gym: Ninja evasion', rewardTrophyPoints: 450, color: 'from-pink-500 to-purple-700', region: 'Kanto', type: 'Poison' },
    { id: 'badge_marsh', name: 'Marsh Badge', gymLeader: 'Sabrina', town: 'Saffron City', emoji: '🔮', description: 'Saffron Gym: Psychic foresight', rewardTrophyPoints: 500, color: 'from-purple-400 to-indigo-600', region: 'Kanto', type: 'Psychic' },
    { id: 'badge_volcano', name: 'Volcano Badge', gymLeader: 'Blaine', town: 'Cinnabar Island', emoji: '🌋', description: 'Cinnabar Gym: Fiery intellect', rewardTrophyPoints: 500, color: 'from-orange-500 to-red-600', region: 'Kanto', type: 'Fire' },
    { id: 'badge_earth', name: 'Earth Badge', gymLeader: 'Giovanni', town: 'Viridian City', emoji: '🌍', description: 'Viridian Gym: Colossal earth power', rewardTrophyPoints: 750, color: 'from-amber-600 to-emerald-700', region: 'Kanto', type: 'Ground' },
  ],
  Johto: [
    { id: 'badge_zephyr', name: 'Zephyr Badge', gymLeader: 'Falkner', town: 'Violet City', emoji: '🪶', description: 'Violet Gym: Skyward aerial grace', rewardTrophyPoints: 300, color: 'from-sky-300 to-blue-500', region: 'Johto', type: 'Flying' },
    { id: 'badge_hive', name: 'Hive Badge', gymLeader: 'Bugsy', town: 'Azalea Town', emoji: '🐛', description: 'Azalea Gym: Bug research specialist', rewardTrophyPoints: 300, color: 'from-lime-400 to-green-600', region: 'Johto', type: 'Bug' },
    { id: 'badge_plain', name: 'Plain Badge', gymLeader: 'Whitney', town: 'Goldenrod City', emoji: '🎀', description: 'Goldenrod Gym: Endure the rollout', rewardTrophyPoints: 350, color: 'from-pink-300 to-rose-400', region: 'Johto', type: 'Normal' },
    { id: 'badge_fog', name: 'Fog Badge', gymLeader: 'Morty', town: 'Ecruteak City', emoji: '👻', description: 'Ecruteak Gym: Spectral phantom vision', rewardTrophyPoints: 400, color: 'from-violet-500 to-purple-800', region: 'Johto', type: 'Ghost' },
    { id: 'badge_storm', name: 'Storm Badge', gymLeader: 'Chuck', town: 'Cianwood City', emoji: '🥋', description: 'Cianwood Gym: Craggy martial endurance', rewardTrophyPoints: 400, color: 'from-amber-600 to-red-700', region: 'Johto', type: 'Fighting' },
    { id: 'badge_mineral', name: 'Mineral Badge', gymLeader: 'Jasmine', town: 'Olivine City', emoji: '🔩', description: 'Olivine Gym: Steel lighthouse defender', rewardTrophyPoints: 450, color: 'from-slate-400 to-zinc-600', region: 'Johto', type: 'Steel' },
    { id: 'badge_glacier', name: 'Glacier Badge', gymLeader: 'Pryce', town: 'Mahogany Town', emoji: '❄️', description: 'Mahogany Gym: Winter chill veteran', rewardTrophyPoints: 500, color: 'from-cyan-300 to-teal-600', region: 'Johto', type: 'Ice' },
    { id: 'badge_rising', name: 'Rising Badge', gymLeader: 'Clair', town: 'Blackthorn City', emoji: '🐉', description: "Blackthorn Gym: Dragon's Den trial", rewardTrophyPoints: 750, color: 'from-blue-600 to-indigo-900', region: 'Johto', type: 'Dragon' },
  ],
  Hoenn: [
    { id: 'badge_stone', name: 'Stone Badge', gymLeader: 'Roxanne', town: 'Rustboro City', emoji: '⛏️', description: 'Rustboro Gym: Geological precision', rewardTrophyPoints: 300, color: 'from-stone-400 to-stone-700', region: 'Hoenn', type: 'Rock' },
    { id: 'badge_knuckle', name: 'Knuckle Badge', gymLeader: 'Brawly', town: 'Dewford Town', emoji: '🥊', description: 'Dewford Gym: Wave-riding brawler', rewardTrophyPoints: 300, color: 'from-orange-400 to-amber-600', region: 'Hoenn', type: 'Fighting' },
    { id: 'badge_dynamo', name: 'Dynamo Badge', gymLeader: 'Wattson', town: 'Mauville City', emoji: '🔋', description: 'Mauville Gym: Cheerful voltage generator', rewardTrophyPoints: 350, color: 'from-yellow-300 to-amber-500', region: 'Hoenn', type: 'Electric' },
    { id: 'badge_heat', name: 'Heat Badge', gymLeader: 'Flannery', town: 'Lavaridge Town', emoji: '♨️', description: 'Lavaridge Gym: Hot springs flare', rewardTrophyPoints: 400, color: 'from-red-500 to-orange-600', region: 'Hoenn', type: 'Fire' },
    { id: 'badge_balance', name: 'Balance Badge', gymLeader: 'Norman', town: 'Petalburg City', emoji: '⚖️', description: "Petalburg Gym: Father's supreme balance", rewardTrophyPoints: 450, color: 'from-slate-300 to-slate-500', region: 'Hoenn', type: 'Normal' },
    { id: 'badge_feather', name: 'Feather Badge', gymLeader: 'Winona', town: 'Fortree City', emoji: '🦅', description: 'Fortree Gym: Treetop gust dancer', rewardTrophyPoints: 450, color: 'from-sky-300 to-indigo-400', region: 'Hoenn', type: 'Flying' },
    { id: 'badge_mind', name: 'Mind Badge', gymLeader: 'Tate & Liza', town: 'Mossdeep City', emoji: '🪐', description: 'Mossdeep Gym: Twin celestial synchronization', rewardTrophyPoints: 500, color: 'from-fuchsia-400 to-pink-600', region: 'Hoenn', type: 'Psychic' },
    { id: 'badge_rain', name: 'Rain Badge', gymLeader: 'Wallace', town: 'Sootopolis City', emoji: '🌧️', description: 'Sootopolis Gym: Artist of aquatic elegance', rewardTrophyPoints: 750, color: 'from-blue-400 to-cyan-700', region: 'Hoenn', type: 'Water' },
  ],
  Sinnoh: [
    { id: 'badge_coal', name: 'Coal Badge', gymLeader: 'Roark', town: 'Oreburgh City', emoji: '🪨', description: 'Oreburgh Gym: Fossil miner power', rewardTrophyPoints: 300, color: 'from-stone-500 to-zinc-800', region: 'Sinnoh', type: 'Rock' },
    { id: 'badge_forest', name: 'Forest Badge', gymLeader: 'Gardenia', town: 'Eterna City', emoji: '🌲', description: 'Eterna Gym: Ancient woodland guardian', rewardTrophyPoints: 300, color: 'from-green-500 to-emerald-700', region: 'Sinnoh', type: 'Grass' },
    { id: 'badge_cobble', name: 'Cobble Badge', gymLeader: 'Maylene', town: 'Veilstone City', emoji: '🥋', description: 'Veilstone Gym: Barefoot fighting disciple', rewardTrophyPoints: 350, color: 'from-amber-500 to-orange-700', region: 'Sinnoh', type: 'Fighting' },
    { id: 'badge_fen', name: 'Fen Badge', gymLeader: 'Crasher Wake', town: 'Pastoria City', emoji: '🌊', description: 'Pastoria Gym: Great marsh powerhouse', rewardTrophyPoints: 400, color: 'from-blue-400 to-teal-700', region: 'Sinnoh', type: 'Water' },
    { id: 'badge_relic', name: 'Relic Badge', gymLeader: 'Fantina', town: 'Hearthome City', emoji: '🎭', description: 'Hearthome Gym: Elegant ghost dancer', rewardTrophyPoints: 450, color: 'from-purple-500 to-indigo-800', region: 'Sinnoh', type: 'Ghost' },
    { id: 'badge_mine', name: 'Mine Badge', gymLeader: 'Byron', town: 'Canalave City', emoji: '🛡️', description: 'Canalave Gym: Steel fortress warden', rewardTrophyPoints: 450, color: 'from-slate-400 to-slate-700', region: 'Sinnoh', type: 'Steel' },
    { id: 'badge_icicle', name: 'Icicle Badge', gymLeader: 'Candice', town: 'Snowpoint City', emoji: '🧊', description: 'Snowpoint Gym: Diamond dust focus', rewardTrophyPoints: 500, color: 'from-cyan-300 to-blue-500', region: 'Sinnoh', type: 'Ice' },
    { id: 'badge_beacon', name: 'Beacon Badge', gymLeader: 'Volkner', town: 'Sunyshore City', emoji: '☀️', description: 'Sunyshore Gym: Electrifying innovator', rewardTrophyPoints: 750, color: 'from-yellow-400 to-amber-600', region: 'Sinnoh', type: 'Electric' },
  ],
  Unova: [
    { id: 'badge_trio', name: 'Trio Badge', gymLeader: 'Cilan, Chili & Cress', town: 'Striaton City', emoji: '🍽️', description: 'Striaton Gym: Starter element triumvirate', rewardTrophyPoints: 300, color: 'from-emerald-400 via-rose-500 to-blue-500', region: 'Unova', type: 'Grass/Fire/Water' },
    { id: 'badge_basic', name: 'Basic Badge', gymLeader: 'Lenora', town: 'Nacrene City', emoji: '🏛️', description: 'Nacrene Gym: Museum archaeological wit', rewardTrophyPoints: 300, color: 'from-amber-200 to-stone-500', region: 'Unova', type: 'Normal' },
    { id: 'badge_insect', name: 'Insect Badge', gymLeader: 'Burgh', town: 'Castelia City', emoji: '🎨', description: 'Castelia Gym: Bug artist of metropolitan heart', rewardTrophyPoints: 350, color: 'from-lime-400 to-emerald-600', region: 'Unova', type: 'Bug' },
    { id: 'badge_bolt', name: 'Bolt Badge', gymLeader: 'Elesa', town: 'Nimbasa City', emoji: '✨', description: 'Nimbasa Gym: Shining model catwalk lightning', rewardTrophyPoints: 400, color: 'from-yellow-300 to-amber-500', region: 'Unova', type: 'Electric' },
    { id: 'badge_quake', name: 'Quake Badge', gymLeader: 'Clay', town: 'Driftveil City', emoji: '⛏️', description: 'Driftveil Gym: Ground mine tycoon', rewardTrophyPoints: 450, color: 'from-amber-600 to-yellow-900', region: 'Unova', type: 'Ground' },
    { id: 'badge_jet', name: 'Jet Badge', gymLeader: 'Skyla', town: 'Mistralton City', emoji: '✈️', description: 'Mistralton Gym: High-flying runway pilot', rewardTrophyPoints: 450, color: 'from-sky-300 to-blue-500', region: 'Unova', type: 'Flying' },
    { id: 'badge_freeze', name: 'Freeze Badge', gymLeader: 'Brycen', town: 'Icirrus City', emoji: '❄️', description: 'Icirrus Gym: Movie actor ice master', rewardTrophyPoints: 500, color: 'from-cyan-300 to-teal-500', region: 'Unova', type: 'Ice' },
    { id: 'badge_legend', name: 'Legend Badge', gymLeader: 'Drayden & Iris', town: 'Opelucid City', emoji: '🐉', description: 'Opelucid Gym: Ancient dragon wisdom', rewardTrophyPoints: 750, color: 'from-indigo-500 to-purple-800', region: 'Unova', type: 'Dragon' },
  ],
  Kalos: [
    { id: 'badge_bug', name: 'Bug Badge', gymLeader: 'Viola', town: 'Santalune City', emoji: '📸', description: 'Santalune Gym: Photo lens arachnid insight', rewardTrophyPoints: 300, color: 'from-lime-400 to-green-600', region: 'Kalos', type: 'Bug' },
    { id: 'badge_cliff', name: 'Cliff Badge', gymLeader: 'Grant', town: 'Cyllage City', emoji: '🧗', description: 'Cyllage Gym: Wall climber fossil master', rewardTrophyPoints: 300, color: 'from-stone-500 to-zinc-700', region: 'Kalos', type: 'Rock' },
    { id: 'badge_rumble', name: 'Rumble Badge', gymLeader: 'Korrina', town: 'Shalour City', emoji: '⛸️', description: 'Shalour Gym: Roller skate Mega Evolution heir', rewardTrophyPoints: 350, color: 'from-orange-500 to-red-600', region: 'Kalos', type: 'Fighting' },
    { id: 'badge_plant', name: 'Plant Badge', gymLeader: 'Ramos', town: 'Coumarine City', emoji: '🌱', description: 'Coumarine Gym: Serene herbal gardener', rewardTrophyPoints: 400, color: 'from-emerald-400 to-green-700', region: 'Kalos', type: 'Grass' },
    { id: 'badge_voltage', name: 'Voltage Badge', gymLeader: 'Clemont', town: 'Lumiose City', emoji: '🤖', description: 'Lumiose Gym: Prism Tower gadget inventor', rewardTrophyPoints: 450, color: 'from-yellow-300 to-amber-500', region: 'Kalos', type: 'Electric' },
    { id: 'badge_fairy', name: 'Fairy Badge', gymLeader: 'Valerie', town: 'Laverre City', emoji: '🧚', description: 'Laverre Gym: Dollhouse fairytale couturière', rewardTrophyPoints: 450, color: 'from-pink-400 to-rose-500', region: 'Kalos', type: 'Fairy' },
    { id: 'badge_psychic', name: 'Psychic Badge', gymLeader: 'Olympia', town: 'Anistar City', emoji: '🌌', description: 'Anistar Gym: Cosmic sundial clairvoyance', rewardTrophyPoints: 500, color: 'from-purple-500 to-indigo-800', region: 'Kalos', type: 'Psychic' },
    { id: 'badge_iceberg', name: 'Iceberg Badge', gymLeader: 'Wulfric', town: 'Snowbelle City', emoji: '🧊', description: 'Snowbelle Gym: Unbreakable glacial fortress', rewardTrophyPoints: 750, color: 'from-cyan-300 to-blue-600', region: 'Kalos', type: 'Ice' },
  ],
  Alola: [
    { id: 'stamp_melemele', name: 'Melemele Trial Stamp', gymLeader: 'Kahuna Hala', town: 'Iki Town', emoji: '🥊', description: 'Melemele Island Challenge: Grand trial triumph', rewardTrophyPoints: 350, color: 'from-yellow-400 to-orange-500', region: 'Alola', type: 'Fighting' },
    { id: 'stamp_akala', name: 'Akala Trial Stamp', gymLeader: 'Kahuna Olivia', town: 'Konikoni City', emoji: '💎', description: 'Akala Island Challenge: Volcanic jewelry trial', rewardTrophyPoints: 400, color: 'from-pink-400 to-rose-600', region: 'Alola', type: 'Rock' },
    { id: 'stamp_ulaula', name: 'Ula‘ula Trial Stamp', gymLeader: 'Kahuna Nanu', town: 'Malie City', emoji: '🌙', description: 'Ula‘ula Island Challenge: Dark night trial', rewardTrophyPoints: 450, color: 'from-red-600 to-purple-900', region: 'Alola', type: 'Dark' },
    { id: 'stamp_poni', name: 'Poni Trial Stamp', gymLeader: 'Kahuna Hapu', town: 'Seafolk Village', emoji: '🏜️', description: 'Poni Island Challenge: Sacred canyon ground trial', rewardTrophyPoints: 500, color: 'from-amber-500 to-yellow-800', region: 'Alola', type: 'Ground' },
    { id: 'stamp_champion', name: 'Alola Champion Stamp', gymLeader: 'Professor Kukui', town: 'Mount Lanakila', emoji: '🌺', description: 'Mount Lanakila: First Supreme Alola Champion', rewardTrophyPoints: 750, color: 'from-emerald-400 via-yellow-400 to-orange-500', region: 'Alola', type: 'Master' },
  ],
  Galar: [
    { id: 'badge_galar_grass', name: 'Galar Grass Badge', gymLeader: 'Milo', town: 'Turffield Stadium', emoji: '🌾', description: 'Turffield: Dynamax wool rolling powerhouse', rewardTrophyPoints: 300, color: 'from-green-400 to-emerald-600', region: 'Galar', type: 'Grass' },
    { id: 'badge_galar_water', name: 'Galar Water Badge', gymLeader: 'Nessa', town: 'Hulbury Stadium', emoji: '🌊', description: 'Hulbury: Raging waves model master', rewardTrophyPoints: 300, color: 'from-cyan-400 to-blue-600', region: 'Galar', type: 'Water' },
    { id: 'badge_galar_fire', name: 'Galar Fire Badge', gymLeader: 'Kabu', town: 'Motostoke Stadium', emoji: '🔥', description: 'Motostoke: Relentless furnace motivation', rewardTrophyPoints: 350, color: 'from-orange-500 to-red-600', region: 'Galar', type: 'Fire' },
    { id: 'badge_galar_fighting', name: 'Galar Fighting Badge', gymLeader: 'Bea', town: 'Stow-on-Side Stadium', emoji: '🥋', description: 'Stow-on-Side: Stoic Galar karate prodigy', rewardTrophyPoints: 400, color: 'from-amber-500 to-orange-700', region: 'Galar', type: 'Fighting' },
    { id: 'badge_galar_fairy', name: 'Galar Fairy Badge', gymLeader: 'Opal', town: 'Ballonlea Stadium', emoji: '🍄', description: 'Ballonlea: Theater drama pink quizmaster', rewardTrophyPoints: 450, color: 'from-pink-400 to-rose-600', region: 'Galar', type: 'Fairy' },
    { id: 'badge_galar_rock', name: 'Galar Rock Badge', gymLeader: 'Gordie', town: 'Circhester Stadium', emoji: '🪨', description: 'Circhester: Hard rock superstar idol', rewardTrophyPoints: 450, color: 'from-stone-500 to-amber-700', region: 'Galar', type: 'Rock' },
    { id: 'badge_galar_dark', name: 'Galar Dark Badge', gymLeader: 'Piers', town: 'Spikemuth', emoji: '🎸', description: 'Spikemuth: No-Dynamax pure rock n roll', rewardTrophyPoints: 500, color: 'from-slate-700 to-violet-950', region: 'Galar', type: 'Dark' },
    { id: 'badge_galar_dragon', name: 'Galar Dragon Badge', gymLeader: 'Raihan', town: 'Hammerlocke Stadium', emoji: '🐉', description: 'Hammerlocke: Sandstorm weather dragon ace', rewardTrophyPoints: 750, color: 'from-indigo-600 to-blue-900', region: 'Galar', type: 'Dragon' },
  ],
  Paldea: [
    { id: 'badge_cortondo', name: 'Cortondo Badge', gymLeader: 'Katy', town: 'Cortondo Gym', emoji: '🧁', description: 'Cortondo: Pastry chef bug gymnastics', rewardTrophyPoints: 300, color: 'from-lime-400 to-amber-600', region: 'Paldea', type: 'Bug' },
    { id: 'badge_artazon', name: 'Artazon Badge', gymLeader: 'Brassius', town: 'Artazon Gym', emoji: '🌻', description: 'Artazon: Avant-garde grass sculpture', rewardTrophyPoints: 300, color: 'from-green-500 to-emerald-700', region: 'Paldea', type: 'Grass' },
    { id: 'badge_levincia', name: 'Levincia Badge', gymLeader: 'Iono', town: 'Levincia Gym', emoji: '📺', description: 'Levincia: Supercharged stream streamer queen', rewardTrophyPoints: 350, color: 'from-yellow-300 via-pink-400 to-cyan-400', region: 'Paldea', type: 'Electric' },
    { id: 'badge_cascarrafa', name: 'Cascarrafa Badge', gymLeader: 'Kofu', town: 'Cascarrafa Gym', emoji: '🍤', description: 'Cascarrafa: Culinary vault torrent master', rewardTrophyPoints: 400, color: 'from-cyan-400 to-blue-600', region: 'Paldea', type: 'Water' },
    { id: 'badge_medali', name: 'Medali Badge', gymLeader: 'Larry', town: 'Medali Gym', emoji: '👔', description: 'Medali: Extraordinary salaryman normal power', rewardTrophyPoints: 450, color: 'from-slate-400 to-zinc-600', region: 'Paldea', type: 'Normal' },
    { id: 'badge_montenevera', name: 'Montenevera Badge', gymLeader: 'Ryme', town: 'Montenevera Gym', emoji: '🎤', description: 'Montenevera: Ghost MC double battle flow', rewardTrophyPoints: 450, color: 'from-purple-500 to-indigo-900', region: 'Paldea', type: 'Ghost' },
    { id: 'badge_alfornada', name: 'Alfornada Badge', gymLeader: 'Tulip', town: 'Alfornada Gym', emoji: '💄', description: 'Alfornada: Dazzling makeup psychic beauty', rewardTrophyPoints: 500, color: 'from-fuchsia-400 to-pink-600', region: 'Paldea', type: 'Psychic' },
    { id: 'badge_glaseado', name: 'Glaseado Badge', gymLeader: 'Grusha', town: 'Glaseado Gym', emoji: '🏂', description: 'Glaseado Mountain: Snowboarding ice champion', rewardTrophyPoints: 750, color: 'from-cyan-300 to-blue-700', region: 'Paldea', type: 'Ice' },
  ],
  'Paldea Titans': [
    { id: 'badge_titan_rock', name: 'Stony Cliff Titan Badge', gymLeader: 'Klawf', town: 'South Province', emoji: '🦀', description: 'Path of Legends: Unlocked Sweet Herba Mystica', rewardTrophyPoints: 350, color: 'from-amber-600 to-orange-700', region: 'Paldea Titans', type: 'Rock' },
    { id: 'badge_titan_flying', name: 'Open Sky Titan Badge', gymLeader: 'Bombirdier', town: 'West Province', emoji: '🪨', description: 'Path of Legends: Unlocked Bitter Herba Mystica', rewardTrophyPoints: 400, color: 'from-sky-400 to-stone-600', region: 'Paldea Titans', type: 'Flying/Dark' },
    { id: 'badge_titan_steel', name: 'Lurking Steel Titan Badge', gymLeader: 'Orthworm', town: 'East Province', emoji: '🪱', description: 'Path of Legends: Unlocked Salty Herba Mystica', rewardTrophyPoints: 450, color: 'from-slate-400 to-zinc-700', region: 'Paldea Titans', type: 'Steel' },
    { id: 'badge_titan_ground', name: 'Quaking Earth Titan Badge', gymLeader: 'Great Tusk / Iron Treads', town: 'Asado Desert', emoji: '🐘', description: 'Path of Legends: Unlocked Sour Herba Mystica', rewardTrophyPoints: 500, color: 'from-amber-700 to-stone-800', region: 'Paldea Titans', type: 'Ground/Fighting' },
    { id: 'badge_titan_dragon', name: 'False Dragon Titan Badge', gymLeader: 'Dondozo & Tatsugiri', town: 'Casseroya Lake', emoji: '🐉', description: 'Path of Legends: Unlocked Spicy Herba Mystica', rewardTrophyPoints: 750, color: 'from-blue-600 to-indigo-900', region: 'Paldea Titans', type: 'Water/Dragon' },
  ],
  'Paldea Team Star': [
    { id: 'badge_star_dark', name: 'Segin Star Badge', gymLeader: 'Giacomo', town: 'Team Star Dark Base', emoji: '🎧', description: 'Starfall Street: DJ Giacomo defeated', rewardTrophyPoints: 350, color: 'from-slate-800 to-zinc-950', region: 'Paldea Team Star', type: 'Dark' },
    { id: 'badge_star_fire', name: 'Schedar Star Badge', gymLeader: 'Mela', town: 'Team Star Fire Base', emoji: '🔥', description: 'Starfall Street: Scorching Starmobile quenched', rewardTrophyPoints: 400, color: 'from-red-600 to-orange-700', region: 'Paldea Team Star', type: 'Fire' },
    { id: 'badge_star_poison', name: 'Navi Star Badge', gymLeader: 'Atticus', town: 'Team Star Poison Base', emoji: '🥷', description: 'Starfall Street: Ninja costume artisan defeated', rewardTrophyPoints: 450, color: 'from-purple-600 to-violet-900', region: 'Paldea Team Star', type: 'Poison' },
    { id: 'badge_star_fairy', name: 'Ruchbah Star Badge', gymLeader: 'Ortega', town: 'Team Star Fairy Base', emoji: '🧚', description: 'Starfall Street: Starmobile designer subdued', rewardTrophyPoints: 500, color: 'from-pink-400 to-rose-600', region: 'Paldea Team Star', type: 'Fairy' },
    { id: 'badge_star_fighting', name: 'Caph Star Badge', gymLeader: 'Eri', town: 'Team Star Fighting Base', emoji: '🥋', description: 'Starfall Street: Heroic martial heart conquered', rewardTrophyPoints: 750, color: 'from-amber-600 to-red-800', region: 'Paldea Team Star', type: 'Fighting' },
  ],
  Hisui: [
    { id: 'badge_hisui_forest', name: 'Forest Noble Crest', gymLeader: 'Warden Lian', town: 'Grandtree Arena', emoji: '🪓', description: 'Obsidian Fieldlands: Calmed Lord of the Woods Kleavor', rewardTrophyPoints: 350, color: 'from-amber-600 to-stone-800', region: 'Hisui', type: 'Bug/Rock' },
    { id: 'badge_hisui_mire', name: 'Mire Noble Crest', gymLeader: 'Warden Calaba', town: 'Brava Arena', emoji: '💃', description: 'Crimson Mirelands: Calmed Lady of the Ridge Lilligant', rewardTrophyPoints: 400, color: 'from-emerald-500 to-lime-700', region: 'Hisui', type: 'Grass/Fighting' },
    { id: 'badge_hisui_coast', name: 'Coast Noble Crest', gymLeader: 'Warden Palina', town: 'Molten Arena', emoji: '🔥', description: 'Cobalt Coastlands: Calmed Lord of the Isles Arcanine', rewardTrophyPoints: 450, color: 'from-orange-500 to-red-700', region: 'Hisui', type: 'Fire/Rock' },
    { id: 'badge_hisui_cliff', name: 'Cliff Noble Crest', gymLeader: 'Warden Melli', town: 'Moonview Arena', emoji: '⚡', description: 'Coronet Highlands: Calmed Lord of the Hollow Electrode', rewardTrophyPoints: 500, color: 'from-yellow-400 to-amber-700', region: 'Hisui', type: 'Electric/Grass' },
    { id: 'badge_hisui_peak', name: 'Peak Noble Crest', gymLeader: 'Warden Gaeric', town: 'Icepeak Arena', emoji: '🏔️', description: 'Alabaster Icelands: Calmed Lord of the Tundra Avalugg', rewardTrophyPoints: 750, color: 'from-cyan-200 to-slate-800', region: 'Hisui', type: 'Ice/Rock' },
  ],
  'Battle Frontier': [
    { id: 'symbol_ability', name: 'Ability Symbol', gymLeader: 'Salon Maiden Anabel', town: 'Battle Tower', emoji: '🗼', description: 'Frontier Brain Gold: Pure competitive synchronization', rewardTrophyPoints: 600, color: 'from-purple-500 to-indigo-700', region: 'Battle Frontier', type: 'Frontier' },
    { id: 'symbol_spirit', name: 'Spirit Symbol', gymLeader: 'Palace Maven Spenser', town: 'Battle Palace', emoji: '🏯', description: 'Frontier Brain Gold: Autonomous Pokémon bond', rewardTrophyPoints: 600, color: 'from-emerald-500 to-teal-700', region: 'Battle Frontier', type: 'Frontier' },
    { id: 'symbol_tactics', name: 'Tactics Symbol', gymLeader: 'Dome Ace Tucker', town: 'Battle Dome', emoji: '🏟️', description: 'Frontier Brain Gold: Grand superstar tournament victory', rewardTrophyPoints: 600, color: 'from-blue-500 to-cyan-700', region: 'Battle Frontier', type: 'Frontier' },
    { id: 'symbol_luck', name: 'Luck Symbol', gymLeader: 'Pike Queen Lucy', town: 'Battle Pike', emoji: '🐍', description: 'Frontier Brain Gold: Viper venom intuition conquered', rewardTrophyPoints: 600, color: 'from-red-500 to-rose-700', region: 'Battle Frontier', type: 'Frontier' },
    { id: 'symbol_brave', name: 'Brave Symbol', gymLeader: 'Arena Tycoon Greta', town: 'Battle Arena', emoji: '🥊', description: 'Frontier Brain Gold: Judged knockout battle master', rewardTrophyPoints: 600, color: 'from-orange-500 to-amber-700', region: 'Battle Frontier', type: 'Frontier' },
    { id: 'symbol_knowledge', name: 'Knowledge Symbol', gymLeader: 'Factory Head Noland', town: 'Battle Factory', emoji: '⚙️', description: 'Frontier Brain Gold: Rental Pokémon improvisation genius', rewardTrophyPoints: 600, color: 'from-amber-400 to-yellow-600', region: 'Battle Frontier', type: 'Frontier' },
  ],
  'League Champions': [
    { id: 'champ_indigo', name: 'Indigo Plateau Champion Crest', gymLeader: 'Champion Lance', town: 'Indigo Plateau', emoji: '👑', description: 'Supreme Champion of Kanto and Johto', rewardTrophyPoints: 1000, color: 'from-yellow-400 via-amber-500 to-red-600', region: 'League Champions', type: 'Champion' },
    { id: 'champ_hoenn', name: 'Ever Grande Champion Trophy', gymLeader: 'Champion Steven Stone', town: 'Ever Grande City', emoji: '💎', description: 'Supreme Champion of Hoenn', rewardTrophyPoints: 1000, color: 'from-cyan-300 via-sky-500 to-blue-700', region: 'League Champions', type: 'Champion' },
    { id: 'champ_sinnoh', name: 'Sinnoh Mythic Champion Star', gymLeader: 'Champion Cynthia', town: 'Sinnoh Pokémon League', emoji: '🌟', description: 'Conquered Champion Cynthia and the Sinnoh Hall of Fame', rewardTrophyPoints: 1200, color: 'from-purple-600 via-amber-400 to-slate-900', region: 'League Champions', type: 'Champion' },
    { id: 'champ_unova', name: 'Unova Champion Medallion', gymLeader: 'Champion Iris & Alder', town: 'Unova League', emoji: '🎖️', description: 'Master of the Unova Pokémon League', rewardTrophyPoints: 1000, color: 'from-amber-500 via-rose-500 to-indigo-700', region: 'League Champions', type: 'Champion' },
    { id: 'champ_kalos', name: 'Kalos Grand Duke Medallion', gymLeader: 'Champion Diantha', town: 'Kalos League', emoji: '⚜️', description: 'Grand Champion of the Kalos Region', rewardTrophyPoints: 1000, color: 'from-pink-400 via-purple-500 to-indigo-600', region: 'League Champions', type: 'Champion' },
    { id: 'champ_alola', name: 'Alola Supreme Champion Crown', gymLeader: 'Champion Trial', town: 'Mount Lanakila', emoji: '🌺', description: 'First Ever Official League Champion of Alola', rewardTrophyPoints: 1000, color: 'from-emerald-400 via-yellow-400 to-orange-500', region: 'League Champions', type: 'Champion' },
    { id: 'champ_galar', name: 'Galar Wyndon Champion Cup', gymLeader: 'Champion Leon', town: 'Wyndon Stadium', emoji: '🏆', description: 'Defeated the Unbeatable Champion Leon in Wyndon', rewardTrophyPoints: 1200, color: 'from-red-500 via-purple-600 to-blue-700', region: 'League Champions', type: 'Champion' },
    { id: 'champ_paldea', name: 'Paldea Top Champion Ribbon', gymLeader: 'Top Champion Geeta & Nemona', town: 'Mesagoza League', emoji: '✨', description: 'Passed the Champion Assessment and triumphed over Nemona', rewardTrophyPoints: 1200, color: 'from-amber-400 via-yellow-300 to-orange-600', region: 'League Champions', type: 'Champion' },
  ],
};
