import { Bell, Heart, LogOut, Menu, PawPrint, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Container } from './Container';

const links = [
  { to: '/', label: 'Home' },
  { to: '/pets', label: 'Browse Pets' },
  { to: '/shelters', label: 'Shelters' },
  { to: '/applications', label: 'My Applications' },
];

const activeClass = 'bg-muted text-foreground';
const idleClass = 'text-muted-foreground hover:bg-muted hover:text-foreground';

export const Navbar = () => {
  const { user, logout, switchRole } = useAuth();
  const { favorites } = useFavorites();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-orange-500 text-white">
            <PawPrint className="size-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Paws<span className="text-orange-500">Connect</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? activeClass : idleClass,
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <select
            aria-label="Switch role (demo RBAC)"
            value={user?.role ?? 'adopter'}
            onChange={(e) =>
              switchRole(e.target.value as 'adopter' | 'shelter_staff' | 'platform_admin')
            }
            className="h-9 rounded-lg border border-input bg-background px-2 text-xs font-medium"
          >
            <option value="adopter">Adopter</option>
            <option value="shelter_staff">Shelter Staff</option>
            <option value="platform_admin">Platform Admin</option>
          </select>

          <Link
            to="/favorites"
            className="relative flex size-9 items-center justify-center rounded-lg border hover:bg-muted"
            aria-label="Favorites"
          >
            <Heart className="size-4" />
            {favorites.length > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                {favorites.length}
              </span>
            )}
          </Link>

          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-lg border hover:bg-muted"
            aria-label="Notifications"
            onClick={() => navigate('/applications')}
          >
            <Bell className="size-4" />
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground xl:block">
                {user.name}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="size-3.5" /> Logout
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => navigate('/login')}>
              Sign in
            </Button>
          )}
        </div>

        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-lg border lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </Container>

      {open && (
        <div className="border-t bg-background px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-medium',
                    isActive ? activeClass : idleClass,
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
            <NavLink
              to="/favorites"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Favorites ({favorites.length})
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
};
