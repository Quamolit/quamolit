import {
  progress,
  redraw_fixture_$x_ as redraw,
  reset_fixture_$x_ as reset,
  step_fixture_$x_ as step,
} from "../js-out/quamolit.test.frame-fixture.mjs";

const canvas = document.querySelector("#frame");
const context = canvas.getContext("2d", { willReadFrequently: true });
const status = document.querySelector("#status");
const samples = [0, 0.25, 0.5, 0.75, 1];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function clear() {
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
}

function pixel(x, y) {
  return Array.from(context.getImageData(x, y, 1, 1).data);
}

function renderAt(seconds) {
  assert(Number.isFinite(seconds) && seconds >= 0, "Time must be non-negative and finite");
  reset();
  clear();
  step(context, seconds);
  const center = Math.round(48 + 160 * seconds);
  assert(Math.abs(progress() - seconds) < 1e-9, `Wrong progress at ${seconds}s`);
  assert(pixel(center, 80).join(",") === "236,72,153,255", `Wrong rectangle pixel at ${seconds}s`);
  status.dataset.result = "pass";
  status.textContent = `PASS · t=${seconds}s · progress=${progress()} · center x=${center}`;
  return canvas.toDataURL("image/png");
}

function runChecks() {
  reset();
  for (const seconds of samples) {
    clear();
    step(context, seconds);
    assert(Math.abs(progress() - seconds) < 1e-9, `Incorrect accumulated time at ${seconds}s`);
    const center = Math.round(48 + 160 * seconds);
    assert(pixel(center, 80).join(",") === "236,72,153,255", `Wrong pixel at ${seconds}s`);
  }
  const before = context.getImageData(0, 0, canvas.width, canvas.height).data;
  clear();
  redraw(context);
  const after = context.getImageData(0, 0, canvas.width, canvas.height).data;
  assert(before.every((value, index) => value === after[index]), "Redraw changed the frame");
  assert(progress() === 1, "Redraw advanced time");
  clear();
  step(context, 1);
  assert(progress() === 1, "Repeated timestamp advanced time");
  const repeated = context.getImageData(0, 0, canvas.width, canvas.height).data;
  assert(before.every((value, index) => value === repeated[index]), "Repeated timestamp changed pixels");
  let rejectedRewind = false;
  try { step(context, 0.5); } catch { rejectedRewind = true; }
  assert(rejectedRewind, "Backward time was accepted");
  assert(progress() === 1, "Rejected rewind changed the model");
  return samples.length;
}

for (const seconds of samples) {
  const button = document.createElement("button");
  button.textContent = `${seconds}s`;
  button.addEventListener("click", () => renderAt(seconds));
  document.querySelector("#controls").append(button);
}

try {
  const count = runChecks();
  const requested = Number(new URLSearchParams(location.search).get("time") ?? 0.5);
  renderAt(requested);
  status.textContent += ` · ${count} sample frames + redraw/rewind checks`;
  window.quamolitFixture = { renderAt, runChecks, progress, canvas };
} catch (error) {
  status.dataset.result = "fail";
  status.textContent = `FAIL · ${error.message}`;
  throw error;
}
