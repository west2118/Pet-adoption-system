import { Clock, Mail, MapPin, PawPrint, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Container } from './Container';

export const Footer = () => {
  return (
    <footer className="mt-16 border-t bg-muted/40">
      <Container className="grid gap-10 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-orange-500 text-white">
              <PawPrint className="size-5" />
            </span>
            <span className="text-lg font-bold">PawsConnect</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Connecting adopters with shelters and rescues. Every pet deserves a
            loving home.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/pets" className="hover:text-foreground">Browse pets</Link></li>
            <li><Link to="/shelters" className="hover:text-foreground">Shelters</Link></li>
            <li><Link to="/favorites" className="hover:text-foreground">Favorites</Link></li>
            <li><Link to="/applications" className="hover:text-foreground">Track application</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Shelters</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/shelter" className="hover:text-foreground">Staff dashboard</Link></li>
            <li><Link to="/shelter/listings" className="hover:text-foreground">List a pet</Link></li>
            <li><Link to="/shelter/applications" className="hover:text-foreground">Review applications</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><MapPin className="size-4" /> Quezon City, Manila</li>
            <li className="flex items-center gap-2"><Phone className="size-4" /> +63 2 8555 0100</li>
            <li className="flex items-center gap-2"><Mail className="size-4" /> hello@pawsconnect.ph</li>
            <li className="flex items-center gap-2"><Clock className="size-4" /> Mon–Sat, 9AM–6PM</li>
          </ul>
        </div>
      </Container>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © 2026 PawsConnect · Pet Adoption & Rescue Management System
      </div>
    </footer>
  );
};
