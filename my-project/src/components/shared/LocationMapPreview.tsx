import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationMapPreviewProps {
  latitude: number;
  longitude: number;
  /** Optional caption under the map (e.g. the resolved address). */
  label?: string;
  className?: string;
}

/**
 * Small OpenStreetMap preview of a picked location.
 *
 * Uses the public OSM embed endpoint (no API key) with a marker and a bbox
 * centred on the point. Rendered lazily so it never blocks the form.
 */
export const LocationMapPreview = ({
  latitude,
  longitude,
  label,
  className,
}: LocationMapPreviewProps) => {
  const delta = 0.004; // ~450m box around the point
  const bbox = [longitude - delta, latitude - delta, longitude + delta, latitude + delta].join(
    '%2C',
  );
  const src =
    `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}` +
    `&layer=mapnik&marker=${latitude}%2C${longitude}`;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative h-44 w-full overflow-hidden rounded-lg border border-border bg-muted">
        <iframe
          title="Shelter location preview"
          src={src}
          loading="lazy"
          className="absolute inset-0 size-full"
          style={{ border: 0 }}
        />
      </div>
      <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        <MapPin className="size-3.5 shrink-0 text-primary" />
        <span className="truncate">{label || 'Approximate location'}</span>
      </p>
    </div>
  );
};
