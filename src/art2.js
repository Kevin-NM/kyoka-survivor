// Phase 2 pixel art: new stages (zoo, snow, night), their enemies and bosses, new weapons and items. Drawn in code like art.js.
import { Pix, mixc, mulberry } from './art.js';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const EYE = 0x1a1626, BLUSH = 0xff9fb0;
const LEAF = [0x2b6a35, 0x45964a, 0x6cc05a, 0xa9e27c];
const WOOD = [0x5a3420, 0x7f4c2e, 0xa86e42, 0xc9935e];
const GOLD = [0xa8682a, 0xe8a83a, 0xffd860, 0xfff4b0];
const BERRY = [0xa3203c, 0xe63a52, 0xff7e8a, 0xffd0d0];
const SNOW = [0xa8c0dc, 0xd8e6f4, 0xf4f8ff, 0xffffff];
const APPLE = [0x9a1c2c, 0xe03a3a, 0xff7a68, 0xffe0d0];
const DARK = [0x1c1a2a, 0x2e2c44, 0x4a4866, 0x6e6c90];
const eyes = (P, xs, y, h = 2) => { for (const x of xs) { P.rect(x, y, 2, h, EYE); P.set(x, y, 0xffffff); } };
const angry = (P, x0, x1, y) => { P.line(x0 - 1, y - 2, x0 + 2, y - 1, EYE); P.line(x1 + 3, y - 2, x1, y - 1, EYE); };

// ---------------- enemies ----------------
function slug(fr) { // なめくじ (strawberry fields)
  const P = new Pix(30, 18); P.ox = 1; P.oy = 2; const st = [0, 1, 2, 1][fr];
  const B = [0x9a8a4a, 0xd6c878, 0xf4eab0, 0xfffbe0];
  P.ball(13, 10, 11 + st * 0.6, 4.2 - st * 0.3, B, { t1: 0.5 });
  P.ball(21 + st * 0.6, 7.5, 4.4, 4, B);
  P.line(21 + st, 4, 20 + st, 0, B[0]); P.line(24 + st, 4, 25 + st, 0, B[0]); P.set(20 + st, -1, EYE); P.set(25 + st, -1, EYE);
  eyes(P, [20 + st, 23 + st], 6); P.set(22 + st, 9, 0x7a6a3a);
  for (let i = 0; i < 4; i++) P.set(5 + i * 4, 12, 0xfff6c8);
  return P.outline(0.55);
}
function carrot(fr) { // walking carrot (racecourse)
  const P = new Pix(20, 28); P.ox = 2; P.oy = 2; const lg = [1, 0, -1, 0][fr];
  const C = [0xb8501a, 0xf08a2a, 0xffb860, 0xffe0b0];
  P.line(6, 21, 5 - lg, 25, 0x6a3a1a); P.line(10, 21, 11 + lg, 25, 0x6a3a1a);
  P.poly([[2, 6], [14, 6], [9, 23], [7, 23]], (x, y) => x < 5 ? C[2] : x > 11 ? C[0] : (y % 4 === 0 && x > 6 ? C[0] : C[1]));
  for (const [a, b] of [[5, 6], [8, 6], [11, 6]]) P.poly([[a - 2, b], [a, -2 + (fr % 2)], [a + 2, b]], (x) => x < a ? LEAF[2] : LEAF[1]);
  eyes(P, [5, 9], 10); angry(P, 5, 9, 10); P.rect(7, 14, 2, 1, 0x6a2a10);
  return P.outline(0.55);
}
function monkey(fr) { // おさる (zoo)
  const P = new Pix(28, 28); P.ox = 2; P.oy = 2; const b = [0, -1, 0, -1][fr], arm = fr % 2;
  const F = [0x5a341e, 0x8a5430, 0xb07a4e, 0xd09a6a], S = [0xd8a080, 0xf4c8a8, 0xffe4d0];
  P.ball(12, 18 + b, 7, 6, F, { t1: 0.55 });
  P.line(5, 16 + b, 1, arm ? 9 : 19, F[1]); P.line(19, 16 + b, 23, arm ? 19 : 9, F[1]);
  P.ball(1, (arm ? 9 : 19), 1.6, 1.6, S); P.ball(23, (arm ? 19 : 9), 1.6, 1.6, S);
  P.line(18, 21 + b, 22, 24 + b, F[1]); P.line(22, 24 + b, 24, 21 + b, F[1]);
  P.ball(4.5, 7 + b, 3, 3, F); P.ball(19.5, 7 + b, 3, 3, F); P.set(4.5, 7 + b, S[1]); P.set(19.5, 7 + b, S[1]);
  P.ball(12, 8 + b, 7, 6.5, F, { t1: 0.55 });
  P.ball(12, 10 + b, 5, 4, S);
  eyes(P, [9, 13], 7 + b); P.set(12, 11 + b, 0x6a3a2a); P.rect(10, 12 + b, 4, 1, 0xa0503a); P.set(8, 10 + b, BLUSH); P.set(16, 10 + b, BLUSH);
  return P.outline(0.55);
}
function penguin(fr) { // ペンギン (zoo)
  const P = new Pix(24, 28); P.ox = 2; P.oy = 2; const tl = [-1, 0, 1, 0][fr];
  const B = [0x101828, 0x23304a, 0x3a4c6e, 0x5a6c90];
  P.ball(10 + tl * 0.5, 13, 8, 10, B, { t1: 0.55 });
  P.ell(10 + tl * 0.5, 15, 5.4, 7.4, (x, y, nx) => nx < -0.3 ? 0xe8eef6 : 0xffffff);
  P.poly([[2 + tl, 10], [-1 + tl, 17], [3 + tl, 16]], B[1]); P.poly([[18 + tl, 10], [21 + tl, 17], [17 + tl, 16]], B[1]);
  eyes(P, [7 + tl * 0.5, 11 + tl * 0.5], 7);
  P.poly([[9 + tl * 0.5, 9], [16 + tl * 0.5, 10.5], [9 + tl * 0.5, 12]], (x, y) => y < 10.5 ? 0xffb030 : 0xe08010);
  P.set(6, 11, BLUSH); P.set(14, 11, BLUSH);
  P.rect(5 + (fr === 1 ? 1 : 0), 22, 4, 2, 0xf09020); P.rect(11 - (fr === 3 ? 1 : 0), 22, 4, 2, 0xf09020);
  return P.outline(0.5);
}
function sball(fr) { // rolling snowball (snow)
  const P = new Pix(22, 22); P.ox = 1; P.oy = 1;
  P.ball(10, 10, 9, 9, SNOW, { t1: 0.55, t2: 0.9 });
  for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283 + fr * 0.6; P.set(10 + Math.cos(a) * 6, 10 + Math.sin(a) * 6, SNOW[0]); }
  eyes(P, [6, 12], 8); angry(P, 6, 12, 8); P.rect(8, 13, 4, 1, 0x5a6a8a);
  return P.outline(0.55);
}
function sman(fr) { // ゆきだるま (snow)
  const P = new Pix(28, 34); P.ox = 2; P.oy = 2; const w = [0, 1, 0, -1][fr];
  P.ball(12, 22, 9, 8, SNOW, { t1: 0.55 });
  P.ball(12, 10, 6.5, 6, SNOW, { t1: 0.55 });
  P.line(4, 18, -1, 14 - w * 2, WOOD[1]); P.line(20, 18, 25, 14 + w * 2, WOOD[1]);
  P.rect(6, 1, 12, 3, 0x3a5aa8); P.rect(8, -2, 8, 4, (x) => x < 10 ? 0x6a8ae0 : 0x4a6ac8);
  eyes(P, [9, 13], 8); P.poly([[12, 11], [17, 12], [12, 13]], 0xf08a2a);
  P.rect(5, 15, 14, 2, (x) => x % 3 ? 0xe63a52 : 0xffd0d0); P.rect(15, 17, 2, 4, 0xe63a52);
  for (const y of [20, 24]) P.set(12, y, DARK[1]);
  return P.outline(0.55);
}
function onpu(fr) { // grumpy music note (night)
  const P = new Pix(22, 28); P.ox = 2; P.oy = 2; const h = [0, -2, -3, -2][fr], sq = fr === 0 ? 1 : 0;
  const N = [0x7a1a4a, 0xd0408a, 0xff7eb6, 0xffc8e0];
  P.rect(14, 1 + h, 3, 17, (x) => x === 14 ? N[2] : N[1]);
  P.poly([[16, 1 + h], [20, 4 + h], [20, 8 + h], [17, 6 + h]], N[1]);
  P.ball(9, 19 + h + sq * 0.5, 7.5 + sq, 5.6 - sq * 0.6, N, { t1: 0.55 });
  eyes(P, [6, 10], 17 + h); angry(P, 6, 10, 17 + h); P.rect(7, 21 + h, 4, 1, 0xff6a8a);
  return P.outline(0.55);
}
function spk(fr) { // walking speaker (night)
  const P = new Pix(24, 28); P.ox = 2; P.oy = 1; const p = [0, 1, 0, 1][fr], lg = fr % 2;
  P.rect(5, 23, 3, 3 - lg, DARK[0]); P.rect(13, 23, 3, 2 + lg, DARK[0]);
  P.rect(1, 1, 19, 23, (x, y) => (x === 1 || y === 1) ? DARK[3] : (x === 19 || y === 23) ? DARK[0] : DARK[1]);
  P.ball(10.5, 16, 6 + p * 0.6, 6 + p * 0.6, [0x14121e, 0x3a3850, 0x5a5878]); P.ball(10.5, 16, 2.4, 2.4, [0x6a6890, 0x9a98c0, 0xd0d0f0]);
  P.ball(10.5, 6, 3, 3, [0x14121e, 0x3a3850, 0x5a5878]);
  for (const ex of [6, 13]) { P.rect(ex, 4, 2, 2, 0xffffff); P.set(ex + 1, 5, EYE); }
  P.line(5, 3, 8, 4, 0xff6a8a); P.line(16, 3, 13, 4, 0xff6a8a);
  return P.outline(0.45);
}

// ---------------- bosses ----------------
function bmole(fr) { // もぐら親分
  const P = new Pix(70, 62); P.ox = 3; P.oy = 3; const pop = [0, 2, 4, 2][fr], cl = [0, -2, 0, 2][fr];
  const M = [0x3e2e50, 0x6a5482, 0x9a84b4, 0xc6b4dc], D = [0x5a3a24, 0x86603e, 0xb08458, 0xcfa478];
  P.ball(32, 34 - pop, 22, 20, M, { t1: 0.55 });
  P.ell(32, 42 - pop, 13, 8, M[2]);
  P.ball(32, 31 - pop, 6, 4.4, [0xc04e6c, 0xff86a2, 0xffc6d4]);
  for (const ex of [22, 38]) { P.rect(ex, 23 - pop, 5, 3, EYE); P.rect(ex + 1, 22 - pop, 3, 1, EYE); }
  P.line(20, 36 - pop, 12, 33 - pop, 0x2a1e36); P.line(20, 38 - pop, 12, 39 - pop, 0x2a1e36); P.line(44, 36 - pop, 52, 33 - pop, 0x2a1e36); P.line(44, 38 - pop, 52, 39 - pop, 0x2a1e36);
  P.rect(26, 36 - pop, 12, 2, 0x2a1e36); P.set(30, 38 - pop, 0xffffff); P.set(33, 38 - pop, 0xffffff);
  // helmet + lamp
  P.ball(32, 14 - pop, 18, 9, GOLD, { t1: 0.55 }); P.rect(13, 16 - pop, 38, 3, GOLD[0]);
  P.ball(32, 9 - pop, 4, 4, [0xc8c8a0, 0xfffff0, 0xffffff]); P.rect(28, 12 - pop, 8, 2, 0x8a8a8a);
  for (const [cx, s] of [[8, -1], [56, 1]]) { P.ball(cx, 40 - pop + cl * s, 7, 5.4, [0xc8a898, 0xffe4d2, 0xffffff]); for (let k = -1; k <= 1; k++) P.line(cx + s * 5, 40 - pop + cl * s + k * 3, cx + s * 9, 40 - pop + cl * s + k * 4, 0xa88878); }
  P.ball(32, 52, 31, 8, D, { t1: 0.5 });
  for (const [x, y] of [[8, 52], [18, 56], [40, 55], [54, 52], [30, 57]]) P.ball(x, y, 2.2, 1.6, D);
  return P.outline(0.5);
}
function mokuba(fr) { // 暴れ木馬 (rocking horse)
  const P = new Pix(76, 64); P.ox = 3; P.oy = 3; const a = [-0.12, 0, 0.12, 0][fr];
  const rot = (x, y) => { const cx = 35, cy = 46, dx = x - cx, dy = y - cy; return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)]; };
  const R = pts => pts.map(([x, y]) => rot(x, y));
  const W = [0xa8562a, 0xd8803e, 0xf0a860, 0xffd8a0];
  // rocker
  for (let t = 0; t <= 1; t += 0.01) { const x = 4 + t * 62, y = 52 + Math.pow((t - 0.5) * 2, 2) * -6; const [rx, ry] = rot(x, y); P.rect(rx, ry, 2, 3, t < 0.5 ? WOOD[1] : WOOD[0]); }
  for (const lx of [16, 24, 46, 54]) P.poly(R([[lx, 34], [lx + 3, 34], [lx + 4 + (lx < 35 ? -3 : 3), 51], [lx + 1 + (lx < 35 ? -3 : 3), 51]]), W[1]);
  P.poly(R([[12, 24], [58, 24], [60, 38], [10, 38]]), (x, y) => y < 28 ? W[2] : y > 34 ? W[0] : W[1]);
  P.poly(R([[26, 22], [42, 22], [44, 30], [24, 30]]), (x, y) => (x + y) % 5 === 0 ? 0xffd860 : 0xd8304a); // saddle
  P.poly(R([[52, 26], [60, 6], [70, 4], [72, 12], [64, 16], [60, 30]]), (x, y) => x < 60 ? W[2] : W[1]); // neck+head
  P.poly(R([[56, 8], [60, 0], [62, 6]]), W[1]);
  for (let k = 0; k < 6; k++) { const [x, y] = rot(55 - k, 6 + k * 4); P.ball(x, y, 3, 2.4, [0x3a1a2a, 0x6a2a4a, 0xa04a7a]); } // mane
  const [ex, ey] = rot(64, 8); P.rect(ex, ey, 3, 3, 0xffffff); P.rect(ex + 1, ey + 1, 2, 2, EYE);
  const [bx, by] = rot(62, 6); P.line(bx - 3, by - 2, bx + 3, by, EYE);
  const [tx, ty] = rot(10, 26); P.poly([[tx, ty], [tx - 8, ty + 6], [tx - 4, ty + 12], [tx + 2, ty + 6]], 0x6a2a4a);
  return P.outline(0.5);
}
function zou(fr) { // ゾウさん
  const P = new Pix(78, 64); P.ox = 3; P.oy = 3; const tr = [0, -4, -8, -4][fr], st = [0, 1, 0, -1][fr];
  const E = [0x5e6478, 0x8c93aa, 0xb8bed2, 0xdfe3ee];
  for (const [lx, d] of [[14, st], [24, -st], [40, st], [50, -st]]) P.rect(lx, 40, 8, 16 + d, (x) => x === lx ? E[2] : x === lx + 7 ? E[0] : E[1]);
  P.ball(32, 32, 26, 18, E, { t1: 0.55 });
  P.ball(56, 22, 13, 13, E, { t1: 0.55 });
  P.ball(48, 22, 9, 12, [0x8c7a98, 0xd8a8c0, 0xf4d0e0]); // ear
  // trunk
  for (let k = 0; k < 14; k++) { const t = k / 13, x = 66 + t * 6, y = 24 + t * 18 + tr * t * t * 2.2; P.ball(x, y, 3.6 - t * 1.2, 3.6 - t * 1.2, E); }
  P.rect(60, 14, 3, 4, EYE); P.set(60, 14, 0xffffff); P.set(63, 22, 0xff9fb0); P.set(64, 22, 0xff9fb0);
  P.poly([[64, 30], [70, 30], [66, 34]], 0xffffff); // tusk
  P.line(5, 28, 1, 36, E[0]); P.ball(1, 37, 1.6, 1.6, [0x3a3a4a, 0x5a5a6a, 0x7a7a8a]);
  P.poly([[50, 6], [62, 6], [58, -2]], (x) => x < 56 ? 0xff7eb6 : 0xe05a96); P.ball(58, -2, 1.8, 1.8, GOLD); // party hat
  return P.outline(0.5);
}
function bigsnow(fr) { // ゆきだるま大王
  const P = new Pix(66, 80); P.ox = 4; P.oy = 4; const w = [0, 3, 0, -3][fr], b = [0, -1, 0, -1][fr];
  P.ball(29, 54 + b, 24, 20, SNOW, { t1: 0.55 });
  P.ball(29, 25 + b, 16, 14, SNOW, { t1: 0.55 });
  P.line(8, 46, -3, 34 - w, WOOD[1]); P.line(-3, 34 - w, -4, 30 - w, WOOD[1]); P.line(50, 46, 61, 34 + w, WOOD[1]); P.line(61, 34 + w, 62, 30 + w, WOOD[1]);
  // crown
  P.poly([[16, 14 + b], [16, 2 + b], [22, 8 + b], [29, -2 + b], [36, 8 + b], [42, 2 + b], [42, 14 + b]], (x, y) => y > 11 + b ? GOLD[0] : x < 24 ? GOLD[2] : GOLD[1]);
  P.ball(29, 9 + b, 2.2, 2.2, [0x1e5ab8, 0x4a8aff, 0xc0e0ff]);
  for (const ex of [22, 33]) { P.rect(ex, 22 + b, 4, 4, EYE); P.set(ex, 22 + b, 0xffffff); }
  P.line(20, 19 + b, 26, 21 + b, EYE); P.line(39, 19 + b, 33, 21 + b, EYE);
  P.poly([[28, 27 + b], [40, 30 + b], [28, 31 + b]], 0xf08a2a);
  P.rect(24, 34 + b, 10, 2, 0x5a6a8a);
  P.rect(12, 38 + b, 34, 5, (x) => x % 4 < 2 ? 0x3ab85a : 0x7ee88a); P.rect(36, 42 + b, 5, 10, 0x3ab85a);
  for (const y of [50, 58, 66]) P.ball(29, y + b, 2.2, 2.2, [0x14121e, 0x3a3850, 0x5a5878]);
  return P.outline(0.5);
}
function bigspk(fr) { // ハウリング大スピーカー
  const P = new Pix(66, 76); P.ox = 3; P.oy = 3; const p = [0, 1, 2, 1][fr];
  P.rect(14, 64, 8, 6, DARK[0]); P.rect(38, 64, 8, 6, DARK[0]);
  P.rect(2, 2, 56, 64, (x, y) => (x === 2 || y === 2) ? DARK[3] : (x === 57 || y === 65) ? DARK[0] : ((x + y) % 7 === 0 ? DARK[2] : DARK[1]));
  P.rect(5, 5, 50, 4, 0x6a2ea0);
  for (const [cy, r] of [[44, 17], [19, 9]]) {
    P.ball(30, cy, r + p * 0.6, r + p * 0.6, [0x0e0c16, 0x2a2840, 0x4a4868]);
    P.ball(30, cy, r * 0.45, r * 0.45, [0x5a5888, 0x8a88c0, 0xd0d0ff]);
  }
  for (const ex of [17, 38]) { P.rect(ex, 39, 5, 6, 0xffffff); P.rect(ex + 2, 41, 3, 4, EYE); }
  P.line(14, 35, 22, 38, 0xff4a7a); P.line(46, 35, 38, 38, 0xff4a7a);
  P.rect(24, 54, 12, 3, 0xff4a7a); P.set(26, 54, 0xffffff); P.set(32, 54, 0xffffff);
  for (let i = 0; i < 6; i++) P.set(8 + i * 9, 61, [0xff6fb0, 0x6ec3ff, 0xffd94a, 0x7ee87a, 0xc79bff, 0xff6fb0][i]);
  return P.outline(0.45);
}

// ---------------- props ----------------
function zfence() { // zoo enclosure fence with a green top
  const P = new Pix(44, 26); P.ox = 0; P.oy = 1;
  for (let x = 1; x < 44; x += 5) P.rect(x, 4, 2, 20, (X) => X === x ? 0xc8d0d8 : 0x8a94a0);
  P.rect(0, 3, 44, 3, (x, y) => y === 3 ? 0x8ee09a : 0x3a9a4a); P.rect(0, 20, 44, 2, 0x5a6470);
  return P.outline(0.6);
}
function zsign(v) { // animal sign
  const P = new Pix(28, 34); P.ox = 1; P.oy = 1;
  P.rect(12, 16, 3, 16, (x) => x === 12 ? WOOD[2] : WOOD[0]);
  P.rect(0, 2, 26, 15, (x, y) => (y === 2) ? 0x8ee09a : (y === 16 || x === 25) ? 0x2a7a3a : 0x4ab85a);
  const c = [0x8c93aa, 0xf0a860, 0x23304a][v % 3];
  P.ball(13, 9.5, 5, 4.5, [mixc(c, 0, 0.3), c, mixc(c, 0xffffff, 0.4)]); P.rect(11, 8, 1, 1, EYE); P.rect(15, 8, 1, 1, EYE);
  if (v % 3 === 0) P.line(18, 10, 21, 14, c); if (v % 3 === 2) P.ell(13, 11, 2.6, 2.4, 0xffffff);
  return P.outline(0.6);
}
function bench() {
  const P = new Pix(40, 22); P.ox = 1; P.oy = 1;
  for (const x of [4, 32]) P.rect(x, 10, 2, 10, 0x4a4e64);
  for (const y of [2, 6]) P.rect(0, y, 38, 3, (x, Y) => Y === y ? WOOD[3] : (x % 9 === 0 ? WOOD[0] : WOOD[2]));
  P.rect(0, 11, 38, 3, (x, Y) => Y === 11 ? WOOD[3] : WOOD[1]);
  return P.outline(0.6);
}
function balloon(fr) {
  const P = new Pix(26, 46); P.ox = 1; P.oy = 1;
  const cols = [0xff7eb6, 0x6ec3ff, 0xffd94a];
  P.line(12, 44, 12 + (fr ? 1 : -1), 20, 0xd8d8e8);
  cols.forEach((c, i) => { const x = 6 + i * 6 + (fr ? 0.5 : -0.5) * (i - 1), y = 9 + (i % 2) * 4; P.line(12, 22, x, y + 6, 0xd8d8e8); P.ball(x, y, 5, 6, [mixc(c, 0, 0.3), c, mixc(c, 0xffffff, 0.45), 0xffffff], { t2: 0.9 }); });
  return P.outline(0.6);
}
function giraffe() { // friendly statue-like giraffe behind a fence
  const P = new Pix(44, 78); P.ox = 2; P.oy = 2;
  const G = [0xc08a30, 0xf0c050, 0xffe08a], S = 0x8a5a1a;
  for (const lx of [8, 14, 26, 32]) P.rect(lx, 54, 3, 20, (x) => x === lx ? G[2] : G[0]);
  P.ball(20, 50, 15, 9, G, { t1: 0.55 });
  P.poly([[26, 46], [30, 8], [36, 8], [34, 48]], (x) => x < 31 ? G[2] : G[1]);
  P.ball(35, 7, 7, 5, G); P.rect(32, -1, 2, 4, S); P.rect(37, -1, 2, 4, S);
  P.rect(36, 5, 2, 2, EYE); P.set(36, 5, 0xffffff); P.set(40, 9, BLUSH);
  const r = mulberry(4); for (let i = 0; i < 26; i++) { const x = 8 + r() * 30, y = 10 + r() * 50; if (P.get(x, y) === G[1] || P.get(x, y) === G[2]) P.ball(x, y, 1.8, 1.6, [S, 0xa86a2a, 0xa86a2a]); }
  P.line(5, 48, 1, 58, G[0]);
  return P.outline(0.55);
}
function pine(v) { // snowy pine
  const P = new Pix(46, 72); P.ox = 1; P.oy = 1; const r = mulberry(v * 9 + 4);
  P.rect(20, 58, 5, 12, (x) => x === 20 ? WOOD[2] : WOOD[0]);
  const T = [0x1e4a3a, 0x2e6a4a, 0x448a5a, 0x6aac72];
  for (let k = 0; k < 4; k++) { const y = 8 + k * 13, w = 9 + k * 5; P.poly([[22.5, y - 8], [22.5 + w, y + 10], [22.5 - w, y + 10]], (x, Y) => x < 22 ? T[2] : T[1]); P.poly([[22.5, y - 8], [22.5 + w * 0.55, y + 2], [22.5 - w * 0.8, y + 4]], (x, Y) => Y < y - 3 ? SNOW[3] : SNOW[2]); }
  for (let i = 0; i < 20; i++) { const x = 8 + r() * 30, y = 6 + r() * 56; if (P.get(x, y) >= 0) P.set(x, y, SNOW[3]); }
  if (v) P.ball(22.5, -1, 2, 2, GOLD);
  return P.outline(0.55);
}
function kamakura() { // snow hut
  const P = new Pix(54, 40); P.ox = 1; P.oy = 1;
  P.ball(26, 26, 25, 22, SNOW, { t1: 0.5, clip: (x, y) => y < 37 });
  P.ell(28, 29, 8, 9, (x, y) => y < 22 ? 0x2a2440 : 0x3a2e50);
  P.ell(28, 33, 5, 3, 0xffb84a); P.ell(28, 33, 2.4, 1.6, 0xfff0b0);
  return P.outline(0.55);
}
function srock() { const P = new Pix(28, 18); P.ox = 1; P.oy = 1; P.ball(12, 11, 11, 6, [0x5f6378, 0x8d93aa, 0xbcc2d4]); P.ell(12, 6, 10, 3.4, (x, y, nx) => nx < -0.2 ? SNOW[3] : SNOW[2]); return P.outline(0.6); }
function lantern() { // stone lantern with snow cap
  const P = new Pix(22, 40); P.ox = 1; P.oy = 1; const S = [0x6a6e80, 0x9aa0b4, 0xc8ccd8];
  P.rect(8, 26, 4, 12, (x) => x === 8 ? S[2] : S[0]); P.rect(4, 35, 12, 3, S[1]);
  P.rect(5, 15, 10, 9, (x) => x === 5 ? S[2] : x === 14 ? S[0] : S[1]); P.rect(7, 17, 6, 5, 0xffc860); P.rect(8, 18, 4, 3, 0xfff0b0);
  P.poly([[0, 15], [10, 6], [20, 15]], (x) => x < 10 ? S[2] : S[1]); P.poly([[1, 13], [10, 4], [19, 13], [15, 11], [10, 8], [5, 11]], SNOW[3]);
  P.rect(4, 24, 12, 2, S[1]);
  return P.outline(0.6);
}
function stuft(v) { const P = new Pix(14, 8); const r = mulberry(v + 31); for (let i = 0; i < 6; i++) { const x = 2 + r() * 10; P.line(x, 7, x + (r() - 0.5) * 2, 4 - r() * 2, r() < 0.5 ? 0x7a8a6a : 0x5a6a52); } P.rect(1, 6, 12, 2, SNOW[2]); return P.outline(0.7); }
function stlight() { // stage light tower
  const P = new Pix(30, 74); P.ox = 1; P.oy = 1;
  P.rect(13, 18, 3, 52, (x) => x === 13 ? 0x8a90a8 : 0x4a4e64); P.rect(5, 68, 19, 3, 0x3a3e54);
  for (let y = 22; y < 66; y += 8) P.line(13, y, 16, y + 4, 0x6a7088);
  P.rect(2, 10, 25, 5, 0x3a3e54);
  for (const [x, c] of [[5, 0xff6fb0], [14, 0x6ec3ff], [23, 0xffd94a]]) { P.ball(x, 7, 3.6, 3.6, [0x2a2a3a, 0x4a4a5a, 0x6a6a7a]); P.ball(x, 7.5, 2.2, 2.2, [c, mixc(c, 0xffffff, 0.5), 0xffffff]); }
  return P.outline(0.5);
}
function amp() { // speaker stack (prop, friendly)
  const P = new Pix(30, 38); P.ox = 1; P.oy = 1;
  for (const y0 of [0, 18]) { P.rect(0, y0, 28, 17, (x, y) => (x === 0 || y === y0) ? DARK[3] : (x === 27 || y === y0 + 16) ? DARK[0] : DARK[1]); P.ball(9, y0 + 8.5, 5, 5, [0x0e0c16, 0x2a2840, 0x4a4868]); P.ball(20, y0 + 8.5, 5, 5, [0x0e0c16, 0x2a2840, 0x4a4868]); P.ball(9, y0 + 8.5, 1.8, 1.8, DARK); P.ball(20, y0 + 8.5, 1.8, 1.8, DARK); }
  P.rect(3, 2, 6, 1, 0x7ee87a);
  return P.outline(0.45);
}
function mstand() { // microphone stand
  const P = new Pix(18, 50); P.ox = 1; P.oy = 1;
  P.rect(7, 10, 2, 36, (x) => x === 7 ? 0xb8c0d4 : 0x6a7088); P.poly([[1, 48], [8, 42], [15, 48]], 0x4a4e64);
  P.ball(8, 6, 3.4, 4.4, [0x5a5a6a, 0x9a9aaa, 0xd8d8e8]); P.rect(6, 9, 5, 2, 0x2a2a3a);
  return P.outline(0.5);
}
function bstar(v) { // glow tape star on the stage floor
  const P = new Pix(14, 10); const c = [0xffd94a, 0xff7eb6, 0x6ec3ff][v % 3];
  for (const [x, y] of [[6, 0], [5, 1], [6, 1], [7, 1], [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [3, 6], [4, 6], [8, 6], [9, 6], [2, 7], [3, 7], [9, 7], [10, 7]]) P.set(x, y + 1, c);
  return P;
}

// ---------------- weapons, items, icons ----------------
function mic() { const P = new Pix(16, 28); P.ox = 1; P.oy = 1; P.rect(5, 11, 4, 14, (x) => x === 5 ? 0x8a8aa0 : 0x3a3a4e); P.rect(4, 22, 6, 4, 0x7ee87a); P.ball(7, 6, 6, 6.4, [0x6a6a7a, 0xa8a8b8, 0xe0e0ee, 0xffffff], { t2: 0.85 }); for (let y = 2; y < 11; y += 2) P.line(2, y, 12, y, 0x7a7a8a); P.rect(2, 11, 10, 2, 0xff7eb6); return P.outline(0.6); }
function appleShot() { const P = new Pix(16, 17); P.ox = 1; P.oy = 2; P.ball(7, 8, 6.4, 6, APPLE, { t2: 0.84 }); P.rect(7, -1, 1, 3, WOOD[0]); P.poly([[8, 1], [13, -1], [11, 3]], LEAF[2]); return P.outline(0.6); }
function metro() { const P = new Pix(20, 26); P.ox = 1; P.oy = 1; P.poly([[3, 23], [7, 1], [11, 1], [15, 23]], (x) => x < 7 ? WOOD[3] : x > 11 ? WOOD[0] : WOOD[2]); P.rect(6, 12, 6, 7, 0xfff4e0); P.line(9, 20, 13, 3, 0xd8d8e8); P.rect(11, 7, 3, 2, GOLD[2]); P.rect(2, 22, 15, 3, WOOD[0]); return P.outline(0.6); }
function nodoame() { const P = new Pix(26, 16); P.ox = 1; P.oy = 1; P.poly([[0, 3], [5, 6], [5, 9], [0, 12]], 0xffd0e0); P.poly([[24, 3], [19, 6], [19, 9], [24, 12]], 0xffd0e0); P.ball(12, 7.5, 7.5, 5.5, [0xa8203c, 0xff7eb6, 0xffc0d8, 0xffffff], { t2: 0.82 }); P.line(8, 6, 15, 9, 0xffffff); return P.outline(0.6); }
function basket() { const P = new Pix(26, 22); P.ox = 1; P.oy = 1; for (let i = 0; i < 4; i++) P.ball(5 + i * 5, 7 - (i % 2), 3.4, 3.2, APPLE); P.poly([[0, 8], [24, 8], [21, 20], [3, 20]], (x, y) => ((x + y) % 4 < 2) ? WOOD[2] : WOOD[1]); P.line(0, 8, 24, 8, WOOD[3]); P.line(3, 8, 12, 0, WOOD[0]); P.line(12, 0, 21, 8, WOOD[0]); return P.outline(0.6); }
function fever() { const P = new Pix(30, 28); P.ox = 1; P.oy = 1; P.ball(14, 17, 11, 8, [0xa31c34, 0xe63a52, 0xff7e8a, 0xffd0d0]); P.ell(14, 12, 11, 4, (x, y, nx) => nx < -0.3 ? 0xffffff : 0xe8e4ee); P.line(4, 2, 12, 11, WOOD[2]); P.line(24, 2, 16, 11, WOOD[2]); for (const [x, y] of [[2, 10], [27, 8], [14, 1]]) { P.set(x, y, GOLD[3]); P.set(x - 1, y, GOLD[2]); P.set(x + 1, y, GOLD[2]); P.set(x, y - 1, GOLD[2]); P.set(x, y + 1, GOLD[2]); } return P.outline(0.6); }
function encore() { const P = mic(); for (const [x, y, c] of [[1, 2, 0xff6fb0], [13, 1, 0x6ec3ff], [14, 14, 0xffd94a]]) { P.set(x, y, c); P.set(x + 1, y, c); P.set(x, y + 1, c); } return P; }
function tornado() { const P = new Pix(30, 30); P.ox = 1; P.oy = 1; for (let k = 0; k < 36; k++) { const a = k * 0.5, r = 2 + k * 0.33; P.set(14 + Math.cos(a) * r, 14 + Math.sin(a) * r * 0.8, k % 3 ? 0xd8e8ff : 0xffffff); } for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; P.ball(14 + Math.cos(a) * 10, 14 + Math.sin(a) * 8, 3, 3, APPLE); } return P.outline(0.6); }
function magI() { const P = new Pix(20, 20); P.ox = 1; P.oy = 1; P.ball(9, 8, 8, 8, [0xa31c34, 0xe63a52, 0xff7e8a], { clip: (x, y) => y < 11 }); P.ell(9, 8, 4, 4, -2); for (let y = 0; y < 11; y++) for (let x = 5; x < 14; x++) if (Math.hypot(x + 0.5 - 9, y + 0.5 - 8) < 4) P.del(x, y); P.rect(1, 10, 5, 6, (x, y) => y > 13 ? 0xe8e8f0 : 0xe63a52); P.rect(12, 10, 5, 6, (x, y) => y > 13 ? 0xe8e8f0 : 0xe63a52); return P.outline(0.6); }
function bombI() { const P = new Pix(20, 21); P.ox = 1; P.oy = 2; P.ball(8, 11, 7.5, 7.5, [0x14121e, 0x2e2c44, 0x5a5878, 0xd0d0ff], { t2: 0.9 }); P.rect(6, 2, 5, 3, 0x6a6a7a); P.line(9, 2, 13, -1, 0xc8a46a); P.ball(14, -1.5, 1.8, 1.8, [0xff6a2a, 0xffd94a, 0xffffff]); return P.outline(0.6); }
function chest(open) {
  const P = new Pix(30, 28); P.ox = 1; P.oy = 3;
  P.rect(1, 11, 26, 13, (x, y) => (x === 1 || x === 26) ? WOOD[0] : (y === 23) ? WOOD[0] : ((x + y * 3) % 9 === 0 ? WOOD[1] : WOOD[2]));
  P.rect(1, 15, 26, 2, GOLD[1]); P.rect(12, 13, 4, 6, GOLD[2]); P.set(13, 16, EYE); P.set(14, 16, EYE);
  if (open) { P.poly([[1, 11], [3, -1], [25, -1], [27, 11]], (x, y) => y < 2 ? WOOD[3] : WOOD[1]); P.rect(3, 6, 22, 5, 0xfff4b0); for (const [x, y] of [[6, 4], [14, 2], [21, 5]]) P.ball(x, y, 2, 2, GOLD); }
  else P.ball(14, 9, 13.5, 6, [WOOD[0], WOOD[2], WOOD[3]], { clip: (x, y) => y < 11 }), P.rect(1, 9, 26, 2, GOLD[1]), P.rect(12, 6, 4, 4, GOLD[2]);
  return P.outline(0.55);
}
function clover() { const P = new Pix(20, 22); P.ox = 1; P.oy = 1; for (const [x, y] of [[5, 5], [12, 5], [5, 12], [12, 12]]) P.ball(x, y, 4.4, 4.4, LEAF, { t1: 0.5 }); P.line(9, 10, 13, 20, LEAF[0]); return P.outline(0.6); }
function crown() { const P = new Pix(26, 18); P.ox = 1; P.oy = 1; P.poly([[1, 15], [1, 3], [7, 9], [12, 1], [17, 9], [23, 3], [23, 15]], (x, y) => y > 12 ? GOLD[0] : x < 9 ? GOLD[2] : GOLD[1]); P.ball(12, 11, 2, 2, BERRY); P.ball(5, 12, 1.4, 1.4, [0x1e5ab8, 0x4a8aff, 0xc0e0ff]); P.ball(19, 12, 1.4, 1.4, [0x2a8a3a, 0x5ac86a, 0xc0ffc8]); return P.outline(0.6); }
function drop() { const P = new Pix(10, 12); P.ox = 1; P.oy = 1; P.poly([[4, 0], [8, 6], [4, 10], [0, 6]], 0x6ec3ff); P.ball(4, 6.5, 3.6, 3.4, [0x2a7ac8, 0x6ec3ff, 0xd8f0ff]); return P.outline(0.6); }
function sbul() { const P = new Pix(12, 12); P.ox = 1; P.oy = 1; P.ball(5, 5, 4.6, 4.6, SNOW, { t2: 0.85 }); return P.outline(0.6); }
function flake() { const P = new Pix(7, 7); for (const [x, y] of [[3, 0], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6], [0, 3], [1, 3], [2, 3], [4, 3], [5, 3], [6, 3], [1, 1], [5, 5], [5, 1], [1, 5]]) P.set(x, y, 0xffffff); return P; }

export function addPhase2(add) {
  for (let i = 0; i < 4; i++) {
    add('slug' + i, slug(i)); add('carrot' + i, carrot(i)); add('monkey' + i, monkey(i)); add('peng' + i, penguin(i));
    add('sball' + i, sball(i)); add('sman' + i, sman(i)); add('onpu' + i, onpu(i)); add('spk' + i, spk(i));
    add('bmole' + i, bmole(i)); add('mokuba' + i, mokuba(i)); add('zou' + i, zou(i)); add('bigsnow' + i, bigsnow(i)); add('bigspk' + i, bigspk(i));
  }
  add('zfence', zfence()); for (let i = 0; i < 3; i++) add('zsign' + i, zsign(i)); add('bench', bench()); add('balloon0', balloon(0)); add('balloon1', balloon(1)); add('giraffe', giraffe());
  add('pine0', pine(0)); add('pine1', pine(1)); add('kamakura', kamakura()); add('srock', srock()); add('lantern', lantern()); add('stuft0', stuft(0)); add('stuft1', stuft(1));
  add('stlight', stlight()); add('amp', amp()); add('mstand', mstand()); for (let i = 0; i < 3; i++) add('bstar' + i, bstar(i));
  add('mic', mic()); add('apple', appleShot()); add('metro', metro()); add('nodoame', nodoame()); add('basket', basket()); add('fever', fever()); add('encore', encore()); add('tornado', tornado());
  add('magI', magI()); add('bombI', bombI()); add('chest', chest(false)); add('chestO', chest(true)); add('clover', clover()); add('crown', crown());
  add('drop', drop()); add('sbul', sbul()); add('flake', flake());
}

// ---------------- ground textures (seamless 256x256) ----------------
const N = 256;
const vnoise = (r, g) => { const G = []; for (let i = 0; i < g * g; i++) G.push(r()); return (x, y, s) => { const gx = x / N * s, gy = y / N * s, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0; const v = (a, b) => G[((a % s + s) % s) * g + ((b % s + s) % s)]; const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy); return (v(x0, y0) * (1 - sx) + v(x0 + 1, y0) * sx) * (1 - sy) + (v(x0, y0 + 1) * (1 - sx) + v(x0 + 1, y0 + 1) * sx) * sy; }; };
const dith = (x, y) => BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5;
export function zooGround() { // grass with a brick promenade
  const P = new Pix(N, N), r = mulberry(5150), vn = vnoise(r, 32);
  const G = [0x3a7e3a, 0x4a9244, 0x5aa64e, 0x6cb85a, 0x84c868];
  const B = [0xc89a6a, 0xdcb080, 0xe8c494, 0xb4865a];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const n = vn(x, y, 4) * 0.6 + vn(x, y, 16) * 0.4 + dith(x, y) * 0.14;
    let c = G[Math.max(0, Math.min(4, Math.floor(n * 5)))];
    const py = (y + 256) % 256;
    if (py >= 96 && py < 160) { // bricks
      const row = Math.floor((py - 96) / 8), bx = (x + (row % 2) * 8) % 16, by = (py - 96) % 8;
      c = (bx === 0 || by === 0) ? B[3] : B[(Math.floor((x + row * 8) / 16) + row) % 3];
      if (py === 96 || py === 159) c = 0x7a5a3a;
    }
    P.set(x, y, c);
  }
  for (let i = 0; i < 700; i++) { const x = (r() * N) | 0, y = (r() * N) | 0; if (y >= 94 && y < 162) continue; P.set(x, y, r() < 0.5 ? G[0] : G[4]); P.set(x, (y + 255) % N, G[3]); }
  for (let i = 0; i < 60; i++) { const x = (r() * N) | 0, y = (r() * N) | 0; if (y >= 94 && y < 162) continue; const c = [0xffffff, 0xffd84a, 0xffa3c8][i % 3]; P.set(x, y, c); P.set((x + 1) % N, y, c); }
  return P.toCanvas();
}
export function snowGround() {
  const P = new Pix(N, N), r = mulberry(8080), vn = vnoise(r, 32);
  const S = [0xa4b6d4, 0xb4c4de, 0xc2d0e6, 0xd0dcee, 0xdee8f6];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const n = vn(x, y, 4) * 0.55 + vn(x, y, 8) * 0.3 + vn(x, y, 32) * 0.15 + dith(x, y) * 0.12; P.set(x, y, S[Math.max(0, Math.min(4, Math.floor(n * 5)))]); }
  for (let i = 0; i < 40; i++) { // footprints
    let x = r() * N, y = r() * N; const a = r() * 6.28;
    for (let k = 0; k < 5; k++) { x += Math.cos(a) * 9; y += Math.sin(a) * 9; const s = k % 2 ? 3 : -3; for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) P.set(((x + dx - Math.sin(a) * s) % N + N) % N, ((y + dy + Math.cos(a) * s) % N + N) % N, 0xb4c4de); }
  }
  for (let i = 0; i < 260; i++) { const x = (r() * N) | 0, y = (r() * N) | 0; P.set(x, y, r() < 0.7 ? 0xffffff : 0xa8bcd8); }
  return P.toCanvas();
}
export function nightGround() { // dark stage floor (boards + tape marks)
  const P = new Pix(N, N), r = mulberry(2525);
  const W = [0x2e2442, 0x382c50, 0x40325a, 0x4a3a66];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const board = Math.floor(y / 16), off = (board * 37) % 64, seam = ((x + off) % 64 === 0) || (y % 16 === 0);
    let c = seam ? 0x140e20 : W[(board + Math.floor((x + off) / 64)) % 4];
    if (!seam && ((x * 13 + y * 7 + board) % 23 === 0)) c = mixc(c, 0x000000, 0.25);
    if (!seam && r() < 0.03) c = mixc(c, 0x6a5a8a, 0.25);
    P.set(x, y, c);
  }
  for (let i = 0; i < 6; i++) { const x = (r() * (N - 12)) | 0, y = (r() * (N - 12)) | 0, c = [0x7ee87a, 0xff7eb6, 0xffd94a][i % 3]; for (let k = 0; k < 9; k++) { P.set(x + k, y + k, c); P.set(x + 8 - k, y + k, c); } } // tape X marks
  return P.toCanvas();
}
