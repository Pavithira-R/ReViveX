// Member 1 – Problem reports
import prisma from '../utils/prisma';
import { AppError, validationError } from '../utils';
import {
  CreateReportDTO,
  ProblemReportView,
  REPORT_MESSAGE_MAX,
  REPORT_MESSAGE_MIN,
  ReportStatus,
} from '../types';

const SCREEN_MAX = 50;
const LIST_LIMIT = 100;

type ReportRecord = {
  id: string;
  screen: string | null;
  message: string;
  status: string;
  resolvedAt: Date | null;
  createdAt: Date;
  user: { id: string; name: string; email: string };
};

const reporterSelect = { user: { select: { id: true, name: true, email: true } } } as const;

const toView = (r: ReportRecord): ProblemReportView => ({
  id: r.id,
  screen: r.screen,
  message: r.message,
  status: r.status as ReportStatus,
  reporter: r.user,
  resolvedAt: r.resolvedAt,
  createdAt: r.createdAt,
});

export class ReportService {
  /** A signed-in user reports a problem (from a shake or the Profile button). */
  async create(userId: string, input: CreateReportDTO): Promise<ProblemReportView> {
    const message = typeof input?.message === 'string' ? input.message.trim() : '';
    const errors: string[] = [];
    if (message.length < REPORT_MESSAGE_MIN) {
      errors.push(`Please describe the problem (at least ${REPORT_MESSAGE_MIN} characters)`);
    } else if (message.length > REPORT_MESSAGE_MAX) {
      errors.push(`Description must be at most ${REPORT_MESSAGE_MAX} characters`);
    }
    if (input?.screen !== undefined && input.screen !== null && typeof input.screen !== 'string') {
      errors.push('Screen must be text');
    }
    if (errors.length) throw validationError(errors);

    const screen =
      typeof input.screen === 'string' && input.screen.trim()
        ? input.screen.trim().slice(0, SCREEN_MAX)
        : null;

    const created = await prisma.problemReport.create({
      data: { userId, message, screen },
      include: reporterSelect,
    });
    return toView(created);
  }

  /** Admin: newest reports first, optionally only OPEN or RESOLVED ones. */
  async list(status?: unknown): Promise<ProblemReportView[]> {
    if (status !== undefined && status !== 'OPEN' && status !== 'RESOLVED') {
      throw validationError(['status must be OPEN or RESOLVED']);
    }
    const reports = await prisma.problemReport.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: LIST_LIMIT,
      include: reporterSelect,
    });
    return reports.map(toView);
  }

  /** Admin: mark a report as resolved. Resolving twice is harmless. */
  async resolve(reportId: string): Promise<ProblemReportView> {
    const existing = await prisma.problemReport.findUnique({ where: { id: reportId } });
    if (!existing) throw new AppError('Report not found', 404, 'NOT_FOUND');

    const updated = await prisma.problemReport.update({
      where: { id: reportId },
      data: { status: 'RESOLVED', resolvedAt: existing.resolvedAt ?? new Date() },
      include: reporterSelect,
    });
    return toView(updated);
  }
}

export const reportService = new ReportService();
