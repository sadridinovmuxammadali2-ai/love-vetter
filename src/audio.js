/* ===================================================
   LOVE LETTER - ROMANTIC AUDIO ENGINE (Web Audio API)
   Soft piano lullaby with arpeggios, warm pad and reverb.
   Works 100% offline, zero external dependencies.
   =================================================== */

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

const BEAT = 60 / 76; // a slow, tender waltz (3/4)

// Chord voicings (MIDI): [bass, arp1, arp2, arp3]
const CHORDS = {
  Cmaj7: [48, 55, 64, 71],
  Am7: [45, 52, 60, 67],
  Fmaj7: [41, 48, 57, 64],
  G: [43, 50, 59, 62],
  Em7: [40, 47, 55, 62],
  C_E: [40, 48, 55, 64],
  Dm7: [38, 45, 53, 60],
  Fm: [41, 48, 56, 60],
  C: [36, 55, 64, 67],
};

// 16 bars in C major, 3 beats each: [chord segments [name, beats]], [melody [midi, beats]]
const SONG = [
  [[['Cmaj7', 3]], [[76, 1.5], [74, 0.5], [76, 1]]],
  [[['Am7', 3]], [[79, 2], [76, 1]]],
  [[['Fmaj7', 3]], [[77, 1.5], [76, 0.5], [74, 1]]],
  [[['G', 3]], [[74, 2], [71, 1]]],
  [[['Cmaj7', 3]], [[72, 1], [76, 1], [79, 1]]],
  [[['Em7', 3]], [[83, 2], [79, 1]]],
  [[['Fmaj7', 3]], [[81, 1.5], [79, 0.5], [77, 1]]],
  [[['G', 3]], [[79, 3]]],
  [[['Am7', 3]], [[81, 1.5], [79, 0.5], [76, 1]]],
  [[['Em7', 3]], [[79, 2], [76, 1]]],
  [[['Fmaj7', 3]], [[77, 1], [81, 1], [84, 1]]],
  [[['C_E', 3]], [[83, 1.5], [81, 0.5], [79, 1]]],
  [[['Dm7', 3]], [[77, 1.5], [76, 0.5], [74, 1]]],
  [[['G', 3]], [[79, 2], [74, 1]]],
  [[['Fmaj7', 1.5], ['Fm', 1.5]], [[81, 1.5], [80, 1.5]]],
  [[['C', 3]], [[76, 1], [74, 1], [72, 1]]],
];

const ARP = [0, 1, 2, 3, 2, 1]; // eighth-note waltz pattern over the chord

class RomanticAudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.isPlayingMusic = false;
    this.isMuted = false;
    this.musicTimer = null;
    this.musicBus = null;
    this.trackUrl = null; // her song, if one was uploaded
    this.track = null;
    this._fade = null;
  }

  // Use an uploaded song instead of the built-in piano (null = built-in)
  setTrack(url) {
    if (url === this.trackUrl) return;
    const wasPlaying = this.isPlayingMusic;
    if (wasPlaying) this.stopMusic();
    this.trackUrl = url || null;
    if (this.track) { this.track.pause(); this.track = null; }
    if (wasPlaying) this.startMusic();
  }

  _fadeTrack(to, ms, done) {
    const el = this.track;
    if (!el) return;
    clearInterval(this._fade);
    const from = el.volume;
    const steps = Math.max(1, Math.round(ms / 50));
    let i = 0;
    this._fade = setInterval(() => {
      i += 1;
      el.volume = Math.min(1, Math.max(0, from + ((to - from) * i) / steps));
      if (i >= steps) { clearInterval(this._fade); done?.(); }
    }, 50);
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this._buildMaster();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  _buildMaster() {
    const ctx = this.ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 3;
    comp.connect(ctx.destination);

    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(comp);

    // Reverb: generated stereo impulse response
    const len = Math.floor(ctx.sampleRate * 3.2);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    const verb = ctx.createConvolver();
    verb.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.38;
    this.master.connect(verb);
    verb.connect(wet);
    wet.connect(comp);
  }

  // Soft piano-like note built from decaying harmonics
  _piano(dest, midi, t, dur, vel) {
    const ctx = this.ctx;
    const f = mtof(midi);
    const partials = [[1, 1], [2, 0.42], [3, 0.16], [4, 0.07], [5, 0.03]];
    partials.forEach(([h, a], i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * h;
      o.detune.value = (Math.random() - 0.5) * 4;
      const g = ctx.createGain();
      const decay = dur / (1 + i * 0.9);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vel * a, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      o.connect(g);
      g.connect(dest);
      o.start(t);
      o.stop(t + decay + 0.05);
    });
  }

  // Warm sustained chord underneath
  _pad(dest, midis, t, len) {
    const ctx = this.ctx;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.016, t + 1.0);
    g.gain.setValueAtTime(0.016, t + len - 0.2);
    g.gain.linearRampToValueAtTime(0, t + len + 0.9);
    filter.connect(g);
    g.connect(dest);
    midis.forEach((m) => {
      [-6, 6].forEach((det) => {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = mtof(m);
        o.detune.value = det;
        o.connect(filter);
        o.start(t);
        o.stop(t + len + 1);
      });
    });
  }

  _scheduleBar(bar, t0, dest, pass) {
    const [segments, melody] = bar;
    let t = t0;
    segments.forEach(([name, beats]) => {
      const chord = CHORDS[name];
      this._pad(dest, chord.slice(1), t, beats * BEAT);
      const eighths = beats * 2;
      for (let i = 0; i < eighths; i++) {
        const idx = ARP[i % ARP.length];
        const isBass = idx === 0;
        this._piano(dest, chord[idx], t + i * BEAT * 0.5, isBass ? 3.2 : 1.8, isBass ? 0.07 : 0.042);
      }
      t += beats * BEAT;
    });
    let mt = t0;
    melody.forEach(([midi, beats]) => {
      this._piano(dest, midi, mt, Math.max(1.6, beats * BEAT * 1.6), 0.11);
      // every second time round, a soft music-box echo an octave higher
      if (pass % 2 === 1) this._piano(dest, midi + 12, mt + 0.02, 1.4, 0.035);
      mt += beats * BEAT;
    });
  }

  _tick() {
    if (!this.isPlayingMusic) return;
    while (this._nextBarTime < this.ctx.currentTime + 0.6) {
      const bar = SONG[this._bar];
      this._scheduleBar(bar, this._nextBarTime, this.musicBus, this._pass);
      this._nextBarTime += bar[0].reduce((n, [, beats]) => n + beats, 0) * BEAT;
      this._bar = (this._bar + 1) % SONG.length;
      if (this._bar === 0) this._pass += 1;
    }
  }

  // Chime / music box note (sound effects)
  playChime(freq, duration = 1.0, gainVal = 0.15) {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(gainVal, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  playPaperRustle() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(1.8, now);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
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
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.warn(e);
    }
  }

  // Sparkling harp run
  playSparkleHarp() {
    if (this.isMuted || !this.ctx) return;
    const notes = [72, 76, 79, 84, 88]; // C E G C E
    const now = this.ctx.currentTime;
    notes.forEach((m, i) => this._piano(this.master, m, now + i * 0.07, 1.6, 0.08));
  }

  playCelebration() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    [[72, 0], [76, 0.12], [79, 0.24], [84, 0.36], [88, 0.6]].forEach(([m, d]) =>
      this._piano(this.master, m, now + d, 2, 0.14)
    );
  }

  startMusic() {
    if (this.isPlayingMusic) return;
    if (this.trackUrl) {
      if (!this.track) {
        this.track = new Audio(this.trackUrl);
        this.track.loop = true;
        this.track.preload = 'auto';
      }
      this.isPlayingMusic = true;
      this.track.volume = 0;
      this.track.play().then(() => this._fadeTrack(0.8, 2500)).catch(() => { this.isPlayingMusic = false; });
      return;
    }
    this.init();
    if (!this.ctx) return;
    this.isPlayingMusic = true;
    const now = this.ctx.currentTime;
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.setValueAtTime(0, now);
    this.musicBus.gain.linearRampToValueAtTime(1, now + 2.5);
    this.musicBus.connect(this.master);
    this._bar = 0;
    this._pass = 0;
    this._nextBarTime = now + 0.15;
    this._tick();
    this.musicTimer = setInterval(() => this._tick(), 200);
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.track) {
      const el = this.track;
      this._fadeTrack(0, 800, () => el.pause());
    }
    clearInterval(this.musicTimer);
    this.musicTimer = null;
    if (this.musicBus && this.ctx) {
      // fade out whatever is already scheduled, then drop it
      const bus = this.musicBus;
      const now = this.ctx.currentTime;
      bus.gain.cancelScheduledValues(now);
      bus.gain.setValueAtTime(bus.gain.value, now);
      bus.gain.linearRampToValueAtTime(0, now + 0.8);
      setTimeout(() => bus.disconnect(), 6000);
      this.musicBus = null;
    }
  }

  toggleMusic() {
    if (this.isPlayingMusic) {
      this.stopMusic();
      return false;
    }
    this.startMusic();
    return true;
  }
}

export const audio = new RomanticAudioEngine();
