export const MONTH_MASK = 0x0fff;

export function monthsToMask(months = []) {
  return months.reduce((mask, month) => {
    if (!Number.isInteger(month) || month < 1 || month > 12) throw new TypeError('Month must be 1–12');
    return mask | (1 << (month - 1));
  }, 0);
}

export function maskHasMonth(mask, month) {
  return Number.isInteger(mask) && (mask & MONTH_MASK) === mask && Boolean(mask & (1 << (month - 1)));
}
