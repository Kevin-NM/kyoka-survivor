// Phase 6 pixel art: nine more stages and the 20th-anniversary encore loop. Grounds, props, foes, bosses,
// bullets, pickups, the seven new weapons and zukan icons. Everything is drawn in code like art.js (no images).
import { Pix, mixc } from './art.js';

const EYE = 0x1a1626, BLUSH = 0xff9fb0, WH = 0xffffff, N = 256;
const pal = c => [mixc(c, 0x000000, 0.42), c, mixc(c, 0xffffff, 0.35), mixc(c, 0xffffff, 0.72)];
const eyes = (P, xs, y, h = 2) => { for (const x of xs) { P.rect(x, y, 2, h, EYE); P.set(x, y, WH); } };
const face = (P, x, y, w = 5) => { eyes(P, [x, x + w], y); P.set(x - 1, y + 3, BLUSH); P.set(x + w + 2, y + 3, BLUSH); P.rect(x + Math.floor(w / 2), y + 3, 2, 1, EYE); };
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dith = (x, y) => BAY[(y & 3) * 4 + (x & 3)] / 16;
function ground(seed, fn, extra) { const P = new Pix(N, N), r = mulberry(seed); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) P.set(x, y, fn(x, y, r)); if (extra) extra(P, r); return P.toCanvas(); }
const sprinkle = (P, r, n, cols, sz = 1) => { for (let i = 0; i < n; i++) { const x = (r() * N) | 0, y = (r() * N) | 0, c = cols[(r() * cols.length) | 0]; for (let k = 0; k < sz; k++) P.set((x + k) % N, y, c); } };

// ---------- grounds (seamless 256x256), index = look/ground id ----------
export const GROUNDS6 = {
  9: () => ground(901, (x, y, r) => { // club: dark dance floor with a few lit tiles
    const tx = x >> 5, ty = y >> 5, ex = x % 32, ey = y % 32, edge = ex === 0 || ey === 0, h = ((tx * 7 + ty * 13) % 9);
    if (edge) return 0x0c0814; const lit = h === 2 ? 0x8a3ad8 : h === 5 ? 0xe86a1a : h === 7 ? 0x2ab88a : 0;
    if (lit) return mixc(lit, 0x000000, 0.35 + 0.4 * Math.max(Math.abs(ex - 16), Math.abs(ey - 16)) / 16);
    return dith(x, y) + r() * 0.3 > 0.9 ? 0x2a2038 : 0x1c1628;
  }, (P, r) => sprinkle(P, r, 60, [0xffa040, 0xb070ff, 0x60ffc0])),
  10: () => ground(902, (x, y, r) => { // runway (day): pale pink marble with a white catwalk stripe
    const m = x % 128; if (m > 52 && m < 76) return m === 53 || m === 75 ? 0xd8a0b8 : ((y >> 2) % 2 ? 0xfff6fa : 0xfbeef4);
    const v = Math.sin(x * 0.05 + Math.sin(y * 0.03) * 3) * 0.5 + 0.5; return v + r() * 0.15 > 0.92 ? 0xe8b8cc : v > 0.6 ? 0xf8d8e4 : 0xf4cedc;
  }),
  21: () => ground(921, (x, y, r) => { // runway (night): black and violet gothic floor
    const m = x % 128; if (m > 52 && m < 76) return m === 53 || m === 75 ? 0x8a2a5a : ((y >> 2) % 2 ? 0x2a1a30 : 0x241628);
    const c = ((x >> 4) + (y >> 4)) % 2; return c ? (r() < 0.04 ? 0x4a2a5a : 0x1a1220) : 0x221828;
  }),
  11: () => ground(903, (x, y, r) => { // ring canvas with seams
    const s = x % 64 === 0 || y % 64 === 0; if (s) return 0x9aa4b8; const n = dith(x, y) * 0.4 + r() * 0.6; return n > 0.85 ? 0xc8d0de : n > 0.3 ? 0xd8dee8 : 0xe4e8f0;
  }, (P, r) => { for (let i = 0; i < 4; i++) { const x = (r() * 220) | 0, y = (r() * 220) | 0; for (let k = 0; k < 14; k++) P.set(x + k, y + (k % 3), 0xb8c0d0); } }),
  12: () => ground(904, (x, y, r) => { // all-night event hall carpet: navy with small dots
    const d = (x % 16 === 8 && y % 16 === 8) || (x % 16 === 0 && y % 16 === 0); if (d) return 0x6a72b8; return dith(x, y) + r() * 0.2 > 0.95 ? 0x343a6a : 0x282e58;
  }),
  13: () => ground(905, (x, y, r) => { // cherry orchard: green grass with a light earth path
    const p = Math.abs(((y + Math.sin(x * 0.05) * 10) % 128) - 64) < 10; if (p) return r() < 0.1 ? 0xb8946a : 0xc8a47a;
    const n = dith(x, y) * 0.5 + r() * 0.5; return n > 0.8 ? 0x7ac05a : n > 0.35 ? 0x5aa448 : 0x4a903c;
  }, (P, r) => { sprinkle(P, r, 90, [0xffd0e0, 0xffffff]); sprinkle(P, r, 40, [0xd8243a, 0xa81828]); }),
  14: () => ground(906, (x, y, r) => { // station platform: grey concrete slabs and a yellow tactile strip
    const m = y % 128; if (m >= 56 && m < 64) return (x % 4 === 1 && m % 4 === 1) ? 0xd8a810 : 0xf0c828;
    if (x % 64 === 0 || m === 0) return 0x7a7a84; return dith(x, y) * 0.3 + r() * 0.7 > 0.88 ? 0x9a9aa4 : 0xaaaab4;
  }, (P, r) => sprinkle(P, r, 60, [0xd84a1a, 0xe8902a, 0xb8301a], 2)),
  15: () => ground(907, (x, y, r) => { // clinic: mint linoleum checker
    const c = ((x >> 5) + (y >> 5)) % 2; if (x % 32 === 0 || y % 32 === 0) return 0x8ab8b0; return c ? (r() < 0.03 ? 0xd8f0ea : 0xc8e8e0) : (r() < 0.03 ? 0xf0fbf8 : 0xe4f4f0);
  }),
  16: () => ground(908, (x, y, r) => { // okinawa beach sand
    const n = Math.sin(x * 0.07 + y * 0.03) * 0.25 + dith(x, y) * 0.3 + r() * 0.45; return n > 0.75 ? 0xfff0c8 : n > 0.35 ? 0xf4e0b0 : 0xe8d09a;
  }, (P, r) => { sprinkle(P, r, 40, [0xffffff, 0xffb8c8], 2); sprinkle(P, r, 30, [0x8ad8e8]); }),
  17: () => ground(909, (x, y, r) => { // tatami mats (2:1) with dark cloth borders
    const row = (y >> 6) % 2, mx = (x + row * 32) % 64, my = y % 64, horiz = row ? mx < 64 : true;
    if (my < 2 || mx < 2) return 0x3a2a1a; if (my < 4 || mx < 4) return 0x5a4a2a;
    return (horiz ? (y % 3 === 0) : (x % 3 === 0)) ? 0xa8a050 : (r() < 0.05 ? 0xc8c070 : 0xb8b060);
  }),
  18: () => ground(910, (x, y, r) => { // child-actor TV studio: grey floor with tape marks
    if ((x % 128 === 64 && Math.abs(y % 128 - 64) < 8) || (y % 128 === 64 && Math.abs(x % 128 - 64) < 8)) return 0xffd040;
    return dith(x, y) * 0.3 + r() * 0.7 > 0.9 ? 0x6a6a78 : 0x5a5a68;
  }),
  19: () => ground(911, (x, y, r) => { // radio booth: dark red carpet with foam squares
    const c = ((x >> 3) + (y >> 3)) % 2; return c ? (r() < 0.06 ? 0x6a2a34 : 0x5a222c) : 0x4a1a24;
  }),
  20: () => ground(912, (x, y, r) => { // concert hall stage: long wooden boards
    const b = y % 16, off = ((y >> 4) * 53) % 96; if (b === 0 || (x + off) % 96 === 0) return 0x5a3418; const n = Math.sin((x + off) * 0.3) * 0.2 + r() * 0.3; return n > 0.3 ? 0xb87a40 : 0xa86a34;
  })
};

// ---------- props ----------
function box(P, x, y, w, h, c) { P.rect(x, y, w, h, (X, Y) => X === x || Y === y ? mixc(c, WH, 0.3) : X === x + w - 1 || Y === y + h - 1 ? mixc(c, 0, 0.35) : c); }
const PR = {
  spkwall() { const P = new Pix(30, 40); P.ox = 1; P.oy = 1; for (let i = 0; i < 3; i++) { box(P, 1, 1 + i * 13, 26, 12, 0x2a2632); P.ball(9, 7 + i * 13, 4, 4, [0x0e0a14, 0x3a3644, 0x6a6678, 0x8a8698]); P.ball(20, 7 + i * 13, 3, 3, [0x0e0a14, 0x3a3644, 0x6a6678, 0x8a8698]); } return P.outline(0.6); },
  jack() { const P = new Pix(22, 20); P.ox = 1; P.oy = 1; P.ball(10, 11, 9.5, 7.5, pal(0xe87a1a)); for (const x of [5, 10, 15]) P.line(x, 5, x, 17, 0xb85a10); P.rect(9, 1, 3, 4, 0x4a7a2a); P.poly([[5, 9], [8, 9], [6.5, 6]], 0x2a1400); P.poly([[12, 9], [15, 9], [13.5, 6]], 0x2a1400); for (let x = 6; x < 16; x += 2) P.set(x, 14 - (x % 4 ? 1 : 0), 0xffe060); P.rect(6, 13, 9, 1, 0x2a1400); return P.outline(0.55); },
  laser() { const P = new Pix(16, 44); P.ox = 1; P.oy = 1; P.rect(6, 12, 3, 30, 0x3a3644); P.rect(2, 40, 11, 3, 0x2a2632); box(P, 2, 4, 11, 9, 0x4a4654); P.ball(7, 8, 2.5, 2.5, [0x8a1aff, 0xc070ff, 0xffffff, 0xffffff]); return P.outline(0.55); },
  mirror() { const P = new Pix(20, 40); P.ox = 1; P.oy = 1; P.ell(9, 14, 8, 13, (x, y, nx, ny) => nx * nx + ny * ny > 0.82 ? 0xe8b0c8 : (x + y) % 9 < 2 ? 0xffffff : 0xc8e0f0); P.rect(8, 27, 3, 9, 0xd8a0b8); P.rect(3, 36, 13, 2, 0xd8a0b8); return P.outline(0.55); },
  rack() { const P = new Pix(34, 34); P.ox = 1; P.oy = 1; P.rect(1, 3, 31, 2, 0xc8c4d8); P.rect(1, 3, 2, 29, 0xc8c4d8); P.rect(30, 3, 2, 29, 0xc8c4d8); const C = [0xff9ac0, 0x1a1420, 0xfff0f6, 0x8a2a5a, 0xffd0e4];
    for (let i = 0; i < 5; i++) { const x = 4 + i * 5; P.poly([[x, 6], [x + 5, 6], [x + 6, 24], [x - 1, 24]], (X, Y) => (Y % 6 === 0 ? mixc(C[i], WH, 0.4) : C[i])); P.set(x + 2, 5, 0x8a8494); } return P.outline(0.55); },
  teatable() { const P = new Pix(28, 22); P.ox = 1; P.oy = 1; P.ell(13, 9, 12, 4, (x, y, nx, ny) => ny > 0.4 ? 0xe8d8e0 : 0xfff6fa); P.rect(12, 12, 3, 8, 0xc8b0bc); P.rect(7, 19, 13, 2, 0xc8b0bc);
    P.rect(5, 6, 5, 3, WH); P.set(6, 7, 0xe8394f); P.rect(10, 5, 5, 3, WH); P.set(12, 6, 0x1a1626); P.ball(18, 6, 2.5, 2, [0xd8a0b8, 0xfff0f6, 0xffffff, 0xffffff]); P.set(21, 6, 0xd8a0b8); return P.outline(0.55); },
  spot() { const P = new Pix(18, 40); P.ox = 1; P.oy = 1; P.rect(7, 12, 2, 26, 0x3a3644); P.line(2, 38, 8, 30, 0x3a3644); P.line(14, 38, 8, 30, 0x3a3644); P.ball(8, 8, 6, 5, [0x2a2632, 0x4a4654, 0x6a6678, 0x8a8698]); P.ball(10, 8, 2.5, 3, [0xffe090, 0xfff4c0, 0xffffff, 0xffffff]); return P.outline(0.55); },
  ropepost() { const P = new Pix(18, 40); P.ox = 1; P.oy = 1; P.rect(6, 2, 5, 36, (x) => x === 6 ? 0xd8dce8 : 0xa8acb8); for (const [y, c] of [[8, 0xe8394f], [16, 0xffffff], [24, 0x3a7ae0]]) { P.rect(0, y, 17, 3, c); P.rect(0, y + 2, 17, 1, mixc(c, 0, 0.3)); } P.rect(5, 0, 7, 3, 0xe8394f); return P.outline(0.55); },
  desk() { const P = new Pix(40, 26); P.ox = 1; P.oy = 1; box(P, 1, 10, 37, 14, 0x3a4a7a); P.rect(4, 13, 31, 2, 0xffd040); for (const x of [10, 28]) { P.rect(x, 2, 2, 8, 0x3a3644); P.ball(x + 1, 2, 2, 2, [0x2a2632, 0x6a6678, 0xa8a4b8, 0xffffff]); } P.rect(16, 6, 8, 4, 0x1a1626); P.rect(17, 7, 6, 2, 0x6ec3ff); return P.outline(0.55); },
  chairp() { const P = new Pix(16, 22); P.ox = 1; P.oy = 1; P.rect(2, 1, 11, 9, 0x8a8e9a); P.rect(3, 2, 9, 7, 0xa8acb8); P.rect(2, 10, 11, 2, 0x6a6e7a); P.line(3, 12, 1, 20, 0x5a5e6a); P.line(11, 12, 13, 20, 0x5a5e6a); P.line(4, 12, 11, 20, 0x5a5e6a); return P.outline(0.55); },
  clockp() { const P = new Pix(20, 26); P.ox = 1; P.oy = 1; P.ball(9, 10, 8.5, 8.5, [0x8a2a30, 0xe8394f, 0xff8a8a, 0xffd0d0]); P.ball(9, 10, 6.5, 6.5, [0xe8e4f0, 0xfff8fc, 0xffffff, 0xffffff]); P.line(9, 10, 9, 5, EYE); P.line(9, 10, 12, 10, EYE); P.ball(4, 2, 2.5, 2, pal(0xffd040)); P.ball(14, 2, 2.5, 2, pal(0xffd040)); P.line(4, 18, 2, 23, 0x3a3644); P.line(14, 18, 16, 23, 0x3a3644); return P.outline(0.55); },
  cushion() { const P = new Pix(22, 14); P.ox = 1; P.oy = 1; P.ell(10, 7, 10, 5, (x, y, nx, ny) => nx * nx + ny * ny > 0.75 ? 0x8a3a7a : 0xc85aa8); P.ball(10, 7, 1.5, 1.2, pal(0xffd040)); return P.outline(0.55); },
  lampp() { const P = new Pix(14, 30); P.ox = 1; P.oy = 1; P.rect(5, 14, 2, 14, 0x5a3a2a); P.rect(2, 27, 9, 2, 0x5a3a2a); P.rect(1, 2, 11, 12, (x, y) => (y % 4 === 0 ? 0xe8d0a0 : 0xfff4d8)); P.rect(1, 1, 11, 1, 0x3a2a1a); P.rect(1, 14, 11, 1, 0x3a2a1a); return P.outline(0.55); },
  ctree(v) { const P = new Pix(40, 44); P.ox = 1; P.oy = 1; P.rect(17, 24, 5, 18, (x) => x === 17 ? 0x8a5a3a : 0x6a4028); P.ball(19, 15, 17, 13, pal(v ? 0x4a9a3a : 0x3a8a34)); const r = mulberry(v + 5);
    for (let i = 0; i < 14; i++) { const x = 6 + r() * 26, y = 8 + r() * 16; P.ball(x, y, 1.5, 1.5, [0x8a0a1a, 0xd8243a, 0xff6a7a, 0xffffff]); P.set(x + 1, y - 2, 0x2a6a1a); } return P.outline(0.6); },
  onsen() { const P = new Pix(40, 22); P.ox = 1; P.oy = 1; P.ell(19, 12, 18, 8, (x, y, nx, ny) => nx * nx + ny * ny > 0.72 ? ((x + y) % 3 ? 0x8a8494 : 0x6a6474) : (ny < -0.2 ? 0xa8e4f0 : 0x7ac8e0)); for (const x of [10, 19, 28]) { P.set(x, 2, 0xffffff); P.set(x + 1, 0, 0xffffff); P.set(x, 4, 0xe8f4ff); } return P.outline(0.55); },
  torii() { const P = new Pix(40, 40); P.ox = 1; P.oy = 1; P.rect(1, 3, 37, 3, 0xd8303a); P.rect(0, 1, 39, 2, 0x2a1a1a); P.rect(4, 10, 31, 2, 0xd8303a); for (const x of [7, 30]) P.rect(x, 6, 3, 33, (X) => X === x ? 0xff5a5a : 0xc8202a); P.rect(17, 6, 5, 4, 0x2a1a1a); return P.outline(0.6); },
  shogiban() { const P = new Pix(26, 18); P.ox = 1; P.oy = 1; P.rect(1, 2, 23, 11, 0xe8b860); for (let i = 0; i < 6; i++) { P.line(2 + i * 4, 2, 2 + i * 4, 12, 0x8a5a20); } for (let j = 0; j < 3; j++) P.line(1, 3 + j * 4, 23, 3 + j * 4, 0x8a5a20); P.rect(2, 13, 3, 3, 0x8a5a20); P.rect(20, 13, 3, 3, 0x8a5a20); return P.outline(0.55); },
  gatep() { const P = new Pix(34, 26); P.ox = 1; P.oy = 1; for (const x of [1, 21]) { box(P, x, 6, 10, 18, 0xb8bcc8); P.rect(x + 2, 8, 6, 2, 0x3a3644); P.ball(x + 5, 15, 2, 2, [0x1a6a3a, 0x3ab85a, 0x8ae89a, 0xffffff]); } P.rect(11, 12, 10, 2, 0xe8394f); return P.outline(0.55); },
  momiji(v) { const P = new Pix(38, 44); P.ox = 1; P.oy = 1; P.rect(16, 26, 5, 16, 0x6a4028); P.ball(18, 16, 16, 13, pal(v ? 0xe8902a : 0xd8402a)); const r = mulberry(v + 9); for (let i = 0; i < 12; i++) P.set(4 + r() * 28, 6 + r() * 20, v ? 0xffd040 : 0xff8a4a); return P.outline(0.6); },
  stbench() { const P = new Pix(34, 16); P.ox = 1; P.oy = 1; P.rect(1, 4, 31, 3, 0x3a6ad0); P.rect(1, 1, 31, 2, 0x5a8af0); P.rect(3, 7, 2, 7, 0x5a5e6a); P.rect(28, 7, 2, 7, 0x5a5e6a); return P.outline(0.55); },
  stsign() { const P = new Pix(36, 30); P.ox = 1; P.oy = 1; box(P, 1, 2, 33, 12, 0xffffff); P.rect(3, 11, 29, 2, 0x2a8a4a); P.poly([[4, 7], [9, 4], [9, 10]], 0x2a3a6a); P.poly([[31, 7], [26, 4], [26, 10]], 0x2a3a6a); P.rect(14, 5, 8, 4, 0x2a3a6a); P.rect(16, 14, 3, 14, 0x8a8e9a); return P.outline(0.55); },
  bed() { const P = new Pix(36, 22); P.ox = 1; P.oy = 1; box(P, 1, 8, 33, 8, 0xe8f0f4); P.rect(1, 6, 9, 4, WH); P.rect(10, 8, 24, 3, 0x8ad0c8); P.rect(1, 2, 3, 18, 0xa8acb8); P.rect(31, 6, 3, 14, 0xa8acb8); return P.outline(0.55); },
  ampst() { const P = new Pix(24, 22); P.ox = 1; P.oy = 1; box(P, 1, 1, 21, 19, 0x1a1626); P.rect(3, 3, 17, 3, 0xd8303a); P.ball(11, 13, 6, 5, [0x0e0a14, 0x2a2632, 0x4a4654, 0x6a6678]); return P.outline(0.55); },
  curtain() { const P = new Pix(30, 36); P.ox = 1; P.oy = 1; P.rect(1, 1, 27, 2, 0xa8acb8); P.rect(2, 3, 25, 28, (x) => (x % 5 < 2 ? 0xa8dcd4 : 0xc8ece6)); P.rect(3, 31, 2, 4, 0xa8acb8); P.rect(24, 31, 2, 4, 0xa8acb8); return P.outline(0.55); },
  palm() { const P = new Pix(40, 50); P.ox = 1; P.oy = 1; for (let y = 16; y < 48; y++) P.rect(18 + Math.round(Math.sin(y * 0.08) * 3), y, 4, 1, y % 4 ? 0x9a6a3a : 0x7a4a28);
    for (const [dx, dy] of [[-1, -0.3], [1, -0.3], [-0.8, 0.4], [0.8, 0.4], [0, -1]]) for (let k = 0; k < 16; k++) { const x = 20 + dx * k, y = 15 + dy * k + (k * k) * 0.04; P.set(x, y, 0x2a8a3a); P.set(x, y + 1, 0x4ab84a); P.set(x + 1, y, 0x6ad86a); }
    P.ball(19, 17, 2, 2, pal(0x6a4a2a)); P.ball(23, 17, 2, 2, pal(0x6a4a2a)); return P.outline(0.6); },
  hibis() { const P = new Pix(28, 22); P.ox = 1; P.oy = 1; P.ball(13, 13, 12, 8, pal(0x2a8a3a)); for (const [x, y] of [[6, 9], [15, 7], [20, 13], [9, 15]]) { P.ball(x, y, 2.5, 2.5, [0xa8102a, 0xe8304a, 0xff7a8a, 0xffd0d8]); P.set(x, y, 0xffd040); } return P.outline(0.55); },
  shisap() { const P = new Pix(20, 24); P.ox = 1; P.oy = 1; P.rect(2, 18, 15, 4, 0x8a8494); P.ball(9, 12, 7, 6, pal(0xc8783a)); P.ball(9, 6, 6, 5, pal(0xd8884a)); for (let x = 3; x < 16; x += 2) P.set(x, 2, 0x8a4a1a); eyes(P, [6, 11], 5); P.rect(6, 9, 7, 1, EYE); return P.outline(0.55); },
  tank() { const P = new Pix(36, 30); P.ox = 1; P.oy = 1; box(P, 1, 3, 33, 22, 0x2a6aa8); P.rect(3, 5, 29, 18, (x, y) => (y < 9 ? 0x6ac8e8 : 0x3a98c8)); for (const [x, y, c] of [[8, 12, 0xffa040], [20, 16, 0xff5a8a], [26, 10, 0xffd040]]) { P.rect(x, y, 4, 2, c); P.set(x - 1, y, c); P.set(x + 4, y + 1, EYE); } P.rect(1, 25, 33, 3, 0x3a3644); return P.outline(0.55); },
  fusuma(v) { const P = new Pix(28, 40); P.ox = 1; P.oy = 1; box(P, 1, 1, 25, 37, 0x5a3418); P.rect(3, 3, 21, 33, v ? 0xf4ecd8 : 0xece0c0); const r = mulberry(v + 3);
    for (let i = 0; i < 8; i++) { const x = 5 + r() * 16, y = 6 + r() * 26; P.ball(x, y, 1.6, 1.6, v ? pal(0xd8303a) : pal(0x3a7a4a)); } P.ell(20, 20, 1.5, 2.5, 0x2a1a0a); return P.outline(0.55); },
  toro() { const P = new Pix(20, 34); P.ox = 1; P.oy = 1; const S = 0x9a94a4; P.rect(7, 22, 5, 9, S); P.rect(3, 30, 13, 3, 0x7a7484); box(P, 4, 11, 11, 10, 0x8a8494); P.rect(7, 13, 5, 5, 0xffd060); P.poly([[1, 11], [18, 11], [13, 5], [6, 5]], S); P.ball(9, 4, 2, 2, pal(S)); return P.outline(0.55); },
  scrollp() { const P = new Pix(24, 40); P.ox = 1; P.oy = 1; P.rect(2, 1, 19, 2, 0x3a2a1a); P.rect(3, 3, 17, 32, 0xfff4dc); P.rect(2, 35, 19, 2, 0x3a2a1a); for (let i = 0; i < 4; i++) for (let y = 6; y < 30; y += 3) if ((y + i) % 7) P.rect(5 + i * 4, y, 2, 2, EYE); P.rect(6, 31, 4, 3, 0xd8303a); return P.outline(0.55); },
  bonsai() { const P = new Pix(24, 22); P.ox = 1; P.oy = 1; P.rect(4, 15, 15, 5, 0x5a3a7a); P.line(11, 15, 9, 9, 0x6a4028); P.line(9, 9, 14, 6, 0x6a4028); P.ball(8, 7, 5, 3, pal(0x3a7a3a)); P.ball(15, 5, 5, 3, pal(0x3a7a3a)); return P.outline(0.55); },
  camera() { const P = new Pix(30, 40); P.ox = 1; P.oy = 1; box(P, 4, 6, 18, 12, 0x3a3644); P.rect(22, 9, 6, 6, 0x2a2632); P.ball(25, 12, 2, 2, [0x1a2a6a, 0x3a6ad0, 0x9ac8ff, 0xffffff]); P.rect(7, 3, 8, 3, 0x2a2632); P.set(16, 8, 0xe8394f);
    P.rect(12, 18, 3, 16, 0x5a5e6a); for (const d of [-8, 0, 8]) P.line(13, 33, 13 + d, 38, 0x5a5e6a); return P.outline(0.55); },
  clap() { const P = new Pix(22, 20); P.ox = 1; P.oy = 1; P.rect(1, 6, 19, 12, 0x1a1626); P.rect(3, 9, 15, 1, WH); P.rect(3, 12, 15, 1, WH); P.poly([[1, 1], [19, 3], [19, 6], [1, 5]], (x) => ((x >> 2) % 2 ? WH : 0x1a1626)); return P.outline(0.55); },
  rmic() { const P = new Pix(26, 34); P.ox = 1; P.oy = 1; P.rect(4, 28, 14, 4, 0x2a2632); P.line(10, 28, 10, 16, 0x5a5e6a); P.line(10, 16, 20, 8, 0x5a5e6a); P.ball(21, 6, 3.5, 5, [0x1a1626, 0x3a3644, 0x6a6678, 0xa8a4b8]); P.ell(21, 6, 5, 6, (x, y, nx, ny) => nx * nx + ny * ny > 0.8 ? 0xd8d4e0 : -1); return P.outline(0.55); },
  onair() { const P = new Pix(26, 30); P.ox = 1; P.oy = 1; box(P, 1, 1, 23, 10, 0x3a3644); P.rect(3, 3, 19, 6, 0xff3a4a); P.rect(5, 5, 15, 2, 0xffb0b8); P.rect(11, 11, 3, 17, 0x5a5e6a); P.rect(6, 27, 13, 2, 0x5a5e6a); return P.outline(0.55); },
  piano() { const P = new Pix(40, 30); P.ox = 1; P.oy = 1; P.poly([[2, 8], [24, 2], [37, 10], [37, 18], [2, 18]], (x, y) => (y < 6 ? 0x3a3644 : 0x1a1626)); P.rect(2, 16, 26, 4, WH); for (let x = 3; x < 28; x += 3) P.rect(x, 16, 1, 2, EYE); for (const x of [4, 34]) P.rect(x, 20, 2, 8, 0x1a1626); return P.outline(0.6); },
  towelp() { const P = new Pix(30, 34); P.ox = 1; P.oy = 1; P.rect(2, 2, 2, 30, 0x8a8e9a); P.rect(26, 2, 2, 30, 0x8a8e9a); P.rect(1, 2, 28, 2, 0x8a8e9a); P.rect(4, 5, 22, 10, 0xff7eb6); P.rect(6, 7, 3, 6, 0x1a1626); P.rect(11, 7, 3, 6, 0x1a1626); P.rect(16, 8, 2, 4, 0x1a1626); P.rect(20, 7, 3, 6, 0x1a1626); return P.outline(0.55); }
};

// ---------- foes (4 frames each) ----------
const F = {
  pumpk(fr) { const P = new Pix(22, 22); P.ox = 1; P.oy = 1; const h = [0, -2, -3, -1][fr]; P.ball(10, 12 + h, 9, 7.5, pal(0xe87a1a)); for (const x of [5, 10, 15]) P.line(x, 6 + h, x, 18 + h, 0xc8600a); P.rect(9, 2 + h, 3, 4, 0x4a7a2a);
    P.poly([[5, 10 + h], [8, 10 + h], [6.5, 7 + h]], 0x2a1400); P.poly([[12, 10 + h], [15, 10 + h], [13.5, 7 + h]], 0x2a1400); P.rect(6, 14 + h, 9, 2, 0x2a1400); P.set(8, 14 + h, 0xffe060); P.set(12, 15 + h, 0xffe060); return P.outline(0.55); },
  zdance(fr) { const P = new Pix(20, 28); P.ox = 1; P.oy = 1; const a = [0, 2, 0, -2][fr]; P.ball(9, 6, 5, 5, pal(0x8ac88a)); eyes(P, [6, 11], 5); P.rect(7, 9, 5, 1, EYE); P.rect(5, 11, 9, 9, 0x6a3a8a); P.rect(6, 12, 7, 2, 0xffd040);
    P.line(5, 12, 1, 7 + a, 0x8ac88a); P.line(13, 12, 18, 7 - a, 0x8ac88a); P.line(7, 20, 5 + a / 2, 26, 0x3a2a4a); P.line(11, 20, 13 - a / 2, 26, 0x3a2a4a); return P.outline(0.55); },
  disco(fr) { const P = new Pix(22, 26); P.ox = 1; P.oy = 1; P.line(10, 0, 10, 4, 0x8a8494); P.ell(10, 13, 9, 9, (x, y) => (((x + fr) >> 1) + (y >> 1)) % 2 ? 0xd8e0f0 : ((x * 3 + y + fr * 5) % 7 === 0 ? 0xffffff : 0x8a94b8)); face(P, 6, 12, 5); return P.outline(0.55); },
  kuroneko(fr) { const P = new Pix(24, 18); P.ox = 1; P.oy = 1; const l = [0, 1, 0, -1][fr]; P.ell(11, 11, 8, 4, pal(0x2a2632)[1]); P.ball(17, 7, 4.5, 4, pal(0x2a2632)); P.poly([[14, 4], [15, 0], [17, 3]], 0x2a2632); P.poly([[18, 3], [20, 0], [21, 4]], 0x2a2632);
    P.set(16, 7, 0xffe040); P.set(19, 7, 0xffe040); P.line(3, 9, 0, 4 + l, 0x2a2632); for (const x of [6, 9, 13, 16]) P.rect(x, 14, 1, 3 + ((x + fr) % 2), 0x1a1626); P.ball(10, 13, 1, 0.8, pal(0xe87a1a)); return P.outline(0.5); },
  manq(fr) { const P = new Pix(20, 32); P.ox = 1; P.oy = 1; const s = [0, 1, 0, -1][fr]; P.ball(9, 5, 4, 4.5, pal(0xe8dcc8)); P.rect(8, 9, 3, 2, 0xd8ccb8); P.poly([[4, 11], [15, 11], [13, 20], [6, 20]], (x, y) => (y % 3 ? 0xff9ac0 : 0xffc0d8)); P.poly([[6, 20], [13, 20], [16, 27], [3, 27]], 0xffc0d8);
    P.rect(9, 27, 1, 3, 0x8a8494); P.rect(5, 29, 9, 2, 0x8a8494); P.line(4, 12, 1 + s, 19, 0xe8dcc8); P.line(15, 12, 18 - s, 19, 0xe8dcc8); eyes(P, [7, 10], 4, 1); return P.outline(0.55); },
  fabric(fr) { const P = new Pix(24, 18); P.ox = 1; P.oy = 1; P.ell(11, 8, 10, 7, (x, y) => (((x + fr * 2) >> 1) % 3 === 0 ? 0xff7eb6 : ((x + fr * 2) >> 1) % 3 === 1 ? 0xfff0f6 : 0xc8a0e8)); P.ell(11, 8, 3, 3, 0xd8c0a0); P.set(11, 8, 0x8a6a4a); eyes(P, [5, 15], 6); return P.outline(0.55); },
  pinh(fr) { const P = new Pix(22, 18); P.ox = 1; P.oy = 1; const h = fr % 2; P.ball(10, 11 - h, 9, 6, pal(0xc8283a)); const C = [0xffd040, 0x6ec3ff, 0xffffff, 0x7ee87a];
    for (let i = 0; i < 7; i++) { const x = 3 + i * 2.4, y = 5 - h - (i % 2) * 2; P.line(x, y + 3, x, y, 0xc8c4d8); P.set(x, y - 1, C[i % 4]); } face(P, 6, 10 - h, 5); P.rect(2, 15, 3, 1, 0x3a2a24); P.rect(16, 15, 3, 1, 0x3a2a24); return P.outline(0.55); },
  flashb(fr) { const P = new Pix(22, 20); P.ox = 1; P.oy = 1; box(P, 1, 5, 19, 12, 0x2a2632); P.rect(4, 2, 6, 3, 0x3a3644); P.ball(11, 11, 4.5, 4.5, [0x1a2a6a, 0x3a6ad0, 0x9ac8ff, 0xffffff]); P.set(10, 9, WH); if (fr === 2) { P.rect(14, 1, 6, 4, WH); P.rect(13, 0, 8, 1, 0xfff4b0); } else P.rect(15, 2, 4, 2, 0xd8d4e0); P.set(4, 8, 0xe8394f); return P.outline(0.55); },
  masked(fr) { const P = new Pix(24, 30); P.ox = 1; P.oy = 1; const s = [0, 1, 0, -1][fr]; P.ball(11, 6, 5.5, 5.5, pal(0x3a6ad0)); P.rect(6, 4, 11, 4, 0xffffff); P.rect(7, 5, 3, 2, EYE); P.rect(13, 5, 3, 2, EYE); P.poly([[11, 1], [9, 4], [13, 4]], 0xe8394f);
    P.ball(11, 16, 7, 6, pal(0xe8b890)); P.rect(5, 19, 13, 4, 0x3a6ad0); P.line(4, 14, 0, 18 + s, 0xe8b890); P.line(18, 14, 22, 18 - s, 0xe8b890); P.rect(7, 23, 3, 5 + s, 0xe8b890); P.rect(13, 23, 3, 5 - s, 0xe8b890); return P.outline(0.55); },
  referee(fr) { const P = new Pix(20, 28); P.ox = 1; P.oy = 1; const s = [0, 1, 0, -1][fr]; P.ball(9, 5, 4.5, 4.5, pal(0xf0c8a0)); P.rect(5, 1, 9, 2, 0x2a1a1a); eyes(P, [6, 10], 5, 1); P.rect(4, 10, 11, 9, (x) => ((x >> 1) % 2 ? 0x1a1626 : 0xffffff));
    P.line(4, 11, 1, 6 - s, 0xf0c8a0); P.rect(6, 19, 3, 6 + s, 0x1a1626); P.rect(11, 19, 3, 6 - s, 0x1a1626); return P.outline(0.55); },
  chairf(fr) { const P = new Pix(20, 22); P.ox = 1; P.oy = 1; const t = [0, 1, 0, -1][fr]; P.rect(3, 1 + t, 13, 9, 0x8a8e9a); P.rect(4, 2 + t, 11, 7, 0xa8acb8); eyes(P, [6, 11], 4 + t); P.rect(8, 7 + t, 3, 1, EYE); P.rect(3, 10 + t, 13, 2, 0x6a6e7a); P.line(4, 12 + t, 2, 20, 0x5a5e6a); P.line(14, 12 + t, 16, 20, 0x5a5e6a); return P.outline(0.55); },
  flyer(fr) { const P = new Pix(26, 24); P.ox = 1; P.oy = 1; const w = [0, -2, -3, -1][fr]; P.ball(12, 6 + w, 5, 5, pal(0xffd040)); P.rect(7, 4 + w, 11, 3, 0xe8394f); P.rect(8, 5 + w, 3, 1, EYE); P.rect(13, 5 + w, 3, 1, EYE);
    P.ball(12, 14 + w, 6, 5, pal(0xe8b890)); P.poly([[6, 12 + w], [0, 8 + w], [2, 16 + w]], 0xe8394f); P.poly([[18, 12 + w], [25, 8 + w], [23, 16 + w]], 0xe8394f); P.rect(9, 19 + w, 2, 4, 0xe8b890); P.rect(13, 19 + w, 2, 4, 0xe8b890); return P.outline(0.55); },
  hitsuji(fr) { const P = new Pix(24, 20); P.ox = 1; P.oy = 1; const b = [0, 1, 0, -1][fr]; for (const [x, y] of [[6, 9], [11, 7], [16, 9], [8, 13], [14, 13]]) P.ball(x, y + b * 0.5, 4.5, 4, [0xc8c4d8, 0xf0eef8, 0xffffff, 0xffffff]);
    P.ball(19, 10, 4, 3.5, pal(0x5a4a5a)); P.line(17, 10, 19, 10, EYE); P.line(20, 10, 22, 10, EYE); P.set(21, 13, 0xff9fb0); for (const x of [6, 10, 13, 17]) P.rect(x, 16, 1, 3, 0x3a2a3a); if (fr > 1) { P.set(22, 2, 0x6ec3ff); P.set(23, 1, 0x6ec3ff); P.set(21, 3, 0x6ec3ff); } return P.outline(0.55); },
  alarm(fr) { const P = new Pix(20, 22); P.ox = 1; P.oy = 1; const sh = fr % 2 ? 1 : -1; P.ball(9 + sh * 0.5, 12, 8, 8, [0x2a5aa8, 0x3a7ae0, 0x8ab8ff, 0xd8e8ff]); P.ball(9 + sh * 0.5, 12, 6, 6, [0xe8e4f0, 0xfff8fc, 0xffffff, 0xffffff]);
    P.ball(3, 3, 2.5, 2.5, pal(0xffd040)); P.ball(15, 3, 2.5, 2.5, pal(0xffd040)); eyes(P, [6, 11], 10); P.rect(7, 15, 5, 2, EYE); P.set(8, 15, 0xff7a8a); return P.outline(0.55); },
  akubi(fr) { const P = new Pix(20, 22); P.ox = 1; P.oy = 1; const b = [0, -1, -2, -1][fr]; P.ball(9, 11 + b, 8, 7.5, pal(0x9a7ad8)); P.poly([[2, 6 + b], [4, 0 + b], [6, 5 + b]], 0x9a7ad8); P.poly([[12, 5 + b], [14, 0 + b], [16, 6 + b]], 0x9a7ad8);
    P.line(5, 9 + b, 7, 9 + b, EYE); P.line(11, 9 + b, 13, 9 + b, EYE); P.ell(9, 14 + b, 2.5, fr === 2 ? 3 : 1.5, 0x3a1a3a); P.rect(4, 19, 3, 2, 0x6a4aa8); P.rect(12, 19, 3, 2, 0x6a4aa8); return P.outline(0.55); },
  ramen(fr) { const P = new Pix(24, 22); P.ox = 1; P.oy = 1; P.ell(11, 13, 10, 6, (x, y, nx, ny) => ny > 0.1 ? (nx * nx + ny * ny > 0.75 ? 0xa8202a : 0xe8303a) : 0xf0c060); for (let x = 4; x < 19; x += 3) P.line(x, 9, x + 1, 13, 0xfff0b0);
    P.ball(15, 10, 2.5, 2, [0xd8a040, 0xfff0d0, 0xffffff, 0xffffff]); P.set(15, 10, 0xffa020); eyes(P, [6, 14], 15); for (const x of [8, 13, 17]) { P.set(x, 3 - (fr % 2), WH); P.set(x + 1, 1 - (fr % 2), 0xe8e4f0); } return P.outline(0.55); },
  fu(fr) { return koma('歩', fr, 0); }, keima(fr) { return koma('桂', fr, 1); }, kaku(fr) { return koma('角', fr, 2); },
  kin(fr) { return koma('金', fr, 3); }, gin(fr) { return koma('銀', fr, 4); },
  amenbo(fr) { const P = new Pix(26, 16); P.ox = 1; P.oy = 1; const l = [0, 1, 0, -1][fr]; P.ell(12, 8, 5, 2.4, pal(0x5a4a3a)[1]); P.ball(17, 7, 2.2, 2, pal(0x5a4a3a)); P.set(18, 6, WH);
    for (const s of [-1, 1]) { P.line(10, 8, 2, 8 + s * 6 + l, 0x3a2a1a); P.line(13, 8, 22, 8 + s * 6 - l, 0x3a2a1a); } P.ell(12, 13, 9, 1, (x) => x % 3 ? 0x8ad0f0 : -1); return P.outline(0.5); },
  senbei(fr) { const P = new Pix(20, 22); P.ox = 1; P.oy = 1; const l = [0, 2, 0, -2][fr]; P.ell(9, 9, 8, 8, (x, y, nx, ny) => nx * nx + ny * ny > 0.75 ? 0x8a5a20 : ((x * 5 + y * 3) % 9 === 0 ? 0xa87030 : 0xd8a050)); P.rect(4, 3, 4, 3, 0x1a2a1a);
    face(P, 5, 8, 5); P.line(6, 17, 5 + l, 20, 0x3a2a1a); P.line(12, 17, 13 - l, 20, 0x3a2a1a); return P.outline(0.55); },
  kippu(fr) { const P = new Pix(22, 16); P.ox = 1; P.oy = 1; const t = [0, 1, 0, -1][fr]; P.rect(1, 3 + t, 19, 10, (x, y) => (y === 3 + t || y === 12 + t ? 0xd8a810 : 0xfff4d0)); P.rect(4, 6 + t, 6, 1, 0x3a3644); P.rect(4, 9 + t, 9, 1, 0x3a3644); P.ell(17, 8 + t, 1.5, 1.5, -1); eyes(P, [12, 16], 5 + t); return P.outline(0.5); },
  gate(fr) { const P = new Pix(24, 28); P.ox = 1; P.oy = 1; const m = fr % 2; box(P, 1, 6, 21, 20, 0xb8bcc8); P.rect(4, 9, 15, 4, 0x3a3644); eyes(P, [6, 14], 10); P.rect(4, 15, 15, 2 + m, 0x1a1626); P.rect(4, 15, 15, 1, 0xffd040);
    P.rect(1, 2, 21, 4, 0xe8394f); P.ball(11, 21, 2.5, 2.5, [0x1a6a3a, 0x3ab85a, 0x8ae89a, 0xffffff]); return P.outline(0.55); },
  suitcase(fr) { const P = new Pix(22, 24); P.ox = 1; P.oy = 1; const t = [0, 1, 0, -1][fr]; P.rect(8, 1, 6, 2, 0x3a3644); P.rect(8, 1, 1, 4, 0x3a3644); P.rect(13, 1, 1, 4, 0x3a3644); box(P, 2, 4, 18, 15, 0x2a8a8a); P.rect(2, 9, 18, 1, 0x1a5a5a); P.rect(2, 14, 18, 1, 0x1a5a5a);
    eyes(P, [6, 13], 6); P.ball(5, 21, 1.5, 1.5, [0x1a1626, 0x3a3644, 0x6a6678, 0xffffff]); P.ball(17, 21, 1.5, 1.5, [0x1a1626, 0x3a3644, 0x6a6678, 0xffffff]); if (t) P.set(10, 7, 0xffd040); return P.outline(0.55); },
  hato(fr) { const P = new Pix(22, 18); P.ox = 1; P.oy = 1; const w = [0, -3, -4, -2][fr]; P.ell(10, 10, 7, 5, pal(0x8a8ea8)[1]); P.ball(16, 6, 3.5, 3.2, pal(0x8a8ea8)); P.set(17, 5, 0xff8a2a); P.set(20, 6, 0xd8a040); P.rect(14, 9, 3, 2, 0x5ab87a);
    P.poly([[6, 9], [12, 9], [9, 3 + w]], 0x6a6e88); P.rect(8, 15, 1, 2, 0xff7a8a); P.rect(12, 15, 1, 2, 0xff7a8a); return P.outline(0.5); },
  syringe(fr) { const P = new Pix(26, 12); P.ox = 1; P.oy = 1; P.rect(4, 3, 14, 5, (x, y) => (y === 3 ? 0xffffff : x < 4 + 8 + fr ? 0xd8eef8 : 0xff7eb6)); for (let x = 6; x < 18; x += 3) P.set(x, 3, 0x8ab8d8); P.rect(1, 2, 3, 7, 0x6ac0d8); P.rect(18, 5, 6, 1, 0xc8c4d8); eyes(P, [8, 12], 4, 2); return P.outline(0.5); },
  capsule(fr) { const P = new Pix(20, 14); P.ox = 1; P.oy = 1; const sq = fr % 2; P.ell(9, 6 + sq, 8.5, 5 - sq, (x) => (x < 9 ? 0xff5a7a : 0xfff4f8)); P.set(4, 3, WH); face(P, 6, 5 + sq, 5); return P.outline(0.5); },
  tenteki(fr) { const P = new Pix(18, 34); P.ox = 1; P.oy = 1; const s = [0, 1, 0, -1][fr]; P.rect(8, 6, 2, 24, 0xa8acb8); P.rect(2, 4, 14, 1, 0xa8acb8); P.ball(5, 9, 3, 4, [0x8ad0e8, 0xc8f0f8, 0xffffff, 0xffffff]); P.line(5, 13, 9, 18, 0x6ac0d8);
    eyes(P, [3, 8], 8, 1); for (const d of [-5, 0, 5]) P.line(9, 30, 9 + d + s, 33, 0x5a5e6a); return P.outline(0.55); },
  clip(fr) { const P = new Pix(18, 22); P.ox = 1; P.oy = 1; const t = [0, 1, 0, -1][fr]; P.rect(1, 3 + t, 15, 18, 0xb8865a); P.rect(3, 5 + t, 11, 14, WH); P.rect(5, 1 + t, 7, 4, 0xc8c4d8); for (let y = 12; y < 18; y += 2) P.rect(4, y + t, 9, 1, 0x8ab8d8); eyes(P, [5, 10], 7 + t); return P.outline(0.55); },
  sushi(fr) { const P = new Pix(20, 16); P.ox = 1; P.oy = 1; const h = [0, -1, -2, -1][fr]; P.ell(9, 10 + h, 8, 4, [0xe8e4f0, 0xfff8fc, 0xffffff, 0xffffff][1]); P.ell(9, 7 + h, 8, 3, (x) => ((x % 4) ? 0xc84a3a : 0xe8786a)); eyes(P, [5, 11], 9 + h); P.rect(1, 9 + h, 17, 1, 0x1a3a1a); return P.outline(0.5); },
  yashigani(fr) { const P = new Pix(28, 20); P.ox = 1; P.oy = 1; const c = fr % 2; P.ell(13, 11, 8, 5, pal(0x8a3aa8)[1]); P.ball(13, 9, 6, 3, pal(0xa85ac8)); eyes(P, [10, 15], 5);
    for (const s of [-1, 1]) { P.ball(13 + s * 11, 6 - c, 3.5, 3, pal(0xd84a3a)); P.line(13 + s * 6, 11, 13 + s * 10, 8, 0x6a2a88); for (let k = 0; k < 3; k++) P.line(13 + s * (4 + k * 2), 14, 13 + s * (7 + k * 2), 18, 0x6a2a88); } return P.outline(0.55); },
  tfish(fr) { const P = new Pix(20, 14); P.ox = 1; P.oy = 1; const t = [0, 1, 0, -1][fr]; const C = [0xffa020, 0xffffff];
    P.ell(9, 7, 7, 4.5, (x) => (((x + 1) >> 2) % 2 ? C[1] : C[0])); P.poly([[2, 7], [-1, 3 + t], [-1, 11 + t]], 0xff7a1a); P.set(13, 6, EYE); P.set(13, 5, WH); P.ell(9, 7, 7, 4.5, (x, y, nx, ny) => nx * nx + ny * ny > 0.85 ? 0x1a1626 : -1); return P.outline(0.5); },
  ka(fr) { const P = new Pix(16, 14); P.ox = 1; P.oy = 1; const w = fr % 2 ? -2 : 0; P.ell(7, 8, 3, 2, pal(0x5a5a6a)[1]); P.ball(11, 7, 2, 2, pal(0x4a4a5a)); P.line(12, 8, 15, 10, 0x2a2a3a); P.set(11, 6, 0xff5a5a);
    P.ell(5, 4 + w, 3, 2, 0xd8f0ff); P.ell(9, 4 + w, 3, 2, 0xe8f8ff); for (const x of [5, 8]) P.line(x, 10, x - 1, 13, 0x2a2a3a); return P.outline(0.45); },
  taifu(fr) { const P = new Pix(28, 22); P.ox = 1; P.oy = 1; for (const [x, y, r] of [[8, 12, 7], [15, 9, 8], [21, 13, 6], [14, 14, 7]]) P.ball(x, y, r, r * 0.8, [0x6a7a98, 0x9aaac8, 0xc8d4e8, 0xffffff]);
    for (let i = 0; i < 10; i++) { const a = i * 0.6 + fr * 0.8, r = 2 + i * 0.5; P.set(14 + Math.cos(a) * r, 12 + Math.sin(a) * r * 0.7, 0x3a4a6a); } eyes(P, [10, 17], 9); return P.outline(0.55); },
  uragiri(fr) { const P = new Pix(22, 30); P.ox = 1; P.oy = 1; const s = [0, 1, 0, -1][fr]; P.ball(10, 6, 5, 5, pal(0xf0c8a0)); P.rect(5, 1, 11, 3, 0x2a1a1a); P.rect(6, 5, 9, 2, 0x1a1626); P.set(8, 5, 0x6a6678); P.set(13, 5, 0x6a6678); P.rect(8, 9, 4, 1, EYE);
    P.rect(4, 11, 13, 10, 0x2a2a3a); P.rect(9, 11, 3, 6, WH); P.rect(10, 12, 1, 5, 0xe8394f); P.poly([[15, 14], [21, 12 - s], [20, 18]], 0x8a5a3a); P.rect(5, 21, 4, 7 + s, 0x1a1626); P.rect(12, 21, 4, 7 - s, 0x1a1626); return P.outline(0.55); },
  kobun(fr) { const P = new Pix(20, 28); P.ox = 1; P.oy = 1; const s = [0, 1, 0, -1][fr]; P.ball(9, 6, 5, 5, pal(0xf0c8a0)); P.rect(4, 2, 11, 2, 0x2a1a1a); eyes(P, [6, 11], 5); P.rect(7, 9, 5, 1, EYE);
    P.rect(3, 11, 13, 9, 0x3a3a5a); P.rect(8, 11, 3, 4, 0xffffff); P.rect(4, 20, 4, 6 + s, 0x2a2a3a); P.rect(11, 20, 4, 6 - s, 0x2a2a3a); return P.outline(0.55); },
  eihire(fr) { const P = new Pix(22, 18); P.ox = 1; P.oy = 1; const r = fr * 0.6; P.poly([[3 + r, 14], [11, 1 + r], [19 - r, 14]], (x, y) => ((x + y) % 5 === 0 ? 0xa86a2a : 0xe8b060)); P.line(3 + r, 14, 19 - r, 14, 0x8a4a1a); eyes(P, [8, 12], 8); for (const x of [6, 11, 16]) P.set(x, 16, 0xff7a2a); return P.outline(0.55); },
  daruma(fr) { const P = new Pix(22, 24); P.ox = 1; P.oy = 1; const t = [0, 1, 0, -1][fr]; P.ball(10 + t * 0.5, 13, 9, 9.5, pal(0xd8203a)); P.ell(10 + t * 0.5, 10, 5.5, 4.5, (x, y, nx, ny) => 0xfff4e8); P.rect(7 + t, 9, 2, 2, EYE); P.rect(12 + t, 9, 2, 2, EYE); P.set(7 + t, 9, WH);
    P.line(6 + t, 7, 9 + t, 8, EYE); P.line(15 + t, 7, 12 + t, 8, EYE); P.rect(6, 17, 9, 2, 0xffd040); return P.outline(0.55); }
};
function koma(ch, fr, v) { // shogi piece foe with the piece's kanji (a game term, not a name)
  const P = new Pix(20, 26); P.ox = 1; P.oy = 1; const h = [0, -1, -2, -1][fr]; const wood = v >= 3 ? [0xb8865a, 0xe8c08a, 0xffe0b0, 0xfff4dc] : [0xa87a4a, 0xd8b078, 0xf0d0a0, 0xfff0d0];
  P.poly([[9, 1 + h], [16, 5 + h], [18, 23 + h], [0, 23 + h], [2, 5 + h]], (x, y) => (y > 21 + h ? wood[0] : x < 4 ? wood[2] : wood[1]));
  const c = document.createElement('canvas'); c.width = 14; c.height = 14; const g = c.getContext('2d'); g.fillStyle = '#000'; g.font = 'bold 13px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 7, 7.5);
  const d = g.getImageData(0, 0, 14, 14).data; for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) if (d[(y * 14 + x) * 4 + 3] > 110) P.set(2 + x, 7 + y + h, v >= 3 ? 0x8a1420 : 0x1a1210);
  P.set(4, 20 + h, WH); P.set(14, 20 + h, WH); return P.outline(0.55);
}

// ---------- bosses (4 frames) ----------
const B = {
  woofer(fr) { const P = new Pix(56, 56); P.ox = 2; P.oy = 2; const pump = [0, 1, 2, 1][fr]; box(P, 6, 6, 40, 44, 0x2a2632); P.rect(6, 6, 40, 3, 0x8a3ad8);
    P.ball(26, 33, 13 + pump, 13 + pump, [0x0e0a14, 0x2a2632, 0x4a4654, 0x6a6678]); P.ball(26, 33, 5, 5, [0x3a3644, 0x6a6678, 0x8a8698, 0xffffff]); P.ball(26, 14, 5, 4, [0x0e0a14, 0x3a3644, 0x6a6678, 0x8a8698]);
    P.rect(13, 12, 5, 5, 0xffd040); P.rect(34, 12, 5, 5, 0xffd040); P.rect(15, 13, 2, 3, EYE); P.rect(36, 13, 2, 3, EYE); for (const x of [2, 48]) P.rect(x, 20, 4, 18, 0x4a4654); P.rect(10, 50, 8, 4, 0x1a1626); P.rect(34, 50, 8, 4, 0x1a1626); return P.outline(0.6); },
  msew(fr) { const P = new Pix(60, 50); P.ox = 2; P.oy = 2; const n = [0, 2, 4, 2][fr]; P.rect(4, 34, 52, 10, (x, y) => y === 34 ? 0xffb0d0 : 0xe878a8); P.rect(6, 8, 12, 26, (x) => x === 6 ? 0xffd0e4 : 0xf090b8);
    P.rect(6, 6, 46, 12, (x, y) => y === 6 ? 0xffd0e4 : 0xf090b8); P.rect(44, 18, 6, 8 + n, 0xc8c4d8); P.rect(46, 26 + n, 2, 6, 0xe8e4f0); P.ball(22, 12, 4, 3, pal(0xffd040)); P.ball(34, 12, 4, 3, pal(0xffd040)); P.rect(21, 11, 2, 2, EYE); P.rect(33, 11, 2, 2, EYE);
    P.ball(10, 4, 3, 3, [0x8a1838, 0xff7eb6, 0xffc0d8, 0xffffff]); P.line(10, 4, 46, 22, 0xffffff); P.rect(8, 40, 44, 2, 0xffffff); return P.outline(0.6); },
  champ(fr) { const P = new Pix(50, 56); P.ox = 2; P.oy = 2; const s = [0, 1, 0, -1][fr]; P.ball(23, 10, 8, 8, pal(0xd8303a)); P.rect(15, 8, 17, 5, WH); P.rect(17, 9, 4, 3, EYE); P.rect(26, 9, 4, 3, EYE); P.poly([[23, 1], [19, 6], [27, 6]], 0xffd040);
    P.ball(23, 28, 15, 11, pal(0xe8b890)); P.rect(10, 32, 27, 6, 0xffd040); P.rect(19, 31, 9, 8, (x, y) => ((x + y) % 3 ? 0xfff4b0 : 0xd8a810)); P.line(8, 24, 1, 34 + s, 0xe8b890); P.line(38, 24, 45, 34 - s, 0xe8b890); P.ball(1, 35 + s, 3, 3, pal(0xd8303a)); P.ball(45, 35 - s, 3, 3, pal(0xd8303a));
    P.rect(14, 39, 8, 11 + s, 0xd8303a); P.rect(26, 39, 8, 11 - s, 0xd8303a); return P.outline(0.6); },
  nabe(fr) { const P = new Pix(60, 48); P.ox = 2; P.oy = 2; const b = [0, 1, 2, 1][fr]; P.ell(28, 28, 26, 16, (x, y, nx, ny) => ny < -0.35 ? 0xd8a040 : nx * nx + ny * ny > 0.78 ? 0x2a2632 : 0x4a4654); P.ell(28, 20, 22, 5, (x, y) => ((x + y + b) % 7 === 0 ? 0xffffff : 0xe8b860));
    P.rect(0, 22, 5, 4, 0x2a2632); P.rect(51, 22, 5, 4, 0x2a2632); P.line(16, 30, 22, 31, EYE); P.line(34, 31, 40, 30, EYE); P.ell(28, 36, 4, 2, 0x1a1626); for (const x of [14, 26, 40]) P.ball(x, 10 - b, 3, 3, [0xd8c8a8, 0xfff8ee, 0xffffff, 0xffffff]); P.set(44, 4, 0x6ec3ff); P.set(46, 2, 0x6ec3ff); return P.outline(0.6); },
  oushou(fr) { const P = new Pix(44, 56); P.ox = 2; P.oy = 2; const h = [0, -1, -2, -1][fr]; const w = [0x8a5a2a, 0xd8a868, 0xf8d8a0, 0xfff4dc];
    P.poly([[20, 1 + h], [34, 9 + h], [38, 50 + h], [2, 50 + h], [6, 9 + h]], (x, y) => (y > 47 + h ? w[0] : x < 9 ? w[2] : w[1])); const c = document.createElement('canvas'); c.width = 26; c.height = 40; const g = c.getContext('2d'); g.fillStyle = '#000'; g.font = 'bold 18px serif'; g.textAlign = 'center'; g.fillText('王', 13, 17); g.fillText('将', 13, 37);
    const d = g.getImageData(0, 0, 26, 40).data; for (let y = 0; y < 40; y++) for (let x = 0; x < 26; x++) if (d[(y * 26 + x) * 4 + 3] > 110) P.set(7 + x, 8 + y + h, 0x1a1210); P.ball(20, 3 + h, 5, 2, pal(0xffd040)); return P.outline(0.6); },
  loco(fr) { const P = new Pix(64, 44); P.ox = 2; P.oy = 2; const w = fr; P.rect(4, 14, 44, 18, (x, y) => (y === 14 ? 0x5a5e6a : 0x2a2632)); P.rect(40, 4, 18, 28, (x, y) => (y === 4 ? 0x5a5e6a : 0x3a3644)); P.rect(43, 8, 12, 8, 0xffd060); P.rect(8, 6, 7, 8, 0x2a2632); P.rect(6, 4, 11, 3, 0x1a1626);
    P.ball(4, 23, 4, 6, pal(0xffd040)); P.rect(4, 32, 54, 2, 0xd8303a); for (const x of [14, 30, 48]) { P.ball(x, 36, 6, 6, [0x1a1626, 0x3a3644, 0x8a8698, 0xd8303a]); const a = w * 1.57; P.line(x, 36, x + Math.cos(a) * 5, 36 + Math.sin(a) * 5, 0xc8c4d8); }
    P.line(14, 36, 48, 36 + (w % 2 ? 2 : -2), 0xc8c4d8); eyes(P, [22, 30], 20); for (let i = 0; i < 3; i++) P.ball(11 - i * 2, 1 - i, 2.5 + i, 2, [0xa8a4b8, 0xe8e4f0, 0xffffff, 0xffffff]); return P.outline(0.6); },
  sushim(fr) { const P = new Pix(60, 46); P.ox = 2; P.oy = 2; const h = [0, -1, -2, -1][fr]; P.ell(28, 30 + h, 26, 12, (x, y, nx, ny) => nx * nx + ny * ny > 0.8 ? 0xd8d4e0 : (x * 3 + y) % 11 === 0 ? 0xe8e4f0 : 0xfff8fc);
    P.ell(28, 20 + h, 26, 9, (x, y) => (((x + y) >> 2) % 3 === 0 ? 0xf0a898 : 0xd85a4a)); for (let x = 6; x < 52; x += 6) P.line(x, 14 + h, x + 4, 26 + h, 0xffd0c8); P.rect(2, 28 + h, 52, 4, 0x1a3a1a);
    P.ball(18, 34 + h, 4, 4, [0xc8c4d8, 0xffffff, 0xffffff, 0xffffff]); P.ball(38, 34 + h, 4, 4, [0xc8c4d8, 0xffffff, 0xffffff, 0xffffff]); P.rect(17, 33 + h, 2, 3, EYE); P.rect(37, 33 + h, 2, 3, EYE); P.rect(25, 39 + h, 6, 1, EYE); return P.outline(0.6); },
  shisaA(fr) { return shisa(fr, true); }, shisaB(fr) { return shisa(fr, false); },
  scroll(fr) { const P = new Pix(52, 60); P.ox = 2; P.oy = 2; const u = [0, 1, 2, 1][fr]; P.rect(2, 2, 46, 5, 0x3a2a1a); P.ball(1, 4, 3, 3, pal(0xffd040)); P.ball(49, 4, 3, 3, pal(0xffd040)); P.rect(5, 7, 40, 42 + u, 0xfff4dc); P.rect(2, 49 + u, 46, 5, 0x3a2a1a);
    const c = document.createElement('canvas'); c.width = 36; c.height = 36; const g = c.getContext('2d'); g.fillStyle = '#000'; g.font = 'bold 16px serif'; g.textAlign = 'center'; g.fillText('鉄の', 18, 15); g.fillText('掟', 18, 34);
    const d = g.getImageData(0, 0, 36, 36).data; for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++) if (d[(y * 36 + x) * 4 + 3] > 110) P.set(7 + x, 9 + y, 0x1a1210);
    P.ball(14, 44 + u, 3, 2, [0x8a1420, 0xd8303a, 0xff8a8a, 0xffffff]); P.ball(36, 44 + u, 3, 2, [0x8a1420, 0xd8303a, 0xff8a8a, 0xffffff]); P.rect(13, 44 + u, 2, 2, 0xffd040); P.rect(35, 44 + u, 2, 2, 0xffd040); return P.outline(0.6); }
};
function shisa(fr, open) { // twin guardian lion-dogs: one with its mouth open, one closed
  const P = new Pix(52, 52); P.ox = 2; P.oy = 2; const b = [0, -1, -2, -1][fr], C = open ? 0xd8884a : 0xc8783a;
  P.ball(24, 34 + b, 18, 13, pal(C)); P.ball(24, 18 + b, 16, 13, pal(mixc(C, 0xffffff, 0.08))); for (let i = 0; i < 12; i++) { const a = Math.PI + i / 11 * Math.PI; P.ball(24 + Math.cos(a) * 16, 18 + b + Math.sin(a) * 13, 3, 3, pal(0x8a4a1a)); }
  P.ball(16, 14 + b, 4, 4, [0xc8c4d8, 0xffffff, 0xffffff, 0xffffff]); P.ball(32, 14 + b, 4, 4, [0xc8c4d8, 0xffffff, 0xffffff, 0xffffff]); P.rect(16, 13 + b, 2, 3, EYE); P.rect(32, 13 + b, 2, 3, EYE); P.ball(24, 20 + b, 4, 3, pal(0x8a4a1a));
  if (open) { P.rect(14, 24 + b, 20, 6 + (fr % 2), 0x5a0a14); for (let x = 15; x < 34; x += 3) { P.set(x, 24 + b, WH); P.set(x + 1, 29 + b + (fr % 2), WH); } } else { P.rect(14, 26 + b, 20, 2, 0x5a2a0a); P.set(16, 28 + b, WH); P.set(31, 28 + b, WH); }
  for (const x of [10, 34]) P.rect(x, 44, 8, 5, pal(C)[0]); return P.outline(0.6);
}

// ---------- bullets / small fx ----------
const S = {
  vinyl() { const P = new Pix(12, 12); P.ball(5.5, 5.5, 5.5, 5.5, [0x0e0a14, 0x1a1626, 0x3a3644, 0x6a6678]); P.ball(5.5, 5.5, 1.8, 1.8, pal(0xe87a1a)); return P; },
  thread() { const P = new Pix(10, 10); P.ball(4.5, 4.5, 4, 4, [0xc04a80, 0xff7eb6, 0xffc0d8, 0xffffff]); P.line(1, 4, 8, 5, 0xffffff); return P; },
  thimble() { const P = new Pix(10, 10); P.poly([[2, 1], [7, 1], [9, 9], [0, 9]], (x, y) => ((x + y) % 2 ? 0xc8c4d8 : 0xe8e4f0)); return P; },
  misob() { const P = new Pix(10, 10); P.ball(4.5, 4.5, 4.5, 4.5, [0xa87030, 0xd8a050, 0xf0d090, 0xffffff]); return P; },
  steam() { const P = new Pix(12, 10); P.ball(5.5, 4.5, 5.5, 4.5, [0xa8a4b8, 0xe8e4f0, 0xffffff, 0xffffff]); return P; },
  rice() { const P = new Pix(10, 10); P.ball(4.5, 4.5, 4, 4, [0xd8d4e0, 0xfff8fc, 0xffffff, 0xffffff]); P.rect(1, 6, 8, 2, 0x1a3a1a); return P; },
  wave() { const P = new Pix(12, 10); P.ball(5.5, 4.5, 5.5, 4.5, [0x2a6aa8, 0x3a98c8, 0x8ad8f0, 0xffffff]); return P; },
  yakib() { const P = new Pix(12, 10); P.ell(5.5, 4.5, 5.5, 3.5, (x, y) => ((x + y) % 3 ? 0x8a3a2a : 0xc85a3a)); P.line(1, 3, 10, 3, 0x3a1a0a); return P; },
  kana0() { return kanaS('あ'); }, kana1() { return kanaS('か'); }, kana2() { return kanaS('な'); }, kana3() { return kanaS('ふ'); },
  note6() { const P = new Pix(10, 12); P.rect(6, 0, 2, 8, 0xffd040); P.ball(4, 9, 3, 2.2, pal(0xffd040)); P.rect(6, 0, 4, 2, 0xffd040); return P; }
};
function kanaS(ch) { const P = new Pix(14, 14); P.ball(6.5, 6.5, 6.5, 6.5, [0xd8d4c0, 0xfff4dc, 0xfff8ee, 0xffffff]); const c = document.createElement('canvas'); c.width = 12; c.height = 12; const g = c.getContext('2d'); g.fillStyle = '#000'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 6, 6.5);
  const d = g.getImageData(0, 0, 12, 12).data; for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) if (d[(y * 12 + x) * 4 + 3] > 110) P.set(1 + x, 1 + y, 0x1a1210); return P; }

// ---------- pickups / weapon icons ----------
const I = {
  miso() { const P = new Pix(22, 18); P.ox = 1; P.oy = 1; P.ell(10, 9, 10, 7, (x, y, nx, ny) => ny > 0 ? (nx * nx + ny * ny > 0.75 ? 0x5a1a1a : 0x8a2a2a) : (ny < -0.5 ? 0x5a1a1a : 0xc88a40)); P.rect(6, 5, 3, 2, 0xfff4e0); P.rect(12, 6, 2, 2, 0x3a7a2a); P.rect(10, 4, 2, 2, 0xfff4e0); for (const x of [6, 12]) { P.set(x, 0, WH); P.set(x + 1, -1, WH); } return P.outline(0.5); },
  okisoba() { const P = new Pix(24, 18); P.ox = 1; P.oy = 1; P.ell(11, 10, 11, 7, (x, y, nx, ny) => ny > 0 ? (nx * nx + ny * ny > 0.75 ? 0x2a4a8a : 0x3a6ad0) : 0xf0d8a0); for (let x = 3; x < 20; x += 3) P.line(x, 5, x + 2, 9, 0xfff0c0); P.rect(7, 4, 6, 3, 0x8a3a2a); P.rect(14, 5, 3, 2, 0xff8ab0); P.rect(4, 15, 15, 1, 0xffffff); return P.outline(0.5); },
  cherry() { const P = new Pix(20, 20); P.ox = 1; P.oy = 1; P.line(5, 10, 10, 1, 0x3a6a1a); P.line(14, 11, 10, 1, 0x3a6a1a); P.ball(11, 2, 3, 1.5, pal(0x4a9a3a)); P.ball(5, 13, 4.2, 4.2, [0x8a0a1a, 0xd8243a, 0xff6a7a, 0xffffff]); P.ball(14, 14, 4.2, 4.2, [0x8a0a1a, 0xd8243a, 0xff6a7a, 0xffffff]); return P.outline(0.5); },
  senbeiI() { const P = new Pix(20, 20); P.ox = 1; P.oy = 1; P.ell(9, 9, 9, 9, (x, y, nx, ny) => nx * nx + ny * ny > 0.75 ? 0x8a5a20 : ((x * 5 + y * 3) % 9 === 0 ? 0xa87030 : 0xd8a050)); P.rect(3, 6, 6, 5, 0x1a2a1a); return P.outline(0.5); },
  crepe() { const P = new Pix(18, 24); P.ox = 1; P.oy = 1; P.poly([[1, 8], [16, 8], [8.5, 23]], (x, y) => ((x + y) % 4 ? 0xe8b860 : 0xd8a040)); P.ball(8.5, 6, 7, 4, [0xe8e4f0, 0xfff8fc, 0xffffff, 0xffffff]); P.ball(5, 4, 2, 2, [0x8a0a1a, 0xd8243a, 0xff6a7a, 0xffffff]); P.ball(12, 4, 2, 2, pal(0x6a3a1a)); return P.outline(0.5); },
  muffin() { const P = new Pix(18, 18); P.ox = 1; P.oy = 1; P.poly([[3, 9], [14, 9], [12, 17], [5, 17]], (x) => (x % 3 ? 0xff9ac0 : 0xffc0d8)); P.ball(8.5, 7, 7.5, 5.5, pal(0x5a3018)); for (const [x, y] of [[5, 5], [10, 4], [12, 8], [7, 8]]) P.set(x, y, 0x2a1408); return P.outline(0.5); },
  waffle() { const P = new Pix(20, 18); P.ox = 1; P.oy = 1; P.rect(1, 3, 17, 13, (x, y) => (x % 4 === 1 || y % 4 === 3 ? 0xc88a30 : 0xf0c060)); P.ball(9, 4, 3, 2, [0xd8d4e0, 0xfff8fc, 0xffffff, 0xffffff]); return P.outline(0.5); },
  eihireI() { const P = new Pix(22, 16); P.ox = 1; P.oy = 1; P.poly([[1, 13], [10, 1], [20, 13]], (x, y) => ((x + y) % 5 === 0 ? 0xa86a2a : 0xe8b060)); P.line(1, 13, 20, 13, 0x8a4a1a); P.rect(14, 10, 4, 3, 0xfff0b0); return P.outline(0.5); },
  imo() { const P = new Pix(24, 14); P.ox = 1; P.oy = 1; P.ell(11, 6, 11, 5, (x, y, nx, ny) => nx > 0.7 ? 0xfff0a0 : ny < -0.4 ? 0xc84a8a : 0xa83a6a); P.ell(19, 6, 3, 4, 0xffe070); return P.outline(0.5); },
  kakigori() { const P = new Pix(20, 24); P.ox = 1; P.oy = 1; P.poly([[3, 14], [16, 14], [13, 22], [6, 22]], 0x9ad8f0); P.ball(9.5, 10, 8, 6.5, [0xe86a90, 0xff9ac0, 0xffd0e4, 0xffffff]); P.ell(9.5, 7, 5, 2.5, (x) => (x % 2 ? 0xffffff : 0xfff0f6)); P.ball(10, 4, 2, 2, [0x8a0a1a, 0xd8243a, 0xff6a7a, 0xffffff]); return P.outline(0.5); },
  usamimi() { const P = new Pix(22, 22); P.ox = 1; P.oy = 1; for (const x of [5, 15]) { P.ell(x, 9, 3.5, 8.5, 0x1a1626); P.ell(x, 9, 1.6, 6, 0xff9ac0); } P.rect(2, 17, 18, 3, 0x1a1626); P.ball(11, 18, 2.5, 2, pal(0xe87a1a)); return P.outline(0.5); },
  cbelt() { const P = new Pix(26, 16); P.ox = 1; P.oy = 1; P.rect(1, 5, 23, 6, 0x1a1626); P.ell(12, 8, 7, 6, (x, y, nx, ny) => nx * nx + ny * ny > 0.7 ? 0xa8782a : 0xffd040); P.ball(12, 8, 2.5, 2.5, [0x8a1420, 0xe8394f, 0xff8a8a, 0xffffff]); for (const x of [3, 21]) P.rect(x, 6, 2, 4, 0xffd040); return P.outline(0.5); },
  kusuri() { const P = new Pix(20, 14); P.ox = 1; P.oy = 1; P.ell(9, 6, 8.5, 5, (x) => (x < 9 ? 0x6ec3ff : 0xfff4f8)); P.set(4, 3, WH); P.ball(15, 11, 2, 2, pal(0xffd040)); return P.outline(0.5); },
  hamcard() { const P = new Pix(22, 16); P.ox = 1; P.oy = 1; P.rect(1, 1, 19, 13, (x, y) => (y < 4 ? 0xff7eb6 : 0xfff4f8)); P.ball(6, 9, 3, 3, [0xc8884a, 0xf0c890, 0xfff0d8, 0xffffff]); P.set(5, 9, EYE); P.set(7, 9, EYE); for (const y of [7, 10]) P.rect(11, y, 7, 1, 0x8a8494); return P.outline(0.5); },
  hamcoin() { const P = new Pix(16, 16); P.ox = 1; P.oy = 1; P.ball(7, 7, 7, 7, [0xa8782a, 0xe8b83a, 0xffe070, 0xfff8c0]); P.ball(7, 8, 3.5, 3, [0xc8884a, 0xf0c890, 0xfff0d8, 0xffffff]); P.set(6, 7, EYE); P.set(8, 7, EYE); P.set(4, 5, 0xc8884a); P.set(10, 5, 0xc8884a); return P.outline(0.5); },
  ekicho() { const P = new Pix(22, 16); P.ox = 1; P.oy = 1; P.ell(10, 6, 9, 5, (x, y, nx, ny) => ny < 0.3 ? 0x1a2a5a : 0x2a3a7a); P.rect(1, 9, 19, 2, 0x1a1626); P.rect(3, 11, 15, 3, 0x0e0a14); P.rect(1, 7, 19, 1, 0xffd040); P.ball(10, 4, 2, 2, pal(0xffd040)); return P.outline(0.5); },
  trump() { const P = new Pix(24, 18); P.ox = 1; P.oy = 1; P.rect(1, 2, 9, 13, WH); P.rect(2, 3, 7, 11, 0xfff8fc); P.poly([[5, 6], [3, 9], [5, 12], [7, 9]], 0xe8394f); P.ball(16, 10, 6, 5, [0xd8a0b8, 0xfff0f6, 0xffffff, 0xffffff]); P.rect(11, 6, 11, 2, 0xd8a0b8); P.ell(22, 10, 2, 2.5, -1); P.set(22, 9, 0xd8a0b8); P.set(22, 11, 0xd8a0b8); P.rect(13, 7, 7, 1, 0xa86a3a); return P.outline(0.5); },
  kanzashi() { const P = new Pix(22, 22); P.ox = 1; P.oy = 1; P.line(3, 20, 15, 6, 0xd8a040); P.line(4, 20, 16, 6, 0xa87a2a); for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; P.ball(16 + Math.cos(a) * 3.5, 6 + Math.sin(a) * 3.5, 2.2, 2.2, [0xd86a90, 0xff9ac0, 0xffd0e4, 0xffffff]); } P.ball(16, 6, 1.5, 1.5, pal(0xffd040)); P.line(13, 9, 13, 15, 0xffd040); P.ball(13, 16, 1.2, 1.2, pal(0xd8243a)); return P.outline(0.5); },
  towel() { const P = new Pix(26, 16); P.ox = 1; P.oy = 1; P.rect(1, 3, 23, 10, 0xff7eb6); for (let x = 1; x < 24; x += 2) { P.set(x, 13, 0xffffff); P.set(x, 2, 0xffffff); } P.rect(4, 5, 3, 6, 0x1a1626); P.rect(9, 5, 3, 6, 0x1a1626); P.rect(14, 6, 2, 4, 0x1a1626); P.rect(18, 5, 3, 6, 0x1a1626); return P.outline(0.5); },
  mission() { const P = new Pix(20, 24); P.ox = 1; P.oy = 1; P.rect(1, 1, 17, 21, 0xfff4dc); P.rect(1, 1, 17, 4, 0x3a98c8); for (let y = 8; y < 20; y += 3) { P.rect(4, y, 2, 2, 0xe8394f); P.rect(7, y, 9, 1, 0x8a8494); } return P.outline(0.5); },
  emono() { const P = new Pix(20, 20); P.ox = 1; P.oy = 1; P.rect(2, 7, 15, 11, (x) => (x === 9 || x === 10 ? 0xffd040 : 0xd8303a)); P.rect(1, 5, 17, 3, (x) => (x === 9 || x === 10 ? 0xffd040 : 0xe8505a)); P.ball(6, 3, 3, 2, pal(0xffd040)); P.ball(13, 3, 3, 2, pal(0xffd040)); return P.outline(0.5); },
  nurse() { const P = new Pix(22, 14); P.ox = 1; P.oy = 1; P.poly([[1, 12], [4, 2], [17, 2], [20, 12]], (x, y) => (y > 9 ? 0xe8e4f0 : WH)); P.rect(9, 4, 3, 6, 0xff7eb6); P.rect(7, 6, 7, 2, 0xff7eb6); return P.outline(0.5); },
  redpick() { const P = new Pix(16, 18); P.ox = 1; P.oy = 1; P.poly([[1, 2], [14, 2], [7.5, 16]], (x, y) => (y < 5 ? 0xff6a6a : 0xd8202a)); P.set(4, 4, WH); return P.outline(0.5); },
  bball() { const P = new Pix(18, 18); P.ox = 1; P.oy = 1; P.ball(8, 8, 8, 8, [0xc8c4d8, 0xf4f2fa, 0xffffff, 0xffffff]); for (let y = 2; y < 15; y++) { P.set(3 + Math.round(Math.sin(y * 0.4) * 1.5), y, 0xe8394f); P.set(13 - Math.round(Math.sin(y * 0.4) * 1.5), y, 0xe8394f); } return P.outline(0.5); },
  bus() { const P = new Pix(28, 18); P.ox = 1; P.oy = 1; box(P, 1, 2, 25, 11, 0xff9ac0); P.rect(1, 9, 25, 2, 0xffffff); for (let x = 4; x < 22; x += 5) P.rect(x, 4, 4, 4, 0x9ad0ff); P.ball(6, 14, 2.5, 2.5, [0x1a1626, 0x3a3644, 0x6a6678, 0xffffff]); P.ball(20, 14, 2.5, 2.5, [0x1a1626, 0x3a3644, 0x6a6678, 0xffffff]); return P.outline(0.5); },
  bento() { const P = new Pix(24, 18); P.ox = 1; P.oy = 1; box(P, 1, 2, 21, 13, 0x8a1420); P.rect(3, 4, 9, 9, 0xfff8fc); P.ball(7, 8, 1.5, 1.5, pal(0xd8243a)); P.rect(13, 4, 7, 4, 0xf0c060); P.rect(13, 9, 3, 4, 0x5ab848); P.rect(17, 9, 3, 4, 0xff9ac0); return P.outline(0.5); },
  sword() { const P = new Pix(28, 12); P.ox = 1; P.oy = 1; P.poly([[8, 4], [26, 2], [26, 4], [8, 7]], (x, y) => (y < 4 ? 0xffffff : 0xd0d8f0)); P.rect(5, 2, 3, 8, 0xffd040); P.rect(0, 4, 6, 3, 0x8a2a8a); for (let x = 10; x < 25; x += 4) P.set(x, 5, 0xff9ac0); return P.outline(0.5); },
  // weapons
  ttable() { const P = new Pix(24, 18); P.ox = 1; P.oy = 1; box(P, 1, 6, 21, 10, 0x2a2632); P.ell(9, 9, 7, 3, [0x0e0a14, 0x1a1626, 0x3a3644, 0x6a6678][1]); P.ell(9, 9, 2, 1, 0xe87a1a); P.line(17, 7, 13, 10, 0xc8c4d8); P.rect(17, 12, 3, 2, 0x8a3ad8); return P.outline(0.5); },
  disc() { const P = new Pix(14, 14); P.ball(6.5, 6.5, 6.5, 6.5, [0x0e0a14, 0x1a1626, 0x3a3644, 0x6a6678]); P.ball(6.5, 6.5, 2, 2, pal(0xe87a1a)); P.set(4, 3, 0x8a8698); return P; },
  discE() { const P = new Pix(16, 16); P.ball(7.5, 7.5, 7.5, 7.5, [0x3a1a6a, 0x8a3ad8, 0xc070ff, 0xffffff]); P.ball(7.5, 7.5, 2.5, 2.5, pal(0xffa040)); return P; },
  para() { const P = new Pix(24, 22); P.ox = 1; P.oy = 1; P.ell(11, 8, 11, 7, (x, y, nx, ny) => ny > 0.3 ? -1 : (((x + 1) >> 2) % 2 ? 0xffc0d8 : 0xfff4f8)); for (let x = 1; x < 22; x += 2) P.set(x, 9, 0xffffff); P.line(11, 2, 11, 20, 0xa86a8a); P.set(10, 20, 0xa86a8a); P.set(9, 19, 0xa86a8a); return P.outline(0.5); },
  paraE() { const P = new Pix(26, 24); P.ox = 1; P.oy = 1; P.ell(12, 9, 12, 8, (x, y, nx, ny) => ny > 0.3 ? -1 : (((x + 1) >> 2) % 2 ? 0x1a1420 : 0x8a2a5a)); for (let x = 1; x < 24; x += 2) P.set(x, 10, 0xffffff); P.line(12, 2, 12, 22, 0xffd040); P.ball(12, 1, 1.5, 1.5, pal(0xffd040)); return P.outline(0.5); },
  hlock() { const P = new Pix(22, 20); P.ox = 1; P.oy = 1; P.ball(6, 6, 5, 5, [0xa8102a, 0xe8304a, 0xff7a8a, 0xffd0d8]); P.ball(14, 6, 5, 5, [0xa8102a, 0xe8304a, 0xff7a8a, 0xffd0d8]); P.poly([[1, 8], [19, 8], [10, 18]], 0xe8304a); P.rect(8, 7, 4, 5, 0xffd040); P.set(10, 9, EYE); return P.outline(0.5); },
  hlockE() { const P = new Pix(24, 22); P.ox = 1; P.oy = 1; P.ball(6, 6, 6, 6, [0xa81070, 0xff40a0, 0xff9ad0, 0xffffff]); P.ball(16, 6, 6, 6, [0xa81070, 0xff40a0, 0xff9ad0, 0xffffff]); P.poly([[0, 8], [22, 8], [11, 20]], 0xff40a0); P.rect(9, 6, 5, 6, 0xffd040); return P.outline(0.5); },
  koma() { const P = new Pix(14, 16); P.ox = 1; P.oy = 1; P.poly([[6, 0], [11, 3], [12, 14], [0, 14], [1, 3]], (x, y) => (x < 3 ? 0xf0d0a0 : 0xd8b078)); P.rect(5, 5, 3, 1, 0x1a1210); P.rect(6, 5, 1, 6, 0x1a1210); P.rect(4, 10, 5, 1, 0x1a1210); return P.outline(0.5); },
  whis() { const P = new Pix(22, 14); P.ox = 1; P.oy = 1; P.ball(13, 7, 6, 5, [0x8a8494, 0xc8c4d8, 0xe8e4f0, 0xffffff]); P.rect(1, 4, 10, 4, 0xc8c4d8); P.rect(1, 4, 10, 1, WH); P.ball(14, 7, 1.5, 1.5, pal(0x3a3644)); P.line(19, 4, 21, 1, 0xd8303a); return P.outline(0.5); },
  bellE() { const P = new Pix(20, 22); P.ox = 1; P.oy = 1; P.ball(9, 10, 8, 8, [0xa8782a, 0xe8b83a, 0xffe070, 0xfff8c0]); P.rect(1, 15, 17, 3, 0xa8782a); P.ball(9, 19, 2, 2, pal(0x3a3644)); P.rect(8, 0, 3, 3, 0x5a5e6a); return P.outline(0.5); },
  syr() { const P = new Pix(24, 12); P.ox = 1; P.oy = 1; P.rect(4, 3, 13, 5, (x, y) => (y === 3 ? WH : 0xff7eb6)); P.rect(1, 2, 3, 7, 0x6ac0d8); P.rect(17, 5, 5, 1, 0xc8c4d8); P.poly([[4, 3], [1, 0], [4, 1]], 0xffd040); P.poly([[4, 8], [1, 11], [4, 10]], 0xffd040); return P.outline(0.5); },
  syrE() { const P = new Pix(26, 14); P.ox = 1; P.oy = 1; P.rect(4, 3, 15, 7, (x, y) => (y === 3 ? WH : 0xffd040)); P.rect(1, 2, 3, 9, 0xff7eb6); P.rect(19, 6, 5, 1, 0xc8c4d8); P.poly([[4, 3], [0, 0], [4, 1]], 0xff7eb6); P.poly([[4, 10], [0, 13], [4, 12]], 0xff7eb6); return P.outline(0.5); },
  chaka() { const P = new Pix(24, 18); P.ox = 1; P.oy = 1; P.rect(2, 3, 16, 6, 0x3a6ad0); P.rect(2, 3, 16, 1, 0x8ab8ff); P.rect(18, 4, 4, 3, 0x2a4a9a); P.rect(4, 9, 5, 7, 0xff7eb6); P.rect(9, 9, 3, 3, 0x2a4a9a); P.ball(7, 1, 2, 1.5, pal(0x6ec3ff)); return P.outline(0.5); },
  danbira() { const P = new Pix(28, 12); P.ox = 1; P.oy = 1; P.poly([[7, 3], [25, 1], [26, 3], [7, 7]], (x, y) => (y < 4 ? 0xffffff : 0xc8d0e0)); P.rect(4, 2, 3, 7, 0xffd040); P.rect(0, 4, 5, 3, 0x8a1420); return P.outline(0.5); },
  chakaE() { const P = new Pix(26, 20); P.ox = 1; P.oy = 1; P.rect(2, 3, 16, 6, 0x1a1626); P.rect(2, 3, 16, 1, 0xffd040); P.rect(18, 4, 4, 3, 0xffd040); P.rect(4, 9, 5, 8, 0xd8303a); P.poly([[10, 12], [24, 10], [24, 12], [10, 15]], 0xffffff); return P.outline(0.5); }
};

export function addPhase6(add) {
  for (const k in PR) { if (k === 'ctree' || k === 'momiji' || k === 'fusuma') { add(k + '0', PR[k](0)); add(k + '1', PR[k](1)); } else add(k, PR[k]()); }
  for (const k in F) for (let i = 0; i < 4; i++) add(k + i, F[k](i));
  for (const k in B) for (let i = 0; i < 4; i++) add(k + i, B[k](i));
  for (const k in S) add(k, S[k]());
  for (const k in I) add(k, I[k]());
}
// a black hamster with a sapphire shine (漆黒のブルーサファイア), walk frames + blink/dash/hurt like Kyon's sprite set
export function sapphire(f) {
  const P = new Pix(26, 24); P.ox = 1; P.oy = 2; const b = f.dash ? 0 : [0, -1, 0, -1][f.p || 0], l = [0, 1, 0, -1][f.p || 0];
  const K = [0x0e0a18, 0x1e1a34, 0x2e3a6a, 0x5a7ad8];
  P.ball(12, 12 + b, 10, 8, K, { t0: -0.1, t1: 0.5 }); P.ball(5, 4 + b, 3, 3, K); P.ball(19, 4 + b, 3, 3, K); P.set(5, 4 + b, 0x6a8aff); P.set(19, 4 + b, 0x6a8aff);
  P.ell(12, 15 + b, 6, 4, 0x3a4a8a); if (f.blink) { P.rect(7, 10 + b, 3, 1, 0x9ab8ff); P.rect(15, 10 + b, 3, 1, 0x9ab8ff); } else { P.rect(7, 9 + b, 3, 3, 0x9ab8ff); P.set(8, 9 + b, WH); P.rect(15, 9 + b, 3, 3, 0x9ab8ff); P.set(16, 9 + b, WH); }
  P.set(12, 13 + b, 0xff9ab8); P.set(6, 13 + b, 0x6a4aa8); P.set(18, 13 + b, 0x6a4aa8); if (f.hurt) { P.rect(6, 9 + b, 4, 1, 0xffffff); P.rect(15, 9 + b, 4, 1, 0xffffff); }
  P.ball(8 - l, 20, 2.5, 1.5, K); P.ball(16 + l, 20, 2.5, 1.5, K); P.ball(20, 2 + b, 1.8, 1.8, [0x1a3a9a, 0x3a6ae8, 0x9ac0ff, 0xffffff]); // a little sapphire
  return P.outline(0.62);
}
