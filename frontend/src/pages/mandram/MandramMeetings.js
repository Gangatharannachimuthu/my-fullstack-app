import React, { useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { meetingService } from '../../services/mandramApi';
import IconButton from './IconButton';

function monthLabel(month, year) {
  const names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${names[month]} ${year}`;
}

function MandramMeetings({ meetings, onChanged, canEdit = true }) {
  const [meetingDate, setMeetingDate] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // Derived from the meetings themselves, so a new year appears in the dropdown as
  // soon as its first meeting is opened - nothing to hardcode or maintain.
  const years = [...new Set(meetings.map((m) => m.year))].sort((a, b) => b - a);

  const visibleMeetings = filterYear
    ? meetings.filter((m) => String(m.year) === String(filterYear))
    : meetings;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!meetingDate) return;
    try {
      setSubmitting(true);
      setError('');
      await meetingService.create({ meeting_date: meetingDate });
      setMeetingDate('');
      await onChanged();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create meeting');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (meeting) => {
    setEditingId(meeting.id);
    setEditDate(meeting.meeting_date);
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDate('');
  };

  const saveEdit = async (meetingId) => {
    try {
      setError('');
      await meetingService.update(meetingId, { meeting_date: editDate });
      setEditingId(null);
      await onChanged();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update meeting');
    }
  };

  const handleDelete = async (meeting) => {
    if (!window.confirm(`Remove the ${monthLabel(meeting.month, meeting.year)} meeting?`)) return;
    try {
      setError('');
      await meetingService.remove(meeting.id);
      await onChanged();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove meeting');
    }
  };

  return (
    <>
      {canEdit && (
        <div className="card">
          <h2>Open a New Monthly Meeting</h2>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleCreate} className="inline-form">
            <input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} required />
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Open Meeting'}
            </button>
          </form>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 10 }}>
            Opening balance is the previous month's live running balance until that month is finalized.
          </p>
        </div>
      )}

      <div className="card">
        <div className="summary-header-row">
          <h2>
            Meetings ({visibleMeetings.length}
            {filterYear ? ` of ${meetings.length}` : ''})
          </h2>
          {years.length > 0 && (
            <div className="month-filter-row">
              <label>Year:</label>
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                <option value="">All years</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {meetings.length === 0 ? (
          <p>No meetings recorded yet.</p>
        ) : visibleMeetings.length === 0 ? (
          <p>No meetings in {filterYear}.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Meeting Date</th>
                  <th>Opening Balance</th>
                  <th>Closing Balance</th>
                  <th>Trust Value</th>
                  <th>Status</th>
                  {canEdit && <th></th>}
                </tr>
              </thead>
              <tbody>
                {visibleMeetings.map((m) => (
                  <tr key={m.id}>
                    <td>{monthLabel(m.month, m.year)}</td>
                    <td>
                      {editingId === m.id ? (
                        <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                      ) : (
                        m.meeting_date
                      )}
                    </td>
                    <td>₹{Number(m.opening_balance || 0).toFixed(2)}</td>
                    <td>{m.closing_balance != null ? `₹${Number(m.closing_balance).toFixed(2)}` : '-'}</td>
                    <td>{m.trust_total_value != null ? `₹${Number(m.trust_total_value).toFixed(2)}` : '-'}</td>
                    <td>
                      <span className={`badge ${m.status === 'finalized' ? 'badge-success' : 'badge-warning'}`}>
                        {m.status}
                      </span>
                    </td>
                    {canEdit && (
                      <td>
                        {editingId === m.id ? (
                          <div className="icon-btn-group">
                            <IconButton icon={Check} variant="save" title="Save" onClick={() => saveEdit(m.id)} />
                            <IconButton icon={X} variant="cancel" title="Cancel" onClick={cancelEdit} />
                          </div>
                        ) : (
                          m.status !== 'finalized' && (
                            <div className="icon-btn-group">
                              <IconButton icon={Pencil} variant="edit" title="Edit date" onClick={() => startEdit(m)} />
                              <IconButton icon={Trash2} variant="remove" title="Remove" onClick={() => handleDelete(m)} />
                            </div>
                          )
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default MandramMeetings;
