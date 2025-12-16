import { FileSpreadsheet, Printer, Mail, FileText } from 'lucide-react';

const ReportActions = ({ onExcel, onPrint, onEmail, showInvoice = false, onInvoice }) => {
    return (
        <div className="flex items-center gap-3 print:hidden">
            <button
                onClick={onExcel}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
                <FileSpreadsheet size={18} />
                EXCEL
            </button>

            <button
                onClick={onPrint}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
                <Printer size={18} />
                PRINT
            </button>

            <button
                onClick={onEmail}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
                <Mail size={18} />
                MAIL TO
            </button>

            {showInvoice && (
                <button
                    onClick={onInvoice}
                    className="px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
                >
                    <FileText size={18} />
                </button>
            )}
        </div>
    );
};

export default ReportActions;
