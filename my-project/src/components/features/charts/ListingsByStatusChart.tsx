import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ChartPoint } from '@/hooks/useShelterOverview';
import { chartColor, chartTooltipProps } from './chartTheme';

interface ListingsByStatusChartProps {
  data: ChartPoint[];
}

export const ListingsByStatusChart = ({ data }: ListingsByStatusChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
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
        <Bar dataKey="value" name="Listings" radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={chartColor(index)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
