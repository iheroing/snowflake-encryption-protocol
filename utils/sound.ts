export type SoundScene = 'landing' | 'encrypt' | 'decrypt' | 'gallery' | 'afterglow' | 'idle';
export type SoundCue = 'tap' | 'crystallize' | 'share' | 'melt' | 'export' | 'switch';

const STORAGE_KEY = 'snowflake:audio-enabled';
const MAJOR_PROGRESSIONS = [0, -3, -5, -2];
const ARP_PATTERN = [0, 1, 2, 1, 2, 1, 0, 1];

type EnabledListener = (enabled: boolean) => void;

interface ScenePreset {
  tempo: number;
  gain: number;
  tonicMidi: number;
  brightness: number;
  sparkleChance: number;
  reverb: number;
  bassLevel: number;
  arpLevel: number;
  bellLevel: number;
}

interface SequenceState {
  step: number;
  chord: number;
  nextStepTime: number;
}

interface ToneShape {
  attack: number;
  sustain: number;
  release: number;
  peak: number;
  cutoffHz: number;
  q: number;
  type: OscillatorType;
}

const SCENE_PRESETS: Record<SoundScene, ScenePreset> = {
  landing: {
    tempo: 68,
    gain: 0.027,
    tonicMidi: 62,
    brightness: 0.8,
    sparkleChance: 0.25,
    reverb: 0.2,
    bassLevel: 0.45,
    arpLevel: 0.8,
    bellLevel: 0.4
  },
  encrypt: {
    tempo: 72,
    gain: 0.03,
    tonicMidi: 64,
    brightness: 0.92,
    sparkleChance: 0.35,
    reverb: 0.25,
    bassLevel: 0.5,
    arpLevel: 0.9,
    bellLevel: 0.48
  },
  decrypt: {
    tempo: 64,
    gain: 0.026,
    tonicMidi: 60,
    brightness: 0.72,
    sparkleChance: 0.16,
    reverb: 0.23,
    bassLevel: 0.58,
    arpLevel: 0.72,
    bellLevel: 0.3
  },
  gallery: {
    tempo: 70,
    gain: 0.022,
    tonicMidi: 65,
    brightness: 0.86,
    sparkleChance: 0.22,
    reverb: 0.2,
    bassLevel: 0.42,
    arpLevel: 0.75,
    bellLevel: 0.34
  },
  afterglow: {
    tempo: 62,
    gain: 0.024,
    tonicMidi: 57,
    brightness: 0.7,
    sparkleChance: 0.18,
    reverb: 0.28,
    bassLevel: 0.48,
    arpLevel: 0.68,
    bellLevel: 0.5
  },
  idle: {
    tempo: 60,
    gain: 0.02,
    tonicMidi: 60,
    brightness: 0.7,
    sparkleChance: 0.12,
    reverb: 0.18,
    bassLevel: 0.4,
    arpLevel: 0.6,
    bellLevel: 0.2
  }
};

interface AudioGraph {
  ctx: AudioContext;
  master: GainNode;
  musicBus: GainNode;
  cueBus: GainNode;
  musicFilter: BiquadFilterNode;
  echo: DelayNode;
  echoFeedback: GainNode;
}

class SoundManager {
  private graph: AudioGraph | null = null;
  private schedulerId: number | null = null;
  private sequence: SequenceState = { step: 0, chord: 0, nextStepTime: 0 };
  private scene: SoundScene = 'landing';
  private enabled = true;
  private listeners = new Set<EnabledListener>();
  private lastTapAt = 0;

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      this.enabled = raw !== '0';
    } catch {
      this.enabled = true;
    }
  }

  getEnabled(): boolean {
    return this.enabled;
  }

  subscribe(listener: EnabledListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async unlock(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const graph = await this.ensureGraph();
    if (!graph) {
      return;
    }

    if (graph.ctx.state === 'suspended') {
      await graph.ctx.resume();
    }

    this.startScheduler();
    graph.master.gain.setTargetAtTime(0.06, graph.ctx.currentTime, 0.6);
    this.applyScene(this.scene, true);
  }

  setEnabled(next: boolean): void {
    if (this.enabled === next) {
      return;
    }

    this.enabled = next;
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        // Ignore storage failures.
      }
    }

    for (const listener of this.listeners) {
      listener(next);
    }

    const graph = this.graph;
    if (!graph) {
      return;
    }

    if (!next) {
      this.stopScheduler();
      graph.master.gain.setTargetAtTime(0.0001, graph.ctx.currentTime, 0.25);
      return;
    }

    void this.unlock();
  }

  async setScene(scene: SoundScene): Promise<void> {
    this.scene = scene;
    if (!this.enabled) {
      return;
    }
    await this.unlock();
    this.sequence.chord = 0;
    this.applyScene(scene, true);
  }

  async playCue(cue: SoundCue): Promise<void> {
    if (!this.enabled) {
      return;
    }

    await this.unlock();
    const graph = this.graph;
    if (!graph) {
      return;
    }

    const now = graph.ctx.currentTime;

    if (cue === 'tap') {
      const nowMs = Date.now();
      if (nowMs - this.lastTapAt < 70) {
        return;
      }
      this.lastTapAt = nowMs;
      this.playTone(760, 620, 0.12, 0.008, 'triangle', now);
      return;
    }

    if (cue === 'switch') {
      this.playTone(460, 620, 0.2, 0.01, 'sine', now);
      return;
    }

    if (cue === 'crystallize') {
      this.playTone(420, 880, 1.1, 0.022, 'sine', now);
      this.playTone(520, 760, 0.7, 0.014, 'triangle', now + 0.08);
      return;
    }

    if (cue === 'share') {
      this.playTone(620, 980, 0.42, 0.016, 'triangle', now);
      return;
    }

    if (cue === 'export') {
      this.playTone(320, 660, 0.82, 0.018, 'sine', now);
      this.playTone(540, 820, 0.52, 0.012, 'triangle', now + 0.1);
      return;
    }

    if (cue === 'melt') {
      this.playTone(760, 120, 4.6, 0.023, 'sine', now);
      this.playTone(520, 170, 3.8, 0.014, 'triangle', now + 0.08);
    }
  }

  private async ensureGraph(): Promise<AudioGraph | null> {
    if (this.graph) {
      return this.graph;
    }

    if (typeof window === 'undefined') {
      return null;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      return null;
    }

    const ctx = new AudioCtx();
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);

    const musicBus = ctx.createGain();
    musicBus.gain.value = 0.02;

    const cueBus = ctx.createGain();
    cueBus.gain.value = 1;

    const musicFilter = ctx.createBiquadFilter();
    musicFilter.type = 'lowpass';
    musicFilter.frequency.value = 2200;
    musicFilter.Q.value = 0.5;

    const echo = ctx.createDelay();
    echo.delayTime.value = 0.3;

    const echoFeedback = ctx.createGain();
    echoFeedback.gain.value = 0.18;
    echo.connect(echoFeedback);
    echoFeedback.connect(echo);

    musicBus.connect(musicFilter);
    musicFilter.connect(master);
    musicFilter.connect(echo);
    echo.connect(master);

    cueBus.connect(master);

    this.graph = { ctx, master, musicBus, cueBus, musicFilter, echo, echoFeedback };
    this.resetSequence(ctx.currentTime + 0.08);
    this.applyScene(this.scene, false);
    return this.graph;
  }

  private applyScene(scene: SoundScene, smooth: boolean): void {
    const graph = this.graph;
    if (!graph) {
      return;
    }

    const preset = SCENE_PRESETS[scene];
    const now = graph.ctx.currentTime;
    const timeConstant = smooth ? 0.7 : 0.12;

    graph.musicBus.gain.setTargetAtTime(this.enabled ? preset.gain : 0.0001, now, timeConstant);
    graph.musicFilter.frequency.setTargetAtTime(1200 + preset.brightness * 2100, now, timeConstant);
    graph.echo.delayTime.setTargetAtTime(0.24 + preset.reverb * 0.28, now, timeConstant);
    graph.echoFeedback.gain.setTargetAtTime(0.11 + preset.reverb * 0.2, now, timeConstant);
  }

  private playTone(
    startFreq: number,
    endFreq: number,
    durationSec: number,
    peakGain: number,
    type: OscillatorType,
    startAt: number
  ): void {
    const graph = this.graph;
    if (!graph) {
      return;
    }

    const osc = graph.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, startAt);
    osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), startAt + durationSec);

    const gain = graph.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(peakGain, startAt + Math.min(0.24, durationSec * 0.35));
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSec);

    osc.connect(gain);
    gain.connect(graph.cueBus);

    osc.start(startAt);
    osc.stop(startAt + durationSec + 0.05);
  }

  private startScheduler(): void {
    if (!this.graph || this.schedulerId !== null) {
      return;
    }

    if (this.sequence.nextStepTime < this.graph.ctx.currentTime - 1) {
      this.resetSequence(this.graph.ctx.currentTime + 0.06);
    }

    this.schedulerId = window.setInterval(() => {
      this.scheduleNotes();
    }, 120);
  }

  private stopScheduler(): void {
    if (this.schedulerId === null) {
      return;
    }

    window.clearInterval(this.schedulerId);
    this.schedulerId = null;
  }

  private resetSequence(startAt: number): void {
    this.sequence = { step: 0, chord: 0, nextStepTime: startAt };
  }

  private scheduleNotes(): void {
    const graph = this.graph;
    if (!graph || !this.enabled) {
      return;
    }

    const preset = SCENE_PRESETS[this.scene];
    const stepSeconds = 60 / preset.tempo / 2;
    const lookAhead = 0.36;

    while (this.sequence.nextStepTime < graph.ctx.currentTime + lookAhead) {
      this.scheduleStep(this.sequence.nextStepTime, preset);
      this.sequence.step += 1;
      this.sequence.nextStepTime += stepSeconds;
    }
  }

  private scheduleStep(time: number, preset: ScenePreset): void {
    const progressionIndex = Math.floor(this.sequence.step / 8) % MAJOR_PROGRESSIONS.length;
    if (progressionIndex !== this.sequence.chord) {
      this.sequence.chord = progressionIndex;
    }

    const root = preset.tonicMidi + MAJOR_PROGRESSIONS[this.sequence.chord];
    const chord = [root, root + 4, root + 7];
    const arpIndex = ARP_PATTERN[this.sequence.step % ARP_PATTERN.length];
    const arpMidi = chord[arpIndex] + 12;

    this.playMusicalNote(this.midiToHz(arpMidi), time, {
      attack: 0.012,
      sustain: 0.14,
      release: 0.5,
      peak: 0.013 * preset.arpLevel,
      cutoffHz: 1500 + preset.brightness * 1600,
      q: 2.2,
      type: 'triangle'
    });

    if (this.sequence.step % 4 === 0) {
      this.playMusicalNote(this.midiToHz(root - 12), time, {
        attack: 0.02,
        sustain: 0.22,
        release: 0.65,
        peak: 0.015 * preset.bassLevel,
        cutoffHz: 520 + preset.brightness * 440,
        q: 1.2,
        type: 'sine'
      });
    }

    if (this.sequence.step % 16 === 10 && Math.random() < preset.sparkleChance) {
      this.playMusicalNote(this.midiToHz(chord[2] + 24), time + 0.03, {
        attack: 0.005,
        sustain: 0.08,
        release: 1.35,
        peak: 0.01 * preset.bellLevel,
        cutoffHz: 3800 + preset.brightness * 2200,
        q: 4.4,
        type: 'sine'
      });
    }
  }

  private playMusicalNote(frequency: number, startAt: number, shape: ToneShape): void {
    const graph = this.graph;
    if (!graph) {
      return;
    }

    const osc = graph.ctx.createOscillator();
    osc.type = shape.type;
    osc.frequency.setValueAtTime(frequency, startAt);

    const filter = graph.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(shape.cutoffHz, startAt);
    filter.Q.value = shape.q;

    const gain = graph.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(shape.peak, startAt + shape.attack);
    gain.gain.exponentialRampToValueAtTime(shape.peak * 0.75, startAt + shape.attack + shape.sustain);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + shape.attack + shape.sustain + shape.release);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(graph.musicBus);

    const stopAt = startAt + shape.attack + shape.sustain + shape.release + 0.03;
    osc.start(startAt);
    osc.stop(stopAt);
  }

  private midiToHz(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
}

export const soundManager = new SoundManager();
