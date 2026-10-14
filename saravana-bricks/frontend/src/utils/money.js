// Live preview of totals while a form is being filled in. Uses integer paise in
// BigInt so it never drifts like floating point. The server recalculates and its
// numbers are the ones saved - this only mirrors the same rules for display.

const ZERO = 0n;

/** Parse a non-negative decimal string with up to `places` decimals into scaled BigInt. */
export function parseScaled(value, places = 2) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (s === '') return null;
  const m = new RegExp(`^(\\d+)(?:\\.(\\d{0,${places}}))?$`).exec(s);
  if (!m) return undefined; // invalid
  return BigInt(m[1]) * 10n ** BigInt(places) + BigInt((m[2] || '').padEnd(places, '0') || '0');
}

/** n / d rounded half-up, for non-negative BigInts. */
function divHalfUp(n, d) {
  return (2n * n + d) / (2n * d);
}

export function paiseToString(p) {
  const neg = p < ZERO;
  const abs = neg ? -p : p;
  return `${neg ? '-' : ''}${abs / 100n}.${(abs % 100n).toString().padStart(2, '0')}`;
}

function taxes(taxablePaise, taxType, rateBp) {
  if (taxType === 'none' || rateBp === null || rateBp === undefined) return [ZERO, ZERO, ZERO];
  if (taxType === 'cgst_sgst') {
    const half = divHalfUp(taxablePaise * rateBp, 20000n);
    return [half, half, ZERO];
  }
  return [ZERO, ZERO, divHalfUp(taxablePaise * rateBp, 10000n)];
}

const val = (x) => (x === null || x === undefined ? ZERO : x);

/** Returns null when the inputs are not complete/valid enough to preview. */
export function previewOrder({ quantity, rate, discount, taxType = 'none', gstRate, additional, amountPaid }) {
  if (!/^\d+$/.test(String(quantity ?? '').trim())) return null;
  const qty = BigInt(String(quantity).trim());
  const ratePaise = parseScaled(rate);
  const disc = parseScaled(discount);
  const add = parseScaled(additional);
  const bp = parseScaled(gstRate);
  const paid = parseScaled(amountPaid);
  if (!ratePaise || [disc, add, bp, paid].includes(undefined)) return null;

  const subtotal = qty * ratePaise;
  const taxable = subtotal - val(disc);
  const [cgst, sgst, igst] = taxes(taxable, taxType, bp);
  const total = taxable + cgst + sgst + igst + val(add);
  const balance = total - val(paid);
  return {
    subtotal: paiseToString(subtotal),
    discount: paiseToString(val(disc)),
    taxable: paiseToString(taxable),
    cgst: paiseToString(cgst),
    sgst: paiseToString(sgst),
    igst: paiseToString(igst),
    additional: paiseToString(val(add)),
    total: paiseToString(total),
    paid: paiseToString(val(paid)),
    balance: paiseToString(balance),
    discountTooLarge: taxable < ZERO,
    overpaid: balance < ZERO,
  };
}

/** Purchase subtotal from quantity (3 decimals) × unit rate, or null if either is missing. */
export function purchaseSubtotalFromQty(quantity, rate) {
  const q = parseScaled(quantity, 3);
  const r = parseScaled(rate);
  if (q === null || r === null || q === undefined || r === undefined) return null;
  return paiseToString(divHalfUp(q * r, 1000n));
}

export function previewPurchase({ subtotal, discount, taxType = 'none', taxEntry = 'rate', gstRate,
  cgst, sgst, igst, other }) {
  const sub = parseScaled(subtotal);
  const disc = parseScaled(discount);
  const oth = parseScaled(other);
  const bp = parseScaled(gstRate);
  if (sub === null || sub === undefined || [disc, oth, bp].includes(undefined)) return null;

  const taxable = sub - val(disc);
  let t;
  if (taxEntry === 'manual') {
    t = [parseScaled(cgst), parseScaled(sgst), parseScaled(igst)];
    if (t.includes(undefined)) return null;
    t = t.map(val);
    if (taxType === 'none') t = [ZERO, ZERO, ZERO];
    if (taxType === 'cgst_sgst') t[2] = ZERO;
    if (taxType === 'igst') { t[0] = ZERO; t[1] = ZERO; }
  } else {
    t = taxes(taxable, taxType, bp);
  }
  const total = taxable + t[0] + t[1] + t[2] + val(oth);
  return {
    subtotal: paiseToString(sub),
    discount: paiseToString(val(disc)),
    taxable: paiseToString(taxable),
    cgst: paiseToString(t[0]),
    sgst: paiseToString(t[1]),
    igst: paiseToString(t[2]),
    other: paiseToString(val(oth)),
    total: paiseToString(total),
    discountTooLarge: taxable < ZERO,
  };
}
