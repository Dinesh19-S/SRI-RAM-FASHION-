const fs = require('fs');
const basePath = 'd:/SRI RAM FASHION/sri-ram-fashion-app/frontend-new/src/pages/';
const files = [
    'ItemsPage.jsx', 'BillingPage.jsx', 'SalesEntryPage.jsx', 'CustomerEntryPage.jsx',
    'SupplierEntryPage.jsx', 'PurchaseEntryPage.jsx', 'ReportsPage.jsx',
    'SalesReportsPage.jsx', 'PurchaseReportsPage.jsx', 'StockReportsPage.jsx',
    'AuditorSalesPage.jsx', 'AuditorPurchasePage.jsx', 'SalesPaymentsPage.jsx',
    'PurchasePaymentsPage.jsx', 'SettingsPage.jsx'
];

files.forEach(f => {
    let content = fs.readFileSync(basePath + f, 'utf8');

    // Remove framer-motion import
    content = content.replace(/import \{ motion(?:, AnimatePresence)? \} from 'framer-motion';\r?\n/g, '');

    // Replace motion.tagname with tagname (opening tags)
    content = content.replace(/<motion\.(\w+)/g, '<$1');

    // Replace closing motion tags
    content = content.replace(/<\/motion\.(\w+)>/g, '</$1>');

    // Remove animation props
    content = content.replace(/\s+initial=\{\{[^}]*\}\}/g, '');
    content = content.replace(/\s+animate=\{\{[^}]*\}\}/g, '');
    content = content.replace(/\s+whileHover=\{\{[^}]*\}\}/g, '');
    content = content.replace(/\s+whileTap=\{\{[^}]*\}\}/g, '');
    content = content.replace(/\s+variants=\{[^}]+\}/g, '');
    content = content.replace(/\s+custom=\{[^}]+\}/g, '');
    content = content.replace(/\s+initial="[^"]*"/g, '');
    content = content.replace(/\s+animate="[^"]*"/g, '');
    content = content.replace(/, transition: \{[^}]+\}/g, '');

    fs.writeFileSync(basePath + f, content);
    console.log('Updated:', f);
});

console.log('Done!');
