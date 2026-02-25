import express from 'express';
import PurchaseEntry from '../models/PurchaseEntry.js';
import Bill from '../models/Bill.js';
import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';

const router = express.Router();

// Generate PURCHASE bill number (PUR-0001 format)
const generatePurchaseBillNumber = async () => {
    const count = await Bill.countDocuments({ billType: 'PURCHASE' });
    return `PUR-${(count + 1).toString().padStart(4, '0')}`;
};

// Number to words for Indian currency
const numberToWords = (num) => {
    return `Rupees ${Math.floor(num)} Only`;
};

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

// Create new purchase entry + auto-generate PURCHASE bill
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

        // === Auto-generate PURCHASE bill ===
        const billItems = [];
        let billSubtotal = 0;
        let billTotalTax = 0;

        for (const item of entry.items) {
            const itemSubtotal = item.quantity * item.rate;
            const itemCgstAmount = (itemSubtotal * (item.cgst || 0)) / 100;
            const itemSgstAmount = (itemSubtotal * (item.sgst || 0)) / 100;
            const itemIgstAmount = (itemSubtotal * (item.igst || 0)) / 100;
            const gstAmount = itemCgstAmount + itemSgstAmount + itemIgstAmount;
            const gstRate = (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0);

            const billItem = {
                productName: item.particular,
                sizesOrPieces: item.size || '',
                quantity: item.quantity,
                price: item.rate,
                ratePerPiece: item.rate,
                pcsInPack: 1,
                ratePerPack: item.rate,
                noOfPacks: item.quantity,
                gstRate: gstRate,
                gstAmount: gstAmount,
                discount: 0,
                total: itemSubtotal + gstAmount
            };

            billItems.push(billItem);
            billSubtotal += itemSubtotal;
            billTotalTax += gstAmount;
        }

        // Increase stock for items that match products by name
        for (const item of entry.items) {
            const product = await Product.findOne({ name: { $regex: new RegExp(`^${item.particular}$`, 'i') } });
            if (product) {
                const previousStock = product.stock;
                product.stock += item.quantity;
                await product.save();

                // Record stock movement
                await new StockMovement({
                    product: product._id,
                    type: 'in',
                    quantity: item.quantity,
                    previousStock: previousStock,
                    newStock: product.stock,
                    reason: `Purchased - Purchase Entry #${entry.invoiceNumber}`
                }).save();
            }
        }

        const billCgst = billTotalTax / 2;
        const billSgst = billTotalTax / 2;
        const billGrandTotal = Math.round(billSubtotal + billTotalTax);
        const billRoundOff = billGrandTotal - (billSubtotal + billTotalTax);
        const totalPacks = entry.items.reduce((sum, item) => sum + item.quantity, 0);

        const bill = new Bill({
            billNumber: await generatePurchaseBillNumber(),
            billType: 'PURCHASE',
            partyName: entry.supplier.name,
            date: entry.date,
            customer: {
                name: entry.supplier.name,
                phone: entry.supplier.mobile || '',
                address: entry.supplier.address || '',
                gstin: entry.supplier.gstin || '',
                state: 'Tamilnadu',
                stateCode: '33'
            },
            items: billItems,
            subtotal: billSubtotal,
            discountAmount: 0,
            taxableAmount: billSubtotal,
            cgst: billCgst,
            sgst: billSgst,
            totalTax: billTotalTax,
            grandTotal: billGrandTotal,
            roundOff: billRoundOff,
            totalPacks,
            numOfBundles: 1,
            amountInWords: numberToWords(billGrandTotal),
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            notes: `Auto-generated from Purchase Entry #${entry.invoiceNumber}`
        });

        await bill.save();

        res.status(201).json({ success: true, data: entry, bill: bill });
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
