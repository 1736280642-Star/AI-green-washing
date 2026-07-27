"use client";

import * as echarts from "echarts";
import { ArrowRight, ChevronDown, Clock3, ExternalLink, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDemoStore } from "@/stores/demo-store";
import type { CompanyYearRecord, DashboardInsights, DashboardReviewTask, RiskComponent } from "@/types";

interface ReviewOperationsProps {
  companies: CompanyYearRecord[];
  insights: DashboardInsights;
  selectedFactor: RiskComponent["code"] | null;
}

const factorLabels: Record<RiskComponent["code"], string> = {
  VAGUE: "模糊声明",
  UNVERIFIED_TARGET: "未验证目标",
  QUANT_GAP: "量化缺失",
  DECOUPLING: "行动脱钩",
  SELECTIVE: "选择性披露",
  EXTERNAL_FACT: "外部事实",
};

const evidenceLabels: Record<DashboardReviewTask["evidenceStatus"], string> = {
  verified: "已验证",
  pending: "待复核",
  insufficient: "证据不足",
  disputed: "存在争议",
};

export function DashboardReviewOperations({ companies, insights, selectedFactor }: ReviewOperationsProps) {
  const trendRef = useRef<HTMLDivElement>(null);
  const agreementRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { selectCompany, selectEvidence, openDrawer, industry, risk } = useDemoStore();
  const companyMap = useMemo(() => new Map(companies.map((company) => [company.companyId, company])), [companies]);

  const tasks = useMemo(() => insights.reviewTasks
    .filter((task) => companyMap.has(task.companyId) && (!selectedFactor || task.type === selectedFactor))
    .map((task) => ({ ...task, priority: task.impact * task.uncertainty * (1 + Math.min(task.ageHours / 168, 0.75)) }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5), [companyMap, insights.reviewTasks, selectedFactor]);
  const maxPriority = Math.max(...tasks.map((task) => task.priority), 1);
  const latest = insights.reviewTrend.at(-1);
  const recent = insights.reviewTrend.slice(-7);
  const created = recent.reduce((sum, point) => sum + point.created, 0);
  const completed = recent.reduce((sum, point) => sum + point.completed, 0);

  useEffect(() => {
    if (!trendRef.current) return;
    const chart = echarts.init(trendRef.current, undefined, { renderer: "canvas" });
    chart.setOption({
      animationDuration: 320,
      aria: { enabled: true, decal: { show: false }, description: "最近十天复核任务的新增、完成与待办趋势。" },
      grid: { left: 34, right: 38, top: 34, bottom: 26 },
      legend: { top: 4, right: 8, itemWidth: 9, itemHeight: 3, textStyle: { color: "#89958F", fontSize: 9 } },
      tooltip: { trigger: "axis", backgroundColor: "rgba(12,17,16,.97)", borderColor: "rgba(255,255,255,.16)", textStyle: { color: "#F4F7F5", fontSize: 10 } },
      xAxis: { type: "category", data: insights.reviewTrend.map((point) => point.date), axisTick: { show: false }, axisLine: { lineStyle: { color: "rgba(255,255,255,.1)" } }, axisLabel: { color: "#718078", fontSize: 8 } },
      yAxis: [
        { type: "value", axisLabel: { color: "#718078", fontSize: 8 }, splitLine: { lineStyle: { color: "rgba(255,255,255,.055)" } } },
        { type: "value", axisLabel: { show: false }, splitLine: { show: false } },
      ],
      series: [
        { name: "新增", type: "bar", data: insights.reviewTrend.map((point) => point.created), barWidth: 7, itemStyle: { color: "rgba(244,211,94,.65)" } },
        { name: "完成", type: "bar", data: insights.reviewTrend.map((point) => point.completed), barWidth: 7, itemStyle: { color: "rgba(56,224,123,.72)" } },
        { name: "待办", type: "line", yAxisIndex: 1, data: insights.reviewTrend.map((point) => point.pending), symbolSize: 4, lineStyle: { color: "#30D5E8", width: 1.5 }, itemStyle: { color: "#30D5E8" }, areaStyle: { color: "rgba(48,213,232,.06)" } },
      ],
    });
    const resize = new ResizeObserver(() => chart.resize());
    resize.observe(trendRef.current);
    return () => { resize.disconnect(); chart.dispose(); };
  }, [insights.reviewTrend]);

  useEffect(() => {
    if (!agreementRef.current) return;
    const chart = echarts.init(agreementRef.current, undefined, { renderer: "canvas" });
    chart.setOption({
      animationDuration: 320,
      aria: { enabled: true, decal: { show: false }, description: "六类风险信号经人工复核后的确认、部分相关、驳回与证据不足占比。" },
      grid: { left: 90, right: 20, top: 34, bottom: 24 },
      legend: { top: 2, right: 8, itemWidth: 8, itemHeight: 8, textStyle: { color: "#89958F", fontSize: 9 } },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, backgroundColor: "rgba(12,17,16,.97)", borderColor: "rgba(255,255,255,.16)", textStyle: { color: "#F4F7F5", fontSize: 10 } },
      xAxis: { type: "value", max: 100, axisLabel: { color: "#718078", fontSize: 8, formatter: "{value}%" }, splitLine: { lineStyle: { color: "rgba(255,255,255,.055)" } } },
      yAxis: { type: "category", inverse: true, data: insights.modelAgreement.map((item) => item.type), axisTick: { show: false }, axisLine: { show: false }, axisLabel: { color: "#AEB8B3", fontSize: 9 } },
      series: [
        { name: "确认", type: "bar", stack: "total", data: insights.modelAgreement.map((item) => item.confirm), barWidth: 11, itemStyle: { color: "#38E07B" } },
        { name: "部分相关", type: "bar", stack: "total", data: insights.modelAgreement.map((item) => item.partial), itemStyle: { color: "#30D5E8" } },
        { name: "驳回", type: "bar", stack: "total", data: insights.modelAgreement.map((item) => item.reject), itemStyle: { color: "#FF5C6C" } },
        { name: "证据不足", type: "bar", stack: "total", data: insights.modelAgreement.map((item) => item.insufficient), itemStyle: { color: "#7F8C86" } },
      ],
    });
    const resize = new ResizeObserver(() => chart.resize());
    resize.observe(agreementRef.current);
    return () => { resize.disconnect(); chart.dispose(); };
  }, [insights.modelAgreement]);

  function startReview(task: DashboardReviewTask) {
    selectCompany(task.companyId);
    selectEvidence(task.evidenceId);
    openDrawer("review");
  }

  function openAllTasks() {
    const params = new URLSearchParams();
    if (industry !== "全部行业") params.set("industry", industry);
    if (risk !== "全部风险") params.set("risk", risk);
    if (selectedFactor) params.set("factor", selectedFactor);
    location.assign(`/review${params.size ? `?${params}` : ""}`);
  }

  return (
    <>
      <section className="dashboard-band review-operations-band" aria-labelledby="review-operations-title">
        <header className="dashboard-band-heading"><div><span className="section-kicker">REVIEW OPERATIONS</span><h2 id="review-operations-title">把注意力放到最值得先看的 5 项</h2><p>优先级 = 风险影响 × 不确定性 × 等待时长；排序用于分配工作，不替代人工判断。</p></div><button className="quiet-button" onClick={openAllTasks}>查看全部任务 <ArrowRight size={13} /></button></header>
        <div className="review-operations-grid">
          <section className="insight-panel priority-flow-panel">
            <header><div><h3>Top 5 优先复核任务流</h3><p>{selectedFactor ? `已聚焦：${factorLabels[selectedFactor]}` : "随全局筛选与风险图联动"}</p></div><span>8 / 12</span></header>
            <div className="priority-flow" aria-label="Top 5 优先复核任务">
              {tasks.length ? tasks.map((task, index) => {
                const company = companyMap.get(task.companyId);
                const score = Math.round(task.priority / maxPriority * 99);
                const isExpanded = expanded === task.id;
                return <article className={`priority-task ${isExpanded ? "expanded" : ""}`} key={task.id}>
                  <button className="priority-task-summary" aria-expanded={isExpanded} onClick={() => { setExpanded(isExpanded ? null : task.id); selectCompany(task.companyId); }}>
                    <span className="priority-rank">{String(index + 1).padStart(2, "0")}</span>
                    <span className="priority-main"><strong>{company?.companyName ?? "合成公司"}</strong><small>{task.reason}</small></span>
                    <span className="priority-factor">{factorLabels[task.type]}</span>
                    <span className="priority-age"><Clock3 size={12} />{formatAge(task.ageHours)}</span>
                    <span className="priority-score"><code>{score}</code><small>优先指数</small></span>
                    <ChevronDown className="priority-chevron" size={14} />
                  </button>
                  {isExpanded ? <div className="priority-task-detail">
                    <div><span>证据状态</span><strong className={`evidence-${task.evidenceStatus}`}>{evidenceLabels[task.evidenceStatus]}</strong></div>
                    <div><span>影响强度</span><strong>{task.impact}</strong></div>
                    <div><span>模型不确定性</span><strong>{task.uncertainty}%</strong></div>
                    <div><span>声明 / 事实分位</span><strong>{task.claimPercentile} / {task.factPercentile}</strong></div>
                    <button className="primary-button" onClick={() => startReview(task)}><ShieldCheck size={14} />开始复核</button>
                    <button className="table-action" onClick={() => location.assign(`/companies/${task.companyId}?year=2025`)}>打开分析 <ExternalLink size={13} /></button>
                  </div> : null}
                </article>;
              }) : <div className="inline-empty"><strong>当前组合没有待处理任务</strong><span>清除问题或行业筛选后查看其他合成任务。</span></div>}
            </div>
          </section>
          <section className="insight-panel throughput-panel"><header><div><h3>队列健康</h3><p>最近 10 天新增、完成与待办</p></div><span>4 / 12</span></header><div className="queue-health-strip"><div><strong>{latest?.pending ?? 0}</strong><span>当前待办</span></div><div><strong>{Math.round(completed / Math.max(1, created) * 100)}%</strong><span>7 日消化率</span></div><div><strong>{Math.max(...insights.reviewTasks.map((task) => task.ageHours), 0)}h</strong><span>最长等待</span></div></div><div ref={trendRef} className="throughput-chart" role="img" aria-label="复核任务吞吐与待办趋势图" /></section>
        </div>
      </section>

      <section className="dashboard-band governance-band" aria-labelledby="governance-title">
        <header className="dashboard-band-heading"><div><span className="section-kicker">MODEL & DATA GOVERNANCE</span><h2 id="governance-title">判断质量是否值得信任</h2><p>人工分歧帮助识别模型盲区，来源新鲜度决定当前风险信号能否继续使用。</p></div><span className="band-context">模型 GL-RISK-1.3 · 合成样本</span></header>
        <div className="governance-grid">
          <section className="insight-panel agreement-panel"><header><div><h3>模型 × 人工决定</h3><p>分歧不是失败，是下一轮校准样本</p></div><span>近 30 日</span></header><div ref={agreementRef} className="agreement-chart" role="img" aria-label="模型与人工决定一致性图" /></section>
          <section className="insight-panel freshness-panel"><header><div><h3>数据来源新鲜度</h3><p>覆盖不足或过期会降低可判定性</p></div><span>{insights.sourceFreshness.filter((source) => source.status !== "fresh").length} 项关注</span></header><div className="freshness-list">{insights.sourceFreshness.map((source) => <div className="freshness-row" key={source.source}><span className={`freshness-dot ${source.status}`} /><span className="freshness-name"><strong>{source.source}</strong><small>{source.daysOld} 天前更新</small></span><span className="freshness-meter"><i style={{ width: `${source.coverage}%` }} /></span><code>{source.coverage}%</code></div>)}</div><footer><span><i className="freshness-dot fresh" />≤ 30 天</span><span><i className="freshness-dot watch" />31-60 天</span><span><i className="freshness-dot stale" />&gt; 60 天</span></footer></section>
        </div>
      </section>
    </>
  );
}

function formatAge(hours: number) {
  return hours < 48 ? `${hours}h` : `${Math.round(hours / 24)}d`;
}
