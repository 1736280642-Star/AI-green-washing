import { Activity, MessageSquareText, ShieldCheck } from "lucide-react";
import { CommandPanelHeading } from "./panel-heading";
import { formatPercent, type DashboardMetricTriad, type DashboardTriadCode } from "@/types";

const icons = { RHETORIC_CONTENT: MessageSquareText, ACTION_SUBSTANCE: ShieldCheck, AMBIGUITY_VERIFICATION: Activity };
const metricCodes = { RHETORIC_CONTENT: "ESGSI", ACTION_SUBSTANCE: "EASS", AMBIGUITY_VERIFICATION: "IR · UPR" };

function MiniTrend({ values, expanded = false }: { values: Array<number | null>; expanded?: boolean }) {
  const available = values.map((value, index) => ({ value, index })).filter((item): item is { value: number; index: number } => item.value != null);
  if (available.length < 2) return <span className="cc-mini-trend empty"/>;
  const points = available.map((item) => `${item.index / Math.max(1, values.length - 1) * 96 + 2},${30 - item.value * 25}`).join(" ");
  const latest = available.at(-1)!;
  return <svg className={`cc-mini-trend ${expanded ? "expanded" : ""}`} viewBox="0 0 100 34" preserveAspectRatio="none" aria-hidden="true">
    <line className="baseline" x1="2" y1="30" x2="98" y2="30"/>
    <polyline points={points}/>
    <circle cx={latest.index / Math.max(1, values.length - 1) * 96 + 2} cy={30 - latest.value * 25} r={expanded ? 1.6 : 1.2}/>
  </svg>;
}

function getLatestDelta(item: DashboardMetricTriad) {
  const available = item.history.filter((point): point is { year: number; value: number } => point.value != null);
  if (available.length < 2) return null;
  return available.at(-1)!.value - available.at(-2)!.value;
}

function formatDelta(value: number | null) {
  if (value == null) return "—";
  const points = Math.round(value * 100);
  return `${points > 0 ? "+" : ""}${points}pp`;
}

export function MetricTriad({ items, selected, onSelect, expanded = false, onExpand }: { items: DashboardMetricTriad[]; selected: DashboardTriadCode | null; onSelect: (code: DashboardTriadCode | null) => void; expanded?: boolean; onExpand?: () => void }) {
  return <section className={`cc-panel cc-triad-panel ${expanded ? "cc-panel-expanded" : ""}`}>
    <CommandPanelHeading eyebrow="CONSTRUCT" title="三方面构造指标" detail={expanded ? "中位数、关注率、分布和跨年变化 · 点击指标联动风险场" : undefined} onExpand={expanded ? undefined : onExpand} expandLabel="展开三方面构造指标"/>
    <div className="cc-triad-list">{items.map((item) => {
      const Icon = icons[item.code];
      const active = selected === item.code;
      const delta = getLatestDelta(item);
      const firstYear = item.history.find((point) => point.value != null)?.year;
      const lastYear = item.history.findLast((point) => point.value != null)?.year;
      return <button key={item.code} className={`cc-triad-card ${active ? "active" : ""}`} onClick={() => onSelect(active ? null : item.code)} aria-pressed={active}>
        <span className="cc-triad-icon"><Icon/></span>
        <span className="cc-triad-copy"><small className="cc-triad-code">{metricCodes[item.code]}</small><strong>{item.label}</strong>{expanded ? <span className="cc-triad-description">{item.description}</span> : null}</span>
        <span className="cc-triad-values" aria-label={`样本中位数 ${formatPercent(item.medianValue)}`}><small>样本中位数</small><strong>{formatPercent(item.medianValue)}</strong></span>
        <span className="cc-triad-meta">
          <span><small>关注率</small><strong>{formatPercent(item.attentionRate)}</strong></span>
          <span><small>较上年</small><strong className={delta == null ? "neutral" : delta > 0 ? "up" : delta < 0 ? "down" : "neutral"}>{formatDelta(delta)}</strong></span>
          <span><small>有效样本</small><strong>{item.sampleCount}</strong></span>
        </span>
        <MiniTrend values={item.history.map((point) => point.value)} expanded={expanded}/>
        {expanded ? <span className="cc-triad-history">
          <small>年度中位数</small>
          <span>{item.history.map((point) => <span key={point.year}><small>{point.year}</small><strong>{formatPercent(point.value)}</strong></span>)}</span>
        </span> : null}
        {expanded ? <span className="cc-triad-distribution">
          <span><small>中间 50% 区间</small><strong>{formatPercent(item.q1)} — {formatPercent(item.q3)}</strong></span>
          <span><small>趋势覆盖</small><strong>{firstYear ?? "—"} — {lastYear ?? "—"}</strong></span>
        </span> : null}
      </button>;
    })}</div>
    {expanded ? <footer className="cc-triad-note">关注率表示风险方向值达到 0.5 的样本占比；EASS 原始值越高代表行动越实质，联动风险场时使用反向风险值。</footer> : null}
  </section>;
}
