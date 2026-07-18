import { cn } from "@/lib/utils";
import { BRAND_LOGO_DATA_URL } from "@/components/brand-logo-data";

type BrandLogoProps = {
  className?: string;
  size?: number;
  priority?: boolean;
  /** Full brand card instead of icon mark */
  full?: boolean;
};

/** Public file fallback (favicons / PWA). UI uses inline data URL to skip caches. */
const LOGO_FULL = "/mst-logo.png?v=6";

export function BrandLogo({
  className,
  size = 36,
  priority,
  full = false,
}: BrandLogoProps) {
  // Original logo is landscape (~511×362); square mark uses padded contain (no stretch).
  const width = full ? Math.round(size * (511 / 362)) : size;
  const height = size;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-[#073267] shadow-sm ring-1 ring-black/10",
        full ? "rounded-2xl" : "rounded-xl",
        className,
      )}
      style={{ width, height }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={full ? LOGO_FULL : BRAND_LOGO_DATA_URL}
        alt='OOO "MUSFIRA SAVDO TRANS"'
        width={width}
        height={height}
        className="h-full w-full object-contain object-center"
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
      />
    </span>
  );
}
