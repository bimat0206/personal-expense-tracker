/** Backend returns `null` for percentage change when the baseline is zero (avoids divide-by-zero). */
export function formatPercentChange(pct: number | null | undefined): string {
  if (pct === null || pct === undefined) return 'N/A';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

export function percentChangeTone(pct: number | null | undefined, higherIsBetter: boolean): 'positive' | 'negative' | 'neutral' {
  if (pct === null || pct === undefined || pct === 0) return 'neutral';
  const isUp = pct > 0;
  return isUp === higherIsBetter ? 'positive' : 'negative';
}
