import { Building2, ClipboardList, LayoutDashboard, MessageCircleQuestion, PawPrint } from 'lucide-react';
import { PortalSidebar } from './PortalSidebar';

interface ShelterSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const ShelterSidebar = ({ mobileOpen = false, onClose }: ShelterSidebarProps) => {
  return (
    <PortalSidebar
      brandTitle="Shelter Portal"
      brandSubtitle="PawsConnect"
      mobileOpen={mobileOpen}
      onClose={onClose}
      links={[
        { to: '/shelter', end: true, label: 'Overview', icon: LayoutDashboard },
        { to: '/shelter/listings', label: 'Listings', icon: PawPrint },
        { to: '/shelter/applications', label: 'Applications', icon: ClipboardList },
        { to: '/shelter/inquiries', label: 'Inquiries', icon: MessageCircleQuestion },
        { to: '/shelter/profile', label: 'Shelter Profile', icon: Building2 },
      ]}
    />
  );
};
