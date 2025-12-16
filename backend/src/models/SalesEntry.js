import mongoose from 'mongoose';

const salesEntryItemSchema = new mongoose.Schema({
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

const salesEntrySchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    customer: {
        name: { type: String, required: true },
        mobile: { type: String },
        gstin: { type: String },
        address: { type: String }
    },
    items: [salesEntryItemSchema],
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

// Auto-generate invoice number before saving
salesEntrySchema.pre('save', async function (next) {
    if (this.isNew && !this.invoiceNumber) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const count = await mongoose.model('SalesEntry').countDocuments() + 1;
        this.invoiceNumber = `SINV${year}${month}${count.toString().padStart(4, '0')}`;
    }
    next();
});

// Index for efficient queries
salesEntrySchema.index({ invoiceNumber: 1 });
salesEntrySchema.index({ date: -1 });
salesEntrySchema.index({ 'customer.name': 1 });

export default mongoose.model('SalesEntry', salesEntrySchema);
