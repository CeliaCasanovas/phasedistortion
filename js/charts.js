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

const pdWaveChart = new Chart(document.getElementById("pd-waveChart"), {
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

const pdTransferChart = new Chart(document.getElementById("pd-transferChart"), {
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

const czWaveChart = new Chart(document.getElementById("cz-waveChart"), {
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
  const grid = document.getElementById("pd-breakpoints");
  for (const bp of PD_BREAKPOINTS) {
    const div = document.createElement("div");
    div.className = "control";
    div.innerHTML = `<label for="${bp.id}">${bp.label}</label>
            <input type="range" id="${bp.id}" min="${bp.min}" max="${bp.max}" step="${bp.step}" value="${bp.value}" />
            <output for="${bp.id}" id="${bp.id}-out">${bp.value.toFixed(2)}</output>`;
    grid.appendChild(div);
  }
})();

let recalculatingPd = false;

function recalculatePd() {
  if (recalculatingPd) return;
  recalculatingPd = true;

  const g = (id) => parseFloat(document.getElementById(id).value);
  let prev = g("pd-x1");
  for (const id of ["pd-x2", "pd-x3", "pd-x4"]) {
    const el = document.getElementById(id);
    const needed = prev + MIN_GAP;
    if (g(id) < needed) el.value = Math.min(needed, parseFloat(el.max));
    prev = g(id);
  }
  for (const bp of PD_BREAKPOINTS) {
    document.getElementById(`${bp.id}-out`).textContent = g(bp.id).toFixed(2);
  }

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
  const baseMorph = g("pd-morph-base");
  document.getElementById("pd-morph-base-out").textContent =
    baseMorph.toFixed(2);

  const targetData = new Float32Array(GRAPH_POINTS);
  const morphedData = new Float32Array(GRAPH_POINTS);
  for (let i = 0; i < GRAPH_POINTS; i++) {
    const p = i / GRAPH_POINTS;
    const sSrc = lookupSine(p);
    const sDst = lookupSine(tf.distort(p));
    targetData[i] = sDst;
    morphedData[i] = sSrc + (sDst - sSrc) * baseMorph;
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
  sendAllParams(); // audio.js
}

function recalculateCz() {
  const amt = parseFloat(document.getElementById("cz-resonanceAmount").value);
  const type = document.getElementById("cz-windowType").value;
  document.getElementById("cz-resonanceAmount-out").textContent =
    amt.toFixed(2);
  const resScaled = amt * 15 + 1;
  const czData = new Float32Array(GRAPH_POINTS);
  for (let i = 0; i < GRAPH_POINTS; i++) {
    const p = i / GRAPH_POINTS;
    const resoPhase = (p * resScaled) % 1.0;
    czData[i] = lookupSine(resoPhase) * calcCzWindow(p, type);
  }
  czWaveChart.data.datasets[1].data = Array.from(czData);
  czWaveChart.update("none");
  sendAllParams();
}
