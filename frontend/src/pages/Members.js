import React, { useEffect, useState } from 'react';
import { memberService } from '../services/api';
import '../styles/Pages.css';

function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ 
    member_number: '', 
    name: '', 
    phone_number: '', 
    address: '', 
    join_date: '' 
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await memberService.getAll();
      console.log('Members response:', response.data);
      setMembers(Array.isArray(response.data) ? response.data : []);
      setError('');
    } catch (err) {
      console.error('Error fetching members:', err);
      setError('Failed to load members - ' + (err.message || 'Unknown error'));
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await memberService.create({ 
        ...formData, 
        monthly_sandha_amount: 1000 
      });
      setFormData({ member_number: '', name: '', phone_number: '', address: '', join_date: '' });
      fetchMembers();
    } catch (err) {
      console.error('Error adding member:', err);
      setError('Failed to add member - ' + (err.message || 'Unknown error'));
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
            <input 
              type="text" 
              value={formData.member_number} 
              onChange={(e) => setFormData({...formData, member_number: e.target.value})} 
              placeholder="e.g., MEM001"
              required 
            />
          </div>
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              placeholder="Full name"
              required 
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input 
              type="tel" 
              value={formData.phone_number} 
              onChange={(e) => setFormData({...formData, phone_number: e.target.value})} 
              placeholder="9876543210"
            />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input 
              type="text" 
              value={formData.address} 
              onChange={(e) => setFormData({...formData, address: e.target.value})} 
              placeholder="City/Address"
            />
          </div>
          <div className="form-group">
            <label>Join Date</label>
            <input 
              type="date" 
              value={formData.join_date} 
              onChange={(e) => setFormData({...formData, join_date: e.target.value})} 
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary">Add Member</button>
        </form>
      </div>

      <div className="card">
        <h2>Members List</h2>
        {loading ? (
          <p>Loading members...</p>
        ) : members.length === 0 ? (
          <p>No members found. Add a member using the form above.</p>
        ) : (
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
                  <td>{member.phone_number || '-'}</td>
                  <td>{member.address || '-'}</td>
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
