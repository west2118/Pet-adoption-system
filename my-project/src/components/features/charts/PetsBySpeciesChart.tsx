import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { ChartPoint } from '@/hooks/useShelterOverview';
import { chartColor, chartTooltipProps } from './chartTheme';

interface PetsBySpeciesChartProps {
  data: ChartPoint[];
}

export const PetsBySpeciesChart = ({ data }: PetsBySpeciesChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={58}
          outerRadius={92}
          paddingAngle={2}
          stroke="var(--color-card)"
          strokeWidth={2}
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={chartColor(index)} />
          ))}
        </Pie>
        <Tooltip {...chartTooltipProps} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
      </PieChart>
    </ResponsiveContainer>
  );
};
