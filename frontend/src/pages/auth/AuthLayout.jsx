import { Outlet } from "react-router-dom";
import { BrandMark } from "../../components/BrandMark";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-page-glow px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1280px] overflow-hidden rounded-lg border border-line bg-panel lg:grid-cols-[1.15fr_0.85fr]">
        <section className="hidden border-r border-line bg-base px-10 py-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <BrandMark />
            <p className="mt-16 text-[11px] uppercase tracking-[0.16em] text-accent">Access</p>
            <h1 className="mt-5 max-w-xl font-display text-5xl font-semibold leading-tight text-ink">
              Links and traffic in one dark control surface.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-secondary">
              Build short links, watch live performance, and keep every campaign within easy reach.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-panel p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-secondary">Links</p>
              <p className="mt-3 font-display text-2xl text-ink">Ship fast</p>
            </div>
            <div className="rounded-lg border border-line bg-panel p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-secondary">Analytics</p>
              <p className="mt-3 font-display text-2xl text-ink">Read traffic</p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-8 sm:px-8 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <BrandMark />
            </div>
            <Outlet />
          </div>
        </section>
      </div>
    </div>
  );
}
