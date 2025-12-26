import './BillTemplate.css';

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

const BillTemplate = ({ bill, settings, forPrint = false }) => {
    if (!bill || !settings) return null;

    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Calculate totals
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

    // Generate 20 rows for the table (fill empty if less items)
    const itemRowCount = 20;
    const emptyRowsCount = Math.max(0, itemRowCount - (bill.items?.length || 0));
    const emptyRows = Array(emptyRowsCount).fill(null);

    return (
        <div className={`bill-template ${forPrint ? 'for-print' : ''}`} id="bill-template">
            {/* HEADER ROW 1 - Company Name and GSTIN */}
            <div className="bill-header">
                <div className="company-name">{settings?.company?.name || 'SRI RAM FASHIONS'}</div>
                <div className="gstin">GSTIN: {settings?.company?.gstin || '33AZRPM4425F2ZA'}</div>
            </div>

            {/* HEADER ROWS 2-5 - Company Info and Invoice Details */}
            <div className="bill-info-section">
                <div className="address-section">
                    <div className="address-line">OFF : {settings?.company?.address1 || '61C9, Anupparpalayam Puthur, Tirupur. 641652'}</div>
                    <div className="address-line">OFF : {settings?.company?.address2 || '81 K, Madurai Road, SankerNager, Tirunelveli Dt. 627357'}</div>
                    <div className="address-line">State: {settings?.company?.state || 'Tamil Nadu'} (Code {settings?.company?.stateCode || '33'})</div>
                    <div className="address-line">Email: {settings?.company?.email || 'sriramfashionstrp@gmail.com'}</div>
                    <div className="address-line">Mob: {settings?.company?.phone || '9080573831'}</div>
                </div>
                <div className="invoice-section">
                    <div className="invoice-row">
                        <span className="invoice-label">Invoice Number</span>
                        <span className="invoice-colon">:</span>
                        <span className="invoice-value">{bill.billNumber}</span>
                    </div>
                    <div className="invoice-row">
                        <span className="invoice-label">Invoice Date</span>
                        <span className="invoice-colon">:</span>
                        <span className="invoice-value">{formatDate(bill.date || bill.createdAt)}</span>
                    </div>
                    <div className="invoice-row">
                        <span className="invoice-label">From</span>
                        <span className="invoice-colon">:</span>
                        <span className="invoice-value">{bill.fromText || bill.fromDate || ''}</span>
                    </div>
                    <div className="invoice-row">
                        <span className="invoice-label">To</span>
                        <span className="invoice-colon">:</span>
                        <span className="invoice-value">{bill.toText || bill.toDate || ''}</span>
                    </div>
                </div>
            </div>

            {/* TAX INVOICE - Full Width Header */}
            <div className="tax-invoice-header">
                TAX INVOICE
            </div>

            {/* BUYER SECTION with Consigner Copy and MOB */}
            <div className="buyer-section">
                <div className="buyer-left">
                    <div className="consigner-label">Consigner Copy</div>
                    <div className="buyer-row">
                        <span className="buyer-label">BUYER:</span>
                        <span className="buyer-value">{bill.customer?.name || ''}</span>
                    </div>
                    <div className="buyer-row">
                        <span className="buyer-label">STATE:</span>
                        <span className="buyer-value">{bill.customer?.state || 'Tamilnadu'}</span>
                    </div>
                    <div className="buyer-row">
                        <span className="buyer-label">TRANSPORT:</span>
                        <span className="buyer-value">{bill.transport || ''}</span>
                    </div>
                </div>
                <div className="buyer-right">
                    <div className="buyer-row mob-row">
                        <span className="buyer-label">MOB:</span>
                        <span className="buyer-value">{bill.customer?.phone || ''}</span>
                    </div>
                    <div className="buyer-row">
                        <span className="buyer-label">GSTIN:</span>
                        <span className="buyer-value">{bill.customer?.gstin || ''}</span>
                    </div>
                    <div className="buyer-row">
                        <span className="buyer-label">CODE:</span>
                        <span className="buyer-value">{bill.customer?.stateCode || '33'}</span>
                    </div>
                </div>
            </div>

            {/* ITEM TABLE - 20 Rows */}
            <div className="items-table-container">
                <table className="items-table">
                    <thead>
                        <tr>
                            <th className="sno-col">S.No</th>
                            <th className="product-col">Product</th>
                            <th className="hsn-col">HSN<br />Code</th>
                            <th className="sizes-col">Sizes/<br />Pieces</th>
                            <th className="rate-piece-col">Rate Per<br />Piece</th>
                            <th className="pcs-pack-col">Pcs in<br />Pack</th>
                            <th className="rate-pack-col">Rate Per<br />Pack</th>
                            <th className="packs-col">No Of<br />Packs</th>
                            <th className="amount-col">Amount<br />Rs.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bill.items?.map((item, index) => (
                            <tr key={index}>
                                <td className="sno-col">{index + 1}</td>
                                <td className="product-col">{item.productName || item.name || ''}</td>
                                <td className="hsn-col">{item.hsnCode || item.hsn || ''}</td>
                                <td className="sizes-col">{item.sizesOrPieces || ''}</td>
                                <td className="rate-piece-col">{item.ratePerPiece || item.price || ''}</td>
                                <td className="pcs-pack-col">{item.pcsInPack || ''}</td>
                                <td className="rate-pack-col">{item.ratePerPack || ''}</td>
                                <td className="packs-col">{item.noOfPacks || item.quantity || ''}</td>
                                <td className="amount-col">{item.total || (item.price * item.quantity) || ''}</td>
                            </tr>
                        ))}
                        {emptyRows.map((_, index) => (
                            <tr key={`empty-${index}`}>
                                <td className="sno-col"></td>
                                <td className="product-col"></td>
                                <td className="hsn-col"></td>
                                <td className="sizes-col"></td>
                                <td className="rate-piece-col"></td>
                                <td className="pcs-pack-col"></td>
                                <td className="rate-pack-col"></td>
                                <td className="packs-col"></td>
                                <td className="amount-col"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* TOTALS SECTION */}
            <div className="bill-footer-section">
                <div className="footer-left">
                    <div className="totals-row">
                        <span className="total-label">Total Packs</span>
                        <span className="total-colon">:</span>
                        <span className="total-value">{totalPacks}</span>
                    </div>
                    <div className="totals-row">
                        <span className="total-label">Bill Amount</span>
                        <span className="total-colon">:</span>
                        <span className="total-value">{totalAmt}</span>
                    </div>
                    <div className="totals-row">
                        <span className="total-label">In words</span>
                        <span className="total-colon">:</span>
                        <span className="total-value words">Rupees {numberToWords(totalAmt)} Only</span>
                    </div>
                </div>
                <div className="footer-center">
                    <div className="bundles-row">
                        <span>NUM OF BUNDLES :</span>
                        <span>{bill.numOfBundles || 1}</span>
                    </div>
                    <div className="gst-box">
                        <span className="gst-label">TOTAL GST</span>
                        <span className="gst-value">{totalGst.toFixed(0)}</span>
                    </div>
                </div>
                <div className="footer-right">
                    <div className="summary-row"><span>Product Amt</span><span>{productAmt}</span></div>
                    <div className="summary-row"><span>Discount</span><span>{discount}</span></div>
                    <div className="summary-row"><span>Taxable Amt</span><span>{taxableAmt}</span></div>
                    <div className="summary-row gst-rate"><span>CGST @ {cgstRate}%</span><span>{cgstAmt.toFixed(2)}</span></div>
                    <div className="summary-row gst-rate"><span>SGST @ {sgstRate}%</span><span>{sgstAmt.toFixed(2)}</span></div>
                    <div className="summary-row"><span>Round Off</span><span>{roundOff.toFixed(2)}</span></div>
                    <div className="summary-row total-final"><span>Total Amt</span><span>{totalAmt}</span></div>
                </div>
            </div>

            {/* FOOTER - Terms, Bank Details, Signature */}
            <div className="terms-bank-section">
                <div className="terms-section">
                    <div className="terms-title">Terms And Conditions</div>
                    <div className="terms-text">
                        <div>Subject to Tirupur Jurisdiction.</div>
                        <div>Payment by Cheque/DD only, payable at Tirupur.</div>
                        <div>{settings?.billTerms || ''}</div>
                    </div>
                    <div className="bank-details">
                        <div className="bank-title">Bank Details:</div>
                        <div>South Indian Bank, Account: {settings?.bank?.accountNumber || '0338073000002328'}</div>
                        <div>Branch: {settings?.bank?.branchName || 'Tirupur'}, IFSC: {settings?.bank?.ifscCode || 'SIBL0000338'}</div>
                    </div>
                </div>
                <div className="signature-section">
                    <div className="certified-text">
                        <div>Certified that above particulars are true and correct</div>
                        <div className="company-signature">For SRI RAM FASHIONS</div>
                    </div>
                    <div className="signature-space"></div>
                </div>
            </div>
        </div>
    );
};

export default BillTemplate;
