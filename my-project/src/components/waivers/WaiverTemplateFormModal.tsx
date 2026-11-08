import { Lock, Pencil, Plus } from 'lucide-react';
import type { FormEvent } from 'react';

import { CustomWaiverTemplateDocument } from '@/components/features/CustomWaiverTemplateDocument';
import { WaiverTemplateEditor } from '@/components/features/WaiverTemplateEditor';
import { DetailsModal, ValidatedInput } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Label, Select } from '@/components/ui/Form';
import {
  WAIVER_TEMPLATE_CATEGORY_OPTIONS,
  type WaiverTemplateFormErrors,
  type WaiverTemplateFormValues,
} from '@/data/waiverTemplates';
import { buildSampleWaiver } from '@/helpers';
import type { Pet, Shelter, WaiverTemplate } from '@/types';

export interface WaiverTemplateFormModalProps {
  open: boolean;
  /** Template being edited; null when creating a new one. */
  template: WaiverTemplate | null;
  form: WaiverTemplateFormValues;
  errors: WaiverTemplateFormErrors;
  shelter: Shelter | null;
  pets: Pet[];
  isSaving: boolean;
  onChange: (patch: Partial<WaiverTemplateFormValues>) => void;
  onClose: () => void;
  onSubmit: () => void;
}

/** Create / edit form for a shelter's private waiver template, with live preview. */
export const WaiverTemplateFormModal = ({
  open,
  template,
  form,
  errors,
  shelter,
  pets,
  isSaving,
  onChange,
  onClose,
  onSubmit,
}: WaiverTemplateFormModalProps) => {
  const editorTemplate = {
    id: template?.id ?? 'preview-template',
    name: form.name.trim() || 'Untitled waiver template',
    category: form.category,
    body: form.body,
    isDefault: false,
  };
  const previewWaiver = buildSampleWaiver(editorTemplate, shelter, pets);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <DetailsModal
      open={open}
      onClose={onClose}
      title={template ? `Edit ${template.name}` : 'Add waiver template'}
      description={
        template
          ? 'Update the template below. Already-issued waivers keep their original text.'
          : 'Compose a formatted waiver, then bundle it into e-waivers at handover.'
      }
      icon={template ? Pencil : Plus}
      size="2xl"
      footer={
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={isSaving}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="waiver-template-form"
            size="lg"
            className="w-full"
            disabled={isSaving}
            aria-busy={isSaving}
          >
            {isSaving ? 'Saving…' : template ? 'Save changes' : 'Create template'}
          </Button>
        </div>
      }
    >
      <form id="waiver-template-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="flex items-start gap-2.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-900 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-200">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <p>
            <span className="font-semibold">
              Private to {shelter?.name ?? 'your shelter'}.
            </span>{' '}
            Only staff signed in to this shelter can see, edit, or bundle this template. Other
            shelters never see it.
          </p>
        </div>

        <div>
          <Label htmlFor="waiver-name">Name</Label>
          <ValidatedInput
            id="waiver-name"
            value={form.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g. Adoption Liability Waiver"
            required
            error={errors.name}
          />
        </div>
        <div>
          <Label>Category</Label>
          <Select
            value={form.category}
            onChange={(e) => onChange({ category: e.target.value })}
            required
            options={WAIVER_TEMPLATE_CATEGORY_OPTIONS}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="min-w-0">
            <Label htmlFor="waiver-body">Template content</Label>
            <WaiverTemplateEditor
              id="waiver-body"
              value={form.body}
              onChange={(body) => onChange({ body })}
              error={errors.body}
            />
          </div>
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Live document preview</span>
              <span className="text-xs text-muted-foreground">Reflects your formatting</span>
            </div>
            <div className="waiver-preview max-h-[520px] overflow-y-auto">
              <CustomWaiverTemplateDocument
                template={editorTemplate}
                waiver={previewWaiver}
                preview
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Sample adopter, pet, and shelter details are shown. Saved templates keep this
              layout in every issued e-waiver.
            </p>
          </div>
        </div>
      </form>
    </DetailsModal>
  );
};
