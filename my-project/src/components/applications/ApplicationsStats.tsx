import { FRAME_CLASS } from './constants';

export interface ApplicationStatItem {
  label: string;
  value: string | number;
}

export interface ApplicationsStatsProps {
  stats: ApplicationStatItem[];
}

export const ApplicationsStats = ({ stats }: ApplicationsStatsProps) => (
  <section className="border-y border-border bg-background">
    <div className={`grid grid-cols-2 md:grid-cols-4 ${FRAME_CLASS}`}>
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={[
            'px-2 py-10 text-center md:px-4 md:py-14',
            i % 2 === 1 ? 'border-l border-border' : '',
            i >= 2 ? 'border-t border-border md:border-t-0' : '',
            'md:border-l md:first:border-l-0',
          ].join(' ')}
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {stat.label}
          </p>
          <p className="mt-3 font-display text-4xl tracking-tight text-foreground md:text-5xl">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  </section>
);

