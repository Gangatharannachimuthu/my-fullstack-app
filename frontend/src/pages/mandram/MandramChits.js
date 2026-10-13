import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { chitService } from '../../services/mandramApi';
import IconButton from './IconButton';

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function meetingLabel(month, year) {
  if (!month || !year) return '-';
  return `${MONTH_NAMES[month]} ${year}`;
}

const EMPTY_FORM = {
  initiate_date: '',
  host_name: '',
  agent_amount: '',
  auction_count: '',
  amount_taken: '',
  note: '',
};

function dateLabel(value) {
  if (!value) return '-';
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Chit register. Unlike the Investments tab (month-by-month cash paid in and
 * commission received), a row here is written once - when the mandram wins an
 * auction and takes the chit - so the tab lists every chit across all months
 * rather than being scoped to the selected meeting.
 */
function MandramChits({ meetings = [], selectedMeetingId, canEdit = true }) {
  const [chits, setChits] = useState([]);
  const [yearFilter, setYearFilter] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [takenMeetingId, setTakenMeetingId] = useState(selectedMeetingId || '');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  const refresh = useCallback(async () => {
    const res = await chitService.getAll(yearFilter ? { year: yearFilter } : undefined);
    setChits(res.data || []);
  }, [yearFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    // Default the "taken in" month to whatever meeting is selected up top.
    if (selectedMeetingId) setTakenMeetingId((current) => current || selectedMeetingId);
  }, [selectedMeetingId]);

  const years = useMemo(
    () => [...new Set(meetings.map((m) => m.year))].sort((a, b) => b - a),
    [meetings]
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!takenMeetingId) {
      setError('Pick the meeting the chit was taken in');
      return;
    }
    try {
      setError('');
      await chitService.create({
        meeting_id: Number(takenMeetingId),
        initiate_date: form.initiate_date || null,
        host_name: form.host_name,
        agent_amount: Number(form.agent_amount || 0),
        auction_count: Number(form.auction_count || 0),
        amount_taken: Number(form.amount_taken || 0),
        note: form.note,
      });
      setForm(EMPTY_FORM);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add chit');
    }
  };

  const startEdit = (chit) => {
    setEditingId(chit.id);
    setEditValues({
      meeting_id: chit.meeting_id,
      initiate_date: chit.initiate_date || '',
      host_name: chit.host_name,
      agent_amount: chit.agent_amount,
      auction_count: chit.auction_count,
      amount_taken: chit.amount_taken,
      note: chit.note || '',
    });
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = async (chitId) => {
    try {
      setError('');
      await chitService.update(chitId, {
        meeting_id: Number(editValues.meeting_id),
        initiate_date: editValues.initiate_date || null,
        host_name: editValues.host_name,
        agent_amount: Number(editValues.agent_amount || 0),
        auction_count: Number(editValues.auction_count || 0),
        amount_taken: Number(editValues.amount_taken || 0),
        note: editValues.note,
      });
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update chit');
    }
  };

  const handleDelete = async (chitId) => {
    if (!window.confirm('Remove this chit?')) return;
    try {
      setError('');
      await chitService.remove(chitId);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove chit');
    }
  };

  const totalTaken = chits.reduce((sum, c) => sum + Number(c.amount_taken || 0), 0);
  const totalCommitted = chits.reduce((sum, c) => sum + Number(c.total_committed || 0), 0);
  const totalCommission = chits.reduce((sum, c) => sum + Number(c.total_commission || 0), 0);

  return (
    <div className="card">
      <h2>Chit Management (சீட்டு நிர்வாகம்)</h2>
      <p className="muted-note">
        One row per chit the mandram has <strong>taken</strong> (won the auction for). The amount
        taken is added to that month&apos;s Balance Roll-Forward. Month-by-month chit payments and
        commission still belong on the Investments tab — <strong>Total Commission</strong> here is
        the running sum of the commission on the Investments entries linked to that chit, shown for
        reference only.
      </p>
      {error && <div className="alert alert-error">{error}</div>}

      {canEdit && (
        <form onSubmit={handleAdd} className="inline-form" style={{ marginBottom: 16 }}>
          <input
            type="date"
            title="Initiate date — when the chit scheme started"
            value={form.initiate_date}
            onChange={(e) => setForm({ ...form, initiate_date: e.target.value })}
          />
          <select value={takenMeetingId} onChange={(e) => setTakenMeetingId(e.target.value)} required>
            <option value="">Taken in meeting...</option>
            {meetings.map((m) => (
              <option key={m.id} value={m.id}>
                {meetingLabel(m.month, m.year)}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Chit host name"
            value={form.host_name}
            onChange={(e) => setForm({ ...form, host_name: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Agent amount (monthly)"
            value={form.agent_amount}
            onChange={(e) => setForm({ ...form, agent_amount: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Auction count"
            value={form.auction_count}
            onChange={(e) => setForm({ ...form, auction_count: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Chit amount taken"
            value={form.amount_taken}
            onChange={(e) => setForm({ ...form, amount_taken: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Note (optional)"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
          <button type="submit" className="btn btn-primary">Add Chit</button>
        </form>
      )}

      <div className="mandram-meeting-picker" style={{ marginBottom: 12 }}>
        <label>Year:</label>
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {chits.length === 0 ? (
        <p>No chits recorded yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Initiate Date</th>
              <th>Taken In</th>
              <th>Chit Host</th>
              <th>Agent Amount</th>
              <th>Auction Count</th>
              <th>Total Committed</th>
              <th>Total Commission</th>
              <th>Amount Taken</th>
              <th>Note</th>
              {canEdit && <th></th>}
            </tr>
          </thead>
          <tbody>
            {chits.map((c) =>
              editingId === c.id ? (
                <tr key={c.id}>
                  <td>
                    <input
                      type="date"
                      value={editValues.initiate_date}
                      onChange={(ev) => setEditValues({ ...editValues, initiate_date: ev.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      value={editValues.meeting_id}
                      onChange={(ev) => setEditValues({ ...editValues, meeting_id: ev.target.value })}
                    >
                      {meetings.map((m) => (
                        <option key={m.id} value={m.id}>
                          {meetingLabel(m.month, m.year)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editValues.host_name}
                      onChange={(ev) => setEditValues({ ...editValues, host_name: ev.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      style={{ width: 90 }}
                      value={editValues.agent_amount}
                      onChange={(ev) => setEditValues({ ...editValues, agent_amount: ev.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      style={{ width: 70 }}
                      value={editValues.auction_count}
                      onChange={(ev) => setEditValues({ ...editValues, auction_count: ev.target.value })}
                    />
                  </td>
                  <td>
                    ₹{(Number(editValues.agent_amount || 0) * Number(editValues.auction_count || 0)).toFixed(2)}
                  </td>
                  <td>₹{Number(c.total_commission || 0).toFixed(2)}</td>
                  <td>
                    <input
                      type="number"
                      style={{ width: 90 }}
                      value={editValues.amount_taken}
                      onChange={(ev) => setEditValues({ ...editValues, amount_taken: ev.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editValues.note}
                      onChange={(ev) => setEditValues({ ...editValues, note: ev.target.value })}
                    />
                  </td>
                  <td>
                    <div className="icon-btn-group">
                      <IconButton icon={Check} variant="save" title="Save" onClick={() => saveEdit(c.id)} />
                      <IconButton icon={X} variant="cancel" title="Cancel" onClick={cancelEdit} />
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={c.id}>
                  <td>{dateLabel(c.initiate_date)}</td>
                  <td>{meetingLabel(c.meeting_month, c.meeting_year)}</td>
                  <td>{c.host_name}</td>
                  <td>₹{Number(c.agent_amount).toFixed(2)}</td>
                  <td>{c.auction_count}</td>
                  <td>₹{Number(c.total_committed || 0).toFixed(2)}</td>
                  <td>₹{Number(c.total_commission || 0).toFixed(2)}</td>
                  <td>₹{Number(c.amount_taken).toFixed(2)}</td>
                  <td>{c.note || '-'}</td>
                  {canEdit && (
                    <td>
                      <div className="icon-btn-group">
                        <IconButton icon={Pencil} variant="edit" title="Edit" onClick={() => startEdit(c)} />
                        <IconButton icon={Trash2} variant="remove" title="Remove" onClick={() => handleDelete(c.id)} />
                      </div>
                    </td>
                  )}
                </tr>
              )
            )}
            <tr>
              <td className="font-weight-bold" colSpan={5}>Total</td>
              <td className="font-weight-bold">₹{totalCommitted.toFixed(2)}</td>
              <td className="font-weight-bold">₹{totalCommission.toFixed(2)}</td>
              <td className="font-weight-bold">₹{totalTaken.toFixed(2)}</td>
              <td></td>
              {canEdit && <td></td>}
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

export default MandramChits;
