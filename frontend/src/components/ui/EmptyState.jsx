export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="rounded-lg border border-dashed border-borderSubtle bg-surface px-4 py-8 text-center sm:px-6 sm:py-12">
      {Icon ? (
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-accent/20 bg-accentDim text-accentText sm:h-16 sm:w-16">
          <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
        </div>
      ) : null}
      <h3 className="mt-4 font-display text-[1.75rem] font-semibold text-ink sm:mt-5 sm:text-2xl">{title}</h3>
      <p className="mx-auto mt-2.5 max-w-md text-sm leading-6 text-secondary sm:mt-3">{description}</p>
      {action ? <div className="mt-5 flex justify-center sm:mt-6">{action}</div> : null}
    </div>
  );
}
