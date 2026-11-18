// mid-run save & resume (続きコード) texts
export const SHOP_T = {
  ja: { base: '⭐ きほん', goods: '🎀 きょんグッズ', rep: '📈 どんどん強化', lv: 'Lv {l}', next: 'つぎ', repHelp: 'なんかいでも かえるよ（かうたびに すこし たかくなる）' },
  zh: { base: '⭐ 基本', goods: '🎀 きょん周邊', rep: '📈 無限強化', lv: 'Lv {l}', next: '下一級', repHelp: '可以一直買下去（每次會貴一點）' },
  en: { base: '⭐ Basics', goods: '🎀 きょん goods', rep: '📈 Keep growing', lv: 'Lv {l}', next: 'next', repHelp: 'Buy as many times as you like (a little pricier each time)' }
};
export const RUN_T = {
  ja: {
    pauseBtn: '🔖 つづきコード', titleBtn: '🔖 つづきコード',
    codeTitle: 'つづきコード', codeHelp: 'このコードを タイトルの「つづきコード」に いれると、ここから また あそべるよ。',
    copy: 'コピー', copied: 'コピーしたよ！', close: 'とじる',
    enterTitle: 'つづきコードを いれる', enterHelp: 'ポーズで でた つづきコードを いれてね。<br>じゅもんも ここで いれられるよ。',
    askTitle: '前回の続きから遊ぶ？', cont: 'つづきから', fresh: '最初から', info: '{s}・{c}・{t}',
    askBad: 'つづきが いまは あそべないよ', keep: 'のこしておく', discard: 'すてる',
    keepHint: 'コードは けさずに のこしておくよ。「のこしておく」なら つぎに ひらいたとき また きくね。',
    badSaved: { check: 'セーブされた データが チェックに とおらなかったよ', locked: 'いまの セーブでは まだ ひらいていない ステージか キャラだよ。もとの じゅもんに もどすと つづけられるかも' },
    resumed: 'つづきから スタート！', slotUp: '🎒 ぶきスロット +1！（{n}こまで）', overUp: 'MAXの その先へ！ こうげきと はんいが すこし アップ',
    bad: { check: 'コードが ちがうみたい。もういちど たしかめてね', used: 'この つづきコードの ゲームは もう おわっているよ', locked: 'まだ ひらいていない ステージか キャラの コードだよ' }
  },
  zh: {
    pauseBtn: '🔖 續玩碼', titleBtn: '🔖 續玩碼',
    codeTitle: '續玩碼', codeHelp: '在標題畫面的「續玩碼」輸入這組碼，就能從這裡接著玩。',
    copy: '複製', copied: '已複製！', close: '關閉',
    enterTitle: '輸入續玩碼', enterHelp: '輸入暫停時拿到的續玩碼。<br>存檔碼也可以在這裡輸入。',
    askTitle: '要從上次的進度繼續玩嗎？', cont: '繼續玩', fresh: '從頭開始', info: '{s}｜{c}｜{t}',
    askBad: '上次的進度現在沒辦法繼續', keep: '先保留', discard: '捨棄',
    keepHint: '這組碼不會被刪掉。選「先保留」的話，下次打開時會再問你。',
    badSaved: { check: '存下來的資料沒有通過檢查', locked: '這場用到目前存檔還沒解鎖的關卡或角色。換回原本的咒語後也許就能繼續' },
    resumed: '從上次的進度開始！', slotUp: '🎒 武器欄位 +1！（最多 {n} 個）', overUp: '突破滿級！攻擊和範圍小幅提升',
    bad: { check: '這組碼好像不對，請再確認一次', used: '這組續玩碼的那一場已經結束了', locked: '這組碼用到了還沒解鎖的關卡或角色' }
  },
  en: {
    pauseBtn: '🔖 Resume code', titleBtn: '🔖 Resume code',
    codeTitle: 'Resume code', codeHelp: 'Enter this code with "Resume code" on the title screen to keep playing from here.',
    copy: 'Copy', copied: 'Copied!', close: 'Close',
    enterTitle: 'Enter a resume code', enterHelp: 'Type the resume code from the pause menu.<br>Save codes work here too.',
    askTitle: 'Continue where you left off?', cont: 'Continue', fresh: 'Start over', info: '{s} · {c} · {t}',
    askBad: 'Your saved run can\'t continue right now', keep: 'Keep it', discard: 'Discard',
    keepHint: 'The code is not deleted. Choose Keep it and you\'ll be asked again next time.',
    badSaved: { check: 'The saved run didn\'t pass the checks', locked: 'It uses a stage or character this save hasn\'t unlocked. Restoring the save it came from may let you continue' },
    resumed: 'Back where you left off!', slotUp: '🎒 Weapon slot +1! (up to {n})', overUp: 'Past MAX! A little more damage and area',
    bad: { check: 'That code doesn\'t look right. Please check it again', used: 'The run for this resume code is already over', locked: 'This code uses a stage or character you haven\'t unlocked yet' }
  }
};

// 必殺技 (special move): name keeps キョンレンジャー in every language
export const SP_T = {
  ja: { btn: '必殺技', ready: '⚡ 必殺技 OK！ ボタンか Q キーで はつどう', name: '⚡ キョンレンジャー大集合！', skip: 'スキップ' },
  zh: { btn: '必殺技', ready: '⚡ 必殺技準備好了！按按鈕或 Q 鍵發動', name: '⚡ キョンレンジャー大集合！', skip: '跳過' },
  en: { btn: 'Special', ready: '⚡ Special ready! Tap the button or press Q', name: '⚡ キョンレンジャー, assemble!', skip: 'Skip' }
};
