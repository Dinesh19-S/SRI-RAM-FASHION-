/**
 * Trigger browser print dialog with optimized print styles
 * @param {string} elementId - Optional ID of element to print (prints whole page if not provided)
 */
export const printReport = (elementId = null) => {
    if (elementId) {
        // Print specific element
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`Element with ID ${elementId} not found`);
            return;
        }

        // Create a new window for printing
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Print Report</title>');

        // Copy styles
        const styles = Array.from(document.styleSheets)
            .map(styleSheet => {
                try {
                    return Array.from(styleSheet.cssRules)
                        .map(rule => rule.cssText)
                        .join('\n');
                } catch (e) {
                    return '';
                }
            })
            .join('\n');

        printWindow.document.write(`<style>${styles}</style>`);
        printWindow.document.write('</head><body>');
        printWindow.document.write(element.innerHTML);
        printWindow.document.write('</body></html>');

        printWindow.document.close();
        printWindow.focus();

        // Wait for content to load then print
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    } else {
        // Print entire page
        window.print();
    }
};

/**
 * Generate print-friendly version of current page
 */
export const preparePrintView = () => {
    // Add print-specific class to body
    document.body.classList.add('printing');

    // Remove after print
    window.addEventListener('afterprint', () => {
        document.body.classList.remove('printing');
    }, { once: true });

    window.print();
};
