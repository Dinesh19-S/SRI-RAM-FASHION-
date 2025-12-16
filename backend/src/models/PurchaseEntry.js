import mongoose from 'mongoose';

const purchaseEntryItemSchema = new mongoose.Schema({
    particular: { type: String, required: true },
    size: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    total: { type: Number, required: true }
});

const purchaseEntrySchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    supplier: {
        name: { type: String, required: true },
        mobile: { type: String },
        gstin: { type: String },
        address: { type: String }
    },
    items: [purchaseEntryItemSchema],
    subtotal: { type: Number, default: 0 },
    totalCgst: { type: Number, default: 0 },
    totalSgst: { type: Number, default: 0 },
    totalIgst: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    notes: { type: String },
    status: {
        type: String,
        enum: ['draft', 'completed', 'cancelled'],
        default: 'completed'
    }
}, { timestamps: true });

// Index for efficient queries
purchaseEntrySchema.index({ invoiceNumber: 1 });
purchaseEntrySchema.index({ date: -1 });
purchaseEntrySchema.index({ 'supplier.name': 1 });

export default mongoose.model('PurchaseEntry', purchaseEntrySchema);
