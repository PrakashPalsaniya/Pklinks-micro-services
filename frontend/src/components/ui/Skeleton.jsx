import { cn } from "../../utils/cn";

export function Skeleton({ className }) {
  return <div className={cn("animate-pulse rounded-lg bg-panelAlt", className)} />;
}
