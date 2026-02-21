import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox } from '@fortawesome/free-solid-svg-icons';

const getImageUrl = (imagePath) => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL;
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  if (imagePath.startsWith('/uploads/')) return `${baseUrl}${imagePath}`;
  if (imagePath.startsWith('uploads/')) return `${baseUrl}/${imagePath}`;
  return `${baseUrl}/uploads/${imagePath}`;
};

const DeliveredList = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrders, setExpandedOrders] = useState({});

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

  useEffect(() => {
    const fetchDelivered = async () => {
      if (!token) {
        setError('Not authenticated. Please log in.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE_URL}/api/tobeshipped/list?status=delivered`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || 'Failed to fetch delivered orders.');
        }
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err.message || 'Error fetching delivered orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchDelivered();
  }, [token, API_BASE_URL]);

  const downloadPdf = (order) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 15;
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('SHIPPING LABEL', pageWidth / 2, 15, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Order #${order.orderNumber || 'N/A'}`, pageWidth / 2, 25, { align: 'center' });
      let yPos = 45;
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, yPos, pageWidth - (margin * 2), 40, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, yPos, pageWidth - (margin * 2), 40);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('CUSTOMER DETAILS', margin + 5, yPos + 8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Name: ${order.customerName || 'N/A'}`, margin + 5, yPos + 18);
      doc.text(`Email: ${order.email || 'N/A'}`, margin + 5, yPos + 26);
      doc.text(`Phone: ${order.mobileNumber || 'N/A'}`, margin + 5, yPos + 34);
      yPos += 48;
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, yPos, pageWidth - (margin * 2), 40, 'F');
      doc.rect(margin, yPos, pageWidth - (margin * 2), 40);
      doc.setFont('helvetica', 'bold');
      doc.text('SHIPPING ADDRESS', margin + 5, yPos + 8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Address: ${order.address || 'N/A'}`, margin + 5, yPos + 18);
      doc.text(`City: ${order.city || 'N/A'}`, margin + 5, yPos + 26);
      doc.text(`Postal Code: ${order.postalCode || 'N/A'}`, margin + 5, yPos + 34);
      yPos += 48;
      const tableColumn = ['Product', 'Qty', 'Unit Price'];
      const tableRows = (order.orderItems || []).map(item => [
        item.name || 'N/A',
        String(item.quantity || 0),
        `LKR ${(item.price || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
      ]);
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: yPos,
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      });
      doc.save(`Shipping_Label_${order.orderNumber || 'Unknown'}.pdf`);
    } catch (e) {
      alert(`Failed to generate PDF: ${e.message || 'Unknown error'}.`);
    }
  };

  const toggleExpand = (orderId) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading Delivered...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Delivered</h1>
        <p className="page-subtitle">{orders.length} orders delivered</p>
      </div>

      {orders.length === 0 ? (
        <div className="admin-card">
          <div className="empty-state">
            <div className="empty-state-icon"><FontAwesomeIcon icon={faBox} /></div>
            <div className="empty-state-title">No delivered orders</div>
            <div className="empty-state-text">Orders will appear here once marked as delivered from Transit</div>
          </div>
        </div>
      ) : (
        <div className="admin-table-container">
          <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Order ID</th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Shipping Address</th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '140px' }}>Total Price</th>
                <th style={{ width: '220px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <React.Fragment key={order._id}>
                  <tr>
                    <td><span style={{ fontWeight: '600', color: '#0f172a', whiteSpace: 'nowrap' }}>#{order.orderNumber || 'N/A'}</span></td>
                    <td><span style={{ fontWeight: '600', color: '#0f172a' }}>{order.customerName || 'N/A'}</span></td>
                    <td style={{ color: '#64748b', fontSize: '0.875rem' }}>{order.mobileNumber || 'N/A'}</td>
                    <td style={{ color: '#64748b', fontSize: '0.875rem' }}>
                      <div>{order.address || 'N/A'}</div>
                      <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.125rem' }}>{order.city}, {order.postalCode}</div>
                    </td>
                    <td><span className="badge badge-success">Delivered</span></td>
                    <td style={{ fontWeight: '600', color: '#0f172a', whiteSpace: 'nowrap' }}>LKR {order.totalPrice?.toLocaleString() || 'N/A'}</td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end', gap: '0.625rem' }}>
                        <button onClick={() => toggleExpand(order._id)} className="admin-btn">{expandedOrders[order._id] ? 'Hide' : 'View'}</button>
                        <button onClick={() => downloadPdf(order)} className="admin-btn">PDF</button>
                      </div>
                    </td>
                  </tr>
                  {expandedOrders[order._id] && order.orderItems && order.orderItems.length > 0 && (
                    <tr>
                      <td colSpan="7" style={{ backgroundColor: '#f8fafc', padding: '1.5rem' }}>
                        <h4 style={{ fontWeight: 600, marginBottom: '1rem', color: '#0f172a', fontSize: '0.9375rem' }}>Products in this order:</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                          {order.orderItems.map((item, index) => {
                            const variationImage = item.selectedVariation?.images?.[0];
                            const displayImage = variationImage || item.image;
                            let variationAttrs = {};
                            if (item.selectedVariation?.attributes) {
                              variationAttrs = item.selectedVariation.attributes instanceof Map
                                ? Object.fromEntries(item.selectedVariation.attributes)
                                : item.selectedVariation.attributes;
                            }
                            return (
                              <div key={index} style={{ display: 'flex', gap: '1rem', padding: '1rem', backgroundColor: 'white', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
                                <div style={{ flexShrink: 0 }}>
                                  {displayImage ? (
                                    <img src={getImageUrl(displayImage)} alt={item.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--border-radius-sm)' }} onError={handleImageError} />
                                  ) : (
                                    <div style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--gray-100)', borderRadius: 'var(--border-radius-sm)' }}>📷</div>
                                  )}
                                </div>
                                <div style={{ flex: 1, fontSize: '0.9rem' }}>
                                  <div className="text-bold" style={{ marginBottom: '0.25rem' }}>{item.name}</div>
                                  {Object.keys(variationAttrs).length > 0 && (
                                    <div className="text-secondary" style={{ marginBottom: '0.25rem', fontSize: '0.8125rem' }}>
                                      {Object.entries(variationAttrs).map(([k, v], i) => <span key={i} style={{ marginRight: '0.75rem' }}><strong>{k}:</strong> {v}</span>)}
                                    </div>
                                  )}
                                  <div className="text-secondary">Quantity: <strong>{item.quantity}</strong></div>
                                  <div className="text-bold" style={{ marginTop: '0.25rem' }}>Rs. {item.price?.toLocaleString('en-LK', { minimumFractionDigits: 2 })} × {item.quantity} = Rs. {(item.price * item.quantity)?.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveredList;
