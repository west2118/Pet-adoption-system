import { Bell, Heart, LogOut, Menu, PawPrint, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const links = [
  { to: '/', label: 'Home' },
  { to: '/pets', label: 'Browse Pets' },
  { to: '/shelters', label: 'Shelters' },
  { to: '/applications', label: 'My Applications' },
];

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { favorites } = useFavorites();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(
    () => typeof window !== 'undefined' && window.scrollY > 24,
  );
  const location = useLocation();
  const navigate = useNavigate();

  // Only the landing page gets the transparent-over-hero treatment.
  const onLanding = location.pathname === '/';

  useEffect(() => {
    if (!onLanding) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [onLanding]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleLinks = links.filter((l) => l.to !== '/applications' || Boolean(user));

  const shell = onLanding ? 'landing-theme' : '';
  const solid = !onLanding || scrolled;

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-all duration-500',
        shell,
        solid
          ? 'border-b border-border bg-background/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-20 w-full max-w-[1400px] items-center justify-between gap-4 px-6 lg:px-12">
        <Link to="/" className="group flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--brand)] text-white transition-transform duration-500 group-hover:scale-105">
            <PawPrint className="size-5" />
          </span>
          <span className="font-display text-2xl tracking-tight">
            Paws&Homes
          </span>
        </Link>

        <nav className="hidden items-center gap-10 lg:flex">
          {visibleLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                cn(
                  'group relative text-sm transition-colors duration-300',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-primary',
                )
              }
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {user && (
            <>
              <Link
                to="/favorites"
                className="relative flex size-9 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-muted"
                aria-label="Favorites"
              >
                <Heart className="size-4" />
                {favorites.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[var(--brand)] font-mono text-[10px] font-bold text-white">
                    {favorites.length}
                  </span>
                )}
              </Link>

              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-muted"
                aria-label="Notifications"
                onClick={() => navigate('/applications')}
              >
                <Bell className="size-4" />
              </button>
            </>
          )}

          {user ? (
            <Button
              variant="outline"
              onClick={handleLogout}
              className="h-9 rounded-full border-border bg-transparent px-4 hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-3.5" /> Logout
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => navigate('/signup')}
                className="h-9 rounded-full border-border bg-transparent px-5 hover:bg-muted"
              >
                Sign up
              </Button>
              <Button
                onClick={() => navigate('/login')}
                className="h-9 rounded-full px-5"
              >
                Sign in
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-full border border-border bg-background lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div
          key={location.pathname}
          className="border-t border-border bg-background/95 backdrop-blur-xl lg:hidden"
        >
          <nav className="mx-auto flex w-full max-w-[1400px] flex-col gap-1 px-6 py-4">
            {visibleLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-muted text-primary'
                      : 'text-muted-foreground hover:text-primary',
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
            {user && (
              <NavLink
                to="/favorites"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                Favorites ({favorites.length})
              </NavLink>
            )}

            <div className="mt-3 flex gap-3 border-t border-border pt-4">
              {user ? (
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="h-11 flex-1 rounded-full border-border bg-transparent"
                >
                  <LogOut className="size-4" /> Logout
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigate('/signup');
                      setOpen(false);
                    }}
                    className="h-11 flex-1 rounded-full border-border bg-transparent"
                  >
                    Sign up
                  </Button>
                  <Button
                    onClick={() => navigate('/login')}
                    className="h-11 flex-1 rounded-full"
                  >
                    Sign in
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};