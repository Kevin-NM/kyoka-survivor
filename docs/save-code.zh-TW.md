# 咒語（存檔碼）與續玩碼的運作方式

[日本語](save-code.md) | **繁體中文** | [English](save-code.en.md) · [回到 README](../README.zh-TW.md)

遊戲裡有兩種碼。

| | 咒語（存檔碼） | 續玩碼 |
|---|---|---|
| 內容 | 整體進度（草莓幣、商店、成就、各關紀錄等） | 正在玩的那一場 |
| 長度 | 目前 104 個字（4 個字 × 26 組） | 依內容而定（4 的倍數，不會和咒語長度重疊） |
| 原始碼 | `src/save.js` | `src/runcode.js`（檢查在 `src/main.js` 的 `runProblem`） |

> **重要：** 遊戲完全在瀏覽器裡執行，沒有伺服器。只要讀原始碼，任何人都能解開或做出這些碼。校驗碼**只是用來抓打錯字**，不是防作弊的機制。

本頁的表格由 `node tools/gen-save-docs.mjs` 直接從原始碼產生（`npm test` 會檢查有沒有跟原始碼對不上）。

## 共通規則

- **字母表**：31 個字 `23456789ABCDEFGHJKMNPQRSTUVWXYZ`，不用容易混淆的 `0 O 1 I L`。
- **輸入容錯**：讀取前先做 NFKC 轉半形、轉大寫，並去掉空白、連字號、長音、中點和標點（`normalize`）。
- **分組**：顯示時每 4 個字用 `-` 隔開。

## 咒語（存檔碼）的做法

1. 把下表的欄位由上到下串成一個大整數（第一個欄位在最高位）。
2. 和該版本固定的遮罩做 XOR。
3. 在後面接上 CRC-12（多項式 `0x80F`，初始值 0）。
4. 乘上該版本的常數，再對 `31^字數` 取餘數（讓一點點差異就改變整組碼）。
5. 轉成剛好那個字數的 31 進位，每 4 個字分一組。

讀取時反過來做，並檢查 CRC 和每個值的範圍（`decodeFmt`）。

### 怎麼分辨版本

版本靠**字數**分辨。3 位元的 `ver` 欄位只放版本號的低 3 位，所以 v8 存成 0。只有 v1 不乘常數，校驗碼是 CRC-10（`0x233`）。

<!-- gen:old -->
| 版本 | 字數 | 資料位元 | CRC | 內容 |
| --- | --- | --- | --- | --- |
| v8 | 104 | 491 | 12 | 19 關、商店 19 項、成就 82 位元 |
| v7 | 92 | 439 | 12 | 19 關、商店 19 項、成就 82 位元 |
| v6 | 84 | 400 | 12 | 19 關、商店 10 項、成就 82 位元 |
| v5 | 60 | 276 | 12 | 9 關、商店 10 項、成就 52 位元 |
| v4 | 52 | 232 | 12 | 7 關、商店 10 項、成就 40 位元 |
| v3 | 44 | 203 | 12 | 7 關、商店 10 項、成就 30 位元 |
| v2 | 24 | 106 | 12 | 紀錄、草莓幣、商店 8 項、成就 24 位元 |
| v1 | 12 | 49 | 10 | 只有最早期的紀錄 |
<!-- /gen:old -->

### v8（104 字）的欄位

各關時間以 5 秒、擊倒數以 20 隻為單位存（大於 0 的值不會變成 0）。時間有 9 位元，所以最多 42:35。新的 10 關只存時間。瀏覽器裡會保留沒有四捨五入的精確紀錄。

<!-- gen:v8 -->
| # | 欄位 | 位元 | 起始位元 | 意義 |
| --- | --- | --- | --- | --- |
| 1 | `ver` | 3 | 0 | 版本號（v8 存成 0，版本靠字數區分） |
| 2 | `lang` | 2 | 3 | 語言 0=ja 1=zh 2=en |
| 3 | `bestLevel` | 7 | 5 | 最高等級（最多 127） |
| 4 | `clears` | 8 | 12 | 過關次數（最多 255） |
| 5 | `coins` | 17 | 20 | 草莓幣（最多 99999） |
| 6 | `debt` | 9 | 37 | 欠款（最多 300） |
| 7 | `u_panier` | 2 | 46 | 商店「panier」的等級（最多 3） |
| 8 | `u_shodo` | 3 | 48 | 商店「shodo」的等級（最多 5） |
| 9 | `u_drumbeat` | 2 | 51 | 商店「drumbeat」的等級（最多 2） |
| 10 | `u_magnet` | 2 | 53 | 商店「magnet」的等級（最多 2） |
| 11 | `u_toys` | 2 | 55 | 商店「toys」的等級（最多 3） |
| 12 | `u_domino` | 2 | 57 | 商店「domino」的等級（最多 3） |
| 13 | `u_ohayo` | 2 | 59 | 商店「ohayo」的等級（最多 2） |
| 14 | `u_michi` | 1 | 61 | 商店「michi」的等級（最多 1） |
| 15 | `u_hanpen` | 2 | 62 | 商店「hanpen」的等級（最多 3） |
| 16 | `u_lucky` | 2 | 64 | 商店「lucky」的等級（最多 2） |
| 17 | `u_cafe` | 2 | 66 | 商店「cafe」的等級（最多 3） |
| 18 | `u_utowel` | 2 | 68 | 商店「utowel」的等級（最多 3） |
| 19 | `u_hcard` | 2 | 70 | 商店「hcard」的等級（最多 2） |
| 20 | `u_r_atk` | 6 | 72 | 商店「r_atk」的等級（最多 40） |
| 21 | `u_r_hp` | 6 | 78 | 商店「r_hp」的等級（最多 40） |
| 22 | `u_r_spd` | 5 | 84 | 商店「r_spd」的等級（最多 20） |
| 23 | `u_r_mag` | 5 | 89 | 商店「r_mag」的等級（最多 20） |
| 24 | `u_r_coin` | 6 | 94 | 商店「r_coin」的等級（最多 40） |
| 25 | `u_r_xp` | 5 | 100 | 商店「r_xp」的等級（最多 20） |
| 26 | `ach` | 52 | 105 | 成就 0–51 的位元 |
| 27 | `ach2` | 30 | 157 | 成就 52 以後的位元 |
| 28 | `cheats` | 8 | 187 | 用過的秘密密碼（位元） |
| 29 | `iday` | 14 | 195 | 最後一次用 ichigo 的日期（1 = 2026-01-01） |
| 30 | `boost` | 1 | 209 | 下一場以全部武器滿級開始（kyonkyon） |
| 31 | `diff` | 2 | 210 | 上次選的難度 0–3 |
| 32 | `t_apple` | 9 | 212 | 「apple」最佳時間 ÷ 5 秒（最多 511） |
| 33 | `k_apple` | 7 | 221 | 「apple」最佳擊倒數 ÷ 20（最多 127） |
| 34 | `t_berry` | 9 | 228 | 「berry」最佳時間 ÷ 5 秒（最多 511） |
| 35 | `k_berry` | 7 | 237 | 「berry」最佳擊倒數 ÷ 20（最多 127） |
| 36 | `t_race` | 9 | 244 | 「race」最佳時間 ÷ 5 秒（最多 511） |
| 37 | `k_race` | 7 | 253 | 「race」最佳擊倒數 ÷ 20（最多 127） |
| 38 | `t_cage` | 9 | 260 | 「cage」最佳時間 ÷ 5 秒（最多 511） |
| 39 | `k_cage` | 7 | 269 | 「cage」最佳擊倒數 ÷ 20（最多 127） |
| 40 | `t_zoo` | 9 | 276 | 「zoo」最佳時間 ÷ 5 秒（最多 511） |
| 41 | `k_zoo` | 7 | 285 | 「zoo」最佳擊倒數 ÷ 20（最多 127） |
| 42 | `t_snow` | 9 | 292 | 「snow」最佳時間 ÷ 5 秒（最多 511） |
| 43 | `k_snow` | 7 | 301 | 「snow」最佳擊倒數 ÷ 20（最多 127） |
| 44 | `t_night` | 9 | 308 | 「night」最佳時間 ÷ 5 秒（最多 511） |
| 45 | `k_night` | 7 | 317 | 「night」最佳擊倒數 ÷ 20（最多 127） |
| 46 | `t_chapel` | 9 | 324 | 「chapel」最佳時間 ÷ 5 秒（最多 511） |
| 47 | `k_chapel` | 7 | 333 | 「chapel」最佳擊倒數 ÷ 20（最多 127） |
| 48 | `t_china` | 9 | 340 | 「china」最佳時間 ÷ 5 秒（最多 511） |
| 49 | `k_china` | 7 | 349 | 「china」最佳擊倒數 ÷ 20（最多 127） |
| 50 | `t_halloween` | 9 | 356 | 「halloween」最佳時間 ÷ 5 秒（最多 511） |
| 51 | `t_runway` | 9 | 365 | 「runway」最佳時間 ÷ 5 秒（最多 511） |
| 52 | `t_ring` | 9 | 374 | 「ring」最佳時間 ÷ 5 秒（最多 511） |
| 53 | `t_dawn` | 9 | 383 | 「dawn」最佳時間 ÷ 5 秒（最多 511） |
| 54 | `t_cherry` | 9 | 392 | 「cherry」最佳時間 ÷ 5 秒（最多 511） |
| 55 | `t_station` | 9 | 401 | 「station」最佳時間 ÷ 5 秒（最多 511） |
| 56 | `t_clinic` | 9 | 410 | 「clinic」最佳時間 ÷ 5 秒（最多 511） |
| 57 | `t_okinawa` | 9 | 419 | 「okinawa」最佳時間 ÷ 5 秒（最多 511） |
| 58 | `t_hq` | 9 | 428 | 「hq」最佳時間 ÷ 5 秒（最多 511） |
| 59 | `t_road` | 9 | 437 | 「road」最佳時間 ÷ 5 秒（最多 511） |
| 60 | `dclr` | 45 | 446 | 每關通過的最高難度（以 5 進位打包，0 = 未通過） |

**491** data bits + CRC-12 = 503 bits → 104 chars.
<!-- /gen:v8 -->

### 用到的清單（順序也是格式的一部分）

<!-- gen:lists -->
- 字母表（31 個字）: `23456789ABCDEFGHJKMNPQRSTUVWXYZ`
- 關卡順序: `apple` `berry` `race` `cage` `zoo` `snow` `night` `chapel` `china` `halloween` `runway` `ring` `dawn` `cherry` `station` `clinic` `okinawa` `hq` `road`
- 商店順序（u_）: `panier`≤3 `shodo`≤5 `drumbeat`≤2 `magnet`≤2 `toys`≤3 `domino`≤3 `ohayo`≤2 `michi`≤1 `hanpen`≤3 `lucky`≤2 `cafe`≤3 `utowel`≤3 `hcard`≤2 `r_atk`≤40 `r_hp`≤40 `r_spd`≤20 `r_mag`≤20 `r_coin`≤40 `r_xp`≤20
- 秘密密碼（cheats 位元）: 0=`ichigo` 1=`azarashi` 2=`shinshu` 3=`hamuhamu` 4=`hanpen` 5=`kyonkyon` 6=`zukan` 7=`ohayau`
- 成就（位元編號 = 順序）: 0=`firstClear` 1=`crowKing` 2=`survive3` 3=`cageClear` 4=`seals3` 5=`evoBerry` 6=`evoBeam` 7=`evoSeal` 8=`evoBrush` 9=`debtFree` 10=`kills1000` 11=`lv30` 12=`noDamage` 13=`shopAll` 14=`endless10` 15=`clearApple` 16=`clearBerry` 17=`clearRace` 18=`clearZoo` 19=`clearSnow` 20=`clearNight` 21=`evoDrum` 22=`evoMic` 23=`evoApple` 24=`chest` 25=`allStages` 26=`pickups` 27=`hanpen100` 28=`evoLariat` 29=`evoPenlight` 30=`evoHorse` 31=`evoHam` 32=`evoFan` 33=`evoGuitar` 34=`clearHard` 35=`clearGeki` 36=`evo3` 37=`clearChapel` 38=`evoCyalume` 39=`ringCake` 40=`gourmet` 41=`clearChina` 42=`clearHalloween` 43=`clearRunway` 44=`clearRing` 45=`clearDawn` 46=`clearCherry` 47=`clearStation` 48=`clearClinic` 49=`clearOkinawa` 50=`clearHq` 51=`clearRoad` **|** 52=`evoTtable` 53=`evoPara` 54=`evoHlock` 55=`evoKoma` 56=`evoWhis` 57=`evoSyr` 58=`evoChaka` 59=`hamcards` 60=`encore` 61=`loop2` 62=`mission3` 63=`allStages2`
- 難度: 0=`easy` 1=`normal` 2=`hard` 3=`geki`
- OLD_LENS: 92, 84, 60, 52, 44, 24, 12 · CODE_LEN: 104
<!-- /gen:lists -->

### 輸入咒語時（還原）

- 整體進度會**整個被取代**，不會和目前的存檔合併（只用 `fixProfile` 補上缺的項目）。
- 舊版沒有的項目（新商品、新成就、新關卡等）會變成 0 或沒有。
- 如果玩家已經選過語言，就維持那個語言。
- 還原後會顯示目前版本的咒語。
- 不會動到正在玩的那一場（續玩碼）。如果還原後那一場變成用到還沒解鎖的關卡或角色，也不會被刪掉，下次打開時會顯示原因（見下方）。

## 續玩碼

### 做法

1. 最前面放 1 個位元（哨兵），接著是下面的固定部分，再接可變部分。
2. 除了哨兵以外，和固定的遮罩做 XOR。
3. 在後面接上 CRC-16（多項式 `0x1021`，初始值 `0xFFFF`，包含哨兵）。
4. 長度 L 取「4 的倍數、而且 `31^L` 放得下」的最小值，但會跳過咒語的長度（SAVE_LENS）。
5. 在 `31^L` 下乘上常數，轉成 31 進位，每 4 個字分一組。

`ver` 只有 2 位元。v1–v3 存成 1–3，v4 存成以前沒用過的 0。4 個值都用完了，下次改格式時需要另外的標記。

<!-- gen:run -->
| # | 欄位 | 位元 | 意義 |
| --- | --- | --- | --- |
| 1 | `ver` | 2 | 版本號（目前 4；只有 2 位元，v4 存成 0） |
| 2 | `id` | 16 | 這一場的 ID（1–65535） |
| 3 | `stage` | 5 | 關卡編號 |
| 4 | `char` | 4 | 角色編號 |
| 5 | `diff` | 2 | 難度 0–3 |
| 6 | `endless` | 1 | 無盡模式 |
| 7 | `cleared` | 1 | 已撐過 5 分鐘 |
| 8 | `boosted` | 1 | 以全部武器滿級開始（kyonkyon） |
| 9 | `bossAlive` | 1 | 當時有 Boss |
| 10 | `t` | 14 | 經過時間（秒） |
| 11 | `lvl` | 7 | 等級 |
| 12 | `xp` | 5 | 到下一級的經驗值 ×31 |
| 13 | `hp` | 6 | HP 比例 ×63 |
| 14 | `pending` | 3 | 還沒選的升級 |
| 15 | `kills` | 18 | 擊倒數 |
| 16 | `picked` | 14 | 撿到的草莓幣 |
| 17 | `banked` | 14 | 已經入帳的草莓幣 |
| 18 | `bossKills` | 6 | 打倒的 Boss |
| 19 | `nextBoss` | 14 | 下一隻 Boss 的時間 |
| 20 | `revives` | 2 | 復活次數 |
| 21 | `hamN` | 3 | ハムナンバーカード（拂曉） |
| 22 | `misN` | 3 | 任務數（沖繩） |
| 23 | `misOk` | 3 | 成功的任務 |

(145 bits)

| 後面接著的部分 | 位元 |
| --- | --- |
| 武器旗標 | 21 × 1 |
| 持有武器的等級（0 = 已進化） | 3 × 持有數 |
| 道具旗標 | 11 × 1 |
| 道具等級 | 2 × 持有數 |
| 強化旗標（v1/v2 只有前 6 個） | 8 × 1 |
| 強化次數 | 8 × 持有數 |
| 必殺技能量 0–100（v2 起） | 7 |
| 依持有的武器→道具順序，滿級後的等級：旗標 1，有的話再存等級（v4 起，無盡模式） | 1 (+ 8) × 持有數 |

- `RC_STAGES`: 0=`apple` 1=`berry` 2=`race` 3=`cage` 4=`zoo` 5=`snow` 6=`night` 7=`chapel` 8=`china` 9=`halloween` 10=`runway` 11=`ring` 12=`dawn` 13=`cherry` 14=`station` 15=`clinic` 16=`okinawa` 17=`hq` 18=`road`
- `RC_CHARS`: 0=`kyon` 1=`odekake` 2=`ranger` 3=`dress` 4=`goth` 5=`dj` 6=`amaroli` 7=`waroli` 8=`machi` 9=`ekicho` 10=`redgt` 11=`kumicho` 12=`sapphire`
- `RC_WEAPONS`: 0=`berry` 1=`lariat` 2=`beam` 3=`penlight` 4=`horse` 5=`seal` 6=`brush` 7=`drum` 8=`mic` 9=`apple` 10=`ham` 11=`fan` 12=`guitar` 13=`cyalume` 14=`ttable` 15=`para` 16=`hlock` 17=`koma` 18=`whis` 19=`syr` 20=`chaka`
- `RC_PASSIVES`: 0=`pannier` 1=`shoes` 2=`ribbon` 3=`gobelt` 4=`suzuri` 5=`metro` 6=`nodoame` 7=`basket` 8=`omamori` 9=`gakufu` 10=`wasabi`
- `RC_BOOSTS`: 0=`b_atk` 1=`b_hp` 2=`b_spd` 3=`b_mag` 4=`b_cd` 5=`b_coin` 6=`b_area` 7=`b_regen`
- SAVE_LENS（續玩碼不會用的長度）: 12, 24, 44, 52, 60, 84, 92, 104
<!-- /gen:run -->

### 續玩碼的檢查（`runProblem`）

由上往下檢查，回傳第一個不符合的原因。

| 順序 | 檢查 | 原因 |
|---|---|---|
| 1 | 讀不出來（字元、長度、CRC 或範圍不對） | `check` |
| 2 | 這一場的 ID 在已結束的清單裡 | `used` |
| 3 | 沒有這個關卡／角色／難度，或等級小於 1 | `check` |
| 4 | 目前存檔還沒解鎖這個關卡或角色 | `locked` |
| 5 | 不是 `road` 的無盡模式，但還沒過關或還沒解鎖無盡模式 | `locked` |
| 6 | 不是無盡模式卻超過 5:00 | `check` |
| 7 | 持有關卡專屬武器，但不是在該關、`road`、已過關的關卡或角色起始武器 | `locked` |
| 8 | （用 kyonkyon 開始的場次除外）武器數超過欄位，或道具超過 5 個。欄位是 6 格，無盡模式在 5:00、6:30、8:00、9:30 各加 1 格到 10 格，之後每分鐘加 1 格，最多到這一場拿得到的武器數（全部解鎖時 21） | `check` |
| 9 | 強化次數超過上限（`b_spd`、`b_mag`、`b_regen` 20，`b_cd`、`b_area` 25，其他沒有上限） | `check` |
| 10 | 不是無盡模式卻有滿級以上的等級，或那個武器／道具還沒滿級 | `check` |
| 11 | 擊倒數 > 40 × 秒 + 100、草莓幣 > 4 × 秒 + 300、Boss > 1 + 秒 ÷ 60 | `check` |
| 12 | 已入帳的草莓幣比這場能拿到的還多（用目前存檔的草莓幣商店等級計算） | `check` |

- **在標題畫面輸入時**：顯示原因，不會用那組碼開始。
- **打開時發現瀏覽器裡有上次的進度**：只有 `used`（已結束的場次）會直接刪掉。`check` 和 `locked` 會保留，在「要從上次的進度繼續玩嗎？」畫面顯示原因和那組碼，可以選「先保留」或「捨棄」。捨棄不會拿到草莓幣。
- 草莓幣只在一場結束時（遊戲結束、過關、離開、從頭開始）入帳一次。結束的場次 ID 會被記住，所以同一組續玩碼不能拿兩次。

## 瀏覽器裡存的東西（localStorage）

同一個網站（origin）不分路徑都共用（首頁網址和 `/dist/` 是同一份資料）。

| 鍵 | 內容 |
|---|---|
| `kyoka-save-v3` | 整體進度（JSON，不四捨五入） |
| `kyoka-save-v2`, `kyoka-save-v1` | 很早期的存法（咒語字串）。只有在沒有 `kyoka-save-v3` 時才讀 |
| `kyoka-run` | 正在玩的那一場（續玩碼） |
| `kyoka-runs-done` | 已結束場次的 ID（JSON 陣列，最近 300 個） |
| `kyoka-lang` | 選的語言 |
| `kyoka-sel` | 上次選的角色、關卡、難度（JSON） |
| `kyoka-spseen` | 看過一次必殺技演出（第二次起可跳過） |

## 重新產生表格

```
node tools/gen-save-docs.mjs          # 從原始碼重寫表格
node tools/gen-save-docs.mjs --check  # 對不上就報錯（npm test 會跑）
```
