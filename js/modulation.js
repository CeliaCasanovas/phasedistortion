const modulationState = {
  envelopePhase: "idle",
  envelopeValue: 0,
  phaseStartTime: 0,
  releaseStartValue: 0,
  attackStartLevel: 0,
  morph: 0,
  resonance: 0,
};

function beginGate() {
  modulationState.envelopePhase = "attack";
  modulationState.phaseStartTime = performance.now();
  modulationState.attackStartLevel =
    modulationState.envelopePhase === "idle"
      ? 0
      : modulationState.envelopeValue;
}

function endGate() {
  if (modulationState.envelopePhase !== "idle") {
    modulationState.envelopePhase = "release";
    modulationState.phaseStartTime = performance.now();
    modulationState.releaseStartValue = modulationState.envelopeValue;
  }
}

// are these wrappers really needed? i need some sleep
let gateOn = async function () {
  beginGate();
  await originalGateOn();
};

let gateOff = function () {
  endGate();
  originalGateOff();
};

function evaluateEnvelope() {
  const now = performance.now();
  const elapsed = (now - modulationState.phaseStartTime) / 1000;

  const attack = parseFloat($("m-env-attack").value) / 1000;
  const decay = parseFloat($("m-env-decay").value) / 1000;
  const sustain = parseFloat($("m-env-sustain").value);
  const release = parseFloat($("m-env-release").value) / 1000;
  const looping = $("m-env-loop")?.checked ?? false;

  switch (modulationState.envelopePhase) {
    case "attack":
      modulationState.envelopeValue =
        attack > 0
          ? modulationState.attackStartLevel +
            (1 - modulationState.attackStartLevel) *
              Math.min(elapsed / attack, 1)
          : 1;
      if (elapsed >= attack) {
        modulationState.envelopePhase = "decay";
        modulationState.phaseStartTime = now;
      }
      break;
    case "decay":
      modulationState.envelopeValue =
        decay > 0 ? 1 - (1 - sustain) * Math.min(elapsed / decay, 1) : sustain;
      if (elapsed >= decay) {
        if (looping) {
          modulationState.attackStartLevel = modulationState.envelopeValue;
          modulationState.envelopePhase = "attack";
        } else {
          modulationState.envelopePhase = "sustain";
        }
        modulationState.phaseStartTime = now;
      }
      break;
    case "sustain":
      modulationState.envelopeValue = sustain;
      break;
    case "release":
      modulationState.envelopeValue =
        release > 0
          ? modulationState.releaseStartValue *
            (1 - Math.min(elapsed / release, 1))
          : 0;
      if (elapsed >= release) {
        modulationState.envelopePhase = "idle";
        modulationState.envelopeValue = 0;
      }
      break;
    default:
      modulationState.envelopeValue = 0;
  }
}

function evaluateModulations() {
  evaluateEnvelope();
  modulationState.morph = Math.max(
    0,
    Math.min(
      1,
      parseFloat($("pd-morph-base").value) +
        modulationState.envelopeValue * parseFloat($("pd-morph-env-amt").value),
    ),
  );
  modulationState.resonance = Math.max(
    0,
    Math.min(
      1,
      parseFloat($("cz-resonanceAmount").value) +
        modulationState.envelopeValue * parseFloat($("cz-res-env-amt").value),
    ),
  );
}

function renderModulatedVisuals() {
  evaluateModulations();

  const g = (id) => parseFloat($(id).value);
  const tf = new PhaseDistortionTransferFunction(
    g("pd-x1"),
    g("pd-y1"),
    g("pd-x2"),
    g("pd-y2"),
    g("pd-x3"),
    g("pd-y3"),
    g("pd-x4"),
    g("pd-y4"),
  );

  const targetData = new Float32Array(GRAPH_POINTS);
  const morphedData = new Float32Array(GRAPH_POINTS);
  for (let i = 0; i < GRAPH_POINTS; i++) {
    const p = i / GRAPH_POINTS;
    const source = lookupSine(p);
    const target = lookupSine(tf.distort(p));
    targetData[i] = target;
    morphedData[i] = source + (target - source) * modulationState.morph;
  }

  pdWaveChart.data.datasets[1].data = Array.from(targetData);
  pdWaveChart.data.datasets[2].data = Array.from(morphedData);
  pdWaveChart.update("none");

  const czData = new Float32Array(GRAPH_POINTS);
  const windowType = $("cz-windowType").value;
  const resScaled = modulationState.resonance * 15 + 1;
  for (let i = 0; i < GRAPH_POINTS; i++) {
    const p = i / GRAPH_POINTS;
    czData[i] = lookupSine((p * resScaled) % 1) * calcCzWindow(p, windowType);
  }
  czWaveChart.data.datasets[1].data = Array.from(czData);
  czWaveChart.update("none");

  requestAnimationFrame(renderModulatedVisuals);
}
