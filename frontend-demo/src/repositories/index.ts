import type { AnalysisRepository } from "@/repositories/analysis-repository";
import { demoRepository } from "@/repositories/demo-repository";
import { HttpAnalysisRepository } from "@/repositories/http-analysis-repository";

export type { AnalysisRepository, CompanyYearQuery, DemoScenario } from "@/repositories/analysis-repository";

const repositoryMode = process.env.NEXT_PUBLIC_ANALYSIS_REPOSITORY ?? "mock";
const apiBaseUrl = process.env.NEXT_PUBLIC_ANALYSIS_API_BASE_URL ?? "/api/v1";

export const analysisRepository: AnalysisRepository = repositoryMode === "http"
  ? new HttpAnalysisRepository(apiBaseUrl)
  : demoRepository;

export const analysisRepositoryMode = repositoryMode === "http" ? "http" : "mock";
