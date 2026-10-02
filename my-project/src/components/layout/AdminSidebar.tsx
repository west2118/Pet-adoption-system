import { Building2, LayoutDashboard, PawPrint, Users } from 'lucide-react';
import { PortalSidebar } from './PortalSidebar';

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar = ({ mobileOpen = false, onClose }: AdminSidebarProps) => {
  return (
    <PortalSidebar
      brandTitle="Platform Admin"
      brandSubtitle="PawsConnect"
      mobileOpen={mobileOpen}
      onClose={onClose}
      links={[
        { to: '/admin', end: true, label: 'Overview', icon: LayoutDashboard },
        { to: '/admin/shelters', label: 'Shelters', icon: Building2 },
        { to: '/admin/pets', label: 'Pets', icon: PawPrint },
        { to: '/admin/users', label: 'Users', icon: Users },
      ]}
    />
  );
};
