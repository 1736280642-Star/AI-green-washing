"use client";

import { flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, type ColumnDef, type SortingState, useReactTable } from "@tanstack/react-table";
import { ArrowUpDown, Download, GitCompareArrows, Save, Search, Settings2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { demoRepository } from "@/repositories/demo-repository";
import { useDemoStore } from "@/stores/demo-store";
import type { CompanyYearRecord } from "@/types";

export default function CompaniesPage() {
  const router = useRouter();
  const [data, setData] = useState<CompanyYearRecord[]>([]);
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "riskScore", desc: true }]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [viewName, setViewName] = useState("");
  const { compareIds, toggleCompare, clearCompare, notify, showToast } = useDemoStore();

  useEffect(() => { demoRepository.listCompanies().then(setData); }, []);
  const columns = useMemo<ColumnDef<CompanyYearRecord>[]>(() => [
    { id: "select", header: "选择", cell: ({ row }) => <input type="checkbox" aria-label={`选择${row.original.companyName}`} checked={compareIds.includes(row.original.companyId)} onChange={() => { if (!toggleCompare(row.original.companyId)) showToast("最多同时比较 5 家"); }} /> },
    { accessorKey: "companyName", header: "公司", cell: ({ row }) => <button className="company-link" onClick={() => router.push(`/companies/${row.original.companyId}?year=2025`)}><strong>{row.original.companyName}</strong><small>{row.original.stockCode}</small></button> },
    { accessorKey: "industry", header: "行业" },
    { accessorKey: "reportYear", header: "年度" },
    { accessorKey: "riskScore", header: "风险分", cell: ({ getValue }) => <span className="risk-score">{getValue<number>()}</span> },
    { accessorKey: "claimPercentile", header: "声明分位" },
    { accessorKey: "factPercentile", header: "事实分位" },
    { accessorKey: "evidenceCoverage", header: "证据覆盖", cell: ({ getValue }) => <span>{getValue<number>()}%</span> },
    { accessorKey: "reviewStatus", header: "复核状态", cell: ({ getValue }) => <span className={`status-chip ${getValue<string>()}`}>{reviewLabel(getValue<CompanyYearRecord["reviewStatus"]>())}</span> },
    { accessorKey: "publishDate", header: "最近更新" },
  ], [compareIds, router, showToast, toggleCompare]);
  // TanStack Table intentionally returns non-memoizable functions; React Compiler skips this hook.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data, columns, state: { sorting, globalFilter: query }, onSortingChange: setSorting, onGlobalFilterChange: setQuery, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(), globalFilterFn: (row, _column, value) => `${row.original.companyName}${row.original.stockCode}${row.original.industry}`.toLowerCase().includes(String(value).toLowerCase()) });

  function exportCsv() {
    const rows = table.getRowModel().rows.map(({ original }) => [original.companyName, original.stockCode, original.industry, original.riskScore, original.evidenceCoverage]);
    const content = [["演示数据，不代表任何真实主体"], ["公司", "虚构代码", "行业", "风险分", "证据覆盖"], ...rows].map((row) => row.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "greenlens-companies-demo.csv"; anchor.click(); URL.revokeObjectURL(url);
    notify("企业视图已导出", `导出 ${rows.length} 条合成记录。`); showToast("企业视图已导出");
  }

  return <div className="page companies-page">
    <header className="page-header"><div><h2>企业库</h2><p>搜索合成公司，建立 2-5 家企业的可复现对比组。</p></div><div className="header-actions"><button className="secondary-button" onClick={() => setSaveOpen(true)}><Save size={15}/>保存视图</button><button className="secondary-button" title="列设置"><Settings2 size={15}/>列设置</button><button className="secondary-button" onClick={exportCsv}><Download size={15}/>导出</button></div></header>
    <section className="table-toolbar"><label className="search-field"><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索公司、虚构代码或行业" /></label><span>当前 {table.getRowModel().rows.length} 家</span></section>
    <section className="panel"><div className="data-table-wrap"><table className="data-table companies-table"><thead>{table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th key={header.id}>{header.isPlaceholder ? null : <button className="sort-header" onClick={header.column.getToggleSortingHandler()}>{flexRender(header.column.columnDef.header, header.getContext())}{header.column.getCanSort() && <ArrowUpDown size={12}/>}</button>}</th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map((row) => <tr key={row.id} className={compareIds.includes(row.original.companyId) ? "selected" : ""}>{row.getVisibleCells().map((cell) => <td key={cell.id} className={["riskScore", "claimPercentile", "factPercentile", "evidenceCoverage"].includes(cell.column.id) ? "numeric" : ""}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody></table></div></section>
    {compareIds.length > 0 && <div className="compare-bar"><span>已选 <strong>{compareIds.length}</strong> 家</span><button className="text-button" onClick={clearCompare}>清除</button><button className="primary-button" disabled={compareIds.length < 2} title={compareIds.length < 2 ? "至少选择 2 家企业" : undefined} onClick={() => router.push(`/compare?companies=${compareIds.join(",")}`)}><GitCompareArrows size={15}/>加入对比</button></div>}
    {saveOpen && <div className="modal-scrim"><section className="modal" role="dialog" aria-modal="true" aria-label="保存视图"><header><h3>保存当前视图</h3><button className="icon-button" onClick={() => setSaveOpen(false)} aria-label="关闭"><X/></button></header><div className="modal-body"><label className="field-label"><span>视图名称</span><input autoFocus value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder="例如：2025 高优先级样本" /></label></div><footer><button className="secondary-button" onClick={() => setSaveOpen(false)}>取消</button><button className="primary-button" disabled={!viewName.trim()} onClick={() => { setSaveOpen(false); showToast(`已保存视图“${viewName}”`); }}>保存视图</button></footer></section></div>}
  </div>;
}

function reviewLabel(status: CompanyYearRecord["reviewStatus"]) { return { pending: "待复核", partial: "部分复核", reviewed: "已复核", disputed: "存在争议" }[status]; }
