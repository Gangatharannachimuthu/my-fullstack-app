import React, { useState } from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
import { memberService } from '../../services/mandramApi';
import IconButton from './IconButton';

const EMPTY_FORM = { name: '', phone: '', joined_date: '', is_active: true };

function MandramMembers({ members, onChanged }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const startEdit = (member) => {
    setEditingId(member.id);
    setFormData({
      name: member.name || '',
      phone: member.phone || '',
      joined_date: member.joined_date || '',
      is_active: member.is_active,
    });
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setError('');
  };

  const handleDelete = async (member) => {
    if (!window.confirm(`Remove ${member.name}?`)) return;
    try {
      setError('');
      await memberService.remove(member.id);
      await onChanged();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      if (editingId) {
        await memberService.update(editingId, formData);
      } else {
        await memberService.create(formData);
      }
      setFormData(EMPTY_FORM);
      setEditingId(null);
      await onChanged();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${editingId ? 'update' : 'add'} member`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="card">
        <h2>{editingId ? 'Edit Member' : 'Add Member'}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Joined Date</label>
            <input
              type="date"
              value={formData.joined_date}
              onChange={(e) => setFormData({ ...formData, joined_date: e.target.value })}
            />
          </div>
          {editingId && (
            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}
          <div className="inline-form">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingId ? 'Update Member' : 'Add Member'}
            </button>
            {editingId && <IconButton icon={X} variant="cancel" title="Cancel" onClick={cancelEdit} />}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Members ({members.length})</h2>
        {members.length === 0 ? (
          <p>No members yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Joined Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.phone || '-'}</td>
                  <td>{m.joined_date || '-'}</td>
                  <td>
                    <span className={`badge ${m.is_active ? 'badge-success' : ''}`}>
                      {m.is_active ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="icon-btn-group">
                      <IconButton icon={Pencil} variant="edit" title="Edit" onClick={() => startEdit(m)} />
                      <IconButton icon={Trash2} variant="remove" title="Remove" onClick={() => handleDelete(m)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default MandramMembers;
