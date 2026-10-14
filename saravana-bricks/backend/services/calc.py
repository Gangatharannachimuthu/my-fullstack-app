"""Money arithmetic. Everything is Decimal, rounded half-up to paise.

The browser shows a live preview, but these functions are the only source of the
totals that get stored.
"""

from decimal import ROUND_HALF_UP, Decimal

from services.validation import ValidationError

PAISE = Decimal("0.01")
ZERO = Decimal("0.00")
HUNDRED = Decimal("100")


def round_money(value):
    return Decimal(value).quantize(PAISE, rounding=ROUND_HALF_UP)


def tax_from_rate(taxable, tax_type, gst_rate):
    """Return (cgst, sgst, igst) for a taxable amount.

    Intra-state (cgst_sgst) splits the rate in half; inter-state (igst) applies it
    whole. The three are never all charged on the same amount.
    """
    if tax_type == "none":
        return ZERO, ZERO, ZERO
    if gst_rate is None:
        raise ValidationError({"gst_rate": "GST rate is required for the selected tax treatment."})
    if tax_type == "cgst_sgst":
        half = round_money(taxable * gst_rate / HUNDRED / 2)
        return half, half, ZERO
    if tax_type == "igst":
        return ZERO, ZERO, round_money(taxable * gst_rate / HUNDRED)
    raise ValidationError({"tax_type": "Unknown tax treatment."})


def check_manual_tax(tax_type, cgst, sgst, igst):
    """Manually entered tax amounts must match the selected treatment."""
    errors = {}
    if tax_type == "none":
        for field, amount in (("cgst_amount", cgst), ("sgst_amount", sgst), ("igst_amount", igst)):
            if amount != ZERO:
                errors[field] = "No tax is selected, so this must be zero."
    elif tax_type == "cgst_sgst":
        if igst != ZERO:
            errors["igst_amount"] = "IGST cannot be charged together with CGST + SGST."
    elif tax_type == "igst":
        for field, amount in (("cgst_amount", cgst), ("sgst_amount", sgst)):
            if amount != ZERO:
                errors[field] = "CGST/SGST cannot be charged together with IGST."
    if errors:
        raise ValidationError(errors)
    return cgst, sgst, igst


def compute_order(quantity, rate_per_brick, discount=ZERO, tax_type="none",
                  gst_rate=None, additional_charges=ZERO):
    subtotal = round_money(Decimal(quantity) * rate_per_brick)
    if discount > subtotal:
        raise ValidationError({"discount_amount": "Discount cannot be more than the subtotal."})
    taxable = subtotal - discount
    cgst, sgst, igst = tax_from_rate(taxable, tax_type, gst_rate)
    total = taxable + cgst + sgst + igst + additional_charges
    return {
        "subtotal": subtotal,
        "discount_amount": discount,
        "taxable_amount": taxable,
        "cgst_amount": cgst,
        "sgst_amount": sgst,
        "igst_amount": igst,
        "additional_charges": additional_charges,
        "total_amount": total,
    }


def compute_payment(total, amount_paid):
    """Return (amount_paid, balance_due, payment_status)."""
    paid = amount_paid if amount_paid is not None else ZERO
    if paid > total:
        raise ValidationError({"amount_paid": "Amount paid cannot be more than the final total."})
    balance = total - paid
    if paid == ZERO and total > ZERO:
        status = "Unpaid"
    elif balance == ZERO:
        status = "Paid"
    else:
        status = "Partially Paid"
    return paid, balance, status


def compute_purchase(subtotal, discount=ZERO, tax_type="none", tax_entry="rate",
                     gst_rate=None, manual_tax=(ZERO, ZERO, ZERO), other_charges=ZERO):
    if discount > subtotal:
        raise ValidationError({"discount_amount": "Discount cannot be more than the subtotal."})
    taxable = subtotal - discount
    if tax_entry == "manual":
        cgst, sgst, igst = check_manual_tax(tax_type, *manual_tax)
    else:
        cgst, sgst, igst = tax_from_rate(taxable, tax_type, gst_rate)
    total = taxable + cgst + sgst + igst + other_charges
    return {
        "subtotal": subtotal,
        "discount_amount": discount,
        "taxable_amount": taxable,
        "cgst_amount": cgst,
        "sgst_amount": sgst,
        "igst_amount": igst,
        "other_charges": other_charges,
        "total_amount": total,
    }
