'use strict';

/* ============================================================
   data.js — tuning, weapons, enemies, floors
   ============================================================ */

const PLAYER_TUNE = {
  speed: 182,
  accel: 2400,
  friction: 2800,
  airAccel: 1700,
  jump: 410,
  gravity: 1180,
  maxFall: 620,
  dashSpeed: 520,
  dashTime: 0.15,
  dashCooldown: 1.05,
  invuln: 1.05,
  maxHp: 5,
};

const WEAPON_ORDER = ['pistol', 'shotgun', 'smg', 'rocket', 'rail'];

const WEAPONS = {
  pistol: {
    name: 'PISTOL', short: 'PST', rate: 0.27, dmg: 7, speed: 640, spread: 0.018,
    pellets: 1, ammo: Infinity, color: '#ffe66d', trail: '#ffd23f', kick: 1.5,
    sfx: 'pistol', shape: 'pistol', desc: 'OLD RELIABLE / INFINITE',
  },
  shotgun: {
    name: 'SHOTGUN', short: 'SHG', rate: 0.72, dmg: 6, speed: 560, spread: 0.27,
    pellets: 6, ammo: 20, color: '#ffb703', trail: '#ff9f1c', kick: 5,
    sfx: 'shotgun', shape: 'shotgun', desc: '6 PELLETS / CLOSE RANGE',
  },
  smg: {
    name: 'SMG', short: 'SMG', rate: 0.075, dmg: 4, speed: 720, spread: 0.095,
    pellets: 1, ammo: 110, color: '#4cc9f0', trail: '#72efdd', kick: 1,
    sfx: 'smg', shape: 'smg', desc: 'HOLD THE TRIGGER',
  },
  rocket: {
    name: 'ROCKET', short: 'RKT', rate: 0.86, dmg: 46, speed: 340, spread: 0.01,
    pellets: 1, ammo: 8, color: '#ef476f', trail: '#ff8fa3', kick: 7,
    sfx: 'rocket', shape: 'rocket', explosive: 58, desc: 'BIG HOLE / SMALL AMMO',
  },
  rail: {
    name: 'RAILGUN', short: 'RAI', rate: 0.98, dmg: 82, speed: 0, spread: 0,
    pellets: 1, ammo: 5, color: '#c77dff', trail: '#e0aaff', kick: 6,
    sfx: 'rail', shape: 'rail', hitscan: true, pierce: true, desc: 'PIERCES EVERYTHING',
  },
};

const DROP_TABLE = [
  { w: 'shotgun', weight: 30 },
  { w: 'smg', weight: 30 },
  { w: 'rocket', weight: 22 },
  { w: 'rail', weight: 18 },
];

const ENEMY_DEFS = {
  grunt:  { hp: 26, w: 12, h: 16, speed: 38,  score: 10, flying: false, name: 'GOON' },
  runner: { hp: 16, w: 12, h: 10, speed: 112, score: 12, flying: false, name: 'RUNNER' },
  drone:  { hp: 20, w: 12, h: 10, speed: 70,  score: 15, flying: true,  name: 'DRONE' },
  turret: { hp: 44, w: 16, h: 12, speed: 0,   score: 20, flying: false, name: 'TURRET', stationary: true },
  shield: { hp: 86, w: 14, h: 18, speed: 34,  score: 25, flying: false, name: 'GUARD' },
  bomber: { hp: 22, w: 12, h: 12, speed: 62,  score: 18, flying: true,  name: 'BOMBER' },
  sniper: { hp: 28, w: 12, h: 16, speed: 32,  score: 22, flying: false, name: 'SCOPE' },
};

const BOSS_DEFS = {
  foreman: {
    name: 'FOREMAN-9', title: 'SAFETY VIOLATION', hp: 440, w: 54, h: 62,
    score: 350, color: '#ff9f1c', music: 'boss',
  },
  archivist: {
    name: 'THE ARCHIVIST', title: 'MEMORY HOG', hp: 650, w: 48, h: 48,
    score: 500, color: '#c77dff', music: 'boss',
  },
  ceo: {
    name: 'CEO PRIME', title: 'FINAL PERFORMANCE REVIEW', hp: 960, w: 58, h: 68,
    score: 900, color: '#ffd23f', music: 'boss',
  },
};

const ZONES = {
  lobby: {
    label: 'LOBBY',
    skyTop: '#0c1a2e', skyBottom: '#1e4c5a',
    wall: '#173540', wallDark: '#10252d', wallLight: '#24515e',
    trim: '#4cc9f0', accent: '#ffd23f', hazard: '#ef476f',
    city: '#071426', fog: '#2b6f78',
  },
  factory: {
    label: 'FOUNDRY',
    skyTop: '#170e12', skyBottom: '#552a1d',
    wall: '#2a1a1b', wallDark: '#1b1012', wallLight: '#472b26',
    trim: '#ff9f1c', accent: '#ffd23f', hazard: '#ef476f',
    city: '#140a0b', fog: '#8a3b1f',
  },
  server: {
    label: 'DATA VAULT',
    skyTop: '#0c0920', skyBottom: '#281448',
    wall: '#171129', wallDark: '#0e0a1c', wallLight: '#2c2147',
    trim: '#c77dff', accent: '#4cc9f0', hazard: '#ff5d8f',
    city: '#080513', fog: '#613b89',
  },
  rooftop: {
    label: 'ROOFTOP',
    skyTop: '#120816', skyBottom: '#7a2433',
    wall: '#27141d', wallDark: '#170b12', wallLight: '#432333',
    trim: '#ffd23f', accent: '#4cc9f0', hazard: '#ef476f',
    city: '#0b050b', fog: '#b34a44',
  },
};

function P(x, y, w) {
  return { x, y, w, h: 10 };
}

const FLOORS = [
  {
    no: 1, zone: 'lobby', name: 'RECEPTION', story: 'YOU BOUGHT THE WARRANTY. THEY SAID NO.',
    platforms: [P(150, 258, 140), P(390, 214, 150), P(650, 258, 140)],
    waves: [
      ['grunt', 'grunt', 'runner'],
      ['grunt', 'drone', 'grunt'],
    ],
    drop: { x: 210, y: 240 },
    tip: 'A/D MOVE  ·  SPACE JUMP  ·  HOLD LMB FIRE',
  },
  {
    no: 2, zone: 'lobby', name: 'CUBICLE FARM', story: 'SYNERGY IS STANDING IN YOUR WAY.',
    platforms: [P(100, 258, 130), P(330, 206, 150), P(570, 258, 150), P(780, 206, 110)],
    waves: [
      ['grunt', 'grunt', 'runner', 'drone'],
      ['grunt', 'shield', 'grunt'],
    ],
    drop: { x: 405, y: 188 },
    tip: 'SHIFT DASHES THROUGH BULLETS.',
  },
  {
    no: 3, zone: 'lobby', name: 'HR DEPARTMENT', story: 'YOUR EXIT INTERVIEW IS SCHEDULED.',
    platforms: [P(220, 256, 160), P(470, 210, 170), P(730, 256, 140)],
    waves: [
      ['grunt', 'sniper', 'drone'],
      ['runner', 'runner', 'shield', 'grunt'],
    ],
    drop: { x: 555, y: 192 },
    tip: 'SNIPERS TELEGRAPH A RED LINE. MOVE.',
  },
  {
    no: 4, zone: 'lobby', name: 'THE FOREMAN', story: 'OVERTIME IS ENFORCED BY A 9-TON MECH.',
    platforms: [P(170, 252, 130), P(650, 252, 130)],
    waves: [],
    boss: 'foreman',
    drop: { x: 120, y: 304 },
    tip: 'RED MEANS MOVE. YELLOW MEANS SHOOT.',
  },
  {
    no: 5, zone: 'factory', name: 'ASSEMBLY LINE', story: 'MADE ON THE LINE. BROKEN ON THE LINE.',
    platforms: [P(90, 260, 110), P(280, 220, 120), P(480, 260, 130), P(700, 200, 140)],
    waves: [
      ['runner', 'runner', 'grunt'],
      ['turret', 'grunt', 'drone', 'bomber'],
    ],
    drop: { x: 340, y: 202 },
    tip: 'TURRETS ARE STUCK. FLANK THEM.',
  },
  {
    no: 6, zone: 'factory', name: 'COOLANT LEVEL', story: 'COOLANT IS MANDATORY. SO IS DYING.',
    platforms: [P(180, 250, 100), P(380, 195, 130), P(600, 250, 140), P(800, 210, 100)],
    waves: [
      ['grunt', 'turret', 'drone'],
      ['shield*', 'bomber', 'runner', 'sniper'],
    ],
    drop: { x: 445, y: 177 },
    tip: 'ELITE UNITS ARE BIGGER, MEANER, WORTH MORE.',
  },
  {
    no: 7, zone: 'factory', name: 'QUALITY CONTROL', story: 'YOU FAILED INSPECTION BEFORE YOU ARRIVED.',
    platforms: [P(80, 210, 100), P(260, 255, 140), P(500, 205, 150), P(730, 260, 120)],
    waves: [
      ['sniper', 'sniper', 'shield'],
      ['runner*', 'drone', 'turret', 'grunt', 'bomber'],
    ],
    drop: { x: 575, y: 187 },
    tip: 'BANKING REPAIRS ONE HEART. RISK DOES NOT.',
  },
  {
    no: 8, zone: 'factory', name: 'THE ARCHIVIST', story: 'IT REMEMBERS EVERY TICKET YOU EVER OPENED.',
    platforms: [P(200, 240, 120), P(700, 240, 120)],
    waves: [],
    boss: 'archivist',
    drop: { x: 120, y: 304 },
    tip: 'KEEP MOVING. THE ROOM IS THE WEAPON.',
  },
  {
    no: 9, zone: 'server', name: 'SERVER ROOM', story: 'COLD STORAGE FOR WARM BODIES.',
    platforms: [P(140, 250, 120), P(330, 195, 150), P(560, 250, 120), P(760, 200, 120)],
    waves: [
      ['drone', 'drone', 'turret'],
      ['grunt', 'shield', 'sniper', 'runner'],
    ],
    drop: { x: 405, y: 177 },
    tip: 'RAILGUN PIERCES SHIELDS AND RANKS.',
  },
  {
    no: 10, zone: 'server', name: 'DATA MINES', story: 'MIND THE DATA. IT BITES.',
    platforms: [P(100, 205, 120), P(300, 255, 140), P(520, 200, 130), P(730, 250, 120)],
    waves: [
      ['bomber', 'bomber', 'runner', 'drone'],
      ['turret*', 'sniper', 'shield', 'grunt', 'drone'],
    ],
    drop: { x: 585, y: 182 },
    tip: 'SHOOT BOMBERS BEFORE THEY REACH YOU.',
  },
  {
    no: 11, zone: 'server', name: 'EXECUTIVE SUITE', story: 'TOP FLOOR. WORSE PEOPLE.',
    platforms: [P(160, 250, 150), P(380, 205, 120), P(580, 250, 140), P(790, 205, 110)],
    waves: [
      ['shield', 'shield', 'sniper'],
      ['runner', 'bomber', 'drone', 'grunt', 'turret', 'sniper'],
    ],
    drop: { x: 440, y: 187 },
    tip: 'SAVE THE BIG GUN FOR THE LAST DOOR.',
  },
  {
    no: 12, zone: 'rooftop', name: 'CEO PRIME', story: 'THE LAST PERFORMANCE REVIEW. NO PROMOTION.',
    platforms: [P(160, 240, 120), P(680, 240, 120)],
    waves: [],
    boss: 'ceo',
    drop: { x: 250, y: 304 },
    tip: 'EVERYTHING YOU HAVE. ALL AT ONCE.',
  },
];

const MAX_MULT = 8;
const CLEAR_BONUS = 5000;
