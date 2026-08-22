/**
 * System S1 - Dynamic Persian (Jalali) Date & Time Utilities
 * Provides accurate live Jalali formatting for today, yesterday, and time in Tehran
 */

export function getTehranDate(offsetDays: number = 0): Date {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  return d;
}

export interface JalaliDateDetails {
  year: string;
  month: string;
  day: string;
  monthName: string;
  dayOfWeek: string;
  jalaliStandard: string;
  jalaliFa: string;
  verbose: string;
  miladiDate: string;
  reportingWindow: string;
}

const MONTH_NAMES_FA = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export function getLiveJalaliDetails(offsetDays: number = 0): JalaliDateDetails {
  const d = getTehranDate(offsetDays);

  let year = '1405';
  let month = '05';
  let day = '31';
  let dayOfWeek = 'شنبه';

  try {
    const formatterDigits = new Intl.DateTimeFormat('en-US-u-ca-persian', {
      timeZone: 'Asia/Tehran',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatterDigits.formatToParts(d);
    year = parts.find((p) => p.type === 'year')?.value || '1405';
    month = parts.find((p) => p.type === 'month')?.value || '05';
    day = parts.find((p) => p.type === 'day')?.value || '31';

    const weekDayFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      timeZone: 'Asia/Tehran',
      weekday: 'long',
    });
    dayOfWeek = weekDayFormatter.format(d);
  } catch (err) {
    console.warn('Error formatting Jalali date with Intl:', err);
  }

  const monthIndex = Math.max(0, Math.min(11, parseInt(month, 10) - 1));
  const monthName = MONTH_NAMES_FA[monthIndex] || 'مرداد';

  const jalaliStandard = `${year}/${month}/${day}`;
  const dayNum = parseInt(day, 10);
  const jalaliFa = `${toPersianDigits(year)}/${toPersianDigits(month)}/${toPersianDigits(day)}`;
  const verbose = `${dayOfWeek} ${toPersianDigits(dayNum)} ${monthName} ${toPersianDigits(year)}`;

  const miladiYear = d.getFullYear();
  const miladiMonth = String(d.getMonth() + 1).padStart(2, '0');
  const miladiDay = String(d.getDate()).padStart(2, '0');
  const miladiDate = `${miladiYear}/${miladiMonth}/${miladiDay}`;

  return {
    year,
    month,
    day,
    monthName,
    dayOfWeek,
    jalaliStandard,
    jalaliFa,
    verbose,
    miladiDate,
    reportingWindow: '۱۷:۰۰ الی ۱۸:۰۰ عصر',
  };
}

export function toPersianDigits(val: string | number): string {
  return String(val).replace(/[0-9]/g, (d) => String.fromCharCode(d.charCodeAt(0) + 1728));
}

/**
 * Format date into Persian Jalali string (e.g. "۱۴۰۵/۰۵/۳۱" or "1405/05/31")
 */
export function getLiveJalaliDateString(offsetDays: number = 0, latinDigits: boolean = false): string {
  const details = getLiveJalaliDetails(offsetDays);
  return latinDigits ? details.jalaliStandard : details.jalaliFa;
}

/**
 * Get full verbose Jalali date with Persian month name (e.g. "شنبه ۳۱ مرداد ۱۴۰۵")
 */
export function getLiveJalaliVerboseDate(offsetDays: number = 0): string {
  return getLiveJalaliDetails(offsetDays).verbose;
}

/**
 * Get current time in Tehran (e.g. "17:30" or "۱۷:۳۰")
 */
export function getTehranTimeString(latinDigits: boolean = false): string {
  const d = new Date();
  try {
    const timeStr = new Intl.DateTimeFormat('fa-IR', {
      timeZone: 'Asia/Tehran',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);

    if (latinDigits) {
      return timeStr.replace(/[۰-۹]/g, (w) => (w.charCodeAt(0) - 1776).toString());
    }
    return timeStr;
  } catch {
    return latinDigits ? '17:30' : '۱۷:۳۰';
  }
}

/**
 * Get full date-time string for logs and journals
 */
export function getLiveDateTimeString(offsetDays: number = 0, timeStr: string = '17:00'): string {
  return `${getLiveJalaliDateString(offsetDays, true)} ${timeStr}`;
}

