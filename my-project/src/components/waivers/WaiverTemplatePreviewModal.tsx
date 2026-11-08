import { FileSignature, Lock, Pencil } from 'lucide-react';

import { CustomWaiverTemplateDocument } from '@/components/features/CustomWaiverTemplateDocument';
import { WaiverPrintDocument } from '@/components/features/WaiverPrintDocument';
import { DetailsModal } from '@/components/shared';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { buildSampleWaiver } from '@/helpers';
import type { Pet, Shelter, WaiverTemplate } from '@/types';
import { formatDate } from '@/utils/formatters';

export interface WaiverTemplatePreviewModalProps {
  template: WaiverTemplate | null;
  shelter: Shelter | null;
  pets: Pet[];
  onClose: () => void;
  onEdit: (template: WaiverTemplate) => void;
}

/** Sample PDF-look preview of a saved waiver template. */
export const WaiverTemplatePreviewModal = ({
  template,
  shelter,
  pets,
  onClose,
  onEdit,
}: WaiverTemplatePreviewModalProps) => {
  const previewWaiver = template ? buildSampleWaiver(template, shelter, pets) : null;

  return (
    <DetailsModal
      open={template !== null}
      onClose={onClose}
      title={template?.name ?? 'Waiver'}
      description={template ? `${template.category} · sample PDF preview` : undefined}
      icon={FileSignature}
      size="xl"
      footer={
        template ? (
          template.isDefault ? (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto sm:min-w-32"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={onClose}
              >
                Close
              </Button>
              <Button type="button" size="lg" className="w-full" onClick={() => onEdit(template)}>
                <Pencil className="size-4" /> Edit template
              </Button>
            </div>
          )
        ) : undefined
      }
    >
      {template && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="muted">Updated {formatDate(template.updatedAt)}</Badge>
            {template.isDefault ? (
              <Badge variant="info">
                <Lock className="size-3" aria-hidden="true" /> Platform default · locked
              </Badge>
            ) : (
              <Badge variant="muted">
                <Lock className="size-3" aria-hidden="true" /> Private to your shelter
              </Badge>
            )}
            <Badge variant="info">Sample preview — not issued</Badge>
          </div>
          {previewWaiver ? (
            <div className="waiver-preview">
              <WaiverPrintDocument waiver={previewWaiver} preview />
            </div>
          ) : template.isDefault ? (
            <div className="rounded-lg border p-3">
              <p className="text-sm leading-relaxed">{template.body}</p>
            </div>
          ) : (
            <div className="waiver-preview">
              <CustomWaiverTemplateDocument template={template} preview />
            </div>
          )}
        </div>
      )}
    </DetailsModal>
  );
};
