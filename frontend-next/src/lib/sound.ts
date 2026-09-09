/**
 * AquaGhost Protocol - Zero-dependency Audio Synthesizer
 * Uses Web Audio API for cyberpunk UI audio feedback.
 */

class SoundFX {
  private ctx: AudioContext | null = null;

  private init() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  playBeep(freq = 600, duration = 0.1, type: OscillatorType = "sine") {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {}
  }

  playRadarSweep() {
    this.playBeep(1200, 0.08, "sine");
  }

  playAlert() {
    this.playBeep(880, 0.15, "sawtooth");
    setTimeout(() => this.playBeep(440, 0.25, "sawtooth"), 120);
  }

  playSuccess() {
    this.playBeep(523.25, 0.1, "triangle"); // C5
    setTimeout(() => this.playBeep(659.25, 0.1, "triangle"), 80); // E5
    setTimeout(() => this.playBeep(783.99, 0.18, "triangle"), 160); // G5
  }

  playAttestation() {
    this.playBeep(440, 0.1, "sine");
    setTimeout(() => this.playBeep(554.37, 0.1, "sine"), 90);
    setTimeout(() => this.playBeep(659.25, 0.12, "sine"), 180);
    setTimeout(() => this.playBeep(880, 0.22, "triangle"), 270);
  }

  playClick() {
    this.playBeep(900, 0.04, "sine");
  }
}

export const soundFX = new SoundFX();
