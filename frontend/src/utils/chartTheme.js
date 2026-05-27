export const CHART_SCALE = [
  "#27d980",
  "#5bb6ff",
  "#ffb84d",
  "#ff6b6b",
  "#9b8bff",
  "#35e0c5",
  "#f472b6",
  "#94a3b8"
];

const GOLDEN_ANGLE = 137.508;

export const getChartColor = (index) => {
  if (Number.isFinite(index) && index >= 0 && index < CHART_SCALE.length) {
    return CHART_SCALE[index];
  }

  const safeIndex = Number.isFinite(index) && index >= 0 ? index : 0;
  const hue = (safeIndex * GOLDEN_ANGLE) % 360;
  return `hsl(${hue} 70% 58%)`;
};

export const chartTooltipStyle = {
  borderRadius: "10px",
  border: "1px solid var(--chart-tooltip-border)",
  backgroundColor: "var(--chart-tooltip-bg)",
  color: "var(--chart-tooltip-text)",
  boxShadow: "none"
};

export const chartAxisStyle = {
  fill: "var(--chart-axis)",
  fontSize: 11,
  fontFamily: '"JetBrains Mono", Consolas, monospace'
};

export const chartGridStroke = "var(--chart-grid)";

export const chartCursor = {
  fill: "rgba(39, 217, 128, 0.08)"
};
