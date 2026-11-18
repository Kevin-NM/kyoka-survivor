// Everything you hear is synthesized live with WebAudio: a pulse-wave chiptune loop and SFX.

const Snd = (() => {
  let ac = null, master, music, sfx, noise, pulse25, pulse12, timer = null;
  let muted = false, song = null, step = 0, nextT = 0;
  const last = {};
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function pulseWave(d) {
    const n = 64, re = new Float32Array(n), im = new Float32Array(n);
    for (let i = 1; i < n; i++) re[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * d);
    return ac.createPeriodicWave(re, im);
  }
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.55; master.connect(ac.destination);
    music = ac.createGain(); music.gain.value = 0.32; music.connect(master);
    sfx = ac.createGain(); sfx.gain.value = 0.55; sfx.connect(master);
    noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    pulse25 = pulseWave(0.25); pulse12 = pulseWave(0.125);
  }
  function tone(o) { // {f, t, dur, vol, type, to, dest, a}
    if (!ac) return;
    const t = o.t || ac.currentTime, osc = ac.createOscillator(), g = ac.createGain();
    if (o.type === 'p25') osc.setPeriodicWave(pulse25); else if (o.type === 'p12') osc.setPeriodicWave(pulse12); else osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
    const v = o.vol || 0.2;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + (o.a || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    osc.connect(g); g.connect(o.dest || sfx); osc.start(t); osc.stop(t + o.dur + 0.02);
  }
  function hiss(o) { // {t, dur, vol, hp, lp, dest}
    if (!ac) return;
    const t = o.t || ac.currentTime, src = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
    src.buffer = noise; f.type = o.lp ? 'lowpass' : 'highpass'; f.frequency.value = o.lp || o.hp || 4000;
    if (o.sweep) f.frequency.exponentialRampToValueAtTime(o.sweep, t + o.dur);
    g.gain.setValueAtTime(o.vol || 0.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(f); f.connect(g); g.connect(o.dest || sfx); src.start(t, Math.random() * 0.5); src.stop(t + o.dur + 0.02);
  }

  // ---- songs: 16th-note steps. Melody arrays are 8ths (null = rest, 0 = hold) ----
  const SONGS = {
    main: {
      bpm: 138,
      chords: [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50], [48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]],
      mel: [72, 76, 79, 76, 81, 79, 76, 74, 72, 0, 69, 72, 76, 0, 74, 72, 69, 72, 77, 76, 74, 72, 74, 76, 79, 0, 77, 76, 74, 0, 71, 74,
            84, 0, 83, 81, 79, 0, 76, 79, 81, 0, 79, 76, 72, 0, 76, 77, 77, 76, 74, 72, 69, 72, 74, 77, 79, 81, 83, 0, 79, 0, null, null]
    },
    boss: {
      bpm: 156,
      chords: [[45, 48, 52], [41, 45, 48], [43, 47, 50], [40, 44, 47], [45, 48, 52], [41, 45, 48], [38, 41, 45], [40, 44, 47]],
      mel: [69, 72, 76, 72, 77, 76, 72, 71, 72, 0, 77, 76, 74, 72, 71, 72, 74, 0, 79, 77, 76, 74, 72, 71, 68, 71, 76, 0, 80, 0, 76, 0,
            81, 0, 79, 77, 76, 0, 72, 76, 77, 76, 74, 72, 69, 0, 72, 74, 74, 72, 71, 69, 65, 69, 74, 77, 76, 0, 71, 0, 68, 0, 64, null]
    },
    cage: { // original bouncy tune for the hamster cage
      bpm: 128,
      chords: [[53, 57, 60], [50, 53, 57], [46, 50, 53], [48, 52, 55], [53, 57, 60], [50, 53, 57], [46, 50, 53], [48, 52, 55]],
      mel: [77, 0, 81, 77, 72, 0, 74, 76, 77, 0, 74, 0, 69, 0, null, null, 70, 74, 77, 74, 72, 0, 70, 69, 67, 0, 72, 0, 76, 0, null, null,
            81, 0, 79, 77, 76, 0, 77, 79, 81, 0, 84, 0, 81, 0, 77, 0, 74, 77, 74, 70, 72, 0, 76, 0, 77, 0, 0, 0, null, null, null, null]
    },
    berry: { // sweet, skipping variation in F
      bpm: 132, lead: 'p12',
      chords: [[53, 57, 60], [48, 52, 55], [50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55], [46, 50, 53], [48, 52, 55]],
      mel: [77, 0, 76, 77, 81, 0, 77, 0, 76, 0, 72, 74, 76, 0, null, null, 74, 0, 72, 74, 77, 0, 74, 0, 72, 0, 69, 70, 72, 0, null, null,
            77, 79, 81, 0, 84, 0, 81, 79, 77, 0, 74, 77, 76, 0, 72, 0, 70, 72, 74, 0, 77, 0, 74, 72, 72, 0, 76, 0, 77, 0, null, null]
    },
    race: { // galloping sunset tune in D
      bpm: 150, lead: 'square', gallop: true,
      chords: [[50, 54, 57], [48, 52, 55], [43, 47, 50], [50, 54, 57], [47, 50, 54], [43, 47, 50], [45, 49, 52], [45, 49, 52]],
      mel: [74, 0, 78, 81, 86, 0, 81, 78, 76, 0, 72, 76, 79, 0, 76, 72, 74, 76, 78, 0, 79, 78, 76, 74, 74, 0, 0, 0, 81, 0, null, null,
            83, 0, 81, 78, 79, 0, 76, 74, 71, 0, 74, 79, 78, 0, 74, 0, 76, 78, 79, 81, 83, 81, 79, 78, 76, 0, 73, 0, 76, 0, null, null]
    },
    zoo: { // bouncy marimba-ish tune
      bpm: 120, lead: 'triangle', bell: true,
      chords: [[48, 52, 55], [53, 57, 60], [55, 59, 62], [48, 52, 55], [45, 48, 52], [53, 57, 60], [50, 53, 57], [55, 59, 62]],
      mel: [72, 76, 79, 0, 76, 0, 72, 0, 77, 0, 81, 77, 72, 0, null, null, 79, 0, 74, 77, 79, 0, 83, 0, 84, 0, 79, 0, 76, 0, null, null,
            81, 0, 76, 72, 69, 0, 72, 76, 77, 0, 81, 0, 84, 0, 81, 77, 74, 77, 81, 0, 79, 0, 77, 74, 79, 0, 0, 0, 83, 0, null, null]
    },
    snow: { // slow, glittery winter tune in A minor
      bpm: 96, lead: 'sine', bell: true, soft: true,
      chords: [[45, 48, 52], [41, 45, 48], [48, 52, 55], [43, 47, 50], [45, 48, 52], [41, 45, 48], [38, 41, 45], [40, 44, 47]],
      mel: [76, 0, 0, 72, 69, 0, 72, 76, 77, 0, 0, 76, 72, 0, null, null, 79, 0, 0, 76, 72, 0, 74, 76, 74, 0, 0, 0, 71, 0, null, null,
            81, 0, 0, 79, 76, 0, 77, 79, 77, 0, 76, 74, 72, 0, null, null, 74, 0, 0, 72, 69, 0, 71, 72, 71, 0, 0, 0, 68, 0, null, null]
    },
    night: { // driving concert tune in E minor
      bpm: 148, lead: 'p25', rock: true,
      chords: [[40, 43, 47], [36, 40, 43], [43, 47, 50], [38, 42, 45], [40, 43, 47], [36, 40, 43], [45, 48, 52], [47, 51, 54]],
      mel: [76, 0, 79, 0, 83, 81, 79, 76, 78, 0, 74, 0, 71, 0, 74, 76, 79, 0, 83, 0, 86, 84, 83, 81, 81, 0, 78, 0, 74, 0, null, null,
            88, 0, 86, 83, 84, 0, 83, 79, 81, 0, 79, 76, 78, 0, 74, 0, 76, 79, 83, 0, 84, 0, 83, 81, 83, 0, 0, 0, 87, 0, 88, 0]
    },
    chapel: { // gentle garden-wedding tune in F major, with bells
      bpm: 112, lead: 'triangle', bell: true,
      chords: [[41, 45, 48], [45, 48, 52], [46, 50, 53], [48, 52, 55], [41, 45, 48], [38, 41, 45], [43, 46, 50], [48, 52, 55]],
      mel: [72, 0, 77, 0, 76, 74, 72, 0, 69, 0, 72, 0, 76, 0, 0, 0, 74, 0, 77, 0, 81, 79, 77, 0, 76, 0, 74, 0, 72, 0, null, null,
            77, 0, 81, 0, 84, 0, 81, 77, 74, 0, 77, 0, 81, 0, 0, 0, 79, 0, 77, 74, 70, 0, 74, 0, 72, 0, 76, 0, 79, 0, 77, 76]
    },
    china: { // bouncy pentatonic street-festival tune in D, with bells
      bpm: 132, lead: 'square', bell: true,
      chords: [[38, 42, 45], [38, 42, 45], [35, 38, 42], [40, 43, 47], [38, 42, 45], [43, 47, 50], [40, 43, 47], [45, 49, 52]],
      mel: [74, 0, 76, 78, 81, 0, 78, 0, 76, 0, 74, 0, 71, 0, 74, 0, 81, 0, 83, 81, 78, 0, 76, 78, 76, 0, 0, 0, 71, 0, null, null,
            78, 0, 81, 0, 83, 0, 86, 83, 81, 0, 78, 0, 76, 0, 78, 81, 83, 0, 81, 78, 76, 0, 74, 0, 76, 0, 78, 0, 74, 0, 0, 0]
    },
    // ---- Phase 6 (all original) ----
    club: { // ハロウィンDJナイト: fast minor club tune with a driving beat
      bpm: 170, lead: 'square', rock: true,
      chords: [[45, 48, 52], [41, 45, 48], [43, 47, 50], [40, 43, 47], [45, 48, 52], [41, 45, 48], [43, 47, 50], [40, 44, 47]],
      mel: [69, 0, 72, 0, 76, 0, 72, 69, 65, 0, 69, 72, 77, 0, 76, 0, 74, 0, 71, 0, 67, 0, 71, 74, 76, 0, 0, 0, null, null, 64, 0,
            69, 72, 76, 72, 69, 72, 76, 79, 77, 0, 76, 0, 72, 0, 69, 0, 74, 0, 76, 0, 79, 0, 76, 74, 76, 0, 0, 0, 71, 0, 68, 0]
    },
    runway: { // パリコレ・ランウェイ: a lilting waltz-like line over a steady house beat
      bpm: 124, lead: 'triangle', bell: true,
      chords: [[48, 52, 55], [45, 48, 52], [38, 41, 45], [43, 47, 50]],
      mel: [72, 0, 0, 76, 79, 0, 76, 0, 81, 0, 0, 79, 76, 0, 72, 0, 74, 0, 0, 77, 81, 0, 77, 0, 79, 0, 0, 0, null, null, null, null,
            84, 0, 83, 81, 79, 0, 76, 0, 81, 0, 79, 77, 76, 0, 72, 0, 74, 0, 77, 0, 81, 0, 79, 77, 76, 0, 74, 0, 72, 0, 0, 0]
    },
    ring: { // 両国リング: hard-rock riff
      bpm: 150, lead: 'square', rock: true,
      chords: [[40, 47, 52], [43, 50, 55], [38, 45, 50], [45, 52, 57]],
      mel: [64, 0, 64, 67, 0, 64, 69, 0, 67, 0, 67, 71, 0, 67, 74, 0, 62, 0, 62, 66, 0, 62, 69, 0, 69, 0, 71, 0, 72, 0, 71, 69,
            76, 0, 74, 0, 71, 0, 74, 76, 79, 0, 76, 0, 74, 0, 71, 0, 74, 0, 72, 0, 69, 0, 72, 74, 76, 0, 0, 0, null, null, 64, 66]
    },
    dawn: { // 夜明けの味噌汁: slow lo-fi, warm and sleepy
      bpm: 84, lead: 'sine', soft: true,
      chords: [[41, 45, 48], [38, 41, 45], [46, 50, 53], [48, 52, 55]],
      mel: [69, 0, 0, 0, 72, 0, 0, 0, 74, 0, 72, 0, 69, 0, 0, 0, 70, 0, 0, 0, 74, 0, 77, 0, 76, 0, 0, 0, null, null, null, null,
            77, 0, 76, 0, 72, 0, 69, 0, 70, 0, 69, 0, 65, 0, 0, 0, 67, 0, 70, 0, 74, 0, 72, 0, 72, 0, 0, 0, 0, 0, null, null]
    },
    cherry: { // 山形さくらんぼバスツアー: folk tune with plucked strings
      bpm: 120, lead: 'p12', pluck: true,
      chords: [[38, 41, 45], [36, 40, 43], [41, 45, 48], [43, 46, 50]],
      mel: [74, 0, 77, 0, 79, 0, 81, 0, 79, 77, 74, 0, 72, 0, 74, 0, 77, 0, 79, 0, 81, 0, 84, 81, 79, 0, 0, 0, null, null, 74, 77,
            81, 0, 79, 0, 77, 0, 74, 0, 72, 0, 74, 0, 77, 0, 79, 0, 81, 84, 81, 79, 77, 0, 79, 0, 74, 0, 0, 0, null, null, null, null]
    },
    station: { // 一日駅長・山口駅: bright xylophone-like departure tune
      bpm: 128, lead: 'triangle', bell: true,
      chords: [[43, 47, 50], [40, 43, 47], [38, 42, 45], [45, 48, 52]],
      mel: [79, 0, 83, 0, 86, 0, 83, 0, 84, 0, 81, 0, 78, 0, 81, 0, 79, 0, 83, 0, 86, 0, 91, 0, 88, 0, 0, 0, 86, 0, 0, 0,
            83, 0, 84, 86, 88, 0, 86, 84, 83, 0, 81, 0, 79, 0, 81, 0, 83, 0, 86, 0, 84, 0, 81, 0, 79, 0, 0, 0, null, null, null, null]
    },
    clinic: { // 千客万来クリニック: quick punk riff
      bpm: 180, lead: 'square', rock: true,
      chords: [[38, 45, 50], [35, 42, 47], [43, 50, 55], [45, 52, 57]],
      mel: [74, 74, 0, 74, 76, 0, 78, 0, 81, 0, 78, 0, 76, 0, 74, 0, 71, 71, 0, 71, 74, 0, 76, 0, 78, 0, 0, 0, 76, 0, 74, 0,
            81, 81, 0, 81, 83, 0, 81, 0, 78, 0, 76, 0, 78, 0, 81, 0, 79, 0, 78, 0, 76, 0, 74, 0, 76, 0, 0, 0, null, null, null, null]
    },
    okinawa: { // きょうみお沖縄ミッション: island pop on an island scale, plucked
      bpm: 126, lead: 'p25', pluck: true, bell: true,
      chords: [[36, 40, 43], [41, 45, 48], [43, 47, 50], [36, 40, 43]],
      mel: [72, 0, 76, 77, 79, 0, 76, 0, 77, 0, 76, 0, 72, 0, 0, 0, 71, 0, 72, 0, 76, 0, 79, 0, 77, 0, 76, 0, 72, 0, null, null,
            84, 0, 83, 0, 79, 0, 77, 0, 79, 0, 76, 0, 77, 0, 79, 0, 83, 0, 84, 0, 79, 0, 76, 77, 72, 0, 0, 0, null, null, null, null]
    },
    hq: { // 亨香組 本部: dramatic minor rock with taiko drums
      bpm: 136, lead: 'square', rock: true, taiko: true,
      chords: [[45, 48, 52], [41, 45, 48], [40, 44, 47], [45, 48, 52]],
      mel: [69, 0, 0, 71, 72, 0, 71, 69, 64, 0, 0, 0, 67, 0, 69, 0, 72, 0, 0, 74, 76, 0, 74, 72, 69, 0, 0, 0, null, null, null, null,
            76, 0, 77, 0, 76, 0, 74, 72, 71, 0, 72, 0, 74, 0, 0, 0, 72, 0, 71, 0, 69, 0, 67, 64, 69, 0, 0, 0, 0, 0, null, null]
    },
    encore: { // 20周年への道 ∞: an anthem that keeps going
      bpm: 140, lead: 'square', bell: true,
      chords: [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50], [48, 52, 55], [40, 43, 47], [41, 45, 48], [43, 47, 50]],
      mel: [72, 0, 74, 0, 76, 0, 79, 0, 81, 0, 79, 0, 76, 0, 0, 0, 77, 0, 79, 0, 81, 0, 84, 0, 83, 0, 81, 0, 79, 0, null, null,
            84, 0, 0, 83, 81, 0, 79, 0, 81, 0, 0, 79, 77, 0, 76, 0, 77, 0, 79, 0, 81, 0, 83, 0, 84, 0, 0, 0, 0, 0, null, null]
    },
    title: {
      bpm: 104,
      chords: [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]],
      mel: [79, 0, 76, 0, 72, 0, 76, 79, 81, 0, 79, 0, 76, 0, null, null, 77, 0, 76, 74, 72, 0, 69, 72, 74, 0, 0, 0, 79, 0, null, null]
    }
  };
  function playStep(s, t) {
    const S = SONGS[song], bars = S.chords.length, sd = 60 / S.bpm / 4;
    const bar = Math.floor(s / 16) % bars, ss = s % 16, ch = S.chords[bar];
    // melody (8ths)
    if (ss % 2 === 0) {
      const mi = (bar * 8 + ss / 2) % S.mel.length, m = S.mel[mi];
      if (m) {
        let len = 1; for (let j = mi + 1; j < S.mel.length && S.mel[j] === 0; j++) len++;
        const lead = S.lead || 'p25', lv = lead === 'sine' || lead === 'triangle' ? 0.24 : 0.16;
        tone({ f: mtof(m), t, dur: S.pluck ? sd * 1.1 : sd * 2 * len * 0.92, vol: S.pluck ? lv * 1.3 : lv, type: lead, dest: music });
        tone({ f: mtof(m) * 1.004, t: t + sd * 1.5, dur: sd * 2 * len * 0.7, vol: 0.04, type: 'p12', dest: music }); // echo
        if (S.bell) tone({ f: mtof(m + 12), t, dur: sd * 3, vol: 0.05, type: 'sine', dest: music });
      }
    }
    // bass: root/octave 8ths
    if (S.gallop) { if (ss % 4 !== 1) tone({ f: mtof(ch[0] - 12 + (ss % 4 === 3 ? 7 : 0)), t, dur: sd * 0.9, vol: 0.22, type: 'triangle', dest: music }); }
    else if (ss % 2 === 0) tone({ f: mtof(ch[0] - 12 + ((ss / 2) % 2 ? 12 : 0)), t, dur: sd * 1.8, vol: S.soft ? 0.16 : 0.22, type: 'triangle', dest: music });
    // arp 16ths, quiet
    tone({ f: mtof(ch[ss % 3] + 12), t, dur: sd * 0.8, vol: 0.035, type: 'p12', dest: music });
    // drums
    if (ss % 4 === 0 && !(S.soft && ss % 8)) tone({ f: 150, to: 40, t, dur: 0.12, vol: song === 'title' || S.soft ? 0.2 : 0.35, type: 'sine', dest: music });
    if (S.taiko && (ss === 0 || ss === 6 || ss === 10)) tone({ f: 95, to: 32, t, dur: 0.22, vol: 0.42, type: 'sine', dest: music });
    if (S.rock && ss % 8 === 6) tone({ f: 150, to: 40, t, dur: 0.1, vol: 0.25, type: 'sine', dest: music });
    if (S.rock && ss % 4 === 2) tone({ f: mtof(ch[0]), t, dur: sd * 1.6, vol: 0.05, type: 'square', dest: music });
    if (song !== 'title' && !S.soft) {
      if (ss % 8 === 4) hiss({ t, dur: 0.12, vol: 0.18, hp: 1500, dest: music });
      if (ss % 2 === 1) hiss({ t, dur: 0.03, vol: 0.06, hp: 7000, dest: music });
    } else if (S.soft && ss % 4 === 2) hiss({ t, dur: 0.05, vol: 0.03, hp: 9000, dest: music });
  }
  function tick() {
    if (!ac || !song) return;
    const sd = 60 / SONGS[song].bpm / 4;
    if (nextT < ac.currentTime) nextT = ac.currentTime + 0.05;
    while (nextT < ac.currentTime + 0.15) { playStep(step, nextT); nextT += sd; step++; }
  }
  function playSong(name) {
    if (!ac) return; if (song === name) return;
    song = name; step = 0; nextT = ac.currentTime + 0.08;
    if (!timer) timer = setInterval(tick, 25);
  }
  function stopSong() { song = null; }

  function limited(name, ms) { const n = performance.now(); if (last[name] && n - last[name] < ms) return true; last[name] = n; return false; }
  const fx = {
    shoot() { if (limited('shoot', 60)) return; tone({ f: 990, to: 1500, dur: 0.05, vol: 0.05, type: 'p25' }); },
    hit() { if (limited('hit', 45)) return; hiss({ dur: 0.04, vol: 0.08, hp: 3000 }); },
    kill() { if (limited('kill', 50)) return; tone({ f: 600, to: 200, dur: 0.08, vol: 0.06, type: 'triangle' }); },
    gem() { if (limited('gem', 40)) return; tone({ f: 1320 + Math.random() * 200, to: 1980, dur: 0.06, vol: 0.05, type: 'sine' }); },
    levelup() { if (!ac) return; const t = ac.currentTime; [72, 76, 79, 84, 88].forEach((m, i) => tone({ f: mtof(m), t: t + i * 0.06, dur: 0.18, vol: 0.12, type: 'p25' })); },
    hurt() { if (limited('hurt', 150)) return; tone({ f: 220, to: 70, dur: 0.18, vol: 0.18, type: 'square' }); },
    dash() { hiss({ dur: 0.18, vol: 0.12, hp: 800, sweep: 6000 }); },
    lariat() { tone({ f: 120, to: 50, dur: 0.25, vol: 0.25, type: 'triangle' }); hiss({ dur: 0.2, vol: 0.15, lp: 1200 }); },
    beam() { tone({ f: 300, to: 1800, dur: 0.3, vol: 0.08, type: 'sawtooth' }); tone({ f: 1200, to: 2400, dur: 0.15, vol: 0.05, type: 'p12' }); },
    horse() { if (!ac) return; const t = ac.currentTime; for (let i = 0; i < 6; i++) hiss({ t: t + i * 0.09, dur: 0.03, vol: 0.12, lp: 900 }); tone({ f: 700, to: 1100, dur: 0.25, vol: 0.06, type: 'p25' }); },
    bubble() { if (limited('bubble', 80)) return; tone({ f: 500, to: 1100, dur: 0.07, vol: 0.06, type: 'sine' }); },
    heal() { if (!ac) return; const t = ac.currentTime; [76, 81, 88].forEach((m, i) => tone({ f: mtof(m), t: t + i * 0.07, dur: 0.15, vol: 0.1, type: 'triangle' })); },
    seal() { if (!ac) return; const t = ac.currentTime; [67, 72, 79].forEach((m, i) => tone({ f: mtof(m), t: t + i * 0.09, dur: 0.12, vol: 0.12, type: 'sine', to: mtof(m) * 1.06 })); },
    warn() { if (!ac) return; const t = ac.currentTime; for (let i = 0; i < 4; i++) tone({ f: i % 2 ? 660 : 880, t: t + i * 0.22, dur: 0.2, vol: 0.12, type: 'square' }); },
    chest() { if (!ac) return; const t = ac.currentTime; [67, 72, 76, 79, 84, 88, 91, 96].forEach((m, i) => tone({ f: mtof(m), t: t + i * 0.07, dur: 0.25, vol: 0.1, type: i % 2 ? 'p12' : 'p25' })); },
    tick() { if (limited('tick', 60)) return; tone({ f: 1800 + Math.random() * 400, dur: 0.03, vol: 0.06, type: 'p25' }); },
    magnet() { if (!ac) return; tone({ f: 400, to: 1600, dur: 0.4, vol: 0.12, type: 'p25' }); tone({ f: 600, to: 2400, dur: 0.4, vol: 0.05, type: 'sine' }); },
    freeze() { if (!ac) return; const t = ac.currentTime; [96, 91, 88, 84, 79].forEach((m, i) => tone({ f: mtof(m), t: t + i * 0.05, dur: 0.3, vol: 0.07, type: 'sine' })); },
    mic() { if (limited('mic', 150)) return; tone({ f: 523, to: 784, dur: 0.18, vol: 0.08, type: 'triangle' }); tone({ f: 659, to: 988, dur: 0.18, vol: 0.05, type: 'p12' }); },
    apple() { if (limited('apple', 90)) return; tone({ f: 300, to: 600, dur: 0.08, vol: 0.06, type: 'triangle' }); },
    plop() { if (limited('plop', 70)) return; tone({ f: 220, to: 90, dur: 0.1, vol: 0.12, type: 'sine' }); },
    special() { if (!ac) return; const t = ac.currentTime; // short original sting: rising five-note fanfare, then the blast
      [67, 71, 74, 79, 83].forEach((m, i) => tone({ f: mtof(m), t: t + i * 0.09, dur: 0.16, vol: 0.11, type: i % 2 ? 'p12' : 'p25' }));
      [79, 86, 91].forEach(m => tone({ f: mtof(m), t: t + 0.5, dur: 0.4, vol: 0.07, type: 'triangle' }));
      tone({ f: 140, to: 28, t: t + 0.9, dur: 0.7, vol: 0.34, type: 'triangle' }); hiss({ t: t + 0.9, dur: 0.6, vol: 0.24, lp: 1100 }); },
    cheat() { if (!ac) return; const t = ac.currentTime; [72, 79, 84, 88, 84, 88, 91, 96].forEach((m, i) => tone({ f: mtof(m), t: t + i * 0.08, dur: 0.2, vol: 0.1, type: 'p25' })); },
    coin() { if (limited('coin', 50)) return; tone({ f: 1568, dur: 0.05, vol: 0.06, type: 'p25' }); tone({ f: 2093, t: ac && ac.currentTime + 0.05, dur: 0.08, vol: 0.06, type: 'p25' }); },
    bite() { if (limited('bite', 120)) return; tone({ f: 900, to: 500, dur: 0.06, vol: 0.08, type: 'square' }); tone({ f: 1200, to: 700, dur: 0.05, vol: 0.05, type: 'p25', t: ac && ac.currentTime + 0.07 }); },
    drum() { if (limited('drum', 70)) return; tone({ f: 160, to: 45, dur: 0.14, vol: 0.3, type: 'sine' }); hiss({ dur: 0.08, vol: 0.1, lp: 2500 }); },
    brush() { if (limited('brush', 90)) return; hiss({ dur: 0.16, vol: 0.12, hp: 1200, sweep: 3000 }); },
    boom() { if (!ac) return; tone({ f: 120, to: 30, dur: 0.6, vol: 0.32, type: 'triangle' }); hiss({ dur: 0.55, vol: 0.22, lp: 900 }); const t = ac.currentTime; [72, 76, 79, 84].forEach((m, i) => tone({ f: mtof(m), t: t + 0.1 + i * 0.05, dur: 0.12, vol: 0.06, type: 'p25' })); },
    kanji() { if (limited('kanji', 90)) return; tone({ f: 90, to: 40, dur: 0.25, vol: 0.28, type: 'sine' }); hiss({ dur: 0.12, vol: 0.12, lp: 700 }); },
    evolve() { if (!ac) return; const t = ac.currentTime; [60, 64, 67, 72, 76, 79, 84, 88].forEach((m, i) => tone({ f: mtof(m), t: t + i * 0.05, dur: 0.22, vol: 0.11, type: i % 2 ? 'p12' : 'p25' })); },
    buy() { if (!ac) return; const t = ac.currentTime; [84, 88, 91].forEach((m, i) => tone({ f: mtof(m), t: t + i * 0.06, dur: 0.1, vol: 0.1, type: 'p25' })); },
    borrow() { if (!ac) return; const t = ac.currentTime; [76, 72, 74].forEach((m, i) => tone({ f: mtof(m), t: t + i * 0.12, dur: 0.14, vol: 0.09, type: 'triangle' })); },
    ach() { if (!ac) return; const t = ac.currentTime; [79, 84, 88, 91].forEach((m, i) => tone({ f: mtof(m), t: t + i * 0.08, dur: i === 3 ? 0.4 : 0.12, vol: 0.1, type: 'p25' })); },
    select() { tone({ f: 880, to: 1320, dur: 0.07, vol: 0.08, type: 'p25' }); },
    win() { if (!ac) return; const t = ac.currentTime; [72, 76, 79, 84, 79, 84, 88].forEach((m, i) => tone({ f: mtof(m), t: t + i * 0.13, dur: i === 6 ? 0.8 : 0.16, vol: 0.13, type: 'p25' })); },
    lose() { if (!ac) return; const t = ac.currentTime; [72, 67, 64, 60].forEach((m, i) => tone({ f: mtof(m), t: t + i * 0.2, dur: 0.3, vol: 0.12, type: 'triangle' })); }
  };
  return {
    init, playSong, stopSong, fx,
    get muted() { return muted; },
    toggleMute() { muted = !muted; if (master) master.gain.setTargetAtTime(muted ? 0 : 0.55, ac.currentTime, 0.02); return muted; }
  };
})();

export { Snd };
