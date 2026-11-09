import type { FormEvent } from 'react';
import { ShieldCheck } from 'lucide-react';

import { DetailsModal, ValidatedTextarea } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/Form';
import type { ShelterApplication } from '@/types';

export interface PlatformShelterAppApproveModalProps {
  app: ShelterApplication | null;
  message: string;
  error?: string;
  isWorking: boolean;
  onClose: () => void;
  onChangeMessage: (val: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export const PlatformShelterAppApproveModal = ({
  app,
  message,
  error,
  isWorking,
  onClose,
  onChangeMessage,
  onSubmit,
}: PlatformShelterAppApproveModalProps) => (
  <DetailsModal
    open={app !== null}
    onClose={onClose}
    title={`Approve ${app?.name ?? 'Shelter'}`}
    description="This will create their official shelter profile, generate a shelter admin account, and email them sign-in credentials."
    icon={ShieldCheck}
    footer={
      <div className="flex w-full justify-end gap-2">
        <Button type="button" variant="outline" disabled={isWorking} onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          className="bg-emerald-600 hover:bg-emerald-700"
          disabled={isWorking}
          onClick={onSubmit}
        >
          {isWorking ? 'Approving…' : 'Confirm Approval'}
        </Button>
      </div>
    }
  >
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-50/50 p-3 text-sm text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200">
        <p className="font-medium">What happens next:</p>
        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs">
          <li>A new active shelter profile will be published with their submitted details.</li>
          <li>A shelter staff account will be created for {app?.email}.</li>
          <li>An automated welcome email with credentials will be delivered to the applicant.</li>
        </ul>
      </div>

      <div>
        <Label htmlFor="approve-message">Welcome note / instructions for applicant</Label>
        <ValidatedTextarea
          id="approve-message"
          rows={4}
          value={message}
          onChange={(e) => onChangeMessage(e.target.value)}
          error={error}
          placeholder="Add any platform-specific onboarding instructions..."
        />
      </div>
    </form>
  </DetailsModal>
);

