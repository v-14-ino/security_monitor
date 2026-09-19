import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5002/api';

export interface ReportMetadata {
  metadata: {
    target: string;
    scan_mode: string;
    scan_duration: string;
    generated_at: string;
    generator: string;
    report_version: string;
  };
  availability: {
    port_scan: boolean;
    port_count: number;
    web_security: boolean;
    cve_analysis: string;
  };
}

export interface PortEntry {
  port: number;
  service: string;
  product: string;
  version: string;
  extra_info?: string;
}

export interface PortAnalysis {
  available: boolean;
  open_port_count: number;
  ports: PortEntry[];
}

export interface ThreatEntry {
  port: number;
  service: string;
  product: string;
  version: string;
  severity: string;
  threat_type: string;
  title: string;
  description: string;
  recommendation: string;
  source: string;
}

export interface ThreatAnalysisData {
  total_threats: number;
  highest_severity: string;
  services_analyzed: number;
  threats: ThreatEntry[];
}

export interface ScoreBreakdown {
  category: string;
  points: number;
  reason: string;
}

export interface AttackSurface {
  total_open_ports: number;
  unique_services: number;
  unique_products: number;
  web_services: number;
  remote_access_services: number;
  mail_services: number;
  database_services: number;
  other_services: number;
}

export interface PriorityFinding {
  rank: number;
  port: number | string;
  service: string;
  product: string;
  severity: string;
  title: string;
  reason: string;
}

export interface Recommendation {
  priority: number;
  severity: string;
  title: string;
  recommendation: string;
  related_ports: (number | string)[];
}

export interface RiskSummary {
  overall_risk: string;
  risk_score: number;
  score_basis: string;
  exposed_ports: number;
  services_count: number;
  threat_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  informational_count: number;
  cve_count: number;
  outdated_software_count: number;
  affected_services: number;
}

export interface AttackAnalysisThreat {
  name: string;
  severity: string;
  description: string;
  reason: string;
}

export interface AttackAnalysisService {
  port: number | string;
  service: string;
  product: string;
  version: string;
  risk_level: string;
  threats: AttackAnalysisThreat[];
  cves: any[];
  recommendations: string[];
}

export interface AttackAnalysisData {
  summary: {
    total_ports: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    informational: number;
  };
  services: AttackAnalysisService[];
}

export interface DynamicPriorityFinding {
  title: string;
  severity: string;
  priority: number;
  source: string;
  affected_component: string;
  port: string | number;
  description: string;
  evidence: string;
  recommendation: string;
}

export interface DynamicServiceRisk {
  port: number | string;
  service: string;
  product: string;
  version: string;
  risk_level: string;
  risk_reason: string;
  evidence_sources: string[];
}

export interface DynamicRiskRecommendation {
  severity: string;
  priority: number;
  text: string;
}

export interface DynamicRiskAssessmentData {
  overall_risk: string;
  risk_score: number;
  explanation: string;
  severity_summary: {
    Critical: number;
    High: number;
    Medium: number;
    Low: number;
    Informational: number;
  };
  attack_surface_ports: number;
  priority_findings: DynamicPriorityFinding[];
  service_risk: DynamicServiceRisk[];
  recommendations: DynamicRiskRecommendation[];
}

export interface UploadResponse extends ReportMetadata {
  success: boolean;
  message: string;
  port_analysis: PortAnalysis;
  threat_analysis: ThreatAnalysisData;
  risk_summary: RiskSummary;
  attack_surface: AttackSurface;
  score_breakdown: ScoreBreakdown[];
  priority_findings: PriorityFinding[];
  recommendations: Recommendation[];
  attack_analysis: AttackAnalysisData;
  risk_assessment: DynamicRiskAssessmentData;
}

export const api = {
  uploadReport: async (file: File, signal?: AbortSignal): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<UploadResponse>(`${API_BASE_URL}/reports/upload`, formData, { signal });

    return response.data;
  },
};
