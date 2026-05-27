import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { chartAxisStyle, chartCursor, chartGridStroke, chartTooltipStyle, getChartColor } from "../../utils/chartTheme";
import { formatCount } from "../../utils/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/Card";

const getBreakdownRows = (items) => (items || []).filter((item) => (item.count || 0) > 0);

const truncateLabel = (value, limit = 16) => {
  if (!value || value.length <= limit) {
    return value || "-";
  }

  return `${value.slice(0, limit - 3)}...`;
};

export function BreakdownBarCard({ title, description, items, emptyMessage = "This section will fill in as visits arrive." }) {
  const rows = getBreakdownRows(items).map((item) => ({
    ...item,
    shortLabel: truncateLabel(item.label, 18)
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <div className="h-[260px] w-full overflow-x-auto sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={chartGridStroke} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={chartAxisStyle} />
                <YAxis type="category" dataKey="shortLabel" width={110} tickLine={false} axisLine={false} tick={chartAxisStyle} />
                <Tooltip
                  cursor={chartCursor}
                  contentStyle={chartTooltipStyle}
                  labelFormatter={(_label, payload) => payload?.[0]?.payload?.label || ""}
                  formatter={(value) => [formatCount(value), "Clicks"]}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {rows.map((item, index) => (
                    <Cell key={item.label} fill={getChartColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-lg border border-borderSubtle bg-elevated p-4 text-sm text-secondary">
            {emptyMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DeviceBreakdownCard({ items, description = "Which devices are driving visits.", emptyMessage = "Device details will appear as visits arrive." }) {
  const rows = getBreakdownRows(items);
  const total = rows.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Devices</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="h-[240px] w-full sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [formatCount(value), "Clicks"]} />
                  <Pie data={rows} dataKey="count" nameKey="label" innerRadius={60} outerRadius={90} paddingAngle={3} stroke="none">
                    {rows.map((item, index) => (
                      <Cell key={item.label} fill={getChartColor(index)} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {rows.map((item, index) => {
                const percent = total ? Math.round((item.count / total) * 100) : 0;
                return (
                  <div key={item.label} className="rounded-lg border border-borderSubtle bg-elevated px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: getChartColor(index) }} />
                        <span className="truncate text-sm font-medium text-ink">{item.label}</span>
                      </div>
                      <span className="text-sm text-secondary">{percent}%</span>
                    </div>
                    <p className="mt-2 text-sm text-secondary">{formatCount(item.count)} clicks</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-borderSubtle bg-elevated p-4 text-sm text-secondary">
            {emptyMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CountryBreakdownCard({ items, emptyMessage = "Country details will appear as visits arrive." }) {
  const rows = getBreakdownRows(items);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Countries</CardTitle>
        <CardDescription>Where your visits are coming from.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <div className="space-y-3">
            {rows.map((item, index) => (
              <div key={item.label} className="rounded-lg border border-borderSubtle bg-elevated px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: getChartColor(index) }} />
                    <span className="truncate text-sm font-medium text-ink">{item.label}</span>
                  </div>
                  <span className="text-sm text-secondary">{formatCount(item.count)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-borderSubtle bg-elevated p-4 text-sm text-secondary">
            {emptyMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

