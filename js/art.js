'use strict';

/* ============================================================
   art.js — pixel sprites, backgrounds, props, bosses
   ============================================================ */

function hexA(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

function makeSprite(rows, palette) {
  const w = rows[0].length;
  const h = rows.length;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const g = cv.getContext('2d');
  const wc = document.createElement('canvas');
  wc.width = w;
  wc.height = h;
  const wg = wc.getContext('2d');
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch && ch !== '.' && ch !== ' ') {
        g.fillStyle = palette[ch] || '#ff00ff';
        g.fillRect(x, y, 1, 1);
        wg.fillStyle = '#ffffff';
        wg.fillRect(x, y, 1, 1);
      }
    }
  }
  return { canvas: cv, white: wc, w, h };
}

const PLAYER_ROWS = [
  '....1111....',
  '...1888881..',
  '...1222221..',
  '...1777771..',
  '...1222221..',
  '..11333311..',
  '.1133333311.',
  '.1143333411.',
  '.1143333411.',
  '..11333311..',
  '...119911...',
  '...155551...',
  '...155551...',
  '...15..51...',
  '...15..51...',
  '..165..561..',
  '..166..661..',
  '.1111..1111.',
];

const GRUNT_ROWS = [
  '....1111....',
  '...144441...',
  '...177771...',
  '...144441...',
  '..11444411..',
  '.1144444411.',
  '.1144444411.',
  '..11444411..',
  '...144441...',
  '...144441...',
  '...155551...',
  '...155551...',
  '...15..51...',
  '...15..51...',
  '..166..661..',
  '.1111..1111.',
];

const RUNNER_ROWS = [
  '..1......1..',
  '.111....111.',
  '..11111111..',
  '.1222222221.',
  '122333333221',
  '122377773221',
  '122333333221',
  '.1222222221.',
  '..11....11..',
  '.166....661.',
];

const DRONE_ROWS = [
  '1..........1',
  '11........11',
  '.111....111.',
  '..11111111..',
  '...122221...',
  '..12333321..',
  '.1233773321.',
  '..12333321..',
  '...111111...',
  '..1.1..1.1..',
];

const TURRET_ROWS = [
  '................',
  '....11111111....',
  '...1222222221...',
  '..123333333321..',
  '..123377773321..',
  '..123333333321..',
  '...1222222221...',
  '....11111111....',
  '..111111111111..',
  '.12222222222221.',
  '.12333333333321.',
  '..111111111111..',
];

const BOMBER_ROWS = [
  '...111111...',
  '..12222221..',
  '.1223333221.',
  '122337733221',
  '122333333221',
  '122377733221',
  '122333333221',
  '.1223333221.',
  '..12222221..',
  '...111111...',
  '...1....1...',
  '..11....11..',
];

const PALETTES = {
  player: {
    '1': '#17111f', '2': '#ffc38a', '3': '#ff5d73', '4': '#b3324f',
    '5': '#31456e', '6': '#1b2438', '7': '#66fcf1', '8': '#3b2531', '9': '#ffd23f',
  },
  grunt: {
    '1': '#17111f', '2': '#ffc38a', '4': '#5b6ee1', '5': '#2a2a44',
    '6': '#151522', '7': '#ffd23f',
  },
  shield: {
    '1': '#141018', '2': '#ffc38a', '4': '#8a8fa3', '5': '#2b2b3d',
    '6': '#111119', '7': '#ffd23f',
  },
  sniper: {
    '1': '#100c1c', '2': '#ffc38a', '4': '#7b2cbf', '5': '#2a1a3e',
    '6': '#120b1a', '7': '#7bf1a8',
  },
  runner: {
    '1': '#140f1b', '2': '#ff9f1c', '3': '#ffd23f', '6': '#3d1f2a', '7': '#ef476f',
  },
  drone: {
    '1': '#101018', '2': '#4cc9f0', '3': '#a8f0ff', '7': '#ff5d73',
  },
  turret: {
    '1': '#141018', '2': '#8a8fa3', '3': '#c7cad8', '7': '#ff5d73',
  },
  bomber: {
    '1': '#160f16', '2': '#ef476f', '3': '#ff8fa3', '7': '#ffe66d',
  },
};

const SPR = {};

function initArt() {
  SPR.player = makeSprite(PLAYER_ROWS, PALETTES.player);
  SPR.grunt = makeSprite(GRUNT_ROWS, PALETTES.grunt);
  SPR.shield = makeSprite(GRUNT_ROWS, PALETTES.shield);
  SPR.sniper = makeSprite(GRUNT_ROWS, PALETTES.sniper);
  SPR.runner = makeSprite(RUNNER_ROWS, PALETTES.runner);
  SPR.drone = makeSprite(DRONE_ROWS, PALETTES.drone);
  SPR.turret = makeSprite(TURRET_ROWS, PALETTES.turret);
  SPR.bomber = makeSprite(BOMBER_ROWS, PALETTES.bomber);
}

function drawSprite(spr, x, y, opts) {
  const o = opts || {};
  const scale = o.scale || 1;
  const w = spr.w * scale;
  const h = spr.h * scale;
  const img = o.flash ? spr.white : spr.canvas;
  const cx = Math.round(x + w / 2);
  const cy = Math.round(y);
  const prev = ctx.globalAlpha;
  if (o.alpha != null) ctx.globalAlpha = prev * o.alpha;
  ctx.save();
  ctx.translate(cx, cy);
  if (o.flip) ctx.scale(-1, 1);
  ctx.drawImage(img, -Math.round(w / 2), 0, Math.round(w), Math.round(h));
  ctx.restore();
  ctx.globalAlpha = prev;
}

function drawGlow(x, y, r, color, alpha) {
  if (r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, hexA(color, alpha));
  g.addColorStop(0.45, hexA(color, alpha * 0.4));
  g.addColorStop(1, hexA(color, 0));
  const prev = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.globalCompositeOperation = prev;
}

function drawHeart(x, y, filled, scale) {
  const s = scale || 2;
  const map = [
    '.11.11.',
    '1111111',
    '1111111',
    '.11111.',
    '..111..',
    '...1...',
  ];
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      if (map[row][col] !== '1') continue;
      let c = '#2a2438';
      if (filled) c = row === 0 || (row === 1 && col < 3) ? '#ff8fa3' : '#ef476f';
      ctx.fillStyle = c;
      ctx.fillRect(x + col * s, y + row * s, s, s);
    }
  }
  if (filled) {
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.fillRect(x + 1 * s, y + 1 * s, s, s);
  }
}

function drawWeaponIcon(name, x, y, color, scale) {
  const s = scale || 1;
  const c = color || (WEAPONS[name] && WEAPONS[name].color) || '#f8f4e3';
  const dark = '#1a1522';
  const rect = (rx, ry, rw, rh, fill) => {
    ctx.fillStyle = fill;
    ctx.fillRect(Math.round(x + rx * s), Math.round(y + ry * s), Math.max(1, rw * s), Math.max(1, rh * s));
  };
  if (name === 'shotgun') {
    rect(0, 3, 15, 2, c);
    rect(0, 2, 12, 1, '#f8f4e3');
    rect(2, 5, 3, 4, dark);
    rect(12, 3, 4, 1, dark);
    rect(0, 5, 2, 4, dark);
  } else if (name === 'smg') {
    rect(0, 3, 13, 3, c);
    rect(2, 6, 3, 5, dark);
    rect(1, 3, 1, 3, '#f8f4e3');
    rect(11, 2, 3, 1, dark);
    rect(5, 1, 4, 2, dark);
  } else if (name === 'rocket') {
    rect(0, 2, 16, 4, c);
    rect(14, 1, 3, 6, dark);
    rect(2, 6, 3, 5, dark);
    rect(0, 3, 2, 2, '#f8f4e3');
    rect(6, 1, 5, 1, dark);
  } else if (name === 'rail') {
    rect(0, 3, 18, 2, c);
    rect(3, 1, 2, 6, dark);
    rect(7, 1, 2, 6, dark);
    rect(11, 1, 2, 6, dark);
    rect(15, 2, 3, 4, '#f8f4e3');
  } else {
    rect(0, 3, 10, 3, c);
    rect(2, 5, 3, 4, dark);
    rect(9, 2, 3, 1, dark);
    rect(0, 3, 2, 1, '#f8f4e3');
  }
}

/* ------------------------------------------------------------
   Background
   ------------------------------------------------------------ */

function drawBackground(floor, cam, t) {
  const z = ZONES[floor.zone];
  const grad = ctx.createLinearGradient(0, 0, 0, SCREEN_H);
  grad.addColorStop(0, z.skyTop);
  grad.addColorStop(0.72, z.skyBottom);
  grad.addColorStop(1, z.wallDark);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  if (floor.zone === 'rooftop') drawRooftopBg(z, cam, t);
  else if (floor.zone === 'factory') drawFactoryBg(z, cam, t);
  else if (floor.zone === 'server') drawServerBg(z, cam, t);
  else drawLobbyBg(z, cam, t);

  // shared vignette / fog
  ctx.fillStyle = z.fog;
  ctx.globalAlpha = 0.035;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  ctx.globalAlpha = 1;
}

function drawLobbyBg(z, cam, t) {
  const par = cam * 0.36;
  // window bays
  for (let i = 0; i < 6; i++) {
    const wx = i * 235 - par - 40;
    drawCityWindow(wx, 72, 188, 128, z, t + i * 2.1);
  }
  // pillars
  for (let i = 0; i < 5; i++) {
    const px = i * 280 - cam * 0.6 + 120;
    ctx.fillStyle = z.wallDark;
    ctx.fillRect(px, 32, 26, 290);
    ctx.fillStyle = z.wall;
    ctx.fillRect(px + 4, 32, 18, 290);
    ctx.fillStyle = hexA(z.trim, 0.18);
    ctx.fillRect(px + 7, 32, 2, 290);
    ctx.fillRect(px + 16, 32, 2, 290);
    ctx.fillStyle = z.wallLight;
    ctx.fillRect(px - 4, 36, 34, 8);
  }
  // ceiling light bars
  for (let i = 0; i < 5; i++) {
    const lx = i * 210 - cam * 0.48 + 80;
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    ctx.fillRect(lx, 20, 90, 4);
    ctx.fillStyle = 'rgba(150,240,255,.45)';
    ctx.fillRect(lx + 8, 24, 74, 2);
    const g = ctx.createLinearGradient(lx, 26, lx, 150);
    g.addColorStop(0, 'rgba(120,230,255,.12)');
    g.addColorStop(1, 'rgba(120,230,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(lx + 8, 26);
    ctx.lineTo(lx + 82, 26);
    ctx.lineTo(lx + 108, 150);
    ctx.lineTo(lx - 18, 150);
    ctx.closePath();
    ctx.fill();
  }
  // TURBOSOFT sign
  const sx = 470 - cam * 0.52;
  ctx.globalAlpha = 0.42;
  drawText('TURBOSOFT', sx, 52, { scale: 2, color: hexA(z.trim, 0.9), outline: true, shadow: true });
  ctx.globalAlpha = 1;
  ctx.fillStyle = hexA(z.trim, 0.3);
  ctx.fillRect(sx, 68, 92, 1);
  drawText('TOWER  /  EST. 1998', sx, 73, { scale: 1, color: hexA(z.trim, 0.42) });

  // plants
  for (let i = 0; i < 3; i++) {
    const px = 110 + i * 330 - cam * 0.8;
    drawPlant(px, 286, z);
  }
  // wall panel seams
  ctx.strokeStyle = 'rgba(0,0,0,.16)';
  ctx.lineWidth = 1;
  for (let x = -((cam * 0.6) % 64); x < SCREEN_W; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 200);
    ctx.lineTo(x + 0.5, 322);
    ctx.stroke();
  }
}

function drawCityWindow(x, y, w, h, z, seed) {
  if (x > SCREEN_W || x + w < 0) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, '#07101f');
  sky.addColorStop(0.7, '#0e2a3e');
  sky.addColorStop(1, '#173a44');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  // moon
  ctx.fillStyle = 'rgba(210,245,255,.55)';
  ctx.beginPath();
  ctx.arc(x + w * 0.72, y + h * 0.24, 10, 0, TAU);
  ctx.fill();
  // skyline
  for (let i = 0; i < 12; i++) {
    const bh = 20 + hash01(seed + i * 13) * 58;
    const bw = 14 + hash01(seed + i * 7) * 20;
    const bx = x + i * 17 - 4;
    ctx.fillStyle = i % 3 === 0 ? '#0a1b2b' : '#081522';
    ctx.fillRect(bx, y + h - bh, bw, bh);
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(255,210,63,.35)';
      for (let wy = 0; wy < 5; wy++) {
        for (let wx = 0; wx < 2; wx++) {
          if (hash01(seed + i * 31 + wy * 9 + wx) > 0.55) {
            ctx.fillRect(bx + 4 + wx * 6, y + h - bh + 7 + wy * 8, 2, 3);
          }
        }
      }
    }
  }
  // rain streaks
  ctx.strokeStyle = 'rgba(140,220,255,.18)';
  for (let i = 0; i < 14; i++) {
    const rx = x + ((i * 37 + seed * 23) % w);
    const ry = y + ((i * 61 + seed * 9) % h);
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 2, ry + 8);
    ctx.stroke();
  }
  ctx.restore();
  // frame
  ctx.fillStyle = '#0a121b';
  ctx.fillRect(x - 5, y - 5, w + 10, 5);
  ctx.fillRect(x - 5, y + h, w + 10, 5);
  ctx.fillRect(x - 5, y, 5, h);
  ctx.fillRect(x + w, y, 5, h);
  ctx.fillStyle = hexA(z.trim, 0.35);
  ctx.fillRect(x - 3, y - 3, w + 6, 1);
  ctx.fillRect(x - 3, y + h + 2, w + 6, 1);
  ctx.fillStyle = '#152b34';
  ctx.fillRect(x + w / 2 - 1, y, 2, h);
}

function drawPlant(x, y, z) {
  ctx.fillStyle = '#1e2831';
  ctx.fillRect(x - 11, y + 18, 22, 16);
  ctx.fillStyle = '#2e3b45';
  ctx.fillRect(x - 11, y + 18, 22, 3);
  ctx.fillStyle = '#2f6f55';
  const leaves = [[-8, 2, 12], [2, -4, 14], [8, 6, 10], [-2, 10, 9], [-13, 10, 8]];
  for (let i = 0; i < leaves.length; i++) {
    const l = leaves[i];
    ctx.beginPath();
    ctx.ellipse(x + l[0], y + l[1], l[2] * 0.55, l[2], (i - 2) * 0.38, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = hexA(z.trim, 0.18);
  ctx.fillRect(x - 10, y + 30, 20, 1);
}

function drawFactoryBg(z, cam, t) {
  const par = cam * 0.55;
  // giant pipes
  for (let i = 0; i < 4; i++) {
    const y = 36 + i * 18;
    ctx.fillStyle = '#1c1114';
    ctx.fillRect(0, y, SCREEN_W, 10);
    ctx.fillStyle = '#3a2320';
    ctx.fillRect(0, y + 2, SCREEN_W, 4);
    ctx.fillStyle = hexA(z.trim, 0.15);
    ctx.fillRect(0, y + 3, SCREEN_W, 1);
  }
  // vertical pipes
  for (let i = 0; i < 4; i++) {
    const px = i * 230 - par + 80;
    ctx.fillStyle = '#1c1114';
    ctx.fillRect(px, 30, 18, 292);
    ctx.fillStyle = '#3b2521';
    ctx.fillRect(px + 3, 30, 8, 292);
    for (let j = 0; j < 9; j++) {
      ctx.fillStyle = '#221417';
      ctx.fillRect(px - 2, 54 + j * 30, 22, 5);
    }
  }
  // furnace windows
  for (let i = 0; i < 4; i++) {
    const x = i * 250 - cam * 0.34 + 30;
    const flick = 0.55 + Math.sin(t * 3 + i) * 0.1;
    drawGlow(x + 48, 210, 78, '#ff6b2c', 0.08 * flick);
    ctx.fillStyle = '#180d0d';
    ctx.fillRect(x, 160, 96, 82);
    ctx.fillStyle = hexA('#ff6b2c', 0.4 + flick * 0.15);
    ctx.fillRect(x + 7, 167, 82, 68);
    ctx.fillStyle = '#2a1512';
    for (let j = 0; j < 4; j++) ctx.fillRect(x + 7 + j * 22, 167, 3, 68);
    ctx.fillStyle = '#140b0c';
    ctx.fillRect(x - 4, 154, 104, 8);
  }
  // gears
  drawGear(170 - cam * 0.44, 120, 46, t * 0.3, '#2f1b1a', '#593025');
  drawGear(700 - cam * 0.38, 92, 32, -t * 0.45, '#2b1918', '#4c2a22');
  drawGear(830 - cam * 0.5, 190, 24, t * 0.2, '#291716', '#45251f');
  // warning band
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 294, SCREEN_W, 14);
  ctx.clip();
  ctx.fillStyle = '#160e10';
  ctx.fillRect(0, 294, SCREEN_W, 14);
  for (let x = -((cam * 0.7) % 28) - 28; x < SCREEN_W; x += 28) {
    ctx.fillStyle = hexA(z.trim, 0.6);
    ctx.beginPath();
    ctx.moveTo(x, 308);
    ctx.lineTo(x + 14, 294);
    ctx.lineTo(x + 28, 294);
    ctx.lineTo(x + 14, 308);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // haze
  ctx.fillStyle = 'rgba(255,120,40,.035)';
  ctx.fillRect(0, 0, SCREEN_W, 360);
}

function drawGear(x, y, r, rot, c1, c2) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = c1;
  for (let i = 0; i < 8; i++) {
    ctx.rotate(TAU / 8);
    ctx.fillRect(-4, -r - 5, 8, 10);
  }
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fillStyle = c2;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.62, 0, TAU);
  ctx.fillStyle = '#160d0e';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.18, 0, TAU);
  ctx.fillStyle = c1;
  ctx.fill();
  ctx.restore();
}

function drawServerBg(z, cam, t) {
  const par = cam * 0.5;
  // racks
  for (let i = 0; i < 8; i++) {
    const x = i * 105 - par - 20;
    ctx.fillStyle = '#0d0a17';
    ctx.fillRect(x, 78, 88, 224);
    ctx.fillStyle = '#211936';
    ctx.fillRect(x + 4, 82, 80, 216);
    for (let row = 0; row < 12; row++) {
      const y = 88 + row * 17;
      ctx.fillStyle = '#0d0a17';
      ctx.fillRect(x + 8, y, 72, 12);
      for (let led = 0; led < 5; led++) {
        const on = hash01(i * 71 + row * 13 + led * 7 + Math.floor(t * 3)) > 0.5;
        ctx.fillStyle = on ? (led === 2 ? '#ff5d8f' : hexA(z.accent, 0.85)) : '#241b3b';
        ctx.fillRect(x + 13 + led * 12, y + 4, 3, 3);
      }
    }
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.fillRect(x + 88, 78, 8, 224);
  }
  // cables
  ctx.strokeStyle = 'rgba(8,6,18,.9)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const cx = i * 130 - cam * 0.3 + 50;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.bezierCurveTo(cx + 30, 60, cx - 20, 100, cx + 10, 140);
    ctx.stroke();
  }
  // data rain
  ctx.save();
  for (let i = 0; i < 34; i++) {
    const x = (i * 41 - ((cam * 0.2) | 0)) % (SCREEN_W + 40);
    const speed = 18 + hash01(i) * 45;
    const y = ((t * speed + hash01(i * 3) * 400) % 420) - 40;
    ctx.fillStyle = hexA(i % 4 === 0 ? '#ff5d8f' : z.accent, 0.14 + hash01(i + 2) * 0.14);
    ctx.fillRect(x, y, 1, 6 + hash01(i * 5) * 9);
  }
  ctx.restore();
  // core glow
  drawGlow(320 - cam * 0.2, 200, 220, '#7b2cbf', 0.08);
  // vertical light strips
  for (let i = 0; i < 3; i++) {
    const x = 160 + i * 260 - cam * 0.65;
    ctx.fillStyle = hexA(z.trim, 0.1);
    ctx.fillRect(x, 40, 2, 282);
  }
}

function drawRooftopBg(z, cam, t) {
  // stars
  for (let i = 0; i < 70; i++) {
    const x = (i * 97 - cam * 0.08) % SCREEN_W;
    const y = (hash01(i * 7) * 210) | 0;
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.7 + i));
    ctx.fillStyle = 'rgba(255,240,220,' + (0.15 + tw * 0.35).toFixed(3) + ')';
    ctx.fillRect(x < 0 ? x + SCREEN_W : x, y, 1, 1);
  }
  // moon
  drawGlow(500 - cam * 0.06, 82, 110, '#ffd6a5', 0.06);
  ctx.fillStyle = '#ffe8c2';
  ctx.beginPath();
  ctx.arc(500 - cam * 0.06, 82, 31, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(190,140,120,.35)';
  ctx.beginPath();
  ctx.arc(490 - cam * 0.06, 74, 6, 0, TAU);
  ctx.arc(510 - cam * 0.06, 92, 9, 0, TAU);
  ctx.arc(514 - cam * 0.06, 70, 4, 0, TAU);
  ctx.fill();
  // distant skyline
  for (let i = 0; i < 18; i++) {
    const bw = 22 + hash01(i + 3) * 44;
    const bh = 40 + hash01(i * 9) * 120;
    const bx = i * 45 - cam * 0.18 - 20;
    ctx.fillStyle = i % 2 ? '#180c16' : '#230f18';
    ctx.fillRect(bx, 250 - bh, bw, bh + 80);
    ctx.fillStyle = 'rgba(255,180,120,.18)';
    for (let wy = 0; wy < 4; wy++) {
      for (let wx = 0; wx < 2; wx++) {
        if (hash01(i * 17 + wy * 3 + wx) > 0.5) {
          ctx.fillRect(bx + 6 + wx * 9, 250 - bh + 10 + wy * 14, 2, 3);
        }
      }
    }
  }
  // clouds
  ctx.fillStyle = 'rgba(255,120,130,.06)';
  for (let i = 0; i < 5; i++) {
    const x = i * 190 - cam * 0.12;
    ctx.beginPath();
    ctx.ellipse(x, 140 + i * 9, 90, 13, 0, 0, TAU);
    ctx.fill();
  }
  // antenna structures
  for (let i = 0; i < 3; i++) {
    const x = 90 + i * 330 - cam * 0.55;
    ctx.strokeStyle = 'rgba(20,10,18,.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, 322);
    ctx.lineTo(x + 6, 150);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 18, 190);
    ctx.lineTo(x + 6, 150);
    ctx.lineTo(x + 28, 190);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,80,90,.55)';
    ctx.fillRect(x + 4, 146, 4, 4);
  }
}

function drawForeground(cam, t) {
  // atmospheric haze and top/bottom tints, drawn over the world
  const g = ctx.createLinearGradient(0, 0, 0, SCREEN_H);
  g.addColorStop(0, 'rgba(3,3,8,.32)');
  g.addColorStop(0.18, 'rgba(3,3,8,0)');
  g.addColorStop(0.82, 'rgba(3,3,8,0)');
  g.addColorStop(1, 'rgba(3,3,8,.46)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  // dust / sparks
  for (let i = 0; i < 14; i++) {
    const x = (i * 61 + t * (7 + i % 3) - cam * 0.2) % (SCREEN_W + 20);
    const y = (hash01(i * 9) * 340 + Math.sin(t + i) * 12) % SCREEN_H;
    ctx.fillStyle = 'rgba(255,240,210,.08)';
    ctx.fillRect((x + SCREEN_W) % SCREEN_W, y, 1, 1);
  }
}

/* ------------------------------------------------------------
   World geometry
   ------------------------------------------------------------ */

function drawGround(floor) {
  const z = ZONES[floor.zone];
  ctx.fillStyle = '#08080f';
  ctx.fillRect(0, GROUND_Y, floor.width, SCREEN_H - GROUND_Y + 20);
  ctx.fillStyle = z.wallDark;
  ctx.fillRect(0, GROUND_Y, floor.width, 8);
  ctx.fillStyle = z.wallLight;
  ctx.fillRect(0, GROUND_Y, floor.width, 2);
  ctx.fillStyle = hexA(z.trim, 0.65);
  ctx.fillRect(0, GROUND_Y + 2, floor.width, 1);

  for (let x = 0; x < floor.width; x += 64) {
    ctx.fillStyle = x % 128 === 0 ? '#12121d' : '#0e0e18';
    ctx.fillRect(x, GROUND_Y + 10, 64, 26);
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.fillRect(x, GROUND_Y + 10, 1, 26);
    ctx.fillStyle = 'rgba(255,255,255,.035)';
    ctx.fillRect(x + 4, GROUND_Y + 14, 54, 1);
    ctx.fillStyle = '#2a2a3c';
    ctx.fillRect(x + 6, GROUND_Y + 30, 2, 2);
    ctx.fillRect(x + 56, GROUND_Y + 30, 2, 2);
  }
  // hazard strip near lift
  const ex = floor.width - 78;
  ctx.save();
  ctx.beginPath();
  ctx.rect(ex - 24, GROUND_Y + 5, 116, 9);
  ctx.clip();
  ctx.fillStyle = '#15121a';
  ctx.fillRect(ex - 24, GROUND_Y + 5, 116, 9);
  for (let x = ex - 30; x < floor.width + 10; x += 14) {
    ctx.fillStyle = hexA(z.accent, 0.7);
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y + 14);
    ctx.lineTo(x + 7, GROUND_Y + 5);
    ctx.lineTo(x + 14, GROUND_Y + 5);
    ctx.lineTo(x + 7, GROUND_Y + 14);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawPlatforms(floor, t) {
  const z = ZONES[floor.zone];
  for (let i = 0; i < floor.platforms.length; i++) {
    const p = floor.platforms[i];
    // support brackets
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.fillRect(p.x + 8, p.y + 10, 5, 14);
    ctx.fillRect(p.x + p.w - 13, p.y + 10, 5, 14);
    ctx.fillStyle = '#20202f';
    ctx.fillRect(p.x + 9, p.y + 10, 3, 10);
    ctx.fillRect(p.x + p.w - 12, p.y + 10, 3, 10);
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.fillRect(p.x + 3, p.y + p.h, p.w - 6, 4);
    // body
    ctx.fillStyle = '#242433';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#343448';
    ctx.fillRect(p.x, p.y, p.w, 4);
    ctx.fillStyle = '#4a4a64';
    ctx.fillRect(p.x + 2, p.y, p.w - 4, 1);
    ctx.fillStyle = hexA(z.trim, 0.72);
    ctx.fillRect(p.x + 4, p.y + 1, p.w - 8, 1);
    // warning stripes
    if (p.w >= 120) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(p.x + 14, p.y + 5, p.w - 28, 3);
      ctx.clip();
      for (let x = p.x + 8; x < p.x + p.w - 8; x += 12) {
        ctx.fillStyle = i % 2 ? hexA(z.accent, 0.6) : hexA(z.hazard, 0.45);
        ctx.fillRect(x, p.y + 5, 5, 3);
      }
      ctx.restore();
    }
    // bolts
    ctx.fillStyle = '#61617a';
    ctx.fillRect(p.x + 5, p.y + 6, 2, 2);
    ctx.fillRect(p.x + p.w - 7, p.y + 6, 2, 2);
    ctx.fillStyle = 'rgba(255,255,255,.06)';
    ctx.fillRect(p.x, p.y + 9, p.w, 1);
  }
}

function drawElevator(floor, open, t) {
  const z = ZONES[floor.zone];
  const ex = floor.width - 62;
  const ey = 132;
  const eh = GROUND_Y - ey;
  const ew = 62;

  // frame
  ctx.fillStyle = '#10101b';
  ctx.fillRect(ex - 12, ey - 18, ew + 24, eh + 18);
  ctx.fillStyle = '#242437';
  ctx.fillRect(ex - 8, ey - 14, ew + 16, eh + 14);
  ctx.fillStyle = '#34344d';
  ctx.fillRect(ex - 4, ey - 10, ew + 8, 4);

  // sign
  drawText('LIFT', ex + ew / 2, ey - 40, {
    scale: 1, color: open ? '#ffd23f' : '#6d6d88', align: 'center', outline: true,
  });
  // floor indicator
  ctx.fillStyle = '#07070d';
  ctx.fillRect(ex + 20, ey - 32, 24, 13);
  ctx.strokeStyle = '#34344d';
  ctx.strokeRect(ex + 20.5, ey - 31.5, 23, 12);
  drawText(pad(floor.no, 2), ex + 32, ey - 30, {
    scale: 1, color: open ? '#7bf1a8' : '#4d4d68', align: 'center',
  });

  // interior
  ctx.fillStyle = open ? '#2b2618' : '#0b0b13';
  ctx.fillRect(ex, ey, ew, eh);
  if (open) {
    const glow = ctx.createLinearGradient(ex, ey, ex, ey + eh);
    glow.addColorStop(0, 'rgba(255,210,63,.06)');
    glow.addColorStop(1, 'rgba(255,210,63,.28)');
    ctx.fillStyle = glow;
    ctx.fillRect(ex, ey, ew, eh);
    // back panel
    ctx.fillStyle = '#191a24';
    ctx.fillRect(ex + 9, ey + 30, ew - 18, eh - 34);
    ctx.fillStyle = '#25263a';
    ctx.fillRect(ex + 14, ey + 38, ew - 28, 36);
    drawText('UP', ex + ew / 2, ey + 50, { scale: 1, color: '#ffd23f', align: 'center' });
    ctx.fillStyle = hexA('#ffd23f', 0.5 + Math.sin(t * 4) * 0.2);
    ctx.fillRect(ex + ew / 2 - 2, ey + 16, 4, 4);
  }

  // doors
  const doorW = ew / 2;
  const slide = open ? doorW * 0.86 : 0;
  ctx.fillStyle = '#20202f';
  ctx.fillRect(ex + 1, ey + 1, doorW - 2 - slide, eh - 2);
  ctx.fillRect(ex + doorW + 1 + slide, ey + 1, doorW - 2 - slide, eh - 2);
  ctx.fillStyle = '#2c2c40';
  ctx.fillRect(ex + 5, ey + 5, doorW - 10 - slide, eh - 10);
  ctx.fillRect(ex + doorW + 5 + slide, ey + 5, doorW - 10 - slide, eh - 10);
  ctx.fillStyle = hexA(z.trim, open ? 0.55 : 0.2);
  ctx.fillRect(ex + ex * 0 + 6, ey + 8, 2, eh - 16);
  ctx.fillRect(ex + ew - 8, ey + 8, 2, eh - 16);
  // seam light
  ctx.fillStyle = open ? 'rgba(255,210,63,.5)' : 'rgba(76,201,240,.25)';
  ctx.fillRect(ex + doorW - slide, ey + 6, 1, eh - 12);
  ctx.fillRect(ex + doorW + slide, ey + 6, 1, eh - 12);
}

/* ------------------------------------------------------------
   Bosses
   ------------------------------------------------------------ */

function bossColor(b, color) {
  if (b.hitFlash > 0 && Math.floor(b.hitFlash * 90) % 2 === 0) return '#ffffff';
  return color;
}

function drawBoss(b, t) {
  if (!b) return;
  if (b.bossId === 'foreman') drawForeman(b, t);
  else if (b.bossId === 'archivist') drawArchivist(b, t);
  else drawCEO(b, t);

  if (!b.dead && b.phaseInvuln > 0) {
    ctx.save();
    ctx.strokeStyle = hexA(b.color, 0.55 + Math.sin(t * 22) * 0.25);
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.lineDashOffset = -t * 30;
    ctx.beginPath();
    ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2, b.w * 0.8, b.h * 0.68, 0, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

function drawForeman(b, t) {
  const x = Math.round(b.x), y = Math.round(b.y), w = b.w, h = b.h;
  const flash = bossColor(b, '#ff9f1c');
  const dark = bossColor(b, '#3b211f');
  const steel = bossColor(b, '#7b7d8f');
  const eye = bossColor(b, '#ffe66d');
  const walk = Math.sin(t * 8) * (Math.abs(b.vx) > 8 ? 2 : 0);
  ctx.save();
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, GROUND_Y + 2, w * 0.62, 5, 0, 0, TAU);
  ctx.fill();
  if (b.phase > 1) {
    drawGlow(x + w / 2, y + h / 2, 72, '#ff6b2c', 0.07 + Math.sin(t * 5) * 0.025);
  }
  // treads
  ctx.fillStyle = bossColor(b, '#1a1318');
  ctx.fillRect(x - 2, y + h - 16, w + 4, 16);
  ctx.fillStyle = flash;
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(x + 2 + ((i * 10 + (b.tread || 0) * 20) % (w - 4)), y + h - 12, 5, 8);
  }
  // legs
  ctx.fillStyle = dark;
  ctx.fillRect(x + 6, y + h - 30, 14, 18);
  ctx.fillRect(x + w - 20, y + h - 30 + walk, 14, 18);
  // torso
  ctx.fillStyle = bossColor(b, '#8a4d25');
  ctx.fillRect(x + 5, y + 14, w - 10, h - 38);
  ctx.fillStyle = flash;
  ctx.fillRect(x + 9, y + 18, w - 18, 6);
  // hazard chest
  ctx.fillStyle = bossColor(b, '#ffd23f');
  for (let i = 0; i < 4; i++) ctx.fillRect(x + 12 + i * 8, y + 30, 5, 4);
  // cockpit
  ctx.fillStyle = bossColor(b, '#2a1a22');
  ctx.fillRect(x + 16, y + 40, w - 32, 14);
  ctx.fillStyle = eye;
  ctx.fillRect(x + 22, y + 44, w - 44, 5);
  drawGlow(x + w / 2, y + 47, 22, '#ffe66d', 0.18);
  // head
  ctx.fillStyle = steel;
  ctx.fillRect(x + 13, y + 2, w - 26, 16);
  ctx.fillStyle = dark;
  ctx.fillRect(x + 16, y + 6, w - 32, 6);
  ctx.fillStyle = eye;
  ctx.fillRect(x + 19, y + 8, 6, 3);
  ctx.fillRect(x + w - 25, y + 8, 6, 3);
  // smokestack
  ctx.fillStyle = bossColor(b, '#5a3b2a');
  ctx.fillRect(x + w - 15, y - 9, 7, 13);
  ctx.fillStyle = 'rgba(200,200,200,.14)';
  ctx.beginPath();
  ctx.arc(x + w - 11 + Math.sin(t * 2) * 3, y - 16, 5, 0, TAU);
  ctx.fill();
  // arms
  ctx.fillStyle = dark;
  ctx.fillRect(x - 10, y + 26, 14, 12);
  ctx.fillRect(x + w - 4, y + 26, 14, 12);
  ctx.fillStyle = steel;
  ctx.fillRect(x - 13, y + 34, 12, 20);
  ctx.fillStyle = bossColor(b, '#ff5d73');
  ctx.fillRect(x + w + 1, y + 34, 14, 8);
  ctx.fillStyle = dark;
  ctx.fillRect(x + w + 11, y + 36, 6, 4);
  // antenna
  ctx.fillStyle = '#ff5d73';
  ctx.fillRect(x + 8, y - 6, 2, 8);
  ctx.restore();
}

function drawArchivist(b, t) {
  const x = b.x + b.w / 2;
  const y = b.y + b.h / 2;
  const flash = bossColor(b, '#e0aaff');
  const baseAlpha = b.alpha == null ? 1 : b.alpha;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = baseAlpha;
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath();
  ctx.ellipse(0, GROUND_Y - y + 2, 34, 5, 0, 0, TAU);
  ctx.fill();
  // cables below
  ctx.strokeStyle = 'rgba(50,30,80,.7)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(-20 + i * 10, 20);
    ctx.bezierCurveTo(-25 + i * 12, 70, 20 + i * 3, 100, -10 + i * 7, 140);
    ctx.stroke();
  }
  // outer rings
  for (let i = 0; i < 3; i++) {
    const r = 28 + i * 9;
    ctx.save();
    ctx.rotate(t * (0.6 + i * 0.35) * (i % 2 ? -1 : 1));
    ctx.strokeStyle = i === 1 ? flash : bossColor(b, '#7b2cbf');
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0.2, 1.2);
    ctx.arc(0, 0, r, Math.PI + 0.2, Math.PI + 1.2);
    ctx.stroke();
    ctx.fillStyle = bossColor(b, '#4cc9f0');
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * TAU;
      ctx.fillRect(Math.cos(a) * r - 1, Math.sin(a) * r - 1, 3, 3);
    }
    ctx.restore();
  }
  // body monolith
  ctx.fillStyle = bossColor(b, '#21132f');
  ctx.fillRect(-22, -26, 44, 52);
  ctx.fillStyle = bossColor(b, '#3c2358');
  ctx.fillRect(-18, -22, 36, 44);
  // eye
  ctx.fillStyle = bossColor(b, '#120a1a');
  ctx.beginPath();
  ctx.arc(0, -2, 13, 0, TAU);
  ctx.fill();
  const pulse = 0.6 + Math.sin(t * 4) * 0.2;
  ctx.fillStyle = bossColor(b, '#ff5d8f');
  ctx.beginPath();
  ctx.arc(0, -2, 7 + pulse * 2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(-2, -5, 4, 4);
  drawGlow(0, -2, 30, '#ff5d8f', 0.18);
  // data plates
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = bossColor(b, i % 2 ? '#4cc9f0' : '#c77dff');
    ctx.globalAlpha = baseAlpha * 0.55;
    ctx.fillRect(-32 + i * 19, 28, 10, 2);
  }
  ctx.globalAlpha = baseAlpha;
  ctx.restore();
}

function drawCEO(b, t) {
  const jumpOff = b.jump > 0 ? -Math.sin(clamp(b.jump, 0, 1) * Math.PI) * 40 : 0;
  const x = Math.round(b.x), y = Math.round(b.y + jumpOff), w = b.w, h = b.h;
  const phase2 = b.hp / b.maxHp < 0.66;
  const phase3 = b.hp / b.maxHp < 0.33;
  const flash = bossColor(b, phase3 ? '#ff5d73' : '#ffd23f');
  const dark = bossColor(b, '#2a1824');
  const gold = bossColor(b, '#c99a2e');
  const walk = Math.sin(t * 6) * 1.5;
  ctx.save();
  // cape
  ctx.fillStyle = bossColor(b, '#7d1f38');
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 24);
  ctx.quadraticCurveTo(x - 22 + Math.sin(t * 3) * 4, y + 48, x - 8, y + h + 4);
  ctx.lineTo(x + w + 8, y + h + 4);
  ctx.quadraticCurveTo(x + w + 20 + Math.sin(t * 2) * 4, y + 50, x + w - 8, y + 24);
  ctx.closePath();
  ctx.fill();
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,.36)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, GROUND_Y + 2, w * 0.7, 5, 0, 0, TAU);
  ctx.fill();
  // legs
  ctx.fillStyle = dark;
  ctx.fillRect(x + 12, y + h - 30, 12, 28);
  ctx.fillRect(x + w - 24, y + h - 30 + walk, 12, 28);
  ctx.fillStyle = bossColor(b, '#4a3040');
  ctx.fillRect(x + 6, y + h - 10, 24, 9);
  ctx.fillRect(x + w - 30, y + h - 10 + walk, 24, 9);
  // torso
  ctx.fillStyle = bossColor(b, '#3b2838');
  ctx.fillRect(x + 8, y + 20, w - 16, h - 46);
  ctx.fillStyle = gold;
  ctx.fillRect(x + 12, y + 26, w - 24, 7);
  ctx.fillStyle = bossColor(b, '#1a1018');
  ctx.fillRect(x + 17, y + 38, w - 34, 18);
  // core
  ctx.fillStyle = flash;
  ctx.fillRect(x + w / 2 - 5, y + 44, 10, 5);
  drawGlow(x + w / 2, y + 46, 26, phase3 ? '#ff5d73' : '#ffd23f', 0.2);
  // shoulders
  ctx.fillStyle = bossColor(b, '#6b4e2d');
  ctx.fillRect(x - 8, y + 18, 20, 18);
  ctx.fillRect(x + w - 12, y + 18, 20, 18);
  // head
  ctx.fillStyle = bossColor(b, '#e3c98e');
  ctx.fillRect(x + 18, y + 2, w - 36, 18);
  ctx.fillStyle = bossColor(b, '#171018');
  ctx.fillRect(x + 21, y + 7, w - 42, 7);
  ctx.fillStyle = bossColor(b, '#ff5d73');
  ctx.fillRect(x + 24, y + 9, 5, 3);
  ctx.fillRect(x + w - 29, y + 9, 5, 3);
  // crown
  ctx.fillStyle = gold;
  ctx.fillRect(x + 20, y - 7, w - 40, 7);
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(x + 22 + i * 8, y - 12, 4, 7);
  }
  // arm cannon
  ctx.fillStyle = dark;
  ctx.fillRect(x + w - 4, y + 32, 26, 12);
  ctx.fillStyle = bossColor(b, '#8a7a4f');
  ctx.fillRect(x + w + 14, y + 30, 14, 14);
  ctx.fillStyle = flash;
  ctx.fillRect(x + w + 24, y + 33, 6, 8);
  // antenna / halo
  if (phase2) {
    ctx.strokeStyle = hexA('#ffd23f', 0.45 + Math.sin(t * 5) * 0.2);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, 46 + Math.sin(t * 3) * 2, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

/* ------------------------------------------------------------
   Small prop drawing used by game.js
   ------------------------------------------------------------ */

function drawPickupCapsule(p, t) {
  const bob = Math.sin(t * 3 + p.seed) * 2;
  const x = p.x;
  const y = p.y + bob;
  if (p.type === 'weapon') {
    drawGlow(x + 8, y + 8, 24, WEAPONS[p.weapon].color, 0.16);
    ctx.fillStyle = '#0b0b13';
    ctx.fillRect(x, y, 17, 17);
    ctx.fillStyle = hexA(WEAPONS[p.weapon].color, 0.45);
    ctx.fillRect(x + 1, y + 1, 15, 1);
    ctx.fillRect(x + 1, y + 15, 15, 1);
    ctx.fillRect(x + 1, y + 1, 1, 15);
    ctx.fillRect(x + 15, y + 1, 1, 15);
    drawWeaponIcon(p.weapon, x + 1, y + 4, WEAPONS[p.weapon].color, 0.8);
    if (Math.sin(t * 5 + p.seed) > 0.2) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 14, y + 2, 1, 1);
    }
  } else if (p.type === 'health') {
    drawGlow(x + 7, y + 7, 20, '#ff5d73', 0.18);
    ctx.fillStyle = '#0b0b13';
    ctx.fillRect(x, y, 15, 15);
    ctx.fillStyle = '#ff5d73';
    ctx.fillRect(x + 2, y + 2, 11, 11);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 6, y + 4, 3, 7);
    ctx.fillRect(x + 4, y + 6, 7, 3);
  } else {
    drawGlow(x + 6, y + 6, 16, '#ffd23f', 0.15);
    ctx.fillStyle = '#0b0b13';
    ctx.fillRect(x, y, 13, 13);
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(x + 3, y + 3, 7, 7);
    ctx.fillStyle = '#1a1522';
    ctx.fillRect(x + 5, y + 5, 3, 3);
  }
}
