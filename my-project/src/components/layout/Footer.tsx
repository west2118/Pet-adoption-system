import { Clock, Mail, MapPin, PawPrint, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GridOverlay } from '@/components/shared';

const columns = [
  {
    title: 'Explore',
    links: [
      { to: '/pets', label: 'Browse pets' },
      { to: '/shelters', label: 'Shelters' },
      { to: '/favorites', label: 'Favorites' },
      { to: '/applications', label: 'Track application' },
    ],
  },
  ];

export const Footer = () => {
  return (
    <footer className="landing-theme relative overflow-hidden border-t border-border">
      <GridOverlay className="opacity-[0.06]" />

      <div className="relative mx-auto w-full max-w-[1400px] px-6 py-16 lg:px-12 lg:py-20">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--brand)] text-white">
                <PawPrint className="size-5" />
              </span>
              <span className="font-display text-2xl tracking-tight">Paws&Homes</span>
            </Link>
            <p className="mt-6 max-w-sm text-base leading-relaxed text-muted-foreground">
              Connecting adopters with shelters and rescues. Every pet deserves a
              loving home.
            </p>
            <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60">
              Pet adoption &amp; rescue management
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.title} className="md:col-span-3">
              <h4 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {column.title}
              </h4>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-foreground/70 transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="md:col-span-4">
            <h4 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Contact
            </h4>
            <ul className="mt-5 space-y-3 text-sm text-foreground/70">
              <li className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0 text-muted-foreground" />
                Quezon City, Manila
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-muted-foreground" />
                +63 2 8555 0100
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0 text-muted-foreground" />
                hello@pawsandhomes.ph
              </li>
              <li className="flex items-center gap-2">
                <Clock className="size-4 shrink-0 text-muted-foreground" />
                Mon–Sat, 9AM–6PM
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="relative border-t border-foreground/10">
        <div className="mx-auto w-full max-w-[1400px] px-6 py-6 lg:px-12">
          <p className="font-mono text-[11px] text-muted-foreground">
            © 2026 Paws&Homes · Pet Adoption &amp; Rescue Management System
          </p>
        </div>
      </div>
    </footer>
  );
};