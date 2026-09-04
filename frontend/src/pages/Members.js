import React, { useEffect, useState } from 'react';
import { memberService } from '../services/api';
import '../styles/Pages.css';

function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ member_number: '', name: '', phone_number: '', address: '', join_date: '' });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await memberService.getAll();
      setMembers(response.data);
    } catch (err) {
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await memberService.create({ ...formData, monthly_sandha_amount: 1000 });
      setFormData({ member_number: '', name: '', phone_number: '', address: '', join_date: '' });
      fetchMembers();
    } catch (err) {
      setError('Failed to add member');
    }
  };

  return (
    <div className="page-container">
      <h1>Members Management</h1>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      <div className="card">
        <h2>Add New Member</h2>
        <form onSubmit={handleAddMember}>
          <div className="form-group">
            <label>Member Number</label>
            <input type="text" value={formData.member_number} onChange={(e) => setFormData({...formData, member_number: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" value={formData.phone_number} onChange={(e) => setFormData({...formData, phone_number: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Join Date</label>
            <input type="date" value={formData.join_date} onChange={(e) => setFormData({...formData, join_date: e.target.value})} required />
          </div>
          <button type="submit" className="btn btn-primary">Add Member</button>
        </form>
      </div>

      <div className="card">
        <h2>Members List</h2>
        {loading ? <p>Loading...</p> : (
          <table className="table">
            <thead>
              <tr>
                <th>Member Number</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Join Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={member.id}>
                  <td>{member.member_number}</td>
                  <td>{member.name}</td>
                  <td>{member.phone_number}</td>
                  <td>{member.address}</td>
                  <td>{member.join_date}</td>
                  <td><span className="badge badge-success">{member.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Members;
