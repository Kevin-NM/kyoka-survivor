// Kyoka Survivors — fan-made. Game logic + HD-2D rendering via three.js.
import { buildAtlas, buildGlow, buildGround } from './art.js';
import { Renderer } from './render.js';
import { Snd } from './audio.js';
import { I18N } from './i18n.js';
import { encode, decode, emptyProfile, fixProfile, loadLocal, saveLocal, normalize, CODE_LEN, hasAch, DIFFS } from './save.js';
import { SAVE_T, GUIDE } from './guide.js';
import { META_T } from './ui-text.js';
import { UPGRADES, UPG_IDS, UPG_MAX, canBuy, buy, runCoins, bank, grant, allBought, CHARS, STAGES, STAGE_IDS, charOpen, stageOpen, endlessOpen, unlockSet, prevStage, stageCleared, refundAll, spentTotal, redeemCheat, hasCheat, ACH, ACH_IDS, UNLOCK_BY, ZUKAN, zukanOpen, MAX_DEBT, DIFF, recordRun } from './meta.js';
import { P2 } from './text2.js';
import './text3.js';
import './text4.js';
import './text5.js';
import './text6.js';
import { RUN_T, SHOP_T, SP_T } from './text7.js';
import { CINE, CINE_ORDER, makeCine, tickCine, drawCine } from './cine.js';
import { encodeRun, decodeRun, isRunLen } from './runcode.js';
import { LOOKS6, SUNRISE, PROPS6, ETYPES6, SDEF6, ERAS, PART_COL6, LIFT6, STAGE_FOODS, FOOD_HP6, ITEM_GLOW6, THUMB6 } from './stages6.js';

const $ = id => document.getElementById(id);
const TAU = Math.PI * 2, WIN_T = 300, BOSS_T = 210;
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
function hash(x, y, s) { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
const hex = c => [(c >> 16 & 255) / 255, (c >> 8 & 255) / 255, (c & 255) / 255];

const ATLAS = buildAtlas(), R = ATLAS.R;
const RD = new Renderer($('game'), ATLAS, buildGlow(), Array.from({ length: 22 }, (_, i) => buildGround(i)));
let lang = (() => { try { return localStorage.getItem('kyoka-lang') || 'ja'; } catch (e) { return 'ja'; } })();
const T = () => I18N[lang];
const ST = () => SAVE_T[lang];
const MT = () => META_T[lang];
const PT = () => P2[lang];
for (const l in P2) Object.assign(I18N[l].items, P2[l].items);
// ---------- password save / auto-save ----------
let profile = loadLocal() || emptyProfile();
try { if (!localStorage.getItem('kyoka-lang') && loadLocal()) lang = profile.lang; } catch (e) { }
// bank coins earned so far and update records. Safe to call many times in one run (only the new part is banked).
function settleRun(won) {
  if (!G) return profile;
  const p = profile;
  if (won && !G.clearCounted) { G.clearCounted = true; G.cleared = true; p.clears = Math.min(127, p.clears + 1); }
  const total = runCoins({ picked: G.picked, time: G.t, kills: G.kills, won: G.cleared, bosses: G.bossKills, diff: G.diff }, p), earned = total - G.coinsBanked;
  if (earned > 0) { G.coinsBanked = total; const r = bank(p, earned); G.repaid += r.repaid; G.gained += r.gained; if (r.cleared) { G.paidOff = true; achNote('debtFree'); } }
  recordRun(p.st[G.sid], G.di, Math.min(99999, G.t), Math.min(999999, G.kills), G.cleared); p.diff = G.di;
  p.bestTime = Math.max(p.bestTime, Math.min(2047, Math.floor(G.t))); p.bestKills = Math.max(p.bestKills, Math.min(4095, G.kills)); p.bestLevel = Math.max(p.bestLevel, Math.min(127, G.lvl));
  return p;
}
// best survival time anywhere (endless runs included), the same number on the title and after restoring a code
const bestT = p => Math.max(p.bestTime || 0, ...STAGE_IDS.map(k => (p.st[k] && p.st[k].t) || 0));
// stage card record: the real best time (endless time shows with ∞), kills only where they are stored (> 0)
function stageBest(pt, r) { const t = (r.t > 300 ? '∞ ' : '') + fmtTime(r.t); return r.k > 0 ? pt.best.replace('{t}', t).replace('{k}', r.k) : pt.bestT.replace('{t}', t); }
function commitProfile(p) { profile = p; profile.lang = lang; saveLocal(profile); }
function fmtTime(s) { return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function fillCode(id) {
  const box = $(id), st = ST(), c = encode(profile); box.querySelector('.cl').textContent = st.code;
  const gs = c.split('-'), part = (a, b) => `<span class="cline">${gs.slice(a, b).map((g, i) => `<span class="cg">${g}${a + i < gs.length - 1 ? '-' : ''}</span>`).join('')}</span>`;
  const per = innerWidth < 560 && gs.length > 15 ? 6 : 7; let h = ''; for (let i = 0; i < gs.length; i += per) h += part(i, Math.min(gs.length, i + per)); box.querySelector('.code').innerHTML = h;
  box.querySelector('.copy').textContent = st.copy; box.querySelector('.cmsg').textContent = ''; box.querySelector('.ch').innerHTML = st.shot + '<br><small>' + st.auto + '</small>';
}
async function copyText(txt) {
  try { if (navigator.clipboard && window.isSecureContext !== false) { await navigator.clipboard.writeText(txt); return true; } } catch (e) { }
  try { const ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, txt.length); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch (e) { return false; }
}
function formatCodeInput(raw) { const t = normalize(raw).slice(0, CODE_LEN); return t.replace(/(.{4})(?=.)/g, '$1-'); }
function updateRec() {
  const st = ST(), p = profile, any = p.bestTime || p.clears || p.bestLevel || p.bestKills;
  $('t-rec').textContent = any ? st.rec.replace('{t}', fmtTime(bestT(p))).replace('{l}', p.bestLevel).replace('{c}', p.clears) + ({ ja: '・', zh: '｜', en: ' · ' }[lang]) + MT().coinRec.replace('{n}', p.coins) + (p.debt ? (lang === 'en' ? ` (${MT().debt} ${p.debt})` : `（${MT().debt} ${p.debt}）`) : '') : '';
}
let modal = null;
function openModal(id) { modal = id; show(id, true); }
function closeModal() { if (!modal) return; show(modal, false); modal = null; }
function openCodeIn(run) {
  const st = ST(); $('ci-title').textContent = run ? RT().enterTitle : st.enterTitle; $('ci-help').innerHTML = run ? RT().enterHelp : st.enterHelp; $('ci-paste').textContent = st.paste; $('ci-clear').textContent = st.clear;
  $('ci-ok').textContent = st.ok; $('ci-back').textContent = st.back; $('ci-msg').textContent = ''; $('ci-msg').className = 'cimsg';
  openModal('codein'); setTimeout(() => { if (!isTouch) $('ci-input').focus(); }, 50);
}
function ciMsg(txt, good) { const m = $('ci-msg'); m.textContent = txt; m.className = 'cimsg ' + (good ? 'good' : 'bad'); }
function submitCode() {
  const raw = normalize($('ci-input').value);
  if (isRunLen(raw.length)) { // a 続きコード: start that run
    const rr = decodeRun(raw), why = runProblem(rr);
    if (why) { ciMsg(RT().bad[why], false); return false; }
    $('ci-input').value = ''; restoreRun(rr); return true;
  }
  const st = ST(), r = decode($('ci-input').value);
  if (!r.ok) { ciMsg(st.bad[r.reason].replace('{n}', r.len).replace('{c}', r.ch), false); return false; }
  let chosen = null; try { chosen = localStorage.getItem('kyoka-lang'); } catch (e) { }
  if (!chosen) { lang = r.profile.lang; try { localStorage.setItem('kyoka-lang', lang); } catch (e) { } } // keep a language the player already picked
  r.profile.lang = lang;
  // the code replaces the whole meta state: nothing from the current save merges in
  commitProfile(fixProfile(r.profile)); validSel(); applyLang(); openCodeIn(); $('ci-input').value = encode(profile);
  ciMsg(ST().okMsg + '\n' + ST().rec.replace('{t}', fmtTime(bestT(profile))).replace('{l}', profile.bestLevel).replace('{c}', profile.clears), true);
  $('ci-msg').style.whiteSpace = 'pre-line'; try { Snd.init(); Snd.fx.levelup(); } catch (e) { }
  setTimeout(() => { if (modal === 'codein') closeModal(); }, 1800);
  return true;
}
function openGuide(tab) {
  const g = GUIDE[lang];
  $('g-title').textContent = g.title; $('g-tab-easy').textContent = g.easy; $('g-tab-more').textContent = g.more; $('g-close').textContent = g.close;
  $('g-easy').innerHTML = `<div class="steps">${g.steps.map((s, i) => `<div class="step"><div class="n">${i + 1}</div><div class="i">${s[0]}</div><div class="tx">${s[1]}</div></div>`).join('')}</div><div class="enote">${g.easyNote}</div>`;
  $('g-more').innerHTML = g.sections.map(s => `<div class="sec"><h3>${s[0]}</h3><p>${s[1]}</p></div>`).join('');
  guideTab(tab || 'easy'); openModal('guide');
}
function updateGuideHint() {
  const body = $('g-more'), hint = $('g-hint');
  if ($('g-more').classList.contains('hide')) { hint.classList.add('hide'); return; }
  const more = body.scrollHeight > body.clientHeight + 12 && body.scrollTop + body.clientHeight < body.scrollHeight - 16;
  hint.textContent = GUIDE[lang].moreHint; hint.classList.toggle('hide', !more);
}
function guideTab(t) {
  $('g-tab-easy').classList.toggle('on', t === 'easy'); $('g-tab-more').classList.toggle('on', t === 'more');
  show('g-easy', t === 'easy'); show('g-more', t === 'more'); $('g-' + t).scrollTop = 0;
  updateGuideHint();
}
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
function resize() { RD.resize(innerWidth, innerHeight, Math.min(window.devicePixelRatio || 1, 1.5)); }
addEventListener('resize', resize); resize();

const dataURL = (name, s) => { const r = R[name], c = document.createElement('canvas'); c.width = r.w * s; c.height = r.h * s; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(r.canvas, 0, 0, c.width, c.height); return c.toDataURL(); };
const ICON_SRC = { berry: 'berry', lariat: 'belt', beam: 'bolt', penlight: 'pen0', horse: 'horse0', seal: 'seal0', pannier: 'dress', shoes: 'shoe', ribbon: 'bow', oyaki: 'oyaki', brush: 'brush', drum: 'drum', gobelt: 'gobelt', suzuri: 'suzuri', evo_berry: 'shower', evo_beam: 'boom', evo_seal: 'sealking', evo_brush: 'kanji0', mic: 'mic', apple: 'apple', metro: 'metro', nodoame: 'nodoame', basket: 'basket', evo_drum: 'fever', evo_mic: 'encore', evo_apple: 'tornado',
  ham: 'hball', fan: 'uchiwa', guitar: 'guitar', omamori: 'omamori', gakufu: 'gakufu', wasabi: 'wasabi',
  evo_lariat: 'giga', evo_penlight: 'penSea', evo_horse: 'stampede', evo_ham: 'hparade', evo_fan: 'whirlFan', evo_guitar: 'gsolo', cyalume: 'cyal', evo_cyalume: 'minilive' };
const ICON = {}; for (const k in ICON_SRC) ICON[k] = dataURL(ICON_SRC[k], 4);
// small stat boosts offered once every weapon and passive is maxed (or the slots are full); they stack, some up to a cap
const BOOST = { b_atk: { cap: Infinity, ic: 'suzuri' }, b_hp: { cap: Infinity, ic: 'pannier' }, b_spd: { cap: 20, ic: 'shoes' }, b_mag: { cap: 20, ic: 'ribbon' }, b_cd: { cap: 25, ic: 'metro' }, b_area: { cap: 25, ic: 'gobelt' }, b_regen: { cap: 20, ic: 'oyaki' }, b_coin: { cap: Infinity, ic: null } };
const BOOST_IDS = Object.keys(BOOST);
for (const k of BOOST_IDS) ICON[k] = BOOST[k].ic ? ICON[BOOST[k].ic] : dataURL('coin', 4);
const MAX_W = 6, MAX_P = 5; // slots per run, like the classic survivors games
// endless: 7 / 8 / 9 / 10 weapon slots at 5:00 / 6:30 / 8:00 / 9:30, then one more every 60 s until every weapon this run can get fits
// (avail = how many weapons the run can obtain; 21 with everything open, so the last slot comes at 20:30)
const wCap = (endless, t, avail) => {
  if (!endless || t < WIN_T) return MAX_W;
  const early = MAX_W + Math.min(4, 1 + Math.floor((t - WIN_T) / 90)); if (early < MAX_W + 4) return early;
  return MAX_W + 4 + Math.max(0, Math.min(Math.floor((t - 570) / 60), (avail || 0) - MAX_W - 4));
};
// weapons the current run can obtain: every common weapon, plus stage weapons that are open here (or already held)
const wAvail = () => WEAPONS.filter(wepOpen).length;
const wCapG = () => wCap(G.endless, G.t, wAvail());
// app icon (README / favicon): kyon's face on a pink tile with a strawberry and a seal. 64x64 pixel art; scale up with nearest-neighbour.
function makeIcon() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  const rr = (X, Y, W, H, r, f) => { x.fillStyle = f; x.beginPath(); x.roundRect(X, Y, W, H, r); x.fill(); };
  rr(1, 1, 62, 62, 14, '#3a1a3a'); rr(3, 3, 58, 58, 12, '#ff8fbd'); rr(5, 5, 54, 54, 10, '#ffd0e2');
  x.fillStyle = '#ffffff'; for (const [a, b] of [[11, 12], [52, 10], [54, 30], [9, 34]]) { x.fillRect(a, b - 1, 1, 3); x.fillRect(a - 1, b, 3, 1); }
  x.drawImage(R.ky0.canvas, 4, 0, 26, 26, 6, 2, 52, 52);
  const sb = R.berry, ss = R.seal0;
  x.drawImage(sb.canvas, 4, 62 - sb.h * 1.5, sb.w * 1.5, sb.h * 1.5);
  x.drawImage(ss.canvas, 60 - ss.w, 62 - ss.h, ss.w, ss.h);
  return c;
}
function iconPNG(size) { const src = makeIcon(), c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'); x.imageSmoothingEnabled = size < 64; x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, size, size); return c.toDataURL('image/png'); }
// portrait: crop Kyoka's head
const PORTRAIT = (() => { const r = R.ky0, c = document.createElement('canvas'); c.width = c.height = 26 * 4; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(r.canvas, 4, 0, 26, 26, 0, 0, 104, 104); return c.toDataURL(); })();

// ---------- biome looks ----------
const LOOKS = [
  { amb: [1.04, 1.0, 0.92], fog: [0.62, 0.74, 0.66], fogMax: 0.38, pool: [0.05, 0.045, 0.02], gain: [1.02, 1.0, 0.96], lift: [0.03, 0.02, 0.05], sat: 1.1, vig: 0.55, bloom: 0.5, shadow: [0.06, 0.04, 0.12, 0.45] },
  { amb: [1.04, 0.99, 0.98], fog: [0.8, 0.66, 0.72], fogMax: 0.45, pool: [0.06, 0.04, 0.04], gain: [1.03, 0.99, 0.99], lift: [0.04, 0.02, 0.05], sat: 1.14, vig: 0.5, bloom: 0.55, shadow: [0.12, 0.04, 0.12, 0.42] },
  { amb: [1.08, 0.94, 0.84], fog: [0.88, 0.64, 0.56], fogMax: 0.44, pool: [0.1, 0.05, 0.0], gain: [1.04, 0.98, 0.92], lift: [0.05, 0.02, 0.07], sat: 1.14, vig: 0.65, bloom: 0.72, shadow: [0.2, 0.05, 0.12, 0.48] },
  { amb: [1.05, 1.0, 0.92], fog: [0.9, 0.8, 0.66], fogMax: 0.32, pool: [0.08, 0.05, 0.01], gain: [1.03, 1.0, 0.95], lift: [0.04, 0.03, 0.04], sat: 1.08, vig: 0.62, bloom: 0.55, shadow: [0.2, 0.1, 0.05, 0.4] },
  { amb: [1.06, 1.02, 0.94], fog: [0.7, 0.82, 0.72], fogMax: 0.34, pool: [0.05, 0.045, 0.02], gain: [1.03, 1.01, 0.96], lift: [0.03, 0.02, 0.04], sat: 1.16, vig: 0.5, bloom: 0.5, shadow: [0.06, 0.05, 0.12, 0.42] },
  { amb: [0.94, 0.97, 1.04], fog: [0.72, 0.8, 0.94], fogMax: 0.36, pool: [0.02, 0.03, 0.06], gain: [0.97, 0.99, 1.03], lift: [0.02, 0.03, 0.06], sat: 1.0, vig: 0.5, bloom: 0.42, shadow: [0.16, 0.2, 0.42, 0.4] },
  { amb: [0.86, 0.8, 1.0], fog: [0.14, 0.08, 0.26], fogMax: 0.5, pool: [0.0, 0.0, 0.05], gain: [0.98, 0.92, 1.08], lift: [0.04, 0.02, 0.09], sat: 1.2, vig: 0.72, bloom: 0.95, shadow: [0.02, 0.0, 0.1, 0.55] },
  { amb: [1.06, 1.0, 1.0], fog: [0.94, 0.82, 0.9], fogMax: 0.36, pool: [0.06, 0.04, 0.05], gain: [1.03, 1.0, 1.0], lift: [0.05, 0.03, 0.06], sat: 1.12, vig: 0.48, bloom: 0.65, shadow: [0.14, 0.06, 0.16, 0.4] },
  { amb: [1.06, 0.96, 0.9], fog: [0.86, 0.6, 0.52], fogMax: 0.4, pool: [0.08, 0.03, 0.01], gain: [1.04, 0.98, 0.94], lift: [0.05, 0.02, 0.04], sat: 1.15, vig: 0.58, bloom: 0.75, shadow: [0.2, 0.04, 0.08, 0.45] }
];
// stage id -> ground/look index, music, enemy mix, waves, boss
const SDEF = {
  apple: { g: 0, song: 'main', boss: 'boss', summon: 'crow', waves: ['cater', 'stink', 'crow'], mix: t => [['cater', 3], ['crow', t > 30 ? 2.2 : 0], ['bee', t > 50 ? 1.4 : 0], ['stink', t > 80 ? 1.6 : 0], ['mole', t > 160 ? 1 : 0], ['kuma', t > 200 ? 0.6 : 0]] },
  berry: { g: 1, song: 'berry', boss: 'bmole', summon: 'mole', waves: ['slug', 'stink', 'slug'], mix: t => [['stink', 2.2], ['slug', 3], ['bee', t > 40 ? 1.6 : 0], ['cater', t > 60 ? 1.2 : 0], ['mole', t > 120 ? 1.6 : 0]] },
  race: { g: 2, song: 'race', boss: 'mokuba', summon: 'carrot', waves: ['carrot', 'crow', 'carrot'], mix: t => [['carrot', 3], ['crow', t > 30 ? 2 : 0], ['stink', t > 90 ? 1.3 : 0], ['mole', t > 150 ? 1.3 : 0], ['kuma', t > 180 ? 0.7 : 0]] },
  cage: { g: 3, song: 'cage', boss: 'wheel', summon: 'dust', waves: ['dust', 'paper', 'dust'], mix: t => [['dust', 3], ['paper', t > 40 ? 2 : 0], ['cater', t > 90 ? 1.4 : 0], ['mole', t > 150 ? 1.2 : 0]] },
  zoo: { g: 4, song: 'zoo', boss: 'zou', summon: 'peng', waves: ['monkey', 'peng', 'monkey'], mix: t => [['monkey', 3], ['peng', t > 30 ? 2 : 0], ['crow', t > 90 ? 1.2 : 0], ['kuma', t > 120 ? 1 : 0], ['mole', t > 150 ? 1.2 : 0]] },
  snow: { g: 5, song: 'snow', boss: 'bigsnow', summon: 'sball', waves: ['sball', 'sman', 'sball'], mix: t => [['sball', 3], ['usagi', t > 20 ? 2.2 : 0], ['sman', t > 40 ? 1.8 : 0], ['crow', t > 100 ? 1.2 : 0], ['kuma', t > 150 ? 0.8 : 0]] },
  night: { g: 6, song: 'night', boss: 'bigspk', summon: 'onpu', waves: ['onpu', 'spk', 'onpu'], mix: t => [['onpu', 3], ['bat', t > 25 ? 2.4 : 0], ['spk', t > 40 ? 1.7 : 0], ['crow', t > 100 ? 1.2 : 0], ['mole', t > 160 ? 1 : 0]] },
  chapel: { g: 7, song: 'chapel', boss: 'bell', summon: 'heartb', waves: ['tulip', 'bouq', 'heartb'], mix: t => [['tulip', 3], ['heartb', t > 25 ? 2.2 : 0], ['bee', t > 45 ? 1.4 : 0], ['bouq', t > 60 ? 1.6 : 0], ['usagi', t > 110 ? 1.2 : 0], ['kuma', t > 190 ? 0.6 : 0]] },
  china: { g: 8, song: 'china', boss: 'cdragon', summon: 'gyoza', waves: ['gyoza', 'capsb', 'lantb'], mix: t => [['gyoza', 3], ['lantb', t > 25 ? 2.2 : 0], ['capsb', t > 60 ? 1.6 : 0], ['bat', t > 110 ? 1.1 : 0], ['kuma', t > 200 ? 0.6 : 0]] }
};
const look = JSON.parse(JSON.stringify(LOOKS[0]));
function lerpLook(target, k) { for (const key in look) { if (Array.isArray(look[key])) look[key] = look[key].map((v, i) => v + (target[key][i] - v) * k); else look[key] += (target[key] - look[key]) * k; } RD.setLook(look); }
RD.setLook(look);

// ---------- state ----------
let state = 'title', G = null, titleT = 0, gTime = 0;
const keys = new Set();
const joy = { on: false, id: null, ox: 0, oy: 0, x: 0, y: 0 };
const WEAPONS = ['berry', 'lariat', 'beam', 'penlight', 'horse', 'seal', 'brush', 'drum', 'mic', 'apple', 'ham', 'fan', 'guitar', 'cyalume'];
const PASSIVES = ['pannier', 'shoes', 'ribbon', 'gobelt', 'suzuri', 'metro', 'nodoame', 'basket', 'omamori', 'gakufu', 'wasabi'];
const MAXLV = {}; for (const id of WEAPONS) MAXLV[id] = 5; for (const id of PASSIVES) MAXLV[id] = 3;
// evolution: ANY weapon at Lv5 (MAX) -> its evolution card appears at the next level-up. No passive needed.
const EVO = {}; for (const id of WEAPONS) EVO[id] = { ach: 'evo' + id[0].toUpperCase() + id.slice(1) };
const W = {
  berry: l => ({ cd: [0, .6, .52, .46, .4, .34][l], n: [0, 1, 2, 2, 3, 3][l], dmg: [0, 13, 15, 18, 21, 25][l], pierce: l >= 4 ? 1 : 0 }),
  lariat: l => ({ cd: [0, 2.8, 2.5, 2.2, 1.9, 1.6][l], r: [0, 44, 50, 56, 62, 70][l], dmg: [0, 24, 30, 38, 46, 58][l] }),
  beam: l => ({ cd: [0, 3.2, 2.8, 2.5, 2.2, 1.9][l], w: [0, 9, 10, 12, 14, 16][l], dmg: [0, 40, 50, 62, 76, 92][l], n: l >= 5 ? 2 : 1 }),
  penlight: l => ({ n: l, dmg: [0, 12, 14, 16, 18, 21][l], r: 34 + l * 3 }),
  horse: l => ({ cd: [0, 4.2, 3.8, 3.4, 3, 2.6][l], dmg: [0, 45, 55, 68, 80, 96][l], n: l >= 4 ? 2 : 1 }),
  seal: l => ({ n: Math.min(l, 3), cd: [0, 1.0, .95, .9, .75, .6][l], dmg: [0, 11, 12, 13, 16, 20][l] }),
  brush: l => ({ cd: [0, 1.5, 1.35, 1.2, 1.05, 0.9][l], dmg: [0, 22, 27, 33, 40, 48][l], len: 64 + l * 6, both: l >= 3 }),
  drum: l => ({ cd: [0, 2.0, 1.8, 1.6, 1.4, 1.2][l], n: [0, 2, 2, 3, 3, 4][l], r: [0, 30, 33, 36, 40, 44][l], dmg: [0, 16, 19, 23, 27, 32][l] }),
  mic: l => ({ cd: [0, 2.6, 2.3, 2.0, 1.8, 1.6][l], r: [0, 80, 92, 104, 116, 130][l], dmg: [0, 14, 17, 21, 25, 30][l] }),
  apple: l => ({ cd: [0, 1.8, 1.6, 1.45, 1.3, 1.15][l], n: [0, 1, 1, 2, 2, 3][l], dmg: [0, 22, 26, 31, 37, 44][l], r: [0, 22, 24, 26, 28, 32][l], bounce: l >= 3 ? 1 : 0 }),
  ham: l => ({ n: [0, 1, 1, 2, 2, 3][l], dmg: [0, 14, 17, 20, 24, 28][l], spd: [0, 110, 120, 130, 140, 150][l], r: 10 }),
  fan: l => ({ cd: [0, 2.2, 2.0, 1.8, 1.6, 1.4][l], dmg: [0, 12, 15, 18, 22, 26][l], len: [0, 72, 80, 88, 96, 106][l], ang: 0.55 + l * 0.06 }),
  guitar: l => ({ cd: [0, 2.4, 2.2, 2.0, 1.8, 1.6][l], n: [0, 1, 2, 2, 3, 4][l], dmg: [0, 26, 30, 36, 42, 50][l], r: 26 }),
  cyalume: l => ({ cd: [0, 3.0, 2.8, 2.6, 2.4, 2.2][l], n: [0, 1, 1, 2, 2, 2][l], dmg: [0, 6, 7, 8, 9, 10][l], r: [0, 20, 21, 22, 23, 25][l], life: [0, 2.2, 2.4, 2.6, 2.8, 3][l], cap: 5 })
};
const ETYPES = {
  cater: { hp: 12, spd: 25, dmg: 4, r: 8, xp: 1 },
  crow: { hp: 9, spd: 44, dmg: 4, r: 7, xp: 1 },
  stink: { hp: 36, spd: 22, dmg: 8, r: 8, xp: 3 },
  mole: { hp: 66, spd: 31, dmg: 10, r: 9, xp: 5 },
  dust: { hp: 10, spd: 33, dmg: 4, r: 8, xp: 1 },
  paper: { hp: 30, spd: 24, dmg: 7, r: 8, xp: 3 },
  boss: { hp: 2200, spd: 30, dmg: 13, r: 24, xp: 0, boss: true },
  wheel: { hp: 2400, spd: 28, dmg: 13, r: 26, xp: 0, boss: true },
  slug: { hp: 15, spd: 19, dmg: 5, r: 8, xp: 1 },
  carrot: { hp: 13, spd: 38, dmg: 5, r: 7, xp: 1 },
  monkey: { hp: 16, spd: 40, dmg: 5, r: 8, xp: 1, zig: 1 },
  peng: { hp: 32, spd: 24, dmg: 7, r: 8, xp: 3 },
  sball: { hp: 14, spd: 30, dmg: 5, r: 8, xp: 1 },
  sman: { hp: 50, spd: 20, dmg: 9, r: 9, xp: 4 },
  onpu: { hp: 14, spd: 34, dmg: 5, r: 8, xp: 1, zig: 1 },
  spk: { hp: 54, spd: 20, dmg: 9, r: 9, xp: 4 },
  bmole: { hp: 2300, spd: 30, dmg: 13, r: 24, xp: 0, boss: true },
  mokuba: { hp: 2300, spd: 32, dmg: 13, r: 24, xp: 0, boss: true },
  zou: { hp: 2600, spd: 26, dmg: 14, r: 26, xp: 0, boss: true },
  bigsnow: { hp: 2600, spd: 26, dmg: 14, r: 26, xp: 0, boss: true },
  bigspk: { hp: 2500, spd: 24, dmg: 14, r: 26, xp: 0, boss: true },
  bee: { hp: 10, spd: 52, dmg: 4, r: 7, xp: 1 },
  kuma: { hp: 140, spd: 20, dmg: 12, r: 12, xp: 8 },
  bat: { hp: 12, spd: 50, dmg: 5, r: 7, xp: 1 },
  usagi: { hp: 18, spd: 32, dmg: 5, r: 8, xp: 2 },
  tulip: { hp: 13, spd: 30, dmg: 4, r: 8, xp: 1 },
  heartb: { hp: 11, spd: 46, dmg: 4, r: 7, xp: 1, zig: 1 },
  bouq: { hp: 48, spd: 21, dmg: 9, r: 9, xp: 4 },
  bell: { hp: 2600, spd: 24, dmg: 14, r: 26, xp: 0, boss: true },
  gyoza: { hp: 14, spd: 32, dmg: 5, r: 8, xp: 1 },
  lantb: { hp: 12, spd: 44, dmg: 4, r: 7, xp: 1, zig: 1 },
  capsb: { hp: 46, spd: 22, dmg: 9, r: 8, xp: 4 },
  cdragon: { hp: 2700, spd: 26, dmg: 14, r: 26, xp: 0, boss: true }
};
const PART_COL = { gyoza: [0xfff4e0, 0xd8a060, 0xffffff], lantb: [0xc8283a, 0xffd860, 0xffffff], capsb: [0xff7eb6, 0x6ec3ff, 0xffffff], cdragon: [0xc8283a, 0xffd860, 0x4ab88a], tulip: [0xff7eb6, 0x58b048, 0xffffff], heartb: [0xff5c8a, 0xffb0c8, 0xffffff], bouq: [0xfff4f8, 0xff9ac0, 0x7ec870], bell: [0xffd94a, 0xffffff, 0xff9ac0], cater: [0x8ad86a, 0xffe066, 0xffffff], crow: [0x2c2a48, 0x7676b8, 0xffffff], stink: [0x62ab52, 0xf0d860, 0xffffff], mole: [0x735f88, 0xff86a2, 0xffffff], dust: [0x9a94a8, 0xe8e4f0, 0xffffff], paper: [0xffffff, 0xd8d4e0, 0xb0aac0], slug: [0xe8d870, 0xfff4b0, 0xffffff], carrot: [0xf08030, 0x58b048, 0xffffff], monkey: [0x8a5a34, 0xf0c898, 0xffffff], peng: [0x2a2c44, 0xffffff, 0xffc040], sball: [0xffffff, 0xc8d8f0, 0x9ab0e0], sman: [0xffffff, 0x4a78d0, 0xe04848], onpu: [0x8a5ad0, 0xff86c0, 0xffffff], spk: [0x34304a, 0xff6ab0, 0x6ae0ff], bee: [0xf0b820, 0x2a2030, 0xffffff], kuma: [0x2a2632, 0xf4f0e8, 0xb89070], bat: [0x4a2a70, 0xff5a8a, 0xffffff], usagi: [0xffffff, 0xffb8c8, 0xe02040] };
const partCol = type => PART_COL[type] || [0xffd94a, 0xff7eb6, 0xffffff]; // bosses (e.g. endless twins) have no palette of their own
const RANGER_COL = [[1, 0.35, 0.4], [0.4, 0.65, 1], [1, 0.9, 0.35], [1, 0.55, 0.8], [0.45, 1, 0.55]];
// selection (character / stage), remembered on this device
let sel = (() => { try { return Object.assign({ char: 'kyon', stage: 'apple', diff: 'normal' }, JSON.parse(localStorage.getItem('kyoka-sel') || '{}')); } catch (e) { return { char: 'kyon', stage: 'apple', diff: 'normal' }; } })();
function saveSel() { try { localStorage.setItem('kyoka-sel', JSON.stringify(sel)); } catch (e) { } }
function validSel() { if (!CHARS[sel.char] || !charOpen(profile, sel.char)) sel.char = 'kyon'; if (!STAGES[sel.stage] || !stageOpen(profile, sel.stage)) sel.stage = 'apple'; if (!DIFF[sel.diff]) sel.diff = 'normal'; }

function newGame() {
  validSel();
  const up = profile.up, ch = sel.char, sid = sel.stage, D = SDEF[sid], cage = sid === 'cage', di = DIFFS.indexOf(sel.diff), df = DIFF[sel.diff];
  G = {
    t: 0, p: { x: 0, y: 0, hp: 100, maxHp: 100, speed: 76, face: 1, inv: 0, hurtT: 0, dashT: 0, dashCd: 0, dx: 1, dy: 0, anim: 0, moving: false, magnet: 58, hitR: 7, sc: 1 },
    lvl: 1, xp: 0, xpNext: 5, kills: 0, enemies: [], projs: [], gems: [], items: [], parts: [], nums: [], beams: [], rings: [], horses: [], ghosts: [], fx: [],
    slashes: [], falls: [], blasts: [], dq: [],
    seals: [], weapons: { berry: 1 }, passives: {}, evo: {}, cd: { berry: 0.3, lariat: 1.5, beam: 1.5, horse: 1.5, brush: 0.5, drum: 1, shower: 1, final: 2, kanji: 1 }, sealCd: [0, 0.3, 0.6, 0.9, 1.2],
    spawnAcc: 0, boss: null, bossDone: false, bossKills: 0, nextBoss: BOSS_T, map: cage ? 'cage' : 'field', sid, D, stage: D.g, stageT: 9, prevStage: D.g, hist: [], shake: 0, pending: 0, flash: 0, waves: { 60: 0, 150: 0, 240: 0 },
    penA: 0, horseId: 1, cam: { x: 0, y: 0 }, sealLv: [2, 4, 7], henshin: 0, lvFx: 0,
    char: ch, spr: ch === 'ranger' ? 'kr0' : CHARS[ch].spr, rc: 0, sp: 0, spPend: 0, spT: 0, spN: 0, cys: [], ate: {}, speedT: 0, glitT: 2, fireT: 0, fireTick: 0,
    sws: [], lobs: [], hazards: [], ebul: [], nextPick: 35, got: {}, bites: 0, chests: 0, drumN: 0, applA: 0, swId: 1,
    hams: [], gusts: [], zaps: [], penB: 0, boost: {}, threat: 0, eliteWaveT: 0, diff: sel.diff, di, df, evoN: 0, shield: 0,
    prev: Object.assign({ t: 0, k: 0 }, ((profile.st[sid] || {}).by || [])[di]), unl0: unlockSet(profile), lucky: up.lucky || 0, hanpen: up.hanpen || 0, giant: hasCheat(profile, 'hanpen'),
    picked: 0, coinsBanked: 0, repaid: 0, gained: 0, clearCounted: false, cleared: false, endless: false, paidOff: false, newAch: [],
    lastHurt: 0, safe: 0, revives: up.michi || 0, dmgMul: 1 + 0.03 * (up.shodo || 0), cdMul: 1 - 0.04 * (up.drumbeat || 0), domino: 0.03 * (up.domino || 0), dm: 1, cdm: 1, area: 1,
    dog: { x: -20, y: 8, face: 1, anim: 0, mode: 'follow', cd: 2, tgt: null, biteT: 0, h: 0 }
  };
  const p = G.p;
  if (ch === 'odekake') { p.maxHp = 80; p.speed *= 1.1; p.hitR = 5; p.sc = 0.86; }
  if (ch === 'ranger') G.weapons = { beam: 2 };
  if (ch === 'dress') p.magnet *= 1.25; // ドレスきょん: glitter bursts (see fireWeapons) and a wider pickup range
  if (ch === 'goth') { G.weapons = { berry: 1, guitar: 1 }; G.dmgMul *= 1.1; p.maxHp = 90; } // ゴスロリきょん
  newGame6(ch);
  p.maxHp = Math.round(p.maxHp * (1 + 0.1 * (up.panier || 0))) + 3 * (up.r_hp || 0); p.hp = p.maxHp;
  p.magnet *= (1 + 0.15 * (up.magnet || 0)) * (1 + 0.03 * (up.r_mag || 0)); p.speed *= 1 + 0.01 * (up.r_spd || 0);
  G.dmgMul *= 1 + 0.015 * (up.r_atk || 0); G.xpMul = 1 + 0.015 * (up.r_xp || 0); G.regen = 0.3 * (up.cafe || 0); G.towel = 1 - 0.08 * (up.utowel || 0); G.pending += up.hcard || 0; // shop goods
  const nSeal = Math.max(up.ohayo || 0, hasCheat(profile, 'ohayau') ? 3 : 0);
  for (let i = 0; i < nSeal; i++) { G.weapons.seal = (G.weapons.seal || 0) + 1; addSeal(); }
  if (profile.boost) { for (const w of WEAPONS.filter(wepOpen)) G.weapons[w] = MAXLV[w]; while (G.seals.length < 3) addSeal(); profile.boost = 0; G.boosted = true; saveLocal(profile); }
  const g0 = RD.tGround[G.stage]; RD.groundMat.uniforms.uG0.value = g0; RD.groundMat.uniforms.uG1.value = g0; RD.groundMat.uniforms.uMix.value = 0;
  Object.assign(look, JSON.parse(JSON.stringify(LOOKS[G.stage]))); RD.setLook(look);
}
function addSeal() { const k = G.seals.length; G.seals.push({ x: G.p.x + (k - 1) * 14, y: G.p.y + 10, hop: 0, anim: k, face: 1, h: 0 }); }

// ---------- spatial grid ----------
const CELL = 28, grid = new Map();
const gkey = (cx, cy) => (cx + 20000) * 40000 + (cy + 20000);
function buildGrid() { grid.clear(); for (const e of G.enemies) { const k = gkey(Math.floor(e.x / CELL), Math.floor(e.y / CELL)); let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(e); } }
function query(x, y, r, cb) {
  const x0 = Math.floor((x - r) / CELL), x1 = Math.floor((x + r) / CELL), y0 = Math.floor((y - r) / CELL), y1 = Math.floor((y + r) / CELL);
  for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) { const a = grid.get(gkey(cx, cy)); if (a) for (const e of a) if (e.hp > 0 && cb(e) === false) return; }
}
function nearest(x, y, maxD) { let best = null, bd = maxD * maxD; const hw = RD.viewW * 0.36, hh = RD.viewH * 0.4, cx = G.cam.x, cy = G.cam.y; for (const e of G.enemies) { if (e.hp <= 0 || Math.abs(e.x - cx) > hw || Math.abs(e.y - cy) > hh) continue; const d = (e.x - x) ** 2 + (e.y - y) ** 2; if (d < bd) { bd = d; best = e; } } return best; }

// ---------- spawning ----------

// ---------- spawning ----------
// harder modes ease in over the first two minutes so a run never ends before the first few level-ups
// and the hardest ones keep tightening in the second half (df.late), so a strong start alone doesn't carry the run
const dfRamp = (m, late) => m <= 1 ? m : 1 + (m - 1) * Math.min(1.15, 0.25 + G.t / 150) * (1 + (late || 0) * Math.max(0, Math.min(G.t, WIN_T) - 150) / 150);
// endless: minutes past 5:00. Everything keeps growing from there, without limit, so even a maxed build falls eventually
// how fast the threat climbs per minute, by difficulty (ゲキムズ reaches threat Lv10 around 12:00)
const TH_RATE = { easy: 0.7, normal: 0.95, hard: 1.15, geki: 1.4 };
const endlessM = () => G.endless ? Math.max(0, G.t - WIN_T) / 60 * (TH_RATE[G.diff] || 1) : 0;
// endless: bosses come every 2:00 at first, down to 0:45 as the threat rises; their hits are softened so the pressure stays steady
const bossGap = () => Math.max(45, 120 - 7.5 * endlessM());
const bossSoft = () => (G.endless ? (G.diff === 'geki' ? 0.55 : 0.65) : 1) * (G.towel || 1); // 熱唱タオル softens boss hits too
function spawnEnemy(type, x, y, forceElite) {
  const b = ETYPES[type], tt = Math.min(G.t, WIN_T), mul = b.boss ? 1 + Math.max(0, tt - BOSS_T) / 200 : 1 + tt / 150 + (tt / 300) ** 2 * 0.9; // tougher as the run goes on, fastest near the end
  const df = G.df, hp = b.hp * mul * dfRamp(df.hp, df.late);
  const e = { type, boss: !!b.boss, x, y, hp, maxHp: hp, spd: b.spd * rnd(0.9, 1.1) * df.spd * (1 + (df.late || 0) * 0.2 * Math.max(0, Math.min(G.t, WIN_T) - 150) / 150), dmg: b.dmg * (b.boss ? 1 : 1 + (tt / 300) ** 2 * 0.8), r: b.r, xp: b.xp, kx: 0, ky: 0, flash: 0, anim: Math.random() * 4, face: 1, pl: 0, hh: 0, ph: Math.random() * TAU, spawnT: 0, conf: 0 };
  const em = endlessM();
  if (em > 0) { // regular foes outgrow a maxed build; bosses get tougher but hit only a little harder
    e.hp *= b.boss ? 1 + 0.3 * em + 0.03 * em * em : 1 + 0.3 * em + 0.04 * em * em; e.maxHp = e.hp;
    e.dmg *= b.boss ? 1 + 0.06 * em : 1 + 0.17 * em + 0.014 * em * em; e.spd *= Math.min(1.5, 1 + 0.035 * em); if (!b.boss) e.spd = Math.min(e.spd, G.p.speed * 0.8); // never outrun the player
    if (!b.boss && !forceElite && Math.random() < Math.min(0.2, 0.04 * em)) { e.beh = Math.random() < 0.5 ? 'shoot' : 'charge'; e.bt = rnd(1.2, 3); e.shotDmg = b.dmg * 0.6 * (1 + 0.055 * em); } // foes you have to move for
  }
  if (!b.boss && (forceElite || (G.t > 60 && Math.random() < Math.min(0.5, df.elite + 0.022 * em)))) { e.elite = true; e.hp = e.maxHp = e.hp * 4; e.r *= 1.4; e.dmg *= 1.5; e.xp *= 6; e.spd *= 0.9; }
  if (ETYPES6[type]) { e.p6 = 1; e.sturdy = b.sturdy; if (!b.boss) { e.hp *= P6_HP; e.maxHp = e.hp; e.dmg *= P6_DMG; } } // phase-6 foes come with gimmicks, so their numbers are a little lower
  G.enemies.push(e); return e;
}
// spawn just off-screen, but keep a gap in front of a moving player (no walls popping up on the path you are running along)
function ringPos(extra) {
  const p = G.p, rx = RD.viewW / 2 + 50 + (extra || 0), ry = RD.viewH / 2 + 50 + (extra || 0), mv = p.moving || p.dashT > 0, fa = Math.atan2(p.dy, p.dx);
  let a = Math.random() * TAU;
  if (mv) { let off = ((a - fa) % TAU + TAU) % TAU; if (off > Math.PI) off -= TAU; if (Math.abs(off) < 1.0) a = fa + (off < 0 ? -1 : 1) * (1.0 + Math.random() * (Math.PI - 1.0)); }
  return [p.x + Math.cos(a) * rx, p.y + Math.sin(a) * ry];
}
function pickType() {
  const w = G.D.mix(G.t);
  let s = 0; for (const [, v] of w) s += v; let r = Math.random() * s;
  for (const [k, v] of w) { r -= v; if (r <= 0) return k; } return w[0][0];
}
// keep the crowd under the cap by retiring the foes furthest away, so fresh ones keep arriving near the player
const E_CAP = 460;
function makeRoom(n) {
  const over = G.enemies.length + n - E_CAP; if (over <= 0) return n;
  const p = G.p, far = G.enemies.filter(e => !e.boss).sort((a, b) => ((b.x - p.x) ** 2 + (b.y - p.y) ** 2) - ((a.x - p.x) ** 2 + (a.y - p.y) ** 2)).slice(0, over);
  const gone = new Set(far), A = G.enemies; let j = 0; for (const e of A) if (!gone.has(e)) A[j++] = e; A.length = j; return Math.min(n, E_CAP - G.enemies.length);
}
function spawning(dt) {
  const cap = G.t > WIN_T ? (G.endless ? 6.8 + endlessM() * 1.5 : Math.min(6.8 + (G.t - WIN_T) * 0.012, 10)) : 6.8;
  const rate = Math.min(1.0 + G.t * 0.027, cap + Math.min(G.t, WIN_T) / WIN_T * 0.8) * (G.boss ? 0.55 : 1) * dfRamp(G.df.dens, G.df.late * 0.5);
  G.spawnAcc += rate * dt;
  while (G.spawnAcc >= 1) { G.spawnAcc--; if (G.enemies.length < E_CAP || (G.endless && makeRoom(1))) { const [x, y] = ringPos(); spawnEnemy(pickType(), x, y); } }
  for (const wt of [60, 150, 240]) if (!G.waves[wt] && G.t >= wt) {
    G.waves[wt] = 1; banner(PT().st[G.sid].wave);
    const type = G.D.waves[[60, 150, 240].indexOf(wt)], n = makeRoom(Math.round(32 * G.df.dens));
    for (let i = 0; i < n; i++) { const a = i / n * TAU; spawnEnemy(type, G.p.x + Math.cos(a) * RD.viewW * 0.45, G.p.y + Math.sin(a) * RD.viewH * 0.42); }
  }
  if (G.endless) { // a ring of elites every two minutes, bigger each time
    G.threat = 1 + Math.floor(endlessM());
    if (G.t >= G.eliteWaveT) {
      if (G.eliteWaveT) { banner(PT().eliteWave, 'warn'); Snd.fx.warn(); const n = makeRoom(Math.min(110, 12 + 6 * G.threat)); for (let i = 0; i < n; i++) { const a = i / n * TAU; spawnEnemy(pickType(), G.p.x + Math.cos(a) * RD.viewW * 0.45, G.p.y + Math.sin(a) * RD.viewH * 0.42, true); } }
      G.eliteWaveT = (G.eliteWaveT || G.t) + Math.max(60, 120 - 6 * endlessM());
    }
  }
  if (!G.boss && G.t >= G.nextBoss && (!G.bossDone || G.endless)) {
    const [x, y] = ringPos(10), st = PT().st[G.sid];
    G.boss = spawnEnemy(G.D.boss, x, y); G.boss.mode = 'chase'; G.boss.mt = 3; G.boss.summon = 6; G.boss.atk = 3; bossSpawn6(G.boss);
    const em = endlessM(); // high threat: sometimes a second boss joins (they share the boss bar like the twin シーサー)
    if (em >= 6 && !G.boss.twin && Math.random() < Math.min(0.5, (em - 6) * 0.09)) addTwinBoss();
    banner(st.warn, 'warn'); Snd.fx.warn(); Snd.playSong('boss'); G.shake = 8;
  }
}

// ---------- combat ----------
function addNum(x, y, v, big) { if (G.nums.length < 90) G.nums.push({ x: x + rnd(-4, 4), y, v: Math.round(v), life: 0.75, big }); }
function burst(x, y, cols, n, sp, up, h) {
  for (let i = 0; i < n; i++) { if (G.parts.length > 700) break; const a = Math.random() * TAU, s = rnd(0.3, 1) * (sp || 60); G.parts.push({ x, y, h: h ?? 10, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7, vh: rnd(20, 70) * (up ?? 1), life: rnd(0.3, 0.7), max: 0.7, c: hex(cols[(Math.random() * cols.length) | 0]), s: rnd(0.45, 0.9), em: Math.random() < 0.3 ? 0.8 : 0 }); }
}
function fxAdd(kind, x, y, o) { if (G.fx.length < 200) G.fx.push(Object.assign({ kind, x, y, life: 0.4, max: 0.4 }, o)); }
function hurtEnemy(e, dmg, kx, ky) {
  if (e.hp <= 0) return;
  dmg *= G.dm; if (e.guarded) dmg *= 0.2; const crit = G.passives.wasabi && Math.random() < 0.08 * G.passives.wasabi; if (crit) dmg *= 2;
  e.hp -= dmg; e.flash = 0.09; addNum(e.x, e.y, dmg, dmg >= 40 || crit);
  const kb = e.boss ? 0.08 : e.sturdy ? 0.3 : 1; e.kx += kx * kb; e.ky += ky * kb;
  fxAdd('hit', e.x, e.y, { life: 0.15, max: 0.15 });
  Snd.fx.hit();
  if (e.hp <= 0) killEnemy(e);
}
function aoe(x, y, r, dmg, kb) { query(x, y, r + 12, e => { const dx = e.x - x, dy = e.y - y, d = Math.hypot(dx, dy) || 1; if (d < r + e.r) hurtEnemy(e, dmg, dx / d * (kb || 120), dy / d * (kb || 120)); }); }
function killEnemy(e) {
  G.kills++; if (!e.boss && !(G.spT > 0)) G.spPend = Math.min(0.6, (G.spPend || 0) + 1 / spNeed());
  if (e.boss && e.twin && e.twin.hp > 0) { twinDown6(e); return; }
  if (e.boss) {
    const wheel = e.type === 'wheel';
    G.boss = null; G.bossDone = true; G.bossKills++; G.nextBoss = G.t + (G.endless ? bossGap() : 150); banner(PT().st[G.sid].down); G.shake = 12; G.flash = 0.6; Snd.fx.win();
    if (!G.endless || G.road) Snd.playSong(G.D.song);
    G.items.push({ x: e.x, y: e.y - 20, k: e.type === 'bell' ? 'ringcake' : 'chest' }); G.hazards.length = 0; G.ebul.length = 0;
    if (e.type === 'bell') G.items.push({ x: e.x, y: e.y + 18, k: FOODS[(Math.random() * 4) | 0] });
    burst(e.x, e.y, wheel ? [0xff7eb6, 0xffffff, 0xb8c4e0, 0xffd94a] : [0xffd94a, 0xffffff, 0xb085ff, 0xffa3c0], 90, 160, 1.6, 20);
    fxAdd('poof', e.x, e.y, { life: 0.8, max: 0.8, size: 120 });
    for (let i = 0; i < 30; i++) dropGem(e.x + rnd(-50, 50), e.y + rnd(-35, 35), 10);
    G.items.push({ x: e.x - 16, y: e.y, k: 'oyaki' }, { x: e.x + 16, y: e.y, k: 'yaki' });
    for (let i = 0; i < 10; i++) G.items.push({ x: e.x + rnd(-40, 40), y: e.y + rnd(-30, 30), k: 'coin' });
    if (e.type === 'boss') achNote('crowKing');
    return;
  }
  Snd.fx.kill();
  if (e.type === 'flashb' && G.t > G.flashCd) { G.flashCd = G.t + 5; G.flash = Math.max(G.flash, 0.3); G.flashRed = 0; }
  burst(e.x, e.y, partCol(e.type), 9, 70, 1, 8);
  fxAdd('poof', e.x, e.y, { life: 0.35, max: 0.35, size: 28 });
  dropGem(e.x, e.y, e.xp);
  if (e.elite) { for (let i = 0; i < 3; i++) G.items.push({ x: e.x + rnd(-12, 12), y: e.y + rnd(-8, 8), k: 'coin' }); burst(e.x, e.y, [0xffd94a, 0xffffff], 16, 100, 1.4, 10); }
  const r = Math.random();
  const pk = 0.0022 * (1 + 0.5 * G.lucky);
  if (r < pk && G.items.length < 120) G.items.push({ x: e.x, y: e.y, k: PICKS[(Math.random() * PICKS.length) | 0] });
  else if (r < pk + 0.0006) G.items.push({ x: e.x, y: e.y, k: 'yaki' });
  else if (r < pk + 0.0046) G.items.push({ x: e.x, y: e.y, k: 'ebi' });
  else if (r < pk + 0.0096) G.items.push({ x: e.x, y: e.y, k: 'oyaki' });
  else if (r < pk + 0.0121 && G.items.length < 120) G.items.push({ x: e.x, y: e.y, k: foodPick() });
  else if (r < pk + 0.036 + 0.01 * G.lucky && G.items.length < 120) G.items.push({ x: e.x, y: e.y, k: 'coin' });
  if (G.domino && Math.random() < G.domino && G.dq.length < 30) G.dq.push({ x: e.x, y: e.y, t: 0.12 });
}
function dropGem(x, y, v) {
  if (G.gems.length > 260) { const g = G.gems[(Math.random() * G.gems.length) | 0]; g.v += v; return; }
  G.gems.push({ x, y, v, fly: false, bob: Math.random() * TAU, pop: 0.3 });
}
function hurtPlayer(d, src) {
  const p = G.p; if (p.inv > 0 || p.dashT > 0 || G.shield > 0) return;
  const L = window.__kyokaDmg; if (L) { const k = src || 'other'; L[k] = (L[k] || 0) + d; L.n = (L.n || 0) + 1; }
  if (G.dodge && Math.random() < G.dodge) { p.inv = 0.4; burst(p.x, p.y, [0x6a8aff, 0xffffff], 8, 60, 1, 14); return; }
  d *= G.df.dmg * (1 + (G.df.late || 0) * 0.3 * Math.max(0, Math.min(G.t, WIN_T) - 150) / 150) * (1 - 0.1 * (G.passives.omamori || 0));
  p.hp -= d; p.inv = 0.85; p.hurtT = 0.3; G.shake = 5; Snd.fx.hurt(); burst(p.x, p.y, [0xe8394f, 0xffa3c0, 0xffffff], 10, 70, 1, 16);
  G.flash = Math.max(G.flash, 0.12); G.flashRed = 1; G.lastHurt = G.t; G.safe = 0;
  if (p.hp <= 0) {
    if (G.revives > 0) { // みちづれ: revive once and blow everything nearby away
      G.revives--; p.hp = Math.round(p.maxHp * 0.4); p.inv = 2.2; G.flash = 0.8; G.flashRed = 0; G.shake = 14; banner(T().revive, 'stage'); Snd.fx.boom();
      aoe(p.x, p.y, 150, 150, 400); G.blasts.push({ x: p.x, y: p.y, life: 0.9, max: 0.9, big: 0.7 });
      burst(p.x, p.y, [0x3ab85a, 0xffffff, 0x2f8a4e, 0xffd94a], 60, 160, 1.4, 16);
      return;
    }
    p.hp = 0; endGame(false);
  }
}

function fireWeapons(dt) {
  const p = G.p, ws = G.weapons, cdm = G.cdm, area = G.area;
  if (G.char === 'dress' && (G.glitT -= dt) <= 0) { // ドレスきょん: a burst of glitter around her
    G.glitT = 3.6 * cdm; const r = 58 * area; aoe(p.x, p.y, r, 18 + G.lvl * 1.5, 110); G.rings.push({ x: p.x, y: p.y, r, life: 0.35, max: 0.35, col: 0 });
    burst(p.x, p.y, [0x9fdcff, 0xffffff, 0xffb0d8, 0xffe9a0], 22, 120, 1.5, 14); Snd.fx.magnet();
  }
  if (G.fireT > 0) { // 麻辣スープ: a short fire aura
    G.fireT -= dt; if ((G.fireTick -= dt) <= 0) { G.fireTick = 0.5; aoe(p.x, p.y, 46 * area, 12 + G.lvl, 60); }
    if (Math.random() < dt * 30) { const a = Math.random() * TAU, r = rnd(10, 44) * area; G.parts.push({ x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r * 0.8, h: 1, vx: 0, vy: 0, vh: rnd(20, 40), life: 0.5, max: 0.5, c: [1, rnd(0.3, 0.7), 0.15], s: 0.9, em: 1 }); }
  }
  for (const id of ['berry', 'lariat', 'beam', 'horse', 'brush', 'drum', 'mic', 'apple', 'fan', 'guitar', 'cyalume']) {
    const l = ws[id]; if (!l) continue;
    G.cd[id] = (G.cd[id] || 0) - dt; if (G.cd[id] > 0) continue;
    const s = W[id](l);
    if (id === 'berry') {
      if (G.evo.berry) { // いちごシャワー: ring of strawberries
        G.cd[id] = 0.42 * cdm; const a0 = G.t * 1.7;
        for (let i = 0; i < 10; i++) { const a = a0 + i / 10 * TAU; G.projs.push({ k: 'berry', x: p.x, y: p.y, vx: Math.cos(a) * 210, vy: Math.sin(a) * 210, dmg: 30, pierce: 2, life: 1.1, hit: null }); }
        Snd.fx.shoot(); continue;
      }
      const tgt = nearest(p.x, p.y, 240); if (!tgt) { G.cd[id] = 0.15; continue; }
      G.cd[id] = s.cd * cdm;
      const base = Math.atan2(tgt.y - p.y, tgt.x - p.x), nb = s.n + basketN();
      for (let i = 0; i < nb; i++) { const a = base + (i - (nb - 1) / 2) * 0.22; G.projs.push({ k: 'berry', x: p.x + Math.cos(a) * 6, y: p.y + Math.sin(a) * 4, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, dmg: s.dmg, pierce: s.pierce, life: 1.4, hit: null }); }
      Snd.fx.shoot();
    } else if (id === 'lariat') {
      const giga = G.evo.lariat, r = s.r * area * (giga ? 1.35 : 1), dmg = s.dmg * (giga ? 1.3 : 1);
      G.cd[id] = (giga ? 1.7 : s.cd) * cdm; G.rings.push({ x: p.x, y: p.y, r, life: 0.45, max: 0.45 }); if (giga) G.rings.push({ x: p.x, y: p.y, r: r * 0.6, life: 0.35, max: 0.35, col: 1 }); Snd.fx.lariat(); G.shake = Math.max(G.shake, giga ? 5 : 3);
      query(p.x, p.y, r + 10, e => { const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1; if (d < r + e.r) { hurtEnemy(e, dmg, dx / d * 170, dy / d * 170); if (giga && !e.boss) e.conf = Math.max(e.conf, 0.5); } });
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; G.parts.push({ x: p.x + Math.cos(a) * r * 0.6, y: p.y + Math.sin(a) * r * 0.6, h: 6, vx: Math.cos(a) * 90, vy: Math.sin(a) * 60, vh: 30, life: 0.4, max: 0.4, c: hex(i % 2 ? 0xffd94a : 0xff8fc0), s: 0.8, em: 1 }); }
    } else if (id === 'beam') {
      const tgt = nearest(p.x, p.y, 280); G.cd[id] = s.cd * cdm; const w = s.w * area;
      const a0 = tgt ? Math.atan2(tgt.y - p.y, tgt.x - p.x) : (p.face > 0 ? 0 : Math.PI);
      for (let i = 0; i < s.n; i++) {
        const a = a0 + i * Math.PI, len = 280, cx = Math.cos(a), cy = Math.sin(a), ox = p.x, oy = p.y;
        G.beams.push({ x: ox, y: oy, a, len, w, life: 0.45, max: 0.45 });
        for (const e of G.enemies) { if (e.hp <= 0) continue; const ex = e.x - ox, ey = e.y - oy, t = ex * cx + ey * cy; if (t < 0 || t > len) continue; const perp = Math.abs(ex * cy - ey * cx); if (perp < w / 2 + e.r) hurtEnemy(e, s.dmg, cx * 60, cy * 60); }
      }
      G.henshin = 0.5; burst(p.x, p.y, [0xffd94a, 0xffffff, 0x6ec3ff, 0xff7eb6], 18, 80, 1.4, 18); Snd.fx.beam();
    } else if (id === 'horse') {
      const st = G.evo.horse; G.cd[id] = s.cd * cdm * (st ? 0.7 : 1); Snd.fx.horse();
      const dirs = st ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : null;
      for (let i = 0; i < (st ? 4 : s.n); i++) {
        let dx = st ? dirs[i][0] : i === 0 ? p.dx : -p.dx, dy = st ? dirs[i][1] : i === 0 ? p.dy : -p.dy; if (!dx && !dy) dx = p.face;
        const d = Math.hypot(dx, dy); dx /= d; dy /= d;
        G.horses.push({ x: p.x - dx * 130 + rnd(-6, 6), y: p.y - dy * 130 + 4, vx: dx * 320, vy: dy * 320, life: 1.0, dmg: s.dmg * (st ? 1.4 : 1), id: G.horseId++, anim: 0, gold: st });
      }
    } else if (id === 'brush') { // one big stroke in front (and behind from Lv3)
      G.cd[id] = s.cd * cdm; const len = s.len * area;
      for (const f of s.both ? [p.face, -p.face] : [p.face]) {
        G.slashes.push({ x: p.x, y: p.y, face: f, len, life: 0.32, max: 0.32 });
        query(p.x + f * len / 2, p.y, len / 2 + 14, e => { const ex = (e.x - p.x) * f; if (ex > -6 && ex < len + e.r && Math.abs(e.y - p.y) < 15 + e.r) hurtEnemy(e, s.dmg, f * 140, 0); });
      }
      Snd.fx.brush();
    } else if (id === 'drum') { // bursts under nearby enemies
      const fev = G.evo.drum; G.cd[id] = (fev ? 0.9 : s.cd) * cdm; const r = s.r * area * (fev ? 1.15 : 1), cand = [];
      query(p.x, p.y, 170, e => { cand.push(e); if (cand.length > 40) return false; });
      if (fev && ++G.drumN % 5 === 0) { // ドンドコ・フィーバー: big DOON every 5th beat
        const R0 = 110 * area; G.rings.push({ x: p.x, y: p.y, r: R0, life: 0.5, max: 0.5, col: 1 }); aoe(p.x, p.y, R0, s.dmg * 2.2, 140); G.shake = Math.max(G.shake, 6); Snd.fx.boom();
        burst(p.x, p.y, [0xffd94a, 0xffffff, 0xe63a52, 0xff7eb6], 30, 140, 1.5, 8);
      }
      for (let i = 0; i < s.n + (fev ? 2 : 0); i++) {
        const e = cand.length ? cand.splice((Math.random() * cand.length) | 0, 1)[0] : null;
        const x = e ? e.x : p.x + rnd(-80, 80), y = e ? e.y : p.y + rnd(-60, 60);
        G.rings.push({ x, y, r, life: 0.35, max: 0.35, col: 1 }); aoe(x, y, r, s.dmg, 90);
        burst(x, y, [0xffd94a, 0xffffff, 0xe63a52], 6, 60, 1.2, 6);
      }
      Snd.fx.drum();
    } else if (id === 'mic') { // expanding voice ring
      const enc = G.evo.mic; G.cd[id] = (enc ? 1.7 : s.cd) * cdm;
      G.sws.push({ x: p.x, y: p.y, r: 8, max: s.r * area * (enc ? 1.15 : 1), spd: enc ? 190 : 150, dmg: s.dmg * (enc ? 1.1 : 1), id: G.swId++, enc });
      if (enc) G.sws.push({ x: p.x, y: p.y, r: -30, max: s.r * area * 1.15, spd: 190, dmg: s.dmg * 0.5, id: G.swId++, enc });
      Snd.fx.mic();
    } else if (id === 'cyalume') { // glowsticks handed out: each lands and glows, hurting foes in the light
      const evo = G.evo.cyalume; G.cd[id] = s.cd * cdm * (evo ? 0.9 : 1); const n = s.n + (evo ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const e = randomVisibleEnemy(), a = Math.random() * TAU, d = rnd(40, 110), tx = e ? e.x + rnd(-10, 10) : p.x + Math.cos(a) * d, ty = e ? e.y + rnd(-8, 8) : p.y + Math.sin(a) * d * 0.8;
        G.cys.push({ x0: p.x, y0: p.y, x: tx, y: ty, t: 0, T: 0.45 + Math.random() * 0.1, c: (G.cys.length + i) % 4, r: s.r * area * (evo ? 1.2 : 1), dmg: s.dmg * (evo ? 1.2 : 1), life: s.life * (evo ? 1.25 : 1), max: s.life * (evo ? 1.25 : 1), tick: 0 });
      }
      const cap = s.cap + (evo ? 3 : 0); if (G.cys.length > cap) G.cys.splice(0, G.cys.length - cap); // only a few glowing at once
      Snd.fx.shoot();
    } else if (id === 'apple') { // lobbed apples that bounce
      G.cd[id] = s.cd * cdm; const n = s.n + basketN();
      for (let i = 0; i < n; i++) {
        const e = randomVisibleEnemy() || nearest(p.x, p.y, 260), tx = e ? e.x : p.x + p.face * rnd(60, 120), ty = e ? e.y : p.y + rnd(-40, 40);
        G.lobs.push({ x0: p.x, y0: p.y, x1: tx, y1: ty, t: 0, T: 0.6 + Math.random() * 0.1, dmg: s.dmg, r: s.r * area, b: s.bounce });
      }
      Snd.fx.apple();
    } else if (id === 'fan') { // gust cone toward the nearest foe (evolved: all around)
      const big = G.evo.fan, tgt = nearest(p.x, p.y, 200), a = tgt ? Math.atan2(tgt.y - p.y, tgt.x - p.x) : (p.face > 0 ? 0 : Math.PI);
      const len = (big ? 125 : s.len) * area, ang = big ? Math.PI : s.ang, dmg = s.dmg * (big ? 1.6 : 1);
      G.cd[id] = (big ? 1.3 : s.cd) * cdm; G.gusts.push({ x: p.x, y: p.y, a, len, ang, life: 0.4, max: 0.4, big });
      query(p.x, p.y, len + 12, e => { const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1; if (d > len + e.r) return; let da = Math.abs(Math.atan2(dy, dx) - a); if (da > Math.PI) da = TAU - da; if (da < ang) hurtEnemy(e, dmg, dx / d * 330, dy / d * 330); });
      Snd.fx.dash();
    } else if (id === 'guitar') { // lightning on random foes (evolved: chains)
      const solo = G.evo.guitar; G.cd[id] = (solo ? 1.2 : s.cd) * cdm;
      for (let i = 0; i < (solo ? 3 : s.n); i++) {
        let e = randomVisibleEnemy() || nearest(p.x, p.y, 260); if (!e) break;
        zap(e.x, e.y, s.dmg * (solo ? 0.9 : 1) * G.gtMul, s.r * area);
        if (solo) { const hit = new Set([e]); for (let k = 0; k < 5; k++) { let best = null, bd = 110 * 110; query(e.x, e.y, 110, o => { if (hit.has(o)) return; const d = (o.x - e.x) ** 2 + (o.y - e.y) ** 2; if (d < bd) { bd = d; best = o; } }); if (!best) break; G.zaps.push({ x: e.x, y: e.y, x1: best.x, y1: best.y, life: 0.3, max: 0.3, chain: true }); hurtEnemy(best, s.dmg * 0.8, 0, 0); hit.add(best); e = best; } }
      }
      Snd.fx.beam();
    }
  }
  fireP6(dt);
  // ハムスターボール: balls that roll and bounce inside the view
  const hl = ws.ham;
  if (hl) {
    const s = W.ham(hl), par = G.evo.ham, n = par ? 6 : s.n, r = (par ? 14 : s.r) * area, sp = par ? 170 : s.spd, dmg = s.dmg * (par ? 1.5 : 1);
    while (G.hams.length < n) { const a = Math.random() * TAU; G.hams.push({ x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, rot: 0 }); }
    const hw = RD.viewW * 0.46, hh = RD.viewH * 0.42;
    for (const b of G.hams) {
      const v = Math.hypot(b.vx, b.vy) || 1; b.vx = b.vx / v * sp; b.vy = b.vy / v * sp; b.x += b.vx * dt; b.y += b.vy * dt; b.rot += dt * sp / 10;
      if (b.x < G.cam.x - hw) { b.x = G.cam.x - hw; b.vx = Math.abs(b.vx); } if (b.x > G.cam.x + hw) { b.x = G.cam.x + hw; b.vx = -Math.abs(b.vx); }
      if (b.y < G.cam.y - hh) { b.y = G.cam.y - hh; b.vy = Math.abs(b.vy); } if (b.y > G.cam.y + hh) { b.y = G.cam.y + hh; b.vy = -Math.abs(b.vy); }
      query(b.x, b.y, r + 12, e => { if (G.t - (e.hb || 0) > 0.4 && Math.hypot(e.x - b.x, e.y - b.y) < e.r + r) { e.hb = G.t; hurtEnemy(e, dmg, b.vx / sp * 120, b.vy / sp * 120); } });
    }
  }
  if (G.evo.apple) { // りんご台風: orbiting apples
    G.applA += dt * 2.6; const R0 = 64 + Math.sin(G.t * 2) * 30;
    for (let i = 0; i < 6; i++) {
      const a = G.applA + i / 6 * TAU, x = p.x + Math.cos(a) * R0, y = p.y + Math.sin(a) * R0 * 0.8;
      query(x, y, 16, e => { if (G.t - (e.ap || 0) > 0.3 && Math.hypot(e.x - x, e.y - y) < e.r + 8) { e.ap = G.t; hurtEnemy(e, 34, Math.cos(a) * 140, Math.sin(a) * 140); } });
    }
  }
  // evolutions with their own timers
  if (G.evo.berry) { G.cd.shower -= dt; if (G.cd.shower <= 0) { G.cd.shower = 1.0 * cdm; for (let i = 0; i < 5; i++) { const e = randomVisibleEnemy(); const x = e ? e.x + rnd(-6, 6) : p.x + rnd(-120, 120), y = e ? e.y + rnd(-4, 4) : p.y + rnd(-80, 80); G.falls.push({ k: 'berry', x, y, h: 130 + i * 18, vh: -260, dmg: 45, r: 24 }); } } }
  if (G.evo.beam) { G.cd.final -= dt; if (G.cd.final <= 0) { G.cd.final = 6 * cdm; finalBlast(); } }
  if (G.evo.brush) { G.cd.kanji -= dt; if (G.cd.kanji <= 0) { G.cd.kanji = 1.8 * cdm; for (let i = 0; i < 3; i++) { const e = randomVisibleEnemy(); const x = e ? e.x : p.x + rnd(-120, 120), y = e ? e.y : p.y + rnd(-80, 80); G.falls.push({ k: 'kanji', g: (Math.random() * 5) | 0, x, y, h: 170 + i * 30, vh: -320, dmg: 80, r: 42 * area }); } } }
  const pl = ws.penlight;
  if (pl) {
    const s = W.penlight(pl), dmg = s.dmg * (G.evo.penlight ? 1.5 : 1); G.penA += dt * 3.2; G.penB -= dt * 2.4;
    for (const [x, y, a] of penPos(s)) query(x, y, 12, e => { if (G.t - e.pl > 0.3 && Math.hypot(e.x - x, e.y - y) < e.r + 6) { e.pl = G.t; hurtEnemy(e, dmg, Math.cos(a) * 80, Math.sin(a) * 80); } });
  }
  const sl = ws.seal;
  if (sl) {
    const s = W.seal(sl), party = G.evo.seal;
    G.seals.forEach((sea, i) => {
      G.sealCd[i] -= dt; if (G.sealCd[i] > 0) return;
      const tgt = nearest(sea.x, sea.y, 180); if (!tgt) { G.sealCd[i] = 0.2; return; }
      G.sealCd[i] = s.cd * cdm * (party ? 0.7 : 1); const a = Math.atan2(tgt.y - sea.y, tgt.x - sea.x);
      G.projs.push({ k: 'bubble', x: sea.x, y: sea.y, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160, dmg: party ? s.dmg * 1.4 : s.dmg, pierce: 0, life: 1.3, hit: null, chain: party ? 2 : 0, big: party });
      sea.hop = 0.3; sea.face = Math.cos(a) >= 0 ? 1 : -1; Snd.fx.bubble();
    });
  }
}
// penlight positions: one ring, or two rings (4 inner + 4 outer, spinning opposite ways) when evolved
function penPos(s) {
  const p = G.p, out = [];
  if (G.evo.penlight) { for (let i = 0; i < 4; i++) { const a = G.penA + i / 4 * TAU; out.push([p.x + Math.cos(a) * s.r, p.y + Math.sin(a) * s.r * 0.8, a]); const b = G.penB + (i + 0.5) / 4 * TAU; out.push([p.x + Math.cos(b) * s.r * 1.75, p.y + Math.sin(b) * s.r * 1.75 * 0.8, b]); } }
  else for (let i = 0; i < s.n; i++) { const a = G.penA + i / s.n * TAU; out.push([p.x + Math.cos(a) * s.r, p.y + Math.sin(a) * s.r * 0.8, a]); }
  return out;
}
function zap(x, y, dmg, r) { G.zaps.push({ x, y, life: 0.35, max: 0.35 }); aoe(x, y, r, dmg, 60); burst(x, y, [0xffe066, 0xffffff, 0xff7eb6], 8, 80, 1.4, 6); }
function randomVisibleEnemy() {
  const hw = RD.viewW * 0.45, hh = RD.viewH * 0.42, n = G.enemies.length; if (!n) return null;
  for (let k = 0; k < 8; k++) { const e = G.enemies[(Math.random() * n) | 0]; if (e.hp > 0 && Math.abs(e.x - G.cam.x) < hw && Math.abs(e.y - G.cam.y) < hh) return e; }
  return null;
}
// ---------- 必殺技: キョンレンジャー大集合 ----------
// Kills fill the gauge (G.sp 0..1) through G.spPend, but never faster than SP_RATE, so it is ready about once every 60–90 s
// (キョンレンジャー: fewer kills needed and a faster cap, about every 45–60 s). Bosses take a share of max HP, capped in endless.
const SP_RATE = 1 / 70, SP_RATE_R = 1 / 48, SP_DUR = CINE.END; // the whole cut-scene; the game is frozen meanwhile
const spNeed = () => G.char === 'ranger' ? 90 : 130;
function updateSp(dt) {
  if (G.sp < 1 && G.spPend > 0) { const mv = Math.min(G.spPend, dt * (G.char === 'ranger' ? SP_RATE_R : SP_RATE)); G.sp = Math.min(1, G.sp + mv); G.spPend -= mv; if (G.sp >= 1) { G.sp = 1; G.spPend = 0; toast(SP_T[lang].ready); Snd.fx.seal(); } }
}
function useSp() {
  if (!G || state !== 'play' || G.sp < 1 || G.spT > 0) return false;
  G.sp = 0; G.spPend = 0; G.spT = SP_DUR; G.spN = (G.spN || 0) + 1;
  let seen = false; try { seen = localStorage.getItem(SP_SEEN) === '1'; } catch { }
  G.cine = makeCine(seen); Snd.duck(true); cineSize(); $('spfx').classList.remove('hide');
  return true;
}
// cut-scene timeline: the game is frozen (no movement, no damage, no spawns) until it ends. Only the finisher hits.
const SP_SEEN = 'kyoka-spseen'; // after the first full viewing, a tap skips (cosmetic, not part of the save)
const CEV = [[0, () => Snd.fx.spSting()], ...[0, 1, 2, 3, 4].map(j => [CINE.E0 + j * CINE.ED, () => Snd.fx.spEntry(j)]),
  [CINE.BOOM, () => { Snd.fx.spBoom(); G.shake = 10; }], [CINE.FIN, () => Snd.fx.spBeam()], [CINE.HIT, () => spBlast()]];
function cineTick(dt) {
  const c = G.cine; c.t += dt; G.spT = Math.max(0.001, SP_DUR - c.t);
  while (c.ev < CEV.length && c.t >= CEV[c.ev][0]) CEV[c.ev++][1]();
  tickCine(c, dt, cineW, cineH);
  if (c.t >= CINE.HIT) { tickFx(dt); for (let i = G.enemies.length - 1; i >= 0; i--) if (G.enemies[i].hp <= 0) { G.enemies[i] = G.enemies[G.enemies.length - 1]; G.enemies.pop(); } } // the pops play out
  if (c.t >= CINE.END) endCine();
}
function endCine() {
  G.cine = null; G.spT = 0; G.p.inv = Math.max(G.p.inv, 1); Snd.duck(false); $('spfx').classList.add('hide');
  try { localStorage.setItem(SP_SEEN, '1'); } catch { }
}
function skipCine() { // jump to the finisher (sounds and shakes before it are dropped, the hit itself still lands)
  const c = G && G.cine; if (!c || !c.canSkip || c.t >= CINE.FIN) return;
  c.t = CINE.FIN; c.skipped = true; c.sparks.length = 0; while (c.ev < CEV.length && CEV[c.ev][0] < CINE.FIN) c.ev++;
}
let cineW = 390, cineH = 844, cineCtx = null;
function cineSize() {
  const cv = $('spfx'), dpr = Math.min(window.devicePixelRatio || 1, innerWidth < 700 ? 1.5 : 2); cineW = innerWidth; cineH = innerHeight;
  cv.width = Math.round(cineW * dpr); cv.height = Math.round(cineH * dpr); cineCtx = cv.getContext('2d'); cineCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function drawCineNow() {
  const c = G.cine, spr = CINE_ORDER.map(i => R['kr' + i + '0'].canvas), pose = CINE_ORDER.map(i => (R['kr' + i + 'Dash'] || R['kr' + i + '0']).canvas);
  drawCine(cineCtx, cineW, cineH, c, { spr, pose, title: SP_T[lang].name.replace(/^⚡\s*/, ''), skip: c.canSkip ? SP_T[lang].skip : '' });
}
function spBlast() {
  const p = G.p, hw = RD.viewW * 0.62, hh = RD.viewH * 0.58, bossFrac = G.endless ? 0.05 : 0.1; // endless bosses: capped at 5% of max HP
  G.blasts.push({ x: p.x, y: p.y, life: 1.3, max: 1.3, big: 1.35 }); G.shake = 18; G.flash = Math.max(G.flash, 0.65); G.flashRed = 0;
  for (const e of G.enemies.slice()) {
    if (e.hp <= 0 || Math.abs(e.x - p.x) > hw || Math.abs(e.y - p.y) > hh) continue;
    if (e.boss) { const d = Math.max(1, e.maxHp * bossFrac); e.hp -= d; e.flash = 0.2; addNum(e.x, e.y, Math.round(d), true); if (e.hp <= 0) killEnemy(e); }
    else { const dx = e.x - p.x, dy = e.y - p.y, dd = Math.hypot(dx, dy) || 1; e.hp = Math.min(e.hp, 1); hurtEnemy(e, 1e6, dx / dd * 200, dy / dd * 200); }
  }
  G.nums = G.nums.filter(n => n.v < 1e5); // the finisher pops foes; no "1000000" numbers
  G.ebul = G.ebul.filter(b => Math.abs(b.x - p.x) > hw || Math.abs(b.y - p.y) > hh);
  for (let i = 0; i < 5; i++) burst(p.x + (i - 2) * 46, p.y - 34, [RANGER_HEX[i], 0xffffff, 0xffd94a], 22, 180, 1.8, 24);
}
function finalBlast() { // キョンレンジャー・ファイナル爆破
  const p = G.p; G.blasts.push({ x: p.x, y: p.y, life: 1.0, max: 1.0, big: 1 }); G.shake = 14; G.flash = Math.max(G.flash, 0.45); G.flashRed = 0; Snd.fx.boom();
  const hw = RD.viewW * 0.55, hh = RD.viewH * 0.5;
  for (const e of G.enemies) if (e.hp > 0 && Math.abs(e.x - p.x) < hw && Math.abs(e.y - p.y) < hh) { const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1; hurtEnemy(e, 110, dx / d * 160, dy / d * 160); }
  for (let i = 0; i < 5; i++) burst(p.x + rnd(-90, 90), p.y + rnd(-60, 60), [RANGER_HEX[i], 0xffffff, 0xffd94a], 14, 140, 1.6, 20);
}
const RANGER_HEX = [0xe8394f, 0x3a7ae0, 0xf0c830, 0xff7eb6, 0x3ab85a];

// ---------- phase 2: new weapons, boss attacks, pickups, chest ----------
const basketN = () => { const b = G.passives.basket || 0; return b >= 3 ? 2 : b >= 1 ? 1 : 0; };
const dogScale = () => (G && G.giant ? 2.6 : 1.6) + (G ? 0.08 * G.hanpen : 0);
function bossAttack(e, dt) {
  if (!G.endless) return bossAttack0(e, dt);
  if (e.mode === 'chase' && e.atk - dt > 0 && e.atk - dt < 0.8 && !e.twR) { e.twR = { x: e.x, y: e.y, r: e.r * 2.6, life: 0.8, max: 0.8, col: 3 }; G.rings.push(e.twR); } // telegraph: a red ring before every big attack
  if (e.twR) { e.twR.x = e.x; e.twR.y = e.y; }
  const a0 = e.atk; bossAttack0(e, dt);
  if (e.atk > a0) { e.atk *= 1.15; e.twR = null; } // fired: a little more breathing room between attacks
}
function bossAttack0(e, dt) {
  e.atk -= dt; if (e.atk > 0 || e.mode !== 'chase') return;
  const p = G.p, a0 = Math.atan2(p.y - e.y, p.x - e.x);
  if (e.type === 'zou') { // water spray in all directions
    e.atk = 4.2; for (let k = 0; k < 10; k++) { const a = a0 + k / 10 * TAU; G.ebul.push({ k: 'drop', x: e.x, y: e.y, vx: Math.cos(a) * 85, vy: Math.sin(a) * 85, life: 3.2, dmg: 8 }); }
    burst(e.x, e.y - 4, [0x9fe0ff, 0xffffff, 0x5ab0f0], 14, 70, 1.4, 22); Snd.fx.bubble();
  } else if (e.type === 'bigsnow') { // throws three snowballs
    e.atk = 2.8; for (let k = -1; k <= 1; k++) { const a = a0 + k * 0.3; G.ebul.push({ k: 'sbul', x: e.x, y: e.y, vx: Math.cos(a) * 110, vy: Math.sin(a) * 110, life: 3, dmg: 8 }); }
    Snd.fx.shoot();
  } else if (e.type === 'bigspk') { // a sound ring that you jump through with a dash
    e.atk = 4.6; G.hazards.push({ x: e.x, y: e.y, r: 12, max: 210, spd: 88, dmg: 6, hit: false }); G.shake = Math.max(G.shake, 3); Snd.fx.mic();
  } else if (e.type === 'bell') { // wedding bell: a ringing shock wave, then a spray of hearts
    e.bm = (e.bm || 0) + 1;
    if (e.bm % 2) { e.atk = 3.6; G.hazards.push({ x: e.x, y: e.y, r: 12, max: 190, spd: 80, dmg: 6, hit: false }); G.shake = Math.max(G.shake, 3); Snd.fx.mic(); }
    else { e.atk = 3.2; for (let k = 0; k < 10; k++) { const a = a0 + k / 10 * TAU; G.ebul.push({ k: 'heartb0', x: e.x + Math.cos(a) * e.r, y: e.y + Math.sin(a) * e.r, vx: Math.cos(a) * 80, vy: Math.sin(a) * 80, life: 3.2, dmg: 7 }); } Snd.fx.bubble(); }
  } else if (e.type === 'cdragon') { // firecracker dragon: a fan of fireballs, then a burst of capsules all around
    e.dragN = (e.dragN || 0) + 1;
    if (e.dragN % 2) { e.atk = 2.8; for (let k = -2; k <= 2; k++) { const a = a0 + k * 0.22; G.ebul.push({ k: 'fireb', x: e.x + Math.cos(a) * e.r, y: e.y + Math.sin(a) * e.r, vx: Math.cos(a) * 115, vy: Math.sin(a) * 115, life: 2.8, dmg: 8 }); } Snd.fx.boom(); G.shake = Math.max(G.shake, 3); }
    else { e.atk = 3.4; for (let k = 0; k < 12; k++) { const a = a0 + k / 12 * TAU; G.ebul.push({ k: 'capsb' + (k % 4), x: e.x + Math.cos(a) * e.r, y: e.y + Math.sin(a) * e.r, vx: Math.cos(a) * 75, vy: Math.sin(a) * 75, life: 3.4, dmg: 7 }); } Snd.fx.bubble(); }
  } else if (e.type === 'bmole') { // digs and pops up near you
    e.atk = 5.5; fxAdd('poof', e.x, e.y, { life: 0.6, max: 0.6, size: 70 }); burst(e.x, e.y, [0x8a6a44, 0x5a4430, 0xc8a070], 24, 110, 1.4, 4);
    const a = Math.random() * TAU; e.x = p.x + Math.cos(a) * 110; e.y = p.y + Math.sin(a) * 80; e.spawnT = 0; e.mode = 'tele'; e.mt = 0.9;
    burst(e.x, e.y, [0x8a6a44, 0x5a4430, 0xc8a070], 24, 110, 1.4, 4); G.shake = Math.max(G.shake, 5); Snd.fx.drum();
  } else if (ETYPES6[e.type]) bossAtk6(e, a0);
  else e.atk = 99;
}
function updateP2(dt) {
  const p = G.p;
  for (let i = G.sws.length - 1; i >= 0; i--) { // voice rings
    const w = G.sws[i]; w.r += w.spd * dt; if (w.r > w.max) { G.sws.splice(i, 1); continue; } if (w.r <= 0) continue;
    query(w.x, w.y, w.r + 16, e => { if (e.sw === w.id) return; const dx = e.x - w.x, dy = e.y - w.y, d = Math.hypot(dx, dy) || 1; if (Math.abs(d - w.r) < 9 + e.r * 0.6) { e.sw = w.id; hurtEnemy(e, w.dmg, dx / d * (w.enc ? 30 : 50), dy / d * (w.enc ? 30 : 50)); if (w.enc && !e.boss) e.slow = 0.3; } });
  }
  for (let i = G.cys.length - 1; i >= 0; i--) { // glowsticks
    const c = G.cys[i]; if (c.t < c.T) { c.t += dt; continue; }
    c.life -= dt; if (c.life <= 0) { G.cys.splice(i, 1); continue; }
    if ((c.tick -= dt) <= 0) { c.tick = 0.5; aoe(c.x, c.y, c.r, c.dmg, 30); }
  }
  for (let i = G.lobs.length - 1; i >= 0; i--) { // lobbed apples
    const l = G.lobs[i]; l.t += dt; if (l.t < l.T) continue;
    G.lobs.splice(i, 1); aoe(l.x1, l.y1, l.r, l.dmg, 100); G.rings.push({ x: l.x1, y: l.y1, r: l.r, life: 0.3, max: 0.3, col: 3 });
    burst(l.x1, l.y1, [0xe8394f, 0xff8a8a, 0x58b048, 0xffffff], 8, 70, 1.2, 4); Snd.fx.plop();
    if (l.b > 0) { const dx = l.x1 - l.x0, dy = l.y1 - l.y0, d = Math.hypot(dx, dy) || 1; G.lobs.push({ x0: l.x1, y0: l.y1, x1: l.x1 + dx / d * 55, y1: l.y1 + dy / d * 55, t: 0, T: 0.38, dmg: l.dmg * 0.75, r: l.r, b: l.b - 1 }); }
  }
  for (let i = G.ebul.length - 1; i >= 0; i--) { // boss bullets
    const b = G.ebul[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (Math.hypot(b.x - p.x, b.y - p.y) < 6 + p.hitR) { hurtPlayer(b.dmg * (b.foe ? 1 : bossSoft()), b.foe ? 'shot' : 'bossShot'); b.life = 0; burst(b.x, b.y, [0xffffff, 0x9fe0ff], 6, 50, 1, 8); }
    if (b.life <= 0) G.ebul.splice(i, 1);
    if (state !== 'play') return;
  }
  for (let i = G.hazards.length - 1; i >= 0; i--) { // speaker sound rings
    const h = G.hazards[i]; h.r += h.spd * dt; if (h.r > h.max) { G.hazards.splice(i, 1); continue; }
    if (!h.hit && Math.abs(Math.hypot(p.x - h.x, p.y - h.y) - h.r) < 6 + p.hitR) { h.hit = true; hurtPlayer(h.dmg * bossSoft(), 'hazard'); if (state !== 'play') return; }
  }
}
// map pickups: 🧲 magnet, 💣 bomb, 🍰 strawberry cake (full HP + a short shield)
const PICKS = ['magI', 'bombI', 'cakeI'];
const FOODS = ['rbeef', 'steak', 'nikujaga', 'buri', 'tapi', 'tsand', 'mala', 'aman', 'xlb', 'jpai'], FOOD_HP = { rbeef: 35, steak: 45, nikujaga: 25, buri: 25, tsand: 30, mala: 20, aman: 25, xlb: 20, jpai: 50 };
function pickupSpawner() {
  if (G.t < G.nextPick) return;
  G.nextPick = G.t + 40 - 6 * G.lucky;
  const left = PICKS.filter(k => !G.got[k]), k = (left.length ? left : PICKS)[(Math.random() * (left.length || PICKS.length)) | 0];
  const a = Math.random() * TAU; G.items.push({ x: G.p.x + Math.cos(a) * 110, y: G.p.y + Math.sin(a) * 75, k });
}
function usePickup(k) {
  const p = G.p; G.got[k] = 1; banner(PT().pick[k], 'stage');
  if (k === 'magI') { for (const g of G.gems) g.fly = true; for (const it of G.items) if (it.k === 'coin') it.pull = true; Snd.fx.magnet(); G.rings.push({ x: p.x, y: p.y, r: 160, life: 0.6, max: 0.6, col: 4 }); }
  else if (k === 'bombI') {
    const hw = RD.viewW * 0.55, hh = RD.viewH * 0.55;
    for (const e of G.enemies.slice()) if (e.hp > 0 && Math.abs(e.x - p.x) < hw && Math.abs(e.y - p.y) < hh) { if (e.boss) hurtEnemy(e, 260, 0, 0); else { e.hp = 0; killEnemy(e); } }
    G.blasts.push({ x: p.x, y: p.y, life: 0.9, max: 0.9, big: 0.8 }); G.shake = 14; G.flash = 0.6; G.flashRed = 0; Snd.fx.boom();
  } else if (k === 'cakeI') { heal(p.maxHp); G.shield = 4; Snd.fx.freeze(); G.flash = 0.35; G.flashRed = 0; burst(p.x, p.y, [0xff7e9a, 0xffffff, 0xffd0e0], 30, 100, 1.5, 14); }
  if (PICKS.every(q => G.got[q])) achNote('pickups');
}
// boss treasure chest with a roulette
let chestRw = [], chestT = 0, chestTimers = [];
function chestRewards() {
  const out = [], n = Math.random() < 0.2 + 0.12 * G.lucky ? 3 : Math.random() < 0.55 ? 2 : 1;
  for (let k = 0; k < n; k++) {
    const ev = evoReady(); if (ev) { applyEvo(ev); out.push('evo_' + ev); continue; }
    const own = WEAPONS.filter(id => G.weapons[id] && G.weapons[id] < MAXLV[id]), ownP = PASSIVES.filter(id => G.passives[id] && G.passives[id] < MAXLV[id]);
    const [nW, nP] = slotsUsed(), fresh = WEAPONS.filter(id => !lvOf(id) && nW < wCapG() && wepOpen(id)).concat(PASSIVES.filter(id => !lvOf(id) && nP < MAX_P));
    const pool = own.length ? own : ownP.length ? ownP : fresh;
    if (pool.length) { const id = pool[(Math.random() * pool.length) | 0]; grantItem(id); out.push(id); }
    else if (k === 0 || Math.random() < 0.5) { G.picked += 30; out.push('coinBag'); } else { heal(G.p.maxHp); out.push('heal'); }
  }
  return out;
}
function rwIcon(k) { return k === 'coinBag' ? icon('coin', 4) : k === 'heal' ? icon('cakeI', 4) : ICON[k]; }
function rwName(k) { return k === 'coinBag' || k === 'heal' ? PT()[k][0] : T().items[k][0]; }
function openChest(ring) {
  state = 'chest'; G.chests++; achNote('chest'); if (ring) achNote('ringCake'); chestRw = chestRewards(); chestT = performance.now(); refreshWeps();
  const pt = PT(); $('ch-title').textContent = ring ? pt.ringTitle : pt.chestTitle; $('ch-say').textContent = pt.chestSpin; $('ch-img').src = icon(ring ? 'ringcake' : 'chestO', 5);
  $('ch-ok').textContent = pt.chestGo; show('ch-ok', false);
  const allIcons = Object.keys(ICON);
  $('ch-slots').innerHTML = chestRw.map(() => `<div class="slot spin"><img alt=""><b></b></div>`).join('');
  const slots = [...document.querySelectorAll('#ch-slots .slot')];
  chestTimers.forEach(clearInterval); chestTimers = [];
  slots.forEach((el, i) => {
    let n = 0; const img = el.querySelector('img'), stopAt = 10 + i * 6;
    const iv = setInterval(() => {
      n++; if (n < stopAt) { img.src = ICON[allIcons[(Math.random() * allIcons.length) | 0]]; Snd.fx.tick(); return; }
      clearInterval(iv); img.src = rwIcon(chestRw[i]); el.querySelector('b').textContent = rwName(chestRw[i]); el.classList.remove('spin'); el.classList.add('done');
      if (chestRw[i].startsWith('evo_')) el.classList.add('evo');
      if (i === slots.length - 1) { Snd.fx.chest(); $('ch-say').textContent = ''; show('ch-ok', true); if (!isTouch) $('ch-ok').focus(); }
    }, 80);
    chestTimers.push(iv);
  });
  burst(G.p.x, G.p.y, [0xffd94a, 0xffffff, 0xff7eb6], 30, 120, 1.6, 16);
  show('chest', true);
}
function closeChest() {
  if (state !== 'chest') return; if ($('ch-ok').classList.contains('hide') && !window.__kyokaTest) return;
  chestTimers.forEach(clearInterval); chestTimers = []; show('chest', false); refreshWeps();
  state = 'play'; last = performance.now(); if (G.pending > 0) openLevelUp();
}
// ---------- level up ----------
const lvOf = id => G.weapons[id] || G.passives[id] || 0;
function evoReady() { for (const id of WEAPONS) if (!G.evo[id] && (G.weapons[id] || 0) >= MAXLV[id]) return id; return null; }
function makeOffers() {
  // like the classic survivors games: at most 6 weapons and 5 passives per run, so level-ups grow what you already have
  const pool = levelPool();
  const out = []; const ev = evoReady(); if (ev) out.push('evo:' + ev);
  if (G.sealLv.includes(G.lvl) && lvOf('seal') < 3 && out.length < 3) out.push('seal');
  if (G.endless && out.length < 3) { const fw = pool.filter(id => WEAPONS.includes(id) && !lvOf(id)); if (fw.length) out.push(fw[(Math.random() * fw.length) | 0]); } // a free slot: always offer a new weapon
  while (out.length < 3 && pool.length) {
    const cand = pool.filter(id => !out.includes(id)); if (!cand.length) break;
    const wts = cand.map(id => (lvOf(id) ? 1.8 : 1) * (PASSIVES.includes(id) ? 0.6 : 1) * (EVO[id] && lvOf(id) >= 3 ? 1.4 : 1));
    let s = wts.reduce((a, b) => a + b, 0), r = Math.random() * s, k = 0; while ((r -= wts[k]) > 0) k++;
    out.push(cand[Math.min(k, cand.length - 1)]);
  }
  const bs = BOOST_IDS.filter(id => (G.boost[id] || 0) < BOOST[id].cap); // then the stacking boosts; food only as a last resort
  while (out.length < 3 && bs.length) out.push(bs.splice((Math.random() * bs.length) | 0, 1)[0]);
  while (out.length < 3) out.push('oyaki');
  return out;
}
// every owned weapon or passive below max, plus unowned ones while that kind still has a free slot
function slotsUsed() { return [WEAPONS.filter(id => G.weapons[id]).length, PASSIVES.filter(id => G.passives[id]).length]; }
function levelPool() {
  const [nW, nP] = slotsUsed(), pool = [];
  for (const id of WEAPONS.concat(PASSIVES)) { const l = lvOf(id); if (l < MAXLV[id] && (l || (WEAPONS.includes(id) ? nW < wCapG() && wepOpen(id) : nP < MAX_P))) pool.push(id); }
  return pool;
}
let offers = [], selIdx = 0, lvOpenT = 0;
function openLevelUp(force) {
  state = 'levelup'; offers = force || makeOffers(); selIdx = 0; lvOpenT = performance.now(); Snd.fx.levelup();
  const t = T(), box = $('cards'); box.innerHTML = '';
  offers.forEach((id, i) => {
    const evo = id.startsWith('evo:'), key = evo ? 'evo_' + id.slice(4) : id, bst = !!BOOST[id];
    const l = evo || bst ? 0 : lvOf(id), max = evo || bst ? 0 : MAXLV[id] || 0, b = document.createElement('button');
    const cat = evo ? 'c-evo' : bst ? 'c-pass c-boost' : id === 'seal' ? 'c-seal' : PASSIVES.includes(id) || id === 'oyaki' ? 'c-pass' : 'c-wep';
    b.className = `card ${cat}` + (i === 0 ? ' sel' : ''); b.style.animationDelay = (i * 0.07) + 's';
    const [nm, ds] = t.items[key];
    let desc = ds; if (l && id !== 'oyaki') desc = `<b>${id === 'seal' && l < 3 ? t.sealUp : t.up}</b><br>${ds}`;
    let pips = ''; for (let k = 1; k <= max; k++) pips += `<i class="${k <= l ? 'on' : k === l + 1 ? 'next' : ''}"></i>`;
    if (bst) desc += `<br><b class="stk">${PT().stack.replace('{n}', G.boost[id] || 0)}</b>`;
    const tag = evo ? `<span class="new evo">${t.evoTag}</span>` : bst ? `<span class="new boost">${PT().boostTag}</span>` : !l && id !== 'oyaki' ? `<span class="new">${t.newTag}</span>` : '';
    if (!evo && WEAPONS.includes(id) && l + 1 >= MAXLV[id]) desc += `<br><span class="eh">★ ${PT().evoHint}</span>`;
    b.innerHTML = `<span class="key">${i + 1}</span>${tag}
      <div class="art"><img src="${ICON[key]}" alt=""></div>
      <div class="hd"><div class="nm">${nm}</div><div class="pips">${pips}</div></div><div class="ds">${desc}</div>`;
    b.addEventListener('click', () => pick(i));
    box.appendChild(b);
  });
  $('levelup').classList.remove('hide');
}
function applyEvo(id) {
  G.evo[id] = true; const t = T(), nm = t.items['evo_' + id][0];
  banner(t.evoDone.replace('{n}', nm), 'stage'); G.flash = 0.5; G.shake = 8; Snd.fx.evolve();
  burst(G.p.x, G.p.y, [0xffd94a, 0xffffff, 0xff7eb6, 0x6ec3ff, 0x7ee87a], 50, 120, 1.6, 16);
  if (id === 'seal') { while (G.seals.length < 5) addSeal(); Snd.fx.seal(); }
  if (id === 'beam') finalBlast();
  if (id === 'ham') G.hams.length = 0;
  achNote(EVO[id].ach); if (++G.evoN >= 3) achNote('evo3');
}
function pick(i) {
  if (state !== 'levelup') return; if (performance.now() - lvOpenT < 250 && !window.__kyokaTest) return;
  const id = offers[i]; Snd.fx.select();
  if (id.startsWith('evo:')) applyEvo(id.slice(4)); else grantItem(id);
  $('levelup').classList.add('hide'); G.pending--; refreshWeps(); G.lvFx = 0.8;
  state = 'play'; if (G.pending > 0) openLevelUp();
}
function grantItem(id) {
  if (WEAPONS.includes(id)) {
    const was = G.weapons[id] || 0; G.weapons[id] = Math.min(MAXLV[id], was + 1); // stat tables stop at MAXLV
    if (was < MAXLV[id] && G.weapons[id] >= MAXLV[id] && !G.evo[id]) setTimeout(() => { if (G && state === 'play') banner(PT().evoSoon.replace('{n}', T().items[id][0]), 'stage'); }, 300);
    if (id === 'seal' && G.seals.length < 3) { addSeal(); banner(T().sealJoin); Snd.fx.seal(); burst(G.p.x, G.p.y, [0xffffff, 0xc9d3df, 0x6ec3ff], 18, 70, 1, 8); }
  } else if (BOOST[id]) {
    if ((G.boost[id] || 0) >= BOOST[id].cap) return; G.boost[id] = (G.boost[id] || 0) + 1; const p = G.p;
    if (id === 'b_hp') { p.maxHp += 5; heal(5); } else if (id === 'b_spd') p.speed *= 1.02; else if (id === 'b_mag') p.magnet *= 1.05; else if (id === 'b_coin') { G.picked += 10; Snd.fx.coin(); }
  } else if (id === 'oyaki') heal(25);
  else {
    G.passives[id] = Math.min(MAXLV[id] || 3, (G.passives[id] || 0) + 1);
    if (id === 'pannier') { G.p.maxHp += 20; heal(20); }
    if (id === 'shoes') G.p.speed *= 1.1;
    if (id === 'ribbon') G.p.magnet *= 1.35;
  }
}
function heal(v) { G.p.hp = Math.min(G.p.maxHp, G.p.hp + v); Snd.fx.heal(); burst(G.p.x, G.p.y, [0x7ee87a, 0xffffff, 0xc8ffb0], 14, 50, 1.3, 12); }
function gainXp(v) {
  G.xp += v * (1 + 0.12 * (G.passives.gakufu || 0)) * (G.xpMul || 1);
  while (G.xp >= G.xpNext) { G.xp -= G.xpNext; G.lvl++; G.xpNext = xpForG(G.lvl); G.pending++; }
  if (G.pending > 0 && state === 'play' && !window.__kyokaNoLv) openLevelUp();
}
// achievements: grant, toast, remember for the result screen
function achNote(id) {
  if (!grant(profile, id)) return;
  if (G) G.newAch.push(id); toast(MT().achGet.replace('{a}', ACH[id][lang][0])); Snd.fx.ach(); saveLocal(profile);
}
function checkAch() {
  if (G.t >= 180) achNote('survive3');
  if (G.seals.length >= 3) achNote('seals3');
  if (G.kills >= 1000) achNote('kills1000');
  if (G.lvl >= 30) achNote('lv30');
  if (G.safe >= 120) achNote('noDamage'); // real play seconds without a hit (not fooled by skipping time)
  if (G.endless && G.t >= 600) achNote('endless10');
}

// ---------- update ----------
function update(dt) {
  updateSp(dt);
  { const rg = (G.regen || 0) + 0.25 * (G.boost.b_regen || 0); if (rg && G.p.hp > 0) G.p.hp = Math.min(G.p.maxHp, G.p.hp + rg * dt); } // きょんカフェ + HP regen boosts
  G.safe += dt; if (G.t - (G.lastSave || 0) >= 10) { G.lastSave = G.t; saveRun(); }
  if (G.endless) { const wc = wCapG(); if (wc > (G.wcap || MAX_W)) { G.wcap = wc; banner(RUN_T[lang].slotUp.replace('{n}', wc), 'stage'); Snd.fx.chest(); refreshWeps(); } }
  const p = G.p;
  G.t += dt;
  G.stageT += dt; RD.groundMat.uniforms.uMix.value = clamp(G.stageT / 0.6, 0, 1);
  lerpLook(look6(), Math.min(1, dt * 1.5));
  if (!G.endless && G.t >= WIN_T) { endGame(true); return; }
  // character / passive modifiers for this frame
  if (G.char === 'ranger') { const rc = Math.floor(G.t / 30) % 5; if (rc !== G.rc) { G.rc = rc; banner(T().rangerCol[rc], 'stage'); G.henshin = 0.5; burst(p.x, p.y, [RANGER_HEX[rc], 0xffffff], 24, 90, 1.4, 16); Snd.fx.beam(); } G.spr = 'kr' + G.rc; }
  const rc = G.char === 'ranger' ? G.rc : -1;
  G.dm = G.dmgMul * (1 + 0.06 * (G.passives.suzuri || 0)) * 1.03 ** (G.boost.b_atk || 0) * (rc === 0 ? 1.2 : 1);
  G.cdm = G.cdMul * (rc === 1 ? 0.85 : 1) * (1 - 0.06 * (G.passives.metro || 0)) * (1 - 0.01 * (G.boost.b_cd || 0)); G.area = Math.min(1.3, 1 + 0.07 * (G.passives.gobelt || 0)) * (1 + 0.03 * (G.boost.b_area || 0));
  const magnet = p.magnet * (rc === 2 ? 1.4 : 1);
  if (rc === 3 && p.hp > 0) p.hp = Math.min(p.maxHp, p.hp + 1.5 * dt);
  if (G.passives.nodoame && p.hp > 0) p.hp = Math.min(p.maxHp, p.hp + 0.5 * G.passives.nodoame * dt);
  mods6();
  G.shield = Math.max(0, G.shield - dt);
  tick6(dt);
  pickupSpawner();
  if (Math.floor(G.t * 2) !== Math.floor((G.t - dt) * 2)) checkAch();
  spawning(dt);
  buildGrid();

  let mx = 0, my = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) mx--; if (keys.has('KeyD') || keys.has('ArrowRight')) mx++;
  if (keys.has('KeyW') || keys.has('ArrowUp')) my--; if (keys.has('KeyS') || keys.has('ArrowDown')) my++;
  if (joy.on) { const dx = joy.x - joy.ox, dy = joy.y - joy.oy, d = Math.hypot(dx, dy); if (d > 6) { const m = Math.min(1, d / 40); mx = dx / d * m; my = dy / d * m; } }
  if (G.auto) [mx, my] = autoMove();
  const ml = Math.hypot(mx, my); if (ml > 1) { mx /= ml; my /= ml; }
  p.moving = ml > 0.05;
  if (p.moving) { const n = Math.hypot(mx, my); p.dx = mx / n; p.dy = my / n; if (Math.abs(mx) > 0.1) p.face = mx > 0 ? 1 : -1; }
  p.dashCd -= dt; p.inv -= dt; p.hurtT -= dt;
  G.speedT -= dt; let sp = p.speed * (rc === 4 ? 1.08 : 1) * (G.speedT > 0 ? 1.35 : 1) * speed6(dt);
  if (G.speedT > 0 && Math.random() < dt * 14) G.parts.push({ x: p.x + rnd(-5, 5), y: p.y, h: rnd(2, 12), vx: -p.dx * 25, vy: -p.dy * 15, vh: rnd(5, 15), life: 0.45, max: 0.45, c: [1, 0.85, 0.6], s: 0.7, em: 0.5 });
  if (p.dashT > 0) { p.dashT -= dt; sp *= 3.2; mx = p.dx; my = p.dy; G.ghosts.push({ x: p.x, y: p.y, face: p.face, life: 0.28, max: 0.28 }); if (Math.random() < 0.8) G.parts.push({ x: p.x + rnd(-5, 5), y: p.y, h: 1, vx: -p.dx * 30, vy: -p.dy * 20, vh: rnd(10, 30), life: 0.35, max: 0.35, c: [0.86, 0.8, 0.66], s: 0.9, em: 0 }); }
  p.x += mx * sp * dt; p.y += my * sp * dt;
  if (p.moving || p.dashT > 0) p.anim += dt * 9; else p.anim = 0;
  if (p.moving && Math.random() < dt * 6) G.parts.push({ x: p.x + rnd(-4, 4), y: p.y + 1, h: 0.5, vx: rnd(-8, 8), vy: 0, vh: rnd(8, 18), life: 0.4, max: 0.4, c: [0.85, 0.8, 0.65], s: 0.6, em: 0 });
  G.hist.unshift(p.x, p.y); if (G.hist.length > 160) G.hist.length = 160;

  G.seals.forEach((s, i) => {
    const k = Math.min(G.hist.length - 2, (i + 1) * 24) & ~1;
    const tx = G.hist[k] + ((i % 3) - 1) * 6, ty = G.hist[k + 1] + 4;
    const dx = tx - s.x, dy = ty - s.y; s.x += dx * Math.min(1, dt * 7); s.y += dy * Math.min(1, dt * 7);
    const avoid = (ax, ay, m) => { const qx = s.x - ax, qy = s.y - ay, q = Math.hypot(qx, qy); if (q < m) { const kk = (m - q) / Math.max(q, 0.01) * Math.min(1, dt * 10); s.x += (q > 0.01 ? qx : (i - 1) || 1) * kk; s.y += (q > 0.01 ? qy : 0.5) * kk; } };
    avoid(p.x, p.y, 18); G.seals.forEach((o, j) => { if (j !== i) avoid(o.x, o.y, 17); });
    const mv = Math.hypot(dx, dy) > 1.5;
    if (Math.abs(dx) > 0.5 && s.hop <= 0) s.face = dx > 0 ? 1 : -1;
    s.anim += (mv ? 8 : 2.5) * dt; s.hop = Math.max(0, s.hop - dt);
    s.h = mv ? Math.abs(Math.sin(s.anim * 0.8)) * 4 : Math.max(0, Math.sin(s.anim * 0.6 + i)) * 1.5; if (s.hop > 0) s.h = Math.sin(s.hop / 0.3 * Math.PI) * 5;
  });
  updateDog(dt, magnet);

  fireWeapons(dt);

  for (let i = G.projs.length - 1; i >= 0; i--) {
    const b = G.projs[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.home && (b.ht = (b.ht || 0) - dt) <= 0) { b.ht = 0.12; const tg = nearest(b.x, b.y, 160); if (tg) { const a = Math.atan2(tg.y - b.y, tg.x - b.x), v = Math.hypot(b.vx, b.vy); b.vx += (Math.cos(a) * v - b.vx) * 0.35; b.vy += (Math.sin(a) * v - b.vy) * 0.35; } }
    let dead = b.life <= 0;
    if (!dead) query(b.x, b.y, 16, e => {
      if (b.hit === e) return; if (Math.hypot(e.x - b.x, e.y - b.y) < e.r + 4) {
        const v = Math.hypot(b.vx, b.vy); hurtEnemy(e, b.dmg, b.vx / v * 70, b.vy / v * 70); b.hit = e;
        burst(b.x, b.y, b.k === 'berry' ? [0xe63a52, 0xffa3c0, 0xffffff] : [0x9fe0ff, 0xffffff], 5, 50, 1, 9);
        if (b.chain > 0) { // bounce to the next foe
          let best = null, bd = 90 * 90; query(b.x, b.y, 90, o => { if (o === e) return; const d = (o.x - b.x) ** 2 + (o.y - b.y) ** 2; if (d < bd) { bd = d; best = o; } });
          if (best) { b.chain--; const a = Math.atan2(best.y - b.y, best.x - b.x); b.vx = Math.cos(a) * 190; b.vy = Math.sin(a) * 190; b.life = 0.8; return false; }
        }
        if (b.pierce-- <= 0) { dead = true; return false; }
      }
    });
    if (dead) { G.projs[i] = G.projs[G.projs.length - 1]; G.projs.pop(); }
  }
  for (let i = G.falls.length - 1; i >= 0; i--) { // things dropping from the sky
    const f = G.falls[i];
    if (f.landed) { f.landed -= dt; if (f.landed <= 0) G.falls.splice(i, 1); continue; }
    f.h += f.vh * dt;
    if (f.h <= 0) {
      f.h = 0; aoe(f.x, f.y, f.r, f.dmg, f.k === 'kanji' ? 60 : 100);
      if (f.k === 'kanji') { query(f.x, f.y, f.r + 10, e => { if (Math.hypot(e.x - f.x, e.y - f.y) < f.r + e.r && !e.boss) e.conf = 2.5; }); G.shake = Math.max(G.shake, 4); burst(f.x, f.y, [0x0e0a14, 0x3a3046, 0xffd060], 14, 90, 1.2, 4); G.rings.push({ x: f.x, y: f.y, r: f.r, life: 0.35, max: 0.35, col: 2 }); Snd.fx.kanji(); f.landed = 0.45; }
      else { burst(f.x, f.y, [0xe63a52, 0xffa3c0, 0xffffff], 10, 80, 1.2, 4); G.rings.push({ x: f.x, y: f.y, r: f.r, life: 0.3, max: 0.3 }); G.falls.splice(i, 1); }
    }
  }
  for (let i = G.dq.length - 1; i >= 0; i--) { const d = G.dq[i]; d.t -= dt; if (d.t <= 0) { G.dq.splice(i, 1); G.rings.push({ x: d.x, y: d.y, r: 34, life: 0.35, max: 0.35, col: 1 }); burst(d.x, d.y, [0x1a1620, 0xffffff, 0xffd94a], 8, 80, 1.3, 6); aoe(d.x, d.y, 34, 20, 140); Snd.fx.drum(); } }
  for (let i = G.horses.length - 1; i >= 0; i--) {
    const h = G.horses[i]; h.x += h.vx * dt; h.y += h.vy * dt; h.life -= dt; h.anim += dt * 14;
    if (Math.random() < 0.8) G.parts.push({ x: h.x - Math.sign(h.vx || 1) * 10, y: h.y, h: 1, vx: rnd(-14, 14), vy: rnd(-6, 6), vh: rnd(15, 35), life: 0.5, max: 0.5, c: [0.85, 0.78, 0.62], s: 1.1, em: 0 });
    query(h.x, h.y, 20, e => { if (e.hh !== h.id && Math.hypot(e.x - h.x, e.y - h.y) < e.r + 14) { e.hh = h.id; const v = Math.hypot(h.vx, h.vy); hurtEnemy(e, h.dmg, h.vx / v * 230, h.vy / v * 230); } });
    if (h.life <= 0) G.horses.splice(i, 1);
  }

  for (let i = G.enemies.length - 1; i >= 0; i--) {
    const e = G.enemies[i];
    if (e.hp <= 0) { G.enemies[i] = G.enemies[G.enemies.length - 1]; G.enemies.pop(); continue; }
    e.spawnT += dt;
    let dx = p.x - e.x, dy = p.y - e.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    let spd = e.spd * (e.slow > 0 ? 0.6 : 1); if (e.slow > 0) e.slow -= dt;
    if (e.type === 'usagi') spd *= 0.25 + 1.9 * Math.max(0, Math.sin(G.t * 5 + e.ph));
    if (e.p6) { spd = foe6(e, dt, spd, dx, dy); dx = MV.dx; dy = MV.dy; }
    if (e.beh) { spd = beh7(e, dt, spd, dx, dy, d); dx = MV.dx; dy = MV.dy; }
    if (G.frzT > 0 && !e.boss) spd = 0; else if (G.slowT > 0) spd *= 0.6;
    if (e.boss) {
      const wheel = e.type === 'wheel';
      e.mt -= dt; e.summon -= dt;
      if (e.summon <= 0) { e.summon = 8; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; spawnEnemy(G.D.summon, e.x + Math.cos(a) * 34, e.y + Math.sin(a) * 34); } }
      bossAttack(e, dt, dx, dy);
      if (e.p6 && bossTick6(e, dt, dx, dy)) { spd = MV.spd; dx = MV.dx; dy = MV.dy; }
      else if (e.mode === 'chase' && e.mt <= 0) { e.mode = 'tele'; e.mt = e.type === 'mokuba' ? 0.55 : 0.8; }
      else if (e.mode === 'tele') { spd = 0; if (e.mt <= 0) { e.mode = 'dash'; e.mt = wheel ? 0.8 : 0.6; e.ddx = dx; e.ddy = dy; } }
      else if (e.mode === 'dash') { spd = wheel ? 200 : 185; dx = e.ddx; dy = e.ddy; if (Math.random() < 0.6) G.parts.push({ x: e.x + rnd(-10, 10), y: e.y, h: 2, vx: 0, vy: 0, vh: 20, life: 0.5, max: 0.5, c: wheel ? [0.95, 0.85, 0.6] : [0.4, 0.38, 0.6], s: 1.4, em: 0 }); if (e.mt <= 0) { e.mode = 'chase'; e.mt = e.type === 'mokuba' ? 1.8 : 3.4; } }
      if (wheel) e.anim += dt * (e.mode === 'dash' ? 18 : 6);
    } else if (e.conf > 0) { e.conf -= dt; dx = -dx * 0.6 + Math.sin(G.t * 9 + e.ph) * 0.5; dy = -dy * 0.6 + Math.cos(G.t * 7 + e.ph) * 0.5; }
    if (e.type === 'crow') { const w = Math.sin(G.t * 4 + e.ph) * 0.6; const ndx = dx - dy * w, ndy = dy + dx * w; dx = ndx; dy = ndy; }
    else if (e.type === 'monkey' || e.type === 'onpu' || e.type === 'bee' || e.type === 'bat') { const w = Math.sin(G.t * 6 + e.ph) * 0.9; const ndx = dx - dy * w, ndy = dy + dx * w; dx = ndx; dy = ndy; }
    e.x += (dx * spd + e.kx) * dt; e.y += (dy * spd + e.ky) * dt;
    e.kx *= Math.pow(0.002, dt); e.ky *= Math.pow(0.002, dt);
    if (Math.abs(dx) > 0.2) e.face = dx > 0 ? 1 : -1;
    e.anim += dt * (e.type === 'crow' ? 10 : e.type === 'boss' ? 7 : e.type === 'mokuba' ? (e.mode === 'dash' ? 14 : 6) : 6); e.flash -= dt;
    if (!e.boss) { let n = 0; query(e.x, e.y, e.r * 2, o => { if (o === e) return; const ox = e.x - o.x, oy = e.y - o.y, od = ox * ox + oy * oy, m = (e.r + o.r) * 0.8; if (od < m * m && od > 0.01) { const f = (m - Math.sqrt(od)) * 0.5 / Math.sqrt(od); e.x += ox * f; e.y += oy * f; } if (++n > 6) return false; }); }
    if (d < e.r + p.hitR && e.conf <= 0) { if (e.p6) touch6(e); hurtPlayer(e.dmg * (e.boss ? bossSoft() : 1), e.boss ? 'boss' : e.cs === 2 ? 'charge' : e.elite ? 'elite' : 'foe'); }
    if (state !== 'play') return;
    if (!e.boss && (Math.abs(p.x - e.x) > RD.viewW * 0.85 || Math.abs(p.y - e.y) > RD.viewH * 0.85)) { const [x, y] = ringPos(); e.x = x; e.y = y; e.mx = undefined; }
  }

  updateP2(dt);
  if (state !== 'play') return;
  for (let i = G.gems.length - 1; i >= 0; i--) {
    const g = G.gems[i], dx = p.x - g.x, dy = p.y - g.y, d = Math.hypot(dx, dy); g.pop = Math.max(0, g.pop - dt);
    if (!g.fly && d < magnet) g.fly = true;
    if (g.fly) { const s = 70 + (1 - Math.min(1, d / 120)) * 280; g.x += dx / d * s * dt * 1.4; g.y += dy / d * s * dt * 1.4; }
    if (d < 9) { gainXp(g.v); Snd.fx.gem(); G.fx.push({ kind: 'spark', x: p.x, y: p.y, life: 0.25, max: 0.25, col: g.v >= 10 ? 0xffd24a : g.v >= 3 ? 0xc08aff : 0x6ec3ff }); G.gems[i] = G.gems[G.gems.length - 1]; G.gems.pop(); if (state !== 'play' && state !== 'levelup') return; }
  }
  for (let i = G.items.length - 1; i >= 0; i--) {
    const it = G.items[i], dx = p.x - it.x, dy = p.y - it.y, d = Math.hypot(dx, dy);
    if (it.k === 'coin' && (d < magnet || it.pull)) { const s = 120 + (1 - Math.min(1, d / 120)) * 220; it.x += dx / (d || 1) * s * dt; it.y += dy / (d || 1) * s * dt; }
    if (d < 14) {
      G.items.splice(i, 1);
      if (it.k === 'coin') { G.picked++; Snd.fx.coin(); G.fx.push({ kind: 'spark', x: p.x, y: p.y, life: 0.25, max: 0.25, col: 0xffd24a }); }
      else if (it.k === 'yaki') { heal(p.maxHp); banner(T().yakiniku); }
      else if (it.k === 'chest' || it.k === 'ringcake') { openChest(it.k === 'ringcake'); return; }
      else if (it.k === 'tapi') { G.speedT = 6; Snd.fx.heal(); banner(PT().pick.tapi); }
      else if (ITEM6.has(it.k)) pick6(it.k);
      else if (FOOD_HP[it.k]) { heal(FOOD_HP[it.k]); G.ate[it.k] = 1; if (it.k === 'mala') { G.fireT = 6; banner(PT().pick.mala); } else if (it.k === 'xlb') { banner(PT().pick.xlb); G.shake = Math.max(G.shake, 2); burst(p.x, p.y - 2, [0xffffff, 0xe8e4f0, 0xffd0a0], 16, 60, 2.2, 16); } else banner(PT().ate.replace('{n}', T().items[it.k][0])); if (FOODS.slice(0, 4).every(k => G.ate[k])) achNote('gourmet'); }
      else if (PICKS.includes(it.k)) usePickup(it.k);
      else heal(it.k === 'ebi' ? 15 : 25);
    }
  }

  for (const L of [G.gusts, G.zaps]) for (let i = L.length - 1; i >= 0; i--) { L[i].life -= dt; if (L[i].life <= 0) L.splice(i, 1); }
  tickFx(dt);
  G.cam.x += (p.x - G.cam.x) * Math.min(1, dt * 8); G.cam.y += (p.y - G.cam.y) * Math.min(1, dt * 8);
}
// はんぺん: follows Kyon, bites the nearest foe, fetches far ♪
function updateDog(dt, magnet) {
  const D = G.dog, p = G.p, green = G.char === 'ranger' && G.rc === 4;
  D.cd -= dt * (green ? 2 : 1); D.biteT = Math.max(0, D.biteT - dt);
  let tx, ty, spd;
  if (D.mode === 'bite' && (!D.tgt || D.tgt.hp <= 0 || Math.hypot(D.tgt.x - p.x, D.tgt.y - p.y) > 220)) D.mode = 'follow';
  if (D.mode === 'fetch' && (!D.tgt || D.tgt.fly || !G.gems.includes(D.tgt))) D.mode = 'follow';
  if (D.mode === 'follow' && D.cd <= 0) {
    let best = null, bd = 120 * 120; query(D.x, D.y, 120, e => { if (e.boss && Math.random() < 0.5) return; const d = (e.x - D.x) ** 2 + (e.y - D.y) ** 2; if (d < bd) { bd = d; best = e; } });
    if (best) { D.mode = 'bite'; D.tgt = best; }
    else { let g = null, gd = 170 * 170; for (const q of G.gems) { if (q.fly) continue; const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2; if (d > magnet * magnet && d < gd) { gd = d; g = q; } } if (g) { D.mode = 'fetch'; D.tgt = g; } else D.cd = 0.5; }
  }
  if (D.mode === 'bite') { tx = D.tgt.x; ty = D.tgt.y; spd = 190 * (1 + 0.1 * G.hanpen); }
  else if (D.mode === 'fetch') { tx = D.tgt.x; ty = D.tgt.y; spd = 170; }
  else { const k = Math.min(G.hist.length - 2, 14) & ~1; tx = (G.hist[k] ?? p.x) - p.face * 16; ty = (G.hist[k + 1] ?? p.y) + 8; spd = 0; }
  const dx = tx - D.x, dy = ty - D.y, d = Math.hypot(dx, dy) || 1;
  if (spd) { const m = Math.min(d, spd * dt); D.x += dx / d * m; D.y += dy / d * m; }
  else { D.x += dx * Math.min(1, dt * 6); D.y += dy * Math.min(1, dt * 6); }
  if (Math.abs(dx) > 0.5) D.face = dx > 0 ? 1 : -1;
  const mv = spd ? true : d > 2; D.anim += (mv ? 11 : 2) * dt; D.h = mv ? Math.abs(Math.sin(D.anim * 0.9)) * 2.5 : 0;
  if (D.mode === 'bite' && d < D.tgt.r + 8 * dogScale()) {
    const hk = 1 + 0.3 * G.hanpen + (G.giant ? 0.6 : 0), tg = D.tgt;
    hurtEnemy(tg, 18 * (1 + G.t / 300) * hk, dx / d * 120, dy / d * 120); D.biteT = 0.25; D.mode = 'follow'; D.cd = 2.2 * (1 - 0.15 * G.hanpen) * (G.giant ? 0.7 : 1); Snd.fx.bite();
    if (++G.bites >= 100) achNote('hanpen100');
    if (G.giant) aoe(tg.x, tg.y, 26, 10 * hk, 100);
    burst(D.tgt.x, D.tgt.y, [0xffffff, 0xffe066], 6, 50, 1, 8);
  } else if (D.mode === 'fetch' && d < 10) { D.tgt.fly = true; D.mode = 'follow'; D.cd = 1.2; }
}
function tickFx(dt) {
  for (let i = G.parts.length - 1; i >= 0; i--) { const q = G.parts[i]; q.x += q.vx * dt; q.y += q.vy * dt; q.h += q.vh * dt; q.vh -= 160 * dt; if (q.h < 0) { q.h = 0; q.vh *= -0.3; q.vx *= 0.6; q.vy *= 0.6; } q.life -= dt; if (q.life <= 0) { G.parts[i] = G.parts[G.parts.length - 1]; G.parts.pop(); } }
  for (const arr of [G.nums, G.beams, G.rings, G.ghosts, G.fx, G.slashes, G.blasts]) for (let i = arr.length - 1; i >= 0; i--) { arr[i].life -= dt; if (arr[i].life <= 0) arr.splice(i, 1); }
  G.shake = Math.max(0, G.shake - dt * 22); G.flash = Math.max(0, G.flash - dt * 1.6); G.henshin = Math.max(0, G.henshin - dt); G.lvFx = Math.max(0, G.lvFx - dt);
}
function autoMove() {
  if (G.auto === 'smart') return smartMove();
  const p = G.p, kite = G.auto === 'kite'; let fx = 0, fy = 0; // 'kite' (test bot): keep running away from the nearest foes
  query(p.x, p.y, kite ? 150 : 70, e => { const dx = p.x - e.x, dy = p.y - e.y, d2 = dx * dx + dy * dy + 1; fx += dx / d2 * (e.boss ? 30 : 1); fy += dy / d2 * (e.boss ? 30 : 1); });
  const g = G.gems.length ? G.gems.reduce((b, g) => { const d = (g.x - p.x) ** 2 + (g.y - p.y) ** 2; return d < b[0] ? [d, g] : b; }, [1e9, null])[1] : null;
  if (g) { const dx = g.x - p.x, dy = g.y - p.y, d = Math.hypot(dx, dy) + 1; fx += dx / d * 0.03; fy += dy / d * 0.03; }
  fx += Math.cos(G.t * 0.3) * 0.004; fy += Math.sin(G.t * 0.23) * 0.004;
  const l = Math.hypot(fx, fy); return l > 0.0005 ? [fx / l, fy / l] : [0, 0];
}


// test bot that plays like a careful human: circles around the crowd, dodges bullets, grabs gems, eats when hurt
function smartMove() {
  const p = G.p; let fx = 0, fy = 0, n = 0;
  query(p.x, p.y, 170, e => { const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) + 1, w = (e.boss ? 12 : 1) / (d * d) * 900; fx += dx / d * w; fy += dy / d * w; n++; });
  for (const b of G.ebul) { const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy) + 1; if (d < 90) { const w = 40 / d; fx += dx / d * w; fy += dy / d * w; } }
  for (const h of G.hazards) { const dx = p.x - h.x, dy = p.y - h.y, d = Math.hypot(dx, dy) + 1, gap = Math.abs(d - h.r); if (gap < 40) { const w = 6 / (gap + 4) * (d > h.r ? 1 : -1); fx += dx / d * w; fy += dy / d * w; } }
  const rl = Math.hypot(fx, fy); if (rl > 0) { const c = Math.cos(0.9), si = Math.sin(0.9), x = fx * c - fy * si, y = fx * si + fy * c; fx = x; fy = y; } // strafe round the crowd
  const want = p.hp < p.maxHp * 0.6 ? G.items.filter(it => FOOD_HP[it.k] || it.k === 'oyaki' || it.k === 'yaki' || it.k === 'cake') : [];
  const tgt = (want.length ? want : G.gems).reduce((b, g) => { const d = (g.x - p.x) ** 2 + (g.y - p.y) ** 2; return d < b[0] && d < 260 * 260 ? [d, g] : b; }, [1e9, null])[1];
  if (tgt) { const dx = tgt.x - p.x, dy = tgt.y - p.y, d = Math.hypot(dx, dy) + 1, w = (want.length ? 1.2 : 0.5) * (rl < 0.5 ? 1 : 0.4); fx += dx / d * w; fy += dy / d * w; }
  if (!n && !tgt) { fx += Math.cos(G.t * 0.4); fy += Math.sin(G.t * 0.31); }
  const l = Math.hypot(fx, fy); return l > 0.001 ? [fx / l, fy / l] : [0, 0];
}


// ---------- world props ----------
const PROPS = [
  (h, h2, cx, cy) => h < 0.035 ? ['tree' + ((h2 * 3) | 0), 1] : h < 0.075 ? ['bush' + ((h2 * 3) | 0), 1] : h < 0.09 ? ['rock' + ((h2 * 2) | 0), 1] : h < 0.098 ? ['crate', 1] : h < 0.115 ? ['mushroom', 1] : h < 0.14 && cy % 7 === 0 ? ['fence', 1, 0, 1] : h < 0.42 ? ['tuft' + ((h2 * 4) | 0), 0.6] : h < 0.52 ? ['flower' + ((h2 * 4) | 0), 0.5] : null,
  (h, h2, cx, cy) => h < 0.012 ? ['tree' + ((h2 * 3) | 0), 1] : h < 0.02 ? ['sign', 1] : h < 0.04 ? ['bush' + ((h2 * 3) | 0), 1] : h < 0.3 ? ['tuft' + ((h2 * 4) | 0), 0.6] : h < 0.38 ? ['flower' + ((h2 * 4) | 0), 0.5] : null,
  (h, h2, cx, cy) => h < 0.012 ? ['tree' + ((h2 * 3) | 0), 1] : h < 0.03 ? ['flag' + ((h2 * 2) | 0), 1] : h < 0.05 ? ['planter', 1] : h < 0.3 ? ['tuft' + ((h2 * 4) | 0), 0.6] : h < 0.38 ? ['flower' + ((h2 * 4) | 0), 0.5] : null,
  (h, h2, cx, cy) => h < 0.008 ? ['cwheel', 1] : h < 0.016 ? ['house', 1] : h < 0.026 ? ['bottle', 1] : h < 0.04 ? ['bowl', 1] : h < 0.05 ? ['tube', 1] : h < 0.2 ? ['shav' + ((h2 * 3) | 0), 0] : h < 0.26 ? ['seed' + ((h2 * 2) | 0), 0.4] : null,
  (h, h2, cx, cy) => h < 0.007 ? ['giraffe', 1] : h < 0.017 ? ['zsign' + ((h2 * 3) | 0), 1] : h < 0.027 ? ['bench', 1] : h < 0.037 ? ['balloon' + ((h2 * 2) | 0), 0.5] : h < 0.05 ? ['tree' + ((h2 * 3) | 0), 1] : h < 0.065 ? ['bush' + ((h2 * 3) | 0), 1] : h < 0.3 ? ['tuft' + ((h2 * 4) | 0), 0.6] : h < 0.38 ? ['flower' + ((h2 * 4) | 0), 0.5] : null,
  (h, h2, cx, cy) => h < 0.03 ? ['pine' + ((h2 * 2) | 0), 1] : h < 0.037 ? ['kamakura', 1] : h < 0.052 ? ['srock', 1] : h < 0.06 ? ['lantern', 1] : h < 0.24 ? ['stuft' + ((h2 * 2) | 0), 0.5] : null,
  (h, h2, cx, cy) => h < 0.008 ? ['stlight', 1] : h < 0.02 ? ['amp', 1] : h < 0.03 ? ['mstand', 1] : h < 0.16 ? ['bstar' + ((h2 * 3) | 0), 0] : null,
  (h, h2, cx, cy) => h < 0.006 ? ['arch', 1] : h < 0.018 ? ['fpot', 1] : h < 0.032 ? ['hedge' + ((h2 * 2) | 0), 1] : h < 0.039 ? ['bellpost', 1] : h < 0.27 ? ['petal' + ((h2 * 3) | 0), 0] : h < 0.36 ? ['flower' + ((h2 * 4) | 0), 0.5] : null,
  (h, h2, cx, cy) => h < 0.006 ? ['dgate', 1] : h < 0.022 ? ['clant' + ((h2 * 2) | 0), 1] : h < 0.042 ? ['gacha' + ((h2 * 3) | 0), 1] : null
];
function drawProps(cx0, cz0, stage, t) {
  const C = 32, x0 = Math.floor((cx0 - RD.viewW * 0.7) / C), x1 = Math.floor((cx0 + RD.viewW * 0.7) / C), z0 = Math.floor((cz0 - RD.viewH * 0.75) / C), z1 = Math.floor((cz0 + RD.viewH * 0.45) / C);
  for (let cx = x0; cx <= x1; cx++) for (let cz = z0; cz <= z1; cz++) {
    const h = hash(cx, cz, stage + 1), h2 = hash(cx, cz, 77), h3 = hash(cx, cz, 99);
    const pr = PROPS[stage](h, h2, cx, cz); if (!pr) continue;
    let name = pr[0]; if (name.startsWith('flag')) name = 'flag' + (Math.floor(t * 3 + h3 * 4) % 2);
    RD.spr(R[name], cx * C + h3 * 18 - 9, 0, cz * C + h2 * 16 - 8, { sh: pr[1], flip: h3 > 0.5 && !name.startsWith('fence') && !name.startsWith('sign') && !name.startsWith('zsign') && name !== 'house' && name !== 'amp' });
  }
  if (stage === 1) { // strawberry beds aligned with the ground texture rows (32 texels * 0.62)
    const rowP = 32 * 0.62, r0 = Math.floor((cz0 - RD.viewH * 0.75) / rowP), r1 = Math.floor((cz0 + RD.viewH * 0.45) / rowP);
    for (let r = r0; r <= r1; r++) for (let k = Math.floor((cx0 - RD.viewW * 0.7) / 15); k <= (cx0 + RD.viewW * 0.7) / 15; k++) { const h = hash(k, r, 5); if (h < 0.5) RD.spr(R['bplant' + ((h * 5.5) | 0) % 4], k * 15 + h * 4, 0, r * rowP + 15.5 * 0.62 + 3, { sh: 0.7, flip: h > 0.36 }); }
  }
  if (stage === 8) { // lantern strings across the street, every 256 units
    const r0 = Math.floor((cz0 - RD.viewH * 0.75) / 256), r1 = Math.floor((cz0 + RD.viewH * 0.45) / 256);
    for (let r = r0; r <= r1; r++) for (let k = Math.floor((cx0 - RD.viewW * 0.7) / 26); k <= (cx0 + RD.viewW * 0.7) / 26; k++) RD.spr(R['clant' + (((k % 2) + 2) % 2)], k * 26 + 13, 0, r * 256 + 8, { sh: 0.7 });
  }
  if (stage === 7) { // rows of guest chairs with an aisle, every 240 units
    const r0 = Math.floor((cz0 - RD.viewH * 0.75) / 240), r1 = Math.floor((cz0 + RD.viewH * 0.45) / 240);
    for (let r = r0; r <= r1; r++) for (let k = Math.floor((cx0 - RD.viewW * 0.7) / 22); k <= (cx0 + RD.viewW * 0.7) / 22; k++) { const m = ((k % 14) + 14) % 14; if (m === 6 || m === 7) continue; RD.spr(R.chair, k * 22 + 11, 0, r * 240, { sh: 0.8 }); RD.spr(R.chair, k * 22 + 11, 0, r * 240 + 18, { sh: 0.8 }); }
  }
  if (stage === 2 || stage === 3 || stage === 4) { // racecourse rails / cage bars / zoo fences every 200 units
    const spr = stage === 2 ? R.rail : stage === 3 ? R.bars : R.zfence, rw = spr.w * 0.62, r0 = Math.floor((cz0 - RD.viewH * 0.75) / 200), r1 = Math.floor((cz0 + RD.viewH * 0.45) / 200);
    for (let r = r0; r <= r1; r++) for (let k = Math.floor((cx0 - RD.viewW * 0.7) / rw); k <= (cx0 + RD.viewW * 0.7) / rw; k++) RD.spr(spr, k * rw + rw / 2, 0, r * 200, { sh: stage === 3 ? 0.6 : 1 });
  }
}

// ---------- render ----------
const DIG_W = 6 * 0.62;
function drawNum(x, h, z, v, big, s) { const str = String(v), w = str.length * DIG_W * s; let px = x - w / 2 + DIG_W * s / 2; for (const ch of str) { RD.spr(R[(big ? 'g' : 'd') + ch], px, h, z, { s, sh: 0, em: 0.4 }, RD.ov); px += DIG_W * s; } }
function kyFrame(p, t, pre) {
  if (p.hurtT > 0) return R[pre + 'Hurt'];
  if (p.dashT > 0) return R[pre + 'Dash'];
  if (p.moving) return R[pre + (Math.floor(p.anim) % 4)];
  return (t % 3.2) < 0.14 ? R[pre + 'Blink'] : R[pre + '0'];
}
function drawKyoka(x, z, p, t, s, pre) {
  pre = pre || (G ? G.spr : 'ky'); s = (s || 1) * (p.sc || 1);
  const fr = kyFrame(p, t, pre), blink = p.inv > 0 && p.hurtT <= 0 && Math.floor(p.inv * 16) % 2 === 0;
  const dashF = fr === R[pre + 'Dash'], kf = p.face < 0 && !dashF ? true : (dashF && p.face < 0);
  RD.spr(fr, x, 0, z, { flip: kf, flash: (G && G.henshin > 0.3) ? 0.85 : blink ? 0.6 : 0, s, zb: 0.3 }, RD.chars);
  RD.spr(fr, x, 0, z, { flip: kf, s, zb: 0.3, tint: [1, 0.55, 0.78] }, RD.xray);
  RD.blobShadow(x, z, 20 * s, 0.45);
}
function drawSeal(s, t, sc) {
  const fr = R['seal' + (Math.floor(s.anim) % 4)];
  RD.spr(fr, s.x, s.h, s.y, { flip: s.face < 0, s: sc || 1 }, RD.chars); RD.spr(fr, s.x, s.h, s.y, { flip: s.face < 0, s: sc || 1, tint: [0.75, 0.9, 1] }, RD.xray); RD.blobShadow(s.x, s.y, 18 * (sc || 1), 0.4);
}
function drawDog(D, sc) {
  const fr = D.biteT > 0 ? R.hpBite : R['hp' + (Math.floor(D.anim) % 4)];
  RD.spr(fr, D.x, D.h, D.y, { flip: D.face < 0, s: sc || 1 }, RD.chars); RD.spr(fr, D.x, D.h, D.y, { flip: D.face < 0, s: sc || 1, tint: [1, 0.95, 0.85] }, RD.xray); RD.blobShadow(D.x, D.y, 16 * (sc || 1), 0.4);
}
const ITEM_GLOW = { oyaki: [1, 0.85, 0.5], ebi: [1, 0.75, 0.35], yaki: [1, 0.5, 0.4], coin: [1, 0.4, 0.5], magI: [1, 0.4, 0.45], bombI: [1, 0.6, 0.3], cakeI: [1, 0.6, 0.75], chest: [1, 0.85, 0.3], ringcake: [1, 0.7, 0.85], rbeef: [1, 0.6, 0.5], steak: [1, 0.55, 0.4], nikujaga: [1, 0.8, 0.5], buri: [1, 0.85, 0.6], tapi: [0.9, 0.75, 0.55], tsand: [1, 0.9, 0.6], mala: [1, 0.4, 0.25], aman: [1, 0.9, 0.8], xlb: [1, 0.8, 0.5], jpai: [1, 0.7, 0.35] };
const LIFT = { lantb: (t, e) => 9 + Math.sin(t * 4 + e.ph) * 3, gyoza: (t, e) => Math.abs(Math.sin(t * 7 + e.ph)) * 4, heartb: (t, e) => 7 + Math.sin(t * 5 + e.ph) * 3, bell: (t, e) => 6 + Math.sin(t * 2 + e.ph) * 3, crow: (t, e) => 9 + Math.sin(t * 6 + e.ph) * 2.5, paper: (t, e) => 3 + Math.sin(t * 4 + e.ph) * 2, onpu: (t, e) => 2 + Math.abs(Math.sin(t * 7 + e.ph)) * 6, monkey: (t, e) => Math.abs(Math.sin(t * 8 + e.ph)) * 3, carrot: (t, e) => Math.abs(Math.sin(t * 9 + e.ph)) * 2, bee: (t, e) => 8 + Math.sin(t * 9 + e.ph) * 2, bat: (t, e) => 10 + Math.sin(t * 7 + e.ph) * 3, usagi: (t, e) => Math.max(0, Math.sin(t * 5 + e.ph)) * 7 };
const NIGHT_COL = [[1, 0.4, 0.75], [0.4, 0.75, 1], [1, 0.9, 0.4], [0.6, 1, 0.6]];
const CY_RGB = [[0.5, 0.95, 0.5], [1, 0.5, 0.72], [0.45, 0.77, 1], [1, 0.85, 0.3]];
function drawP2(t) {
  const p = G.p;
  if (G.fireT > 0) { const a = Math.min(1, G.fireT) * (0.7 + 0.3 * Math.sin(t * 14)); RD.glow(1, p.x, 0.6, p.y, 92 * G.area, 92 * G.area, t * 3, [1, 0.45, 0.15], a * 0.6, true); RD.glow(0, p.x, 12, p.y, 50, 56, 0, [1, 0.5, 0.2], a * 0.35); }
  for (const c of G.cys) { const col = CY_RGB[c.c];
    if (c.t < c.T) { const k = c.t / c.T; RD.spr(R['cys' + c.c], c.x0 + (c.x - c.x0) * k, 8 + Math.sin(Math.PI * k) * 40, c.y0 + (c.y - c.y0) * k, { sh: 0, em: 0.7 }); continue; }
    const fade = Math.min(1, c.life / 0.5, (c.max - c.life) / 0.2 + 0.3), pulse = 0.75 + 0.25 * Math.sin(t * 8 + c.c);
    RD.glow(1, c.x, 0.6, c.y, c.r * 1.7, c.r * 1.7, 0, col, 0.16 * fade * pulse, true); RD.glow(0, c.x, 8, c.y, 14, 18, 0, col, 0.2 * fade);
    RD.spr(R['cys' + c.c], c.x, 0, c.y, { sh: 0.3, em: 0.45 }); }
  for (const w of G.sws) { if (w.r <= 0) continue; const a = 1 - w.r / w.max, c = w.enc ? NIGHT_COL[(w.id + Math.floor(t * 4)) % 4] : [1, 0.6, 0.9];
    RD.glow(1, w.x, 0.6, w.y, w.r * 2, w.r * 2, 0, c, 0.5 + a * 0.5, true); RD.glow(1, w.x, 0.7, w.y, w.r * 1.8, w.r * 1.8, 0, [1, 1, 1], a * 0.5, true);
    for (let i = 0; i < 6; i++) { const an = i / 6 * TAU + w.r * 0.02; RD.spr(R['note' + (i % 3)], w.x + Math.cos(an) * w.r, 10, w.y + Math.sin(an) * w.r * 0.8, { sh: 0, em: 0.6, s: 0.8 }, RD.ov); } }
  for (const l of G.lobs) { const k = Math.min(1, l.t / l.T), x = l.x0 + (l.x1 - l.x0) * k, y = l.y0 + (l.y1 - l.y0) * k, h = 8 + Math.sin(Math.PI * k) * (l.T > 0.5 ? 55 : 25);
    RD.spr(R.apple, x, h, y, { s: 1.2, sh: 0.4, em: 0.1 }); RD.blobShadow(x, y, 10, 0.3); }
  if (G.evo.apple) { const R0 = 64 + Math.sin(G.t * 2) * 30; for (let i = 0; i < 6; i++) { const a = G.applA + i / 6 * TAU, x = p.x + Math.cos(a) * R0, y = p.y + Math.sin(a) * R0 * 0.8; RD.spr(R.apple, x, 9, y, { s: 1.3, sh: 0.5, em: 0.2 }); RD.glow(0, x, 12, y, 22, 22, 0, [1, 0.35, 0.3], 0.4); } }
  for (const b of G.ebul) { RD.spr(R[b.k], b.x, 9, b.y, { s: 1.3, sh: 0.4, em: 0.3 }); RD.glow(0, b.x, 11, b.y, 20, 20, 0, b.k === 'drop' ? [0.4, 0.8, 1] : [0.9, 0.95, 1], 0.5); }
  for (const h of G.hazards) { const a = 1 - h.r / h.max; RD.glow(1, h.x, 0.6, h.y, h.r * 2, h.r * 2, 0, [1, 0.25, 0.55], 0.6 + a * 0.4, true); RD.glow(1, h.x, 0.7, h.y, h.r * 2.1, h.r * 2.1, 0, [1, 0.8, 0.3], a * 0.6, true); }
  if (G.shield > 0) { const a = Math.min(1, G.shield) * (0.6 + 0.25 * Math.sin(t * 10)); RD.glow(0, p.x, 14, p.y, 46, 52, 0, [1, 0.6, 0.75], a * 0.6); RD.glow(1, p.x, 0.6, p.y, 60, 60, t * 2, [1, 0.8, 0.9], a * 0.7, true); }
  for (const g of G.gusts) { const k = g.life / g.max, grow = 1 - k * 0.6; const n = g.big ? 12 : 5;
    for (let i = 0; i < n; i++) { const a = g.a + (n === 1 ? 0 : (i / (n - 1) - 0.5) * 2 * g.ang * (g.big ? (n - 1) / n : 1)), rr = g.len * grow; RD.glow(2, g.x + Math.cos(a) * rr * 0.55, 6, g.y + Math.sin(a) * rr * 0.55 * 0.8, rr * 0.9, 14, -a, g.big ? [0.6, 1, 0.8] : [1, 0.75, 0.9], k * 0.7, true); } }
  for (const b of G.hams) { RD.spr(R[G.evo.ham ? 'hparade' : 'hball'], b.x, 9 + Math.abs(Math.sin(b.rot * 0.3)) * 2, b.y, { s: G.evo.ham ? 1.25 : 1, sh: 0.6, flip: b.vx < 0 }); RD.blobShadow(b.x, b.y, 18, 0.35); }
  for (const z of G.zaps) { const k = z.life / z.max;
    if (z.chain) { for (let i = 0; i <= 6; i++) { const u = i / 6; RD.glow(0, z.x + (z.x1 - z.x) * u + rnd(-3, 3), 10, z.y + (z.y1 - z.y) * u + rnd(-3, 3), 12, 12, 0, [1, 0.95, 0.5], k); } }
    else { RD.spr(R.bolt2, z.x, 14 + (1 - k) * 6, z.y, { s: 1.4, sh: 0, em: 1 }, RD.ov); RD.glow(1, z.x, 0.5, z.y, 70 * k, 70 * k, 0, [1, 0.95, 0.5], k, true); } }
  // stage ambience
  const cx = G.cam.x, cz = G.cam.y, vw = RD.viewW, vh = RD.viewH;
  if (G.sid === 'snow') for (let i = 0; i < 46; i++) {
    const x = cx - vw * 0.6 + ((i * 97.13 + t * 9 * (1 + (i % 3))) % (vw * 1.2)), z = cz - vh * 0.6 + ((i * 53.7) % (vh * 1.1)), h = 140 - ((t * (22 + (i % 5) * 4) + i * 37) % 140);
    RD.spr(R.flake, x + Math.sin(t * 2 + i) * 6, h, z, { sh: 0, em: 0.6, s: 0.8 + (i % 3) * 0.2 }, RD.ov);
  }
  if (G.sid === 'chapel') for (let i = 0; i < 26; i++) { // drifting petals
    const x = cx - vw * 0.6 + ((i * 97.13 + t * 14 * (1 + (i % 3))) % (vw * 1.2)), z = cz - vh * 0.6 + ((i * 53.7) % (vh * 1.1)), h = 120 - ((t * (16 + (i % 5) * 3) + i * 37) % 120);
    RD.spr(R['petal' + (i % 3)], x + Math.sin(t * 1.5 + i) * 10, h, z, { sh: 0, em: 0.3, s: 0.5 + (i % 3) * 0.12 }, RD.ov);
  }
  if (G.sid === 'china') for (let i = 0; i < 5; i++) { // warm lantern light drifting over the street
    const a = t * (0.4 + i * 0.13) + i * 1.7, x = cx + Math.cos(a) * vw * 0.32, z = cz + Math.sin(a * 1.2) * vh * 0.26;
    RD.glow(0, x, 0.4, z, 110, 80, 0, i % 2 ? [1, 0.75, 0.3] : [1, 0.3, 0.3], 0.16, true);
  }
  if (G.sid === 'night') for (let i = 0; i < 3; i++) {
    const a = t * (0.5 + i * 0.17) + i * 2.1, x = cx + Math.cos(a) * vw * 0.3, z = cz + Math.sin(a * 1.3) * vh * 0.25;
    RD.glow(0, x, 0.4, z, 120, 90, 0, NIGHT_COL[i], 0.22, true);
  }
}
function render(dt) {
  RD.begin();
  const t = gTime;
  if (state === 'title' || !G) { renderTitle(t); return; }
  const p = G.p, sh = G.shake, sx = sh ? rnd(-sh, sh) : 0, sz = sh ? rnd(-sh, sh) : 0;
  drawProps(G.cam.x, G.cam.y, G.stage, t);
  // gems / items
  for (const g of G.gems) {
    const k = g.v >= 10 ? 2 : g.v >= 3 ? 1 : 0, col = hex([0x6ec3ff, 0xc08aff, 0xffd24a][k]), hh = 4 + Math.sin(t * 5 + g.bob) * 1.5 + g.pop * 20;
    RD.spr(R['note' + k], g.x, hh, g.y, { em: 0.6, sh: 0.5 });
    RD.glow(0, g.x, hh + 4, g.y, 16, 16, 0, col, 0.5);
  }
  for (const it of G.items) {
    const coin = it.k === 'coin', big = it.k === 'chest' || it.k === 'ringcake' ? 1.5 : it.k.endsWith('I') ? 1.25 : 1, hh = 3 + Math.sin(t * 4 + it.x) * 1.5 * big;
    RD.spr(R[it.k], it.x, hh, it.y, { sh: 0.6, em: coin ? 0.3 : big > 1 ? 0.25 : 0, s: big }); RD.glow(0, it.x, hh + 4, it.y, (coin ? 16 : 26) * big, (coin ? 16 : 26) * big, 0, ITEM_GLOW[it.k], (coin ? 0.35 : 0.45) + Math.sin(t * 6) * 0.15);
    if (big > 1) { RD.glow(2, it.x, 40, it.y, 14 * big, 90, Math.PI / 2, ITEM_GLOW[it.k], 0.35 + Math.sin(t * 5) * 0.12); RD.glow(1, it.x, 0.5, it.y, 40 * big, 40 * big, 0, ITEM_GLOW[it.k], 0.4, true); }
  }
  // enemies
  for (const e of G.enemies) {
    const fr = R[e.type + (Math.floor(e.anim) % 4)];
    const lift = LIFT[e.type] ? LIFT[e.type](t, e) : e.boss && e.type !== 'wheel' ? Math.abs(Math.sin(t * 3)) * 3 : 0;
    const appear = Math.min(1, e.spawnT * 4);
    const tele = e.boss && e.mode === 'tele' && Math.floor(t * 16) % 2;
    const fly = e.type === 'crow' || e.type === 'bee' || e.type === 'bat' || !!(e.p6 && ETYPES6[e.type].fly);
    RD.spr(fr, e.x, lift, e.y, { flip: e.face < 0, flash: e.boss ? (e.flash > 0 ? 0.4 : tele ? 0.25 + 0.2 * Math.sin(gTime * 20) : 0) : (e.flash > 0 || tele ? 1 : 0), s: appear * (e.elite ? 1.4 : 1), sh: fly ? 0 : 1, tint: G.frzT > 0 && !e.boss ? [0.8, 0.9, 1.25] : e.elite ? [1.1, 0.95, 0.75] : undefined });
    RD.blobShadow(e.x, e.y, e.boss ? 60 : fly ? 11 : e.elite ? 24 : 17, fly ? 0.3 : 0.4);
    if (e.elite) RD.glow(1, e.x, 0.5, e.y, 40, 40, t * 2, [1, 0.8, 0.3], 0.45 + 0.15 * Math.sin(t * 6 + e.ph), true);
    if (e.boss && e.mode === 'tele') RD.glow(1, e.x, 0.5, e.y, 90, 90, 0, [1, 0.25, 0.3], 0.6, true);
    if (e.conf > 0) RD.spr(R.qmark, e.x, 20 + lift + Math.sin(t * 8 + e.ph) * 1.5, e.y, { sh: 0, em: 0.5 }, RD.ov);
  }
  // seals, horses, dog, player
  const sealSc = G.evo.seal ? 1.25 : 1;
  for (const s of G.seals) drawSeal(s, t, sealSc);
  for (const h of G.horses) { const fr = R['horse' + (Math.floor(h.anim) % 4)]; RD.spr(fr, h.x, Math.abs(Math.sin(h.anim * 0.8)) * 2, h.y, { flip: h.vx < 0, s: Math.min(1, h.life * 5) * (h.gold ? 1.15 : 1), tint: h.gold ? [1.15, 1.0, 0.7] : undefined }); RD.blobShadow(h.x, h.y, 34, 0.4); if (h.gold) RD.glow(0, h.x, 14, h.y, 50, 40, 0, [1, 0.85, 0.4], 0.35); }
  drawDog(G.dog, dogScale());
  for (const g of G.ghosts) RD.glow(0, g.x, 14, g.y, 26, 34, 0, G.char === 'ranger' ? RANGER_COL[G.rc] : [1, 0.6, 0.85], g.life / g.max * 0.5);
  drawKyoka(p.x, p.y, p, t);
  if (G.henshin > 0) { const k = G.henshin / 0.5, hc = G.char === 'ranger' ? RANGER_COL[G.rc] : [1, 0.95, 0.7]; RD.glow(3, p.x, 16, p.y, 70 * k + 20, 70 * k + 20, t * 4, hc, k); RD.glow(0, p.x, 16, p.y, 60, 60, 0, [1, 0.8, 0.9], k * 0.8); }
  if (G.lvFx > 0) { const k = G.lvFx / 0.8; RD.glow(2, p.x, 30, p.y, 30, 80, Math.PI / 2, [1, 0.85, 0.4], k * 0.8); RD.glow(1, p.x, 0.5, p.y, 50 + (1 - k) * 60, 50 + (1 - k) * 60, 0, [1, 0.8, 0.4], k, true); }
  // pickup radius hint
  RD.glow(1, p.x, 0.4, p.y, p.magnet * 2, p.magnet * 2, 0, [1, 0.7, 0.85], 0.08, true);
  // penlights
  if (G.weapons.penlight) {
    const s = W.penlight(G.weapons.penlight);
    penPos(s).forEach(([x, z], i) => {
      const col = hex(ATLAS.PEN[i % 5]);
      RD.spr(R['pen' + (i % 5)], x, 7, z, { em: 0.5, sh: 0.6 }); RD.glow(0, x, 12, z, 26, 26, 0, col, 0.45);
      RD.glow(0, x, 0.3, z, 34, 34, 0, col, 0.35, true);
    });
  }
  drawP2(t); drawP6(t);
  // brush strokes
  for (const sl of G.slashes) {
    const k = sl.life / sl.max, grow = Math.min(1, (1 - k) * 4), w = sl.len * grow;
    RD.spr(R.ink, sl.x + sl.face * (w / 2 + 4), 6, sl.y + 2, { s: w / (R.ink.w * 0.62), sy: 1.2 * (0.7 + 0.3 * k), flip: sl.face < 0, sh: 0, tint: [1, 1, 1] }, RD.ov);
    RD.glow(2, sl.x + sl.face * (w / 2 + 4), 8, sl.y + 2, w, 22 * k, 0, [1, 0.85, 0.6], k * 0.35);
  }
  // projectiles
  for (const b of G.projs) {
    if (b.k === 'berry') { RD.spr(R.berry, b.x, 8, b.y, { sh: 0.5, em: 0.15 }); RD.glow(0, b.x, 12, b.y, 16, 16, 0, [1, 0.35, 0.45], 0.45); }
    else if (b.k !== 'bubble') { RD.spr(R[b.k], b.x, 8, b.y, { sh: 0.4, em: 0.3, s: 1.1 }); RD.glow(0, b.x, 11, b.y, 16, 16, 0, b.k === 'drop' ? [0.5, 0.85, 1] : [1, 0.85, 0.6], 0.45); }
    else { const s = b.big ? 1.4 : 1; RD.spr(R.bubble, b.x, 8, b.y, { sh: 0.3, em: 0.3, s }); RD.glow(0, b.x, 11, b.y, 14 * s, 14 * s, 0, [0.5, 0.85, 1], 0.5); }
  }
  // things falling from the sky (いちごシャワー / 読めない漢字)
  for (const f of G.falls) {
    if (f.k === 'kanji') { const a = f.landed ? f.landed / 0.45 : 1; RD.spr(R['kanji' + f.g], f.x, f.h, f.y, { s: 1.5, sh: f.landed ? 0 : 0.6, em: 0.15, flash: f.landed ? (1 - a) * 0.5 : 0 }); RD.glow(1, f.x, 0.5, f.y, f.r * 2 * (1.2 - Math.min(1, f.h / 170)), f.r * 2 * (1.2 - Math.min(1, f.h / 170)), 0, [1, 0.85, 0.4], 0.35 * a, true); }
    else { RD.spr(R.berry, f.x, f.h, f.y, { s: 1.3, sh: 0.5, em: 0.2 }); RD.glow(0, f.x, 0.5, f.y, 20, 20, 0, [1, 0.35, 0.45], 0.4, true); }
  }
  // lariat / drum / domino / kanji rings
  for (const r of G.rings) {
    const k = 1 - r.life / r.max, rr = r.r * (0.4 + k * 0.75), a = r.life / r.max;
    const c1 = r.col === 1 ? [1, 0.85, 0.35] : r.col === 2 ? [0.9, 0.7, 0.3] : r.col === 3 ? [1, 0.35, 0.35] : r.col === 4 ? [1, 0.45, 0.5] : [1, 0.55, 0.75], c2 = r.col === 1 ? [1, 0.45, 0.45] : r.col === 2 ? [0.4, 0.3, 0.5] : r.col === 3 ? [0.5, 0.85, 0.4] : r.col === 4 ? [0.6, 0.7, 1] : [1, 0.85, 0.4];
    RD.glow(1, r.x, 0.6, r.y, rr * 2.2, rr * 2.2, 0, c1, a * 0.9, true);
    RD.glow(1, r.x, 0.7, r.y, rr * 1.7, rr * 1.7, 0, c2, a * 0.7, true);
    if (!r.col) for (let i = 0; i < 10; i++) { const an = i / 10 * TAU + k * 5; RD.glow(3, r.x + Math.cos(an) * rr, 8, r.y + Math.sin(an) * rr * 0.8, 16, 16, k * 3, [1, 0.9, 0.7], a); }
  }
  // big five-colour blasts
  for (const bl of G.blasts) {
    const k = 1 - bl.life / bl.max, a = bl.life / bl.max, R0 = (RD.viewW * 0.55) * (bl.big || 1);
    for (let i = 0; i < 5; i++) { const rr = R0 * Math.min(1, k * 1.6 + i * 0.08); RD.glow(1, bl.x, 0.8 + i * 0.1, bl.y, rr * 2, rr * 2 * 0.8, 0, RANGER_COL[i], a * 0.8, true); }
    RD.glow(0, bl.x, 20, bl.y, 160 * (1 - k * 0.5), 160 * (1 - k * 0.5), 0, [1, 0.95, 0.8], a);
    for (let i = 0; i < 10; i++) { const an = i / 10 * TAU + k * 2; RD.glow(3, bl.x + Math.cos(an) * R0 * k * 0.7, 14, bl.y + Math.sin(an) * R0 * k * 0.55, 40, 40, k * 4, RANGER_COL[i % 5], a); }
  }
  // beams
  for (const bm of G.beams) {
    const k = bm.life / bm.max, cx = bm.x + Math.cos(bm.a) * bm.len / 2, cz = bm.y + Math.sin(bm.a) * bm.len / 2;
    RD.glow(2, cx, 10, cz, bm.len, bm.w * 4 * (0.6 + 0.4 * k), -bm.a, [1, 0.4, 0.75], k * 0.9, true);
    RD.glow(2, cx, 10.2, cz, bm.len, bm.w * 2 * k, -bm.a, [0.5, 0.85, 1], k, true);
    RD.glow(2, cx, 10.4, cz, bm.len, bm.w * 0.8 * k, -bm.a, [1, 1, 1], k * 1.2, true);
    RD.glow(0, bm.x, 12, bm.y, 50 * k, 50 * k, 0, [1, 0.9, 1], k);
  }
  // fx
  for (const f of G.fx) {
    const k = f.life / f.max;
    if (f.kind === 'hit') RD.glow(3, f.x, 10, f.y, 22 * k + 6, 22 * k + 6, f.x, [1, 1, 0.9], k);
    else if (f.kind === 'poof') { RD.glow(0, f.x, 8, f.y, f.size * (1.4 - k * 0.6), f.size * (1.4 - k * 0.6), 0, [1, 0.95, 0.9], k * 0.55); RD.glow(1, f.x, 0.5, f.y, f.size * (1.6 - k), f.size * (1.6 - k), 0, [1, 1, 1], k * 0.6, true); }
    else if (f.kind === 'spark') RD.glow(3, f.x, 18, f.y, 26 * k + 8, 26 * k + 8, k * 2, hex(f.col), k);
  }
  for (const q of G.parts) { const a = q.life / q.max; RD.spr(R.px, q.x, q.h, q.y, { s: q.s * (0.5 + a * 0.5), tint: q.c, em: q.em, sh: 0 }); }
  for (const n of G.nums) { const k = 1 - n.life / 0.75, s = (n.big ? 1.25 : 0.95) * (k < 0.15 ? 0.6 + k / 0.15 * 0.6 : 1.2 - Math.min(0.2, (k - 0.15))); drawNum(n.x, 22 + k * 14, n.y, n.v, n.big, s); }
  RD.G.flash = Math.min(0.6, G.flash); RD.G.flashCol.setRGB(1, G.flashRed && G.flash < 0.2 ? 0.55 : 1, G.flashRed && G.flash < 0.2 ? 0.6 : 1); if (G.flash <= 0) G.flashRed = 0;
  RD.draw(G.cam.x, G.cam.y, t, sx, sz);
  if (joy.on) drawJoy(); else hideJoy();
}
const TITLE_SEALS = [0, 1, 2].map(i => ({ x: 0, y: 0, h: 0, anim: i, face: 1, hop: 0 }));
const titleP = { x: 0, y: 0, face: 1, moving: false, anim: 0, dashT: 0, hurtT: 0, inv: 0 };
const titleParts = [];
const titleDog = { x: 0, y: 0, face: -1, anim: 0, h: 0, biteT: 0 };
function renderTitle(t) {
  if (RD.zoom !== 0.55) RD.setZoom(0.55);
  lerpLook(LOOKS[0], 1); RD.G.flash = 0; RD.G.tilt = 0.45;
  const sp = $('t-spacer').getBoundingClientRect();
  const tn = Math.tan(RD.cam.fov / 2 * Math.PI / 180), viewHw = 2 * RD.D * tn;
  const viewWw = viewHw * innerWidth / innerHeight; const sc = clamp(Math.min((sp.height / innerHeight) * viewHw * 0.82 / (52 * 0.62), viewWw * 0.3 / (34 * 0.62)), 0.8, 2.4);
  const pxH = sc * 52 * 0.62 / viewHw * innerHeight * 0.85, yf = Math.min(sp.bottom - sp.height * 0.06, sp.top + (sp.height + pxH) / 2 + 10) / innerHeight, ndc = 1 - 2 * yf, sT = Math.sin(RD.tilt), cT = Math.cos(RD.tilt);
  const dz = ndc * tn * RD.D / (ndc * tn * cT - sT), tz = -dz;
  drawProps(0, tz, 0, t);
  const tch = CHARS[sel.char] && charOpen(profile, sel.char) ? sel.char : 'kyon', tpre = tch === 'ranger' ? 'kr' + (Math.floor(t / 3) % 5) : CHARS[tch].spr;
  drawKyoka(0, 0, titleP, t, sc * (tpre === 'od' ? 0.9 : 1), tpre);
  titleDog.x = 34 * sc; titleDog.y = 6 * sc; titleDog.face = -1; titleDog.anim = t * 3; titleDog.h = Math.max(0, Math.sin(t * 4)) * 3 * sc; titleDog.biteT = (t % 4) < 0.35 ? 1 : 0; drawDog(titleDog, sc * 0.8);
  TITLE_SEALS.forEach((s, i) => {
    const a = t * 0.6 + i * TAU / 3; s.x = Math.cos(a) * 30 * sc; s.y = Math.sin(a) * 9 * sc + 3; s.face = -Math.sin(a) >= 0 ? 1 : -1;
    s.anim = t * 7 + i; s.h = Math.abs(Math.sin(t * 5 + i * 2)) * 5; drawSeal(s, t, sc * 0.75);
  });
  if (titleParts.length < 60) titleParts.push({ x: rnd(-220, 220), y: rnd(-200, 40), h: rnd(30, 80), vx: rnd(4, 12), vh: rnd(-6, -2), life: rnd(5, 9), k: Math.random() });
  for (let i = titleParts.length - 1; i >= 0; i--) {
    const q = titleParts[i]; q.x += q.vx / 60; q.h += q.vh / 60; q.life -= 1 / 60;
    if (q.life <= 0 || q.h < 0) { titleParts.splice(i, 1); continue; }
    if (q.k < 0.2) RD.spr(R.berry, q.x, q.h, q.y, { sh: 0.25, em: 0.1 }); else if (q.k < 0.38) RD.spr(R['note' + ((q.k * 10) | 0) % 3], q.x, q.h, q.y, { sh: 0.25, em: 0.6 });
    else RD.glow(0, q.x, q.h, q.y, 6, 6, 0, q.k < 0.7 ? [1, 0.8, 0.9] : [1, 1, 0.8], 0.7 * Math.min(1, q.life));
  }
  RD.glow(1, 0, 0.5, 0, 90 * sc, 90 * sc, 0, [1, 0.75, 0.85], 0.25 + Math.sin(t * 2) * 0.08, true);
  RD.draw(0, tz, t, 0, 0);
}
// touch joystick (DOM)
function drawJoy() { const j = $('joy'); j.classList.remove('hide'); j.style.left = joy.ox + 'px'; j.style.top = joy.oy + 'px'; const dx = joy.x - joy.ox, dy = joy.y - joy.oy, d = Math.hypot(dx, dy), m = Math.min(d, 40); $('joyk').style.transform = `translate(${d ? dx / d * m : 0}px,${d ? dy / d * m : 0}px)`; }
function hideJoy() { $('joy').classList.add('hide'); }

// ---------- HUD ----------
let hudCache = {};
function setText(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
function setW(id, v) { v = Math.round(v * 1000) / 10; if (hudCache[id] !== v) { hudCache[id] = v; $(id).style.width = v + '%'; } }
function hud() {
  const p = G.p, t = T(), rem = Math.max(0, WIN_T - G.t);
  setText('timer', G.endless ? '∞ ' + fmtTime(Math.floor(G.t)) : `${Math.floor(rem / 60)}:${String(Math.floor(rem % 60)).padStart(2, '0')}`);
  const thr = G.endless ? G.threat : 0;
  if (hudCache.diff !== G.diff + lang + thr) { hudCache.diff = G.diff + lang + thr; const c = $('diffchip'); c.textContent = DIFF[G.diff].icon + ' ' + DIFF[G.diff][lang][0] + (thr ? ' · ' + PT().threat.replace('{n}', thr) : ''); c.className = 'd' + G.di + (thr ? ' thr' : ''); }
  setText('lvl', String(G.lvl)); setText('kills', String(G.kills)); setText('sealn', String(G.seals.length)); setText('coinn', String(G.picked));
  setText('hptxt', `${Math.ceil(p.hp)} / ${p.maxHp}`);
  setW('hpfill', p.hp / p.maxHp); setW('xpfill', G.xp / G.xpNext);
  $('hud').classList.toggle('low', p.hp / p.maxHp < 0.3);
  hud6();
  const bb = $('bossbar');
  { const sp = $('spbtn'), g = Math.round((G.sp || 0) * 100), rdy = g >= 100 && !(G.spT > 0); if (hudCache.sp !== g + (rdy ? 'r' : '')) { hudCache.sp = g + (rdy ? 'r' : ''); sp.style.setProperty('--g', g + '%'); sp.classList.toggle('ready', rdy); sp.disabled = !rdy; } }
  const tw = G.boss && G.boss.twin && G.boss.twin.hp > 0 ? G.boss.twin : null;
  if (G.boss) { bb.classList.remove('hide'); setText('bossname', PT().st[G.sid].boss); setW('bossfill', G.boss.hp / G.boss.maxHp); if (tw) setW('bossfill2', tw.hp / tw.maxHp); } else bb.classList.add('hide');
  const lay = (G.boss ? 1 : 0) + (tw ? 2 : 0);
  if (hudCache.bossLay !== lay) { hudCache.bossLay = lay; $('bossbar2').classList.toggle('hide', !tw); $('bossx').classList.toggle('hide', !tw); layoutHud(); }
  if ((hudCache.layT = (hudCache.layT || 0) + 1) % 20 === 0) layoutHud();
}
// Lay the top HUD out so nothing overlaps at any slot count: the icon rows stop short of the timer (or, on a phone
// in portrait, of the counters, with the timer tucked under the counters), and the boss bar sits below everything.
function layoutHud() {
  const hudEl = $('hud'); if (hudEl.classList.contains('hide')) return;
  const W = innerWidth, H = innerHeight, narrow = W < 600 && H > W;
  hudEl.classList.toggle('narrow', narrow);
  const weps = $('weps'), tp = $('timerplate'), cn = $('counts'), bb = $('bossbar');
  const wl = weps.getBoundingClientRect().left, cr = cn.getBoundingClientRect();
  tp.style.top = narrow ? Math.round(cr.bottom + 6) + 'px' : '';
  const stop = narrow ? Math.min(cr.left, tp.getBoundingClientRect().left) : tp.getBoundingClientRect().left;
  weps.style.maxWidth = Math.max(60, Math.floor(stop - 8 - wl)) + 'px';
  // phone portrait with a long icon list (endless can hold every weapon): squeezed beside the timer it turns into a tall column,
  // so let the icons run up to the counters and tuck the timer under whichever is lower
  if (narrow && weps.getBoundingClientRect().bottom > tp.getBoundingClientRect().bottom + 4) {
    weps.style.maxWidth = Math.max(60, Math.floor(cr.left - 8 - wl)) + 'px';
    tp.style.top = Math.round(Math.max(cr.bottom, weps.getBoundingClientRect().bottom) + 6) + 'px';
  }
  const bottom = Math.max(...[$('player'), $('lvbadge'), tp, cn].map(e => e.getBoundingClientRect().bottom));
  bb.style.top = Math.round(bottom + 8) + 'px';
  // stage / warning banners drop below the boss bar while it shows, so they never cover its name
  const bbB = bb.classList.contains('hide') ? 0 : bb.getBoundingClientRect().bottom;
  $('banner').style.top = bbB > H * 0.24 - 4 ? Math.round(bbB + 8) + 'px' : '';
}
addEventListener('resize', () => { if (G) layoutHud(); });
function refreshWeps() {
  const box = $('weps'); box.innerHTML = '';
  for (const id of WEAPONS.concat(PASSIVES)) { const l = lvOf(id); if (!l) continue; const evo = G.evo[id], d = document.createElement('div'); d.className = 'w' + (PASSIVES.includes(id) ? ' pas' : '') + (evo ? ' evo' : ''); d.innerHTML = `<img src="${ICON[evo ? 'evo_' + id : id]}" alt=""><b>${evo ? '★' : l}</b>`; box.appendChild(d); }
  for (const id of BOOST_IDS) { const n = G.boost[id]; if (!n || id === 'b_coin') continue; const d = document.createElement('div'); d.className = 'w bst'; d.title = T().items[id][0]; d.innerHTML = `<img src="${ICON[id]}" alt=""><b>×${n}</b>`; box.appendChild(d); }
  box.classList.toggle('many', box.children.length > 16); // compact icons once the list gets long
  const [nW, nP] = slotsUsed(); if (nW >= wCapG() || nP >= MAX_P) { const f = document.createElement('span'); f.className = 'sfull'; f.id = 'slotsfull'; f.textContent = PT().slotsFull; box.appendChild(f); }
  layoutHud();
}
let banTimer = 0;
function banner(txt, kind) { const b = $('banner'); b.innerHTML = `<span>${txt}</span>`; b.className = 'show ' + (kind || ''); void b.offsetWidth; clearTimeout(banTimer); banTimer = setTimeout(() => b.className = '', 2800); }
const toastQ = []; let toastOn = false;
function toast(txt) { toastQ.push(txt); if (!toastOn) nextToast(); }
function nextToast() { const el = $('toast'), m = toastQ.shift(); if (!m) { toastOn = false; el.className = 'hide'; return; } toastOn = true; el.textContent = m; el.className = ''; void el.offsetWidth; el.className = 'show'; setTimeout(nextToast, 2600); }

// ---------- icons ----------
const iconCache = {};
function icon(name, s) {
  const k = name + '@' + (s || 3); if (iconCache[k]) return iconCache[k];
  if (name === 'kyface') return iconCache[k] = PORTRAIT;
  const n = R[name] ? name : R[name + '0'] ? name + '0' : 'berry';
  return iconCache[k] = dataURL(n, s || 3);
}
const portraits = {};
function portraitOf(pre) { if (portraits[pre]) return portraits[pre]; const r = R[pre + '0'], c = document.createElement('canvas'); c.width = c.height = 104; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(r.canvas, 4, 0, 26, 26, 0, 0, 104, 104); return portraits[pre] = c.toDataURL(); }

// ---------- screens ----------
function applyLang() {
  const t = T(), m = MT(); document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : lang;
  const [a, b] = lang === 'en' ? ['KYOKA', 'SURVIVORS'] : lang === 'zh' ? ['亨香', '生存戰'] : ['きょうか', 'サバイバー'];
  $('t-title').innerHTML = `<span class="l1" data-t="${a}">${a}</span><span class="l2" data-t="${b}">${b}</span>`;
  $('t-sub').textContent = t.sub; $('startbtn').innerHTML = `<span>${t.start}</span>`; $('t-how').innerHTML = t.how; $('t-goal').textContent = t.goal;
  { const gh = { ja: 'GitHub で みる', zh: '在 GitHub 上看', en: 'View on GitHub' }[lang] || 'GitHub'; $('gh-l').textContent = gh; $('ghbtn').title = gh; $('ghbtn').setAttribute('aria-label', gh); }
  $('l-title').textContent = t.levelup; $('l-choose').textContent = t.choose;
  $('p-title').textContent = t.paused; $('resumebtn').textContent = t.resume; $('quitbtn').textContent = t.toTitle;
  $('retrybtn').textContent = t.retry; $('titlebtn').textContent = t.toTitle; $('dashbtn').textContent = t.dash; $('sp-lbl').textContent = SP_T[lang].btn; $('endlessbtn').textContent = m.endlessBtn;
  document.querySelectorAll('.langs button').forEach(b => b.classList.toggle('on', b.dataset.l === lang));
  $('runbtn').textContent = RT().titleBtn; $('runcodebtn').textContent = RT().pauseBtn;
  $('codebtn').textContent = ST().enterBtn; $('guidebtn').textContent = ST().guideBtn; $('shopbtn').textContent = m.shopBtn; $('zukanbtn').textContent = m.zukanBtn; updateRec();
  $('ci-input').placeholder = 'ABCD-EFGH-JKMN-…'; $('cheatbtn').textContent = PT().cheatBtn;
  if (modal === 'guide') openGuide($('g-tab-more').classList.contains('on') ? 'more' : 'easy');
  if (screen === 'shop') renderShop('hello'); if (screen === 'select') renderSelect(); if (screen === 'zukan') renderZukan(zkTab);
}
const show = (id, on) => $(id).classList.toggle('hide', !on);
let screen = null;
function openScreen(id) { closeModal(); if (screen) show(screen, false); screen = id; show('title', false); show(id, true); }
function closeScreen() { if (!screen) return; show(screen, false); screen = null; show('title', true); updateRec(); }
// the very first run starts right away; after that the select screen shows all 7 stages (locked ones as silhouettes)
function anythingToChoose() { return STAGE_IDS.some(id => ((profile.st[id] || {}).t || 0) > 0) || Object.keys(CHARS).some(c => CHARS[c].need && charOpen(profile, c)); }
function onStart() { Snd.init(); if (anythingToChoose()) openSelect(); else { sel.char = 'kyon'; sel.stage = 'apple'; openDiff(); } }
const paren = s => lang === 'en' ? ` (${s})` : `（${s}）`;
// --- difficulty (big buttons, ふつう is the default) ---
function openDiff() {
  Snd.init(); validSel(); const pt = PT(), r = profile.st[sel.stage];
  $('df-title').textContent = pt.diffTitle; $('df-stage').textContent = STAGES[sel.stage][lang][0]; $('df-back').textContent = MT().back;
  $('df-list').innerHTML = DIFFS.map((id, i) => {
    const d = DIFF[id], b = r.by[i], rec = b.t > 300 ? `<span class="dr c">${pt.diffClear} <span class="eb">${PT().endlessBest.replace('{t}', fmtTime(b.t))}</span></span>` : b.t >= 300 ? `<span class="dr c">${pt.diffClear}</span>` : b.t > 0 ? `<span class="dr">${pt.diffBest.replace('{t}', fmtTime(b.t))}</span>` : `<span class="dr">${pt.diffNone}</span>`;
    return `<button class="dbtn d${i}${sel.diff === id ? ' on' : ''}" data-d="${id}"><span class="di">${d.icon}</span><b>${d[lang][0]}</b><small>${d[lang][1]}</small><span class="dm">${pt.diffCoin.replace('{m}', d.coin)}</span>${rec}</button>`;
  }).join('');
  document.querySelectorAll('#df-list .dbtn').forEach(b => b.addEventListener('click', () => pickDiff(b.dataset.d)));
  if (screen) { show(screen, false); } openModal('diff'); if (!isTouch) setTimeout(() => { const on = document.querySelector('#df-list .dbtn.on'); if (on) on.focus(); }, 30);
}
function pickDiff(id) { if (!DIFF[id]) return; sel.diff = id; saveSel(); Snd.fx.select(); startGame(); }
function diffBack() { closeModal(); if (screen) show(screen, true); else show('title', true); }
// --- select ---
// 19 stages and 13 characters: both lists are paged so the screen fits on a phone
const PG_C = 5, PG_S = 10; let pgC = 0, pgS = 0;
function openSelect() { validSel(); pgC = Math.floor(Math.max(0, Object.keys(CHARS).indexOf(sel.char)) / PG_C); pgS = Math.floor(Math.max(0, STAGE_IDS.indexOf(sel.stage)) / PG_S); openScreen('select'); renderSelect(); }
function pager(k, cur, n, label) { return n < 2 ? '' : `<span class="pgs">${Array.from({ length: n }, (_, i) => `<button class="pg${i === cur ? ' on' : ''}" data-pk="${k}" data-pi="${i}">${label(i)}</button>`).join('')}</span>`; }
function lockHint(need) { return MT().lockHint.replace('{a}', ACH[need][lang][0]); }
function renderSelect() {
  const m = MT(), pt = PT(), cids = Object.keys(CHARS), nC = Math.ceil(cids.length / PG_C), nS = Math.ceil(STAGE_IDS.length / PG_S); pgC = clamp(pgC, 0, nC - 1); pgS = clamp(pgS, 0, nS - 1);
  $('s-title').textContent = m.selTitle; $('s-l-char').innerHTML = `<span>${m.selChar}</span>` + pager('c', pgC, nC, i => pt.p6.pageChar.replace('{n}', i + 1)); $('s-l-stage').innerHTML = `<span>${m.selStage}</span>` + pager('s', pgS, nS, i => pt.p6.pageStage[i] || String(i + 1)); $('s-go').innerHTML = `<span>${m.go}</span>`; $('s-back').textContent = m.back;
  $('s-chars').innerHTML = cids.slice(pgC * PG_C, pgC * PG_C + PG_C).map(id => {
    const d = CHARS[id], ok = charOpen(profile, id), on = sel.char === id, [nm, ds] = d[lang], img = icon(d.spr === 'kr0' ? 'kr00' : d.spr + '0', 3);
    return `<button class="scard ccard${on ? ' on' : ''}${ok ? '' : ' locked'}" data-kind="char" data-id="${id}"${ok ? '' : ' disabled'}><img src="${img}" alt=""><span class="st"><b>${ok ? nm : m.locked}</b><small>${ok ? ds : lockHint(d.need)}</small></span>${on ? '<i class="chk">✔</i>' : ''}</button>`;
  }).join('');
  { const d = CHARS[sel.char], [nm, ds] = d[lang]; $('s-cinfo').innerHTML = `<img src="${icon(d.spr === 'kr0' ? 'kr00' : d.spr + '0', 3)}" alt=""><span><b>${nm}</b><small>${ds}</small></span>`; } // phones: card text is hidden, so the chosen character's info shows here
  $('s-stages').innerHTML = STAGE_IDS.slice(pgS * PG_S, pgS * PG_S + PG_S).map((id, i) => {
    i += pgS * PG_S; const d = STAGES[id], ok = stageOpen(profile, id), on = sel.stage === id, [nm] = d[lang], r = profile.st[id], pr = prevStage(id);
    const sub = !ok ? pt.lockStage.replace('{s}', STAGES[pr][lang][0]) : r.t > 0 ? stageBest(pt, r) : pt.first;
    return `<button class="scard tcard${on ? ' on' : ''}${ok ? '' : ' locked'}" data-kind="stage" data-id="${id}"${ok ? '' : ' disabled'}><span class="tn">${i + 1}</span>${r.d > 0 ? `<span class="clr d${r.d}" title="${pt.clear}: ${DIFF[DIFFS[r.d - 1]][lang][0]}">${r.d >= 4 ? '👑' : '★'}</span>` : ''}<img src="${STAGE_IMG[id]()}" alt=""><b>${ok ? nm : m.locked}</b><small>${sub}</small>${on ? '<i class="chk">✔</i>' : ''}</button>`;
  }).join('');
  document.querySelectorAll('#select .scard:not(.locked)').forEach(b => b.addEventListener('click', () => { sel[b.dataset.kind] = b.dataset.id; saveSel(); Snd.fx.select(); renderSelect(); }));
  document.querySelectorAll('#select .pg').forEach(b => b.addEventListener('click', () => { if (b.dataset.pk === 'c') pgC = +b.dataset.pi; else pgS = +b.dataset.pi; Snd.fx.select(); renderSelect(); }));
}
const STAGE_IMG = {
  apple: () => stageThumb(0, ['tree0', 'crow0', 'apple']), berry: () => stageThumb(1, ['bplant0', 'slug0', 'bmole0']), race: () => stageThumb(2, ['flag0', 'carrot0', 'mokuba0']),
  cage: () => stageThumb(3, ['cwheel', 'ham', 'bowl']), zoo: () => stageThumb(4, ['giraffe', 'monkey0', 'zou0']), snow: () => stageThumb(5, ['pine0', 'sman0', 'bigsnow0']), night: () => stageThumb(6, ['stlight', 'onpu0', 'bigspk0']), chapel: () => stageThumb(7, ['arch', 'tulip0', 'bell0']), china: () => stageThumb(8, ['dgate', 'gyoza0', 'cdragon0'])
};
const thumbCache = {};
function stageThumb(g, sprites) {
  const k = g + sprites.join(); if (thumbCache[k]) return thumbCache[k];
  const c = document.createElement('canvas'); c.width = 96; c.height = 64; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  const gr = RD.tGround[g].image; x.drawImage(gr, 0, 0, 48, 32, 0, 0, 96, 64);
  sprites.forEach((n, i) => { const r = R[n]; const s = Math.min(2, 40 / r.h); x.drawImage(r.canvas, 6 + i * 30 + (30 - r.w * s) / 2, 60 - r.h * s, r.w * s, r.h * s); });
  return thumbCache[k] = c.toDataURL();
}
// --- shop ---
let shopPending = null;
function openShop() { Snd.init(); openScreen('shop'); renderShop('hello'); }
let shopCat = 'base';
function renderShop(say, n) {
  const m = MT(), p = profile;
  $('sh-title').textContent = m.shopTitle; $('sh-close').textContent = m.back; $('sh-refund').textContent = PT().refundBtn; $('sh-refund').disabled = !spentTotal(p);
  $('sh-ham').src = icon(p.debt ? 'hamWorry' : 'ham', 4); $('sh-ham').classList.toggle('worry', !!p.debt);
  let msg = say === 'hello' && p.debt ? m.worried.replace('{d}', p.debt) : say === 'refunded' ? PT().refunded.replace('{n}', n.total) + (n.repaid ? '<br>' + PT().refundDebt.replace('{r}', n.repaid) : '') : say === 'refundNone' ? PT().refundNone : (m[say] || m.hello);
  $('sh-say').innerHTML = msg.replace('{m}', MAX_DEBT).replace('{d}', p.debt);
  $('sh-wallet').innerHTML = `<span class="wc"><img src="${icon('coin', 2)}"> ${p.coins}</span>` + (p.debt ? `<span class="wd">${m.debt} 🍓${p.debt}</span>` : '');
  const sk = SHOP_T[lang]; document.querySelectorAll('#sh-tabs button').forEach(b => { b.textContent = sk[b.dataset.cat]; b.classList.toggle('on', b.dataset.cat === shopCat); });
  $('sh-list').className = 'ulist cat-' + shopCat;
  $('sh-list').innerHTML = (shopCat === 'rep' ? `<div class="uhelp">${sk.repHelp}</div>` : '') + UPG_IDS.filter(id => (UPGRADES[id].cat || 'base') === shopCat).map(id => {
    const u = UPGRADES[id], l = p.up[id] || 0, max = UPG_MAX[id], c = canBuy(p, id), [nm, ds] = u[lang];
    let pips = ''; if (u.cat === 'rep') pips = `<span class="ulv">${sk.lv.replace('{l}', l)} / ${max}</span>`; else for (let k = 1; k <= max; k++) pips += `<i class="${k <= l ? 'on' : ''}"></i>`;
    const btn = l >= max ? `<button class="btn sm ubuy max" disabled>${m.max}</button>`
      : `<button class="btn sm ubuy${c.ok ? '' : ' short'}" data-id="${id}">${c.ok ? m.buy : m.borrowBuy} <img src="${icon('coin', 2)}">${c.cost}</button>`;
    return `<div class="ucard${l >= max ? ' done' : ''}"><img class="uic" src="${icon(u.icon, 3)}" alt=""><div class="ut"><b>${nm}</b><small>${ds}</small><div class="pips">${pips}</div></div>${btn}</div>`;
  }).join('');
  document.querySelectorAll('#sh-list .ubuy[data-id]').forEach(b => b.addEventListener('click', () => tryBuy(b.dataset.id)));
}
function tryBuy(id) {
  const c = canBuy(profile, id);
  if (c.ok) { buy(profile, id, false); afterBuy('thanks'); Snd.fx.buy(); return; }
  if (c.reason === 'short') { shopPending = id; const m = MT(); $('b-title').textContent = m.borrowTitle; $('b-msg').innerHTML = m.borrowMsg.replace('{n}', c.need); $('b-yes').textContent = m.borrowYes; $('b-no').textContent = m.borrowNo; $('b-ham').src = icon('hamWorry', 4); openModal('borrow'); Snd.fx.select(); return; }
  renderShop(c.reason === 'max' ? 'maxed' : 'tooMuch'); Snd.fx.hurt();
}
function afterBuy(say) { if (allBought(profile)) achNote('shopAll'); commitProfile(profile); renderShop(say); }
function askRefund() {
  const n = spentTotal(profile); if (!n) { renderShop('refundNone'); return; }
  const pt = PT(), m = MT(); shopPending = '__refund'; $('b-title').textContent = pt.refundTitle; $('b-msg').innerHTML = pt.refundMsg.replace('{n}', n); $('b-yes').textContent = pt.refundYes; $('b-no').textContent = m.borrowNo; $('b-ham').src = icon('ham', 4); openModal('borrow'); Snd.fx.select();
}
function confirmBorrow() { const id = shopPending; shopPending = null; closeModal(); if (!id) return;
  if (id === '__refund') { const r = refundAll(profile); commitProfile(profile); renderShop('refunded', r); Snd.fx.coin(); return; } const r = buy(profile, id, true); if (r.ok) { afterBuy(r.borrowed ? 'lent' : 'thanks'); Snd.fx.borrow(); } else renderShop('tooMuch'); }
// --- zukan & achievements ---
let zkTab = 'book';
function openZukan(tab) { Snd.init(); openScreen('zukan'); renderZukan(tab || 'book'); }
function zkHint(e) { const m = MT(), n = e.need; if (n === 'played') return m.zkHintPlay; const [k, id] = n.split(':'); return k === 'up' ? m.zkHintUp.replace('{u}', UPGRADES[id][lang][0]) : m.zkHintAch.replace('{a}', ACH[id][lang][0]); }
function renderZukan(tab) {
  zkTab = tab; const m = MT();
  $('zk-title').textContent = m.zkTitle; $('zk-close').textContent = m.back; $('zk-tab-book').textContent = m.zkTab; $('zk-tab-ach').textContent = m.achTab; $('zk-tab-evo').textContent = PT().evoTab;
  for (const k of ['book', 'ach', 'evo']) $('zk-tab-' + k).classList.toggle('on', tab === k);
  show('zk-detail', false); show('zk-body', true);
  if (tab === 'book') {
    const open = ZUKAN.filter(e => zukanOpen(profile, e)).length;
    $('zk-count').textContent = `${open} / ${ZUKAN.length}`;
    $('zk-body').innerHTML = `<div class="zgrid">${ZUKAN.map((e, i) => { const ok = zukanOpen(profile, e); return `<button class="ztile${ok ? '' : ' locked'}" data-i="${i}"><img src="${icon(e.icon, 3)}" alt=""><b>${ok ? e[lang][0] : m.locked}</b></button>`; }).join('')}</div>`;
    document.querySelectorAll('#zk-body .ztile').forEach(b => b.addEventListener('click', () => zkDetail(+b.dataset.i)));
  } else if (tab === 'evo') {
    const t = T(), pt = PT(), done = WEAPONS.filter(id => hasAch(profile, EVO[id].ach)).length;
    $('zk-count').textContent = `${done} / ${WEAPONS.length}`;
    $('zk-body').innerHTML = `<div class="erule">⭐ ${pt.evoRule}</div>` + WEAPONS.map(id => {
      const ok = hasAch(profile, EVO[id].ach), [wn] = t.items[id], [en, ed] = t.items['evo_' + id];
      return `<div class="erow${ok ? ' ok' : ''}"><img src="${ICON[id]}" alt=""><div class="en"><b>${wn}</b></div><span class="lv">Lv5</span><span class="ar">➜</span><img src="${ICON['evo_' + id]}" alt=""><div class="en"><b>${en}</b><small>${ed}</small></div>${ok ? '<span class="ast">🏆</span>' : ''}</div>`;
    }).join('') + `<div class="ehead">${pt.evoPas}</div><div class="pgrid">` + PASSIVES.map(id => { const [n, d] = t.items[id]; return `<div class="erow"><img src="${ICON[id]}" alt=""><div class="en"><b>${n}</b><small>${d}</small></div></div>`; }).join('') + '</div>';
  } else {
    const done = ACH_IDS.filter(id => hasAch(profile, id)).length;
    $('zk-count').textContent = `${done} / ${ACH_IDS.length}`;
    $('zk-body').innerHTML = ACH_IDS.map(id => {
      const a = ACH[id], ok = hasAch(profile, id), un = (UNL[id] || []).map(unlockName).join('　');
      return `<div class="arow${ok ? ' ok' : ''}"><img src="${icon(a.icon, 2)}" alt=""><div><b>${a[lang][0]}</b><small>${a[lang][1]}</small>${un ? `<em>${un}</em>` : ''}</div>${ok ? '<span class="ast">🏆</span>' : ''}</div>`;
    }).join('');
  }
  $('zk-body').scrollTop = 0;
}
function unlockName(u) { const m = MT(); if (u === 'endless') return m.unlockEndless; const [k, id] = u.split(':'); return k === 'char' ? m.unlockChar.replace('{n}', CHARS[id][lang][0]) : m.unlockStage.replace('{n}', STAGES[id][lang][0]); }
function zkDetail(i) {
  const e = ZUKAN[i], ok = zukanOpen(profile, e), m = MT(), [nm, tx, src] = e[lang];
  $('zk-detail').innerHTML = `<img src="${icon(e.icon, 5)}" alt="" class="${ok ? '' : 'locked'}"><h3>${ok ? nm : m.locked}</h3><p>${ok ? tx : zkHint(e)}</p>${ok ? `<small>${m.source}${src}</small>` : ''}<button class="btn sm alt" id="zk-dback">${m.back}</button>`;
  show('zk-body', false); show('zk-detail', true); $('zk-dback').addEventListener('click', () => { show('zk-detail', false); show('zk-body', true); }); Snd.fx.select();
}
const UNL = Object.assign({}, UNLOCK_BY, { clearNight: ['stage:chapel'], clearChapel: ['char:dress', 'stage:china'], clearApple: ['stage:berry'], clearBerry: ['stage:race'], clearRace: ['stage:cage'], cageClear: ['stage:zoo'], clearZoo: ['stage:snow'], clearSnow: ['stage:night'] });
// --- secret codes (ひみつのコード) ---
function openCheat() {
  Snd.init(); const pt = PT(); $('cc-title').textContent = pt.cheatTitle; $('cc-help').textContent = pt.cheatHelp; $('cc-ok').textContent = pt.cheatOk; $('cc-back').textContent = MT().back;
  $('cc-input').value = ''; $('cc-msg').innerHTML = ''; $('cc-msg').className = 'ccmsg'; openModal('cheat'); setTimeout(() => { if (!isTouch) $('cc-input').focus(); }, 50);
}
function submitCheat(str) {
  const pt = PT(), r = redeemCheat(profile, str ?? $('cc-input').value), el = $('cc-msg');
  if (!r.ok) { el.className = 'ccmsg bad'; el.textContent = r.reason === 'today' ? pt.cheatToday : r.reason === 'used' ? pt.cheatUsed : r.reason === 'empty' ? pt.cheatEmpty : pt.cheatUnknown; Snd.fx.hurt(); return r; }
  commitProfile(profile); validSel(); updateRec();
  el.className = 'ccmsg ok'; el.innerHTML = `<span class="pop">${pt.cheats[r.id]}</span>`; $('cc-input').value = ''; Snd.fx.cheat();
  return r;
}
// --- game flow ---
function startGame() {
  closeModal(); if (screen) { show(screen, false); screen = null; }
  Snd.init(); newGame(); G.runId = newRunId(); beginPlay();
}
function beginPlay(resumed) {
  RD.setZoom(1); RD.G.tilt = 0.75; state = 'play'; hudCache = {};
  ['title', 'end', 'pause', 'levelup'].forEach(i => show(i, false)); show('hud', true); show('pausebtn', true); show('dashbtn', isTouch); show('spbtn', true); $('spbtn').classList.toggle('touch', isTouch);
  document.body.classList.add('playing'); $('portrait').src = portraitOf(G.char === 'ranger' ? 'kr0' : G.spr);
  refreshWeps(); Snd.playSong(G.D.song); banner(PT().st[G.sid].banner, 'stage');
  if (G.boosted && !resumed) toast(PT().boost); if (G.giant) toast(PT().giant);
  if (resumed) banner(RT().resumed, 'stage');
  if (G.pending > 0) setTimeout(() => { if (G && state === 'play' && G.pending > 0) openLevelUp(); }, resumed ? 300 : 900); // pending level-ups (resume, ハムナンバーカード)
  last = performance.now(); saveRun();
}
function toTitle() {
  closeModal();
  if (G && state === 'paused') { commitProfile(settleRun(false)); finishRun(); }
  state = 'title'; updateRec(); ['end', 'pause', 'levelup', 'hud', 'pausebtn', 'dashbtn', 'spbtn'].forEach(i => show(i, false)); show('title', true);
  document.body.classList.remove('playing'); G = null; Snd.playSong('title');
}
function endGame(won) {
  state = won ? 'win' : 'over'; won ? Snd.fx.win() : Snd.fx.lose(); Snd.stopSong();
  if (won) { achNote('firstClear'); achNote(G.sid === 'cage' ? 'cageClear' : 'clear' + G.sid[0].toUpperCase() + G.sid.slice(1)); if (G.di >= 2) achNote('clearHard'); if (G.di >= 3) achNote('clearGeki'); }
  finishRun(); checkAch(); const pr = settleRun(won || (G.road && G.t >= WIN_T)); if (STAGE_IDS.slice(0, 9).every(id => stageCleared(pr, id))) achNote('allStages'); if (STAGE_IDS.every(id => stageCleared(pr, id))) achNote('allStages2'); commitProfile(pr);
  const t = T(), m = MT(), cleared = won || G.cleared;
  $('end').className = 'ol panel ' + (cleared ? 'won' : 'lost');
  $('e-title').innerHTML = cleared ? `<img src="${dataURL('berry', 4)}">${t.win}<img src="${dataURL('seal0', 3)}">` : t.over;
  $('e-msg').innerHTML = cleared ? t.winSub : t.overSub;
  if (G.road) { $('e-title').textContent = P6T().endTitle; $('e-msg').textContent = P6T().endLine.replace('{y}', G.t >= 1200 ? '∞' : 2007 + Math.floor(G.t / 60)).replace('{n}', G.lap); }
  const s = Math.floor(G.t);
  $('e-stats').innerHTML = `<div><small>${t.time}</small><b>${fmtTime(s)}</b></div><div><small>${t.level}</small><b>${G.lvl}</b></div><div><small>${t.kills}</small><b>${G.kills}</b></div><div><small>${t.seals}</small><b>${G.seals.length}</b></div>`;
  let coins = `<b>${m.earned.replace('{n}', G.coinsBanked)}</b><small class="dline d${G.di}">${PT().resDiff.replace('{d}', DIFF[G.diff].icon + ' ' + DIFF[G.diff][lang][0]).replace('{m}', DIFF[G.diff].coin)}</small>`;
  if (G.repaid) coins += `<small>${m.repaid.replace('{r}', G.repaid).replace('{d}', profile.debt)}</small>`;
  if (G.paidOff) coins += `<small class="paid">${m.paidOff}</small>`;
  coins += `<small>${m.total.replace('{n}', profile.coins)}</small>`;
  $('e-coins').innerHTML = coins;
  const now = unlockSet(profile), unl = [...now].filter(u => !G.unl0.has(u)).map(u => `<span class="chip gift">${m.newUnlock.replace('{n}', unlockName(u).replace(/^→ /, ''))}</span>`);
  $('e-ach').innerHTML = G.newAch.map(id => `<span class="chip"><img src="${icon(ACH[id].icon, 2)}">${ACH[id][lang][0]}</span>`).join('') + unl.join('');
  show('e-ach', G.newAch.length > 0 || unl.length > 0);
  const sr = profile.st[G.sid].by[G.di], nr = Math.floor(G.t) > G.prev.t || G.kills > G.prev.k;
  $('e-rec').innerHTML = `<span>${STAGES[G.sid][lang][0]}${paren(DIFF[G.diff][lang][0])}</span> ${PT().recLine.replace('{t}', fmtTime(Math.min(sr.t, G.endless ? sr.t : 300))).replace('{k}', sr.k)}${nr ? ` <b class="nr">${PT().newRec}</b>` : ''}${G.endless ? `<br><b class="eb" id="e-endless">${PT().endlessRec.replace('{t}', fmtTime(Math.floor(G.t)))}</b> <small>${PT().endlessBest.replace('{t}', fmtTime(sr.t))}</small>` : ''}`;
  show('endlessbtn', won && !G.endless && endlessOpen(profile));
  G.unl0 = now;
  fillCode('e-code');
  $('banner').className = ''; show('levelup', false); show('end', true); show('dashbtn', false); show('spbtn', false); show('pausebtn', false);
}
function continueEndless() {
  if (!G || state !== 'win') return;
  G.endless = true; state = 'play'; G.nextBoss = G.t + 90; G.newAch = []; last = performance.now(); G.runId = newRunId(); saveRun();
  show('end', false); show('pausebtn', true); show('dashbtn', isTouch); show('spbtn', true); banner(T().endless, 'stage'); Snd.playSong(G.D.song);
}
function setPause(on) {
  if (on && state === 'play') { state = 'paused'; saveRun(); fillCode('p-code'); show('pause', true); }
  else if (!on && state === 'paused') { state = 'play'; show('pause', false); last = performance.now(); }
}
function dash() { const p = G && G.p; if (!p || state !== 'play' || p.dashCd > 0) return; p.dashT = 0.2; p.dashCd = 1.1; p.inv = Math.max(p.inv, 0.25); Snd.fx.dash(); }

// ---------- input ----------
addEventListener('keydown', e => {
  if (state === 'chest') { if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); closeChest(); } return; }
  if (modal === 'diff') { if (e.code === 'Escape') diffBack(); else if (e.code === 'Enter' && !(e.target && e.target.classList && e.target.classList.contains('dbtn'))) pickDiff(sel.diff); return; }
  if (modal === 'resumeask') { if (e.code === 'Enter') $('ra-yes').click(); return; }
  if (modal) { if (e.code === 'Escape') closeModal(); else if (e.code === 'Enter' && modal === 'codein') submitCode(); else if (e.code === 'Enter' && modal === 'cheat') submitCheat(); else if (e.code === 'Enter' && modal === 'borrow') confirmBorrow(); return; }
  if (screen) { if (e.code === 'Escape') closeScreen(); else if (screen === 'select' && e.code === 'Enter') openDiff(); return; }
  if (e.target && e.target.tagName === 'INPUT') return;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  keys.add(e.code);
  if (e.code === 'KeyM') toggleMute();
  if (state === 'title' && (e.code === 'Enter' || e.code === 'Space')) onStart();
  else if (state === 'play' && G.cine) { if (e.code === 'Escape' || e.code === 'KeyP') setPause(true); else if (['Space', 'Enter', 'KeyQ'].includes(e.code)) skipCine(); }
  else if (state === 'play') { if (e.code === 'Space') dash(); if (e.code === 'KeyQ') useSp(); if (e.code === 'Escape' || e.code === 'KeyP') setPause(true); }
  else if (state === 'paused' && (e.code === 'Escape' || e.code === 'KeyP' || e.code === 'Enter')) setPause(false);
  else if (state === 'levelup') {
    const n = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[e.code];
    if (n !== undefined) pick(n);
    if (['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(e.code)) { selIdx = (selIdx + (e.code === 'ArrowLeft' || e.code === 'KeyA' ? 2 : 1)) % 3; document.querySelectorAll('.card').forEach((c, i) => c.classList.toggle('sel', i === selIdx)); }
    if (e.code === 'Enter') pick(selIdx);
  } else if ((state === 'win' || state === 'over') && e.code === 'Enter') startGame();
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => { keys.clear(); joy.on = false; setPause(true); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { setPause(true); saveRun(); } });
const cv = $('game');
cv.addEventListener('pointerdown', e => { if (state !== 'play') return; Snd.init(); Object.assign(joy, { on: true, id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY }); cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', e => { if (joy.on && e.pointerId === joy.id) { joy.x = e.clientX; joy.y = e.clientY; } });
const endJoy = e => { if (e.pointerId === joy.id) joy.on = false; };
cv.addEventListener('pointerup', endJoy); cv.addEventListener('pointercancel', endJoy);
$('dashbtn').addEventListener('pointerdown', e => { e.preventDefault(); dash(); });
$('spfx').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); skipCine(); });
addEventListener('resize', () => { if (G && G.cine) cineSize(); });
$('spbtn').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); useSp(); });
$('startbtn').addEventListener('click', onStart);
$('s-go').addEventListener('click', openDiff); $('df-back').addEventListener('click', diffBack); $('s-back').addEventListener('click', closeScreen);
$('shopbtn').addEventListener('click', openShop);
document.querySelectorAll('#sh-tabs button').forEach(b => b.addEventListener('click', () => { shopCat = b.dataset.cat; Snd.fx.select(); renderShop('hello'); $('sh-list').scrollTop = 0; })); $('sh-close').addEventListener('click', closeScreen); $('sh-refund').addEventListener('click', askRefund);
$('cheatbtn').addEventListener('click', openCheat); $('cc-ok').addEventListener('click', () => submitCheat()); $('cc-back').addEventListener('click', closeModal);
$('ch-ok').addEventListener('click', closeChest);
$('b-yes').addEventListener('click', confirmBorrow); $('b-no').addEventListener('click', () => { shopPending = null; closeModal(); });
$('zukanbtn').addEventListener('click', () => openZukan('book')); $('zk-close').addEventListener('click', closeScreen);
$('zk-tab-book').addEventListener('click', () => renderZukan('book')); $('zk-tab-ach').addEventListener('click', () => renderZukan('ach')); $('zk-tab-evo').addEventListener('click', () => renderZukan('evo'));
$('endlessbtn').addEventListener('click', continueEndless);
$('retrybtn').addEventListener('click', startGame);
$('titlebtn').addEventListener('click', toTitle);
$('resumebtn').addEventListener('click', () => setPause(false));
$('quitbtn').addEventListener('click', toTitle);
$('pausebtn').addEventListener('click', () => setPause(true));
function toggleMute() { Snd.init(); const m = Snd.toggleMute(); $('mutebtn').classList.toggle('off', m); }
$('mutebtn').addEventListener('click', toggleMute);
$('codebtn').addEventListener('click', () => { Snd.init(); openCodeIn(); });
$('runbtn').addEventListener('click', () => { Snd.init(); openCodeIn(true); });
$('runcodebtn').addEventListener('click', openRunCode); $('rc-close').addEventListener('click', closeModal);
$('rc-copy').addEventListener('click', async () => { const ok = await copyText($('rc-code').dataset.code || ''); $('rc-msg').textContent = ok ? RT().copied : ST().copyFail; $('rc-msg').className = 'cimsg ' + (ok ? 'good' : 'bad'); });
$('guidebtn').addEventListener('click', () => { Snd.init(); openGuide('easy'); });
$('g-tab-easy').addEventListener('click', () => guideTab('easy')); $('g-tab-more').addEventListener('click', () => guideTab('more'));
$('g-more').addEventListener('scroll', updateGuideHint);
$('g-close').addEventListener('click', closeModal); $('ci-back').addEventListener('click', closeModal);
$('ci-ok').addEventListener('click', submitCode);
$('ci-clear').addEventListener('click', () => { $('ci-input').value = ''; $('ci-msg').textContent = ''; $('ci-msg').className = 'cimsg'; $('ci-input').focus(); });
$('ci-input').addEventListener('input', () => {
  const el = $('ci-input'), before = el.value.slice(0, el.selectionStart);
  el.value = formatCodeInput(el.value);
  const pos = formatCodeInput(before).length; el.setSelectionRange(pos, pos);
});
$('ci-paste').addEventListener('click', async () => {
  try { const t = await navigator.clipboard.readText(); if (t) { $('ci-input').value = formatCodeInput(t); submitCode(); return; } } catch (e) { }
  ciMsg(ST().pasteFail, false); $('ci-input').focus();
});
document.querySelectorAll('.codebox .copy').forEach(b => b.addEventListener('click', async e => {
  e.stopPropagation(); const box = b.closest('.codebox'), ok = await copyText(box.querySelector('.code').textContent);
  const m = box.querySelector('.cmsg'); m.textContent = ok ? ST().copied : ST().copyFail; m.style.color = ok ? '' : '#ffb0b0';
}));
addEventListener('pagehide', () => saveRun());
document.querySelectorAll('.langs button').forEach(b => b.addEventListener('click', () => { lang = b.dataset.l; try { localStorage.setItem('kyoka-lang', lang); } catch (e) { } profile.lang = lang; saveLocal(profile); applyLang(); }));
addEventListener('pointerdown', () => { if (state === 'title') { Snd.init(); Snd.playSong('title'); } }, { once: true });
document.querySelector('.ic-coin').style.backgroundImage = `url(${dataURL('coin', 2)})`; document.querySelector('.ic-crow').style.backgroundImage = `url(${dataURL('crow0', 2)})`; document.querySelector('.ic-seal').style.backgroundImage = `url(${dataURL('seal0', 2)})`;
$('t-logo-l').src = dataURL('berry', 5); $('t-logo-r').src = dataURL('seal0', 4); $('portrait').src = PORTRAIT;

// endless foes that make you move: shooters fire a slow shot (after a short flash), chargers wind up then rush in a straight line
function beh7(e, dt, spd, dx, dy, d) {
  MV.dx = dx; MV.dy = dy; e.bt -= dt;
  if (e.beh === 'shoot') {
    if (d < 150) { MV.dx = -dx * 0.3; MV.dy = -dy * 0.3; } // keeps a little distance
    if (e.bt < 0.35) e.flash = 0.06;
    // only from inside the screen (never an unseen shot at a player running toward the edge), and with a gentle damage curve
    const p = G.p, onScr = Math.abs(e.x - p.x) < RD.viewW * 0.44 && Math.abs(e.y - p.y) < RD.viewH * 0.4;
    if (e.bt <= 0 && onScr && e.spawnT > 1.2) { e.bt = 3.4; G.ebul.push({ k: 'sbul', x: e.x, y: e.y, vx: dx * 80, vy: dy * 80, life: 3.4, dmg: e.shotDmg || 4, foe: 1 }); }
    else if (e.bt <= 0) e.bt = 0.4;
    return spd * 0.8;
  }
  if (e.cs === 1) { e.flash = 0.06; if (e.bt <= 0) { e.cs = 2; e.bt = 0.45; } MV.dx = e.cdx; MV.dy = e.cdy; return 0; }
  if (e.cs === 2) { MV.dx = e.cdx; MV.dy = e.cdy; if (e.bt <= 0) { e.cs = 0; e.bt = rnd(2.5, 3.5); } return 240; }
  if (e.bt <= 0 && d < 140) { e.cs = 1; e.bt = 0.7; e.cdx = dx; e.cdy = dy; }
  return spd;
}
// ---------- mid-run save (続きコード) ----------
// The unfinished run lives in localStorage as a run code. Coins are banked once, when the run ends
// (game over, clear, quitting, or choosing 最初から); a finished run's id is remembered so its code can't be replayed.
const RT = () => RUN_T[lang];
const RUN_KEY = 'kyoka-run', DONE_KEY = 'kyoka-runs-done';
const START_W = { dj: ['ttable'], amaroli: ['para'], waroli: ['para'], machi: ['koma'], kumicho: ['chaka'] }; // stage weapons a character starts with
const runsDone = () => { try { const a = JSON.parse(localStorage.getItem(DONE_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
function markDone(id) { if (!id) return; try { const a = runsDone().filter(x => x !== id); a.push(id); localStorage.setItem(DONE_KEY, JSON.stringify(a.slice(-300))); } catch (e) { } }
function clearRun() { try { localStorage.removeItem(RUN_KEY); } catch (e) { } }
function newRunId() { const done = new Set(runsDone()); let id; do id = 1 + Math.floor(Math.random() * 65535); while (done.has(id)); return id; }
function finishRun() { if (G && G.runId) { markDone(G.runId); G.runId = 0; } clearRun(); }
const xpFor = l => Math.floor(5 + (l - 1) * 2.5 + Math.pow(l - 1, 1.2));
// endless / loop: past Lv30 each level needs more XP, so the level can't run away from the threat
const xpForG = l => Math.floor(xpFor(l) * (G && G.endless ? 1 + Math.max(0, l - 30) * 0.06 : 1));
function snapRun() {
  return { id: G.runId, stage: G.sid, char: G.char, diff: G.diff, endless: !!G.endless, cleared: !!G.cleared, boosted: !!G.boosted, bossAlive: !!G.boss,
    t: Math.floor(G.t), lvl: G.lvl, xp: G.xp / G.xpNext, hp: G.p.hp / G.p.maxHp, pending: G.pending, kills: G.kills, picked: G.picked, banked: G.coinsBanked,
    bossKills: G.bossKills, nextBoss: G.boss ? G.t : G.nextBoss, revives: G.revives, hamN: G.hamN || 0, misN: G.misN || 0, misOk: G.misOk || 0,
    weapons: G.weapons, evo: G.evo, passives: G.passives, boost: G.boost, sp: G.sp || 0 };
}
const runCode = () => encodeRun(snapRun());
function saveRun() { if (!G || !G.runId || !['play', 'paused', 'levelup', 'chest'].includes(state)) return; try { localStorage.setItem(RUN_KEY, runCode()); } catch (e) { } }
// why a decoded run can't be restored here (null = fine)
function runProblem(r) {
  if (!r) return 'check';
  if (runsDone().includes(r.id)) return 'used';
  if (!STAGES[r.stage] || !CHARS[r.char] || !DIFF[r.diff] || r.lvl < 1) return 'check';
  if (!stageOpen(profile, r.stage) || !charOpen(profile, r.char)) return 'locked';
  if (r.endless && r.stage !== 'road' && (!r.cleared || !endlessOpen(profile))) return 'locked';
  if (!r.endless && r.t >= WIN_T) return 'check';
  for (const id in r.weapons) { const ws = W_STAGE[id]; if (ws && !(r.stage === ws || r.stage === 'road' || stageCleared(profile, ws) || (START_W[r.char] || []).includes(id))) return 'locked'; }
  if (!r.boosted && (Object.keys(r.weapons).length > wCap(r.endless, r.t, WEAPONS.filter(id => { const ws = W_STAGE[id]; return !ws || r.weapons[id] || r.stage === ws || r.stage === 'road' || stageCleared(profile, ws) || (START_W[r.char] || []).includes(id); }).length) || Object.keys(r.passives).length > MAX_P)) return 'check';
  for (const id in r.boost) if (r.boost[id] > BOOST[id].cap) return 'check';
  if (r.kills > r.t * 40 + 100 || r.picked > r.t * 4 + 300 || r.bossKills > 1 + r.t / 60) return 'check';
  if (r.banked > runCoins({ picked: r.picked, time: r.t, kills: r.kills, won: r.cleared, bosses: r.bossKills, diff: r.diff }, profile)) return 'check';
  return null;
}
function applyRun(r) {
  const p = G.p, lt = s => G.t >= s;
  G.runId = r.id; G.t = r.t; G.lastSave = r.t; G.lvl = Math.max(1, r.lvl); G.xpNext = xpForG(G.lvl); G.xp = r.xp * G.xpNext; G.pending = r.pending;
  G.sp = Math.max(0, Math.min(1, r.sp || 0)); G.spPend = 0; G.spT = 0;
  G.kills = r.kills; G.picked = r.picked; G.coinsBanked = r.banked; G.bossKills = r.bossKills; G.revives = r.revives;
  G.cleared = G.clearCounted = r.cleared; G.boosted = r.boosted; if (r.endless) G.endless = true;
  G.weapons = Object.assign({}, r.weapons); G.evo = Object.assign({}, r.evo); G.evoN = Object.keys(G.evo).length;
  G.seals = []; const ns = G.evo.seal ? 5 : Math.min(3, G.weapons.seal || 0); for (let i = 0; i < ns; i++) addSeal();
  G.passives = Object.assign({}, r.passives); G.boost = Object.assign({}, r.boost);
  const P = G.passives, B = G.boost;
  p.maxHp += 20 * (P.pannier || 0) + 5 * (B.b_hp || 0); p.speed *= 1.1 ** (P.shoes || 0) * 1.02 ** (B.b_spd || 0); p.magnet *= 1.35 ** (P.ribbon || 0) * 1.05 ** (B.b_mag || 0);
  p.hp = Math.max(1, Math.round(r.hp * p.maxHp)); p.inv = 2;
  G.rc = Math.floor(G.t / 30) % 5; G.nextPick = G.t + 20; G.safe = 0;
  if (r.bossAlive) { G.bossDone = false; G.nextBoss = G.t + 3; } else { G.nextBoss = r.nextBoss; G.bossDone = r.bossKills > 0; }
  let g = G.stage;
  if (G.road) {
    const era = Math.floor(G.t / 300), i = era % 6, l = G.t - era * 300; G.eraN = era; G.lap = Math.floor(era / 6) + 1; G.eraT0 = era * 300; G.D = eraDef(i, G.lap);
    G.rw = { 60: l >= 60 ? 1 : 0, 150: l >= 150 ? 1 : 0, 240: l >= 240 ? 1 : 0 }; G.towelAt = i === 2 && l < 120 ? G.eraT0 + 120 : 0; G.clrRoad = lt(WIN_T) ? 1 : 0; G.enc = lt(1200) ? 1 : 0; g = G.D.g;
  } else for (const w of [60, 150, 240]) G.waves[w] = lt(w) ? 1 : 0;
  if (G.endless) G.eliteWaveT = Math.max(G.t + 60, G.road ? WIN_T : 0);
  if (G.sid === 'runway' && lt(150)) { G.night = 1; g = SDEF.runway.night; }
  if (G.sid === 'dawn') { G.hamN = r.hamN; G.hamDone = r.hamN >= 5 ? 1 : 0; G.cardN = Math.min(5, r.hamN); G.nextCard = G.t + 15; }
  if (G.sid === 'okinawa') { G.misN = r.misN; G.misOk = r.misOk; G.mis = null; G.nextMis = G.t + 10; }
  G.stage = G.prevStage = g; G.stageT = 9; const U = RD.groundMat.uniforms; U.uG0.value = U.uG1.value = RD.tGround[g]; U.uMix.value = 1;
  Object.assign(look, JSON.parse(JSON.stringify(LOOKS[g]))); RD.setLook(look);
}
function restoreRun(r) {
  closeModal(); if (screen) { show(screen, false); screen = null; }
  sel.char = r.char; sel.stage = r.stage; sel.diff = r.diff; saveSel();
  const b0 = profile.boost; profile.boost = 0; Snd.init(); newGame(); profile.boost = b0;
  applyRun(r); beginPlay(true);
}
// 最初から: the saved run ends here; what it earned so far is banked once, like quitting
function discardRun(r) {
  if (r && !runsDone().includes(r.id)) {
    const keep = G; G = { sid: r.stage, di: DIFFS.indexOf(r.diff), diff: r.diff, t: r.t, kills: r.kills, lvl: r.lvl, picked: r.picked, coinsBanked: r.banked, bossKills: r.bossKills,
      cleared: r.cleared, clearCounted: true, repaid: 0, gained: 0, newAch: [] };
    try { commitProfile(settleRun(false)); } finally { G = keep; }
    markDone(r.id);
  }
  clearRun(); closeModal(); updateRec();
}
// the saved run -> { r, why, code } or null. Only a finished run ('used') is dropped here; a run that is locked or fails a check
// stays stored (restoring another save replaces what is unlocked, so it may become playable again) and the dialog says why
function savedRun() {
  let c = null; try { c = localStorage.getItem(RUN_KEY); } catch (e) { } if (!c) return null;
  const r = decodeRun(c), why = runProblem(r);
  if (why === 'used') { clearRun(); return null; }
  return { r, why, code: c };
}
function openResumeAsk() {
  const s = savedRun(); if (!s) return false; const { r, why } = s, rt = RT();
  $('ra-title').textContent = why ? rt.askBad : rt.askTitle;
  $('ra-info').innerHTML = r ? `<img src="${portraitOf(r.char === 'ranger' ? 'kr0' : CHARS[r.char].spr)}" alt=""><span>${rt.info.replace('{s}', STAGES[r.stage][lang][0]).replace('{c}', CHARS[r.char][lang][0]).replace('{t}', fmtTime(r.t))}<br><small>${DIFF[r.diff].icon} ${DIFF[r.diff][lang][0]} · Lv ${r.lvl}</small></span>` : '';
  show('ra-info', !!r); show('ra-why', !!why);
  if (why) { // keep the code (asked again next time) or discard it; a run that can't be checked banks nothing
    $('ra-why-t').textContent = rt.badSaved[why]; $('ra-why-h').textContent = rt.keepHint; $('ra-code').textContent = s.code;
    $('ra-yes').textContent = rt.keep; $('ra-no').textContent = rt.discard;
    $('ra-yes').onclick = () => closeModal(); $('ra-no').onclick = () => { if (r) markDone(r.id); clearRun(); closeModal(); updateRec(); };
  } else {
    $('ra-yes').textContent = rt.cont; $('ra-no').textContent = rt.fresh;
    $('ra-yes').onclick = () => { Snd.init(); restoreRun(r); }; $('ra-no').onclick = () => { Snd.init(); discardRun(r); };
  }
  openModal('resumeask'); return true;
}
function openRunCode() {
  if (!G || state !== 'paused') return; const rt = RT(), c = runCode(), gs = c.split('-');
  $('rc-title').textContent = rt.codeTitle; $('rc-help').textContent = rt.codeHelp; $('rc-copy').textContent = rt.copy; $('rc-close').textContent = rt.close; $('rc-msg').textContent = '';
  $('rc-code').innerHTML = [0, 1, 2, 3].map(k => gs.slice(k * 4, k * 4 + 4)).filter(a => a.length).map(a => `<span class="cline">${a.join('-')}</span>`).join('');
  $('rc-code').dataset.code = c; saveRun(); openModal('runcode');
}

// ---------- loop ----------
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame); const now0 = performance.now();
  let dt = Math.max(0, (now - last) / 1000); last = now; if (dt > 1 / 20) dt = 1 / 20;
  gTime += dt;
  if (state === 'title') titleT += dt;
  if (state === 'play') { if (G.cine) { if (!window.__kyokaHold) cineTick(dt); } else update(dt); } // __kyokaHold: tests freeze a cut-scene frame
  else if (G && (state === 'levelup' || state === 'paused' || state === 'over' || state === 'win')) { /* frozen */ }
  if (G && state !== 'title') hud();
  const r0 = performance.now(); render(dt); if (G && G.cine && state !== 'title') drawCineNow(); const r1 = performance.now();
  const P = window.__kyokaProf; if (P) { P.n++; P.js += r1 - now0; P.render += r1 - r0; }
}
applyLang();
requestAnimationFrame(frame);

// ---------- phase 6: seven new weapons, stage gimmicks, new bosses, the encore loop ----------
Object.assign(SDEF, SDEF6); Object.assign(ETYPES, ETYPES6); Object.assign(PART_COL, PART_COL6); Object.assign(LIFT, LIFT6); Object.assign(ITEM_GLOW, ITEM_GLOW6);
for (const g in LOOKS6) LOOKS[g] = LOOKS6[g];
for (const g in PROPS6) PROPS[g] = PROPS6[g];
for (const id in THUMB6) STAGE_IMG[id] = () => stageThumb(THUMB6[id][0], THUMB6[id][1]);
const P6_HP = 0.8, P6_DMG = 0.85;
const NEW_W = ['ttable', 'para', 'hlock', 'koma', 'whis', 'syr', 'chaka'];
const W_STAGE = { ttable: 'halloween', para: 'runway', hlock: 'ring', koma: 'cherry', whis: 'station', syr: 'clinic', chaka: 'hq' };
WEAPONS.push(...NEW_W); for (const id of NEW_W) { MAXLV[id] = 5; EVO[id] = { ach: 'evo' + id[0].toUpperCase() + id.slice(1) }; }
// a new weapon joins the level-up pool once its stage is cleared (or on that stage, or in the encore loop), so the first nine stages keep their balance
const wepOpen = id => !W_STAGE[id] || !G || G.sid === W_STAGE[id] || G.sid === 'road' || stageCleared(profile, W_STAGE[id]) || !!G.weapons[id];
Object.assign(W, {
  ttable: l => ({ cd: [0, 2.2, 2.0, 1.8, 1.6, 1.4][l], n: [0, 1, 1, 2, 2, 3][l], dmg: [0, 14, 17, 21, 25, 30][l] }),
  para: l => ({ n: [0, 1, 1, 2, 2, 2][l], dmg: [0, 10, 12, 14, 17, 20][l], r: 44 + l * 2 }),
  hlock: l => ({ cd: [0, 2.6, 2.4, 2.2, 2.0, 1.8][l], dmg: [0, 40, 50, 62, 74, 88][l], r: [0, 24, 26, 28, 30, 32][l] }),
  koma: l => ({ cd: [0, 1.6, 1.45, 1.3, 1.15, 1.0][l], n: [0, 2, 2, 3, 4, 4][l], dmg: [0, 12, 14, 17, 20, 24][l] }),
  whis: l => ({ cd: [0, 2.4, 2.2, 2.0, 1.8, 1.6][l], len: [0, 70, 78, 86, 94, 104][l], dmg: [0, 10, 12, 15, 18, 22][l], ang: 0.6 }),
  syr: l => ({ cd: [0, 2.0, 1.8, 1.6, 1.45, 1.3][l], n: [0, 1, 1, 2, 2, 3][l], dmg: [0, 18, 22, 26, 31, 36][l], r: 22 }),
  chaka: l => ({ cd: [0, 1.3, 1.2, 1.1, 1.0, 0.9][l], dmg: [0, 16, 19, 23, 27, 32][l], len: 60 + l * 5 })
});
const ICON6 = { ttable: 'ttable', evo_ttable: 'discE', para: 'para', evo_para: 'paraE', hlock: 'hlock', evo_hlock: 'hlockE', koma: 'koma', evo_koma: 'kin0', whis: 'whis', evo_whis: 'bellE', syr: 'syr', evo_syr: 'syrE', chaka: 'chaka', evo_chaka: 'chakaE' };
for (const k in ICON6) { ICON_SRC[k] = ICON6[k]; ICON[k] = dataURL(ICON6[k], 4); }
const ITEM6 = new Set([].concat(...Object.values(STAGE_FOODS), ['towel']));
for (const k of ITEM6) if (!ITEM_GLOW[k]) ITEM_GLOW[k] = [1, 0.8, 0.6];
const Z6 = new Set(Object.keys(ETYPES6).filter(k => ETYPES6[k].zig));
const BOSS_SUMMON = {}; for (const k in SDEF) if (!BOSS_SUMMON[SDEF[k].boss]) BOSS_SUMMON[SDEF[k].boss] = SDEF[k].summon;
const P6T = () => PT().p6;
const MV = { dx: 0, dy: 0, spd: 0 };
function toast6(k) { if ((G.tst[k] || -99) > G.t - 6) return; G.tst[k] = G.t; toast(P6T()[k]); }
function foodPick() { const L = STAGE_FOODS[G.sid] || FOODS; return L[(Math.random() * L.length) | 0]; }
function setGround(g) { const U = RD.groundMat.uniforms; U.uG0.value = RD.tGround[G.stage]; U.uG1.value = RD.tGround[g]; G.prevStage = G.stage; G.stage = g; G.stageT = 0; }
const DAWN_L = JSON.parse(JSON.stringify(LOOKS6[12]));
function look6() {
  if (G.sid !== 'dawn') return LOOKS[G.stage];
  const k = clamp(G.t / 280, 0, 1), A = LOOKS6[12], B = SUNRISE; // the night sky turns into a sunrise over the run
  for (const key in A) DAWN_L[key] = Array.isArray(A[key]) ? A[key].map((v, i) => v + (B[key][i] - v) * k) : A[key] + (B[key] - A[key]) * k;
  return DAWN_L;
}
function eraDef(i, lap) {
  const E = ERAS[i], boss = E.boss[(lap - 1) % E.boss.length];
  return { g: E.g, song: E.song, boss, summon: BOSS_SUMMON[boss] || 'pumpk', waves: E.mix(300).map(w => w[0]).slice(0, 3), mix: t => E.mix(Math.min(300, t - G.eraT0 + 60)) };
}
function newGame6(ch) {
  const p = G.p;
  Object.assign(G, { discs: [], rockets: [], hearts: [], cuts: [], paraA: 0, paraP: [], beatN: 0, chakaN: 0, grabT: 0, drowsyT: 0, usaT: 0, kzT: 0, nurseT: 0, slowT: 0, frzT: 0, emoT: 0, emo: -1, cherryT: 0,
    hamN: 0, hamDone: 0, cardN: 0, nextCard: 30, misN: 0, misOk: 0, mis: null, nextMis: 30, rail: null, helpT: 20, gtMul: 1, dodge: 0, tst: {}, road: G.sid === 'road', night: 0, flashCd: 0 });
  if (ch === 'dj') { G.weapons = { ttable: 1 }; G.cdMul *= 0.88; p.maxHp = 85; }
  else if (ch === 'amaroli') G.weapons = { berry: 1, para: 2 };
  else if (ch === 'waroli') { G.weapons = { berry: 1, para: 2 }; p.maxHp = 110; p.speed *= 0.95; }
  else if (ch === 'machi') G.weapons = { koma: 1 };
  else if (ch === 'ekicho') p.magnet *= 1.6;
  else if (ch === 'redgt') { G.weapons = { berry: 1, guitar: 1 }; G.gtMul = 1.25; }
  else if (ch === 'kumicho') G.weapons = { chaka: 1 };
  else if (ch === 'sapphire') { p.maxHp = 70; p.hitR = 5; p.sc = 0.9; G.dodge = 0.2; }
  if (G.road) { G.endless = true; G.waves = { 60: 1, 150: 1, 240: 1 }; G.eraN = 0; G.lap = 1; G.eraT0 = 0; G.rw = {}; G.D = eraDef(0, 1); G.eliteWaveT = WIN_T; G.towelAt = 0; G.nextBoss = 100; }
}
// per-frame stage logic
function tick6(dt) {
  const p = G.p, pt = P6T();
  for (const k of ['usaT', 'kzT', 'nurseT', 'slowT', 'frzT', 'emoT', 'cherryT']) if (G[k] > 0) { G[k] -= dt; if (G[k] <= 0) { if (k === 'cherryT') heal(20); if (k === 'emoT') G.emo = -1; } }
  if (G.nurseT > 0 && p.hp > 0) p.hp = Math.min(p.maxHp, p.hp + 2 * dt);
  if (G.char === 'kumicho' && (G.helpT -= dt) <= 0) { // 好成員 come to help
    G.helpT = 20; const r = 90 * G.area; aoe(p.x, p.y, r, 30 + G.lvl * 2, 160); G.rings.push({ x: p.x, y: p.y, r, life: 0.5, max: 0.5, col: 2 }); toast6('help'); Snd.fx.lariat();
    burst(p.x, p.y, [0x3a3a5a, 0xffffff, 0xffd94a], 20, 110, 1.4, 12);
  }
  if (G.sid === 'runway' && !G.night && G.t >= 150) { G.night = 1; setGround(SDEF.runway.night); banner(pt.ragNight, 'stage'); }
  if (G.sid === 'dawn' && G.cardN < 5 && G.t >= G.nextCard) { G.cardN++; G.nextCard += 45; const a = Math.random() * TAU; G.items.push({ x: p.x + Math.cos(a) * 100, y: p.y + Math.sin(a) * 70, k: 'hamcard' }); }
  if (G.sid === 'okinawa') { // timed missions
    if (!G.mis && G.misN < 5 && G.t >= G.nextMis) { const n = 20 + 6 * G.misN; G.misN++; G.mis = { n, k: 0, k0: G.kills, end: G.t + 20 }; banner(pt.mission.replace('{s}', 20).replace('{n}', n), 'stage'); Snd.fx.warn(); }
    if (G.mis) {
      G.mis.k = G.kills - G.mis.k0;
      if (G.mis.k >= G.mis.n) { G.picked += 30; G.misOk++; banner(pt.missionOk, 'stage'); Snd.fx.chest(); if (G.misOk >= 3) achNote('mission3'); G.mis = null; G.nextMis = G.t + 25; }
      else if (G.t >= G.mis.end) { toast(pt.missionNg); G.mis = null; G.nextMis = G.t + 25; }
    }
  }
  if (G.road) road6();
}
function road6() {
  const p = G.p, pt = P6T(), era = Math.floor(G.t / 300), i = era % 6, lap = Math.floor(era / 6) + 1;
  if (era !== G.eraN) {
    G.eraN = era; G.lap = lap; G.eraT0 = era * 300; G.D = eraDef(i, lap); G.rw = {};
    if (G.stage !== G.D.g) setGround(G.D.g); if (!G.boss) Snd.playSong(G.D.song);
    banner(pt.eraBanner.replace('{n}', lap).replace('{e}', pt.era[i]), 'stage'); if (lap >= 2) achNote('loop2');
    if (i === 2) G.towelAt = G.eraT0 + 120; // the towel comes once per loop
  }
  const lt = G.t - G.eraT0;
  for (const wt of [60, 150, 240]) if (!G.rw[wt] && lt >= wt) {
    G.rw[wt] = 1; banner(PT().st.road.wave);
    const type = G.D.waves[[60, 150, 240].indexOf(wt)], n = makeRoom(Math.round(32 * G.df.dens));
    for (let k = 0; k < n; k++) { const a = k / n * TAU; spawnEnemy(type, p.x + Math.cos(a) * RD.viewW * 0.45, p.y + Math.sin(a) * RD.viewH * 0.42); }
  }
  if (G.towelAt && G.t >= G.towelAt) { G.towelAt = 0; const a = Math.random() * TAU; G.items.push({ x: p.x + Math.cos(a) * 100, y: p.y + Math.sin(a) * 70, k: 'towel' }); }
  if (!G.clrRoad && G.t >= WIN_T) { G.clrRoad = 1; achNote('clearRoad'); }
  if (!G.enc && G.t >= 1200) { G.enc = 1; banner(pt.encore, 'stage'); achNote('encore'); burst(p.x, p.y, [0xffd94a, 0xffffff, 0xff7eb6, 0x6ec3ff], 60, 160, 1.6, 20); Snd.fx.cheat(); }
}
const geireki = () => G.t >= 1200 ? P6T().geirekiInf : P6T().geireki.replace('{y}', 2007 + Math.floor(G.t / 60));
function hud6() {
  const pt = P6T(); let s = '';
  if (G.road) s = geireki() + ' · ' + pt.lap.replace('{n}', G.lap);
  else if (G.mis) s = pt.missionLeft.replace('{k}', G.mis.k).replace('{n}', G.mis.n).replace('{s}', Math.max(0, Math.ceil(G.mis.end - G.t)));
  else if (G.sid === 'dawn' && G.hamN) s = pt.hamcard.replace('{n}', Math.min(5, G.hamN));
  if (hudCache.p6 !== s) { hudCache.p6 = s; const c = $('p6chip'); c.textContent = s; c.classList.toggle('hide', !s); }
}
function mods6() {
  if (G.kzT > 0) G.dm *= 1.25;
  if (G.emo === 0) { G.dm *= 1.1; G.area = Math.min(1.4, G.area * 1.1); } else if (G.emo === 1) G.cdm *= 0.9;
}
function speed6(dt) {
  let m = 1; const p = G.p;
  if (G.grabT > 0) { G.grabT -= dt * (p.moving ? 2 : 1); m *= 0.4; }
  if (G.drowsyT > 0) { G.drowsyT -= dt; m *= 0.72; }
  if (G.usaT > 0) m *= 1.3; if (G.emo === 2) m *= 1.1;
  return m;
}
function pick6(k) {
  const p = G.p, pt = P6T(), pk = PT().pick; G.ate[k] = 1;
  if (FOOD_HP6[k]) { heal(FOOD_HP6[k]); if (k === 'cherry') { G.cherryT = 3; banner(pk.cherry); } else banner(PT().ate.replace('{n}', T().items[k][0])); return; }
  if (k === 'usamimi') { G.usaT = 8; banner(pk.usamimi); Snd.fx.heal(); }
  else if (k === 'cbelt') { G.shield = Math.max(G.shield, 5); banner(pk.cbelt); Snd.fx.freeze(); }
  else if (k === 'kanzashi') { G.kzT = 10; banner(pk.kanzashi); Snd.fx.heal(); }
  else if (k === 'ekicho') { for (const it of G.items) if (it.k === 'coin') it.pull = true; banner(pk.ekicho); Snd.fx.magnet(); G.rings.push({ x: p.x, y: p.y, r: 140, life: 0.6, max: 0.6, col: 4 }); }
  else if (k === 'nurse') { G.nurseT = 10; banner(pk.nurse); Snd.fx.heal(); }
  else if (k === 'kakigori') { G.slowT = 6; banner(pk.kakigori); Snd.fx.freeze(); }
  else if (k === 'hamcoin') { G.picked += 5; banner(pk.hamcoin); Snd.fx.coin(); }
  else if (k === 'hamcard') { G.hamN++; if (G.hamN >= 5 && !G.hamDone) { G.hamDone = 1; achNote('hamcards'); banner(pt.hamDone, 'stage'); } else if (!G.hamDone) banner(pt.hamcard.replace('{n}', G.hamN)); Snd.fx.coin(); }
  else if (k === 'kusuri') { const r = (Math.random() * 4) | 0; if (r === 0) G.usaT = 6; else if (r === 1) G.fireT = 6; else if (r === 2) G.shield = Math.max(G.shield, 3); else heal(30); banner(pt.kusuri[r]); Snd.fx.cheat(); }
  else if (k === 'emono') { G.emo = (Math.random() * 3) | 0; G.emoT = 20; banner(pt.emono[G.emo], 'stage'); Snd.fx.cheat(); }
  else if (k === 'towel') { G.frzT = 3.5; heal(20); banner(pk.towel, 'stage'); Snd.fx.cheat(); G.rings.push({ x: p.x, y: p.y, r: 200, life: 0.7, max: 0.7, col: 0 }); }
}
// foe behaviours (march / diagonal / hop / dash / guard / wind / flee / weave)
function foe6(e, dt, spd, dx, dy) {
  const b = ETYPES6[e.type], p = G.p;
  if (b.march) { if (e.mx === undefined) { e.mx = dx; e.my = dy; } dx = e.mx; dy = e.my; }
  else if (b.diag) { dx = (dx < 0 ? -1 : 1) * 0.707; dy = (dy < 0 ? -1 : 1) * 0.707; }
  if (b.hop) { const c = ((G.t + e.ph) % 1.1) / 1.1; spd *= c < 0.45 ? 2.3 : 0.15; e.hopH = c < 0.45 ? Math.sin(c / 0.45 * Math.PI) * 14 : 0; }
  if (b.dash) spd *= Math.sin(G.t * 2.2 + e.ph * 3) > 0.55 ? 3 : 0.6;
  if (b.guard && G.boss && G.boss.hp > 0 && Math.hypot(p.x - e.x, p.y - e.y) > 60) { const a = G.t * 0.9 + e.ph * 2, gx = G.boss.x + Math.cos(a) * 44 - e.x, gy = G.boss.y + Math.sin(a) * 34 - e.y, gd = Math.hypot(gx, gy) || 1; dx = gx / gd; dy = gy / gd; spd *= Math.min(2.5, gd / 20); }
  if (b.wind) { const wx = p.x - e.x, wy = p.y - e.y, d = Math.hypot(wx, wy) || 1; if (d < 70) { p.x += wx / d * 26 * dt; p.y += wy / d * 26 * dt; } }
  if (e.flee > 0) { e.flee -= dt; dx = -dx; dy = -dy; spd *= 1.5; }
  if (Z6.has(e.type)) { const w = Math.sin(G.t * 5 + e.ph) * 0.8, ndx = dx - dy * w, ndy = dy + dx * w; dx = ndx; dy = ndy; }
  MV.dx = dx; MV.dy = dy; return spd;
}
function touch6(e) {
  const p = G.p, b = ETYPES6[e.type]; if (p.inv > 0 || p.dashT > 0 || G.shield > 0) return;
  if (b.grab && G.grabT <= 0) { G.grabT = 1.0; toast6('grab'); }
  if (b.drowsy) { if (G.drowsyT <= 0) toast6('drowsy'); G.drowsyT = 1.6; }
  if (b.thief && !e.stole && G.picked > 0) { const n = Math.min(5, G.picked); G.picked -= n; e.stole = n; e.flee = 2.5; toast6('thief'); }
}
// bosses
function guards6(e) { for (const [k, a] of [['kin', 0], ['gin', Math.PI]]) { const g = spawnEnemy(k, e.x + Math.cos(a) * 44, e.y + Math.sin(a) * 34); g.ph = a / 2; } e.guardT = 30; toast6('guard'); }
function bossSpawn6(e) {
  if (e.type === 'shisaA') { const b = spawnEnemy('shisaB', e.x + 60, e.y); Object.assign(b, { mode: 'chase', mt: 4.5, summon: 9, atk: 4, twin: e }); e.twin = b; }
  else if (e.type === 'oushou') guards6(e);
}
function addTwinBoss() { const [x2, y2] = ringPos(10), b2 = spawnEnemy(G.D.boss, x2, y2); Object.assign(b2, { mode: 'chase', mt: 4.5, summon: 9, atk: 4.5, twin: G.boss }); G.boss.twin = b2; }
function twinDown6(e) { // one シーサー down: the other carries the boss bar
  const o = e.twin; o.twin = null; if (G.boss === e) G.boss = o;
  burst(e.x, e.y, partCol(e.type), 50, 140, 1.5, 18); fxAdd('poof', e.x, e.y, { life: 0.7, max: 0.7, size: 100 }); Snd.fx.boom(); G.shake = 8;
  for (let i = 0; i < 10; i++) dropGem(e.x + rnd(-40, 40), e.y + rnd(-30, 30), 10);
  G.items.push({ x: e.x, y: e.y, k: 'oyaki' });
}
// returns true when it moved the boss itself this frame (MV holds the move)
function bossTick6(e, dt, dx, dy) {
  if (e.type === 'oushou') { e.guarded = G.enemies.some(o => o.hp > 0 && (o.type === 'kin' || o.type === 'gin')); if (!e.guarded && (e.guardT -= dt) <= 0) guards6(e); }
  else if (e.type === 'sushim') { const k = e.hp / e.maxHp; while ((e.split || 0) < 3 && k < [0.75, 0.5, 0.25][e.split || 0]) { e.split = (e.split || 0) + 1; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; spawnEnemy('sushi', e.x + Math.cos(a) * 30, e.y + Math.sin(a) * 24); } toast6('split'); burst(e.x, e.y, PART_COL.sushi, 24, 100, 1.4, 12); } }
  else if (e.type === 'scroll') { const ph = Math.min(3, Math.floor((1 - e.hp / e.maxHp) * 4)); if (ph !== e.ph6) { e.ph6 = ph; banner(P6T().rules[ph], 'warn'); e.atk = Math.min(e.atk, 1); } }
  else if (e.type === 'champ') { if (e.mode === 'dash' && e.mt <= 0 && (e.rope = (e.rope || 0) + 1) % 3) { e.mt = 0.45; e.ddx = dx; e.ddy = dy; G.shake = Math.max(G.shake, 4); burst(e.x, e.y, [0xffd040, 0xffffff], 14, 90, 1.2, 10); Snd.fx.drum(); } }
  else if (e.type === 'loco') return loco6(e, dt);
  return false;
}
function loco6(e, dt) { // the locomotive leaves the screen, then charges along a rail with a warning band
  const p = G.p;
  if (!e.rail) {
    if (e.mode !== 'chase' || e.mt > 0) return false;
    e.rail = 1; e.rt = 1.3; e.dir = Math.random() < 0.5 ? 1 : -1; e.y = p.y; e.x = p.x - e.dir * RD.viewW * 0.62; G.rail = { y: e.y }; toast6('rail'); Snd.fx.warn();
  }
  MV.dx = e.dir; MV.dy = 0; e.face = e.dir;
  if (e.rail === 1) { MV.spd = 0; if ((e.rt -= dt) <= 0) { e.rail = 2; e.rt = RD.viewW * 1.3 / 330; } }
  else { MV.spd = 330; if (Math.random() < 0.7) G.parts.push({ x: e.x - e.dir * 20, y: e.y, h: 30, vx: -e.dir * 20, vy: 0, vh: 30, life: 0.7, max: 0.7, c: [0.85, 0.85, 0.9], s: 1.6, em: 0 }); if ((e.rt -= dt) <= 0) { e.rail = 0; G.rail = null; e.mode = 'chase'; e.mt = 4.5; } }
  return true;
}
function bossAtk6(e, a0) {
  const ring = (k, n, sp, dmg, off) => { for (let i = 0; i < n; i++) { const a = a0 + (off || 0) + i / n * TAU; G.ebul.push({ k, x: e.x + Math.cos(a) * e.r, y: e.y + Math.sin(a) * e.r, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 3.4, dmg }); } };
  const fan = (k, n, gap, sp, dmg) => { for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * gap; G.ebul.push({ k, x: e.x + Math.cos(a) * e.r, y: e.y + Math.sin(a) * e.r, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 3, dmg }); } };
  const odd = (e.n6 = (e.n6 || 0) + 1) % 2;
  switch (e.type) {
    case 'woofer': if (odd) { e.atk = 3.4; G.hazards.push({ x: e.x, y: e.y, r: 12, max: 200, spd: 92, dmg: 6, hit: false }); Snd.fx.drum(); G.shake = Math.max(G.shake, 3); } else { e.atk = 3; ring('vinyl', 10, 80, 7); Snd.fx.shoot(); } break;
    case 'msew': if (odd) { e.atk = 2.6; for (let i = 0; i < 6; i++) G.ebul.push({ k: 'thread', x: e.x, y: e.y, vx: Math.cos(a0) * (70 + i * 14), vy: Math.sin(a0) * (70 + i * 14), life: 3.4, dmg: 6 }); } else { e.atk = 3.2; ring('thimble', 10, 78, 7); } Snd.fx.shoot(); break;
    case 'champ': e.atk = 3.6; G.hazards.push({ x: e.x, y: e.y, r: 10, max: 120, spd: 100, dmg: 7, hit: false }); G.shake = Math.max(G.shake, 6); Snd.fx.drum(); burst(e.x, e.y, [0xffd040, 0xffffff, 0xd8303a], 20, 110, 1.2, 4); break;
    case 'nabe': if (odd) { e.atk = 3; ring('misob', 12, 70, 7, G.t); } else { e.atk = 3.6; fan('steam', 5, 0.25, 90, 6); } Snd.fx.bubble(); break;
    case 'oushou': { e.atk = 4.2; const px = -Math.sin(a0), py = Math.cos(a0); for (let i = -3; i <= 3; i++) { const f = spawnEnemy('fu', e.x + px * i * 16 + Math.cos(a0) * 20, e.y + py * i * 16 + Math.sin(a0) * 20); f.mx = Math.cos(a0); f.my = Math.sin(a0); } Snd.fx.horse(); break; }
    case 'loco': if (e.rail) { e.atk = 0.5; break; } e.atk = 3.2; fan('steam', 5, 0.3, 95, 7); Snd.fx.boom(); break;
    case 'sushim': e.atk = 2.8; fan('rice', 7, 0.18, 110, 7); Snd.fx.shoot(); break;
    case 'shisaA': e.atk = 2.6; fan('wave', 3, 0.3, 105, 8); Snd.fx.bubble(); break;
    case 'shisaB': if (odd) { e.atk = 3.8; G.hazards.push({ x: e.x, y: e.y, r: 12, max: 170, spd: 80, dmg: 6, hit: false }); } else { e.atk = 4.4; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; spawnEnemy('tfish', e.x + Math.cos(a) * 30, e.y + Math.sin(a) * 24); } } Snd.fx.mic(); break;
    case 'scroll': { const ph = e.ph6 || 0;
      if (ph === 0) { e.atk = 2.8; fan('yakib', 7, 0.2, 100, 7); }
      else if (ph === 1) { e.atk = 3; for (let i = 0; i < 12; i++) { const a = a0 + i / 12 * TAU; G.ebul.push({ k: 'kana' + (i % 4), x: e.x, y: e.y, vx: Math.cos(a) * 82, vy: Math.sin(a) * 82, life: 3.4, dmg: 7 }); } }
      else if (ph === 2) { e.atk = 4.2; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; spawnEnemy(k < 2 ? 'uragiri' : 'kobun', e.x + Math.cos(a) * 36, e.y + Math.sin(a) * 28); } }
      else { e.atk = 2.2; ring(odd ? 'yakib' : 'misob', 14, 95, 7, G.t); }
      Snd.fx.shoot(); break; }
    default: e.atk = 99;
  }
}
// the seven new weapons
function fireP6(dt) {
  const p = G.p, ws = G.weapons, cdm = G.cdm, area = G.area;
  for (const id of NEW_W) {
    const l = ws[id]; if (!l || id === 'para') continue;
    G.cd[id] = (G.cd[id] ?? 0.5) - dt; if (G.cd[id] > 0) continue;
    const s = W[id](l), ev = G.evo[id];
    if (id === 'ttable') { // records fly out and come back (evolved: four around, a DOON every 4th beat)
      G.cd[id] = (ev ? 1.6 : s.cd) * cdm; const n = ev ? 4 : s.n, tg = nearest(p.x, p.y, 220), a0 = tg ? Math.atan2(tg.y - p.y, tg.x - p.x) : (p.face > 0 ? 0 : Math.PI);
      for (let i = 0; i < n; i++) { const a = a0 + (ev ? i / n * TAU : (i - (n - 1) / 2) * 0.5); G.discs.push({ x: p.x, y: p.y, a, t: 0, T: 1.1, d: 120 * area, dmg: s.dmg * (ev ? 1.2 : 1), id: G.swId++, ev }); }
      if (ev && ++G.beatN % 4 === 0) { const R0 = 95 * area; G.rings.push({ x: p.x, y: p.y, r: R0, life: 0.5, max: 0.5, col: 2 }); aoe(p.x, p.y, R0, 30, 120); Snd.fx.drum(); }
      Snd.fx.shoot();
    } else if (id === 'hlock') { // hug the nearest foe: a heart burst
      const cand = []; query(p.x, p.y, 90, e => { cand.push(e); });
      if (!cand.length) { G.cd[id] = 0.3; continue; }
      G.cd[id] = s.cd * cdm; cand.sort((a, b) => ((a.x - p.x) ** 2 + (a.y - p.y) ** 2) - ((b.x - p.x) ** 2 + (b.y - p.y) ** 2));
      for (const e of cand.slice(0, ev ? 3 : 1)) { const x = e.x, y = e.y, r = s.r * area; hurtEnemy(e, s.dmg * (ev ? 1.2 : 1), 0, 0); aoe(x, y, r, s.dmg * 0.35, 150); G.hearts.push({ x, y, r, life: 0.5, max: 0.5 }); if (ev) query(x, y, r * 1.6, o => { if (!o.boss) o.conf = Math.max(o.conf, 1); }); }
      Snd.fx.lariat();
    } else if (id === 'koma') { // shogi pieces thrown all around (evolved: 8 that home in)
      G.cd[id] = s.cd * cdm; const n = ev ? 8 : s.n, a0 = G.t * 1.3;
      for (let i = 0; i < n; i++) { const a = a0 + i / n * TAU; G.projs.push({ k: 'koma', x: p.x, y: p.y, vx: Math.cos(a) * 190, vy: Math.sin(a) * 190, dmg: s.dmg, pierce: ev ? 3 : 1, life: 1.2, hit: null, home: ev ? 1 : 0 }); }
      Snd.fx.shoot();
    } else if (id === 'whis') { // a whistle blast: pushes back and slows (evolved: all around)
      const tg = nearest(p.x, p.y, 200), a = tg ? Math.atan2(tg.y - p.y, tg.x - p.x) : (p.face > 0 ? 0 : Math.PI), len = (ev ? 115 : s.len) * area, ang = ev ? Math.PI : s.ang, dmg = s.dmg * (ev ? 1.3 : 1);
      G.cd[id] = (ev ? 1.5 : s.cd) * cdm; G.gusts.push({ x: p.x, y: p.y, a, len, ang, life: 0.4, max: 0.4, big: ev });
      query(p.x, p.y, len + 12, e => { const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1; if (d > len + e.r) return; let da = Math.abs(Math.atan2(dy, dx) - a); if (da > Math.PI) da = TAU - da; if (da < ang) { hurtEnemy(e, dmg, dx / d * 160, dy / d * 160); e.slow = Math.max(e.slow || 0, 1.2); } });
      Snd.fx.mic();
    } else if (id === 'syr') { // homing rockets that pop
      G.cd[id] = s.cd * cdm; const n = ev ? 6 : s.n;
      for (let i = 0; i < n; i++) { const a = rnd(0, TAU); G.rockets.push({ x: p.x, y: p.y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, life: 2.2, dmg: s.dmg, r: (ev ? 30 : s.r) * area, tg: randomVisibleEnemy(), ev }); }
      Snd.fx.shoot();
    } else if (id === 'chaka') { // water pistol and blade in turns (evolved: both at once)
      G.cd[id] = s.cd * cdm; const mode = ev ? 3 : (G.chakaN++ % 2) + 1;
      if (mode & 1) { const tg = nearest(p.x, p.y, 240), a = tg ? Math.atan2(tg.y - p.y, tg.x - p.x) : (p.face > 0 ? 0 : Math.PI); for (const da of ev ? [-0.12, 0, 0.12] : [0]) G.projs.push({ k: 'drop', x: p.x, y: p.y, vx: Math.cos(a + da) * 240, vy: Math.sin(a + da) * 240, dmg: s.dmg, pierce: 2, life: 1.0, hit: null }); Snd.fx.bubble(); }
      if (mode & 2) { const len = s.len * area * (ev ? 1.4 : 1); for (const f of [p.face, -p.face]) { G.cuts.push({ x: p.x, y: p.y, face: f, len, life: 0.28, max: 0.28 }); query(p.x + f * len / 2, p.y, len / 2 + 14, e => { const ex = (e.x - p.x) * f; if (ex > -6 && ex < len + e.r && Math.abs(e.y - p.y) < 16 + e.r) hurtEnemy(e, s.dmg * 1.2, f * 150, 0); }); } Snd.fx.dash(); }
    }
  }
  // lace parasols orbit and push (evolved: three, and a spray of cards)
  G.paraP.length = 0; const pl = ws.para;
  if (pl) {
    const s = W.para(pl), ev = G.evo.para, n = ev ? 3 : s.n, r = s.r * (ev ? 1.15 : 1); G.paraA += dt * (ev ? 3.2 : 2.2);
    for (let i = 0; i < n; i++) { const a = G.paraA + i / n * TAU, x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r * 0.8; G.paraP.push([x, y]);
      query(x, y, 18, e => { if (G.t - (e.pa || 0) > 0.35 && Math.hypot(e.x - x, e.y - y) < e.r + 11) { e.pa = G.t; hurtEnemy(e, s.dmg * (ev ? 1.3 : 1), Math.cos(a) * 220, Math.sin(a) * 220); } }); }
    if (ev && (G.cd.cards = (G.cd.cards ?? 3) - dt) <= 0) { G.cd.cards = 3 * cdm; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; G.projs.push({ k: 'trump', x: p.x, y: p.y, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, dmg: s.dmg * 1.2, pierce: 1, life: 0.9, hit: null }); } }
  }
  for (let i = G.discs.length - 1; i >= 0; i--) { // records in flight
    const d = G.discs[i]; d.t += dt; const k = d.t / d.T; if (k >= 1) { G.discs.splice(i, 1); continue; }
    const out = Math.sin(Math.PI * k) * d.d, a = d.a + (d.ev ? k * 3 : 0); d.x = p.x + Math.cos(a) * out; d.y = p.y + Math.sin(a) * out * 0.8;
    const half = k < 0.5 ? 'ds1' : 'ds2'; query(d.x, d.y, 18, e => { if (e[half] !== d.id && Math.hypot(e.x - d.x, e.y - d.y) < e.r + 8) { e[half] = d.id; hurtEnemy(e, d.dmg, Math.cos(a) * 90, Math.sin(a) * 90); } });
  }
  for (let i = G.rockets.length - 1; i >= 0; i--) { // rockets
    const r = G.rockets[i]; r.life -= dt;
    if (!r.tg || r.tg.hp <= 0) r.tg = nearest(r.x, r.y, 260);
    if (r.tg) { const a = Math.atan2(r.tg.y - r.y, r.tg.x - r.x), f = Math.min(1, dt * 4); r.vx += (Math.cos(a) * 230 - r.vx) * f; r.vy += (Math.sin(a) * 230 - r.vy) * f; }
    r.x += r.vx * dt; r.y += r.vy * dt; let boom = r.life <= 0;
    if (!boom) query(r.x, r.y, 14, e => { if (Math.hypot(e.x - r.x, e.y - r.y) < e.r + 5) { boom = true; return false; } });
    if (boom) { G.rockets.splice(i, 1); aoe(r.x, r.y, r.r, r.dmg, 110); G.rings.push({ x: r.x, y: r.y, r: r.r, life: 0.3, max: 0.3, col: 4 }); burst(r.x, r.y, [0xff7eb6, 0xffffff, 0x6ec3ff], 8, 70, 1.2, 6); if (r.ev && p.hp > 0) p.hp = Math.min(p.maxHp, p.hp + 0.25); }
  }
  for (const L of [G.hearts, G.cuts]) for (let i = L.length - 1; i >= 0; i--) { L[i].life -= dt; if (L[i].life <= 0) L.splice(i, 1); }
}
function drawP6(t) {
  const p = G.p;
  for (const d of G.discs) { RD.spr(R[d.ev ? 'discE' : 'disc'], d.x, 9, d.y, { s: 1.1, sh: 0.4, em: 0.3 }); RD.glow(0, d.x, 11, d.y, 20, 20, 0, d.ev ? [1, 0.6, 0.2] : [0.7, 0.5, 1], 0.45); }
  for (const [x, y] of G.paraP) { RD.spr(R[G.evo.para ? 'paraE' : 'para'], x, 10, y, { s: 1.1, sh: 0.5, em: 0.2 }); RD.glow(0, x, 12, y, 22, 22, 0, [1, 0.75, 0.9], 0.35); }
  for (const h of G.hearts) { const k = h.life / h.max, rr = h.r * (1.6 - k * 0.6); RD.glow(1, h.x, 0.6, h.y, rr * 2, rr * 2, 0, [1, 0.4, 0.65], k, true); RD.spr(R[G.evo.hlock ? 'hlockE' : 'hlock'], h.x, 14 + (1 - k) * 14, h.y, { s: 1.2, sh: 0, em: 0.6 }, RD.ov); }
  for (const r of G.rockets) { RD.spr(R[r.ev ? 'syrE' : 'syr'], r.x, 10, r.y, { sh: 0.4, em: 0.3, flip: r.vx < 0 }); RD.glow(0, r.x - r.vx * 0.04, 10, r.y - r.vy * 0.04, 14, 14, 0, [1, 0.7, 0.85], 0.5); }
  for (const c of G.cuts) { const k = c.life / c.max, w = c.len * Math.min(1, (1 - k) * 4); RD.spr(R.danbira, c.x + c.face * (w / 2 + 4), 9, c.y + 1, { flip: c.face < 0, sh: 0, em: 0.3 }, RD.ov); RD.glow(2, c.x + c.face * (w / 2 + 4), 9, c.y + 1, w, 16 * k, 0, [0.85, 0.95, 1], k * 0.5); }
  if (G.rail) { const a = 0.35 + 0.25 * Math.sin(t * 18); RD.glow(2, G.cam.x, 0.6, G.rail.y, RD.viewW * 1.6, 40, 0, [1, 0.85, 0.2], a, true); RD.glow(2, G.cam.x, 0.7, G.rail.y, RD.viewW * 1.6, 14, 0, [1, 0.3, 0.2], a, true); }
  if (G.frzT > 0) for (let i = 0; i < 6; i++) { const an = t * 2 + i / 6 * TAU; RD.spr(R['note' + (i % 3)], p.x + Math.cos(an) * 30, 26, p.y + Math.sin(an) * 24, { sh: 0, em: 0.7 }, RD.ov); }
  // stage ambience
  const cx = G.cam.x, cz = G.cam.y, vw = RD.viewW, vh = RD.viewH;
  if (G.sid === 'halloween' || (G.road && G.D.g === 9)) for (let i = 0; i < 4; i++) { const a = t * (0.6 + i * 0.2) + i * 1.6, x = cx + Math.cos(a) * vw * 0.3, z = cz + Math.sin(a * 1.3) * vh * 0.25; RD.glow(0, x, 0.4, z, 110, 80, 0, [[1, 0.5, 0.1], [0.6, 0.3, 1], [0.3, 1, 0.5], [1, 0.3, 0.7]][i], 0.2, true); }
  if (G.sid === 'runway' && Math.floor(t * 3) % 4 === 0) { const i = Math.floor(t * 3); RD.glow(0, cx + ((i * 97) % vw) - vw / 2, 30, cz - vh * 0.3, 60, 60, 0, [1, 1, 1], 0.25); }
  if (G.sid === 'cherry') for (let i = 0; i < 20; i++) { const x = cx - vw * 0.6 + ((i * 97.13 + t * 14 * (1 + (i % 3))) % (vw * 1.2)), z = cz - vh * 0.6 + ((i * 53.7) % (vh * 1.1)), h = 120 - ((t * (16 + (i % 5) * 3) + i * 37) % 120); RD.spr(R['petal' + (i % 3)], x + Math.sin(t * 1.5 + i) * 10, h, z, { sh: 0, em: 0.3, s: 0.5 + (i % 3) * 0.12 }, RD.ov); }
  if (G.sid === 'okinawa') for (let i = 0; i < 4; i++) { const a = t * (0.3 + i * 0.1) + i * 1.9, x = cx + Math.cos(a) * vw * 0.34, z = cz + Math.sin(a * 1.2) * vh * 0.28; RD.glow(0, x, 0.4, z, 120, 70, 0, [0.5, 0.9, 1], 0.14, true); }
  if (G.road && G.t >= 1200) for (let i = 0; i < 3; i++) { const a = t * (0.5 + i * 0.17) + i * 2.1, x = cx + Math.cos(a) * vw * 0.3, z = cz + Math.sin(a * 1.3) * vh * 0.25; RD.glow(0, x, 0.4, z, 120, 90, 0, NIGHT_COL[i], 0.22, true); }
}
const UNL6 = { clearChina: (UNL.clearChina || []).concat('stage:halloween') };
for (let i = 9; i < STAGE_IDS.length - 1; i++) { const a = 'clear' + STAGE_IDS[i][0].toUpperCase() + STAGE_IDS[i].slice(1); UNL6[a] = (UNL[a] || []).concat('stage:' + STAGE_IDS[i + 1]); }
Object.assign(UNL, UNL6);
window.__kyoka = {
  get state() { return state; }, get G() { return G; }, start: startGame, pick: i => { window.__kyokaTest = true; pick(i); },
  spawn(n, type) { for (let i = 0; i < n; i++) { const [x, y] = ringPos(Math.random() * 120); spawnEnemy(type || pickType(), x, y); } },
  get profile() { return profile; }, encode, decode, iconPNG, end(won) { if (G) endGame(won); }, pause() { setPause(true); },
  levelUp() { if (G && state === 'play') { G.pending++; openLevelUp(); } }, showOffers(ids) { if (G) { if (state === 'play') G.pending++; openLevelUp(ids); } }, setAuto(v) { if (G) G.auto = v; }, get offers() { return offers.slice(); }, lvOf: id => lvOf(id), offersFor: () => makeOffers(), chestRoll: () => chestRewards(), refreshWeps: () => refreshWeps(), step(dt) { if (state === 'play') G.cine ? cineTick(dt) : update(dt); },
  skipTo(t) { if (G) G.t = t; }, give(id) { if (!G) return; window.__kyokaTest = true; offers = [id]; state = 'levelup'; G.pending++; pick(0); },
  setProfile(p) { commitProfile(fixProfile(Object.assign(emptyProfile(), p))); validSel(); updateRec(); }, select(c, s) { sel.char = c; sel.stage = s; saveSel(); }, get sel() { return sel; },
  openShop, openZukan, openSelect, onStart, openDiff, pickDiff, setDiff(d) { sel.diff = d; saveSel(); }, DIFF, tryBuy, confirmBorrow, closeScreen, continueEndless, get screen() { return screen; }, get modal() { return modal; },
  maxWeapon(id) { if (!G) return; window.__kyokaTest = true; while ((G.weapons[id] || 0) < MAXLV[id]) this.give(id); }, evoReady: () => G && evoReady(), applyEvo: id => { applyEvo(id); refreshWeps(); },
  openChest: () => { window.__kyokaTest = true; if (G && state === 'play') openChest(); }, closeChest, get chestRw() { return chestRw; }, usePickup: k => G && usePickup(k),
  drop(k, dx, dy) { if (G) G.items.push({ x: G.p.x + (dx || 0), y: G.p.y + (dy || 0), k }); }, openCheat, submitCheat, askRefund, renderShop,
  runCode: () => G && runCode(), get savedRunCode() { try { return localStorage.getItem(RUN_KEY); } catch (e) { return null; } }, openResumeAsk, openRunCode, decodeRun, runProblem: r => runProblem(r), restoreRun, saveRun, discardRun,
  useSp: () => useSp(), fillSp() { if (G) { G.sp = 1; G.spPend = 0; } }, get spState() { return G && { sp: G.sp, spT: G.spT, spN: G.spN, cine: G.cine ? { t: G.cine.t, canSkip: G.cine.canSkip, skipped: G.cine.skipped, sparks: G.cine.sparks.length } : null }; }, skipSp: () => skipCine(),
  spawnBoss(two) { if (G) { G.nextBoss = G.t; G.bossDone = false; spawning(0); if (two && G.boss && !G.boss.twin) addTwinBoss(); return G.boss && G.boss.type; } }, killBoss() { if (G && G.boss) { G.boss.hp = 1; hurtEnemy(G.boss, 1e6, 0, 0); } }, SDEF, WEAPONS, PASSIVES, MAXLV, EVO, ACH_IDS, spentTotal: () => spentTotal(profile), has: id => hasAch(profile, id),
  RD, textAudit(l) { // UI test helper: phase-6 texts present, no placeholders, no stray kana / Japanese
    const it = I18N[l].items, st = P2[l].st, miss = [], bad = [], kana = [], strs = [];
    const add = (k, v) => { if (!v || (Array.isArray(v) && v.some(x => !x && x !== ''))) miss.push(k); else strs.push([k, [].concat(v).join(' ')]); };
    for (const k of [...NEW_W, ...NEW_W.map(w => 'evo_' + w), ...ITEM6]) add(k, it[k]);
    for (const sid of STAGE_IDS.slice(9)) { add(sid, STAGES[sid] && STAGES[sid][l]); for (const f of ['banner', 'boss', 'warn', 'down', 'wave']) add(sid + '.' + f, st[sid] && st[sid][f]); }
    for (const c in CHARS) add('char ' + c, CHARS[c][l]); for (const e of ZUKAN) add('zukan ' + e.id, e[l]); for (const id of ACH_IDS) add('ach ' + id, ACH[id] && ACH[id][l]);
    for (const [k, v] of Object.entries(P2[l].p6 || {})) add('p6 ' + k, v);
    const KEEP = /きょん式ハートロック|ギュッとハートロック|ハートロック|きょんカフェ|次世代司会ユニット|熱唱タオル|漆黒のブルーサファイア|くみちょー|ハムら市|ハムナンバーカード|ハムコイン|キョウカのエモノ|エモノ|チャカ|ダンビラ|きょうみお|亨香組|鉄の掟|千客万来|一生家族|サランへヨ|おでかけきょん|キョンレンジャー|ドレスきょん|ゴスロリきょん|みちづれ|おはやう|おやき|はんぺん|きょん|[^\s]*きょん|タオル|式/g;
    for (const [k, v] of strs) { if (/undefined|NaN|\[object/.test(v)) bad.push(k); const x = v.replace(KEEP, '');
      if (l === 'zh' && /[\u3040-\u30ff]/.test(x) && (k.startsWith('p6') || NEW_W.some(w => k.endsWith(w)) || ITEM6.has(k) || STAGE_IDS.slice(9).some(s => k.startsWith(s)))) kana.push(k + ': ' + v.slice(0, 40));
      if (l === 'en' && /[\u3040-\u30ff]/.test(x) && (k.startsWith('p6') || NEW_W.some(w => k.endsWith(w)) || ITEM6.has(k) || STAGE_IDS.slice(9).some(s => k.startsWith(s)))) kana.push(k + ': ' + v.slice(0, 40)); }
    return { missing: miss, bad, kana, zukan: ZUKAN.length, zukanOpen: ZUKAN.filter(e => zukanOpen(profile, e)).length, ach: ACH_IDS.length, achHave: ACH_IDS.filter(id => hasAch(profile, id)).length };
  }
};
// an unfinished run from last time: ask whether to continue it
openResumeAsk();
