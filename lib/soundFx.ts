// Web Audio API Sound Synthesizer for Casino SFX (Zero external asset dependencies)

class SoundFX {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Coin Flip Spin & Clink
  public playCoinFlip() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1600, this.ctx.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  // Card Deal Flick
  public playCardDeal() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  // Chip Bet Click
  public playChipBet() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // Cricket Bat Crack / Hit Thwack Sound
  public playBatCrack() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    // Fast high-pitch click + wooden resonant pop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.45, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  // Step / Jump / Mine Gem reveal
  public playGem() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(1046.5, this.ctx.currentTime + 0.12); // C6

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  // Win Celebration Fanfare
  public playWin() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.08);

      gain.gain.setValueAtTime(0, this.ctx!.currentTime + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.3, this.ctx!.currentTime + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.08 + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(this.ctx!.currentTime + i * 0.08);
      osc.stop(this.ctx!.currentTime + i * 0.08 + 0.3);
    });
  }

  // Crash / Loss Thud
  public playLoss() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  // Jet Engine Turbine Sound
  private jetOsc: OscillatorNode | null = null;
  private jetGain: GainNode | null = null;

  public startJetEngine() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    this.stopJetEngine();

    this.jetOsc = this.ctx.createOscillator();
    this.jetGain = this.ctx.createGain();
    this.jetOsc.type = "sawtooth";
    this.jetOsc.frequency.setValueAtTime(120, this.ctx.currentTime);

    this.jetGain.gain.setValueAtTime(0.02, this.ctx.currentTime);
    this.jetOsc.connect(this.jetGain);
    this.jetGain.connect(this.ctx.destination);
    this.jetOsc.start();
  }

  public updateJetPitch(multiplier: number) {
    if (!this.ctx || !this.jetOsc || !this.jetGain) return;
    const freq = Math.min(800, 120 + Math.log2(multiplier) * 150);
    this.jetOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);
    const volume = Math.min(0.08, 0.02 + Math.log2(multiplier) * 0.015);
    this.jetGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.05);
  }

  public stopJetEngine() {
    if (this.jetOsc) {
      try {
        this.jetOsc.stop();
        this.jetOsc.disconnect();
      } catch (e) {}
      this.jetOsc = null;
    }
    this.jetGain = null;
  }

  // Sonic Boom Crash Sound
  public playSonicBoom() {
    this.stopJetEngine();
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    // Deep sub-bass boom
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.6);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }

  // Roulette Wheel Spin Click
  public playRouletteTick() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(800 + Math.random() * 200, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.03);
  }
}

export const sound = new SoundFX();
