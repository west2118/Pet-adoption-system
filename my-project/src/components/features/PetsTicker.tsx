interface PetsTickerProps {
  /** Already-formatted labels, e.g. `"Buddy · Manila"`. Duplicated for a seamless loop. */
  items: string[];
}

/**
 * Infinite marquee of live listing labels, sitting directly under the hero.
 *
 * Reuses the landing page's `landing-marquee` keyframe: the track is exactly two
 * copies wide, so translating it by -50% loops without a seam. The reduced-motion
 * rule in `index.css` collapses the iteration count, which parks it at the seam.
 */
export const PetsTicker = ({ items }: PetsTickerProps) => {
  if (items.length === 0) return null;

  return (
    <div className="relative overflow-hidden border-b border-border bg-background py-5">
      <div className="flex w-max animate-[landing-marquee_38s_linear_infinite] items-center gap-12">
        {[...Array(2)].flatMap((_, copy) =>
          items.map((item) => (
            <span
              key={`${copy}-${item}`}
              className="flex shrink-0 items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              <span className="size-1 rounded-full bg-[var(--brand)]" />
              {item}
            </span>
          )),
        )}
      </div>
    </div>
  );
};
