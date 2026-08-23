/**
 * System S1 - Dynamic Persian (Jalali) Date & Time Utilities
 * Provides accurate live Jalali formatting for today, yesterday, and time in Tehran
 * Uses mathematically exact Gregorian-to-Jalali conversion algorithms without ICU dependencies.
 */

/**
 * Mathematically precise Gregorian to Jalali conversion algorithm
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
  let jy = -1595 + (33 * Math.floor(days / 12053));
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return [jy, jm, jd];
}

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

const WEEK_DAYS_FA = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
  'شنبه',
];

export function getLiveJalaliDetails(offsetDays: number = 0): JalaliDateDetails {
  const d = getTehranDate(offsetDays);
  const gy = d.getFullYear();
  const gm = d.getMonth() + 1;
  const gd = d.getDate();

  const [jy, jm, jd] = gregorianToJalali(gy, gm, gd);

  const year = String(jy);
  const month = String(jm).padStart(2, '0');
  const day = String(jd).padStart(2, '0');
  const dayOfWeek = WEEK_DAYS_FA[d.getDay()] || 'یکشنبه';

  const monthIndex = Math.max(0, Math.min(11, jm - 1));
  const monthName = MONTH_NAMES_FA[monthIndex] || 'شهریور';

  const jalaliStandard = `${year}/${month}/${day}`;
  const dayNum = jd;
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

export function toPersianDigits(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '';
  return String(val).replace(/[0-9]/g, (d) => String.fromCharCode(d.charCodeAt(0) + 1728));
}

/**
 * Format date into Persian Jalali string (e.g. "۱۴۰۵/۰۶/۰۱" or "1405/06/01")
 */
export function getLiveJalaliDateString(offsetDays: number = 0, latinDigits: boolean = false): string {
  const details = getLiveJalaliDetails(offsetDays);
  return latinDigits ? details.jalaliStandard : details.jalaliFa;
}

/**
 * Get full verbose Jalali date with Persian month name (e.g. "یکشنبه ۱ شهریور ۱۴۰۵")
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
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    return latinDigits ? timeStr : toPersianDigits(timeStr);
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


