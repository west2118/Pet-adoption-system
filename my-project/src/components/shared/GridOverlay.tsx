const COLUMNS = Array.from({ length: 12 }, (_, i) => (i * 100) / 12);
const ROWS = Array.from({ length: 8 }, (_, i) => (i * 100) / 8);

interface GridOverlayProps {
  className?: string;
}

/**
 * Faint hairline grid used as a texture layer behind hero imagery.
 * Purely decorative, so it is hidden from assistive technology.
 */
export const GridOverlay = ({ className }: GridOverlayProps) => (
  <div
    aria-hidden="true"
    className={`pointer-events-none absolute inset-0 overflow-hidden opacity-20 ${className ?? ''}`}
  >
    {COLUMNS.map((left) => (
      <div
        key={`col-${left}`}
        className="absolute w-px bg-foreground/10"
        style={{ left: `${left}%`, top: 0, bottom: 0 }}
      />
    ))}
    {ROWS.map((top) => (
      <div
        key={`row-${top}`}
        className="absolute h-px bg-foreground/10"
        style={{ top: `${top}%`, left: 0, right: 0 }}
      />
    ))}
  </div>
);