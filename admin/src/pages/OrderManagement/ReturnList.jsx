import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUndo, faCheck, faTimes, faBoxOpen, faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';

const REASON_LABELS = {
  defective: 'Defective',
  wrong_item: 'Wrong Item',
  changed_mind: 'Changed Mind',
  not_as_described: 'Not as Described',
  other: 'Other',
};

const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  received: 'Received',
  refunded: 'Refunded',
};

const ReturnList = () => {
  const { token } = useAuth();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

  const fetchReturns = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const url = statusFilter
        ? `${API_BASE_URL}/api/returns/admin/list?status=${statusFilter}`
        : `${API_BASE_URL}/api/returns/admin/list`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to fetch returns.');
      }
      const data = await res.json();
      setReturns(data);
    } catch (err) {
      setError(err.message || 'Error fetching return requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [token, statusFilter, API_BASE_URL]);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/returns/admin/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update status.');
      }
      toast.success(`Status updated to ${STATUS_LABELS[status]}`);
      fetchReturns();
    } catch (err) {
      toast.error(err.message || 'Failed to update.');
    }
  };

  const getNextAction = (ret) => {
    switch (ret.status) {
      case 'pending':
        return [
          { label: 'Approve', status: 'approved', icon: faCheck },
          { label: 'Reject', status: 'rejected', icon: faTimes },
        ];
      case 'approved':
        return [{ label: 'Mark Received', status: 'received', icon: faBoxOpen }];
      case 'received':
        return [{ label: 'Mark Refunded', status: 'refunded', icon: faMoneyBillWave }];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading returns...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Return Requests</h1>
          <p className="page-subtitle">{returns.length} return request(s)</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-select"
          style={{ minWidth: '140px' }}
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {returns.length === 0 ? (
        <div className="admin-card">
          <div className="empty-state">
            <div className="empty-state-icon"><FontAwesomeIcon icon={faUndo} /></div>
            <div className="empty-state-title">No return requests</div>
            <div className="empty-state-text">Return requests from customers will appear here</div>
          </div>
        </div>
      ) : (
        <div className="admin-card">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Reason</th>
                  <th>Items</th>
                  <th>Refund</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((ret) => (
                  <tr key={ret._id}>
                    <td><strong>{ret.orderNumber}</strong></td>
                    <td>
                      {ret.user?.name || '—'}<br />
                      <small style={{ color: '#6b7280' }}>{ret.user?.email}</small>
                    </td>
                    <td>{REASON_LABELS[ret.reason] || ret.reason}</td>
                    <td>
                      {(ret.items || []).map((item, i) => (
                        <div key={i}>
                          {item.name} × {item.quantity}
                        </div>
                      ))}
                    </td>
                    <td>Rs. {(ret.totalRefundAmount || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</td>
                    <td>
                      <span className={`status-badge status-${ret.status}`}>
                        {STATUS_LABELS[ret.status]}
                      </span>
                    </td>
                    <td>{ret.createdAt ? new Date(ret.createdAt).toLocaleDateString() : '—'}</td>
                    <td>
                      <div className="admin-btn-group">
                        {getNextAction(ret).map((a) => (
                          <button
                            key={a.status}
                            type="button"
                            className={`admin-btn admin-btn-${a.status === 'rejected' ? 'danger' : 'primary'}`}
                            onClick={() => updateStatus(ret._id, a.status)}
                          >
                            <FontAwesomeIcon icon={a.icon} /> {a.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnList;
