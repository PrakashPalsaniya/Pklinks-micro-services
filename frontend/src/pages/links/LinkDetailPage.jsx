import {
  Activity,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Clock3,
  Copy,
  PencilLine,
  Power
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";
import { Skeleton } from "../../components/ui/Skeleton";
import { useClipboard } from "../../hooks/useClipboard";
import { useDeactivateLinkMutation, useLinkQuery, useUpdateLinkMutation } from "../../hooks/useLinks";
import {
  formatCount,
  formatDateTime,
  formatRelativeDate,
  getFaviconUrl,
  getUrlDisplayName,
  getUrlHostname,
  getUrlMonogram,
  truncateMiddle
} from "../../utils/format";
import { deriveLinkStatus, getStatusMeta } from "../../utils/status";
import { EditLinkModal } from "./EditLinkModal";

function DestinationAvatar({ url, label }) {
  const [imageFailed, setImageFailed] = useState(false);
  const faviconUrl = getFaviconUrl(url);
  const monogram = getUrlMonogram(url);

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-borderSubtle bg-elevated text-xl font-semibold text-accent">
      {faviconUrl && !imageFailed ? (
        <img
          src={faviconUrl}
          alt={`${label} favicon`}
          className="h-8 w-8 rounded-sm object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        monogram
      )}
    </div>
  );
}

function InfoStat({ eyebrow, value, helper, icon: Icon, tone = "default" }) {
  return (
    <div className="rounded-lg border border-borderSubtle bg-elevated p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-secondary">{eyebrow}</p>
          <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
          <p className={`mt-3 text-xs leading-6 ${tone === "warning" ? "text-warningText" : "text-secondary"}`}>{helper}</p>
        </div>
        {Icon ? (
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${tone === "warning" ? "border-warning/20 bg-warningDim text-warningText" : "border-borderSubtle bg-base text-muted"}`}>
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function LinkDetailPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { copy } = useClipboard();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data: link, isLoading, error } = useLinkQuery(code);
  const deactivateMutation = useDeactivateLinkMutation();
  const updateLinkMutation = useUpdateLinkMutation();

  if (isLoading) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (error || !link) {
    return (
      <EmptyState
        title="Link not found"
        description="This link is unavailable right now."
        action={<Button type="button" onClick={() => navigate("/dashboard/links")}>Back to links</Button>}
      />
    );
  }

  const status = deriveLinkStatus(link);
  const statusMeta = getStatusMeta(status);
  const hostname = getUrlHostname(link.longUrl);
  const displayTitle = link.title || getUrlDisplayName(link.longUrl) || hostname || link.code;
  const isPastExpiry = Boolean(link.expiry) && new Date(link.expiry).getTime() < Date.now();
  const bannerTone = status === "expired"
    ? "border-warning/20 bg-warningDim text-warningText"
    : "border-borderSubtle bg-elevated text-secondary";
  const bannerTitle = status === "expired" ? "This link has expired" : status === "inactive" ? "This link is inactive" : "This link is active";
  const bannerDescription = status === "expired"
    ? "Extend the expiry date to make redirects work again."
    : status === "inactive"
      ? "Reactivate it to start sending visitors again."
      : "";
  const expiryValue = !link.expiry
    ? "No expiry"
    : isPastExpiry
      ? `Expired ${formatRelativeDate(link.expiry)}`
      : formatRelativeDate(link.expiry);
  const expiryHelper = !link.expiry ? "No end date set." : formatDateTime(link.expiry);

  const handleDeactivate = async () => {
    try {
      await deactivateMutation.mutateAsync(link.code);
      toast.success("Link deactivated.");
      setConfirmOpen(false);
    } catch (_error) {
      toast.error("We couldn't update this link right now.");
    }
  };

  const primaryActionLabel = status === "active" ? "copy" : status === "expired" ? "expiry" : "reactivate";

  const handlePrimaryAction = async () => {
    if (primaryActionLabel === "copy") {
      await copy(link.shortUrl, "Short URL copied.");
      return;
    }

    if (primaryActionLabel === "expiry") {
      setEditOpen(true);
      return;
    }

    try {
      await updateLinkMutation.mutateAsync({
        code: link.code,
        payload: {
          title: link.title || "",
          expiry: link.expiry || null,
          isActive: true
        }
      });
      toast.success("Link reactivated.");
    } catch (_error) {
      toast.error("We couldn't reactivate this link right now.");
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Link Detail"
        title={displayTitle}
        description={<span className="hidden sm:inline">Status, destination, and activity shortcuts for this short link.</span>}
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)}>
              Back to links
            </Button>
            <Button type="button" variant="subtle" size="sm" icon={BarChart3} onClick={() => navigate(`/dashboard/links/${link.code}/analytics`)}>
              Analytics
            </Button>
          </div>
        )}
      />

      <Card>
        <CardContent className="p-4 sm:p-6">
          {status !== "active" ? (
            <div className={`mb-6 rounded-lg border px-4 py-3 ${bannerTone}`}>
              <p className="text-sm font-medium">{bannerTitle}</p>
              <p className="mt-2 text-xs leading-6">{bannerDescription}</p>
            </div>
          ) : null}

          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 gap-4">
              <DestinationAvatar url={link.longUrl} label={displayTitle} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-secondary">{hostname || "Destination"}</span>
                </div>
                <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <a
                    href={link.shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-base font-semibold text-accent hover:text-accentHover break-all"
                  >
                    {link.shortUrl}
                  </a>
                  <Button
                    type="button"
                    size="sm"
                    icon={primaryActionLabel === "copy" ? Copy : primaryActionLabel === "expiry" ? PencilLine : Power}
                    className="font-display uppercase tracking-[0.08em] shrink-0"
                    loading={primaryActionLabel === "reactivate" && updateLinkMutation.isPending}
                    onClick={handlePrimaryAction}
                  >
                    {primaryActionLabel === "copy" ? "Copy link" : primaryActionLabel === "expiry" ? "Extend expiry" : "Reactivate"}
                  </Button>
                </div>
                <p className="mt-4 break-all text-sm leading-6 text-secondary">{link.longUrl}</p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:w-[360px] xl:grid-cols-2">
              <Button
                type="button"
                variant="subtle"
                size="sm"
                icon={BarChart3}
                className="justify-center sm:hidden"
                onClick={() => navigate(`/dashboard/links/${link.code}/analytics`)}
              >
                Analytics
              </Button>
              <Button type="button" variant="subtle" size="sm" icon={PencilLine} className="justify-center" onClick={() => setEditOpen(true)}>
                Edit
              </Button>
              {link.isActive ? (
                <Button type="button" variant="danger" size="sm" icon={Power} className="justify-center" onClick={() => setConfirmOpen(true)}>
                  Deactivate
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
            <InfoStat eyebrow="Total clicks" value={formatCount(link.clickCount)} helper="Redirects recorded for this short link." icon={Activity} />
            <InfoStat eyebrow="Created" value={formatRelativeDate(link.createdAt)} helper={formatDateTime(link.createdAt)} icon={CalendarDays} />
            <div className="col-span-2 xl:col-span-1">
              <InfoStat eyebrow="Expiry" value={expiryValue} helper={expiryHelper} icon={Clock3} tone={isPastExpiry ? "warning" : "default"} />
            </div>
          </div>
        </CardContent>
      </Card>

      <EditLinkModal open={editOpen} onClose={() => setEditOpen(false)} link={link} />
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeactivate}
        loading={deactivateMutation.isPending}
        title="Deactivate this link?"
        description="Redirects will stop immediately, but you can still view this link later."
        confirmLabel="Deactivate link"
      />
    </div>
  );
}
