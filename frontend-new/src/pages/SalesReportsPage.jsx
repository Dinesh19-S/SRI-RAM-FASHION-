import { useState, useEffect } from 'react';
import { Search, TrendingUp, X, Printer } from 'lucide-react';
import DateRangeFilter from '../components/reports/DateRangeFilter';
import ReportActions from '../components/reports/ReportActions';
import ReportHeader from '../components/reports/ReportHeader';
import { exportToExcel } from '../utils/exportToExcel';
import { printReport } from '../utils/printReport';
import { reportsAPI } from '../services/api';
import { formatDate } from '../utils/dateUtils';

const SalesReportsPage = () => {
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [reportData, setReportData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);

    // Initialize with current month dates
    useEffect(() => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        setFromDate(firstDay.toISOString().split('T')[0]);
        setToDate(today.toISOString().split('T')[0]);
    }, []);

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            const response = await reportsAPI.getSalesReport({
                fromDate,
                toDate,
                customer: customerSearch
            });

            setReportData(response.data.data || []);
        } catch (error) {
            console.error('Error fetching sales data:', error);
            alert('Error loading sales data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = () => {
        if (reportData.length === 0) {
            alert('No data to export');
            return;
        }

        const exportData = reportData.map(row => ({
            'S.No': row.sno,
            'Date': formatDate(row.date),
            'Invoice No': row.invNo,
            'Item': row.item,
            'Rate': row.rate,
            'Quantity': row.qty,
            'Total': row.rate * row.qty
        }));

        exportToExcel(exportData, 'sales_report');
    };

    const handlePrint = () => {
        printReport('printable-report');
    };

    const handleEmail = () => {
        alert('Email functionality will be implemented');
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-blue-600" size={20} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
            </div>

            {/* Filters and Actions */}
            <div className="card py-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="flex-shrink-0">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Inv No</label>
                            <input type="text" placeholder="Enter invoice number" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="form-input w-36 text-sm py-1.5" />
                        </div>
                        <div className="flex-shrink-0">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Customer</label>
                            <input type="text" placeholder="Enter customer name" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="form-input w-40 text-sm py-1.5" />
                        </div>
                        <div className="flex-shrink-0">
                            <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
                            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="form-input w-32 text-sm py-1.5" />
                        </div>
                        <div className="flex-shrink-0">
                            <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
                            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="form-input w-32 text-sm py-1.5" />
                        </div>
                        <button onClick={handleSearch} disabled={isLoading} className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50">
                            <Search size={14} />
                            {isLoading ? 'LOADING...' : 'SEARCH'}
                        </button>
                        <button onClick={() => { setCustomerSearch(''); setFromDate(''); setToDate(''); }} className="px-3 py-1.5 text-gray-500 hover:text-gray-700 font-medium text-sm">Clear</button>
                    </div>
                    <ReportActions onExcel={handleExport} onPrint={handlePrint} onEmail={handleEmail} showInvoice={true} onInvoice={() => setShowInvoiceModal(true)} />
                </div>
            </div>

            {/* Report Content */}
            <div className="card p-0 print:shadow-none" id="printable-report">
                <div className="p-6">
                    <ReportHeader
                        reportTitle="Sales Report"
                        fromDate={formatDate(fromDate)}
                        toDate={formatDate(toDate)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-y-2 border-gray-300">
                                <th className="text-left py-4 px-4 font-bold text-gray-900 print:text-black">S.No</th>
                                <th className="text-left py-4 px-4 font-bold text-gray-900 print:text-black">Date</th>
                                <th className="text-left py-4 px-4 font-bold text-gray-900 print:text-black">Inv No</th>
                                <th className="text-left py-4 px-4 font-bold text-gray-900 print:text-black">Item</th>
                                <th className="text-right py-4 px-4 font-bold text-gray-900 print:text-black">Rate</th>
                                <th className="text-right py-4 px-4 font-bold text-gray-900 print:text-black">Qty</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.length > 0 ? (
                                reportData.map((row) => (
                                    <tr key={row.sno} className="border-b border-gray-200 hover:bg-gray-50 print:hover:bg-transparent">
                                        <td className="py-4 px-4 font-medium text-gray-900 print:text-black">{row.sno}</td>
                                        <td className="py-4 px-4 font-medium text-gray-900 print:text-black">{formatDate(row.date)}</td>
                                        <td className="py-4 px-4 font-medium text-gray-900 print:text-black">{row.invNo}</td>
                                        <td className="py-4 px-4 font-medium text-gray-900 print:text-black">{row.item}</td>
                                        <td className="py-4 px-4 text-right font-semibold text-gray-900 print:text-black">₹{row.rate}</td>
                                        <td className="py-4 px-4 text-right font-semibold text-gray-900 print:text-black">{row.qty}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-gray-600 font-medium">
                                        {isLoading ? 'Loading...' : 'No data available. Click SEARCH to load sales data.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invoice View Modal */}
            {showInvoiceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowInvoiceModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-[230mm] w-full max-h-[95vh] overflow-hidden mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900">Invoice View - Sales Report</h3>
                            <div className="flex items-center gap-2">
                                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-colors">
                                    <Printer size={16} />
                                    Print
                                </button>
                                <button onClick={() => setShowInvoiceModal(false)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 overflow-auto max-h-[calc(95vh-80px)]" style={{ backgroundColor: '#e5e5e5' }}>
                            <div className="bg-white mx-auto shadow-lg" style={{ width: '210mm', minHeight: '297mm', padding: '15mm', boxSizing: 'border-box' }}>
                                <ReportHeader reportTitle="Sales Report" fromDate={formatDate(fromDate)} toDate={formatDate(toDate)} />
                                <table className="w-full border-collapse mt-4">
                                    <thead>
                                        <tr className="bg-gray-100 border-y-2 border-gray-300">
                                            <th className="text-left py-3 px-3 font-bold text-gray-900 text-sm">S.No</th>
                                            <th className="text-left py-3 px-3 font-bold text-gray-900 text-sm">Date</th>
                                            <th className="text-left py-3 px-3 font-bold text-gray-900 text-sm">Inv No</th>
                                            <th className="text-left py-3 px-3 font-bold text-gray-900 text-sm">Item</th>
                                            <th className="text-right py-3 px-3 font-bold text-gray-900 text-sm">Rate</th>
                                            <th className="text-right py-3 px-3 font-bold text-gray-900 text-sm">Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map((row) => (
                                            <tr key={row.sno} className="border-b border-gray-200">
                                                <td className="py-2 px-3 text-gray-900 text-sm">{row.sno}</td>
                                                <td className="py-2 px-3 text-gray-900 text-sm">{formatDate(row.date)}</td>
                                                <td className="py-2 px-3 text-gray-900 text-sm">{row.invNo}</td>
                                                <td className="py-2 px-3 text-gray-900 text-sm">{row.item}</td>
                                                <td className="py-2 px-3 text-right text-gray-900 text-sm">₹{row.rate}</td>
                                                <td className="py-2 px-3 text-right text-gray-900 text-sm">{row.qty}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesReportsPage;
