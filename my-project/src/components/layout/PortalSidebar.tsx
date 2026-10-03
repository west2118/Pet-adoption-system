import { ChevronDown, Globe, LogOut, PawPrint, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useScrollLock } from '@/hooks/useScrollLock';
import { cn } from '@/lib/utils';

export interface PortalLink {
  to: string;
  end?: boolean;
  label: string;
  icon: LucideIcon;
}

export interface PortalGroup {
  label: string;
  icon: LucideIcon;
  children: PortalLink[];
}

export type SidebarItem = PortalLink | PortalGroup;

interface PortalSidebarProps {
  brandTitle: string;
  brandSubtitle: string;
  links: SidebarItem[];
  mobileOpen?: boolean;
  onClose?: () => void;
}

const isGroup = (item: SidebarItem): item is PortalGroup =>
  (item as PortalGroup).children !== undefined;

const activeClass = 'bg-primary text-primary-foreground';
const idleClass = 'text-muted-foreground hover:bg-muted hover:text-foreground';

const linkClass = ({ isActive }: { isActive: boolean }): string =>
  cn(
    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? activeClass : idleClass,
  );

const SidebarGroup = ({
  group,
  onNavigate,
}: {
  group: PortalGroup;
  onNavigate?: () => void;
}) => {
  const { pathname } = useLocation();
  const hasActiveChild = group.children.some(
    (c) => pathname === c.to || pathname.startsWith(`${c.to}/`),
  );
  const [open, setOpen] = useState(hasActiveChild);

  useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild]);

  const ParentIcon = group.icon;

  return (
    <div className="space-y-1">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          hasActiveChild ? 'text-foreground' : idleClass,
        )}
      >
        <ParentIcon className="size-4" />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="space-y-1 pl-4">
          {group.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              end={child.end}
              onClick={() => onNavigate?.()}
              className={linkClass}
            >
              <child.icon className="size-4" />
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

export const PortalSidebar = ({
  brandTitle,
  brandSubtitle,
  links,
  mobileOpen = false,
  onClose,
}: PortalSidebarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const drawerRef = useRef<HTMLDivElement>(null);

  useScrollLock(mobileOpen, drawerRef);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen, onClose]);

  const handleLogout = async (): Promise<void> => {
    logout();
    onClose?.();
    navigate('/login');
  };

  const closeLabel = `Close ${brandTitle} menu`;
  const displayName = user?.name ?? 'User';
  const displayRole = (user?.role ?? 'staff').replace('_', ' ');
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  const sidebarBody = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-5">
        <span className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-orange-500 text-white">
            <PawPrint className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold">{brandTitle}</span>
            <span className="block text-xs text-muted-foreground">{brandSubtitle}</span>
          </span>
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="flex size-9 items-center justify-center rounded-lg border lg:hidden"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 pb-3 pt-3">
        {links.map((item) =>
          isGroup(item) ? (
            <SidebarGroup key={item.label} group={item} onNavigate={onClose} />
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => onClose?.()}
              className={linkClass}
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ),
        )}
      </nav>

      <div className="border-t px-3 pb-3 pt-2">
        <div className="-mx-3 border-b px-3 pb-2">
          <NavLink
            to="/"
            onClick={() => onClose?.()}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Globe className="size-4" />
            View public site
          </NavLink>
        </div>
        <div className="flex items-center gap-2.5 px-1 pt-3">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={displayName}
              className="size-9 shrink-0 rounded-full border object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700 dark:bg-orange-950 dark:text-orange-300"
            >
              {initials}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{displayName}</p>
            <p className="truncate text-[11px] capitalize text-muted-foreground">{displayRole}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden h-screen w-64 shrink-0 border-r bg-card lg:block">{sidebarBody}</aside>

      {mobileOpen && (
        <div ref={drawerRef} className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r bg-card shadow-xl">
            {sidebarBody}
          </aside>
        </div>
      )}
    </>
  );
};
