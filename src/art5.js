// Phase 4b pixel art: 中華街 (a generic Chinatown street) with a dragon gate, lanterns and capsule-toy machines,
// its foes and boss, and the animal-bun / pan-fried soup dumpling / giant fried chicken pickups. Drawn in code like art.js.
import { Pix, mixc } from './art.js';

const EYE = 0x1a1626, BLUSH = 0xff9fb0;
const RED = [0x8a1420, 0xc8283a, 0xe8505a, 0xff9a9a];
const GOLD = [0xa8682a, 0xe8a83a, 0xffd860, 0xfff4b0];
const JADE = [0x1a5a4a, 0x2a8a6a, 0x4ab88a, 0x9ae8c0];
const BUN = [0xc8b498, 0xf0e4d0, 0xfff8ee, 0xffffff];
const N = 256;
const eyes = (P, xs, y, h = 2) => { for (const x of xs) { P.rect(x, y, 2, h, EYE); P.set(x, y, 0xffffff); } };
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- ground: red-brown brick street with grey stone bands ----------
export function chinaGround() {
  const P = new Pix(N, N), r = mulberry(888);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const band = (y % 128) < 16; let c;
    if (band) c = ((x >> 4) + (y >> 3)) % 2 ? 0x9a94a4 : 0x8a8494;
    else { const by = y % 8, bx = (x + ((y >> 3) % 2) * 8) % 16; c = by === 0 || bx === 0 ? 0x5a2a26 : ((x * 7 + y * 3) % 11 < 2 ? 0xa04a3a : 0x8a3a30); }
    if (!band && r() < 0.01) c = 0xb85a44;
    P.set(x, y, c);
  }
  for (let i = 0; i < 40; i++) { const x = (r() * N) | 0, y = (r() * N) | 0; P.set(x, y, i % 2 ? 0xffd860 : 0xff5a5a); } // scattered confetti from firecrackers
  return P.toCanvas();
}

// ---------- props ----------
function dgate() { // dragon gate: red pillars, layered jade roof, gold plaque with a dragon swirl (no text)
  const P = new Pix(62, 60); P.ox = 1; P.oy = 1;
  for (const x of [8, 50]) { P.rect(x, 18, 4, 40, (X) => X === x ? RED[3] : X === x + 3 ? RED[0] : RED[1]); P.rect(x - 2, 54, 8, 4, 0x8a8494); }
  P.rect(6, 22, 50, 3, (x, y) => y === 22 ? RED[2] : RED[1]);
  for (const [y, w] of [[4, 56], [12, 50]]) { P.poly([[30 - w / 2 - 3, y + 5], [30 + w / 2 + 3, y + 5], [30 + w / 2 - 4, y], [30 - w / 2 + 4, y]], (x, Y) => Y === y ? JADE[3] : ((x % 3) ? JADE[1] : JADE[0])); P.set(30 - w / 2 - 3, y + 3, GOLD[2]); P.set(30 + w / 2 + 3, y + 3, GOLD[2]); }
  P.rect(22, 26, 18, 10, (x, y) => (x === 22 || x === 39 || y === 26 || y === 35) ? GOLD[1] : 0x2a1418);
  for (let i = 0; i < 12; i++) { const a = i * 0.6, x = 31 + Math.cos(a) * (2 + i * 0.4), y = 31 + Math.sin(a) * (1 + i * 0.25); P.set(Math.round(x), Math.round(y), GOLD[2]); }
  P.ball(30, 2, 3, 2, GOLD);
  return P.outline(0.6);
}
function clant(v) { // red paper lantern on a pole
  const P = new Pix(16, 34); P.ox = 1; P.oy = 1;
  P.rect(6, 12, 2, 20, (x) => x === 6 ? 0x5a4a44 : 0x3a2a24); P.rect(2, 2, 10, 1, 0x3a2a24);
  P.ball(7, 8, 5.5, 4.6, v ? [0xa8682a, 0xe8a83a, 0xffd860, 0xfff4b0] : RED); P.rect(4, 3, 7, 1, GOLD[1]); P.rect(4, 12, 7, 1, GOLD[1]);
  for (let y = 5; y < 12; y += 2) P.set(7, y, v ? GOLD[0] : RED[0]); P.rect(6, 13, 2, 3, GOLD[2]);
  return P.outline(0.55);
}
function gacha(v) { // capsule-toy machine: clear dome full of capsules on a coloured base
  const P = new Pix(20, 32); P.ox = 1; P.oy = 1; const base = [[0x3a6ad0, 0x6a9af0], [0xe8505a, 0xff9a9a], [0x2a8a6a, 0x4ab88a]][v];
  P.ell(9, 8, 8, 7, (x, y, nx, ny) => nx * nx + ny * ny > 0.8 ? 0xc8d8f0 : 0xe8f4ff);
  const cc = [0xff7eb6, 0xffd860, 0x6ec3ff, 0x7ee87a, 0xff9a40];
  for (let i = 0; i < 9; i++) { const x = 4 + (i % 3) * 4 + (i > 5 ? 1 : 0), y = 7 + Math.floor(i / 3) * 3; P.ball(x, y, 1.6, 1.6, [mixc(cc[i % 5], 0, 0.3), cc[i % 5], 0xffffff, 0xffffff]); }
  P.set(5, 3, 0xffffff); P.set(6, 3, 0xffffff);
  P.rect(1, 15, 17, 15, (x, y) => x === 1 || y === 15 ? base[1] : base[0]); P.rect(6, 19, 7, 5, 0xf4f2fa); P.ball(9, 21, 1.8, 1.8, [0x8a8494, 0xc8c4d8, 0xffffff, 0xffffff]); P.rect(7, 26, 5, 2, 0x1a1626);
  return P.outline(0.55);
}

// ---------- foes ----------
function gyoza(fr) { // hopping dumpling
  const P = new Pix(22, 18); P.ox = 1; P.oy = 1; const h = [0, -2, -3, -1][fr];
  P.ell(10, 11 + h, 9, 5, (x, y, nx, ny) => ny > 0.5 ? 0xd8a060 : (nx * nx + ny * ny > 0.7 ? 0xe8d8b8 : 0xfff4e0));
  for (let x = 3; x < 18; x += 2) P.set(x, 6 + h + (x % 4 === 1 ? 0 : 1), 0xe8d8b8);
  eyes(P, [7, 12], 10 + h); P.set(5, 13 + h, BLUSH); P.set(15, 13 + h, BLUSH); P.rect(9, 13 + h, 2, 1, EYE);
  return P.outline(0.55);
}
function lantb(fr) { // flying lantern ghost
  const P = new Pix(18, 26); P.ox = 1; P.oy = 1; const b = [0, -1, 0, 1][fr];
  P.ball(8, 10 + b, 7, 6, RED); P.rect(5, 3 + b, 7, 2, GOLD[1]); P.rect(5, 16 + b, 7, 2, GOLD[1]);
  for (let i = 0; i < 3; i++) P.line(6 + i * 2, 18 + b, 6 + i * 2 + (fr % 2 ? 1 : -1), 23 + b, GOLD[2]);
  eyes(P, [5, 10], 9 + b, 3); P.rect(7, 13 + b, 3, 1, EYE);
  return P.outline(0.55);
}
function capsb(fr) { // rolling capsule
  const P = new Pix(18, 18); P.ox = 1; P.oy = 1; const c = [0xff7eb6, 0x6ec3ff, 0xffd860, 0x7ee87a][fr];
  P.ell(8, 8, 7.5, 7.5, (x, y, nx, ny) => ny < 0 ? mixc(c, 0xffffff, nx * nx + ny * ny < 0.3 ? 0.4 : 0) : (nx * nx + ny * ny > 0.7 ? 0xc8c4d8 : 0xf4f2fa));
  P.rect(1, 8, 15, 1, mixc(c, 0, 0.35)); eyes(P, [5, 10], 9); P.set(4, 4, 0xffffff);
  return P.outline(0.55);
}
function cdragon(fr) { // 爆竹ドラゴン (boss): a festival dragon head
  const P = new Pix(60, 50); P.ox = 2; P.oy = 2; const m = [0, 2, 4, 2][fr];
  for (const s of [-1, 1]) { P.line(30 + s * 10, 10, 30 + s * 20, 0, GOLD[2]); P.line(30 + s * 11, 10, 30 + s * 21, 1, GOLD[1]); P.ball(30 + s * 20, 1, 2, 2, GOLD); } // horns
  P.ell(30, 22, 22, 14, (x, y, nx, ny) => nx * nx + ny * ny > 0.75 ? RED[0] : ny < -0.3 ? RED[2] : RED[1]);
  P.rect(12, 30, 36, 6 + m, (x, y) => y === 30 ? 0x5a0a14 : 0x3a0610); P.rect(16, 36 + m, 28, 4, RED[1]); for (let x = 16; x < 44; x += 4) { P.set(x + 1, 31, 0xffffff); P.set(x + 2, 35 + m, 0xffffff); }
  P.ball(20, 18, 5, 5, [0xc8c4d8, 0xffffff, 0xffffff, 0xffffff]); P.ball(40, 18, 5, 5, [0xc8c4d8, 0xffffff, 0xffffff, 0xffffff]); P.rect(20, 17, 3, 4, EYE); P.rect(39, 17, 3, 4, EYE);
  P.line(13, 12, 25, 14, GOLD[2]); P.line(47, 12, 35, 14, GOLD[2]); // brows
  P.ball(30, 26, 4, 2.4, [RED[0], RED[1], RED[2], RED[3]]); P.set(28, 26, EYE); P.set(32, 26, EYE);
  for (const s of [-1, 1]) for (let i = 0; i < 12; i++) P.set(30 + s * (22 + i), 28 + Math.round(Math.sin(i * 0.6 + fr) * 2), 0xffffff); // whiskers
  for (let i = 0; i < 5; i++) P.ball(14 + i * 8, 8 - (i % 2), 2.2, 2.2, JADE); // mane
  P.set(16, 24, BLUSH); P.set(44, 24, BLUSH);
  return P.outline(0.6);
}
function fireb() { const P = new Pix(12, 12); P.ball(5.5, 5.5, 5, 5, [0xc8283a, 0xff7a2a, 0xffd860, 0xffffff]); return P; }

// ---------- pickups ----------
function aman() { // animal-shaped steamed buns (a panda and a pig), generic
  const P = new Pix(26, 18); P.ox = 1; P.oy = 1;
  P.ball(7, 9, 6.5, 6, BUN); for (const x of [2, 12]) P.ball(x, 3, 2, 2, [0x1a1626, 0x2a2632, 0x3a3644, 0x4a4654]);
  P.ball(5, 9, 1.6, 1.8, [0x1a1626, 0x2a2632, 0x2a2632, 0x3a3644]); P.ball(10, 9, 1.6, 1.8, [0x1a1626, 0x2a2632, 0x2a2632, 0x3a3644]); P.set(5, 9, 0xffffff); P.set(10, 9, 0xffffff); P.set(7, 12, EYE);
  P.ball(18, 10, 6, 5.5, [0xd88aa0, 0xffb8c8, 0xffd8e0, 0xffffff]); P.set(14, 5, 0xff9ab0); P.set(22, 5, 0xff9ab0); P.ball(18, 12, 2, 1.4, [0xd86a88, 0xff8aa8, 0xff8aa8, 0xffb0c0]); P.set(16, 9, EYE); P.set(20, 9, EYE);
  return P.outline(0.5);
}
function xlb() { // pan-fried soup dumplings in a small pan, with steam
  const P = new Pix(24, 20); P.ox = 1; P.oy = 1;
  P.ell(11, 14, 11, 4, (x, y, nx, ny) => nx * nx + ny * ny > 0.7 ? 0x2a2a34 : 0x484856); P.rect(21, 13, 3, 2, 0x5a3a2a);
  for (const [x, y] of [[6, 11], [11, 10], [16, 11], [9, 14], [14, 14]]) { P.ball(x, y, 3, 2.4, BUN); P.set(x, y - 2, 0xd8c8a8); P.rect(x - 2, y + 2, 5, 1, 0xc88a40); P.set(x + 1, y - 1, 0x5a8a3a); }
  for (const x of [6, 12, 17]) { P.set(x, 3, 0xffffff); P.set(x + 1, 1, 0xffffff); P.set(x, 5, 0xe8e4f0); }
  return P.outline(0.5);
}
function jpai() { // a giant fried chicken cutlet dusted with plum powder
  const P = new Pix(26, 24); P.ox = 1; P.oy = 1;
  P.poly([[3, 4], [20, 1], [24, 12], [18, 22], [4, 20], [1, 11]], (x, y) => ((x * 5 + y * 3) % 7 < 2 ? 0xb8702a : (x + y) % 5 ? 0xe8a040 : 0xffc860));
  for (const [x, y] of [[6, 7], [12, 5], [17, 9], [9, 13], [15, 15], [20, 13], [7, 17], [12, 10]]) { P.set(x, y, 0xff8ab0); P.set(x + 1, y + 1, 0xd8508a); }
  P.rect(4, 21, 16, 2, 0xf4f2fa);
  return P.outline(0.5);
}
function skirt() { // a top remade into a skirt (zukan icon)
  const P = new Pix(22, 20); P.ox = 1; P.oy = 1;
  P.rect(5, 1, 11, 3, (x) => x % 2 ? 0x3a3644 : 0x4a4654);
  P.poly([[5, 4], [16, 4], [20, 17], [1, 17]], (x, y) => ((x + (y >> 1)) % 4 === 0 ? 0x5a5a7a : 0x7a7a9a));
  for (let x = 2; x < 20; x += 3) P.set(x, 17, 0xffffff); P.line(3, 9, 18, 9, 0xffffff); for (let x = 4; x < 18; x += 2) P.set(x, 10, 0xff7eb6);
  return P.outline(0.5);
}

export function addPhase5(add) {
  for (let i = 0; i < 4; i++) { add('gyoza' + i, gyoza(i)); add('lantb' + i, lantb(i)); add('capsb' + i, capsb(i)); add('cdragon' + i, cdragon(i)); }
  add('dgate', dgate()); add('clant0', clant(0)); add('clant1', clant(1)); for (let v = 0; v < 3; v++) add('gacha' + v, gacha(v));
  add('fireb', fireb()); add('aman', aman()); add('xlb', xlb()); add('jpai', jpai()); add('skirt', skirt());
}
