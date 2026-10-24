import { AlertTriangle } from 'lucide-react';
import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/Form';
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
  /** When true, the user must type the exact item name before deleting. */
  requireNameConfirmation?: boolean;
}

interface ConfirmDeleteBodyProps {
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  itemName?: string;
  confirmLabel: string;
  cancelLabel: string;
  isDeleting: boolean;
  requireNameConfirmation: boolean;
}

/**
 * Body is a separate component so its typed-name state unmounts with the
 * modal and always starts empty the next time the dialog opens.
 */
const ConfirmDeleteBody = ({
  onClose,
  onConfirm,
  itemName,
  confirmLabel,
  cancelLabel,
  isDeleting,
  requireNameConfirmation,
}: ConfirmDeleteBodyProps) => {
  const inputId = useId();
  const [typedName, setTypedName] = useState('');
  const mustTypeName = requireNameConfirmation && Boolean(itemName);
  const expectedName = itemName?.trim() ?? '';
  const isNameMatch = !mustTypeName || typedName.trim() === expectedName;
  const showMismatch =
    mustTypeName && typedName.trim().length >= expectedName.length && !isNameMatch;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isDeleting || !isNameMatch) return;
    void onConfirm();
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit} noValidate>
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
      {mustTypeName ? (
        <div>
          <Label htmlFor={inputId}>
            Type <span className="font-semibold text-foreground">{itemName}</span> to confirm
          </Label>
          <Input
            id={inputId}
            value={typedName}
            onChange={(event) => setTypedName(event.target.value)}
            placeholder={itemName}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            autoFocus
            disabled={isDeleting}
            aria-invalid={showMismatch}
            aria-describedby={showMismatch ? `${inputId}-error` : undefined}
            className={showMismatch ? 'border-destructive focus-visible:border-destructive' : undefined}
          />
          {showMismatch ? (
            <p id={`${inputId}-error`} className="mt-1.5 text-xs text-destructive">
              The name does not match “{itemName}”.
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onClose}
          disabled={isDeleting}
          className="w-full"
        >
          {cancelLabel}
        </Button>
        <Button
          type="submit"
          variant="destructive"
          size="lg"
          disabled={isDeleting || !isNameMatch}
          aria-busy={isDeleting}
          className="w-full"
        >
          {isDeleting ? 'Deleting…' : confirmLabel}
        </Button>
      </div>
    </form>
  );
};

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
  requireNameConfirmation = false,
}: ConfirmDeleteModalProps) => (
  <DetailsModal
    open={open}
    onClose={isDeleting ? () => undefined : onClose}
    title={title}
    description={description}
    icon={AlertTriangle}
  >
    <ConfirmDeleteBody
      onClose={onClose}
      onConfirm={onConfirm}
      itemName={itemName}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      isDeleting={isDeleting}
      requireNameConfirmation={requireNameConfirmation}
    />
  </DetailsModal>
);
