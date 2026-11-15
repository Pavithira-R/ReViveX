// Member 1 – Problem reports

export const REPORT_MESSAGE_MIN = 5;
export const REPORT_MESSAGE_MAX = 1000;

export type ReportStatus = 'OPEN' | 'RESOLVED';

export interface ProblemReportView {
  id: string;
  screen: string | null;
  message: string;
  status: ReportStatus;
  reporter: { id: string; name: string; email: string };
  resolvedAt: Date | string | null;
  createdAt: Date | string;
}

/** Body of POST /api/reports. */
export interface CreateReportDTO {
  message?: unknown;
  screen?: unknown;
}
