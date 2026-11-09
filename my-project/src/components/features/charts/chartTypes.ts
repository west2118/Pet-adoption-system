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

/** Confirmed meet-and-greets scheduled for one calendar day. */
export interface VisitTrendPoint {
  /** ISO day (`YYYY-MM-DD`). */
  date: string;
  /** Short display label from the backend (e.g. "Nov 18"). */
  label: string;
  count: number;
}
