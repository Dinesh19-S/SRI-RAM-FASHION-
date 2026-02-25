import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import Bill from '../models/Bill.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import { generateBillPDF } from './pdfGenerator.js';
import dotenv from 'dotenv';

dotenv.config();

// ========== Resend HTTP API (Primary - works over HTTPS) ==========
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
if (resend) {
  console.log('📧 Resend HTTP email configured (API key found)');
} else {
  console.log('📧 Resend not configured - no RESEND_API_KEY in .env');
}

// ========== Nodemailer SMTP (Fallback) ==========
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
};

let transporter = createTransporter();

// Refresh transporter if env changes
export const refreshTransporter = () => {
  transporter = createTransporter();
};

// Check if email service is configured
export const isEmailConfigured = () => {
  return !!resend || !!transporter;
};

// Send email - tries Resend HTTP first, then SMTP fallback
const sendEmail = async (to, subject, html, attachments = []) => {
  // Method 1: Resend HTTP API (works on any network)
  if (resend) {
    try {
      const fromEmail = process.env.RESEND_FROM || 'Sri Ram Fashions <onboarding@resend.dev>';
      console.log('📧 Sending via Resend to:', to, 'from:', fromEmail);
      const emailPayload = {
        from: fromEmail,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      };

      // Add attachments for Resend (base64 format)
      if (attachments && attachments.length > 0) {
        emailPayload.attachments = attachments.map(att => ({
          filename: att.filename,
          content: att.content, // Buffer will be auto-handled by Resend
        }));
      }

      const { data, error } = await resend.emails.send(emailPayload);
      if (error) {
        console.error('❌ Resend API error:', JSON.stringify(error));
        // Fall through to SMTP
      } else {
        console.log('✅ Email sent via Resend:', data?.id);
        return { success: true, messageId: data?.id };
      }
    } catch (error) {
      console.error('❌ Resend exception:', error.message || error);
      // Fall through to SMTP
    }
  }

  // Method 2: SMTP (Nodemailer)
  if (transporter) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || `Sri Ram Fashions <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        attachments,
      };
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent via SMTP:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ SMTP error:', error.message);
      return { success: false, message: error.message };
    }
  }

  console.log('📧 Email not configured. Would send to:', to, 'Subject:', subject);
  return { success: false, message: 'Email service not configured. Set RESEND_API_KEY or EMAIL_USER+EMAIL_PASS in .env' };
};

// Send bill notification to admin/staff with PDF attachment
export const sendBillNotification = async (bill, recipientEmails) => {
  const subject = `New Bill Created - ${bill.billNumber}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .footer { background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        .bill-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .detail-label { color: #6b7280; }
        .detail-value { font-weight: bold; }
        .total { font-size: 1.5em; color: #059669; }
        .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🧾 New Bill Created</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Sri Ram Fashions</p>
        </div>
        <div class="content">
          <p>A new bill has been generated in the system. Please find the bill PDF attached.</p>
          
          <div class="bill-details">
            <div class="detail-row">
              <span class="detail-label">Bill Number</span>
              <span class="detail-value">${bill.billNumber}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Customer</span>
              <span class="detail-value">${bill.customer?.name || bill.customer?.companyName || 'Walk-in Customer'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date</span>
              <span class="detail-value">${new Date(bill.date || bill.createdAt).toLocaleDateString('en-IN')}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Items</span>
              <span class="detail-value">${bill.items?.length || 0} items</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Grand Total</span>
              <span class="detail-value total">₹${(bill.grandTotal || 0).toLocaleString('en-IN')}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Status</span>
              <span class="detail-value">${bill.paymentStatus || 'Pending'}</span>
            </div>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            This notification was auto-generated by Sri Ram Fashions Business Management System.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Sri Ram Fashions. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Generate PDF attachment
  let attachments = [];
  try {
    console.log('📄 Generating bill PDF for email attachment...');
    const pdfBuffer = await generateBillPDF(bill);
    attachments = [{
      filename: `SRI_RAM_FASHIONS_Invoice_${bill.billNumber || 'bill'}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    }];
    console.log('✅ Bill PDF generated successfully');
  } catch (pdfError) {
    console.error('⚠️ Failed to generate bill PDF, sending email without attachment:', pdfError.message);
  }

  const emails = Array.isArray(recipientEmails) ? recipientEmails : [recipientEmails];
  const results = await Promise.all(emails.map(email => sendEmail(email, subject, html, attachments)));
  return results;
};

// Send low stock alert
export const sendLowStockAlert = async (products, recipientEmails) => {
  const subject = `⚠️ Low Stock Alert - ${products.length} Items Need Attention`;

  const productRows = products.map(p => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${p.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${p.stock}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${p.lowStockThreshold}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .footer { background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; margin: 15px 0; }
        th { background: #374151; color: white; padding: 12px; text-align: left; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">⚠️ Low Stock Alert</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">${products.length} items need restocking</p>
        </div>
        <div class="content">
          <p>The following products are running low on stock:</p>
          
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th style="text-align: center;">Current Stock</th>
                <th style="text-align: center;">Minimum</th>
              </tr>
            </thead>
            <tbody>
              ${productRows}
            </tbody>
          </table>
          
          <p style="color: #6b7280; font-size: 14px;">
            Please restock these items to avoid stockouts.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Sri Ram Fashions. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emails = Array.isArray(recipientEmails) ? recipientEmails : [recipientEmails];
  const results = await Promise.all(emails.map(email => sendEmail(email, subject, html)));
  return results;
};

// Orchestrate low stock check and notification
export const checkAndNotifyLowStock = async (product) => {
  // 1. Check if actually low stock
  if (product.stock > product.lowStockThreshold) return;

  // 2. Throttle: Only send one alert per product per 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (product.lastLowStockAlertAt && product.lastLowStockAlertAt > oneDayAgo) {
    return;
  }

  // 3. Send alert (to ADMIN_EMAIL if configured)
  if (process.env.ADMIN_EMAIL) {
    console.log(`📡 Triggering low stock alert for: ${product.name} (Stock: ${product.stock})`);
    const adminEmails = process.env.ADMIN_EMAIL.split(',').map(e => e.trim());

    // We send a list with just this one product for this trigger
    await sendLowStockAlert([product], adminEmails);

    // 4. Update last alerted timestamp
    product.lastLowStockAlertAt = new Date();
    await product.save();
  }
};

// Send daily summary
export const sendDailySummary = async (summary, recipientEmails) => {
  const subject = `📊 Daily Business Summary - ${new Date().toLocaleDateString('en-IN')}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .footer { background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 2em; font-weight: bold; color: #059669; }
        .stat-label { color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">📊 Daily Summary</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div class="content">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">₹${(summary.totalRevenue || 0).toLocaleString('en-IN')}</div>
              <div class="stat-label">Today's Revenue</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${summary.totalOrders || 0}</div>
              <div class="stat-label">Orders</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${summary.newCustomers || 0}</div>
              <div class="stat-label">New Customers</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${summary.lowStockItems || 0}</div>
              <div class="stat-label">Low Stock Items</div>
            </div>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Sri Ram Fashions. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emails = Array.isArray(recipientEmails) ? recipientEmails : [recipientEmails];
  const results = await Promise.all(emails.map(email => sendEmail(email, subject, html)));
  return results;
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetCode) => {
  const subject = '🔐 Password Reset Code - Sri Ram Fashions';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        .code-box { background: white; border: 2px dashed #d4a574; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
        .code { font-size: 2.5em; font-weight: bold; letter-spacing: 8px; color: #1e293b; font-family: monospace; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 20px 0; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 1.5em;">🔐 Password Reset</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Sri Ram Fashions</p>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>We received a request to reset your password. Use the code below to complete the process:</p>
          
          <div class="code-box">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Your Reset Code</p>
            <div class="code">${resetCode}</div>
          </div>
          
          <div class="warning">
            ⏰ This code will expire in <strong>10 minutes</strong>. Do not share it with anyone.
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            If you did not request a password reset, please ignore this email. Your account is safe.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Sri Ram Fashions. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(email, subject, html);
};

// Email report function – A4-ready, professionally styled
export const sendReportEmail = async (data, options, recipientEmails) => {
  const { title, fromDate, toDate, type } = options;
  const subject = `📄 ${title} | Sri Ram Fashions – ${new Date().toLocaleDateString('en-IN')}`;

  const reportData = Array.isArray(data) ? data : [];
  const formatNumber = (value) => Number(value || 0).toLocaleString('en-IN');
  const formatMoney = (value) => `₹ ${formatNumber(value)}`;
  const formatDateValue = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('en-IN');
  };

  const periodText = fromDate && toDate
    ? `From: ${fromDate}  |  To: ${toDate}`
    : fromDate
      ? `From: ${fromDate}`
      : toDate
        ? `To: ${toDate}`
        : `Date: ${new Date().toLocaleDateString('en-IN')}`;

  let headers = [];
  let alignments = [];
  let rowsHtml = '';
  let totalsRowHtml = '';

  if (type === 'stock') {
    headers = ['S.No', 'Item', 'Size', 'Quantity', 'Rate', 'Total'];
    alignments = ['left', 'left', 'left', 'right', 'right', 'right'];

    rowsHtml = reportData.map((row, i) => {
      const lineTotal = Number(row.total || (Number(row.rate || 0) * Number(row.qty || 0)));
      const bg = i % 2 === 0 ? '#ffffff' : '#f9fafb';
      return `<tr style="background:${bg};">
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${row.sno ?? ''}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${row.item ?? ''}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${row.size ?? ''}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatNumber(row.qty)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatMoney(row.rate)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${formatMoney(lineTotal)}</td>
      </tr>`;
    }).join('');

    const totQty = reportData.reduce((s, r) => s + Number(r.qty || 0), 0);
    const grandTotal = reportData.reduce((s, r) => s + Number(r.total || (Number(r.rate || 0) * Number(r.qty || 0))), 0);

    totalsRowHtml = `<tr style="background:#eef2ff;font-weight:700;border-top:2px solid #374151;">
      <td colspan="3" style="padding:12px;font-size:14px;">GRAND TOTAL</td>
      <td style="padding:12px;text-align:right;font-size:14px;">${formatNumber(totQty)}</td>
      <td style="padding:12px;text-align:right;font-size:14px;"></td>
      <td style="padding:12px;text-align:right;font-size:15px;color:#1e40af;">${formatMoney(grandTotal)}</td>
    </tr>`;

  } else if (type === 'auditor-sales' || type === 'auditor-purchase') {
    headers = ['Company Name', 'GSTIN', 'Date', 'Inv No', 'Taxable Amt', 'CGST', 'SGST', 'IGST', 'Total'];
    alignments = ['left', 'left', 'left', 'left', 'right', 'right', 'right', 'right', 'right'];

    rowsHtml = reportData.map((row, i) => {
      const bg = i % 2 === 0 ? '#ffffff' : '#f9fafb';
      return `<tr style="background:${bg};">
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${row.companyName ?? ''}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:12px;">${row.gstin ?? ''}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${formatDateValue(row.date)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${row.invNo ?? ''}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatMoney(row.taxableAmount)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatMoney(row.cgst)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatMoney(row.sgst)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatMoney(row.igst)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${formatMoney(row.total)}</td>
      </tr>`;
    }).join('');

    const totals = reportData.reduce((acc, row) => ({
      taxableAmount: acc.taxableAmount + Number(row.taxableAmount || 0),
      cgst: acc.cgst + Number(row.cgst || 0),
      sgst: acc.sgst + Number(row.sgst || 0),
      igst: acc.igst + Number(row.igst || 0),
      total: acc.total + Number(row.total || 0)
    }), { taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });

    totalsRowHtml = `<tr style="background:#eef2ff;font-weight:700;border-top:2px solid #374151;">
      <td colspan="4" style="padding:12px;font-size:14px;">GRAND TOTAL</td>
      <td style="padding:12px;text-align:right;font-size:14px;">${formatMoney(totals.taxableAmount)}</td>
      <td style="padding:12px;text-align:right;font-size:14px;">${formatMoney(totals.cgst)}</td>
      <td style="padding:12px;text-align:right;font-size:14px;">${formatMoney(totals.sgst)}</td>
      <td style="padding:12px;text-align:right;font-size:14px;">${formatMoney(totals.igst)}</td>
      <td style="padding:12px;text-align:right;font-size:15px;color:#1e40af;">${formatMoney(totals.total)}</td>
    </tr>`;

  } else {
    headers = ['S.No', 'Date', 'Invoice No', 'Item', 'Rate', 'Qty', 'Total'];
    alignments = ['left', 'left', 'left', 'left', 'right', 'right', 'right'];

    rowsHtml = reportData.map((row, i) => {
      const lineTotal = Number(row.rate || 0) * Number(row.qty || 0);
      const bg = i % 2 === 0 ? '#ffffff' : '#f9fafb';
      return `<tr style="background:${bg};">
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${row.sno ?? ''}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${formatDateValue(row.date)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${row.invNo ?? ''}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${row.item ?? ''}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatMoney(row.rate)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatNumber(row.qty)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${formatMoney(lineTotal)}</td>
      </tr>`;
    }).join('');

    const totQty = reportData.reduce((s, r) => s + Number(r.qty || 0), 0);
    const grandTotal = reportData.reduce((s, r) => s + (Number(r.rate || 0) * Number(r.qty || 0)), 0);

    totalsRowHtml = `<tr style="background:#eef2ff;font-weight:700;border-top:2px solid #374151;">
      <td colspan="5" style="padding:12px;font-size:14px;">GRAND TOTAL</td>
      <td style="padding:12px;text-align:right;font-size:14px;">${formatNumber(totQty)}</td>
      <td style="padding:12px;text-align:right;font-size:15px;color:#1e40af;">${formatMoney(grandTotal)}</td>
    </tr>`;
  }

  if (!rowsHtml) {
    rowsHtml = `<tr><td colspan="${headers.length || 1}" style="padding:24px;text-align:center;color:#6b7280;font-style:italic;">No data available for this report.</td></tr>`;
    totalsRowHtml = '';
  }

  const thCells = headers.map((h, idx) => {
    const align = alignments[idx] || 'left';
    return `<th style="padding:12px;text-align:${align};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#374151;background:#f0f4ff;border-bottom:2px solid #3b82f6;font-weight:700;">${h}</th>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${title} - Sri Ram Fashions</title></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Segoe UI',Arial,Helvetica,sans-serif;line-height:1.5;color:#1f2937;">
  <div style="max-width:794px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);padding:28px 32px;text-align:center;">
      <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:1px;">Sri Ram Fashions</h1>
      <p style="margin:6px 0 0;font-size:10px;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.7);">Business Management System</p>
    </div>
    <div style="background:#f0f4ff;padding:16px 32px;border-bottom:1px solid #dbeafe;text-align:center;">
      <h2 style="margin:0;font-size:18px;font-weight:700;color:#1e40af;">${title}</h2>
      <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${periodText}</p>
    </div>
    <div style="padding:24px 24px 32px;">
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;" cellpadding="0" cellspacing="0">
        <thead><tr>${thCells}</tr></thead>
        <tbody>${rowsHtml}</tbody>
        ${totalsRowHtml ? `<tfoot>${totalsRowHtml}</tfoot>` : ''}
      </table>
      <p style="margin:20px 0 0;font-size:11px;color:#9ca3af;text-align:center;">This report was auto-generated by Sri Ram Fashions Business Management System.</p>
    </div>
    <div style="background:#1f2937;padding:16px 32px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Sri Ram Fashions. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  const emails = Array.isArray(recipientEmails) ? recipientEmails : [recipientEmails];
  const responses = await Promise.all(emails.map(email => sendEmail(email, subject, html)));
  return responses;
};

// Generic notification email
export const sendNotification = async (to, subject, message) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .footer { background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🔔 Notification</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Sri Ram Fashions</p>
        </div>
        <div class="content">
          <p>${message}</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Sri Ram Fashions. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(to, subject, html);
};

// Calculate and send daily summary (Reusable by route and scheduler)
export const calculateAndSendDailySummary = async (recipientEmails) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Calculate Today's Revenue & Orders
    const billsToday = await Bill.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const totalRevenue = billsToday.reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);
    const totalOrders = billsToday.length;

    // 2. Count New Customers
    const newCustomers = await Customer.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    // 3. Count Low Stock Items
    const lowStockItems = await Product.countDocuments({
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    });

    const summary = {
      totalRevenue,
      totalOrders,
      newCustomers,
      lowStockItems
    };

    const results = await sendDailySummary(summary, recipientEmails);
    return { success: true, data: summary, results };
  } catch (error) {
    console.error('Error calculating daily summary:', error);
    return { success: false, message: error.message };
  }
};

export default {
  sendBillNotification,
  sendPasswordResetEmail,
  sendLowStockAlert,
  sendReportEmail,
  sendNotification,
  calculateAndSendDailySummary,
  isEmailConfigured,
  checkAndNotifyLowStock
};
