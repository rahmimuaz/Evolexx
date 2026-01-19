import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaDownload, FaSpinner } from 'react-icons/fa';
import './InvoiceView.css';

const InvoiceView = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    fetchInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/local-sales/${id}`);
      setInvoice(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Invoice not found');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!invoice) return;

    // Dynamically import jsPDF and autoTable to avoid bundle size issues
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);

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
      doc.text(`Invoice #: ${invoice.invoiceNumber}`, pageWidth / 2, 30, { align: 'center' });

      let yPos = 50;

      // Customer Details
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('CUSTOMER DETAILS', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      yPos += 8;
      doc.text(`Name: ${invoice.customerName}`, margin, yPos);
      yPos += 6;
      doc.text(`Phone: ${invoice.customerPhone}`, margin, yPos);
      if (invoice.customerEmail) {
        yPos += 6;
        doc.text(`Email: ${invoice.customerEmail}`, margin, yPos);
      }
      if (invoice.customerAddress) {
        yPos += 6;
        doc.text(`Address: ${invoice.customerAddress}`, margin, yPos);
      }
      yPos += 10;

      // Items Table
      const tableColumns = ['Product', 'Qty', 'Unit Price', 'Total'];
      const tableRows = invoice.items.map(item => {
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
      doc.text(`Subtotal: Rs. ${invoice.subtotal.toLocaleString()}`, pageWidth - margin, yPos, { align: 'right' });
      if (invoice.tax > 0) {
        yPos += 6;
        doc.text(`Tax: Rs. ${invoice.tax.toLocaleString()}`, pageWidth - margin, yPos, { align: 'right' });
      }
      if (invoice.discount > 0) {
        yPos += 6;
        doc.text(`Discount: Rs. ${invoice.discount.toLocaleString()}`, pageWidth - margin, yPos, { align: 'right' });
      }
      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Total: Rs. ${invoice.totalAmount.toLocaleString()}`, pageWidth - margin, yPos, { align: 'right' });

      // Footer
      yPos += 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(`Payment Method: ${invoice.paymentMethod.toUpperCase()}`, margin, yPos);
      doc.text(`Date: ${new Date(invoice.saleDate).toLocaleDateString()}`, pageWidth - margin, yPos, { align: 'right' });

      doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      alert('Error generating PDF. Please try again or contact support.');
      console.error('PDF generation error:', error);
    }
  };

  if (loading) {
    return (
      <div className="invoice-loading">
        <FaSpinner className="spinning" style={{ fontSize: '2rem' }} />
        <p>Loading invoice...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invoice-error">
        <h2>Invoice Not Found</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  return (
    <div className="invoice-view-container">
      <div className="invoice-header">
        <div className="invoice-header-content">
          <h1>INVOICE</h1>
          <p className="invoice-number">Invoice #: {invoice.invoiceNumber}</p>
        </div>
        <button className="btn-download" onClick={downloadPDF}>
          <FaDownload /> Download PDF
        </button>
      </div>

      <div className="invoice-body">
        <div className="invoice-section">
          <h2>Customer Details</h2>
          <div className="customer-details">
            <p><strong>Name:</strong> {invoice.customerName}</p>
            <p><strong>Phone:</strong> {invoice.customerPhone}</p>
            {invoice.customerEmail && <p><strong>Email:</strong> {invoice.customerEmail}</p>}
            {invoice.customerAddress && <p><strong>Address:</strong> {invoice.customerAddress}</p>}
          </div>
        </div>

        <div className="invoice-section">
          <h2>Items</h2>
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => {
                let productName = item.productName;
                if (item.selectedVariation && item.selectedVariation.attributes) {
                  const attrs = item.selectedVariation.attributes instanceof Map
                    ? Object.fromEntries(item.selectedVariation.attributes.entries())
                    : item.selectedVariation.attributes;
                  const attrStrings = Object.entries(attrs).map(([k, v]) => `${k}: ${v}`);
                  productName += ` (${attrStrings.join(', ')})`;
                }
                return (
                  <tr key={index}>
                    <td>{productName}</td>
                    <td>{item.quantity}</td>
                    <td>Rs. {item.unitPrice.toLocaleString()}</td>
                    <td>Rs. {item.totalPrice.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="invoice-section invoice-totals">
          <div className="totals-row">
            <span>Subtotal:</span>
            <span>Rs. {invoice.subtotal.toLocaleString()}</span>
          </div>
          {invoice.tax > 0 && (
            <div className="totals-row">
              <span>Tax:</span>
              <span>Rs. {invoice.tax.toLocaleString()}</span>
            </div>
          )}
          {invoice.discount > 0 && (
            <div className="totals-row">
              <span>Discount:</span>
              <span>- Rs. {invoice.discount.toLocaleString()}</span>
            </div>
          )}
          <div className="totals-row total-amount">
            <span>Total Amount:</span>
            <span>Rs. {invoice.totalAmount.toLocaleString()}</span>
          </div>
        </div>

        <div className="invoice-section invoice-footer">
          <p><strong>Payment Method:</strong> {invoice.paymentMethod.toUpperCase()}</p>
          <p><strong>Date:</strong> {new Date(invoice.saleDate).toLocaleDateString()}</p>
          {invoice.notes && (
            <p><strong>Notes:</strong> {invoice.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;
