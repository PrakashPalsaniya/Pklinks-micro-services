export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-borderDefault bg-elevated text-accent">
        <span className="font-display text-sm font-bold">PK</span>
      </div>
      <p className="font-display text-lg font-semibold tracking-[0.08em]">
        <span className="text-ink">PK</span>
        <span className="text-accent">LINKS</span>
      </p>
    </div>
  );
}
