import { ArrowRight, Link2, BarChart3, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";

export function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-base selection:bg-accent/30 selection:text-ink flex flex-col">
      {/* Navigation */}
      <nav className="w-full border-b border-borderSubtle bg-surface/50 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
              <Link2 size={18} strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-ink">
              PKLinks
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {!loading && user ? (
              <Link to="/dashboard">
                <Button variant="primary" size="sm">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-secondary hover:text-ink transition-colors hidden sm:block">
                  Sign in
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-32 text-center sm:px-6 lg:px-8">
        
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent mb-8">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent"></span>
          </span>
          Lightning fast URL shortening
        </div>

        <h1 className="max-w-4xl font-display text-5xl font-extrabold tracking-tight text-ink sm:text-6xl lg:text-7xl">
          Shorten your links. <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-500">
            Expand your reach.
          </span>
        </h1>
        
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-secondary">
          A powerful, intuitive URL shortener designed for growth. Create memorable links, track real-time engagement, and understand your audience effortlessly.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to={user ? "/dashboard" : "/signup"}>
            <Button size="lg" icon={ArrowRight} className="w-full sm:w-auto">
              Start shortening for free
            </Button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="mx-auto mt-32 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="rounded-2xl border border-borderSubtle bg-surface p-8 text-left shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Zap size={24} />
            </div>
            <h3 className="font-display text-xl font-bold text-ink">Blazing Fast</h3>
            <p className="mt-2 text-secondary">
              Our highly optimized platform ensures your links load instantly for every user, no matter where they are.
            </p>
          </div>
          
          <div className="rounded-2xl border border-borderSubtle bg-surface p-8 text-left shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <BarChart3 size={24} />
            </div>
            <h3 className="font-display text-xl font-bold text-ink">Deep Analytics</h3>
            <p className="mt-2 text-secondary">
              Track clicks, geographic locations, top referrers, and device types in real-time with beautiful dashboards.
            </p>
          </div>

          <div className="rounded-2xl border border-borderSubtle bg-surface p-8 text-left shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
              <Link2 size={24} />
            </div>
            <h3 className="font-display text-xl font-bold text-ink">Custom URLs</h3>
            <p className="mt-2 text-secondary">
              Generate random short codes or define custom aliases to match your brand identity perfectly.
            </p>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-borderSubtle bg-surface py-8 text-center">
        <p className="text-sm text-secondary">
          © {new Date().getFullYear()} PKLinks Platform. Empowering your digital presence.
        </p>
      </footer>
    </div>
  );
}
