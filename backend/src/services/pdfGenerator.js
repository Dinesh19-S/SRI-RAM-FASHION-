import PDFDocument from 'pdfkit';
import Settings from '../models/Settings.js';

// Convert number to words in Indian format
const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num === 0) return 'Zero';
    if (num < 0) return 'Minus ' + numberToWords(-num);

    num = Math.floor(num);
    let words = '';

    if (Math.floor(num / 10000000) > 0) {
        words += numberToWords(Math.floor(num / 10000000)) + ' Crore ';
        num %= 10000000;
    }
    if (Math.floor(num / 100000) > 0) {
        words += numberToWords(Math.floor(num / 100000)) + ' Lakh ';
        num %= 100000;
    }
    if (Math.floor(num / 1000) > 0) {
        words += numberToWords(Math.floor(num / 1000)) + ' Thousand ';
        num %= 1000;
    }
    if (Math.floor(num / 100) > 0) {
        words += numberToWords(Math.floor(num / 100)) + ' Hundred ';
        num %= 100;
    }
    if (num > 0) {
        if (words !== '') words += 'and ';
        if (num < 20) words += ones[num];
        else {
            words += tens[Math.floor(num / 10)];
            if (num % 10 > 0) words += ' ' + ones[num % 10];
        }
    }
    return words.trim();
};

const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Generate a bill PDF buffer using PDFKit.
 * The layout replicates the frontend BillTemplate design.
 * @param {Object} bill - The bill document from MongoDB
 * @returns {Promise<Buffer>} - PDF file as a buffer
 */
export const generateBillPDF = async (bill) => {
    // Load settings
    let settings = await Settings.findOne();
    if (!settings) {
        settings = new Settings(); // use defaults
    }

    // Company details
    const companyName = settings?.company?.name || 'SRI RAM FASHIONS';
    const companyGstin = settings?.company?.gstin || '33AZRPM4425F2ZA';
    const companyAddress1 = settings?.company?.address1 || 'OFF : 61C9, Anupparpalayam Puthur, Tirupur. 641652';
    const companyAddress2 = settings?.company?.address2 || 'OFF : B1 K, Madurai Raod, SankerNager, Tirunelveli Dt. 627357';
    const companyState = settings?.company?.state || 'Tamilnadu';
    const companyStateCode = settings?.company?.stateCode || '33';
    const companyEmail = settings?.company?.email || 'sriramfashionserp@gmail.com';
    const companyPhone = settings?.company?.phone || '9080573831';
    const companyMob = settings?.company?.phone2 || '8248893759';

    // Bank details
    const bankName = settings?.bank?.bankName || 'South Indian Bank';
    const bankAccount = settings?.bank?.accountNumber || '0338073000002328';
    const bankBranch = settings?.bank?.branchName || 'TIRUPUR';
    const bankIfsc = settings?.bank?.ifscCode || 'SIBL0000338';

    // Tax calculations
    const productAmt = bill.subtotal || 0;
    const discount = bill.discountAmount || 0;
    const taxableAmt = productAmt - discount;
    const cgstRate = settings?.tax?.cgstRate || 2.5;
    const sgstRate = settings?.tax?.sgstRate || 2.5;
    const cgstAmt = (taxableAmt * cgstRate) / 100;
    const sgstAmt = (taxableAmt * sgstRate) / 100;
    const totalGst = cgstAmt + sgstAmt;
    const rawTotal = taxableAmt + totalGst;
    const roundOff = bill.roundOff || (Math.round(rawTotal) - rawTotal);
    const totalAmt = Math.round(rawTotal);
    const totalPacks = bill.totalPacks || bill.items?.reduce((sum, item) => sum + (item.noOfPacks || item.quantity || 0), 0) || 0;
    const numBundles = bill.numOfBundles || 1;
    const items = bill.items || [];

    // Page dimensions (A4 in points: 595.28 x 841.89)
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 28; // ~10mm
    const contentWidth = pageWidth - margin * 2;

    // Create PDF
    const doc = new PDFDocument({
        size: 'A4',
        margins: { top: margin, bottom: margin, left: margin, right: margin }
    });

    // Collect chunks into a buffer
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    const pdfPromise = new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
    });

    // Colors
    const darkBlue = '#1a3d7c';
    const black = '#000000';
    const red = '#cc0000';
    const gray = '#555555';
    const lightGray = '#333333';

    // Draw outer border
    const borderX = margin - 4;
    const borderY = margin - 4;
    const borderW = contentWidth + 8;
    const borderH = pageHeight - margin * 2 + 8;
    doc.lineWidth(2).rect(borderX, borderY, borderW, borderH).stroke(lightGray);

    let y = margin;

    // ===== HELPER: draw horizontal line =====
    const drawLine = (yPos, width = 1.5) => {
        doc.lineWidth(width)
            .moveTo(margin, yPos)
            .lineTo(margin + contentWidth, yPos)
            .stroke(lightGray);
    };

    // ===== ROW 1: Company Name + GSTIN =====
    doc.font('Helvetica-Bold').fontSize(18).fillColor(darkBlue);
    doc.text(companyName, margin + 8, y + 4, { width: contentWidth * 0.65 });

    doc.font('Helvetica-Bold').fontSize(11).fillColor(black);
    doc.text(`GSTIN: ${companyGstin}`, margin + contentWidth * 0.55, y + 8, {
        width: contentWidth * 0.45 - 8,
        align: 'right'
    });

    y += 32;
    drawLine(y);

    // ===== ROW 2: Address (left) + Invoice Details (right) =====
    const row2Y = y + 4;
    const addressWidth = contentWidth * 0.55;
    const detailsWidth = contentWidth * 0.45;

    // Vertical divider
    doc.lineWidth(1.5)
        .moveTo(margin + addressWidth, y)
        .lineTo(margin + addressWidth, y + 68)
        .stroke(lightGray);

    // Address
    doc.font('Helvetica').fontSize(8).fillColor('#222');
    doc.text(companyAddress1, margin + 8, row2Y + 2, { width: addressWidth - 16 });
    doc.text(companyAddress2, margin + 8, row2Y + 14, { width: addressWidth - 16 });
    doc.text(`State: ${companyState} (Code ${companyStateCode})`, margin + 8, row2Y + 26, { width: addressWidth - 16 });
    doc.text(`Email: ${companyEmail}`, margin + 8, row2Y + 38, { width: addressWidth - 16 });
    doc.text(`Mob: ${companyPhone}`, margin + 8, row2Y + 50, { width: addressWidth - 16 });

    // Invoice details
    const detailX = margin + addressWidth + 8;
    const detailLabelW = 90;
    const drawDetailRow = (label, value, rowY) => {
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(black);
        doc.text(label, detailX, rowY, { width: detailLabelW });
        doc.text(':', detailX + detailLabelW, rowY, { width: 10 });
        doc.font('Helvetica').fillColor(black);
        doc.text(value || '', detailX + detailLabelW + 14, rowY, { width: detailsWidth - detailLabelW - 30 });
    };

    drawDetailRow('Invoice Number', bill.billNumber || '', row2Y + 4);
    drawDetailRow('Invoice Date', formatDate(bill.date || bill.createdAt), row2Y + 18);
    drawDetailRow('From', bill.fromText || '', row2Y + 32);
    drawDetailRow('To', bill.toText || '', row2Y + 46);

    y += 68;
    drawLine(y);

    // ===== ROW 3: TAX INVOICE title =====
    doc.font('Helvetica-Bold').fontSize(13).fillColor(darkBlue);
    doc.text('TAX INVOICE', margin, y + 4, { width: contentWidth, align: 'center', underline: true });
    y += 22;
    drawLine(y);

    // ===== ROW 4: Buyer / Consignee Details =====
    const row4Y = y + 4;
    const buyerLeftW = contentWidth * 0.55;
    const buyerRightW = contentWidth * 0.45;

    // Vertical divider
    doc.lineWidth(1.5)
        .moveTo(margin + buyerLeftW, y)
        .lineTo(margin + buyerLeftW, y + 55)
        .stroke(lightGray);

    // Left - Buyer info
    doc.font('Helvetica-Oblique').fontSize(7).fillColor(gray);
    doc.text('Consignee Copy', margin + 8, row4Y);

    doc.font('Helvetica-Bold').fontSize(9).fillColor(black);
    doc.text('BUYER:', margin + 8, row4Y + 12, { continued: true, width: 60 });
    doc.font('Helvetica-Bold').fillColor(black);
    doc.text(`  ${(bill.customer?.name || '').toUpperCase()}`, { width: buyerLeftW - 80 });

    doc.font('Helvetica-Bold').fontSize(9).fillColor(black);
    doc.text('STATE:', margin + 8, row4Y + 26, { continued: true, width: 60 });
    doc.font('Helvetica-Bold').fillColor(black);
    doc.text(`  ${bill.customer?.state || 'Tamilnadu'}`, { width: buyerLeftW - 80 });

    doc.font('Helvetica-Bold').fontSize(9).fillColor(black);
    doc.text('TRANSPORT:', margin + 8, row4Y + 40, { continued: true, width: 75 });
    doc.font('Helvetica').fillColor(black);
    doc.text(`  ${bill.transport || ''}`, { width: buyerLeftW - 95 });

    // Right - MOB, GSTIN, CODE
    const bDetailX = margin + buyerLeftW + 8;
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(black);
    doc.text('MOB:', bDetailX, row4Y + 8, { width: 50 });
    doc.font('Helvetica').text(bill.customer?.phone || companyMob, bDetailX + 50, row4Y + 8, { width: buyerRightW - 60 });

    doc.font('Helvetica-Bold').text('GSTIN:', bDetailX, row4Y + 22, { width: 50 });
    doc.font('Helvetica').text(bill.customer?.gstin || '', bDetailX + 50, row4Y + 22, { width: buyerRightW - 60 });

    doc.font('Helvetica-Bold').text('CODE:', bDetailX, row4Y + 36, { width: 50 });
    doc.font('Helvetica').text(bill.customer?.stateCode || '33', bDetailX + 50, row4Y + 36, { width: buyerRightW - 60 });

    y += 55;
    drawLine(y);

    // ===== ROW 5: Items Table =====
    const colWidths = [
        contentWidth * 0.05,   // S.No
        contentWidth * 0.20,   // Product
        contentWidth * 0.09,   // HSN
        contentWidth * 0.10,   // Sizes
        contentWidth * 0.10,   // Rate/Piece
        contentWidth * 0.08,   // Pcs in Pack
        contentWidth * 0.11,   // Rate/Pack
        contentWidth * 0.10,   // No of Packs
        contentWidth * 0.12    // Amount (adjusted to fill)
    ];
    // Fix: ensure last col fills remainder
    colWidths[8] = contentWidth - colWidths.slice(0, 8).reduce((a, b) => a + b, 0);

    const headers = ['S.No', 'Product', 'HSN\nCode', 'Sizes/\nPieces', 'Rate Per\nPiece', 'Pcs in\nPack', 'Rate Per\nPack', 'No Of\nPacks', 'Amount\nRs.'];

    // Table header
    let tableY = y;
    const headerH = 24;
    let colX = margin;

    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(black);
    for (let i = 0; i < headers.length; i++) {
        // Draw cell border
        doc.lineWidth(1)
            .rect(colX, tableY, colWidths[i], headerH)
            .stroke(lightGray);

        // Draw text centered
        doc.text(headers[i], colX + 2, tableY + 3, {
            width: colWidths[i] - 4,
            align: 'center',
            lineGap: 0
        });
        colX += colWidths[i];
    }

    tableY += headerH;

    // Table rows
    const rowH = 18;
    const minRows = 10;
    const totalRows = Math.max(items.length, minRows);

    doc.font('Helvetica').fontSize(8).fillColor(black);

    for (let r = 0; r < totalRows; r++) {
        colX = margin;
        const item = items[r];

        for (let c = 0; c < colWidths.length; c++) {
            // Draw cell side borders
            doc.lineWidth(1)
                .moveTo(colX, tableY)
                .lineTo(colX, tableY + rowH)
                .stroke(lightGray);

            if (c === colWidths.length - 1) {
                doc.moveTo(colX + colWidths[c], tableY)
                    .lineTo(colX + colWidths[c], tableY + rowH)
                    .stroke(lightGray);
            }

            if (item) {
                const ratePerPack = item.ratePerPack || item.price || 0;
                const noOfPacks = item.noOfPacks || item.quantity || 0;
                const amount = item.total || (ratePerPack * noOfPacks);

                let cellText = '';
                const align = c === 1 ? 'left' : 'center';
                switch (c) {
                    case 0: cellText = `${r + 1}`; break;
                    case 1: cellText = item.productName || item.name || ''; break;
                    case 2: cellText = item.hsnCode || item.hsn || ''; break;
                    case 3: cellText = item.sizesOrPieces || ''; break;
                    case 4: cellText = item.ratePerPiece ? `${item.ratePerPiece}` : ''; break;
                    case 5: cellText = item.pcsInPack ? `${item.pcsInPack}` : ''; break;
                    case 6: cellText = `${ratePerPack}`; break;
                    case 7: cellText = `${noOfPacks}`; break;
                    case 8: cellText = `${amount}`; break;
                }

                doc.text(cellText, colX + 2, tableY + 4, {
                    width: colWidths[c] - 4,
                    align,
                    lineGap: 0
                });
            }

            colX += colWidths[c];
        }

        tableY += rowH;
    }

    // Bottom border of table
    drawLine(tableY, 2);
    y = tableY;

    // ===== ROW 6: Summary Section (3 columns) =====
    const summaryH = 100;
    const sumLeftW = contentWidth * 0.38;
    const sumMidW = contentWidth * 0.25;
    const sumRightW = contentWidth - sumLeftW - sumMidW;

    // Vertical dividers
    doc.lineWidth(1.5)
        .moveTo(margin + sumLeftW, y)
        .lineTo(margin + sumLeftW, y + summaryH)
        .stroke(lightGray);
    doc.lineWidth(1.5)
        .moveTo(margin + sumLeftW + sumMidW, y)
        .lineTo(margin + sumLeftW + sumMidW, y + summaryH)
        .stroke(lightGray);

    // Left column
    const sumLX = margin + 8;
    const sumLY = y + 8;
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(black);
    doc.text('Total Packs', sumLX, sumLY, { width: 70 });
    doc.text(':', sumLX + 70, sumLY, { width: 10 });
    doc.font('Helvetica-Bold').text(`${totalPacks}`, sumLX + 82, sumLY, { width: sumLeftW - 100 });

    doc.font('Helvetica-Bold').text('Bill Amount', sumLX, sumLY + 16, { width: 70 });
    doc.text(':', sumLX + 70, sumLY + 16, { width: 10 });
    doc.font('Helvetica-Bold').text(`${totalAmt}`, sumLX + 82, sumLY + 16, { width: sumLeftW - 100 });

    doc.font('Helvetica-Bold').text('In words', sumLX, sumLY + 32, { width: 70 });
    doc.text(':', sumLX + 70, sumLY + 32, { width: 10 });
    doc.font('Helvetica').fontSize(7.5);
    doc.text(`Rupees ${numberToWords(totalAmt)} Only`, sumLX + 82, sumLY + 32, { width: sumLeftW - 100 });

    // Middle column - Bundles + GST
    const sumMX = margin + sumLeftW + 8;
    doc.font('Helvetica-Bold').fontSize(8).fillColor(black);
    doc.text('NUM OF BUNDLES :', sumMX, y + 10, { width: sumMidW - 40 });
    doc.fontSize(11).text(`${numBundles}`, sumMX + sumMidW - 40, y + 8, { width: 30, align: 'right' });

    // GST Box
    const gstBoxY = y + 55;
    const gstBoxW = sumMidW - 16;
    doc.lineWidth(2).rect(sumMX, gstBoxY, gstBoxW, 28).stroke(red);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(red);
    doc.text('TOTAL GST', sumMX + 4, gstBoxY + 8, { width: gstBoxW * 0.6 });
    doc.fontSize(12).text(`${totalGst.toFixed(0)}`, sumMX + gstBoxW * 0.5, gstBoxY + 6, { width: gstBoxW * 0.45, align: 'right' });

    // Right column - Tax breakdown
    const sumRX = margin + sumLeftW + sumMidW + 8;
    const taxRowH = 12;
    let taxY = y + 6;

    const drawTaxRow = (label, value, isBold, isRed, isTotal) => {
        const font = isBold ? 'Helvetica-Bold' : 'Helvetica';
        const color = isRed ? red : black;
        doc.font(font).fontSize(isTotal ? 9 : 8).fillColor(color);
        doc.text(label, sumRX, taxY, { width: sumRightW * 0.55 });
        doc.text(value, sumRX + sumRightW * 0.55, taxY, { width: sumRightW * 0.4 - 16, align: 'right' });

        if (isTotal) {
            doc.lineWidth(1.5)
                .moveTo(sumRX - 4, taxY - 2)
                .lineTo(sumRX + sumRightW - 16, taxY - 2)
                .stroke(black);
        }
        taxY += taxRowH;
    };

    drawTaxRow('Product Amt', productAmt.toFixed(2), false, false, false);
    drawTaxRow('Discount', discount.toFixed(0), false, false, false);
    drawTaxRow('Taxable Amt', taxableAmt.toFixed(2), false, false, false);
    drawTaxRow(`CGST @ ${cgstRate}%`, cgstAmt.toFixed(2), true, true, false);
    drawTaxRow(`SGST @ ${sgstRate}%`, sgstAmt.toFixed(2), true, true, false);
    drawTaxRow('Round Off', roundOff.toFixed(2), false, false, false);
    taxY += 2;
    drawTaxRow('Total Amt', `${totalAmt}`, true, false, true);

    y += summaryH;
    drawLine(y, 1.5);

    // ===== ROW 7: Footer - Terms, Bank, Certification =====
    const footerLeftW = contentWidth * 0.55;

    // Vertical divider
    doc.lineWidth(1.5)
        .moveTo(margin + footerLeftW, y)
        .lineTo(margin + footerLeftW, y + 90)
        .stroke(lightGray);

    // Terms
    const footLX = margin + 8;
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkBlue);
    doc.text('Terms And Conditions', footLX, y + 6, { underline: true });

    doc.font('Helvetica').fontSize(6.5).fillColor(lightGray);
    doc.text(`Subject to Tirupur Jurisdiction.\nPayment by Cheque/DD only, payable at Tirupur.\nCheques made in favour of ${companyName} to be sent to Tirunelveli Address\nAll disputes are subjected to Tirunelveli Jurisdiction`, footLX, y + 18, { width: footerLeftW - 24, lineGap: 1 });

    // Bank box
    const bankBoxY = y + 55;
    doc.lineWidth(1.5).rect(footLX, bankBoxY, footerLeftW - 24, 30).stroke('#d4a017');
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(red);
    doc.text('Bank Details:', footLX + 4, bankBoxY + 4, { underline: true });
    doc.font('Helvetica-Bold').fontSize(7).fillColor(darkBlue);
    doc.text(`${bankName}, Account: ${bankAccount}`, footLX + 4, bankBoxY + 14, { width: footerLeftW - 32 });
    doc.text(`Branch: ${bankBranch}, IFSC: ${bankIfsc}`, footLX + 4, bankBoxY + 22, { width: footerLeftW - 32 });

    // Right - Certification + Signature
    const footRX = margin + footerLeftW + 8;
    const footRightW = contentWidth - footerLeftW - 16;

    doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(lightGray);
    doc.text('Certified that above particulars are true\nand correct', footRX, y + 16, {
        width: footRightW,
        align: 'center'
    });

    doc.font('Helvetica-Bold').fontSize(10).fillColor(darkBlue);
    doc.text(`For ${companyName}`, footRX, y + 60, {
        width: footRightW,
        align: 'center'
    });

    // Finalize
    doc.end();

    return pdfPromise;
};

export default { generateBillPDF };
