import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Shelter } from '@/types';

interface ShelterGeoMapProps {
  shelter: Shelter;
  className?: string;
  height?: number | string;
  zoom?: number;
  showCardHeader?: boolean;
}

/**
 * Clean interactive Geo Map for shelters.
 * Automatically resolves coordinates (lat/lng) or falls back to address geocoding.
 * Supports direct directions link to Google Maps / OpenStreetMap.
 */
export const ShelterGeoMap = ({
  shelter,
  className,
  height = 260,
  zoom = 15,
  showCardHeader = true,
}: ShelterGeoMapProps) => {
  const hasCoords =
    typeof shelter.latitude === 'number' &&
    typeof shelter.longitude === 'number' &&
    !Number.isNaN(shelter.latitude) &&
    !Number.isNaN(shelter.longitude);

  const lat = hasCoords ? (shelter.latitude as number) : null;
  const lon = hasCoords ? (shelter.longitude as number) : null;

  // Compute bounding box for OpenStreetMap embed when coordinates exist
  // ~0.005 deg offset is approx 500m zoom box
  const delta = 0.006;
  const osmEmbedUrl =
    hasCoords && lat !== null && lon !== null
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${lon - delta}%2C${lat - delta}%2C${lon + delta}%2C${lat + delta}&layer=mapnik&marker=${lat}%2C${lon}`
      : null;

  // Fallback Google Maps embed query based on shelter address + location
  const mapQuery = encodeURIComponent(
    `${shelter.name}, ${shelter.address || shelter.location || ''}`,
  );
  const googleEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;

  const embedUrl = osmEmbedUrl || googleEmbedUrl;

  const directionsUrl =
    hasCoords && lat !== null && lon !== null
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`
      : `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm',
        className,
      )}
    >
      {showCardHeader && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-foreground">
                {shelter.address || shelter.location}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {shelter.location}
              </p>
            </div>
          </div>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-xs font-medium text-primary shadow-xs transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <Navigation className="size-3" />
            <span>Directions</span>
            <ExternalLink className="size-3 opacity-60" />
          </a>
        </div>
      )}

      {/* Embed map frame */}
      <div className="relative w-full overflow-hidden bg-muted/40" style={{ height }}>
        <iframe
          title={`Map location for ${shelter.name}`}
          src={embedUrl}
          className="size-full border-0 transition-opacity duration-500"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />

        {/* Floating overlay chip linking to directions */}
        {!showCardHeader && (
          <div className="absolute right-3 bottom-3 z-10">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-md backdrop-blur-xs transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <Navigation className="size-3 text-primary" />
              <span>Open in Maps</span>
              <ExternalLink className="size-3 opacity-60" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
