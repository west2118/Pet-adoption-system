import type { AdoptionApplication } from '@/types';

/**
 * What the shelter is about to do. `Return` reverses a completed handover and
 * is persisted as the application's `Cancelled` status.
 */
export type DecisionAction = 'Approved' | 'Rejected' | 'Cancelled' | 'Adopted' | 'Return';

export interface PendingDecision {
  app: AdoptionApplication;
  action: DecisionAction;
}
