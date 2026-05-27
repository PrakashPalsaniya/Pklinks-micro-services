import {
  Activity,
  ArrowRight,
  Link2,
  MousePointerClick,
  TimerReset
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatCard } from "../../components/ui/StatCard";
import { useLinksQuery } from "../../hooks/useLinks";
import { formatCount, formatDateTime, formatRelativeDate, truncateMiddle } from "../../utils/format";
import { deriveLinkStatus, getStatusMeta } from "../../utils/status";

export function DashboardPage() {
  const { data: links = [], isLoading, error } = useLinksQuery();

  if (isLoading) {
    return (
      // CHANGED: tighter gap and smaller skeletons on mobile
      <div className="grid gap-4 sm:gap-6">
        <Skeleton className="h-24 sm:h-32" />
        <Skeleton className="h-64 sm:h-80" />
        <Skeleton className="h-64 sm:h-80" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={Activity}
        title="Overview unavailable"
        description="We could not load your live link data right now."
        action={<Button type="button" onClick={() => window.location.reload()}>Refresh</Button>}
      />
    );
  }

  if (!links.length) {
    return (
      <EmptyState
        icon={Link2}
        title="No links yet"
        description="Create your first short link and the dashboard will start filling with live activity."
        action={(
          <Link to="/dashboard/links">
            <Button type="button" icon={ArrowRight}>Create link</Button>
          </Link>
        )}
      />
    );
  }

  const totalClicks = links.reduce((sum, link) => sum + (link.clickCount || 0), 0);
  const activeLinks = links.filter((link) => deriveLinkStatus(link) === "active").length;
  const inactiveLinks = links.length - activeLinks;
  const recentLinks = [...links]
    .sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime())
    .slice(0, 5);
  const attentionLinks = [...links]
    .filter((link) => deriveLinkStatus(link) !== "active" || link.expiry)
    .sort((left, right) => {
      const leftTime = left.expiry ? new Date(left.expiry).getTime() : Number.MAX_SAFE_INTEGER;
      const rightTime = right.expiry ? new Date(right.expiry).getTime() : Number.MAX_SAFE_INTEGER;
      return leftTime - rightTime;
    })
    .slice(0, 5);

  return (
    // CHANGED: tighter vertical spacing on mobile
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Overview"
        title="Workspace overview"
        // CHANGED: description hidden on mobile — saves vertical space
        description={
          <span className="hidden sm:inline">
            Your link library at a glance, with the most recent changes and anything that needs attention.
          </span>
        }
        // CHANGED: actions wrapped so they don't overflow on small screens
        actions={(
          <div className="flex flex-wrap gap-2">
            <Link to="/dashboard/links">
              <Button type="button" variant="subtle">Open links</Button>
            </Link>
          </div>
        )}
      />

      {/*
        CHANGED: stat grid
        - mobile:  2 columns (2×2 grid)
        - xl+:     4 columns (original)
        was: md:grid-cols-2 xl:grid-cols-4  (single col on mobile)
      */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 xl:gap-6">
        <StatCard eyebrow="Total links" value={formatCount(links.length)} helper="Everything currently saved in your workspace." icon={Link2} />
        <StatCard eyebrow="Total clicks" value={formatCount(totalClicks)} helper="All redirect events recorded so far." icon={MousePointerClick} />
        <StatCard eyebrow="Active links" value={formatCount(activeLinks)} helper="Links available to visitors right now." icon={Activity} />
        <StatCard eyebrow="Needs review" value={formatCount(inactiveLinks)} helper="Inactive or expired links worth checking." icon={TimerReset} />
      </div>

      {/*
        CHANGED: quick actions + recent links
        - mobile/tablet: stacked (single col)
        - xl+: side-by-side (original proportions)
      */}
      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Jump straight to the main workflows.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:gap-3">
            <Link to="/dashboard/links">
              <Button type="button" variant="subtle" className="w-full justify-between" icon={Link2}>
                Manage links
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent links</CardTitle>
            <CardDescription>The latest short links added to the workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:gap-3">
              {recentLinks.map((link) => {
                const statusMeta = getStatusMeta(deriveLinkStatus(link));
                return (
                  /*
                    CHANGED: mobile layout — two fixed rows, no column grid on mobile.
                    Row A: code + status badge + "Open" button (all inline, no wrap)
                    Row B: truncated long url
                    Desktop (lg+): original 3-column grid layout
                  */
                  <div
                    key={link.code}
                    className="rounded-2xl border border-white/5 glass-card"
                  >
                    {/* Mobile layout */}
                    <div className="flex flex-col gap-1 p-3 lg:hidden">
                      {/* Row A: code + badge + open button */}
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="shrink-0 font-mono text-sm font-semibold text-ink">/{link.code}</p>
                        <span className={`shrink-0 inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                        <span className="flex-1" />
                        <span className="shrink-0 text-xs text-secondary">{formatRelativeDate(link.createdAt)}</span>
                        <Link to={`/dashboard/links/${link.code}`} className="shrink-0">
                          <Button type="button" variant="ghost" size="sm">Open</Button>
                        </Link>
                      </div>
                      {/* Row B: destination url, strictly one line */}
                      <p className="truncate text-xs text-secondary">{truncateMiddle(link.longUrl, 52, 18)}</p>
                    </div>

                    {/* Desktop layout (lg+): original */}
                    <div className="hidden p-4 lg:grid lg:grid-cols-[minmax(0,1fr)_140px_160px] lg:items-center lg:gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-semibold text-ink">/{link.code}</p>
                        <p className="mt-2 truncate text-sm text-secondary">{truncateMiddle(link.longUrl, 46, 18)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-secondary lg:justify-center">
                        <span className={`inline-flex items-center rounded-md border px-2 py-1 font-semibold uppercase tracking-[0.14em] ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 lg:justify-end">
                        <span className="text-xs text-secondary">{formatRelativeDate(link.createdAt)}</span>
                        <Link to={`/dashboard/links/${link.code}`}>
                          <Button type="button" variant="ghost" size="sm">Open</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Needs attention</CardTitle>
          <CardDescription>Inactive, expired, or scheduled links that may need a quick look.</CardDescription>
        </CardHeader>
        <CardContent>
          {attentionLinks.length ? (
            <div className="grid gap-2 sm:gap-3">
              {attentionLinks.map((link) => {
                const statusMeta = getStatusMeta(deriveLinkStatus(link));
                return (
                  /*
                    CHANGED: same mobile-first two-row pattern.
                    Row A: title/code + status badge + date + "Review" button
                    Row B: short url + expiry (if set)
                    Desktop (lg+): original 3-column grid
                  */
                  <div
                    key={link.code}
                    className="rounded-2xl border border-white/5 glass-card"
                  >
                    {/* Mobile layout */}
                    <div className="flex flex-col gap-1 p-3 lg:hidden">
                      {/* Row A */}
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="shrink-0 text-sm font-medium text-ink">{link.title || link.code}</p>
                        <span className={`shrink-0 inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                        <span className="flex-1" />
                        <Link to={`/dashboard/links/${link.code}`} className="shrink-0">
                          <Button type="button" variant="ghost" size="sm">Review</Button>
                        </Link>
                      </div>
                      {/* Row B: short url + expiry */}
                      <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                        <p className="truncate text-xs text-secondary">{truncateMiddle(link.shortUrl, 34, 10)}</p>
                        {link.expiry && (
                          <span className="ml-auto shrink-0 text-xs text-secondary">
                            {formatDateTime(link.expiry)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Desktop layout (lg+): original */}
                    <div className="hidden p-4 lg:grid lg:grid-cols-[minmax(0,1fr)_180px_170px] lg:items-center lg:gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">{link.title || link.code}</p>
                        <p className="mt-2 truncate text-sm text-secondary">{truncateMiddle(link.shortUrl, 34, 10)}</p>
                      </div>
                      <div className="text-sm text-secondary lg:text-center">
                        {link.expiry ? formatDateTime(link.expiry) : "No expiry"}
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 lg:justify-end">
                        <span className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                        <Link to={`/dashboard/links/${link.code}`}>
                          <Button type="button" variant="ghost" size="sm">Review</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-line bg-panelAlt p-3 text-sm text-secondary sm:p-4">
              Nothing looks urgent right now.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
