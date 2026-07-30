"use client";

import { Suspense } from "react";
import { DashboardCommandCenter } from "@/features/dashboard-command-center/command-center";

export default function DashboardPage() {
  return <Suspense fallback={<div className="command-center-loading" aria-label="正在加载风险观测站"><span/><span/><span/></div>}><DashboardCommandCenter /></Suspense>;
}
