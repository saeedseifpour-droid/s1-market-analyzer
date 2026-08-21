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

/**
 * Format date into Persian Jalali string (e.g. "۱۴۰۴/۱۲/۰۲" or "1404/12/02")
 */
export function getLiveJalaliDateString(offsetDays: number = 0, latinDigits: boolean = false): string {
  const d = getTehranDate(offsetDays);
  try {
    const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      timeZone: 'Asia/Tehran',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const formatted = formatter.format(d);
    
    if (latinDigits) {
      // Convert Persian digits to Latin
      return formatted.replace(/[۰-۹]/g, (w) => (w.charCodeAt(0) - 1776).toString());
    }
    return formatted;
  } catch {
    return offsetDays === 0 ? '۱۴۰۴/۱۲/۰۲' : '۱۴۰۴/۱۲/۰۱';
  }
}

/**
 * Get full verbose Jalali date with Persian month name (e.g. "۲ اسفند ۱۴۰۴")
 */
export function getLiveJalaliVerboseDate(offsetDays: number = 0): string {
  const d = getTehranDate(offsetDays);
  try {
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      timeZone: 'Asia/Tehran',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return 'امروز';
  }
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
    return '17:00';
  }
}

/**
 * Get full date-time string for logs and journals
 */
export function getLiveDateTimeString(offsetDays: number = 0, timeStr: string = '17:00'): string {
  return `${getLiveJalaliDateString(offsetDays, true)} ${timeStr}`;
}
