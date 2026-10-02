import { Menu, PawPrint } from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Breadcrumbs } from '@/components/shared';
import { AdminSidebar } from './AdminSidebar';

export const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Compact admin topbar (sidebar owns nav — no public Navbar here) */}
        <header className="z-30 shrink-0 border-b bg-background/95 backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open admin menu"
              className="flex size-9 items-center justify-center rounded-lg border lg:hidden"
            >
              <Menu className="size-4" />
            </button>
            <Link to="/admin" className="flex items-center gap-2 lg:hidden">
              <span className="flex size-8 items-center justify-center rounded-lg bg-orange-500 text-white">
                <PawPrint className="size-4" />
              </span>
              <span className="text-sm font-bold">Platform Admin</span>
            </Link>
            <Breadcrumbs className="hidden min-w-0 flex-1 sm:block" />
          </div>
        </header>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
