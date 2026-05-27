import { cn } from "../../utils/cn";

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "min-h-[108px] w-full rounded-lg border border-borderDefault bg-base px-3 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-accent focus:ring-0 disabled:border-borderDefault disabled:bg-surface disabled:text-borderStrong sm:min-h-[120px] sm:px-4",
        className
      )}
      {...props}
    />
  );
}
