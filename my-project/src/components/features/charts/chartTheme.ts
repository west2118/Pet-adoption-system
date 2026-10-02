import type { CSSProperties } from 'react';

const tooltipSurface: CSSProperties = {
  backgroundColor: 'var(--color-popover)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  fontSize: 12,
  color: 'var(--color-popover-foreground)',
};

/** Themed tooltip props so every recharts chart matches the app's design tokens. */
export const chartTooltipProps = {
  cursor: { stroke: 'var(--color-border)', fill: 'var(--color-muted)' },
  contentStyle: tooltipSurface,
  labelStyle: { color: 'var(--color-muted-foreground)', marginBottom: 4 } as CSSProperties,
  itemStyle: { padding: 0 } as CSSProperties,
};

export const CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
] as const;

export const chartColor = (index: number): string =>
  CHART_COLORS[index % CHART_COLORS.length];
