import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { StatusPoint } from '@/hooks/useShelterOverview';
import { chartColor, chartTooltipProps } from './chartTheme';

interface ApplicationsByStatusChartProps {
  data: StatusPoint[];
}

export const ApplicationsByStatusChart = ({ data }: ApplicationsByStatusChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <XAxis
          dataKey="status"
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
        <Bar dataKey="count" name="Applications" radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={entry.status} fill={chartColor(index)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
