export function BrandMark() {
  return (
    <div className="flex items-center gap-2 select-none">
      <div className="w-8 h-8 bg-gradient-to-br from-accent to-purple-500 rounded-lg flex items-center justify-center text-sm font-semibold text-white shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)]">
        🔗
      </div>
      <span className="text-lg font-bold tracking-tight text-ink font-display">
        PK<span className="font-mono text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-500">Links</span>
      </span>
    </div>
  );
}
