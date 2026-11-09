import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { VisitTrendPoint } from './chartTypes';
import { chartTooltipProps } from './chartTheme';

interface UpcomingVisitsChartProps {
  data: VisitTrendPoint[];
}

export const UpcomingVisitsChart = ({ data }: UpcomingVisitsChartProps) => {
  if (!data.some((point) => point.count > 0)) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No confirmed visits scheduled for the next 14 days.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval={1}
          minTickGap={8}
          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
        />
        <YAxis
          allowDecimals={false}
          width={32}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
        />
        <Tooltip {...chartTooltipProps} />
        <Bar
          dataKey="count"
          name="Visits scheduled"
          fill="var(--color-chart-1)"
          radius={[6, 6, 0, 0]}
          maxBarSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
