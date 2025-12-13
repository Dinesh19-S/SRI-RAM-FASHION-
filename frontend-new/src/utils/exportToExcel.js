/**
 * Export table data to Excel (CSV format)
 * @param {Array} data - Array of objects representing table rows
 * @param {string} filename - Name of the file to download
 * @param {Array} headers - Optional array of header labels
 */
export const exportToExcel = (data, filename = 'report', headers = null) => {
    if (!data || data.length === 0) {
        alert('No data to export');
        return;
    }

    // Get headers from first object if not provided
    const actualHeaders = headers || Object.keys(data[0]);

    // Create CSV content
    let csvContent = '';

    // Add headers
    csvContent += actualHeaders.join(',') + '\n';

    // Add data rows
    data.forEach(row => {
        const values = actualHeaders.map(header => {
            const value = row[header] !== undefined ? row[header] : '';
            // Escape commas and quotes
            const escaped = String(value).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvContent += values.join(',') + '\n';
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Export data as Excel-compatible format with better formatting
 * For more advanced Excel features, consider using libraries like 'xlsx' or 'exceljs'
 */
export const exportToExcelAdvanced = (data, filename, sheetName = 'Sheet1') => {
    // This is a placeholder for advanced Excel export
    // To implement: npm install xlsx
    // Then use XLSX library for proper Excel file generation
    exportToExcel(data, filename);
};
