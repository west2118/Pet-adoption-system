import { BlurText, GridOverlay, Reveal } from '@/components/shared';
import { FRAME_CLASS } from './constants';

export const VisitsHero = () => (
  <section className="relative overflow-hidden bg-background py-20 md:py-28 lg:py-32">
    <div className="absolute inset-0 z-0" aria-hidden="true">
      <GridOverlay />
      <div className="absolute -right-20 top-1/4 size-[36rem] rounded-full bg-[var(--brand)]/15 blur-[120px] pointer-events-none" />
      <div className="absolute -left-20 bottom-10 size-[28rem] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
    </div>

    <div className={`relative z-10 ${FRAME_CLASS}`}>
      <Reveal>
        <p className="text-center font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          Meet and greet
        </p>
      </Reveal>

      <Reveal delay={80}>
        <h1 className="mt-6 text-center font-display text-[clamp(2.75rem,8vw,7rem)] leading-[0.9] tracking-tight">
          <span className="block text-primary">My</span>
          <span className="block">visits</span>
        </h1>
      </Reveal>

      <BlurText
        as="p"
        delay={200}
        className="mx-auto mt-10 max-w-3xl justify-center text-center text-2xl leading-relaxed text-muted-foreground md:text-3xl"
      >
        Requested, confirmed, completed. Follow every meet-and-greet as the
        shelter team approves it — the decision arrives by email.
      </BlurText>
    </div>
  </section>
);

