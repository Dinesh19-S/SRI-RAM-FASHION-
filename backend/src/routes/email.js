import express from 'express';
import Bill from '../models/Bill.js';
import {
    isEmailConfigured,
    sendBillNotification,
    sendNotification,
    sendReportEmail,
    calculateAndSendDailySummary
} from '../services/emailService.js';

const router = express.Router();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const splitRecipients = (value) => {
    if (Array.isArray(value)) {
        return value.flatMap((entry) => splitRecipients(entry));
    }

    return String(value || '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
};

const uniqueRecipients = (values = []) => {
    const flattened = splitRecipients(values);
    return [...new Set(flattened.map((entry) => entry.toLowerCase()))];
};

const invalidRecipients = (recipients = []) => recipients.filter((entry) => !EMAIL_PATTERN.test(entry));

const resolveRecipients = (req, ...fallbackSources) => {
    const requestedRecipients = uniqueRecipients(req.body?.to);
    const fallbackRecipients = uniqueRecipients([
        req.user?.email,
        ...fallbackSources,
        process.env.ADMIN_EMAIL,
        process.env.EMAIL_USER
    ]);

    const recipients = requestedRecipients.length > 0 ? requestedRecipients : fallbackRecipients;

    return {
        recipients: recipients.filter((entry) => EMAIL_PATTERN.test(entry)),
        invalidRecipients: invalidRecipients(recipients)
    };
};

const getEmailProvider = () => {
    if (process.env.RESEND_API_KEY) return 'resend';
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) return 'smtp';
    return null;
};

const formatRecipientList = (recipients = []) => recipients.join(', ');

// Check email configuration status
router.get('/status', (req, res) => {
    const defaultRecipients = uniqueRecipients([
        req.user?.email,
        process.env.ADMIN_EMAIL,
        process.env.EMAIL_USER
    ]);

    res.json({
        success: true,
        configured: isEmailConfigured(),
        provider: getEmailProvider(),
        defaultRecipient: defaultRecipients[0] || '',
        defaultRecipients,
        emailUser: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.slice(0, 3)}***` : null
    });
});

// Send test email
router.post('/test', async (req, res) => {
    try {
        if (!isEmailConfigured()) {
            return res.status(400).json({
                success: false,
                message: 'Email service not configured. Set RESEND_API_KEY or EMAIL_USER and EMAIL_PASS in .env'
            });
        }

        const { recipients, invalidRecipients: invalid } = resolveRecipients(req);
        if (invalid.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid email address: ${invalid.join(', ')}`
            });
        }

        if (recipients.length === 0) {
            return res.status(400).json({ success: false, message: 'No recipient email provided' });
        }

        const result = await sendNotification(
            recipients,
            'Test Email - Sri Ram Fashions',
            'This is a test email to verify your email configuration is working correctly.'
        );

        res.json({
            success: result.success,
            message: result.success ? `Test email sent to ${formatRecipientList(recipients)}` : result.message
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Send daily summary email
router.post('/daily-summary', async (req, res) => {
    try {
        if (!isEmailConfigured()) {
            return res.status(400).json({
                success: false,
                message: 'Email service not configured'
            });
        }

        const { recipients, invalidRecipients: invalid } = resolveRecipients(req);
        if (invalid.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid email address: ${invalid.join(', ')}`
            });
        }

        if (recipients.length === 0) {
            return res.status(400).json({ success: false, message: 'No recipient email configured' });
        }

        const result = await calculateAndSendDailySummary(recipients);

        res.json({
            success: result.success,
            message: result.success ? `Daily summary sent to ${formatRecipientList(recipients)}` : result.message,
            data: result.data
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Send report email
router.post('/send-report', async (req, res) => {
    try {
        const { type, fromDate, toDate, data } = req.body;

        if (!isEmailConfigured()) {
            return res.status(400).json({
                success: false,
                message: 'Email service not configured'
            });
        }

        const { recipients, invalidRecipients: invalid } = resolveRecipients(req);
        if (invalid.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid email address: ${invalid.join(', ')}`
            });
        }

        if (recipients.length === 0) {
            return res.status(400).json({ success: false, message: 'No recipient email configured' });
        }

        const reportTitles = {
            sales: 'Sales Report',
            purchase: 'Purchase Report',
            stock: 'Stock Report',
            'auditor-sales': 'Auditor Sales Report',
            'auditor-purchase': 'Auditor Purchase Report'
        };
        const title = reportTitles[type] || 'Report';
        const options = { title, fromDate, toDate, type };

        const results = await sendReportEmail(data, options, recipients);
        const sent = results.some((entry) => entry.success);

        res.json({
            success: sent,
            message: sent ? `${title} sent to ${formatRecipientList(recipients)}` : 'Failed to send email report'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Send bill email
router.post('/send-bill/:billId', async (req, res) => {
    try {
        const { billId } = req.params;

        const bill = await Bill.findById(billId);
        if (!bill) {
            return res.status(404).json({ success: false, message: 'Bill not found' });
        }

        if (!isEmailConfigured()) {
            return res.status(400).json({
                success: false,
                message: 'Email service not configured. Set RESEND_API_KEY or EMAIL_USER and EMAIL_PASS in .env'
            });
        }

        const { recipients, invalidRecipients: invalid } = resolveRecipients(req, bill.customer?.email);
        if (invalid.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid email address: ${invalid.join(', ')}`
            });
        }

        if (recipients.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No email address found. Please provide a recipient email.'
            });
        }

        const results = await sendBillNotification(bill, recipients);
        const sent = results.some((entry) => entry.success);

        res.json({
            success: sent,
            message: sent ? `Bill ${bill.billNumber} emailed to ${formatRecipientList(recipients)}` : 'Failed to send email'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
