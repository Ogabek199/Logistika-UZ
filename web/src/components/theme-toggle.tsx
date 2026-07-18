"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  variant?: "light" | "dark" | "ink";
  className?: string;
};

export function ThemeToggle({
  variant = "light",
  className,
}: ThemeToggleProps) {
  const { theme, toggleTheme, ready } = useTheme();
  const t = useT();
  const isDark = theme === "dark";

  const shell =
    variant === "dark" || variant === "ink"
      ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
      : "border-line bg-paper text-ink hover:bg-mist";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t("theme.toLight") : t("theme.toDark")}
      title={isDark ? t("theme.toLight") : t("theme.toDark")}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl border transition",
        shell,
        className,
      )}
    >
      {!ready ? (
        <span className="h-4 w-4" />
      ) : isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
