import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings, updateSettings } from '../store/slices/settingsSlice';
import { Building, CreditCard, Percent, FileText, Save } from 'lucide-react';
import BillTemplateDesigner from '../components/BillTemplateDesigner';

const SettingsPage = () => {
    const dispatch = useDispatch();
    const { data: settings, isLoading } = useSelector((state) => state.settings);
    const [activeTab, setActiveTab] = useState('company');
    const [formData, setFormData] = useState({
        company: { name: 'Sri Ram Fashions', address: '123 Main Street', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001', phone: '+91 98765 43210', email: 'info@sriramfashions.com', gstin: '33AAAAA0000A1Z5' },
        bank: { bankName: '', accountNumber: '', ifscCode: '', accountHolderName: '', upiId: '' },
        tax: { cgstRate: 9, sgstRate: 9, enableGst: true }
    });

    useEffect(() => { dispatch(fetchSettings()); }, [dispatch]);
    useEffect(() => { if (settings) setFormData(settings); }, [settings]);

    const tabs = [
        { id: 'company', label: 'Company Info', icon: Building },
        { id: 'bank', label: 'Bank Details', icon: CreditCard },
        { id: 'tax', label: 'Tax Settings', icon: Percent },
        { id: 'template', label: 'Bill Template', icon: FileText }
    ];

    const handleSave = () => dispatch(updateSettings(formData));

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <button className="btn btn-primary" onClick={handleSave} disabled={isLoading}><Save size={18} />{isLoading ? 'Saving...' : 'Save Changes'}</button>
            </div>

            <div className="flex gap-6">
                <div className="w-56 shrink-0">
                    <nav className="space-y-1">
                        {tabs.map((tab) => (
                            <button key={tab.id} className={`nav-link w-full ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                                <tab.icon size={20} /><span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex-1 card">
                    {activeTab === 'company' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="form-label">Company Name</label><input className="form-input" value={formData.company?.name || ''} onChange={(e) => setFormData({ ...formData, company: { ...formData.company, name: e.target.value } })} /></div>
                                <div><label className="form-label">Phone</label><input className="form-input" value={formData.company?.phone || ''} onChange={(e) => setFormData({ ...formData, company: { ...formData.company, phone: e.target.value } })} /></div>
                                <div><label className="form-label">Email</label><input className="form-input" value={formData.company?.email || ''} onChange={(e) => setFormData({ ...formData, company: { ...formData.company, email: e.target.value } })} /></div>
                                <div><label className="form-label">GSTIN</label><input className="form-input" value={formData.company?.gstin || ''} onChange={(e) => setFormData({ ...formData, company: { ...formData.company, gstin: e.target.value } })} /></div>
                                <div className="col-span-2"><label className="form-label">Address</label><input className="form-input" value={formData.company?.address || ''} onChange={(e) => setFormData({ ...formData, company: { ...formData.company, address: e.target.value } })} /></div>
                                <div><label className="form-label">City</label><input className="form-input" value={formData.company?.city || ''} onChange={(e) => setFormData({ ...formData, company: { ...formData.company, city: e.target.value } })} /></div>
                                <div><label className="form-label">State</label><input className="form-input" value={formData.company?.state || ''} onChange={(e) => setFormData({ ...formData, company: { ...formData.company, state: e.target.value } })} /></div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bank' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Bank Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="form-label">Bank Name</label><input className="form-input" value={formData.bank?.bankName || ''} onChange={(e) => setFormData({ ...formData, bank: { ...formData.bank, bankName: e.target.value } })} /></div>
                                <div><label className="form-label">Account Number</label><input className="form-input" value={formData.bank?.accountNumber || ''} onChange={(e) => setFormData({ ...formData, bank: { ...formData.bank, accountNumber: e.target.value } })} /></div>
                                <div><label className="form-label">IFSC Code</label><input className="form-input" value={formData.bank?.ifscCode || ''} onChange={(e) => setFormData({ ...formData, bank: { ...formData.bank, ifscCode: e.target.value } })} /></div>
                                <div><label className="form-label">Account Holder</label><input className="form-input" value={formData.bank?.accountHolderName || ''} onChange={(e) => setFormData({ ...formData, bank: { ...formData.bank, accountHolderName: e.target.value } })} /></div>
                                <div><label className="form-label">UPI ID</label><input className="form-input" value={formData.bank?.upiId || ''} onChange={(e) => setFormData({ ...formData, bank: { ...formData.bank, upiId: e.target.value } })} /></div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tax' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Tax Settings</h3>
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                <input type="checkbox" id="enableGst" checked={formData.tax?.enableGst ?? true} onChange={(e) => setFormData({ ...formData, tax: { ...formData.tax, enableGst: e.target.checked } })} className="w-5 h-5 rounded" />
                                <label htmlFor="enableGst" className="font-medium text-gray-900">Enable GST on bills</label>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="form-label">CGST Rate (%)</label><input type="number" className="form-input" value={formData.tax?.cgstRate || 9} onChange={(e) => setFormData({ ...formData, tax: { ...formData.tax, cgstRate: Number(e.target.value) } })} /></div>
                                <div><label className="form-label">SGST Rate (%)</label><input type="number" className="form-input" value={formData.tax?.sgstRate || 9} onChange={(e) => setFormData({ ...formData, tax: { ...formData.tax, sgstRate: Number(e.target.value) } })} /></div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'template' && (
                        <BillTemplateDesigner formData={formData} setFormData={setFormData} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
