import { AlertOctagon, DatabaseZap } from "lucide-react";
import { CommandPanelHeading } from "./panel-heading";
import type { DashboardCommandCenterData, RedFlagCode } from "@/types";

const flagLabels: Record<RedFlagCode, string> = { HIGH_ESGSI: "高 ESGSI", LOW_EASS: "低 EASS", HIGH_IR: "高 IR", HIGH_UPR: "高 UPR" };

export function RedFlagQuality({ flags, quality, expanded = false, onExpand }: { flags: DashboardCommandCenterData["redFlagDistribution"]; quality: DashboardCommandCenterData["quality"]; expanded?: boolean; onExpand?: () => void }) {
  const latest = quality.at(-1);
  const maxFlag = Math.max(1, ...flags.map((item) => item.count));
  const qualityItems = latest ? [
    ["低句数", latest.selectedNLt10],
    ["重复报告", latest.duplicateGroups],
    ["年份异常", latest.titleTargetYearNotFound],
    ["代码恢复", latest.codeRecoveredFromCompany],
  ] as const : [];
  return <section className={`cc-panel cc-audit-panel ${expanded ? "cc-panel-expanded" : ""}`}><CommandPanelHeading eyebrow="AUDIT" title="红旗与数据质量" detail={expanded ? "风险信号与数据质量分开计算" : undefined} onExpand={expanded ? undefined : onExpand} expandLabel="展开红旗与数据质量"/><div className="cc-audit-content">
    <div className="cc-audit-group"><span><AlertOctagon/>风险红旗</span>{flags.map((item) => <div className="cc-audit-bar risk" key={item.code}><label>{flagLabels[item.code]}</label><i><b style={{ width: `${item.count / maxFlag * 100}%` }}/></i><strong>{item.count}</strong></div>)}</div>
    <div className="cc-audit-divider"/>
    <div className="cc-audit-group quality"><span><DatabaseZap/>数据质量 · {latest?.year ?? "—"}</span><div className="cc-quality-grid">{qualityItems.map(([label, value]) => <div key={label}><strong>{value}</strong><small>{label}</small></div>)}</div></div>
  </div></section>;
}
