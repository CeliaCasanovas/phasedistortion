// SPDX-License-Identifier: GPL-3.0-or-later

// audio transport button + press space!!!!! hint
$("gateBtn").addEventListener("mousedown", gateOn);
$("gateBtn").addEventListener("mouseup", gateOff);
$("gateBtn").addEventListener("mouseleave", gateOff);

function isEditableElement(el) {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT") {
    // Allow range sliders, checkboxes, buttons, etc. – block only text‑like inputs
    const type = el.type;
    if (
      type === "text" ||
      type === "number" ||
      type === "password" ||
      type === "email" ||
      type === "url" ||
      type === "search" ||
      type === "tel"
    ) {
      return true;
    }
    return false;
  }
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

document.addEventListener(
  "keydown",
  (event) => {
    if (event.code !== "Space") return;
    if (event.repeat) return;
    // Only block Space while the user is typing in a true text field
    if (isEditableElement(document.activeElement)) return;

    event.preventDefault();
    event.stopPropagation();
    gateOn();
  },
  { capture: true, passive: false },
);

document.addEventListener(
  "keyup",
  (event) => {
    if (event.code !== "Space") return;
    if (isEditableElement(document.activeElement)) return;

    event.preventDefault();
    event.stopPropagation();
    gateOff();
  },
  { capture: true, passive: false },
);

function drawAllEnvGraphs() {
  const v = (id) => parseFloat($(id).value);
  drawEnvelopeGraph(
    "m-env-graph",
    {
      attack: v("m-env-attack"),
      decay: v("m-env-decay"),
      sustain: v("m-env-sustain"),
      release: v("m-env-release"),
      attackCurve: v("m-env-attack-curve"),
      decayCurve: v("m-env-decay-curve"),
      releaseCurve: v("m-env-release-curve"),
    },
    "#6f42af",
  );
  drawEnvelopeGraph(
    "a-env-graph",
    {
      attack: v("a-env-attack"),
      decay: v("a-env-decay"),
      sustain: v("a-env-sustain"),
      release: v("a-env-release"),
      attackCurve: v("a-env-attack-curve"),
      decayCurve: v("a-env-decay-curve"),
      releaseCurve: v("a-env-release-curve"),
    },
    "#66d9ef",
  );
  drawEnvelopeGraph(
    "f-env-graph",
    {
      attack: v("f-env-attack"),
      decay: v("f-env-decay"),
      sustain: v("f-env-sustain"),
      release: v("f-env-release"),
      attackCurve: v("f-env-attack-curve"),
      decayCurve: v("f-env-decay-curve"),
      releaseCurve: v("f-env-release-curve"),
    },
    "#66d9ef",
  );
}

// audio transport params
$("frequency").addEventListener("input", (e) => {
  const f = freqFromSlider(parseFloat(e.target.value));
  $("frequency-out").textContent =
    `${nearestNoteName(f)}: ${f < 1000 ? Math.round(f) + "Hz" : (f / 1000).toFixed(2) + "kHz"}`;
  sendAllParams();
});

$("volume").addEventListener("input", (e) => {
  $("volume-out").textContent = parseFloat(e.target.value).toFixed(2);
  sendAllParams();
});

// phase distortion oscillator controls
for (const bp of PD_BREAKPOINTS) {
  $(bp.id).addEventListener("input", recalculatePd);
}
$("pd-morph-base").addEventListener("input", recalculatePd);
$("pd-morph-env-amt").addEventListener("input", () => {
  $("pd-morph-env-amt-out").textContent = parseFloat(
    $("pd-morph-env-amt").value,
  ).toFixed(2);
  sendAllParams();
});

// resonance oscillator controls
$("cz-resonanceAmount").addEventListener("input", recalculateCz);
$("cz-windowType").addEventListener("change", recalculateCz);
$("cz-res-env-amt").addEventListener("input", () => {
  $("cz-res-env-amt-out").textContent = parseFloat(
    $("cz-res-env-amt").value,
  ).toFixed(2);
  sendAllParams();
});

// envelope sliders
const envelopeSliderIds = [
  "a-env-attack",
  "a-env-decay",
  "a-env-sustain",
  "a-env-release",
  "a-env-attack-curve",
  "a-env-decay-curve",
  "a-env-release-curve",
  "m-env-attack",
  "m-env-decay",
  "m-env-sustain",
  "m-env-release",
  "m-env-attack-curve",
  "m-env-decay-curve",
  "m-env-release-curve",
];
for (const id of envelopeSliderIds) {
  $(id).addEventListener("input", () => {
    $(`${id}-out`).textContent = parseFloat($(id).value);
    drawAllEnvGraphs();
    sendAllParams();
  });
}

// frequency envelope sliders
const freqEnvIds = [
  "f-env-attack",
  "f-env-decay",
  "f-env-sustain",
  "f-env-release",
  "f-env-attack-curve",
  "f-env-decay-curve",
  "f-env-release-curve",
];
for (const id of freqEnvIds) {
  $(id).addEventListener("input", () => {
    $(`${id}-out`).textContent = parseFloat($(id).value);
    drawAllEnvGraphs();
    sendAllParams();
  });
}
$("f-env-loop").addEventListener("change", sendAllParams);
$("freq-env-enable").addEventListener("change", sendAllParams);
$("f-env-amt").addEventListener("input", () => {
  $("f-env-amt-out").textContent = parseFloat($("f-env-amt").value).toFixed(1);
  sendAllParams();
});

// loop-mode toggles
$("m-env-loop").addEventListener("change", sendAllParams);
$("a-env-loop").addEventListener("change", sendAllParams);

// oscillator toggles
$("pd-enable").addEventListener("change", sendAllParams);
$("cz-enable").addEventListener("change", sendAllParams);

// oscillator tabs
$("btn-pd").addEventListener("click", () => {
  $("btn-pd").setAttribute("aria-selected", "true");
  $("btn-cz").setAttribute("aria-selected", "false");
  $("tab-pd").setAttribute("aria-hidden", "false");
  $("tab-cz").setAttribute("aria-hidden", "true");
});
$("btn-cz").addEventListener("click", () => {
  $("btn-pd").setAttribute("aria-selected", "false");
  $("btn-cz").setAttribute("aria-selected", "true");
  $("tab-pd").setAttribute("aria-hidden", "true");
  $("tab-cz").setAttribute("aria-hidden", "false");
});

// initialise!!!!
const initF = freqFromSlider(parseFloat($("frequency").value));
$("frequency-out").textContent =
  `${nearestNoteName(initF)}: ${initF < 1000 ? Math.round(initF) + "Hz" : (initF / 1000).toFixed(2) + "kHz"}`;

recalculatePd();
recalculateCz();
drawAllEnvGraphs();
requestAnimationFrame(renderModulatedVisuals);

for (const id of envelopeSliderIds) {
  $(`${id}-out`).textContent = parseFloat($(id).value);
}
for (const id of freqEnvIds) {
  $(`${id}-out`).textContent = parseFloat($(id).value);
}
$("f-env-amt-out").textContent = parseFloat($("f-env-amt").value).toFixed(1);
