# How the save code and the resume code work

[日本語](save-code.md) | [繁體中文](save-code.zh-TW.md) | **English** · [Back to the README](../README.en.md)

The game has two kinds of code.

| | Save code (じゅもん) | Resume code (つづきコード) |
|---|---|---|
| Holds | Overall progress (coins, shop, achievements, stage records, …) | One unfinished run |
| Length | 104 chars now (26 groups of 4) | Depends on the content (a multiple of 4, never a save-code length) |
| Source | `src/save.js` | `src/runcode.js` (checks: `runProblem` in `src/main.js`) |

> **Important:** the game runs entirely in your browser; there is no server. Anyone who reads the source can decode or make these codes. The checksum is **only there to catch typos**. It is not an anti-cheat measure.

The tables on this page are generated straight from the source by `node tools/gen-save-docs.mjs` (`npm test` fails if they drift).

## Shared rules

- **Alphabet**: 31 characters, `23456789ABCDEFGHJKMNPQRSTUVWXYZ`. The look-alikes `0 O 1 I L` are left out.
- **Forgiving input**: before reading, the input is NFKC-normalised (full-width to half-width) and upper-cased, and spaces, dashes, long-vowel marks, middle dots and punctuation are removed (`normalize`).
- **Groups**: codes are shown in groups of 4 separated by `-`.

## Building a save code

1. Concatenate the fields in the table below, top to bottom, into one big integer (the first field is the most significant).
2. XOR with the version's fixed mask.
3. Append a CRC-12 (polynomial `0x80F`, initial value 0).
4. Multiply by the version's constant modulo `31^length`, so that a small change alters the whole code.
5. Write it in base 31 at exactly that length and split it into groups of 4.

Reading does the same steps in reverse, then checks the CRC and every value's range (`decodeFmt`).

### Telling versions apart

The version is identified by **length**. The 3-bit `ver` field holds only the low 3 bits of the version number, so v8 stores 0. Only v1 skips the multiplication and uses a CRC-10 (`0x233`).

<!-- gen:old -->
| Version | Chars | Data bits | CRC | Contents |
| --- | --- | --- | --- | --- |
| v8 | 104 | 491 | 12 | 19 stages, 19 shop items, 82 achievement bits |
| v7 | 92 | 439 | 12 | 19 stages, 19 shop items, 82 achievement bits |
| v6 | 84 | 400 | 12 | 19 stages, 10 shop items, 82 achievement bits |
| v5 | 60 | 276 | 12 | 9 stages, 10 shop items, 52 achievement bits |
| v4 | 52 | 232 | 12 | 7 stages, 10 shop items, 40 achievement bits |
| v3 | 44 | 203 | 12 | 7 stages, 10 shop items, 30 achievement bits |
| v2 | 24 | 106 | 12 | records, coins, 8 shop items, 24 achievement bits |
| v1 | 12 | 49 | 10 | early records only |
<!-- /gen:old -->

### v8 fields (104 chars)

Stage times are stored in 5 s steps and kills in steps of 20 (a value above 0 never rounds down to 0). Times have 9 bits, so up to 42:35. The 10 newer stages store time only. The browser keeps the exact, unrounded records.

<!-- gen:v8 -->
| # | Field | Bits | Start bit | Meaning |
| --- | --- | --- | --- | --- |
| 1 | `ver` | 3 | 0 | version number (v8 stores 0; versions are told apart by length) |
| 2 | `lang` | 2 | 3 | language 0=ja 1=zh 2=en |
| 3 | `bestLevel` | 7 | 5 | best level (max 127) |
| 4 | `clears` | 8 | 12 | number of clears (max 255) |
| 5 | `coins` | 17 | 20 | strawberry coins (max 99999) |
| 6 | `debt` | 9 | 37 | debt (max 300) |
| 7 | `u_panier` | 2 | 46 | shop upgrade "panier" level (max 3) |
| 8 | `u_shodo` | 3 | 48 | shop upgrade "shodo" level (max 5) |
| 9 | `u_drumbeat` | 2 | 51 | shop upgrade "drumbeat" level (max 2) |
| 10 | `u_magnet` | 2 | 53 | shop upgrade "magnet" level (max 2) |
| 11 | `u_toys` | 2 | 55 | shop upgrade "toys" level (max 3) |
| 12 | `u_domino` | 2 | 57 | shop upgrade "domino" level (max 3) |
| 13 | `u_ohayo` | 2 | 59 | shop upgrade "ohayo" level (max 2) |
| 14 | `u_michi` | 1 | 61 | shop upgrade "michi" level (max 1) |
| 15 | `u_hanpen` | 2 | 62 | shop upgrade "hanpen" level (max 3) |
| 16 | `u_lucky` | 2 | 64 | shop upgrade "lucky" level (max 2) |
| 17 | `u_cafe` | 2 | 66 | shop upgrade "cafe" level (max 3) |
| 18 | `u_utowel` | 2 | 68 | shop upgrade "utowel" level (max 3) |
| 19 | `u_hcard` | 2 | 70 | shop upgrade "hcard" level (max 2) |
| 20 | `u_r_atk` | 6 | 72 | shop upgrade "r_atk" level (max 40) |
| 21 | `u_r_hp` | 6 | 78 | shop upgrade "r_hp" level (max 40) |
| 22 | `u_r_spd` | 5 | 84 | shop upgrade "r_spd" level (max 20) |
| 23 | `u_r_mag` | 5 | 89 | shop upgrade "r_mag" level (max 20) |
| 24 | `u_r_coin` | 6 | 94 | shop upgrade "r_coin" level (max 40) |
| 25 | `u_r_xp` | 5 | 100 | shop upgrade "r_xp" level (max 20) |
| 26 | `ach` | 52 | 105 | achievement bits 0–51 |
| 27 | `ach2` | 30 | 157 | achievement bits 52+ |
| 28 | `cheats` | 8 | 187 | secret words used (bits) |
| 29 | `iday` | 14 | 195 | day ichigo was last used (1 = 2026-01-01) |
| 30 | `boost` | 1 | 209 | next run starts with every weapon maxed (kyonkyon) |
| 31 | `diff` | 2 | 210 | last chosen difficulty 0–3 |
| 32 | `t_apple` | 9 | 212 | best time on "apple" ÷ 5 s (max 511) |
| 33 | `k_apple` | 7 | 221 | best kills on "apple" ÷ 20 (max 127) |
| 34 | `t_berry` | 9 | 228 | best time on "berry" ÷ 5 s (max 511) |
| 35 | `k_berry` | 7 | 237 | best kills on "berry" ÷ 20 (max 127) |
| 36 | `t_race` | 9 | 244 | best time on "race" ÷ 5 s (max 511) |
| 37 | `k_race` | 7 | 253 | best kills on "race" ÷ 20 (max 127) |
| 38 | `t_cage` | 9 | 260 | best time on "cage" ÷ 5 s (max 511) |
| 39 | `k_cage` | 7 | 269 | best kills on "cage" ÷ 20 (max 127) |
| 40 | `t_zoo` | 9 | 276 | best time on "zoo" ÷ 5 s (max 511) |
| 41 | `k_zoo` | 7 | 285 | best kills on "zoo" ÷ 20 (max 127) |
| 42 | `t_snow` | 9 | 292 | best time on "snow" ÷ 5 s (max 511) |
| 43 | `k_snow` | 7 | 301 | best kills on "snow" ÷ 20 (max 127) |
| 44 | `t_night` | 9 | 308 | best time on "night" ÷ 5 s (max 511) |
| 45 | `k_night` | 7 | 317 | best kills on "night" ÷ 20 (max 127) |
| 46 | `t_chapel` | 9 | 324 | best time on "chapel" ÷ 5 s (max 511) |
| 47 | `k_chapel` | 7 | 333 | best kills on "chapel" ÷ 20 (max 127) |
| 48 | `t_china` | 9 | 340 | best time on "china" ÷ 5 s (max 511) |
| 49 | `k_china` | 7 | 349 | best kills on "china" ÷ 20 (max 127) |
| 50 | `t_halloween` | 9 | 356 | best time on "halloween" ÷ 5 s (max 511) |
| 51 | `t_runway` | 9 | 365 | best time on "runway" ÷ 5 s (max 511) |
| 52 | `t_ring` | 9 | 374 | best time on "ring" ÷ 5 s (max 511) |
| 53 | `t_dawn` | 9 | 383 | best time on "dawn" ÷ 5 s (max 511) |
| 54 | `t_cherry` | 9 | 392 | best time on "cherry" ÷ 5 s (max 511) |
| 55 | `t_station` | 9 | 401 | best time on "station" ÷ 5 s (max 511) |
| 56 | `t_clinic` | 9 | 410 | best time on "clinic" ÷ 5 s (max 511) |
| 57 | `t_okinawa` | 9 | 419 | best time on "okinawa" ÷ 5 s (max 511) |
| 58 | `t_hq` | 9 | 428 | best time on "hq" ÷ 5 s (max 511) |
| 59 | `t_road` | 9 | 437 | best time on "road" ÷ 5 s (max 511) |
| 60 | `dclr` | 45 | 446 | hardest difficulty cleared per stage (packed in base 5, 0 = none) |

**491** data bits + CRC-12 = 503 bits → 104 chars.
<!-- /gen:v8 -->

### Lists used (their order is part of the format)

<!-- gen:lists -->
- Alphabet (31 chars): `23456789ABCDEFGHJKMNPQRSTUVWXYZ`
- Stage order: `apple` `berry` `race` `cage` `zoo` `snow` `night` `chapel` `china` `halloween` `runway` `ring` `dawn` `cherry` `station` `clinic` `okinawa` `hq` `road`
- Shop order (u_): `panier`≤3 `shodo`≤5 `drumbeat`≤2 `magnet`≤2 `toys`≤3 `domino`≤3 `ohayo`≤2 `michi`≤1 `hanpen`≤3 `lucky`≤2 `cafe`≤3 `utowel`≤3 `hcard`≤2 `r_atk`≤40 `r_hp`≤40 `r_spd`≤20 `r_mag`≤20 `r_coin`≤40 `r_xp`≤20
- Secret words (cheats bits): 0=`ichigo` 1=`azarashi` 2=`shinshu` 3=`hamuhamu` 4=`hanpen` 5=`kyonkyon` 6=`zukan` 7=`ohayau`
- Achievements (bit index = position): 0=`firstClear` 1=`crowKing` 2=`survive3` 3=`cageClear` 4=`seals3` 5=`evoBerry` 6=`evoBeam` 7=`evoSeal` 8=`evoBrush` 9=`debtFree` 10=`kills1000` 11=`lv30` 12=`noDamage` 13=`shopAll` 14=`endless10` 15=`clearApple` 16=`clearBerry` 17=`clearRace` 18=`clearZoo` 19=`clearSnow` 20=`clearNight` 21=`evoDrum` 22=`evoMic` 23=`evoApple` 24=`chest` 25=`allStages` 26=`pickups` 27=`hanpen100` 28=`evoLariat` 29=`evoPenlight` 30=`evoHorse` 31=`evoHam` 32=`evoFan` 33=`evoGuitar` 34=`clearHard` 35=`clearGeki` 36=`evo3` 37=`clearChapel` 38=`evoCyalume` 39=`ringCake` 40=`gourmet` 41=`clearChina` 42=`clearHalloween` 43=`clearRunway` 44=`clearRing` 45=`clearDawn` 46=`clearCherry` 47=`clearStation` 48=`clearClinic` 49=`clearOkinawa` 50=`clearHq` 51=`clearRoad` **|** 52=`evoTtable` 53=`evoPara` 54=`evoHlock` 55=`evoKoma` 56=`evoWhis` 57=`evoSyr` 58=`evoChaka` 59=`hamcards` 60=`encore` 61=`loop2` 62=`mission3` 63=`allStages2`
- Difficulties: 0=`easy` 1=`normal` 2=`hard` 3=`geki`
- OLD_LENS: 92, 84, 60, 52, 44, 24, 12 · CODE_LEN: 104
<!-- /gen:lists -->

### Entering a save code (restore)

- Overall progress is **replaced as a whole**. Nothing merges with the current save (`fixProfile` only fills in missing fields).
- Anything an older version doesn't have (new shop items, achievements, stages, …) becomes 0 / none.
- If the player has already picked a language, it stays.
- After restoring, the current-version code is shown.
- The unfinished run (resume code) is not touched. If the restored save no longer unlocks its stage or character, the run is kept anyway and the reason is shown the next time the game opens (see below).

## Resume code

### Building it

1. Start with 1 sentinel bit, then the fixed part below, then the variable part.
2. XOR everything except the sentinel with a fixed mask.
3. Append a CRC-16 (polynomial `0x1021`, initial value `0xFFFF`, sentinel included).
4. The length L is the smallest multiple of 4 whose `31^L` can hold the number, skipping the save-code lengths (SAVE_LENS).
5. Multiply by a constant modulo `31^L`, write in base 31, and group by 4.

`ver` has only 2 bits. v1–v3 store 1–3; v4 stores 0, which was never written before. All four values are now used, so the next format change needs a different marker.

<!-- gen:run -->
| # | Field | Bits | Meaning |
| --- | --- | --- | --- |
| 1 | `ver` | 2 | version number (now 4; 2 bits, so v4 is stored as 0) |
| 2 | `id` | 16 | run id (1–65535) |
| 3 | `stage` | 5 | stage index |
| 4 | `char` | 4 | character index |
| 5 | `diff` | 2 | difficulty 0–3 |
| 6 | `endless` | 1 | endless mode |
| 7 | `cleared` | 1 | 5-minute clear done |
| 8 | `boosted` | 1 | started with every weapon maxed (kyonkyon) |
| 9 | `bossAlive` | 1 | a boss was alive |
| 10 | `t` | 14 | elapsed time (s) |
| 11 | `lvl` | 7 | level |
| 12 | `xp` | 5 | XP toward the next level ×31 |
| 13 | `hp` | 6 | HP fraction ×63 |
| 14 | `pending` | 3 | level-ups not chosen yet |
| 15 | `kills` | 18 | kills |
| 16 | `picked` | 14 | coins picked up |
| 17 | `banked` | 14 | coins already banked |
| 18 | `bossKills` | 6 | bosses defeated |
| 19 | `nextBoss` | 14 | time of the next boss |
| 20 | `revives` | 2 | revives used |
| 21 | `hamN` | 3 | ハムナンバーカード count (dawn stage) |
| 22 | `misN` | 3 | missions (okinawa stage) |
| 23 | `misOk` | 3 | missions passed |

(145 bits)

| Variable part, in order | Bits |
| --- | --- |
| weapon flags | 21 × 1 |
| level of each weapon held (0 = evolved) | 3 × held |
| item flags | 11 × 1 |
| level of each item held | 2 × held |
| boost flags (v1/v2: the first 6) | 8 × 1 |
| count of each boost held | 8 × held |
| special gauge 0–100 (v2+) | 7 |
| levels past MAX for each weapon, then item, held: 1 flag bit, then the levels if set (v4+, endless) | 1 (+ 8) × held |

- `RC_STAGES`: 0=`apple` 1=`berry` 2=`race` 3=`cage` 4=`zoo` 5=`snow` 6=`night` 7=`chapel` 8=`china` 9=`halloween` 10=`runway` 11=`ring` 12=`dawn` 13=`cherry` 14=`station` 15=`clinic` 16=`okinawa` 17=`hq` 18=`road`
- `RC_CHARS`: 0=`kyon` 1=`odekake` 2=`ranger` 3=`dress` 4=`goth` 5=`dj` 6=`amaroli` 7=`waroli` 8=`machi` 9=`ekicho` 10=`redgt` 11=`kumicho` 12=`sapphire`
- `RC_WEAPONS`: 0=`berry` 1=`lariat` 2=`beam` 3=`penlight` 4=`horse` 5=`seal` 6=`brush` 7=`drum` 8=`mic` 9=`apple` 10=`ham` 11=`fan` 12=`guitar` 13=`cyalume` 14=`ttable` 15=`para` 16=`hlock` 17=`koma` 18=`whis` 19=`syr` 20=`chaka`
- `RC_PASSIVES`: 0=`pannier` 1=`shoes` 2=`ribbon` 3=`gobelt` 4=`suzuri` 5=`metro` 6=`nodoame` 7=`basket` 8=`omamori` 9=`gakufu` 10=`wasabi`
- `RC_BOOSTS`: 0=`b_atk` 1=`b_hp` 2=`b_spd` 3=`b_mag` 4=`b_cd` 5=`b_coin` 6=`b_area` 7=`b_regen`
- SAVE_LENS（lengths never used for resume codes）: 12, 24, 44, 52, 60, 84, 92, 104
<!-- /gen:run -->

### Resume-code checks (`runProblem`)

Checked top to bottom; the first failing check gives the reason.

| Order | Check | Reason |
|---|---|---|
| 1 | Can't be read (wrong characters, length, CRC or range) | `check` |
| 2 | The run's id is on the finished-runs list | `used` |
| 3 | Unknown stage, character or difficulty, or level below 1 | `check` |
| 4 | This save hasn't unlocked the stage or character | `locked` |
| 5 | Endless on a stage other than `road` without its clear, or without endless unlocked | `locked` |
| 6 | Not endless but past 5:00 | `check` |
| 7 | A stage-only weapon held outside its stage, `road`, a cleared stage, or the character's starting weapons | `locked` |
| 8 | (Except runs started with kyonkyon) more weapons than slots, or more than 5 items. There are 6 slots; endless adds one at 5:00, 6:30, 8:00 and 9:30 (10), then one a minute up to the number of weapons the run can get (21 with everything open) | `check` |
| 9 | A boost count above its cap (`b_spd`, `b_mag`, `b_regen` 20; `b_cd`, `b_area` 25; the others have no cap) | `check` |
| 10 | Levels past MAX outside endless, or on a weapon / item that isn't at MAX | `check` |
| 11 | Kills > 40 × seconds + 100, coins picked > 4 × seconds + 300, or bosses > 1 + seconds ÷ 60 | `check` |
| 12 | More coins already banked than the run could earn (computed with this save's coin upgrades) | `check` |

- **Typed on the title screen**: the reason is shown and the run doesn't start.
- **A run left in the browser when the game opens**: only `used` (a finished run) is removed silently. `check` and `locked` runs are kept. The continue dialog shows the reason and the code, with **Keep it** or **Discard**. Discarding banks no coins.
- Coins are banked once, when a run ends (game over, clear, quit, or Start over). Finished run ids are remembered, so the same resume code can't pay out twice.

## What the browser stores (localStorage)

Storage is per site (origin), whatever the path, so the root URL and `/dist/` share the same data.

| Key | Contents |
|---|---|
| `kyoka-save-v3` | Overall progress (JSON, unrounded) |
| `kyoka-save-v2`, `kyoka-save-v1` | Very old storage (code strings), read only when `kyoka-save-v3` is missing |
| `kyoka-run` | The unfinished run (resume code) |
| `kyoka-runs-done` | Ids of finished runs (JSON array, the last 300) |
| `kyoka-lang` | Chosen language |
| `kyoka-sel` | Last chosen character, stage and difficulty (JSON) |
| `kyoka-spseen` | The special-move sequence was seen once (skippable from then on) |

## Regenerating the tables

```
node tools/gen-save-docs.mjs          # rewrite the tables from the source
node tools/gen-save-docs.mjs --check  # fail if they are out of date (part of npm test)
```
