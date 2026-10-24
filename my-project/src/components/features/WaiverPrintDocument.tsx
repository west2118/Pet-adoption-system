import type { ReactNode } from 'react';
import type { Waiver, WaiverSnapshot } from '@/types';
import { CustomWaiverTemplateDocument } from './CustomWaiverTemplateDocument';
import { FosterCareAgreementDocument } from './FosterCareAgreementDocument';
import { LiabilityWaiverDocument } from './LiabilityWaiverDocument';
import { MediaReleaseDocument } from './MediaReleaseDocument';
import { MedicalDisclosureDocument } from './MedicalDisclosureDocument';
import { TransportWaiverDocument } from './TransportWaiverDocument';

/**
 * Print dispatcher for a handover waiver bundle.
 *
 * - Locked platform templates (`isDefault`) render the dedicated legal form
 *   for their category, exactly as before.
 * - Shelter-authored templates render their own formatted wording through
 *   `CustomWaiverTemplateDocument`, so what the shelter wrote is what gets
 *   previewed, generated, signed, and printed.
 *
 * Each rendered template is wrapped in its own `.waiver-template` boundary
 * that always starts on a fresh printed sheet (see `index.css`).
 */

type SnapshotTemplate = WaiverSnapshot['templates'][number];

/** Names seeded by the platform before snapshots recorded `isDefault`. */
const LEGACY_DEFAULT_NAMES = new Set([
  'Adoption Liability Waiver',
  'Foster Care Agreement',
  'Medical Disclosure Acknowledgment',
  'Photo & Story Release',
  'Transport Waiver',
]);

const isDefaultTemplate = (template: SnapshotTemplate): boolean =>
  template.isDefault ?? LEGACY_DEFAULT_NAMES.has(template.name);

const STANDARD_FORMS = [
  {
    category: 'Adoption',
    label: 'Adoption — Liability Waiver & Release',
    Doc: LiabilityWaiverDocument,
  },
  {
    category: 'Foster',
    label: 'Foster — Care Agreement & Volunteer Contract',
    Doc: FosterCareAgreementDocument,
  },
  {
    category: 'Medical',
    label: 'Medical — Disclosure & Health History',
    Doc: MedicalDisclosureDocument,
  },
  {
    category: 'Media',
    label: 'Media — Photo, Media & Story Release',
    Doc: MediaReleaseDocument,
  },
  {
    category: 'Logistics',
    label: 'Logistics — Transport Agreement & Waiver',
    Doc: TransportWaiverDocument,
  },
] as const;

interface PrintSection {
  key: string;
  label: string;
  content: ReactNode;
  names?: string[];
}

export const WaiverPrintDocument = ({
  waiver,
  preview = false,
}: {
  waiver: Waiver;
  /** Sample preview data rather than an issued waiver. */
  preview?: boolean;
}) => {
  const templates = waiver.snapshot.templates;
  const defaultTemplates = templates.filter(isDefaultTemplate);
  const customTemplates = templates.filter((template) => !isDefaultTemplate(template));
  const defaultCategories = new Set(defaultTemplates.map((template) => template.category));

  const sections: PrintSection[] = [];

  for (const form of STANDARD_FORMS) {
    if (!defaultCategories.has(form.category)) continue;
    sections.push({
      key: form.category,
      label: form.label,
      names: defaultTemplates
        .filter((template) => template.category === form.category)
        .map((template) => template.name),
      content: <form.Doc waiver={waiver} />,
    });
  }

  for (const template of customTemplates) {
    sections.push({
      key: `custom-${template.id}`,
      label: `${template.category} — ${template.name}`,
      content: <CustomWaiverTemplateDocument template={template} waiver={waiver} preview={preview} />,
    });
  }

  // A bundle with no usable templates still prints a complete liability form.
  if (sections.length === 0) {
    sections.push({
      key: 'Adoption',
      label: 'Adoption — Liability Waiver & Release',
      content: <LiabilityWaiverDocument waiver={waiver} />,
    });
  }

  return (
    <div className="waiver-bundle">
      {sections.map(({ key, label, names, content }, index) => {
        const isLast = index === sections.length - 1;
        return (
          <div
            key={key}
            className="waiver-template"
            data-template={key}
            data-last={isLast ? 'true' : 'false'}
          >
            <div className="waiver-template-label print:hidden" aria-hidden="true">
              <span className="waiver-template-label-index">
                Template {index + 1} of {sections.length}
              </span>
              <span className="waiver-template-label-title">{label}</span>
              {names && names.length > 0 ? (
                <span className="waiver-template-label-names">{names.join('; ')}</span>
              ) : null}
              <span className="waiver-template-label-hint">Starts on a new printed page</span>
            </div>
            {content}
          </div>
        );
      })}
    </div>
  );
};
