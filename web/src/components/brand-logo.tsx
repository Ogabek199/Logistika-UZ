import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  size?: number;
  priority?: boolean;
};

export function BrandLogo({ className, size = 36, priority }: BrandLogoProps) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-black/5",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo.png"
        alt="Logistika UZ"
        width={size}
        height={size}
        className="h-full w-full object-cover"
        priority={priority}
      />
    </span>
  );
}
