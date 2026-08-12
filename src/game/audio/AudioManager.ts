/**
 * Central Web Audio controller.
 * Unlock after a user gesture. Music + ambience + SFX buses.
 * File buffers preferred; generated loops/tones fill gaps so the mix is testable.
 */

import {
  AUDIO_MIX,
  AUDIO_PATHS,
  AUDIO_STORAGE_KEYS,
  AUDIO_USE_FILES,
  ENABLE_GENERATED_AMBIENCE,
  type AmbienceId,
  type MusicId,
  type SfxId,
} from "@/game/audio/audioCatalog";

type Listener = () => void;

interface AmbienceVoice {
  id: AmbienceId;
  gain: GainNode;
  stop: () => void;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function readStoredNumber(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? clamp01(n) : fallback;
  } catch {
    return fallback;
  }
}

function readStoredBool(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === "1" || raw === "true";
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode / quota — ignore */
  }
}

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private ambienceBus: GainNode | null = null;

  private unlocked = false;
  private muted = false;
  private musicVol: number = AUDIO_MIX.musicVolume;
  private sfxVol: number = AUDIO_MIX.sfxVolume;
  private duck = 1;

  private musicStop: (() => void) | null = null;
  private musicId: MusicId | null = null;
  /** Per-source fade gain for exploration music (duck uses musicBus). */
  private musicFade: GainNode | null = null;
  private ambienceVoices = new Map<AmbienceId, AmbienceVoice>();
  private activeAmbience: AmbienceId | null = null;

  private buffers = new Map<string, AudioBuffer | null>();
  private loadOnce: Promise<void> | null = null;
  private listeners = new Set<Listener>();

  constructor() {
    if (typeof window === "undefined") return;
    this.muted = readStoredBool(AUDIO_STORAGE_KEYS.muted, false);
    this.musicVol = readStoredNumber(
      AUDIO_STORAGE_KEYS.music,
      AUDIO_MIX.musicVolume,
    );
    this.sfxVol = readStoredNumber(AUDIO_STORAGE_KEYS.sfx, AUDIO_MIX.sfxVolume);
    document.addEventListener("visibilitychange", () => {
      if (!this.ctx || !this.unlocked) return;
      if (document.visibilityState === "hidden") {
        void this.ctx.suspend();
      } else {
        void this.ctx.resume();
      }
    });
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  isUnlocked(): boolean {
    return this.unlocked;
  }

  isMuted(): boolean {
    return this.muted;
  }

  getMusicVolume(): number {
    return this.musicVol;
  }

  getSfxVolume(): number {
    return this.sfxVol;
  }

  /**
   * Call from a click/tap (Enter the World). Creates / resumes the context.
   * Safe to call repeatedly.
   */
  async unlock(): Promise<void> {
    if (typeof window === "undefined") return;
    this.ensureGraph();
    const ctx = this.ctx;
    if (!ctx) return;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        return;
      }
    }
    this.unlocked = ctx.state === "running";
    this.applyGains(0);
    void this.ensureBuffers();
    this.emit();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    writeStored(AUDIO_STORAGE_KEYS.muted, muted ? "1" : "0");
    this.applyGains(0.04);
    this.emit();
  }

  toggleMute(): void {
    this.setMuted(!this.muted);
  }

  setMusicVolume(volume: number): void {
    this.musicVol = clamp01(volume);
    writeStored(AUDIO_STORAGE_KEYS.music, String(this.musicVol));
    this.applyGains(0.08);
    this.emit();
  }

  setSfxVolume(volume: number): void {
    this.sfxVol = clamp01(volume);
    writeStored(AUDIO_STORAGE_KEYS.sfx, String(this.sfxVol));
    this.applyGains(0.08);
    this.emit();
  }

  /** Start (or keep) exploration music. Never restarts a live loop. */
  startExplorationMusic(): void {
    if (!this.unlocked) return;
    this.ensureGraph();
    void this.ensureBuffers().then(() => {
      if (this.musicId === "exploration" && this.musicStop) return;
      this.startMusicLoop("exploration");
    });
  }

  /** Soft duck while a destination overlay is open. */
  setDestinationOpen(open: boolean, ambience: AmbienceId | null): void {
    this.duck = open ? AUDIO_MIX.destinationDuck : 1;
    this.applyGains(0.35);
    if (open && ambience) {
      this.setAmbience(ambience);
    } else if (!open) {
      // Returning to world: clear destination ambience unless generated/files on.
      if (!ENABLE_GENERATED_AMBIENCE && !AUDIO_USE_FILES) {
        this.setAmbience(null);
      }
    }
  }

  /** Proximity / hub ambience. No-op if already that region. */
  setAmbience(id: AmbienceId | null): void {
    if (id === this.activeAmbience) return;
    this.activeAmbience = id;
    if (!this.unlocked) return;
    this.ensureGraph();
    void this.ensureBuffers().then(() => {
      // Presentation: no generated noise beds. Real files only when present.
      if (!ENABLE_GENERATED_AMBIENCE) {
        const hasFile =
          id !== null && this.buffers.get(AUDIO_PATHS.ambience[id]) != null;
        this.crossfadeAmbience(hasFile ? id : null);
        return;
      }
      this.crossfadeAmbience(id);
    });
  }

  playSfx(id: SfxId, destHint?: AmbienceId | null): void {
    if (!this.unlocked || this.muted) return;
    this.ensureGraph();
    const ctx = this.ctx;
    const bus = this.sfxBus;
    if (!ctx || !bus) return;

    const path = AUDIO_PATHS.sfx[id];
    const buf = this.buffers.get(path);
    if (buf) {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain();
      g.gain.value = id === "encounter" ? 0.85 : 0.55;
      if (id === "encounter" && destHint) {
        g.gain.value *= destHint === "mordor" ? 1.05 : destHint === "mountains" ? 0.9 : 0.85;
      }
      src.connect(g);
      g.connect(bus);
      src.start();
      src.onended = () => {
        src.disconnect();
        g.disconnect();
      };
      return;
    }

    if (id === "interact") this.synthInteract(ctx, bus);
    else this.synthEncounter(ctx, bus, destHint);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  private ensureGraph(): void {
    if (this.ctx) return;
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const master = ctx.createGain();
    const music = ctx.createGain();
    const sfx = ctx.createGain();
    const amb = ctx.createGain();
    music.connect(master);
    sfx.connect(master);
    amb.connect(master);
    master.connect(ctx.destination);
    this.ctx = ctx;
    this.master = master;
    this.musicBus = music;
    this.sfxBus = sfx;
    this.ambienceBus = amb;
    this.applyGains(0);
  }

  private applyGains(seconds: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.musicBus || !this.sfxBus || !this.ambienceBus) {
      return;
    }
    const t = ctx.currentTime;
    const mute = this.muted ? 0 : 1;
    this.ramp(this.master.gain, mute, seconds, t);
    this.ramp(this.musicBus.gain, this.musicVol * this.duck, seconds, t);
    this.ramp(this.sfxBus.gain, this.sfxVol, seconds, t);
    this.ramp(this.ambienceBus.gain, AUDIO_MIX.ambienceVolume, seconds, t);
  }

  private ramp(
    param: AudioParam,
    value: number,
    seconds: number,
    now: number,
  ): void {
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    if (seconds <= 0) {
      param.setValueAtTime(value, now);
      return;
    }
    param.linearRampToValueAtTime(value, now + seconds);
  }

  private async ensureBuffers(): Promise<void> {
    if (this.loadOnce) return this.loadOnce;
    this.loadOnce = (async () => {
      // Always attempt the real exploration soundtrack.
      await this.loadBuffer(AUDIO_PATHS.music.exploration);
      if (!AUDIO_USE_FILES) return;
      const urls = [
        AUDIO_PATHS.ambience.hub,
        AUDIO_PATHS.ambience.shire,
        AUDIO_PATHS.ambience.mountains,
        AUDIO_PATHS.ambience.mordor,
        AUDIO_PATHS.sfx.interact,
        AUDIO_PATHS.sfx.encounter,
      ];
      await Promise.all(urls.map((url) => this.loadBuffer(url)));
    })();
    return this.loadOnce;
  }

  private async loadBuffer(url: string): Promise<void> {
    if (this.buffers.has(url)) return;
    try {
      const res = await fetch(url, { cache: "force-cache" });
      if (!res.ok) {
        this.buffers.set(url, null);
        return;
      }
      const raw = await res.arrayBuffer();
      const ctx = this.ctx;
      if (!ctx) {
        this.buffers.set(url, null);
        return;
      }
      const buf = await ctx.decodeAudioData(raw.slice(0));
      this.buffers.set(url, buf);
    } catch {
      this.buffers.set(url, null);
    }
  }

  private startMusicLoop(id: MusicId): void {
    const ctx = this.ctx;
    const bus = this.musicBus;
    if (!ctx || !bus) return;

    // Never stack two exploration tracks.
    this.musicStop?.();
    this.musicStop = null;
    this.musicFade = null;

    const path = AUDIO_PATHS.music[id];
    const buf = this.buffers.get(path) ?? null;

    if (buf) {
      const fade = ctx.createGain();
      const now = ctx.currentTime;
      const fadeIn = AUDIO_MIX.musicFadeIn;
      fade.gain.setValueAtTime(0.0001, now);
      fade.gain.exponentialRampToValueAtTime(1, now + fadeIn);

      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(fade);
      fade.connect(bus);
      src.start();

      this.musicFade = fade;
      this.musicStop = () => {
        try {
          src.stop();
        } catch {
          /* already stopped */
        }
        src.disconnect();
        fade.disconnect();
      };
      this.musicId = id;
      return;
    }

    // Dev fallback only if the real file failed to load — never alongside it.
    this.musicStop = this.synthMusicPad(ctx, bus);
    this.musicId = id;
  }

  private crossfadeAmbience(id: AmbienceId | null): void {
    const ctx = this.ctx;
    const bus = this.ambienceBus;
    if (!ctx || !bus) return;
    const fade = AUDIO_MIX.ambienceFade;
    const now = ctx.currentTime;

    for (const [key, voice] of this.ambienceVoices) {
      if (key === id) continue;
      this.ramp(voice.gain.gain, 0, fade, now);
      const stop = voice.stop;
      const g = voice.gain;
      window.setTimeout(() => {
        stop();
        g.disconnect();
        this.ambienceVoices.delete(key);
      }, fade * 1000 + 40);
    }

    if (!id) return;
    if (this.ambienceVoices.has(id)) {
      const keep = this.ambienceVoices.get(id);
      if (keep) this.ramp(keep.gain.gain, 1, fade, now);
      return;
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.connect(bus);
    const path = AUDIO_PATHS.ambience[id];
    const buf = this.buffers.get(path);
    let stop: (() => void) | null = null;
    if (buf) {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(gain);
      src.start();
      stop = () => {
        try {
          src.stop();
        } catch {
          /* already stopped */
        }
        src.disconnect();
      };
    } else if (ENABLE_GENERATED_AMBIENCE) {
      stop = this.synthAmbience(ctx, gain, id);
    } else {
      // No real file + generated ambience disabled — skip this region.
      gain.disconnect();
      return;
    }
    this.ramp(gain.gain, 1, fade, now);
    this.ambienceVoices.set(id, { id, gain, stop });
  }

  private synthInteract(ctx: AudioContext, bus: GainNode): void {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(620, t);
    osc.frequency.exponentialRampToValueAtTime(280, t + 0.09);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    osc.connect(g);
    g.connect(bus);
    osc.start(t);
    osc.stop(t + 0.16);
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
    };
  }

  private synthEncounter(
    ctx: AudioContext,
    bus: GainNode,
    destHint?: AmbienceId | null,
  ): void {
    const t = ctx.currentTime;
    const dur = 0.55;
    const noise = this.makeNoiseBuffer(ctx, 1);
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    const base = destHint === "mordor" ? 420 : destHint === "shire" ? 900 : 680;
    filter.frequency.setValueAtTime(base, t);
    filter.frequency.exponentialRampToValueAtTime(base * 0.35, t + dur);
    filter.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.28, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(bus);
    src.start(t);
    src.stop(t + dur);
    src.onended = () => {
      src.disconnect();
      filter.disconnect();
      g.disconnect();
    };
  }

  private synthMusicPad(ctx: AudioContext, bus: GainNode): () => void {
    const merger = ctx.createGain();
    merger.gain.value = 0.12;
    merger.connect(bus);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 480;
    filter.Q.value = 0.4;
    filter.connect(merger);

    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    oscA.type = "sine";
    oscB.type = "sine";
    oscA.frequency.value = 110;
    oscB.frequency.value = 164.81;
    oscA.detune.value = -4;
    oscB.detune.value = 6;
    const gA = ctx.createGain();
    const gB = ctx.createGain();
    gA.gain.value = 0.35;
    gB.gain.value = 0.22;
    oscA.connect(gA);
    oscB.connect(gB);
    gA.connect(filter);
    gB.connect(filter);

    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoG.gain.value = 80;
    lfo.connect(lfoG);
    lfoG.connect(filter.frequency);

    oscA.start();
    oscB.start();
    lfo.start();

    return () => {
      try {
        oscA.stop();
        oscB.stop();
        lfo.stop();
      } catch {
        /* already stopped */
      }
      oscA.disconnect();
      oscB.disconnect();
      lfo.disconnect();
      gA.disconnect();
      gB.disconnect();
      lfoG.disconnect();
      filter.disconnect();
      merger.disconnect();
    };
  }

  private synthAmbience(
    ctx: AudioContext,
    dest: GainNode,
    id: AmbienceId,
  ): () => void {
    const src = ctx.createBufferSource();
    src.buffer = this.makeNoiseBuffer(ctx, 2);
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    const g = ctx.createGain();
    g.gain.value = 0.35;

    if (id === "hub") {
      filter.frequency.value = 1800;
      filter.Q.value = 0.6;
      g.gain.value = 0.22;
      const lfo = ctx.createOscillator();
      const lfoG = ctx.createGain();
      lfo.frequency.value = 9;
      lfoG.gain.value = 0.12;
      lfo.connect(lfoG);
      lfoG.connect(g.gain);
      lfo.start();
      src.connect(filter);
      filter.connect(g);
      g.connect(dest);
      src.start();
      return () => {
        try {
          src.stop();
          lfo.stop();
        } catch {
          /* already stopped */
        }
        src.disconnect();
        lfo.disconnect();
        lfoG.disconnect();
        filter.disconnect();
        g.disconnect();
      };
    }

    if (id === "shire") {
      filter.frequency.value = 900;
      g.gain.value = 0.18;
    } else if (id === "mountains") {
      filter.frequency.value = 1400;
      g.gain.value = 0.2;
    } else {
      filter.type = "lowpass";
      filter.frequency.value = 220;
      g.gain.value = 0.28;
    }

    src.connect(filter);
    filter.connect(g);
    g.connect(dest);
    src.start();
    return () => {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
      src.disconnect();
      filter.disconnect();
      g.disconnect();
    };
  }

  private makeNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    return buf;
  }
}

let singleton: AudioManager | null = null;

export function getAudioManager(): AudioManager {
  if (!singleton) singleton = new AudioManager();
  return singleton;
}
