import express from 'express';
import PurchaseEntry from '../models/PurchaseEntry.js';

const router = express.Router();

// Get all purchase entries with filters and pagination
router.get('/', async (req, res) => {
    try {
        const { search, fromDate, toDate, page = 1, limit = 20 } = req.query;

        const query = {};

        // Search by invoice number or supplier name
        if (search) {
            query.$or = [
                { invoiceNumber: { $regex: search, $options: 'i' } },
                { 'supplier.name': { $regex: search, $options: 'i' } }
            ];
        }

        // Date range filter
        if (fromDate || toDate) {
            query.date = {};
            if (fromDate) query.date.$gte = new Date(fromDate);
            if (toDate) query.date.$lte = new Date(toDate);
        }

        const entries = await PurchaseEntry.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ date: -1, createdAt: -1 });

        const total = await PurchaseEntry.countDocuments(query);

        res.json({
            success: true,
            data: entries,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single purchase entry by ID
router.get('/:id', async (req, res) => {
    try {
        const entry = await PurchaseEntry.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Purchase entry not found' });
        }
        res.json({ success: true, data: entry });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create new purchase entry
router.post('/', async (req, res) => {
    try {
        const { supplier, date, invoiceNumber, items, notes } = req.body;

        if (!invoiceNumber) {
            return res.status(400).json({ success: false, message: 'Invoice number is required for purchase entries' });
        }

        // Calculate totals
        let subtotal = 0;
        let totalCgst = 0;
        let totalSgst = 0;
        let totalIgst = 0;

        const processedItems = items.map(item => {
            const amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
            const cgstAmount = (amount * (parseFloat(item.cgst) || 0)) / 100;
            const sgstAmount = (amount * (parseFloat(item.sgst) || 0)) / 100;
            const igstAmount = (amount * (parseFloat(item.igst) || 0)) / 100;
            const total = amount + cgstAmount + sgstAmount + igstAmount;

            subtotal += amount;
            totalCgst += cgstAmount;
            totalSgst += sgstAmount;
            totalIgst += igstAmount;

            return {
                particular: item.particular,
                size: item.size || '',
                quantity: parseFloat(item.quantity) || 0,
                rate: parseFloat(item.rate) || 0,
                amount,
                cgst: parseFloat(item.cgst) || 0,
                sgst: parseFloat(item.sgst) || 0,
                igst: parseFloat(item.igst) || 0,
                total
            };
        });

        const totalTax = totalCgst + totalSgst + totalIgst;
        const grandTotal = subtotal + totalTax;

        const entry = new PurchaseEntry({
            invoiceNumber,
            date: date || new Date(),
            supplier: {
                name: supplier.name || supplier,
                mobile: supplier.mobile || '',
                gstin: supplier.gstin || '',
                address: supplier.address || ''
            },
            items: processedItems,
            subtotal,
            totalCgst,
            totalSgst,
            totalIgst,
            totalTax,
            grandTotal,
            notes
        });

        await entry.save();
        res.status(201).json({ success: true, data: entry });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update purchase entry
router.put('/:id', async (req, res) => {
    try {
        const { supplier, date, invoiceNumber, items, notes, status } = req.body;

        // Recalculate totals if items are updated
        let updateData = { notes, status };

        if (date) updateData.date = date;
        if (invoiceNumber) updateData.invoiceNumber = invoiceNumber;
        if (supplier) {
            updateData.supplier = {
                name: supplier.name || supplier,
                mobile: supplier.mobile || '',
                gstin: supplier.gstin || '',
                address: supplier.address || ''
            };
        }

        if (items && items.length > 0) {
            let subtotal = 0;
            let totalCgst = 0;
            let totalSgst = 0;
            let totalIgst = 0;

            const processedItems = items.map(item => {
                const amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
                const cgstAmount = (amount * (parseFloat(item.cgst) || 0)) / 100;
                const sgstAmount = (amount * (parseFloat(item.sgst) || 0)) / 100;
                const igstAmount = (amount * (parseFloat(item.igst) || 0)) / 100;
                const total = amount + cgstAmount + sgstAmount + igstAmount;

                subtotal += amount;
                totalCgst += cgstAmount;
                totalSgst += sgstAmount;
                totalIgst += igstAmount;

                return {
                    particular: item.particular,
                    size: item.size || '',
                    quantity: parseFloat(item.quantity) || 0,
                    rate: parseFloat(item.rate) || 0,
                    amount,
                    cgst: parseFloat(item.cgst) || 0,
                    sgst: parseFloat(item.sgst) || 0,
                    igst: parseFloat(item.igst) || 0,
                    total
                };
            });

            const totalTax = totalCgst + totalSgst + totalIgst;
            const grandTotal = subtotal + totalTax;

            updateData = {
                ...updateData,
                items: processedItems,
                subtotal,
                totalCgst,
                totalSgst,
                totalIgst,
                totalTax,
                grandTotal
            };
        }

        const entry = await PurchaseEntry.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!entry) {
            return res.status(404).json({ success: false, message: 'Purchase entry not found' });
        }

        res.json({ success: true, data: entry });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete purchase entry
router.delete('/:id', async (req, res) => {
    try {
        const entry = await PurchaseEntry.findByIdAndDelete(req.params.id);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Purchase entry not found' });
        }
        res.json({ success: true, message: 'Purchase entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
