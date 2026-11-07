import { Ban, Check, Eye, HeartHandshake, Printer, Undo2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { AdoptionApplication } from '@/types';

import type { DecisionAction } from './types';
import { canPrintWaiver, waiverStatusOf } from './waiver';

interface ApplicationActionsProps {
  app: AdoptionApplication;
  /** Pet name used in the "return to shelter" label. */
  petName?: string;
  onView: (app: AdoptionApplication) => void;
  onDecision: (app: AdoptionApplication, action: DecisionAction) => void;
  onOpenWaiver: (id: string) => void;
}

const isTerminal = (app: AdoptionApplication) =>
  app.status === 'Adopted' ||
  app.status === 'Rejected' ||
  app.status === 'Cancelled' ||
  app.status === 'Returned';

const waiverButton = (app: AdoptionApplication, onOpenWaiver: (id: string) => void) =>
  canPrintWaiver(app) ? (
    <Button
      variant="ghost"
      size="icon-sm"
      className="text-muted-foreground"
      aria-label={`Print e-waiver for ${app.applicantName}`}
      title="Open e-waiver"
      onClick={() => onOpenWaiver(app.id)}
    >
      <Printer className="size-4" />
    </Button>
  ) : null;

/**
 * Status-driven next step for one application: Submitted/Under Review →
 * Approve/Reject, Approved → Mark as adopted (then waiver print), Adopted →
 * Return, terminal states → waiver only.
 */
export const ApplicationActions = ({
  app,
  petName,
  onView,
  onDecision,
  onOpenWaiver,
}: ApplicationActionsProps) => {
  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground"
        aria-label={`View ${app.applicantName} application`}
        onClick={() => onView(app)}
      >
        <Eye className="size-4" />
      </Button>

      {app.status === 'Approved' ? (
        <>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40"
            aria-label={`Mark ${app.applicantName} as adopted`}
            title={
              waiverStatusOf(app) === 'None'
                ? 'Generate the e-waiver & mark as adopted'
                : 'Mark as adopted & open e-waiver'
            }
            onClick={() => onDecision(app, 'Adopted')}
          >
            <HeartHandshake className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:bg-destructive/10"
            aria-label={`Cancel adoption for ${app.applicantName}`}
            title="Cancel adoption"
            onClick={() => onDecision(app, 'Cancelled')}
          >
            <Ban className="size-4" />
          </Button>
          {waiverButton(app, onOpenWaiver)}
        </>
      ) : app.status === 'Adopted' ? (
        <>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/40"
            aria-label={`Return ${petName ?? 'pet'} to the shelter`}
            title="Return pet to the shelter"
            onClick={() => onDecision(app, 'Return')}
          >
            <Undo2 className="size-4" />
          </Button>
          {waiverButton(app, onOpenWaiver)}
        </>
      ) : isTerminal(app) ? (
        waiverButton(app, onOpenWaiver)
      ) : (
        <>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-950/40"
            aria-label={`Approve ${app.applicantName}`}
            onClick={() => onDecision(app, 'Approved')}
          >
            <Check className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
            aria-label={`Reject ${app.applicantName}`}
            onClick={() => onDecision(app, 'Rejected')}
          >
            <X className="size-4" />
          </Button>
        </>
      )}
    </>
  );
};
