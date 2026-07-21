"use client";

import { ArrowDown, ArrowUp, Download, ExternalLink, FileWarning, RefreshCw, SearchCheck, ShieldCheck, Users } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ClaimFactMatrix } from "@/components/charts/claim-fact-matrix";
import { demoRepository, type DemoScenario } from "@/repositories/demo-repository";
import { useDemoStore } from "@/stores/demo-store";
import type { CompanyYearRecord } from "@/types";

export default function DashboardPage() {
  return <Suspense fallback={<DashboardLoading />}><DashboardContent /></Suspense>;
}

function DashboardContent() {
  const params = useSearchParams();
  const scenario = (params.get("scenario") ?? "success") as DemoScenario;
  const [items, setItems] = useState<CompanyYearRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ascending, setAscending] = useState(false);
  const { industry, risk, selectedCompanyId, selectCompany, pendingReviews, openDrawer, notify, showToast } = useDemoStore();

  useEffect(() => {
    let active = true;
    demoRepository.listCompanies(scenario).then((data) => active && setItems(data)).catch((reason: Error) => active && setError(reason.message)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [scenario]);

  const filtered = useMemo(() => items.filter((company) => {
    const industryMatch = industry === "全部行业" || company.industry === industry;
    const riskMatch = risk === "全部风险" || `${company.riskBand === "high" ? "高" : company.riskBand === "medium" ? "中" : "低"}风险` === risk;
    return industryMatch && riskMatch;
  }), [items, industry, risk]);
  const selected = filtered.find((company) => company.companyId === selectedCompanyId) ?? filtered[0];
  const rows = [...filtered].sort((a, b) => ascending ? (a.riskScore ?? 0) - (b.riskScore ?? 0) : (b.riskScore ?? 0) - (a.riskScore ?? 0));

  function exportSummary() {
    const content = `演示数据：企业、事件、报告与指标均为合成内容，不代表任何真实主体。\n\nGreenLens 研究摘要\n报告年度：2025\n高优先级：143\n待复核：${pendingReviews}\n`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `greenlens-dashboard-demo-${new Date().toISOString().slice(0, 10)}.txt`; anchor.click(); URL.revokeObjectURL(url);
    notify("导出已完成", "合成数据研究摘要已生成。"); showToast("演示研究摘要已导出");
  }

  if (loading) return <DashboardLoading />;
  if (error) return <StatePanel title="演示数据载入失败" detail="成因：本地 Repository 返回了错误场景。影响：当前矩阵和复核队列无法展示。下一步：重新载入或恢复默认筛选。" action="重新载入" onAction={() => location.assign("/dashboard")} />;
  if (!filtered.length) return <StatePanel title="当前筛选下没有样本" detail="筛选组合没有匹配的合成公司。请清除风险或行业筛选后继续。" action="恢复默认视图" onAction={() => location.assign("/dashboard")} />;

  return (
    <div className="page dashboard-page">
      <header className="page-header"><div><h2>风险总览</h2><p>先定位声明与外部事实同时偏高的样本，再沿证据链复核。</p></div><div className="header-actions"><span className="status-chip">截至 2025 · 合成数据</span><button className="secondary-button" onClick={exportSummary}><Download size={15} />导出演示</button></div></header>
      <section className="metric-strip" aria-label="总览指标">
        <Metric icon={<Users />} label="有效公司-年份" value="1,284" note="当前口径" />
        <Metric icon={<FileWarning />} label="高优先级" value="143" note="需核验" delta="+12" />
        <Metric icon={<ShieldCheck />} label="证据覆盖率" value="76%" note="三类来源" />
        <button className="metric-item metric-button" onClick={() => location.assign("/review")}><span className="metric-label"><span>待复核</span><SearchCheck size={14} /></span><div className="metric-value">{pendingReviews}<small>进入队列</small></div></button>
      </section>
      <div className="dashboard-grid">
        <section className="panel chart-panel"><header className="panel-header"><div><h3>声明 × 事实证据场</h3><p>样本 {filtered.length} · 报告年 2025 · 点击固定，双击打开分析</p></div><span className="chart-legend"><i className="pending" />待复核 <i className="verified" />已复核 <i className="insufficient" />证据不足</span></header><ClaimFactMatrix companies={filtered} /></section>
        <section className="panel"><header className="panel-header"><div><h3>{selected ? `${selected.companyName} · 风险结构` : "风险结构"}</h3><p>贡献与行业中位分开显示</p></div>{selected && <span className={`status-chip ${selected.riskBand}`}>风险 {selected.riskScore}</span>}</header><div className="panel-body">{selected && <><div className="contribution-list">{selected.components.map((component) => <button key={component.code} className="contribution-row contribution-button" onClick={() => { useDemoStore.getState().selectEvidence(component.evidenceIds[0]); openDrawer("ai"); }}><span className="contribution-meta"><span>{component.label}</span><span>{component.value} / 贡献 {component.contribution}</span></span><span className="bar-track"><span className="bar-fill" style={{ width: `${component.value}%` }} /><span className="bar-benchmark" style={{ left: `${component.industryMedian}%` }} /></span></button>)}</div><div className="quality-summary"><span className="section-kicker">证据质量（不计入风险）</span><Quality label="报告" value={selected.evidenceCoverage} /><Quality label="外部事件" value={Math.max(45, selected.evidenceCoverage - 7)} /><Quality label="评级" value={Math.min(96, selected.evidenceCoverage + 13)} /></div></>}</div></section>
      </div>
      <section className="panel queue-panel"><header className="panel-header"><div><h3>优先复核队列</h3><p>当前矩阵选择与队列同步</p></div><button className="quiet-button" onClick={() => setAscending(!ascending)}>风险分 {ascending ? <ArrowUp size={14} /> : <ArrowDown size={14} />}</button></header><div className="data-table-wrap"><table className="data-table"><thead><tr><th>公司</th><th>行业</th><th>年度</th><th className="numeric">风险分</th><th className="numeric">声明分位</th><th className="numeric">事实分位</th><th>证据状态</th><th className="numeric">待复核项</th><th>操作</th></tr></thead><tbody>{rows.map((company) => <tr key={company.companyId} className={company.companyId === selectedCompanyId ? "selected" : ""} onClick={() => selectCompany(company.companyId)}><td><strong>{company.companyName}</strong><br/><small>{company.stockCode}</small></td><td>{company.industry}</td><td>2025</td><td className="numeric">{company.riskScore}</td><td className="numeric">{company.claimPercentile}</td><td className="numeric">{company.factPercentile}</td><td><span className={`status-chip ${company.evidenceStatus}`}>{evidenceLabel(company.evidenceStatus)}</span></td><td className="numeric">{Math.max(1, Math.round(company.eventCount / 2))}</td><td><button className="table-action" onClick={(event) => { event.stopPropagation(); location.assign(`/companies/${company.companyId}?year=2025`); }}>打开分析 <ExternalLink size={13} /></button></td></tr>)}</tbody></table></div></section>
    </div>
  );
}

function Metric({ icon, label, value, note, delta }: { icon: React.ReactNode; label: string; value: string; note: string; delta?: string }) { return <div className="metric-item"><span className="metric-label"><span>{label}</span>{delta ? <span className="metric-delta">{delta}</span> : icon}</span><div className="metric-value">{value}<small>{note}</small></div></div>; }
function Quality({ label, value }: { label: string; value: number }) { return <div className="quality-row"><span>{label}</span><span className="bar-track"><span className="bar-fill" style={{ width: `${value}%` }} /></span><code>{value}%</code></div>; }
function evidenceLabel(status: CompanyYearRecord["evidenceStatus"]) { return { verified: "已验证", pending: "待复核", insufficient: "证据不足", disputed: "存在争议" }[status]; }
function DashboardLoading() { return <div className="page"><div className="skeleton skeleton-header" /><div className="metric-strip">{[1,2,3,4].map((i) => <div className="metric-item" key={i}><span className="skeleton skeleton-line" /><span className="skeleton skeleton-value" /></div>)}</div><div className="dashboard-grid"><div className="panel skeleton-panel"/><div className="panel skeleton-panel"/></div></div>; }
function StatePanel({ title, detail, action, onAction }: { title: string; detail: string; action: string; onAction: () => void }) { return <div className="state-panel"><RefreshCw size={24}/><h2>{title}</h2><p>{detail}</p><button className="primary-button" onClick={onAction}>{action}</button></div>; }
