import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "lg"
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 px-3 pb-0 pt-4 backdrop-blur-sm sm:items-center sm:px-6 sm:pb-6 sm:pt-6">
      <button type="button" aria-label="Close dialog" className="absolute inset-0" onClick={onClose} />
      <div
        className={cn(
          "animate-sheet-in sm:animate-dialog-in relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-lg border border-borderDefault bg-surface shadow-2xl shadow-black/40 sm:max-h-[90vh] sm:rounded-lg",
          size === "lg" && "max-w-3xl",
          size === "md" && "max-w-xl",
          size === "sm" && "max-w-md"
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-borderSubtle px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink">{title}</h2>
            {description ? <p className="mt-1.5 text-sm font-medium leading-relaxed text-secondary">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-borderSubtle bg-elevated p-2 text-ink transition hover:border-borderDefault hover:bg-overlay"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">{children}</div>
        {footer ? <div className="border-t border-borderSubtle px-4 py-4 sm:px-6">{footer}</div> : null}
      </div>
    </div>
  );
}
