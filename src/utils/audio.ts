import { POKEMON_TRACKS, SongTrack } from '../data/songs';

class SoundSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isBgmPlaying: boolean = false;
  private bgmGainNode: GainNode | null = null;
  private currentTrackId: string = 'pallet_town';
  private bgmTimeoutId: number | null = null;
  private bgmNoteIndex: number = 0;
  private currentCryAudio: HTMLAudioElement | null = null;

  constructor() {
    // Check localStorage preference
    const saved = localStorage.getItem('poke_quiz_muted');
    if (saved !== null) {
      this.isMuted = saved === 'true';
    }
  }

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('poke_quiz_muted', String(this.isMuted));
    if (this.isMuted) {
      this.stopBGM();
      if (this.ctx && this.ctx.state === 'running') {
        this.ctx.suspend();
      }
    } else {
      if (this.isBgmPlaying) {
        this.startBGM(this.currentTrackId);
      }
    }
    return this.isMuted;
  }

  // ================= Authentic Pokémon UI Blips =================
  // Classic Game Boy / Nintendo A-button menu select blip
  public playButtonPress() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    // Sharp high blip (1760Hz -> 1980Hz)
    osc.frequency.setValueAtTime(1760, now);
    osc.frequency.exponentialRampToValueAtTime(1980, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // B-button cancel / back blip
  public playButtonBack() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    // Descending blip (1200Hz -> 600Hz)
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playClick() {
    this.playButtonPress();
  }

  // Correct answer chime (major arpeggio)
  public playCorrect() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.2, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.3);
    });
  }

  // Wrong answer thud (low dissonant buzz)
  public playWrong() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.25);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Timer tick (urgent when <= 3s)
  public playTick(isUrgent: boolean = false) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isUrgent ? 880 : 440, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isUrgent ? 0.07 : 0.05));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Silhouette reveal whoosh
  public playReveal() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(261.63, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Streak combo bonus
  public playStreakBonus() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.18, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.25);
    });
  }

  // Trophy unlock fanfare
  public playTrophyUnlock() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const freqs = [392.0, 523.25, 659.25, 783.99, 1046.5, 1318.51];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.7);
    });
  }

  public playFanfare() {
    this.playTrophyUnlock();
  }

  public playLevelUp() {
    this.playTrophyUnlock();
  }

  public playLevelUpSound() {
    this.playTrophyUnlock();
  }

  // ================= Pokémon Cry Player =================
  public playPokemonCry(cryUrl?: string, pokemonId?: number) {
    if (this.isMuted) return;

    if (this.currentCryAudio) {
      this.currentCryAudio.pause();
      this.currentCryAudio = null;
    }

    if (cryUrl) {
      try {
        const audio = new Audio(cryUrl);
        audio.volume = 0.8;
        this.currentCryAudio = audio;
        audio.play().catch(() => {
          this.playSynthesizedCry(pokemonId || 25);
        });
        return;
      } catch {
        // fallback
      }
    }

    this.playSynthesizedCry(pokemonId || 25);
  }

  // Fallback authentic retro synthesized cry
  private playSynthesizedCry(pokemonId: number) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const baseFreq = 300 + (pokemonId % 40) * 15;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = (pokemonId % 2 === 0) ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.6, now + 0.12);
    osc.frequency.linearRampToValueAtTime(baseFreq * 0.8, now + 0.35);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // ================= Background Music Synthesizer Engine =================
  public setBGMTrack(trackId: string) {
    this.currentTrackId = trackId;
    this.startBGM(trackId);
  }

  public startBGM(trackId?: string) {
    if (this.isMuted) {
      this.isBgmPlaying = true;
      if (trackId) this.currentTrackId = trackId;
      return;
    }

    const ctx = this.getContext();
    if (!ctx) return;

    if (trackId) this.currentTrackId = trackId;
    this.isBgmPlaying = true;

    if (this.bgmTimeoutId !== null) {
      window.clearTimeout(this.bgmTimeoutId);
      this.bgmTimeoutId = null;
    }

    this.bgmNoteIndex = 0;
    this.playNextBgmNote();
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmTimeoutId !== null) {
      window.clearTimeout(this.bgmTimeoutId);
      this.bgmTimeoutId = null;
    }
  }

  public isMusicActive(): boolean {
    return this.isBgmPlaying && !this.isMuted;
  }

  public getActiveTrackId(): string {
    return this.currentTrackId;
  }

  private playNextBgmNote() {
    if (!this.isBgmPlaying || this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const track = POKEMON_TRACKS.find((t) => t.id === this.currentTrackId) || POKEMON_TRACKS[0];
    const melody = track.melody;
    if (!melody || melody.length === 0) return;

    const note = melody[this.bgmNoteIndex % melody.length];
    const duration = note.duration;
    const now = ctx.currentTime;

    if (note.pitch > 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.pitch, now);

      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    }

    this.bgmNoteIndex++;
    this.bgmTimeoutId = window.setTimeout(() => {
      this.playNextBgmNote();
    }, duration * 1000);
  }
}

export const sound = new SoundSystem();
