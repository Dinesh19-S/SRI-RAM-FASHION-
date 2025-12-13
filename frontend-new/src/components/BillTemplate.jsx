import './BillTemplate.css';

// Convert number to words in Indian format
const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num === 0) return 'Zero';
    if (num < 0) return 'Minus ' + numberToWords(-num);

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
        return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Get customizable labels from settings with defaults
    const labels = settings?.billTemplate?.labels || {};
    const columns = settings?.billTemplate?.columns || {};
    const sections = settings?.billTemplate?.sections || {};
    const itemRowCount = settings?.billTemplate?.itemRowCount || 15;

    // Helper to get label with default
    const getLabel = (key, defaultValue) => labels[key] || defaultValue;

    // Helper to check column visibility
    const showColumn = (key) => columns[key] !== false;

    // Helper to check section visibility
    const showSection = (key) => sections[key] !== false;

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

    // Generate empty rows for the table
    const emptyRowsCount = Math.max(0, itemRowCount - (bill.items?.length || 0));
    const emptyRows = Array(emptyRowsCount).fill(null);

    return (
        <div className={`bill-template ${forPrint ? 'for-print' : ''}`} id="bill-template">
            {/* Header */}
            <div className="bill-header">
                <div className="company-name">{settings?.company?.name || 'SRI RAM FASHIONS'}</div>
                <div className="gstin">GSTIN: {settings?.company?.gstin || '33AZRPM4425F2ZA'}</div>
            </div>

            {/* Address and Invoice Info */}
            <div className="bill-info-section">
                <div className="address-section">
                    <div className="address-line">OFF : {settings?.company?.address1 || '61C9, Anupparpalayam Puthur, Tirupur. 641652'}</div>
                    <div className="address-line">OFF : {settings?.company?.address2 || '81 K, Madurai Raod, SankerNager, Tirunelveli Dt. 627357'}</div>
                    <div className="address-line">State :{settings?.company?.state || 'Tamilnadu'}      State Code : {settings?.company?.stateCode || '33'}</div>
                    <div className="address-line">E-Mail:{settings?.company?.email || 'sriramfashionstrp@gmail.com'} Mob:{settings?.company?.phone || '9080573831'} {settings?.company?.phone2 || '9442807770'}</div>
                </div>
                <div className="invoice-section">
                    <div className="invoice-row"><span className="invoice-label">{getLabel('invoiceNumber', 'INVOICE NUMBER')}</span><span className="invoice-colon">:</span><span className="invoice-value">{bill.billNumber}</span></div>
                    <div className="invoice-row"><span className="invoice-label">{getLabel('invoiceDate', 'INVOICE DATE')}</span><span className="invoice-colon">:</span><span className="invoice-value">{formatDate(bill.date || bill.createdAt)}</span></div>
                    {showSection('fromToDate') && (
                        <>
                            <div className="invoice-row"><span className="invoice-label">{getLabel('from', 'FROM')}</span><span className="invoice-colon">:</span><span className="invoice-value">{bill.fromDate ? formatDate(bill.fromDate) : ''}</span></div>
                            <div className="invoice-row"><span className="invoice-label">{getLabel('to', 'TO')}</span><span className="invoice-colon">:</span><span className="invoice-value">{bill.toDate ? formatDate(bill.toDate) : ''}</span></div>
                        </>
                    )}
                </div>
            </div>

            {/* Buyer Section */}
            <div className="buyer-section">
                <div className="buyer-left">
                    {showSection('consignerCopy') && <div className="consigner-copy">Consigner Copy</div>}
                    <div className="buyer-row">
                        <span className="buyer-label">{getLabel('buyer', 'BUYER')}:</span>
                        <span className="buyer-value">{bill.customer?.name || ''}</span>
                    </div>
                </div>
                <div className="buyer-center">
                    <div className="tax-invoice-title">TAX INVOICE</div>
                    <div className="buyer-detail"><span>{getLabel('gstin', 'GSTIN')}</span><span>: {bill.customer?.gstin || ''}</span></div>
                    <div className="buyer-detail"><span>{getLabel('state', 'STATE')}</span><span>: {bill.customer?.state || 'Tamilnadu'}</span></div>
                    {showSection('transport') && (
                        <div className="buyer-detail"><span>{getLabel('transport', 'TRANSPORT')} :</span><span>{bill.transport || ''}</span></div>
                    )}
                </div>
                <div className="buyer-right">
                    <div className="buyer-right-row"><span className="buyer-right-label">{getLabel('mob', 'MOB')}</span><span className="buyer-right-colon">:</span></div>
                    <div className="buyer-phone">{bill.customer?.phone || ''}</div>
                    <div className="buyer-right-row"><span className="buyer-right-label">{getLabel('code', 'CODE')}</span><span className="buyer-right-colon">:</span><span className="buyer-right-value">{bill.customer?.stateCode || '33'}</span></div>
                </div>
            </div>

            {/* Items Table */}
            <div className="items-table-container">
                <table className="items-table">
                    <thead>
                        <tr>
                            {showColumn('sno') && <th className="sno-col">{getLabel('sno', 'S.No')}</th>}
                            {showColumn('product') && <th className="product-col">{getLabel('product', 'Product')}</th>}
                            {showColumn('hsnCode') && <th className="hsn-col">{getLabel('hsnCode', 'HSN CODE').split(' ').map((w, i) => <span key={i}>{w}<br /></span>)}</th>}
                            {showColumn('sizesPieces') && <th className="sizes-col">{getLabel('sizesPieces', 'Sizes/Pieces')}</th>}
                            {showColumn('ratePerPiece') && <th className="rate-piece-col">{getLabel('ratePerPiece', 'Rate Per Piece').split(' ').slice(0, 2).join(' ')}<br />{getLabel('ratePerPiece', 'Rate Per Piece').split(' ').slice(2).join(' ')}</th>}
                            {showColumn('pcsInPack') && <th className="pcs-pack-col">{getLabel('pcsInPack', 'Pcs in Pack').split(' ').slice(0, 2).join(' ')}<br />{getLabel('pcsInPack', 'Pcs in Pack').split(' ').slice(2).join(' ')}</th>}
                            {showColumn('ratePerPack') && <th className="rate-pack-col">{getLabel('ratePerPack', 'Rate Per Pack').split(' ').slice(0, 2).join(' ')}<br />{getLabel('ratePerPack', 'Rate Per Pack').split(' ').slice(2).join(' ')}</th>}
                            {showColumn('noOfPacks') && <th className="packs-col">{getLabel('noOfPacks', 'No Of Packs').split(' ').slice(0, 2).join(' ')}<br />{getLabel('noOfPacks', 'No Of Packs').split(' ').slice(2).join(' ')}</th>}
                            {showColumn('amount') && <th className="amount-col">{getLabel('amount', 'Amount Rs').split(' ')[0]}<br />{getLabel('amount', 'Amount Rs').split(' ').slice(1).join(' ')}</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {bill.items?.map((item, index) => (
                            <tr key={index}>
                                {showColumn('sno') && <td className="sno-col">{index + 1}</td>}
                                {showColumn('product') && <td className="product-col">{item.productName || item.name || ''}</td>}
                                {showColumn('hsnCode') && <td className="hsn-col">{item.hsnCode || item.hsn || ''}</td>}
                                {showColumn('sizesPieces') && <td className="sizes-col">{item.sizesOrPieces || ''}</td>}
                                {showColumn('ratePerPiece') && <td className="rate-piece-col">{item.ratePerPiece || item.price || 0}</td>}
                                {showColumn('pcsInPack') && <td className="pcs-pack-col">{item.pcsInPack || ''}</td>}
                                {showColumn('ratePerPack') && <td className="rate-pack-col">{item.ratePerPack || ''}</td>}
                                {showColumn('noOfPacks') && <td className="packs-col">{item.noOfPacks || item.quantity || 0}</td>}
                                {showColumn('amount') && <td className="amount-col">{item.total || (item.price * item.quantity) || 0}</td>}
                            </tr>
                        ))}
                        {emptyRows.map((_, index) => (
                            <tr key={`empty-${index}`}>
                                {showColumn('sno') && <td className="sno-col"></td>}
                                {showColumn('product') && <td className="product-col"></td>}
                                {showColumn('hsnCode') && <td className="hsn-col"></td>}
                                {showColumn('sizesPieces') && <td className="sizes-col"></td>}
                                {showColumn('ratePerPiece') && <td className="rate-piece-col"></td>}
                                {showColumn('pcsInPack') && <td className="pcs-pack-col"></td>}
                                {showColumn('ratePerPack') && <td className="rate-pack-col"></td>}
                                {showColumn('noOfPacks') && <td className="packs-col"></td>}
                                {showColumn('amount') && <td className="amount-col"></td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer Section */}
            <div className="bill-footer-section">
                <div className="footer-left">
                    <div className="totals-row">
                        <span className="total-label">{getLabel('totalPacks', 'Total Packs')}</span>
                        <span className="total-colon">:</span>
                        <span className="total-value">{totalPacks}</span>
                    </div>
                    <div className="totals-row">
                        <span className="total-label">{getLabel('billAmount', 'Bill Amount')}</span>
                        <span className="total-colon">:</span>
                        <span className="total-value">{totalAmt}</span>
                    </div>
                    <div className="totals-row">
                        <span className="total-label">{getLabel('inWords', 'In words')}</span>
                        <span className="total-colon">:</span>
                        <span className="total-value words">{bill.amountInWords || (numberToWords(totalAmt) + ' Rupees Only')}</span>
                    </div>
                </div>
                <div className="footer-center">
                    {showSection('numOfBundles') && (
                        <div className="bundles-row">
                            <span>{getLabel('numOfBundles', 'NUM OF BUNDLES')} :</span>
                            <span>{bill.numOfBundles || 1}</span>
                        </div>
                    )}
                    <div className="gst-box">
                        <span className="gst-label">{getLabel('totalGst', 'TOTAL GST')}</span>
                        <span className="gst-value">{totalGst.toFixed(0)}</span>
                    </div>
                </div>
                <div className="footer-right">
                    <div className="summary-row"><span>{getLabel('productAmt', 'Product Amt')}</span><span>{productAmt}</span></div>
                    <div className="summary-row"><span>{getLabel('discount', 'Discount')}</span><span>{discount}</span></div>
                    <div className="summary-row"><span>{getLabel('taxableAmt', 'Taxable Amt')}</span><span>{taxableAmt}</span></div>
                    <div className="summary-row gst-rate"><span>CGST @ {cgstRate} %</span><span>{cgstAmt.toFixed(0)}</span></div>
                    <div className="summary-row gst-rate"><span>SGST @ {sgstRate} %</span><span>{sgstAmt.toFixed(0)}</span></div>
                    <div className="summary-row"><span>{getLabel('roundOff', 'Round Off')}</span><span>{roundOff.toFixed(2)}</span></div>
                    <div className="summary-row total-final"><span>{getLabel('totalAmt', 'Total Amt')}</span><span>{totalAmt}</span></div>
                </div>
            </div>

            {/* Terms and Bank Details */}
            <div className="terms-bank-section">
                {showSection('termsConditions') && (
                    <div className="terms-section">
                        <div className="terms-title">Terms And Condition</div>
                        <div className="terms-text">{settings?.billTerms?.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>
                    </div>
                )}
                {showSection('bankDetails') && (
                    <div className="bank-section">
                        <div className="bank-row"><span className="bank-label">{getLabel('accName', 'ACC NAME')} :</span><span>{settings?.bank?.accountHolderName || 'SRI RAM FASHIONS'}</span></div>
                        <div className="bank-row"><span className="bank-label">{getLabel('bank', 'BANK')}</span><span>: {settings?.bank?.bankName || 'SOUTH INDIAN BANK'}</span></div>
                        <div className="bank-row"><span className="bank-label">{getLabel('accNum', 'ACC NUM')} :</span><span>{settings?.bank?.accountNumber || '0338073000002328'}</span></div>
                        <div className="bank-row"><span className="bank-label">{getLabel('branch', 'BRANCH')}</span><span>: {settings?.bank?.branchName || 'TIRUPUR'}      {getLabel('ifsc', 'IFSC')} : {settings?.bank?.ifscCode || 'SIBL0000338'}</span></div>
                    </div>
                )}
                <div className="signature-section">
                    <div className="certified-text">{settings?.billFooter?.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>
                </div>
            </div>
        </div>
    );
};

export default BillTemplate;
