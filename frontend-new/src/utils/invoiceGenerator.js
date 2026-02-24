import jsPDF from 'jspdf';

// ==============================
// Helpers
// ==============================

/** Convert number to words – Indian format */
const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if (num === 0) return 'Zero';
    if (num < 0) return 'Minus ' + numberToWords(-num);
    num = Math.floor(num);
    let words = '';
    if (Math.floor(num / 10000000) > 0) { words += numberToWords(Math.floor(num / 10000000)) + ' Crore '; num %= 10000000; }
    if (Math.floor(num / 100000) > 0) { words += numberToWords(Math.floor(num / 100000)) + ' Lakh '; num %= 100000; }
    if (Math.floor(num / 1000) > 0) { words += numberToWords(Math.floor(num / 1000)) + ' Thousand '; num %= 1000; }
    if (Math.floor(num / 100) > 0) { words += numberToWords(Math.floor(num / 100)) + ' Hundred '; num %= 100; }
    if (num > 0) {
        if (words !== '') words += 'and ';
        if (num < 20) words += ones[num];
        else { words += tens[Math.floor(num / 10)]; if (num % 10 > 0) words += ' ' + ones[num % 10]; }
    }
    return words.trim();
};

/** Format date as DD/MM/YYYY */
const fmtDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getFullYear()}`;
};

// Colors
const BLUE = { r: 25, g: 60, b: 150 };
const BLACK = { r: 0, g: 0, b: 0 };
const GREY_BG = { r: 230, g: 230, b: 230 };
const RED = { r: 180, g: 0, b: 0 };

/** Draw bordered rectangle */
const rect = (pdf, x, y, w, h, opts = {}) => {
    if (opts.fill) { pdf.setFillColor(opts.fill.r, opts.fill.g, opts.fill.b); pdf.rect(x, y, w, h, 'F'); }
    pdf.setDrawColor(opts.stroke?.r ?? 0, opts.stroke?.g ?? 0, opts.stroke?.b ?? 0);
    pdf.setLineWidth(opts.lw ?? 0.3);
    pdf.rect(x, y, w, h, 'S');
};

/** Draw a cell: border + text */
const cell = (pdf, x, y, w, h, text, opts = {}) => {
    if (opts.fill) { pdf.setFillColor(opts.fill.r, opts.fill.g, opts.fill.b); pdf.rect(x, y, w, h, 'F'); }
    pdf.setDrawColor(opts.stroke?.r ?? 0, opts.stroke?.g ?? 0, opts.stroke?.b ?? 0);
    pdf.setLineWidth(opts.lw ?? 0.3);
    pdf.rect(x, y, w, h, 'S');

    pdf.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    pdf.setFontSize(opts.fs ?? 8);
    pdf.setTextColor(opts.color?.r ?? 0, opts.color?.g ?? 0, opts.color?.b ?? 0);

    const align = opts.align ?? 'center';
    let tx;
    if (align === 'left') tx = x + 1.5;
    else if (align === 'right') tx = x + w - 1.5;
    else tx = x + w / 2;

    const str = String(text ?? '');
    if (str.includes('\n')) {
        const lines = str.split('\n');
        const lh = 3.2;
        const sy = y + (h - lines.length * lh) / 2 + lh - 0.3;
        lines.forEach((l, i) => pdf.text(l, tx, sy + i * lh, { align }));
    } else {
        pdf.text(str, tx, y + h / 2 + 1, { align });
    }
};

// ==============================
// Main generator
// ==============================

/**
 * Generate SRI RAM FASHIONS Tax Invoice PDF – matching the reference design
 */
export const generateInvoicePDF = (bill, settings = {}) => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const PW = 210; // page width
    const LM = 8;   // left margin
    const RE = PW - 8; // right edge
    const CW = RE - LM; // content width

    // ---- Settings / defaults ----
    const co = settings?.company || {};
    const companyName = co.name || 'SRI RAM FASHIONS';
    const gstin = co.gstin || '33AZRPM4425F2ZA';
    const addr1 = co.address1 || 'OFF : 61C9, Anupparpalayam Puthur, Tirupur. 641652';
    const addr2 = co.address2 || 'OFF : 81 K, Madurai Road, SankerNager, Tirunelveli Dt. 627357';
    const state = co.state || 'Tamilnadu';
    const stateCode = co.stateCode || '33';
    const email = co.email || 'sriramfashionstrp@gmail.com';
    const phone = co.phone || '9080573831';

    const bk = settings?.bank || {};
    const bankName = bk.name || 'South Indian Bank';
    const bankAcc = bk.account || '0338073000002328';
    const bankBranch = bk.branch || 'TIRUPUR';
    const bankIfsc = bk.ifsc || 'SIBL0000338';

    const cgstRate = settings?.tax?.cgstRate || 2.5;
    const sgstRate = settings?.tax?.sgstRate || 2.5;

    // ---- Bill data ----
    const items = bill.items || [];
    const productAmt = bill.subtotal || 0;
    const discount = bill.discountAmount || 0;
    const taxableAmt = productAmt - discount;
    const cgstAmt = (taxableAmt * cgstRate) / 100;
    const sgstAmt = (taxableAmt * sgstRate) / 100;
    const totalGst = cgstAmt + sgstAmt;
    const rawTotal = taxableAmt + totalGst;
    const roundOff = Math.round(rawTotal) - rawTotal;
    const totalAmt = Math.round(rawTotal);
    const totalPacks = bill.totalPacks || items.reduce((s, i) => s + (i.noOfPacks || i.quantity || 0), 0) || 0;
    const numBundles = bill.numOfBundles || 1;

    let Y = 10;

    // ================================================================
    // ROW 1 — Company name (left, blue) + GSTIN (right, blue)
    // ================================================================
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(BLUE.r, BLUE.g, BLUE.b);
    pdf.text(companyName, LM, Y + 6);

    pdf.setFontSize(12);
    pdf.text(`GSTIN: ${gstin}`, RE, Y + 6, { align: 'right' });

    Y += 10;
    // Blue line
    pdf.setDrawColor(BLUE.r, BLUE.g, BLUE.b);
    pdf.setLineWidth(0.6);
    pdf.line(LM, Y, RE, Y);
    Y += 4;

    // ================================================================
    // ROW 2 — Address (left) + Invoice details (right)
    // ================================================================
    const addrX = LM;
    const detailLabelX = RE - 65;
    const detailSepX = RE - 25;
    const detailValX = RE - 23;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(BLACK.r, BLACK.g, BLACK.b);

    const addrLines = [addr1, addr2, `State: ${state} (Code ${stateCode})`, `Email: ${email}`, `Mob: ${phone}`];
    addrLines.forEach((l, i) => { pdf.text(l, addrX, Y + i * 4); });

    // Invoice details on right
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    const invDetails = [
        { label: 'Invoice Number', value: bill.billNumber || '' },
        { label: 'Invoice Date', value: fmtDate(bill.date || bill.createdAt || new Date()) },
        { label: 'From', value: bill.fromText || bill.fromDate || '' },
        { label: 'To', value: bill.toText || bill.toDate || '' },
    ];
    invDetails.forEach((d, i) => {
        pdf.text(d.label, detailLabelX, Y + i * 4);
        pdf.text(':', detailSepX, Y + i * 4);
        pdf.text(d.value, detailValX, Y + i * 4);
    });

    Y += addrLines.length * 4 + 3;

    // ================================================================
    // ROW 3 — TAX INVOICE (centered, blue, underlined)
    // ================================================================
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(BLUE.r, BLUE.g, BLUE.b);
    pdf.text('TAX INVOICE', PW / 2, Y, { align: 'center' });
    // Underline
    const tw = pdf.getTextWidth('TAX INVOICE');
    pdf.setDrawColor(BLUE.r, BLUE.g, BLUE.b);
    pdf.setLineWidth(0.4);
    pdf.line(PW / 2 - tw / 2, Y + 1, PW / 2 + tw / 2, Y + 1);
    Y += 6;

    // ================================================================
    // ROW 4 — Buyer / Consignee section (bordered box)
    // ================================================================
    const buyerH = 6;
    const halfW = CW / 2;

    // Outer border for entire buyer section
    const buyerStartY = Y;

    // Row: Consignee Copy header (spans left half)
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8);
    pdf.setTextColor(BLACK.r, BLACK.g, BLACK.b);
    pdf.text('Consigner Copy', LM + 2, Y + 4);
    Y += buyerH;

    // Left fields
    const buyerLeft = [
        { label: 'BUYER:', value: bill.customer?.name || '' },
        { label: 'STATE:', value: bill.customer?.state || 'Tamilnadu' },
        { label: 'TRANSPORT:', value: bill.transport || '' },
    ];
    // Right fields
    const buyerRight = [
        { label: 'MOB:', value: bill.customer?.phone || '' },
        { label: 'GSTIN:', value: bill.customer?.gstin || '' },
        { label: 'CODE:', value: bill.customer?.stateCode || '33' },
    ];

    const bLabelW = 28;
    const bValW = halfW - bLabelW;
    const bRLabelW = 22;
    const bRValW = halfW - bRLabelW;

    for (let i = 0; i < buyerLeft.length; i++) {
        const lf = buyerLeft[i];
        const rf = buyerRight[i];

        // Left label + value
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(0, 0, 0);
        pdf.text(lf.label, LM + 2, Y + 4);
        pdf.setFont('helvetica', 'normal');
        pdf.text(lf.value, LM + bLabelW, Y + 4);

        // Right label + value
        pdf.setFont('helvetica', 'bold');
        pdf.text(rf.label, LM + halfW + 2, Y + 4);
        pdf.setFont('helvetica', 'normal');
        pdf.text(rf.value, LM + halfW + bRLabelW, Y + 4);

        Y += buyerH;
    }

    // Draw outer border for buyer section
    const buyerEndY = Y;
    pdf.setDrawColor(0, 0, 0); pdf.setLineWidth(0.4);
    pdf.rect(LM, buyerStartY, CW, buyerEndY - buyerStartY, 'S');
    // Horizontal lines inside
    let ly = buyerStartY + buyerH;
    while (ly < buyerEndY) { pdf.line(LM, ly, RE, ly); ly += buyerH; }
    // Vertical divider between left & right
    pdf.line(LM + halfW, buyerStartY + buyerH, LM + halfW, buyerEndY);

    Y += 4;

    // ================================================================
    // ROW 5 — Product Table
    // ================================================================
    const cols = [
        { label: 'S.No', w: 12 },
        { label: 'Product', w: 46 },
        { label: 'HSN\nCode', w: 20 },
        { label: 'Sizes/\nPieces', w: 17 },
        { label: 'Rate Per\nPiece', w: 20 },
        { label: 'Pcs in\nPack', w: 16 },
        { label: 'Rate Per\nPack', w: 20 },
        { label: 'No Of\nPacks', w: 17 },
    ];
    const lastColW = CW - cols.reduce((s, c) => s + c.w, 0);
    cols.push({ label: 'Amount\nRs.', w: lastColW });

    // Header row
    const hdrH = 10;
    let cx = LM;
    cols.forEach(c => {
        cell(pdf, cx, Y, c.w, hdrH, c.label, { bold: true, fill: GREY_BG, fs: 7 });
        cx += c.w;
    });
    Y += hdrH;

    // Data rows
    const rowH = 7;
    items.forEach((item, idx) => {
        const rpp = item.ratePerPack || item.price || 0;
        const nop = item.noOfPacks || item.quantity || 0;
        const amt = item.total || (rpp * nop);
        const vals = [
            String(idx + 1),
            item.productName || item.name || '',
            String(item.hsnCode || item.hsn || ''),
            String(item.sizesOrPieces || ''),
            String(item.ratePerPiece || ''),
            String(item.pcsInPack || ''),
            String(rpp),
            String(nop),
            String(amt)
        ];
        cx = LM;
        cols.forEach((c, ci) => {
            cell(pdf, cx, Y, c.w, rowH, vals[ci], { align: ci === 1 ? 'left' : 'center', fs: 8 });
            cx += c.w;
        });
        Y += rowH;
    });

    // Empty rows (min 10)
    const emptyCount = Math.max(0, 10 - items.length);
    for (let e = 0; e < emptyCount; e++) {
        cx = LM;
        cols.forEach(c => { cell(pdf, cx, Y, c.w, rowH, '', { fs: 8 }); cx += c.w; });
        Y += rowH;
    }
    Y += 4;

    // ================================================================
    // ROW 6 — Summary (3-column layout matching image)
    // ================================================================
    const sumStartY = Y;
    const leftW = CW * 0.38;
    const midW = CW * 0.24;
    const rightW = CW * 0.38;

    // ----- LEFT column: Total Packs, Bill Amount, In words -----
    const leftX = LM;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(0, 0, 0);
    pdf.text('Total Packs', leftX, Y + 4);
    pdf.text(':', leftX + 28, Y + 4);
    pdf.setFont('helvetica', 'normal');
    pdf.text(String(totalPacks), leftX + 32, Y + 4);
    Y += 6;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Bill Amount', leftX, Y + 4);
    pdf.text(':', leftX + 28, Y + 4);
    pdf.setFont('helvetica', 'normal');
    pdf.text(String(totalAmt), leftX + 32, Y + 4);
    Y += 6;

    pdf.setFont('helvetica', 'bold');
    pdf.text('In words', leftX, Y + 4);
    pdf.text(':', leftX + 28, Y + 4);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    const wordsText = `Rupees ${numberToWords(totalAmt)} Only`;
    const wordLines = pdf.splitTextToSize(wordsText, leftW - 34);
    wordLines.forEach((line, i) => { pdf.text(line, leftX + 32, Y + 4 + i * 3.5); });
    const wordsH = wordLines.length * 3.5;

    // ----- MIDDLE column: NUM OF BUNDLES + TOTAL GST box -----
    const midX = LM + leftW;
    let midY = sumStartY;

    // NUM OF BUNDLES box
    cell(pdf, midX, midY, midW, 7, '', {}); // outer cell
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5); pdf.setTextColor(0, 0, 0);
    pdf.text('NUM OF BUNDLES :', midX + 2, midY + 4.5);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
    pdf.text(String(numBundles), midX + midW - 5, midY + 4.5, { align: 'right' });

    midY += 14;

    // TOTAL GST box (red border)
    const gstBoxW = midW - 4;
    const gstBoxX = midX + 2;
    rect(pdf, gstBoxX, midY, gstBoxW, 9, { stroke: RED, lw: 0.6 });
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
    pdf.setTextColor(RED.r, RED.g, RED.b);
    pdf.text('TOTAL GST', gstBoxX + 3, midY + 6);
    pdf.text(totalGst.toFixed(0), gstBoxX + gstBoxW - 3, midY + 6, { align: 'right' });

    // ----- RIGHT column: Tax breakdown -----
    const rightX = LM + leftW + midW;
    const taxLabelW = rightW * 0.6;
    const taxValW = rightW * 0.4;
    let taxY = sumStartY;
    const taxRowH = 5.5;

    const taxRows = [
        { label: 'Product Amt', value: productAmt.toFixed(0), bold: false, highlight: false },
        { label: 'Discount', value: discount.toFixed(0), bold: false, highlight: false },
        { label: 'Taxable Amt', value: taxableAmt.toFixed(0), bold: false, highlight: false },
        { label: `CGST @ ${cgstRate}%`, value: cgstAmt.toFixed(2), bold: false, highlight: true },
        { label: `SGST @ ${sgstRate}%`, value: sgstAmt.toFixed(2), bold: false, highlight: true },
        { label: 'Round Off', value: roundOff.toFixed(2), bold: false, highlight: false },
        { label: '', value: '', bold: false, highlight: false }, // spacer
        { label: 'Total Amt', value: String(totalAmt), bold: true, highlight: false },
    ];

    taxRows.forEach(row => {
        if (!row.label && !row.value) { taxY += 2; return; }
        pdf.setFont('helvetica', row.bold ? 'bold' : 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(row.highlight ? BLUE.r : 0, row.highlight ? BLUE.g : 0, row.highlight ? BLUE.b : 0);
        pdf.text(row.label, rightX + 2, taxY + 4);
        pdf.text(row.value, rightX + rightW - 2, taxY + 4, { align: 'right' });
        if (row.bold) {
            // Draw line above total
            pdf.setDrawColor(0, 0, 0); pdf.setLineWidth(0.3);
            pdf.line(rightX, taxY, rightX + rightW, taxY);
        }
        taxY += taxRowH;
    });

    Y = Math.max(Y + wordsH + 4, taxY + 2, midY + 14);
    Y += 4;

    // ================================================================
    // ROW 7 — Footer: Terms & Conditions + Bank + Certification
    // ================================================================
    pdf.setDrawColor(0, 0, 0); pdf.setLineWidth(0.3);
    pdf.line(LM, Y, RE, Y);
    Y += 3;

    // LEFT side — Terms and Conditions
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(0, 0, 0);
    pdf.text('Terms And Conditions', LM, Y + 3);
    Y += 5;
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.5);
    const terms = [
        'Subject to Tirupur Jurisdiction.',
        'Payment by Cheque/DD only, payable at Tirupur.',
        `Cheques made in favour of ${companyName} to be sent to`,
        'Tirunelveli Address All disputes are subjected',
        'to Tirunelveli Jurisdiction.'
    ];
    terms.forEach((t, i) => { pdf.text(t, LM, Y + i * 3); });
    Y += terms.length * 3 + 2;

    // RIGHT side — Certification
    const certX = RE - 65;
    pdf.setFont('helvetica', 'italic'); pdf.setFontSize(7);
    pdf.text('Certified that above particulars are true', certX, Y - 10);
    pdf.text('and correct', certX + 15, Y - 7);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
    pdf.setTextColor(BLUE.r, BLUE.g, BLUE.b);
    pdf.text(`For ${companyName}`, RE, Y - 2, { align: 'right' });

    // Bank details box
    pdf.setTextColor(0, 0, 0);
    const bankBoxY = Y;
    const bankBoxW = CW * 0.55;
    const bankBoxH = 12;
    rect(pdf, LM, bankBoxY, bankBoxW, bankBoxH, { lw: 0.4 });

    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7);
    pdf.text('Bank Details:', LM + 2, bankBoxY + 4);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.5);
    pdf.text(`${bankName}, Account: ${bankAcc}`, LM + 2, bankBoxY + 8);
    pdf.text(`Branch: ${bankBranch}, IFSC: ${bankIfsc}`, LM + 2, bankBoxY + 11);

    return pdf;
};

// ==============================
// Export helpers
// ==============================

/** Download Tax Invoice PDF */
export const downloadInvoicePDF = (bill, settings, filename) => {
    const fn = filename || `SRI_RAM_FASHIONS_Invoice_${bill.billNumber || 'bill'}.pdf`;
    const pdf = generateInvoicePDF(bill, settings);
    pdf.save(fn);
    return pdf;
};

/** Get invoice PDF as blob URL for preview */
export const getInvoicePreviewUrl = (bill, settings) => {
    const pdf = generateInvoicePDF(bill, settings);
    return URL.createObjectURL(pdf.output('blob'));
};

/** Get invoice PDF as base64 data URL */
export const getInvoiceDataUrl = (bill, settings) => {
    const pdf = generateInvoicePDF(bill, settings);
    return pdf.output('datauristring');
};

export { numberToWords };

export default {
    generateInvoicePDF,
    downloadInvoicePDF,
    getInvoicePreviewUrl,
    getInvoiceDataUrl,
    numberToWords
};
