import { cn } from "../../utils/cn";

export function Badge({ className, children }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-wider", className)}>
      {children}
    </span>
  );
}
