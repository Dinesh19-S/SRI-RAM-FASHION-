import { useState } from 'react';
import { Search, Plus, ArrowLeft, FileText, Save, Eye, Edit, Trash2 } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

const PurchaseEntryPage = () => {
    const [showNewEntry, setShowNewEntry] = useState(false);
    const [filters, setFilters] = useState({
        invNo: '',
        company: '',
        fromDate: '',
        toDate: ''
    });

    // New Purchase Entry State
    const [newPurchase, setNewPurchase] = useState({
        supplier: '',
        date: new Date().toISOString().split('T')[0],
        invNo: ''
    });

    const [items, setItems] = useState([
        { id: 1, particular: '', size: '', quantity: '', rate: '', cgst: '', sgst: '', igst: '' }
    ]);

    // Sample data for demonstration
    const [purchases] = useState([
        { id: 1, date: '2024-12-01', invNo: 'INV001', companyName: 'ABC Suppliers', qty: 100, amount: 15000 },
        { id: 2, date: '2024-12-02', invNo: 'INV002', companyName: 'XYZ Traders', qty: 50, amount: 8500 },
        { id: 3, date: '2024-12-03', invNo: 'INV003', companyName: 'Global Textiles', qty: 75, amount: 12000 },
    ]);

    // Filter purchases based on search criteria
    const filteredPurchases = purchases.filter(purchase => {
        // Filter by invoice number
        if (filters.invNo && !purchase.invNo.toLowerCase().includes(filters.invNo.toLowerCase())) {
            return false;
        }
        // Filter by company name
        if (filters.company && !purchase.companyName.toLowerCase().includes(filters.company.toLowerCase())) {
            return false;
        }
        // Filter by date range
        if (filters.fromDate && new Date(purchase.date) < new Date(filters.fromDate)) {
            return false;
        }
        if (filters.toDate && new Date(purchase.date) > new Date(filters.toDate)) {
            return false;
        }
        return true;
    });

    const handleSearch = () => {
        // Filters are applied reactively via filteredPurchases
        console.log('Searching with filters:', filters);
    };

    const handleClearFilters = () => {
        setFilters({ invNo: '', company: '', fromDate: '', toDate: '' });
    };

    const handleNewPurchase = () => {
        setShowNewEntry(true);
    };

    const handleBack = () => {
        setShowNewEntry(false);
    };

    const handleAddItem = () => {
        setItems([...items, {
            id: items.length + 1,
            particular: '',
            size: '',
            quantity: '',
            rate: '',
            cgst: '',
            sgst: '',
            igst: ''
        }]);
    };

    const handleItemChange = (id, field, value) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const calculateItemTotal = (item) => {
        const amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
        const cgst = (amount * (parseFloat(item.cgst) || 0)) / 100;
        const sgst = (amount * (parseFloat(item.sgst) || 0)) / 100;
        const igst = (amount * (parseFloat(item.igst) || 0)) / 100;
        return amount + cgst + sgst + igst;
    };

    const handleSave = () => {
        console.log('Saving purchase:', newPurchase, items);
        // Add save logic here
    };

    // Show New Purchase Entry Form
    if (showNewEntry) {
        return (
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBack}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} className="text-gray-700" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Purchase</h1>
                    </div>
                    <button className="btn btn-secondary">
                        <FileText size={18} />
                        INVOICE
                    </button>
                </div>

                {/* Top Fields */}
                <div className="card">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="form-label">Supplier</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search Supplier Here"
                                value={newPurchase.supplier}
                                onChange={(e) => setNewPurchase({ ...newPurchase, supplier: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="form-label">Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={newPurchase.date}
                                onChange={(e) => setNewPurchase({ ...newPurchase, date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="form-label">Inv No</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Invoice Number"
                                value={newPurchase.invNo}
                                onChange={(e) => setNewPurchase({ ...newPurchase, invNo: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* New Purchase Entry Table */}
                <div className="card">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">New Purchase Entry</h2>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-cyan-600 text-white">
                                    <th className="p-3 text-left text-sm font-bold">S No</th>
                                    <th className="p-3 text-left text-sm font-bold">Particulars</th>
                                    <th className="p-3 text-left text-sm font-bold">Size</th>
                                    <th className="p-3 text-left text-sm font-bold">Quantity</th>
                                    <th className="p-3 text-left text-sm font-bold">Rate</th>
                                    <th className="p-3 text-left text-sm font-bold">Amount</th>
                                    <th className="p-3 text-left text-sm font-bold">CGST</th>
                                    <th className="p-3 text-left text-sm font-bold">SGST</th>
                                    <th className="p-3 text-left text-sm font-bold">IGST</th>
                                    <th className="p-3 text-left text-sm font-bold">Total</th>
                                    <th className="p-3 text-left text-sm font-bold"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={item.id} className="border-b border-gray-200">
                                        <td className="p-3 text-sm font-medium text-gray-900">{index + 1}</td>
                                        <td className="p-3">
                                            <input
                                                type="text"
                                                className="form-input w-full"
                                                placeholder="Search Items Here"
                                                value={item.particular}
                                                onChange={(e) => handleItemChange(item.id, 'particular', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-3">
                                            <select
                                                className="form-input w-24"
                                                value={item.size}
                                                onChange={(e) => handleItemChange(item.id, 'size', e.target.value)}
                                            >
                                                <option value="">Size</option>
                                                <option value="S">S</option>
                                                <option value="M">M</option>
                                                <option value="L">L</option>
                                                <option value="XL">XL</option>
                                            </select>
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                className="form-input w-20"
                                                placeholder="Qty"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                className="form-input w-24"
                                                placeholder="Rate"
                                                value={item.rate}
                                                onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-3 text-sm font-semibold text-gray-900">
                                            ₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)).toFixed(2)}
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                className="form-input w-16"
                                                placeholder="%"
                                                value={item.cgst}
                                                onChange={(e) => handleItemChange(item.id, 'cgst', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                className="form-input w-16"
                                                placeholder="%"
                                                value={item.sgst}
                                                onChange={(e) => handleItemChange(item.id, 'sgst', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                className="form-input w-16"
                                                placeholder="%"
                                                value={item.igst}
                                                onChange={(e) => handleItemChange(item.id, 'igst', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-3 text-sm font-bold text-gray-900">
                                            ₹{calculateItemTotal(item).toFixed(2)}
                                        </td>
                                        <td className="p-3">
                                            {index === items.length - 1 && (
                                                <button
                                                    onClick={handleAddItem}
                                                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Save Button */}
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleSave}
                            className="btn btn-primary px-8"
                        >
                            <Save size={18} />
                            SAVE
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Show Purchase List (default view)
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Purchase</h1>
                <button
                    className="btn btn-new-entry flex items-center gap-2"
                    onClick={handleNewPurchase}
                >
                    <Plus size={18} />
                    NEW PURCHASE ENTRY
                </button>
            </div>

            {/* Search Filters Card */}
            <div className="card">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="form-label">Inv No</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter invoice number"
                            value={filters.invNo}
                            onChange={(e) => setFilters({ ...filters, invNo: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="form-label">Company</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter company name"
                            value={filters.company}
                            onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="form-label">From Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filters.fromDate}
                            onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="form-label">To Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filters.toDate}
                            onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="btn btn-search flex items-center gap-2 flex-1"
                            onClick={handleSearch}
                        >
                            <Search size={18} />
                            SEARCH
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={handleClearFilters}
                            title="Clear filters"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Data Table Card */}
            <div className="card p-0">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b-2 border-gray-300">
                                <th className="text-left p-4 text-sm font-bold text-gray-900">S No</th>
                                <th className="text-left p-4 text-sm font-bold text-gray-900">Date</th>
                                <th className="text-left p-4 text-sm font-bold text-gray-900">InvNo</th>
                                <th className="text-left p-4 text-sm font-bold text-gray-900">Company Name</th>
                                <th className="text-left p-4 text-sm font-bold text-gray-900">Qty</th>
                                <th className="text-left p-4 text-sm font-bold text-gray-900">Amount</th>
                                <th className="text-left p-4 text-sm font-bold text-gray-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPurchases.length > 0 ? (
                                filteredPurchases.map((purchase, index) => (
                                    <tr
                                        key={purchase.id}
                                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="p-4 text-sm font-medium text-gray-900">{index + 1}</td>
                                        <td className="p-4 text-sm font-medium text-gray-900">{formatDate(purchase.date)}</td>
                                        <td className="p-4 text-sm font-medium text-purple-600 font-semibold">{purchase.invNo}</td>
                                        <td className="p-4 text-sm font-medium text-gray-900">{purchase.companyName}</td>
                                        <td className="p-4 text-sm font-medium text-gray-900">{purchase.qty}</td>
                                        <td className="p-4 text-sm font-bold text-green-600">₹{purchase.amount.toLocaleString()}</td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button
                                                    className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                                    title="View"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-600 font-medium">
                                        No purchase entries found. Click "NEW PURCHASE ENTRY" to add one.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PurchaseEntryPage;
