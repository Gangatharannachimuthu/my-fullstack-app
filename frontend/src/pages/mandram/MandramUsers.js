import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
import { userService } from '../../services/mandramApi';
import IconButton from './IconButton';

const EMPTY_FORM = { username: '', password: '', role: 'viewer', member_id: '' };

function MandramUsers({ members = [] }) {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await userService.getAll();
      setUsers(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const startEdit = (user) => {
    setEditingId(user.id);
    // Password stays blank on edit - blank means "keep the current one".
    setFormData({
      username: user.username,
      password: '',
      role: user.role,
      member_id: user.member_id || '',
    });
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setError('');
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Remove the login for ${user.username}?`)) return;
    try {
      setError('');
      await userService.remove(user.id);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove user');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      // Blank in the dropdown means "not linked to any member".
      const payload = { ...formData, member_id: formData.member_id ? Number(formData.member_id) : null };
      if (editingId) {
        await userService.update(editingId, payload);
      } else {
        await userService.create(payload);
      }
      setFormData(EMPTY_FORM);
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${editingId ? 'update' : 'add'} user`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="card">
        <h2>{editingId ? `Edit Login - ${formData.username}` : 'Add Login'}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>{editingId ? 'New Password (leave blank to keep current)' : 'Password'}</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingId ? 'Unchanged' : 'At least 6 characters'}
              required={!editingId}
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="viewer">Viewer (read-only)</option>
              <option value="admin">Admin (full access)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Linked Member</label>
            <select
              value={formData.member_id}
              onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
            >
              <option value="">Not linked (sees no loans)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>
              A viewer sees only this member's EMI and personal loans. Admins see everyone.
            </p>
          </div>
          <div className="inline-form">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingId ? 'Update Login' : 'Add Login'}
            </button>
            {editingId && <IconButton icon={X} variant="cancel" title="Cancel" onClick={cancelEdit} />}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Logins ({users.length})</h2>
        {loading ? (
          <p>Loading...</p>
        ) : users.length === 0 ? (
          <p>No logins yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Linked Member</th>
                <th>Access</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-success' : 'badge-warning'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.member_name || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                  <td>
                    {u.role === 'admin'
                      ? 'Can edit every tab, sees all members'
                      : u.member_name
                      ? `View only, own loans (${u.member_name})`
                      : 'View only, no loans linked'}
                  </td>
                  <td>
                    <div className="icon-btn-group">
                      <IconButton icon={Pencil} variant="edit" title="Edit" onClick={() => startEdit(u)} />
                      <IconButton icon={Trash2} variant="remove" title="Remove" onClick={() => handleDelete(u)} />
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

export default MandramUsers;
