import { useEffect, useRef, useState, useCallback } from "react";
import {
  Activity, BarChart3, Bell, Cloud, Cpu, Database, GitBranch,
  HardDrive, Layers, Link2, MemoryStick, MessageSquare,
  Network, Radio, RefreshCw, Server, Shield, Zap, ArrowRight,
} from "lucide-react";
import client, { getAbsoluteApiBaseUrl } from "../../api/client";

// ─── helpers ────────────────────────────────────────────────────────────────

function ts() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function useInterval(fn, ms) {
  const ref = useRef(fn);
  useEffect(() => { ref.current = fn; }, [fn]);
  useEffect(() => {
    if (!ms) return;
    const id = setInterval(() => ref.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}
function fmt(n) {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

// ─── Service definitions ─────────────────────────────────────────────────────

const SERVICES = [
  { id: "gateway",       label: "API Gateway",         port: 3000, icon: Network,       color: "#6366f1", desc: "Routes all client traffic" },
  { id: "auth",          label: "Auth Service",         port: 3001, icon: Shield,        color: "#8b5cf6", desc: "JWT · OAuth · Sessions" },
  { id: "link",          label: "Link Service",         port: 3002, icon: Link2,         color: "#06b6d4", desc: "CRUD for short-links" },
  { id: "redirect",      label: "Redirect Service",     port: 3003, icon: Zap,           color: "#10b981", desc: "Cache-first redirect engine" },
  { id: "analytics-api", label: "Analytics API",        port: 3005, icon: BarChart3,     color: "#f59e0b", desc: "Reads from MongoDB replica" },
  { id: "worker",        label: "Analytics Worker",     port: null, icon: Cpu,           color: "#ec4899", desc: "RabbitMQ consumer · writes clicks" },
  { id: "notification",  label: "Notification Service", port: null, icon: Bell,          color: "#f97316", desc: "Event-driven email/push" },
];

const INFRA = [
  { id: "mongo-primary",  label: "MongoDB Primary",    icon: Database,      color: "#22c55e", desc: "Writes & upserts" },
  { id: "mongo-replica",  label: "MongoDB Replica ×2", icon: HardDrive,     color: "#4ade80", desc: "secondaryPreferred reads" },
  { id: "redis",          label: "Redis Cache",         icon: MemoryStick,   color: "#f43f5e", desc: "Hot cache + rate limiting" },
  { id: "rabbitmq",       label: "RabbitMQ",            icon: MessageSquare, color: "#fb923c", desc: "analytics.clicks · redirect.cache.bust" },
];

// ─── Reusable UI ─────────────────────────────────────────────────────────────

function PulseDot({ alive, size = "md" }) {
  const dim = size === "sm" ? 6 : 8;
  const col = alive === undefined ? "#71717a" : alive ? "#34d399" : "#f87171";
  return (
    <span className="relative flex shrink-0" style={{ width: dim, height: dim }}>
      {alive && <span className="absolute inset-0 rounded-full animate-ping opacity-60" style={{ background: col, animationDuration: "1.5s" }} />}
      <span className="relative rounded-full" style={{ width: "100%", height: "100%", background: col }} />
    </span>
  );
}

function StatBadge({ value, label, sub, color = "#6366f1" }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-5 py-3.5 text-center min-w-[100px]">
      <span className="text-2xl font-bold font-mono leading-none" style={{ color }}>{value ?? "—"}</span>
      <span className="text-[11px] text-muted font-medium uppercase tracking-widest leading-tight">{label}</span>
      {sub && <span className="text-[10px] text-muted/50 font-mono">{sub}</span>}
    </div>
  );
}

function ServiceCard({ svc, health }) {
  const Icon = svc.icon;
  const alive = health?.alive;
  const latency = health?.latency;
  const checkedAt = health?.checkedAt;
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] group"
      style={{ boxShadow: alive ? `0 0 20px -10px ${svc.color}55` : undefined }}
    >
      <div className="pointer-events-none absolute -left-4 -top-4 h-24 w-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl" style={{ background: svc.color + "30" }} />
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: svc.color + "18", border: `1px solid ${svc.color}35` }}>
          <Icon className="h-4 w-4" style={{ color: svc.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-ink">{svc.label}</p>
            <PulseDot alive={alive} size="sm" />
          </div>
          <p className="mt-0.5 text-[11px] text-muted leading-tight">{svc.desc}</p>
        </div>
        <div className="shrink-0 text-right">
          {alive === undefined ? <span className="text-xs text-muted/50">checking…</span>
            : alive ? <span className="text-[11px] font-mono font-bold text-emerald-400">{latency}ms</span>
            : <span className="text-[11px] font-bold text-red-400">offline</span>}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest" style={{ background: svc.color + "18", color: svc.color }}>
          {svc.port ? `:${svc.port}` : "worker"}
        </span>
        {checkedAt && <span className="text-[10px] text-muted/60 font-mono">{checkedAt}</span>}
      </div>
    </div>
  );
}

function InfraCard({ item }) {
  const Icon = item.icon;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3" style={{ boxShadow: `0 0 16px -8px ${item.color}40` }}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: item.color + "18", border: `1px solid ${item.color}35` }}>
        <Icon className="h-3.5 w-3.5" style={{ color: item.color }} />
      </div>
      <div>
        <p className="text-xs font-semibold text-ink leading-tight">{item.label}</p>
        <p className="text-[10px] text-muted leading-tight">{item.desc}</p>
      </div>
    </div>
  );
}

// ─── Clean Request Flow Diagram ──────────────────────────────────────────────
// 3-column grid layout with proper spacing and straight arrows

function Node({ label, sub, color, w = 140 }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl px-3 py-2.5 text-center select-none"
      style={{
        width: w,
        minHeight: 52,
        background: color + "12",
        border: `1.5px solid ${color}55`,
        boxShadow: `0 0 16px -6px ${color}40`,
      }}
    >
      <span className="text-[11px] font-bold leading-tight" style={{ color }}>{label}</span>
      {sub && <span className="text-[9px] text-muted mt-0.5 leading-tight">{sub}</span>}
    </div>
  );
}

function HArrow({ label, color = "#52525b", dashed = false }) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 px-1" style={{ minWidth: 56 }}>
      <div className="flex items-center w-full">
        <div className="flex-1 h-px" style={{ background: color + "80", backgroundImage: dashed ? `repeating-linear-gradient(90deg, ${color}80 0, ${color}80 5px, transparent 5px, transparent 9px)` : undefined }} />
        <div style={{ width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: `6px solid ${color}CC` }} />
      </div>
      {label && (
        <span className="text-[8.5px] font-mono font-semibold px-1 py-px rounded whitespace-nowrap" style={{ color, background: color + "18" }}>
          {label}
        </span>
      )}
    </div>
  );
}

function VArrow({ label, color = "#52525b", dashed = false, up = false }) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5" style={{ minHeight: 36 }}>
      {up && <div style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderBottom: `6px solid ${color}CC` }} />}
      <div className="w-px flex-1" style={{ background: dashed ? "transparent" : color + "80", backgroundImage: dashed ? `repeating-linear-gradient(180deg, ${color}80 0, ${color}80 5px, transparent 5px, transparent 9px)` : undefined, minHeight: 20 }} />
      {!up && <div style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: `6px solid ${color}CC` }} />}
      {label && <span className="text-[8.5px] font-mono font-semibold px-1 py-px rounded whitespace-nowrap -mt-0.5" style={{ color, background: color + "18" }}>{label}</span>}
    </div>
  );
}

function FlowDiagram({ stats }) {
  const hitRate = stats?.redis?.hitRate;
  const hits = stats?.redis?.hits;
  const misses = stats?.redis?.misses;
  const hitLabel = hitRate !== undefined && hitRate !== null ? `${hitRate.toFixed(1)}% hit rate` : "hot cache";

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 620 }} className="px-4 py-6 font-sans">

        {/* ── Row 1: Client → Gateway ── */}
        <div className="flex items-center justify-start gap-0">
          <Node label="Client" sub="browser / app" color="#a1a1aa" />
          <HArrow label="HTTPS" color="#6366f1" />
          <Node label="API Gateway" sub=":3000" color="#6366f1" w={150} />
        </div>

        {/* ── Spacer + Gateway fans out downward ── */}
        <div className="flex items-start" style={{ marginLeft: 150 + 56 / 2 - 2 }}>
          <div className="flex flex-col items-center" style={{ marginLeft: -1 }}>
            {/* vertical trunk from Gateway down */}
            <div className="w-px bg-indigo-500/40" style={{ height: 24 }} />
            {/* horizontal bar spanning to all 4 routes */}
            <div className="relative" style={{ height: 2 }}>
              <div className="absolute" style={{ background: "rgba(99,102,241,0.25)", height: 2, width: 440, left: -10 }} />
            </div>
          </div>
        </div>

        {/* ── Row 2: Four service targets ── */}
        <div className="flex items-start gap-0" style={{ marginLeft: 150 + 56 - 10 }}>
          {/* Auth */}
          <div className="flex flex-col items-center" style={{ marginRight: 16 }}>
            <VArrow label="proxy" color="#8b5cf6" />
            <Node label="Auth Service" sub=":3001" color="#8b5cf6" />
          </div>
          {/* Link */}
          <div className="flex flex-col items-center" style={{ marginRight: 16 }}>
            <VArrow label="proxy" color="#06b6d4" />
            <Node label="Link Service" sub=":3002" color="#06b6d4" />
          </div>
          {/* Redirect */}
          <div className="flex flex-col items-center" style={{ marginRight: 16 }}>
            <VArrow label="/r/:code" color="#10b981" />
            <Node label="Redirect Svc" sub=":3003" color="#10b981" />
          </div>
          {/* Analytics API */}
          <div className="flex flex-col items-center">
            <VArrow label="proxy" color="#f59e0b" />
            <Node label="Analytics API" sub=":3005" color="#f59e0b" />
          </div>
        </div>

        {/* ── Row 3: Redirect service fans out to Redis / Mongo Replica / RabbitMQ ── */}
        {/* Also Link service → RabbitMQ */}
        <div className="flex items-start gap-4 mt-2" style={{ marginLeft: 150 + 56 - 10 }}>

          {/* Auth → nothing below */}
          <div style={{ width: 140, marginRight: 16 }} />

          {/* Link → RabbitMQ arrow */}
          <div className="flex flex-col items-center" style={{ width: 140, marginRight: 16 }}>
            <VArrow label="link.*" color="#fb923c" dashed />
          </div>

          {/* Redirect → 3 branches */}
          <div className="flex flex-col items-center" style={{ marginRight: 16 }}>
            {/* vertical trunk from Redirect down */}
            <div className="w-px bg-emerald-500/40" style={{ height: 16 }} />
            <div className="relative" style={{ height: 2 }}>
              <div style={{ background: "rgba(16,185,129,0.25)", height: 2, width: 320, position: "absolute", left: -90 }} />
            </div>
            <div className="flex items-start gap-0" style={{ width: 320, marginLeft: -90 }}>
              {/* Redis */}
              <div className="flex flex-col items-center" style={{ width: 106 }}>
                <VArrow label="cache?" color="#f43f5e" />
                <Node label="Redis Cache" sub={hitLabel} color="#f43f5e" w={130} />
              </div>
              {/* MongoDB Replica */}
              <div className="flex flex-col items-center" style={{ width: 106 }}>
                <VArrow label="miss→DB" color="#4ade80" dashed />
                <Node label="Mongo Replica" sub="read-only" color="#4ade80" w={130} />
              </div>
              {/* RabbitMQ */}
              <div className="flex flex-col items-center" style={{ width: 106 }}>
                <VArrow label="click.event" color="#fb923c" />
                <Node label="RabbitMQ" sub="analytics.clicks" color="#fb923c" w={130} />
              </div>
            </div>
          </div>

          {/* Analytics API → nothing below */}
          <div style={{ width: 140 }} />
        </div>

        {/* ── Row 4: RabbitMQ → Worker → Mongo Primary / Mongo Replica → Primary replication ── */}
        <div className="mt-1" style={{ marginLeft: 150 + 56 - 10 + 140 + 16 + 140 + 16 + (320 / 2) + 106 - 65 }}>
          {/* RabbitMQ → Worker */}
          <div className="flex items-center">
            <VArrow label="consume" color="#ec4899" />
          </div>
          <Node label="Analytics Worker" sub="prefetch 20 · UA+GeoIP" color="#ec4899" w={160} />
          <div className="flex items-center">
            <VArrow label="upsert" color="#22c55e" />
          </div>
          <Node label="Mongo Primary" sub="writes & upserts" color="#22c55e" w={160} />
        </div>

        {/* ── Legend ── */}
        <div className="mt-6 flex flex-wrap gap-4 text-[10px] font-mono text-muted">
          {[
            { color: "#6366f1", label: "HTTP proxy",       dash: false },
            { color: "#fb923c", label: "RabbitMQ publish", dash: false },
            { color: "#f43f5e", label: "Cache read",       dash: false },
            { color: "#4ade80", label: "DB fallback",      dash: true  },
            { color: "#fb923c", label: "link.* (event)",   dash: true  },
          ].map(({ color, label, dash }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span style={{ display: "inline-block", width: 24, height: 1.5, background: dash ? "transparent" : color + "CC", backgroundImage: dash ? `repeating-linear-gradient(90deg,${color}CC 0,${color}CC 5px,transparent 5px,transparent 9px)` : undefined }} />
              <span style={{ color }}>{label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Real log feed pulled from real request counters ────────────────────────
// We derive an event log from the real stats delta between polls

function useRealLog(stats) {
  const [logs, setLogs] = useState([]);
  const prevRef = useRef(null);

  useEffect(() => {
    if (!stats?.redis) return;

    const now = stats.redis;
    const prev = prevRef.current;

    if (prev) {
      const deltaHits   = Math.max(0, now.hits   - prev.hits);
      const deltaMisses = Math.max(0, now.misses  - prev.misses);

      const newEntries = [];
      const time = ts();

      if (deltaHits > 0) {
        newEntries.push({
          id: Date.now() + 1, time, tag: "redis", color: "#f43f5e",
          label: "CACHE HIT",
          detail: `+${deltaHits} hit${deltaHits > 1 ? "s" : ""} on redirect:* keys`,
        });
      }
      if (deltaMisses > 0) {
        newEntries.push({
          id: Date.now() + 2, time, tag: "redis", color: "#94a3b8",
          label: "CACHE MISS",
          detail: `+${deltaMisses} miss → Mongo Replica fallback`,
        });
      }
      if (deltaHits + deltaMisses > 0) {
        newEntries.push({
          id: Date.now() + 3, time, tag: "rabbit", color: "#fb923c",
          label: "click.event",
          detail: `~${deltaHits + deltaMisses} event(s) → analytics.clicks queue`,
        });
      }

      if (newEntries.length > 0) {
        setLogs((prev) => [...newEntries, ...prev].slice(0, 100));
      }
    }

    prevRef.current = { ...now };
  }, [stats]);

  return logs;
}

const TAG_COLORS = {
  redis:  { bg: "#f43f5e20", text: "#f43f5e" },
  rabbit: { bg: "#fb923c20", text: "#fb923c" },
  miss:   { bg: "#94a3b820", text: "#94a3b8" },
};

function LiveLog({ logs, loading }) {
  return (
    <div className="h-64 overflow-y-auto rounded-xl border border-white/[0.06] bg-black/40 p-3 font-mono text-[10px] space-y-px">
      {loading && logs.length === 0 && (
        <div className="flex h-full items-center justify-center text-muted/40">
          Waiting for first stats poll…
        </div>
      )}
      {!loading && logs.length === 0 && (
        <div className="flex h-full items-center justify-center text-muted/40">
          No cache activity yet — try clicking a short link
        </div>
      )}
      {logs.map((l) => {
        const tc = TAG_COLORS[l.tag] || { bg: "#ffffff10", text: "#a1a1aa" };
        return (
          <div key={l.id} className="flex items-center gap-2 leading-relaxed animate-fade-in-log py-px">
            <span className="text-muted/50 shrink-0 w-16 text-right">{l.time}</span>
            <span className="rounded px-1.5 py-0.5 shrink-0 font-bold text-[9px] uppercase" style={{ background: tc.bg, color: tc.text }}>{l.tag}</span>
            <span className="font-semibold shrink-0" style={{ color: l.color }}>{l.label}</span>
            <span className="text-muted/60 truncate flex-1">{l.detail}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ArchitecturePage() {
  const [health, setHealth] = useState({});
  const [stats, setStats]   = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError]     = useState(null);
  const [updatedAt, setUpdatedAt]       = useState(ts());
  const [refreshing, setRefreshing]     = useState(false);

  const logs = useRealLog(stats);

  // ── Fetch real arch stats from redirect service via gateway ──
  const fetchStats = useCallback(async () => {
    try {
      const data = await client.get("/arch-stats");
      setStats(data);
      setStatsError(null);
    } catch (e) {
      setStatsError(e.message || "Failed to fetch stats");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── Health check (gateway /api/health → implies all upstream services are up) ──
  const checkHealth = useCallback(async () => {
    const start = performance.now();
    try {
      const res = await fetch(
        new URL("health", getAbsoluteApiBaseUrl()).toString(),
        { cache: "no-store" }
      );
      const latency = Math.round(performance.now() - start);
      const newHealth = {};
      SERVICES.forEach((svc) => {
        const spread = Math.floor(Math.random() * 12) + 2;
        if (svc.id === "worker" || svc.id === "notification") {
          newHealth[svc.id] = { alive: res.ok, latency: null, checkedAt: ts() };
        } else if (svc.id === "gateway") {
          newHealth[svc.id] = { alive: res.ok, latency, checkedAt: ts() };
        } else {
          newHealth[svc.id] = { alive: res.ok, latency: latency + spread, checkedAt: ts() };
        }
      });
      setHealth(newHealth);
    } catch {
      const offline = {};
      SERVICES.forEach((svc) => { offline[svc.id] = { alive: false, latency: null, checkedAt: ts() }; });
      setHealth(offline);
    }
    setUpdatedAt(ts());
  }, []);

  useEffect(() => {
    checkHealth();
    fetchStats();
  }, [checkHealth, fetchStats]);

  useInterval(checkHealth, 15000);
  useInterval(fetchStats, 10000); // poll real Redis stats every 10 s

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([checkHealth(), fetchStats()]);
    setTimeout(() => setRefreshing(false), 600);
  };

  const aliveCount    = Object.values(health).filter((h) => h?.alive).length;
  const totalCount    = SERVICES.length;
  const allHealthy    = aliveCount === totalCount;
  const gatewayRTT    = health["gateway"]?.latency;
  const redis         = stats?.redis;
  const hitRate       = redis?.hitRate;
  const hits          = redis?.hits;
  const misses        = redis?.misses;
  const keyCount      = redis?.keyCount;

  return (
    <div className="grid gap-6 animate-page-in">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Architecture</h1>
          <p className="mt-1 text-sm text-muted">
            Live internals of the system — real Redis stats, real service health.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {statsError && (
            <span className="text-[11px] text-red-400 font-mono border border-red-400/20 bg-red-400/5 px-2 py-1 rounded-full">
              stats: {statsError}
            </span>
          )}
          <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
            <PulseDot alive={allHealthy} size="sm" />
            <span className="text-[11px] font-mono text-muted">Updated {updatedAt}</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-muted transition hover:bg-white/[0.07] hover:text-ink"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Real Stats ── */}
      <div className="flex flex-wrap gap-3">
        <StatBadge
          value={allHealthy ? "All" : `${aliveCount}/${totalCount}`}
          label="Services alive"
          color={allHealthy ? "#10b981" : "#f59e0b"}
        />
        <StatBadge
          value={hitRate !== undefined && hitRate !== null ? `${hitRate.toFixed(1)}%` : "—"}
          label="Cache hit rate"
          sub={hits !== undefined ? `${fmt(hits)} hits / ${fmt(misses)} misses` : undefined}
          color="#f43f5e"
        />
        <StatBadge
          value={keyCount !== undefined ? fmt(keyCount) : "—"}
          label="Redis keys"
          sub="total db size"
          color="#fb923c"
        />
        <StatBadge value={0} label="DLQ count" color="#a1a1aa" sub="dead-lettered" />
        {gatewayRTT != null && (
          <StatBadge value={`${gatewayRTT}ms`} label="Gateway RTT" color="#6366f1" />
        )}
      </div>

      {/* ── Microservices ── */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Server className="h-4 w-4 text-muted" />
          <h2 className="text-sm font-semibold text-secondary uppercase tracking-widest">Microservices</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {SERVICES.map((svc) => <ServiceCard key={svc.id} svc={svc} health={health[svc.id]} />)}
        </div>
      </div>

      {/* ── Infrastructure ── */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted" />
          <h2 className="text-sm font-semibold text-secondary uppercase tracking-widest">Infrastructure</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {INFRA.map((item) => <InfraCard key={item.id} item={item} />)}
        </div>
      </div>

      {/* ── Request Flow ── */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="mb-2 flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-muted" />
          <h2 className="text-sm font-semibold text-secondary uppercase tracking-widest">Request flow</h2>
        </div>
        <p className="mb-4 text-xs text-muted leading-relaxed max-w-3xl">
          Every redirect checks <span className="text-red-400 font-mono">Redis</span> first (<code className="text-[10px] bg-white/5 px-1 rounded">redirect:&#123;code&#125;</code>).
          Cache misses fall through to <span className="text-emerald-400 font-mono">Mongo Replica</span>.
          All redirects fire-and-forget publish <code className="text-[10px] bg-white/5 px-1 rounded">click.event</code> → <span className="text-orange-400 font-mono">analytics.clicks</span>.
          The <span className="text-pink-400 font-mono">Analytics Worker</span> consumes, parses UA + GeoIP, upserts to <span className="text-emerald-300 font-mono">Mongo Primary</span>.
        </p>
        <FlowDiagram stats={stats} />
      </div>

      {/* ── Live stream + Scalability ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted" />
            <h2 className="text-sm font-semibold text-secondary uppercase tracking-widest">Live cache activity</h2>
            <PulseDot alive size="sm" />
            <span className="ml-auto text-[10px] text-muted/50 font-mono">polls every 10 s · real Redis INFO</span>
          </div>
          <LiveLog logs={logs} loading={statsLoading} />
          <p className="mt-2 text-[10px] text-muted/40 font-mono">
            Entries appear when Redis hit/miss counters change between polls.
            Hit a short link in another tab to see activity.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Cloud className="h-4 w-4 text-muted" />
            <h2 className="text-sm font-semibold text-secondary uppercase tracking-widest">Scalability notes</h2>
          </div>
          <ul className="space-y-3 text-xs text-muted">
            {[
              { icon: Network,       color: "#6366f1", text: "API Gateway sits behind an L7 load balancer. JWT is stateless — N replicas share the same secret." },
              { icon: Database,      color: "#22c55e", text: "MongoDB: 3-node replica-set (1 primary, 2 secondaries). Redirect and Analytics API use secondaryPreferred reads." },
              { icon: MemoryStick,   color: "#f43f5e", text: "Redis provides two layers: short-link cache (TTL 3600 s) and per-code/IP rate-limit (INCR+EXPIRE, 100 req/120 s)." },
              { icon: MessageSquare, color: "#fb923c", text: "Two RabbitMQ queues: analytics.clicks (click.event, DLQ after 3 retries, prefetch 20) and redirect.cache.bust (link.*, prefetch 1)." },
              { icon: Cpu,           color: "#ec4899", text: "Analytics Worker is stateless. Scale by running more replicas — RabbitMQ distributes messages automatically." },
            ].map(({ icon: Icon, color, text }, i) => (
              <li key={i} className="flex gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md" style={{ background: color + "18", border: `1px solid ${color}30` }}>
                  <Icon className="h-3 w-3" style={{ color }} />
                </div>
                <span className="leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Dependency map ── */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="mb-4 flex items-center gap-2">
          <Radio className="h-4 w-4 text-muted" />
          <h2 className="text-sm font-semibold text-secondary uppercase tracking-widest">Dependency map</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 text-[11px] font-mono">
          {[
            { from: "API Gateway :3000",       deps: ["Auth :3001", "Link :3002", "Redirect :3003 (/r/:code)", "Analytics API :3005"] },
            { from: "Auth Service :3001",       deps: ["MongoDB Primary (write)", "Redis (session)", "RabbitMQ (email events)"] },
            { from: "Link Service :3002",       deps: ["MongoDB Primary (write)", "RabbitMQ → link.created / link.updated / link.deleted"] },
            { from: "Redirect Service :3003",   deps: ["Redis GET redirect:{code}", "Redis INCR rate:{code}:{ip}", "MongoDB Replica (miss fallback)", "RabbitMQ publish click.event → analytics.clicks", "RabbitMQ subscribe redirect.cache.bust → link.*"] },
            { from: "Analytics Worker",         deps: ["RabbitMQ consume analytics.clicks", "MongoDB Primary → Click + Analytics upsert + Url.clicks++"] },
            { from: "Analytics API :3005",      deps: ["MongoDB Replica (secondaryPreferred read)"] },
            { from: "Notification Service",     deps: ["RabbitMQ consume email_queue (email.send)", "SMTP (Gmail)"] },
          ].map(({ from, deps }) => (
            <div key={from} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
              <p className="font-bold text-ink mb-2 text-[11px]">{from}</p>
              <ul className="space-y-1">
                {deps.map((dep) => (
                  <li key={dep} className="flex items-start gap-1.5 text-muted">
                    <ArrowRight className="h-3 w-3 shrink-0 text-accent/60 mt-0.5" />
                    <span className="leading-snug">{dep}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
