import { useState } from 'react';
import { cn } from '@/lib/utils';

export const PetGallery = ({ images, name }: { images: string[]; name: string }) => {
  const [active, setActive] = useState(0);
  const list = images.length > 0 ? images : ['/placeholder-pet.jpg'];

  return (
    <div>
      <div className="overflow-hidden rounded-xl border">
        <img
          src={list[active]}
          alt={`${name} photo ${active + 1}`}
          className="h-80 w-full object-cover sm:h-96"
        />
      </div>
      {list.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {list.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1} of ${name}`}
              className={cn(
                'overflow-hidden rounded-lg border-2 transition-colors',
                i === active ? 'border-orange-500' : 'border-transparent hover:border-muted-foreground/40',
              )}
            >
              <img src={src} alt="" className="h-16 w-full object-cover sm:h-20" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
