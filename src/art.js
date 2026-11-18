import { addPhase2, zooGround, snowGround, nightGround } from './art2.js';
import { addPhase4, gardenGround } from './art4.js';
import { addPhase5, chinaGround } from './art5.js';
import { addPhase6, sapphire, GROUNDS6 } from './art6.js';
import { addPhase3, berryCoin } from './art3.js';
// Procedural pixel art: shaded "balls", polygons, selective auto-outline, packed into one atlas.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const OUT = 0x24122a;
export function mixc(a, b, t) {
  const ar = a >> 16 & 255, ag = a >> 8 & 255, ab = a & 255, br = b >> 16 & 255, bg = b >> 8 & 255, bb = b & 255;
  return (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t);
}
const lum = c => ((c >> 16 & 255) * 3 + (c >> 8 & 255) * 6 + (c & 255)) / 10;

export class Pix {
  constructor(w, h) { this.w = w; this.h = h; this.c = new Int32Array(w * h).fill(-1); this.ox = 0; this.oy = 0; }
  set(x, y, col) { x = Math.floor(x + this.ox); y = Math.floor(y + this.oy); if (x >= 0 && y >= 0 && x < this.w && y < this.h && col >= 0) this.c[y * this.w + x] = col; }
  get(x, y) { x = Math.floor(x + this.ox); y = Math.floor(y + this.oy); return (x >= 0 && y >= 0 && x < this.w && y < this.h) ? this.c[y * this.w + x] : -1; }
  del(x, y) { x = Math.floor(x + this.ox); y = Math.floor(y + this.oy); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.c[y * this.w + x] = -1; }
  rect(x, y, w, h, col) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, typeof col === 'function' ? col(x + i, y + j, i, j) : col); }
  ell(cx, cy, rx, ry, col) {
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
      const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry; if (nx * nx + ny * ny <= 1) this.set(x, y, typeof col === 'function' ? col(x, y, nx, ny) : col);
    }
  }
  // shaded sphere-ish blob. pal = [dark, base, light, (highlight)]
  ball(cx, cy, rx, ry, pal, o) {
    o = o || {}; let lx = o.lx ?? -0.55, ly = o.ly ?? -0.72, lz = o.lz ?? 0.42; const n = Math.hypot(lx, ly, lz); lx /= n; ly /= n; lz /= n;
    const dith = o.dith ?? 0.2;
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
      const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry, r2 = nx * nx + ny * ny; if (r2 > 1) continue;
      if (o.clip && !o.clip(x, y)) continue;
      const nz = Math.sqrt(1 - r2); let d = nx * lx + ny * ly + nz * lz;
      d += (BAYER[((y + 64) & 3) * 4 + ((x + 64) & 3)] / 16 - 0.5) * dith;
      let i = d < (o.t0 ?? 0.08) ? 0 : d < (o.t1 ?? 0.6) ? 1 : 2; if (pal.length > 3 && d > (o.t2 ?? 0.88)) i = 3;
      this.set(x, y, pal[i]);
    }
  }
  poly(pts, col) {
    let y0 = Infinity, y1 = -Infinity; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const yc = y + .5, xs = [];
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y, typeof col === 'function' ? col(x, y) : col);
    }
  }
  line(x0, y0, x1, y1, col) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) this.set(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), col); }
  // selective outline: empty pixels touching art get a darkened version of the neighbour colour
  outline(t = 0.68) {
    const w = this.w, h = this.h, s = this.c.slice();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (s[i] >= 0) continue; let nb = -1, nl = 1e9;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; const v = s[Y * w + X]; if (v >= 0 && lum(v) < nl) { nl = lum(v); nb = v; } }
      if (nb >= 0) this.c[i] = mixc(nb, OUT, t);
    }
    return this;
  }
  // inner contour: pixels of art bordering a different "mask" get darkened (used sparingly)
  toCanvas() {
    const cv = document.createElement('canvas'); cv.width = this.w; cv.height = this.h;
    const x = cv.getContext('2d'), im = x.createImageData(this.w, this.h);
    for (let i = 0; i < this.c.length; i++) { const v = this.c[i]; if (v < 0) continue; im.data[i * 4] = v >> 16 & 255; im.data[i * 4 + 1] = v >> 8 & 255; im.data[i * 4 + 2] = v & 255; im.data[i * 4 + 3] = 255; }
    x.putImageData(im, 0, 0); return cv;
  }
}

// ---------------- palettes ----------------
const HAIR = [0x3a1f1a, 0x5c3426, 0x7e4b35, 0xb07a58];
const SKIN = [0xeeb39c, 0xffdcca, 0xfff1e6];
const PINK = [0xd35f8c, 0xff98bd, 0xffc6db, 0xffe8f1];
const WHT = [0xc9b8d4, 0xf3ecf7, 0xffffff];
const BERRY = [0xa3203c, 0xe63a52, 0xff7e8a, 0xffd0d0];
const LEAF = [0x2b6a35, 0x45964a, 0x6cc05a, 0xa9e27c];
const SEAL = [0xb4c0d4, 0xe8eef7, 0xffffff];
const CROW = [0x17152a, 0x2c2a48, 0x48477a, 0x7676b8];
const WOOD = [0x5a3420, 0x7f4c2e, 0xa86e42, 0xc9935e];
const STONE = [0x5f6378, 0x8d93aa, 0xbcc2d4, 0xe4e8f0];
const GOLD = [0xa8682a, 0xe8a83a, 0xffd860, 0xfff4b0];

// ---------------- Kyoka ----------------
function kyoka(f) { // f: {p: walk phase 0-3, dash, hurt, blink, idle} + outfit {hair, dress, lace, acc, shoe, head, apron, petti, check}
  const P = new Pix(34, 52); P.ox = 1; P.oy = 2;
  const H = f.hair || HAIR, D = f.dress || PINK, Wt = f.lace || WHT, A = f.acc || BERRY, SHO = f.shoe || [0x3b2236, 0x6a3a58, PINK[0]];
  const st = f.dash ? 0 : [0, 1, 0, -1][f.p || 0];
  const bob = f.dash ? 0 : ((f.p || 0) % 2 === 0 ? -1 : 0);
  const lean = f.dash ? 2 : f.hurt ? -1 : 0;
  const sway = f.dash ? -2 : [0, 1, 0, -1][f.p || 0];
  const U = (x) => x + lean; // upper-body x
  // back hair curtain
  const hb = f.dash ? -2 : 0;
  P.ball(U(16) + hb * 0.5, 15 + bob, 10.5, 10, H, { t1: 0.55 });
  for (let y = 18; y <= 32; y++) {
    const k = (y - 18) / 14, l = U(5.5) + hb * k * 1.5 + k * 1.2, r = U(26.5) + hb * k * 1.5 - k * 1.2;
    for (let x = Math.floor(l); x <= r; x++) {
      const end = 30 + ((x * 7) % 3) + (Math.abs(x - U(16)) < 4 ? -3 : 0);
      if (y > end) continue;
      const edge = (x - l) / (r - l); P.set(x, y + bob, edge < 0.18 || edge > 0.82 ? H[0] : (edge < 0.35 ? H[1] : H[0]));
    }
  }
  // legs + shoes
  let lx = 12 + st, rx = 18 - st, ly = 46 - (st > 0 ? 1 : 0), ry = 46 - (st < 0 ? 1 : 0);
  if (f.dash) { lx = 8; ly = 45; rx = 21; ry = 43; }
  for (const [x, yb, back] of [[lx, ly, 1], [rx, ry, 0]]) {
    P.rect(x, yb - 8, 3, 7, (X) => X === x + 2 ? Wt[0] : Wt[back ? 0 : 1]);
    P.rect(x, yb - 8, 3, 1, D[1]); // sock frill
    P.rect(x - 1, yb - 1, 5, 2, SHO[0]); P.set(x, yb - 1, SHO[1]); P.rect(x - 1, yb - 2, 5, 1, SHO[2]);
    P.set(x + 3, yb, 0x24121f);
  }
  // petticoat lace
  if (f.petti !== false) P.poly([[U(10), 30], [U(22), 30], [27 + sway, 40], [5 + sway, 40]], (x, y) => (x + y) % 5 === 0 ? Wt[0] : Wt[1]);
  if (f.petti !== false) for (let x = 5 + sway; x < 27 + sway; x++) if (x % 3 !== 0) P.set(x, 41, x % 3 === 1 ? Wt[1] : Wt[0]);
  // skirt
  const sk = [[U(11), 27], [U(21), 27], [26 + sway, 37], [6 + sway, 37]];
  P.poly(sk, (x, y) => {
    const t = (y - 27) / 10, L = U(11) + (6 + sway - U(11)) * t, R = U(21) + (26 + sway - U(21)) * t, e = (x - L) / (R - L);
    const pleat = Math.abs(((x - U(16) - (e - 0.5) * t * 4) % 4 + 4) % 4 - 2) < 0.5 && y > 29;
    if (pleat) return D[0];
    return e < 0.2 ? D[2] : e > 0.78 ? D[0] : D[1];
  });
  if (f.glitter) for (let y = 27; y < 42; y++) for (let x = 0; x < 34; x++) { const c = P.get(x, y); if (c >= 0 && (x * 7 + y * 13) % 11 === 0) P.set(x, y, (x + y) % 3 ? 0xffffff : 0xffd6f0); }
  // ribbon band + lace + hem frill
  for (let x = 6; x <= 27; x++) { const y = 33; P.get(x, y) >= 0 && P.set(x, y, A[1]); P.get(x, y + 1) >= 0 && P.set(x, y + 1, (x % 2) ? Wt[2] : D[1]); }
  for (let x = 5 + sway; x < 27 + sway; x++) { P.set(x, 37, Wt[1]); P.set(x, 38, (x % 3 === 2) ? -1 : Wt[x % 3 ? 1 : 0]); }
  // apron
  if (f.apron !== false) { P.poly([[U(13), 28], [U(19), 28], [U(20.5) + sway * 0.5, 36], [U(11.5) + sway * 0.5, 36]], (x, y) => y === 35 ? Wt[0] : Wt[(x + y) % 7 === 0 ? 1 : 2]);
  P.rect(U(15), 30, 3, 2, A[1]); P.set(U(15), 30, A[2]); P.set(U(16), 29, LEAF[2]); P.set(U(16), 31, A[0]); }
  if (f.belt) { P.rect(U(11), 27, 11, 2, (x, y) => y === 27 ? 0xffffff : 0xd8d0e0); P.rect(U(15), 27, 3, 2, (x) => x === U(15) ? 0xfff4b0 : 0xe8a83a); }
  // bodice
  P.rect(U(11), 20 + bob, 11, 8, (x) => x <= U(12) ? D[2] : x >= U(20) ? D[0] : D[1]);
  for (const [x, y] of [[15, 24], [17, 24], [16, 25], [15, 26], [17, 26]]) P.set(U(x), y + bob, Wt[2]);
  // puffy sleeves + arms
  const aL = f.dash ? -2 : [0, 1, 0, 0][f.p || 0], aR = f.dash ? 1 : [0, 0, 0, 1][f.p || 0];
  P.ball(U(10), 22.5 + bob, 3, 2.8, D);
  P.ball(U(22), 22.5 + bob, 3, 2.8, D);
  P.rect(U(9), 25 + bob + aL, 2, 4, (x) => x === U(10) ? SKIN[0] : SKIN[1]); P.rect(U(9), 25 + bob + aL, 2, 1, Wt[2]);
  P.rect(U(22), 25 + bob + aR, 2, 4, (x) => x === U(23) ? SKIN[0] : SKIN[1]); P.rect(U(22), 25 + bob + aR, 2, 1, Wt[2]);
  P.ball(U(9.8), 29.5 + bob + aL, 1.4, 1.4, SKIN); P.ball(U(23.2), 29.5 + bob + aR, 1.4, 1.4, SKIN);
  // collar & neck bow
  P.ell(U(13.5), 21 + bob, 2.8, 1.6, Wt[2]); P.ell(U(18.5), 21 + bob, 2.8, 1.6, Wt[2]);
  P.rect(U(15), 21 + bob, 3, 2, A[1]); P.set(U(16), 21 + bob, A[0]); P.set(U(14), 22 + bob, A[1]); P.set(U(18), 22 + bob, A[1]);
  if (f.check) for (let y = 18; y < 40; y++) for (let x = 0; x < 34; x++) { const c = P.get(x, y), i = D.indexOf(c); if (i >= 0 && i < 3 && ((x >> 1) + (y >> 1)) % 2) P.set(x, y, mixc(c, f.check, 0.35)); }
  // head
  P.ball(U(16), 13.5 + bob, 8.4, 7.8, SKIN, { t0: -0.1 });
  // eyes
  const ey = 13 + bob;
  const eye = (x0, mirror) => {
    if (f.hurt) { for (let i = 0; i < 3; i++) { P.set(x0 + (mirror ? 2 - i : i), ey + 1 + (i === 1 ? 1 : i === 0 ? 0 : 2) - 0, 0x2b1420); } P.set(x0 + 1, ey + 1, 0x2b1420); P.set(x0 + 1, ey + 3, 0x2b1420); return; }
    if (f.blink) { P.rect(x0, ey + 2, 3, 1, 0x2b1420); P.set(mirror ? x0 + 3 : x0 - 1, ey + 1, 0x2b1420); return; }
    P.rect(x0 - (mirror ? 0 : 1), ey, 4, 1, 0x2b1420); // lashes
    P.rect(x0, ey + 1, 3, 3, 0x7a3346);
    P.rect(x0, ey + 3, 3, 1, 0xd77f86); P.set(x0 + 1, ey + 2, 0x4a1a2a);
    P.set(x0, ey + 1, 0xffffff); P.set(x0 + 2, ey + 3, 0xffd6d6);
  };
  eye(U(11), false); eye(U(19), true);
  P.set(U(10), ey + 4, 0xff9fb2); P.set(U(11), ey + 4, 0xffb7c4); P.set(U(21), ey + 4, 0xffb7c4); P.set(U(22), ey + 4, 0xff9fb2);
  if (f.hurt) { P.rect(U(15), ey + 5, 2, 2, 0xb23a52); P.set(U(15), ey + 5, 0x7a1f34); }
  else { P.set(U(15), ey + 5, 0xc0485e); P.set(U(16), ey + 5, 0xc0485e); P.set(U(14), ey + 4, 0xd77f86); P.set(U(17), ey + 4, 0xd77f86); }
  // bangs + side locks
  const bang = [0, 0, 0, 0, 0, 0, 0, 13, 12, 11, 12, 13, 11, 10, 12, 11, 10, 12, 11, 13, 12, 11, 12, 13, 13, 0, 0];
  P.ball(U(16), 9 + bob, 9.2, 6.4, H, { clip: (x, y) => { const b = bang[x - lean] || 0; return y - bob < b; }, t1: 0.5 });
  for (const side of [-1, 1]) {
    const x0 = U(16) + side * 7.8;
    for (let y = 8; y <= 27; y++) {
      const w = y < 22 ? 2 : (y < 25 ? 2 : 1), cx = x0 + side * (y > 22 ? Math.sin((y - 22) * 0.9) : 0) - (f.dash ? (y - 8) * 0.06 : 0);
      for (let i = 0; i < w + 1; i++) P.set(cx - side * i + (side < 0 ? 0 : 0), y + bob, i === 0 ? H[0] : H[1]);
    }
  }
  for (let x = U(10); x <= U(22); x++) { const y = Math.round(6.2 + Math.pow((x - U(16)) / 6.5, 2) * 2.2); if (x % 4 !== 1) P.set(x, y + bob, H[3]); }
  // lace headband + bow + strawberry pin
  if (!f.head || f.head === 'lace') {
  for (let x = U(8); x <= U(24); x++) { P.set(x, 4 + bob + (Math.abs(x - U(16)) > 6 ? 1 : 0), Wt[2]); if (x % 2) P.set(x, 5 + bob + (Math.abs(x - U(16)) > 6 ? 1 : 0), Wt[0]); }
  P.ball(U(10.5), 1.8 + bob, 4.2, 2.8, D, { t0: -0.05 }); P.ball(U(21.5), 1.8 + bob, 4.2, 2.8, D, { t0: -0.05 });
  P.set(U(9), 2 + bob, D[0]); P.set(U(23), 2 + bob, D[0]);
  P.ball(U(16), 2.2 + bob, 1.9, 1.9, A); P.set(U(14), 4 + bob, A[1]); P.set(U(18), 4 + bob, A[1]);
  P.ball(U(25), 7 + bob, 1.7, 1.8, A); P.set(U(25), 5 + bob, LEAF[2]); P.set(U(24), 5 + bob, LEAF[1]); P.set(U(25), 7 + bob, A[3]);
  } else if (f.head === 'clip') {
    P.rect(U(21), 4 + bob, 4, 2, A[1]); P.set(U(21), 4 + bob, A[2]); P.set(U(24), 5 + bob, A[0]); P.rect(U(8), 6 + bob, 3, 2, A[1]); P.set(U(8), 6 + bob, A[2]);
  } else if (f.head === 'buns') { // twin buns with small ribbons + a little tiara
    for (const bx of [U(8.5), U(23.5)]) { P.ball(bx, 3.5 + bob, 3.6, 3.4, H, { t1: 0.5 }); P.ball(bx + (bx < U(16) ? 2.5 : -2.5), 6 + bob, 1.6, 1.2, A); }
    for (let x = U(13); x <= U(19); x++) P.set(x, 5 + bob, x % 2 ? 0xffffff : 0xb8e4ff); P.set(U(16), 4 + bob, 0xffffff); P.set(U(16), 3 + bob, 0x7ec0f0);
  } else if (f.head === 'goth') { // black lace headdress with a dark-red rose
    for (let x = U(8); x <= U(24); x++) { const yy = 4 + bob + (Math.abs(x - U(16)) > 6 ? 1 : 0); P.set(x, yy, Wt[0]); P.set(x, yy - 1, x % 2 ? Wt[1] : Wt[0]); if (x % 3 === 0) P.set(x, yy - 2, Wt[1]); }
    P.ball(U(22), 3 + bob, 2.4, 2.2, A); P.set(U(22), 3 + bob, A[0]); P.set(U(20), 4 + bob, 0x3a6a3a);
  } else if (f.head === 'bunny') { // DJきょん: tall black bunny ears with a pumpkin-orange clip
    for (const bx of [U(11), U(21)]) { P.ell(bx, -2 + bob, 2.4, 6, 0x1a1626); P.ell(bx, -1.5 + bob, 1, 4.2, 0xff9ac0); }
    for (let x = U(9); x <= U(23); x++) P.set(x, 4 + bob + (Math.abs(x - U(16)) > 6 ? 1 : 0), 0x1a1626); P.ball(U(23), 6 + bob, 1.8, 1.6, [0xa84a0a, 0xe87a1a, 0xffb060, 0xffe0b0]);
  } else if (f.head === 'cap') { // 駅長きょん: a navy station-master cap with a gold band
    P.ell(U(16), 3 + bob, 9, 4, (x, y, nx, ny) => ny < 0.2 ? 0x1a2a5a : 0x2a3a7a); P.rect(U(7), 5 + bob, 19, 1, 0xffd040); P.rect(U(8), 6 + bob, 17, 1, 0x0e0a14); P.ball(U(16), 2 + bob, 1.6, 1.6, [0xa8782a, 0xe8b83a, 0xffe070, 0xfff8c0]);
  } else if (f.head === 'kanzashi') { // 町娘 / 和ロリ: a flower hairpin with a dangling bead
    for (let x = U(8); x <= U(24); x++) P.set(x, 4 + bob + (Math.abs(x - U(16)) > 6 ? 1 : 0), A[1]);
    for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; P.ball(U(22) + Math.cos(a) * 2.2, 3 + bob + Math.sin(a) * 2.2, 1.4, 1.4, A); } P.set(U(22), 3 + bob, 0xffd040); P.line(U(20), 5 + bob, U(20), 9 + bob, 0xffd040); P.set(U(20), 10 + bob, 0xd8243a);
  } else if (f.head === 'bigbow') { // 甘ロリ: a big pastel bow
    for (let x = U(8); x <= U(24); x++) P.set(x, 4 + bob + (Math.abs(x - U(16)) > 6 ? 1 : 0), Wt[2]);
    P.ball(U(11), 1 + bob, 4.6, 3.2, A); P.ball(U(21), 1 + bob, 4.6, 3.2, A); P.ball(U(16), 1.5 + bob, 2, 2, A); P.set(U(16), 1 + bob, 0xffffff);
  } else if (f.head === 'shades') { // くみちょーきょん: sunglasses pushed up on the head and a red ribbon
    for (let x = U(8); x <= U(24); x++) P.set(x, 4 + bob + (Math.abs(x - U(16)) > 6 ? 1 : 0), 0x1a1626);
    P.rect(U(10), 2 + bob, 5, 3, 0x0e0a14); P.rect(U(17), 2 + bob, 5, 3, 0x0e0a14); P.set(U(11), 2 + bob, 0x6a6678); P.set(U(18), 2 + bob, 0x6a6678); P.ball(U(24), 6 + bob, 1.8, 1.6, A);
  } else if (f.head === 'visor') {
    for (let x = U(8); x <= U(24); x++) { const yy = 5 + bob + (Math.abs(x - U(16)) > 6 ? 1 : 0); P.set(x, yy, D[1]); P.set(x, yy - 1, D[2]); }
    P.rect(U(14), 1 + bob, 5, 4, (x, y) => y === 1 + bob ? GOLD[3] : GOLD[2]); P.set(U(16), 2 + bob, A[1]); P.set(U(16), 3 + bob, A[1]);
  }
  return P.outline();
}

// ---------------- seal (harp seal pup) ----------------
function seal(fr, crown) {
  const P = new Pix(32, crown ? 29 : 22); P.ox = 2; P.oy = crown ? 9 : 2;
  const sq = [0, 1, 0, -1][fr], rx = 10 + sq * 0.6, ry = 6.3 - sq * 0.5, by = 11 + sq * 0.5;
  P.poly([[5, by], [1, by - 2.5], [2, by + 1], [1, by + 4], [5, by + 2.5]], (x, y) => y < by + 1 ? SEAL[0] : 0xa5b1c6); // tail flippers
  P.ball(12.5, by + 0.8, rx - 0.5, ry + 0.4, SEAL, { t0: -0.15, t1: 0.45 });
  P.ball(18.5, by - 2 + sq * 0.3, 7.8, 7.2 - sq * 0.3, SEAL, { t0: -0.2, t1: 0.42 });
  P.ell(14, by + 4.2, 6, 1.6, 0xd6deea); // belly shade
  const fy = fr === 3 ? by + 2 : by + 4.5;
  P.ball(13, fy, 3.2, 1.6, [0x98a6bd, 0xb9c4d6, 0xd6deea]); // front flipper
  const hy = by - 2 + sq * 0.3;
  for (const ex of [15, 21]) { P.rect(ex, hy - 3, 3, 3, 0x1a1626); P.rect(ex + 0.5, hy - 4, 2, 1, 0x1a1626); P.set(ex + 0.5, hy - 1 + 0.5, 0x1a1626); P.set(ex, hy - 3, 0xffffff); P.set(ex + 1, hy - 3, 0xffffff); P.set(ex + 2, hy - 1, 0x5a6a8a); }
  P.rect(18, hy + 1, 2, 1, 0x3a2a3a); P.set(18, hy + 2, 0x7a5a6a); P.set(19, hy + 2, 0x7a5a6a);
  P.set(14.5, hy + 1, 0xffb6c8); P.set(23.5, hy + 1, 0xffb6c8); P.set(14, hy + 1, 0xffc8d4); P.set(24, hy + 1, 0xffc8d4);
  if (crown) { const cy = hy - 8; P.poly([[14, cy + 5], [14, cy], [16.5, cy + 3], [18.5, cy - 2], [20.5, cy + 3], [23, cy], [23, cy + 5]], (x, y) => y < cy + 2 ? GOLD[3] : GOLD[2]); P.set(18.5, cy + 3, BERRY[1]); }
  P.outline(0.55);
  // whiskers on top of outline
  for (const [x, y] of [[12, hy + 1], [11, hy + 2], [25, hy], [26, hy - 0.5], [25, hy + 2], [26, hy + 2.5]]) P.set(x, y, 0x8e9ab2);
  return P;
}

// ---------------- crow (scale s, king adds crown/cape) ----------------
function crow(fr, s, king) {
  const W = Math.ceil(28 * s), H = Math.ceil(24 * s) + (king ? 14 : 0);
  const P = new Pix(W, H); P.ox = 1; P.oy = 1 + (king ? 12 : 0);
  const S = v => v * s;
  if (king) P.poly([[S(6), S(9)], [S(16), S(8)], [S(18), S(21)], [S(3), S(22)]], (x, y) => (x + y) % 6 === 0 ? 0x8a1a30 : (x < S(8) ? 0xd43a52 : 0xb02840)); // cape
  P.poly([[S(2), S(12)], [S(8), S(10)], [S(9), S(15)], [S(3), S(16)]], CROW[1]); // tail
  P.line(S(3), S(13), S(8), S(12), CROW[2]);
  P.ball(S(12), S(13.5), S(7.2), S(5.8), CROW, { t1: 0.62 });
  P.ball(S(17), S(8.5), S(5.2), S(4.8), CROW, { t1: 0.58 });
  // beak
  P.poly([[S(21), S(7.5)], [S(25.5), S(9)], [S(21), S(10.6)]], (x, y) => y < S(9) ? 0xffc85a : 0xe0952e);
  // eye
  P.ball(S(18.5), S(7.5), S(1.6), S(1.7), [0xd8d8e8, 0xffffff, 0xffffff]); P.rect(S(19), S(7.2), Math.max(1, S(1)), Math.max(1, S(1.4)), 0x0d0b16);
  if (king) { P.line(S(16.5), S(5.2), S(20), S(6), 0x0d0b16); P.line(S(16.5), S(5.7), S(20), S(6.5), 0x0d0b16); }
  P.set(S(20.5), S(10.5), 0xff8fa8); P.set(S(20.5) + 1, S(10.5), 0xff8fa8);
  // legs
  for (const lx of [S(10), S(13.5)]) { P.rect(lx, S(19), Math.max(1, s * 0.8), S(2.5), 0xe0952e); P.rect(lx - S(0.8), S(21.2), S(2.4), Math.max(1, s * 0.7), 0xe0952e); }
  // wing
  const wings = [
    [[S(9), S(12)], [S(4), S(1)], [S(9), S(2)], [S(15), S(11)]],
    [[S(8), S(12)], [S(0), S(9)], [S(5), S(6)], [S(15), S(11)]],
    [[S(8), S(11)], [S(3), S(19)], [S(10), S(19)], [S(15), S(12)]],
    [[S(8), S(12)], [S(0), S(9)], [S(5), S(6)], [S(15), S(11)]]
  ][fr];
  P.poly(wings, (x, y) => ((x * 3 + y * 5) % 11 === 0) ? CROW[1] : CROW[2]);
  P.line(wings[0][0], wings[0][1], wings[1][0], wings[1][1], CROW[3]);
  if (king) {
    P.oy = 11;
    const cx = S(17) + 1, cw = 15, top = 0; // crown
    P.poly([[cx - cw / 2, 12], [cx - cw / 2, top + 4], [cx - 3.5, top + 8], [cx, top], [cx + 3.5, top + 8], [cx + cw / 2, top + 4], [cx + cw / 2, 12]], (x, y) => y > 9 ? GOLD[0] : x < cx - 2 ? GOLD[2] : GOLD[1]);
    for (const [x, y] of [[cx - cw / 2, top + 3], [cx, top - 1], [cx + cw / 2, top + 3]]) P.ball(x, y, 1.6, 1.6, GOLD);
    P.ball(cx, 9, 1.7, 1.7, [0x2a5ab8, 0x5a9aff, 0xc0e0ff]); P.ball(cx - 5, 10, 1.2, 1.2, BERRY); P.ball(cx + 5, 10, 1.2, 1.2, BERRY);
    P.oy = 13;
    for (let i = 0; i < 6; i++) P.ball(S(13) + i * S(1.1), S(16) + Math.sin(i) * 1.2, 1.2, 1.2, GOLD); // necklace
  }
  return P.outline(0.5);
}

// ---------------- caterpillar ----------------
function cater(fr) {
  const P = new Pix(34, 22); P.ox = 1; P.oy = 3;
  const C = [0x3f8a3a, 0x74c95a, 0xaee68a, 0xe4ffc8], H = [0x4f9a42, 0x8ad86a, 0xc4f29c, 0xf4ffe0];
  for (let i = 0; i < 4; i++) {
    const x = 4 + i * 5, cy = 12 + Math.sin((i + fr) * Math.PI / 2) * 1.3, r = 3.4 + i * 0.15;
    P.rect(x - 1, cy + r - 0.5, 1, 2, 0x2f6a2e); P.rect(x + 1, cy + r - 0.5, 1, 2, 0x2f6a2e);
    P.ball(x, cy, r, r, C);
    P.set(x, cy - 1.5, 0xffe066); P.set(x - 1, cy - 1.5, 0xfff2a0);
  }
  const hy = 10 + Math.sin((4 + fr) * Math.PI / 2) * 1;
  P.ball(25, hy, 5.4, 5.1, H, { t0: -0.1 });
  P.line(23, hy - 4, 21, hy - 8.5, 0x2f6a2e); P.line(27, hy - 4, 29, hy - 8.5, 0x2f6a2e);
  P.ball(21, hy - 9, 1.3, 1.3, BERRY); P.ball(29, hy - 9, 1.3, 1.3, BERRY);
  for (const ex of [22.5, 26.5]) { P.rect(ex, hy - 1.5, 2, 3, 0x1a1626); P.set(ex, hy - 1.5, 0xffffff); }
  P.set(22, hy + 2, 0xff9fb0); P.set(29, hy + 2, 0xff9fb0); P.set(25, hy + 2.5, 0x2f6a2e); P.set(26, hy + 2.5, 0x2f6a2e);
  return P.outline(0.55);
}

// ---------------- stink bug ----------------
function stink(fr) {
  const P = new Pix(26, 26); P.ox = 2; P.oy = 3;
  const SH = [0x356f34, 0x62ab52, 0x9cd677, 0xd8f5b0], HD = [0x2a5a2a, 0x4f8c42, 0x7ab862];
  const lg = fr % 2 ? 1 : -1;
  for (let i = 0; i < 3; i++) { const y = 10 + i * 3.5; P.line(4, y, 0, y + 2 + lg * (i % 2 ? 1 : -1), 0x2a4a2a); P.line(18, y, 22, y + 2 - lg * (i % 2 ? 1 : -1), 0x2a4a2a); }
  P.poly([[3, 9], [19, 9], [18, 17], [11, 22], [4, 17]], (x, y) => { const e = (x - 3) / 16; return e < 0.25 ? SH[2] : e > 0.75 ? SH[0] : SH[1]; });
  P.ball(11, 12, 7.5, 4.5, SH, { t1: 0.55 });
  P.poly([[8, 11], [14, 11], [11, 18]], SH[2]);
  P.line(11, 11, 11, 20, SH[0]);
  P.set(6, 14, 0xf0d860); P.set(16, 14, 0xf0d860); P.set(9, 17, 0xf0d860); P.set(13, 17, 0xf0d860);
  P.ball(11, 6.5, 4.4, 3.4, HD);
  P.line(9, 3.5, 6, -1 + (fr % 2), 0x2a4a2a); P.line(13, 3.5, 16, -1 + ((fr + 1) % 2), 0x2a4a2a);
  for (const ex of [8.5, 12.5]) { P.rect(ex, 5.5, 2, 2, 0x1a1626); P.set(ex, 5.5, 0xffffff); }
  P.set(7.5, 8, 0xff9fb0); P.set(15, 8, 0xff9fb0);
  return P.outline(0.55);
}

// ---------------- mole ----------------
function mole(fr) {
  const P = new Pix(30, 28); P.ox = 2; P.oy = 2;
  const pop = [0, 1, 2, 1][fr], cl = [0, -1, 0, 1][fr];
  const DIRT = [0x5a3a24, 0x86603e, 0xb08458, 0xcfa478], M = [0x4a3a5c, 0x735f88, 0xa08cb6, 0xcab8de];
  P.ball(13, 14 - pop, 8.2, 7.8, M, { t1: 0.55 });
  P.ell(13, 17 - pop, 5, 3, M[2]);
  P.ball(13, 12 - pop, 2.6, 2, [0xc04e6c, 0xff86a2, 0xffc6d4]);
  for (const ex of [9, 16]) { P.set(ex, 9 - pop, 0x1a1626); P.set(ex + 1, 8 - pop, 0x1a1626); P.set(ex + 2, 9 - pop, 0x1a1626); }
  P.set(8, 12 - pop, 0xff9fb0); P.set(18, 12 - pop, 0xff9fb0);
  for (const [cx, s] of [[4, -1], [22, 1]]) { P.ball(cx, 16 - pop + cl * s, 3, 2.4, [0xc8a898, 0xffe4d2, 0xffffff]); P.set(cx + s * 2, 15 - pop + cl * s, 0xa88878); }
  P.ball(13, 22, 12, 4.2, DIRT, { t1: 0.5 });
  for (const [x, y] of [[4, 21], [9, 23], [19, 22], [23, 23], [14, 24]]) P.set(x, y, DIRT[3]);
  return P.outline(0.55);
}

// ---------------- horse ----------------
function horse(fr) {
  const P = new Pix(50, 38); P.ox = 2; P.oy = 2;
  const HC = [0x5e3220, 0x92522e, 0xc27a46, 0xe4a46c], MANE = 0x2e1a12;
  const legs = [
    [[12, 19, 6, 30], [16, 19, 18, 30], [31, 19, 36, 29], [35, 19, 40, 28]],
    [[12, 19, 10, 31], [16, 19, 14, 31], [31, 19, 31, 31], [35, 19, 35, 31]],
    [[12, 19, 18, 29], [16, 19, 22, 28], [31, 19, 26, 30], [35, 19, 30, 30]],
    [[12, 19, 12, 30], [16, 19, 16, 31], [31, 19, 34, 30], [35, 19, 37, 30]]
  ][fr];
  legs.forEach(([x0, y0, x1, y1], i) => { const c = i % 2 ? HC[1] : HC[0]; P.line(x0, y0, x1, y1, c); P.line(x0 + 1, y0, x1 + 1, y1, c); P.rect(x1, y1 - 1, 2, 1, 0xffffff); P.rect(x1, y1, 3, 1, 0x2a1a14); });
  P.poly([[8, 11], [1, 8 + fr % 2], [0, 18], [4, 16], [8, 15]], MANE); // tail
  P.ball(22, 15, 14, 6.6, HC, { t1: 0.62 });
  P.poly([[30, 12], [36, 2], [41, 3], [38, 14], [33, 17]], (x, y) => x < 35 ? HC[2] : HC[1]);
  P.ball(41, 5, 5.6, 3.4, HC, { lx: -0.2 });
  P.ball(45, 6.5, 2.4, 2.2, [0x5e3a2a, 0x7a4a34, 0x9a6a4c]);
  P.set(37, 1, HC[1]); P.set(38, 0, HC[1]); P.set(38, 1, HC[0]);
  P.set(40, 4, 0x1a1210); P.set(41, 4, 0x1a1210); P.set(40, 3, 0xffffff);
  P.line(31, 10, 37, 1, MANE); P.line(32, 11, 38, 2, MANE);
  P.poly([[16, 8], [28, 8], [28, 18], [16, 18]], (x, y) => (y === 8 || y === 17) ? 0xffffff : 0xf0569a);
  P.rect(21, 11, 1, 5, 0xffffff); P.set(20, 12, 0xffffff); P.rect(20, 15, 3, 1, 0xffffff);
  P.rect(17, 7, 9, 2, 0x3a2a2a);
  return P.outline(0.5);
}

// ---------------- props ----------------
function tree(v) {
  const P = new Pix(66, 82); P.ox = 1; P.oy = 1;
  const r = mulberry(v * 77 + 3);
  P.poly([[27, 80], [29, 52], [35, 52], [38, 80]], (x) => x < 30 ? WOOD[2] : x > 34 ? WOOD[0] : WOOD[1]);
  P.poly([[22, 80], [28, 74], [30, 80]], WOOD[0]); P.poly([[36, 74], [44, 80], [36, 80]], WOOD[0]);
  P.line(32, 58, 25, 46, WOOD[1]); P.line(33, 58, 41, 47, WOOD[1]);
  for (let y = 56; y < 79; y += 4) P.set(31 + (y % 3), y, WOOD[0]);
  const cl = [[32, 34, 22, 17], [17, 42, 13, 11], [47, 42, 13, 11], [32, 20, 16, 12], [21, 27, 12, 10], [43, 27, 12, 10], [32, 46, 15, 9]];
  for (const [x, y, rx, ry] of cl) P.ball(x, y, rx, ry, LEAF, { t1: 0.55, t2: 0.9 });
  for (let i = 0; i < 160; i++) { const x = 10 + r() * 46, y = 8 + r() * 46; if (P.get(x, y) >= 0) P.set(x, y, r() < 0.5 ? LEAF[0] : LEAF[2]); }
  const APPLE = [0x9a1c2c, 0xe03a3a, 0xff7a68, 0xffe0d0];
  for (let i = 0; i < 11; i++) { const x = 14 + r() * 36, y = 16 + r() * 34; if (P.get(x, y) >= 0) { P.ball(x, y, 2.2, 2.2, APPLE, { t2: 0.8 }); P.set(x, y - 2.5, WOOD[0]); } }
  return P.outline(0.6);
}
function bush(v) {
  const P = new Pix(34, 24); P.ox = 1; P.oy = 1; const r = mulberry(v * 31 + 1);
  for (const [x, y, rx, ry] of [[10, 14, 8, 7], [22, 13, 9, 8], [16, 9, 8, 6.5]]) P.ball(x, y, rx, ry, LEAF, { t1: 0.56 });
  const fl = [[0xffffff, 0xffe066], [0xffa3c8, 0xfff2a0], [0xc8a0ff, 0xffffff]][v % 3];
  for (let i = 0; i < 7; i++) { const x = 5 + r() * 22, y = 5 + r() * 12; if (P.get(x, y) < 0) continue; P.set(x - 1, y, fl[0]); P.set(x + 1, y, fl[0]); P.set(x, y - 1, fl[0]); P.set(x, y + 1, fl[0]); P.set(x, y, fl[1]); }
  return P.outline(0.6);
}
function rock(v) { const P = new Pix(26, 18); P.ox = 1; P.oy = 1; P.ball(12, 10, 11, 7, STONE, { t1: 0.55 }); if (v) P.ball(19, 12, 5, 4, STONE); for (let i = 0; i < 6; i++) P.set(6 + i * 2, 4 + (i % 2), LEAF[2]); return P.outline(0.6); }
function fence() {
  const P = new Pix(42, 26); P.ox = 1; P.oy = 1;
  for (const px of [3, 35]) { P.rect(px, 2, 4, 22, (x) => x === px ? WOOD[2] : x === px + 3 ? WOOD[0] : WOOD[1]); P.rect(px, 1, 4, 1, WOOD[3]); }
  for (const ry of [7, 15]) { P.rect(0, ry, 40, 3, (x, y) => y === ry ? WOOD[2] : y === ry + 2 ? WOOD[0] : ((x * 7) % 11 === 0 ? WOOD[0] : WOOD[1])); }
  return P.outline(0.6);
}
function rail() {
  const P = new Pix(42, 20); P.ox = 0; P.oy = 1;
  for (const px of [2, 22]) P.rect(px, 3, 3, 16, (x) => x === px ? 0xffffff : x === px + 2 ? WHT[0] : WHT[1]);
  P.rect(0, 2, 42, 3, (x, y) => y === 2 ? 0xffffff : y === 4 ? WHT[0] : WHT[1]);
  P.rect(0, 10, 42, 2, (x, y) => y === 10 ? 0xffffff : WHT[0]);
  return P.outline(0.7);
}
function crate() {
  const P = new Pix(26, 22); P.ox = 1; P.oy = 1;
  const APPLE = [0x9a1c2c, 0xe03a3a, 0xff7a68, 0xffe0d0];
  for (let i = 0; i < 5; i++) P.ball(4 + i * 4, 7 + (i % 2), 2.6, 2.6, APPLE);
  P.rect(0, 8, 24, 12, (x, y) => (y === 8 || y === 13) ? WOOD[3] : (x === 0 || x === 23) ? WOOD[0] : (y === 12 || y === 19) ? WOOD[0] : WOOD[1]);
  return P.outline(0.6);
}
function bplant(v) {
  const P = new Pix(24, 16); P.ox = 1; P.oy = 1; const r = mulberry(v * 13 + 5);
  for (const [x, y] of [[7, 7], [13, 6], [18, 8], [10, 10], [16, 11]]) P.ball(x, y, 4, 3, LEAF, { t1: 0.55 });
  for (let i = 0; i < 3; i++) { const x = 4 + r() * 15, y = 11 + r() * 2; P.ball(x, y, 1.8, 2.2, BERRY, { t2: 0.8 }); P.set(x, y - 2, LEAF[3]); P.set(x - 0.5, y + 0.5, 0xffe066); }
  if (v % 2) { P.set(12, 3, 0xffffff); P.set(11, 4, 0xffffff); P.set(13, 4, 0xffffff); P.set(12, 5, 0xffffff); P.set(12, 4, 0xffe066); }
  return P.outline(0.6);
}
function tuft(v) {
  const P = new Pix(14, 10); const r = mulberry(v * 7 + 2);
  const G = [LEAF[1], LEAF[2], LEAF[3], 0x7ec85e];
  for (let i = 0; i < 7; i++) { const x = 2 + r() * 10, h = 3 + r() * 5, lean = (r() - 0.5) * 3; P.line(x, 9, x + lean, 9 - h, G[(r() * 4) | 0]); }
  return P.outline(0.7);
}
function flower(v) {
  const P = new Pix(12, 12); const c = [[0xffffff, 0xffd84a], [0xffd84a, 0xff9a3a], [0xffa3c8, 0xffffff], [0xb98cff, 0xfff2a0]][v % 4];
  P.line(6, 11, 6, 6, LEAF[1]); P.set(7, 8, LEAF[2]);
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1]]) P.set(6 + dx * 1.5, 4 + dy * 1.5, c[0]);
  P.set(6, 4, c[1]);
  return P.outline(0.65);
}
function mushroom() { const P = new Pix(14, 14); P.ox = 1; P.oy = 1; P.rect(5, 7, 3, 5, (x) => x === 7 ? WHT[0] : WHT[1]); P.ball(6.5, 6, 6, 4, BERRY, { t1: 0.5 }); for (const [x, y] of [[4, 5], [8, 4], [9, 7], [5, 8]]) P.set(x, y, 0xffffff); return P.outline(0.6); }
function flag(fr) {
  const P = new Pix(20, 46); P.ox = 1; P.oy = 1;
  P.rect(2, 2, 2, 42, (x) => x === 2 ? 0xffffff : WHT[0]); P.ball(3, 1.5, 1.6, 1.6, GOLD);
  const wv = fr ? 1 : -1;
  P.poly([[4, 4], [17, 7 + wv], [4, 14]], (x, y) => y < 9 + (x - 4) * 0.1 ? 0xff7eb6 : 0xff5a9a);
  P.line(4, 9, 15, 7 + wv, 0xffffff);
  return P.outline(0.6);
}
function planter() {
  const P = new Pix(30, 20); P.ox = 1; P.oy = 1; const r = mulberry(9);
  for (let i = 0; i < 6; i++) { const x = 4 + i * 4, y = 5 + (i % 2) * 2; P.ball(x, y + 2, 3, 3, LEAF); const c = [0xff7eb6, 0xffffff, 0xffd84a][i % 3]; P.ball(x, y, 1.8, 1.8, [mixc(c, 0x000000, 0.25), c, mixc(c, 0xffffff, 0.5)]); }
  P.rect(0, 9, 28, 9, (x, y) => y === 9 ? WOOD[3] : y === 17 ? WOOD[0] : (x % 7 === 0 ? WOOD[0] : WOOD[2]));
  return P.outline(0.6);
}
function sign() {
  const P = new Pix(26, 30); P.ox = 1; P.oy = 1;
  P.rect(11, 14, 3, 15, (x) => x === 11 ? WOOD[2] : WOOD[0]);
  P.rect(0, 2, 24, 13, (x, y) => (y === 2) ? WOOD[3] : (y === 14 || x === 23) ? WOOD[0] : WOOD[2]);
  P.ball(7, 8.5, 3, 3.5, BERRY); P.set(7, 5, LEAF[2]); P.set(6, 5, LEAF[2]);
  P.ball(16, 9, 4.5, 3, SEAL); P.set(17, 8, 0x1a1626); P.set(19, 8, 0x1a1626);
  return P.outline(0.6);
}

// ---------------- items ----------------
function berryShot() { const P = new Pix(14, 15); P.ox = 1; P.oy = 1; P.ball(6, 7.5, 5, 5.5, BERRY, { t2: 0.82 }); P.poly([[1, 3], [6, 6], [11, 3], [6, 1]], LEAF[1]); P.set(6, 1, LEAF[2]); for (const [x, y] of [[4, 8], [7, 7], [8, 10], [5, 11], [3, 6]]) P.set(x, y, 0xffe066); return P.outline(0.5); }
function bubble() { const P = new Pix(12, 12); P.ox = 1; P.oy = 1; P.ell(5, 5, 5, 5, (x, y, nx, ny) => (nx * nx + ny * ny > 0.55) ? 0x8fd8ff : -1); P.set(3, 3, 0xffffff); P.set(4, 2, 0xffffff); P.set(3, 4, 0xe0f6ff); return P; }
function note(col) { const P = new Pix(12, 14); P.ox = 1; P.oy = 1; const pal = [mixc(col, 0x000000, 0.3), col, mixc(col, 0xffffff, 0.45), 0xffffff]; P.rect(6, 1, 2, 9, pal[1]); P.rect(8, 1, 2, 2, pal[1]); P.rect(9, 3, 1, 2, pal[1]); P.ball(4.5, 10, 3.4, 2.6, pal, { t2: 0.8 }); P.set(6, 1, pal[2]); return P.outline(0.5); }
function oyaki() { const P = new Pix(20, 15); P.ox = 1; P.oy = 1; P.ball(9, 7, 9, 6, [0xb07a48, 0xe8c08a, 0xfde2b6, 0xffffff], { t1: 0.5 }); for (const [x, y] of [[5, 5], [10, 4], [13, 7], [7, 8]]) { P.set(x, y, 0x8a5a30); P.set(x + 1, y, 0xa06a3a); } return P.outline(0.55); }
function penlight(col) { const P = new Pix(8, 20); P.ox = 1; P.oy = 1; P.rect(1, 12, 4, 6, (x) => x === 1 ? 0x8a90a8 : 0x4a4e64); P.rect(1, 0, 4, 12, (x, y) => x === 1 || y === 0 ? 0xffffff : x === 4 ? mixc(col, 0x000000, 0.1) : mixc(col, 0xffffff, 0.35)); return P.outline(0.6); }
function heart() { const P = new Pix(12, 11); P.ox = 1; P.oy = 1; P.ball(3, 3, 3, 3, BERRY); P.ball(7, 3, 3, 3, BERRY); P.poly([[0, 4], [10, 4], [5, 9]], BERRY[1]); P.set(2, 2, 0xffffff); return P.outline(0.5); }
// icons
function belt() { const P = new Pix(30, 16); P.ox = 1; P.oy = 1; P.rect(0, 5, 28, 6, (x, y) => y === 5 ? 0x7a4a30 : y === 10 ? 0x3a2018 : 0x5a3424); P.ball(14, 7.5, 7, 6, GOLD, { t2: 0.8 }); P.ball(14, 7.5, 3, 2.6, BERRY); P.ball(4.5, 8, 2, 2.2, GOLD); P.ball(23.5, 8, 2, 2.2, GOLD); return P.outline(0.5); }
function bolt() { const P = new Pix(18, 24); P.ox = 1; P.oy = 1; P.poly([[10, 0], [2, 12], [8, 12], [5, 22], [15, 8], [9, 8], [13, 0]], (x, y) => x < 8 ? GOLD[3] : GOLD[2]); return P.outline(0.45); }
function dress() { const P = new Pix(24, 24); P.ox = 1; P.oy = 1; P.rect(8, 2, 6, 7, PINK[1]); P.poly([[8, 8], [14, 8], [21, 20], [1, 20]], (x) => x < 7 ? PINK[2] : x > 15 ? PINK[0] : PINK[1]); for (let x = 1; x < 21; x++) P.set(x, 20 + (x % 2), WHT[2]); P.rect(9, 9, 4, 2, BERRY[1]); return P.outline(0.5); }
function shoe() { const P = new Pix(24, 18); P.ox = 1; P.oy = 1; P.poly([[2, 10], [6, 4], [12, 4], [20, 9], [21, 13], [2, 13]], (x, y) => y < 7 ? PINK[2] : PINK[1]); P.rect(1, 13, 21, 3, (x, y) => y === 13 ? 0xffffff : 0x3b2236); P.rect(7, 2, 5, 2, BERRY[1]); return P.outline(0.5); }
function bow() { const P = new Pix(26, 16); P.ox = 1; P.oy = 1; P.ball(6, 7, 6, 5, PINK); P.ball(18, 7, 6, 5, PINK); P.ball(12, 7, 2.6, 2.6, BERRY); P.poly([[10, 9], [7, 15], [10, 14]], PINK[0]); P.poly([[14, 9], [17, 15], [14, 14]], PINK[0]); return P.outline(0.5); }
function px() { const P = new Pix(4, 4); P.rect(0, 0, 4, 4, 0xffffff); return P; }
function digits() {
  const D = ['01110100011001110101110001100101110', '00100011000010000100001000010001110', '01110100010000100110010001000011111', '11110000010000101110000010000111110', '00010001100101010010111110001000010', '11111100001111000001000011000101110', '00110010001000011110100011000101110', '11111000010001000100010000100001000', '01110100011000101110100011000101110', '01110100011000101111000010001001100'];
  return D.map((d, n) => [0, 1].map(gold => {
    const P = new Pix(7, 9);
    for (let i = 0; i < 35; i++) if (d[i] === '1') { const x = i % 5 + 1, y = Math.floor(i / 5) + 1; P.set(x, y, gold ? (y < 4 ? 0xfff6b0 : 0xffc23a) : (y < 4 ? 0xffffff : 0xffd6e4)); }
    return P.outline(1);
  }));
}
export function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------------- outfits ----------------
export const OUTFITS = {
  ky: {},
  od: { hair: [0x1c1012, 0x2e1c1a, 0x442a24, 0x6a4636], dress: [0x2f7a4a, 0x4fae6a, 0x8ad89a, 0xd0f4d8], check: 0x163e26, acc: [0x1e5a34, 0x2f8a4e, 0x6cc07a, 0xc8f0d0], shoe: [0x2f7a4a, 0x8ad89a, 0xf4fff4], head: 'clip', apron: false }
};
export const RANGER = [[0xa82030, 0xe8394f, 0xff8a8a, 0xffd0d0], [0x1e4a9a, 0x3a7ae0, 0x8ab8ff, 0xd8e8ff], [0xb08a10, 0xf0c830, 0xfff080, 0xfffbd0], [0xc04a80, 0xff7eb6, 0xffb8d8, 0xffe8f4], [0x1e7a3a, 0x3ab85a, 0x8ae89a, 0xd8ffe0]];
// ドレスきょん: pastel light-blue princess-line dress with glitter tulle and puff sleeves, twin buns
OUTFITS.dr = { dress: [0x5a9ad0, 0x8ac8f0, 0xbfe6ff, 0xeaf8ff], acc: [0xc04a80, 0xff9ec8, 0xffd0e4, 0xfff0f6], lace: [0xc8d8ec, 0xf0f6ff, 0xffffff], shoe: [0x8ac8f0, 0xeaf8ff, 0xffffff], head: 'buns', apron: false, glitter: true };
// ゴスロリきょん: black gothic lolita with white-grey lace and dark-red ribbons
OUTFITS.gs = { dress: [0x0e0a14, 0x1e1828, 0x34293f, 0x51445e], acc: [0x4a0a1e, 0x8a1838, 0xc8406a, 0xffa0c0], lace: [0x1a1420, 0x6a6278, 0xd8d0e4], shoe: [0x0e0a14, 0x34293f, 0x8a1838], head: 'goth', apron: false, check: 0x2a0a18 };
// Phase 6 characters
OUTFITS.dj = { dress: [0x1a1626, 0x2a2632, 0x3a3644, 0x5a5668], acc: [0xa84a0a, 0xe87a1a, 0xffb060, 0xffe0b0], lace: [0x5a3a8a, 0x9a7ad8, 0xe8dcff], shoe: [0x1a1626, 0x3a3644, 0xe87a1a], head: 'bunny', apron: false, check: 0x3a1a5a };
OUTFITS.kc = { dress: [0x0e0a18, 0x1e1a2e, 0x2e2a44, 0x4a4660], acc: [0x8a1420, 0xd8303a, 0xff7a7a, 0xffd0d0], lace: [0x8a8494, 0xd8d4e0, 0xffffff], shoe: [0x0e0a14, 0x2e2a44, 0xd8303a], head: 'shades', apron: false };
OUTFITS.ek = { dress: [0x14204a, 0x1e2e66, 0x2e4288, 0x5a6aa8], acc: [0xa8782a, 0xe8b83a, 0xffe070, 0xfff8c0], lace: [0xc8c4d8, 0xf4f2fa, 0xffffff], shoe: [0x0e0a14, 0x1e2e66, 0xe8b83a], head: 'cap', apron: false };
OUTFITS.am = { dress: [0xd87aa8, 0xffa8cc, 0xffd0e4, 0xfff0f6], acc: [0x6aa8e8, 0x9ad0ff, 0xd0ecff, 0xffffff], lace: [0xf0d8e4, 0xfff6fa, 0xffffff], shoe: [0xffa8cc, 0xfff0f6, 0xffffff], head: 'bigbow' };
OUTFITS.wa = { dress: [0x4a0a2a, 0x8a1a4a, 0xc83a6a, 0xff8aaa], acc: [0xd86a90, 0xff9ac0, 0xffd0e4, 0xffffff], lace: [0x1a1a3a, 0x3a3a6a, 0xd8d4e0], shoe: [0x1a1626, 0x3a3644, 0xc83a6a], head: 'kanzashi', apron: false, check: 0x2a0a1a };
OUTFITS.gr = { dress: [0x5a0a14, 0x9a1426, 0xd8303a, 0xff7a7a], acc: [0x0e0a14, 0x2a2632, 0x4a4654, 0x8a8698], lace: [0x1a1420, 0x6a6278, 0xd8d0e4], shoe: [0x0e0a14, 0x34293f, 0xd8303a], head: 'goth', apron: false, check: 0x3a0a10 };
OUTFITS.mc = { dress: [0x8a3a1a, 0xd8703a, 0xf0a060, 0xffd8b0], acc: [0xd86a90, 0xff9ac0, 0xffd0e4, 0xffffff], lace: [0x2a4a6a, 0x4a7aa8, 0xd8e8f8], shoe: [0x3a2a1a, 0x6a4a2a, 0xd8243a], head: 'kanzashi', apron: false, check: 0x6a2a10 };
RANGER.forEach((c, i) => { OUTFITS['kr' + i] = { dress: c, acc: c, lace: [0xc8c4d8, 0xf4f2fa, 0xffffff], shoe: [0xd8d8e8, 0xffffff, c[0]], head: 'visor', apron: false, petti: false, belt: true }; });

// ---------------- Hanpen (original bichon frise pup) ----------------
const FUR = [0xc9bfb4, 0xece6de, 0xfffdf8, 0xffffff];
function hanpen(fr, bite) {
  const P = new Pix(28, 22); P.ox = 1; P.oy = 1;
  const st = [0, 1, 0, -1][fr], bob = fr % 2 ? -1 : 0;
  for (const [x, ph] of [[6, 1], [9, -1], [14, -1], [17, 1]]) { const k = st * ph; P.rect(x + k, 15, 2, 4 - (k > 0 ? 1 : 0), (X) => X === x + k ? FUR[1] : FUR[0]); P.set(x + k, 18 - (k > 0 ? 1 : 0), 0x8a8078); }
  P.ball(3.5, 8 + bob, 3, 3, FUR, { t0: -0.2 }); // tail puff
  P.ball(11, 11.5 + bob, 8.5, 5.5, FUR, { t0: -0.25, t1: 0.45 });
  for (const [x, y, r] of [[5, 9, 2.6], [9, 7, 2.8], [13, 7.5, 2.6], [7, 14, 2.4], [14, 14.5, 2.2]]) P.ball(x, y + bob, r, r, FUR, { t0: -0.3, t1: 0.4 });
  P.ball(19.5, 8 + bob, 6.4, 6, FUR, { t0: -0.2, t1: 0.45 });
  P.ball(15.2, 8.5 + bob, 2.4, 3.6, [0xb8aea2, 0xd8d0c6, 0xece6de], { t0: -0.4 }); // ear
  P.ball(23, 10.5 + bob, 3.2, 2.6, [0xe0d8ce, 0xfffaf2, 0xffffff], { t0: -0.4 });
  P.rect(18, 6 + bob, 1, 2, 0x1a1418); P.rect(21, 6 + bob, 1, 2, 0x1a1418); P.set(18, 6 + bob, 0x5a5060);
  P.rect(25, 9 + bob, 2, 2, 0x1a1418); P.set(25, 9 + bob, 0x5a5060);
  if (bite) { P.rect(22, 12 + bob, 4, 2, 0x5a1a2a); P.set(23, 13 + bob, 0xff7a96); P.set(24, 13 + bob, 0xff7a96); P.set(22, 12 + bob, 0xffffff); P.set(25, 12 + bob, 0xffffff); }
  else { P.set(24, 12 + bob, 0x8a6a6a); P.set(23, 12 + bob, 0xb08888); if (fr % 2) P.set(24, 13 + bob, 0xff8aa6); }
  P.set(17, 9 + bob, 0xffc0cc); P.set(22, 9 + bob, 0xffc0cc);
  return P.outline(0.5);
}

// ---------------- shopkeeper hamster (original) ----------------
const HAM = [0xb8652e, 0xe39a58, 0xf6c68a, 0xffe6c4];
function hamster(worry) {
  const P = new Pix(38, 36); P.ox = 1; P.oy = 1;
  P.ball(8, 8, 4, 4, HAM); P.ball(28, 8, 4, 4, HAM); P.ball(8.4, 8.4, 2, 2, [0xd87a8a, 0xff9fb0, 0xffc8d2]); P.ball(27.6, 8.4, 2, 2, [0xd87a8a, 0xff9fb0, 0xffc8d2]);
  P.ball(18, 20, 15, 13, HAM, { t0: -0.15, t1: 0.5 });
  P.ell(18, 26, 9.5, 7.5, (x, y, nx, ny) => ny < -0.6 ? 0xfff2e0 : ny > 0.6 ? 0xf0dcc4 : 0xfff8ee);
  P.ell(18, 21, 5, 3, 0xfff8ee);
  // apron with a strawberry
  P.poly([[11, 25], [25, 25], [27, 33], [9, 33]], (x, y) => y === 25 ? 0x2f8a4e : x < 13 ? 0x6cc07a : 0x4fae6a);
  P.ball(18, 29, 2.4, 2.4, BERRY); P.set(18, 26, LEAF[2]);
  // paws
  P.ball(11, 24, 2.2, 1.8, [0xe8a0a0, 0xffc8c8, 0xffe4e4]); P.ball(25, 24, 2.2, 1.8, [0xe8a0a0, 0xffc8c8, 0xffe4e4]);
  // face
  const ey = worry ? 15 : 14;
  for (const ex of [11, 23]) { P.rect(ex, ey, 3, 4, 0x1a1016); P.set(ex, ey, 0xffffff); P.set(ex + 1, ey, 0xffffff); P.set(ex + 2, ey + 3, 0x4a3a50); }
  P.rect(17, 19, 3, 2, 0xe86a86); P.set(17, 19, 0xffa8bc);
  P.ell(8, 20, 2.6, 1.6, 0xffa8b8); P.ell(28, 20, 2.6, 1.6, 0xffa8b8);
  if (worry) {
    P.line(10, 11, 14, 13, 0x6a3a20); P.line(26, 11, 22, 13, 0x6a3a20);
    for (const [x, y] of [[15, 23], [16, 22], [17, 23], [18, 22], [19, 23], [20, 22], [21, 23]]) P.set(x, y, 0x6a2a30);
  } else {
    for (const [x, y] of [[15, 22], [16, 23], [17, 22], [18, 22], [19, 23], [20, 23], [21, 22]]) P.set(x, y, 0x6a2a30);
    P.set(18, 23, -1);
  }
  P.outline(0.55);
  if (worry) { P.ball(32, 9, 2.2, 3, [0x5aa8e8, 0x8ccfff, 0xe0f4ff]); P.set(32, 5, 0x8ccfff); }
  for (const [x, y] of [[5, 19], [4, 21], [31, 19], [32, 21]]) P.set(x, y, 0x8a5a3a); // whiskers
  return P;
}

// ---------------- items & icons ----------------
function coin() { const P = new Pix(15, 15); P.ox = 1; P.oy = 1; P.ball(6.5, 6.5, 6.5, 6.5, GOLD, { t2: 0.85 }); P.ell(6.5, 6.5, 4.4, 4.4, (x, y, nx, ny) => nx * nx + ny * ny > 0.7 ? GOLD[0] : -1); P.ball(6.5, 7.2, 2.4, 2.6, BERRY); P.set(6, 4, LEAF[2]); P.set(7, 4, LEAF[1]); P.set(5, 6, 0xffe066); return P.outline(0.5); }
function brushIcon() {
  const P = new Pix(18, 32); P.ox = 1; P.oy = 1;
  for (let i = 0; i < 18; i++) { const x = 13 - i * 0.38, y = 1 + i; P.rect(x, y, 3, 1, (X) => X < x + 1 ? 0xf0d8a0 : 0xc8a060); if (i % 6 === 5) P.rect(x, y, 3, 1, 0x8a6a3a); }
  P.rect(5.5, 19, 4, 2, 0x8a2030);
  P.poly([[4.5, 21], [10, 21], [9, 27], [6, 30], [4, 26]], (x, y) => y > 27 ? 0x0e0a14 : x < 6 ? 0x4a4050 : 0x221a2a);
  return P.outline(0.5);
}
function ink() { // horizontal brush stroke
  const P = new Pix(70, 20); P.ox = 1; P.oy = 1; const r = mulberry(11);
  for (let x = 0; x < 68; x++) {
    const t = x / 67, th = Math.sin(Math.min(1, t * 1.25) * Math.PI) * 7 + (t < 0.15 ? 1.5 : 0), cy = 9 + Math.sin(t * 3.2) * 1.5;
    for (let y = Math.floor(cy - th); y <= cy + th; y++) {
      const e = Math.abs(y - cy) / Math.max(th, 0.1); if (t > 0.6 && r() < (t - 0.6) * 1.6 * e) continue;
      P.set(x, y, e > 0.8 ? 0x3a3046 : (y < cy - th * 0.4 && x % 5 !== 0) ? 0x2a2234 : 0x0e0a14);
    }
  }
  return P;
}
function drumIcon() {
  const P = new Pix(26, 24); P.ox = 1; P.oy = 1;
  P.rect(3, 9, 18, 10, (x) => x < 6 ? 0xff6a7e : x > 17 ? 0xa31c34 : 0xe63a52);
  for (let x = 3; x < 21; x += 3) { P.set(x + 1, 11, GOLD[2]); P.set(x + 1, 16, GOLD[1]); P.line(x, 12, x + 2, 15, 0xffd0d0); }
  P.rect(3, 18, 18, 2, GOLD[1]); P.rect(3, 9, 18, 1, GOLD[2]);
  P.ell(12, 9, 9, 3, (x, y, nx, ny) => ny < -0.2 ? 0xffffff : 0xe8e4f0);
  P.line(2, 1, 11, 8, 0xf0d8a0); P.line(3, 1, 12, 8, 0xc8a060); P.line(22, 1, 14, 8, 0xf0d8a0); P.line(21, 1, 13, 8, 0xc8a060);
  P.ball(2, 1, 1.4, 1.4, WHT); P.ball(22, 1, 1.4, 1.4, WHT);
  return P.outline(0.5);
}
function suzuri() {
  const P = new Pix(24, 18); P.ox = 1; P.oy = 1;
  P.rect(1, 3, 20, 12, (x, y) => y === 3 || x === 1 ? 0x7a7488 : y === 14 ? 0x2a2634 : 0x4a4658);
  P.rect(3, 5, 16, 8, 0x2a2634); P.ell(8, 9, 4, 3, (x, y, nx, ny) => nx < -0.3 && ny < -0.2 ? 0x5a5a8a : 0x0e0a14); P.set(7, 8, 0xffffff);
  P.rect(14, 1, 3, 9, (x) => x === 14 ? 0x3a3046 : 0x1a1420); P.set(14, 1, 0xe8a83a);
  return P.outline(0.5);
}
function gobelt() {
  const P = new Pix(32, 14); P.ox = 1; P.oy = 1;
  for (let i = 0; i < 5; i++) P.rect(1 + i * 6, 3, 6, 6, (x, y) => y === 3 ? RANGER[i][2] : y === 8 ? RANGER[i][0] : RANGER[i][1]);
  P.ball(15, 6, 4.4, 4, GOLD, { t2: 0.8 }); P.set(15, 6, 0xffffff);
  return P.outline(0.5);
}
function shower() {
  const P = new Pix(28, 28); P.ox = 1; P.oy = 1;
  for (const [x, y] of [[4, 2], [12, 0], [20, 3], [7, 12], [17, 13]]) for (let k = 0; k < 4; k++) P.set(x + k * 0.3, y + k, 0x9fd8ff);
  for (const [x, y, s] of [[6, 10, 3.4], [15, 7, 3.8], [22, 13, 3.2], [11, 19, 4.2], [20, 22, 3]]) { P.ball(x, y, s, s * 1.1, BERRY, { t2: 0.8 }); P.set(x, y - s, LEAF[2]); P.set(x - 1, y - s, LEAF[1]); }
  return P.outline(0.5);
}
function boom() {
  const P = new Pix(34, 34); P.ox = 1; P.oy = 1; const pts = [];
  for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, r = i % 2 ? 7 : 15; pts.push([16 + Math.cos(a) * r, 16 + Math.sin(a) * r]); }
  P.poly(pts, (x, y) => { const d = Math.hypot(x - 16, y - 16); return d < 5 ? 0xffffff : d < 8 ? 0xfff080 : d < 11 ? 0xffb030 : 0xff6a3a; });
  RANGER.forEach((c, i) => { const a = i / 5 * Math.PI * 2 - 1.5; P.ball(16 + Math.cos(a) * 12, 16 + Math.sin(a) * 12, 2.4, 2.4, c); });
  return P.outline(0.5);
}
function kanji(ch) {
  const N = 34, cv = document.createElement('canvas'); cv.width = cv.height = N; const x = cv.getContext('2d');
  x.fillStyle = '#000'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = '900 29px "Noto Serif CJK JP","Noto Serif JP","Hiragino Mincho ProN","Yu Mincho","Noto Sans CJK JP","Hiragino Sans",serif';
  x.fillText(ch, N / 2, N / 2 + 1);
  const d = x.getImageData(0, 0, N, N).data, P = new Pix(N + 4, N + 4); P.ox = 2; P.oy = 2;
  for (let y = 0; y < N; y++) for (let X = 0; X < N; X++) if (d[(y * N + X) * 4 + 3] > 100) P.set(X, y, (X + y) % 7 === 0 ? 0x2a2234 : 0x0e0a14);
  const s = P.c.slice(), w = P.w;
  for (let i = 0; i < s.length; i++) if (s[i] < 0) { const X = i % w, Y = (i / w) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const j = (Y + dy) * w + X + dx; if (X + dx >= 0 && X + dx < w && Y + dy >= 0 && Y + dy < P.h && s[j] >= 0) { P.c[i] = Y < P.h / 2 ? 0xfff4b0 : 0xffd060; break; } } }
  return P.outline(0.8);
}
function yaki() {
  const P = new Pix(26, 18); P.ox = 1; P.oy = 1;
  P.ell(12, 11, 12, 5, (x, y, nx, ny) => ny > 0.5 ? 0xc8c0d0 : 0xffffff);
  for (const [cx, cy] of [[7, 9], [13, 7], [18, 10]]) {
    P.ell(cx, cy, 5, 3, (x, y, nx, ny) => ny < -0.4 ? 0xb85a48 : 0x8a3424);
    for (let k = -3; k <= 3; k += 3) P.set(cx + k, cy, 0x4a1a14);
    P.set(cx - 2, cy - 1, 0xf0c0a0); P.set(cx + 1, cy + 1, 0xf0c0a0);
  }
  P.set(10, 4, 0xffffff); P.set(15, 3, 0xe0e0e0); P.set(9, 2, 0xe0e0e0); // steam
  return P.outline(0.5);
}
function ebi() {
  const P = new Pix(28, 14); P.ox = 1; P.oy = 1;
  P.poly([[0, 6], [4, 2], [6, 6], [4, 10]], (x, y) => y < 6 ? 0xff5a4a : 0xd8302a);
  for (let x = 4; x < 26; x++) { const t = (x - 4) / 22, th = 4.2 - t * 1.6; for (let y = Math.floor(6 - th); y <= 6 + th; y++) P.set(x, y + Math.sin(t * 2.5) * 0.8, (x * 3 + y * 5) % 7 === 0 ? 0xfff0a0 : y < 5 ? 0xf0b040 : y > 8 ? 0xb86a1a : 0xe0901a); }
  return P.outline(0.5);
}
function toy() {
  const P = new Pix(20, 24); P.ox = 1; P.oy = 1;
  P.rect(8, 0, 2, 3, 0x8a90a8); P.ball(9, 0, 1.5, 1.5, BERRY);
  P.rect(3, 3, 12, 8, (x, y) => x === 3 || y === 3 ? STONE[3] : x === 14 ? STONE[0] : STONE[2]);
  P.rect(5, 5, 3, 3, 0xff5a4a); P.rect(10, 5, 3, 3, 0xff5a4a); P.set(5, 5, 0xffd0c0); P.set(10, 5, 0xffd0c0); P.rect(6, 9, 6, 1, STONE[0]);
  P.rect(2, 11, 14, 9, (x, y) => x === 2 ? 0x6ec3ff : x === 15 ? 0x2a5a94 : 0x3a7ae0);
  P.ball(6, 14, 1.6, 1.6, GOLD); P.ball(11, 14, 1.6, 1.6, GOLD); P.rect(5, 17, 8, 1, 0xffffff);
  P.rect(3, 20, 4, 2, STONE[1]); P.rect(11, 20, 4, 2, STONE[1]);
  return P.outline(0.5);
}
function domino() {
  const P = new Pix(26, 22); P.ox = 1; P.oy = 1;
  [[2, 6, 0.0], [9, 3, 0.18], [16, 1, 0.42]].forEach(([x0, y0, sl], k) => {
    P.poly([[x0 + sl * 18, y0], [x0 + 6 + sl * 18, y0], [x0 + 6, y0 + 18], [x0, y0 + 18]], (x, y) => x < x0 + 1 + sl * (y0 + 18 - y) ? 0x4a4458 : 0x1a1620);
    for (const [px, py] of [[2, 3], [3, 13], [3, 9]]) P.set(x0 + px + sl * (18 - py), y0 + py, 0xffffff);
  });
  return P.outline(0.5);
}
function michi() {
  const P = new Pix(26, 28); P.ox = 1; P.oy = 1;
  for (let x = 2; x <= 22; x++) P.set(x, 4 - Math.round(Math.sin((x - 2) / 20 * Math.PI) * 4), 0x2f8a4e);
  P.ball(3, 13, 3.2, 5, HAIR); P.ball(21, 13, 3.2, 5, HAIR);
  P.ball(12, 15, 9.5, 9, HAIR);
  P.ball(12, 17, 7, 6.2, SKIN, { t0: -0.2 });
  P.rect(5, 7, 14, 4, HAIR[1]); P.rect(15, 7, 2, 5, 0x3ab85a);
  for (const ex of [8, 15]) { P.rect(ex, 16, 2, 2, 0x2f8a4e); P.set(ex, 16, 0xd8ffe0); P.set(ex + 1, 17, 0xd8ffe0); }
  for (const [x, y] of [[10, 20], [11, 21], [12, 20], [13, 21], [14, 20]]) P.set(x, y, 0x6a2a30);
  P.set(7, 19, 0xffa8b8); P.set(17, 19, 0xffa8b8);
  return P.outline(0.55);
}
function qmark() { const P = new Pix(10, 12); P.ox = 1; P.oy = 1; for (const [x, y] of [[2, 1], [3, 0], [4, 0], [5, 0], [6, 1], [6, 2], [5, 3], [4, 4], [4, 5], [4, 8]]) { P.set(x, y, 0xffffff); P.set(x + 1, y, 0xffe066); } return P.outline(1); }

// ---------------- cage stage: enemies, boss, props ----------------
function dust(fr) {
  const P = new Pix(22, 20); P.ox = 1; P.oy = 1; const r = mulberry(5 + fr), sq = [0, 1, 0, -1][fr];
  P.ball(10, 11 - sq * 0.5, 8 + sq * 0.5, 6.5 - sq * 0.5, [0x6a6478, 0x9a94a8, 0xc8c2d4, 0xe8e4f0], { t0: -0.1, dith: 0.5 });
  for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, d = 7 + r() * 3; P.set(10 + Math.cos(a) * d, 11 + Math.sin(a) * d * 0.8, r() < 0.5 ? 0xb8b2c4 : 0x8a8498); }
  for (const ex of [6, 12]) { P.rect(ex, 9, 3, 3, 0xffffff); P.set(ex + 1 + (fr % 2), 10, 0x1a1626); P.set(ex + 1 + (fr % 2), 11, 0x1a1626); }
  return P.outline(0.6);
}
function paper(fr) {
  const P = new Pix(22, 24); P.ox = 1; P.oy = 1; const b = [0, -1, 0, 1][fr];
  P.poly([[4, 6 + b], [9, 2 + b], [15, 4 + b], [18, 10 + b], [17, 17 + b], [12, 20 + b], [5, 18 + b], [2, 12 + b]], (x, y) => (x + y * 2) % 9 === 0 ? 0xc8c4d0 : x < 8 ? 0xffffff : 0xe8e4ee);
  P.line(6, 7 + b, 12, 12 + b, 0xb0aac0); P.line(14, 6 + b, 10, 15 + b, 0xb0aac0); P.line(5, 15 + b, 10, 13 + b, 0xb0aac0);
  for (const ex of [7, 12]) { P.rect(ex, 9 + b, 2, 3, 0x1a1626); P.set(ex, 9 + b, 0xffffff); }
  P.rect(9, 14 + b, 3, 1, 0x7a3a4a);
  P.line(2, 12 + b, 0, 9 + b - (fr % 2) * 2, 0xd8d4e0); P.line(18, 11 + b, 20, 8 + b + (fr % 2) * 2, 0xd8d4e0);
  return P.outline(0.6);
}
const METAL = [0x4a5470, 0x7a88a8, 0xb8c4e0, 0xf0f4ff];
function wheelBoss(fr) {
  const S = 68, P = new Pix(S, S + 6), c = S / 2, R0 = 30;
  P.poly([[c - 14, S + 2], [c - 4, c], [c + 4, c], [c + 14, S + 2]], (x) => x < c ? METAL[1] : METAL[0]); // stand
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const d = Math.hypot(x + 0.5 - c, y + 0.5 - c);
    if (d <= R0 && d > R0 - 4) P.set(x, y, d > R0 - 1 ? METAL[0] : (y < c - 6 ? METAL[3] : y < c + 8 ? METAL[2] : METAL[1]));
    else if (d <= R0 - 4 && d > R0 - 6) P.set(x, y, 0xff7eb6);
  }
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + fr * Math.PI / 16; P.line(c + Math.cos(a) * 9, c + Math.sin(a) * 9, c + Math.cos(a) * (R0 - 5), c + Math.sin(a) * (R0 - 5), METAL[1]); }
  for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2 - fr * Math.PI / 24; P.set(c + Math.cos(a) * (R0 - 2), c + Math.sin(a) * (R0 - 2), METAL[0]); }
  P.ball(c, c, 10, 10, [0xa31c34, 0xe63a52, 0xff7e8a, 0xffd0d0], { t2: 0.85 });
  for (const ex of [-5, 2]) { P.rect(c + ex, c - 3, 3, 4, 0xffffff); P.rect(c + ex + 1, c - 2, 2, 3, 0x1a1016); }
  P.line(c - 7, c - 7, c - 2, c - 4, 0x3a0a14); P.line(c + 6, c - 7, c + 1, c - 4, 0x3a0a14);
  P.rect(c - 3, c + 4, 6, 2, 0x3a0a14); P.set(c - 2, c + 4, 0xffffff); P.set(c + 1, c + 4, 0xffffff);
  return P.outline(0.6);
}
function cwheel() {
  const P = new Pix(44, 48), c = 22, R0 = 18; P.ox = 0; P.oy = 1;
  P.poly([[c - 10, 46], [c - 2, c], [c + 2, c], [c + 10, 46]], (x) => x < c ? 0xffa3c8 : 0xd35f8c); P.rect(c - 12, 44, 24, 2, 0xd35f8c);
  for (let y = 0; y < 44; y++) for (let x = 0; x < 44; x++) { const d = Math.hypot(x + 0.5 - c, y + 0.5 - c); if (d <= R0 && d > R0 - 3) P.set(x, y, y < c ? 0xffc6db : 0xff98bd); else if (d <= R0 - 3 && (Math.round(Math.atan2(y - c, x - c) / (Math.PI / 10)) % 2 === 0) && d > R0 - 4) P.set(x, y, 0xffffff); }
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; P.line(c, c, c + Math.cos(a) * (R0 - 3), c + Math.sin(a) * (R0 - 3), 0xffc6db); }
  P.ball(c, c, 3, 3, PINK);
  return P.outline(0.6);
}
function bottle() {
  const P = new Pix(16, 36); P.ox = 1; P.oy = 1;
  P.rect(3, 2, 8, 22, (x, y) => y < 8 ? 0xe8f4ff : x === 3 ? 0xd0ecff : x === 10 ? 0x6aaee8 : 0x9fd8ff);
  P.set(4, 10, 0xffffff); P.set(4, 11, 0xffffff); P.set(4, 15, 0xffffff);
  P.rect(2, 0, 10, 3, 0x3a7ae0); P.rect(4, 24, 6, 3, 0xe63a52); P.rect(6, 27, 2, 6, METAL[1]); P.set(6, 33, METAL[3]);
  return P.outline(0.6);
}
function bowl() {
  const P = new Pix(26, 15); P.ox = 1; P.oy = 1; const r = mulberry(3);
  P.poly([[0, 5], [24, 5], [21, 12], [3, 12]], (x, y) => y > 10 ? 0x2a5a94 : x < 5 ? 0x8ab8ff : 0x3a7ae0);
  P.ell(12, 5, 12, 2.6, 0xd8e8ff);
  for (let i = 0; i < 22; i++) { const x = 3 + r() * 18, y = 3.2 + r() * 2.4; const k = r(); P.set(x, y, k < 0.4 ? 0x2a2230 : k < 0.7 ? 0xf0e0b0 : 0xff9f40); P.set(x + 1, y, k < 0.4 ? 0xe8e0d0 : 0xc8a060); }
  return P.outline(0.55);
}
function tube() {
  const P = new Pix(36, 18); P.ox = 1; P.oy = 1;
  P.rect(4, 3, 26, 11, (x, y) => y < 5 ? 0xffd8a0 : y > 11 ? 0xd8782a : 0xffa848);
  for (let x = 6; x < 30; x += 5) P.rect(x, 3, 1, 11, 0xe8882a);
  P.ell(4, 8.5, 3.5, 6, (x, y, nx, ny) => Math.hypot(nx, ny) > 0.6 ? 0xffb860 : 0x4a2a1a);
  return P.outline(0.6);
}
function house() {
  const P = new Pix(34, 30); P.ox = 1; P.oy = 1;
  P.poly([[1, 12], [16, 1], [31, 12]], (x, y) => x < 16 ? 0xc9935e : 0xa86e42); P.rect(0, 11, 32, 2, WOOD[0]);
  P.rect(3, 13, 26, 14, (x, y) => (y % 4 === 0) ? WOOD[1] : x < 6 ? WOOD[3] : WOOD[2]);
  P.ell(16, 21, 5, 5, (x, y, nx, ny) => ny > 0.7 ? -1 : 0x3a2018); P.rect(11, 21, 11, 6, 0x3a2018);
  P.ball(26, 6, 2.2, 2.2, BERRY);
  return P.outline(0.6);
}
function seedP(v) { const P = new Pix(10, 8); P.ox = 1; P.oy = 1; P.ell(4, 3, 4, 2.4, (x, y, nx, ny) => Math.abs(ny) < 0.25 ? 0xf0e8d8 : 0x2a2230); if (v) P.set(2, 2, 0x5a5060); return P.outline(0.5); }
function shav(v) { const P = new Pix(14, 8); P.ox = 1; P.oy = 1; const c = [0xf0d8a8, 0xe0c090, 0xfff0d0][v]; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 1.6; P.set(5 + Math.cos(a) * (4 - i * 0.2), 3 + Math.sin(a) * 2.4, i % 3 ? c : mixc(c, 0x000000, 0.25)); } return P; }
function bars() { const P = new Pix(40, 46); for (let x = 1; x < 40; x += 6) P.rect(x, 2, 2, 44, (X) => X === x ? METAL[3] : METAL[1]); P.rect(0, 0, 40, 3, METAL[2]); P.rect(0, 40, 40, 3, METAL[1]); return P.outline(0.5); }

// ---------------- atlas ----------------
export function buildAtlas() {
  const S = 2048, SH = 2048, cv = document.createElement('canvas'); cv.width = S; cv.height = SH; const ctx = cv.getContext('2d');
  let x = 2, y = 2, rowH = 0; const R = {};
  const add = (name, pix) => {
    const c = pix.toCanvas ? pix.toCanvas() : pix;
    if (x + c.width + 2 > S) { x = 2; y += rowH + 3; rowH = 0; }
    ctx.drawImage(c, x, y); if (y + c.height > SH) throw new Error('atlas full');
    R[name] = { x, y, w: c.width, h: c.height, u: x / S, v: y / SH, uw: c.width / S, vh: c.height / SH, canvas: c };
    x += c.width + 3; rowH = Math.max(rowH, c.height);
  };
  for (const k in OUTFITS) {
    const o = OUTFITS[k];
    for (let p = 0; p < 4; p++) add(k + p, kyoka(Object.assign({ p }, o)));
    add(k + 'Blink', kyoka(Object.assign({ p: 0, blink: true }, o))); add(k + 'Dash', kyoka(Object.assign({ dash: true }, o))); add(k + 'Hurt', kyoka(Object.assign({ p: 0, hurt: true }, o)));
  }
  for (let i = 0; i < 4; i++) add('hp' + i, hanpen(i)); add('hpBite', hanpen(1, true));
  add('ham', hamster(false)); add('hamWorry', hamster(true));
  add('coin', berryCoin()); add('brush', brushIcon()); add('ink', ink()); add('drum', drumIcon()); add('suzuri', suzuri()); add('gobelt', gobelt());
  add('shower', shower()); add('boom', boom()); add('sealking', seal(0, true));
  ['鬱', '薔', '薇', '齟', '齬'].forEach((ch, i) => add('kanji' + i, kanji(ch)));
  add('yaki', yaki()); add('ebi', ebi()); add('toy', toy()); add('domino', domino()); add('michi', michi()); add('qmark', qmark());
  for (let i = 0; i < 4; i++) { add('dust' + i, dust(i)); add('paper' + i, paper(i)); add('wheel' + i, wheelBoss(i)); }
  add('cwheel', cwheel()); add('bottle', bottle()); add('bowl', bowl()); add('tube', tube()); add('house', house()); add('bars', bars());
  add('seed0', seedP(0)); add('seed1', seedP(1)); for (let i = 0; i < 3; i++) add('shav' + i, shav(i));
  for (let i = 0; i < 4; i++) add('seal' + i, seal(i));
  for (let i = 0; i < 4; i++) add('crow' + i, crow(i, 1, false));
  for (let i = 0; i < 4; i++) add('boss' + i, crow(i, 2.6, true));
  for (let i = 0; i < 4; i++) add('cater' + i, cater(i));
  for (let i = 0; i < 4; i++) add('stink' + i, stink(i));
  for (let i = 0; i < 4; i++) add('mole' + i, mole(i));
  for (let i = 0; i < 4; i++) add('horse' + i, horse(i));
  for (let i = 0; i < 3; i++) add('tree' + i, tree(i));
  for (let i = 0; i < 3; i++) add('bush' + i, bush(i));
  add('rock0', rock(0)); add('rock1', rock(1)); add('fence', fence()); add('rail', rail()); add('crate', crate());
  for (let i = 0; i < 4; i++) add('bplant' + i, bplant(i));
  for (let i = 0; i < 4; i++) add('tuft' + i, tuft(i));
  for (let i = 0; i < 4; i++) add('flower' + i, flower(i));
  add('mushroom', mushroom()); add('flag0', flag(0)); add('flag1', flag(1)); add('planter', planter()); add('sign', sign());
  add('berry', berryShot()); add('bubble', bubble());
  add('note0', note(0x6ec3ff)); add('note1', note(0xc08aff)); add('note2', note(0xffd24a));
  add('oyaki', oyaki()); add('heart', heart());
  const PEN = [0xff6fb0, 0x6ec3ff, 0xffd94a, 0x7ee87a, 0xc79bff]; PEN.forEach((c, i) => add('pen' + i, penlight(c)));
  add('belt', belt()); add('bolt', bolt()); add('dress', dress()); add('shoe', shoe()); add('bow', bow()); add('px', px());
  digits().forEach((pair, n) => { add('d' + n, pair[0]); add('g' + n, pair[1]); });
  addPhase2(add); addPhase3(add); addPhase4(add); addPhase5(add); addPhase6(add);
  for (let p = 0; p < 4; p++) add('bs' + p, sapphire({ p })); add('bsBlink', sapphire({ p: 0, blink: true })); add('bsDash', sapphire({ p: 0, dash: true })); add('bsHurt', sapphire({ p: 0, hurt: true }));
  R.__used = y + rowH; return { canvas: cv, R, PEN };
}

// soft glow textures (not pixel art): circle, ring, beam, star
export function buildGlow() {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const x = cv.getContext('2d');
  let g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  g = x.createRadialGradient(96, 32, 18, 96, 32, 31); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.55, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(64, 0, 64, 64);
  g = x.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(128, 0, 64, 64);
  x.save(); x.translate(224, 32); for (let i = 0; i < 2; i++) { x.rotate(Math.PI / 2 * i); const lg = x.createLinearGradient(-30, 0, 30, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,1)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = lg; x.beginPath(); x.moveTo(-30, 0); x.lineTo(0, -3); x.lineTo(30, 0); x.lineTo(0, 3); x.fill(); } x.restore();
  g = x.createRadialGradient(224, 32, 0, 224, 32, 10); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(192, 0, 64, 64);
  return cv;
}

// ---------------- ground textures (seamless 256x256) ----------------
export function buildGround(kind) {
  if (kind === 3) return shavingsGround();
  if (kind === 4) return zooGround();
  if (kind === 5) return snowGround();
  if (kind === 6) return nightGround();
  if (kind === 7) return gardenGround();
  if (kind === 8) return chinaGround();
  if (GROUNDS6[kind]) return GROUNDS6[kind]();
  const N = 256, P = new Pix(N, N), r = mulberry(kind * 1000 + 17);
  const mk = g => { const G = []; for (let i = 0; i < g * g; i++) G.push(r()); return (x, y, s) => { const gx = x / N * s, gy = y / N * s, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0; const v = (a, b) => G[((a % s + s) % s) * g + ((b % s + s) % s)]; const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy); return (v(x0, y0) * (1 - sx) + v(x0 + 1, y0) * sx) * (1 - sy) + (v(x0, y0 + 1) * (1 - sx) + v(x0 + 1, y0 + 1) * sx) * sy; }; };
  const vn = mk(32), vn2 = mk(32);
  const greens = kind === 2 ? [0x2f6a34, 0x3d7e3c, 0x4b9246, 0x5aa450, 0x6eb85c, 0x86c86a] : kind === 1 ? [0x3c7a38, 0x4a8c40, 0x5a9e48, 0x6cb052, 0x80c05e, 0x9ad070] : [0x2e6232, 0x3a743a, 0x488842, 0x569a4a, 0x68ac54, 0x80c062];
  const dirt = kind === 2 ? [0x7a5a3a, 0x8e6c46, 0xa8845a] : [0x6e4e32, 0x86623e, 0x9c7850];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let n = vn(x, y, 4) * 0.5 + vn(x, y, 8) * 0.3 + vn(x, y, 32) * 0.2;
    if (kind === 2) n = n * 0.55 + ((Math.floor(y / 32) % 2) ? 0.42 : 0.12);
    n += (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * 0.14;
    let c = greens[Math.max(0, Math.min(5, Math.floor(n * 6)))];
    const dn = vn2(x, y, 4) * 0.6 + vn2(x, y, 8) * 0.28 + vn2(x, y, 32) * 0.12;
    if (kind === 0 && dn > 0.72) c = dn > 0.75 ? dirt[(dn > 0.82 ? 2 : 1) - (((x * 7 + y * 3) % 5) ? 0 : 1)] : ((x + y) % 2 ? dirt[0] : c);
    if (kind === 2 && dn > 0.76) c = dn > 0.79 ? dirt[1 + ((x * 3 + y) % 3 === 0 ? 1 : 0)] : ((x + y) % 2 ? dirt[0] : c);
    P.set(x, y, c);
  }
  if (kind === 1) {
    for (let y = 0; y < N; y++) { const m = y % 32; if (m < 6 || m > 25) continue; for (let x = 0; x < N; x++) { const edge = m === 6 || m === 25; let c = edge ? 0x4a2e1e : (m < 9 ? 0x9a6a44 : (m > 22 ? 0x6a4430 : 0x7a5034)); if (!edge && r() < 0.2) c = 0xc8a46a; if (!edge && r() < 0.05) c = 0xe8cc90; if (!edge && r() < 0.06) c = 0x5a3a26; P.set(x, y, c); } }
  }
  const inBed = y => kind === 1 && (y % 32) >= 5 && (y % 32) <= 26;
  // grass clumps: dark root, mid blades, bright tips
  for (let i = 0; i < 900; i++) {
    const x = Math.floor(r() * N), y = Math.floor(r() * N); if (inBed(y)) continue;
    const w = 2 + Math.floor(r() * 3), base = greens[1 + Math.floor(r() * 2)], tip = greens[4 + Math.floor(r() * 2)];
    for (let k = 0; k < w; k++) { const h = 1 + Math.floor(r() * 3); P.set((x + k) % N, (y + 1) % N, greens[0]); for (let j = 0; j < h; j++) P.set((x + k) % N, (y - j + N) % N, j === h - 1 ? tip : base); }
  }
  for (let i = 0; i < 1400; i++) { const x = Math.floor(r() * N), y = Math.floor(r() * N); if (inBed(y)) continue; P.set(x, y, r() < 0.6 ? greens[0] : greens[5]); }
  const fl = [0xffffff, 0xffd84a, 0xffa3c8, 0xb98cff, 0xff7a7a];
  for (let i = 0; i < (kind === 1 ? 30 : 70); i++) {
    const x = Math.floor(r() * N), y = Math.floor(r() * N); if (inBed(y)) continue;
    const t = r();
    if (t < 0.55) { const c = fl[Math.floor(r() * 5)]; P.set(x, y, c); P.set((x + 1) % N, y, c); P.set(x, (y + 1) % N, c); P.set((x + 1) % N, (y + 1) % N, mixc(c, 0x000000, 0.25)); P.set(x, (y + 2) % N, greens[0]); }
    else if (t < 0.8) { P.set(x, y, 0xb8b8c8); P.set((x + 1) % N, y, 0x9a9aaa); P.set(x, (y + 1) % N, 0x6a6a7a); P.set((x + 1) % N, (y + 1) % N, 0x4a4a5a); }
    else if (kind === 0) { P.set(x, y, 0xc8402a); P.set((x + 1) % N, y, 0xa83020); P.set(x, (y + 1) % N, 0x8a6a2a); } // fallen leaf
  }
  return P.toCanvas();
}

function shavingsGround() { // bedding inside a hamster cage
  const N = 256, P = new Pix(N, N), r = mulberry(4242);
  const base = [0xc8a878, 0xd6b888, 0xe2c698, 0xecd4a8, 0xf4e2bc];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const n = (BAYER[(y & 3) * 4 + (x & 3)] / 16) * 0.5 + r() * 0.5; P.set(x, y, base[Math.min(4, Math.floor(n * 3.2))]); }
  for (let i = 0; i < 1500; i++) { // curls of wood
    const cx = r() * N, cy = r() * N, rad = 2 + r() * 4, a0 = r() * 6.28, col = [0xfff0d0, 0xb89060, 0xf8e4b8, 0xa87c50][(r() * 4) | 0];
    for (let k = 0; k < rad * 3; k++) { const a = a0 + k / (rad * 3) * 4.2; P.set(((cx + Math.cos(a) * rad * (1 - k / (rad * 6))) % N + N) % N, ((cy + Math.sin(a) * rad * 0.6) % N + N) % N, col); }
  }
  for (let i = 0; i < 40; i++) { const x = (r() * N) | 0, y = (r() * N) | 0; P.set(x, y, 0x2a2230); P.set((x + 1) % N, y, 0x2a2230); P.set((x + 2) % N, y, 0xe8e0d0); } // dropped seeds
  return P.toCanvas();
}
