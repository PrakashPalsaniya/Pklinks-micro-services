import { cn } from "../../utils/cn";

export function Switch({ checked, onCheckedChange, className }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20",
        checked ? "border-accent bg-accent" : "border-borderDefault bg-base",
        className
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-ink transition",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}
