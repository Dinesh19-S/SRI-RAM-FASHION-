import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, RefreshCcw, Eye, Download, Mail, X, Printer } from 'lucide-react';
import BillTemplate from '../components/BillTemplate';
import { billsAPI, emailAPI } from '../services/api';
import { useToast } from '../components/common';
import { downloadInvoicePDF } from '../utils/invoiceGenerator';
import { fetchSettings } from '../store/slices/settingsSlice';

const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
}).format(amount || 0);

const PurchaseBillingPage = () => {
    const toast = useToast();
    const dispatch = useDispatch();
    const settings = useSelector((state) => state.settings.data);
    const resolvedSettings = settings || { company: {}, bank: {}, tax: { cgstRate: 0, sgstRate: 0 } };

    const [bills, setBills] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

    const [selectedBill, setSelectedBill] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailTo, setEmailTo] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    // Pull latest settings so company info is correct on PDF/email
    useEffect(() => {
        dispatch(fetchSettings());
    }, [dispatch]);

    useEffect(() => {
        loadBills();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.page, pagination.limit]);

    const loadBills = async (override = {}) => {
        setIsLoading(true);
        try {
            const params = {
                billType: 'PURCHASE',
                search: (override.search ?? search) || undefined,
                startDate: (override.fromDate ?? fromDate) || undefined,
                endDate: (override.toDate ?? toDate) || undefined,
                page: override.page ?? pagination.page,
                limit: pagination.limit
            };

            const response = await billsAPI.getAll(params);
            const data = response.data?.data || [];
            const total = response.data?.pagination?.total ?? data.length;
            const limit = pagination.limit || 20;

            setBills(data);
            setPagination((prev) => ({
                ...prev,
                page: params.page,
                total,
                pages: Math.max(1, Math.ceil(total / limit))
            }));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load purchase bills');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        loadBills({ page: 1 });
    };

    const handleReset = () => {
        setSearch('');
        setFromDate('');
        setToDate('');
        setPagination((prev) => ({ ...prev, page: 1 }));
        loadBills({ search: '', fromDate: '', toDate: '', page: 1 });
    };

    const openPreview = (bill) => {
        setSelectedBill(bill);
        setShowPreviewModal(true);
    };

    const handleDownloadPDF = async (bill) => {
        await downloadInvoicePDF(bill, resolvedSettings, `${bill.billNumber || 'PURCHASE_BILL'}.pdf`);
    };

    const openEmailModal = (bill) => {
        setSelectedBill(bill);
        setEmailTo(bill.customer?.email || '');
        setShowEmailModal(true);
    };

    const handleEmailBill = async () => {
        const trimmed = emailTo.trim();
        if (!trimmed || !selectedBill) {
            toast.warning('Please enter a valid recipient email');
            return;
        }
        setIsSendingEmail(true);
        try {
            const response = await emailAPI.sendBill(selectedBill._id, trimmed);
            if (response.data?.success) {
                toast.success(response.data?.message || 'Bill sent successfully');
                setShowEmailModal(false);
                setEmailTo('');
                setSelectedBill(null);
            } else {
                toast.error(response.data?.message || 'Failed to send bill');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send bill');
        } finally {
            setIsSendingEmail(false);
        }
    };

    const paginate = (direction) => {
        setPagination((prev) => {
            const nextPage = direction === 'next' ? prev.page + 1 : prev.page - 1;
            if (nextPage < 1 || (prev.pages && nextPage > prev.pages)) return prev;
            return { ...prev, page: nextPage };
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Purchase Billing</h1>
                    <p className="text-sm text-gray-500">Auto-generated bills from purchase entries with email and PDF actions.</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-ghost" onClick={handleReset}>
                        <RefreshCcw size={16} /> Reset
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="w-48">
                        <label className="form-label">Search</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Bill no / supplier"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="form-label">From</label>
                        <input
                            type="date"
                            className="form-input"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="form-label">To</label>
                        <input
                            type="date"
                            className="form-input"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={handleSearch} disabled={isLoading}>
                        <Search size={16} /> Search
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="card p-0">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b-2 border-gray-200">
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">Bill No</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">Date</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">Supplier</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">Payment</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="p-6 text-center">
                                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    </td>
                                </tr>
                            ) : bills.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-6 text-center text-gray-600">
                                        No purchase bills found for the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                bills.map((bill) => {
                                    const date = bill.date || bill.createdAt;
                                    const displayDate = date ? new Date(date).toLocaleDateString('en-GB') : '-';
                                    return (
                                        <tr key={bill._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="p-3 font-semibold text-gray-900">{bill.billNumber}</td>
                                            <td className="p-3 text-sm text-gray-700">{displayDate}</td>
                                            <td className="p-3 text-sm text-gray-900">{bill.customer?.name || bill.partyName || '-'}</td>
                                            <td className="p-3 text-sm font-bold text-green-700">{formatCurrency(bill.grandTotal || 0)}</td>
                                            <td className="p-3">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                                                    style={{
                                                        backgroundColor: bill.paymentStatus === 'paid' ? '#dcfce7' : '#fef3c7',
                                                        color: bill.paymentStatus === 'paid' ? '#15803d' : '#92400e'
                                                    }}>
                                                    {bill.paymentStatus ? bill.paymentStatus.toUpperCase() : 'PENDING'}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-2">
                                                    <button className="action-btn action-btn-blue" title="View" onClick={() => openPreview(bill)}>
                                                        <Eye size={18} />
                                                    </button>
                                                    <button className="action-btn" title="Download PDF" onClick={() => handleDownloadPDF(bill)} style={{ backgroundColor: '#2563eb', color: 'white' }}>
                                                        <Download size={18} />
                                                    </button>
                                                    <button className="action-btn" title="Email Bill" onClick={() => openEmailModal(bill)} style={{ backgroundColor: '#7c3aed', color: 'white' }}>
                                                        <Mail size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                        <div className="text-sm text-gray-600">
                            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => paginate('prev')}
                                disabled={pagination.page <= 1}
                                className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => paginate('next')}
                                disabled={pagination.page >= pagination.pages}
                                className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {showPreviewModal && selectedBill && (
                <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 flex justify-between items-center" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}>
                            <h3 className="text-lg font-semibold text-white">Purchase Bill Preview</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleDownloadPDF(selectedBill)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Printer size={16} />
                                    Print / PDF
                                </button>
                                <button onClick={() => setShowPreviewModal(false)} className="text-white hover:text-gray-200">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[80vh]">
                            <BillTemplate bill={selectedBill} settings={resolvedSettings} />
                        </div>
                    </div>
                </div>
            )}

            {/* Email Modal */}
            {showEmailModal && selectedBill && (
                <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#f5f3ff' }}>
                                <Mail size={32} style={{ color: '#7c3aed' }} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Purchase Bill</h3>
                            <p className="text-gray-600 mb-4">
                                Send bill <strong>{selectedBill.billNumber}</strong> ({formatCurrency(selectedBill.grandTotal)}) via email.
                            </p>
                            <input
                                type="email"
                                className="form-input w-full mb-4"
                                placeholder="Recipient email address"
                                value={emailTo}
                                onChange={(e) => setEmailTo(e.target.value)}
                                autoFocus
                            />
                            <div className="flex gap-3 justify-center">
                                <button className="btn btn-secondary" onClick={() => setShowEmailModal(false)}>Cancel</button>
                                <button
                                    className="btn"
                                    style={{ backgroundColor: '#7c3aed', color: 'white' }}
                                    onClick={handleEmailBill}
                                    disabled={isSendingEmail || !emailTo}
                                >
                                    {isSendingEmail ? 'Sending...' : 'Send Email'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseBillingPage;
