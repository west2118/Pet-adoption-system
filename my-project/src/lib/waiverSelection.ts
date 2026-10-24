import type { WaiverTemplate } from '@/types';

/** The liability category that every handover bundle must include. */
export const LIABILITY_CATEGORY = 'Adoption';

export const isLiabilityTemplate = (template: Pick<WaiverTemplate, 'category'>): boolean =>
  template.category.trim().toLowerCase() === LIABILITY_CATEGORY.toLowerCase();

/**
 * Every template a shelter can see is bundle-able. Draft/Active is no longer a
 * workflow — the templates page only offers create, edit, and delete.
 */
export const isSelectableTemplate = (_template: WaiverTemplate): boolean => true;

export const selectionHasLiability = (
  templates: WaiverTemplate[],
  selectedIds: string[],
): boolean =>
  templates.some((template) => selectedIds.includes(template.id) && isLiabilityTemplate(template));

/** Every visible template that can be bundled, in catalogue order. */
export const selectableTemplateIds = (templates: WaiverTemplate[]): string[] =>
  templates.filter(isSelectableTemplate).map((template) => template.id);
