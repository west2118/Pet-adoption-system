import type { Inquiry } from '@/services/api';

/** Reply being composed for an inquiry; kept while the slide-over is open. */
export interface EmailDraft {
  inquiry: Inquiry;
  subject: string;
  message: string;
}
