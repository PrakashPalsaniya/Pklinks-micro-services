import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../utils/cn";

export function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  icon: Icon,
  children,
  ...props
}) {
  const Comp = asChild ? Slot : "button";

  const variants = {
    primary: "bg-accent text-white shadow-lg shadow-accent/25 hover:bg-accent-hover hover:shadow-accent/40 active:scale-[0.98]",
    secondary: "bg-elevated text-ink border border-borderSubtle hover:bg-white/5",
    subtle: "bg-accent/10 text-accent hover:bg-accent/20",
    ghost: "text-secondary hover:text-ink hover:bg-white/5",
    danger: "bg-danger text-white shadow-lg shadow-danger/20 hover:bg-red-600",
  };

  const sizes = {
    sm: "h-9 px-4 text-xs",
    md: "h-11 px-6 text-sm",
    lg: "h-13 px-8 text-base",
    icon: "h-10 w-10",
  };

  return (
    <Comp
      className={cn(
        "inline-flex items-center gap-2.5 justify-center rounded-2xl font-bold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {Icon && <Icon size={size === "sm" ? 14 : 18} />}
      {children}
    </Comp>
  );
}
