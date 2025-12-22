import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBills, createBill, deleteBill } from '../store/slices/billsSlice';
import { fetchProducts } from '../store/slices/productsSlice';
import { fetchSettings } from '../store/slices/settingsSlice';
import { Plus, Search, Printer, Eye, Trash2, X, FileText, Download, Users, Receipt } from 'lucide-react';
import BillTemplate from '../components/BillTemplate';
import { downloadBillPDF } from '../utils/pdfGenerator';
import { customersAPI } from '../services/api';

const BillingPage = () => {
    const dispatch = useDispatch();
    const { items: bills, isLoading } = useSelector((state) => state.bills);
    const { items: products } = useSelector((state) => state.products);
    const settings = useSelector((state) => state.settings.data);
    const billTemplateRef = useRef(null);
    const emptyInvoiceRef = useRef(null);

    const [showBillModal, setShowBillModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showEmptyInvoiceModal, setShowEmptyInvoiceModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [customer, setCustomer] = useState({
        name: '',
        phone: '',
        address: '',
        gstin: '',
        state: 'Tamilnadu',
        stateCode: '33'
    });
    const [transport, setTransport] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [billItems, setBillItems] = useState([]);
    const [discount, setDiscount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerSuggestions, setCustomerSuggestions] = useState([]);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);

    useEffect(() => {
        dispatch(fetchBills());
        dispatch(fetchProducts());
        dispatch(fetchSettings());
    }, [dispatch]);

    // Search customers when customerSearch changes
    useEffect(() => {
        const searchCustomers = async () => {
            if (customerSearch.length < 2) {
                setCustomerSuggestions([]);
                return;
            }
            setIsSearchingCustomers(true);
            try {
                const response = await customersAPI.getAll({ search: customerSearch, limit: 5 });
                setCustomerSuggestions(response.data.data || []);
            } catch (error) {
                console.error('Error searching customers:', error);
            } finally {
                setIsSearchingCustomers(false);
            }
        };
        const debounce = setTimeout(searchCustomers, 300);
        return () => clearTimeout(debounce);
    }, [customerSearch]);

    const selectCustomer = (selectedCustomer) => {
        setCustomer({
            name: selectedCustomer.companyName || '',
            phone: selectedCustomer.mobile || '',
            address: selectedCustomer.address || '',
            gstin: selectedCustomer.gstin || '',
            state: selectedCustomer.state || 'Tamilnadu',
            stateCode: selectedCustomer.stateCode || '33'
        });
        setCustomerSearch(selectedCustomer.companyName);
        setShowCustomerDropdown(false);
    };

    const addItemToBill = (product) => {
        const existing = billItems.find(item => item.productId === product._id);
        if (existing) {
            setBillItems(billItems.map(item => item.productId === product._id ? { ...item, quantity: item.quantity + 1, noOfPacks: (item.noOfPacks || item.quantity) + 1 } : item));
        } else {
            setBillItems([...billItems, {
                productId: product._id,
                name: product.name,
                productName: product.name,
                price: product.sellingPrice,
                quantity: 1,
                noOfPacks: 1,
                pcsInPack: 1,
                ratePerPiece: product.sellingPrice,
                ratePerPack: product.sellingPrice,
                hsnCode: product.hsn || '',
                gstRate: product.gstRate || 5,
                sizesOrPieces: ''
            }]);
        }
    };

    const updateItemQuantity = (productId, quantity) => {
        if (quantity <= 0) setBillItems(billItems.filter(item => item.productId !== productId));
        else setBillItems(billItems.map(item => item.productId === productId ? { ...item, quantity, noOfPacks: quantity } : item));
    };

    const updateItemField = (productId, field, value) => {
        setBillItems(billItems.map(item => {
            if (item.productId !== productId) return item;
            const updated = { ...item, [field]: value };
            // Recalculate if rate fields change
            if (field === 'ratePerPiece' || field === 'pcsInPack') {
                updated.ratePerPack = (updated.ratePerPiece || 0) * (updated.pcsInPack || 1);
            }
            if (field === 'ratePerPack' || field === 'noOfPacks') {
                updated.price = (updated.ratePerPack || updated.price);
                updated.quantity = updated.noOfPacks || updated.quantity;
            }
            return updated;
        }));
    };

    const subtotal = billItems.reduce((sum, item) => sum + ((item.ratePerPack || item.price) * (item.noOfPacks || item.quantity)), 0);
    const discountAmount = (subtotal * discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    const cgstRate = settings?.tax?.cgstRate || 2.5;
    const sgstRate = settings?.tax?.sgstRate || 2.5;
    const cgstAmount = (taxableAmount * cgstRate) / 100;
    const sgstAmount = (taxableAmount * sgstRate) / 100;
    const gstAmount = cgstAmount + sgstAmount;
    const grandTotal = Math.round(taxableAmount + gstAmount);
    const roundOff = grandTotal - (taxableAmount + gstAmount);
    const totalPacks = billItems.reduce((sum, item) => sum + (item.noOfPacks || item.quantity), 0);

    const handleCreateBill = async () => {
        if (!customer.name || !customer.phone || billItems.length === 0) {
            alert('Please fill customer details and add items');
            return;
        }

        const billData = {
            customer,
            transport,
            fromDate,
            toDate,
            totalPacks,
            numOfBundles: 1,
            items: billItems.map(item => ({
                productId: item.productId,
                productName: item.name || item.productName,
                price: item.ratePerPack || item.price,
                quantity: item.noOfPacks || item.quantity,
                noOfPacks: item.noOfPacks || item.quantity,
                pcsInPack: item.pcsInPack || 1,
                ratePerPiece: item.ratePerPiece || item.price,
                ratePerPack: item.ratePerPack || item.price,
                hsnCode: item.hsnCode || '',
                sizesOrPieces: item.sizesOrPieces || '',
                gstRate: item.gstRate || 5,
                discount: 0
            })),
            subtotal,
            discount,
            discountAmount,
            taxableAmount,
            cgst: cgstAmount,
            sgst: sgstAmount,
            totalTax: gstAmount,
            roundOff,
            grandTotal,
            paymentMethod
        };

        try {
            const result = await dispatch(createBill(billData));
            if (createBill.fulfilled.match(result)) {
                setShowBillModal(false);
                resetForm();
                dispatch(fetchBills());
            } else {
                alert('Failed to create bill: ' + (result.payload || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error creating bill:', error);
            alert('Failed to create bill: ' + (error.message || 'Unknown error'));
        }
    };

    const resetForm = () => {
        setCustomer({ name: '', phone: '', address: '', gstin: '', state: 'Tamilnadu', stateCode: '33' });
        setTransport('');
        setFromDate('');
        setToDate('');
        setBillItems([]);
        setDiscount(0);
    };

    const handleViewBill = (bill) => {
        setSelectedBill(bill);
        setShowPreviewModal(true);
    };

    const handleDeleteClick = (bill) => {
        setSelectedBill(bill);
        setShowDeleteConfirm(true);
    };

    const handleDeleteBill = async () => {
        if (!selectedBill) return;
        setIsDeleting(true);
        try {
            await dispatch(deleteBill(selectedBill._id)).unwrap();
            setShowDeleteConfirm(false);
            setSelectedBill(null);
        } catch (error) {
            alert('Failed to delete bill: ' + (error || 'Unknown error'));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDownloadPDF = async (bill) => {
        setSelectedBill(bill);
        // Wait for state update and render
        setTimeout(async () => {
            const element = document.getElementById('bill-template-download');
            if (element) {
                await downloadBillPDF(element, bill.billNumber);
            }
        }, 100);
    };

    const handlePrintBill = async () => {
        const element = billTemplateRef.current;
        if (element) {
            await downloadBillPDF(element, selectedBill?.billNumber);
        }
    };

    const formatCurrency = (amount) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)}`;

    const filteredBills = bills.filter(bill => {
        const searchLower = searchQuery.toLowerCase();
        const billDate = new Date(bill.date || bill.createdAt).toLocaleDateString('en-IN');
        const matchesSearch =
            bill.billNumber?.toLowerCase().includes(searchLower) ||
            bill.customer?.name?.toLowerCase().includes(searchLower) ||
            billDate.includes(searchQuery);
        return matchesSearch && (filterStatus === 'all' || bill.paymentStatus === filterStatus);
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
                <div className="flex gap-2">
                    <button className="btn btn-primary" onClick={() => setShowBillModal(true)}><Plus size={18} />New Bill</button>
                    <button className="btn btn-secondary" onClick={() => setShowEmptyInvoiceModal(true)}><Receipt size={18} />Invoice</button>
                </div>
            </div>

            <div className="card py-4">
                <div className="flex items-center gap-3">
                    <div style={{ flex: '1 1 auto', minWidth: '200px' }}>
                        <input
                            type="text"
                            className="form-input py-2 text-sm w-full"
                            placeholder="Search by Bill No, Customer, or Date..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        style={{ width: '110px', flexShrink: 0 }}
                        className="form-input text-xs py-2 px-2"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                    </select>
                </div>
            </div>

            <div className="card overflow-hidden p-0">
                {isLoading ? (
                    <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#3b82f6', borderTopColor: 'transparent' }} /></div>
                ) : filteredBills.length === 0 ? (
                    <div className="text-center py-12 text-gray-500"><FileText size={48} className="mx-auto mb-2 opacity-50" /><p>No bills found</p></div>
                ) : (
                    <table className="table">
                        <thead><tr className="bg-gray-50"><th>Bill No</th><th>Date</th><th>Customer</th><th>Amount</th><th>Payment</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
                        <tbody>
                            {filteredBills.map((bill) => (
                                <tr key={bill._id}>
                                    <td className="font-medium" style={{ color: '#1e40af' }}>{bill.billNumber}</td>
                                    <td>{new Date(bill.date || bill.createdAt).toLocaleDateString('en-IN')}</td>
                                    <td><div><p className="font-medium">{bill.customer?.name}</p><p className="text-xs text-gray-500">{bill.customer?.phone}</p></div></td>
                                    <td className="font-semibold">{formatCurrency(bill.grandTotal)}</td>
                                    <td className="capitalize">{bill.paymentMethod}</td>
                                    <td><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bill.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{bill.paymentStatus}</span></td>
                                    <td>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                                onClick={() => handleViewBill(bill)}
                                                title="View Bill"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                                onClick={() => handleDownloadPDF(bill)}
                                                title="Download PDF"
                                            >
                                                <Download size={18} />
                                            </button>
                                            <button
                                                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                onClick={() => handleDeleteClick(bill)}
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Hidden bill template for PDF download */}
            {selectedBill && (
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                    <div id="bill-template-download">
                        <BillTemplate bill={selectedBill} settings={settings} forPrint={true} />
                    </div>
                </div>
            )}

            {/* Bill Preview Modal */}
            {showPreviewModal && selectedBill && (
                <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-[230mm] max-h-[95vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="text-lg font-semibold text-gray-900">Bill Preview - {selectedBill.billNumber}</h3>
                            <div className="flex gap-2">
                                <button className="btn btn-primary btn-sm" onClick={handlePrintBill}><Download size={16} />Download PDF</button>
                                <button className="btn btn-ghost btn-icon" onClick={() => setShowPreviewModal(false)}><X size={20} /></button>
                            </div>
                        </div>
                        <div className="p-4 overflow-auto max-h-[80vh]" style={{ backgroundColor: '#f0f0f0' }}>
                            <div ref={billTemplateRef}>
                                <BillTemplate bill={selectedBill} settings={settings} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Bill Modal */}
            {showBillModal && (
                <div className="modal-overlay" onClick={() => setShowBillModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h3 className="text-lg font-semibold text-gray-900">Create New Bill</h3><button className="btn btn-ghost btn-icon" onClick={() => setShowBillModal(false)}><X size={20} /></button></div>
                        <div className="p-4 overflow-y-auto max-h-[70vh]">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <Users size={18} style={{ color: '#1e40af' }} />
                                        Buyer Details
                                    </h4>

                                    {/* Customer Search */}
                                    <div className="relative">
                                        <label className="text-xs text-gray-500 mb-1 block">Search Customer</label>
                                        <input
                                            className="form-input"
                                            placeholder="Search by company name, phone, or GSTIN..."
                                            value={customerSearch}
                                            onChange={(e) => {
                                                setCustomerSearch(e.target.value);
                                                setShowCustomerDropdown(true);
                                            }}
                                            onFocus={() => setShowCustomerDropdown(true)}
                                        />
                                        {isSearchingCustomers && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#3b82f6', borderTopColor: 'transparent' }} />
                                            </div>
                                        )}
                                        {showCustomerDropdown && customerSuggestions.length > 0 && (
                                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                {customerSuggestions.map((cust) => (
                                                    <div
                                                        key={cust._id}
                                                        className="px-4 py-3 cursor-pointer hover:bg-green-50 border-b border-gray-100 last:border-b-0"
                                                        onClick={() => selectCustomer(cust)}
                                                    >
                                                        <p className="font-medium text-gray-900">{cust.companyName}</p>
                                                        <p className="text-xs text-gray-500">{cust.mobile} • {cust.gstin || 'No GSTIN'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {showCustomerDropdown && customerSearch.length >= 2 && customerSuggestions.length === 0 && !isSearchingCustomers && (
                                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-center text-gray-500 text-sm">
                                                No customers found. Fill details below.
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">Buyer Name *</label>
                                            <input className="form-input" placeholder="Enter buyer name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">Phone Number *</label>
                                            <input className="form-input" placeholder="Enter phone number" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">GSTIN</label>
                                            <input className="form-input" placeholder="Enter GSTIN" value={customer.gstin} onChange={(e) => setCustomer({ ...customer, gstin: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">Transport</label>
                                            <input className="form-input" placeholder="Enter transport" value={transport} onChange={(e) => setTransport(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">From</label>
                                            <input className="form-input" placeholder="From (e.g., place or date)" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">To</label>
                                            <input className="form-input" placeholder="To (e.g., place or date)" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">State</label>
                                            <input className="form-input" placeholder="State" value={customer.state} onChange={(e) => setCustomer({ ...customer, state: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">State Code</label>
                                            <input className="form-input" placeholder="State Code" value={customer.stateCode} onChange={(e) => setCustomer({ ...customer, stateCode: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Address (optional)</label>
                                        <input className="form-input" placeholder="Enter address" value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} />
                                    </div>

                                    <h4 className="font-semibold text-gray-900 pt-4">Select Products</h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {products.length === 0 ? <p className="text-gray-500 text-center py-4">No products available</p> : products.map((product) => (
                                            <div key={product._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100" onClick={() => addItemToBill(product)}>
                                                <div><p className="font-medium text-gray-900">{product.name}</p><p className="text-sm text-gray-500">{product.sku} • HSN: {product.hsn || 'N/A'}</p></div>
                                                <div className="text-right"><p className="font-semibold" style={{ color: '#1e40af' }}>{formatCurrency(product.sellingPrice)}</p><button className="text-xs" style={{ color: '#1e40af' }}>+ Add</button></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-900">Bill Items</h4>
                                    {billItems.length === 0 ? <div className="text-center py-8 text-gray-500"><FileText size={48} className="mx-auto mb-2 opacity-50" /><p>No items added</p></div> : (
                                        <div className="space-y-2 max-h-52 overflow-y-auto">
                                            {billItems.map((item) => (
                                                <div key={item.productId} className="p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div>
                                                            <p className="font-medium text-gray-900">{item.name}</p>
                                                            <p className="text-xs text-gray-500">HSN: {item.hsnCode || 'N/A'}</p>
                                                        </div>
                                                        <p className="font-semibold">{formatCurrency((item.ratePerPack || item.price) * (item.noOfPacks || item.quantity))}</p>
                                                    </div>
                                                    <div className="grid grid-cols-5 gap-2 text-xs">
                                                        <div>
                                                            <label className="text-gray-500">Size</label>
                                                            <select className="form-input text-xs p-1" value={item.sizesOrPieces || ''} onChange={(e) => updateItemField(item.productId, 'sizesOrPieces', e.target.value)}>
                                                                <option value="">Select</option>
                                                                <option value="S">S</option>
                                                                <option value="M">M</option>
                                                                <option value="L">L</option>
                                                                <option value="XL">XL</option>
                                                                <option value="XXL">XXL</option>
                                                                <option value="XXXL">XXXL</option>
                                                                <option value="28">28</option>
                                                                <option value="30">30</option>
                                                                <option value="32">32</option>
                                                                <option value="34">34</option>
                                                                <option value="36">36</option>
                                                                <option value="38">38</option>
                                                                <option value="40">40</option>
                                                                <option value="Free Size">Free Size</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-gray-500">Rate/Pc</label>
                                                            <input type="number" className="form-input text-xs p-1" value={item.ratePerPiece || ''} onChange={(e) => updateItemField(item.productId, 'ratePerPiece', Number(e.target.value))} />
                                                        </div>
                                                        <div>
                                                            <label className="text-gray-500">Pcs/Pack</label>
                                                            <input type="number" className="form-input text-xs p-1" value={item.pcsInPack || ''} onChange={(e) => updateItemField(item.productId, 'pcsInPack', Number(e.target.value))} />
                                                        </div>
                                                        <div>
                                                            <label className="text-gray-500">Rate/Pack</label>
                                                            <input type="number" className="form-input text-xs p-1" value={item.ratePerPack || ''} onChange={(e) => updateItemField(item.productId, 'ratePerPack', Number(e.target.value))} />
                                                        </div>
                                                        <div>
                                                            <label className="text-gray-500">No. Packs</label>
                                                            <div className="flex items-center gap-1">
                                                                <button className="w-6 h-6 rounded bg-gray-200 text-sm" onClick={() => updateItemQuantity(item.productId, (item.noOfPacks || item.quantity) - 1)}>-</button>
                                                                <span className="w-6 text-center text-sm">{item.noOfPacks || item.quantity}</span>
                                                                <button className="w-6 h-6 rounded bg-gray-200 text-sm" onClick={() => updateItemQuantity(item.productId, (item.noOfPacks || item.quantity) + 1)}>+</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="border-t border-gray-200 pt-4 space-y-2">
                                        <div className="flex justify-between text-gray-600"><span>Product Amount</span><span>{formatCurrency(subtotal)}</span></div>
                                        <div className="flex items-center justify-between"><span className="text-gray-600">Discount (%)</span><input type="number" className="form-input w-20 text-right" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></div>
                                        <div className="flex justify-between text-gray-600"><span>Taxable Amount</span><span>{formatCurrency(taxableAmount)}</span></div>
                                        <div className="flex justify-between text-gray-600"><span>CGST @ {cgstRate}%</span><span>{formatCurrency(cgstAmount)}</span></div>
                                        <div className="flex justify-between text-gray-600"><span>SGST @ {sgstRate}%</span><span>{formatCurrency(sgstAmount)}</span></div>
                                        <div className="flex justify-between text-gray-600"><span>Total Packs</span><span>{totalPacks}</span></div>
                                        <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200"><span>Grand Total</span><span style={{ color: '#1e40af' }}>{formatCurrency(grandTotal)}</span></div>
                                    </div>
                                    <div><label className="form-label">Payment Method</label>
                                        <div className="grid grid-cols-4 gap-2">{['cash', 'upi', 'card', 'credit'].map((method) => (
                                            <button key={method} className={`py-2 px-3 rounded-lg border text-sm font-medium capitalize ${paymentMethod === method ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`} onClick={() => setPaymentMethod(method)}>{method}</button>
                                        ))}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowBillModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreateBill} disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Bill'}</button></div>
                    </div>
                </div>
            )
            }

            {/* Delete Bill Confirmation Modal */}
            {
                showDeleteConfirm && selectedBill && (
                    <div className="modal-overlay" onClick={() => { setShowDeleteConfirm(false); setSelectedBill(null); }}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 size={32} className="text-red-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Bill</h3>
                                <p className="text-gray-600 mb-6">
                                    Are you sure you want to delete bill <strong>{selectedBill.billNumber}</strong>? This action cannot be undone.
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => { setShowDeleteConfirm(false); setSelectedBill(null); }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn bg-red-600 text-white hover:bg-red-700"
                                        onClick={handleDeleteBill}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            {showEmptyInvoiceModal && (
                <div className="modal-overlay" onClick={() => setShowEmptyInvoiceModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-[230mm] max-h-[95vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="text-lg font-semibold text-gray-900">Empty Invoice Template</h3>
                            <div className="flex gap-2">
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={async () => {
                                        const element = emptyInvoiceRef.current;
                                        if (element) {
                                            await downloadBillPDF(element, 'Empty_Invoice');
                                        }
                                    }}
                                >
                                    <Download size={16} />Download PDF
                                </button>
                                <button className="btn btn-ghost btn-icon" onClick={() => setShowEmptyInvoiceModal(false)}><X size={20} /></button>
                            </div>
                        </div>
                        <div className="p-4 overflow-auto max-h-[80vh]" style={{ backgroundColor: '#f0f0f0' }}>
                            <div ref={emptyInvoiceRef}>
                                <BillTemplate
                                    bill={{
                                        billNumber: '',
                                        date: new Date(),
                                        customer: {
                                            name: '',
                                            phone: '',
                                            address: '',
                                            gstin: '',
                                            state: 'Tamilnadu',
                                            stateCode: '33'
                                        },
                                        transport: '',
                                        fromText: 'TIRUPPUR',
                                        toText: '',
                                        fromDate: '',
                                        toDate: '',
                                        items: [],
                                        subtotal: 0,
                                        discount: 0,
                                        discountAmount: 0,
                                        taxableAmount: 0,
                                        cgst: 0,
                                        sgst: 0,
                                        totalTax: 0,
                                        roundOff: 0,
                                        grandTotal: 0,
                                        totalPacks: 0,
                                        numOfBundles: 0
                                    }}
                                    settings={settings}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default BillingPage;
