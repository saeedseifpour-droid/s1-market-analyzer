import { StandardDailyInput13Sections, InputMetric, SystemS1Signal, ValidationAuditReport } from '../types';

export interface DailySnapshotRecord {
  id: string;
  jalaliDate: string;
  verboseDate: string;
  miladiDate: string;
  savedTimestamp: string;
  timeWindow: string;
  sections13: StandardDailyInput13Sections;
  inputs41?: InputMetric[];
  inputs?: InputMetric[];
  signal?: SystemS1Signal;
  auditReport?: ValidationAuditReport;
  auditSummary?: {
    totalChecks: number;
    passedChecks: number;
    warningsCount: number;
    isHealthy: boolean;
  };
}

const HISTORY_STORAGE_KEY = 'S1_DAILY_13_REPORTS_ARCHIVE_JSON';

/**
 * Get all historical daily 13-section JSON records stored locally
 */
export function getDailyHistoryArchive(): DailySnapshotRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => b.savedTimestamp.localeCompare(a.savedTimestamp));
    }
  } catch (err) {
    console.warn('Failed to parse history archive from localStorage:', err);
  }
  return [];
}

/**
 * Save or update today's 13-section report into the persistent history archive
 */
export function saveDailyReportToArchive(
  sections13: StandardDailyInput13Sections,
  inputs?: InputMetric[],
  signal?: SystemS1Signal,
  auditReport?: ValidationAuditReport
): DailySnapshotRecord[] {
  const currentArchive = getDailyHistoryArchive();
  const jalali = sections13?.metadata?.jalaliDate || 'امروز';
  const miladi = sections13?.metadata?.miladiDate || new Date().toISOString().split('T')[0];
  const now = new Date();
  const timeNow = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const snapshot: DailySnapshotRecord = {
    id: `snap_${miladi}_${jalali.replace(/\//g, '-')}`,
    jalaliDate: jalali,
    verboseDate: `${sections13?.metadata?.dayOfWeek || ''} ${jalali}`,
    miladiDate: miladi,
    savedTimestamp: now.toISOString(),
    timeWindow: sections13?.metadata?.updateTime || timeNow,
    sections13,
    inputs41: inputs,
    inputs: inputs,
    signal,
    auditReport,
    auditSummary: auditReport
      ? {
          totalChecks: auditReport.checks.length,
          passedChecks: auditReport.checks.filter((c) => c.status === 'passed').length,
          warningsCount: auditReport.checks.filter((c) => c.status === 'warning').length,
          isHealthy: auditReport.coreValidationStatus === 'VERIFIED_PERFECT' || auditReport.coreValidationStatus === 'VERIFIED_WITH_ADJUSTMENTS',
        }
      : undefined,
  };

  // Upsert by jalaliDate (or ID)
  const existingIdx = currentArchive.findIndex(
    (r) => r.jalaliDate === jalali || r.miladiDate === miladi
  );

  let updatedArchive: DailySnapshotRecord[];
  if (existingIdx >= 0) {
    updatedArchive = [...currentArchive];
    updatedArchive[existingIdx] = snapshot;
  } else {
    updatedArchive = [snapshot, ...currentArchive];
  }

  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedArchive));
  } catch (err) {
    console.warn('Failed to write to localStorage:', err);
  }

  return updatedArchive;
}

/**
 * Export history archive as a formatted JSON file download
 */
export function downloadHistoryArchiveJson(archive?: DailySnapshotRecord[]) {
  const data = archive || getDailyHistoryArchive();
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `S1_Daily_13_Reports_Archive_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export a single daily report snapshot as JSON file download
 */
export function downloadSingleReportJson(snapshot: DailySnapshotRecord) {
  const jsonStr = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `S1_Daily_Input_13_${snapshot.jalaliDate.replace(/\//g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
