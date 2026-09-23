/** Deterministic visible test positions; the middle stripe stays free for the version anchor. */
export function instanceGrid(count, anchorX) {
  if (!Number.isSafeInteger(count) || count < 1 || !Number.isFinite(anchorX)) throw new RangeError("valid fixture count and anchor required");
  const positions = new Float32Array(count * 2);
  positions[0] = anchorX;
  positions[1] = 50;
  const columns = 107;
  const rows = 28;
  for (let index = 1; index < count; index++) {
    const cell = (index - 1) % (columns * rows);
    const column = cell % columns;
    const row = Math.floor(cell / columns);
    positions[index * 2] = column * 3;
    positions[index * 2 + 1] = row < 14 ? row * 3 : 58 + (row - 14) * 3;
  }
  return positions;
}
