import { describe, expect, it } from "vitest";
import { demoRepository } from "./demo-repository";

describe("demoRepository", () => {
  it("returns stable synthetic company data through the repository contract", async () => {
    const items = await demoRepository.listCompanies();
    expect(items).toHaveLength(6);
    expect(items[0]).toMatchObject({ companyId: "cy-materials", reportYear: 2025, riskScore: 78 });
  });

  it("supports empty and error acceptance scenarios", async () => {
    await expect(demoRepository.listCompanies("empty")).resolves.toEqual([]);
    await expect(demoRepository.listCompanies("error")).rejects.toThrow("演示数据载入失败");
  });

  it("keeps evidence scoped to the requested synthetic company", async () => {
    const items = await demoRepository.listEvidence("cy-materials");
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items.every((item) => item.companyId === "cy-materials")).toBe(true);
  });
});
