import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DetailsModal } from './DetailsModal';

interface ConfirmDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDeleting?: boolean;
}

/**
 * Card modal confirmation for every destructive delete action.
 * The caller opens it from the delete (trash) button and only runs the
 * real delete inside `onConfirm` — nothing is removed on open.
 */
export const ConfirmDeleteModal = ({
  open,
  onClose,
  onConfirm,
  title = 'Delete this item?',
  description = 'This action cannot be undone.',
  itemName,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isDeleting = false,
}: ConfirmDeleteModalProps) => (
  <DetailsModal
    open={open}
    onClose={isDeleting ? () => undefined : onClose}
    title={title}
    description={description}
    icon={AlertTriangle}
  >
    <div className="space-y-3">
      {itemName ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
          <p className="text-sm">
            <span className="text-muted-foreground">You are about to delete </span>
            <span className="font-semibold text-foreground">“{itemName}”</span>
            <span className="text-muted-foreground">.</span>
          </p>
        </div>
      ) : null}
      <p className="text-sm leading-relaxed text-muted-foreground">
        Are you sure you want to continue? This permanently removes the record and cannot be
        undone.
      </p>
      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isDeleting}
          className="sm:min-w-24"
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => void onConfirm()}
          disabled={isDeleting}
          aria-busy={isDeleting}
          className="sm:min-w-24"
        >
          {isDeleting ? 'Deleting…' : confirmLabel}
        </Button>
      </div>
    </div>
  </DetailsModal>
);
