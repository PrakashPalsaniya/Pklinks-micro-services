import {
  Activity,
  Check,
  Clock3,
  Link2,
  PencilLine,
  Plus,
  X
} from "lucide-react";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { CopyButton } from "../../components/CopyButton";
import { PaginationControls } from "../../components/PaginationControls";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { OverflowMenu } from "../../components/ui/OverflowMenu";
import { PageHeader } from "../../components/ui/PageHeader";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatCard } from "../../components/ui/StatCard";
import { useDeactivateLinkMutation, useLinksQuery } from "../../hooks/useLinks";
import { cn } from "../../utils/cn";
import {
  formatCount,
  formatRelativeDate,
  getFaviconUrl,
  getUrlHostname,
  getUrlMonogram,
  truncateMiddle
} from "../../utils/format";
import { deriveLinkStatus, getStatusMeta, paginate } from "../../utils/status";

const CreateLinkModal = lazy(() => import("./CreateLinkModal").then((module) => ({ default: module.CreateLinkModal })));
const EditLinkModal = lazy(() => import("./EditLinkModal").then((module) => ({ default: module.EditLinkModal })));

const PAGE_SIZE = 10;

function StatusBadge({ link }) {
  const meta = getStatusMeta(deriveLinkStatus(link));
  return <Badge className={meta.className}>{meta.label}</Badge>;
}

function DestinationFavicon({ url, label }) {
  const [failed, setFailed] = useState(false);
  const faviconUrl = getFaviconUrl(url);
  const monogram = getUrlMonogram(url);

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-borderSubtle bg-elevated text-sm font-semibold text-accent sm:h-10 sm:w-10">
      {faviconUrl && !failed ? (
        <img
          src={faviconUrl}
          alt={`${label} favicon`}
          className="h-4 w-4 rounded-sm object-cover sm:h-5 sm:w-5"
          onError={() => setFailed(true)}
        />
      ) : (
        monogram
      )}
    </div>
  );
}

function SelectionToggle({ selected, onChange, label }) {
  return (
    <label className="mt-0.5 inline-flex shrink-0 cursor-pointer items-center" aria-label={label}>
      <input type="checkbox" className="sr-only" checked={selected} onChange={onChange} />
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-sm border transition sm:h-5 sm:w-5",
          selected ? "border-accent bg-accent text-inverse" : "border-borderDefault bg-base text-transparent hover:border-borderStrong"
        )}
      >
        <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      </span>
    </label>
  );
}

function LinkCard({
  link,
  selected,
  onToggleSelect,
  onEdit,
  onOpenAnalytics,
  onOpenDetail
}) {
  const hostname = getUrlHostname(link.longUrl);

  const overflowActions = [
    { label: "Open detail", icon: Link2, onClick: () => onOpenDetail(link) },
    { label: "Analytics", icon: Activity, onClick: () => onOpenAnalytics(link) },
    { label: "Edit link", icon: PencilLine, onClick: () => onEdit(link) }
  ];

  return (
    <Card className="transition hover:border-borderDefault hover:bg-elevated">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col gap-2.5 sm:hidden">
          {/* Header Row */}
          <div className="flex items-center gap-2">
            <SelectionToggle
              selected={selected}
              onChange={() => onToggleSelect(link.code)}
              label={`Select ${link.title || link.code}`}
            />
            <DestinationFavicon url={link.longUrl} label={link.title || link.code} />
            <Link
              to={`/dashboard/links/${link.code}`}
              className="font-mono text-sm font-semibold text-ink truncate"
            >
              /{link.code}
            </Link>
            <StatusBadge link={link} />
            <span className="flex-1" />
            <OverflowMenu actions={overflowActions} />
          </div>

          {/* Details & Copy Row */}
          <div className="flex items-center justify-between gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-2.5">
            <div className="min-w-0 flex-1">
              <a
                href={link.shortUrl}
                target="_blank"
                rel="noreferrer"
                className="block truncate font-mono text-xs text-ink transition hover:text-ink/80"
              >
                {link.shortUrl}
              </a>
              {hostname && (
                <span className="block mt-1 text-[10px] text-muted truncate">
                  {hostname} · {formatRelativeDate(link.createdAt)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5 shrink-0 pl-2.5 border-l border-white/5">
              <div className="text-right mr-1">
                <p className="text-[8px] uppercase tracking-wider text-muted">Clicks</p>
                <p className="text-xs font-bold text-ink">{formatCount(link.clickCount || 0)}</p>
              </div>
              <CopyButton value={link.shortUrl} variant="ghost" iconOnly className="h-7 w-7" />
            </div>
          </div>
        </div>

        <div className="hidden sm:flex sm:items-start sm:gap-3">
          <SelectionToggle
            selected={selected}
            onChange={() => onToggleSelect(link.code)}
            label={`Select ${link.title || link.code}`}
          />
          <DestinationFavicon url={link.longUrl} label={link.title || link.code} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-x-2 overflow-hidden">
                  <StatusBadge link={link} />
                  <Link
                    to={`/dashboard/links/${link.code}`}
                    className="shrink-0 font-mono text-sm font-semibold text-ink transition hover:text-ink/80"
                  >
                    /{link.code}
                  </Link>
                  <p className="min-w-0 truncate text-sm text-secondary" title={link.longUrl}>
                    {truncateMiddle(link.longUrl, 48, 16)}
                  </p>
                  <span className="ml-auto hidden shrink-0 text-xs text-secondary xl:inline">
                    {formatRelativeDate(link.createdAt)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-x-2 overflow-hidden text-xs text-secondary">
                  <a
                    href={link.shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 font-mono text-ink transition hover:text-ink/80"
                  >
                    {truncateMiddle(link.shortUrl, 26, 10)}
                  </a>
                  {hostname && <span className="shrink-0">· {hostname}</span>}
                  <span className="xl:hidden">{formatRelativeDate(link.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 xl:justify-end xl:pl-4">
                <div className="min-w-[80px] rounded-lg border border-borderSubtle bg-elevated px-2.5 py-1.5 text-right xl:min-w-[88px]">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Clicks</p>
                  <p className="mt-1 text-lg font-semibold text-ink xl:text-xl">{formatCount(link.clickCount || 0)}</p>
                </div>
                <CopyButton value={link.shortUrl} variant="icon" iconOnly className="h-9 w-9 px-0" />
                <OverflowMenu actions={overflowActions} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LinksPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [pendingDeactivateLinks, setPendingDeactivateLinks] = useState([]);
  const [selectedCodes, setSelectedCodes] = useState(() => new Set());
  const { data: links = [], isLoading, error } = useLinksQuery();
  const deactivateMutation = useDeactivateLinkMutation();

  useEffect(() => {
    setSelectedCodes((current) => {
      const liveCodes = new Set(links.map((link) => link.code));
      const next = new Set([...current].filter((code) => liveCodes.has(code)));
      return next.size === current.size ? current : next;
    });
  }, [links]);

  const filteredLinks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return links;
    return links.filter((link) =>
      [link.title, link.code, link.longUrl].some((value) => value?.toLowerCase().includes(query))
    );
  }, [links, search]);

  const summary = useMemo(() => {
    const totalClicks = links.reduce((sum, link) => sum + (link.clickCount || 0), 0);
    const activeLinks = links.filter((link) => deriveLinkStatus(link) === "active").length;
    return {
      totalClicks,
      activeLinks,
      inactiveLinks: Math.max(links.length - activeLinks, 0)
    };
  }, [links]);

  const totalPages = Math.max(1, Math.ceil(filteredLinks.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleLinks = paginate(filteredLinks, currentPage, PAGE_SIZE);
  const selectedLinks = useMemo(
    () => links.filter((link) => selectedCodes.has(link.code)),
    [links, selectedCodes]
  );
  const activeSelectedLinks = useMemo(
    () => selectedLinks.filter((link) => deriveLinkStatus(link) === "active"),
    [selectedLinks]
  );
  const allVisibleSelected =
    visibleLinks.length > 0 && visibleLinks.every((link) => selectedCodes.has(link.code));

  const openDeactivateDialog = (linksToDeactivate) => {
    const eligibleLinks = linksToDeactivate.filter((link) => link.isActive);
    if (!eligibleLinks.length) {
      toast.message("These links are already inactive.");
      return;
    }
    setPendingDeactivateLinks(eligibleLinks);
  };

  const handleDeactivate = async () => {
    if (!pendingDeactivateLinks.length) return;
    try {
      for (const link of pendingDeactivateLinks) {
        await deactivateMutation.mutateAsync(link.code);
      }
      toast.success(
        pendingDeactivateLinks.length === 1
          ? "Link deactivated."
          : `${pendingDeactivateLinks.length} links deactivated.`
      );
      setSelectedCodes((current) => {
        const next = new Set(current);
        pendingDeactivateLinks.forEach((link) => next.delete(link.code));
        return next;
      });
      setPendingDeactivateLinks([]);
    } catch (_error) {
      toast.error("We couldn't update every selected link right now.");
    }
  };

  const updateSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const toggleSelect = (code) => {
    setSelectedCodes((current) => {
      const next = new Set(current);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const toggleVisibleSelection = () => {
    setSelectedCodes((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        visibleLinks.forEach((link) => next.delete(link.code));
      } else {
        visibleLinks.forEach((link) => next.add(link.code));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedCodes(new Set());

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="My Links"
        title="Link library"
        description={(
          <span className="hidden sm:inline">
            Search, sort mentally at a glance, and keep every short code within quick reach.
          </span>
        )}
        actions={(
          <Button
            type="button"
            icon={Plus}
            className="font-display uppercase tracking-[0.08em]"
            onClick={() => setCreateOpen(true)}
          >
            Create link
          </Button>
        )}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        <StatCard
          eyebrow="Visible links"
          value={formatCount(filteredLinks.length)}
          helper={`${formatCount(links.length)} total saved links`}
          icon={Link2}
        />
        <StatCard
          eyebrow="Total clicks"
          value={formatCount(summary.totalClicks)}
          helper="Combined redirect volume across the library."
          icon={Activity}
        />
        <div className="col-span-2 xl:col-span-1">
          <StatCard
            eyebrow="Active links"
            value={formatCount(summary.activeLinks)}
            helper={`${formatCount(summary.inactiveLinks)} inactive or expired right now.`}
            icon={Clock3}
          />
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-3 sm:gap-4 sm:p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative min-w-0 flex-1">
              <Input
                className="w-full pl-10 sm:pl-14"
                placeholder="Search links"
                value={search}
                onChange={(event) => updateSearch(event.target.value)}
              />
            </div>
            <span className="hidden whitespace-nowrap text-sm text-secondary sm:inline">
              {formatCount(filteredLinks.length)} matches
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0"
              onClick={toggleVisibleSelection}
            >
              {allVisibleSelected ? "Clear page" : "Select page"}
            </Button>
          </div>

          <p className="text-xs text-secondary sm:hidden">
            {formatCount(filteredLinks.length)} matches
          </p>

          {selectedCodes.size ? (
            <div className="flex flex-col gap-3 rounded-lg border border-accent/20 bg-accentDim p-3 sm:gap-4 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium text-accentText">
                  {formatCount(selectedCodes.size)} links selected
                </p>
                <p className="mt-1 text-xs text-secondary">
                  {formatCount(activeSelectedLinks.length)} can be deactivated right now.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={!activeSelectedLinks.length}
                  onClick={() => openDeactivateDialog(activeSelectedLinks)}
                >
                  Bulk deactivate
                </Button>
                <Button type="button" variant="ghost" size="sm" icon={X} onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 sm:h-28" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={Link2}
          title="Links could not be loaded"
          description="Please refresh the page and try again."
          action={(
            <Button type="button" onClick={() => window.location.reload()}>
              Refresh view
            </Button>
          )}
        />
      ) : filteredLinks.length === 0 ? (
        <EmptyState
          icon={Link2}
          title={links.length ? "No results found" : "Your link library is empty"}
          description={
            links.length
              ? "Try a different keyword, clear your search, or create a new link."
              : "Create your first short link to start tracking traffic."
          }
          action={(
            <div className="flex flex-col gap-3 sm:flex-row">
              {links.length ? (
                <Button type="button" variant="ghost" onClick={() => updateSearch("")}>
                  Clear search
                </Button>
              ) : null}
              <Button type="button" icon={Plus} onClick={() => setCreateOpen(true)}>
                {links.length ? "Create link" : "Create your first link"}
              </Button>
            </div>
          )}
        />
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {visibleLinks.map((link) => (
            <LinkCard
              key={link.code}
              link={link}
              selected={selectedCodes.has(link.code)}
              onToggleSelect={toggleSelect}
              onEdit={setEditingLink}
              onOpenDetail={(item) => navigate(`/dashboard/links/${item.code}`)}
              onOpenAnalytics={(item) => navigate(`/dashboard/links/${item.code}/analytics`)}
            />
          ))}

          <PaginationControls
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
            label="links"
          />
        </div>
      )}

      <Suspense fallback={null}>
        {createOpen ? (
          <CreateLinkModal open={createOpen} onClose={() => setCreateOpen(false)} />
        ) : null}
        {editingLink ? (
          <EditLinkModal
            open={Boolean(editingLink)}
            onClose={() => setEditingLink(null)}
            link={editingLink}
          />
        ) : null}
      </Suspense>

      <ConfirmDialog
        open={Boolean(pendingDeactivateLinks.length)}
        onClose={() => setPendingDeactivateLinks([])}
        onConfirm={handleDeactivate}
        loading={deactivateMutation.isPending}
        title={
          pendingDeactivateLinks.length > 1
            ? `Deactivate ${pendingDeactivateLinks.length} links?`
            : "Deactivate this link?"
        }
        description={
          pendingDeactivateLinks.length > 1
            ? "Deactivating these links will stop their redirects until you enable them again."
            : "Deactivating this link will stop redirects until you enable it again."
        }
        confirmLabel={
          pendingDeactivateLinks.length > 1 ? "Deactivate selected" : "Deactivate link"
        }
      />
    </div>
  );
}
