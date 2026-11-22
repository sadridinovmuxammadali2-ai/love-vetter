/* ===================================================
   LOVE LETTER - ROMANTIC AUDIO ENGINE (Web Audio API)
   Works 100% offline, zero external dependencies!
   =================================================== */

class RomanticAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlayingMusic = false;
    this.musicTimer = null;
    this.musicStep = 0;
    this.isMuted = false;

    // Romantic music box melody (frequencies in Hz)
    // C5, D5, E5, G5, A5, B5, C6, E6
    this.melody = [
      // Akkord 1: C major (C - E - G - B - C)
      { note: 523.25, dur: 0.6 }, // C5
      { note: 659.25, dur: 0.6 }, // E5
      { note: 783.99, dur: 0.8 }, // G5
      { note: 987.77, dur: 1.0 }, // B5
      { note: 1046.50, dur: 1.2 }, // C6

      // Akkord 2: A minor (A - C - E - G)
      { note: 440.00, dur: 0.6 }, // A4
      { note: 523.25, dur: 0.6 }, // C5
      { note: 659.25, dur: 0.8 }, // E5
      { note: 783.99, dur: 1.2 }, // G5

      // Akkord 3: F major (F - A - C - E)
      { note: 349.23, dur: 0.6 }, // F4
      { note: 440.00, dur: 0.6 }, // A4
      { note: 523.25, dur: 0.8 }, // C5
      { note: 659.25, dur: 1.2 }, // E5

      // Akkord 4: G major (G - B - D - G)
      { note: 392.00, dur: 0.6 }, // G4
      { note: 493.88, dur: 0.6 }, // B4
      { note: 587.33, dur: 0.8 }, // D5
      { note: 783.99, dur: 1.4 }  // G5
    ];
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Chime / Music Box note
  playChime(freq, duration = 1.0, gainVal = 0.15) {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Sine wave with slight triangle overtone for music-box feel
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(gainVal, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  // Envelope rustle / paper opening sound
  playPaperRustle() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // White noise with decay
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      // Bandpass filter to simulate paper crinkle
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(1.8, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
    } catch (e) {
      console.warn(e);
    }
  }

  // Wax seal pop sound
  playSealBreak() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.warn(e);
    }
  }

  // Sparkling magical harp sound
  playSparkleHarp() {
    if (this.isMuted || !this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C E G C E
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playChime(freq, 1.2, 0.12);
      }, idx * 70);
    });
  }

  // Celebration fanfare on "Ha, albatta!"
  playCelebration() {
    if (this.isMuted || !this.ctx) return;
    const celebrationNotes = [
      { f: 523.25, d: 0.15 }, // C
      { f: 659.25, d: 0.15 }, // E
      { f: 783.99, d: 0.15 }, // G
      { f: 1046.50, d: 0.5 }, // C (high)
      { f: 1318.51, d: 0.8 }  // E (high)
    ];

    let delay = 0;
    celebrationNotes.forEach(item => {
      setTimeout(() => {
        this.playChime(item.f, item.d * 2.2, 0.2);
      }, delay);
      delay += item.d * 800;
    });
  }

  // Background romantic music box loop
  startMusic() {
    if (this.isPlayingMusic) return;
    this.init();
    this.isPlayingMusic = true;
    this.musicStep = 0;
    this._playNextNote();
  }

  _playNextNote() {
    if (!this.isPlayingMusic) return;

    const current = this.melody[this.musicStep];
    this.playChime(current.note, 1.5, 0.08);

    this.musicStep = (this.musicStep + 1) % this.melody.length;
    const interval = (current.dur || 0.6) * 1000;

    this.musicTimer = setTimeout(() => {
      this._playNextNote();
    }, interval);
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  toggleMusic() {
    if (this.isPlayingMusic) {
      this.stopMusic();
      return false;
    } else {
      this.startMusic();
      return true;
    }
  }
}

// Global instance
window.romanticAudio = new RomanticAudioEngine();

