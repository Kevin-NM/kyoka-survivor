// 必殺技 cut-scene: キョンレンジャー大集合. Drawn on a 2D overlay canvas over the frozen game, with the code-drawn
// ranger sprites from the atlas. Light on phones: flat fills, a few gradients, no filters or shadow blur, capped sparks.
import { RANGER } from './art.js';

export const CINE = { E0: 0.55, ED: 0.4, POSE: 2.55, BOOM: 2.65, FIN: 3.45, HIT: 3.65, FADE: 4.25, END: 4.65 };
export const CINE_ORDER = [0, 1, 2, 4, 3]; // entry order red, blue, yellow, green, pink (index into RANGER)
export const CINE_NAMES = ['キョンレッド', 'キョンブルー', 'キョンイエロー', 'キョングリーン', 'キョンピンク']; // same in every language
const SLOT = [0, -1, 1, -2, 2]; // lineup: red in the middle, then the inner pair, then the outer pair
const MAX_SPARKS = 90;
const FONT = '"M PLUS Rounded 1c","Hiragino Maru Gothic ProN","Hiragino Sans","Noto Sans JP","Noto Sans CJK JP","PingFang TC","Microsoft JhengHei",sans-serif';
const css = c => '#' + c.toString(16).padStart(6, '0');
const k01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
const easeOut = k => 1 - (1 - k) ** 3;
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

export const makeCine = canSkip => ({ t: 0, ev: 0, sparks: [], canSkip, skipped: false });
const entryT = j => CINE.E0 + j * CINE.ED;

function layout(W, H) {
  const rh = Math.min(H * 0.24, W * 0.34, 230), sp = Math.min(W * 0.18, rh * 0.8), cx = W / 2, gy = H * 0.64;
  const slot = j => { const s = SLOT[j], back = Math.abs(s); return { x: cx + s * sp, y: gy - back * rh * 0.07, sc: 1 - back * 0.07 }; };
  return { rh, sp, cx, gy, slot, barH: Math.max(40, Math.min(H * 0.1, 86)) };
}

function burst(c, x, y, n, cols, sp) {
  for (let i = 0; i < n && c.sparks.length < MAX_SPARKS; i++) {
    const a = Math.random() * Math.PI * 2, v = sp * (0.35 + Math.random() * 0.65);
    c.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * 0.3, life: 0.5 + Math.random() * 0.5, max: 1, s: 3 + Math.random() * 5, c: cols[i % cols.length], r: Math.random() * 3 });
  }
}

// advance the sparks; spawn them at landings, the explosion and the finisher (fixed timeline, so a skip just jumps ahead)
export function tickCine(c, dt, W, H) {
  const L = layout(W, H), t0 = c.t - dt, t = c.t, hit = x => t0 < x && t >= x;
  for (let j = 0; j < 5; j++) if (hit(entryT(j) + 0.16)) { const s = L.slot(j), P = RANGER[CINE_ORDER[j]]; burst(c, s.x, s.y, 12, [css(P[1]), css(P[2]), '#ffffff'], L.rh * 2.2); }
  if (hit(CINE.BOOM)) for (let j = 0; j < 5; j++) { const s = L.slot(j), P = RANGER[CINE_ORDER[j]]; burst(c, s.x, s.y - L.rh * 0.6, 8, [css(P[1]), css(P[2]), '#fff6d0'], L.rh * 3); }
  if (hit(CINE.HIT)) burst(c, L.cx, L.gy - L.rh * 0.5, 30, RANGER.map(P => css(P[1])).concat('#ffffff'), L.rh * 4);
  for (let i = c.sparks.length - 1; i >= 0; i--) { const q = c.sparks[i]; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 420 * dt; q.vx *= 0.98; q.life -= dt; q.r += dt * 8; if (q.life <= 0) c.sparks.splice(i, 1); }
}

const plate = (x, y, w, h, sk) => { const p = new Path2D(); p.moveTo(x + sk, y); p.lineTo(x + w + sk, y); p.lineTo(x + w - sk, y + h); p.lineTo(x - sk, y + h); p.closePath(); return p; };
function text(ctx, s, x, y, size, fill, stroke, align) {
  ctx.font = `900 ${size}px ${FONT}`; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, size * 0.18); ctx.strokeStyle = stroke; ctx.strokeText(s, x, y); ctx.fillStyle = fill; ctx.fillText(s, x, y);
}
function sprite(ctx, cv, x, y, h, sx, sy, alpha) { // bottom-centre anchored, pixel-crisp
  const s = h / cv.height, w = cv.width * s * sx, hh = cv.height * s * sy; ctx.globalAlpha = alpha; ctx.drawImage(cv, x - w / 2, y - hh, w, hh); ctx.globalAlpha = 1;
}

// o: { spr: [5 canvases, entry order], pose: [5], title, skip (hint text or '') }
export function drawCine(ctx, W, H, c, o) {
  const t = c.t, L = layout(W, H), { rh, cx, gy, barH } = L;
  ctx.save(); ctx.clearRect(0, 0, W, H); ctx.imageSmoothingEnabled = false;
  // shake: landings, the big explosion, the finisher
  let amp = 0; for (let j = 0; j < 5; j++) { const d = t - entryT(j) - 0.16; if (d > 0 && d < 0.2) amp += 5 * (1 - d / 0.2); }
  { const d = t - CINE.BOOM; if (d > 0 && d < 0.5) amp += 16 * (1 - d / 0.5); } { const d = t - CINE.HIT; if (d > 0 && d < 0.4) amp += 11 * (1 - d / 0.4); }
  if (amp) ctx.translate(Math.sin(t * 91) * amp, Math.cos(t * 77) * amp * 0.7);
  // 1. dim (lifts during the finisher so the foes popping in the game show through)
  const dim = 0.66 * easeOut(k01(t / 0.3)) * (t < CINE.HIT ? 1 : 1 - 0.75 * k01((t - CINE.HIT) / 0.45)) * (1 - k01((t - CINE.FADE) / (CINE.END - CINE.FADE)));
  ctx.fillStyle = `rgba(14,6,22,${dim})`; ctx.fillRect(-20, -20, W + 40, H + 40);
  // 2. speed lines: each entry in the ranger's colour, then five colours for the group pose
  if (t >= CINE.E0 && t < CINE.FIN) {
    const j = Math.min(4, Math.floor((t - CINE.E0) / CINE.ED)), pose = t >= CINE.POSE, P = RANGER[CINE_ORDER[j]];
    const fx = pose ? cx : L.slot(j).x, fy = gy - rh * 0.5, R = Math.hypot(W, H), fr = Math.floor(t * 20);
    if (!pose) { ctx.fillStyle = css(P[0]); ctx.globalAlpha = 0.34 * k01((t - entryT(j)) / 0.08); ctx.fillRect(-20, -20, W + 40, H + 40); }
    for (let i = 0; i < 44; i++) {
      const a = hash(i * 7 + fr * 131) * Math.PI * 2, wd = 0.006 + hash(i + fr) * 0.016, r0 = rh * (0.9 + hash(i * 3 + fr) * 0.8);
      ctx.globalAlpha = pose ? 0.4 : 0.32; ctx.fillStyle = pose ? css(RANGER[i % 5][2]) : i % 3 ? '#ffffff' : css(P[2]);
      ctx.beginPath(); ctx.moveTo(fx + Math.cos(a) * r0, fy + Math.sin(a) * r0); ctx.lineTo(fx + Math.cos(a - wd) * R, fy + Math.sin(a - wd) * R); ctx.lineTo(fx + Math.cos(a + wd) * R, fy + Math.sin(a + wd) * R); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // 3. the five-colour explosion behind the group
  if (t >= CINE.BOOM && t < CINE.FADE) {
    const out = 1 - k01((t - CINE.FIN) / 0.6);
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#ffd890'; ctx.globalAlpha = 0.5 * (1 - k01((t - CINE.BOOM) / 0.25));
    ctx.beginPath(); ctx.arc(cx, gy - rh * 0.5, rh * (0.4 + 1.4 * easeOut(k01((t - CINE.BOOM) / 0.25))), 0, Math.PI * 2); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
    for (let j = 0; j < 5; j++) {
      const s = L.slot(j), P = RANGER[CINE_ORDER[j]];
      for (let m = 0; m < 9; m++) { // a column of coloured smoke balls shooting up behind each ranger
        const p = easeOut(k01((t - CINE.BOOM) / 0.45 - m * 0.04)); if (p <= 0) continue;
        const r = rh * (0.3 + 0.5 * p) * (1 - m * 0.06), x = s.x + Math.sin(m * 1.7 + j * 2.3) * rh * 0.28 * p, y = s.y - rh * 0.3 - p * rh * (0.45 + m * 0.36);
        ctx.globalAlpha = out * (0.95 - p * 0.35); ctx.fillStyle = css(P[m % 2 ? 0 : 1]); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = css(P[2]); ctx.beginPath(); ctx.arc(x - r * 0.2, y - r * 0.2, r * 0.55, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
  // light gathering: five coloured rings closing in on the middle while the band slides through
  if (t < CINE.E0 + 0.1) {
    ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = Math.max(3, rh * 0.05);
    for (let i = 0; i < 5; i++) { const k = ((t * 1.9 + i / 5) % 1), r = rh * (0.2 + 2.2 * (1 - k)); ctx.globalAlpha = 0.7 * k; ctx.strokeStyle = css(RANGER[CINE_ORDER[i]][2]); ctx.beginPath(); ctx.arc(cx, gy - rh * 0.5, r, 0, Math.PI * 2); ctx.stroke(); }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  // transformation cut-in: a slanted band with five-colour stripes sweeping through and the title, light gathering in the middle
  if (t < CINE.E0 + 0.1) {
    const kin = easeOut(k01(t / 0.22)), kout = k01((t - CINE.E0 + 0.05) / 0.15), bh = Math.min(H * 0.17, W * 0.3), by = H * 0.42, x0 = (1 - kin) * W * 1.2 - kout * W * 1.2;
    ctx.save(); ctx.translate(x0, 0); ctx.beginPath(); ctx.moveTo(-40, by + bh * 0.25); ctx.lineTo(W + 40, by - bh * 0.25); ctx.lineTo(W + 40, by + bh * 0.75); ctx.lineTo(-40, by + bh * 1.25); ctx.closePath();
    ctx.fillStyle = '#140a18'; ctx.fill(); ctx.clip();
    for (let i = 0; i < 10; i++) { const sx = ((i / 10 + t * 1.8) % 1) * (W + bh * 2) - bh; ctx.fillStyle = css(RANGER[CINE_ORDER[i % 5]][1]); ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.moveTo(sx, by + bh * 1.3); ctx.lineTo(sx + bh * 0.22, by + bh * 1.3); ctx.lineTo(sx + bh * 0.62, by - bh * 0.3); ctx.lineTo(sx + bh * 0.4, by - bh * 0.3); ctx.fill(); }
    ctx.globalAlpha = 0.55; ctx.fillStyle = '#140a18'; ctx.fillRect(-40, by - bh * 0.3, W + 80, bh * 1.6); ctx.globalAlpha = 1;
    text(ctx, o.title, W / 2, by + bh * 0.5, Math.min(bh * 0.34, W * 0.075), '#fff6d0', '#140a18'); ctx.restore();
  }
  // 4. light pillars for the entries
  for (let j = 0; j < 5; j++) {
    const k = (t - entryT(j)) / CINE.ED; if (k < 0 || k > 1.3) continue;
    const a = k < 0.45 ? k / 0.45 : Math.max(0, 1 - (k - 0.45) / 0.8), s = L.slot(j), w = rh * 0.85 * (1 + 0.3 * (1 - a)), P = RANGER[CINE_ORDER[j]];
    const g = ctx.createLinearGradient(s.x - w / 2, 0, s.x + w / 2, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.3, css(P[2])); g.addColorStop(0.5, '#ffffff'); g.addColorStop(0.7, css(P[2])); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = a * 0.85; ctx.fillStyle = g; ctx.fillRect(s.x - w / 2, -20, w, s.y + 20 + rh * 0.08); ctx.globalAlpha = 1;
  }
  // 5. the rangers: drop in from the top, land with a squash bounce; hop together for the group pose; leave during the finisher
  const leave = k01((t - CINE.HIT) / 0.45);
  for (const j of [3, 4, 1, 2, 0]) { // back row first
    const st = entryT(j); if (t < st) continue;
    const s = L.slot(j), h = rh * s.sc, P = RANGER[CINE_ORDER[j]], land = st + 0.16;
    let y = s.y, sx = 1, sy = 1;
    if (t < land) y = -h * 0.2 + (s.y + h * 0.2) * k01((t - st) / 0.16) ** 2;
    else { const b = (t - land) / 0.24; if (b < 1) { sy = 1 + 0.2 * Math.sin(b * Math.PI * 2) * (1 - b); sx = 1 / sy; y -= Math.max(0, Math.sin(b * Math.PI)) * h * 0.08 * (b > 0.5 ? 1 : 0); } }
    const ph = k01((t - CINE.POSE) / 0.32), pose = t >= CINE.POSE;
    if (pose && ph < 1) y -= Math.sin(ph * Math.PI) * h * 0.22;
    y += leave * h * 0.3; const al = 1 - leave; if (al <= 0) continue;
    ctx.globalAlpha = 0.45 * al; ctx.fillStyle = css(P[1]); ctx.beginPath(); ctx.ellipse(s.x, s.y + 2, h * 0.36, h * 0.08, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    sprite(ctx, (pose ? o.pose : o.spr)[j], s.x, y, h, sx * (SLOT[j] > 0 ? -1 : 1), sy, al);
  }
  // 6. name plate of the ranger now entering
  for (let j = 0; j < 5; j++) {
    const k = t - entryT(j); if (k < 0.04 || k > CINE.ED + 0.04) continue;
    const P = RANGER[CINE_ORDER[j]], ph = Math.max(34, Math.min(H * 0.075, 64)), pw = Math.min(W * 0.82, ph * 7.5), x0 = W / 2 - pw / 2, y0 = Math.min(gy + rh * 0.2, H - barH - ph - 8);
    const slide = easeOut(k01((k - 0.04) / 0.12)), x = x0 - (1 - slide) * (W * 0.9) * (j % 2 ? -1 : 1), a = 1 - k01((k - CINE.ED + 0.02) / 0.06);
    ctx.globalAlpha = a; ctx.fillStyle = '#140a18'; ctx.fill(plate(x - 4, y0 - 4, pw + 8, ph + 8, ph * 0.3));
    ctx.fillStyle = css(P[1]); ctx.fill(plate(x, y0, pw, ph, ph * 0.3)); ctx.fillStyle = css(P[2]); ctx.fill(plate(x + ph * 0.1, y0 + ph * 0.1, pw * 0.96, ph * 0.18, ph * 0.06));
    text(ctx, CINE_NAMES[j], x + pw / 2, y0 + ph * 0.56, ph * 0.6, '#ffffff', css(P[0])); ctx.globalAlpha = 1;
  }
  // group title
  if (t >= CINE.POSE && t < CINE.HIT + 0.3) {
    const k = k01((t - CINE.POSE) / 0.2), sz = Math.min(W * 0.075, H * 0.07, 52) * (1.4 - 0.4 * easeOut(k)), a = k * (1 - k01((t - CINE.HIT) / 0.3));
    ctx.globalAlpha = a; text(ctx, o.title, W / 2, Math.min(gy + rh * 0.42, H - barH - sz), sz, '#fff6d0', '#140a18'); ctx.globalAlpha = 1;
  }
  // 7. finisher: rotating five-colour star burst and a beam sweeping the screen
  if (t >= CINE.FIN && t < CINE.END) {
    const k = (t - CINE.FIN) / (CINE.FADE - CINE.FIN), out = 1 - k01((t - CINE.FADE + 0.15) / (CINE.END - CINE.FADE + 0.15)), fx = cx, fy = gy - rh * 0.5, R = Math.hypot(W, H) * easeOut(k01(k * 1.6));
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + t * 1.6, wd = 0.11; ctx.globalAlpha = 0.5 * out; ctx.fillStyle = css(RANGER[i % 5][1]); ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + Math.cos(a - wd) * R, fy + Math.sin(a - wd) * R); ctx.lineTo(fx + Math.cos(a + wd) * R, fy + Math.sin(a + wd) * R); ctx.fill(); }
    const front = -W * 0.2 + W * 1.5 * easeOut(k01((t - CINE.FIN) / 0.32)), bh = Math.min(H * 0.32, W * 0.5), by = fy - bh / 2, sw = bh / 5;
    ctx.globalAlpha = 0.8 * out * (1 - k01((t - CINE.HIT - 0.1) / 0.5));
    for (let i = 0; i < 5; i++) { ctx.fillStyle = css(RANGER[CINE_ORDER[i]][1]); ctx.fillRect(-20, by + i * sw, front + 20, sw + 1); }
    ctx.fillStyle = '#ffffff'; ctx.fillRect(front - 18, by - 6, 18, bh + 12);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  // sparks
  for (const q of c.sparks) { ctx.globalAlpha = k01(q.life * 2); ctx.fillStyle = q.c; ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.r); ctx.fillRect(-q.s / 2, -q.s / 2, q.s, q.s); ctx.restore(); }
  ctx.globalAlpha = 1;
  // flashes: each landing, the explosion, the finisher
  let fl = 0; for (let j = 0; j < 5; j++) { const d = t - entryT(j) - 0.16; if (d > 0 && d < 0.12) fl = Math.max(fl, 0.22 * (1 - d / 0.12)); }
  { const d = t - CINE.BOOM; if (d > 0 && d < 0.28) fl = Math.max(fl, 0.85 * (1 - d / 0.28)); } { const d = t - CINE.HIT; if (d > 0 && d < 0.3) fl = Math.max(fl, 0.65 * (1 - d / 0.3)); }
  if (fl) { ctx.fillStyle = `rgba(255,250,235,${fl})`; ctx.fillRect(-20, -20, W + 40, H + 40); }
  // 8. cut-in bars (letterbox with a five-colour edge) with the title and the skip hint
  const kb = easeOut(k01(t / 0.3)) * (1 - easeOut(k01((t - CINE.FADE) / (CINE.END - CINE.FADE))));
  if (kb > 0) {
    const st = barH * 0.08;
    ctx.save(); ctx.translate(-W * (1 - kb), 0); ctx.fillStyle = '#140a18'; ctx.fillRect(-20, -20, W + 40, barH + 20);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = css(RANGER[CINE_ORDER[i]][1]); ctx.fillRect(W * i / 5 - 20 * (i === 0), barH, W / 5 + 20 * (i === 0 || i === 4), st); }
    if (t >= CINE.E0 && t < CINE.POSE) text(ctx, o.title, W / 2, barH * 0.55, Math.min(barH * 0.42, W * 0.06), '#fff6d0', '#140a18');
    ctx.restore();
    ctx.save(); ctx.translate(W * (1 - kb), 0); ctx.fillStyle = '#140a18'; ctx.fillRect(-20, H - barH, W + 40, barH + 20);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = css(RANGER[CINE_ORDER[4 - i]][1]); ctx.fillRect(W * i / 5 - 20 * (i === 0), H - barH - st, W / 5 + 20 * (i === 0 || i === 4), st); }
    if (o.skip && t < CINE.FIN) { ctx.globalAlpha = 0.8; text(ctx, o.skip + ' ▶▶', W - 14, H - barH / 2, Math.max(12, barH * 0.24), '#ffffff', '#140a18', 'right'); ctx.globalAlpha = 1; }
    ctx.restore();
  }
  ctx.restore();
}
