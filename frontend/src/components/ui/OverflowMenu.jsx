import { MoreHorizontal } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";

const MENU_WIDTH = 224;
const VIEWPORT_GAP = 12;

export function OverflowMenu({ actions = [], label = "More actions", align = "right", triggerClassName = "" }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, placement: "bottom" });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const items = actions.filter(Boolean);

  const updatePosition = useCallback(() => {
    const button = buttonRef.current;

    if (!button || typeof window === "undefined") {
      return;
    }

    const rect = button.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < 260 && rect.top > 260;
    const top = placeAbove ? rect.top - 8 : rect.bottom + 8;
    const rawLeft = align === "left" ? rect.left : rect.right - MENU_WIDTH;
    const maxLeft = window.innerWidth - MENU_WIDTH - VIEWPORT_GAP;
    const left = Math.min(Math.max(rawLeft, VIEWPORT_GAP), Math.max(VIEWPORT_GAP, maxLeft));

    setPosition({
      top,
      left,
      placement: placeAbove ? "top" : "bottom"
    });
  }, [align]);

  useLayoutEffect(() => {
    if (!open) {
      return undefined;
    }

    updatePosition();
    return undefined;
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      const target = event.target;

      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const handleViewportChange = () => {
      updatePosition();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open, updatePosition]);

  if (!items.length) {
    return null;
  }

  const menu = open && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
            width: MENU_WIDTH
          }}
          className={cn(
            "z-[120] max-h-[min(24rem,calc(100vh-1.5rem))] overflow-y-auto rounded-lg border border-borderDefault bg-elevated p-2",
            position.placement === "top" && "-translate-y-full"
          )}
        >
          {items.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.label}
                type="button"
                disabled={action.disabled}
                onClick={() => {
                  if (action.disabled) {
                    return;
                  }

                  setOpen(false);
                  action.onClick?.();
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition [&_svg]:text-muted",
                  action.disabled && "cursor-not-allowed opacity-45",
                  !action.disabled && action.tone === "danger" && "text-dangerText hover:bg-dangerDim hover:[&_svg]:text-danger",
                  !action.disabled && action.tone !== "danger" && "text-secondary hover:bg-overlay hover:text-ink hover:[&_svg]:text-ink"
                )}
              >
                {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div className="shrink-0">
        <button
          ref={buttonRef}
          type="button"
          aria-label={label}
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg border border-transparent bg-transparent text-muted transition hover:bg-elevated hover:text-ink",
            triggerClassName
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      {menu}
    </>
  );
}
