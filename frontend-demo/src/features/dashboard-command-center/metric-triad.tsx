import { Activity, MessageSquareText, ShieldCheck } from "lucide-react";
import { CommandPanelHeading } from "./panel-heading";
import { formatPercent, type DashboardMetricTriad, type DashboardTriadCode } from "@/types";

const icons = { RHETORIC_CONTENT: MessageSquareText, ACTION_SUBSTANCE: ShieldCheck, AMBIGUITY_VERIFICATION: Activity };

function MiniTrend({ values }: { values: Array<number | null> }) {
  const available = values.map((value, index) => ({ value, index })).filter((item): item is { value: number; index: number } => item.value != null);
  if (available.length < 2) return <span className="cc-mini-trend empty"/>;
  const points = available.map((item) => `${item.index / Math.max(1, values.length - 1) * 96 + 2},${30 - item.value * 25}`).join(" ");
  return <svg className="cc-mini-trend" viewBox="0 0 100 34" aria-hidden="true"><polyline points={points}/></svg>;
}

export function MetricTriad({ items, selected, onSelect, expanded = false, onExpand }: { items: DashboardMetricTriad[]; selected: DashboardTriadCode | null; onSelect: (code: DashboardTriadCode | null) => void; expanded?: boolean; onExpand?: () => void }) {
  return <section className={`cc-panel cc-triad-panel ${expanded ? "cc-panel-expanded" : ""}`}><CommandPanelHeading eyebrow="CONSTRUCT" title="三方面构造指标" detail={expanded ? "点击指标联动风险场 · EASS 使用反向风险值" : undefined} onExpand={expanded ? undefined : onExpand} expandLabel="展开三方面构造指标"/><div className="cc-triad-list">{items.map((item) => {
    const Icon = icons[item.code]; const active = selected === item.code;
    return <button key={item.code} className={`cc-triad-card ${active ? "active" : ""}`} onClick={() => onSelect(active ? null : item.code)} aria-pressed={active}>
      <span className="cc-triad-icon"><Icon/></span>
      <span className="cc-triad-copy"><strong>{item.label}</strong>{expanded ? <small>{item.description}</small> : null}</span>
      <span className="cc-triad-values"><strong>{formatPercent(item.medianValue)}</strong>{expanded ? <small>关注 {formatPercent(item.attentionRate)}</small> : null}</span>
      <MiniTrend values={item.history.map((point) => point.value)}/>
    </button>;
  })}</div>{expanded ? <footer className="cc-triad-note">EASS 越高越实质；界面使用风险方向值进行跨指标联动。</footer> : null}</section>;
}
