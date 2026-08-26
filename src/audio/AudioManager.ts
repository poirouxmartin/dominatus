/**
 * Moteur audio procÃ©dural (WebAudio natif, zÃ©ro asset).
 * - SFX synthÃ©tisÃ©s Ã  la volÃ©e (clics, construction, trade, alertesâ€¦)
 * - Musique ambiante gÃ©nÃ©rative : nappe d'accords + pincÃ©s pentatoniques,
 *   un mode par saison et un mode titre.
 * - PrÃ©fÃ©rences persistÃ©es dans localStorage. AudioContext crÃ©Ã© au premier
 *   geste utilisateur (politique autoplay des navigateurs).
 */

export type SfxName =
  | "click"
  | "build"
  | "demolish"
  | "trade"
  | "research"
  | "alert"
  | "raid"
  | "season"
  | "objective"
  | "pause"
  | "error";

export type MusicMode = "title" | "spring" | "summer" | "autumn" | "winter";

const PREFS_KEY = "dominatus_audio_v1";

const midi = (n: number): number => 440 * Math.pow(2, (n - 69) / 12);

/** Accords (notes MIDI) et gamme pentatonique par mode. */
const MUSIC_MODES: Record<MusicMode, { chords: number[][]; scale: number[]; barMs: number; padGain: number }> = {
  title: { chords: [[45, 52, 57, 60], [43, 50, 55, 59]], scale: [57, 60, 62, 64, 67, 69], barMs: 4200, padGain: 0.16 },
  spring: { chords: [[48, 55, 60, 64], [45, 52, 57, 64], [50, 57, 62, 65], [43, 50, 55, 62]], scale: [60, 62, 64, 67, 69, 72, 74], barMs: 3600, padGain: 0.13 },
  summer: { chords: [[43, 50, 59, 62], [48, 55, 62, 66], [45, 52, 61, 64]], scale: [62, 64, 66, 67, 69, 71, 74], barMs: 3400, padGain: 0.14 },
  autumn: { chords: [[41, 48, 57, 60], [46, 53, 58, 62], [43, 50, 57, 65]], scale: [60, 62, 65, 67, 69, 72], barMs: 3800, padGain: 0.13 },
  winter: { chords: [[45, 52, 57, 60], [40, 47, 55, 59]], scale: [57, 59, 60, 64, 67, 71], barMs: 4600, padGain: 0.12 },
};

export class AudioManager {
  private static instance: AudioManager | null = null;
  static get inst(): AudioManager {
    if (!AudioManager.instance) AudioManager.instance = new AudioManager();
    return AudioManager.instance;
  }

  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  musicVolume = 0.5;
  sfxVolume = 0.8;
  muted = false;

  private musicTimer: number | null = null;
  private musicMode: MusicMode | null = null;
  private chordIndex = 0;

  private constructor() {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        this.musicVolume = p.music ?? 0.5;
        this.sfxVolume = p.sfx ?? 0.8;
        this.muted = !!p.muted;
      }
    } catch {
      /* prefs corrompues : valeurs par dÃ©faut */
    }
  }

  /** Ã€ appeler sur le premier geste utilisateur. Retourne true si l'audio est prÃªt. */
  ensure(): boolean {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return !this.muted;
    }
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.master);
      return !this.muted;
    } catch {
      this.ctx = null;
      return false;
    }
  }

  private savePrefs(): void {
    try {
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({ music: this.musicVolume, sfx: this.sfxVolume, muted: this.muted })
      );
    } catch {
      /* ignore */
    }
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.05);
    }
    this.savePrefs();
  }

  toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  setMusicVolume(v: number): void {
    this.musicVolume = Math.max(0, Math.min(1, v));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.08);
    }
    this.savePrefs();
  }

  setSfxVolume(v: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
    }
    this.savePrefs();
  }

  // --- primitives de synthÃ¨se ----------------------------------------------

  private tone(
    type: OscillatorType,
    freq: number,
    t0: number,
    dur: number,
    peak: number,
    dest: GainNode,
    slideTo?: number
  ): void {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo !== undefined) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.02, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(dest);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  private noise(t0: number, dur: number, cutoff: number, peak: number, dest: GainNode): void {
    if (!this.ctx) return;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = cutoff;
    const g = this.ctx.createGain();
    g.gain.value = peak;
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    src.start(t0);
  }

  // --- SFX ------------------------------------------------------------------

  playSfx(name: SfxName): void {
    if (!this.ensure() || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime + 0.01;
    const d = this.sfxGain;

    switch (name) {
      case "click":
        this.tone("square", 880, t, 0.04, 0.05, d);
        break;
      case "build":
        this.noise(t, 0.09, 420, 0.35, d);
        this.tone("sine", 170, t, 0.14, 0.22, d, 110);
        this.tone("square", 620, t + 0.05, 0.03, 0.04, d);
        break;
      case "demolish":
        this.noise(t, 0.28, 900, 0.4, d);
        this.tone("sine", 140, t, 0.25, 0.2, d, 60);
        break;
      case "trade":
        this.tone("sine", 660, t, 0.07, 0.14, d);
        this.tone("sine", 880, t + 0.08, 0.1, 0.16, d);
        break;
      case "research":
        [523, 659, 784].forEach((f, i) => this.tone("triangle", f, t + i * 0.09, 0.12, 0.12, d));
        break;
      case "alert":
        this.tone("sawtooth", 220, t, 0.32, 0.08, d);
        this.tone("sawtooth", 262, t, 0.32, 0.08, d);
        break;
      case "raid":
        this.tone("sine", 82, t, 0.45, 0.35, d);
        this.noise(t, 0.35, 300, 0.3, d);
        this.tone("sawtooth", 110, t + 0.1, 0.3, 0.1, d, 70);
        break;
      case "season":
        this.tone("sine", 880, t, 0.4, 0.09, d);
        this.tone("sine", 1318, t + 0.05, 0.45, 0.06, d);
        break;
      case "objective":
        [523, 659, 784, 1046].forEach((f, i) => this.tone("triangle", f, t + i * 0.08, 0.14, 0.12, d));
        break;
      case "pause":
        this.tone("sine", 440, t, 0.05, 0.07, d);
        break;
      case "error":
        this.tone("square", 140, t, 0.16, 0.08, d);
        break;
    }
  }

  // --- ambiances (pluie / vent / oiseaux) ----------------------------------

  private ambienceSource: AudioBufferSourceNode | null = null;
  private ambienceGain: GainNode | null = null;
  private ambienceLfo: OscillatorNode | null = null;
  private birdsongTimer: number | null = null;

  /** Boucle d'ambiance : 'rain' (automne) ou 'wind' (hiver), null pour stopper. */
  startAmbience(kind: "rain" | "wind" | null): void {
    if (!this.ensure() || !this.ctx || !this.musicGain) return;
    this.stopAmbience();
    if (kind === null || this.muted) return;

    const dur = 2.5;
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const filter = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();

    if (kind === "rain") {
      filter.type = "bandpass";
      filter.frequency.value = 1400;
      filter.Q.value = 0.4;
      g.gain.value = 0.035;
    } else {
      filter.type = "lowpass";
      filter.frequency.value = 420;
      g.gain.value = 0.05;
      // souffle lent : LFO sur la frÃ©quence du filtre
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 0.07;
      lfoGain.gain.value = 180;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      this.ambienceLfo = lfo;
    }

    src.connect(filter);
    filter.connect(g);
    g.connect(this.musicGain);
    src.start();
    this.ambienceSource = src;
    this.ambienceGain = g;
  }

  stopAmbience(): void {
    try {
      this.ambienceSource?.stop();
    } catch {
      /* dÃ©jÃ  arrÃªtÃ©e */
    }
    try {
      this.ambienceLfo?.stop();
    } catch {
      /* dÃ©jÃ  arrÃªtÃ© */
    }
    this.ambienceSource = null;
    this.ambienceGain = null;
    this.ambienceLfo = null;
    if (this.birdsongTimer !== null) {
      window.clearInterval(this.birdsongTimer);
      this.birdsongTimer = null;
    }
  }

  /** Gazouillis procéduraux : 2-4 notes aiguës glissées, très discrets. */
  private playChirp(): void {
    if (!this.ctx || !this.musicGain || this.muted) return;
    const t = this.ctx.currentTime + 0.05;
    const notes = 2 + Math.floor(Math.random() * 3);
    const base = 2400 + Math.random() * 1400;
    for (let i = 0; i < notes; i++) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const st = t + i * 0.09;
      o.type = "sine";
      o.frequency.setValueAtTime(base, st);
      o.frequency.exponentialRampToValueAtTime(base * (1.2 + Math.random() * 0.4), st + 0.06);
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.018, st + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.08);
      o.connect(g);
      g.connect(this.musicGain);
      o.start(st);
      o.stop(st + 0.1);
    }
  }

  startBirdsong(): void {
    this.ensure();
    if (!this.ctx || this.birdsongTimer !== null) return;
    this.birdsongTimer = window.setInterval(() => {
      if (Math.random() < 0.55) this.playChirp();
    }, 3200);
  }

  /** ThÃ¨me de fin : fanfare majeure (victoire) ou dirge mineur (dÃ©faite). */
  playEndTheme(victory: boolean): void {
    this.ensure();
    this.stopMusic();
    this.stopAmbience();
    if (!this.ctx || !this.musicGain || this.muted) return;
    const mg = this.musicGain;

    const progression = victory
      ? [
          [48, 55, 64], // C
          [53, 60, 65], // F
          [55, 62, 66], // G
          [48, 55, 64, 72], // C final
        ]
      : [
          [45, 52, 60], // Am
          [41, 48, 56], // F
          [43, 50, 58], // G
          [45, 52, 60], // Am
        ];
    const barS = victory ? 1.1 : 1.5;
    let t = this.ctx.currentTime + 0.1;

    for (const chord of progression) {
      const pad = this.ctx.createGain();
      pad.gain.setValueAtTime(0.0001, t);
      pad.gain.linearRampToValueAtTime(0.16, t + barS * 0.3);
      pad.gain.linearRampToValueAtTime(0.0001, t + barS * 1.05);
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1100;
      pad.connect(filter);
      filter.connect(this.musicGain);
      for (const note of chord) {
        for (const det of [-3, 3]) {
          const o = this.ctx.createOscillator();
          o.type = "triangle";
          o.frequency.value = midi(note);
          o.detune.value = det;
          o.connect(pad);
          o.start(t);
          o.stop(t + barS * 1.1);
        }
      }
      if (victory) {
        this.tone("triangle", midi(chord[0] + 12), t + barS * 0.15, 0.3, 0.09, mg);
      }
      t += barS;
    }

    if (victory) {
      [72, 76, 79, 84].forEach((n, i) =>
        this.tone("triangle", midi(n), t + 0.1 + i * 0.16, 0.5, 0.12, mg),
      );
    } else {
      this.tone("sine", midi(33), t + 0.2, 1.6, 0.25, mg);
      this.tone("sine", midi(45), t + 0.2, 1.4, 0.12, mg);
    }
  }

  // --- musique gÃ©nÃ©rative ---------------------------------------------------

  startMusic(mode: MusicMode): void {
    this.ensure();
    if (!this.ctx) return;
    if (this.musicMode === mode && this.musicTimer !== null) return;
    this.stopMusic();
    this.musicMode = mode;
    this.chordIndex = 0;
    this.playBar();
    this.musicTimer = window.setInterval(() => this.playBar(), MUSIC_MODES[mode].barMs);
  }

  stopMusic(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.musicMode = null;
  }

  get currentMusic(): MusicMode | null {
    return this.musicMode;
  }

  private playBar(): void {
    if (!this.ctx || !this.musicGain || !this.musicMode || this.muted) return;
    const mode = MUSIC_MODES[this.musicMode];
    const chord = mode.chords[this.chordIndex % mode.chords.length];
    this.chordIndex++;
    const t = this.ctx.currentTime + 0.05;
    const barS = mode.barMs / 1000;

    // nappe : oscillateurs dÃ©tunÃ©s Ã  travers un passe-bas doux
    const pad = this.ctx.createGain();
    pad.gain.setValueAtTime(0.0001, t);
    pad.gain.linearRampToValueAtTime(mode.padGain, t + barS * 0.35);
    pad.gain.linearRampToValueAtTime(0.0001, t + barS * 1.05);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    pad.connect(filter);
    filter.connect(this.musicGain);

    for (const note of chord) {
      for (const detune of [-4, 4]) {
        const o = this.ctx.createOscillator();
        o.type = "triangle";
        o.frequency.value = midi(note);
        o.detune.value = detune;
        o.connect(pad);
        o.start(t);
        o.stop(t + barS * 1.1);
      }
    }

    // pincÃ©s pentatoniques : 0 Ã  2 notes par mesure
    const plucks = Math.random() < 0.75 ? 1 + (Math.random() < 0.35 ? 1 : 0) : 0;
    for (let i = 0; i < plucks; i++) {
      const note = mode.scale[Math.floor(Math.random() * mode.scale.length)] + 12;
      const pt = t + barS * (0.3 + Math.random() * 0.55);
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = "triangle";
      o.frequency.value = midi(note);
      g.gain.setValueAtTime(0.0001, pt);
      g.gain.exponentialRampToValueAtTime(0.07, pt + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, pt + 0.9);
      o.connect(g);
      g.connect(this.musicGain);
      o.start(pt);
      o.stop(pt + 1);
    }
  }
}
