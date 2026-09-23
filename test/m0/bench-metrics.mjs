export function percentile(values, fraction) {
  if (!values.length) throw new Error("Cannot summarize empty samples");
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (sorted.length - 1) * fraction;
  const lower = Math.floor(rank);
  return sorted[lower] + (sorted[Math.ceil(rank)] - sorted[lower]) * (rank - lower);
}

export function median(values) {
  return percentile(values, 0.5);
}

export function summarizeRun(run) {
  const samples = run.measure.samples;
  const intervals = samples.map((item) => item.rafIntervalMs).filter((value) => value !== null);
  const refreshProxyMs = run.idleRafMedianMs;
  if (!Number.isFinite(refreshProxyMs) || refreshProxyMs <= 0) throw new Error("Invalid idle rAF calibration");
  const summarize = (key) => ({
    p50: percentile(samples.map((item) => item[key]), 0.5),
    p95: percentile(samples.map((item) => item[key]), 0.95),
    p99: percentile(samples.map((item) => item[key]), 0.99),
  });
  const intervalStats = {
    p50: percentile(intervals, 0.5),
    p95: percentile(intervals, 0.95),
    p99: percentile(intervals, 0.99),
  };
  return {
    frames: samples.length,
    elapsedMs: run.measure.elapsedMs,
    firstDrawMs: run.firstDrawMs,
    sampleMs: summarize("sampleMs"),
    canvasCallMs: summarize("canvasCallMs"),
    cpuFrameMs: summarize("cpuFrameMs"),
    rafIntervalMs: intervalStats,
    idleRafMedianMs: refreshProxyMs,
    longIntervalFraction: intervals.filter((value) => value > refreshProxyMs * 1.5).length / intervals.length,
    checksum: run.checksum,
  };
}

export function compareBaseline(current, baseline) {
  const a = current.runs.map((run) => run.cpuFrameMs.p95);
  const b = baseline.runs.map((run) => run.cpuFrameMs.p95);
  const currentMedian = median(a);
  const baselineMedian = median(b);
  const deltaMs = currentMedian - baselineMedian;
  const deltaFraction = deltaMs / baselineMedian;
  return { currentMedian, baselineMedian, deltaMs, deltaFraction, regression: deltaMs > 0.5 && deltaFraction > 0.1 };
}
