// Phase 4 pixel art: 花のチャペル (garden wedding stage) with its foes, boss and props, the ring-shaped cake treasure,
// beef / home-cooking / tapioca pickups, the サイリウム weapon. Drawn in code like art.js.
import { Pix, mixc } from './art.js';

const EYE = 0x1a1626, BLUSH = 0xff9fb0;
const LEAF = [0x2b6a35, 0x45964a, 0x6cc05a, 0xa9e27c];
const GOLD = [0xa8682a, 0xe8a83a, 0xffd860, 0xfff4b0];
const WHT = [0xc8c4d8, 0xece8f4, 0xffffff, 0xffffff];
const PINK = [0xc04a80, 0xff7eb6, 0xffb8d8, 0xffe8f4];
const SKY = [0x4a8ac8, 0x7ec0f0, 0xb8e4ff, 0xe8f8ff];
const N = 256;
const eyes = (P, xs, y, h = 2) => { for (const x of xs) { P.rect(x, y, 2, h, EYE); P.set(x, y, 0xffffff); } };
const angry = (P, x0, x1, y) => { P.line(x0 - 1, y - 2, x0 + 2, y - 1, EYE); P.line(x1 + 3, y - 2, x1, y - 1, EYE); };
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- ground: garden lawn with a white stone aisle and petals ----------
export function gardenGround() {
  const P = new Pix(N, N), r = mulberry(4242);
  const G = [0x5aa458, 0x66b262, 0x72be6c, 0x80c878];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let c = G[((x * 7 + y * 13 + ((x >> 3) * 5) + ((y >> 3) * 3)) % 9) < 3 ? 0 : ((x ^ y) & 7) < 3 ? 2 : 1];
    const aisle = x >= 96 && x < 160; // the stone path runs north-south
    if (aisle) { const tx = (x - 96) % 32, ty = (y + ((x - 96) >> 5) * 16) % 32; c = tx === 0 || ty === 0 ? 0xb8b0c4 : ((tx + ty) % 9 ? 0xf0ecf4 : 0xe4dcec); }
    if (!aisle && r() < 0.012) c = G[3];
    P.set(x, y, c);
  }
  for (let i = 0; i < 90; i++) { const x = (r() * N) | 0, y = (r() * N) | 0, c = [0xffb8d8, 0xffffff, 0xffe080, 0xff8fc0][i % 4]; P.set(x, y, c); if (i % 3 === 0) P.set(x + 1, y, mixc(c, 0xffffff, 0.4)); }
  return P.toCanvas();
}

// ---------- props ----------
function arch() { // flower arch over the aisle
  const P = new Pix(46, 50); P.ox = 1; P.oy = 1;
  for (const x of [3, 39]) P.rect(x, 14, 3, 34, (X) => X === x ? 0xffffff : 0xd8d0e4);
  for (let i = 0; i <= 40; i++) { const a = Math.PI * (i / 40), x = 21 + Math.cos(a) * 18, y = 18 - Math.sin(a) * 14; P.ball(x, y, 2.4, 2.4, WHT); }
  for (let i = 0; i < 26; i++) { const a = Math.PI * (i / 25), x = 21 + Math.cos(a) * 18, y = 18 - Math.sin(a) * 14; P.ball(x + Math.sin(i) * 1.5, y, 2, 2, i % 3 ? PINK : [0xa8682a, 0xffd860, 0xfff4b0, 0xffffff]); if (i % 2) P.set(x + 2, y + 2, LEAF[2]); }
  for (const x of [4, 40]) for (let y = 20; y < 46; y += 5) { P.ball(x, y, 2, 1.6, PINK); P.set(x + 2, y + 1, LEAF[1]); }
  return P.outline(0.6);
}
function chair() { // white garden chair with a bow
  const P = new Pix(18, 26); P.ox = 1; P.oy = 1;
  P.rect(2, 1, 12, 11, (x, y) => (x === 2 || x === 13 || y === 1) ? 0xffffff : (x % 3 === 0 ? 0xe8e4f0 : -1));
  P.rect(1, 12, 14, 3, (x, y) => y === 12 ? 0xffffff : 0xd8d0e4);
  for (const x of [2, 13]) P.rect(x, 15, 2, 9, (X) => X === x ? 0xf4f2fa : 0xc8c0d4);
  P.ball(8, 5, 2.6, 1.8, PINK); P.ball(8, 5, 0.9, 0.9, [0xc04a80, 0xc04a80, 0xc04a80, 0xc04a80]);
  return P.outline(0.6);
}
function fpot() { // flower pot
  const P = new Pix(18, 22); P.ox = 1; P.oy = 1;
  for (const [x, y, c] of [[5, 5, PINK], [10, 3, [0xa8682a, 0xffd860, 0xfff4b0, 0xffffff]], [13, 7, SKY], [8, 8, PINK]]) P.ball(x, y, 2.6, 2.4, c);
  P.rect(3, 9, 11, 2, LEAF[1]); P.poly([[3, 11], [14, 11], [12, 20], [5, 20]], (x) => x < 7 ? 0xffffff : 0xe4dcec);
  return P.outline(0.55);
}
function hedge(v) {
  const P = new Pix(30, 22); P.ox = 1; P.oy = 1;
  P.ball(14, 12, 13, 9, [0x2b6a35, 0x45964a, 0x6cc05a, 0xa9e27c], { t1: 0.5 });
  for (let i = 0; i < 6; i++) P.ball(5 + i * 4, 7 + (i % 2) * 6, 1.4, 1.4, v ? SKY : PINK);
  return P.outline(0.6);
}
function petals(v) { const P = new Pix(10, 6); const c = [0xffb8d8, 0xffffff, 0xff8fc0][v]; for (const [x, y] of [[1, 2], [4, 1], [7, 3], [3, 4]]) { P.set(x, y, c); P.set(x + 1, y, mixc(c, 0xffffff, 0.5)); } return P; }
function bellpost() { // little bell tower
  const P = new Pix(22, 46); P.ox = 1; P.oy = 1;
  P.rect(5, 12, 10, 32, (x, y) => x === 5 ? 0xffffff : x === 14 ? 0xc8c0d4 : (y % 8 === 0 ? 0xd8d0e4 : 0xece8f4));
  P.poly([[3, 12], [10, 1], [17, 12]], (x) => x < 10 ? 0xff9ec8 : 0xd86a9a);
  P.ball(10, 18, 3, 3, GOLD); P.rect(8, 30, 5, 8, 0x8a5a7a);
  return P.outline(0.6);
}

// ---------- foes ----------
function tulip(fr) { // angry tulip that hops
  const P = new Pix(22, 28); P.ox = 2; P.oy = 2; const h = [0, -2, -3, -1][fr];
  P.rect(9, 15 + h, 2, 9, LEAF[1]); P.ell(5, 19 + h, 4, 2, () => LEAF[2]); P.ell(15, 20 + h, 4, 2, () => LEAF[1]);
  P.poly([[2, 4 + h], [6, 8 + h], [9, 2 + h], [12, 8 + h], [16, 4 + h], [16, 12 + h], [9, 17 + h], [2, 12 + h]], (x) => x < 6 ? 0xff9ec8 : x > 12 ? 0xc0306a : 0xff5a9a);
  eyes(P, [6, 11], 9 + h); angry(P, 6, 11, 9 + h); P.set(9, 13 + h, 0x7a1030);
  return P.outline(0.55);
}
function heartb(fr) { // floating heart balloon
  const P = new Pix(20, 30); P.ox = 1; P.oy = 1; const b = [0, -1, 0, 1][fr];
  const H = [0xa8204a, 0xe8396a, 0xff7ea0, 0xffd0e0];
  P.ball(5.5, 6 + b, 5, 5, H); P.ball(12.5, 6 + b, 5, 5, H); P.poly([[1, 8 + b], [17, 8 + b], [9, 17 + b]], H[1]);
  P.set(4, 4 + b, 0xffffff); P.set(5, 3 + b, 0xffffff);
  for (let y = 17; y < 28; y++) P.set(9 + Math.round(Math.sin(y * 0.8 + fr) * 1), y + b, 0xd8d0e4);
  eyes(P, [6, 11], 8 + b); angry(P, 6, 11, 8 + b);
  return P.outline(0.55);
}
function bouq(fr) { // runaway bouquet
  const P = new Pix(24, 28); P.ox = 2; P.oy = 2; const st = [0, 1, 0, -1][fr];
  P.poly([[7, 14], [15, 14], [12, 25], [10, 25]], (x) => x < 11 ? 0xffffff : 0xe4dcec);
  P.rect(8, 15, 6, 2, PINK[1]); P.set(7, 17, PINK[1]); P.set(14, 17, PINK[1]);
  for (const [x, y, c] of [[5, 7, PINK], [11, 4, WHT], [17, 7, SKY], [8, 11, WHT], [14, 11, PINK], [11, 9, [0xa8682a, 0xffd860, 0xfff4b0, 0xffffff]]]) P.ball(x, y, 3.2, 3, c);
  for (const [x, y] of [[3, 11], [19, 11], [2, 6]]) P.set(x, y, LEAF[2]);
  P.rect(9 - st, 25, 2, 2, 0x8a5a7a); P.rect(12 + st, 25, 2, 2, 0x8a5a7a);
  eyes(P, [8, 13], 7); angry(P, 8, 13, 7);
  return P.outline(0.55);
}
function bell(fr) { // 暴走ウェディングベル (boss)
  const P = new Pix(52, 56); P.ox = 2; P.oy = 2; const sw = [0, 2, 0, -2][fr];
  P.rect(22, 0, 6, 5, (x) => x === 22 ? GOLD[3] : GOLD[1]);
  P.poly([[16 + sw * 0.3, 6], [34 + sw * 0.3, 6], [42 + sw, 38], [46 + sw, 44], [4 + sw, 44], [8 + sw, 38]], (x, y) => { const e = (x - 4 - sw) / 42; return e < 0.2 ? GOLD[3] : e > 0.75 ? GOLD[0] : GOLD[2]; });
  P.rect(4 + sw, 42, 43, 4, (x, y) => y === 42 ? GOLD[3] : GOLD[1]);
  for (let x = 8; x < 44; x += 3) P.set(x + sw, 40, 0xffffff);
  P.ball(25 + sw * 1.4, 49, 4, 3.6, [0xa8682a, 0xe8a83a, 0xffd860, 0xfff4b0]); // clapper
  P.ball(18 + sw, 9, 5, 3, PINK); P.ball(32 + sw, 9, 5, 3, PINK); P.ball(25 + sw, 9, 2.4, 2.4, [0xc04a80, 0xc04a80, 0xff7eb6, 0xff7eb6]); // big bow
  eyes(P, [17 + sw, 30 + sw], 22, 3); angry(P, 17 + sw, 30 + sw, 22); P.rect(22 + sw, 31, 7, 2, 0x7a3a10); P.set(14 + sw, 28, BLUSH); P.set(36 + sw, 28, BLUSH);
  return P.outline(0.6);
}

// ---------- treasure + pickups ----------
function ringcake() { // a square ring-shaped cake: corner posts, three ribbon ropes, strawberries on the mat
  const P = new Pix(40, 34); P.ox = 1; P.oy = 1;
  P.poly([[2, 20], [36, 20], [37, 30], [1, 30]], (x, y) => y < 22 ? 0xffffff : y > 28 ? 0xd8a0b8 : ((x + y) % 6 ? 0xffe4ee : 0xffc8dc)); // sponge + cream base
  for (let x = 2; x < 37; x += 2) P.set(x, 22, 0xff7eb6);
  P.poly([[6, 12], [32, 12], [36, 20], [2, 20]], (x, y) => ((x + y * 2) % 7 ? 0xfff6fa : 0xffe0ec)); // mat (top icing)
  for (const [x, y] of [[13, 16], [19, 15], [25, 16], [16, 18], [22, 18]]) { P.ball(x, y, 1.6, 1.4, [0xa3203c, 0xe63a52, 0xff7e8a, 0xffd0d0]); P.set(x, y - 2, LEAF[2]); }
  for (const [x, y] of [[6, 12], [32, 12], [2, 20], [36, 20]]) P.rect(x - 1, y - 10, 3, 11, (X) => X === x - 1 ? GOLD[3] : GOLD[1]);
  for (let k = 0; k < 3; k++) { const dy = 4 + k * 3; P.line(6, 12 - dy, 32, 12 - dy, [0xff7eb6, 0xffffff, 0x7ec0f0][k]); P.line(2, 20 - dy, 6, 12 - dy, [0xff7eb6, 0xffffff, 0x7ec0f0][k]); P.line(36, 20 - dy, 32, 12 - dy, [0xff7eb6, 0xffffff, 0x7ec0f0][k]); P.line(2, 20 - dy, 36, 20 - dy, [0xff7eb6, 0xffffff, 0x7ec0f0][k]); }
  return P.outline(0.55);
}
function rbeef() { const P = new Pix(22, 16); P.ox = 1; P.oy = 1; P.rect(0, 11, 20, 3, (x, y) => y === 11 ? 0xffffff : 0xd8d0e4); for (let i = 0; i < 3; i++) P.ell(5 + i * 5, 7 + (i % 2), 4.2, 3.4, (x, y, nx, ny) => nx * nx + ny * ny > 0.6 ? 0x8a3a2a : (nx * nx + ny * ny > 0.25 ? 0xd85a6a : 0xff9aa8)); P.set(10, 3, LEAF[2]); P.set(11, 3, LEAF[1]); return P.outline(0.5); }
function steak() { const P = new Pix(24, 18); P.ox = 1; P.oy = 1; P.ell(11, 9, 11, 7, (x, y, nx, ny) => nx * nx + ny * ny > 0.75 ? 0x2a2a34 : 0x484856); P.ell(10, 8, 8, 5, (x, y, nx, ny) => nx * nx + ny * ny > 0.7 ? 0x5a2a1a : ((x + y) % 4 === 0 ? 0x3a1a10 : 0x8a4a2a)); P.ball(16, 6, 2, 1.6, [0xb87a20, 0xffd860, 0xfff0a0, 0xffffff]); P.rect(4, 12, 4, 2, 0xff9a3a); return P.outline(0.5); }
function bowl(fill) { // home-cooked dish in a bowl
  const P = new Pix(22, 18); P.ox = 1; P.oy = 1;
  if (fill === 'niku') for (const [x, y, c] of [[6, 6, 0xe8c070], [11, 5, 0xf0d080], [15, 7, 0xff9a40], [9, 8, 0xc86a5a], [13, 9, 0xe8c070]]) P.ball(x, y, 3, 2.4, [mixc(c, 0, 0.3), c, mixc(c, 0xffffff, 0.35), 0xffffff]);
  else { P.ball(7, 7, 3.6, 3, [0xc8a070, 0xf4e8d4, 0xffffff, 0xffffff]); P.ball(14, 6, 3.6, 3.2, [0x5a3420, 0x8a5a3a, 0xb07a50, 0xd8a070]); P.ball(10, 9, 3, 2.4, [0xc8a070, 0xf4e8d4, 0xffffff, 0xffffff]); P.set(15, 4, LEAF[2]); }
  P.poly([[0, 9], [20, 9], [17, 15], [3, 15]], (x, y) => y === 9 ? 0xffffff : x < 7 ? 0x6a7ab8 : 0x4a5a98); P.rect(6, 15, 9, 2, 0x3a4a80);
  return P.outline(0.5);
}
function tapi() { const P = new Pix(14, 24); P.ox = 1; P.oy = 1; P.rect(8, 0, 2, 8, 0xff7eb6); P.poly([[1, 6], [12, 6], [10, 22], [3, 22]], (x, y) => y < 9 ? 0xffffff : y > 16 ? 0x2a1a14 : 0xd8b48a); for (const [x, y] of [[4, 18], [7, 19], [9, 17], [6, 21], [8, 21]]) P.set(x, y, 0x5a3a2a); P.rect(1, 6, 11, 1, 0xe4dcec); return P.outline(0.5); }
// 台湾サンドイッチ: a triangle sandwich with egg, ham and cucumber layers (generic, no shop)
function tsand() { const P = new Pix(22, 18); P.ox = 1; P.oy = 1;
  const L = [0xfff4dc, 0xffd860, 0xfff4dc, 0xff9aa8, 0xfff4dc, 0x7ec860, 0xfff4dc];
  P.poly([[1, 15], [19, 15], [10, 1]], (x, y) => { const k = Math.floor((y - 1) / 2); return y === 15 || Math.abs(x - 10) > (y - 1) * 0.62 ? 0xe8c890 : L[k % L.length]; });
  P.rect(1, 15, 19, 1, 0xd8a868); return P.outline(0.5); }
// 麻辣スープ: a bowl of red, spicy soup with chilies
function mala() { const P = new Pix(22, 18); P.ox = 1; P.oy = 1;
  P.ell(10, 8, 9, 3, (x, y, nx, ny) => nx * nx + ny * ny > 0.6 ? 0xb8202a : ((x * 3 + y) % 5 === 0 ? 0xffb040 : 0xe03a2a));
  for (const [x, y] of [[6, 7], [13, 8]]) { P.set(x, y, 0xff2a2a); P.set(x + 1, y, 0xff2a2a); P.set(x + 2, y - 1, 0x58b048); }
  P.set(10, 6, 0xf4e8d4); P.set(11, 6, 0xf4e8d4); P.set(9, 9, 0x8a5a3a);
  P.poly([[0, 9], [20, 9], [17, 15], [3, 15]], (x, y) => y === 9 ? 0xffffff : x < 7 ? 0xd84a3a : 0xa82a2a); P.rect(6, 15, 9, 2, 0x7a1a1a);
  for (const x of [5, 10, 15]) { P.set(x, 2, 0xffffff); P.set(x + 1, 0, 0xffffff); }
  return P.outline(0.5); }
// サイリウム (glowstick) in four colours, the weapon icon, and the mini-live evolution icon
export const CY_COL = [0x7ee87a, 0xff7eb6, 0x6ec3ff, 0xffd94a];
function cystick(c) { const P = new Pix(8, 20); P.ox = 1; P.oy = 1; P.rect(1, 13, 4, 5, (x) => x === 1 ? 0x8a90a8 : 0x4a4e64); P.rect(1, 0, 4, 13, (x, y) => x === 1 || y === 0 ? 0xffffff : mixc(c, 0xffffff, x === 4 ? 0 : 0.4)); P.rect(0, 12, 6, 1, 0x2a2a34); return P.outline(0.6); }
function cyal() { const P = new Pix(24, 24); P.ox = 1; P.oy = 1; for (let i = 0; i < 3; i++) { const c = CY_COL[i], x0 = 4 + i * 6; for (let y = 0; y < 16; y++) { const x = x0 + Math.round((y - 8) * (i - 1) * 0.25); P.set(x, y + 2, y > 11 ? 0x4a4e64 : mixc(c, 0xffffff, 0.35)); P.set(x + 1, y + 2, y > 11 ? 0x6a6e84 : c); } } P.ball(11, 20, 7, 2, [0xc04a80, 0xff7eb6, 0xffb8d8, 0xffe8f4]); return P.outline(0.5); }
function minilive() { const P = new Pix(30, 24); P.ox = 1; P.oy = 1; P.rect(2, 16, 24, 5, (x, y) => y === 16 ? 0xffd860 : 0x8a5a7a); for (let i = 0; i < 6; i++) { const c = CY_COL[i % 4], x = 3 + i * 4; P.rect(x, 3 + (i % 2) * 3, 2, 9, mixc(c, 0xffffff, 0.3)); P.set(x, 2 + (i % 2) * 3, 0xffffff); } for (let i = 0; i < 5; i++) P.ball(4 + i * 5, 22, 2, 1.6, [0x2a1a3a, 0x4a2a5a, 0x6a4a7a, 0x8a6a9a]); return P.outline(0.5); }
function glitter() { const P = new Pix(16, 16); P.ox = 1; P.oy = 1; for (const [x, y, r, c] of [[7, 7, 5, 0xffffff], [3, 3, 2, 0xb8e4ff], [12, 4, 2, 0xffb8d8], [12, 12, 2, 0xfff4b0]]) { for (let k = -r; k <= r; k++) { P.set(x + k, y, c); P.set(x, y + k, c); } } P.set(7, 7, 0x7ec0f0); return P.outline(0.4); }

export function addPhase4(add) {
  for (let i = 0; i < 4; i++) { add('tulip' + i, tulip(i)); add('heartb' + i, heartb(i)); add('bouq' + i, bouq(i)); add('bell' + i, bell(i)); }
  add('arch', arch()); add('chair', chair()); add('fpot', fpot()); add('hedge0', hedge(0)); add('hedge1', hedge(1)); add('bellpost', bellpost());
  for (let i = 0; i < 3; i++) add('petal' + i, petals(i));
  add('ringcake', ringcake()); add('rbeef', rbeef()); add('steak', steak()); add('nikujaga', bowl('niku')); add('buri', bowl('buri')); add('tapi', tapi()); add('tsand', tsand()); add('mala', mala());
  CY_COL.forEach((c, i) => add('cys' + i, cystick(c))); add('cyal', cyal()); add('minilive', minilive()); add('glitter', glitter());
}
