export const DEFAULT_GIANT_THRESHOLDS = Object.freeze({ heightM: 20, canopySpreadM: 20 });

export function classifyGiant(tree = {}, thresholds = DEFAULT_GIANT_THRESHOLDS) {
  const config = { ...DEFAULT_GIANT_THRESHOLDS, ...(thresholds || {}) };
  const heightM = Number(tree?.heightM);
  const canopySpreadM = Number(tree?.canopySpreadM);
  const reasons = [];
  if (Number.isFinite(heightM) && heightM >= threshold(config.heightM, 'heightM')) reasons.push('height');
  if (Number.isFinite(canopySpreadM) && canopySpreadM >= threshold(config.canopySpreadM, 'canopySpreadM')) reasons.push('canopy-spread');
  return { isGiant: reasons.length > 0, reasons };
}

function threshold(value, label) {
  if (!Number.isFinite(value) || value <= 0) throw new TypeError(`Giant ${label} threshold must be a positive number`);
  return value;
}
