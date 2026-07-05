import { forwardRef } from "react";
import { cn } from "../../utils/cn";

export const Input = forwardRef(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-ink outline-none transition-all placeholder:text-muted focus:border-accent/50 focus:bg-white/[0.08] focus:ring-0 disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";
