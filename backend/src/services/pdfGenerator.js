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
 * Layout precisely matches the frontend BillTemplate.jsx + BillTemplate.css.
 * @param {Object} bill - The bill document from MongoDB
 * @returns {Promise<Buffer>} - PDF file as a buffer
 */
export const generateBillPDF = async (bill) => {
    // Load settings
    let settings = await Settings.findOne();
    if (!settings) {
        settings = new Settings();
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
    const bankName = settings?.bank?.bankName || 'SOUTH INDIAN BANK';
    const bankAccount = settings?.bank?.accountNumber || '0338073000002328';
    const bankBranch = settings?.bank?.branchName || 'TIRUPUR';
    const bankIfsc = settings?.bank?.ifscCode || 'SIBL0000338';
    const bankAccName = settings?.bank?.accountHolderName || 'SRI RAM FASHIONS';

    // Tax calculations (match BillTemplate.jsx exactly)
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

    // ===== Page Setup =====
    // A4: 595.28 x 841.89 points. CSS uses 8mm margins on @page.
    const pageW = 595.28;
    const pageH = 841.89;
    const M = 22; // ~8mm margin
    const W = pageW - M * 2; // content width

    const doc = new PDFDocument({
        size: 'A4',
        margins: { top: M, bottom: M, left: M, right: M }
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    const pdfPromise = new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
    });

    // ===== Colors (exact from CSS) =====
    const BLUE = '#1a3d7c';     // company name, title, bank info, signature
    const BLACK = '#000000';    // default text
    const RED = '#cc0000';      // #c00 GST highlight, bank title
    const GRAY_TEXT = '#222222'; // address text
    const GRAY_BORDER = '#333333'; // border color (2px solid #333)
    const GRAY_LIGHT = '#555555'; // consignee copy italic
    const GRAY_TERMS = '#333333'; // terms text

    // ===== Outer border (2px solid #333) =====
    let y = M;
    doc.lineWidth(2).rect(M, M, W, pageH - M * 2).stroke(GRAY_BORDER);

    // ===== Helper functions =====
    const hLine = (yPos, lw = 1.5) => {
        doc.lineWidth(lw).moveTo(M, yPos).lineTo(M + W, yPos).stroke(GRAY_BORDER);
    };
    const vLine = (x, y1, y2, lw = 1.5) => {
        doc.lineWidth(lw).moveTo(x, y1).lineTo(x, y2).stroke(GRAY_BORDER);
    };

    // Padding constants (from CSS)
    const PX = 16; // horizontal padding
    const PY = 6;  // vertical padding

    // =============================================
    // ROW 1: Company Name + GSTIN
    // padding: 12px 16px 8px 16px; border-bottom: 1.5px solid #333;
    // =============================================
    const row1Top = y;
    const row1PadTop = 12;
    const row1PadBot = 8;

    // Company name: 24px, weight 900, #1a3d7c, uppercase, letter-spacing 2px
    doc.font('Helvetica-Bold').fontSize(20).fillColor(BLUE);
    doc.text(companyName.toUpperCase(), M + PX, row1Top + row1PadTop, {
        width: W * 0.6,
        characterSpacing: 1.5
    });

    // GSTIN: 15px, weight 800, #000, letter-spacing 0.5px
    doc.font('Helvetica-Bold').fontSize(12).fillColor(BLACK);
    doc.text(`GSTIN: ${companyGstin}`, M + W * 0.45, row1Top + row1PadTop + 4, {
        width: W * 0.55 - PX,
        align: 'right',
        characterSpacing: 0.3
    });

    const row1H = row1PadTop + 24 + row1PadBot; // ~44
    y = row1Top + row1H;
    hLine(y);

    // =============================================
    // ROW 2: Address (left, flex:1) + Invoice Details (right, 280px)
    // border-bottom: 1.5px solid #333
    // =============================================
    const row2Top = y;
    // 280px in CSS at 210mm (793.7px) → proportional PDFKit ratio
    const invoiceDetailsW = 200; // ~280px scaled to A4 points
    const addressW = W - invoiceDetailsW;

    // Vertical divider between address and details
    const row2H = 72;
    vLine(M + addressW, row2Top, row2Top + row2H);

    // Address: font-size 10px, line-height 1.55, color #222, padding 6px 16px
    doc.font('Helvetica').fontSize(8).fillColor(GRAY_TEXT);
    const addrX = M + PX;
    let addrY = row2Top + PY + 2;
    const addrLineH = 11;
    doc.text(`OFF : ${companyAddress1}`, addrX, addrY, { width: addressW - PX * 2 });
    addrY += addrLineH;
    doc.text(`OFF : ${companyAddress2}`, addrX, addrY, { width: addressW - PX * 2 });
    addrY += addrLineH;
    doc.text(`State: ${companyState} (Code ${companyStateCode})`, addrX, addrY, { width: addressW - PX * 2 });
    addrY += addrLineH;
    doc.text(`Email: ${companyEmail}`, addrX, addrY, { width: addressW - PX * 2 });
    addrY += addrLineH;
    doc.text(`Mob: ${companyPhone}`, addrX, addrY, { width: addressW - PX * 2 });

    // Invoice details: padding 6px 16px, label min-width 105px → ~75pt, font 11px
    const detX = M + addressW + PX;
    const detLabelW = 80;
    const detSepW = 12;
    const detValW = invoiceDetailsW - PX * 2 - detLabelW - detSepW;
    let detY = row2Top + PY + 4;
    const detRowH = 15;

    const drawDetailRow = (label, value) => {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK);
        doc.text(label, detX, detY, { width: detLabelW });
        doc.text(':', detX + detLabelW, detY, { width: detSepW, align: 'center' });
        doc.font('Helvetica').fontSize(9).fillColor(BLACK);
        doc.text(value || '', detX + detLabelW + detSepW, detY, { width: detValW });
        detY += detRowH;
    };

    drawDetailRow('Invoice Number', bill.billNumber || '');
    drawDetailRow('Invoice Date', formatDate(bill.date || bill.createdAt));
    drawDetailRow('From', bill.fromText || '');
    drawDetailRow('To', bill.toText || '');

    y = row2Top + row2H;
    hLine(y);

    // =============================================
    // ROW 3: TAX INVOICE Title Bar
    // text-align center, padding 5px 0, font 17px weight 900, #1a3d7c, underline, uppercase
    // =============================================
    const row3Top = y;
    const row3H = 24;
    doc.font('Helvetica-Bold').fontSize(14).fillColor(BLUE);
    doc.text('TAX INVOICE', M, row3Top + 5, {
        width: W,
        align: 'center',
        underline: true,
        characterSpacing: 2
    });
    y = row3Top + row3H;
    hLine(y);

    // =============================================
    // ROW 4: Buyer / Consignee Section
    // Left (flex:1, padding 6px 16px) | Right (280px, padding 6px 16px)
    // =============================================
    const row4Top = y;
    const buyerRightW = invoiceDetailsW; // 280px same as invoice details
    const buyerLeftW = W - buyerRightW;
    const row4H = 58;

    vLine(M + buyerLeftW, row4Top, row4Top + row4H);

    // Left - Consignee Copy (italic 9px #555)
    doc.font('Helvetica-Oblique').fontSize(7).fillColor(GRAY_LIGHT);
    doc.text('Consignee Copy', M + PX, row4Top + PY);

    // Buyer field rows: font 11.5px, label weight 800 min-width 85px
    const bFieldX = M + PX;
    const bLabelW = 70;
    const bFieldFontSize = 9;
    let bFieldY = row4Top + PY + 12;
    const bFieldRowH = 14;

    const drawBuyerField = (label, value) => {
        doc.font('Helvetica-Bold').fontSize(bFieldFontSize).fillColor(BLACK);
        doc.text(label, bFieldX, bFieldY, { width: bLabelW });
        doc.font('Helvetica-Bold').fontSize(bFieldFontSize).fillColor(BLACK);
        doc.text((value || '').toUpperCase(), bFieldX + bLabelW + 8, bFieldY, { width: buyerLeftW - PX * 2 - bLabelW - 8 });
        bFieldY += bFieldRowH;
    };

    drawBuyerField('BUYER:', bill.customer?.name || '');
    drawBuyerField('STATE:', bill.customer?.state || 'Tamilnadu');

    // Transport - value is normal weight
    doc.font('Helvetica-Bold').fontSize(bFieldFontSize).fillColor(BLACK);
    doc.text('TRANSPORT:', bFieldX, bFieldY, { width: bLabelW });
    doc.font('Helvetica').fontSize(bFieldFontSize).fillColor(BLACK);
    doc.text((bill.transport || '').toUpperCase(), bFieldX + bLabelW + 8, bFieldY, { width: buyerLeftW - PX * 2 - bLabelW - 8 });

    // Right side - MOB, GSTIN, CODE (same layout as invoice details)
    const bRightX = M + buyerLeftW + PX;
    const bRLabelW = 50;
    let bRightY = row4Top + PY + 8;
    const bRRowH = 15;

    const drawBuyerRight = (label, value) => {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK);
        doc.text(label, bRightX, bRightY, { width: bRLabelW });
        doc.font('Helvetica').fontSize(9).fillColor(BLACK);
        doc.text(value || '', bRightX + bRLabelW, bRightY, { width: buyerRightW - PX * 2 - bRLabelW });
        bRightY += bRRowH;
    };

    drawBuyerRight('MOB:', bill.customer?.phone || companyMob);
    drawBuyerRight('GSTIN:', bill.customer?.gstin || '');
    drawBuyerRight('CODE:', bill.customer?.stateCode || '33');

    y = row4Top + row4H;
    hLine(y);

    // =============================================
    // ROW 5: Items Table
    // Column widths from CSS: 5%, 18%, 9%, 10%, 10%, 8%, 11%, 9%, 12%
    // th: padding 5px 4px, font 10px weight 800, border 1px #333
    // td: padding 4px 5px, font 11px, center, border-left/right 1px #333
    // empty row: height 22px
    // =============================================
    const colPct = [0.05, 0.18, 0.09, 0.10, 0.10, 0.08, 0.11, 0.09, 0.12];
    // Ensure they total 0.92 → last column gets remainder
    const colSum = colPct.slice(0, 8).reduce((a, b) => a + b, 0);
    colPct[8] = 1 - colSum;
    const colW = colPct.map(p => W * p);

    const headers = ['S.No', 'Product', 'HSN\nCode', 'Sizes/\nPieces', 'Rate Per\nPiece', 'Pcs in\nPack', 'Rate Per\nPack', 'No Of\nPacks', 'Amount\nRs.'];

    // Table header
    let tY = y;
    const thH = 26; // header height
    let tX = M;

    // Draw header cells
    doc.font('Helvetica-Bold').fontSize(8).fillColor(BLACK);
    for (let i = 0; i < 9; i++) {
        // Cell border (1px solid #333, no top border since we have hLine)
        doc.lineWidth(1)
            .rect(tX, tY, colW[i], thH)
            .stroke(GRAY_BORDER);

        doc.text(headers[i], tX + 3, tY + 4, {
            width: colW[i] - 6,
            align: 'center',
            lineGap: 0
        });
        tX += colW[i];
    }
    tY += thH;

    // Data rows
    const dataRowH = 18;  // normal row ~px mapping
    const emptyRowH = 18; // empty rows: 22px CSS → ~18pt
    const minRows = 10;
    const totalRows = Math.max(items.length, minRows);

    for (let r = 0; r < totalRows; r++) {
        tX = M;
        const item = items[r];
        const rH = item ? dataRowH : emptyRowH;

        for (let c = 0; c < 9; c++) {
            // Left & right borders
            doc.lineWidth(1)
                .moveTo(tX, tY)
                .lineTo(tX, tY + rH)
                .stroke(GRAY_BORDER);
            if (c === 8) {
                doc.moveTo(tX + colW[c], tY)
                    .lineTo(tX + colW[c], tY + rH)
                    .stroke(GRAY_BORDER);
            }

            // Bottom border only on last row
            if (r === totalRows - 1) {
                doc.lineWidth(1)
                    .moveTo(tX, tY + rH)
                    .lineTo(tX + colW[c], tY + rH)
                    .stroke(GRAY_BORDER);
            }

            if (item) {
                const ratePerPack = item.ratePerPack || item.price || 0;
                const noOfPacks = item.noOfPacks || item.quantity || 0;
                const amount = item.total || (ratePerPack * noOfPacks);

                let cellText = '';
                let align = 'center';

                switch (c) {
                    case 0: cellText = `${r + 1}`; break;
                    case 1: cellText = item.productName || item.name || ''; align = 'left'; break;
                    case 2: cellText = item.hsnCode || item.hsn || ''; break;
                    case 3: cellText = item.sizesOrPieces || ''; break;
                    case 4: cellText = item.ratePerPiece ? `${item.ratePerPiece}` : ''; break;
                    case 5: cellText = item.pcsInPack ? `${item.pcsInPack}` : ''; break;
                    case 6: cellText = `${ratePerPack}`; break;
                    case 7: cellText = `${noOfPacks}`; break;
                    case 8: cellText = `${amount}`; break;
                }

                if (cellText) {
                    doc.font('Helvetica').fontSize(8.5).fillColor(BLACK);
                    const textPad = (c === 1) ? 7 : 3; // product column has extra left padding
                    doc.text(cellText, tX + textPad, tY + 4, {
                        width: colW[c] - textPad - 3,
                        align,
                        lineGap: 0
                    });
                }
            }

            tX += colW[c];
        }
        tY += rH;
    }

    y = tY;
    hLine(y, 2); // border-top: 2px solid #333 on summary

    // =============================================
    // ROW 6: Summary (3-column)
    // Left flex:1.2 | Middle flex:0.8 | Right flex:1
    // min-height: 110px → ~82pt
    // =============================================
    const sumTotalFlex = 1.2 + 0.8 + 1.0;
    const sumLeftW = W * (1.2 / sumTotalFlex);
    const sumMidW = W * (0.8 / sumTotalFlex);
    const sumRightW = W * (1.0 / sumTotalFlex);
    const sumH = 90; // ~110px

    // Vertical dividers
    vLine(M + sumLeftW, y, y + sumH);
    vLine(M + sumLeftW + sumMidW, y, y + sumH);

    // ----- Left column: Total Packs / Bill Amount / In Words -----
    // padding: 10px 14px, gap 4px, font 11px, label weight 800 min-width 85px
    const sLX = M + 14;
    let sLY = y + 10;
    const sLabelW = 68;
    const sSepW = 12;
    const sRowGap = 16;

    const drawSummaryField = (label, value, isWords = false) => {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK);
        doc.text(label, sLX, sLY, { width: sLabelW });
        doc.text(':', sLX + sLabelW, sLY, { width: sSepW, align: 'center' });
        if (isWords) {
            doc.font('Helvetica-Bold').fontSize(8).fillColor(BLACK);
            doc.text(value, sLX + sLabelW + sSepW + 2, sLY, { width: sumLeftW - 14 * 2 - sLabelW - sSepW - 4 });
        } else {
            doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK);
            doc.text(value, sLX + sLabelW + sSepW + 2, sLY, { width: sumLeftW - 14 * 2 - sLabelW - sSepW - 4 });
        }
        sLY += sRowGap;
    };

    drawSummaryField('Total Packs', `${totalPacks}`);
    drawSummaryField('Bill Amount', `${totalAmt}`);
    drawSummaryField('In words', `Rupees ${numberToWords(totalAmt)} Only`, true);

    // ----- Middle column: Bundles + GST Box -----
    // padding: 10px 12px, bundles label 10.5px weight 800, value 14px weight 800
    const sMX = M + sumLeftW + 12;
    const sMW = sumMidW - 24;

    // NUM OF BUNDLES
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(BLACK);
    doc.text('NUM OF BUNDLES :', sMX, y + 10, { width: sMW * 0.7 });
    doc.font('Helvetica-Bold').fontSize(11).fillColor(BLACK);
    doc.text(`${numBundles}`, sMX + sMW * 0.7, y + 8, { width: sMW * 0.3, align: 'right' });

    // GST Box: border 2px solid #c00, padding 6px 10px
    const gstBoxY = y + sumH - 38;
    const gstBoxH = 26;
    doc.lineWidth(2).rect(sMX, gstBoxY, sMW, gstBoxH).stroke(RED);
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(RED);
    doc.text('TOTAL GST', sMX + 8, gstBoxY + 7, { width: sMW * 0.5 });
    doc.font('Helvetica-Bold').fontSize(12).fillColor(RED);
    doc.text(`${totalGst.toFixed(0)}`, sMX + sMW * 0.5, gstBoxY + 5, { width: sMW * 0.45, align: 'right' });

    // ----- Right column: Tax Breakdown -----
    // padding: 6px 14px, font 11px, gap 1px
    const sRX = M + sumLeftW + sumMidW + 14;
    const sRW = sumRightW - 28;
    const taxFontSize = 9;
    const taxRowH = 11;
    let txY = y + 6;

    const drawTaxRow = (label, value, isHighlight = false, isTotal = false) => {
        if (isTotal) {
            // border-top: 1.5px solid #000, margin-top 3px, padding-top 4px
            txY += 3;
            doc.lineWidth(1.5)
                .moveTo(sRX - 4, txY)
                .lineTo(sRX + sRW + 4, txY)
                .stroke(BLACK);
            txY += 4;
        }

        const color = isHighlight ? RED : BLACK;
        const fontSize = isTotal ? 10 : taxFontSize;
        const fontWeight = (isHighlight || isTotal) ? 'Helvetica-Bold' : 'Helvetica';

        doc.font(fontWeight).fontSize(fontSize).fillColor(color);
        doc.text(label, sRX, txY, { width: sRW * 0.55 });
        doc.font('Helvetica-Bold').fontSize(fontSize).fillColor(color);
        doc.text(value, sRX + sRW * 0.55, txY, { width: sRW * 0.45, align: 'right' });
        txY += taxRowH;
    };

    drawTaxRow('Product Amt', productAmt.toFixed(2));
    drawTaxRow('Discount', discount.toFixed(0));
    drawTaxRow('Taxable Amt', taxableAmt.toFixed(2));
    drawTaxRow(`CGST @ ${cgstRate}%`, cgstAmt.toFixed(2), true);
    drawTaxRow(`SGST @ ${sgstRate}%`, sgstAmt.toFixed(2), true);
    drawTaxRow('Round Off', roundOff.toFixed(2));
    drawTaxRow('Total Amt', `${totalAmt}`, false, true);

    y += sumH;
    hLine(y, 1.5); // border-bottom: 1.5px solid #333

    // =============================================
    // ROW 7: Footer (Terms + Bank | Certification)
    // Left flex:1.2 | Right flex:1
    // min-height: 100px → ~75pt
    // =============================================
    const footFlex = 1.2 + 1.0;
    const footLeftW = W * (1.2 / footFlex);
    const footRightW = W * (1.0 / footFlex);
    const footH = 95;

    // Vertical divider
    vLine(M + footLeftW, y, y + footH);

    // ----- Left: Terms + Bank -----
    // padding: 8px 14px, gap 6px
    const fLX = M + 14;

    // Terms title: weight 800, 11px, #1a3d7c, underline
    doc.font('Helvetica-Bold').fontSize(9).fillColor(BLUE);
    doc.text('Terms And Conditions', fLX, y + 8, { underline: true });

    // Terms text: 8.5px, line-height 1.5, #333
    doc.font('Helvetica').fontSize(7).fillColor(GRAY_TERMS);
    doc.text(
        `Subject to Tirupur Jurisdiction.\nPayment by Cheque/DD only, payable at Tirupur.\nCheques made in favour of ${companyName} to be sent to Tirunelveli Address\nAll disputes are subjected to Tirunelveli Jurisdiction`,
        fLX, y + 20,
        { width: footLeftW - 28, lineGap: 1.5 }
    );

    // Bank box: background #fffbe6, border 1.5px solid #d4a017, padding 6px 10px
    const bankBoxY = y + 54;
    const bankBoxW = footLeftW - 28;
    const bankBoxH = 34;

    // Yellow background
    doc.rect(fLX, bankBoxY, bankBoxW, bankBoxH).fill('#fffbe6');
    // Border
    doc.lineWidth(1.5).rect(fLX, bankBoxY, bankBoxW, bankBoxH).stroke('#d4a017');

    // Bank title: weight 800, 10px, #c00, underline
    doc.font('Helvetica-Bold').fontSize(8).fillColor(RED);
    doc.text('Bank Details:', fLX + 8, bankBoxY + 5, { underline: true });

    // Bank info: 9px, weight 700, #1a3d7c, line-height 1.5
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(BLUE);
    doc.text(`ACC NAME: ${bankAccName}    BANK: ${bankName}`, fLX + 8, bankBoxY + 16, { width: bankBoxW - 16 });
    doc.text(`ACC NUM: ${bankAccount}    BRANCH: ${bankBranch}    IFSC: ${bankIfsc}`, fLX + 8, bankBoxY + 25, { width: bankBoxW - 16 });

    // ----- Right: Certification + Signature -----
    // padding: 10px 14px, centered, gap 12px
    const fRX = M + footLeftW + 14;
    const fRW = footRightW - 28;

    // Certified: 11px, italic, #333
    doc.font('Helvetica-Oblique').fontSize(9).fillColor(GRAY_TERMS);
    doc.text('Certified that above particulars are true\nand correct', fRX, y + 18, {
        width: fRW,
        align: 'center',
        lineGap: 2
    });

    // Signature: weight 800, 13px, #1a3d7c
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(BLUE);
    doc.text(`For ${companyName}`, fRX, y + 65, {
        width: fRW,
        align: 'center'
    });

    // Finalize
    doc.end();
    return pdfPromise;
};

export default { generateBillPDF };
