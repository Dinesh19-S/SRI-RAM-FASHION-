import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import Bill from '../models/Bill.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
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
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      });
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

// Send bill notification to admin/staff
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
          <p>A new bill has been generated in the system:</p>
          
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

  const emails = Array.isArray(recipientEmails) ? recipientEmails : [recipientEmails];
  const results = await Promise.all(emails.map(email => sendEmail(email, subject, html)));
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

// Email report function
export const sendReportEmail = async (data, options, recipientEmails) => {
  const { title, fromDate, toDate, type } = options;
  const subject = `📄 ${title} - ${new Date().toLocaleDateString('en-IN')}`;

  const headers = type === 'purchase'
    ? ['S.No', 'Date', 'Invoice No', 'Item', 'Rate', 'Qty', 'Total']
    : ['S.No', 'Date', 'Inv No', 'Item', 'Rate', 'Qty', 'Total'];

  const rowsHtml = data.map(row => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${row.sno}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${new Date(row.date).toLocaleDateString('en-IN')}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${row.invNo}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${row.item}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${row.rate}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${row.qty}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">₹${(row.rate * row.qty).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const grandTotal = data.reduce((sum, row) => sum + (row.rate * row.qty), 0);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f3f4f6; }
        .container { max-width: 800px; margin: 20px auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .footer { background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 12px 12px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background-color: #f9fafb; color: #4b5563; font-weight: bold; padding: 12px 10px; border-bottom: 2px solid #e5e7eb; text-align: left; font-size: 13px; text-transform: uppercase; }
        td { font-size: 14px; }
        .total-row { background-color: #f3f4f6; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">${title}</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">Period: ${fromDate} to ${toDate}</p>
        </div>
        <div class="content">
          <p style="margin-top: 0; color: #6b7280;">Hello,</p>
          <p>Please find the requested <strong>${title}</strong> details below:</p>
          
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="6" style="padding: 12px 10px; text-align: right;">Grand Total:</td>
                <td style="padding: 12px 10px; text-align: right; color: #1e40af; font-size: 16px;">₹${grandTotal.toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Sri Ram Fashions. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

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
