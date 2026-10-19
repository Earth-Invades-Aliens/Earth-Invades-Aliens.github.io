'use strict';

/* ============================================================
   game.js — TURBO TOWER MUST FALL
   ============================================================ */

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const screenEl = document.getElementById('screen');
const powerHint = document.getElementById('powerHint');

const SAVE_KEY = 'ttmf_save_v3';
const ARENA_W = 960;

const save = { best: 0, bestFloor: 1, muted: false, runs: 0 };
try {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) Object.assign(save, JSON.parse(raw));
} catch (e) { /* file:// with storage disabled is fine */ }

function persist() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch (e) { /* ignore */ }
}

const keys = new Set();
const mouse = { x: SCREEN_W / 2, y: SCREEN_H / 2, down: false, inside: false };

const game = {
  state: 'title',
  stateT: 0,
  t: 0,
  titleT: 0,
  floorIndex: 0,
  floor: null,
  player: null,
  score: 0,
  pot: 0,
  mult: 1,
  kills: 0,
  runTime: 0,
  combo: 0,
  comboT: 0,
  comboPulse: 0,
  bestAtStart: 0,
  enemies: [],
  bullets: [],
  ebullets: [],
  particles: [],
  pickups: [],
  texts: [],
  spawners: [],
  warnings: [],
  beams: [],
  rings: [],
  ghosts: [],
  boss: null,
  wave: 0,
  waveTotal: 0,
  waveActive: false,
  waveClearDelay: 0,
  floorCleared: false,
  elevatorOpen: false,
  cam: 0,
  shake: 0,
  hitstop: 0,
  slowmo: 0,
  flash: 0,
  flashColor: '#ffffff',
  banner: null,
  aim: { x: 320, y: 180 },
  deadT: 0,
  lostPot: 0,
  victoryGain: 0,
  victoryDelay: 0,
  floorTime: 0,
  pauseFrom: 'play',
  riskHover: 0,
  newBest: false,
  bobT: 0,
  spawnSerial: 0,
};

const UI = {
  title: {
    start: { x: 202, y: 186, w: 236, h: 24 },
    how: { x: 202, y: 214, w: 236, h: 22 },
    mute: { x: 202, y: 242, w: 236, h: 22 },
  },
  pause: {
    resume: { x: 220, y: 188, w: 200, h: 22 },
    restart: { x: 220, y: 216, w: 200, h: 22 },
    mute: { x: 220, y: 244, w: 200, h: 22 },
    quit: { x: 220, y: 272, w: 200, h: 22 },
  },
  risk: {
    bank: { x: 46, y: 176, w: 254, h: 120 },
    risk: { x: 340, y: 176, w: 254, h: 120 },
  },
  end: {
    main: { x: 220, y: 272, w: 200, h: 24 },
    quit: { x: 220, y: 302, w: 200, h: 20 },
  },
};

function inRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function hover(r) {
  return mouse.inside && inRect(mouse.x, mouse.y, r);
}

function makePlayer() {
  return {
    x: 70, y: GROUND_Y - 18, w: 12, h: 18, vx: 0, vy: 0,
    onGround: false, coyote: 0, jumpBuf: 0, facing: 1,
    hp: PLAYER_TUNE.maxHp, maxHp: PLAYER_TUNE.maxHp,
    weapon: 'pistol', ammo: Infinity,
    fireCd: 0, invuln: 0, hurtFlash: 0, dashT: 0, dashCd: 0,
    dashDir: 1, aim: 0, recoil: 0, muzzleT: 0, walkT: 0,
    dead: false, inLift: false,
  };
}

function setupTitleWorld() {
  game.state = 'title';
  game.stateT = 0;
  game.titleT = 0;
  game.floorIndex = 0;
  game.floor = FLOORS[0];
  game.floor.width = ARENA_W;
  game.player = makePlayer();
  game.player.x = 122;
  game.player.y = GROUND_Y - 18;
  game.player.onGround = true;
  game.player.aim = -0.9;
  game.cam = 0;
  game.enemies = [];
  game.bullets = [];
  game.ebullets = [];
  game.particles = [];
  game.pickups = [];
  game.texts = [];
  game.spawners = [];
  game.warnings = [];
  game.beams = [];
  game.rings = [];
  game.ghosts = [];
  game.boss = null;
  game.waveActive = false;
  game.floorCleared = false;
  game.elevatorOpen = false;
  game.banner = null;
  game.score = 0;
  game.pot = 0;
  game.mult = 1;
  game.combo = 0;
  game.comboT = 0;
}

/* ------------------------------------------------------------
   Input
   ------------------------------------------------------------ */

function updateMouse(e) {
  const r = canvas.getBoundingClientRect();
  const scale = Math.min(r.width / SCREEN_W, r.height / SCREEN_H);
  const cw = SCREEN_W * scale;
  const ch = SCREEN_H * scale;
  const ox = (r.width - cw) / 2;
  const oy = (r.height - ch) / 2;
  mouse.x = clamp((e.clientX - r.left - ox) / scale, 0, SCREEN_W);
  mouse.y = clamp((e.clientY - r.top - oy) / scale, 0, SCREEN_H);
  mouse.inside = true;
}

function powerOn() {
  AudioSys.init();
  if (AudioSys.ctx) {
    if (game.state === 'title' || game.state === 'how') AudioSys.setZone('title');
    else if (game.floor) AudioSys.setZone(game.floor.zone);
  }
  if (powerHint) powerHint.classList.add('hidden');
}

function toggleMute() {
  save.muted = !save.muted;
  AudioSys.setMuted(save.muted);
  persist();
  AudioSys.ui();
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    if (screenEl.requestFullscreen) screenEl.requestFullscreen().catch(() => {});
  } else if (document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
}

function togglePause() {
  if (game.state === 'paused') {
    game.state = game.pauseFrom || 'play';
    game.stateT = 0;
    mouse.down = false;
    setMusicDuck(false);
    AudioSys.ui();
  } else if (game.state === 'play' || game.state === 'intro') {
    game.pauseFrom = game.state;
    game.state = 'paused';
    game.stateT = 0;
    setMusicDuck(true);
    AudioSys.ui();
  }
}

function setMusicDuck(on) {
  if (AudioSys.ctx && AudioSys.musicBus) {
    AudioSys.musicBus.gain.setTargetAtTime(on ? 0.055 : 0.22, AudioSys.ctx.currentTime, 0.06);
  }
}

document.addEventListener('keydown', (e) => {
  const code = e.code;
  if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(code)) {
    e.preventDefault();
  }
  if (e.repeat) {
    keys.add(code);
    return;
  }
  powerOn();
  keys.add(code);
  AudioSys.init();

  if (code === 'KeyM') {
    toggleMute();
    return;
  }
  if (code === 'KeyF') {
    toggleFullscreen();
    return;
  }

  const st = game.state;

  if (st === 'title') {
    if (code === 'Enter' || code === 'Space' || code === 'NumpadEnter') startRun();
    else if (code === 'KeyH') { game.state = 'how'; game.stateT = 0; AudioSys.ui(); }
    else if (code === 'Escape') { /* no-op */ }
    return;
  }
  if (st === 'how') {
    if (code === 'Escape' || code === 'Enter' || code === 'Space' || code === 'KeyH') {
      game.state = 'title';
      game.stateT = 0;
      AudioSys.ui();
    }
    return;
  }
  if (st === 'intro') {
    if ((code === 'Enter' || code === 'Space') && game.stateT > 0.55) beginPlay();
    else if (code === 'Escape') togglePause();
    return;
  }
  if (st === 'play') {
    if (code === 'Escape' || code === 'KeyP') { togglePause(); return; }
    if (code === 'Space') {
      if (game.player && !game.player.dead) game.player.jumpBuf = 0.12;
      return;
    }
    if (code === 'ShiftLeft' || code === 'ShiftRight') {
      tryDash();
      return;
    }
    if (code === 'KeyE') {
      if (game.floorCleared && game.player.x + game.player.w / 2 > game.floor.width - 166) {
        boardLift();
      }
      return;
    }
    return;
  }
  if (st === 'paused') {
    if (code === 'Escape' || code === 'KeyP') togglePause();
    else if (code === 'KeyR') startRun();
    else if (code === 'KeyQ') quitToTitle();
    else if (code === 'KeyM') toggleMute();
    return;
  }
  if (st === 'risk') {
    if (code === 'Digit1' || code === 'Numpad1' || code === 'KeyE') chooseBank();
    else if (code === 'Digit2' || code === 'Numpad2' || code === 'KeyR') chooseRisk();
    return;
  }
  if (st === 'gameover' || st === 'victory') {
    if (code === 'KeyR' || code === 'Enter' || code === 'Space' || code === 'NumpadEnter') startRun();
    else if (code === 'Escape') quitToTitle();
    return;
  }
});

document.addEventListener('keyup', (e) => {
  keys.delete(e.code);
  if (e.code === 'Space' && game.player && game.player.vy < 0 && game.state === 'play') {
    game.player.vy *= 0.52;
  }
});

window.addEventListener('blur', () => {
  keys.clear();
  mouse.down = false;
  if (game.state === 'play' || game.state === 'intro') togglePause();
});

canvas.addEventListener('mousemove', (e) => {
  updateMouse(e);
});

canvas.addEventListener('mouseleave', () => {
  mouse.inside = false;
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

canvas.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  e.preventDefault();
  updateMouse(e);
  powerOn();
  AudioSys.init();
  mouse.down = true;
  handlePointerDown();
});

window.addEventListener('pointerup', () => {
  mouse.down = false;
});

function handlePointerDown() {
  const mx = mouse.x;
  const my = mouse.y;
  const st = game.state;

  if (st === 'title') {
    if (inRect(mx, my, UI.title.mute)) { toggleMute(); return; }
    if (inRect(mx, my, UI.title.how)) { game.state = 'how'; game.stateT = 0; AudioSys.ui(); return; }
    startRun();
    return;
  }
  if (st === 'how') {
    game.state = 'title';
    game.stateT = 0;
    AudioSys.ui();
    return;
  }
  if (st === 'paused') {
    if (inRect(mx, my, UI.pause.resume)) togglePause();
    else if (inRect(mx, my, UI.pause.restart)) startRun();
    else if (inRect(mx, my, UI.pause.mute)) toggleMute();
    else if (inRect(mx, my, UI.pause.quit)) quitToTitle();
    return;
  }
  if (st === 'risk') {
    if (inRect(mx, my, UI.risk.bank)) chooseBank();
    else if (inRect(mx, my, UI.risk.risk)) chooseRisk();
    return;
  }
  if (st === 'gameover' || st === 'victory') {
    if (inRect(mx, my, UI.end.main)) startRun();
    else if (inRect(mx, my, UI.end.quit)) quitToTitle();
    return;
  }
  if (st === 'intro') {
    if (game.stateT > 0.55) beginPlay();
  }
}

/* ------------------------------------------------------------
   Run / floor lifecycle
   ------------------------------------------------------------ */

function startRun() {
  if (powerHint) powerHint.classList.add('hidden');
  AudioSys.init();
  if (AudioSys.ctx) {
    AudioSys.setZone('lobby');
    AudioSys.startMusic('lobby');
  }
  game.bestAtStart = save.best;
  game.score = 0;
  game.pot = 0;
  game.mult = 1;
  game.kills = 0;
  game.runTime = 0;
  game.combo = 0;
  game.comboT = 0;
  game.comboPulse = 0;
  game.floorIndex = 0;
  game.boss = null;
  game.newBest = false;
  game.lostPot = 0;
  game.victoryGain = 0;
  game.player = makePlayer();
  game.player.hp = PLAYER_TUNE.maxHp;
  game.player.weapon = 'pistol';
  game.player.ammo = Infinity;
  game.wave = 0;
  game.waveTotal = 0;
  game.waveActive = false;
  game.floorCleared = false;
  game.elevatorOpen = false;
  game.banner = null;
  game.pickups = [];
  game.enemies = [];
  game.bullets = [];
  game.ebullets = [];
  game.particles = [];
  game.texts = [];
  game.spawners = [];
  game.warnings = [];
  game.beams = [];
  game.rings = [];
  game.ghosts = [];
  game.deadT = 0;
  game.victoryDelay = 0;
  game.hitstop = 0;
  game.slowmo = 0;
  game.spawnSerial = 0;
  mouse.down = false;
  setMusicDuck(false);
  loadFloor(0);
}

function loadFloor(index) {
  const floor = FLOORS[index];
  floor.width = ARENA_W;
  game.floorIndex = index;
  game.floor = floor;
  game.state = 'intro';
  game.stateT = 0;
  game.floorTime = 0;
  game.spawnSerial = 0;
  game.wave = 0;
  game.waveTotal = floor.boss ? 1 : floor.waves.length;
  game.waveActive = false;
  game.waveClearDelay = 0;
  game.floorCleared = false;
  game.elevatorOpen = false;
  game.boss = null;
  game.enemies = [];
  game.bullets = [];
  game.ebullets = [];
  game.spawners = [];
  game.warnings = [];
  game.beams = [];
  game.rings = [];
  game.ghosts = [];
  game.particles = [];
  game.texts = [];
  game.pickups = [];
  game.banner = null;
  game.victoryDelay = 0;
  game.combo = 0;
  game.comboT = 0;
  game.shake = 0;
  game.flash = 0;
  game.deadT = 0;

  const p = game.player;
  p.x = floor.boss ? 156 : 70;
  p.y = GROUND_Y - p.h;
  p.vx = 0;
  p.vy = 0;
  p.onGround = true;
  p.coyote = 0.1;
  p.jumpBuf = 0;
  p.dashT = 0;
  p.dashCd = 0;
  p.fireCd = 0;
  p.invuln = 1.4;
  p.hurtFlash = 0;
  p.dead = false;
  p.inLift = false;
  p.aim = 0;
  game.cam = clamp(p.x + p.w / 2 - SCREEN_W / 2, 0, ARENA_W - SCREEN_W);

  addPickup({
    type: 'weapon',
    weapon: randomDrop(),
    x: floor.drop.x,
    y: floor.drop.y,
    life: 999,
  });
  if (floor.boss && p.hp < p.maxHp) {
    addPickup({
      type: 'health',
      x: Math.min(floor.width - 100, floor.drop.x + 120),
      y: GROUND_Y - 16,
      life: 999,
    });
  } else if (p.hp <= 3) {
    addPickup({
      type: 'health',
      x: Math.min(floor.width - 80, floor.drop.x + 130),
      y: GROUND_Y - 16,
      life: 999,
    });
  }

  if (AudioSys.ctx) {
    AudioSys.setZone(floor.boss ? 'danger' : floor.zone);
    AudioSys.startMusic(floor.boss ? 'danger' : floor.zone);
  }
  save.bestFloor = Math.max(save.bestFloor, floor.no);
  persist();
}

function beginPlay() {
  game.state = 'play';
  game.stateT = 0;
  mouse.down = false;
  if (game.floor.boss) {
    spawnBoss();
  } else {
    startWave();
  }
}

function startWave() {
  const floor = game.floor;
  if (!floor) return;
  if (floor.boss) {
    spawnBoss();
    return;
  }
  const list = floor.waves[game.wave];
  if (!list) return;
  for (let i = 0; i < list.length; i++) {
    const raw = list[i];
    const elite = raw.endsWith('*');
    const type = elite ? raw.slice(0, -1) : raw;
    spawnEnemy(type, elite, i * 0.11);
  }
  game.wave++;
  game.waveActive = true;
  game.waveClearDelay = 0;
  announce('WAVE ' + game.wave + ' / ' + game.waveTotal, game.wave === game.waveTotal ? 'FINAL WAVE' : '', '#ffd23f');
  AudioSys.wave();
}

function clearFloor() {
  if (game.floorCleared) return;
  game.floorCleared = true;
  game.waveActive = false;
  game.elevatorOpen = true;
  const bonus = 60 + game.floor.no * 10;
  game.pot += bonus;
  addText('FLOOR BONUS +' + bonus, game.player.x + 6, game.player.y - 18, '#ffd23f', 2);
  announce('LIFT UNLOCKED', 'HEAD RIGHT  ·  PRESS E', '#7bf1a8');
  game.ebullets = [];
  game.warnings = [];
  game.beams = [];
  game.shake = Math.max(game.shake, 5);
  AudioSys.wave();
  if (AudioSys.ctx) {
    AudioSys.setZone('victory');
    AudioSys.startMusic('victory');
  }
  if (game.floor.no === 12) {
    game.victoryDelay = 2.6;
  }
}

function boardLift() {
  if (game.state !== 'play' || !game.floorCleared) return;
  game.state = 'clear';
  game.stateT = 0;
  game.player.inLift = true;
  game.player.x = game.floor.width - 46;
  game.player.y = GROUND_Y - game.player.h;
  game.player.vx = 0;
  game.player.vy = 0;
  mouse.down = false;
  AudioSys.ui();
}

function chooseBank() {
  if (game.state !== 'risk') return;
  const gain = Math.round(game.pot * game.mult);
  game.score += gain;
  game.player.hp = Math.min(game.player.maxHp, game.player.hp + 1);
  game.pot = 0;
  game.mult = 1;
  game.newBest = game.score > save.best;
  if (game.score > save.best) save.best = game.score;
  persist();
  AudioSys.bank();
  addText('BANKED +' + gain, 320, 150, '#7bf1a8', 2);
  nextFloor();
}

function chooseRisk() {
  if (game.state !== 'risk') return;
  if (game.mult >= MAX_MULT) {
    AudioSys.empty();
    return;
  }
  game.mult = Math.min(MAX_MULT, game.mult * 2);
  AudioSys.risk();
  nextFloor();
}

function nextFloor() {
  game.floorIndex++;
  if (game.floorIndex >= FLOORS.length) {
    victory();
    return;
  }
  loadFloor(game.floorIndex);
}

function quitToTitle() {
  AudioSys.stopMusic();
  setMusicDuck(false);
  if (AudioSys.ctx) {
    AudioSys.setZone('title');
    AudioSys.startMusic('title');
  }
  mouse.down = false;
  setupTitleWorld();
}

function die() {
  if (!game.player || game.player.dead) return;
  const p = game.player;
  p.dead = true;
  p.hp = 0;
  game.lostPot = Math.round(game.pot * game.mult);
  game.state = 'dying';
  game.stateT = 0;
  game.deadT = 0;
  game.shake = 16;
  game.flash = 0.7;
  game.flashColor = '#ff3355';
  mouse.down = false;
  AudioSys.die();
  for (let i = 0; i < 40; i++) {
    addParticle(p.x + 6, p.y + 8, rand(-150, 150), rand(-180, 40), rand(1, 4), i % 3 ? '#ff5d73' : '#ffd23f', 0.9, 420, true);
  }
}

function gameOver() {
  game.state = 'gameover';
  game.stateT = 0;
  game.newBest = game.score > save.best;
  if (game.score > save.best) save.best = game.score;
  save.bestFloor = Math.max(save.bestFloor, game.floor.no);
  save.runs++;
  persist();
  AudioSys.stopMusic();
  mouse.down = false;
}

function victory() {
  if (game.state === 'victory') return;
  const gain = Math.round(game.pot * game.mult) + CLEAR_BONUS;
  game.score += gain;
  game.victoryGain = gain;
  game.pot = 0;
  game.mult = 1;
  game.state = 'victory';
  game.stateT = 0;
  game.newBest = game.score > save.best;
  if (game.score > save.best) save.best = game.score;
  save.bestFloor = 12;
  save.runs++;
  persist();
  setMusicDuck(false);
  if (AudioSys.ctx) {
    AudioSys.setZone('victory');
    AudioSys.startMusic('victory');
  }
  mouse.down = false;
  for (let i = 0; i < 60; i++) {
    addParticle(rand(40, 600), rand(20, 180), rand(-60, 60), rand(-120, -20), rand(1, 3), pick(['#ffd23f', '#4cc9f0', '#ef476f', '#7bf1a8']), rand(1.2, 2.2), 160, false);
  }
}

/* ------------------------------------------------------------
   Player update
   ------------------------------------------------------------ */

function tryDash() {
  const p = game.player;
  if (!p || p.dead || game.state !== 'play') return;
  if (p.dashCd > 0 || p.dashT > 0) return;
  const left = keys.has('KeyA') || keys.has('ArrowLeft');
  const right = keys.has('KeyD') || keys.has('ArrowRight');
  p.dashDir = left && !right ? -1 : right && !left ? 1 : p.facing;
  p.dashT = PLAYER_TUNE.dashTime;
  p.dashCd = PLAYER_TUNE.dashCooldown;
  p.invuln = Math.max(p.invuln, PLAYER_TUNE.dashTime + 0.08);
  p.vx = p.dashDir * PLAYER_TUNE.dashSpeed;
  AudioSys.dash();
  for (let i = 0; i < 8; i++) {
    addParticle(p.x + p.w / 2, p.y + rand(2, 16), rand(-30, 30) - p.dashDir * 60, rand(-20, 20), rand(1, 3), '#4cc9f0', 0.3, 0, true);
  }
}

function updatePlayer(dt) {
  const p = game.player;
  if (!p || p.dead) return;
  p.fireCd = Math.max(0, p.fireCd - dt);
  p.invuln = Math.max(0, p.invuln - dt);
  p.hurtFlash = Math.max(0, p.hurtFlash - dt);
  p.dashCd = Math.max(0, p.dashCd - dt);
  p.recoil = Math.max(0, p.recoil - dt * 24);
  p.muzzleT = Math.max(0, p.muzzleT - dt);
  p.jumpBuf = Math.max(0, p.jumpBuf - dt);

  const shoulderX = p.x + p.w / 2;
  const shoulderY = p.y + 8;
  game.aim.x = mouse.x + game.cam;
  game.aim.y = mouse.y;
  p.aim = Math.atan2(game.aim.y - shoulderY, game.aim.x - shoulderX);
  p.facing = Math.cos(p.aim) >= 0 ? 1 : -1;

  if (p.dashT > 0) {
    p.dashT -= dt;
    p.x += p.dashDir * PLAYER_TUNE.dashSpeed * dt;
    p.x = clamp(p.x, 2, game.floor.width - p.w - 2);
    if (game.t % 0.03 < dt) {
      game.ghosts.push({ x: p.x, y: p.y, facing: p.facing, life: 0.22, max: 0.22 });
    }
    if (p.dashT <= 0) p.vx *= 0.7;
    p.onGround = p.y + p.h >= GROUND_Y - 1;
    if (p.y + p.h > GROUND_Y) p.y = GROUND_Y - p.h;
  } else {
    const left = keys.has('KeyA') || keys.has('ArrowLeft');
    const right = keys.has('KeyD') || keys.has('ArrowRight');
    const dir = (right ? 1 : 0) - (left ? 1 : 0);
    const accel = p.onGround ? PLAYER_TUNE.accel : PLAYER_TUNE.airAccel;

    if (dir !== 0) {
      p.vx = approach(p.vx, dir * PLAYER_TUNE.speed, accel * dt);
      p.facing = dir;
    } else {
      p.vx = approach(p.vx, 0, (p.onGround ? PLAYER_TUNE.friction : PLAYER_TUNE.airAccel * 0.45) * dt);
    }

    if (p.jumpBuf > 0 && (p.onGround || p.coyote > 0)) {
      p.vy = -PLAYER_TUNE.jump;
      p.onGround = false;
      p.coyote = 0;
      p.jumpBuf = 0;
      AudioSys.jump();
      for (let i = 0; i < 6; i++) {
        addParticle(p.x + p.w / 2 + rand(-5, 5), p.y + p.h - 1, rand(-35, 35), rand(-12, 4), rand(1, 2), '#9ea7c9', 0.3, 220, false);
      }
    }

    const wasGround = p.onGround;
    const fallVy = p.vy;
    moveBody(p, dt, 1);
    if (!wasGround && p.onGround && fallVy > 180) {
      AudioSys.land();
      for (let i = 0; i < 7; i++) {
        addParticle(p.x + p.w / 2 + rand(-6, 6), p.y + p.h - 1, rand(-45, 45), rand(-20, 2), rand(1, 2), '#9ea7c9', 0.28, 160, false);
      }
    }
    p.coyote = p.onGround ? 0.1 : Math.max(0, p.coyote - dt);
    if (p.onGround) p.walkT += Math.abs(p.vx) * dt * 0.085;
  }

  if ((mouse.down || keys.has('KeyJ')) && p.fireCd <= 0) shoot();
}

/* ------------------------------------------------------------
   Physics helpers
   ------------------------------------------------------------ */

function moveBody(e, dt, gravityScale) {
  const g = (gravityScale == null ? 1 : gravityScale);
  const prevBottom = e.y + e.h;
  e.vy += PLAYER_TUNE.gravity * g * dt;
  if (e.vy > PLAYER_TUNE.maxFall) e.vy = PLAYER_TUNE.maxFall;
  e.x += e.vx * dt;
  e.x = clamp(e.x, 0, game.floor.width - e.w);
  e.y += e.vy * dt;
  e.onGround = false;

  if (e.y + e.h >= GROUND_Y && e.vy >= 0) {
    e.y = GROUND_Y - e.h;
    e.vy = 0;
    e.onGround = true;
  }

  if (e.vy >= 0) {
    const plats = game.floor.platforms;
    for (let i = 0; i < plats.length; i++) {
      const p = plats[i];
      if (e.x + e.w <= p.x + 1 || e.x >= p.x + p.w - 1) continue;
      if (prevBottom <= p.y + 1 && e.y + e.h >= p.y) {
        e.y = p.y - e.h;
        e.vy = 0;
        e.onGround = true;
      }
    }
  }
}

function segRectT(x1, y1, x2, y2, rx, ry, rw, rh) {
  let tmin = 0;
  let tmax = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - rx, rx + rw - x1, y1 - ry, ry + rh - y1];
  for (let i = 0; i < 4; i++) {
    if (Math.abs(p[i]) < 1e-9) {
      if (q[i] < 0) return null;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > tmin) tmin = t;
      } else if (t < tmax) {
        tmax = t;
      }
      if (tmin > tmax) return null;
    }
  }
  return tmin;
}

function lineBlocked(x1, y1, x2, y2) {
  const end = rayEnd(x1, y1, x2, y2);
  return dist(x1, y1, end.x, end.y) < dist(x1, y1, x2, y2) - 3;
}

function rayEnd(x1, y1, x2, y2) {
  let best = 1;
  const plats = game.floor.platforms;
  for (let i = 0; i < plats.length; i++) {
    const p = plats[i];
    const t = segRectT(x1, y1, x2, y2, p.x, p.y, p.w, p.h);
    if (t != null && t > 0.001 && t < best) best = t;
  }
  const tg = segRectT(x1, y1, x2, y2, 0, GROUND_Y, game.floor.width, 38);
  if (tg != null && tg > 0.001 && tg < best) best = tg;
  return { x: lerp(x1, x2, best), y: lerp(y1, y2, best), t: best };
}

/* ------------------------------------------------------------
   Weapons / shooting
   ------------------------------------------------------------ */

function randomDrop() {
  let total = 0;
  for (let i = 0; i < DROP_TABLE.length; i++) total += DROP_TABLE[i].weight;
  let r = Math.random() * total;
  for (let i = 0; i < DROP_TABLE.length; i++) {
    r -= DROP_TABLE[i].weight;
    if (r <= 0) return DROP_TABLE[i].w;
  }
  return 'shotgun';
}

function setWeapon(name) {
  const p = game.player;
  const def = WEAPONS[name];
  if (!def) return;
  if (name === 'pistol') {
    p.weapon = 'pistol';
    p.ammo = Infinity;
    return;
  }
  if (p.weapon === name) {
    p.ammo += Math.ceil(def.ammo * 0.5);
  } else {
    p.weapon = name;
    p.ammo = def.ammo;
  }
}

function healPlayer(n) {
  const p = game.player;
  const before = p.hp;
  p.hp = Math.min(p.maxHp, p.hp + n);
  if (p.hp > before) {
    AudioSys.health();
    addText('+1 HP', p.x + 4, p.y - 10, '#7bf1a8', 1);
    game.pot += 15;
  } else {
    game.pot += 40;
    addText('+40', p.x + 4, p.y - 10, '#ffd23f', 1);
  }
}

function shoot() {
  const p = game.player;
  if (!p || p.dead) return;
  let def = WEAPONS[p.weapon] || WEAPONS.pistol;
  if (p.ammo <= 0) {
    setWeapon('pistol');
    def = WEAPONS.pistol;
    AudioSys.empty();
    addText('OUT OF AMMO', p.x, p.y - 12, '#8a8aa8', 1);
  }

  const sx = p.x + p.w / 2;
  const sy = p.y + 8;
  const angle = p.aim;
  const muzzleDist = def.shape === 'rail' ? 15 : def.shape === 'shotgun' ? 12 : def.shape === 'rocket' ? 13 : 9;
  const mx = sx + Math.cos(angle) * muzzleDist;
  const my = sy + Math.sin(angle) * muzzleDist;

  p.fireCd = def.rate;
  p.muzzleT = 0.065;
  p.recoil = 1;
  if (p.ammo !== Infinity) p.ammo--;

  if (def.hitscan) {
    fireRail(mx, my, angle);
  } else {
    const count = def.pellets || 1;
    for (let i = 0; i < count; i++) {
      const a = angle + rand(-def.spread, def.spread) + (count > 1 ? rand(-0.02, 0.02) : 0);
      game.bullets.push({
        x: mx, y: my, px: mx, py: my,
        vx: Math.cos(a) * def.speed,
        vy: Math.sin(a) * def.speed,
        r: def.shape === 'rocket' ? 4 : 2,
        dmg: def.dmg,
        color: def.color,
        weapon: p.weapon,
        explosive: def.explosive || 0,
        life: def.shape === 'rocket' ? 2.4 : 1.5,
        dead: false,
      });
    }
  }

  for (let i = 0; i < 4; i++) {
    addParticle(mx, my, Math.cos(angle) * rand(30, 130) + rand(-40, 40), Math.sin(angle) * rand(30, 130) + rand(-40, 40), rand(1, 3), def.color, rand(0.08, 0.2), 60, true);
  }
  if (p.weapon === 'pistol' || p.weapon === 'shotgun' || p.weapon === 'smg') {
    const side = angle + Math.PI / 2;
    addParticle(sx, sy, Math.cos(side) * rand(20, 55) - Math.cos(angle) * 30, Math.sin(side) * rand(20, 55) - Math.sin(angle) * 30, 1, '#ffd23f', 0.4, 420, false);
  }
  AudioSys.shoot(def.sfx);
  game.shake = Math.max(game.shake, def.shape === 'shotgun' ? 3.2 : def.shape === 'rocket' ? 4.5 : 1.3);
  p.vx -= Math.cos(angle) * (def.shape === 'shotgun' ? 38 : def.shape === 'rocket' ? 45 : 5);
}

function fireRail(mx, my, angle) {
  const farX = mx + Math.cos(angle) * 900;
  const farY = my + Math.sin(angle) * 900;
  const end = rayEnd(mx, my, farX, farY);
  const hits = [];

  for (let i = 0; i < game.enemies.length; i++) {
    const e = game.enemies[i];
    if (e.dead || e.spawnT > 0) continue;
    const t = segRectT(mx, my, end.x, end.y, e.x, e.y, e.w, e.h);
    if (t != null) hits.push({ t, e });
  }
  if (game.boss && !game.boss.dead && game.boss.spawnT <= 0) {
    const b = game.boss;
    const t = segRectT(mx, my, end.x, end.y, b.x, b.y, b.w, b.h);
    if (t != null) hits.push({ t, boss: true });
  }
  hits.sort((a, b) => a.t - b.t);

  for (let i = 0; i < hits.length; i++) {
    const h = hits[i];
    if (h.boss) damageBoss(game.boss, WEAPONS.rail.dmg, true);
    else damageEnemy(h.e, WEAPONS.rail.dmg, { ignoreShield: true, fromX: mx, fromY: my });
    addParticle(lerp(mx, end.x, h.t), lerp(my, end.y, h.t), rand(-40, 40), rand(-40, 40), rand(1, 3), '#e0aaff', 0.3, 0, true);
  }

  game.beams.push({ x1: mx, y1: my, x2: end.x, y2: end.y, t: 0.18, max: 0.18, color: '#c77dff', width: 4 });
  game.beams.push({ x1: mx, y1: my, x2: end.x, y2: end.y, t: 0.1, max: 0.1, color: '#ffffff', width: 1 });
  for (let i = 0; i < 18; i++) {
    const t = rand(0.05, 1);
    addParticle(lerp(mx, end.x, t), lerp(my, end.y, t), rand(-25, 25), rand(-25, 25), rand(1, 2), '#c77dff', rand(0.15, 0.4), 60, true);
  }
  game.flash = 0.18;
  game.flashColor = '#c77dff';
  game.shake = Math.max(game.shake, 5);
  game.hitstop = 0.025;
  AudioSys.beam();
}

/* ------------------------------------------------------------
   Damage / kills / explosions
   ------------------------------------------------------------ */

function damageEnemy(e, dmg, opts) {
  if (!e || e.dead) return false;
  if (e.spawnT > 0) return false;
  const o = opts || {};

  if (e.type === 'shield' && !o.ignoreShield && o.fromX != null) {
    const front = e.facing || 1;
    const fromFront = (o.fromX - (e.x + e.w / 2)) * front > 0;
    if (fromFront) {
      for (let i = 0; i < 3; i++) {
        addParticle(e.x + e.w / 2 + front * (e.w / 2 + 2), e.y + 7, rand(-40, 40) + front * 40, rand(-50, 10), 1, '#ffe66d', 0.2, 300, true);
      }
      AudioSys.hit();
      return true;
    }
  }

  e.hp -= dmg;
  e.hitFlash = 0.09;
  if (o.knockback) {
    e.vx += sign(e.x - (o.fromX || 0)) * 130;
    e.vy = Math.min(e.vy, -80);
  }
  if (e.hp <= 0) {
    killEnemy(e, o);
  } else {
    AudioSys.hit();
    for (let i = 0; i < 3; i++) {
      addParticle(e.x + e.w / 2 + rand(-4, 4), e.y + e.h / 2 + rand(-5, 5), rand(-50, 50), rand(-60, 10), rand(1, 2), '#ff8fa3', 0.22, 260, true);
    }
  }
  return true;
}

function killEnemy(e, opts) {
  if (e.dead) return;
  e.dead = true;
  const comboBonus = 1 + Math.min(game.combo, 20) * 0.05;
  const pts = Math.round(e.score * comboBonus);
  game.pot += pts;
  game.kills++;
  game.combo++;
  game.comboT = 2.6;
  game.comboPulse = 1;
  const color = e.elite ? '#ffd23f' : '#f8f4e3';
  addText('+' + pts, e.x + e.w / 2, e.y - 4, color, 2);
  if (game.combo > 2) addText('X' + game.combo + ' COMBO', e.x + e.w / 2, e.y - 14, '#4cc9f0', 1);
  for (let i = 0; i < 16; i++) {
    addParticle(e.x + e.w / 2, e.y + e.h / 2, rand(-140, 140), rand(-150, 60), rand(1, 3), i % 4 === 0 ? '#ffd23f' : (e.elite ? '#ffd23f' : '#ff5d73'), rand(0.25, 0.7), 480, true);
  }
  addRing(e.x + e.w / 2, e.y + e.h / 2, 22, e.elite ? '#ffd23f' : '#ff8fa3', 0.28);
  game.shake = Math.max(game.shake, e.elite ? 5 : 2.4);
  AudioSys.kill();

  if (e.type === 'bomber' && !e.exploded) {
    e.exploded = true;
    explode(e.x + e.w / 2, e.y + e.h / 2, 48, 26, { hurtPlayer: true, playerDmg: 1, source: 'bomber' });
  }

  if (chance(0.08)) {
    addPickup({ type: 'score', x: e.x + e.w / 2 - 6, y: e.y + e.h / 2, life: 18 });
  }
  const hpChance = game.player.hp <= 3 ? 0.06 : 0.024;
  if (chance(hpChance)) {
    addPickup({ type: 'health', x: e.x + e.w / 2 - 7, y: e.y + e.h / 2, life: 24 });
  } else if (chance(0.024)) {
    addPickup({ type: 'weapon', weapon: randomDrop(), x: e.x, y: e.y, life: 24 });
  }
}

function circleRectDist(cx, cy, e) {
  const nx = clamp(cx, e.x, e.x + e.w);
  const ny = clamp(cy, e.y, e.y + e.h);
  return dist(cx, cy, nx, ny);
}

function explode(x, y, radius, dmg, opts) {
  const o = opts || {};
  addRing(x, y, radius, o.color || '#ff9f1c', 0.42);
  addRing(x, y, radius * 0.55, '#fff3c4', 0.3);
  for (let i = 0; i < (o.big ? 40 : 22); i++) {
    const a = rand(0, TAU);
    const sp = rand(40, radius * 4.2);
    addParticle(x, y, Math.cos(a) * sp, Math.sin(a) * sp - 20, rand(1, 4), i % 4 === 0 ? '#fff3c4' : (o.color || '#ff9f1c'), rand(0.25, 0.7), 260, true);
  }
  game.shake = Math.max(game.shake, o.big ? 12 : 6);
  game.flash = Math.max(game.flash, o.big ? 0.35 : 0.12);
  game.flashColor = o.color || '#ffb703';
  game.hitstop = Math.max(game.hitstop, o.big ? 0.055 : 0.022);
  if (!o.silent) AudioSys.explosion(!!o.big);

  if (dmg > 0) {
    for (let i = 0; i < game.enemies.length; i++) {
      const e = game.enemies[i];
      if (e.dead) continue;
      const d = circleRectDist(x, y, e);
      if (d < radius) {
        const falloff = clamp(1 - (d / radius) * 0.55, 0.45, 1);
        damageEnemy(e, dmg * falloff, { ignoreShield: true, fromX: x, fromY: y, knockback: true });
      }
    }
    if (game.boss && !game.boss.dead) {
      const d = circleRectDist(x, y, game.boss);
      if (d < radius + 8) {
        const falloff = clamp(1 - (d / (radius + 8)) * 0.5, 0.5, 1);
        damageBoss(game.boss, dmg * falloff, false);
      }
    }
  }

  if (o.hurtPlayer) {
    const p = game.player;
    if (p && !p.dead) {
      const d = circleRectDist(x, y, p);
      if (d < radius + 3) hurtPlayer(o.playerDmg || 1, x);
    }
  }
}

function hurtPlayer(amount, sourceX) {
  const p = game.player;
  if (!p || p.dead || p.invuln > 0 || p.dashT > 0) return;
  p.hp -= amount;
  p.invuln = PLAYER_TUNE.invuln;
  p.hurtFlash = 0.38;
  p.dashT = 0;
  game.combo = 0;
  game.comboT = 0;
  game.shake = Math.max(game.shake, 10);
  game.flash = 0.55;
  game.flashColor = '#ff3355';
  game.hitstop = 0.03;
  const dir = p.x + p.w / 2 < sourceX ? -1 : 1;
  p.vx = dir * 190;
  p.vy = -190;
  p.onGround = false;
  AudioSys.hurt();
  addText('-' + amount + ' HP', p.x + 4, p.y - 8, '#ff5d73', 1);
  if (p.hp <= 0) {
    p.hp = 0;
    die();
  }
}

/* ------------------------------------------------------------
   Player bullets
   ------------------------------------------------------------ */

function updateBullets(dt) {
  const floor = game.floor;
  for (let i = 0; i < game.bullets.length; i++) {
    const b = game.bullets[i];
    if (b.dead) continue;
    b.px = b.x;
    b.py = b.y;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;

    if (b.weapon === 'rocket' && chance(0.7)) {
      addParticle(b.x - b.vx * 0.01, b.y - b.vy * 0.01, rand(-20, 20), rand(-20, 20), rand(1, 3), '#8a8aa8', 0.35, -20, false);
    }

    let wallT = null;
    for (let k = 0; k < floor.platforms.length; k++) {
      const p = floor.platforms[k];
      const t = segRectT(b.px, b.py, b.x, b.y, p.x, p.y, p.w, p.h);
      if (t != null && (wallT == null || t < wallT)) wallT = t;
    }
    const tg = segRectT(b.px, b.py, b.x, b.y, 0, GROUND_Y, floor.width, 38);
    if (tg != null && (wallT == null || tg < wallT)) wallT = tg;

    let bestT = 1;
    let bestEnemy = null;
    let bestBoss = false;
    for (let k = 0; k < game.enemies.length; k++) {
      const e = game.enemies[k];
      if (e.dead || e.spawnT > 0) continue;
      const t = segRectT(b.px, b.py, b.x, b.y, e.x - 1, e.y - 1, e.w + 2, e.h + 2);
      if (t != null && t < bestT) { bestT = t; bestEnemy = e; bestBoss = false; }
    }
    if (game.boss && !game.boss.dead && game.boss.spawnT <= 0) {
      const bo = game.boss;
      const t = segRectT(b.px, b.py, b.x, b.y, bo.x, bo.y, bo.w, bo.h);
      if (t != null && t < bestT) { bestT = t; bestEnemy = bo; bestBoss = true; }
    }

    if (wallT != null && wallT <= bestT) {
      const ix = lerp(b.px, b.x, wallT);
      const iy = lerp(b.py, b.y, wallT);
      if (b.explosive) explode(ix, iy, b.explosive, b.dmg, { hurtPlayer: false });
      for (let k = 0; k < 3; k++) addParticle(ix, iy, rand(-40, 40), rand(-45, 10), 1, b.color, 0.2, 280, true);
      b.dead = true;
      continue;
    }

    if (bestEnemy) {
      const ix = lerp(b.px, b.x, bestT);
      const iy = lerp(b.py, b.y, bestT);
      if (bestBoss) {
        damageBoss(bestEnemy, b.dmg, b.explosive > 0);
      } else {
        damageEnemy(bestEnemy, b.dmg, {
          fromX: b.px, fromY: b.py,
          knockback: b.weapon === 'rocket' || b.weapon === 'shotgun',
        });
      }
      if (b.explosive) explode(ix, iy, b.explosive, b.dmg, { hurtPlayer: false });
      for (let k = 0; k < 4; k++) addParticle(ix, iy, rand(-60, 60), rand(-60, 20), 1, b.color, 0.22, 260, true);
      b.dead = true;
      continue;
    }

    if (b.life <= 0 || b.x < -40 || b.x > floor.width + 40 || b.y < -60 || b.y > SCREEN_H + 60) {
      b.dead = true;
    }
  }
  game.bullets = game.bullets.filter((b) => !b.dead);
}

/* ------------------------------------------------------------
   Enemy bullets / warnings / beams
   ------------------------------------------------------------ */

function fireEnemyBullet(x, y, angle, speed, opts) {
  const o = opts || {};
  game.ebullets.push({
    x, y, px: x, py: y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: o.r || 3,
    dmg: o.dmg || 1,
    color: o.color || '#ff5d73',
    life: o.life || 3.2,
    type: o.type || 'normal',
    w: o.w || 6,
    h: o.h || 6,
    dead: false,
    seed: rand(0, 10),
  });
}

function updateEnemyBullets(dt) {
  const p = game.player;
  for (let i = 0; i < game.ebullets.length; i++) {
    const b = game.ebullets[i];
    if (b.dead) continue;
    b.px = b.x;
    b.py = b.y;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;

    if (b.type === 'shock') {
      if (p && !p.dead && aabb({ x: b.x - 8, y: b.y - 8, w: 16, h: 16 }, p)) {
        hurtPlayer(b.dmg, b.x);
        b.dead = true;
        continue;
      }
      if (b.life <= 0 || b.x < -30 || b.x > game.floor.width + 30) b.dead = true;
      continue;
    }

    let wallT = null;
    for (let k = 0; k < game.floor.platforms.length; k++) {
      const pl = game.floor.platforms[k];
      const t = segRectT(b.px, b.py, b.x, b.y, pl.x, pl.y, pl.w, pl.h);
      if (t != null && (wallT == null || t < wallT)) wallT = t;
    }
    const tg = segRectT(b.px, b.py, b.x, b.y, 0, GROUND_Y, game.floor.width, 38);
    if (tg != null && (wallT == null || tg < wallT)) wallT = tg;

    let playerT = null;
    if (p && !p.dead) {
      playerT = segRectT(b.px, b.py, b.x, b.y, p.x - 2, p.y - 2, p.w + 4, p.h + 4);
    }
    if (playerT != null && (wallT == null || playerT <= wallT)) {
      const ix = lerp(b.px, b.x, playerT);
      hurtPlayer(b.dmg, ix);
      b.dead = true;
      continue;
    }

    if (wallT != null) {
      const ix = lerp(b.px, b.x, wallT);
      const iy = lerp(b.py, b.y, wallT);
      for (let k = 0; k < 2; k++) addParticle(ix, iy, rand(-25, 25), rand(-30, 5), 1, b.color, 0.15, 120, true);
      b.dead = true;
      continue;
    }

    if (b.life <= 0 || b.x < -30 || b.x > game.floor.width + 30 || b.y < -40 || b.y > SCREEN_H + 40) b.dead = true;
  }
  game.ebullets = game.ebullets.filter((b) => !b.dead);
}

function addWarning(w) {
  w.t = w.delay;
  w.max = w.delay;
  w.done = false;
  game.warnings.push(w);
}

function updateWarnings(dt) {
  const p = game.player;
  for (let i = 0; i < game.warnings.length; i++) {
    const w = game.warnings[i];
    w.t -= dt;
    if (!w.done && w.t <= 0) {
      w.done = true;
      if (w.type === 'line') {
        game.beams.push({ x1: w.x, y1: w.y, x2: w.x2, y2: w.y2, t: 0.18, max: 0.18, color: w.color || '#ff3355', width: w.width || 3 });
        game.beams.push({ x1: w.x, y1: w.y, x2: w.x2, y2: w.y2, t: 0.1, max: 0.1, color: '#ffffff', width: 1 });
        if (p && !p.dead) {
          const d = pointSegDist(p.x + p.w / 2, p.y + p.h / 2, w.x, w.y, w.x2, w.y2);
          if (d < p.w / 2 + 7) hurtPlayer(w.damage || 1, w.x);
        }
        for (let k = 0; k < 12; k++) {
          const t = rand(0, 1);
          addParticle(lerp(w.x, w.x2, t), lerp(w.y, w.y2, t), rand(-35, 35), rand(-35, 35), rand(1, 2), w.color || '#ff3355', 0.3, 30, true);
        }
        game.shake = Math.max(game.shake, 4);
        AudioSys.beam();
      } else if (w.type === 'circle') {
        explode(w.x, w.y, w.r || 36, 0, {
          hurtPlayer: true,
          playerDmg: w.damage || 1,
          color: w.color || '#ff9f1c',
          silent: false,
        });
        AudioSys.alarm();
      }
    }
  }
  game.warnings = game.warnings.filter((w) => w.t > -0.25);
}

function pointSegDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-9) return dist(px, py, x1, y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = clamp(t, 0, 1);
  return dist(px, py, x1 + dx * t, y1 + dy * t);
}

/* ------------------------------------------------------------
   Effects
   ------------------------------------------------------------ */

function addParticle(x, y, vx, vy, size, color, life, gravity, additive) {
  if (game.particles.length > 650) game.particles.shift();
  game.particles.push({
    x, y, vx, vy, size, color,
    life, max: life, gravity: gravity || 0,
    additive: !!additive,
  });
}

function updateParticles(dt) {
  for (let i = 0; i < game.particles.length; i++) {
    const p = game.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += p.gravity * dt;
    p.vx *= Math.pow(0.25, dt);
    p.life -= dt;
  }
  game.particles = game.particles.filter((p) => p.life > 0);
}

function addText(text, x, y, color, scale) {
  game.texts.push({
    text: String(text), x, y, vy: -28, life: 0.95, max: 0.95,
    color: color || '#f8f4e3', scale: scale || 1,
  });
}

function updateTexts(dt) {
  for (let i = 0; i < game.texts.length; i++) {
    const t = game.texts[i];
    t.y += t.vy * dt;
    t.vy *= Math.pow(0.15, dt);
    t.life -= dt;
  }
  game.texts = game.texts.filter((t) => t.life > 0);
}

function addRing(x, y, maxR, color, life) {
  game.rings.push({ x, y, r: 4, maxR, color, life, max: life, width: 3 });
}

function updateRings(dt) {
  for (let i = 0; i < game.rings.length; i++) {
    const r = game.rings[i];
    r.life -= dt;
    const t = 1 - clamp(r.life / r.max, 0, 1);
    r.r = lerp(4, r.maxR, t);
  }
  game.rings = game.rings.filter((r) => r.life > 0);
}

function updateGhosts(dt) {
  for (let i = 0; i < game.ghosts.length; i++) game.ghosts[i].life -= dt;
  game.ghosts = game.ghosts.filter((g) => g.life > 0);
}

function addPickup(data) {
  game.pickups.push({
    type: data.type,
    x: data.x, y: data.y,
    vx: 0, vy: 0, w: 17, h: 17,
    onGround: false,
    life: data.life || 25,
    maxLife: data.life || 25,
    weapon: data.weapon || null,
    seed: rand(0, 10),
  });
}

function updatePickups(dt) {
  const p = game.player;
  for (let i = 0; i < game.pickups.length; i++) {
    const it = game.pickups[i];
    it.life -= dt;
    if (!it.onGround) moveBody(it, dt, 0.65);
    if (p && !p.dead) {
      const d = dist(it.x + 8, it.y + 8, p.x + p.w / 2, p.y + p.h / 2);
      if (d < 72 && (it.type === 'health' || it.type === 'score')) {
        it.x = approach(it.x, p.x + p.w / 2 - 8, 170 * dt);
        it.y = approach(it.y, p.y + p.h / 2 - 8, 170 * dt);
      }
      if (aabb(it, p)) {
        collectPickup(it);
        it.life = -1;
      }
    }
  }
  game.pickups = game.pickups.filter((it) => it.life > 0);
}

function collectPickup(it) {
  if (it.type === 'weapon') {
    const wasSame = game.player.weapon === it.weapon;
    setWeapon(it.weapon);
    AudioSys.pickup();
    addText((wasSame ? '+AMMO ' : '') + WEAPONS[it.weapon].name, game.player.x + 6, game.player.y - 12, WEAPONS[it.weapon].color, 2);
  } else if (it.type === 'health') {
    healPlayer(1);
  } else if (it.type === 'score') {
    const amount = 25 + game.floorIndex * 4;
    game.pot += amount;
    AudioSys.pickup();
    addText('+' + amount, it.x + 6, it.y, '#ffd23f', 1);
  }
}

/* ------------------------------------------------------------
   Enemies
   ------------------------------------------------------------ */

function spawnEnemy(type, elite, delay) {
  const def = ENEMY_DEFS[type];
  if (!def) return;
  const floor = game.floor;
  const viewL = game.cam + 18;
  const viewR = game.cam + SCREEN_W - 18;
  let x;
  let y;
  let py = null;

  if (def.flying) {
    x = rand(viewL + 55, viewR - 70);
    y = rand(62, 168);
  } else if (def.stationary) {
    const visible = floor.platforms.filter((p) => p.x + p.w > viewL && p.x < viewR);
    const pl = visible.length ? pick(visible) : pick(floor.platforms);
    x = pl.x + pl.w / 2 - def.w / 2;
    y = pl.y - def.h;
    py = pl.y;
  } else {
    const side = game.spawnSerial++ % 2 === 0 ? -1 : 1;
    x = side < 0 ? viewL + rand(0, 46) : viewR - def.w - rand(0, 46);
    y = GROUND_Y - def.h;
    if (Math.abs(x - game.player.x) < 126) {
      x = side < 0 ? viewR - def.w - rand(0, 46) : viewL + rand(0, 46);
    }
  }

  x = clamp(x, 8, floor.width - def.w - 8);

  game.spawners.push({
    x, y, py, type, elite: !!elite,
    t: 0.5 + (delay || 0),
    max: 0.5 + (delay || 0),
    seed: rand(0, 8),
    defW: def.w, defH: def.h,
  });
}

function updateSpawners(dt) {
  for (let i = 0; i < game.spawners.length; i++) {
    const s = game.spawners[i];
    s.t -= dt;
    if (s.t <= 0) {
      createEnemyFromSpawner(s);
      s.t = -1;
    }
  }
  game.spawners = game.spawners.filter((s) => s.t > -1);
}

function createEnemyFromSpawner(s) {
  const def = ENEMY_DEFS[s.type];
  const scale = s.elite ? 1.18 : 1;
  const w = Math.round(def.w * scale);
  const h = Math.round(def.h * scale);
  let x = s.x - (w - def.w) / 2;
  let y = s.y;
  if (def.stationary && s.py != null) y = s.py - h;
  else if (!def.flying) y = GROUND_Y - h;
  x = clamp(x, 4, game.floor.width - w - 4);

  const hpScale = 1 + game.floorIndex * 0.065;
  const e = {
    type: s.type,
    x, y, w, h,
    vx: 0, vy: 0,
    hp: Math.round(def.hp * hpScale * (s.elite ? 1.85 : 1)),
    maxHp: Math.round(def.hp * hpScale * (s.elite ? 1.85 : 1)),
    speed: def.speed,
    score: def.score * (s.elite ? 2 : 1),
    elite: s.elite,
    flying: !!def.flying,
    stationary: !!def.stationary,
    onGround: false,
    facing: -1,
    aimAngle: 0,
    shootT: rand(0.5, 1.4),
    burstLeft: 0,
    burstT: 0,
    hitFlash: 0,
    muzzleT: 0,
    spawnT: 0.24,
    seed: rand(0, 10),
    t: 0,
    dead: false,
    jumpCd: 0,
    fuse: 0,
    fuseT: 0,
    fuseBeep: 0,
    charging: false,
    chargeT: 0,
    chargeTo: null,
    exploded: false,
    scale: s.elite ? 1.18 : 1,
  };
  game.enemies.push(e);
  addRing(x + w / 2, y + h / 2, 26, s.elite ? '#ffd23f' : '#4cc9f0', 0.32);
  for (let i = 0; i < 10; i++) {
    addParticle(x + w / 2, y + h / 2, rand(-90, 90), rand(-90, 90), rand(1, 3), s.elite ? '#ffd23f' : '#4cc9f0', 0.3, 80, true);
  }
}

function enemyShootAtPlayer(e, speed, spread, opts) {
  const p = game.player;
  if (!p || p.dead) return;
  const cx = e.x + e.w / 2;
  const cy = e.y + (e.type === 'turret' ? 5 : 7);
  const angle = Math.atan2(p.y + p.h / 2 - cy, p.x + p.w / 2 - cx) + rand(-(spread || 0), spread || 0);
  e.aimAngle = angle;
  e.muzzleT = 0.06;
  const o = opts || {};
  fireEnemyBullet(
    cx + Math.cos(angle) * (e.w / 2 + 3),
    cy + Math.sin(angle) * 4,
    angle, speed, {
      color: o.color || '#ff5d73',
      r: o.r || 3,
      dmg: o.dmg || 1,
      life: o.life || 3.4,
      type: o.type || 'normal',
    }
  );
  for (let i = 0; i < 2; i++) {
    addParticle(cx + Math.cos(angle) * 8, cy + Math.sin(angle) * 8, Math.cos(angle) * rand(30, 70), Math.sin(angle) * rand(30, 70), 1, '#ff8fa3', 0.15, 0, true);
  }
}

function updateEnemies(dt) {
  const p = game.player;
  for (let i = 0; i < game.enemies.length; i++) {
    const e = game.enemies[i];
    if (e.dead) continue;
    e.t += dt;
    e.hitFlash = Math.max(0, e.hitFlash - dt);
    e.muzzleT = Math.max(0, e.muzzleT - dt);
    e.jumpCd = Math.max(0, e.jumpCd - dt);
    if (e.spawnT > 0) {
      e.spawnT -= dt;
      if (!e.flying) moveBody(e, dt, 1);
      continue;
    }

    if (e.type === 'grunt') updateGrunt(e, dt, p);
    else if (e.type === 'runner') updateRunner(e, dt, p);
    else if (e.type === 'drone') updateDrone(e, dt, p);
    else if (e.type === 'turret') updateTurret(e, dt, p);
    else if (e.type === 'shield') updateShield(e, dt, p);
    else if (e.type === 'bomber') updateBomber(e, dt, p);
    else if (e.type === 'sniper') updateSniper(e, dt, p);

    if (p && !p.dead && e.type !== 'sniper' && e.type !== 'turret' && aabb(e, p)) {
      hurtPlayer(1, e.x + e.w / 2);
    }
  }

  // Keep ground units from stacking into one unreadable blob.
  for (let i = 0; i < game.enemies.length; i++) {
    const a = game.enemies[i];
    if (a.dead || a.flying || a.stationary || a.spawnT > 0) continue;
    for (let k = i + 1; k < game.enemies.length; k++) {
      const b = game.enemies[k];
      if (b.dead || b.flying || b.stationary || b.spawnT > 0) continue;
      const dx = (b.x + b.w / 2) - (a.x + a.w / 2);
      const dy = Math.abs((b.y + b.h / 2) - (a.y + a.h / 2));
      if (Math.abs(dx) < 17 && dy < 13) {
        const dir = dx === 0 ? (i % 2 ? 1 : -1) : (dx > 0 ? 1 : -1);
        const push = (17 - Math.abs(dx)) * 11 * dt;
        a.x -= dir * push;
        b.x += dir * push;
        a.x = clamp(a.x, 2, game.floor.width - a.w - 2);
        b.x = clamp(b.x, 2, game.floor.width - b.w - 2);
      }
    }
  }

  game.enemies = game.enemies.filter((e) => !e.dead);
}

function updateGrunt(e, dt, p) {
  if (!p || p.dead) return;
  const dx = p.x + p.w / 2 - (e.x + e.w / 2);
  const dy = p.y + p.h / 2 - (e.y + e.h / 2);
  e.facing = dx >= 0 ? 1 : -1;
  const blocked = lineBlocked(e.x + e.w / 2, e.y + 5, p.x + p.w / 2, p.y + p.h / 2);
  const inRange = Math.abs(dx) < 430;
  const keepDist = !blocked && Math.abs(dx) < 145;

  let target = 0;
  if (!keepDist) target = e.facing * e.speed;
  e.vx = approach(e.vx, target, 620 * dt);
  moveBody(e, dt, 1);

  e.shootT -= dt;
  e.aimAngle = Math.atan2(dy, dx);
  if (e.shootT <= 0 && !blocked && inRange) {
    enemyShootAtPlayer(e, 156, 0.045, { color: '#ffb703', r: 3 });
    e.shootT = rand(1.25, 2.0) * Math.max(0.62, 1 - game.floorIndex * 0.027);
  }
}

function updateRunner(e, dt, p) {
  if (!p || p.dead) return;
  const dx = p.x + p.w / 2 - (e.x + e.w / 2);
  e.facing = dx >= 0 ? 1 : -1;
  e.vx = approach(e.vx, e.facing * e.speed, 1250 * dt);
  if (e.onGround && p.y + p.h < e.y + 2 && Math.abs(dx) < 110 && e.jumpCd <= 0) {
    e.vy = -345;
    e.jumpCd = 1.4;
  }
  moveBody(e, dt, 1);
  if (e.onGround && Math.abs(dx) < 24) {
    e.vx = e.facing * e.speed;
  }
  e.aimAngle = Math.atan2(p.y - e.y, dx);
}

function updateDrone(e, dt, p) {
  if (!p || p.dead) return;
  e.t += dt * 0.2;
  const targetX = p.x + Math.sin(e.t * 1.3 + e.seed) * 105;
  const targetY = 88 + Math.sin(e.t * 1.9 + e.seed * 2) * 34 + (p.y < 200 ? -20 : 0);
  e.x = approach(e.x, clamp(targetX, 20, game.floor.width - e.w - 20), 62 * dt);
  e.y = approach(e.y, clamp(targetY, 54, 236), 55 * dt);
  e.facing = p.x > e.x ? 1 : -1;
  e.aimAngle = Math.atan2(p.y + p.h / 2 - (e.y + e.h / 2), p.x + p.w / 2 - (e.x + e.w / 2));
  e.shootT -= dt;
  if (e.burstLeft > 0) {
    e.burstT -= dt;
    if (e.burstT <= 0) {
      enemyShootAtPlayer(e, 138, 0.08, { color: '#4cc9f0', r: 3 });
      e.burstLeft--;
      e.burstT = 0.13;
    }
  } else if (e.shootT <= 0 && dist(e.x, e.y, p.x, p.y) < 360) {
    e.burstLeft = 2;
    e.burstT = 0;
    e.shootT = rand(1.7, 2.5);
  }
}

function updateTurret(e, dt, p) {
  if (!p || p.dead) return;
  const cx = e.x + e.w / 2;
  const cy = e.y + 5;
  e.aimAngle = Math.atan2(p.y + p.h / 2 - cy, p.x + p.w / 2 - cx);
  const blocked = lineBlocked(cx, cy, p.x + p.w / 2, p.y + p.h / 2);
  e.shootT -= dt;
  if (e.burstLeft > 0) {
    e.burstT -= dt;
    if (e.burstT <= 0) {
      enemyShootAtPlayer(e, 185, 0.035, { color: '#ff5d73', r: 3 });
      e.burstLeft--;
      e.burstT = 0.12;
    }
  } else if (e.shootT <= 0 && !blocked) {
    e.burstLeft = 3;
    e.burstT = 0;
    e.shootT = rand(2.2, 3.2);
  }
}

function updateShield(e, dt, p) {
  if (!p || p.dead) return;
  const dx = p.x + p.w / 2 - (e.x + e.w / 2);
  e.facing = dx >= 0 ? 1 : -1;
  e.vx = approach(e.vx, e.facing * e.speed, 500 * dt);
  moveBody(e, dt, 1);
  e.shootT -= dt;
  e.aimAngle = Math.atan2(p.y + p.h / 2 - (e.y + 8), dx);
  if (e.shootT <= 0 && Math.abs(dx) < 460 && !lineBlocked(e.x + e.w / 2, e.y + 8, p.x + p.w / 2, p.y + p.h / 2)) {
    enemyShootAtPlayer(e, 150, 0.03, { color: '#8a8fa3', r: 3, dmg: 1 });
    e.shootT = rand(1.8, 2.6);
  }
}

function updateBomber(e, dt, p) {
  if (!p || p.dead) return;
  if (e.fuse > 0) {
    e.fuseT -= dt;
    e.fuseBeep -= dt;
    if (e.fuseBeep <= 0) {
      e.fuseBeep = 0.22;
      AudioSys.alarm();
    }
    if (e.fuseT <= 0) {
      e.dead = true;
      e.exploded = true;
      explode(e.x + e.w / 2, e.y + e.h / 2, 64, 22, { hurtPlayer: true, playerDmg: 2, color: '#ef476f' });
      return;
    }
    e.x += Math.sin(e.t * 4) * 8 * dt;
    return;
  }
  const dx = p.x + p.w / 2 - (e.x + e.w / 2);
  const dy = p.y + p.h / 2 - (e.y + e.h / 2);
  const d = Math.hypot(dx, dy);
  if (d > 1) {
    e.x += (dx / d) * e.speed * dt;
    e.y += (dy / d) * e.speed * dt;
  }
  e.facing = dx >= 0 ? 1 : -1;
  if (d < 62 || e.t > 7.5) {
    e.fuse = 1;
    e.fuseT = 0.95;
    e.fuseBeep = 0;
    AudioSys.alarm();
  }
  e.x = clamp(e.x, 0, game.floor.width - e.w);
  e.y = clamp(e.y, 40, GROUND_Y - e.h);
}

function updateSniper(e, dt, p) {
  if (!p || p.dead) return;
  const dx = p.x + p.w / 2 - (e.x + e.w / 2);
  const dy = p.y + p.h / 2 - (e.y + 6);
  e.facing = dx >= 0 ? 1 : -1;
  e.aimAngle = Math.atan2(dy, dx);
  const blocked = lineBlocked(e.x + e.w / 2, e.y + 6, p.x + p.w / 2, p.y + p.h / 2);

  let target = 0;
  if (Math.abs(dx) > 420) target = e.facing * e.speed;
  else if (Math.abs(dx) < 210) target = -e.facing * e.speed;
  if (blocked) target = e.facing * e.speed;
  e.vx = approach(e.vx, target, 420 * dt);
  moveBody(e, dt, 1);

  e.shootT -= dt;
  if (e.charging) {
    e.chargeT -= dt;
    if (e.chargeT <= 0) {
      e.charging = false;
      e.shootT = rand(2.3, 3.3);
      e.chargeTo = null;
    }
    return;
  }
  if (e.shootT <= 0 && !blocked && Math.abs(dx) > 150 && Math.abs(dx) < 560) {
    e.charging = true;
    e.chargeT = 0.8;
    const sx = e.x + e.w / 2 + e.facing * 8;
    const sy = e.y + 6;
    const end = rayEnd(sx, sy, p.x + p.w / 2, p.y + p.h / 2);
    e.chargeTo = { x: end.x, y: end.y };
    addWarning({
      type: 'line', x: sx, y: sy, x2: end.x, y2: end.y,
      delay: 0.8, color: '#7bf1a8', width: 2, damage: 1, owner: 'sniper',
    });
    e.shootT = 0.8;
  }
}

/* ------------------------------------------------------------
   Bosses
   ------------------------------------------------------------ */

function spawnBoss() {
  const id = game.floor.boss;
  if (!id || game.boss) return;
  const d = BOSS_DEFS[id];
  const b = {
    bossId: id,
    name: d.name,
    title: d.title,
    x: id === 'archivist' ? 570 : 570,
    y: id === 'archivist' ? 148 : GROUND_Y - d.h,
    w: d.w, h: d.h,
    hp: d.hp, maxHp: d.hp,
    score: d.score,
    color: d.color,
    vx: 0, vy: 0,
    facing: -1,
    hitFlash: 0,
    spawnT: 1.15,
    t: 0,
    phase: 1,
    phaseInvuln: 0,
    aiT: 1.1,
    action: null,
    actionT: 0,
    step: 0,
    dead: false,
    deathT: 0,
    fxT: 0,
    summoned: 0,
    tread: 0,
    alpha: 1,
    slam: 0,
    jump: 0,
    chargeDir: -1,
    drawY: 0,
  };
  game.boss = b;
  game.wave = 1;
  game.waveActive = true;
  game.shake = 10;
  game.flash = 0.22;
  game.flashColor = '#ffd23f';
  announce('WARNING', d.name + '  //  ' + d.title, d.color);
  if (AudioSys.ctx) {
    AudioSys.setZone('boss');
    AudioSys.startMusic('boss');
  }
  AudioSys.bossRoar();
  for (let i = 0; i < 26; i++) {
    addParticle(b.x + rand(0, b.w), b.y + rand(0, b.h), rand(-100, 100), rand(-160, 20), rand(1, 4), d.color, rand(0.3, 0.8), 200, true);
  }
}

function bossEndAction(b) {
  b.action = null;
  b.actionT = 0;
  b.step = 0;
  b.vx = 0;
  b.slam = 0;
  b.aiT = rand(0.72, 1.26) * (b.phase > 1 ? 0.78 : 1);
}

function bossBeginAction(b, action) {
  b.action = action;
  b.actionT = 0;
  b.step = 0;
  b.vx = 0;
  b.slam = 0;
}

function bossRing(b, count, speed, offset, color, opts) {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU + (offset || 0);
    fireEnemyBullet(cx, cy, a, speed, {
      color: color || '#c77dff',
      r: 4,
      dmg: 1,
      life: 5,
      type: (opts && opts.type) || 'normal',
    });
  }
}

function bossAimBullet(b, speed, spread, color) {
  const p = game.player;
  if (!p || p.dead) return;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h * 0.42;
  const a = Math.atan2(p.y + p.h / 2 - cy, p.x + p.w / 2 - cx) + rand(-(spread || 0), spread || 0);
  fireEnemyBullet(cx, cy, a, speed, { color: color || b.color, r: 4, dmg: 1, life: 5 });
}

function bossLaser(b, delay, damage, color) {
  const p = game.player;
  if (!p || p.dead) return;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const end = rayEnd(cx, cy, p.x + p.w / 2, p.y + p.h / 2);
  addWarning({
    type: 'line', x: cx, y: cy, x2: end.x, y2: end.y,
    delay: delay || 0.7, color: color || '#ff3355', width: 4, damage: damage || 2,
  });
}

function updateBoss(dt) {
  const b = game.boss;
  if (!b) return;
  b.t += dt;
  b.hitFlash = Math.max(0, b.hitFlash - dt);
  b.phaseInvuln = Math.max(0, b.phaseInvuln - dt);
  b.tread += Math.abs(b.vx) * dt * 0.06;
  if (b.dead) { updateBossDeath(b, dt); return; }
  if (b.spawnT > 0) {
    b.spawnT -= dt;
    return;
  }
  if (b.bossId === 'foreman') updateForeman(b, dt);
  else if (b.bossId === 'archivist') updateArchivist(b, dt);
  else updateCEO(b, dt);

  b.x = clamp(b.x, 24, game.floor.width - b.w - 100);
  const p = game.player;
  if (p && !p.dead && b.phaseInvuln <= 0 && aabb(b, p)) {
    hurtPlayer(b.bossId === 'ceo' && b.phase >= 3 ? 2 : 1, b.x + b.w / 2);
  }
}

function updateForeman(b, dt) {
  const p = game.player;
  if (!p || p.dead) return;
  b.y = GROUND_Y - b.h;
  const dx = p.x + p.w / 2 - (b.x + b.w / 2);
  b.facing = dx >= 0 ? 1 : -1;

  if (b.action) {
    b.actionT += dt;
    if (b.action === 'stomp') {
      if (b.actionT > 0.52 && b.step === 0) {
        b.step = 1;
        spawnShockwave(b.x + 8, -1, '#ff9f1c');
        spawnShockwave(b.x + b.w - 8, 1, '#ff9f1c');
        game.shake = Math.max(game.shake, 9);
        AudioSys.explosion(false);
        for (let i = 0; i < 16; i++) addParticle(b.x + b.w / 2, GROUND_Y - 2, rand(-130, 130), rand(-120, -10), rand(1, 3), '#ffd23f', rand(0.25, 0.6), 380, true);
      }
      if (b.actionT > 1.15) bossEndAction(b);
    } else if (b.action === 'burst') {
      const times = [0.15, 0.34, 0.53, 0.72, 0.91, 1.08];
      while (b.step < times.length && b.actionT > times[b.step]) {
        b.step++;
        bossAimBullet(b, 205, 0.045, '#ffb703');
        bossAimBullet(b, 205, 0.09, '#ff9f1c');
        for (let i = 0; i < 3; i++) addParticle(b.x + b.w - 2, b.y + 43, rand(30, 100), rand(-60, 60), 2, '#ffd23f', 0.18, 0, true);
      }
      if (b.actionT > 1.45) bossEndAction(b);
    } else if (b.action === 'charge') {
      if (b.actionT < 0.4) {
        b.vx = 0;
        game.shake = Math.max(game.shake, 2);
      } else if (b.actionT < 1.08) {
        b.vx = b.chargeDir * 310;
        b.x += b.vx * dt;
        if (b.x <= 22 || b.x >= game.floor.width - b.w - 96) {
          b.x = clamp(b.x, 22, game.floor.width - b.w - 96);
          game.shake = Math.max(game.shake, 10);
          AudioSys.explosion(false);
          b.actionT = 1.08;
        }
        if (p && aabb(b, p)) hurtPlayer(2, b.x + b.w / 2);
      } else {
        b.vx = 0;
        if (b.actionT > 1.35) bossEndAction(b);
      }
    } else if (b.action === 'summon') {
      if (b.actionT > 0.42 && b.step === 0) {
        b.step = 1;
        b.summoned++;
        spawnEnemy('grunt', false, 0.05);
        spawnEnemy('grunt', false, 0.25);
        AudioSys.alarm();
      }
      if (b.actionT > 1.2) bossEndAction(b);
    }
    return;
  }

  b.aiT -= dt;
  if (Math.abs(dx) > 150) b.vx = approach(b.vx, b.facing * (b.phase > 1 ? 42 : 28), 160 * dt);
  else b.vx = approach(b.vx, 0, 220 * dt);
  b.x += b.vx * dt;

  if (b.aiT <= 0) {
    if (b.hp < b.maxHp * 0.5 && b.summoned < 1) {
      bossBeginAction(b, 'summon');
    } else {
      const roll = Math.random();
      if (Math.abs(dx) < 190 && roll < 0.45) bossBeginAction(b, 'stomp');
      else if (roll < 0.72) bossBeginAction(b, 'burst');
      else {
        bossBeginAction(b, 'charge');
        b.chargeDir = dx >= 0 ? 1 : -1;
      }
    }
  }
}

function updateArchivist(b, dt) {
  const p = game.player;
  if (!p || p.dead) return;
  const dx = p.x + p.w / 2 - (b.x + b.w / 2);
  b.facing = dx >= 0 ? 1 : -1;
  b.y = 146 + Math.sin(b.t * 1.5) * 14;

  if (b.action) {
    b.actionT += dt;
    if (b.action === 'radial') {
      const times = [0.08, 0.36, 0.64];
      while (b.step < times.length && b.actionT > times[b.step]) {
        const count = b.phase > 1 ? 12 : 10;
        bossRing(b, count, b.phase > 1 ? 132 : 112, b.step * 0.26 + b.t * 0.3, '#c77dff');
        b.step++;
        game.shake = Math.max(game.shake, 3);
        AudioSys.beam();
      }
      if (b.actionT > 1.08) bossEndAction(b);
    } else if (b.action === 'laser') {
      if (b.actionT > 0.08 && b.step === 0) {
        b.step = 1;
        bossLaser(b, 0.68, 2, '#ff5d8f');
      }
      if (b.actionT > 0.86 && b.step === 1) {
        b.step = 2;
        bossLaser(b, 0.58, 2, '#ff5d8f');
      }
      if (b.actionT > 1.55) bossEndAction(b);
    } else if (b.action === 'summon') {
      if (b.actionT > 0.32 && b.step === 0) {
        b.step = 1;
        b.summoned++;
        spawnEnemy('drone', false, 0.05);
        spawnEnemy('drone', false, 0.25);
      }
      if (b.actionT > 1.05) bossEndAction(b);
    } else if (b.action === 'teleport') {
      if (b.actionT < 0.34) b.alpha = 1 - b.actionT / 0.34;
      else if (b.actionT < 0.42) {
        if (b.step === 0) {
          b.step = 1;
          const side = p.x < game.floor.width / 2 ? 1 : -1;
          b.x = clamp(p.x + side * 190 - b.w / 2, 90, game.floor.width - b.w - 110);
          b.y = 128;
          bossRing(b, 10, 105, b.t, '#4cc9f0');
          game.shake = Math.max(game.shake, 6);
          AudioSys.alarm();
        }
      } else if (b.actionT < 0.68) {
        b.alpha = (b.actionT - 0.42) / 0.26;
      } else {
        b.alpha = 1;
      }
      if (b.actionT > 1.0) bossEndAction(b);
    }
    return;
  }

  b.aiT -= dt;
  const targetX = p.x + Math.sin(b.t * 0.8) * 130;
  b.x = approach(b.x, clamp(targetX, 100, game.floor.width - b.w - 110), 44 * dt);
  if (b.aiT <= 0) {
    const roll = Math.random();
    if (roll < 0.34) bossBeginAction(b, 'radial');
    else if (roll < 0.62) bossBeginAction(b, 'laser');
    else if (roll < 0.8 && b.summoned < 2) bossBeginAction(b, 'summon');
    else bossBeginAction(b, 'teleport');
  }
}

function updateCEO(b, dt) {
  const p = game.player;
  if (!p || p.dead) return;
  b.y = GROUND_Y - b.h;
  const dx = p.x + p.w / 2 - (b.x + b.w / 2);
  b.facing = dx >= 0 ? 1 : -1;

  if (b.action) {
    b.actionT += dt;
    if (b.action === 'fan') {
      if (b.actionT > 0.16 && b.step === 0) {
        b.step = 1;
        const base = Math.atan2(p.y + p.h / 2 - (b.y + 34), p.x + p.w / 2 - (b.x + b.w / 2));
        const count = b.phase >= 3 ? 11 : 9;
        for (let i = 0; i < count; i++) {
          const a = base + (i - (count - 1) / 2) * 0.105;
          fireEnemyBullet(b.x + b.w / 2, b.y + 36, a, 195, { color: '#ffd23f', r: 4, life: 5 });
        }
        game.shake = Math.max(game.shake, 5);
        AudioSys.shoot('shotgun');
      }
      if (b.actionT > 0.62 && b.step === 1) {
        b.step = 2;
        const base = Math.atan2(p.y + p.h / 2 - (b.y + 34), p.x + p.w / 2 - (b.x + b.w / 2));
        for (let i = 0; i < 7; i++) {
          const a = base + (i - 3) * 0.12;
          fireEnemyBullet(b.x + b.w / 2, b.y + 36, a, 215, { color: '#ff9f1c', r: 4, life: 5 });
        }
      }
      if (b.actionT > 1.16) bossEndAction(b);
    } else if (b.action === 'missiles') {
      if (b.actionT > 0.08 && b.step === 0) {
        b.step = 1;
        for (let i = -2; i <= 2; i++) {
          const wx = clamp(p.x + p.w / 2 + i * 58, 34, game.floor.width - 34);
          addWarning({
            type: 'circle', x: wx, y: GROUND_Y - 2, r: 36,
            delay: 0.72 + Math.abs(i) * 0.05, color: '#ff9f1c', damage: 1,
          });
        }
        AudioSys.alarm();
      }
      if (b.actionT > 1.55) bossEndAction(b);
    } else if (b.action === 'slam') {
      if (b.actionT < 0.42) {
        b.slam = b.actionT / 0.42;
        b.jump = 0;
        b.vx = 0;
      } else if (b.actionT < 0.84) {
        if (b.step === 0) {
          b.step = 1;
          game.shake = Math.max(game.shake, 4);
        }
        b.jump = (b.actionT - 0.42) / 0.42;
        b.slam = 0;
        b.x = approach(b.x, p.x + p.w / 2 - b.w / 2, 380 * dt);
      } else if (b.step === 1) {
        b.step = 2;
        b.slam = 0;
        b.jump = 0;
        spawnShockwave(b.x + 6, -1, '#ffd23f');
        spawnShockwave(b.x + b.w - 6, 1, '#ffd23f');
        game.shake = Math.max(game.shake, 14);
        AudioSys.explosion(true);
        for (let i = 0; i < 24; i++) addParticle(b.x + b.w / 2, GROUND_Y - 2, rand(-170, 170), rand(-170, -10), rand(1, 4), '#ffd23f', rand(0.3, 0.8), 420, true);
      }
      if (b.actionT > 1.5) bossEndAction(b);
    } else if (b.action === 'lasers') {
      if (b.actionT > 0.06 && b.step === 0) {
        b.step = 1;
        bossLaser(b, 0.64, 2, '#ff5d8f');
      }
      if (b.actionT > 0.58 && b.step === 1) {
        b.step = 2;
        bossLaser(b, 0.52, 2, '#ff5d8f');
      }
      if (b.actionT > 1.28) bossEndAction(b);
    } else if (b.action === 'summon') {
      if (b.actionT > 0.36 && b.step === 0) {
        b.step = 1;
        b.summoned++;
        spawnEnemy('shield', b.phase >= 3, 0.05);
        spawnEnemy('shield', false, 0.25);
        AudioSys.alarm();
      }
      if (b.actionT > 1.15) bossEndAction(b);
    }
    return;
  }

  b.aiT -= dt;
  if (Math.abs(dx) > 200) b.vx = approach(b.vx, b.facing * (b.phase >= 3 ? 52 : 34), 180 * dt);
  else b.vx = approach(b.vx, 0, 260 * dt);
  b.x += b.vx * dt;

  if (b.aiT <= 0) {
    const roll = Math.random();
    if (b.phase >= 2 && b.summoned < 2 && roll < 0.16) bossBeginAction(b, 'summon');
    else if (roll < 0.34) bossBeginAction(b, 'fan');
    else if (roll < 0.58) bossBeginAction(b, 'missiles');
    else if (roll < 0.8) bossBeginAction(b, 'slam');
    else bossBeginAction(b, 'lasers');
  }
}

function spawnShockwave(x, dir, color) {
  game.ebullets.push({
    x, y: GROUND_Y - 10, px: x, py: GROUND_Y - 10,
    vx: dir * 190, vy: 0, r: 8, dmg: 1,
    color: color || '#ff9f1c',
    life: 3.0, type: 'shock', w: 20, h: 10,
    dead: false, seed: rand(0, 10),
  });
}

function damageBoss(b, dmg, heavy) {
  if (!b || b.dead || b.spawnT > 0 || b.phaseInvuln > 0) return false;
  b.hp -= dmg;
  b.hitFlash = 0.09;
  game.shake = Math.max(game.shake, heavy ? 4 : 1.4);
  if (heavy) game.hitstop = Math.max(game.hitstop, 0.018);
  for (let i = 0; i < 4; i++) {
    addParticle(b.x + rand(0, b.w), b.y + rand(0, b.h), rand(-80, 80), rand(-80, 30), rand(1, 3), b.color, 0.25, 160, true);
  }
  AudioSys.hit();
  if (b.hp <= 0) {
    b.hp = 0;
    bossDefeated(b);
    return true;
  }
  checkBossPhase(b);
  return true;
}

function checkBossPhase(b) {
  const frac = b.hp / b.maxHp;
  if (b.bossId === 'foreman' && b.phase === 1 && frac < 0.5) {
    b.phase = 2;
    b.phaseInvuln = 0.85;
    game.ebullets = [];
    game.shake = 14;
    game.flash = 0.35;
    game.flashColor = '#ff9f1c';
    AudioSys.bossRoar();
    announce('OVERDRIVE', 'FOREMAN-9 IS NOT FOLLOWING SAFETY GUIDELINES', '#ff9f1c');
    bossRing(b, 12, 130, b.t, '#ff9f1c');
  } else if (b.bossId === 'archivist' && b.phase === 1 && frac < 0.5) {
    b.phase = 2;
    b.phaseInvuln = 0.85;
    game.ebullets = [];
    game.shake = 13;
    game.flash = 0.35;
    game.flashColor = '#c77dff';
    AudioSys.bossRoar();
    announce('INDEX CORRUPTED', 'THE ARCHIVIST IS REWRITING THE ROOM', '#c77dff');
    bossRing(b, 16, 120, b.t, '#c77dff');
  } else if (b.bossId === 'ceo') {
    if (b.phase === 1 && frac < 0.66) {
      b.phase = 2;
      b.phaseInvuln = 0.75;
      game.ebullets = [];
      game.shake = 13;
      game.flash = 0.32;
      game.flashColor = '#ffd23f';
      AudioSys.bossRoar();
      announce('PHASE 2', 'MANDATORY SYNERGY', '#ffd23f');
      bossRing(b, 12, 130, b.t, '#ffd23f');
    } else if (b.phase === 2 && frac < 0.33) {
      b.phase = 3;
      b.phaseInvuln = 0.9;
      game.ebullets = [];
      game.shake = 16;
      game.flash = 0.4;
      game.flashColor = '#ff5d73';
      AudioSys.bossRoar();
      announce('FINAL REVIEW', 'NO SEVERANCE PACKAGE', '#ff5d73');
      bossRing(b, 18, 145, b.t, '#ff5d73');
    }
  }
}

function bossDefeated(b) {
  b.dead = true;
  b.deathT = 0;
  b.fxT = 0;
  b.action = null;
  game.shake = 18;
  game.flash = 0.55;
  game.flashColor = '#ffd23f';
  game.ebullets = [];
  AudioSys.stopMusic();
  AudioSys.explosion(true);
  const bonus = b.score;
  game.pot += bonus;
  game.kills++;
  addText('BOSS +' + bonus, b.x + b.w / 2, b.y - 10, '#ffd23f', 3);
  addRing(b.x + b.w / 2, b.y + b.h / 2, 120, '#ffd23f', 0.7);
  for (let i = 0; i < 55; i++) {
    addParticle(b.x + b.w / 2 + rand(-20, 20), b.y + b.h / 2 + rand(-20, 20), rand(-230, 230), rand(-230, 90), rand(1, 5), pick(['#ffd23f', '#ff9f1c', '#ff5d73', '#ffffff']), rand(0.4, 1.2), 300, true);
  }
  for (let i = 0; i < game.enemies.length; i++) {
    const e = game.enemies[i];
    if (e.dead) continue;
    e.dead = true;
    for (let k = 0; k < 6; k++) addParticle(e.x + e.w / 2, e.y + e.h / 2, rand(-90, 90), rand(-90, 30), rand(1, 3), '#ff8fa3', 0.4, 300, true);
  }
}

function updateBossDeath(b, dt) {
  b.deathT += dt;
  b.fxT -= dt;
  if (b.deathT < 2.6 && b.fxT <= 0) {
    b.fxT = 0.13;
    const x = b.x + rand(0, b.w);
    const y = b.y + rand(0, b.h);
    explode(x, y, rand(24, 48), 0, { silent: true, color: pick(['#ffd23f', '#ff9f1c', '#ff5d73']), big: false });
    game.shake = Math.max(game.shake, 9);
    if (chance(0.3)) AudioSys.explosion(false);
  }
  if (b.deathT > 2.6) {
    game.boss = null;
    if (game.floor.no === 12) victory();
    else clearFloor();
  }
}

/* ------------------------------------------------------------
   Update orchestration
   ------------------------------------------------------------ */

function announce(text, sub, color) {
  game.banner = {
    text, sub: sub || '', color: color || '#ffd23f',
    t: 2.35, max: 2.35,
  };
}

function updateCamera(dt) {
  if (!game.floor || !game.player) return;
  const p = game.player;
  const look = clamp((mouse.x - SCREEN_W / 2) / SCREEN_W, -1, 1) * 70;
  const target = clamp(p.x + p.w / 2 - SCREEN_W / 2 + look * 0.55, 0, game.floor.width - SCREEN_W);
  game.cam = lerp(game.cam, target, 1 - Math.pow(0.001, dt * 0.9));
}

function updateWaves(dt) {
  if (!game.floor || !game.waveActive || game.floorCleared) return;
  if (!game.player || game.player.dead || game.state !== 'play') return;
  if (game.boss) return;
  if (game.enemies.length === 0 && game.spawners.length === 0) {
    if (game.waveClearDelay <= 0) {
      game.waveClearDelay = 0.85;
    } else {
      game.waveClearDelay -= dt;
      if (game.waveClearDelay <= 0) {
        game.waveActive = false;
        if (game.wave < game.waveTotal) startWave();
        else clearFloor();
      }
    }
  }
}

function updateTitle(dt) {
  game.titleT += dt;
  game.cam = 70 + Math.sin(game.t * 0.09) * 42;
  const p = game.player;
  if (p) {
    const sx = p.x + p.w / 2;
    const sy = p.y + 8;
    p.aim = Math.atan2(mouse.y - sy, mouse.x + game.cam - sx);
    p.facing = Math.cos(p.aim) >= 0 ? 1 : -1;
    p.walkT += dt * 0.4;
  }
  if (chance(dt * 3.2)) {
    addParticle(rand(0, SCREEN_W) + game.cam, rand(30, 280), rand(-8, 8), rand(-16, -4), 1, 'rgba(220,240,255,.7)', rand(1, 2.4), 0, false);
  }
  updateParticles(dt);
}

function updateIntro(dt) {
  updateCamera(dt);
  const p = game.player;
  if (p) {
    const sx = p.x + p.w / 2;
    const sy = p.y + 8;
    p.aim = Math.atan2(mouse.y - sy, mouse.x + game.cam - sx);
    p.facing = Math.cos(p.aim) >= 0 ? 1 : -1;
  }
  updateParticles(dt);
  if (game.banner) {
    game.banner.t -= dt;
    if (game.banner.t <= 0) game.banner = null;
  }
  if (game.stateT >= (game.floor.boss ? 2.9 : 2.15)) beginPlay();
}

function updatePlay(dt) {
  game.runTime += dt;
  game.floorTime += dt;
  if (game.banner) {
    game.banner.t -= dt;
    if (game.banner.t <= 0) game.banner = null;
  }
  if (game.comboT > 0) {
    game.comboT -= dt;
    if (game.comboT <= 0) {
      game.combo = 0;
      game.comboT = 0;
    }
  }
  game.comboPulse = Math.max(0, game.comboPulse - dt * 4.5);

  updatePlayer(dt);
  updateSpawners(dt);
  updateEnemies(dt);
  updateBoss(dt);
  updateBullets(dt);
  updateEnemyBullets(dt);
  updateWarnings(dt);
  updatePickups(dt);
  updateParticles(dt);
  updateTexts(dt);
  updateRings(dt);
  updateGhosts(dt);
  for (let i = 0; i < game.beams.length; i++) game.beams[i].t -= dt;
  game.beams = game.beams.filter((b) => b.t > 0);
  updateWaves(dt);
  updateCamera(dt);

  if (game.victoryDelay > 0) {
    game.victoryDelay -= dt;
    if (game.victoryDelay <= 0) victory();
  }
}

function updateDying(dt) {
  updateParticles(dt);
  updateTexts(dt);
  updateRings(dt);
  updateGhosts(dt);
  for (let i = 0; i < game.beams.length; i++) game.beams[i].t -= dt;
  game.beams = game.beams.filter((b) => b.t > 0);
  updateCamera(dt);
  game.deadT += dt;
  if (game.deadT > 1.8) gameOver();
}

function update(dt) {
  game.t += dt;
  game.stateT += dt;
  game.flash = Math.max(0, game.flash - dt * 2.7);
  game.shake = Math.max(0, game.shake - dt * 34);

  if (game.state === 'title') {
    updateTitle(dt);
    return;
  }
  if (game.state === 'how') {
    return;
  }
  if (game.state === 'intro') {
    updateIntro(dt);
    return;
  }
  if (game.state === 'play') {
    updatePlay(dt);
    return;
  }
  if (game.state === 'dying') {
    updateDying(dt);
    return;
  }
  if (game.state === 'victory') {
    if (game.banner) {
      game.banner.t -= dt;
      if (game.banner.t <= 0) game.banner = null;
    }
    updateParticles(dt);
    updateRings(dt);
    if (chance(dt * 2.2)) {
      addParticle(rand(30, 610), rand(20, 240), rand(-50, 50), rand(-70, -10), rand(1, 3), pick(['#ffd23f', '#4cc9f0', '#ef476f', '#7bf1a8']), rand(0.8, 1.8), 80, false);
    }
    return;
  }
  if (game.state === 'gameover') {
    updateParticles(dt);
    updateRings(dt);
    return;
  }
  if (game.state === 'risk') {
    updateParticles(dt);
    return;
  }
  if (game.state === 'clear') {
    updateParticles(dt);
    if (game.stateT > 1.35) {
      game.state = 'risk';
      game.stateT = 0;
      AudioSys.alarm();
    }
    return;
  }
}

/* ------------------------------------------------------------
   Render helper — panels and text
   ------------------------------------------------------------ */

function panel(x, y, w, h, fill, border, alpha) {
  const a = alpha == null ? 1 : alpha;
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = prev * a;
  ctx.fillStyle = fill || 'rgba(8,8,16,.9)';
  ctx.fillRect(x, y, w, h);
  if (border) {
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
  ctx.globalAlpha = prev;
}

function borderCorners(x, y, w, h, color, size) {
  const s = size || 5;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, s, 1);
  ctx.fillRect(x, y, 1, s);
  ctx.fillRect(x + w - s, y, s, 1);
  ctx.fillRect(x + w - 1, y, 1, s);
  ctx.fillRect(x, y + h - 1, s, 1);
  ctx.fillRect(x, y + h - s, 1, s);
  ctx.fillRect(x + w - s, y + h - 1, s, 1);
  ctx.fillRect(x + w - 1, y + h - s, 1, s);
}

function button(r, label, sub, opts) {
  const o = opts || {};
  const isHover = hover(r);
  const disabled = !!o.disabled;
  const fill = disabled ? 'rgba(12,12,20,.6)' : isHover ? (o.hoverFill || 'rgba(255,210,63,.14)') : 'rgba(8,8,16,.78)';
  const border = disabled ? '#2a2a3c' : isHover ? (o.color || '#ffd23f') : 'rgba(138,138,168,.48)';
  panel(r.x, r.y, r.w, r.h, fill, border);
  if (!disabled) borderCorners(r.x, r.y, r.w, r.h, hexA(o.color || '#ffd23f', 0.85), 4);
  const color = disabled ? '#4d4d64' : isHover ? (o.color || '#ffd23f') : '#d8d4e6';
  drawText(label, r.x + 10, r.y + Math.floor((r.h - 7) / 2), { scale: 1, color });
  if (sub) {
    drawText(sub, r.x + r.w - 9, r.y + Math.floor((r.h - 7) / 2), { scale: 1, color: disabled ? '#3f3f54' : '#7d7d9c', align: 'right' });
  } else {
    const arrow = isHover ? '>' : ' ';
    drawText(arrow, r.x + r.w - 12, r.y + Math.floor((r.h - 7) / 2), { scale: 1, color });
  }
}

/* ------------------------------------------------------------
   World rendering
   ------------------------------------------------------------ */

function render() {
  ctx.clearRect(0, 0, SCREEN_W, SCREEN_H);

  if (game.state === 'title' || game.state === 'how') {
    renderScene(false);
    if (game.state === 'title') drawTitle();
    else drawHow();
  } else if (game.state === 'risk') {
    renderScene(false);
    drawRisk();
  } else if (game.state === 'clear') {
    renderScene(false);
    drawClear();
  } else {
    renderScene(true);
    drawHUD();
    if (game.state === 'intro') drawIntro();
    else if (game.state === 'paused') drawPause();
    else if (game.state === 'gameover') drawGameover();
    else if (game.state === 'victory') drawVictory();
    else if (game.state === 'dying') drawDying();
    if (game.banner && game.state === 'play') drawBanner();
  }

  if (game.flash > 0) {
    ctx.globalAlpha = clamp(game.flash, 0, 0.6);
    ctx.fillStyle = game.flashColor;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    ctx.globalAlpha = 1;
  }
  if (game.state !== 'gameover' && game.state !== 'victory') drawCursor();
}

function renderScene(withHud) {
  const floor = game.floor;
  if (!floor) return;
  drawBackground(floor, game.cam, game.t);

  const shakeX = game.shake > 0 ? rand(-game.shake, game.shake) : 0;
  const shakeY = game.shake > 0 ? rand(-game.shake * 0.55, game.shake * 0.55) : 0;
  ctx.save();
  ctx.translate(-Math.round(game.cam) + Math.round(shakeX), Math.round(shakeY));

  drawGround(floor);
  drawPlatforms(floor, game.t);
  drawElevator(floor, game.elevatorOpen, game.t);
  drawWarnings();
  drawPickups();
  drawSpawners();
  for (let i = 0; i < game.enemies.length; i++) drawEnemy(game.enemies[i]);
  if (game.boss) {
    drawBoss(game.boss, game.t);
    drawBossCue(game.boss);
  }
  drawPlayer();
  drawBullets();
  drawEnemyBullets();
  drawBeams();
  drawParticlesWorld();
  drawRings();
  drawTexts();
  drawLiftPrompt();
  ctx.restore();

  drawForeground(game.cam, game.t);

  if (game.player && game.player.hp <= 2 && game.player.hp > 0 && game.state !== 'title') {
    const pulse = 0.18 + Math.sin(game.t * 5) * 0.06;
    const g = ctx.createRadialGradient(SCREEN_W / 2, SCREEN_H / 2, SCREEN_H * 0.32, SCREEN_W / 2, SCREEN_H / 2, SCREEN_H * 0.72);
    g.addColorStop(0, 'rgba(255,40,70,0)');
    g.addColorStop(1, 'rgba(255,30,60,' + pulse.toFixed(3) + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  }
}

function drawPlayer() {
  const p = game.player;
  if (!p || p.dead) return;
  if (game.state === 'title' && p.inLift) return;

  const bob = p.onGround && Math.abs(p.vx) > 20 ? Math.sin(p.walkT * 3.2) : Math.sin(game.t * 3) * 0.4;
  const py = p.y + bob;

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,.32)';
  ctx.beginPath();
  ctx.ellipse(p.x + p.w / 2, GROUND_Y + 1, 8, 3, 0, 0, TAU);
  ctx.fill();

  for (let i = 0; i < game.ghosts.length; i++) {
    const g = game.ghosts[i];
    const a = (g.life / g.max) * 0.18;
    drawSprite(SPR.player, g.x, g.y, { flip: g.facing < 0, flash: true, alpha: a });
  }

  let flash = false;
  if (p.hurtFlash > 0 && Math.floor(p.hurtFlash * 55) % 2 === 0) flash = true;
  let alpha = 1;
  if (p.invuln > 0 && p.hurtFlash <= 0 && Math.floor(game.t * 22) % 2 === 0) alpha = 0.55;
  drawSprite(SPR.player, p.x, py, { flip: p.facing < 0, flash, alpha });
  drawGun(p, bob);

  if (p.muzzleT > 0) {
    const mx = p.x + p.w / 2 + Math.cos(p.aim) * (WEAPONS[p.weapon].shape === 'rail' ? 19 : 14);
    const my = p.y + 8 + bob + Math.sin(p.aim) * 10;
    drawGlow(mx, my, 13, WEAPONS[p.weapon].color, 0.45);
  }
}

function drawGun(p, bob) {
  const def = WEAPONS[p.weapon] || WEAPONS.pistol;
  const sx = p.x + p.w / 2;
  const sy = p.y + 8 + (bob || 0);
  const rec = p.recoil * 2.5;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(p.aim);
  ctx.translate(-rec, 0);

  const dark = '#1b1a2a';
  const steel = '#7e8097';
  const light = '#c9cbdb';
  let len = 9;

  if (def.shape === 'shotgun') {
    len = 13;
    ctx.fillStyle = dark;
    ctx.fillRect(2, -2, 13, 5);
    ctx.fillStyle = def.color;
    ctx.fillRect(3, -1, 12, 3);
    ctx.fillStyle = light;
    ctx.fillRect(3, -1, 8, 1);
    ctx.fillStyle = '#4a2c2c';
    ctx.fillRect(0, 2, 4, 4);
  } else if (def.shape === 'smg') {
    len = 11;
    ctx.fillStyle = dark;
    ctx.fillRect(1, -2, 11, 5);
    ctx.fillStyle = def.color;
    ctx.fillRect(2, -1, 10, 2);
    ctx.fillStyle = dark;
    ctx.fillRect(3, 2, 3, 5);
    ctx.fillRect(7, 1, 4, 2);
  } else if (def.shape === 'rocket') {
    len = 14;
    ctx.fillStyle = dark;
    ctx.fillRect(0, -3, 15, 7);
    ctx.fillStyle = def.color;
    ctx.fillRect(1, -2, 13, 4);
    ctx.fillStyle = light;
    ctx.fillRect(0, -3, 3, 2);
    ctx.fillStyle = '#3a2c2c';
    ctx.fillRect(4, 3, 4, 4);
  } else if (def.shape === 'rail') {
    len = 17;
    ctx.fillStyle = dark;
    ctx.fillRect(0, -2, 18, 5);
    ctx.fillStyle = def.color;
    ctx.fillRect(1, -1, 17, 2);
    ctx.fillStyle = '#e0aaff';
    ctx.fillRect(5, -3, 2, 7);
    ctx.fillRect(10, -3, 2, 7);
    ctx.fillRect(14, -3, 2, 7);
  } else {
    ctx.fillStyle = dark;
    ctx.fillRect(0, -2, 10, 4);
    ctx.fillStyle = def.color;
    ctx.fillRect(1, -1, 9, 2);
    ctx.fillStyle = steel;
    ctx.fillRect(0, -2, 4, 1);
    ctx.fillStyle = '#3d2a2a';
    ctx.fillRect(1, 2, 3, 4);
  }

  // hand
  ctx.fillStyle = '#ffc38a';
  ctx.fillRect(0, -2, 3, 4);
  ctx.fillStyle = '#d18b5c';
  ctx.fillRect(0, 1, 2, 2);

  // muzzle flash
  if (p.muzzleT > 0) {
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.moveTo(len + 2, 0);
    ctx.lineTo(len + 7, -4);
    ctx.lineTo(len + 5, 0);
    ctx.lineTo(len + 8, 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = def.color;
    ctx.fillRect(len + 1, -1, 4, 2);
  }
  ctx.restore();
}

function drawBossCue(b) {
  if (!b || b.dead || b.spawnT > 0) return;
  const pulse = 0.45 + Math.sin(game.t * 18) * 0.2;
  if (b.bossId === 'foreman') {
    if (b.action === 'charge' && b.actionT < 0.4) {
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#ff3355';
      const dir = b.chargeDir;
      const start = b.x + b.w / 2;
      for (let i = 0; i < 4; i++) {
        const x = start + dir * (34 + i * 26);
        ctx.beginPath();
        ctx.moveTo(x - dir * 7, GROUND_Y - 15);
        ctx.lineTo(x + dir * 3, GROUND_Y - 9);
        ctx.lineTo(x - dir * 7, GROUND_Y - 3);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,51,85,.18)';
      ctx.fillRect(Math.min(start, start + dir * 130), GROUND_Y - 2, Math.abs(dir * 130), 2);
      ctx.globalAlpha = 1;
      ctx.restore();
      drawText('!', b.x + b.w / 2, b.y - 16, { scale: 2, color: '#ff3355', align: 'center', outline: true });
    }
    if (b.action === 'stomp' && b.actionT < 0.52) {
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = '#ff3355';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(b.x + b.w / 2, GROUND_Y - 1, 38 + b.actionT * 30, 7, 0, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  } else if (b.bossId === 'ceo') {
    if (b.action === 'slam' && b.actionT < 0.84 && game.player) {
      const px = game.player.x + game.player.w / 2;
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = '#ffd23f';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.ellipse(px, GROUND_Y - 1, 36, 7, 0, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,210,63,.1)';
      ctx.beginPath();
      ctx.ellipse(px, GROUND_Y - 2, 34, 6, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }
}

function drawEnemy(e) {
  if (!e || e.dead) return;
  const def = ENEMY_DEFS[e.type];
  if (!def) return;

  let bob = 0;
  if (e.type === 'drone') bob = Math.sin(e.t * 5 + e.seed) * 2;
  else if (e.type === 'bomber') bob = Math.sin(e.t * 8) * 1.4;
  else if (e.type === 'runner') bob = Math.sin(e.t * 16) * 0.8;
  else if (e.type === 'grunt' || e.type === 'shield' || e.type === 'sniper') bob = e.onGround && Math.abs(e.vx) > 6 ? Math.sin(e.t * 11) * 1 : 0;

  let spr = SPR[e.type];
  if (!spr) spr = SPR.grunt;

  if (e.type === 'drone' || e.type === 'bomber') {
    drawGlow(e.x + e.w / 2, e.y + e.h / 2, 20, e.elite ? '#ffd23f' : (e.type === 'bomber' ? '#ff5d73' : '#4cc9f0'), 0.08);
  }
  if (e.elite) {
    drawGlow(e.x + e.w / 2, e.y + e.h / 2, 30, '#ffd23f', 0.1 + Math.sin(e.t * 4) * 0.03);
  }

  ctx.fillStyle = 'rgba(0,0,0,.28)';
  if (!e.flying) {
    ctx.beginPath();
    ctx.ellipse(e.x + e.w / 2, GROUND_Y + 1, e.w * 0.6, 2, 0, 0, TAU);
    ctx.fill();
  }

  const flash = e.hitFlash > 0 && Math.floor(e.hitFlash * 80) % 2 === 0;
  let alpha = e.spawnT > 0 ? clamp(1 - e.spawnT / 0.24, 0.3, 1) : 1;
  drawSprite(spr, e.x, e.y + bob, { flip: e.facing < 0, flash, alpha, scale: e.scale });

  if (e.type === 'turret') {
    ctx.save();
    ctx.translate(e.x + e.w / 2, e.y + 5 + bob);
    ctx.rotate(e.aimAngle);
    ctx.fillStyle = '#2e2e40';
    ctx.fillRect(2, -3, 12, 6);
    ctx.fillStyle = '#c7cad8';
    ctx.fillRect(4, -2, 10, 2);
    ctx.fillStyle = '#ff5d73';
    ctx.fillRect(12, -1, 2, 2);
    ctx.restore();
    if (e.shootT < 0.45 && e.burstLeft <= 0) {
      drawGlow(e.x + e.w / 2, e.y + 5, 7, '#ff5d73', 0.3);
    }
  } else if (e.type === 'sniper') {
    ctx.save();
    ctx.translate(e.x + e.w / 2, e.y + 6 + bob);
    ctx.rotate(e.aimAngle);
    ctx.fillStyle = '#1a1522';
    ctx.fillRect(0, -2, 18, 4);
    ctx.fillStyle = '#7bf1a8';
    ctx.fillRect(4, -1, 12, 1);
    ctx.fillStyle = '#2a1a3e';
    ctx.fillRect(0, 1, 5, 3);
    ctx.restore();
    if (e.charging && e.chargeTo) {
      ctx.strokeStyle = 'rgba(123,241,168,.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(e.x + e.w / 2, e.y + 6 + bob);
      ctx.lineTo(e.chargeTo.x, e.chargeTo.y);
      ctx.stroke();
    }
    if (e.shootT < 0.18 && !e.charging) drawGlow(e.x + e.w / 2, e.y + 6, 8, '#7bf1a8', 0.3);
  } else if (e.type === 'grunt' || e.type === 'shield' || e.type === 'runner') {
    ctx.save();
    ctx.translate(e.x + e.w / 2, e.y + 7 + bob);
    ctx.rotate(e.aimAngle);
    ctx.fillStyle = '#242433';
    if (e.type === 'runner') ctx.fillRect(2, -1, 6, 2);
    else ctx.fillRect(3, -1, 8, 2);
    ctx.fillStyle = e.type === 'shield' ? '#8a8fa3' : '#5b6ee1';
    ctx.fillRect(3, -1, 4, 1);
    if (e.muzzleT > 0) {
      ctx.fillStyle = '#ffe66d';
      ctx.fillRect(11, -1, 2, 2);
    }
    ctx.restore();
  }

  if (e.type === 'shield') {
    const sx = e.facing > 0 ? e.x + e.w + 1 : e.x - 5;
    ctx.fillStyle = '#191925';
    ctx.fillRect(sx, e.y + 1, 4, e.h - 2);
    ctx.fillStyle = '#8a8fa3';
    ctx.fillRect(sx + 1, e.y + 2, 2, e.h - 4);
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(sx + 1, e.y + Math.floor(e.h * 0.38), 2, 4);
    ctx.fillStyle = 'rgba(255,210,63,.18)';
    ctx.fillRect(sx - 1, e.y, 6, 1);
  }

  if (e.type === 'bomber') {
    if (e.fuse > 0) {
      const blink = Math.sin(e.t * 32) > 0;
      if (blink) drawGlow(e.x + e.w / 2, e.y + e.h / 2, 34, '#ff3355', 0.28);
      drawText('!', e.x + e.w / 2, e.y - 12, { scale: 1, color: blink ? '#ff3355' : '#ffd23f', align: 'center', outline: true });
      ctx.strokeStyle = blink ? '#ff3355' : '#ffd23f';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(e.x + e.w / 2, e.y + e.h / 2, 12 + Math.sin(e.t * 20) * 2, 0, TAU);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(e.x + e.w / 2 - 1, e.y - 4, 2, 4);
      ctx.fillStyle = '#ff8fa3';
      ctx.fillRect(e.x + e.w / 2 - 1, e.y - 5, 2, 1);
    }
  }

  if (e.type === 'drone') {
    ctx.strokeStyle = 'rgba(168,240,255,.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(e.x - 3, e.y + 2 + bob);
    ctx.lineTo(e.x + 4, e.y + 2 + bob);
    ctx.moveTo(e.x + e.w - 4, e.y + 2 + bob);
    ctx.lineTo(e.x + e.w + 3, e.y + 2 + bob);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,90,110,.8)';
    ctx.fillRect(e.x + e.w / 2 - 1, e.y + e.h - 1 + bob, 2, 1);
  }

  if (e.elite) {
    ctx.fillStyle = '#ffd23f';
    const cx = e.x + e.w / 2;
    ctx.fillRect(cx - 5, e.y - 7 + bob, 2, 2);
    ctx.fillRect(cx - 3, e.y - 9 + bob, 2, 2);
    ctx.fillRect(cx - 1, e.y - 7 + bob, 2, 2);
  }

  if (e.hp < e.maxHp || e.elite) {
    const bw = Math.max(14, e.w);
    const bx = Math.round(e.x + (e.w - bw) / 2);
    const by = Math.round(e.y - 4 + bob);
    ctx.fillStyle = 'rgba(5,5,10,.8)';
    ctx.fillRect(bx - 1, by - 1, bw + 2, 4);
    ctx.fillStyle = e.elite ? '#ffd23f' : '#ff5d73';
    ctx.fillRect(bx, by, Math.max(1, Math.round(bw * (e.hp / e.maxHp))), 2);
  }
}

function drawSpawners() {
  for (let i = 0; i < game.spawners.length; i++) {
    const s = game.spawners[i];
    const progress = clamp(1 - s.t / s.max, 0, 1);
    const cx = s.x + (s.defW || 12) / 2;
    const cy = s.y + (s.defH || 12) / 2;
    const color = s.elite ? '#ffd23f' : '#4cc9f0';
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(game.t * 3 + s.seed);
    ctx.strokeStyle = hexA(color, 0.35 + progress * 0.5);
    ctx.lineWidth = 1;
    ctx.strokeRect(-10 * progress, -10 * progress, 20 * progress, 20 * progress);
    ctx.restore();
    drawGlow(cx, cy, 18 + progress * 10, color, 0.08 + progress * 0.12);
    ctx.strokeStyle = hexA(color, 0.6);
    ctx.beginPath();
    ctx.arc(cx, cy, 13 * (1 - progress) + 4, 0, TAU);
    ctx.stroke();
    drawText('!', cx, cy - 14, { scale: 1, color, align: 'center' });
  }
}

function drawPickups() {
  for (let i = 0; i < game.pickups.length; i++) {
    const it = game.pickups[i];
    if (it.life < 5 && Math.floor(game.t * 12) % 2 === 0) continue;
    drawPickupCapsule(it, game.t);
    if (it.type === 'weapon') {
      const near = game.player && dist(it.x, it.y, game.player.x, game.player.y) < 70;
      if (near) {
        drawText(WEAPONS[it.weapon].name, it.x + 8, it.y - 12, {
          scale: 1, color: WEAPONS[it.weapon].color, align: 'center', outline: true,
        });
      }
    }
  }
}

function drawWarnings() {
  for (let i = 0; i < game.warnings.length; i++) {
    const w = game.warnings[i];
    if (w.done) continue;
    const p = 1 - clamp(w.t / w.max, 0, 1);
    const pulse = 0.35 + Math.sin(game.t * 22) * 0.18;
    if (w.type === 'line') {
      ctx.save();
      ctx.strokeStyle = hexA(w.color || '#ff3355', 0.25 + p * 0.55);
      ctx.lineWidth = 1 + p * 2;
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -game.t * 40;
      ctx.beginPath();
      ctx.moveTo(w.x, w.y);
      ctx.lineTo(w.x2, w.y2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = hexA(w.color || '#ff3355', pulse);
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.28;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = hexA(w.color || '#ff3355', 0.8);
      ctx.fillRect(w.x2 - 2, w.y2 - 2, 4, 4);
      ctx.restore();
    } else if (w.type === 'circle') {
      const r = w.r || 36;
      ctx.fillStyle = hexA(w.color || '#ff9f1c', 0.055 + p * 0.08);
      ctx.beginPath();
      ctx.arc(w.x, w.y, r, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = hexA(w.color || '#ff9f1c', 0.35 + p * 0.55);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w.x, w.y, r * (0.2 + p * 0.8), 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = hexA(w.color || '#ff9f1c', pulse);
      ctx.beginPath();
      ctx.arc(w.x, w.y, r, 0, TAU);
      ctx.stroke();
    }
  }
}

function drawBullets() {
  for (let i = 0; i < game.bullets.length; i++) {
    const b = game.bullets[i];
    if (b.dead) continue;
    if (b.weapon === 'rocket') {
      const a = Math.atan2(b.vy, b.vx);
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(a);
      ctx.fillStyle = '#f8f4e3';
      ctx.fillRect(-5, -2, 9, 4);
      ctx.fillStyle = '#ef476f';
      ctx.fillRect(-5, -1, 5, 2);
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(-8, -1, 3, 2);
      ctx.restore();
      drawGlow(b.x, b.y, 12, '#ff9f1c', 0.3);
    } else {
      ctx.strokeStyle = hexA(b.color, 0.65);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x - b.vx * 0.015, b.y - b.vy * 0.015);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(b.x - 1, b.y - 1, 2, 2);
      ctx.fillStyle = hexA(b.color, 0.5);
      ctx.fillRect(b.x - 2, b.y - 2, 4, 4);
    }
  }
}

function drawEnemyBullets() {
  for (let i = 0; i < game.ebullets.length; i++) {
    const b = game.ebullets[i];
    if (b.dead) continue;
    if (b.type === 'shock') {
      const dir = sign(b.vx);
      ctx.fillStyle = hexA(b.color, 0.9);
      ctx.beginPath();
      ctx.moveTo(b.x, b.y + 12);
      ctx.lineTo(b.x - dir * 18, b.y + 12);
      ctx.lineTo(b.x - dir * 10, b.y - 2);
      ctx.lineTo(b.x, b.y + 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,243,196,.65)';
      ctx.fillRect(b.x - 6, b.y + 8, 12, 2);
      drawGlow(b.x, b.y + 6, 14, b.color, 0.22);
    } else {
      drawGlow(b.x, b.y, b.r * 4.5, b.color, 0.18);
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r + 1, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fff3c4';
      ctx.fillRect(b.x - 1, b.y - 1, 2, 2);
    }
  }
}

function drawBeams() {
  for (let i = 0; i < game.beams.length; i++) {
    const b = game.beams[i];
    const a = clamp(b.t / b.max, 0, 1);
    const prev = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = hexA(b.color, a * 0.35);
    ctx.lineWidth = b.width * 3;
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();
    ctx.strokeStyle = hexA(b.color, a);
    ctx.lineWidth = b.width;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,' + (a * 0.9).toFixed(3) + ')';
    ctx.lineWidth = Math.max(1, b.width * 0.35);
    ctx.stroke();
    ctx.globalCompositeOperation = prev;
  }
}

function drawParticlesWorld() {
  const prev = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < game.particles.length; i++) {
    const p = game.particles[i];
    if (!p.additive) continue;
    const a = clamp(p.life / p.max, 0, 1);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    const s = Math.max(1, p.size * a);
    ctx.fillRect(p.x, p.y, s, s);
  }
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < game.particles.length; i++) {
    const p = game.particles[i];
    if (p.additive) continue;
    const a = clamp(p.life / p.max, 0, 1);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = prev;
}

function drawRings() {
  const prev = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < game.rings.length; i++) {
    const r = game.rings[i];
    const a = clamp(r.life / r.max, 0, 1);
    ctx.strokeStyle = hexA(r.color, a * 0.65);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r, 0, TAU);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = prev;
}

function drawTexts() {
  for (let i = 0; i < game.texts.length; i++) {
    const t = game.texts[i];
    drawText(t.text, t.x, t.y, {
      scale: t.scale, color: t.color, align: 'center',
      alpha: clamp(t.life / t.max, 0, 1), outline: true,
    });
  }
}

function drawLiftPrompt() {
  if (!game.floorCleared || !game.player) return;
  const floor = game.floor;
  const ex = floor.width - 31;
  if (game.player.x + game.player.w / 2 > floor.width - 166) {
    const bob = Math.sin(game.t * 4) * 2;
    drawText('E', ex, 154 + bob, { scale: 1, color: '#ffd23f', align: 'center', outline: true });
    drawText('RIDE UP', ex, 166 + bob, { scale: 1, color: '#f8f4e3', align: 'center', outline: true });
  } else {
    ctx.globalAlpha = 0.55 + Math.sin(game.t * 5) * 0.25;
    drawText('LIFT >', ex - 4, 150, { scale: 1, color: '#7bf1a8', align: 'center', outline: true });
    ctx.globalAlpha = 1;
  }
}

/* ------------------------------------------------------------
   HUD
   ------------------------------------------------------------ */

function formatTime(s) {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return pad(m, 2) + ':' + pad(ss, 2);
}

function drawHUD() {
  const p = game.player;
  const floor = game.floor;
  if (!p || !floor) return;
  const z = ZONES[floor.zone];

  panel(6, 6, 182, 58, 'rgba(6,6,12,.7)', 'rgba(76,201,240,.16)');
  drawText('FLOOR', 12, 10, { scale: 1, color: '#747491' });
  drawText(pad(floor.no, 2), 12, 18, { scale: 2, color: '#ffd23f' });
  drawText(floor.name, 44, 19, { scale: 1, color: '#f8f4e3' });
  drawText(z.label, 44, 30, { scale: 1, color: hexA(z.trim, 0.8) });

  for (let i = 0; i < p.maxHp; i++) {
    drawHeart(12 + i * 16, 38, i < p.hp, 2);
  }
  const dashReady = p.dashCd <= 0;
  drawText('DASH', 11, 54, { scale: 1, color: dashReady ? '#4cc9f0' : '#4d4d64' });
  ctx.fillStyle = 'rgba(5,5,10,.8)';
  ctx.fillRect(42, 55, 46, 3);
  ctx.fillStyle = dashReady ? '#4cc9f0' : '#38384e';
  ctx.fillRect(42, 55, Math.round(46 * (1 - p.dashCd / PLAYER_TUNE.dashCooldown)), 3);

  panel(442, 6, 192, 64, 'rgba(6,6,12,.7)', 'rgba(255,210,63,.16)');
  drawText('BANKED SCORE', 628, 10, { scale: 1, color: '#747491', align: 'right' });
  drawText(pad(game.score, 7), 628, 18, { scale: 2, color: '#f8f4e3', align: 'right' });
  drawText('POT', 452, 39, { scale: 1, color: '#747491' });
  drawText(pad(game.pot, 5), 544, 39, { scale: 1, color: '#ffd23f', align: 'right' });
  const maxed = game.mult >= MAX_MULT;
  panel(554, 34, 74, 18, maxed ? 'rgba(239,71,111,.2)' : 'rgba(255,210,63,.1)', maxed ? '#ef476f' : 'rgba(255,210,63,.5)');
  drawText('X' + game.mult, 591, 39, { scale: 1, color: maxed ? '#ff8fa3' : '#ffd23f', align: 'center' });

  if (game.boss && !game.boss.dead) {
    const b = game.boss;
    drawText(b.name, 320, 4, { scale: 1, color: '#ff8fa3', align: 'center', outline: true });
    ctx.fillStyle = 'rgba(5,5,10,.85)';
    ctx.fillRect(188, 15, 244, 8);
    ctx.strokeStyle = 'rgba(255,255,255,.2)';
    ctx.strokeRect(188.5, 15.5, 243, 7);
    const frac = clamp(b.hp / b.maxHp, 0, 1);
    const barGrad = ctx.createLinearGradient(190, 0, 430, 0);
    barGrad.addColorStop(0, '#ff5d73');
    barGrad.addColorStop(0.6, '#ff9f1c');
    barGrad.addColorStop(1, '#ffd23f');
    ctx.fillStyle = barGrad;
    ctx.fillRect(190, 17, Math.round(240 * frac), 4);
    for (let i = 0; i < b.phase; i++) {
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(192 + i * 6, 10, 4, 3);
    }
    if (b.spawnT > 0) {
      drawText('INCOMING', 320, 27, { scale: 1, color: '#ffd23f', align: 'center' });
    }
  } else if (game.boss && game.boss.dead) {
    drawText('BOSS DOWN', 320, 8, { scale: 1, color: '#7bf1a8', align: 'center', outline: true });
  } else if (game.floorCleared) {
    drawText('LIFT ONLINE', 320, 8, { scale: 1, color: '#7bf1a8', align: 'center', outline: true });
  } else if (game.waveActive) {
    drawText('WAVE ' + game.wave + ' / ' + game.waveTotal, 320, 8, {
      scale: 1, color: '#d8d4e6', align: 'center', outline: true,
    });
  }

  if (game.combo >= 2) {
    const pulse = 1 + game.comboPulse * 0.15;
    drawText('X' + game.combo, 628, 78, { scale: 2, color: '#4cc9f0', align: 'right', outline: true });
    drawText('COMBO', 628, 95, { scale: 1, color: '#8a8aa8', align: 'right' });
    ctx.fillStyle = 'rgba(5,5,10,.7)';
    ctx.fillRect(548, 106, 80, 3);
    ctx.fillStyle = '#4cc9f0';
    ctx.fillRect(548, 106, Math.round(80 * clamp(game.comboT / 2.6, 0, 1)), 3);
  }

  const def = WEAPONS[p.weapon] || WEAPONS.pistol;
  panel(6, 326, 196, 28, 'rgba(6,6,12,.78)', hexA(def.color, 0.35));
  drawWeaponIcon(p.weapon, 13, 331, def.color, 0.9);
  drawText(def.name, 40, 329, { scale: 1, color: def.color });
  drawText('AMMO', 40, 339, { scale: 1, color: '#5f5f7a' });
  drawText(p.ammo === Infinity ? 'INF' : pad(p.ammo, 3), 194, 339, {
    scale: 1, color: p.ammo === Infinity ? '#8a8aa8' : '#f8f4e3', align: 'right',
  });

  drawText('KILLS ' + pad(game.kills, 3), 628, 329, { scale: 1, color: '#747491', align: 'right' });
  drawText(formatTime(game.runTime), 628, 340, { scale: 1, color: '#8a8aa8', align: 'right' });

  if (floor.no === 1 && game.floorTime < 11 && game.state === 'play') {
    ctx.globalAlpha = clamp(11 - game.floorTime, 0, 1) * 0.8;
    drawText('HOLD LMB TO FIRE  ·  SHIFT TO DASH', 320, 306, {
      scale: 1, color: '#d8d4e6', align: 'center', outline: true,
    });
    ctx.globalAlpha = 1;
  }

  if (game.floorCleared && p.x + p.w / 2 < floor.width - 166) {
    const a = 0.55 + Math.sin(game.t * 6) * 0.3;
    ctx.globalAlpha = a;
    drawText('LIFT', 620, 146, { scale: 1, color: '#7bf1a8', align: 'right', outline: true });
    drawText('>', 632, 146, { scale: 1, color: '#7bf1a8', align: 'right' });
    ctx.globalAlpha = 1;
  }
}

/* ------------------------------------------------------------
   Screens
   ------------------------------------------------------------ */

function drawTitle() {
  const grad = ctx.createLinearGradient(0, 0, 0, SCREEN_H);
  grad.addColorStop(0, 'rgba(4,4,10,.78)');
  grad.addColorStop(0.5, 'rgba(4,4,10,.35)');
  grad.addColorStop(1, 'rgba(4,4,10,.88)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  const glow = ctx.createRadialGradient(320, 88, 10, 320, 88, 240);
  glow.addColorStop(0, 'rgba(255,210,63,.12)');
  glow.addColorStop(1, 'rgba(255,210,63,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SCREEN_W, 300);

  drawText('TURBO ARCADE PRESENTS', 320, 18, { scale: 1, color: '#8a8aa8', align: 'center' });
  const glitch = Math.sin(game.t * 8.2) > 0.982;
  if (glitch) {
    drawText('TOWER', 324, 63, { scale: 7, color: 'rgba(76,201,240,.3)', align: 'center', outline: true });
    drawText('TOWER', 316, 63, { scale: 7, color: 'rgba(239,71,111,.3)', align: 'center', outline: true });
  }
  drawText('TURBO', 320, 31, { scale: 3, color: '#4cc9f0', align: 'center', outline: true, shadow: true });
  drawText('TOWER', 320, 62, { scale: 7, color: '#ffd23f', align: 'center', outline: true, shadow: true });
  drawText('MUST FALL', 320, 114, { scale: 3, color: '#ef476f', align: 'center', outline: true, shadow: true });

  ctx.fillStyle = 'rgba(255,210,63,.55)';
  ctx.fillRect(202, 139, 236, 1);
  drawText('12 FLOORS OF BAD MANAGEMENT', 320, 147, { scale: 1, color: '#d8d4e6', align: 'center' });

  if (save.best > 0) {
    drawText('BEST  ' + pad(save.best, 7) + '   ·   FLOOR ' + pad(save.bestFloor, 2), 320, 162, {
      scale: 1, color: '#ffd23f', align: 'center',
    });
  } else {
    drawText('NO RECORD YET. BE THE FIRST PROBLEM.', 320, 162, { scale: 1, color: '#747491', align: 'center' });
  }

  button(UI.title.start, 'START RUN', 'ENTER', { color: '#ffd23f', hoverFill: 'rgba(255,210,63,.2)' });
  button(UI.title.how, 'HOW TO PLAY', 'H', { color: '#4cc9f0' });
  button(UI.title.mute, 'SOUND: ' + (save.muted ? 'OFF' : 'ON'), 'M', { color: '#7bf1a8' });

  const blink = Math.sin(game.t * 5) > -0.2;
  if (blink) {
    drawText('CLICK OR PRESS ENTER TO CLIMB', 320, 280, {
      scale: 1, color: '#ffd23f', align: 'center', outline: true,
    });
  }
  drawText('KEYBOARD + MOUSE  ·  HEADPHONES RECOMMENDED', 320, 300, { scale: 1, color: '#5f5f7a', align: 'center' });
  drawText('A LOVING ARCADE HOMAGE', 320, 315, { scale: 1, color: '#3f3f54', align: 'center' });
}

function drawHow() {
  ctx.fillStyle = 'rgba(4,4,10,.9)';
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  panel(24, 18, 592, 324, 'rgba(9,9,18,.96)', 'rgba(76,201,240,.28)');
  borderCorners(24, 18, 592, 324, '#4cc9f0', 8);

  drawText('HOW TO SURVIVE', 42, 34, { scale: 2, color: '#f8f4e3' });
  drawText('A FIELD MANUAL FOR THE TERMINALLY UNDERPAID', 42, 52, { scale: 1, color: '#747491' });
  ctx.fillStyle = 'rgba(138,138,168,.25)';
  ctx.fillRect(42, 66, 556, 1);

  drawText('CONTROLS', 44, 82, { scale: 1, color: '#ffd23f' });
  const rows = [
    ['MOVE', 'A / D  OR  ARROWS'],
    ['JUMP', 'SPACE  ·  COYOTE TIME'],
    ['DASH', 'SHIFT  ·  I-FRAMES'],
    ['AIM', 'MOUSE'],
    ['FIRE', 'HOLD LEFT MOUSE'],
    ['RIDE LIFT', 'E  (WHEN IT OPENS)'],
    ['PAUSE', 'ESC  /  P'],
    ['MUTE', 'M'],
  ];
  for (let i = 0; i < rows.length; i++) {
    const y = 100 + i * 16;
    drawText(rows[i][0], 44, y, { scale: 1, color: '#8a8aa8' });
    drawText(rows[i][1], 136, y, { scale: 1, color: '#d8d4e6' });
  }

  ctx.fillStyle = 'rgba(138,138,168,.25)';
  ctx.fillRect(320, 82, 1, 210);

  drawText('THE RULES', 338, 82, { scale: 1, color: '#ffd23f' });
  const rules = [
    ['1', 'CLEAR EVERY WAVE ON THE FLOOR.'],
    ['2', 'GRAB GUNS. AMMO IS LIMITED.'],
    ['3', 'AT THE LIFT: BANK SECURES POINTS'],
    ['', 'AND REPAIRS 1 HEART.'],
    ['4', 'OR RISK: DOUBLE YOUR MULTIPLIER'],
    ['', 'AND CARRY THE POT.'],
    ['5', 'DEATH FORFEITS ALL UNBANKED POINTS.'],
  ];
  for (let i = 0; i < rules.length; i++) {
    const y = 102 + i * 16;
    if (rules[i][0]) drawText(rules[i][0], 338, y, { scale: 1, color: '#ef476f' });
    drawText(rules[i][1], rules[i][0] ? 350 : 356, y, { scale: 1, color: '#d8d4e6' });
  }

  panel(338, 222, 250, 50, 'rgba(255,210,63,.05)', 'rgba(255,210,63,.28)');
  drawText('THE MATH', 348, 230, { scale: 1, color: '#ffd23f' });
  drawText('POT 120  X  MULT 4  =  480 PTS', 348, 243, { scale: 1, color: '#f8f4e3' });
  drawHeart(348, 257, true, 1);
  drawText('BANK = SAFE   *   RISK = X2', 366, 257, { scale: 1, color: '#8a8aa8' });

  drawText('BEST ' + pad(save.best, 7) + '  ·  FLOOR ' + pad(save.bestFloor, 2), 338, 284, {
    scale: 1, color: '#747491',
  });

  ctx.fillStyle = 'rgba(138,138,168,.25)';
  ctx.fillRect(42, 302, 556, 1);
  drawText('ESC / CLICK TO RETURN', 320, 316, { scale: 1, color: '#ffd23f', align: 'center' });
  drawText('CLEAR THE FLOOR. TAKE THE LIFT. DIE WITH DIGNITY.', 320, 330, {
    scale: 1, color: '#4d4d64', align: 'center',
  });
}

function drawIntro() {
  const floor = game.floor;
  const t = clamp(game.stateT / 0.5, 0, 1);
  const ease = 1 - Math.pow(1 - t, 3);
  const slide = (1 - ease) * 44;
  ctx.fillStyle = 'rgba(4,4,10,' + (0.48 * ease).toFixed(3) + ')';
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 82, SCREEN_W, 156);
  ctx.clip();
  ctx.fillStyle = 'rgba(6,6,14,.78)';
  ctx.fillRect(0, 82, SCREEN_W, 156);
  for (let x = -100; x < SCREEN_W + 100; x += 20) {
    ctx.fillStyle = 'rgba(76,201,240,.025)';
    ctx.fillRect(x + (game.stateT * 8) % 20, 82, 8, 156);
  }
  ctx.fillStyle = hexA(ZONES[floor.zone].trim, 0.65);
  ctx.fillRect(0, 82, SCREEN_W, 1);
  ctx.fillRect(0, 238, SCREEN_W, 1);
  ctx.restore();

  drawText('FLOOR ' + pad(floor.no, 2), 320 + slide, 96, {
    scale: 2, color: '#8a8aa8', align: 'center', outline: true,
  });
  drawText(floor.name, 320 - slide, 116, {
    scale: 3, color: floor.boss ? '#ff8fa3' : '#ffd23f', align: 'center', outline: true, shadow: true,
  });
  drawText(ZONES[floor.zone].label + '  //  TURBO TOWERS', 320, 146, {
    scale: 1, color: ZONES[floor.zone].trim, align: 'center',
  });
  drawText(floor.story, 320, 164, { scale: 1, color: '#d8d4e6', align: 'center' });

  if (floor.boss) {
    drawText('BOSS ENCOUNTER', 320, 192, { scale: 2, color: '#ff3355', align: 'center', outline: true });
    drawText(BOSS_DEFS[floor.boss].name, 320, 212, { scale: 1, color: '#ff8fa3', align: 'center' });
  } else {
    drawText('WAVE 1 / ' + game.waveTotal + '  INCOMING', 320, 198, {
      scale: 1, color: '#7bf1a8', align: 'center',
    });
  }
  drawText(floor.tip, 320, 236, { scale: 1, color: '#747491', align: 'center' });

  if (game.stateT > 0.65) {
    ctx.globalAlpha = 0.4 + Math.sin(game.t * 4) * 0.2;
    drawText('ENTER / SPACE TO SKIP', 320, 282, { scale: 1, color: '#f8f4e3', align: 'center' });
    ctx.globalAlpha = 1;
  }
}

function drawBanner() {
  const b = game.banner;
  if (!b) return;
  const a = clamp(Math.min((b.max - b.t) * 4, b.t * 2.4), 0, 1);
  const w = Math.min(500, Math.max(180, textWidth(b.text, 2) + 44, textWidth(b.sub, 1) + 26));
  ctx.globalAlpha = a;
  panel(320 - w / 2, 64, w, b.sub ? 42 : 24, 'rgba(5,5,12,.84)', hexA(b.color, 0.5), 0.9);
  drawText(b.text, 320, 70, { scale: 2, color: b.color, align: 'center', outline: true });
  if (b.sub) drawText(b.sub, 320, 88, { scale: 1, color: '#d8d4e6', align: 'center' });
  ctx.fillStyle = hexA(b.color, 0.5);
  ctx.fillRect(320 - w / 2, 64, 10, 1);
  ctx.fillRect(320 + w / 2 - 10, 64, 10, 1);
  ctx.globalAlpha = 1;
}

function drawRisk() {
  const floor = game.floor;
  const total = Math.round(game.pot * game.mult);
  ctx.fillStyle = 'rgba(4,4,10,.88)';
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  // elevator interior
  ctx.fillStyle = 'rgba(17,15,24,.72)';
  ctx.fillRect(44, 10, 552, 338);
  for (let x = 44; x < 596; x += 69) {
    ctx.fillStyle = 'rgba(255,255,255,.018)';
    ctx.fillRect(x, 10, 1, 338);
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.fillRect(x + 1, 10, 3, 338);
  }
  ctx.fillStyle = '#0c0c15';
  ctx.fillRect(44, 10, 552, 8);
  ctx.fillRect(44, 340, 552, 8);

  drawText('LIFT  //  FLOOR ' + pad(floor.no, 2) + ' CLEARED', 320, 24, {
    scale: 2, color: '#f8f4e3', align: 'center', outline: true,
  });
  drawText('THE DOORS CLOSE. THE NUMBERS WAIT.', 320, 44, {
    scale: 1, color: '#8a8aa8', align: 'center',
  });

  const stats = [
    ['BANKED', pad(game.score, 6), '#f8f4e3'],
    ['POT', pad(game.pot, 6), '#ffd23f'],
    ['MULT', 'X' + game.mult, game.mult > 1 ? '#4cc9f0' : '#8a8aa8'],
    ['IF BANKED', pad(total, 6), '#7bf1a8'],
  ];
  for (let i = 0; i < stats.length; i++) {
    const x = 70 + i * 130;
    drawText(stats[i][0], x, 68, { scale: 1, color: '#747491' });
    drawText(stats[i][1], x, 80, { scale: 1, color: stats[i][2] });
    if (i < stats.length - 1) {
      ctx.fillStyle = 'rgba(138,138,168,.14)';
      ctx.fillRect(x + 116, 68, 1, 22);
    }
  }

  drawText('NEXT  //  FLOOR ' + pad(Math.min(12, floor.no + 1), 2) + '  ' + (FLOORS[Math.min(11, game.floorIndex + 1)].name), 320, 112, {
    scale: 1, color: '#747491', align: 'center',
  });

  // bank panel
  const bankHover = hover(UI.risk.bank);
  const bankColor = bankHover ? '#7bf1a8' : '#4a7d67';
  panel(UI.risk.bank.x, UI.risk.bank.y, UI.risk.bank.w, UI.risk.bank.h, bankHover ? 'rgba(123,241,168,.1)' : 'rgba(5,5,12,.82)', bankColor);
  borderCorners(UI.risk.bank.x, UI.risk.bank.y, UI.risk.bank.w, UI.risk.bank.h, bankColor, 6);
  drawText('1', UI.risk.bank.x + 16, UI.risk.bank.y + 14, { scale: 3, color: '#7bf1a8' });
  drawText('BANK', UI.risk.bank.x + 44, UI.risk.bank.y + 17, { scale: 2, color: '#f8f4e3' });
  drawText('SECURE ' + pad(total, 5) + ' PTS', UI.risk.bank.x + 16, UI.risk.bank.y + 56, { scale: 1, color: '#7bf1a8' });
  drawText('NO RISK. NO GLORY.', UI.risk.bank.x + 16, UI.risk.bank.y + 70, { scale: 1, color: '#5f5f7a' });
  drawHeart(UI.risk.bank.x + 16, UI.risk.bank.y + 88, true, 1);
  drawText('REPAIR 1 HEART', UI.risk.bank.x + 34, UI.risk.bank.y + 88, { scale: 1, color: '#d8d4e6' });
  drawText('E / 1', UI.risk.bank.x + UI.risk.bank.w - 10, UI.risk.bank.y + UI.risk.bank.h - 14, {
    scale: 1, color: '#7bf1a8', align: 'right',
  });

  // risk panel
  const maxed = game.mult >= MAX_MULT;
  const riskHover = hover(UI.risk.risk) && !maxed;
  const riskColor = maxed ? '#3f3f54' : riskHover ? '#ffd23f' : '#8a6d2a';
  panel(UI.risk.risk.x, UI.risk.risk.y, UI.risk.risk.w, UI.risk.risk.h, riskHover ? 'rgba(255,210,63,.1)' : 'rgba(5,5,12,.82)', riskColor);
  borderCorners(UI.risk.risk.x, UI.risk.risk.y, UI.risk.risk.w, UI.risk.risk.h, riskColor, 6);
  drawText('2', UI.risk.risk.x + 16, UI.risk.risk.y + 14, { scale: 3, color: maxed ? '#3f3f54' : '#ffd23f' });
  drawText('RISK', UI.risk.risk.x + 44, UI.risk.risk.y + 17, { scale: 2, color: maxed ? '#5f5f7a' : '#f8f4e3' });
  if (maxed) {
    drawText('MAX MULTIPLIER', UI.risk.risk.x + 16, UI.risk.risk.y + 56, { scale: 1, color: '#5f5f7a' });
    drawText('THE HOUSE HAS NO MORE ROPE.', UI.risk.risk.x + 16, UI.risk.risk.y + 70, { scale: 1, color: '#3f3f54' });
    drawText('BANK IS YOUR ONLY EXIT.', UI.risk.risk.x + 16, UI.risk.risk.y + 88, { scale: 1, color: '#5f5f7a' });
    drawText('LOCKED', UI.risk.risk.x + UI.risk.risk.w - 10, UI.risk.risk.y + UI.risk.risk.h - 14, {
      scale: 1, color: '#3f3f54', align: 'right',
    });
  } else {
    drawText('MULTIPLIER  ' + game.mult + '  >  ' + (game.mult * 2), UI.risk.risk.x + 16, UI.risk.risk.y + 56, { scale: 1, color: '#ffd23f' });
    drawText('CARRY ' + pad(game.pot, 5) + ' PTS UNBANKED', UI.risk.risk.x + 16, UI.risk.risk.y + 70, { scale: 1, color: '#d8d4e6' });
    drawText('DEATH LOSES THE POT', UI.risk.risk.x + 16, UI.risk.risk.y + 88, { scale: 1, color: '#ff8fa3' });
    drawText('R / 2', UI.risk.risk.x + UI.risk.risk.w - 10, UI.risk.risk.y + UI.risk.risk.h - 14, {
      scale: 1, color: '#ffd23f', align: 'right',
    });
  }

  drawText('DEATH FORFEITS ALL UNBANKED POINTS.', 320, 312, {
    scale: 1, color: '#ff5d73', align: 'center', outline: true,
  });
  drawText('BANK TO KEEP THE RUN. RISK TO FEED THE SCORE.', 320, 326, {
    scale: 1, color: '#5f5f7a', align: 'center',
  });
}

function drawClear() {
  ctx.fillStyle = 'rgba(3,3,8,.9)';
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  const t = game.stateT;
  for (let i = 0; i < 10; i++) {
    const x = (i * 71 + (game.t * 90) % 71) % SCREEN_W;
    ctx.fillStyle = 'rgba(76,201,240,.045)';
    ctx.fillRect(x, 0, 2, SCREEN_H);
  }
  drawText('LIFT ASCENDING', 320, 116, {
    scale: 3, color: '#f8f4e3', align: 'center', outline: true, shadow: true,
  });
  drawText('FLOOR ' + pad(game.floor.no, 2) + ' CLEARED', 320, 150, {
    scale: 1, color: '#7bf1a8', align: 'center',
  });
  const next = FLOORS[Math.min(11, game.floorIndex + 1)];
  drawText('NEXT  //  FLOOR ' + pad(next.no, 2) + '  ' + next.name, 320, 176, {
    scale: 1, color: '#8a8aa8', align: 'center',
  });
  const dots = Math.floor(t * 12) % 4;
  drawText('.' .repeat(dots), 320, 200, { scale: 2, color: '#ffd23f', align: 'center' });
  drawText('POT ' + pad(game.pot, 5) + '   ·   MULT X' + game.mult, 320, 236, {
    scale: 1, color: '#ffd23f', align: 'center',
  });
  drawText('KEEP THE POT OR BANK IT?', 320, 260, {
    scale: 1, color: '#747491', align: 'center',
  });
}

function drawPause() {
  ctx.fillStyle = 'rgba(4,4,10,.72)';
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  panel(186, 62, 268, 252, 'rgba(8,8,16,.96)', 'rgba(76,201,240,.3)');
  borderCorners(186, 62, 268, 252, '#4cc9f0', 8);
  drawText('PAUSED', 320, 82, { scale: 3, color: '#f8f4e3', align: 'center', outline: true });
  drawText('FLOOR ' + pad(game.floor.no, 2) + '  ·  ' + game.floor.name, 320, 112, {
    scale: 1, color: '#8a8aa8', align: 'center',
  });
  drawText('SCORE ' + pad(game.score, 7) + '   POT ' + pad(game.pot, 5) + '  X' + game.mult, 320, 128, {
    scale: 1, color: '#747491', align: 'center',
  });

  button(UI.pause.resume, 'RESUME', 'ESC', { color: '#7bf1a8' });
  button(UI.pause.restart, 'RESTART RUN', 'R', { color: '#ffd23f' });
  button(UI.pause.mute, 'SOUND: ' + (save.muted ? 'OFF' : 'ON'), 'M', { color: '#4cc9f0' });
  button(UI.pause.quit, 'QUIT TO TITLE', 'Q', { color: '#ef476f' });

  drawText('TAKE A BREATH. THE TOWER WILL WAIT.', 320, 304, {
    scale: 1, color: '#4d4d64', align: 'center',
  });
}

function drawGameover() {
  ctx.fillStyle = 'rgba(5,3,9,.84)';
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  const red = ctx.createLinearGradient(0, 0, 0, SCREEN_H);
  red.addColorStop(0, 'rgba(120,10,30,.16)');
  red.addColorStop(1, 'rgba(40,3,12,.32)');
  ctx.fillStyle = red;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  panel(66, 30, 508, 316, 'rgba(8,7,14,.95)', 'rgba(239,71,111,.4)');
  borderCorners(66, 30, 508, 316, '#ef476f', 8);
  drawText('RUN TERMINATED', 320, 48, { scale: 3, color: '#ef476f', align: 'center', outline: true });
  drawText('FLOOR ' + pad(game.floor.no, 2) + ' / 12  ·  ' + game.floor.name, 320, 78, {
    scale: 1, color: '#d8d4e6', align: 'center',
  });
  drawText('THE LIFT DOORS DO NOT OPEN FOR YOU.', 320, 94, {
    scale: 1, color: '#5f5f7a', align: 'center',
  });

  ctx.fillStyle = 'rgba(138,138,168,.2)';
  ctx.fillRect(92, 112, 456, 1);

  drawText('BANKED SCORE', 92, 126, { scale: 1, color: '#747491' });
  drawText(pad(game.score, 7), 92, 138, { scale: 2, color: '#f8f4e3' });
  drawText('POT LOST', 300, 126, { scale: 1, color: '#747491' });
  drawText('-' + pad(game.lostPot, 5), 300, 138, { scale: 2, color: '#ef476f' });
  drawText('KILLS', 470, 126, { scale: 1, color: '#747491' });
  drawText(pad(game.kills, 3), 470, 138, { scale: 2, color: '#d8d4e6' });
  drawText('TIME', 92, 170, { scale: 1, color: '#747491' });
  drawText(formatTime(game.runTime), 92, 181, { scale: 1, color: '#d8d4e6' });
  drawText('BEST', 300, 170, { scale: 1, color: '#747491' });
  drawText(pad(save.best, 7), 300, 181, { scale: 1, color: '#ffd23f' });
  drawText('FLOOR REACHED', 470, 170, { scale: 1, color: '#747491' });
  drawText(pad(game.floor.no, 2) + ' / 12', 470, 181, { scale: 1, color: '#d8d4e6' });

  if (game.newBest) {
    drawText('NEW HIGH SCORE', 320, 204, { scale: 2, color: '#ffd23f', align: 'center', outline: true });
  } else if (game.lostPot > 0) {
    drawText('SHOULD HAVE TAKEN THE BANK.', 320, 206, { scale: 1, color: '#ff8fa3', align: 'center' });
  } else {
    drawText('NOTHING VENTURED. NOTHING GAINED.', 320, 206, { scale: 1, color: '#5f5f7a', align: 'center' });
  }

  drawText('BANKED ' + pad(game.score, 7) + '  ·  POT LOST ' + pad(game.lostPot, 5), 320, 232, {
    scale: 1, color: '#8a8aa8', align: 'center',
  });
  ctx.fillStyle = 'rgba(138,138,168,.2)';
  ctx.fillRect(92, 250, 456, 1);
  drawText('THE 13TH FLOOR IS A MYTH. SO IS HR.', 320, 258, {
    scale: 1, color: '#4d4d64', align: 'center',
  });

  button(UI.end.main, 'RETRY FROM FLOOR 01', 'R', { color: '#ffd23f' });
  button(UI.end.quit, 'QUIT TO TITLE', 'ESC', { color: '#8a8aa8' });
}

function drawVictory() {
  ctx.fillStyle = 'rgba(5,4,9,.8)';
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  const warm = ctx.createLinearGradient(0, 0, 0, SCREEN_H);
  warm.addColorStop(0, 'rgba(255,210,63,.12)');
  warm.addColorStop(1, 'rgba(239,71,111,.1)');
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  panel(55, 24, 530, 318, 'rgba(8,7,13,.94)', 'rgba(255,210,63,.42)');
  borderCorners(55, 24, 530, 318, '#ffd23f', 10);
  drawText('TOWER FALLS', 320, 42, { scale: 5, color: '#ffd23f', align: 'center', outline: true, shadow: true });
  drawText('12 / 12  ·  THE WARRANTY DEPARTMENT IS DISSOLVED', 320, 84, {
    scale: 1, color: '#7bf1a8', align: 'center',
  });
  drawText('YOUR CLAIM HAS BEEN APPROVED.', 320, 100, {
    scale: 1, color: '#d8d4e6', align: 'center',
  });

  ctx.fillStyle = 'rgba(138,138,168,.2)';
  ctx.fillRect(80, 118, 480, 1);

  drawText('FINAL SCORE', 82, 132, { scale: 1, color: '#747491' });
  drawText(pad(game.score, 7), 82, 144, { scale: 2, color: '#f8f4e3' });
  drawText('VICTORY BONUS', 320, 132, { scale: 1, color: '#747491' });
  drawText('+' + pad(game.victoryGain, 5), 320, 144, { scale: 2, color: '#ffd23f' });
  drawText('KILLS', 500, 132, { scale: 1, color: '#747491' });
  drawText(pad(game.kills, 3), 500, 144, { scale: 2, color: '#d8d4e6' });

  drawText('RUN TIME', 82, 180, { scale: 1, color: '#747491' });
  drawText(formatTime(game.runTime), 82, 191, { scale: 1, color: '#d8d4e6' });
  drawText('BEST', 320, 180, { scale: 1, color: '#747491' });
  drawText(pad(save.best, 7), 320, 191, { scale: 1, color: '#ffd23f' });
  drawText('FLOORS', 500, 180, { scale: 1, color: '#747491' });
  drawText('12', 500, 191, { scale: 1, color: '#d8d4e6' });

  if (game.newBest) {
    drawText('NEW HIGH SCORE', 320, 212, { scale: 2, color: '#ffd23f', align: 'center', outline: true });
  } else {
    drawText('THE TOWER REMEMBERS. SO DOES YOUR SCORE.', 320, 214, {
      scale: 1, color: '#8a8aa8', align: 'center',
    });
  }

  drawText('NO MORE OVERTIME. NO MORE PERFORMANCE REVIEWS.', 320, 240, {
    scale: 1, color: '#5f5f7a', align: 'center',
  });
  drawText('TURBO ARCADE  ·  THANK YOU FOR PLAYING', 320, 254, {
    scale: 1, color: '#4d4d64', align: 'center',
  });

  button(UI.end.main, 'NEW RUN', 'R', { color: '#ffd23f' });
  button(UI.end.quit, 'QUIT TO TITLE', 'ESC', { color: '#8a8aa8' });
}

function drawDying() {
  const a = clamp(game.stateT / 1.8, 0, 1);
  ctx.fillStyle = 'rgba(20,2,8,' + (a * 0.42).toFixed(3) + ')';
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  if (game.stateT > 0.55) {
    ctx.globalAlpha = 0.5 + Math.sin(game.t * 8) * 0.2;
    drawText('SIGNAL LOST', 320, 160, { scale: 3, color: '#ef476f', align: 'center', outline: true });
    ctx.globalAlpha = 1;
  }
}

function drawCursor() {
  if (!mouse.inside) return;
  const x = Math.round(mouse.x);
  const y = Math.round(mouse.y);
  const color = hover(UI.title.start) || hover(UI.risk.bank) ? '#ffd23f' : 'rgba(248,244,227,.9)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 9, y);
  ctx.lineTo(x - 4, y);
  ctx.moveTo(x + 4, y);
  ctx.lineTo(x + 9, y);
  ctx.moveTo(x, y - 9);
  ctx.lineTo(x, y - 4);
  ctx.moveTo(x, y + 4);
  ctx.lineTo(x, y + 9);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fillRect(x - 1, y - 1, 2, 2);
}

/* ------------------------------------------------------------
   Boot & loop
   ------------------------------------------------------------ */

FLOORS.forEach((f) => { f.width = ARENA_W; });
initArt();
AudioSys.muted = !!save.muted;
setupTitleWorld();

let _lastTime = performance.now();

function frame(now) {
  const realDt = Math.min(0.033, Math.max(0, (now - _lastTime) / 1000));
  _lastTime = now;
  let dt = realDt;
  if (game.hitstop > 0) {
    game.hitstop -= realDt;
    dt *= 0.12;
  }
  if (game.slowmo > 0) {
    game.slowmo -= realDt;
    dt *= 0.45;
  }
  update(dt);
  render();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

document.addEventListener('visibilitychange', () => {
  if (document.hidden && (game.state === 'play' || game.state === 'intro')) togglePause();
});

// A tiny public handle for tinkering and automated smoke tests.
window.TTMF = {
  game,
  save,
  startRun,
  beginPlay,
  clearFloor,
  victory,
  gameOver,
  loadFloor,
  spawnBoss,
  spawnEnemy,
  setWeapon,
  chooseBank,
  chooseRisk,
  boardLift,
  shoot,
  damageEnemy,
  damageBoss,
  hurtPlayer,
  fireEnemyBullet,
  addWarning,
  goFloor(n) {
    if (!game.player) game.player = makePlayer();
    const i = clamp(n - 1, 0, FLOORS.length - 1);
    game.player.dead = false;
    game.player.hp = game.player.maxHp;
    game.floorIndex = i;
    loadFloor(i);
    beginPlay();
  },
  setHp(n) {
    if (game.player) game.player.hp = clamp(n, 0, game.player.maxHp);
  },
  god() {
    if (game.player) {
      game.player.hp = game.player.maxHp;
      game.player.invuln = 2.5;
    }
  },
  addPot(n) {
    game.pot += n;
  },
};






