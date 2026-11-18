// Fills the generated tables in docs/save-code*.md from the real layouts in src/save.js and src/runcode.js.
// Usage: node tools/gen-save-docs.mjs          (rewrite the tables)
//        node tools/gen-save-docs.mjs --check  (exit 1 if a table is out of date; part of npm test)
import { readFileSync, writeFileSync } from 'fs';
import { SAVE_LAYOUT as S, UPG_MAX, CHEAT_IDS, ACH_IDS, ACH_MAIN, DIFFS, STAGE_IDS, OLD_LENS, CODE_LEN } from '../src/save.js';
import { RUN_LAYOUT as RL, RC_STAGES, RC_CHARS, RC_WEAPONS, RC_PASSIVES, RC_BOOSTS } from '../src/runcode.js';
const ROOT = decodeURI(new URL('..', import.meta.url).pathname);
const FILES = { ja: 'docs/save-code.md', zh: 'docs/save-code.zh-TW.md', en: 'docs/save-code.en.md' };

// meaning of each field, per language ({id} = the part after the prefix, {max} = largest stored value)
const M = {
  ja: { head: ['#', 'フィールド', 'ビット', '開始ビット', 'いみ'], headOld: ['版', '文字数', 'データビット', 'CRC', 'ないよう'], headRun: ['#', 'フィールド', 'ビット', 'いみ'],
    ver: '版の番号（v8 は 0。版は 文字数で 見分ける）', lang: '言語 0=ja 1=zh 2=en', bestLevel: 'さいこう レベル（最大 {max}）', clears: 'クリア回数（最大 {max}）', coins: 'いちごコイン（最大 99999）', debt: 'しゃっきん（最大 300）',
    u_: 'おみせ「{id}」の レベル（最大 {umax}）', ach: 'じっせき 0〜51 の ビット', ach2: 'じっせき 52〜 の ビット', cheats: 'つかった ひみつのコード（ビット）', iday: 'いちごを さいごに つかった 日（1 = 2026-01-01）', boost: 'つぎの ゲームを ぶき ぜんぶ MAX で はじめる（kyonkyon）', diff: 'さいごに えらんだ むずかしさ 0〜3',
    t_: '「{id}」の ベスト時間 ÷ 5びょう（最大 {max}）', k_: '「{id}」の ベスト撃破数 ÷ 20（最大 {max}）', dclr: 'ステージごとの クリアした いちばん むずかしい レベル（5進数で つめる、0 = なし）',
    r: { ver: '版の番号（いま {ver}。2 ビットなので v4 は 0 で しまう）', id: 'この ゲームの ID（1〜65535）', stage: 'ステージ番号', char: 'キャラ番号', diff: 'むずかしさ 0〜3', endless: 'むげんモード', cleared: '5分 クリアずみ', boosted: 'ぶき ぜんぶ MAX で はじまった（kyonkyon）', bossAlive: 'ボスが いた', t: 'けいか時間（びょう）', lvl: 'レベル', xp: 'つぎの レベルまでの けいけんち ×31', hp: 'HP の わりあい ×63', pending: 'まだ えらんでいない レベルアップ', kills: 'たおした数', picked: 'ひろった コイン', banked: 'もう もらった コイン', bossKills: 'たおした ボス', nextBoss: 'つぎの ボスの 時間', revives: 'ふっかつ回数', hamN: 'ハムナンバーカード（あかつき）', misN: 'ミッション数（沖縄）', misOk: 'せいこうした ミッション' } },
  zh: { head: ['#', '欄位', '位元', '起始位元', '意義'], headOld: ['版本', '字數', '資料位元', 'CRC', '內容'], headRun: ['#', '欄位', '位元', '意義'],
    ver: '版本號（v8 存成 0，版本靠字數區分）', lang: '語言 0=ja 1=zh 2=en', bestLevel: '最高等級（最多 {max}）', clears: '過關次數（最多 {max}）', coins: '草莓幣（最多 99999）', debt: '欠款（最多 300）',
    u_: '商店「{id}」的等級（最多 {umax}）', ach: '成就 0–51 的位元', ach2: '成就 52 以後的位元', cheats: '用過的秘密密碼（位元）', iday: '最後一次用 ichigo 的日期（1 = 2026-01-01）', boost: '下一場以全部武器滿級開始（kyonkyon）', diff: '上次選的難度 0–3',
    t_: '「{id}」最佳時間 ÷ 5 秒（最多 {max}）', k_: '「{id}」最佳擊倒數 ÷ 20（最多 {max}）', dclr: '每關通過的最高難度（以 5 進位打包，0 = 未通過）',
    r: { ver: '版本號（目前 {ver}；只有 2 位元，v4 存成 0）', id: '這一場的 ID（1–65535）', stage: '關卡編號', char: '角色編號', diff: '難度 0–3', endless: '無盡模式', cleared: '已撐過 5 分鐘', boosted: '以全部武器滿級開始（kyonkyon）', bossAlive: '當時有 Boss', t: '經過時間（秒）', lvl: '等級', xp: '到下一級的經驗值 ×31', hp: 'HP 比例 ×63', pending: '還沒選的升級', kills: '擊倒數', picked: '撿到的草莓幣', banked: '已經入帳的草莓幣', bossKills: '打倒的 Boss', nextBoss: '下一隻 Boss 的時間', revives: '復活次數', hamN: 'ハムナンバーカード（拂曉）', misN: '任務數（沖繩）', misOk: '成功的任務' } },
  en: { head: ['#', 'Field', 'Bits', 'Start bit', 'Meaning'], headOld: ['Version', 'Chars', 'Data bits', 'CRC', 'Contents'], headRun: ['#', 'Field', 'Bits', 'Meaning'],
    ver: 'version number (v8 stores 0; versions are told apart by length)', lang: 'language 0=ja 1=zh 2=en', bestLevel: 'best level (max {max})', clears: 'number of clears (max {max})', coins: 'strawberry coins (max 99999)', debt: 'debt (max 300)',
    u_: 'shop upgrade "{id}" level (max {umax})', ach: 'achievement bits 0–51', ach2: 'achievement bits 52+', cheats: 'secret words used (bits)', iday: 'day ichigo was last used (1 = 2026-01-01)', boost: 'next run starts with every weapon maxed (kyonkyon)', diff: 'last chosen difficulty 0–3',
    t_: 'best time on "{id}" ÷ 5 s (max {max})', k_: 'best kills on "{id}" ÷ 20 (max {max})', dclr: 'hardest difficulty cleared per stage (packed in base 5, 0 = none)',
    r: { ver: 'version number (now {ver}; 2 bits, so v4 is stored as 0)', id: 'run id (1–65535)', stage: 'stage index', char: 'character index', diff: 'difficulty 0–3', endless: 'endless mode', cleared: '5-minute clear done', boosted: 'started with every weapon maxed (kyonkyon)', bossAlive: 'a boss was alive', t: 'elapsed time (s)', lvl: 'level', xp: 'XP toward the next level ×31', hp: 'HP fraction ×63', pending: 'level-ups not chosen yet', kills: 'kills', picked: 'coins picked up', banked: 'coins already banked', bossKills: 'bosses defeated', nextBoss: 'time of the next boss', revives: 'revives used', hamN: 'ハムナンバーカード count (dawn stage)', misN: 'missions (okinawa stage)', misOk: 'missions passed' } }
};
const row = a => '| ' + a.join(' | ') + ' |';
const table = (head, rows) => [row(head), row(head.map(() => '---')), ...rows.map(row)].join('\n');
const code = s => '`' + s + '`';

function meaning(L, k, w) {
  const max = 2 ** w - 1, m = M[L];
  for (const p of ['u_', 't_', 'k_']) if (k.startsWith(p)) { const id = k.slice(2); return m[p].replace('{id}', id).replace('{max}', max).replace('{umax}', UPG_MAX[id]); }
  return (m[k] || k).replace('{max}', max);
}
const BLOCKS = {
  v8: L => { let at = 0; return table(M[L].head, S.fmt[8].fields.map(([k, w], i) => { const r = [i + 1, code(k), w, at, meaning(L, k, w)]; at += w; return r; })) + `\n\n**${S.fmt[8].data}** data bits + CRC-${S.crcBits} = ${S.fmt[8].data + S.crcBits} bits → ${S.fmt[8].len} chars.`; },
  old: L => {
    const n = { ja: (st, up, a) => `ステージ ${st}、おみせ ${up}、じっせき ${a} ビット`, zh: (st, up, a) => `${st} 關、商店 ${up} 項、成就 ${a} 位元`, en: (st, up, a) => `${st} stages, ${up} shop items, ${a} achievement bits` }[L];
    const achBits = f => f.fields.filter(([k]) => k === 'ach' || k === 'ach2').reduce((a, x) => a + x[1], 0);
    const rows = [8, 7, 6, 5, 4].map(v => { const f = S.fmt[v]; return ['v' + v, f.len, f.data, S.crcBits, n(f.stages.length, f.upg.length, achBits(f))]; });
    const fx = (f, st, up) => n(st, up, f.fields.find(([k]) => k === 'ach')[1]);
    rows.push(['v3', S.v3.len, S.v3.data, S.crcBits, fx(S.v3, 7, 10)], ['v2', S.v2.len, S.v2.data, S.crcBits, { ja: 'きろく・コイン・おみせ 8こ・じっせき 24 ビット', zh: '紀錄、草莓幣、商店 8 項、成就 24 位元', en: 'records, coins, 8 shop items, 24 achievement bits' }[L]],
      ['v1', S.v1.len, S.v1.data, S.v1.crcBits, { ja: 'さいしょの きろくだけ', zh: '只有最早期的紀錄', en: 'early records only' }[L]]);
    return table(M[L].headOld, rows);
  },
  lists: L => {
    const t = { ja: ['アルファベット（31 文字）', 'ステージの じゅんばん', 'おみせの じゅんばん（u_）', 'ひみつのコード（cheats の ビット）', 'じっせき（ビット番号 = じゅんばん）', 'むずかしさ'], zh: ['字母表（31 個字）', '關卡順序', '商店順序（u_）', '秘密密碼（cheats 位元）', '成就（位元編號 = 順序）', '難度'], en: ['Alphabet (31 chars)', 'Stage order', 'Shop order (u_)', 'Secret words (cheats bits)', 'Achievements (bit index = position)', 'Difficulties'] }[L];
    return [`- ${t[0]}: ${code(S.alphabet)}`, `- ${t[1]}: ${STAGE_IDS.map(code).join(' ')}`, `- ${t[2]}: ${S.fmt[8].upg.map(k => code(k) + '≤' + UPG_MAX[k]).join(' ')}`,
      `- ${t[3]}: ${CHEAT_IDS.map((c, i) => i + '=' + code(c)).join(' ')}`, `- ${t[4]}: ${ACH_IDS.map((a, i) => (i === ACH_MAIN ? '**|** ' : '') + i + '=' + code(a)).join(' ')}`, `- ${t[5]}: ${DIFFS.map((d, i) => i + '=' + code(d)).join(' ')}`,
      `- OLD_LENS: ${OLD_LENS.join(', ')} · CODE_LEN: ${CODE_LEN}`].join('\n');
  },
  run: L => {
    const fixed = table(M[L].headRun, RL.fixed.map(([k, w], i) => [i + 1, code(k), w, M[L].r[k].replace('{ver}', RL.ver)]));
    const tail = { ja: [['ぶき フラグ', RC_WEAPONS.length + ' × 1'], ['もっている ぶきの レベル（0 = しんか）', '3 × もっている数'], ['アイテム フラグ', RC_PASSIVES.length + ' × 1'], ['アイテムの レベル', '2 × もっている数'], ['パワーアップ フラグ（v1/v2 は さいしょの 6こ）', RC_BOOSTS.length + ' × 1'], ['パワーアップの かず', RL.boostBits + ' × もっている数'], ['必殺技ゲージ 0〜100（v2〜）', RL.spBits], ['もっている ぶき→アイテムの じゅんに MAXの その先の レベル：フラグ 1、あれば レベル（v4〜、むげんモード）', '1 (+ ' + RL.overBits + ') × もっている数']],
      zh: [['武器旗標', RC_WEAPONS.length + ' × 1'], ['持有武器的等級（0 = 已進化）', '3 × 持有數'], ['道具旗標', RC_PASSIVES.length + ' × 1'], ['道具等級', '2 × 持有數'], ['強化旗標（v1/v2 只有前 6 個）', RC_BOOSTS.length + ' × 1'], ['強化次數', RL.boostBits + ' × 持有數'], ['必殺技能量 0–100（v2 起）', RL.spBits], ['依持有的武器→道具順序，滿級後的等級：旗標 1，有的話再存等級（v4 起，無盡模式）', '1 (+ ' + RL.overBits + ') × 持有數']],
      en: [['weapon flags', RC_WEAPONS.length + ' × 1'], ['level of each weapon held (0 = evolved)', '3 × held'], ['item flags', RC_PASSIVES.length + ' × 1'], ['level of each item held', '2 × held'], ['boost flags (v1/v2: the first 6)', RC_BOOSTS.length + ' × 1'], ['count of each boost held', RL.boostBits + ' × held'], ['special gauge 0–100 (v2+)', RL.spBits], ['levels past MAX for each weapon, then item, held: 1 flag bit, then the levels if set (v4+, endless)', '1 (+ ' + RL.overBits + ') × held']] }[L];
    const h = { ja: ['あとに つづく ぶぶん', 'ビット'], zh: ['後面接著的部分', '位元'], en: ['Variable part, in order', 'Bits'] }[L];
    const lists = [['RC_STAGES', RC_STAGES], ['RC_CHARS', RC_CHARS], ['RC_WEAPONS', RC_WEAPONS], ['RC_PASSIVES', RC_PASSIVES], ['RC_BOOSTS', RC_BOOSTS]].map(([n, a]) => `- ${code(n)}: ${a.map((x, i) => i + '=' + code(x)).join(' ')}`).join('\n');
    return fixed + `\n\n(${RL.fixed.reduce((a, f) => a + f[1], 0)} bits)\n\n` + table(h, tail) + '\n\n' + lists + `\n- SAVE_LENS（${{ ja: 'つづきコードには 使わない 長さ', zh: '續玩碼不會用的長度', en: 'lengths never used for resume codes' }[L]}）: ${RL.saveLens.join(', ')}`;
  }
};

const check = process.argv.includes('--check'); let stale = 0;
for (const [L, f] of Object.entries(FILES)) {
  const path = ROOT + f, src = readFileSync(path, 'utf8');
  const out = src.replace(/<!-- gen:(\w+) -->[\s\S]*?<!-- \/gen:\1 -->/g, (m, name) => { if (!BLOCKS[name]) throw new Error(`${f}: unknown block ${name}`); return `<!-- gen:${name} -->\n${BLOCKS[name](L)}\n<!-- /gen:${name} -->`; });
  if (out !== src) { stale++; if (!check) writeFileSync(path, out); }
  if (!/<!-- gen:v8 -->/.test(src)) throw new Error(f + ': no generated blocks');
}
if (check) { if (stale) { console.log(`save docs: ${stale} file(s) out of date — run node tools/gen-save-docs.mjs`); process.exitCode = 1; } else console.log('save docs: tables match the source'); }
else console.log(`save docs: ${stale} file(s) updated`);
