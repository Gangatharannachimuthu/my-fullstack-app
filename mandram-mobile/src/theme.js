/**
 * One place for colour and spacing, so screens stay consistent without each one
 * inventing its own palette. Values mirror the web app (indigo primary, slate
 * greys) so the two feel like the same product.
 */
export const colors = {
  primary: '#4f46e5',
  primaryDark: '#3730a3',
  bg: '#f1f5f9',
  card: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  success: '#059669',
  successBg: '#d1fae5',
  warning: '#b45309',
  warningBg: '#fef3c7',
  danger: '#dc2626',
  dangerBg: '#fee2e2',
  headerBg: '#1e293b',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const radius = { sm: 6, md: 10, lg: 14 };

export const font = {
  h1: { fontSize: 22, fontWeight: '700', color: colors.text },
  h2: { fontSize: 17, fontWeight: '700', color: colors.text },
  label: { fontSize: 12, color: colors.textMuted },
  value: { fontSize: 15, color: colors.text },
  small: { fontSize: 12, color: colors.textMuted },
};

/** Indian-format rupees, e.g. 1,05,870.00 — matches how the web app reads. */
export function rupees(value) {
  const n = Number(value || 0);
  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function monthLabel(month, year) {
  if (!month || !year) return '-';
  return `${MONTHS[month]} ${year}`;
}
