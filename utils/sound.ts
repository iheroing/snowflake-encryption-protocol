export type SoundScene = 'landing' | 'encrypt' | 'decrypt' | 'gallery' | 'afterglow' | 'idle';
export type SoundCue = 'tap' | 'crystallize' | 'share' | 'melt' | 'export' | 'switch';

const STORAGE_KEY = 'snowflake:audio-enabled';

type EnabledListener = (enabled: boolean) => void;

interface ScenePreset {
  baseA: number;
  baseB: number;
  gain: number;
}

const SCENE_PRESETS: Record<SoundScene, ScenePreset> = {
  landing: { baseA: 174, baseB: 261.6, gain: 0.009 },
  encrypt: { baseA: 196, baseB: 293.7, gain: 0.011 },
  decrypt: { baseA: 164.8, baseB: 246.9, gain: 0.012 },
  gallery: { baseA: 146.8, baseB: 220, gain: 0.008 },
  afterglow: { baseA: 185, baseB: 277.2, gain: 0.01 },
  idle: { baseA: 174, baseB: 246.9, gain: 0.006 }
};

interface AudioGraph {
  ctx: AudioContext;
  master: GainNode;
  ambientGain: GainNode;
  ambientA: OscillatorNode;
  ambientB: OscillatorNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;
}

class SoundManager {
  private graph: AudioGraph | null = null;
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
    if (graph.ctx.state === 'suspended') {
      await graph.ctx.resume();
    }
    graph.master.gain.setTargetAtTime(0.05, graph.ctx.currentTime, 0.5);
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
        // ignore storage failures
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
      this.playTone(780, 620, 0.12, 0.008, 'triangle', now);
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

    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      return null;
    }

    const ctx = new AudioCtx();
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);

    const ambientA = ctx.createOscillator();
    ambientA.type = 'sine';

    const ambientB = ctx.createOscillator();
    ambientB.type = 'triangle';

    const ambientGain = ctx.createGain();
    ambientGain.gain.value = 0.008;

    ambientA.connect(ambientGain);
    ambientB.connect(ambientGain);
    ambientGain.connect(master);

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.09;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.0045;
    lfo.connect(lfoGain);
    lfoGain.connect(ambientGain.gain);

    ambientA.start();
    ambientB.start();
    lfo.start();

    this.graph = { ctx, master, ambientGain, ambientA, ambientB, lfo, lfoGain };
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
    const timeConstant = smooth ? 0.8 : 0.1;
    graph.ambientA.frequency.setTargetAtTime(preset.baseA, now, timeConstant);
    graph.ambientB.frequency.setTargetAtTime(preset.baseB, now, timeConstant);
    graph.ambientGain.gain.setTargetAtTime(this.enabled ? preset.gain : 0.0001, now, timeConstant);
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
    gain.connect(graph.master);

    osc.start(startAt);
    osc.stop(startAt + durationSec + 0.05);
  }
}

export const soundManager = new SoundManager();
