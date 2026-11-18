// Texts for the password save UI and the how-to-play / how-to-save guide.
import { CODE_LEN, OLD_LENS } from './save.js';
// code lengths come from the save module, so the help text never goes stale
const N = CODE_LEN, OLD_JA = OLD_LENS.join('・'), OLD_ZH = OLD_LENS.join('、'), OLD_EN = OLD_LENS.slice(0, -1).map(n => n + '-').join(', ') + ' and ' + OLD_LENS[OLD_LENS.length - 1] + '-letter';
export const SAVE_T = {
  ja: {
    code: 'セーブのじゅもん', copy: 'コピー', copied: 'コピーしました！', copyFail: 'コピーできなかったよ。スクショしてね',
    shot: '📸 スクショして保存してね', auto: 'このブラウザには じどうで セーブされているよ',
    enterBtn: '🔑 じゅもんを入力', guideBtn: '📖 あそびかた・セーブのしかた',
    enterTitle: 'じゅもんを入力', enterHelp: `スクショした じゅもん（${N}もじ）を いれてね。<br>まえの ${OLD_JA}もじの じゅもんも つかえるよ。<br>いまの セーブは じゅもんの ないように そっくり おきかわるよ。<br>小文字・スペース・「-」は あってもなくても だいじょうぶ。`,
    paste: '📋 はりつけ', ok: 'けってい', back: 'もどる', clear: 'けす',
    okMsg: 'できた！ つづきから あそべるよ 🎉', pasteFail: 'はりつけできなかったよ。入力らんを ながおしして「ペースト」してね',
    bad: { empty: 'じゅもんを いれてね', length: `もじの かずが ちがうみたい。${N}もじ だよ（いま {n}もじ）`, char: '「{c}」は じゅもんに つかわない もじだよ。0・O・1・I・L は でてこないよ', check: 'じゅもんが ちがうみたい… スクショと 1もじずつ くらべてみてね' },
    rec: 'ベスト {t}・Lv {l}・クリア {c}回', recNone: 'まだ きろくは ないよ',
    paused: 'ポーズ'
  },
  zh: {
    code: '存檔咒語', copy: '複製', copied: '已複製！', copyFail: '無法複製，請截圖保存',
    shot: '📸 請截圖保存喔', auto: '這個瀏覽器已經自動存檔了',
    enterBtn: '🔑 輸入咒語', guideBtn: '📖 玩法與存檔',
    enterTitle: '輸入咒語', enterHelp: `請輸入截圖裡的咒語（${N} 個字）。<br>以前 ${OLD_ZH} 個字的咒語也能用。<br>目前的存檔會整個換成咒語裡的內容。<br>大小寫、空格、「-」有沒有都沒關係。`,
    paste: '📋 貼上', ok: '確定', back: '返回', clear: '清除',
    okMsg: '成功了！可以接著玩囉 🎉', pasteFail: '無法貼上。請長按輸入框，選「貼上」',
    bad: { empty: '請輸入咒語', length: `字數好像不對，應該是 ${N} 個字（現在 {n} 個字）`, char: '「{c}」不會出現在咒語裡喔。咒語裡沒有 0、O、1、I、L', check: '咒語好像不對…請和截圖一個字一個字比對看看' },
    rec: '最佳 {t}｜Lv {l}｜過關 {c} 次', recNone: '還沒有紀錄'
  },
  en: {
    code: 'Save code', copy: 'Copy', copied: 'Copied!', copyFail: 'Could not copy. Please take a screenshot',
    shot: '📸 Take a screenshot to keep it', auto: 'Progress is also saved automatically in this browser',
    enterBtn: '🔑 Enter code', guideBtn: '📖 How to play & save',
    enterTitle: 'Enter your code', enterHelp: `Type the ${N}-letter code from your screenshot.<br>Old ${OLD_EN} codes still work.<br>Your current save is replaced by exactly what the code holds.<br>Lower case, spaces and "-" are all fine.`,
    paste: '📋 Paste', ok: 'OK', back: 'Back', clear: 'Clear',
    okMsg: 'Done! Your progress is back 🎉', pasteFail: 'Could not paste. Long-press the box and choose "Paste"',
    bad: { empty: 'Please type your code', length: `That is {n} letters; the code has ${N}`, char: '"{c}" is never used in codes (there is no 0, O, 1, I or L)', check: 'That code does not look right. Compare it with your screenshot one letter at a time' },
    rec: 'Best {t} · Lv {l} · Clears {c}', recNone: 'No records yet'
  }
};

export const GUIDE = {
  ja: {
    title: 'あそびかた・セーブのしかた', easy: 'かんたん', more: 'くわしく', close: 'とじる', moreHint: '↓ したにも あるよ',
    steps: [
      ['🍓', '「スタート」を おす'],
      ['👆', 'うごいて よける<br><small>スマホ：がめんを なぞる<br>パソコン：やじるしキー</small>'],
      ['📸', 'おわったら<br>じゅもん を スクショ'],
      ['🔑', 'つぎは「じゅもんを入力」<br>で つづきから']
    ],
    easyNote: 'おなじ スマホ・パソコンなら、じゅもん なしでも じどうで セーブ されるよ 💮',
    sections: [
      ['🎮 あそびかた', '<b>スマホ</b>：がめんを ゆびで なぞると うごきます。右下の「ダッシュ」で すばやく よけられます。<br><b>パソコン</b>：WASD または 矢印キーで いどう、スペースで ダッシュ、P か Esc で ポーズ。<br>こうげきは じどう です。にげながら ♪を あつめると レベルアップ。カードを 1まい えらんでね。5分 いきのこれば クリア！<br>ぶきを <b>Lv5</b>に すると つぎの レベルアップで しんか！ はじめる まえに むずかしさを 4つから えらべます（むずかしいほど いちごコインが ふえるよ）。'],
      ['🔑 じゅもん って なに？', `「ABCD-EFGH-JKMN-PQRS-TUVW-XYZ2-…」のような ${N}もじの ことばです。ベスト記録・クリア回数・いちごコイン・しゃっきん・おみせで かったもの・じっせき・ステージごとの きろく・クリアした むずかしさ・ことば設定が つまっています。まえの ${OLD_JA}もじの じゅもんも そのまま いれられます。いれると いまの セーブは じゅもんの ないように おきかわります。ゲームが おわったときと ポーズ中に でてきます。`],
      ['📸 じゅもんの のこしかた', 'いちばん かんたんなのは <b>スクショ</b>（がめんの しゃしん）です。<br>iPhone：横のボタンと 音量＋ を いっしょに おす。<br>Android：電源ボタンと 音量− を いっしょに おす。<br>パソコン：「コピー」を おして、メモ帳などに はりつけ。'],
      ['📋 じゅもんの いれかた', 'タイトルの「じゅもんを入力」を おします。<br>コピーしてあるなら「はりつけ」ボタン。うまくいかないときは 入力らんを ながおし →「ペースト」。<br>スクショを 見ながら 手で うっても OK。小文字・スペース・「-」は 気にしなくて だいじょうぶ。'],
      ['😢「ちがうみたい」と でたら', 'スクショと 1もじずつ くらべてね。じゅもんには 0・O・1・I・L は でてきません（まちがえやすいので つかっていません）。8 と B、5 と S、2 と Z も よく見てね。'],
      ['🐹 おみせ と しゃっきん', 'あそぶと「いちごコイン」が もらえます（とちゅうで おわっても もらえるよ）。タイトルの「おみせ」で つかうと、ずっと つよく なれます。<br>コインが たりないときは ハムスターに「かりて かう」ことも できます（🍓300まで）。つぎから もらう コインで じどうで かえします。かえし おわると じっせき「完済！」。'],
      ['📒 ずかん と じっせき', 'じっせきを たっせいしたり、おみせで かいものを すると、きょんの まめちしきが よめるように なります。キャラクターや ステージも じっせきで ふえていきます。'],
      ['💾 じどうセーブ', 'おなじ ブラウザで ひらけば、じゅもん なしでも 記録は のこっています。<br>でも、ブラウザの「履歴・データを消す」や 機種変更、シークレットモードでは きえてしまいます。そのときは じゅもん で もどせます。']
    ]
  },
  zh: {
    title: '玩法與存檔', easy: '簡單', more: '詳細', close: '關閉', moreHint: '↓ 下面還有說明',
    steps: [
      ['🍓', '按「開始」'],
      ['👆', '移動、閃避<br><small>手機：用手指滑畫面<br>電腦：方向鍵</small>'],
      ['📸', '結束後<br>把咒語截圖'],
      ['🔑', '下次按「輸入咒語」<br>接著玩']
    ],
    easyNote: '用同一台手機／電腦的話，不用咒語也會自動存檔 💮',
    sections: [
      ['🎮 玩法', '<b>手機</b>：手指在畫面上滑動就能移動。右下的「衝刺」可以快速閃避。<br><b>電腦</b>：WASD 或方向鍵移動、空白鍵衝刺、P 或 Esc 暫停。<br>攻擊是自動的。邊逃邊收集♪就會升級，選一張卡片。撐過 5 分鐘就過關！<br>武器升到 <b>Lv5</b>，下一次升級就能進化！開始前可以從 4 種難度中選擇（越難拿到的草莓幣越多）。'],
      ['🔑 咒語是什麼？', `像「ABCD-EFGH-JKMN-PQRS-TUVW-XYZ2-…」這樣的 ${N} 個字。裡面記錄了最佳紀錄、過關次數、草莓幣、欠債、商店買過的東西、成就、各關卡紀錄、過關的難度和語言設定。以前 ${OLD_ZH} 個字的咒語也可以直接輸入。輸入後，目前的存檔會換成咒語裡的內容。遊戲結束時和暫停時會顯示。`],
      ['📸 怎麼保存咒語', '最簡單是<b>截圖</b>。<br>iPhone：同時按側邊按鈕和音量＋。<br>Android：同時按電源鍵和音量−。<br>電腦：按「複製」，貼到記事本等地方。'],
      ['📋 怎麼輸入咒語', '在標題畫面按「輸入咒語」。<br>有複製的話按「貼上」。不行的話長按輸入框 →「貼上」。<br>看著截圖手打也可以，大小寫、空格、「-」都不用在意。'],
      ['😢 出現「咒語好像不對」時', '請和截圖一個字一個字比對。咒語裡不會出現 0、O、1、I、L（容易看錯所以不用）。也注意 8 和 B、5 和 S、2 和 Z。'],
      ['🐹 商店與欠債', '玩遊戲可以拿到「草莓幣」（中途結束也拿得到）。在標題的「商店」用掉就能永久變強。<br>幣不夠的時候，也可以跟倉鼠「借錢買」（最多 🍓300）。之後拿到的幣會自動拿去還，還完就會達成成就「還清了！」。'],
      ['📒 圖鑑與成就', '達成成就或在商店買東西，就能讀到 きょん 的小知識。角色和關卡也會隨著成就增加。'],
      ['💾 自動存檔', '用同一個瀏覽器打開，不用咒語紀錄也還在。<br>但是清除瀏覽器的「歷史紀錄／網站資料」、換手機或用無痕模式時會消失，這時用咒語就能恢復。']
    ]
  },
  en: {
    title: 'How to play & save', easy: 'Simple', more: 'Details', close: 'Close', moreHint: '↓ More below',
    steps: [
      ['🍓', 'Press START'],
      ['👆', 'Move and dodge<br><small>Phone: slide your finger<br>PC: arrow keys</small>'],
      ['📸', 'When it ends,<br>screenshot the code'],
      ['🔑', 'Next time, "Enter code"<br>to continue']
    ],
    easyNote: 'On the same phone or computer, progress also saves by itself 💮',
    sections: [
      ['🎮 How to play', '<b>Phone</b>: slide your finger on the screen to move. Tap DASH (bottom right) to dodge quickly.<br><b>PC</b>: WASD or arrow keys to move, Space to dash, P or Esc to pause.<br>Attacks are automatic. Collect ♪ to level up and pick one card. Survive 5 minutes to clear!<br>A weapon at <b>Lv5</b> evolves at the next level-up! Before each run, pick one of 4 difficulties (harder = more Strawberry Coins).'],
      ['🔑 What is the code?', `A ${N}-letter code like "ABCD-EFGH-JKMN-PQRS-TUVW-XYZ2-…". It holds your best records, clears, Strawberry Coins, debt, shop upgrades, goals, stage records, the hardest difficulty you cleared and your language. Old ${OLD_EN} codes still work. Entering one replaces your current save with what the code holds. It appears when a game ends and on the pause screen.`],
      ['📸 Keeping the code', 'The easiest way is a <b>screenshot</b>.<br>iPhone: press the side button and volume up together.<br>Android: press power and volume down together.<br>PC: press Copy and paste it into a note.'],
      ['📋 Entering the code', 'On the title screen press "Enter code".<br>If you copied it, press Paste. If that fails, long-press the box and choose Paste.<br>Typing it by hand is fine too; case, spaces and "-" do not matter.'],
      ['😢 If it says the code is wrong', 'Compare it with your screenshot letter by letter. Codes never use 0, O, 1, I or L. Also check 8/B, 5/S and 2/Z.'],
      ['🐹 Shop and debt', 'Every run gives you Strawberry Coins (even if you lose). Spend them in the Shop on the title screen to get stronger for good.<br>If you are short, the hamster can lend you coins (up to 🍓300). Coins you earn later pay it back automatically, and paying it all back completes the goal "Debt-free!".'],
      ['📒 Kyon Book and goals', 'Completing goals and shopping unlocks little facts about Kyon. New characters and stages also unlock through goals.'],
      ['💾 Auto-save', 'If you open the game in the same browser, your records are still there without a code.<br>Clearing browser history/data, a new phone or private mode erases them; then the code brings them back.']
    ]
  }
};
