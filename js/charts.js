// SPDX-License-Identifier: GPL-3.0-or-later
const GRAPH_POINTS = 2048;
const xLabels = Array.from({ length: GRAPH_POINTS }, (_, i) => i);
const sineGraphData = new Float32Array(GRAPH_POINTS);
for (let i = 0; i < GRAPH_POINTS; i++) {
  sineGraphData[i] = lookupSine(i / GRAPH_POINTS);
}

const chartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { display: false },
    y: {
      min: -1.1,
      max: 1.1,
      ticks: { color: "#9c9886", font: { size: 8 } },
      grid: { color: "rgba(248,248,242,0.08)" },
    },
  },
};

const pdWaveChart = new Chart($("pd-waveChart"), {
  type: "line",
  data: {
    labels: xLabels,
    datasets: [
      {
        data: Array.from(sineGraphData),
        borderColor: "#66d9ef",
        borderWidth: 1.5,
        pointRadius: 0,
      },
      { data: [], borderColor: "#ff007f", borderWidth: 1.5, pointRadius: 0 },
      { data: [], borderColor: "#a6e22e", borderWidth: 2, pointRadius: 0 },
    ],
  },
  options: chartOpts,
});

const pdTransferChart = new Chart($("pd-transferChart"), {
  type: "line",
  data: {
    datasets: [
      {
        data: [],
        borderColor: "#6f42af",
        borderWidth: 1.5,
        pointRadius: 1,
        pointBackgroundColor: "#ff007f",
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        type: "linear",
        min: 0,
        max: 1,
        ticks: { display: false },
        grid: { display: false },
      },
      y: {
        min: 0,
        max: 1,
        ticks: { color: "#9c9886", font: { size: 8 } },
        grid: { color: "rgba(248,248,242,0.08)" },
      },
    },
  },
});

const czWaveChart = new Chart($("cz-waveChart"), {
  type: "line",
  data: {
    labels: xLabels,
    datasets: [
      {
        data: Array.from(sineGraphData),
        borderColor: "#66d9ef",
        borderWidth: 1,
        pointRadius: 0,
      },
      { data: [], borderColor: "#fd971f", borderWidth: 1.5, pointRadius: 0 },
    ],
  },
  options: chartOpts,
});

const PD_BREAKPOINTS = [
  { id: "pd-x1", label: "X1", min: 0.02, max: 0.97, step: 0.001, value: 0.1 },
  { id: "pd-y1", label: "Y1", min: 0, max: 1, step: 0.001, value: 0.25 },
  { id: "pd-x2", label: "X2", min: 0.03, max: 0.98, step: 0.001, value: 0.3 },
  { id: "pd-y2", label: "Y2", min: 0, max: 1, step: 0.001, value: 0.5 },
  { id: "pd-x3", label: "X3", min: 0.04, max: 0.98, step: 0.001, value: 0.5 },
  { id: "pd-y3", label: "Y3", min: 0, max: 1, step: 0.001, value: 0.5 },
  { id: "pd-x4", label: "X4", min: 0.05, max: 0.98, step: 0.001, value: 0.75 },
  { id: "pd-y4", label: "Y4", min: 0, max: 1, step: 0.001, value: 0.9 },
];

(function buildBreakpointsUI() {
  const grid = $("pd-breakpoints");
  for (const bp of PD_BREAKPOINTS) {
    const div = document.createElement("div");
    div.className = "control";
    div.innerHTML = `<label for="${bp.id}">${bp.label}</label>
            <input type="range" id="${bp.id}" min="${bp.min}" max="${bp.max}" step="${bp.step}" value="${bp.value}" />
            <output for="${bp.id}" id="${bp.id}-out">${bp.value.toFixed(2)}</output>`;
    grid.appendChild(div);
  }
})();

const _envCanvasSize = new Map();

function drawEnvelopeGraph(id, params, color) {
  const canvas = $(id);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width | 0;
  const h = rect.height | 0;
  if (w === 0 || h === 0) return;

  const key = _envCanvasSize.get(id);
  if (!key || key.w !== w || key.h !== h || key.dpr !== dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    _envCanvasSize.set(id, { w, h, dpr });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  ctx.clearRect(0, 0, w, h);

  const {
    attack,
    decay,
    sustain,
    release,
    attackCurve,
    decayCurve,
    releaseCurve,
  } = params;
  const sustainVisible = Math.max(attack + decay, release) * 0.4;
  const total = attack + decay + sustainVisible + release;
  if (total === 0) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();

  const seg = (tStart, tEnd, startLevel, endLevel, curve, samples) => {
    const steps = Math.max(2, Math.min(60, Math.round(samples / 5)));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const progress = shapeCurve(t, curve);
      const level = startLevel + (endLevel - startLevel) * progress;
      const x = ((tStart + t * (tEnd - tStart)) / total) * w;
      const y = h - level * (h - 4) - 2;
      ctx.lineTo(x, y);
    }
  };

  let currentTime = 0;
  ctx.moveTo(0, h);
  seg(currentTime, currentTime + attack, 0, 1, attackCurve, attack);
  currentTime += attack;
  seg(currentTime, currentTime + decay, 1, sustain, decayCurve, decay);
  currentTime += decay;
  seg(
    currentTime,
    currentTime + sustainVisible,
    sustain,
    sustain,
    1,
    sustainVisible,
  );
  currentTime += sustainVisible;
  seg(currentTime, currentTime + release, sustain, 0, releaseCurve, release);

  ctx.stroke();

  // subtle fill
  ctx.lineTo(
    currentTime + release > 0 ? ((currentTime + release) / total) * w : 0,
    h,
  );
  ctx.closePath();
  ctx.fillStyle = color + "18";
  ctx.fill();
}

let recalculatingPd = false;

function recalculatePd() {
  if (recalculatingPd) return;
  recalculatingPd = true;

  const v = (id) => parseFloat($(id).value);
  let prev = v("pd-x1");
  for (const id of ["pd-x2", "pd-x3", "pd-x4"]) {
    const el = $(id);
    const needed = prev + MIN_GAP;
    if (v(id) < needed) el.value = Math.min(needed, parseFloat(el.max));
    prev = v(id);
  }
  for (const bp of PD_BREAKPOINTS) {
    $(`${bp.id}-out`).textContent = v(bp.id).toFixed(2);
  }

  $(`pd-morph-base-out`).textContent = v("pd-morph-base").toFixed(2);
  const tf = new PhaseDistortionTransferFunction(
    v("pd-x1"),
    v("pd-y1"),
    v("pd-x2"),
    v("pd-y2"),
    v("pd-x3"),
    v("pd-y3"),
    v("pd-x4"),
    v("pd-y4"),
  );

  const targetData = new Float32Array(GRAPH_POINTS);
  const morphedData = new Float32Array(GRAPH_POINTS);
  for (let i = 0; i < GRAPH_POINTS; i++) {
    const p = i / GRAPH_POINTS;
    const source = lookupSine(p);
    const target = lookupSine(tf.distort(p));
    targetData[i] = target;
    morphedData[i] = source + (target - source) * v("pd-morph-base");
  }

  pdWaveChart.data.datasets[1].data = Array.from(targetData);
  pdWaveChart.data.datasets[2].data = Array.from(morphedData);
  pdWaveChart.update("none");

  pdTransferChart.data.datasets[0].data = [
    { x: 0, y: 0 },
    { x: tf.x1, y: tf.y1 },
    { x: tf.x2, y: tf.y2 },
    { x: tf.x3, y: tf.y3 },
    { x: tf.x4, y: tf.y4 },
    { x: 1, y: 1 },
  ];
  pdTransferChart.update("none");
  recalculatingPd = false;
  sendAllParams();
}

function recalculateCz() {
  const amt = parseFloat($("cz-resonanceAmount").value);
  const type = $("cz-windowType").value;
  $("cz-resonanceAmount-out").textContent = amt.toFixed(2);
  sendAllParams();
}
