import { cn } from "../../utils/cn";

export function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <div className={cn("flex flex-col gap-4 sm:gap-6", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          {eyebrow && (
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-accent">
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl font-black tracking-tight text-ink sm:text-5xl">
            {title}
          </h1>
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
            {actions}
          </div>
        )}
      </div>
      {description && (
        <div className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          {description}
        </div>
      )}
    </div>
  );
}
