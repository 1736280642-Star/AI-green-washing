import { companies, evidence } from "@/mocks/fixtures/companies";
import type { CompanyYearRecord, EvidenceItem } from "@/types";

export type DemoScenario = "success" | "empty" | "error" | "slow";

async function wait(scenario: DemoScenario) {
  await new Promise((resolve) => setTimeout(resolve, scenario === "slow" ? 900 : 280));
  if (scenario === "error") throw new Error("演示数据载入失败");
}

export const demoRepository = {
  async listCompanies(scenario: DemoScenario = "success"): Promise<CompanyYearRecord[]> {
    await wait(scenario);
    return scenario === "empty" ? [] : structuredClone(companies);
  },
  async getCompany(id: string, scenario: DemoScenario = "success"): Promise<CompanyYearRecord | null> {
    await wait(scenario);
    return structuredClone(companies.find((company) => company.companyId === id) ?? null);
  },
  async listEvidence(companyId: string, scenario: DemoScenario = "success"): Promise<EvidenceItem[]> {
    await wait(scenario);
    return scenario === "empty" ? [] : structuredClone(evidence.filter((item) => item.companyId === companyId));
  },
};
