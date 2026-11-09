// Matches the backend cap: one shelter cannot receive more than 150 visit requests.
export const MAX_VISITS_PER_SHELTER = 150;

export type VisitStatusFilter = 'all' | 'requested' | 'confirmed' | 'completed' | 'cancelled';

export const VISIT_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'requested', label: 'Requested' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];
