export type VisitStatusFilter = 'all' | 'requested' | 'confirmed' | 'completed' | 'cancelled';

export const VISIT_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'requested', label: 'Requested' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];
