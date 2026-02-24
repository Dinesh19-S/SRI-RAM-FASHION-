/**
 * Trigger browser print dialog for a specific report element
 * @param {string} elementId - ID of element to print (prints whole page if not provided)
 */
export const printReport = (elementId = null) => {
    if (elementId) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`Element with ID "${elementId}" not found`);
            return;
        }

        // Create a new print window
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) {
            // Popup blocked — fall back to window.print()
            window.print();
            return;
        }

        // Collect all stylesheet link tags from the current document
        const linkTags = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
            .map(link => link.outerHTML)
            .join('\n');

        // Also collect inline <style> tags
        const styleTags = Array.from(document.querySelectorAll('style'))
            .map(style => style.outerHTML)
            .join('\n');

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Print Report</title>
    <style>
        /* A4 Landscape — full-fit */
        @page {
            size: A4 landscape;
            margin: 10mm;
        }

        @media print {
            html, body {
                width: 297mm;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            background: white;
            padding: 10mm;
            margin: 0 auto;
            width: 297mm;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #111;
        }

        /* Hide buttons / non-print elements */
        button, .btn, .no-print { display: none !important; }

        /* ---- Table: stretch to full width ---- */
        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 10.5px;
        }

        th, td {
            padding: 5px 8px;
            border: 1px solid #ccc;
            word-wrap: break-word;
            overflow: hidden;
        }

        th {
            font-weight: 700;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            background-color: #e5e7eb;
            color: #1f2937;
            border-bottom: 2px solid #374151;
            text-align: center;
        }

        td { text-align: left; }

        /* Right-align number columns */
        .text-right, td.text-right, th.text-right {
            text-align: right;
        }

        /* Zebra striping */
        tbody tr:nth-child(even) {
            background-color: #fafafa;
        }

        tbody tr:hover { background: transparent; }

        /* Totals row */
        tbody tr:last-child td {
            font-weight: 700;
            border-top: 2px solid #374151;
            background-color: #f3f4f6;
        }

        /* ---- Report Header ---- */
        .text-center { text-align: center; }
        .mb-6 { margin-bottom: 20px; }
        .mb-1 { margin-bottom: 3px; }
        .mb-2 { margin-bottom: 6px; }
        .mt-1 { margin-top: 3px; }

        h2 {
            font-size: 16px; font-weight: 700;
            margin: 0 0 2px; color: #111;
        }
        h3 {
            font-size: 13px; font-weight: 600;
            margin: 0 0 6px; color: #374151;
        }
        p  { font-size: 11px; color: #555; margin: 0 0 3px; }

        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .font-mono { font-family: 'Courier New', monospace; }

        /* Page-break control */
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
        .overflow-x-auto { overflow: visible; }
    </style>
</head>
<body>
    ${element.innerHTML}
</body>
</html>`;

        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Wait for stylesheets to load, then print
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                // Close after print dialog closes
                printWindow.onafterprint = () => printWindow.close();
            }, 500);
        };
    } else {
        window.print();
    }
};

/**
 * Generate print-friendly version of current page
 */
export const preparePrintView = () => {
    document.body.classList.add('printing');

    window.addEventListener('afterprint', () => {
        document.body.classList.remove('printing');
    }, { once: true });

    window.print();
};
