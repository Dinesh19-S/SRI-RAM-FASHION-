import { useState } from 'react';
import { AlertTriangle, BellRing, Info, Percent, ShieldCheck, Star, ToggleLeft, ToggleRight } from 'lucide-react';

const typeOptions = [
    { key: 'info', label: 'Info', desc: 'General information', icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
    { key: 'offer', label: 'Offer', desc: 'Promotions & deals', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { key: 'alert', label: 'Alert', desc: 'Urgent alerts', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { key: 'update', label: 'Update', desc: 'Product/store updates', icon: BellRing, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { key: 'spotlight', label: 'Spotlight', desc: 'Feature a product', icon: Star, color: 'text-orange-600', bg: 'bg-orange-50' },
    { key: 'discount', label: 'Discount', desc: 'Discounts & coupons', icon: Percent, color: 'text-rose-600', bg: 'bg-rose-50' },
];

const mockProducts = [
    { id: 1, name: 'multi-core industrial cables', price: '₹4,350', mrp: '₹4,599', brand: 'TYCON', image: 'https://i.imgur.com/6Nby02l.png' },
];

const NotificationsPage = () => {
    const [selectedType, setSelectedType] = useState('spotlight');
    const [title, setTitle] = useState('DKSJKJBKSJVBSBDJKSBDSBDSBJSKS');
    const [message, setMessage] = useState('KJBBJKSBDBJKBFDKS KSDBKJSD');
    const [product] = useState(mockProducts[0]);
    const [audience, setAudience] = useState('Customers Only');
    const [sendEmail, setSendEmail] = useState(false);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 animate-fade-in">
            <div className="space-y-4">
                <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2">
                    ← Back to Notifications
                </button>
                <div className="space-y-1">
                    <p className="text-sm text-gray-500">Compose a new notification or email campaign for your customers</p>
                    <h1 className="text-2xl font-bold text-gray-900">Create Notification</h1>
                </div>

                <div className="bg-white border rounded-2xl shadow-sm p-5 space-y-5" style={{ borderColor: 'var(--border-soft)' }}>
                    <div>
                        <p className="text-sm font-semibold text-gray-800 mb-3">Notification Type</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {typeOptions.map((type) => {
                                const active = selectedType === type.key;
                                return (
                                    <button
                                        key={type.key}
                                        onClick={() => setSelectedType(type.key)}
                                        className={`w-full text-left rounded-xl border px-4 py-3 flex items-start gap-3 transition-all ${
                                            active ? 'border-orange-400 bg-orange-50/60 shadow-sm' : 'border-[var(--border-soft)] hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${active ? 'bg-orange-100 text-orange-700' : `${type.bg} ${type.color}`}`}>
                                            <type.icon size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{type.label}</p>
                                            <p className="text-xs text-gray-600">{type.desc}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="form-label">Title *</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="form-input"
                                placeholder="Give your notification a concise title"
                            />
                        </div>
                        <div>
                            <label className="form-label">Message *</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="form-input min-h-[120px]"
                                placeholder="Write the message to send"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="form-label">Select Product *</p>
                        <div className="form-input flex items-center gap-2 cursor-pointer">
                            <input className="bg-transparent w-full outline-none" readOnly value={product.name} />
                        </div>
                        <div className="border rounded-xl bg-[#fdf8f0] px-4 py-3 flex items-center gap-3" style={{ borderColor: 'var(--border-soft)' }}>
                            <div className="w-12 h-12 bg-white border rounded-lg flex items-center justify-center" style={{ borderColor: 'var(--border-soft)' }}>
                                <img src={product.image} alt={product.name} className="w-10 h-10 object-contain" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                                <p className="text-xs text-gray-600">{product.price} (MRP: {product.mrp})</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="form-label">Target Audience</p>
                        <select
                            value={audience}
                            onChange={(e) => setAudience(e.target.value)}
                            className="form-select"
                        >
                            <option>Customers Only</option>
                            <option>Suppliers</option>
                            <option>All Users</option>
                        </select>
                    </div>

                    <div className="rounded-xl border" style={{ borderColor: 'var(--border-soft)' }}>
                        <div className="flex items-center justify-between px-4 py-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Send email campaign</p>
                                <p className="text-xs text-gray-600">Emails will be sent to customers</p>
                            </div>
                            <button
                                onClick={() => setSendEmail((v) => !v)}
                                className="flex items-center gap-2 text-sm font-semibold text-gray-800"
                            >
                                {sendEmail ? <ToggleRight size={28} className="text-amber-500" /> : <ToggleLeft size={28} className="text-gray-400" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button className="btn btn-secondary">Cancel</button>
                        <button className="btn btn-primary flex items-center gap-2">
                            <Star size={16} />
                            Create Notification
                        </button>
                    </div>
                </div>
            </div>

            <aside className="bg-white border rounded-2xl shadow-sm p-4 h-fit" style={{ borderColor: 'var(--border-soft)' }}>
                <div className="text-sm font-semibold text-gray-700 mb-3">Live Preview</div>
                <div className="bg-[#1c120c] text-white rounded-xl overflow-hidden">
                    <div className="px-4 py-3 flex items-center gap-2 border-b border-[#2d1c13]">
                        <span className="text-amber-400">⚡</span>
                        <span className="font-semibold text-lg">ElectroMart</span>
                    </div>
                    <div className="bg-white text-gray-900">
                        <div className="px-4 py-3">
                            <p className="text-base font-bold leading-snug">{title}</p>
                            <p className="text-xs text-gray-600 mt-1">{message}</p>
                        </div>
                        <div className="px-4">
                            <div className="bg-[#fdf8f0] border border-[#f3e5d8] rounded-xl overflow-hidden">
                                <div className="bg-white p-3 flex justify-center">
                                    <img src={product.image} alt={product.name} className="w-24 h-24 object-contain" />
                                </div>
                                <div className="px-3 py-3 space-y-1">
                                    <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">{product.brand}</p>
                                    <div className="flex items-center gap-2 text-lg font-bold">
                                        <span>{product.price}</span>
                                        <span className="text-gray-400 line-through text-sm">{product.mrp}</span>
                                    </div>
                                    <button className="w-full mt-2 bg-amber-500 text-white font-semibold py-2 rounded-lg hover:bg-amber-600 transition">
                                        🛒 Shop Now
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="px-4 py-3 text-center text-xs text-gray-500 border-t border-[#f3e5d8]">
                            <span className="text-amber-500 font-semibold">⚡ ElectroMart</span> Premium Electrical Products
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
};

export default NotificationsPage;
