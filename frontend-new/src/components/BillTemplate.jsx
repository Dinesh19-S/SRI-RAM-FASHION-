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

    return (
        <div className={`bill-template-modern ${forPrint ? 'for-print' : ''}`} id="bill-template">
            <div className="modern-bill-container">
                {/* Left Form Section */}
                <div className="bill-form-section">
                    <div className="form-header">
                        <h2 className="form-title">Create Your First Invoice</h2>
                    </div>
                    
                    <div className="form-content">
                        {/* Customer Section */}
                        <div className="form-group-label">Customer Details</div>
                        <div className="form-row-2col">
                            <div className="form-field">
                                <label className="form-field-label">Customer Name</label>
                                <div className="form-display">{bill.customer?.name || 'Enter Name'}</div>
                            </div>
                            <div className="form-field">
                                <label className="form-field-label">Customer Phone Number</label>
                                <div className="form-display">{bill.customer?.phone || 'Enter Number'}</div>
                            </div>
                        </div>
                        <div className="form-note">Enter your number for getting the invoice on your phone</div>

                        {/* Items Table */}
                        <div className="form-items-section">
                            <table className="items-form-table">
                                <thead>
                                    <tr>
                                        <th className="col-num">#</th>
                                        <th className="col-item">ITEM</th>
                                        <th className="col-qty">QTY</th>
                                        <th className="col-price">PRICE</th>
                                        <th className="col-discount">DISCOUNT(%)</th>
                                        <th className="col-tax">TAX</th>
                                        <th className="col-total">TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bill.items && bill.items.length > 0 ? (
                                        bill.items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="col-num">{index + 1}</td>
                                                <td className="col-item">{item.productName || item.name || 'Sample Item'}</td>
                                                <td className="col-qty">{item.noOfPacks || item.quantity || 0}</td>
                                                <td className="col-price">{item.ratePerPack || item.price || 0}</td>
                                                <td className="col-discount">0</td>
                                                <td className="col-tax">NONE</td>
                                                <td className="col-total">{item.total || (item.price * (item.noOfPacks || item.quantity)) || 0}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td className="col-num">1</td>
                                            <td className="col-item">Sample Item</td>
                                            <td className="col-qty">10</td>
                                            <td className="col-price">100</td>
                                            <td className="col-discount"></td>
                                            <td className="col-tax">NONE</td>
                                            <td className="col-total">1000</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Add Row Button */}
                        <div className="form-add-row">+ Add Row</div>

                        {/* Received and Balance */}
                        <div className="form-received-section">
                            <div className="form-received-row">
                                <label>Received</label>
                                <input type="checkbox" />
                                <span>Fully Received</span>
                                <span className="received-value">0</span>
                            </div>
                            <div className="received-balance">Balance: {productAmt}</div>
                        </div>

                        {/* Total Amount */}
                        <div className="form-total-section">
                            <div className="form-total-amount">
                                <span className="total-label">Total Amount (₹)</span>
                                <span className="total-value">{productAmt}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Invoice Preview Section */}
                <div className="bill-preview-section">
                    {/* Invoice Header */}
                    <div className="invoice-header">
                        <h3 className="invoice-title">Tax Invoice</h3>
                    </div>

                    {/* Company Details with Logo */}
                    <div className="invoice-company-section">
                        <div className="company-logo-area">
                            {/* Logo placeholder */}
                            <div className="logo-placeholder">🏢</div>
                        </div>
                        <div className="company-info">
                            <h2 className="company-name">{settings?.company?.name || 'Company Name'}</h2>
                            <div className="company-address">{settings?.company?.address1 || 'Address Line 1'}</div>
                            <div className="company-address">{settings?.company?.address2 || 'Address Line 2'}</div>
                            <div className="company-contact">Phone: {settings?.company?.phone || '9080573831'}</div>
                            <div className="company-contact">Email: {settings?.company?.email || 'email@company.com'}</div>
                            <div className="company-gstin">GSTIN: {settings?.company?.gstin || '33AZRPM4425F2ZA'}</div>
                            <div className="company-state">State: {settings?.company?.state || 'Tamil Nadu'}</div>
                        </div>
                    </div>

                    {/* Invoice Details */}
                    <div className="invoice-details-section">
                        <div className="details-header">Invoice Details:</div>
                        <div className="details-row">
                            <span className="details-label">No.</span>
                            <span className="details-colon">:</span>
                            <span className="details-value">{bill.billNumber || '1'}</span>
                        </div>
                        <div className="details-row">
                            <span className="details-label">Date:</span>
                            <span className="details-colon">:</span>
                            <span className="details-value">{formatDate(bill.date || bill.createdAt)}</span>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="invoice-items-table">
                        <thead>
                            <tr>
                                <th className="inv-col-num">#</th>
                                <th className="inv-col-name">Item name</th>
                                <th className="inv-col-hsn">HSN/ SAC</th>
                                <th className="inv-col-qty">Quantity</th>
                                <th className="inv-col-price">Price/ Unit(₹)</th>
                                <th className="inv-col-amount">Amount(₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bill.items && bill.items.length > 0 ? (
                                bill.items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="inv-col-num">{index + 1}</td>
                                        <td className="inv-col-name">{item.productName || item.name || ''}</td>
                                        <td className="inv-col-hsn">{item.hsnCode || item.hsn || ''}</td>
                                        <td className="inv-col-qty">{item.noOfPacks || item.quantity || 0}</td>
                                        <td className="inv-col-price">₹ {item.ratePerPack || item.price || 0}</td>
                                        <td className="inv-col-amount">₹ {item.total || (item.price * (item.noOfPacks || item.quantity)) || 0}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td className="inv-col-num">1</td>
                                    <td className="inv-col-name">Sample Item</td>
                                    <td className="inv-col-hsn"></td>
                                    <td className="inv-col-qty">10</td>
                                    <td className="inv-col-price">₹ 100.00</td>
                                    <td className="inv-col-amount">₹ 1,000.00</td>
                                </tr>
                            )}
                            <tr className="total-row">
                                <td colSpan="4" className="total-label-cell">Total</td>
                                <td colSpan="2" className="total-amount-cell">₹ {productAmt.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Calculations Section */}
                    <div className="invoice-calculations">
                        <div className="calc-row">
                            <span className="calc-label">Sub Total</span>
                            <span className="calc-colon">:</span>
                            <span className="calc-value">₹ {productAmt.toFixed(2)}</span>
                        </div>
                        <div className="calc-row">
                            <span className="calc-label">Total</span>
                            <span className="calc-colon">:</span>
                            <span className="calc-value">₹ {productAmt.toFixed(2)}</span>
                        </div>
                        <div className="calc-row amount-in-words">
                            <span className="calc-label">Invoice Amount in Words:</span>
                            <span className="calc-value">{numberToWords(Math.round(productAmt))} Rupees only</span>
                        </div>
                    </div>

                    {/* Received and Balance */}
                    <div className="invoice-received-section">
                        <div className="received-row">
                            <span className="received-label">Received</span>
                            <span className="received-colon">:</span>
                            <span className="received-value">₹ 0.00</span>
                        </div>
                        <div className="received-row">
                            <span className="received-label">Balance</span>
                            <span className="received-colon">:</span>
                            <span className="received-value">₹ {productAmt.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Terms and Conditions */}
                    <div className="invoice-terms-section">
                        <div className="terms-title">Terms & Conditions:</div>
                        <div className="terms-text">Thanks for doing business with us!</div>
                    </div>

                    {/* Signature Section */}
                    <div className="invoice-signature-section">
                        <div className="signature-box">
                            <div className="signature-label">For {settings?.company?.name || 'Company Name'}:</div>
                            <div className="signature-space"></div>
                            <div className="signature-text">Authorized Signatory</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillTemplate;
