export function Field({ label, description, error, children }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-ink">
      <span className="text-xs font-bold uppercase tracking-wider text-muted">{label}</span>
      {children}
      {description ? <span className="text-xs leading-relaxed text-secondary">{description}</span> : null}
      {error ? <span className="text-xs font-medium text-dangerText">{error}</span> : null}
    </label>
  );
}
