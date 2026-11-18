// "Password save" (復活の呪文-style). Not secure, just typo-proof. Alphabet has no 0/O/1/I/L.
// v6: 400 data bits + CRC-12 -> 84 base-31 chars in 21 groups of 4 (records, coins, shop, 52 + 30 achievement bits,
// secret words, per-stage bests (time + kills for the first 9 stages, time only for the 10 phase-6 stages),
// the hardest difficulty cleared on each stage, the chosen difficulty).
// Older codes are still accepted and converted: v5 (60 chars), v4 (52), v3 (44), v2 (24) and v1 (12).
export const ALPHA = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // 31 chars
const LANGS = ['ja', 'zh', 'en'];
// permanent shop upgrades (order is part of the save format)
export const UPG10 = ['panier', 'shodo', 'drumbeat', 'magnet', 'toys', 'domino', 'ohayo', 'michi', 'hanpen', 'lucky']; // v1-v6 codes know these
// v7: three きょん goods + six stacking upgrades (level up again and again, each level costs more)
export const UPG_GOODS = ['cafe', 'utowel', 'hcard'], UPG_REP = ['r_atk', 'r_hp', 'r_spd', 'r_mag', 'r_coin', 'r_xp'];
export const UPG_IDS = [...UPG10, ...UPG_GOODS, ...UPG_REP];
export const UPG_MAX = { panier: 3, shodo: 5, drumbeat: 2, magnet: 2, toys: 3, domino: 3, ohayo: 2, michi: 1, hanpen: 3, lucky: 2, cafe: 3, utowel: 3, hcard: 2, r_atk: 40, r_hp: 40, r_spd: 20, r_mag: 20, r_coin: 40, r_xp: 20 };
const V2_UPG = ['panier', 'shodo', 'drumbeat', 'magnet', 'toys', 'domino', 'ohayo', 'michi'];
const V2_UPG_BITS = { panier: 2, shodo: 3, drumbeat: 2, magnet: 2, toys: 2, domino: 2, ohayo: 2, michi: 2 }; // 17 bits
const V3_UPG_BITS = { panier: 2, shodo: 3, drumbeat: 2, magnet: 2, toys: 2, domino: 2, ohayo: 2, michi: 1, hanpen: 2, lucky: 2 }; // 20 bits
const V7_UPG_BITS = Object.assign({}, V3_UPG_BITS, { cafe: 2, utowel: 2, hcard: 2, r_atk: 6, r_hp: 6, r_spd: 5, r_mag: 5, r_coin: 6, r_xp: 5 }); // 59 bits
// achievements (bit index = position; order is part of the save format; v2 stored the first 15)
export const ACH_IDS = ['firstClear', 'crowKing', 'survive3', 'cageClear', 'seals3', 'evoBerry', 'evoBeam', 'evoSeal', 'evoBrush', 'debtFree', 'kills1000', 'lv30', 'noDamage', 'shopAll', 'endless10',
  'clearApple', 'clearBerry', 'clearRace', 'clearZoo', 'clearSnow', 'clearNight', 'evoDrum', 'evoMic', 'evoApple', 'chest', 'allStages', 'pickups', 'hanpen100',
  'evoLariat', 'evoPenlight', 'evoHorse', 'evoHam', 'evoFan', 'evoGuitar', 'clearHard', 'clearGeki', 'evo3',
  'clearChapel', 'evoCyalume', 'ringCake', 'gourmet', 'clearChina',
  'clearHalloween', 'clearRunway', 'clearRing', 'clearDawn', 'clearCherry', 'clearStation', 'clearClinic', 'clearOkinawa', 'clearHq', 'clearRoad',
  // from here on (index 52+) the bits live in p.ach2, so p.ach stays an exact Number
  'evoTtable', 'evoPara', 'evoHlock', 'evoKoma', 'evoWhis', 'evoSyr', 'evoChaka', 'hamcards', 'encore', 'loop2', 'mission3', 'allStages2'];
export const ACH_MAIN = 52, ACH2_BITS = 30;
const V3_ACH = 28; // v3 codes stored the first 28
// difficulties (order is part of the save format). A stage record keeps the hardest one cleared: 0 = none, 1..4 = DIFFS[d-1]
export const DIFFS = ['easy', 'normal', 'hard', 'geki'];
// stages (order is part of the save format and is also the unlock chain)
export const STAGE_IDS = ['apple', 'berry', 'race', 'cage', 'zoo', 'snow', 'night', 'chapel', 'china',
  'halloween', 'runway', 'ring', 'dawn', 'cherry', 'station', 'clinic', 'okinawa', 'hq', 'road'];
const STAGES9 = STAGE_IDS.slice(0, 9); // v5 codes know the first 9 stages
// secret words, each redeemable once per save (bit index = position); ichigo is once per local calendar day (iday)
export const CHEAT_IDS = ['ichigo', 'azarashi', 'shinshu', 'hamuhamu', 'hanpen', 'kyonkyon', 'zukan', 'ohayau'];
export const IDAY_MAX = 16383; // local day number (1 = 2026-01-01), 14 bits
export const localDay = (d = new Date()) => Math.max(1, Math.min(IDAY_MAX, Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 864e5) + 1));
export const MAX_DEBT = 300, MAX_COINS = 99999, CLEAR_T = 300;

export function emptyProfile() {
  const up = {}; for (const k of UPG_IDS) up[k] = 0;
  const st = {}; for (const k of STAGE_IDS) st[k] = emptyRec();
  return { lang: 'ja', bestTime: 0, bestKills: 0, bestLevel: 0, clears: 0, coins: 0, debt: 0, up, ach: 0, ach2: 0, cheats: 0, iday: 0, boost: 0, diff: 1, st };
}
// one stage: best time / kills over all difficulties, d = hardest difficulty cleared, by = exact records per difficulty (this browser only)
export const emptyRec = () => ({ t: 0, k: 0, d: 0, by: DIFFS.map(() => ({ t: 0, k: 0 })) });
// achievements are a bit set wider than 32 bits, so no `|` / `&` on them
const bitOf = i => 2 ** i;
export const achBit = (a, i) => Math.floor((Number(a) || 0) / bitOf(i)) % 2 === 1;
export const achOr = (a, b) => Number(BigInt(Math.floor(Number(a) || 0)) | BigInt(Math.floor(Number(b) || 0)));
export const achAll = () => 2 ** Math.min(ACH_MAIN, ACH_IDS.length) - 1;
export const achAll2 = () => 2 ** Math.max(0, ACH_IDS.length - ACH_MAIN) - 1;
const clampInt = (v, m) => Math.max(0, Math.min(m, Math.floor(Number(v) || 0)));
export const hasAch = (p, id) => { const i = ACH_IDS.indexOf(id); return i < 0 ? false : i < ACH_MAIN ? achBit(p.ach, i) : !!(((p.ach2 >>> 0) >>> (i - ACH_MAIN)) & 1); };
// set one achievement bit. Mutates p. returns false if it was already set
export function setAch(p, id) {
  const i = ACH_IDS.indexOf(id); if (i < 0 || hasAch(p, id)) return false;
  if (i < ACH_MAIN) p.ach = achOr(p.ach, 2 ** i); else p.ach2 = ((p.ach2 >>> 0) | (1 << (i - ACH_MAIN))) >>> 0;
  return true;
}
export const hasCheat = (p, id) => !!((p.cheats >>> 0) & (1 << CHEAT_IDS.indexOf(id)));
export const stageCleared = (p, id) => ((p.st && p.st[id] && p.st[id].t) || 0) >= CLEAR_T;
// fill in anything missing (older local saves, hand-made objects)
export function fixProfile(p) {
  const e = emptyProfile(), q = Object.assign(e, p || {});
  q.up = Object.assign(emptyProfile().up, p && p.up);
  q.st = emptyProfile().st;
  for (const k of STAGE_IDS) if (p && p.st && p.st[k]) {
    const s = p.st[k], r = q.st[k];
    r.t = clampInt(s.t, 99999); r.k = clampInt(s.k, 999999); r.d = clampInt(s.d, DIFFS.length);
    if (Array.isArray(s.by)) s.by.forEach((b, i) => { if (b && i < DIFFS.length) r.by[i] = { t: clampInt(b.t, 99999), k: clampInt(b.k, 999999) }; });
    else if (r.t > 0) r.by[1] = { t: r.t, k: r.k }; // older saves: count their records as ふつう
    if (!s.d && s.d !== 0 && r.t >= CLEAR_T) r.d = 2;
    for (let i = 0; i < DIFFS.length; i++) if (r.by[i].t >= CLEAR_T) r.d = Math.max(r.d, i + 1);
  }
  q.ach = Math.max(0, Math.min(achAll(), Math.floor(Number(q.ach) || 0))); q.ach2 = (Number(q.ach2) >>> 0) & achAll2(); q.cheats = (Number(q.cheats) >>> 0); q.iday = clampInt(q.iday, IDAY_MAX); q.boost = q.boost ? 1 : 0;
  q.diff = clampInt(q.diff ?? 1, DIFFS.length - 1);
  return q;
}

// ---------- generic bit packing ----------
function pack(fields, vals) { let v = 0n; for (const [k, w] of fields) v = (v << BigInt(w)) | BigInt(vals[k] & ((2 ** w) - 1)); return v; }
function unpack(fields, v) { const out = {}; for (let i = fields.length - 1; i >= 0; i--) { const [k, w] = fields[i]; out[k] = Number(v & ((1n << BigInt(w)) - 1n)); v >>= BigInt(w); } return out; }
function crc(v, dataBits, bits, poly) { // MSB-first CRC over dataBits bits of v
  let c = 0; const top = 1 << (bits - 1), all = (1 << bits) - 1;
  for (let i = dataBits - 1; i >= 0; i--) { const b = Number((v >> BigInt(i)) & 1n); const t = (c & top) ? 1 : 0; c = (c << 1) & all; if (t ^ b) c ^= poly; }
  return c;
}
function toChars(n, len) { let s = ''; for (let i = 0; i < len; i++) { s = ALPHA[Number(n % 31n)] + s; n /= 31n; } return s; }
function fromChars(s) { let n = 0n; for (const ch of s) n = n * 31n + BigInt(ALPHA.indexOf(ch)); return n; }
const group = s => s.match(/.{1,4}/g).join('-');
function inv(a, m) { let [r0, r1, s0, s1] = [a % m, m, 1n, 0n]; while (r1) { const q = r0 / r1;[r0, r1] = [r1, r0 - q * r1];[s0, s1] = [s1, s0 - q * s1]; } return ((s0 % m) + m) % m; }
// diffusion: multiply by a constant modulo 31^len so that a small change in progress changes the whole code
const M24 = 31n ** 24n, K24 = 0x5DEECE66D1F3A5B7C9n % M24, K24I = inv(K24, M24);
const M44 = 31n ** 44n, K44 = 0x9E3779B97F4A7C15F39CC0605CEDC8341082276BF3A27251n % M44, K44I = inv(K44, M44);
const M52 = 31n ** 52n, K52 = 0xC6A4A7935BD1E995B5AD4ECEDA1CE2A9D3B76F1C26E9A18F05D3E4F7A1B2C3D5n % M52, K52I = inv(K52, M52);
const M60 = 31n ** 60n, K60 = 0xD1B54A32D192ED03AEF5A4F1C3B2D7E9F08A6C5B4E3D2C1B0A9F8E7D6C5B4A39E3n % M60, K60I = inv(K60, M60);
const MASK_SRC = 0xBB67AE8584CAA73B3C6EF372FE94F82BA54FF53A5F1D36F1510E527FADE682D19B05688C2B3E6C1Fn;

// ---------- v5 (old): 9 stages -> 276 data bits + CRC-12 = 288 bits -> 60 base-31 chars (15 groups of 4) ----------
// ---------- v4 (52 chars, read; writer kept for tests): the first 7 stages, 232 data bits ----------
// per-stage records are rounded in the code (time: 5 s steps, kills: 20s); the browser keeps them exact, per difficulty.
// The code keeps each stage's best time/kills over all difficulties and the hardest difficulty cleared there (packed base 5).
const T_UNIT = 5, K_UNIT = 20, T_Q = 127, K_Q = 127;
const STAGES7 = STAGE_IDS.slice(0, 7); // v3 / v4 codes only know the first 7 stages
// v6 keeps time + kills for the first 9 stages and only the time for the newer ones (kills there stay in this browser)
// v8 adds the ichigo day and 9-bit stage times (up to 42:35, so endless records survive)
const mkFields = (achBits, stages, ach2, upg, v8) => [['ver', 3], ['lang', 2], ['bestLevel', 7], ['clears', 8], ['coins', 17], ['debt', 9],
  ...(upg || UPG10).map(k => ['u_' + k, V7_UPG_BITS[k]]), ['ach', achBits], ...(ach2 ? [['ach2', ach2]] : []), ['cheats', 8], ...(v8 ? [['iday', 14]] : []), ['boost', 1], ['diff', 2],
  ...stages.flatMap((k, i) => i < 9 ? [['t_' + k, v8 ? 9 : 7], ['k_' + k, 7]] : [['t_' + k, v8 ? 9 : 7]]), ['dclr', Math.ceil(Math.log2(5 ** stages.length))]];
const M104 = 31n ** 104n, K104 = 0xE7037ED1A0B428DB8EBC6AF09C88C6E3E3F43D2A9C5B7E1F0D2C4B6A8E9F1A3C5E7D9B2F4A6C8E0D1F3B5A7C9E2D4F6B8A0761D6478BD642F9B05688C2B3E6C1F5An % M104, K104I = inv(K104, M104);
const M92 = 31n ** 92n, K92 = 0xD6E8FEB86659FD93A0761D6478BD642FE7037ED1A0B428DB8EBC6AF09C88C6E3E3F43D2A9C5B7E1F0D2C4B6A8E9F1A3C5E7D9B2F4A6C8E0D1F3B5A7C9E2D4F6B8n % M92, K92I = inv(K92, M92);
const M84 = 31n ** 84n, K84 = 0xA0761D6478BD642FE7037ED1A0B428DB8EBC6AF09C88C6E3E3F43D2A9C5B7E1F0D2C4B6A8E9F1A3C5E7D9B2F4A6C8E0D1F3B5A7C9E2D4F6B8n % M84, K84I = inv(K84, M84);
const FMT = {
  4: { fields: mkFields(40, STAGES7), stages: STAGES7, len: 52, M: M52, K: K52, KI: K52I, ach: 40 },
  5: { fields: mkFields(52, STAGES9), stages: STAGES9, len: 60, M: M60, K: K60, KI: K60I, ach: 52 },
  6: { fields: mkFields(52, STAGE_IDS, ACH2_BITS), stages: STAGE_IDS, len: 84, M: M84, K: K84, KI: K84I, ach: 52, ach2: ACH2_BITS },
  7: { fields: mkFields(52, STAGE_IDS, ACH2_BITS, UPG_IDS), stages: STAGE_IDS, len: 92, M: M92, K: K92, KI: K92I, ach: 52, ach2: ACH2_BITS, upg: UPG_IDS },
  8: { fields: mkFields(52, STAGE_IDS, ACH2_BITS, UPG_IDS, true), stages: STAGE_IDS, len: 104, M: M104, K: K104, KI: K104I, ach: 52, ach2: ACH2_BITS, upg: UPG_IDS, tq: 511, iday: true }
};
FMT[4].src = 0xBB67AE8584CAA73B3C6EF372FE94F82BA54FF53A5F1D36F1510E527FADE682D19B05688C2Bn; FMT[5].src = MASK_SRC; // v4's mask must stay exactly as it was
FMT[6].src = (MASK_SRC << 128n) | 0x3C6EF372FE94F82BA54FF53A5F1D36F1n;
FMT[7].src = (FMT[6].src << 64n) | 0x9B05688C2B3E6C1Fn;
FMT[8].src = (FMT[7].src << 64n) | 0x510E527FADE682D1n;
for (const f of Object.values(FMT)) { f.data = f.fields.reduce((a, x) => a + x[1], 0); f.mask = f.src & ((1n << BigInt(f.data)) - 1n); }
const V_CRC = 12, V4_LEN = 52, V5_LEN = 60, V6_LEN = 84, V7_LEN = 92, V8_LEN = 104;
const V4_MAX = { bestLevel: 127, clears: 255, coins: MAX_COINS, debt: MAX_DEBT, cheats: (1 << CHEAT_IDS.length) - 1, boost: 1, diff: DIFFS.length - 1 };
export const CODE_LEN = V8_LEN;
// older code lengths that still restore, newest first (the code-entry help text is built from these)
export const OLD_LENS = [V7_LEN, 84, 60, 52, 44, 24, 12];
const q = (v, u, m) => { v = Math.floor(Number(v) || 0); return v <= 0 ? 0 : Math.min(m, Math.max(1, Math.floor(v / u))); }; // >0 stays >0
const bigPack = (fields, vals) => { let v = 0n; for (const [k, w] of fields) v = (v << BigInt(w)) | (BigInt(vals[k]) & ((1n << BigInt(w)) - 1n)); return v; };
const bigUnpack = (fields, v) => { const out = {}; for (let i = fields.length - 1; i >= 0; i--) { const [k, w] = fields[i]; out[k] = Number(v & ((1n << BigInt(w)) - 1n)); v >>= BigInt(w); } return out; };

function encodeFmt(p, ver) {
  const F = FMT[ver]; p = fixProfile(p);
  const vals = { ver: ver & 7, lang: Math.max(0, LANGS.indexOf(p.lang)) }; // the 3-bit field holds v8 as 0 (the length tells the formats apart)
  for (const k in V4_MAX) vals[k] = clampInt(p[k], V4_MAX[k]);
  vals.ach = Number(BigInt(Math.floor(p.ach)) & ((1n << BigInt(F.ach)) - 1n)); vals.cheats = (p.cheats >>> 0) & V4_MAX.cheats;
  if (F.ach2) vals.ach2 = (p.ach2 >>> 0) & achAll2();
  for (const k of F.upg || UPG10) vals['u_' + k] = clampInt(p.up[k], UPG_MAX[k]);
  let dc = 0; for (const k of F.stages.slice().reverse()) dc = dc * 5 + clampInt(p.st[k].d, 4);
  vals.dclr = dc;
  if (F.iday) vals.iday = clampInt(p.iday, IDAY_MAX);
  for (const k of F.stages) { vals['t_' + k] = q(p.st[k].t, T_UNIT, F.tq || T_Q); vals['k_' + k] = q(p.st[k].k, K_UNIT, K_Q); }
  const v = bigPack(F.fields, vals) ^ F.mask;
  return group(toChars((((v << BigInt(V_CRC)) | BigInt(crc(v, F.data, V_CRC, 0x80F))) * F.K) % F.M, F.len));
}
export const encode = p => encodeFmt(p, 8);
export const encodeV7 = p => encodeFmt(p, 7);
export const encodeV6 = p => encodeFmt(p, 6);
export const encodeV5 = p => encodeFmt(p, 5);
export const encodeV4 = p => encodeFmt(p, 4);
function decodeFmt(s, ver) {
  const F = FMT[ver], n = (fromChars(s) * F.KI) % F.M;
  if (n >> BigInt(F.data + V_CRC)) return null;
  const c = Number(n & BigInt((1 << V_CRC) - 1)), v = n >> BigInt(V_CRC);
  if (crc(v, F.data, V_CRC, 0x80F) !== c) return null;
  const vals = bigUnpack(F.fields, v ^ F.mask);
  if (vals.ver !== (ver & 7) || vals.lang > 2 || vals.ach > achAll() || vals.dclr >= 5 ** F.stages.length) return null;
  if (F.ach2 && vals.ach2 > achAll2()) return null;
  for (const k in V4_MAX) if (vals[k] > V4_MAX[k]) return null;
  const p = emptyProfile(); p.lang = LANGS[vals.lang];
  for (const k in V4_MAX) p[k] = vals[k];
  p.ach = vals.ach; if (F.ach2) p.ach2 = vals.ach2; if (F.iday) { if (vals.iday > IDAY_MAX) return null; p.iday = vals.iday; }
  for (const k of F.upg || UPG10) { if (vals['u_' + k] > UPG_MAX[k]) return null; p.up[k] = vals['u_' + k]; }
  let dc = vals.dclr;
  for (const k of F.stages) {
    const r = p.st[k]; r.t = vals['t_' + k] * T_UNIT; r.k = (vals['k_' + k] || 0) * K_UNIT; r.d = dc % 5; dc = Math.floor(dc / 5);
    if (r.d > 0) r.by[r.d - 1] = { t: Math.max(r.t, CLEAR_T), k: r.k }; else if (r.t > 0) r.by[1] = { t: r.t, k: r.k };
    p.bestTime = Math.max(p.bestTime, r.t); p.bestKills = Math.max(p.bestKills, r.k);
  }
  return p;
}

// ---------- v3 (44 chars, read; writer kept for tests) ----------
const V3 = [['ver', 3], ['lang', 2], ['bestLevel', 7], ['clears', 8], ['coins', 17], ['debt', 9],
  ...UPG10.map(k => ['u_' + k, V3_UPG_BITS[k]]), ['ach', 30], ['cheats', 8], ['boost', 1],
  ...STAGES7.flatMap(k => [['t_' + k, 7], ['k_' + k, 7]])];
const V3_DATA = V3.reduce((a, f) => a + f[1], 0), V3_CRC = 12, V3_LEN = 44, V3_VER = 3;
const V3_MAX = { bestLevel: 127, clears: 255, coins: MAX_COINS, debt: MAX_DEBT, ach: (2 ** V3_ACH) - 1, cheats: (1 << CHEAT_IDS.length) - 1, boost: 1 };
const V3_MASK = 0x6A09E667F3BCC908B2FB1366EA957D3E3ADEC17512775099DA2F590B0667322An & ((1n << BigInt(V3_DATA)) - 1n);
export function encodeV3(p) {
  p = fixProfile(p);
  const vals = { ver: V3_VER, lang: Math.max(0, LANGS.indexOf(p.lang)) };
  for (const k in V3_MAX) vals[k] = clampInt(p[k], V3_MAX[k]);
  vals.ach = Number(BigInt(Math.floor(p.ach)) & BigInt(V3_MAX.ach)); vals.cheats = (p.cheats >>> 0) & V3_MAX.cheats;
  for (const k of UPG10) vals['u_' + k] = clampInt(p.up[k], UPG_MAX[k]);
  for (const k of STAGES7) { vals['t_' + k] = q(p.st[k].t, T_UNIT, T_Q); vals['k_' + k] = q(p.st[k].k, K_UNIT, K_Q); }
  const v = pack(V3, vals) ^ V3_MASK;
  return group(toChars((((v << BigInt(V3_CRC)) | BigInt(crc(v, V3_DATA, V3_CRC, 0x80F))) * K44) % M44, V3_LEN));
}
function decodeV3(s) {
  const n = (fromChars(s) * K44I) % M44;
  if (n >> BigInt(V3_DATA + V3_CRC)) return null;
  const c = Number(n & BigInt((1 << V3_CRC) - 1)), v = n >> BigInt(V3_CRC);
  if (crc(v, V3_DATA, V3_CRC, 0x80F) !== c) return null;
  const vals = unpack(V3, v ^ V3_MASK);
  if (vals.ver !== V3_VER || vals.lang > 2) return null;
  for (const k in V3_MAX) if (vals[k] > V3_MAX[k]) return null;
  const p = emptyProfile(); p.lang = LANGS[vals.lang];
  for (const k in V3_MAX) p[k] = vals[k];
  p.ach >>>= 0;
  for (const k of UPG10) { if (vals['u_' + k] > UPG_MAX[k]) return null; p.up[k] = vals['u_' + k]; }
  for (const k of STAGES7) { const t = vals['t_' + k] * T_UNIT, kk = vals['k_' + k] * K_UNIT; p.st[k] = emptyRec(); Object.assign(p.st[k], { t, k: kk, d: t >= CLEAR_T ? 2 : 0 }); if (t > 0) p.st[k].by[1] = { t, k: kk }; p.bestTime = Math.max(p.bestTime, p.st[k].t); p.bestKills = Math.max(p.bestKills, p.st[k].k); }
  return p;
}

// ---------- v2 (24 chars, read; writer kept for tests) ----------
const V2 = [['ver', 3], ['lang', 2], ['bestTime', 11], ['bestKills', 12], ['bestLevel', 7], ['clears', 7], ['coins', 14], ['debt', 9],
  ...V2_UPG.map(k => ['u_' + k, V2_UPG_BITS[k]]), ['ach', 24]];
const V2_DATA = V2.reduce((a, f) => a + f[1], 0), V2_CRC = 12, V2_LEN = 24, V2_VER = 2;
const V2_MAX = { bestTime: 2047, bestKills: 4095, bestLevel: 127, clears: 127, coins: 16383, debt: MAX_DEBT, ach: (1 << 15) - 1 };
const V2_MASK = 0x2B7E151628AED2A6ABF7158809CF4F3Cn & ((1n << BigInt(V2_DATA)) - 1n);
export function encodeV2(p) {
  const qq = Object.assign(emptyProfile(), p), up = Object.assign(emptyProfile().up, p && p.up);
  const vals = { ver: V2_VER, lang: Math.max(0, LANGS.indexOf(qq.lang)) };
  for (const k in V2_MAX) vals[k] = clampInt(qq[k], V2_MAX[k]);
  vals.ach = (Number(qq.ach) >>> 0) & V2_MAX.ach;
  for (const k of V2_UPG) vals['u_' + k] = clampInt(up[k], UPG_MAX[k]);
  const v = pack(V2, vals) ^ V2_MASK;
  return group(toChars((((v << BigInt(V2_CRC)) | BigInt(crc(v, V2_DATA, V2_CRC, 0x80F))) * K24) % M24, V2_LEN));
}
function decodeV2(s) {
  const n = (fromChars(s) * K24I) % M24;
  if (n >> BigInt(V2_DATA + V2_CRC)) return null;
  const c = Number(n & BigInt((1 << V2_CRC) - 1)), v = n >> BigInt(V2_CRC);
  if (crc(v, V2_DATA, V2_CRC, 0x80F) !== c) return null;
  const vals = unpack(V2, v ^ V2_MASK);
  if (vals.ver !== V2_VER || vals.lang > 2) return null;
  for (const k in V2_MAX) if (vals[k] > V2_MAX[k]) return null;
  const p = emptyProfile(); p.lang = LANGS[vals.lang];
  for (const k in V2_MAX) p[k] = vals[k];
  for (const k of V2_UPG) { if (vals['u_' + k] > UPG_MAX[k]) return null; p.up[k] = vals['u_' + k]; }
  return fromOld(p);
}
// older saves had one 信州 run (りんご畑 → いちご畑 → 競馬場). Map its records onto the new stages.
function fromOld(p) {
  p.st.apple = { t: Math.min(p.bestTime, 635), k: p.bestKills };
  if (p.clears > 0) { p.st.apple.t = Math.max(p.st.apple.t, CLEAR_T); p.st.berry.t = CLEAR_T; p.st.race.t = CLEAR_T; }
  if (hasAch(p, 'cageClear')) p.st.cage.t = CLEAR_T; else if (hasAch(p, 'survive3')) p.st.cage.t = T_UNIT; // the cage stayed open in Phase 1
  for (const k of ['apple', 'berry', 'race', 'cage']) p.st[k] = { t: p.st[k].t, k: p.st[k].k }; // fixProfile rebuilds d / by
  return fixProfile(p);
}

// ---------- v1 (read only) ----------
const V1 = [['ver', 2], ['lang', 2], ['bestTime', 9], ['bestKills', 11], ['bestLevel', 6], ['clears', 6], ['boss', 1], ['seen', 10], ['maxSeals', 2]];
const V1_DATA = 49, V1_CRC = 10, V1_LEN = 12;
const V1_MASK = 0x1A5C3F09B27D6n & ((1n << 49n) - 1n);
export function decodeV1Raw(s) { // -> v1 record or null
  const n = fromChars(s);
  if (n >> BigInt(V1_DATA + V1_CRC)) return null;
  const c = Number(n & BigInt((1 << V1_CRC) - 1)), v = n >> BigInt(V1_CRC);
  if (crc(v, V1_DATA, V1_CRC, 0x233) !== c) return null;
  const r = unpack(V1, v ^ V1_MASK);
  if (r.ver !== 1 || r.lang > 2 || r.bestTime > 300) return null;
  r.lang = LANGS[r.lang]; return r;
}
// for tests / tools: write an old-style 12-char code
export function encodeV1(r) {
  const vals = { ver: 1, lang: Math.max(0, LANGS.indexOf(r.lang || 'ja')), bestTime: clampInt(r.bestTime, 300), bestKills: clampInt(r.bestKills, 2047), bestLevel: clampInt(r.bestLevel, 63), clears: clampInt(r.clears, 63), boss: clampInt(r.boss, 1), seen: clampInt(r.seen, 1023), maxSeals: clampInt(r.maxSeals, 3) };
  const v = pack(V1, vals) ^ V1_MASK;
  return group(toChars((v << BigInt(V1_CRC)) | BigInt(crc(v, V1_DATA, V1_CRC, 0x233)), V1_LEN));
}
// v1 record -> profile (records kept, matching achievements granted)
export function fromV1(r) {
  const p = emptyProfile(); p.lang = r.lang;
  for (const k of ['bestTime', 'bestKills', 'bestLevel', 'clears']) p[k] = r[k];
  const give = id => { p.ach = achOr(p.ach, 2 ** ACH_IDS.indexOf(id)); };
  if (r.clears > 0) give('firstClear');
  if (r.boss) give('crowKing');
  if (r.bestTime >= 180) give('survive3');
  if (r.maxSeals >= 3) give('seals3');
  if (r.bestKills >= 1000) give('kills1000');
  if (r.bestLevel >= 30) give('lv30');
  return fromOld(p);
}

// Normalise what a person (or a phone keyboard) might type: full-width chars, lower case, spaces, dashes, long vowel marks.
export function normalize(str) {
  return String(str || '').normalize('NFKC').toUpperCase().replace(/[\s\-‐‑‒–—―ーｰ・.,_、。/]/g, '');
}

// returns { ok: true, profile, old } or { ok: false, reason: 'empty' | 'length' | 'char' | 'check' }
export function decode(str) {
  const s = normalize(str);
  if (!s) return { ok: false, reason: 'empty' };
  for (const ch of s) if (!ALPHA.includes(ch)) return { ok: false, reason: 'char', ch };
  if (s.length === V8_LEN) { const p = decodeFmt(s, 8); return p ? { ok: true, profile: p, old: false } : { ok: false, reason: 'check' }; }
  if (s.length === V7_LEN) { const p = decodeFmt(s, 7); return p ? { ok: true, profile: p, old: true } : { ok: false, reason: 'check' }; }
  if (s.length === V6_LEN) { const p = decodeFmt(s, 6); return p ? { ok: true, profile: p, old: true } : { ok: false, reason: 'check' }; }
  if (s.length === V5_LEN) { const p = decodeFmt(s, 5); return p ? { ok: true, profile: p, old: true } : { ok: false, reason: 'check' }; }
  if (s.length === V4_LEN) { const p = decodeFmt(s, 4); return p ? { ok: true, profile: p, old: true } : { ok: false, reason: 'check' }; }
  if (s.length === V3_LEN) { const p = decodeV3(s); return p ? { ok: true, profile: fixProfile(p), old: true } : { ok: false, reason: 'check' }; }
  if (s.length === V2_LEN) { const p = decodeV2(s); return p ? { ok: true, profile: p, old: true } : { ok: false, reason: 'check' }; }
  if (s.length === V1_LEN) { const r = decodeV1Raw(s); return r ? { ok: true, profile: fromV1(r), old: true } : { ok: false, reason: 'check' }; }
  return { ok: false, reason: 'length', len: s.length };
}

// Restoring a code never loses local progress: keep the best of both.
export function merge(a, b) {
  a = fixProfile(a); b = fixProfile(b);
  const r = emptyProfile();
  for (const k of ['bestTime', 'bestKills', 'bestLevel', 'clears']) r[k] = Math.max(a[k] || 0, b[k] || 0);
  for (const k of UPG_IDS) r.up[k] = Math.max(a.up[k] || 0, b.up[k] || 0);
  for (const k of STAGE_IDS) { const x = a.st[k], y = b.st[k]; r.st[k] = { t: Math.max(x.t, y.t), k: Math.max(x.k, y.k), d: Math.max(x.d, y.d), by: x.by.map((o, i) => ({ t: Math.max(o.t, y.by[i].t), k: Math.max(o.k, y.by[i].k) })) }; }
  r.diff = b.diff;
  r.ach = achOr(a.ach, b.ach); r.ach2 = ((a.ach2 >>> 0) | (b.ach2 >>> 0)) >>> 0; r.cheats = (a.cheats | b.cheats) >>> 0; r.boost = a.boost | b.boost;
  // wallet: take the richer one as a whole (coins and its debt stay together)
  const w = (b.coins || 0) - (b.debt || 0) >= (a.coins || 0) - (a.debt || 0) ? b : a;
  r.coins = w.coins || 0; r.debt = w.debt || 0;
  r.lang = b.lang || a.lang || 'ja';
  return r;
}

// the browser keeps an exact copy (JSON); the code is only the portable backup
const KEY = 'kyoka-save-v3', KEY_V2 = 'kyoka-save-v2', KEY_V1 = 'kyoka-save-v1';
export function loadLocal() {
  try {
    const j = localStorage.getItem(KEY); if (j) { const o = JSON.parse(j); if (o && typeof o === 'object') return fixProfile(o); }
    for (const k of [KEY_V2, KEY_V1]) { const s = localStorage.getItem(k); if (s) { const r = decode(s); if (r.ok) return r.profile; } }
  } catch (e) { }
  return null;
}
export function saveLocal(p) { try { localStorage.setItem(KEY, JSON.stringify(fixProfile(p))); return true; } catch (e) { return false; } }

// read-only description of every code layout, for tools/gen-save-docs.mjs (the docs tables are generated from this)
export const SAVE_LAYOUT = {
  alphabet: ALPHA, crcBits: V_CRC, crcPoly: 0x80F, v1: { len: V1_LEN, data: V1_DATA, crcBits: V1_CRC, crcPoly: 0x233, fields: V1 },
  v2: { len: V2_LEN, data: V2_DATA, fields: V2 }, v3: { len: V3_LEN, data: V3_DATA, fields: V3 },
  fmt: Object.fromEntries(Object.entries(FMT).map(([v, f]) => [v, { len: f.len, data: f.data, fields: f.fields, stages: f.stages, upg: f.upg || UPG10 }])),
  T_UNIT, K_UNIT, keys: { save: KEY, old: [KEY_V2, KEY_V1] }
};
