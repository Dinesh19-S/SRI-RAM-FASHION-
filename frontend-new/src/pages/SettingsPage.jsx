import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings, updateSettings } from '../store/slices/settingsSlice';
import { Building, User, Bell, Shield, Save, Check } from 'lucide-react';

const SettingsPage = () => {
    const dispatch = useDispatch();
    const { data: settings, isLoading } = useSelector((state) => state.settings);
    const [activeTab, setActiveTab] = useState('company');
    const [formData, setFormData] = useState({
        company: {
            name: '',
            address: '',
            gstin: '',
            state: 'Tamil Nadu',
            stateCode: '33',
            invoicePrefix: 'INV',
            voucherPrefix: 'V'
        },
        profile: { name: '', email: '', phone: '' },
        notifications: { emailNotifications: true, smsNotifications: false },
        security: { twoFactorAuth: false }
    });
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => { dispatch(fetchSettings()); }, [dispatch]);
    useEffect(() => { if (settings) setFormData(prev => ({ ...prev, ...settings })); }, [settings]);

    const tabs = [
        { id: 'company', label: 'Company', icon: Building },
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield }
    ];

    const handleSave = async () => {
        await dispatch(updateSettings(formData));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    return (
        <div className="settings-page">
            {/* Header */}
            <div className="settings-header">
                <h1 className="settings-title">Settings</h1>
                <p className="settings-subtitle">Manage your account and preferences</p>
            </div>

            {/* Settings Layout */}
            <div className="settings-layout">
                {/* Sidebar Navigation */}
                <div className="settings-nav">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <Icon size={18} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Main Content */}
                <div className="settings-main">
                    {/* Company Settings Tab */}
                    {activeTab === 'company' && (
                        <div className="settings-card">
                            <h2 className="settings-card-title">Company Settings</h2>

                            <div className="settings-form">
                                <div className="form-field">
                                    <label className="field-label">Company Name</label>
                                    <input
                                        type="text"
                                        className="field-input"
                                        value={formData.company?.name || ''}
                                        onChange={(e) => setFormData({ ...formData, company: { ...formData.company, name: e.target.value } })}
                                        placeholder="Enter company name"
                                    />
                                </div>

                                <div className="form-field">
                                    <label className="field-label">Address</label>
                                    <textarea
                                        className="field-textarea"
                                        value={formData.company?.address || ''}
                                        onChange={(e) => setFormData({ ...formData, company: { ...formData.company, address: e.target.value } })}
                                        placeholder="Enter full address"
                                        rows={2}
                                    />
                                </div>

                                <div className="form-row-3">
                                    <div className="form-field">
                                        <label className="field-label">GSTIN</label>
                                        <input
                                            type="text"
                                            className="field-input"
                                            value={formData.company?.gstin || ''}
                                            onChange={(e) => setFormData({ ...formData, company: { ...formData.company, gstin: e.target.value } })}
                                            placeholder="Enter GSTIN"
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label className="field-label">State</label>
                                        <input
                                            type="text"
                                            className="field-input"
                                            value={formData.company?.state || ''}
                                            onChange={(e) => setFormData({ ...formData, company: { ...formData.company, state: e.target.value } })}
                                            placeholder="Enter state"
                                        />
                                    </div>
                                    <div className="form-field form-field-small">
                                        <label className="field-label">Code</label>
                                        <input
                                            type="text"
                                            className="field-input"
                                            value={formData.company?.stateCode || ''}
                                            onChange={(e) => setFormData({ ...formData, company: { ...formData.company, stateCode: e.target.value } })}
                                            placeholder="33"
                                        />
                                    </div>
                                </div>

                                <div className="form-row-2">
                                    <div className="form-field">
                                        <label className="field-label">Invoice Prefix</label>
                                        <input
                                            type="text"
                                            className="field-input"
                                            value={formData.company?.invoicePrefix || ''}
                                            onChange={(e) => setFormData({ ...formData, company: { ...formData.company, invoicePrefix: e.target.value } })}
                                            placeholder="INV"
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label className="field-label">Voucher Prefix</label>
                                        <input
                                            type="text"
                                            className="field-input"
                                            value={formData.company?.voucherPrefix || ''}
                                            onChange={(e) => setFormData({ ...formData, company: { ...formData.company, voucherPrefix: e.target.value } })}
                                            placeholder="V"
                                        />
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button
                                        className={`save-btn ${saveSuccess ? 'success' : ''}`}
                                        onClick={handleSave}
                                        disabled={isLoading}
                                    >
                                        {saveSuccess ? (
                                            <>
                                                <Check size={16} />
                                                Saved!
                                            </>
                                        ) : (
                                            <>
                                                <Save size={16} />
                                                {isLoading ? 'Saving...' : 'Save Changes'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="settings-card">
                            <h2 className="settings-card-title">Profile Settings</h2>

                            <div className="settings-form">
                                <div className="form-field">
                                    <label className="field-label">Full Name</label>
                                    <input
                                        type="text"
                                        className="field-input"
                                        value={formData.profile?.name || ''}
                                        onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, name: e.target.value } })}
                                        placeholder="Enter your full name"
                                    />
                                </div>

                                <div className="form-row-2">
                                    <div className="form-field">
                                        <label className="field-label">Email Address</label>
                                        <input
                                            type="email"
                                            className="field-input"
                                            value={formData.profile?.email || ''}
                                            onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, email: e.target.value } })}
                                            placeholder="Enter email"
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label className="field-label">Phone Number</label>
                                        <input
                                            type="text"
                                            className="field-input"
                                            value={formData.profile?.phone || ''}
                                            onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, phone: e.target.value } })}
                                            placeholder="Enter phone number"
                                        />
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button
                                        className={`save-btn ${saveSuccess ? 'success' : ''}`}
                                        onClick={handleSave}
                                        disabled={isLoading}
                                    >
                                        {saveSuccess ? (
                                            <>
                                                <Check size={16} />
                                                Saved!
                                            </>
                                        ) : (
                                            <>
                                                <Save size={16} />
                                                {isLoading ? 'Saving...' : 'Save Changes'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="settings-card">
                            <h2 className="settings-card-title">Notification Preferences</h2>

                            <div className="settings-form">
                                <div className="toggle-option">
                                    <div className="toggle-info">
                                        <span className="toggle-label">Email Notifications</span>
                                        <span className="toggle-description">Receive notifications via email</span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={formData.notifications?.emailNotifications ?? true}
                                            onChange={(e) => setFormData({ ...formData, notifications: { ...formData.notifications, emailNotifications: e.target.checked } })}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>

                                <div className="toggle-option">
                                    <div className="toggle-info">
                                        <span className="toggle-label">SMS Notifications</span>
                                        <span className="toggle-description">Receive notifications via SMS</span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={formData.notifications?.smsNotifications ?? false}
                                            onChange={(e) => setFormData({ ...formData, notifications: { ...formData.notifications, smsNotifications: e.target.checked } })}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>

                                <div className="form-actions">
                                    <button
                                        className={`save-btn ${saveSuccess ? 'success' : ''}`}
                                        onClick={handleSave}
                                        disabled={isLoading}
                                    >
                                        {saveSuccess ? (
                                            <>
                                                <Check size={16} />
                                                Saved!
                                            </>
                                        ) : (
                                            <>
                                                <Save size={16} />
                                                {isLoading ? 'Saving...' : 'Save Changes'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="settings-card">
                            <h2 className="settings-card-title">Security Settings</h2>

                            <div className="settings-form">
                                <div className="toggle-option">
                                    <div className="toggle-info">
                                        <span className="toggle-label">Two-Factor Authentication</span>
                                        <span className="toggle-description">Add an extra layer of security to your account</span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={formData.security?.twoFactorAuth ?? false}
                                            onChange={(e) => setFormData({ ...formData, security: { ...formData.security, twoFactorAuth: e.target.checked } })}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>

                                <div className="form-actions">
                                    <button
                                        className={`save-btn ${saveSuccess ? 'success' : ''}`}
                                        onClick={handleSave}
                                        disabled={isLoading}
                                    >
                                        {saveSuccess ? (
                                            <>
                                                <Check size={16} />
                                                Saved!
                                            </>
                                        ) : (
                                            <>
                                                <Save size={16} />
                                                {isLoading ? 'Saving...' : 'Save Changes'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
