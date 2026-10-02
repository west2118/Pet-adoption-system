import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TrendPoint } from '@/hooks/useShelterOverview';
import { chartTooltipProps } from './chartTheme';

interface ApplicationsTrendChartProps {
  data: TrendPoint[];
}

export const ApplicationsTrendChart = ({ data }: ApplicationsTrendChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="applicationsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="approvedFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
        />
        <YAxis
          allowDecimals={false}
          width={32}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
        />
        <Tooltip {...chartTooltipProps} />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        <Area
          type="monotone"
          dataKey="applications"
          name="Applications"
          stroke="var(--color-chart-1)"
          strokeWidth={2}
          fill="url(#applicationsFill)"
        />
        <Area
          type="monotone"
          dataKey="approved"
          name="Approved / Adopted"
          stroke="var(--color-chart-2)"
          strokeWidth={2}
          fill="url(#approvedFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
