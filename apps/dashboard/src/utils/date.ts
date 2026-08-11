export function getTimezoneMode(): 'UTC' | 'system' {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('prism_timezone_mode');
    if (saved === 'system') return 'system';
  }
  return 'UTC';
}

/**
 * Time formatting utility supporting UTC (default) or Local System Timezone
 */
export function formatTimestamp(timestamp: number | undefined | null): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  const isUtc = getTimezoneMode() === 'UTC';

  if (isUtc) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Returns default expiration date (7 days from now at 23:59:59 UTC or local)
 * Formatted as "YYYY-MM-DDTHH:mm:ss" for DateTimePicker input
 */
export function getDefaultExpirationIsoString(days: number = 7): string {
  const now = new Date();
  const target = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const isUtc = getTimezoneMode() === 'UTC';

  if (isUtc) {
    target.setUTCHours(23, 59, 59, 999);
    const year = target.getUTCFullYear();
    const month = String(target.getUTCMonth() + 1).padStart(2, '0');
    const day = String(target.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}T23:59:59`;
  }

  target.setHours(23, 59, 59, 999);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T23:59:59`;
}

/**
 * Convert datetime string (YYYY-MM-DDTHH:mm:ss) into epoch milliseconds timestamp based on active timezone mode
 */
export function datetimeStringToTimestamp(dtString: string): number {
  if (!dtString) return Date.now() + 7 * 24 * 60 * 60 * 1000;
  const isUtc = getTimezoneMode() === 'UTC';

  if (isUtc) {
    if (!dtString.endsWith('Z') && !dtString.includes('+')) {
      return new Date(`${dtString}Z`).getTime();
    }
    return new Date(dtString).getTime();
  }

  // Local system timezone parsing
  const parts = dtString.split('T');
  if (parts.length === 2) {
    const [y, m, d] = parts[0].split('-').map(Number);
    const [hh, mm, ss] = parts[1].split(':').map(Number);
    return new Date(y, m - 1, d, hh || 0, mm || 0, ss || 0).getTime();
  }
  return new Date(dtString).getTime();
}

/**
 * Convert epoch milliseconds timestamp into datetime value string (YYYY-MM-DDTHH:mm:ss) based on active timezone mode
 */
export function timestampToDatetimeString(timestamp: number): string {
  if (!timestamp) return getDefaultExpirationIsoString(7);
  const date = new Date(timestamp);
  const isUtc = getTimezoneMode() === 'UTC';

  if (isUtc) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}
