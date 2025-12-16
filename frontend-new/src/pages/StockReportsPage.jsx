import { useState, useEffect } from 'react';
import { Package, X, Printer } from 'lucide-react';
import ReportActions from '../components/reports/ReportActions';
import ReportHeader from '../components/reports/ReportHeader';
import { exportToExcel } from '../utils/exportToExcel';
import { printReport } from '../utils/printReport';
import { reportsAPI } from '../services/api';

const StockReportsPage = () => {
    const [nameSearch, setNameSearch] = useState('');
    const [sizeFilter, setSizeFilter] = useState('');
    const [reportData, setReportData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            const response = await reportsAPI.getStockReport({
                name: nameSearch,
                size: sizeFilter
            });

            setReportData(response.data.data || []);
        } catch (error) {
            console.error('Error fetching stock data:', error);
            alert('Error loading stock data. Please try again.');
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
            'Item': row.item,
            'Size': row.size,
            'Quantity': row.qty,
            'Rate': row.rate,
            'Total': row.total
        }));

        exportToExcel(exportData, 'stock_report');
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
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Package className="text-orange-600" size={20} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Stock</h1>
            </div>

            {/* Filters and Actions */}
            <div className="card py-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="flex-shrink-0">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                            <input type="text" placeholder="Enter product name" value={nameSearch} onChange={(e) => setNameSearch(e.target.value)} className="form-input w-40 text-sm py-1.5" />
                        </div>
                        <div className="flex-shrink-0">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Size</label>
                            <select value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)} className="form-input w-28 text-sm py-1.5">
                                <option value="">All Sizes</option>
                                <option value="S">S</option>
                                <option value="M">M</option>
                                <option value="L">L</option>
                                <option value="XL">XL</option>
                                <option value="XXL">XXL</option>
                            </select>
                        </div>
                        <button onClick={handleSearch} disabled={isLoading} className="btn-search">
                            <Package size={14} />
                            {isLoading ? 'LOADING...' : 'SEARCH'}
                        </button>
                        <button onClick={() => { setNameSearch(''); setSizeFilter(''); }} className="px-3 py-1.5 text-gray-500 hover:text-gray-700 font-medium text-sm">Clear</button>
                    </div>
                    <ReportActions onExcel={handleExport} onPrint={handlePrint} onEmail={handleEmail} showInvoice={true} onInvoice={() => setShowInvoiceModal(true)} />
                </div>
            </div>

            {/* Report Content */}
            <div className="card print:shadow-none" id="printable-report">
                <ReportHeader
                    reportTitle="Stock Report"
                    additionalInfo={`Date: ${new Date().toLocaleDateString('en-GB').replace(/\//g, '.')}`}
                />

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-gray-300">
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 print:text-black">S.No</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 print:text-black">Item</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 print:text-black">Size</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700 print:text-black">Qty</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700 print:text-black">Rate</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700 print:text-black">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.length > 0 ? (
                                <>
                                    {reportData.map((row) => (
                                        <tr key={row.sno} className="border-b border-gray-200 hover:bg-gray-50 print:hover:bg-transparent">
                                            <td className="py-3 px-4 text-gray-900 print:text-black">{row.sno}</td>
                                            <td className="py-3 px-4 text-gray-900 print:text-black">{row.item}</td>
                                            <td className="py-3 px-4 text-gray-900 print:text-black">{row.size}</td>
                                            <td className="py-3 px-4 text-right text-gray-900 print:text-black">{row.qty}</td>
                                            <td className="py-3 px-4 text-right text-gray-900 print:text-black">{row.rate}</td>
                                            <td className="py-3 px-4 text-right text-gray-900 print:text-black">{row.total}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-100 border-t-2 border-gray-300">
                                        <td colSpan="5" className="py-4 px-4 text-right font-bold text-gray-900 print:text-black">Grand Total:</td>
                                        <td className="py-4 px-4 text-right font-bold text-blue-600 print:text-black text-lg">₹{reportData.reduce((sum, row) => sum + (row.total || 0), 0).toLocaleString('en-IN')}</td>
                                    </tr>
                                </>
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-gray-500">
                                        {isLoading ? 'Loading...' : 'No data available. Click SEARCH to load stock data.'}
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
                            <h3 className="text-lg font-semibold text-gray-900">Invoice View - Stock Report</h3>
                            <div className="flex items-center gap-2">
                                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors">
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
                                <ReportHeader reportTitle="Stock Report" additionalInfo={`Date: ${new Date().toLocaleDateString('en-GB').replace(/\//g, '.')}`} />
                                <table className="w-full border-collapse mt-4">
                                    <thead>
                                        <tr className="bg-gray-100 border-y-2 border-gray-300">
                                            <th className="text-left py-3 px-3 font-bold text-gray-900 text-sm">S.No</th>
                                            <th className="text-left py-3 px-3 font-bold text-gray-900 text-sm">Item</th>
                                            <th className="text-left py-3 px-3 font-bold text-gray-900 text-sm">Size</th>
                                            <th className="text-right py-3 px-3 font-bold text-gray-900 text-sm">Qty</th>
                                            <th className="text-right py-3 px-3 font-bold text-gray-900 text-sm">Rate</th>
                                            <th className="text-right py-3 px-3 font-bold text-gray-900 text-sm">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map((row) => (
                                            <tr key={row.sno} className="border-b border-gray-200">
                                                <td className="py-2 px-3 text-gray-900 text-sm">{row.sno}</td>
                                                <td className="py-2 px-3 text-gray-900 text-sm">{row.item}</td>
                                                <td className="py-2 px-3 text-gray-900 text-sm">{row.size}</td>
                                                <td className="py-2 px-3 text-right text-gray-900 text-sm">{row.qty}</td>
                                                <td className="py-2 px-3 text-right text-gray-900 text-sm">{row.rate}</td>
                                                <td className="py-2 px-3 text-right text-gray-900 text-sm">{row.total}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-100 border-t-2 border-gray-300">
                                            <td colSpan="5" className="py-3 px-3 text-right font-bold text-gray-900 text-sm">Grand Total:</td>
                                            <td className="py-3 px-3 text-right font-bold text-blue-600 text-sm">₹{reportData.reduce((sum, row) => sum + (row.total || 0), 0).toLocaleString('en-IN')}</td>
                                        </tr>
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

export default StockReportsPage;
