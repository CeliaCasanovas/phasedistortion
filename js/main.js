// FUCK ICE FUCK FRONTEX DEATH TO ALL EMPIRES
// NO STATE NO CLASSES NO FAMILY NO GODS
// DEATH TO WAGE LABOUR
// els orriolistes són uns pringats i uns fillsdeputa
// josepmaries copejant infinitament
// collboni i illa beats sicaris de la burgesia
// Akirako ^_^

// audio transport button + press space!!!!! hint
document.getElementById("gateBtn").addEventListener("mousedown", gateOn);
document.getElementById("gateBtn").addEventListener("mouseup", gateOff);
document.getElementById("gateBtn").addEventListener("mouseleave", gateOff);

document.addEventListener(
  "keydown",
  (event) => {
    if (event.code !== "Space") return;
    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) gateOn();
  },
  { passive: false },
);

document.addEventListener(
  "keyup",
  (event) => {
    if (event.code !== "Space") return;
    event.preventDefault();
    event.stopPropagation();
    gateOff();
  },
  { passive: false },
);

// audio transport params
document.getElementById("frequency").addEventListener("input", (e) => {
  const f = freqFromSlider(parseFloat(e.target.value));
  document.getElementById("frequency-out").textContent =
    `${nearestNoteName(f)}: ${f < 1000 ? Math.round(f) + "Hz" : (f / 1000).toFixed(2) + "kHz"}`;
  sendAllParams();
});

document.getElementById("volume").addEventListener("input", (e) => {
  document.getElementById("volume-out").textContent = parseFloat(
    e.target.value,
  ).toFixed(2);
  sendAllParams();
});

// phase distortion oscillator controls
for (const bp of PD_BREAKPOINTS) {
  document.getElementById(bp.id).addEventListener("input", recalculatePd);
}
document
  .getElementById("pd-morph-base")
  .addEventListener("input", recalculatePd);
document.getElementById("pd-morph-env-amt").addEventListener("input", () => {
  document.getElementById("pd-morph-env-amt-out").textContent = parseFloat(
    document.getElementById("pd-morph-env-amt").value,
  ).toFixed(2);
  sendAllParams();
});

// resonance oscillator controls
document
  .getElementById("cz-resonanceAmount")
  .addEventListener("input", recalculateCz);
document
  .getElementById("cz-windowType")
  .addEventListener("change", recalculateCz);
document.getElementById("cz-res-env-amt").addEventListener("input", () => {
  document.getElementById("cz-res-env-amt-out").textContent = parseFloat(
    document.getElementById("cz-res-env-amt").value,
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
  document.getElementById(id).addEventListener("input", () => {
    document.getElementById(`${id}-out`).textContent = parseFloat(
      document.getElementById(id).value,
    );
    sendAllParams();
  });
}

// loop-mode toggles
document.getElementById("m-env-loop").addEventListener("change", sendAllParams);
document.getElementById("a-env-loop").addEventListener("change", sendAllParams);

// oscillator toggles
document.getElementById("pd-enable").addEventListener("change", sendAllParams);
document.getElementById("cz-enable").addEventListener("change", sendAllParams);

// oscillator tabs
document.getElementById("btn-pd").addEventListener("click", () => {
  $("btn-pd").setAttribute("aria-selected", "true");
  $("btn-cz").setAttribute("aria-selected", "false");
  $("tab-pd").setAttribute("aria-hidden", "false");
  $("tab-cz").setAttribute("aria-hidden", "true");
});
document.getElementById("btn-cz").addEventListener("click", () => {
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
requestAnimationFrame(renderModulatedVisuals);

for (const id of envelopeSliderIds) {
  $(`${id}-out`).textContent = parseFloat($(id).value);
}
