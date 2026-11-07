import { useState } from 'react';
import { cn } from '@/lib/utils';
import { FALLBACK_PET_PHOTO } from '@/data/petListingPresets';

interface PetGalleryProps {
  images: string[];
  name: string;
  className?: string;
  /** Shown when `images` is empty or blank — normally the listing's main photo. */
  fallbackSrc?: string;
}

/**
 * Portrait plate with a thumbnail rail, sized to echo the shelter plates on the
 * shelters page. Only used by the pet detail hero.
 */
export const PetGallery = ({ images, name, className, fallbackSrc }: PetGalleryProps) => {
  const [active, setActive] = useState(0);
  // Listings may have an empty gallery (or blank entries) while still having a
  // main photo, so never fall back to a missing placeholder file.
  const usable = images.filter((src) => Boolean(src?.trim()));
  const list = usable.length > 0 ? usable : [fallbackSrc?.trim() || FALLBACK_PET_PHOTO];
  const current = list[Math.min(active, list.length - 1)];

  return (
    <div className={className}>
      <div className="group relative overflow-hidden rounded-lg border border-border bg-muted">
        <img
          src={current}
          alt={`${name}, photo ${Math.min(active, list.length - 1) + 1} of ${list.length}`}
          className="h-[380px] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] sm:h-[480px] lg:h-[560px]"
        />
        {list.length > 1 && (
          <span className="absolute bottom-4 right-4 rounded-full bg-background/90 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground backdrop-blur-sm">
            {String(Math.min(active, list.length - 1) + 1).padStart(2, '0')} /{' '}
            {String(list.length).padStart(2, '0')}
          </span>
        )}
      </div>

      {list.length > 1 && (
        <div className="mt-4 flex gap-3">
          {list.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1} of ${name}`}
              aria-current={i === active}
              className={cn(
                'group/thumb relative w-20 shrink-0 overflow-hidden rounded-lg border transition-all duration-300',
                i === active
                  ? 'border-primary opacity-100'
                  : 'border-border opacity-60 hover:opacity-100',
              )}
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                className="h-24 w-full object-cover transition-transform duration-500 group-hover/thumb:scale-105"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
