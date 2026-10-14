import { formatINR } from '../utils/format';

export const TAX_OPTIONS = [
  { value: 'none', label: 'No GST' },
  { value: 'cgst_sgst', label: 'CGST + SGST (within Tamil Nadu)' },
  { value: 'igst', label: 'IGST (other state)' },
];

const halfRate = (rate) => (rate ? `${Number(rate) / 2}%` : '');

/** Subtotal → discount → tax → extra charges → total, shared by purchase and order forms. */
export function TaxBreakdown({ preview, taxType, gstRate, extraLabel, extraKey, children }) {
  if (!preview) {
    return <p className="muted">Fill in the amounts to see the total.</p>;
  }
  const nonZero = (v) => v && Number(v) !== 0;
  return (
    <dl className="breakdown">
      <div><dt>Subtotal</dt><dd>{formatINR(preview.subtotal)}</dd></div>
      {nonZero(preview.discount) && <div><dt>Discount</dt><dd>− {formatINR(preview.discount)}</dd></div>}
      {(nonZero(preview.discount) || taxType !== 'none') && (
        <div><dt>Taxable amount</dt><dd>{formatINR(preview.taxable)}</dd></div>
      )}
      {taxType === 'cgst_sgst' && (
        <>
          <div><dt>CGST {halfRate(gstRate)}</dt><dd>{formatINR(preview.cgst)}</dd></div>
          <div><dt>SGST {halfRate(gstRate)}</dt><dd>{formatINR(preview.sgst)}</dd></div>
        </>
      )}
      {taxType === 'igst' && <div><dt>IGST {gstRate ? `${gstRate}%` : ''}</dt><dd>{formatINR(preview.igst)}</dd></div>}
      {nonZero(preview[extraKey]) && <div><dt>{extraLabel}</dt><dd>{formatINR(preview[extraKey])}</dd></div>}
      <div className="breakdown-total"><dt>Grand total</dt><dd>{formatINR(preview.total)}</dd></div>
      {children}
      {preview.discountTooLarge && <p className="field-error">Discount is more than the subtotal.</p>}
    </dl>
  );
}
