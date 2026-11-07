import type { AdoptionApplication } from '@/types';

/** Waiver state of an application, normalising the optional server field. */
export const waiverStatusOf = (app: AdoptionApplication) => app.waiverStatus ?? 'None';

/** E-waivers are only printable once the pet is being handed over. */
export const canPrintWaiver = (app: AdoptionApplication) =>
  app.status === 'Approved' || app.status === 'Adopted';

/** `datetime-local` value for "now" in the browser's own timezone. */
export const nowForDateTimeInput = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
