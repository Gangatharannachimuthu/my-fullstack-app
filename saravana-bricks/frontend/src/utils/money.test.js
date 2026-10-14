import { describe, expect, it } from 'vitest';
import { formatDate, formatINR, rupeesInWords, todayLocal } from './format';
import { previewOrder, previewPurchase, purchaseSubtotalFromQty } from './money';

describe('previewOrder mirrors server rules', () => {
  it('quantity × rate', () => {
    expect(previewOrder({ quantity: '1000', rate: '8.50' }).total).toBe('8500.00');
  });

  it('discount, CGST+SGST and charges', () => {
    const r = previewOrder({
      quantity: '2000', rate: '5', discount: '500', taxType: 'cgst_sgst', gstRate: '18', additional: '750',
    });
    expect([r.taxable, r.cgst, r.sgst, r.total]).toEqual(['9500.00', '855.00', '855.00', '11960.00']);
  });

  it('rounds half-up to paise', () => {
    const r = previewOrder({ quantity: '333', rate: '0.15', taxType: 'cgst_sgst', gstRate: '5' });
    expect(r.cgst).toBe('1.25');
    expect(r.total).toBe('52.45');
  });

  it('rejects incomplete or invalid input', () => {
    expect(previewOrder({ quantity: '10.5', rate: '8' })).toBeNull();
    expect(previewOrder({ quantity: '10', rate: '' })).toBeNull();
    expect(previewOrder({ quantity: '10', rate: '-1' })).toBeNull();
  });

  it('flags overpayment', () => {
    expect(previewOrder({ quantity: '10', rate: '1', amountPaid: '11' }).overpaid).toBe(true);
  });
});

describe('purchases', () => {
  it('subtotal from fractional quantity', () => {
    expect(purchaseSubtotalFromQty('2.5', '1200')).toBe('3000.00');
    expect(purchaseSubtotalFromQty('', '1200')).toBeNull();
  });

  it('IGST rate based', () => {
    expect(previewPurchase({ subtotal: '1000', taxType: 'igst', gstRate: '18' }).total).toBe('1180.00');
  });
});

describe('formatting', () => {
  it('Indian currency and DD-MM-YYYY', () => {
    expect(formatINR('8500.00')).toBe('₹8,500.00');
    expect(formatINR('1250000')).toBe('₹12,50,000.00');
    expect(formatDate('2026-10-05')).toBe('05-10-2026');
  });

  it('today is computed in Asia/Kolkata', () => {
    // 20:00 UTC on 31 Oct is already 1 Nov in India.
    expect(todayLocal(new Date('2026-10-31T20:00:00Z'))).toBe('2026-11-01');
  });

  it('amount in words', () => {
    expect(rupeesInWords('8500.00')).toBe('Rupees Eight Thousand Five Hundred Only');
    expect(rupeesInWords('1250000.50')).toBe('Rupees Twelve Lakh Fifty Thousand and Fifty Paise Only');
  });
});
