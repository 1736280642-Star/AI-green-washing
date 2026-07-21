"use client";

import { useRouter } from "next/navigation";
import { Bell, Building2, Check, ChevronRight, Search, Sparkles, Undo2, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { companies, evidence } from "@/mocks/fixtures/companies";
import { useDemoStore } from "@/stores/demo-store";

export function GlobalLayers() {
  const router = useRouter();
  const { drawer, openDrawer, toast, showToast, notifications, selectedCompanyId, selectedEvidenceId, saveReview, reviews, undoReview } = useDemoStore();
  const [query, setQuery] = useState("");
  const [decision, setDecision] = useState("insufficient");
  const [note, setNote] = useState("");
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (drawer !== "none") setTimeout(() => closeButton.current?.focus(), 20);
  }, [drawer]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => showToast(null), 8000);
    return () => clearTimeout(timer);
  }, [toast, showToast]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && openDrawer("none");
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openDrawer]);

  const selectedCompany = companies.find((company) => company.companyId === selectedCompanyId) ?? companies[0];
  const selectedEvidence = evidence.find((item) => item.id === selectedEvidenceId) ?? evidence[0];
  const lastReview = reviews[0];
  const resultLinks = [
    ...companies.filter((company) => `${company.companyName}${company.stockCode}`.toLowerCase().includes(query.toLowerCase())).map((company) => ({ label: company.companyName, detail: `${company.stockCode} · ${company.industry}`, href: `/companies/${company.companyId}?year=2025` })),
    ...[
      ["风险总览", "查看声明 × 事实矩阵", "/dashboard"],
      ["企业库", "搜索与建立对比组", "/companies"],
      ["报告检测", "运行合成检测任务", "/reports"],
      ["复核中心", "处理人工判断队列", "/review"],
    ].filter(([label, detail]) => `${label}${detail}`.includes(query)).map(([label, detail, href]) => ({ label, detail, href })),
  ].slice(0, 7);

  function navigate(href: string) {
    openDrawer("none");
    router.push(href);
  }

  function submitReview(event: FormEvent) {
    event.preventDefault();
    const id = `review-${selectedEvidence.id}`;
    saveReview({
      id,
      targetId: selectedEvidence.id,
      companyId: selectedCompany.companyId,
      targetType: "evidence",
      originalDecision: selectedEvidence.status,
      humanDecision: decision as "confirm" | "reject" | "partial" | "insufficient",
      reasonCode: decision === "insufficient" ? "missing-baseline" : "human-verified",
      note,
      reviewedAt: new Date().toISOString(),
    });
  }

  return (
    <>
      {drawer !== "none" && <button className="drawer-scrim" onClick={() => openDrawer("none")} aria-label="关闭浮层" />}
      <section className={`global-drawer ${drawer === "ai" ? "open" : ""}`} role="dialog" aria-modal="true" aria-label="AI 证据助手">
        <DrawerHeader icon={<Sparkles size={18} />} title="AI 证据助手" onClose={() => openDrawer("none")} closeRef={closeButton} />
        <div className="drawer-context"><span>{selectedCompany.companyName}</span><code>2025</code><span>{selectedEvidence.title}</span></div>
        <div className="drawer-scroll">
          <p className="drawer-kicker">结论</p>
          <h2>当前风险主要来自未验证目标与量化证据缺口。</h2>
          <p>报告提出方向性目标，但当前证据没有给出可核验的基准年、阶段目标和第三方鉴证边界。该结果是待复核信号，不是对企业行为的最终判断。</p>
          <div className="citation-block">
            <span>主要依据</span>
            <button onClick={() => navigate(`/companies/${selectedCompany.companyId}?year=2025&tab=evidence&evidence=${selectedEvidence.id}`)}>
              <strong>[1] 第 {selectedEvidence.page ?? 42} 页报告证据</strong><ChevronRight size={16} />
            </button>
            <button onClick={() => navigate(`/companies/${selectedCompany.companyId}?year=2025&tab=facts&evidence=ev-ext-1`)}>
              <strong>[2] 关联外部事实</strong><ChevronRight size={16} />
            </button>
          </div>
          <p className="drawer-kicker">不确定性</p>
          <p>演示版不读取真实 PDF 正文，也没有连接外部来源。主体匹配和事件相关性需要人工确认。</p>
          <p className="drawer-kicker">建议下一步</p>
          <ul className="plain-list"><li>核验目标的基准年与核算边界</li><li>确认外部事件是否属于同一经营主体</li><li>记录人工判断并保留原因</li></ul>
        </div>
        <div className="drawer-footer"><button className="secondary-button" onClick={() => openDrawer("review")}>发起复核</button><button className="primary-button" onClick={() => navigate(`/companies/${selectedCompany.companyId}?tab=evidence&evidence=${selectedEvidence.id}`)}>查看引用</button></div>
      </section>

      <section className={`global-drawer review-drawer ${drawer === "review" ? "open" : ""}`} role="dialog" aria-modal="true" aria-label="发起复核">
        <DrawerHeader icon={<Check size={18} />} title="发起复核" onClose={() => openDrawer("none")} closeRef={closeButton} />
        <form onSubmit={submitReview} className="drawer-form">
          <div className="review-source"><span>当前证据</span><strong>{selectedEvidence.title}</strong><p>{selectedEvidence.excerpt}</p></div>
          <fieldset><legend>人工决定</legend>{[
            ["confirm", "确认信号", "证据支持当前模型判断"],
            ["reject", "驳回信号", "证据与当前判断不一致"],
            ["partial", "部分相关", "仅部分证据与判断相关"],
            ["insufficient", "证据不足", "当前材料不能支持判断"],
          ].map(([value, label, detail]) => <label className={`decision-option ${decision === value ? "selected" : ""}`} key={value}><input type="radio" name="decision" value={value} checked={decision === value} onChange={(event) => setDecision(event.target.value)} /><span><strong>{label}</strong><small>{detail}</small></span></label>)}</fieldset>
          <label className="field-label"><span>复核说明 <small>选填</small></span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="记录判断依据，便于后续追溯" /></label>
          <div className="drawer-footer"><button type="button" className="secondary-button" onClick={() => openDrawer("none")}>取消</button><button className="primary-button" type="submit">保存复核</button></div>
        </form>
      </section>

      <section className={`global-drawer notification-drawer ${drawer === "notifications" ? "open" : ""}`} role="dialog" aria-modal="true" aria-label="通知中心">
        <DrawerHeader icon={<Bell size={18} />} title="通知中心" onClose={() => openDrawer("none")} closeRef={closeButton} />
        <div className="drawer-scroll notification-list">{notifications.map((item) => <div key={item.id} className="notification-item"><span className="status-dot" /><div><strong>{item.title}</strong><p>{item.detail}</p><small>{item.time}</small></div></div>)}</div>
      </section>

      <section className={`command-palette ${drawer === "command" ? "open" : ""}`} role="dialog" aria-modal="true" aria-label="全局搜索">
        <div className="command-input"><Search size={18} /><input autoFocus={drawer === "command"} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索公司、页面或动作" /><button ref={closeButton} className="icon-button" onClick={() => openDrawer("none")} aria-label="关闭搜索"><X /></button></div>
        <div className="command-results"><span className="command-label">搜索结果</span>{resultLinks.map((item) => <button key={item.href} onClick={() => navigate(item.href)}><Building2 size={17} /><span><strong>{item.label}</strong><small>{item.detail}</small></span><ChevronRight size={16} /></button>)}</div>
      </section>

      {toast && <div className="toast" role="status"><Check size={18} /><span>{toast}</span>{lastReview && toast === "已保存复核结果" && <button onClick={() => undoReview(lastReview.id)}><Undo2 size={15} />撤销</button>}<button className="icon-button" onClick={() => showToast(null)} aria-label="关闭提示"><X /></button></div>}
    </>
  );
}

function DrawerHeader({ icon, title, onClose, closeRef }: { icon: React.ReactNode; title: string; onClose: () => void; closeRef: React.RefObject<HTMLButtonElement | null> }) {
  return <header className="drawer-header"><span>{icon}<strong>{title}</strong></span><button ref={closeRef} className="icon-button" onClick={onClose} aria-label={`关闭${title}`} title="关闭"><X /></button></header>;
}
