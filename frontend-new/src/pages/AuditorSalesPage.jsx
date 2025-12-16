import { useState, useEffect } from 'react';
import { Scale, Search } from 'lucide-react';
import DateRangeFilter from '../components/reports/DateRangeFilter';
import ReportActions from '../components/reports/ReportActions';
import ReportHeader from '../components/reports/ReportHeader';
import { exportToExcel } from '../utils/exportToExcel';
import { printReport } from '../utils/printReport';
import { reportsAPI } from '../services/api';

const AuditorSalesPage = () => {
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [reportData, setReportData] = useState([]);
    const [totals, setTotals] = useState({
        taxableAmount: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total: 0
    });
    const [isLoading, setIsLoading] = useState(false);

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
            const response = await reportsAPI.getAuditorSales({
                fromDate,
                toDate
            });

            const data = response.data.data || [];

            // Calculate totals
            const newTotals = data.reduce((acc, row) => ({
                taxableAmount: acc.taxableAmount + row.taxableAmount,
                cgst: acc.cgst + row.cgst,
                sgst: acc.sgst + row.sgst,
                igst: acc.igst + row.igst,
                total: acc.total + row.total
            }), { taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });

            setReportData(data);
            setTotals(newTotals);
        } catch (error) {
            console.error('Error fetching auditor sales data:', error);
            alert('Error loading auditor sales data. Please try again.');
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
            'Company Name': row.companyName,
            'GSTIN': row.gstin,
            'Date': row.date,
            'Invoice No': row.invNo,
            'Taxable Amount': row.taxableAmount,
            'CGST': row.cgst,
            'SGST': row.sgst,
            'IGST': row.igst,
            'Total': row.total
        }));

        // Add totals row
        exportData.push({
            'Company Name': 'Total',
            'GSTIN': '',
            'Date': '',
            'Invoice No': '',
            'Taxable Amount': totals.taxableAmount,
            'CGST': totals.cgst,
            'SGST': totals.sgst,
            'IGST': totals.igst,
            'Total': totals.total
        });

        exportToExcel(exportData, 'auditor_sales_report');
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
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#dbeafe' }}>
                    <Scale style={{ color: '#1e40af' }} size={20} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Auditor Report - Sales</h1>
            </div>

            {/* Filters and Actions */}
            <div className="card py-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="flex-shrink-0">
                            <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
                            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="form-input w-32 text-sm py-1.5" />
                        </div>
                        <div className="flex-shrink-0">
                            <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
                            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="form-input w-32 text-sm py-1.5" />
                        </div>
                        <button onClick={handleSearch} disabled={isLoading} className="btn-search">
                            <Search size={14} />
                            {isLoading ? 'LOADING...' : 'SEARCH'}
                        </button>
                        <button onClick={() => { setFromDate(''); setToDate(''); }} className="px-3 py-1.5 text-gray-500 hover:text-gray-700 font-medium text-sm">Clear</button>
                    </div>
                    <ReportActions onExcel={handleExport} onPrint={handlePrint} onEmail={handleEmail} showInvoice={true} onInvoice={() => alert('Invoice view')} />
                </div>
            </div>

            {/* Report Content */}
            <div className="card print:shadow-none" id="printable-report">
                <ReportHeader
                    reportTitle="Sales Report"
                    fromDate={fromDate}
                    toDate={toDate}
                />

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-gray-300">
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 print:text-black">Company Name</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 print:text-black">GSTIN</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 print:text-black">Date</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 print:text-black">Inv No</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700 print:text-black">Taxable Amount</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700 print:text-black">CGST</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700 print:text-black">SGST</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700 print:text-black">IGST</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700 print:text-black">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.length > 0 ? (
                                <>
                                    {reportData.map((row, index) => (
                                        <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 print:hover:bg-transparent">
                                            <td className="py-3 px-4 text-gray-900 print:text-black">{row.companyName}</td>
                                            <td className="py-3 px-4 text-gray-900 print:text-black">{row.gstin}</td>
                                            <td className="py-3 px-4 text-gray-900 print:text-black">{row.date}</td>
                                            <td className="py-3 px-4 text-gray-900 print:text-black">{row.invNo}</td>
                                            <td className="py-3 px-4 text-right text-gray-900 print:text-black">₹{row.taxableAmount.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right text-gray-900 print:text-black">₹{row.cgst.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right text-gray-900 print:text-black">₹{row.sgst.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right text-gray-900 print:text-black">₹{row.igst.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right text-gray-900 print:text-black">₹{row.total.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {/* Totals Row */}
                                    <tr className="border-t-2 border-gray-400 bg-gray-50 print:bg-gray-100 font-semibold">
                                        <td className="py-3 px-4 text-gray-900 print:text-black" colSpan="4">Total</td>
                                        <td className="py-3 px-4 text-right text-gray-900 print:text-black">₹{totals.taxableAmount.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-right text-gray-900 print:text-black">₹{totals.cgst.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-right text-gray-900 print:text-black">₹{totals.sgst.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-right text-gray-900 print:text-black">₹{totals.igst.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-right text-gray-900 print:text-black">₹{totals.total.toLocaleString()}</td>
                                    </tr>
                                </>
                            ) : (
                                <tr>
                                    <td colSpan="9" className="py-8 text-center text-gray-500">
                                        {isLoading ? 'Loading...' : 'No data available. Click SEARCH to load auditor sales data.'}
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

export default AuditorSalesPage;
