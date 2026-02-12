export type SoundScene = 'landing' | 'encrypt' | 'decrypt' | 'gallery' | 'afterglow' | 'idle';
export type SoundCue = 'tap' | 'crystallize' | 'share' | 'melt' | 'export' | 'switch';

const STORAGE_KEY = 'snowflake:audio-enabled';
const BGM_PATH = '/ambience.mp3';

type EnabledListener = (enabled: boolean) => void;

interface ScenePreset {
  bgmVolume: number;
  playbackRate: number;
  cueGain: number;
}

const SCENE_PRESETS: Record<SoundScene, ScenePreset> = {
  landing: { bgmVolume: 0.24, playbackRate: 1.0, cueGain: 1.0 },
  encrypt: { bgmVolume: 0.3, playbackRate: 1.01, cueGain: 1.05 },
  decrypt: { bgmVolume: 0.22, playbackRate: 0.99, cueGain: 0.95 },
  gallery: { bgmVolume: 0.2, playbackRate: 1.0, cueGain: 0.92 },
  afterglow: { bgmVolume: 0.18, playbackRate: 0.985, cueGain: 0.9 },
  idle: { bgmVolume: 0.16, playbackRate: 1.0, cueGain: 0.85 }
};

interface AudioGraph {
  ctx: AudioContext;
  master: GainNode;
  cueBus: GainNode;
}

class SoundManager {
  private graph: AudioGraph | null = null;
  private bgm: HTMLAudioElement | null = null;
  private bgmFadeRaf: number | null = null;
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
    if (graph && graph.ctx.state === 'suspended') {
      await graph.ctx.resume();
    }

    const bgm = this.ensureBgm();
    try {
      await bgm.play();
    } catch {
      // Autoplay can fail before user gesture; ignore and wait for next unlock.
    }

    if (graph) {
      graph.master.gain.setTargetAtTime(0.07, graph.ctx.currentTime, 0.5);
    }
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
        // Ignore storage errors.
      }
    }

    for (const listener of this.listeners) {
      listener(next);
    }

    const graph = this.graph;
    if (graph) {
      if (!next) {
        graph.master.gain.setTargetAtTime(0.0001, graph.ctx.currentTime, 0.2);
      } else {
        graph.master.gain.setTargetAtTime(0.07, graph.ctx.currentTime, 0.5);
      }
    }

    if (!next) {
      const bgm = this.bgm;
      if (bgm) {
        this.fadeBgmTo(0, 320, () => {
          bgm.pause();
        });
      }
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

    const cueBus = ctx.createGain();
    cueBus.gain.value = 1;
    cueBus.connect(master);

    this.graph = { ctx, master, cueBus };
    return this.graph;
  }

  private ensureBgm(): HTMLAudioElement {
    if (this.bgm) {
      return this.bgm;
    }

    const audio = new Audio(BGM_PATH);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
    audio.crossOrigin = 'anonymous';

    this.bgm = audio;
    return audio;
  }

  private applyScene(scene: SoundScene, smooth: boolean): void {
    const preset = SCENE_PRESETS[scene];
    const bgm = this.ensureBgm();

    bgm.playbackRate = preset.playbackRate;
    const targetVolume = this.enabled ? preset.bgmVolume : 0;
    this.fadeBgmTo(targetVolume, smooth ? 600 : 180);

    const graph = this.graph;
    if (graph) {
      graph.cueBus.gain.setTargetAtTime(preset.cueGain, graph.ctx.currentTime, smooth ? 0.6 : 0.2);
    }
  }

  private fadeBgmTo(target: number, durationMs: number, onDone?: () => void): void {
    const bgm = this.bgm;
    if (!bgm) {
      onDone?.();
      return;
    }

    if (this.bgmFadeRaf !== null) {
      window.cancelAnimationFrame(this.bgmFadeRaf);
      this.bgmFadeRaf = null;
    }

    const startVolume = bgm.volume;
    const startAt = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startAt;
      const t = Math.min(1, durationMs <= 0 ? 1 : elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      bgm.volume = startVolume + (target - startVolume) * eased;

      if (t < 1) {
        this.bgmFadeRaf = window.requestAnimationFrame(tick);
        return;
      }

      this.bgmFadeRaf = null;
      onDone?.();
    };

    this.bgmFadeRaf = window.requestAnimationFrame(tick);
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
}

export const soundManager = new SoundManager();
