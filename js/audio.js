// SPDX-License-Identifier: GPL-3.0-or-later
let isAudioInit = false;
let audioCtx;
let audioWorkletNode;

async function initAudio() {
  if (isAudioInit) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  try {
    await audioCtx.audioWorklet.addModule("js/worklet-processor.js");
  } catch {
    try {
      const resp = await fetch("js/worklet-processor.js");
      await audioCtx.audioWorklet.addModule(
        URL.createObjectURL(
          new Blob([await resp.text()], { type: "application/javascript" }),
        ),
      );
    } catch (e) {
      console.error(
        "audioWorklet.addModule doesn't work with file:// so either serve it (npx serve or python -m http.server then open your localhost at the right port) or embed worklet-processor.js code as a string :(",
        e,
      );
      return;
    }
  }
  audioWorkletNode = new AudioWorkletNode(audioCtx, "pd-processor");
  audioWorkletNode.connect(audioCtx.destination);
  isAudioInit = true;
  sendAllParams();
}

function sendAllParams() {
  if (!audioWorkletNode) return;
  const v = (id) => parseFloat($(id).value);
  audioWorkletNode.port.postMessage({
    type: "setParams",
    params: {
      frequency: freqFromSlider(v("frequency")),
      volume: v("volume"),
      pdOn: $("pd-enable").checked,
      czOn: $("cz-enable").checked,
      baseMorph: v("pd-morph-base"),
      pdEnvAmt: v("pd-morph-env-amt"),
      baseCzRes: v("cz-resonanceAmount"),
      czEnvAmt: v("cz-res-env-amt"),
      czWinType: $("cz-windowType").value,
      ampEnv: {
        attackMs: v("a-env-attack"),
        decayMs: v("a-env-decay"),
        sustainLevel: v("a-env-sustain"),
        releaseMs: v("a-env-release"),
        attackCurve: v("a-env-attack-curve"),
        decayCurve: v("a-env-decay-curve"),
        releaseCurve: v("a-env-release-curve"),
        loop: $("a-env-loop").checked,
      },
      morphEnv: {
        attackMs: v("m-env-attack"),
        decayMs: v("m-env-decay"),
        sustainLevel: v("m-env-sustain"),
        releaseMs: v("m-env-release"),
        attackCurve: v("m-env-attack-curve"),
        decayCurve: v("m-env-decay-curve"),
        releaseCurve: v("m-env-release-curve"),
        loop: $("m-env-loop").checked,
      },
      freqEnvOn: $("freq-env-enable").checked,
      freqEnvAmt: v("f-env-amt"),
      freqEnv: {
        attackMs: v("f-env-attack"),
        decayMs: v("f-env-decay"),
        sustainLevel: v("f-env-sustain"),
        releaseMs: v("f-env-release"),
        attackCurve: v("f-env-attack-curve"),
        decayCurve: v("f-env-decay-curve"),
        releaseCurve: v("f-env-release-curve"),
        loop: $("f-env-loop").checked,
      },
      tf: {
        x1: v("pd-x1"),
        y1: v("pd-y1"),
        x2: v("pd-x2"),
        y2: v("pd-y2"),
        x3: v("pd-x3"),
        y3: v("pd-y3"),
        x4: v("pd-x4"),
        y4: v("pd-y4"),
      },
    },
  });
}

function originalGateOn() {
  if (!isAudioInit) {
    initAudio()
      .then(() => {
        if (audioCtx.state === "suspended") audioCtx.resume();
        audioWorkletNode.port.postMessage({ type: "noteOn" });
        $("gateBtn").classList.add("active");
        $("gateBtn").setAttribute("aria-pressed", "true");
      })
      .catch(console.error);
  } else {
    if (audioCtx.state === "suspended") audioCtx.resume();
    audioWorkletNode.port.postMessage({ type: "noteOn" });
    $("gateBtn").classList.add("active");
    $("gateBtn").setAttribute("aria-pressed", "true");
  }
}

function originalGateOff() {
  if (!audioWorkletNode) return;
  audioWorkletNode.port.postMessage({ type: "noteOff" });
  $("gateBtn").classList.remove("active");
  $("gateBtn").setAttribute("aria-pressed", "false");
}
