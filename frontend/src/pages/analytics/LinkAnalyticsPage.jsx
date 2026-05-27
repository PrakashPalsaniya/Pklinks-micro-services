import {
  ArrowLeft,
  Clock3,
  Globe2,
  MousePointerClick,
  Share2
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { BreakdownBarCard, CountryBreakdownCard, DeviceBreakdownCard } from "../../components/analytics/BreakdownCards";

import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatCard } from "../../components/ui/StatCard";
import { useLinkAnalyticsQuery } from "../../hooks/useAnalytics";
import { chartAxisStyle, chartGridStroke, chartTooltipStyle } from "../../utils/chartTheme";
import { formatCount, formatDateTime, formatRelativeDate, formatShortDate, truncateMiddle } from "../../utils/format";


export function LinkAnalyticsPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useLinkAnalyticsQuery(code);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:gap-6">
        <Skeleton className="h-24 sm:h-28" />
        <Skeleton className="h-64 sm:h-80" />
        <Skeleton className="h-64 sm:h-80" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        title="Analytics are unavailable"
        description="We couldn't load analytics for this link right now."
        action={<Button type="button" onClick={() => navigate("/dashboard/links")}>Back to links</Button>}
      />
    );
  }


  const topCountry = data.countries?.[0]?.label || "No data";
  const topReferrer = data.referrers?.[0]?.label || "No data";
  const chartRows = data.chartData.map((item) => ({
    ...item,
    label: formatShortDate(item.date)
  }));

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Analytics"
        title={data.link.title || data.link.code}
        description={<span className="hidden sm:inline">Track clicks, countries, devices, and discovery sources for this short link.</span>}
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" icon={ArrowLeft} onClick={() => navigate(-1)}>Back</Button>
            <Link to={`/dashboard/links/${data.link.code}`}>
              <Button type="button" variant="subtle">Link detail</Button>
            </Link>
          </div>
        )}
      />


      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 xl:gap-6">
        <StatCard eyebrow="Total clicks" value={formatCount(data.overview.totalClicks)} helper="All clicks recorded for this link." icon={MousePointerClick} />
        <StatCard eyebrow="Top country" value={topCountry} helper="The strongest location for this link right now." icon={Globe2} />
        <StatCard eyebrow="Top referrer" value={topReferrer} helper="The source sending the most visits." icon={Share2} />
        <StatCard eyebrow="Last click" value={formatRelativeDate(data.overview.lastClickedAt)} helper={formatDateTime(data.overview.lastClickedAt)} icon={Clock3} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clicks over time</CardTitle>
          <CardDescription>Daily click activity for the last 30 days.</CardDescription>
        </CardHeader>
        <CardContent>
          {chartRows.length ? (
            <div className="h-[340px] w-full overflow-x-auto">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartRows}>
                  <CartesianGrid stroke={chartGridStroke} vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={chartAxisStyle} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={chartAxisStyle} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [formatCount(value), "Clicks"]} />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#22c55e", stroke: "var(--chart-dot-stroke)", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-lg border border-borderSubtle bg-elevated p-4 text-sm text-secondary">
              No chart data yet. Once this link starts receiving clicks, daily totals will appear here.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <DeviceBreakdownCard items={data.devices} />
        <CountryBreakdownCard items={data.countries} />
      </div>

      <BreakdownBarCard title="Referrers" description="Which sources are sending people to this link." items={data.referrers} />
      <BreakdownBarCard title="Browsers" description="The browsers your visitors are using most." items={data.browsers} />

      <Card>
        <CardHeader>
          <CardTitle>Recent clicks</CardTitle>
          <CardDescription>The latest click activity for this link.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentClicks.length ? (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-elevated text-xs uppercase tracking-[0.14em] text-muted">
                    <tr>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Country</th>
                      <th className="px-4 py-3">Referrer</th>
                      <th className="px-4 py-3">Device</th>
                      <th className="px-4 py-3">Browser</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderSubtle">
                    {data.recentClicks.map((click) => (
                      <tr key={click.id} className="transition hover:bg-elevated">
                        <td className="px-4 py-4 text-secondary">{formatDateTime(click.occurredAt)}</td>
                        <td className="px-4 py-4 text-ink">{click.country || "Unknown"}</td>
                        <td className="px-4 py-4 text-secondary">{click.referrer}</td>
                        <td className="px-4 py-4 text-secondary">{click.deviceType}</td>
                        <td className="px-4 py-4 text-secondary">{click.browser}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid gap-3 lg:hidden">
                {data.recentClicks.map((click) => (
                  <div key={click.id} className="rounded-lg border border-borderSubtle bg-elevated p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-ink">{click.country || "Unknown"}</p>
                      <span className="text-xs text-secondary">{formatShortDate(click.occurredAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-secondary">{formatDateTime(click.occurredAt)}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-secondary">
                      <span>{truncateMiddle(click.referrer, 20, 8)}</span>
                      <span>{click.deviceType}</span>
                      <span>{click.browser}</span>
                     </div>
                   </div>
                 ))}
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-borderSubtle bg-elevated p-4 text-sm text-secondary">
              No click events yet. This list will populate after the first redirect.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

