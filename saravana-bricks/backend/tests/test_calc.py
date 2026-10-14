from decimal import Decimal as D

import pytest

from services.calc import compute_order, compute_payment, compute_purchase, round_money
from services.validation import ValidationError


def test_plain_order_total_is_quantity_times_rate():
    result = compute_order(1000, D("8.50"))
    assert result["subtotal"] == D("8500.00")
    assert result["total_amount"] == D("8500.00")
    assert result["cgst_amount"] == result["sgst_amount"] == result["igst_amount"] == D("0.00")


def test_order_with_discount_intra_state_gst_and_charges():
    result = compute_order(
        2000, D("5.00"), discount=D("500.00"), tax_type="cgst_sgst",
        gst_rate=D("18"), additional_charges=D("750.00"),
    )
    assert result["subtotal"] == D("10000.00")
    assert result["taxable_amount"] == D("9500.00")
    assert result["cgst_amount"] == D("855.00")
    assert result["sgst_amount"] == D("855.00")
    assert result["igst_amount"] == D("0.00")
    assert result["total_amount"] == D("11960.00")


def test_order_inter_state_uses_igst_only():
    result = compute_order(1000, D("10.00"), tax_type="igst", gst_rate=D("12"))
    assert (result["cgst_amount"], result["sgst_amount"]) == (D("0.00"), D("0.00"))
    assert result["igst_amount"] == D("1200.00")
    assert result["total_amount"] == D("11200.00")


def test_rounding_is_half_up_to_paise():
    assert round_money(D("0.005")) == D("0.01")
    assert round_money(D("2.675")) == D("2.68")  # a float would give 2.67
    # 333 × 0.15 = 49.95; 5% split -> 1.24875 each half -> 1.25
    result = compute_order(333, D("0.15"), tax_type="cgst_sgst", gst_rate=D("5"))
    assert result["cgst_amount"] == D("1.25")
    assert result["total_amount"] == D("52.45")


def test_decimal_avoids_float_drift():
    # 0.1 + 0.2 style errors must not appear in stored totals.
    result = compute_order(3, D("0.10"), additional_charges=D("0.20"))
    assert result["total_amount"] == D("0.50")


def test_discount_larger_than_subtotal_is_rejected():
    with pytest.raises(ValidationError) as err:
        compute_order(10, D("5.00"), discount=D("51.00"))
    assert "discount_amount" in err.value.fields


def test_gst_rate_required_when_taxed():
    with pytest.raises(ValidationError):
        compute_order(10, D("5.00"), tax_type="igst", gst_rate=None)


def test_payment_status_and_balance():
    assert compute_payment(D("8500.00"), None) == (D("0.00"), D("8500.00"), "Unpaid")
    assert compute_payment(D("8500.00"), D("3000.00")) == (D("3000.00"), D("5500.00"), "Partially Paid")
    assert compute_payment(D("8500.00"), D("8500.00")) == (D("8500.00"), D("0.00"), "Paid")
    with pytest.raises(ValidationError):
        compute_payment(D("8500.00"), D("8500.01"))


def test_purchase_rate_based_tax():
    result = compute_purchase(D("20000.00"), discount=D("1000.00"), tax_type="cgst_sgst", gst_rate=D("28"),
                              other_charges=D("500.00"))
    assert result["taxable_amount"] == D("19000.00")
    assert result["cgst_amount"] == result["sgst_amount"] == D("2660.00")
    assert result["total_amount"] == D("24820.00")


def test_purchase_manual_tax_cannot_mix_igst_with_cgst_sgst():
    with pytest.raises(ValidationError) as err:
        compute_purchase(D("1000.00"), tax_type="cgst_sgst", tax_entry="manual",
                         manual_tax=(D("90.00"), D("90.00"), D("180.00")))
    assert "igst_amount" in err.value.fields
    with pytest.raises(ValidationError):
        compute_purchase(D("1000.00"), tax_type="igst", tax_entry="manual",
                         manual_tax=(D("90.00"), D("0.00"), D("180.00")))
    with pytest.raises(ValidationError):
        compute_purchase(D("1000.00"), tax_type="none", tax_entry="manual",
                         manual_tax=(D("0.00"), D("0.00"), D("1.00")))


def test_purchase_manual_tax_accepted_when_consistent():
    result = compute_purchase(D("1000.00"), tax_type="igst", tax_entry="manual",
                              manual_tax=(D("0.00"), D("0.00"), D("179.99")))
    assert result["total_amount"] == D("1179.99")
