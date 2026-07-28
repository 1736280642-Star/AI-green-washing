import { describe, expect, it, vi } from "vitest";
import { analysisMetricSchema, companyYearRecordSchema } from "./analysis";
import { demoRepository } from "@/repositories/demo-repository";
import { HttpAnalysisRepository } from "@/repositories/http-analysis-repository";
import { formatPercent } from "@/types";

const metric = {
  code: "IR" as const,
  label: "模糊声明比例",
  rawValue: null,
  riskValue: null,
  numerator: 0,
  denominator: 0,
  threshold: 0.33,
  riskDirection: "higher_is_risk" as const,
  formulaVersion: "ir-draft-v1",
  calculationStatus: "unavailable" as const,
  unavailableReason: "没有可作为分母的环境声明",
  evidenceIds: [],
};

describe("metric contract v1", () => {
  it("accepts null plus a reason when a metric denominator is zero", () => {
    expect(analysisMetricSchema.parse(metric)).toMatchObject({ rawValue: null, denominator: 0 });
  });

  it("rejects a fabricated zero when a metric denominator is zero", () => {
    expect(() => analysisMetricSchema.parse({ ...metric, rawValue: 0, riskValue: 0, unavailableReason: undefined })).toThrow(/零分母/);
    expect(formatPercent(null)).toBe("--");
  });

  it("validates synthetic company records at the repository boundary", async () => {
    const company = await demoRepository.getCompany("cy-materials");
    expect(() => companyYearRecordSchema.parse(company)).not.toThrow();
  });

  it("rejects duplicate metrics and empty formula versions", async () => {
    const company = await demoRepository.getCompany("cy-materials");
    expect(company).not.toBeNull();
    expect(() => companyYearRecordSchema.parse({ ...company!, metrics: [...company!.metrics, company!.metrics[0]] })).toThrow(/六项核心指标/);
    expect(() => companyYearRecordSchema.parse({ ...company!, metrics: company!.metrics.map((item, index) => index === 0 ? { ...item, formulaVersion: "" } : item) })).toThrow();
  });

  it("accepts an explicitly unavailable final index without fabricating zero", async () => {
    const company = await demoRepository.getCompany("cy-materials");
    expect(company).not.toBeNull();
    const unavailable = {
      ...company!,
      finalIndex: null,
      riskBand: "unavailable" as const,
      metrics: company!.metrics.map((item) => item.code === "EAA_ESGSI" ? { ...item, rawValue: null, riskValue: null, calculationStatus: "unavailable" as const, unavailableReason: "最终指数输入不完整" } : item),
      indexBreakdown: { ...company!.indexBreakdown, finalIndex: null },
    };
    expect(() => companyYearRecordSchema.parse(unavailable)).not.toThrow();
  });

  it("parses valid HTTP payloads and rejects schema drift", async () => {
    const company = await demoRepository.getCompany("cy-materials");
    const request = vi.fn(async () => new Response(JSON.stringify([company]), { status: 200, headers: { "Content-Type": "application/json" } }));
    const repository = new HttpAnalysisRepository("/api/v1", request as typeof fetch);
    await expect(repository.listCompanies()).resolves.toHaveLength(1);

    const invalidRequest = vi.fn(async () => new Response(JSON.stringify([{ ...company, finalIndex: 1.4 }]), { status: 200, headers: { "Content-Type": "application/json" } }));
    const invalidRepository = new HttpAnalysisRepository("/api/v1", invalidRequest as typeof fetch);
    await expect(invalidRepository.listCompanies()).rejects.toThrow();
  });

  it("passes report year through HTTP company-year lookups", async () => {
    const company = await demoRepository.getCompany("cy-materials");
    const request = vi.fn(async () => new Response(JSON.stringify(company), { status: 200, headers: { "Content-Type": "application/json" } }));
    const repository = new HttpAnalysisRepository("/api/v1", request as typeof fetch);
    await repository.getCompany("cy-materials", "success", 2025);
    expect(request).toHaveBeenCalledWith("/api/v1/company-years/cy-materials?reportYear=2025", expect.any(Object));
  });
});
