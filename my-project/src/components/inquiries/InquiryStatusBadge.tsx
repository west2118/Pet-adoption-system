import { Badge } from '@/components/ui/Badge';

export const InquiryStatusBadge = ({ resolved }: { resolved?: boolean }) => (
  <Badge variant={resolved ? 'success' : 'warning'}>{resolved ? 'Resolved' : 'Open'}</Badge>
);
