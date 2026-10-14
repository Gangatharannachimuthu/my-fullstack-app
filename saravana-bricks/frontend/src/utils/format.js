export const BUSINESS_TZ = 'Asia/Kolkata';

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const count = new Intl.NumberFormat('en-IN');

/** "8500.00" -> "₹8,500.00". Values arrive from the server as decimal strings. */
export function formatINR(value) {
  if (value === null || value === undefined || value === '') return '—';
  return inr.format(Number(value));
}

export function formatCount(value) {
  if (value === null || value === undefined || value === '') return '—';
  return count.format(Number(value));
}

/** "2026-10-05" -> "05-10-2026". String-based, so no timezone shifts. */
export function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}-${m}-${y}`;
}

/** Today's calendar date in Asia/Kolkata as YYYY-MM-DD. */
export function todayLocal(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

export function currentMonth() {
  return todayLocal().slice(0, 7);
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

/** "2026-10" -> "October 2026" */
export function monthLabel(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

export function shortMonthLabel(ym) {
  const [y, m] = ym.split('-');
  return `${MONTHS[Number(m) - 1].slice(0, 3)} ${y}`;
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function belowHundred(n) {
  return n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`;
}

function belowThousand(n) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return [h ? `${ONES[h]} Hundred` : '', rest ? belowHundred(rest) : ''].filter(Boolean).join(' ');
}

/** Indian numbering (lakh/crore) for the "amount in words" line on invoices. */
export function rupeesInWords(value) {
  const [rupeePart, paisePart = '00'] = String(value ?? '0').split('.');
  let n = Number(rupeePart);
  const paise = Number(paisePart.padEnd(2, '0').slice(0, 2));
  if (!Number.isFinite(n)) return '';

  const parts = [];
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  if (crore) parts.push(`${belowThousand(crore)} Crore`);
  if (lakh) parts.push(`${belowHundred(lakh)} Lakh`);
  if (thousand) parts.push(`${belowHundred(thousand)} Thousand`);
  if (n) parts.push(belowThousand(n));

  let words = `Rupees ${parts.length ? parts.join(' ') : 'Zero'}`;
  if (paise) words += ` and ${belowHundred(paise)} Paise`;
  return `${words} Only`;
}
