export interface WaiverTemplateFormValues {
  name: string;
  category: string;
  body: string;
}

export type WaiverTemplateFormErrors = Partial<Record<'name' | 'body', string>>;

export const WAIVER_TEMPLATE_CATEGORY_OPTIONS = [
  { value: 'Adoption', label: 'Adoption' },
  { value: 'Foster', label: 'Foster' },
  { value: 'Medical', label: 'Medical' },
  { value: 'Media', label: 'Media' },
  { value: 'Logistics', label: 'Logistics' },
  { value: 'General', label: 'General' },
];

export const EMPTY_WAIVER_TEMPLATE_FORM: WaiverTemplateFormValues = {
  name: '',
  category: 'Adoption',
  body: '',
};
