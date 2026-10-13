import React, { useCallback, useEffect, useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { chitService, investmentService } from '../../services/mandramApi';
import IconButton from './IconButton';

function MandramInvestments({ meetingId, canEdit = true }) {
  const [categories, setCategories] = useState([]);
  const [entries, setEntries] = useState([]);
  const [chits, setChits] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [auctionAmount, setAuctionAmount] = useState('');
  const [commission, setCommission] = useState('');
  const [chitId, setChitId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  const refresh = useCallback(async () => {
    const [catRes, entriesRes, chitsRes] = await Promise.all([
      investmentService.getCategories(),
      meetingId ? investmentService.getForMeeting(meetingId) : Promise.resolve({ data: [] }),
      chitService.getAll(),
    ]);
    setCategories(catRes.data || []);
    setEntries(entriesRes.data || []);
    setChits(chitsRes.data || []);
  }, [meetingId]);

  const chitLabel = (id) => {
    const chit = chits.find((c) => String(c.id) === String(id));
    return chit ? chit.host_name : null;
  };

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Only a chit has an auction, so only a chit returns a commission to us.
  const isChitCategory = (id) => {
    const category = categories.find((c) => String(c.id) === String(id));
    return !!category && /chit/i.test(category.name);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!categoryId || !amount || !meetingId) return;
    try {
      setError('');
      await investmentService.create(meetingId, {
        category_id: Number(categoryId),
        amount: Number(amount),
        commission_amount: isChitCategory(categoryId) ? Number(commission || 0) : 0,
        auction_amount:
          isChitCategory(categoryId) && auctionAmount !== '' ? Number(auctionAmount) : null,
        chit_id: isChitCategory(categoryId) && chitId ? Number(chitId) : null,
        note,
      });
      setAmount('');
      setAuctionAmount('');
      setCommission('');
      setChitId('');
      setNote('');
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add investment');
    }
  };

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setEditValues({
      category_id: entry.category_id,
      amount: entry.amount,
      auction_amount: entry.auction_amount ?? '',
      commission_amount: entry.commission_amount || 0,
      chit_id: entry.chit_id || '',
      note: entry.note || '',
    });
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
        commission_amount: isChitCategory(editValues.category_id)
          ? Number(editValues.commission_amount || 0)
          : 0,
        auction_amount:
          isChitCategory(editValues.category_id) && editValues.auction_amount !== ''
            ? Number(editValues.auction_amount)
            : null,
        chit_id:
          isChitCategory(editValues.category_id) && editValues.chit_id
            ? Number(editValues.chit_id)
            : null,
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
  const totalCommission = entries.reduce((sum, e) => sum + Number(e.commission_amount || 0), 0);
  const totalAuction = entries.reduce((sum, e) => sum + Number(e.auction_amount || 0), 0);

  if (!meetingId) return <div className="card"><p>Select a meeting first.</p></div>;

  return (
    <div className="card">
      <h2>Chit & Savings (சீட்டு மற்றும் சேமிப்பு)</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {canEdit && (
        <form onSubmit={handleAdd} className="inline-form" style={{ marginBottom: 16 }}>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input type="number" placeholder="Amount paid" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          {isChitCategory(categoryId) && (
            <input
              type="number"
              placeholder="Auction amount"
              title="What the chit was auctioned for this month (tracking only)"
              value={auctionAmount}
              onChange={(e) => setAuctionAmount(e.target.value)}
            />
          )}
          {isChitCategory(categoryId) && (
            <input
              type="number"
              placeholder="Commission to us"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
            />
          )}
          {isChitCategory(categoryId) && (
            <select value={chitId} onChange={(e) => setChitId(e.target.value)}>
              <option value="">Link to chit (optional)</option>
              {chits.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.host_name}
                </option>
              ))}
            </select>
          )}
          <input type="text" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <button type="submit" className="btn btn-primary">Add</button>
        </form>
      )}

      {entries.length === 0 ? (
        <p>No investments recorded for this meeting.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount</th>
              <th>Auction Amount</th>
              <th>Commission</th>
              <th>Chit</th>
              <th>Note</th>
              {canEdit && <th></th>}
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
                    {isChitCategory(editValues.category_id) ? (
                      <input
                        type="number"
                        style={{ width: 90 }}
                        value={editValues.auction_amount}
                        onChange={(ev) =>
                          setEditValues({ ...editValues, auction_amount: ev.target.value })
                        }
                      />
                    ) : (
                      <span style={{ color: '#94a3b8' }}>—</span>
                    )}
                  </td>
                  <td>
                    {isChitCategory(editValues.category_id) ? (
                      <input
                        type="number"
                        style={{ width: 90 }}
                        value={editValues.commission_amount}
                        onChange={(ev) => setEditValues({ ...editValues, commission_amount: ev.target.value })}
                      />
                    ) : (
                      <span style={{ color: '#94a3b8' }}>—</span>
                    )}
                  </td>
                  <td>
                    {isChitCategory(editValues.category_id) ? (
                      <select
                        value={editValues.chit_id}
                        onChange={(ev) => setEditValues({ ...editValues, chit_id: ev.target.value })}
                      >
                        <option value="">—</option>
                        {chits.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.host_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>—</span>
                    )}
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
                  <td>
                    {e.auction_amount !== null && e.auction_amount !== undefined ? (
                      `₹${Number(e.auction_amount).toFixed(2)}`
                    ) : (
                      <span style={{ color: '#94a3b8' }}>—</span>
                    )}
                  </td>
                  <td>
                    {Number(e.commission_amount) > 0 ? (
                      `₹${Number(e.commission_amount).toFixed(2)}`
                    ) : (
                      <span style={{ color: '#94a3b8' }}>—</span>
                    )}
                  </td>
                  <td>{chitLabel(e.chit_id) || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                  <td>{e.note || '-'}</td>
                  {canEdit && (
                    <td>
                      <div className="icon-btn-group">
                        <IconButton icon={Pencil} variant="edit" title="Edit" onClick={() => startEdit(e)} />
                        <IconButton icon={Trash2} variant="remove" title="Remove" onClick={() => handleDelete(e.id)} />
                      </div>
                    </td>
                  )}
                </tr>
              )
            )}
            <tr>
              <td className="font-weight-bold">Total</td>
              <td className="font-weight-bold">₹{total.toFixed(2)}</td>
              <td className="font-weight-bold">
                {totalAuction > 0 ? `₹${totalAuction.toFixed(2)}` : ''}
              </td>
              <td className="font-weight-bold">
                {totalCommission > 0 ? `₹${totalCommission.toFixed(2)}` : ''}
              </td>
              <td></td>
              <td></td>
              {canEdit && <td></td>}
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

export default MandramInvestments;
