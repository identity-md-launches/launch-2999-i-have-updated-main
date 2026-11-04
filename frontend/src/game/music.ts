// Squeek Life — procedural chiptune soundtrack + sound effects (WebAudio, no assets).

export type TrackName = "menu" | "slums" | "office" | "rich";
export type SfxName =
  | "coin"
  | "perfect"
  | "good"
  | "miss"
  | "buy"
  | "deny"
  | "gate"
  | "achievement"
  | "boost"
  | "sleep"
  | "win";

interface TrackDef {
  bpm: number;
  /** One token per 8th note: note name, "." rest. */
  bass: string[];
  lead: string[];
  /** One char per 8th note: K kick, S snare, h hat, - rest. */
  drums: string;
  leadType?: OscillatorType;
}

const TRACKS: Record<TrackName, TrackDef> = {
  // Bright title-screen loop.
  menu: {
    bpm: 132,
    bass: ["C2", ".", "G2", ".", "A2", ".", "F2", ".", "C2", ".", "G2", ".", "F2", ".", "G2", "."],
    lead: [
      "E4", ".", "G4", "C5", ".", "G4", "E4", ".", "D4", ".", "F4", "A4", ".", "F4", "D4", ".",
      "E4", ".", "G4", "C5", ".", "E5", "G5", ".", "F5", ".", "E5", "D5", "C5", ".", "G4", "B4",
    ],
    drums: "K-h-S-h-K-h-S-hh",
    leadType: "square",
  },
  // Laid-back minor groove for the slums.
  slums: {
    bpm: 100,
    bass: ["A1", ".", "A1", ".", "C2", ".", "E2", ".", "F1", ".", "F1", ".", "G1", ".", "G1", "."],
    lead: [
      "A3", ".", "C4", ".", "E4", ".", "D4", ".", "C4", ".", "A3", ".", "G3", ".", "E3", ".",
      "A3", ".", "C4", ".", "E4", ".", "G4", ".", "A4", ".", "G4", ".", "E4", ".", "C4", ".",
    ],
    drums: "K--hS--hK--hS--h",
    leadType: "triangle",
  },
  // Busy, driving downtown shift.
  office: {
    bpm: 144,
    bass: ["C2", "C2", "G2", "G2", "A2", "A2", "F2", "F2", "C2", "C2", "G2", "G2", "F2", "F2", "G2", "G2"],
    lead: [
      "E4", "G4", "C5", "E5", "D5", "C5", "G4", "E4", "F4", "A4", "C5", "F5", "E5", "C5", "A4", "G4",
      "E4", "G4", "C5", "E5", "G5", "E5", "C5", "G4", "A4", "F4", "D4", "F4", "E4", "C4", "G3", "B3",
    ],
    drums: "K-hSK-hSK-hSK-hS",
    leadType: "square",
  },
  // Swanky major-seventh strut behind the golden gate.
  rich: {
    bpm: 116,
    bass: ["F2", ".", "A2", ".", "C3", ".", "E3", ".", "D2", ".", "F2", ".", "A2", ".", "C3", "."],
    lead: [
      "C4", "E4", "G4", "B4", "A4", "G4", "E4", "C4", "D4", "F4", "A4", "C5", "B4", "A4", "F4", "D4",
      "E4", "G4", "B4", "D5", "C5", "B4", "G4", "E4", "F4", "A4", "C5", "E5", "D5", "B4", "G4", "B4",
    ],
    drums: "K--hS--hK--hS--h",
    leadType: "square",
  },
};

const WIN_JINGLE: TrackDef = {
  bpm: 150,
  bass: ["C3", ".", "C3", ".", "F3", ".", "G3", ".", "C3", ".", "C3", ".", "F3", "G3", "C3", "."],
  lead: ["C5", "E5", "G5", "C6", ".", "G5", "C6", "E6", "G5", "C6", ".", "E6", "C6", ".", ".", "."],
  drums: "K--hS--hK--hS--h",
  leadType: "square",
};

const NOTE_INDEX: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

function midiOf(token: string): number | null {
  if (!token || token === "." || token === "-") return null;
  const match = /^([A-G][#b]?)(-?\d)$/.exec(token);
  if (!match) return null;
  return 12 * (Number(match[2]) + 1) + NOTE_INDEX[match[1]];
}

const freqOf = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

/** Tiny step sequencer: 8th-note patterns, square/triangle leads, noise drums. */
export class GameMusic {
  muted = false;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer: number | null = null;
  private track: TrackName | null = null;
  private step = 0;
  private nextTime = 0;
  private baseVolume = 0.18;

  constructor(muted = false) {
    this.muted = muted;
  }

  /** Create the audio graph. Must run inside a user gesture (autoplay policy). */
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      if (this.timer === null) this.timer = globalThis.setInterval(this.loop, 40) as unknown as number;
      return;
    }
    const Ctor = (globalThis as any).AudioContext ?? (globalThis as any).webkitAudioContext;
    if (!Ctor) return;
    try {
      this.ctx = new Ctor();
      this.master = this.ctx!.createGain();
      this.master.gain.value = this.muted ? 0 : this.baseVolume;
      this.master.connect(this.ctx!.destination);
      const length = Math.floor(this.ctx!.sampleRate * 0.4);
      const buffer = this.ctx!.createBuffer(1, length, this.ctx!.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
      this.noise = buffer;
      this.nextTime = this.ctx!.currentTime + 0.1;
      if (this.timer === null) this.timer = globalThis.setInterval(this.loop, 40) as unknown as number;
    } catch {
      this.ctx = null;
    }
  }

  setTrack(name: TrackName | null) {
    if (this.track === name) return;
    this.track = name;
    this.step = 0;
    if (this.ctx) this.nextTime = this.ctx.currentTime + 0.06;
  }

  /** Silence the sequencer but keep the audio graph for later (shared instance). */
  stop() {
    this.track = null;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    try {
      void this.ctx?.suspend();
    } catch {
      /* ignore */
    }
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : this.baseVolume, this.ctx.currentTime, 0.05);
    }
    return this.muted;
  }

  dispose() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.track = null;
    try {
      this.master?.disconnect();
      void this.ctx?.close();
    } catch {
      /* ignore */
    }
    this.ctx = null;
    this.master = null;
  }

  // ---------- scheduling ----------
  private loop = () => {
    const ctx = this.ctx;
    if (!ctx || !this.track) return;
    const def = TRACKS[this.track];
    const stepDur = 60 / def.bpm / 2;
    while (this.nextTime < ctx.currentTime + 0.3) {
      this.playStep(def, this.step, this.nextTime, stepDur);
      this.nextTime += stepDur;
      this.step += 1;
    }
  };

  private playStep(def: TrackDef, index: number, time: number, stepDur: number) {
    // Patterns may have different lengths: the loop keeps evolving instead of repeating every 2 bars.
    const bass = midiOf(def.bass[index % def.bass.length]);
    if (bass !== null) this.tone(time, bass, stepDur * 1.7, "triangle", 0.34);
    const lead = midiOf(def.lead[index % def.lead.length] ?? ".");
    if (lead !== null) this.tone(time, lead, stepDur * 1.15, def.leadType ?? "square", 0.22);
    const hit = def.drums[index % def.drums.length] ?? "-";
    if (hit === "K") this.kick(time);
    else if (hit === "S") this.snare(time);
    else if (hit === "h") this.hat(time);
  }

  // ---------- voices ----------
  private tone(time: number, midi: number, dur: number, type: OscillatorType, gain: number) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqOf(midi), time);
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(gain, time + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(env).connect(this.master);
    osc.start(time);
    osc.stop(time + dur + 0.03);
  }

  private kick(time: number, gain = 0.7) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(46, time + 0.11);
    env.gain.setValueAtTime(gain, time);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.17);
    osc.connect(env).connect(this.master);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  private noiseHit(time: number, dur: number, gain: number, cutoff: number, type: BiquadFilterType) {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.noise) return;
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const env = ctx.createGain();
    src.buffer = this.noise;
    filter.type = type;
    filter.frequency.value = cutoff;
    env.gain.setValueAtTime(gain, time);
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    src.connect(filter).connect(env).connect(this.master);
    src.start(time);
    src.stop(time + dur + 0.02);
  }

  private hat(time: number) {
    this.noiseHit(time, 0.05, 0.12, 7200, "highpass");
  }

  private snare(time: number) {
    this.noiseHit(time, 0.16, 0.3, 1800, "bandpass");
    this.tone(time, 47, 0.1, "triangle", 0.25);
  }

  private sweep(time: number, from: number, to: number, dur: number, gain: number) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(from, time);
    osc.frequency.exponentialRampToValueAtTime(to, time + dur);
    env.gain.setValueAtTime(gain, time);
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(env).connect(this.master);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  /** Short arpeggio helper: plays `notes` back to back from `time`. */
  private arp(time: number, notes: string[], step: number, dur: number, type: OscillatorType, gain: number) {
    notes.forEach((note, index) => {
      const midi = midiOf(note);
      if (midi !== null) this.tone(time + index * step, midi, dur, type, gain);
    });
  }

  sfx(name: SfxName) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + 0.01;
    switch (name) {
      case "coin":
        this.arp(t, ["B5", "E6"], 0.06, 0.1, "square", 0.3);
        break;
      case "perfect":
        this.arp(t, ["C6", "E6", "G6"], 0.055, 0.12, "square", 0.28);
        break;
      case "good":
        this.arp(t, ["G5", "C6"], 0.06, 0.11, "square", 0.24);
        break;
      case "miss":
        this.arp(t, ["E4", "C4"], 0.09, 0.16, "square", 0.24);
        break;
      case "buy":
        this.arp(t, ["C5", "E5", "G5"], 0.05, 0.1, "square", 0.24);
        break;
      case "deny":
        this.arp(t, ["A3", "F3"], 0.1, 0.18, "sawtooth", 0.16);
        break;
      case "gate":
        this.kick(t, 0.8);
        this.arp(t, ["C4", "G4", "C5", "E5", "G5"], 0.09, 0.22, "square", 0.26);
        this.sweep(t, 180, 900, 0.5, 0.12);
        break;
      case "achievement":
        this.arp(t, ["G5", "C6", "E6", "C6"], 0.075, 0.16, "triangle", 0.3);
        break;
      case "boost":
        this.sweep(t, 320, 1500, 0.45, 0.2);
        this.arp(t, ["A5", "E6"], 0.08, 0.12, "square", 0.22);
        break;
      case "sleep":
        this.arp(t, ["E5", "C5", "G4"], 0.12, 0.24, "triangle", 0.24);
        break;
      case "win": {
        const stepDur = 60 / WIN_JINGLE.bpm / 2;
        for (let i = 0; i < WIN_JINGLE.bass.length; i++) {
          this.playStep(WIN_JINGLE, i, t + i * stepDur, stepDur);
        }
        this.arp(t + 0.02, ["C5", "E5", "G5", "C6", "E6"], 0.07, 0.18, "triangle", 0.22);
        break;
      }
      default:
        break;
    }
  }
}

let shared: GameMusic | null = null;

/** One audio graph for the whole app (start screen + game), so tracks never overlap. */
export function gameMusic(): GameMusic {
  if (!shared) {
    let muted = false;
    try {
      muted = localStorage.getItem("squeek.muted") === "1";
    } catch {
      muted = false;
    }
    shared = new GameMusic(muted);
  }
  return shared;
}
