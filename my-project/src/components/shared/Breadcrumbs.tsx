import { ChevronRight, House } from 'lucide-react';
import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const segmentLabels: Record<string, string> = {
  admin: 'Admin',
  shelter: 'Shelter',
  pets: 'Pets',
  shelters: 'Shelters',
  favorites: 'Favorites',
  applications: 'Applications',
  apply: 'Apply',
  listings: 'Listings',
  inquiries: 'Inquiries',
  profile: 'Profile',
  users: 'Users',
  templates: 'Templates',
  'e-waivers': 'E-Waivers',
  dashboard: 'Dashboard',
  login: 'Sign in',
  signup: 'Sign up',
};

const labelFor = (segment: string): string => {
  if (segmentLabels[segment]) return segmentLabels[segment];
  const pretty = segment.replace(/-/g, ' ');
  return pretty.charAt(0).toUpperCase() + pretty.slice(1);
};

/**
 * Breadcrumbs: auto-built from the current route. Renders Home + each
 * path segment; the last segment is the current page (not a link).
 */
export const Breadcrumbs = ({ className }: { className?: string }) => {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className={cn('min-w-0', className)}>
      <ol className="flex min-w-0 items-center gap-1 truncate text-sm">
        <li className="flex shrink-0 items-center">
          <Link
            to="/"
            aria-label="Home"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <House className="size-4" />
          </Link>
        </li>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join('/')}`;
          const isLast = index === segments.length - 1;
          return (
            <Fragment key={href}>
              <li aria-hidden="true" className="shrink-0 text-muted-foreground/60">
                <ChevronRight className="size-3.5" />
              </li>
              <li className="min-w-0">
                {isLast ? (
                  <span aria-current="page" className="truncate font-medium">
                    {labelFor(segment)}
                  </span>
                ) : (
                  <Link
                    to={href}
                    className="truncate text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {labelFor(segment)}
                  </Link>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
};
