const workletCode = `
          const TABLE_SIZE = ${TABLE_SIZE};
          const TABLE_MASK = ${TABLE_MASK};
          const MIN_GAP = ${MIN_GAP};

          const SINE_TABLE = new Float32Array(TABLE_SIZE);
          for (let i = 0; i < TABLE_SIZE; i++) {
            SINE_TABLE[i] = Math.sin(2 * Math.PI * i / TABLE_SIZE);
          }

          function lookupSine(phase) {
            let idx = phase * TABLE_SIZE;
            let i0 = idx | 0;
            let i1 = (i0 + 1) & TABLE_MASK;
            return SINE_TABLE[i0] + (SINE_TABLE[i1] - SINE_TABLE[i0]) * (idx - i0);
          }

          class SynthEnvelope {
            constructor(sampleRateMs) {
              this.sampleRateMs = sampleRateMs;
              this.stage = "Idle";
              this.counter = 0;
              this.currentLevel = 0;
              this.segmentStartLevel = 0;
              this.attackStartLevel = 0;
              this.attackMs = 0;
              this.decayMs = 0;
              this.releaseMs = 0;
              this.sustainLevel = 0;
              this.attackCurve = 1;
              this.decayCurve = 1;
              this.releaseCurve = 1;
              this.loop = false;
            }

            get attackSamples() { return this.attackMs * this.sampleRateMs; }
            get decaySamples()  { return this.decayMs  * this.sampleRateMs; }
            get releaseSamples(){ return this.releaseMs * this.sampleRateMs; }

            noteOn() {
              this.attackStartLevel = (this.stage === "Idle") ? 0 : this.currentLevel;
              this.segmentStartLevel = this.attackStartLevel;
              this.stage = "Attack";
              this.counter = 0;
            }

            noteOff() {
              if (this.stage === "Idle" || this.stage === "Release") return;
              this.segmentStartLevel = this.currentLevel;
              this.stage = "Release";
              this.counter = 0;
            }

            getStageParams(stage) {
              switch (stage) {
                case "Attack":
                  return {
                    start: this.attackStartLevel,
                    end: 1,
                    samples: this.attackSamples,
                    curve: this.attackCurve
                  };
                case "Decay":
                  return {
                    start: 1,
                    end: this.sustainLevel,
                    samples: this.decaySamples,
                    curve: this.decayCurve
                  };
                case "Release":
                  return {
                    start: this.segmentStartLevel,
                    end: 0,
                    samples: this.releaseSamples,
                    curve: this.releaseCurve
                  };
                default:
                  return { start: 0, end: 0, samples: 0, curve: 1 };
              }
            }

            getNextStage(current) {
              switch (current) {
                case "Attack":  return "Decay";
                case "Decay":   return this.loop ? "Attack" : "Sustain";
                case "Release": return "Idle";
                default:        return "Idle";
              }
            }

            shapeCurve(t, curve) {
              if (curve === 1.0) return t;
              if (curve === 2.0) return t * t;
              if (curve === 0.5) return Math.sqrt(t);
              return Math.pow(t, curve);
            }

            calculateBlock(outputBuffer) {
              const len = outputBuffer.length;
              if (this.stage === "Idle") {
                outputBuffer.fill(0);
                return;
              }

              for (let i = 0; i < len; i++) {
                if (this.stage === "Idle") {
                  outputBuffer[i] = 0;
                  continue;
                }
                if (this.stage === "Sustain") {
                  this.currentLevel = this.sustainLevel;
                  outputBuffer[i] = this.currentLevel;
                  continue;
                }

                let params = this.getStageParams(this.stage);

                if (this.counter >= params.samples) {
                  this.currentLevel = params.end;

                  if (this.stage === "Decay" && this.loop) {
                    this.attackStartLevel = this.currentLevel;
                  }

                  this.stage = this.getNextStage(this.stage);
                  this.segmentStartLevel = this.currentLevel;
                  this.counter = 0;
                  params = this.getStageParams(this.stage);

                  if (this.stage === "Idle") {
                    outputBuffer[i] = 0;
                    for (let j = i + 1; j < len; j++) {
                      outputBuffer[j] = 0;
                    }
                    return;
                  }

                  if (this.stage === "Sustain") {
                    this.currentLevel = this.sustainLevel;
                    outputBuffer[i] = this.currentLevel;
                    continue;
                  }
                }

                // Compute current sample within the segment
                if (params.samples > 0) {
                  const t = this.counter / params.samples;
                  this.currentLevel = params.start + (params.end - params.start) * this.shapeCurve(t, params.curve);
                } else {
                  this.currentLevel = params.end;
                }

                outputBuffer[i] = this.currentLevel;
                this.counter++;
              }
            }
          }

          class PhaseDistortionTransferFunction {
            constructor(x1, y1, x2, y2, x3, y3, x4, y4) {
              this.x1 = Math.max(x1, MIN_GAP);
              this.x2 = Math.min(Math.max(x2, this.x1 + MIN_GAP), 1 - 3 * MIN_GAP);
              this.x3 = Math.min(Math.max(x3, this.x2 + MIN_GAP), 1 - 2 * MIN_GAP);
              this.x4 = Math.min(Math.max(x4, this.x3 + MIN_GAP), 1 - MIN_GAP);
              this.y1 = Math.max(0, Math.min(1, y1)); this.y2 = Math.max(0, Math.min(1, y2));
              this.y3 = Math.max(0, Math.min(1, y3)); this.y4 = Math.max(0, Math.min(1, y4));
              this.m1 = this.y1 / this.x1;
              this.m2 = (this.y2 - this.y1) / (this.x2 - this.x1);
              this.m3 = (this.y3 - this.y2) / (this.x3 - this.x2);
              this.m4 = (this.y4 - this.y3) / (this.x4 - this.x3);
              this.m5 = (1 - this.y4) / (1 - this.x4);
            }
            distort(p) {
              if (p <= this.x1) return p * this.m1;
              if (p <= this.x2) return this.y1 + (p - this.x1) * this.m2;
              if (p <= this.x3) return this.y2 + (p - this.x2) * this.m3;
              if (p <= this.x4) return this.y3 + (p - this.x3) * this.m4;
              return this.y4 + (p - this.x4) * this.m5;
            }
          }

          function calcCzWindow(p, type) {
            if (type === "Saw") return 1 - p;
            if (type === "Triangle") return p < 0.5 ? p * 2 : (1 - p) * 2;
            if (type === "Trapezoid") return (p >= 0.25 && p <= 0.75) ? 1 : (p < 0.25 ? p * 4 : (1 - p) * 4);
            return 1;
          }

          class PDProcessor extends AudioWorkletProcessor {
            constructor() {
              super();
              const sampleRateMs = globalThis.sampleRate / 1000;
              this.ampEnv = new SynthEnvelope(sampleRateMs);
              this.morphEnv = new SynthEnvelope(sampleRateMs);

              this.frequency = 440;
              this.volume = 0.5;
              this.pdOn = true;
              this.czOn = false;
              this.baseMorph = 0.2;
              this.pdEnvAmt = 0.75;
              this.baseCzRes = 0;
              this.czEnvAmt = 0.5;
              this.czWinType = 'Saw';
              this.currentTF = new PhaseDistortionTransferFunction(0.1,0.25,0.3,0.5,0.5,0.5,0.75,0.9);
              this.phase = 0;

              this.port.onmessage = (event) => {
                const msg = event.data;
                if (msg.type === 'noteOn') {
                  this.ampEnv.noteOn();
                  this.morphEnv.noteOn();
                } else if (msg.type === 'noteOff') {
                  this.ampEnv.noteOff();
                  this.morphEnv.noteOff();
                } else if (msg.type === 'setParams') {
                  const p = msg.params;
                  this.frequency = p.frequency;
                  this.volume = p.volume;
                  this.pdOn = p.pdOn;
                  this.czOn = p.czOn;
                  this.baseMorph = p.baseMorph;
                  this.pdEnvAmt = p.pdEnvAmt;
                  this.baseCzRes = p.baseCzRes;
                  this.czEnvAmt = p.czEnvAmt;
                  this.czWinType = p.czWinType;

                  Object.assign(this.ampEnv, p.ampEnv);
                  Object.assign(this.morphEnv, p.morphEnv);

                  const tf = p.tf;
                  this.currentTF = new PhaseDistortionTransferFunction(
                    tf.x1, tf.y1, tf.x2, tf.y2, tf.x3, tf.y3, tf.x4, tf.y4
                  );
                }
              };
            }

            process(inputs, outputs, parameters) {
              const output = outputs[0];
              if (!output || output.length === 0) return true;
              const channel = output[0];
              const blockSize = channel.length;

              const ampEnvArray = new Float32Array(blockSize);
              const morphEnvArray = new Float32Array(blockSize);
              this.ampEnv.calculateBlock(ampEnvArray);
              this.morphEnv.calculateBlock(morphEnvArray);

              const phaseInc = this.frequency / globalThis.sampleRate;

              for (let i = 0; i < blockSize; i++) {
                this.phase += phaseInc;
                if (this.phase >= 1.0) this.phase -= 1.0;

                let pdOut = 0;
                let czOut = 0;

                if (this.pdOn) {
                  let morph = Math.max(0, Math.min(1, this.baseMorph + morphEnvArray[i] * this.pdEnvAmt));
                  let distortedP = this.currentTF.distort(this.phase);
                  let sSrc = lookupSine(this.phase);
                  let sDst = lookupSine(distortedP);
                  pdOut = sSrc + (sDst - sSrc) * morph;
                }

                if (this.czOn) {
                  let resAmt = Math.max(0, Math.min(1, this.baseCzRes + morphEnvArray[i] * this.czEnvAmt));
                  let resScaled = resAmt * 15 + 1;
                  if (this.czPhase === undefined) this.czPhase = 0;
                  this.czPhase = (this.phase * resScaled) % 1.0;
                  if (this.czPhase >= 1.0) this.czPhase -= 1.0;
                  let cSrc = lookupSine(this.czPhase);
                  let win = calcCzWindow(this.phase, this.czWinType);
                  czOut = cSrc * win;
                }

                let mix = pdOut + czOut;
                if (this.pdOn && this.czOn) mix *= 0.5;
                channel[i] = mix * ampEnvArray[i] * this.volume;
              }

              return true;
            }
          }

          registerProcessor('pd-processor', PDProcessor);
        `;

let isAudioInit = false;
let audioCtx;
let audioWorkletNode;

async function initAudio() {
  if (isAudioInit) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  await audioCtx.audioWorklet.addModule(
    URL.createObjectURL(
      new Blob([workletCode], { type: "application/javascript" }),
    ),
  );
  audioWorkletNode = new AudioWorkletNode(audioCtx, "pd-processor");
  audioWorkletNode.connect(audioCtx.destination);
  isAudioInit = true;
  sendAllParams();
}

function sendAllParams() {
  if (!audioWorkletNode) return;
  const g = (id) => parseFloat(document.getElementById(id).value);
  audioWorkletNode.port.postMessage({
    type: "setParams",
    params: {
      frequency: freqFromSlider(g("frequency")),
      volume: g("volume"),
      pdOn: document.getElementById("pd-enable").checked,
      czOn: document.getElementById("cz-enable").checked,
      baseMorph: g("pd-morph-base"),
      pdEnvAmt: g("pd-morph-env-amt"),
      baseCzRes: g("cz-resonanceAmount"),
      czEnvAmt: g("cz-res-env-amt"),
      czWinType: document.getElementById("cz-windowType").value,
      ampEnv: {
        attackMs: g("a-env-attack"),
        decayMs: g("a-env-decay"),
        sustainLevel: g("a-env-sustain"),
        releaseMs: g("a-env-release"),
        attackCurve: g("a-env-attack-curve"),
        decayCurve: g("a-env-decay-curve"),
        releaseCurve: g("a-env-release-curve"),
        loop: document.getElementById("a-env-loop").checked,
      },
      morphEnv: {
        attackMs: g("m-env-attack"),
        decayMs: g("m-env-decay"),
        sustainLevel: g("m-env-sustain"),
        releaseMs: g("m-env-release"),
        attackCurve: g("m-env-attack-curve"),
        decayCurve: g("m-env-decay-curve"),
        releaseCurve: g("m-env-release-curve"),
        loop: document.getElementById("m-env-loop").checked,
      },
      tf: {
        x1: g("pd-x1"),
        y1: g("pd-y1"),
        x2: g("pd-x2"),
        y2: g("pd-y2"),
        x3: g("pd-x3"),
        y3: g("pd-y3"),
        x4: g("pd-x4"),
        y4: g("pd-y4"),
      },
    },
  });
}

// wrapped in modulation.js, maybe this is an antipattern or something? whatevs
function originalGateOn() {
  if (!isAudioInit) {
    initAudio().then(() => {
      if (audioCtx.state === "suspended") audioCtx.resume();
      audioWorkletNode.port.postMessage({ type: "noteOn" });
      $("gateBtn").classList.add("active");
      $("gateBtn").setAttribute("aria-pressed", "true");
    });
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
