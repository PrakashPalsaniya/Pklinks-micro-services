import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function HomePage() {
  const { user, loading } = useAuth();
  const [inputUrl, setInputUrl] = useState("");
  const [demoShortUrl, setDemoShortUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const shortenDemo = () => {
    if (!inputUrl.trim()) return;
    const slugs = ["x7f2k", "p9qmn", "ab3yz", "lnk42", "go8xq"];
    const slug = slugs[Math.floor(Math.random() * slugs.length)];
    setDemoShortUrl(`pklinks.in/${slug}`);
    setCopied(false);
  };

  const copyLink = () => {
    if (!demoShortUrl) return;
    navigator.clipboard.writeText("https://" + demoShortUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const focusInput = () => {
    const input = document.getElementById("url-input");
    if (input) {
      input.scrollIntoView({ behavior: "smooth", block: "center" });
      input.focus();
    }
  };

  return (
    <div className="min-h-screen bg-base selection:bg-accent/30 selection:text-ink flex flex-col relative overflow-x-hidden font-display">
      {/* Background canvas glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[200px] -left-[200px] w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.12)_0%,transparent_70%)]" />
        <div className="absolute -top-[150px] -right-[150px] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.10)_0%,transparent_70%)]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-8 h-16 bg-base/60 backdrop-blur-md border-b border-white/5">
        <Link className="flex items-center gap-2 text-decoration-none" to="/">
          <div className="w-8 h-8 bg-gradient-to-br from-accent to-purple-500 rounded-lg flex items-center justify-center text-sm font-semibold text-white">
            🔗
          </div>
          <span className="text-lg font-bold tracking-tight text-ink">
            PK<span className="font-mono text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-500">Links</span>
          </span>
        </Link>
        
        <ul className="hidden sm:flex items-center gap-8 list-none">
          <li>
            <a href="#features" className="text-zinc-400 hover:text-zinc-100 transition-colors text-sm font-medium">
              Features
            </a>
          </li>
          <li>
            <a href="#how" className="text-zinc-400 hover:text-zinc-100 transition-colors text-sm font-medium">
              How it works
            </a>
          </li>
        </ul>

        <div className="flex items-center gap-3">
          {!loading && user ? (
            <Link to="/dashboard" className="px-4 py-2 rounded-lg bg-accent hover:bg-accentHover text-white transition-all text-sm font-semibold hover:-translate-y-[1px] hover:shadow-[0_4px_20px_rgba(99,102,241,0.35)]">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 rounded-lg border border-white/5 hover:bg-white/[0.07] hover:border-white/15 text-zinc-400 hover:text-zinc-100 transition-all text-sm font-medium">
                Log in
              </Link>
              <Link to="/signup" className="px-4 py-2 rounded-lg bg-accent hover:bg-accentHover text-white transition-all text-sm font-semibold hover:-translate-y-[1px] hover:shadow-[0_4px_20px_rgba(99,102,241,0.35)]">
                Get started free
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="pt-36 pb-24 px-4 max-w-[900px] mx-auto text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-[0.78rem] font-medium text-accentHover font-mono tracking-wide mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Now live — free for everyone
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5 text-ink">
            Short links that<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-500">work smarter</span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-[560px] mx-auto mb-10">
            PKLinks turns any URL into a clean, trackable short link in one click.
            Built for developers, marketers, and anyone who hates ugly URLs.
          </p>

          <div className="w-full max-w-[640px] mx-auto mb-4 flex bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-accent/50 focus-within:ring-4 focus-within:ring-accent/10 transition-all">
            <input
              id="url-input"
              type="url"
              className="flex-1 bg-transparent border-0 outline-none px-5 py-4 text-ink font-mono text-sm placeholder-zinc-600"
              placeholder="https://your-really-long-url.com/goes/here"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && shortenDemo()}
            />
            <button
              onClick={shortenDemo}
              className="px-6 py-4 bg-gradient-to-r from-accent to-purple-500 border-0 text-white font-semibold text-sm cursor-pointer hover:opacity-90 active:scale-98 transition-all whitespace-nowrap"
            >
              Shorten →
            </button>
          </div>
          
          <p className="text-xs text-zinc-600 font-mono">
            Free to use · No sign-up required · <strong className="text-accentHover font-medium">pklinks.in/xxxxxxx</strong>
          </p>

          {/* Demo Output Pill */}
          {demoShortUrl && (
            <div className="mt-5 px-5 py-3 bg-accent/10 border border-accent/25 rounded-full w-full max-w-[640px] mx-auto flex items-center justify-between gap-3 animate-page-in">
              <span className="font-mono text-[0.88rem] text-accentHover truncate">
                {demoShortUrl}
              </span>
              <button
                onClick={copyLink}
                className="shrink-0 bg-accent hover:bg-accentHover text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          )}
        </section>

        {/* Features */}
        <section id="features" className="w-full max-w-[1100px] mx-auto my-24 px-6 sm:px-8">
          <p className="font-mono text-[0.75rem] font-semibold text-accent tracking-widest uppercase mb-3">
            features
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Everything a short link needs to be
          </h2>
          <p className="text-base text-zinc-400 max-w-[480px] leading-relaxed mb-12">
            Not just a redirect. PKLinks gives every link a brain.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:border-accent/30 hover:bg-white/[0.07] hover:-translate-y-[2px] transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-lg mb-4">
                ⚡
              </div>
              <h3 className="text-base font-semibold mb-2">Instant Shortening</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Paste. Click. Done. Your short link is live in under a second, no account needed to start.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:border-accent/30 hover:bg-white/[0.07] hover:-translate-y-[2px] transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-lg mb-4">
                📊
              </div>
              <h3 className="text-base font-semibold mb-2">Click Analytics</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                See exactly who clicked, from where, on what device — in a clean real-time dashboard.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:border-accent/30 hover:bg-white/[0.07] hover:-translate-y-[2px] transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-lg mb-4">
                ✏️
              </div>
              <h3 className="text-base font-semibold mb-2">Custom Aliases</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Replace random slugs with readable ones. <span className="font-mono text-accentHover text-xs">pklinks.in/launch</span> beats a hash every time.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:border-accent/30 hover:bg-white/[0.07] hover:-translate-y-[2px] transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-lg mb-4">
                ⏳
              </div>
              <h3 className="text-base font-semibold mb-2">Link Expiry</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Set an expiry date or a click limit. Perfect for time-sensitive campaigns and invites.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how" className="w-full max-w-[1100px] mx-auto mb-24 px-6 sm:px-8">
          <p className="font-mono text-[0.75rem] font-semibold text-accent tracking-widest uppercase mb-3">
            how it works
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Three steps, zero friction
          </h2>
          <p className="text-base text-zinc-400 max-w-[480px] leading-relaxed mb-12">
            From long URL to live short link in the time it takes to blink.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="flex flex-col gap-3">
              <span className="font-mono text-xs text-accent font-semibold">01</span>
              <h3 className="text-base font-semibold">Paste your URL</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Drop any link into the box — blog posts, product pages, Google Drive files, anything.
              </p>
              <div className="mt-2 bg-white/5 border border-white/10 rounded-xl p-3 font-mono text-[0.78rem] text-zinc-500">
                <span className="text-accentHover">→</span> https://docs.google.com/spreadsheets/d/1aBcDeFgHiJkLmN...
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-mono text-xs text-accent font-semibold">02</span>
              <h3 className="text-base font-semibold">Get your short link</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                PKLinks generates a short alias instantly. Customize it or keep the auto-generated slug.
              </p>
              <div className="mt-2 bg-white/5 border border-white/10 rounded-xl p-3 font-mono text-[0.78rem] text-zinc-500">
                <span className="text-accentHover">✓</span> pklinks.in/<span className="text-accentHover">q3-report</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-mono text-xs text-accent font-semibold">03</span>
              <h3 className="text-base font-semibold">Share & track</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Copy, share anywhere, and watch click data roll in from your analytics dashboard.
              </p>
              <div className="mt-2 bg-white/5 border border-white/10 rounded-xl p-3 font-mono text-[0.78rem] text-zinc-500">
                <span className="text-accentHover">📈</span> 142 clicks · 12 countries · 68% mobile
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="w-full max-w-[1100px] mx-auto mb-24 px-6 sm:px-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-accent/10 to-purple-500/5 border border-accent/20 rounded-[24px] py-16 px-6 sm:px-12 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.08)_0%,transparent_60%)] pointer-events-none" />
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 relative z-10">
              Your first short link is one click away
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base mb-8 relative z-10">
              No credit card. No account. Just paste and go.
            </p>
            <div className="flex justify-center relative z-10">
              <button
                onClick={focusInput}
                className="px-7 py-3 text-[0.95rem] rounded-xl bg-accent hover:bg-accentHover text-white transition-all font-semibold hover:-translate-y-[1px] hover:shadow-[0_4px_20px_rgba(99,102,241,0.35)]"
              >
                Shorten a link now →
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-6 sm:px-8 w-full max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="font-mono text-sm text-zinc-500">
          PK<span className="text-accent">Links</span> · Built with ☕ by sskks
        </div>
        <ul className="flex gap-6 list-none">
          <li>
            <a href="#" className="text-zinc-500 hover:text-zinc-400 text-xs transition-colors">
              Privacy
            </a>
          </li>
          <li>
            <a href="#" className="text-zinc-500 hover:text-zinc-400 text-xs transition-colors">
              Terms
            </a>
          </li>
          <li>
            <a href="#" className="text-zinc-500 hover:text-zinc-400 text-xs transition-colors">
              Status
            </a>
          </li>
          <li>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-zinc-400 text-xs transition-colors">
              GitHub
            </a>
          </li>
        </ul>
      </footer>
    </div>
  );
}
