import { instanceAt } from "./fixtures.mjs";

const COLORS = ["#5b5bd6", "#e05c93", "#18a999", "#efaa38"];
// Fixed 5x7 pixel glyphs keep this reference independent of system fonts.
const GLYPHS = {
  " ": [0, 0, 0, 0, 0, 0, 0],
  "0": [14, 17, 19, 21, 25, 17, 14],
  "1": [4, 12, 4, 4, 4, 4, 14],
  "2": [14, 17, 1, 2, 4, 8, 31],
  "3": [30, 1, 1, 14, 1, 1, 30],
  A: [14, 17, 17, 31, 17, 17, 17],
  I: [31, 4, 4, 4, 4, 4, 31],
  L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17],
  O: [14, 17, 17, 17, 17, 17, 14],
  Q: [14, 17, 17, 17, 21, 18, 13],
  T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14],
};

function glyphText(ctx, value, x, y, scale = 3) {
  for (const [glyphIndex, letter] of [...value].entries()) {
    const rows = GLYPHS[letter];
    if (!rows) throw new Error(`Missing fixed glyph: ${letter}`);
    for (let row = 0; row < 7; row += 1) {
      for (let column = 0; column < 5; column += 1) {
        if (rows[row] & (1 << (4 - column))) {
          ctx.fillRect(x + (glyphIndex * 6 + column) * scale, y + row * scale, scale, scale);
        }
      }
    }
  }
}

function background(ctx, width, height) {
  ctx.fillStyle = "#f5f7fc";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#e5e9f2";
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
    ctx.stroke();
  }
}

function uiTransition(ctx, model) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(28, 34, 584, 292);
  ctx.strokeStyle = "#d5ddec";
  ctx.strokeRect(28.5, 34.5, 583, 291);
  ctx.fillStyle = "#33415f";
  glyphText(ctx, "QUAMOLIT", 49, 56, 3);
  ctx.strokeStyle = "#b8c2d5";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(60, 222);
  ctx.lineTo(556, 222);
  ctx.stroke();
  ctx.fillStyle = "#e05c93";
  ctx.beginPath();
  ctx.arc(model.ui.x, 222, 23, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(model.ui.x, 222, 7, 0, Math.PI * 2);
  ctx.fill();
  if (model.ui.panelPhase !== "absent") {
    ctx.globalAlpha = model.ui.panelOpacity;
    ctx.fillStyle = "#5b5bd6";
    ctx.fillRect(360, 70, 213, 104);
    ctx.fillStyle = "#ffffff";
    glyphText(ctx, "0123", 380, 91, 4);
    ctx.globalAlpha = 1;
  }
}

function instances(ctx, model) {
  const count = model.count;
  const palette = COLORS;
  for (let index = 0; index < count; index += 1) {
    const item = instanceAt(model.seed, index);
    const x = item.x + Math.sin(model.motionPhase + item.phase) * 7;
    const y = item.y + Math.cos(model.motionPhase + item.phase) * 7;
    ctx.fillStyle = palette[item.palette];
    ctx.fillRect(x, y, item.radius * 2, item.radius * 2);
  }
}

function textPath(ctx, model) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(28, 34, 584, 292);
  ctx.strokeStyle = "#d5ddec";
  ctx.strokeRect(28.5, 34.5, 583, 291);
  ctx.fillStyle = "#243451";
  glyphText(ctx, model.label, 57, 68, 4);
  const lift = Math.sin(model.pathPhase) * 35;
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#5b5bd6";
  ctx.beginPath();
  ctx.moveTo(65, 255);
  ctx.bezierCurveTo(170, 112 - lift, 315, 320 + lift, 575, 184);
  ctx.stroke();
  ctx.fillStyle = "#e05c93";
  ctx.beginPath();
  ctx.arc(319, 216 + lift * 0.28, 17, 0, Math.PI * 2);
  ctx.fill();
}

export function renderCanvas(ctx, manifest, model) {
  if (manifest.fixture !== model.fixture) throw new TypeError("Fixture/model mismatch");
  const canvas = ctx.canvas;
  if (canvas.width !== manifest.pixelWidth || canvas.height !== manifest.pixelHeight) {
    canvas.width = manifest.pixelWidth;
    canvas.height = manifest.pixelHeight;
  }
  ctx.setTransform(manifest.dpr, 0, 0, manifest.dpr, 0, 0);
  ctx.globalAlpha = 1;
  background(ctx, manifest.width, manifest.height);
  if (manifest.resources.glyphAtlas.state !== "ready") {
    ctx.fillStyle = manifest.resources.glyphAtlas.state === "error" ? "#b91c1c" : "#8a95aa";
    ctx.fillRect(80, 140, 480, 80);
    return;
  }
  switch (manifest.fixture) {
    case "ui-transition": uiTransition(ctx, model); break;
    case "instances": instances(ctx, model); break;
    case "text-path": textPath(ctx, model); break;
    default: throw new RangeError(`Unknown fixture: ${manifest.fixture}`);
  }
}
