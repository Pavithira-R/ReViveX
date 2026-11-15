// Member 1 – Problem reports
import { apiRequest } from './api';
import { ProblemReport, ReportStatus } from '../types';

export const reportService = {
  send: (message: string, screen: string | null) =>
    apiRequest<ProblemReport>('POST', '/reports', { message, screen }),

  adminList: (status?: ReportStatus) =>
    apiRequest<ProblemReport[]>('GET', `/admin/reports${status ? `?status=${status}` : ''}`),

  adminResolve: (id: string) => apiRequest<ProblemReport>('PATCH', `/admin/reports/${id}/resolve`),
};
