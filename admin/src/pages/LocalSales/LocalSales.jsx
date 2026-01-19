import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReceipt, faPlus, faTrash, faDownload, faQrcode, faEye } from '@fortawesome/free-solid-svg-icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QRCodeSVG } from 'qrcode.react';
import './LocalSales.css';

const LocalSales = () => {
  const { token } = useAuth();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    paymentMethod: 'cash',
    notes: '',
    items: [],
    subtotal: 0,
    tax: 0,
    discount: 0,
    totalAmount: 0
  });

  const [currentItem, setCurrentItem] = useState({
    product: '',
    quantity: 1,
    unitPrice: 0,
    selectedVariation: null
  });

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    fetchSales();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSales = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/local-sales`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSales(response.data);
    } catch (error) {
      alert('Error fetching local sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products`);
      setProducts(response.data);
    } catch (error) {
      alert('Error fetching products');
    }
  };

  const handleProductSelect = (productId) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      setCurrentItem({
        ...currentItem,
        product: productId,
        unitPrice: product.discountPrice || product.price || 0,
        selectedVariation: null
      });
    }
  };

  const handleVariationSelect = (variation) => {
    // Convert variation attributes to plain object
    const attributes = variation.attributes instanceof Map
      ? Object.fromEntries(variation.attributes.entries())
      : (variation.attributes || {});
    
    setCurrentItem({
      ...currentItem,
      selectedVariation: {
        attributes: attributes
      },
      unitPrice: parseFloat(variation.discountPrice || variation.price || currentItem.unitPrice || 0)
    });
  };

  const addItem = () => {
    if (!currentItem.product || currentItem.quantity < 1) {
      alert('Please select a product and enter quantity');
      return;
    }

    const product = products.find(p => p._id === currentItem.product);
    const itemTotal = currentItem.quantity * currentItem.unitPrice;

    const newItem = {
      product: currentItem.product,
      productName: product.name,
      quantity: parseInt(currentItem.quantity),
      unitPrice: parseFloat(currentItem.unitPrice),
      totalPrice: itemTotal,
      selectedVariation: currentItem.selectedVariation && currentItem.selectedVariation.attributes 
        ? { attributes: currentItem.selectedVariation.attributes }
        : null
    };

    setFormData({
      ...formData,
      items: [...formData.items, newItem],
      subtotal: formData.subtotal + itemTotal
    });

    setCurrentItem({
      product: '',
      quantity: 1,
      unitPrice: 0,
      selectedVariation: null
    });
  };

  const removeItem = (index) => {
    const item = formData.items[index];
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
      subtotal: formData.subtotal - item.totalPrice
    });
  };

  const calculateTotal = () => {
    const total = formData.subtotal + (formData.tax || 0) - (formData.discount || 0);
    setFormData({ ...formData, totalAmount: total });
  };

  useEffect(() => {
    calculateTotal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.subtotal, formData.tax, formData.discount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerPhone || formData.items.length === 0) {
      alert('Please fill in customer details and add at least one item');
      return;
    }

    // Prepare data for API - ensure items have correct structure
    const saleData = {
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerEmail: formData.customerEmail || undefined,
      customerAddress: formData.customerAddress || undefined,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes || undefined,
      items: formData.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        selectedVariation: item.selectedVariation && Object.keys(item.selectedVariation).length > 0 
          ? { attributes: item.selectedVariation.attributes } 
          : null
      })),
      subtotal: formData.subtotal,
      tax: formData.tax || 0,
      discount: formData.discount || 0,
      totalAmount: formData.totalAmount
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/api/local-sales`, saleData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      alert('Local sale created successfully!');
      setShowForm(false);
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        customerAddress: '',
        paymentMethod: 'cash',
        notes: '',
        items: [],
        subtotal: 0,
        tax: 0,
        discount: 0,
        totalAmount: 0
      });
      fetchSales();
      setSelectedSale(response.data);
      setShowQRModal(true);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Error creating local sale';
      alert(`Error: ${errorMessage}`);
      console.error('Local sale error:', error.response?.data || error);
    }
  };

  const downloadPDF = (sale) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Invoice #: ${sale.invoiceNumber}`, pageWidth / 2, 30, { align: 'center' });

    let yPos = 50;

    // Customer Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER DETAILS', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    yPos += 8;
    doc.text(`Name: ${sale.customerName}`, margin, yPos);
    yPos += 6;
    doc.text(`Phone: ${sale.customerPhone}`, margin, yPos);
    if (sale.customerEmail) {
      yPos += 6;
      doc.text(`Email: ${sale.customerEmail}`, margin, yPos);
    }
    if (sale.customerAddress) {
      yPos += 6;
      doc.text(`Address: ${sale.customerAddress}`, margin, yPos);
    }
    yPos += 10;

    // Items Table
    const tableColumns = ['Product', 'Qty', 'Unit Price', 'Total'];
    const tableRows = sale.items.map(item => {
      let productName = item.productName;
      if (item.selectedVariation && item.selectedVariation.attributes) {
        const attrs = item.selectedVariation.attributes instanceof Map
          ? Object.fromEntries(item.selectedVariation.attributes.entries())
          : item.selectedVariation.attributes;
        const attrStrings = Object.entries(attrs).map(([k, v]) => `${k}: ${v}`);
        productName += ` (${attrStrings.join(', ')})`;
      }
      return [
        productName,
        item.quantity.toString(),
        `Rs. ${item.unitPrice.toLocaleString()}`,
        `Rs. ${item.totalPrice.toLocaleString()}`
      ];
    });

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: yPos,
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 45, halign: 'right' },
        3: { cellWidth: 45, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: margin, right: margin }
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // Totals
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal: Rs. ${sale.subtotal.toLocaleString()}`, pageWidth - margin, yPos, { align: 'right' });
    if (sale.tax > 0) {
      yPos += 6;
      doc.text(`Tax: Rs. ${sale.tax.toLocaleString()}`, pageWidth - margin, yPos, { align: 'right' });
    }
    if (sale.discount > 0) {
      yPos += 6;
      doc.text(`Discount: Rs. ${sale.discount.toLocaleString()}`, pageWidth - margin, yPos, { align: 'right' });
    }
    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Total: Rs. ${sale.totalAmount.toLocaleString()}`, pageWidth - margin, yPos, { align: 'right' });

    // Footer
    yPos += 15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Payment Method: ${sale.paymentMethod.toUpperCase()}`, margin, yPos);
    doc.text(`Date: ${new Date(sale.saleDate).toLocaleDateString()}`, pageWidth - margin, yPos, { align: 'right' });

    doc.save(`Invoice_${sale.invoiceNumber}.pdf`);
  };

  const getInvoiceUrl = (saleId) => {
    const clientUrl = process.env.REACT_APP_CLIENT_URL || 'http://localhost:3000';
    return `${clientUrl}/invoice/${saleId}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading local sales...</p>
      </div>
    );
  }

  return (
    <div className="local-sales-container">
      <div className="page-header">
        <h1 className="page-title">
          <FontAwesomeIcon icon={faReceipt} /> Local Sales
        </h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <FontAwesomeIcon icon={faPlus} /> {showForm ? 'Cancel' : 'New Sale'}
        </button>
      </div>

      {showForm && (
        <div className="local-sales-form-card">
          <h2>Create New Local Sale</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Customer Name *</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Customer Phone *</label>
                <input
                  type="text"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Customer Email</label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Customer Address</label>
                <input
                  type="text"
                  value={formData.customerAddress}
                  onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>
            </div>

            <div className="items-section">
              <h3>Add Items</h3>
              <div className="add-item-form">
                <div className="form-group">
                  <label>Product</label>
                  <select
                    value={currentItem.product}
                    onChange={(e) => handleProductSelect(e.target.value)}
                  >
                    <option value="">Select Product</option>
                    {products.map(product => (
                      <option key={product._id} value={product._id}>
                        {product.name} - Stock: {product.stock}
                      </option>
                    ))}
                  </select>
                </div>

                {currentItem.product && (() => {
                  const product = products.find(p => p._id === currentItem.product);
                  if (product && product.hasVariations && product.variations && product.variations.length > 0) {
                    return (
                      <div className="form-group">
                        <label>Variation</label>
                        <select
                          value={currentItem.selectedVariation ? 'selected' : ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              const variation = product.variations[parseInt(e.target.value)];
                              if (variation) {
                                handleVariationSelect(variation);
                              }
                            } else {
                              setCurrentItem({
                                ...currentItem,
                                selectedVariation: null,
                                unitPrice: product.discountPrice || product.price || 0
                              });
                            }
                          }}
                        >
                          <option value="">Select Variation</option>
                          {product.variations.map((v, idx) => {
                            const attrs = v.attributes instanceof Map
                              ? Object.fromEntries(v.attributes.entries())
                              : v.attributes;
                            const attrStr = Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(', ');
                            return (
                              <option key={idx} value={idx}>
                                {attrStr} - Stock: {v.stock} - Price: Rs. {v.discountPrice || v.price || product.price}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div className="form-group">
                  <label>Unit Price (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentItem.unitPrice}
                    onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <button type="button" className="btn btn-secondary" onClick={addItem}>
                  Add Item
                </button>
              </div>

              {formData.items.length > 0 && (
                <div className="items-list">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.productName}</td>
                          <td>{item.quantity}</td>
                          <td>Rs. {item.unitPrice.toLocaleString()}</td>
                          <td>Rs. {item.totalPrice.toLocaleString()}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => removeItem(index)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="totals-section">
              <div className="form-row">
                <div className="form-group">
                  <label>Subtotal (Rs.)</label>
                  <input
                    type="number"
                    value={formData.subtotal}
                    readOnly
                    className="readonly"
                  />
                </div>
                <div className="form-group">
                  <label>Tax (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.tax}
                    onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Discount (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Total Amount (Rs.)</label>
                  <input
                    type="number"
                    value={formData.totalAmount}
                    readOnly
                    className="readonly total-amount"
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Create Sale & Generate Invoice
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="sales-list">
        <h2>Recent Sales</h2>
        {sales.length === 0 ? (
          <div className="empty-state">
            <p>No local sales yet. Create your first sale!</p>
          </div>
        ) : (
          <div className="sales-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => (
                  <tr key={sale._id}>
                    <td>{sale.invoiceNumber}</td>
                    <td>{sale.customerName}</td>
                    <td>{sale.customerPhone}</td>
                    <td>{sale.items.length} item(s)</td>
                    <td>Rs. {sale.totalAmount.toLocaleString()}</td>
                    <td>{new Date(sale.saleDate).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => downloadPDF(sale)}
                          title="Download PDF"
                        >
                          <FontAwesomeIcon icon={faDownload} />
                        </button>
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => {
                            setSelectedSale(sale);
                            setShowQRModal(true);
                          }}
                          title="View QR Code"
                        >
                          <FontAwesomeIcon icon={faQrcode} />
                        </button>
                        <a
                          href={getInvoiceUrl(sale._id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-secondary"
                          title="View Invoice"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showQRModal && selectedSale && (
        <div className="modal-overlay" onClick={() => setShowQRModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Invoice QR Code</h3>
              <button className="modal-close" onClick={() => setShowQRModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Scan this QR code to view the invoice:</p>
              <div className="qr-code-container">
                <QRCodeSVG value={getInvoiceUrl(selectedSale._id)} size={256} />
              </div>
              <p className="invoice-number">Invoice #: {selectedSale.invoiceNumber}</p>
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={() => downloadPDF(selectedSale)}>
                  <FontAwesomeIcon icon={faDownload} /> Download PDF
                </button>
                <a
                  href={getInvoiceUrl(selectedSale._id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  <FontAwesomeIcon icon={faEye} /> View Invoice
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocalSales;
