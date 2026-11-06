import { ArrowRight, CalendarClock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { FRAME_CLASS } from './constants';

export const VisitsCta = () => (
  <section className="relative overflow-hidden bg-[var(--brand-tint)] py-16 md:py-24">
    <div className={FRAME_CLASS}>
      <Reveal className="text-center">
        <CalendarClock className="mx-auto size-8 text-primary" />
        <h2 className="mx-auto mt-6 max-w-3xl font-display text-3xl leading-tight tracking-tight md:text-5xl">
          Ready to meet them in person?
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
          There are more pets waiting across our partner rescues. Request a
          visit whenever you are ready.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/pets">
            <Button size="lg" className="h-11 rounded-full px-7 text-[15px]">
              Browse pets
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link to="/shelters">
            <Button size="lg" variant="outline" className="h-11 rounded-full px-7 text-[15px]">
              Meet the rescues
            </Button>
          </Link>
        </div>
      </Reveal>
    </div>
  </section>
);

