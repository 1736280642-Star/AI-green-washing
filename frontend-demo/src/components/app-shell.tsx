"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Building2,
  ChartNoAxesCombined,
  Command,
  FileSearch,
  FlaskConical,
  GitCompareArrows,
  Leaf,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useDemoStore } from "@/stores/demo-store";
import { GlobalLayers } from "@/components/global-layers";

const nav = [
  { href: "/dashboard", label: "概览", caption: "Dashboard", icon: ChartNoAxesCombined },
  { href: "/companies", label: "企业", caption: "Companies", icon: Building2 },
  { href: "/compare", label: "对比", caption: "Compare", icon: GitCompareArrows },
  { href: "/reports", label: "报告检测", caption: "Reports", icon: FileSearch },
  { href: "/review", label: "复核", caption: "Review", icon: FlaskConical },
  { href: "/methodology", label: "方法", caption: "Methodology", icon: Command },
];

const pageTitles: Record<string, string> = {
  dashboard: "风险总览",
  companies: "企业库",
  compare: "对比分析",
  reports: "报告检测",
  review: "复核中心",
  methodology: "方法与模型",
};

function subscribeToStoreHydration(onStoreChange: () => void) {
  const persistApi = useDemoStore.persist;
  if (!persistApi) return () => undefined;
  const unsubscribeStart = persistApi.onHydrate(onStoreChange);
  const unsubscribeFinish = persistApi.onFinishHydration(onStoreChange);
  return () => {
    unsubscribeStart();
    unsubscribeFinish();
  };
}

function getStoreHydrationSnapshot() {
  return useDemoStore.persist?.hasHydrated() ?? false;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const filtersReady = useSyncExternalStore(
    subscribeToStoreHydration,
    getStoreHydrationSnapshot,
    () => false,
  );
  const { year, industry, risk, setFilters, openDrawer, notifications, reset, showToast } = useDemoStore();
  const root = pathname.split("/")[1] || "dashboard";
  const title = root === "companies" && pathname.split("/").length > 2 ? "企业分析" : pageTitles[root];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openDrawer("command");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openDrawer]);

  const activeHref = useMemo(() => nav.find((item) => pathname.startsWith(item.href))?.href, [pathname]);

  function resetDemo() {
    reset();
    showToast("演示数据已恢复默认状态");
    router.push("/dashboard");
  }

  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`} aria-label="主导航">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true"><Leaf size={18} /></span>
          {!collapsed && <span><strong>GreenLens</strong><small>绿色证据雷达</small></span>}
          <button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="关闭导航" title="关闭导航"><X /></button>
        </div>
        <nav className="primary-nav">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = activeHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "active" : ""}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                onClick={() => setMobileNav(false)}
                title={item.label}
              >
                <Icon size={18} aria-hidden="true" />
                {!collapsed && <span>{item.label}<small>{item.caption}</small></span>}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          {!collapsed && <div className="data-version"><span>数据版本</span><code>SYN-2026.08</code><small>全量合成数据</small></div>}
          <button className="sidebar-action" onClick={resetDemo} title="重置演示数据">
            <RotateCcw size={16} />{!collapsed && <span>重置演示数据</span>}
          </button>
          <button className="sidebar-action" onClick={() => setCollapsed(!collapsed)} title={collapsed ? "展开侧栏" : "折叠侧栏"}>
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}{!collapsed && <span>折叠侧栏</span>}
          </button>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="topbar-title">
            <button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="打开导航" title="打开导航"><Menu /></button>
            <div><span className="topbar-context">GreenLens / {pageTitles[root] ?? "企业"}</span><h1>{title}</h1></div>
          </div>
          <div className="topbar-actions">
            <button className="command-trigger" onClick={() => openDrawer("command")}><Search size={16} /><span>搜索公司、页面或动作</span><kbd>Ctrl K</kbd></button>
            <span className="demo-badge" title="企业、事件、报告与指标均为合成内容">DEMO DATA</span>
            <button className="icon-button" onClick={() => openDrawer("ai")} aria-label="打开 AI 证据助手" title="AI 证据助手"><Sparkles /></button>
            <button className="icon-button notification-button" onClick={() => openDrawer("notifications")} aria-label="打开通知" title="通知">
              <Bell /><span>{notifications.length}</span>
            </button>
          </div>
        </header>

        {root !== "dashboard" && <div className="context-bar" aria-label="全局筛选" aria-busy={!filtersReady}>
          <label><span>报告年</span><select disabled={!filtersReady} value={year} onChange={(event) => setFilters({ year: Number(event.target.value) })}><option>2025</option><option>2024</option><option>2023</option></select></label>
          <label><span>行业</span><select disabled={!filtersReady} value={industry} onChange={(event) => setFilters({ industry: event.target.value })}><option>全部行业</option><option>新材料</option><option>综合能源</option><option>交通设备</option><option>消费品</option><option>电子制造</option><option>建筑</option></select></label>
          <label><span>风险</span><select disabled={!filtersReady} value={risk} onChange={(event) => setFilters({ risk: event.target.value })}><option>全部风险</option><option>高风险</option><option>中风险</option><option>低风险</option><option>暂不可评分</option></select></label>
          {(industry !== "全部行业" || risk !== "全部风险" || year !== 2025) && <button className="text-button" disabled={!filtersReady} onClick={() => setFilters({ year: 2025, industry: "全部行业", risk: "全部风险" })}>清除筛选</button>}
          <span className="context-count">合成样本 · 口径截至 {year}</span>
        </div>}

        <main className={`main-content ${root === "dashboard" || pathname.includes("/companies/") ? "evidence-grid-bg" : ""}`}>{children}</main>
        <div className="global-demo-notice">演示数据：企业、事件、报告与指标均为合成内容，不代表任何真实主体。</div>
      </div>
      <button className={`mobile-scrim ${mobileNav ? "visible" : ""}`} onClick={() => setMobileNav(false)} aria-label="关闭导航遮罩" />
      <GlobalLayers />
    </div>
  );
}
