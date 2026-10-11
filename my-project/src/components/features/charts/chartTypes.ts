import type { ApplicationStatus } from '@/types';

/** Generic name/value slice for pie and bar charts. */
export interface ChartPoint {
  name: string;
  value: number;
}

/** One calendar-month bucket of application activity. */
export interface TrendPoint {
  month: string;
  applications: number;
  approved: number;
}

/** Request count for a single adoption-application status. */
export interface StatusPoint {
  status: ApplicationStatus;
  count: number;
}
