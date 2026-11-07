import {
  AlertTriangle,
  Ban,
  Check,
  HeartHandshake,
  Undo2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { DetailsModal } from '@/components/shared';
import { Input, Label, Textarea } from '@/components/ui/Form';
import { Button } from '@/components/ui/button';

import type { DecisionAction, PendingDecision } from './types';
import { nowForDateTimeInput } from './waiver';

const TITLES: Record<DecisionAction, string> = {
  Approved: 'Approve this application?',
  Adopted: 'Mark this adoption as complete?',
  Return: 'Return this pet to the shelter?',
  Rejected: 'Reject this application?',
  Cancelled: 'Cancel this adoption?',
};

const ICONS: Record<DecisionAction, LucideIcon> = {
  Approved: Check,
  Adopted: HeartHandshake,
  Return: Undo2,
  Rejected: AlertTriangle,
  Cancelled: Ban,
};

const PANEL_CLASS: Record<DecisionAction, string> = {
  Approved: 'rounded-lg border border-green-600/30 bg-green-50 px-3 py-2.5 text-sm dark:bg-green-950/40',
  Adopted: 'rounded-lg border border-blue-600/30 bg-blue-50 px-3 py-2.5 text-sm dark:bg-blue-950/40',
  Return: 'rounded-lg border border-amber-600/30 bg-amber-50 px-3 py-2.5 text-sm dark:bg-amber-950/40',
  Rejected:
    'rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm',
  Cancelled:
    'rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm',
};

const BUSY_LABEL: Record<DecisionAction, string> = {
  Approved: 'Approving…',
  Adopted: 'Marking as adopted…',
  Return: 'Returning…',
  Rejected: 'Rejecting…',
  Cancelled: 'Cancelling…',
};

const CONFIRM_LABEL: Record<DecisionAction, string> = {
  Approved: 'Approve application',
  Adopted: 'Mark as adopted',
  Return: 'Return pet',
  Rejected: 'Reject application',
  Cancelled: 'Cancel adoption',
};

interface ApplicationDecisionModalProps {
  decision: PendingDecision | null;
  petName?: string;
  /** True when the adoption has no e-waiver yet, so the builder opens first. */
  waiverMissing: boolean;
  deciding: boolean;
  note: string;
  pickupAt: string;
  pickupEmail: string;
  onNoteChange: (value: string) => void;
  onPickupAtChange: (value: string) => void;
  onPickupEmailChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

/** Confirms a decision before the status change is persisted and emailed. */
export const ApplicationDecisionModal = ({
  decision,
  petName,
  waiverMissing,
  deciding,
  note,
  pickupAt,
  pickupEmail,
  onNoteChange,
  onPickupAtChange,
  onPickupEmailChange,
  onClose,
  onConfirm,
}: ApplicationDecisionModalProps) => {
  const action = decision?.action;
  const isDestructive = action === 'Rejected' || action === 'Cancelled' || action === 'Return';

  return (
    <DetailsModal
      open={decision !== null}
      onClose={deciding ? () => undefined : onClose}
      title={decision ? TITLES[decision.action] : 'Confirm decision'}
      description={decision ? `${decision.app.applicantName} · ${decision.app.email}` : undefined}
      icon={decision ? ICONS[decision.action] : undefined}
    >
      {decision && (
        <div className="space-y-4">
          <div className={PANEL_CLASS[decision.action]}>
            {decision.action === 'Return' ? (
              <>
                You are about to return <span className="font-semibold">{petName ?? 'this pet'}</span>{' '}
                from <span className="font-semibold">{decision.app.applicantName}</span>. The
                adoption ends and the pet goes back up for adoption.
              </>
            ) : decision.action === 'Cancelled' ? (
              <>
                You are about to cancel the approved adoption of{' '}
                <span className="font-semibold">{petName ?? 'this pet'}</span> for{' '}
                <span className="font-semibold">{decision.app.applicantName}</span>.
              </>
            ) : decision.action === 'Adopted' ? (
              <>
                You are about to complete{' '}
                <span className="font-semibold">{decision.app.applicantName}</span>&apos;s adoption
                of <span className="font-semibold">{petName ?? 'this pet'}</span>.
              </>
            ) : (
              <>
                You are about to {decision.action === 'Approved' ? 'approve' : 'reject'}{' '}
                <span className="font-semibold">{decision.app.applicantName}</span>&apos;s
                application for <span className="font-semibold">{petName ?? 'this pet'}</span>.
              </>
            )}
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">
            {decision.action === 'Return' ? (
              <>
                The adoption ends, the application is marked{' '}
                <span className="font-medium text-foreground">Returned</span>, and an email is sent
                to the applicant&apos;s account email. The pet returns to{' '}
                <span className="font-medium text-foreground">Available</span> and the pickup
                appointment is cleared.
              </>
            ) : (
              <>
                The status will be set to{' '}
                <span className="font-medium text-foreground">{decision.action}</span>, and an email
                with this status is sent to the applicant&apos;s account email.
                {decision.action === 'Approved'
                  ? ' The adopter is emailed this pickup appointment, and other open applications for this pet will be auto-rejected.'
                  : ''}
                {decision.action === 'Adopted'
                  ? waiverMissing
                    ? ' This adoption has no e-waiver yet. The waiver builder opens first; the adoption is completed automatically after the waiver is issued.'
                    : ' The pet becomes Adopted, any other open applications for it are auto-rejected, and the e-waiver opens so you can print the handover documents.'
                  : ''}
                {decision.action === 'Cancelled'
                  ? ' The pet will be returned to Available so other adopters can apply.'
                  : ''}
              </>
            )}
          </p>

          {decision.action === 'Approved' && (
            <div className="space-y-3 rounded-lg border border-green-600/30 bg-green-50/60 p-3 dark:bg-green-950/20">
              <div>
                <Label htmlFor="pickup-at">Clinic pickup date &amp; time</Label>
                <Input
                  id="pickup-at"
                  type="datetime-local"
                  min={nowForDateTimeInput()}
                  value={pickupAt}
                  onChange={(e) => onPickupAtChange(e.target.value)}
                  disabled={deciding}
                  required
                />
              </div>
              <div>
                <Label htmlFor="pickup-email">Pickup contact email</Label>
                <Input
                  id="pickup-email"
                  type="email"
                  value={pickupEmail}
                  onChange={(e) => onPickupEmailChange(e.target.value)}
                  placeholder="clinic@example.com"
                  disabled={deciding}
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Shown to the adopter so they can ask about the appointment.
                </p>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="decision-note">Note (optional)</Label>
            <Textarea
              id="decision-note"
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Included in the email to the applicant…"
              disabled={deciding}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={deciding}>
              Keep application
            </Button>
            <Button
              variant={isDestructive ? 'destructive' : 'default'}
              className={
                decision.action === 'Approved'
                  ? 'flex-1 bg-green-600 text-white hover:bg-green-700'
                  : decision.action === 'Adopted'
                    ? 'flex-1 bg-blue-600 text-white hover:bg-blue-700'
                    : 'flex-1'
              }
              onClick={onConfirm}
              disabled={deciding}
            >
              {deciding
                ? BUSY_LABEL[decision.action]
                : decision.action === 'Adopted' && waiverMissing
                  ? 'Generate waiver & mark adopted'
                  : CONFIRM_LABEL[decision.action]}
            </Button>
          </div>
        </div>
      )}
    </DetailsModal>
  );
};
