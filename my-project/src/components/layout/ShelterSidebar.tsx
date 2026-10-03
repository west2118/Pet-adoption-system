import { Building2, ClipboardList, FileSignature, FileText, LayoutDashboard, MessageCircleQuestion, PawPrint } from 'lucide-react';
import { PortalSidebar } from './PortalSidebar';

interface ShelterSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const ShelterSidebar = ({ mobileOpen = false, onClose }: ShelterSidebarProps) => {
  return (
    <PortalSidebar
      brandTitle="Shelter Portal"
      brandSubtitle="Paws&Homes"
      mobileOpen={mobileOpen}
      onClose={onClose}
      links={[
        { to: '/shelter', end: true, label: 'Overview', icon: LayoutDashboard },
        { to: '/shelter/listings', label: 'Listings', icon: PawPrint },
        { to: '/shelter/applications', label: 'Applications', icon: ClipboardList },
        { to: '/shelter/inquiries', label: 'Inquiries', icon: MessageCircleQuestion },
        {
          label: 'Templates',
          icon: FileText,
          children: [
            { to: '/shelter/templates/e-waivers', label: 'E-Waivers', icon: FileSignature },
          ],
        },
        { to: '/shelter/profile', label: 'Shelter Profile', icon: Building2 },
      ]}
    />
  );
};
