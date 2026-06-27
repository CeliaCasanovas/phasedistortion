// i18n.js
const TRANSLATIONS = {
  en: {
    title: "Phase Distortion Engine",
    audioTransport: "// audio transport",
    gateBtn: "Open gate",
    spaceHint: "or press [SPACE]!!",
    vol: "Vol",
    freq: "Freq",
    tablistLabel: "Oscillator tabs",
    tabPD: "Phase Distortion",
    tabCZ: "CZ Resonance",
    pdHeading: "// phase distortion",
    czHeading: "// cz resonance",
    on: "ON",
    transferBreakpoints: "Transfer function breakpoints",
    morphSettings: "Morph Settings",
    baseMorph: "Base Morph",
    envAmount: "Env Amount",
    legendSource: "Source",
    legendTarget: "Target",
    legendMorphed: "Morphed wave",
    legendTransfer: "Transfer Fn",
    resonance: "Resonance",
    baseAmount: "Morph",
    windowType: "Window type",
    windowSaw: "Saw",
    windowTriangle: "Triangle",
    windowTrapezoid: "Trapezoid",
    legendSine: "Base sine",
    legendCZOutput: "Resonant output",
    morphEnvelope: "// morph envelope",
    ampEnvelope: "// amplitude envelope",
    attackMs: "Attack (ms)",
    decayMs: "Decay (ms)",
    sustain: "Sustain level",
    releaseMs: "Release (ms)",
    attackCurve: "Attack Curve",
    decayCurve: "Decay Curve",
    releaseCurve: "Release Curve",
    loop: "Loop",
    noteNames: [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ],
  },
  ca: {
    title: "Motor de distorsió de fase",
    audioTransport: "// transport d'àudio",
    gateBtn: "Obrir gate",
    spaceHint: "o prem [ESPAI]!!",
    vol: "Vol",
    freq: "Freq",
    tablistLabel: "Pestanyes dels oscil·ladors",
    tabPD: "Distorsió de fase",
    tabCZ: "Ressonància CZ",
    pdHeading: "// distorsió de fase",
    czHeading: "// ressonància CZ",
    on: "ON",
    transferBreakpoints: "Punts d'inflexió de la funció de transferència",
    morphSettings: "Paràmetres de morphing",
    baseMorph: "Morphing",
    envAmount: "Quantitat Env",
    legendSource: "Origen",
    legendTarget: "Destinació",
    legendMorphed: "Ona amb morphing",
    legendTransfer: "Funció de transferència",
    resonance: "Ressonància",
    baseAmount: "Morphing",
    windowType: "Tipus de finestra",
    windowSaw: "Serra",
    windowTriangle: "Triangle",
    windowTrapezoid: "Trapezoïde",
    legendSine: "Sinus base",
    legendCZOutput: "Sortida resonant",
    morphEnvelope: "// envoltant de morphing",
    ampEnvelope: "// envoltant d'amplitud",
    attackMs: "Atac (ms)",
    decayMs: "Caiguda (ms)",
    sustain: "Nivell de sostingut",
    releaseMs: "Cua (ms)",
    attackCurve: "Corba d'atac",
    decayCurve: "Corba de caiguda",
    releaseCurve: "Corba de cua",
    loop: "Mode cíclic",
    noteNames: [
      "Do",
      "Do#",
      "Re",
      "Re#",
      "Mi",
      "Fa",
      "Fa#",
      "Sol",
      "Sol#",
      "La",
      "La#",
      "Si",
    ],
  },
  ja: {
    title: "フェーズ・ディストーション・エンジン",
    audioTransport: "// オーディオ・トランスポート",
    gateBtn: "ゲートを開く",
    spaceHint: "または [スペース] を押しぃ！！",
    vol: "音量",
    freq: "周波数",
    tablistLabel: "オシレーター・タブ",
    tabPD: "フェーズ・ディストーション",
    tabCZ: "CZ レゾナンス",
    pdHeading: "// フェーズ・ディストーション",
    czHeading: "// CZ レゾナンス",
    on: "ON",
    transferBreakpoints: "伝達関数のブレークポイント",
    morphSettings: "モーフ設定",
    baseMorph: "ベース・モーフ",
    envAmount: "エンベロープ量",
    legendSource: "ソース",
    legendTarget: "ターゲット",
    legendMorphed: "モーフ波形",
    legendTransfer: "伝達関数",
    resonance: "レゾナンス",
    baseAmount: "モーフ",
    windowType: "ウィンドウ・タイプ",
    windowSaw: "のこぎり波",
    windowTriangle: "三角波",
    windowTrapezoid: "台形波",
    legendSine: "基本サイン波",
    legendCZOutput: "レゾナント出力",
    morphEnvelope: "// モーフ・エンベロープ",
    ampEnvelope: "// アンプ・エンベロープ",
    attackMs: "アタック (ms)",
    decayMs: "ディケイ (ms)",
    sustain: "サステイン・レベル",
    releaseMs: "リリース (ms)",
    attackCurve: "アタック・カーブ",
    decayCurve: "ディケイ・カーブ",
    releaseCurve: "リリース・カーブ",
    loop: "ループ",
    noteNames: [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ],
  },
};

function applyLanguage(lang) {
  document.documentElement.lang = lang;
  document.title = TRANSLATIONS[lang].title;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (TRANSLATIONS[lang][key]) {
      el.textContent = TRANSLATIONS[lang][key];
    }
  });

  document.querySelectorAll("option[data-i18n]").forEach((opt) => {
    const key = opt.dataset.i18n;
    if (TRANSLATIONS[lang][key]) {
      opt.textContent = TRANSLATIONS[lang][key];
    }
  });

  const tablist = document.getElementById("tablist");
  if (tablist) {
    tablist.setAttribute("aria-label", TRANSLATIONS[lang].tablistLabel);
  }

  NOTE_NAMES = TRANSLATIONS[lang].noteNames;
  const freqSlider = document.getElementById("frequency");
  if (freqSlider) {
    const f = freqFromSlider(parseFloat(freqSlider.value));
    document.getElementById("frequency-out").textContent =
      `${nearestNoteName(f)}: ${f < 1000 ? Math.round(f) + "Hz" : (f / 1000).toFixed(2) + "kHz"}`;
  }

  localStorage.setItem("synth-lang", lang);
}

const langToggle = document.getElementById("langToggle");
const savedLang =
  localStorage.getItem("synth-lang") ||
  Object.keys(TRANSLATIONS).find((lang) =>
    navigator.language.startsWith(lang),
  ) ||
  "en";
langToggle.value = savedLang;
applyLanguage(savedLang);

langToggle.addEventListener("change", () => {
  applyLanguage(langToggle.value);
});
