import React, { useState } from 'react';
import { MessageCircle, Phone, X } from 'lucide-react';

/**
 * Review-and-send panel for the Member Ledger's "Send Loan Reminders" button.
 *
 * Sending goes through a wa.me / sms: link rather than an API, so it costs
 * nothing and needs no account - the admin's own WhatsApp (or SMS app) opens
 * with the text already filled in and they press send. Because the browser can
 * only hand off one chat at a time, this is deliberately one member at a time,
 * with a tick to track who has already been done.
 */
function LoanReminderDialog({ meetingLabel, reminders, onClose }) {
  const [sent, setSent] = useState({});

  const withLoans = reminders.filter((r) => r.has_loan_activity);
  const withoutLoans = reminders.filter((r) => !r.has_loan_activity);

  const openWhatsApp = (reminder) => {
    const url = `https://wa.me/${reminder.phone_dialable}?text=${encodeURIComponent(reminder.message)}`;
    window.open(url, '_blank', 'noopener');
    setSent((prev) => ({ ...prev, [reminder.member_id]: 'whatsapp' }));
  };

  const openSms = (reminder) => {
    // `?body=` is the widely supported form; on iOS it needs `&body=`, but the
    // number still lands correctly either way.
    const url = `sms:+${reminder.phone_dialable}?body=${encodeURIComponent(reminder.message)}`;
    window.location.href = url;
    setSent((prev) => ({ ...prev, [reminder.member_id]: 'sms' }));
  };

  return (
    <div className="reminder-backdrop" onClick={onClose}>
      <div className="reminder-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="reminder-header">
          <h3>Loan Reminders — {meetingLabel}</h3>
          <button type="button" className="reminder-close" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <p className="muted-note">
          Each message opens in your own WhatsApp with the text already filled in — you press send
          there. Nothing is sent automatically, and nothing is charged.
        </p>

        {withLoans.length === 0 ? (
          <p>No member has loan activity in this month, so there is nothing to remind about.</p>
        ) : (
          withLoans.map((r) => (
            <div key={r.member_id} className="reminder-card">
              <div className="reminder-card-head">
                <strong>{r.member_name}</strong>
                <span className="reminder-phone">{r.phone || 'no number on file'}</span>
                {sent[r.member_id] && <span className="badge badge-success">opened</span>}
              </div>
              <pre className="reminder-message">{r.message}</pre>
              <div className="icon-btn-group">
                <button
                  type="button"
                  className="btn btn-primary btn-with-icon"
                  onClick={() => openWhatsApp(r)}
                  disabled={!r.phone_dialable}
                  title={r.phone_dialable ? 'Open WhatsApp' : 'No usable mobile number'}
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </button>
                <button
                  type="button"
                  className="btn btn-with-icon"
                  onClick={() => openSms(r)}
                  disabled={!r.phone_dialable}
                  title={r.phone_dialable ? 'Open SMS app' : 'No usable mobile number'}
                >
                  <Phone size={16} />
                  SMS
                </button>
              </div>
              {!r.phone_dialable && (
                <div className="alert alert-error" style={{ marginTop: 8 }}>
                  No usable mobile number — add one on the Members tab.
                </div>
              )}
            </div>
          ))
        )}

        {withoutLoans.length > 0 && (
          <p className="muted-note" style={{ marginTop: 14 }}>
            Skipped (no loan this month): {withoutLoans.map((r) => r.member_name).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}

export default LoanReminderDialog;
