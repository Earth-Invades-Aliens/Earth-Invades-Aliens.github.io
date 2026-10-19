'use strict';

/* ============================================================
   TURBO TOWER MUST FALL
   core.js — math, pixel font, synthesized audio
   ============================================================ */

const SCREEN_W = 640;
const SCREEN_H = 360;
const GROUND_Y = 322;
const TAU = Math.PI * 2;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const chance = (p) => Math.random() < p;
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const sign = (v) => (v < 0 ? -1 : 1);
const aabb = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
const pad = (n, len) => String(Math.max(0, Math.floor(n))).padStart(len, '0');
const approach = (v, target, delta) =>
  v < target ? Math.min(v + delta, target) : Math.max(v - delta, target);

function hash01(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/* ------------------------------------------------------------
   5x7 pixel font
   ------------------------------------------------------------ */

const FONT_GLYPHS = {
  'A': ['00100','01010','10001','11111','10001','10001','10001'],
  'B': ['11110','10001','10001','11110','10001','10001','11110'],
  'C': ['01111','10000','10000','10000','10000','10000','01111'],
  'D': ['11110','10001','10001','10001','10001','10001','11110'],
  'E': ['11111','10000','10000','11110','10000','10000','11111'],
  'F': ['11111','10000','10000','11110','10000','10000','10000'],
  'G': ['01111','10000','10000','10111','10001','10001','01111'],
  'H': ['10001','10001','10001','11111','10001','10001','10001'],
  'I': ['11111','00100','00100','00100','00100','00100','11111'],
  'J': ['00111','00010','00010','00010','10010','10010','01100'],
  'K': ['10001','10010','10100','11000','10100','10010','10001'],
  'L': ['10000','10000','10000','10000','10000','10000','11111'],
  'M': ['10001','11011','10101','10101','10001','10001','10001'],
  'N': ['10001','11001','10101','10011','10001','10001','10001'],
  'O': ['01110','10001','10001','10001','10001','10001','01110'],
  'P': ['11110','10001','10001','11110','10000','10000','10000'],
  'Q': ['01110','10001','10001','10001','10101','10010','01101'],
  'R': ['11110','10001','10001','11110','10100','10010','10001'],
  'S': ['01111','10000','10000','01110','00001','00001','11110'],
  'T': ['11111','00100','00100','00100','00100','00100','00100'],
  'U': ['10001','10001','10001','10001','10001','10001','01110'],
  'V': ['10001','10001','10001','10001','10001','01010','00100'],
  'W': ['10001','10001','10001','10101','10101','10101','01010'],
  'X': ['10001','10001','01010','00100','01010','10001','10001'],
  'Y': ['10001','10001','01010','00100','00100','00100','00100'],
  'Z': ['11111','00001','00010','00100','01000','10000','11111'],
  '0': ['01110','10011','10101','10101','10101','11001','01110'],
  '1': ['00100','01100','00100','00100','00100','00100','01110'],
  '2': ['01110','10001','00001','00010','00100','01000','11111'],
  '3': ['11110','00001','00001','01110','00001','00001','11110'],
  '4': ['00010','00110','01010','10010','11111','00010','00010'],
  '5': ['11111','10000','10000','11110','00001','00001','11110'],
  '6': ['01110','10000','10000','11110','10001','10001','01110'],
  '7': ['11111','00001','00010','00100','01000','01000','01000'],
  '8': ['01110','10001','10001','01110','10001','10001','01110'],
  '9': ['01110','10001','10001','01111','00001','00001','01110'],
  ' ': ['00000','00000','00000','00000','00000','00000','00000'],
  '.': ['00000','00000','00000','00000','00000','00100','00100'],
  ',': ['00000','00000','00000','00000','00100','00100','01000'],
  ':': ['00000','00100','00100','00000','00100','00100','00000'],
  ';': ['00000','00100','00100','00000','00100','00100','01000'],
  '!': ['00100','00100','00100','00100','00100','00000','00100'],
  '?': ['01110','10001','00001','00010','00100','00000','00100'],
  "'": ['00100','00100','00000','00000','00000','00000','00000'],
  '"': ['01010','01010','00000','00000','00000','00000','00000'],
  '-': ['00000','00000','00000','01110','00000','00000','00000'],
  '+': ['00000','00100','00100','11111','00100','00100','00000'],
  '/': ['00001','00010','00010','00100','01000','01000','10000'],
  '\\': ['10000','01000','01000','00100','00010','00010','00001'],
  '(': ['00010','00100','01000','01000','01000','00100','00010'],
  ')': ['01000','00100','00010','00010','00010','00100','01000'],
  '[': ['01110','01000','01000','01000','01000','01000','01110'],
  ']': ['01110','00010','00010','00010','00010','00010','01110'],
  '<': ['00010','00100','01000','10000','01000','00100','00010'],
  '>': ['01000','00100','00010','00001','00010','00100','01000'],
  '=': ['00000','00000','11111','00000','11111','00000','00000'],
  '%': ['11001','11010','00100','00100','01000','10110','00110'],
  '*': ['00000','10101','01110','11111','01110','10101','00000'],
  '#': ['01010','01010','11111','01010','11111','01010','01010'],
  '_': ['00000','00000','00000','00000','00000','00000','11111'],
  '|': ['00100','00100','00100','00100','00100','00100','00100'],
  '@': ['01110','10001','10111','10101','10111','10000','01110'],
  '$': ['00100','01111','10100','01110','00101','11110','00100'],
  '^': ['00100','01010','10001','00000','00000','00000','00000'],
  '~': ['00000','00000','01001','10110','00000','00000','00000'],
};

const FONT_ADVANCE = 6;
const FONT_HEIGHT = 7;
const _textCache = new Map();

function normalizeText(str) {
  return String(str)
    .toUpperCase()
    .replace(/×/g, 'X')
    .replace(/[—–]/g, '-')
    .replace(/[·•]/g, '*')
    .replace(/←/g, '<')
    .replace(/→/g, '>')
    .replace(/[^\x20-\x7E]/g, '?');
}

function textWidth(str, scale = 1) {
  const s = normalizeText(str);
  return Math.max(0, s.length * FONT_ADVANCE * scale - scale);
}

function makeTextCanvas(str, color, scale, outline, shadow) {
  const s = normalizeText(str);
  const padPx = outline ? scale : 0;
  const shadowPx = shadow ? scale : 0;
  const contentW = Math.max(1, s.length * FONT_ADVANCE * scale - scale);
  const w = contentW + padPx * 2 + shadowPx;
  const h = FONT_HEIGHT * scale + padPx * 2 + shadowPx;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;

  function paint(px, py, width, height, fill) {
    g.fillStyle = fill;
    g.fillRect(px, py, width, height);
  }

  const drawGlyphs = (dx, dy, fill) => {
    for (let i = 0; i < s.length; i++) {
      const glyph = FONT_GLYPHS[s[i]] || FONT_GLYPHS['?'];
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 5; col++) {
          if (glyph[row][col] === '1') {
            paint(
              padPx + dx + i * FONT_ADVANCE * scale + col * scale,
              padPx + dy + row * scale,
              scale,
              scale,
              fill
            );
          }
        }
      }
    }
  };

  if (outline) {
    const o = scale;
    drawGlyphs(-o, 0, '#08080f');
    drawGlyphs(o, 0, '#08080f');
    drawGlyphs(0, -o, '#08080f');
    drawGlyphs(0, o, '#08080f');
    drawGlyphs(-o, -o, '#08080f');
    drawGlyphs(o, -o, '#08080f');
    drawGlyphs(-o, o, '#08080f');
    drawGlyphs(o, o, '#08080f');
  }
  if (shadow) drawGlyphs(scale, scale, 'rgba(5,5,10,.72)');
  drawGlyphs(0, 0, color);
  return { canvas: c, pad: padPx, contentW };
}

function drawText(str, x, y, opts) {
  const o = opts || {};
  const scale = o.scale || 1;
  const color = o.color || '#f8f4e3';
  const outline = !!o.outline;
  const shadow = !!o.shadow;
  const alpha = o.alpha == null ? 1 : o.alpha;
  const key = color + '|' + scale + '|' + (outline ? 1 : 0) + '|' + (shadow ? 1 : 0) + '|' + normalizeText(str);
  let entry = _textCache.get(key);
  if (!entry) {
    if (_textCache.size > 420) _textCache.clear();
    entry = makeTextCanvas(str, color, scale, outline, shadow);
    _textCache.set(key, entry);
  }
  const padPx = entry.pad;
  let dx = Math.round(x) - padPx;
  const w = entry.contentW;
  if (o.align === 'center') dx = Math.round(x - w / 2) - padPx;
  else if (o.align === 'right') dx = Math.round(x - w) - padPx;
  const dy = Math.round(y) - padPx;
  const prevAlpha = ctx.globalAlpha;
  ctx.globalAlpha = prevAlpha * alpha;
  ctx.drawImage(entry.canvas, dx, dy);
  ctx.globalAlpha = prevAlpha;
  return w;
}

/* ------------------------------------------------------------
   Audio — tiny synthesized arcade soundtrack + SFX
   ------------------------------------------------------------ */

const MUSIC_DATA = {
  title:   { root: 45, scale: [0, 2, 3, 5, 7, 9, 10], tempo: 92,  lead: 0.62, bass: 0.55, drums: 0.45 },
  lobby:   { root: 45, scale: [0, 2, 3, 5, 7, 9, 10], tempo: 132, lead: 0.70, bass: 0.72, drums: 0.72 },
  factory: { root: 41, scale: [0, 2, 3, 5, 7, 8, 10], tempo: 138, lead: 0.66, bass: 0.78, drums: 0.80 },
  server:  { root: 40, scale: [0, 2, 3, 7, 8, 10],    tempo: 126, lead: 0.58, bass: 0.68, drums: 0.58 },
  rooftop: { root: 38, scale: [0, 2, 3, 5, 7, 10],    tempo: 146, lead: 0.76, bass: 0.78, drums: 0.82 },
  boss:    { root: 36, scale: [0, 1, 3, 6, 7, 10],    tempo: 152, lead: 0.74, bass: 0.86, drums: 0.88 },
  victory: { root: 48, scale: [0, 4, 7, 9, 11],       tempo: 112, lead: 0.78, bass: 0.55, drums: 0.42 },
  danger:  { root: 34, scale: [0, 1, 3, 6, 8, 10],    tempo: 158, lead: 0.70, bass: 0.82, drums: 0.86 },
};

const AudioSys = {
  ctx: null,
  master: null,
  sfxBus: null,
  musicBus: null,
  noiseBuf: null,
  muted: false,
  musicOn: false,
  zone: 'title',
  step: 0,
  nextNote: 0,
  timer: null,
  lastHit: 0,
  lastShot: 0,

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.72;
      this.master.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.55;
      this.sfxBus.connect(this.master);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.22;
      this.musicBus.connect(this.master);

      const len = Math.floor(this.ctx.sampleRate * 0.6);
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

      this.startMusic(this.zone || 'title');
    } catch (e) {
      this.ctx = null;
    }
  },

  setMuted(m) {
    this.muted = !!m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.72, this.ctx.currentTime, 0.025);
    }
  },

  tone(freq, dur, type, gain, slideTo, dest, delay) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + (delay || 0);
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(Math.max(20, freq), t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain || 0.08), t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(0.02, dur));
    osc.connect(g).connect(dest || this.sfxBus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  },

  noise(dur, gain, filterType, freq, endFreq, dest, delay) {
    if (!this.ctx || this.muted || !this.noiseBuf) return;
    const t0 = this.ctx.currentTime + (delay || 0);
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = filterType || 'lowpass';
    f.frequency.setValueAtTime(freq || 1200, t0);
    if (endFreq) f.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), t0 + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain || 0.08), t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(dest || this.sfxBus);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  },

  shoot(kind) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastShot < 0.018) return;
    this.lastShot = now;
    if (kind === 'shotgun') {
      this.noise(0.18, 0.16, 'lowpass', 2400, 240);
      this.tone(120, 0.16, 'triangle', 0.13, 48);
    } else if (kind === 'smg') {
      this.tone(rt(560, 700), 0.035, 'square', 0.045, 220);
      this.noise(0.035, 0.04, 'highpass', 900);
    } else if (kind === 'rocket') {
      this.noise(0.28, 0.13, 'lowpass', 900, 120);
      this.tone(110, 0.24, 'sawtooth', 0.07, 48);
    } else if (kind === 'rail') {
      this.tone(1800, 0.16, 'sawtooth', 0.08, 280);
      this.tone(2400, 0.1, 'sine', 0.06, 800);
      this.noise(0.1, 0.05, 'highpass', 2400);
    } else {
      this.tone(rt(430, 520), 0.075, 'square', 0.075, 130);
      this.noise(0.045, 0.035, 'highpass', 1000);
    }
  },

  hit() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastHit < 0.03) return;
    this.lastHit = now;
    this.tone(rt(900, 1150), 0.035, 'square', 0.035, 500);
    this.noise(0.03, 0.03, 'highpass', 1600);
  },

  kill() {
    this.tone(300, 0.14, 'square', 0.08, 70);
    this.noise(0.14, 0.07, 'lowpass', 1400, 300);
  },

  explosion(big) {
    this.noise(big ? 0.55 : 0.34, big ? 0.26 : 0.16, 'lowpass', big ? 1100 : 1500, 70);
    this.tone(big ? 90 : 110, big ? 0.5 : 0.28, 'sine', big ? 0.2 : 0.12, 28);
    this.tone(big ? 160 : 200, 0.16, 'sawtooth', 0.05, 40);
  },

  hurt() {
    this.noise(0.18, 0.13, 'lowpass', 700, 120);
    this.tone(190, 0.28, 'sawtooth', 0.1, 60);
  },

  die() {
    this.noise(0.9, 0.24, 'lowpass', 1500, 60);
    this.tone(220, 0.8, 'sawtooth', 0.12, 35);
    this.tone(110, 0.9, 'square', 0.08, 25);
  },

  jump() {
    this.tone(260, 0.1, 'square', 0.055, 460);
  },

  land() {
    this.noise(0.06, 0.04, 'lowpass', 500);
  },

  dash() {
    this.noise(0.2, 0.1, 'bandpass', 600, 2400);
    this.tone(180, 0.16, 'sawtooth', 0.045, 600);
  },

  pickup() {
    const n = [523, 659, 784, 1046];
    n.forEach((f, i) => this.tone(f, 0.09, 'square', 0.055, null, null, i * 0.055));
  },

  health() {
    const n = [392, 523, 659];
    n.forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.075, null, null, i * 0.07));
  },

  ui() {
    this.tone(740, 0.045, 'square', 0.035, 980);
  },

  empty() {
    this.tone(160, 0.04, 'square', 0.035, 90);
  },

  bank() {
    const n = [523, 659, 784, 1046, 1318];
    n.forEach((f, i) => this.tone(f, 0.12, 'square', 0.06, null, null, i * 0.075));
  },

  risk() {
    this.tone(130, 0.5, 'sawtooth', 0.08, 520);
    this.tone(260, 0.5, 'square', 0.045, 1040);
    this.noise(0.5, 0.04, 'bandpass', 300, 2000);
  },

  bossRoar() {
    this.tone(70, 1.1, 'sawtooth', 0.16, 38);
    this.tone(105, 0.9, 'square', 0.07, 44);
    this.noise(0.9, 0.12, 'lowpass', 600, 100);
  },

  beam() {
    this.tone(1200, 0.22, 'sawtooth', 0.08, 320);
    this.noise(0.22, 0.06, 'bandpass', 2200, 600);
  },

  alarm() {
    this.tone(880, 0.12, 'square', 0.04, 660);
    this.tone(660, 0.12, 'square', 0.04, 880, null, 0.14);
  },

  wave() {
    this.tone(196, 0.1, 'square', 0.05, 392);
    this.tone(392, 0.16, 'triangle', 0.05, 784, null, 0.1);
  },

  setZone(zone) {
    this.zone = zone;
    if (!this.ctx) return;
    if (!this.musicOn) this.startMusic(zone);
  },

  startMusic(zone) {
    if (!this.ctx) return;
    if (zone) this.zone = zone;
    this.musicOn = true;
    this.step = 0;
    this.nextNote = this.ctx.currentTime + 0.08;
    if (!this.timer) {
      this.timer = setInterval(() => this.scheduleMusic(), 30);
    }
  },

  stopMusic() {
    this.musicOn = false;
  },

  scheduleMusic() {
    if (!this.ctx || !this.musicOn) return;
    const now = this.ctx.currentTime;
    let guard = 0;
    while (this.nextNote < now + 0.14 && guard < 24) {
      this.playStep(this.step, this.nextNote);
      const d = MUSIC_DATA[this.zone] || MUSIC_DATA.lobby;
      this.nextNote += 60 / d.tempo / 4;
      this.step++;
      guard++;
    }
  },

  playStep(step, when) {
    const d = MUSIC_DATA[this.zone] || MUSIC_DATA.lobby;
    const s = step % 16;
    const bar = Math.floor(step / 16) % 4;
    const delay = Math.max(0, when - this.ctx.currentTime);
    const mtof = (n) => 440 * Math.pow(2, (n - 69) / 12);

    if (s % 4 === 0) {
      const k = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      k.type = 'sine';
      k.frequency.setValueAtTime(150, when);
      k.frequency.exponentialRampToValueAtTime(42, when + 0.16);
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(0.13 * d.drums, when + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
      k.connect(g).connect(this.musicBus);
      k.start(when);
      k.stop(when + 0.25);
    }
    if (s === 4 || s === 12) {
      this.noise(0.14, 0.055 * d.drums, 'bandpass', 1800, 700, this.musicBus, delay);
    }
    if (s % 2 === 1) {
      this.noise(0.03, 0.018 * d.drums, 'highpass', 6000, null, this.musicBus, delay);
    }

    const bassPattern = [0, -1, -1, 0, -1, 3, -1, 0, 0, -1, -1, 5, -1, 3, -1, 0];
    const bd = bassPattern[s];
    if (bd >= 0) {
      const oct = s === 8 ? 0 : s === 14 ? 12 : 0;
      const n = d.root + d.scale[bd % d.scale.length] + oct;
      this.tone(mtof(n), 0.2, 'triangle', 0.075 * d.bass, null, this.musicBus, delay);
      this.tone(mtof(n - 12), 0.22, 'square', 0.022 * d.bass, null, this.musicBus, delay);
    }

    if (s % 2 === 0) {
      const idx = (s * 3 + bar * 2 + Math.floor(step / 16)) % d.scale.length;
      const n = d.root + 24 + d.scale[idx] + (s === 10 ? 12 : 0);
      this.tone(mtof(n), 0.09, 'square', 0.026 * d.lead, null, this.musicBus, delay);
    }
    if (s === 0 && bar === 3) {
      this.tone(mtof(d.root + 12), 0.5, 'triangle', 0.04 * d.lead, null, this.musicBus, delay);
    }
  },
};

function rt(a, b) {
  return a + Math.random() * (b - a);
}
