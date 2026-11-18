// Phase 3 pixel art: strawberry coin, new enemies (bee, bear, bat, snow rabbit), new weapons/passives/evolutions, cake pickup.
import { Pix, mixc } from './art.js';

const EYE = 0x1a1626, BLUSH = 0xff9fb0;
const LEAF = [0x2b6a35, 0x45964a, 0x6cc05a, 0xa9e27c];
const GOLD = [0xa8682a, 0xe8a83a, 0xffd860, 0xfff4b0];
const BERRY = [0xa3203c, 0xe63a52, 0xff7e8a, 0xffd0d0];
const WOOD = [0x5a3420, 0x7f4c2e, 0xa86e42, 0xc9935e];
const eyes = (P, xs, y, h = 2) => { for (const x of xs) { P.rect(x, y, 2, h, EYE); P.set(x, y, 0xffffff); } };
const angry = (P, x0, x1, y) => { P.line(x0 - 1, y - 2, x0 + 2, y - 1, EYE); P.line(x1 + 3, y - 2, x1, y - 1, EYE); };
// strawberry body: wide shoulders, rounded point at the bottom
function berryBody(P, cx, cy, rx, ry, pal) {
  P.ell(cx, cy, rx, ry, (x, y, nx, ny) => {
    const w = ny > 0 ? 1 - ny * ny * 0.55 - ny * 0.25 : 1; if (Math.abs(nx) > w) return -1;
    const l = -nx * 0.55 - ny * 0.6; return l > 0.55 ? pal[3] : l > 0.05 ? pal[2] : l > -0.45 ? pal[1] : pal[0];
  });
}

// ---------- いちごコイン: a shiny strawberry ----------
function coin() {
  const P = new Pix(15, 16); P.ox = 1; P.oy = 1;
  berryBody(P, 6.5, 8, 6.2, 6.8, [0xb01a3a, 0xf0304e, 0xff6e7e, 0xffb8c0]);
  for (const [x, y] of [[3, 6], [6, 5], [9, 6], [4, 9], [7, 8], [10, 9], [5, 12], [8, 11]]) P.set(x, y, 0xffe066);
  P.poly([[1.5, 2.5], [6.5, 4.5], [11.5, 2.5], [9, 1.5], [6.5, 0], [4, 1.5]], (x, y) => y < 2 ? LEAF[2] : LEAF[1]); P.set(6, -1, LEAF[0]); P.set(7, -1, LEAF[0]);
  P.set(3, 4, 0xffffff); P.set(2, 5, 0xffffff);
  return P.outline(0.5);
}

// ---------- enemies ----------
function bee(fr) { // ハチ (apple orchard, strawberry fields)
  const P = new Pix(24, 22); P.ox = 2; P.oy = 2; const w = fr % 2, b = [0, -1, 0, 1][fr];
  P.ell(7, 4 + b - w * 2, 4, 3, () => 0xe8f4ff); P.ell(13, 4 + b - w * 2, 4, 3, () => 0xd8ecff);
  P.ball(10, 11 + b, 8, 6, [0x8a5a00, 0xf0b820, 0xffe060, 0xfff4b0]);
  for (const x of [8, 12]) P.rect(x, 6 + b, 2, 11, (xx, yy) => Math.hypot(xx + 0.5 - 10, (yy + 0.5 - 11 - b) * 1.33) < 8 ? 0x2a2030 : -1);
  P.poly([[17, 10 + b], [21, 12 + b], [17, 13 + b]], 0x3a2a20);
  eyes(P, [3, 6], 9 + b); angry(P, 3, 6, 9 + b); P.set(4, 13 + b, BLUSH);
  return P.outline(0.55);
}
function kuma(fr) { // ツキノワグマ (big and tough)
  const P = new Pix(34, 34); P.ox = 2; P.oy = 2; const st = [0, 1, 0, -1][fr];
  const F = [0x121018, 0x2a2632, 0x423c4e, 0x5e5670];
  P.ball(8 - st, 27, 3.5, 3, F); P.ball(22 + st, 27, 3.5, 3, F);
  P.ball(15, 19, 12, 10, F, { t1: 0.55 });
  P.poly([[9, 15], [21, 15], [15, 19]], 0xf4f0e8); // moon mark
  P.ball(6, 4, 3.4, 3.4, F); P.ball(24, 4, 3.4, 3.4, F); P.set(6, 4, 0x8a6a7a); P.set(24, 4, 0x8a6a7a);
  P.ball(15, 9, 9.5, 8, F, { t1: 0.55 });
  P.ball(15, 12, 4.4, 3.2, [0x8a6a50, 0xb89070, 0xd8b898]); P.rect(14, 10, 3, 2, EYE);
  eyes(P, [10, 18], 7); angry(P, 10, 18, 7); P.rect(14, 14, 3, 1, 0x5a2020);
  return P.outline(0.55);
}
function bat(fr) { // コウモリ (night stage)
  const P = new Pix(28, 18); P.ox = 1; P.oy = 2; const up = [0, -3, 0, 2][fr];
  const B = [0x2a1840, 0x4a2a70, 0x6e48a0, 0x9a78c8];
  P.poly([[12, 7], [0, 1 + up], [3, 7 + up * 0.3], [1, 11 + up * 0.3], [8, 10]], B[1]); P.poly([[14, 7], [26, 1 + up], [23, 7 + up * 0.3], [25, 11 + up * 0.3], [18, 10]], B[0]);
  P.ball(13, 8, 5, 5, B); P.poly([[9, 4], [10, -1], [12, 4]], B[1]); P.poly([[14, 4], [16, -1], [17, 4]], B[1]);
  P.rect(10, 7, 2, 2, 0xff5a8a); P.rect(15, 7, 2, 2, 0xff5a8a); P.set(12, 11, 0xffffff); P.set(14, 11, 0xffffff);
  return P.outline(0.55);
}
function usagi(fr) { // ゆきうさぎ (snow stage) — hops
  const P = new Pix(22, 28); P.ox = 2; P.oy = 2; const h = [0, -3, -4, -1][fr];
  const W = [0xa8b8d0, 0xe4ecf8, 0xffffff, 0xffffff];
  P.ball(10, 18 + h, 7.5, 6, W); P.ball(16, 19 + h, 2.2, 2.2, W);
  P.ball(9, 10 + h, 6, 5.5, W);
  P.ell(6, 2 + h, 1.6, 5, (x, y, nx) => nx > 0.2 ? 0xffb8c8 : 0xe8eef8); P.ell(11, 1 + h, 1.6, 5, (x, y, nx) => nx > 0.2 ? 0xffb8c8 : 0xe8eef8);
  P.rect(6, 9 + h, 2, 2, 0xe02040); P.rect(11, 9 + h, 2, 2, 0xe02040); angry(P, 6, 11, 9 + h); P.set(9, 13 + h, 0xff8aa0); P.set(4, 12 + h, BLUSH); P.set(14, 12 + h, BLUSH);
  return P.outline(0.5);
}

// ---------- weapons / passives / evolutions ----------
function hball(gold) { // hamster in a rolling ball
  const P = new Pix(22, 22); P.ox = 1; P.oy = 1;
  const rim = gold ? GOLD : [0x7ab0d8, 0xb8e0ff, 0xe0f4ff, 0xffffff];
  P.ell(10, 10, 9.5, 9.5, (x, y, nx, ny) => { const r = nx * nx + ny * ny; return r > 0.78 ? (nx + ny < -0.4 ? rim[2] : rim[1]) : -1; });
  P.ball(10, 12, 5.5, 4.5, [0xb86a2a, 0xf0a050, 0xffd090, 0xfff0d8]); P.ball(10, 13.5, 3, 2.2, [0xfff0e0, 0xfff8f0, 0xffffff]);
  P.ball(6.5, 8.5, 1.5, 1.5, [0xb86a2a, 0xf0a050, 0xffc8c8]); P.ball(13.5, 8.5, 1.5, 1.5, [0xb86a2a, 0xf0a050, 0xffc8c8]);
  P.set(8, 11, EYE); P.set(12, 11, EYE); P.set(10, 13, 0xff7a90); P.set(6, 13, BLUSH); P.set(14, 13, BLUSH);
  P.set(5, 4, 0xffffff); P.set(4, 5, 0xffffff); P.set(6, 4, 0xffffff);
  if (gold) for (const [x, y] of [[17, 2], [2, 16], [18, 15]]) { P.set(x, y, 0xffffff); P.set(x + 1, y, GOLD[2]); P.set(x - 1, y, GOLD[2]); P.set(x, y + 1, GOLD[2]); P.set(x, y - 1, GOLD[2]); }
  return P.outline(0.55);
}
function uchiwa(big) { // cheer fan
  const P = new Pix(22, 26); P.ox = 1; P.oy = 1; const pal = big ? [0x2a8a5a, 0x4ac88a, 0x9af0c0, 0xe0fff0] : [0xc04a80, 0xff7eb6, 0xffb8d8, 0xffe8f4];
  P.rect(9, 17, 3, 8, (x) => x === 9 ? WOOD[1] : WOOD[3]);
  P.ball(10, 9, 9.5, 8.5, pal, { t1: 0.5 });
  P.ell(10, 9, 6.5, 5.5, (x, y, nx, ny) => nx * nx + ny * ny > 0.75 ? 0xffffff : -1);
  // a little heart
  P.ball(8.5, 8, 1.8, 1.8, [0xff3a6a, 0xff3a6a, 0xff8aa8]); P.ball(11.5, 8, 1.8, 1.8, [0xff3a6a, 0xff3a6a, 0xff8aa8]); P.poly([[6.8, 8.6], [13.2, 8.6], [10, 12.5]], 0xff3a6a);
  if (big) for (let i = 0; i < 3; i++) P.line(0, 20 + i * 2, 6 - i, 18 + i * 2, 0xbfeedd);
  return P.outline(0.55);
}
function guitar(gold) {
  const P = new Pix(16, 28); P.ox = 1; P.oy = 1; const body = gold ? [0x5a1030, 0x9a1a4a, 0xe04a8a, 0xff9ac8] : [0x5a0a14, 0xa01a2a, 0xe03a4a, 0xff8a8a];
  P.rect(6, 0, 3, 14, (x) => x === 6 ? WOOD[0] : WOOD[1]); P.rect(5, -1, 5, 3, 0x2a2030); for (let y = 2; y < 13; y += 3) P.set(7, y, 0xe0d0b0);
  P.ball(7, 16.5, 6.2, 4, body); P.ball(7, 22, 7, 4.8, body);
  P.ell(7, 18.5, 1.8, 1.8, () => 0x1a1020); P.rect(4, 22, 7, 1, 0xe8d8a8);
  P.line(7, 2, 7, 22, 0xf0f0f0);
  if (gold) { P.poly([[13, 2], [10, 9], [12, 9], [9, 15], [14, 7], [12, 7]], GOLD[2]); }
  return P.outline(0.55);
}
function bolt2() { // lightning bolt (falls on foes)
  const P = new Pix(14, 30); P.ox = 1; P.oy = 1;
  P.poly([[8, 0], [2, 14], [6, 14], [3, 27], [11, 10], [7, 10], [10, 0]], (x, y) => x < 6 ? 0xfff8c0 : 0xffd84a);
  return P.outline(0.4);
}
function omamori() {
  const P = new Pix(16, 22); P.ox = 1; P.oy = 1;
  P.line(7, 0, 5, 3, 0xffd84a); P.line(7, 0, 9, 3, 0xffd84a);
  P.rect(2, 3, 11, 16, (x, y) => (y === 3 || y === 18) ? 0xa02040 : x < 5 ? 0xff6a8a : 0xe63a5a);
  P.rect(4, 6, 7, 8, (x, y) => (x === 4 || x === 10 || y === 6 || y === 13) ? 0xffd84a : 0xfff4d8);
  P.rect(6, 8, 3, 1, 0xa02040); P.rect(7, 8, 1, 5, 0xa02040); P.rect(5, 11, 5, 1, 0xa02040);
  return P.outline(0.55);
}
function gakufu() {
  const P = new Pix(22, 18); P.ox = 1; P.oy = 1;
  P.rect(0, 0, 20, 15, (x, y) => x === 10 ? 0xd8d0c0 : x < 10 ? 0xfffbf0 : 0xf4ecdc);
  for (let y = 3; y < 13; y += 2) P.rect(1, y, 18, 1, 0x9a90b0);
  P.ball(5, 10, 1.6, 1.2, [0x2a2040, 0x2a2040, 0x5a5080]); P.rect(6, 4, 1, 6, 0x2a2040); P.ball(14, 8, 1.6, 1.2, [0xe63a6a, 0xe63a6a, 0xff8ab0]); P.rect(15, 2, 1, 6, 0xe63a6a); P.rect(15, 2, 3, 1, 0xe63a6a);
  return P.outline(0.55);
}
function wasabi() {
  const P = new Pix(14, 26); P.ox = 1; P.oy = 1;
  for (const [a, b] of [[2, 0], [6, -1], [10, 0]]) P.ball(a + 1, b + 4, 3, 4, LEAF);
  P.rect(5, 6, 3, 4, LEAF[0]);
  P.ell(6.5, 16, 4, 8.5, (x, y, nx, ny) => (y % 3 === 0 && Math.abs(nx) < 0.8) ? 0x7aa858 : nx < -0.2 ? 0xd0f0a0 : nx > 0.4 ? 0x7ab858 : 0xa8d878);
  return P.outline(0.55);
}
function cakeI() { // いちごケーキ pickup: full heal + shield
  const P = new Pix(22, 22); P.ox = 1; P.oy = 1;
  P.poly([[0, 10], [20, 10], [20, 19], [0, 19]], (x, y) => y === 14 || y === 15 ? 0xff7e9a : y > 17 ? 0xe8d0b8 : x < 6 ? 0xffffff : 0xfff4ec);
  P.ell(10, 10, 10, 3, (x, y, nx) => nx < -0.3 ? 0xffffff : 0xfff0f4);
  for (const x of [1, 5, 9, 13, 17]) P.ball(x + 1, 11.5, 1.6, 1.4, [0xffffff, 0xfff8fa, 0xffffff]);
  berryBody(P, 10, 5.5, 4, 4.5, BERRY); P.poly([[7, 2], [10, 3], [13, 2], [10, 0.5]], LEAF[1]); P.set(9, 5, 0xffe066); P.set(11, 7, 0xffe066);
  return P.outline(0.55);
}
function giga() { // champion belt with a star
  const P = new Pix(30, 18); P.ox = 1; P.oy = 1;
  P.rect(0, 5, 28, 8, (x, y) => y === 5 || y === 12 ? 0x2a1a10 : 0x4a2a1a);
  P.ball(14, 8.5, 8, 7, GOLD, { t2: 0.8 });
  P.poly([[14, 3], [15.6, 7], [19.5, 7.2], [16.4, 9.6], [17.6, 13.4], [14, 11], [10.4, 13.4], [11.6, 9.6], [8.5, 7.2], [12.4, 7]], (x, y) => y < 8 ? 0xff7eb6 : 0xe63a8a);
  for (const x of [2, 25]) P.ball(x + 1, 8.5, 1.6, 1.6, GOLD);
  return P.outline(0.55);
}
function penSea() { // three penlights crossed + glow dots
  const P = new Pix(26, 24); P.ox = 1; P.oy = 1;
  const cols = [0xff5a8a, 0x5ac8ff, 0x7ee87a]; [[4, 20, 10, 2], [12, 21, 12, 0], [20, 20, 14, 2]].forEach(([x0, y0, x1, y1], i) => { for (let k = -1; k <= 1; k++) P.line(x0 + k, y0, x1 + k, y1, mixc(cols[i], 0xffffff, k === 0 ? 0.5 : 0)); P.rect(x0 - 1, y0, 3, 3, 0x3a3a4a); });
  for (const [x, y, c] of [[2, 4, 0xffd84a], [22, 6, 0xff9ad8], [6, 12, 0xffffff], [18, 13, 0xffffff]]) { P.set(x, y, c); P.set(x + 1, y, c); P.set(x, y + 1, c); }
  return P.outline(0.45);
}
function stampede() { // golden horseshoe
  const P = new Pix(22, 22); P.ox = 1; P.oy = 1;
  P.ell(10, 9, 9, 9, (x, y, nx, ny) => { const r = nx * nx + ny * ny; return r > 0.36 && ny > -0.95 && !(ny > 0.35 && Math.abs(nx) < 0.5) ? (nx < -0.2 ? GOLD[3] : nx > 0.4 ? GOLD[0] : GOLD[2]) : -1; });
  for (const [x, y] of [[3, 7], [3, 12], [17, 7], [17, 12], [6, 2], [14, 2]]) P.set(x, y, 0x8a5a20);
  P.poly([[16, 14], [21, 16], [16, 19]], 0xffffff);
  return P.outline(0.55);
}
function whirl() { // swirl of wind
  const P = new Pix(24, 24); P.ox = 1; P.oy = 1;
  for (let i = 0; i < 160; i++) { const a = i / 160 * Math.PI * 5, r = 1 + i / 160 * 10; const x = 11 + Math.cos(a) * r, y = 11 + Math.sin(a) * r * 0.9; P.set(x, y, i > 110 ? 0x4ac88a : i > 50 ? 0x9af0c0 : 0xe0fff0); P.set(x + 0.6, y, i > 110 ? 0x2a8a5a : 0x4ac88a); }
  P.ball(11, 11, 2, 2, [0xff5a8a, 0xff7eb6, 0xffd0e0]);
  return P.outline(0.5);
}
function fire() {
  const P = new Pix(18, 22); P.ox = 1; P.oy = 1;
  P.poly([[8, 0], [15, 10], [14, 17], [8, 20], [2, 17], [1, 10], [5, 6], [6, 11]], (x, y) => y < 8 ? 0xffd84a : 0xff7a2a);
  P.poly([[8, 8], [12, 14], [8, 19], [4, 14]], 0xffe890);
  return P.outline(0.5);
}
function star3() {
  const P = new Pix(28, 16); P.ox = 1; P.oy = 1;
  const star = (cx, cy, r, c) => { const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } P.poly(pts, c); };
  star(5, 8, 5, GOLD[2]); star(13, 7, 6.5, 0xff7eb6); star(21, 8, 5, 0x6ec3ff);
  return P.outline(0.5);
}

export function addPhase3(add) {
  for (let i = 0; i < 4; i++) { add('bee' + i, bee(i)); add('kuma' + i, kuma(i)); add('bat' + i, bat(i)); add('usagi' + i, usagi(i)); }
  add('hball', hball(false)); add('hparade', hball(true)); add('uchiwa', uchiwa(false)); add('whirlFan', uchiwa(true)); add('guitar', guitar(false)); add('gsolo', guitar(true)); add('bolt2', bolt2());
  add('omamori', omamori()); add('gakufu', gakufu()); add('wasabi', wasabi()); add('cakeI', cakeI());
  add('giga', giga()); add('penSea', penSea()); add('stampede', stampede()); add('whirl', whirl()); add('fire', fire()); add('star3', star3());
}
export { coin as berryCoin };
