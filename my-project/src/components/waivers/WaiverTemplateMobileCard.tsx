import { Eye, FileSignature, Lock, Pencil, Trash2 } from 'lucide-react';

import { MobileRecordCard } from '@/components/shared';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { formatWaiverBodyPreview } from '@/lib/waiverContent';
import type { WaiverTemplate } from '@/types';
import { formatDate } from '@/utils/formatters';

export interface WaiverTemplateMobileCardProps {
  template: WaiverTemplate;
  onView: (template: WaiverTemplate) => void;
  onEdit: (template: WaiverTemplate) => void;
  onDelete: (template: WaiverTemplate) => void;
}

/** Small-screen card for one waiver template. */
export const WaiverTemplateMobileCard = ({
  template,
  onView,
  onEdit,
  onDelete,
}: WaiverTemplateMobileCardProps) => (
  <MobileRecordCard
    media={
      <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 ring-1 ring-border/60 dark:bg-orange-950 dark:text-orange-400">
        <FileSignature className="size-7" aria-hidden="true" />
      </span>
    }
    title={template.name}
    subtitle={template.category}
    status={
      <Badge variant={template.isDefault ? 'info' : 'muted'}>
        <Lock className="size-3" aria-hidden="true" />{' '}
        {template.isDefault ? 'Default' : 'Private'}
      </Badge>
    }
    meta={`Updated ${formatDate(template.updatedAt)}`}
    actions={
      <>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground"
          aria-label={`Preview ${template.name}`}
          onClick={() => onView(template)}
        >
          <Eye className="size-4" />
        </Button>
        {template.isDefault ? null : (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40"
              aria-label={`Edit ${template.name}`}
              onClick={() => onEdit(template)}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
              aria-label={`Delete ${template.name}`}
              onClick={() => onDelete(template)}
            >
              <Trash2 className="size-4" />
            </Button>
          </>
        )}
      </>
    }
  >
    <p className="line-clamp-2 text-sm text-muted-foreground">
      {formatWaiverBodyPreview(template.body)}
    </p>
  </MobileRecordCard>
);
