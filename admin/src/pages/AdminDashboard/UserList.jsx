import React, { useEffect, useState } from 'react';
import axios from 'axios';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE_URL]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`${API_BASE_URL}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting user. Try again.');
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.name || user.username || '').toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading Users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-5">
        <h1 className="page-title">👥 Customer Management</h1>
        <p className="page-subtitle">View and manage all registered users</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Total Customers</div>
            <div className="stat-card-icon">👥</div>
          </div>
          <div className="stat-card-value">{users.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Admin Users</div>
            <div className="stat-card-icon">👤</div>
          </div>
          <div className="stat-card-value">
            {users.filter(u => u.isAdmin || u.role === 'admin').length}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Regular Users</div>
            <div className="stat-card-icon">👨‍💼</div>
          </div>
          <div className="stat-card-value">
            {users.filter(u => !u.isAdmin && u.role !== 'admin').length}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="admin-card">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Search Users</label>
          <input
            type="text"
            className="form-input"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5">
                  <div className="empty-state">
                    <div className="empty-state-icon">👥</div>
                    <div className="empty-state-title">No users found</div>
                    <div className="empty-state-text">
                      {searchTerm ? 'Try adjusting your search' : 'No registered users yet'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user._id}>
                  <td>
                    <span className="text-bold">{user.name || user.username || 'N/A'}</span>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    {user.isAdmin || user.role === 'admin' ? (
                      <span className="badge badge-info">Admin</span>
                    ) : (
                      <span className="badge badge-gray">Customer</span>
                    )}
                  </td>
                  <td className="text-secondary">
                    {user.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })
                      : 'N/A'
                    }
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="btn btn-sm btn-danger"
                        title="Delete User"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      {filteredUsers.length > 0 && (
        <div className="text-center mt-4 text-secondary">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      )}
    </div>
  );
};

export default UserList;
