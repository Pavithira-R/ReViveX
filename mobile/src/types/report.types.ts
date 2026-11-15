// Member 1 – Problem reports

export type ReportStatus = 'OPEN' | 'RESOLVED';

export interface ProblemReport {
  id: string;
  screen: string | null;
  message: string;
  status: ReportStatus;
  reporter: { id: string; name: string; email: string };
  resolvedAt: string | null;
  createdAt: string;
}
