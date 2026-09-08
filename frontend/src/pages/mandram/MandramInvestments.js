import React, { useCallback, useEffect, useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { investmentService } from '../../services/mandramApi';
import IconButton from './IconButton';

function MandramInvestments({ meetingId }) {
  const [categories, setCategories] = useState([]);
  const [entries, setEntries] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  const refresh = useCallback(async () => {
    const [catRes, entriesRes] = await Promise.all([
      investmentService.getCategories(),
      meetingId ? investmentService.getForMeeting(meetingId) : Promise.resolve({ data: [] }),
    ]);
    setCategories(catRes.data || []);
    setEntries(entriesRes.data || []);
  }, [meetingId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!categoryId || !amount || !meetingId) return;
    try {
      setError('');
      await investmentService.create(meetingId, { category_id: Number(categoryId), amount: Number(amount), note });
      setAmount('');
      setNote('');
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add investment');
    }
  };

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setEditValues({ category_id: entry.category_id, amount: entry.amount, note: entry.note || '' });
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = async (entryId) => {
    try {
      setError('');
      await investmentService.update(entryId, {
        category_id: Number(editValues.category_id),
        amount: Number(editValues.amount),
        note: editValues.note,
      });
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update investment');
    }
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm('Remove this investment entry?')) return;
    try {
      setError('');
      await investmentService.remove(entryId);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove investment');
    }
  };

  const total = entries.reduce((sum, e) => sum + Number(e.amount), 0);

  if (!meetingId) return <div className="card"><p>Select a meeting first.</p></div>;

  return (
    <div className="card">
      <h2>Chit & Savings (சீட்டு மற்றும் சேமிப்பு)</h2>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleAdd} className="inline-form" style={{ marginBottom: 16 }}>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <input type="text" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button type="submit" className="btn btn-primary">Add</button>
      </form>

      {entries.length === 0 ? (
        <p>No investments recorded for this meeting.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount</th>
              <th>Note</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) =>
              editingId === e.id ? (
                <tr key={e.id}>
                  <td>
                    <select
                      value={editValues.category_id}
                      onChange={(ev) => setEditValues({ ...editValues, category_id: ev.target.value })}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      style={{ width: 90 }}
                      value={editValues.amount}
                      onChange={(ev) => setEditValues({ ...editValues, amount: ev.target.value })}
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
                      <IconButton icon={Check} variant="save" title="Save" onClick={() => saveEdit(e.id)} />
                      <IconButton icon={X} variant="cancel" title="Cancel" onClick={cancelEdit} />
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={e.id}>
                  <td>{e.category_name}</td>
                  <td>₹{Number(e.amount).toFixed(2)}</td>
                  <td>{e.note || '-'}</td>
                  <td>
                    <div className="icon-btn-group">
                      <IconButton icon={Pencil} variant="edit" title="Edit" onClick={() => startEdit(e)} />
                      <IconButton icon={Trash2} variant="remove" title="Remove" onClick={() => handleDelete(e.id)} />
                    </div>
                  </td>
                </tr>
              )
            )}
            <tr>
              <td className="font-weight-bold">Total</td>
              <td className="font-weight-bold">₹{total.toFixed(2)}</td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

export default MandramInvestments;
