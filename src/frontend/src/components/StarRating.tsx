import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRate?: (rating: number) => void;
  className?: string;
}

const STAR_LABELS = ["one", "two", "three", "four", "five"];

export default function StarRating({
  rating,
  max = 5,
  size = "md",
  interactive = false,
  onRate,
  className,
}: StarRatingProps) {
  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  return (
    <div className={cn("flex items-center gap-0.5", sizes[size], className)}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.round(rating);
        const label = STAR_LABELS[i] ?? String(i + 1);
        return (
          <button
            key={label}
            type="button"
            className={cn(
              "leading-none",
              interactive
                ? "cursor-pointer hover:scale-110 transition-transform"
                : "cursor-default pointer-events-none",
              filled ? "text-amber-400" : "text-muted-foreground/30",
            )}
            onClick={interactive && onRate ? () => onRate(i + 1) : undefined}
            aria-label={
              interactive
                ? `Rate ${i + 1} stars`
                : `${i + 1} star${i !== 0 ? "s" : ""}`
            }
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
