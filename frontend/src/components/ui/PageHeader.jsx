import { cn } from "../../utils/cn";

export function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <div className={cn("flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8", className)}>
      <div className="space-y-2">
        {eyebrow && (
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-accent">
            {eyebrow}
          </p>
        )}
        <h1 className="text-4xl font-black tracking-tight text-ink sm:text-5xl">
          {title}
        </h1>
        {description && (
          <div className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            {description}
          </div>
        )}
      </div>
      
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
