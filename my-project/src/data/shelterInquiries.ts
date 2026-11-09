// Matches the backend cap: one shelter cannot receive more than 150 inquiries.
export const MAX_INQUIRIES_PER_SHELTER = 150;

export type InquiryStatusFilter = 'all' | 'open' | 'resolved';

export const INQUIRY_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
];
