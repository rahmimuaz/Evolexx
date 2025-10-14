import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getImageUrl = (imagePath) => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL;
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  if (imagePath.startsWith('/uploads/')) return `${baseUrl}${imagePath}`;
  if (imagePath.startsWith('uploads/')) return `${baseUrl}/${imagePath}`;
  return `${baseUrl}/uploads/${imagePath}`;
};

const ToBeShippedList = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrders, setExpandedOrders] = useState({});

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

  useEffect(() => {
    const fetchToBeShipped = async () => {
      if (!token) {
        setError('Not authenticated. Please log in.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE_URL}/api/tobeshipped/list`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch to-be-shipped orders.');
        }

        const data = await response.json();
        console.log('ToBeShipped data received:', data);
        setOrders(data);
      } catch (err) {
        console.error('Error fetching to-be-shipped orders:', err);
        setError(err.message || 'Error fetching to-be-shipped orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchToBeShipped();
  }, [token, API_BASE_URL]);

  const downloadPdf = (order) => {
    try {
      console.log('Starting PDF generation for order:', order);
      
      // Create new PDF instance
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;

      // Header Section with background
      doc.setFillColor(15, 23, 42); // Dark background
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      // Company/Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('SHIPPING LABEL', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Order #${order.orderNumber || 'N/A'}`, pageWidth / 2, 25, { align: 'center' });

      let yPos = 45;

      // Customer Details Box
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

      // Shipping Address Box
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, yPos, pageWidth - (margin * 2), 40, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, yPos, pageWidth - (margin * 2), 40);
      
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('SHIPPING ADDRESS', margin + 5, yPos + 8);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Address: ${order.address || 'N/A'}`, margin + 5, yPos + 18);
      doc.text(`City: ${order.city || 'N/A'}`, margin + 5, yPos + 26);
      doc.text(`Postal Code: ${order.postalCode || 'N/A'}`, margin + 5, yPos + 34);

      yPos += 48;

      // Order Information Box
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, yPos, pageWidth - (margin * 2), 40, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, yPos, pageWidth - (margin * 2), 40);
      
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('ORDER INFORMATION', margin + 5, yPos + 8);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Order Number: ${order.orderNumber || 'N/A'}`, margin + 5, yPos + 18);
      
      const totalPrice = order.totalPrice ? order.totalPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : 'N/A';
      doc.text(`Total Price: LKR ${totalPrice}`, margin + 5, yPos + 26);
      
      const paymentMethod = order.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                           order.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 
                           order.paymentMethod === 'card' ? 'Card Payment' : 
                           order.paymentMethod || 'N/A';
      doc.text(`Payment Method: ${paymentMethod}`, margin + 5, yPos + 34);

      yPos += 48;

      // Order Items Header
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('ORDER ITEMS', margin, yPos);
      yPos += 5;

      // Prepare table data
      const tableColumn = ["Product", "Qty", "Unit Price"];
      const tableRows = [];

      if (order.orderItems && Array.isArray(order.orderItems) && order.orderItems.length > 0) {
        order.orderItems.forEach(item => {
          const productName = item.name || 'N/A';
          const colorInfo = item.selectedColor ? ` (${item.selectedColor})` : '';
          const quantity = item.quantity ? item.quantity.toString() : '0';
          const price = item.price ? `LKR ${item.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}` : 'LKR 0';
          
          tableRows.push([
            productName + colorInfo,
            quantity,
            price
          ]);
        });
      }

      // Add table using autoTable
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: yPos,
        theme: 'striped',
        styles: {
          fontSize: 10,
          cellPadding: 5,
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 11,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        bodyStyles: {
          textColor: [71, 85, 105],
        },
        columnStyles: {
          0: { cellWidth: 'auto', fontStyle: 'normal' },
          1: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
          2: { cellWidth: 45, halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] },
        },
        margin: { left: margin, right: margin },
      });

      // Footer
      const finalY = doc.lastAutoTable.finalY + 15;
      if (finalY < pageHeight - 30) {
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, finalY, pageWidth - margin, finalY);
        
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Thank you for your order!', pageWidth / 2, finalY + 10, { align: 'center' });
        
        // Add date
        const currentDate = new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        doc.text(`Generated on: ${currentDate}`, pageWidth / 2, finalY + 18, { align: 'center' });
      }

      // Save the PDF
      const filename = `Shipping_Label_${order.orderNumber || 'Unknown'}.pdf`;
      doc.save(filename);
      console.log('PDF downloaded successfully:', filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      console.error('Error details:', error.message, error.stack);
      alert(`Failed to generate PDF: ${error.message || 'Unknown error'}. Please check the console for details.`);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      accepted: 'badge badge-success',
      shipped: 'badge badge-info',
      delivered: 'badge badge-success',
    };
    return badges[status] || 'badge badge-gray';
  };

  const toggleExpand = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    if (e.target.nextElementSibling) {
      e.target.nextElementSibling.style.display = 'flex';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading Shipments...</p>
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
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Shipments</h1>
        <p className="page-subtitle">{orders.length} orders ready for shipment</p>
      </div>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="admin-card">
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-title">No orders to ship</div>
            <div className="empty-state-text">Orders will appear here once they are accepted</div>
          </div>
        </div>
      ) : (
        <div className="admin-table-container">
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
                    <td>
                      <span style={{ fontWeight: '600', color: '#0f172a', whiteSpace: 'nowrap' }}>
                        #{order.orderNumber || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: '#0f172a' }}>
                        {order.customerName || 'N/A'}
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.875rem' }}>
                      {order.mobileNumber || 'N/A'}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.875rem' }}>
                      <div>{order.address || 'N/A'}</div>
                      <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.125rem' }}>
                        {order.city}, {order.postalCode}
                      </div>
                    </td>
                    <td>
                      <span className={getStatusBadge(order.status)}>
                        {order.status || 'accepted'}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600', color: '#0f172a', whiteSpace: 'nowrap' }}>
                      LKR {order.totalPrice?.toLocaleString() || 'N/A'}
                    </td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end', gap: '0.625rem' }}>
                        <button
                          onClick={() => downloadPdf(order)}
                          style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            borderRadius: '0.375rem',
                            border: 'none',
                            background: '#10b981',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => e.target.style.background = '#059669'}
                          onMouseOut={(e) => e.target.style.background = '#10b981'}
                          title="Download Shipping Label"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => toggleExpand(order._id)}
                          style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            borderRadius: '0.375rem',
                            border: 'none',
                            background: '#3b82f6',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => e.target.style.background = '#2563eb'}
                          onMouseOut={(e) => e.target.style.background = '#3b82f6'}
                          title={expandedOrders[order._id] ? 'Hide Items' : 'View Items'}
                        >
                          {expandedOrders[order._id] ? 'Hide' : 'View'}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedOrders[order._id] && order.orderItems && order.orderItems.length > 0 && (
                    <tr>
                      <td colSpan="7" style={{ backgroundColor: '#f8fafc', padding: '1.5rem' }}>
                        <h4 style={{ fontWeight: 600, marginBottom: '1rem', color: '#0f172a', fontSize: '0.9375rem' }}>
                          Products in this Shipment:
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                          {order.orderItems.map((item, index) => (
                            <div key={index} style={{
                              display: 'flex',
                              gap: '1rem',
                              padding: '1rem',
                              backgroundColor: 'white',
                              borderRadius: 'var(--border-radius-sm)',
                              border: '1px solid var(--border-color)'
                            }}>
                              <div style={{ flexShrink: 0 }}>
                                {item.image ? (
                                  <>
                                    <img
                                      src={getImageUrl(item.image)}
                                      alt={item.name}
                                      style={{
                                        width: '60px',
                                        height: '60px',
                                        objectFit: 'cover',
                                        borderRadius: 'var(--border-radius-sm)',
                                        border: '1px solid var(--border-color)'
                                      }}
                                      onError={handleImageError}
                                    />
                                    <div style={{
                                      display: 'none',
                                      width: '60px',
                                      height: '60px',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      backgroundColor: 'var(--gray-100)',
                                      borderRadius: 'var(--border-radius-sm)',
                                      border: '1px solid var(--border-color)'
                                    }}>
                                      📷
                                    </div>
                                  </>
                                ) : (
                                  <div style={{
                                    width: '60px',
                                    height: '60px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'var(--gray-100)',
                                    borderRadius: 'var(--border-radius-sm)',
                                    border: '1px solid var(--border-color)'
                                  }}>
                                    📷
                                  </div>
                                )}
                              </div>
                              <div style={{ flex: 1, fontSize: '0.9rem' }}>
                                <div className="text-bold">{item.name}</div>
                                {item.selectedColor && (
                                  <div className="text-secondary">Color: {item.selectedColor}</div>
                                )}
                                <div className="text-secondary">Qty: {item.quantity}</div>
                                <div className="text-bold" style={{ marginTop: '0.25rem' }}>
                                  Rs. {item.price?.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ToBeShippedList;
