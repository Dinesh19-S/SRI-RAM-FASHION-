import { useMemo, useState } from 'react';
import { ChevronDown, FileText, MapPin, Package, ShoppingBag, Smartphone, User } from 'lucide-react';

const statusColors = {
    Pending: { bg: 'bg-amber-100', text: 'text-amber-700', pill: 'bg-amber-50 text-amber-700' },
    Confirmed: { bg: 'bg-emerald-100', text: 'text-emerald-700', pill: 'bg-emerald-50 text-emerald-700' },
    Delivered: { bg: 'bg-teal-100', text: 'text-teal-700', pill: 'bg-teal-50 text-teal-700' },
    Cancelled: { bg: 'bg-red-100', text: 'text-red-700', pill: 'bg-red-50 text-red-700' },
};

const mockOrders = [
    {
        id: '#ORD784149867472',
        customer: 'Dharani',
        date: '5 Mar 2026, 08:10 am',
        status: 'Delivered',
        payment: 'Online',
        total: '₹140',
        items: [
            { name: 'Modular Switch – 6A', qty: '1 × ₹90 = ₹90', thumb: 'https://i.imgur.com/g2o9z5p.png' },
        ],
        address: ['Dharani', '8825629104', 'Villarasampatti po, Nasiyanur Via, Erode', 'Erode, Tamil Nadu - 638107'],
    },
    {
        id: '#ORD780361071101',
        customer: 'Dharani',
        date: '5 Mar 2026, 08:03 am',
        status: 'Pending',
        payment: 'Online',
        total: '₹140',
        items: [
            { name: 'Modular Switch – 6A', qty: '1 × ₹90 = ₹90', thumb: 'https://i.imgur.com/g2o9z5p.png' },
        ],
        address: ['Dharani', '8825629104', 'Villarasampatti po, Nasiyanur Via, Erode', 'Erode, Tamil Nadu - 638107'],
    },
    {
        id: '#ORD778761152649',
        customer: 'Dharani',
        date: '5 Mar 2026, 08:01 am',
        status: 'Pending',
        payment: 'Online',
        total: '₹1,380',
        items: [{ name: 'Modular Switch – 6A', qty: 'Qty varies', thumb: 'https://i.imgur.com/g2o9z5p.png' }],
        address: ['Dharani', '8825629104', 'Villarasampatti po, Nasiyanur Via, Erode', 'Erode, Tamil Nadu - 638107'],
    },
];

const statusOptions = ['Pending', 'Confirmed', 'Delivered', 'Cancelled'];

const OrdersPage = () => {
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [orders, setOrders] = useState(mockOrders);

    const filtered = useMemo(() => {
        if (selectedStatus === 'All') return orders;
        return orders.filter((o) => o.status === selectedStatus);
    }, [orders, selectedStatus]);

    const setStatus = (id, status) => {
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    };

    const tabs = [
        { label: 'All', count: orders.length },
        { label: 'Pending', count: orders.filter((o) => o.status === 'Pending').length },
        { label: 'Confirmed', count: orders.filter((o) => o.status === 'Confirmed').length },
        { label: 'Delivered', count: orders.filter((o) => o.status === 'Delivered').length },
        { label: 'Cancelled', count: orders.filter((o) => o.status === 'Cancelled').length },
    ];

    return (
        <div className="space-y-5 animate-fade-in">
            <div>
                <p className="text-sm text-gray-500">Manage and track all customer orders</p>
                <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
            </div>

            <div className="flex flex-wrap gap-3">
                {tabs.map((tab) => (
                    <button
                        key={tab.label}
                        onClick={() => setSelectedStatus(tab.label)}
                        className={`px-4 py-2 rounded-full border text-sm font-semibold flex items-center gap-2 transition-all ${
                            selectedStatus === tab.label
                                ? 'bg-white text-gray-900 shadow-sm border-amber-200'
                                : 'bg-transparent text-gray-700 border-gray-200 hover:bg-white'
                        }`}
                    >
                        {tab.label}
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">{tab.count}</span>
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {filtered.map((order) => (
                    <div key={order.id} className="bg-white border rounded-2xl shadow-sm p-4 space-y-3" style={{ borderColor: 'var(--border-soft)' }}>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex items-center gap-3 text-sm text-gray-700">
                                <div className="flex items-center gap-2 font-semibold text-gray-900">
                                    <Package size={18} />
                                    {order.id}
                                </div>
                                <span className="text-gray-500">|</span>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <User size={16} />
                                    {order.customer}
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
                                <div>
                                    <p className="text-xs text-gray-500">ORDER DATE</p>
                                    <p className="font-semibold">{order.date}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">PAYMENT</p>
                                    <p className="font-semibold">{order.payment}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">TOTAL</p>
                                    <p className="text-lg font-bold text-gray-900">{order.total}</p>
                                </div>
                                <button className="btn btn-secondary flex items-center gap-2 text-sm px-3 py-2">
                                    <FileText size={16} />
                                    Invoice
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <div className="bg-[#fdf8f0] border border-[#f3e5d8] rounded-xl p-3 flex items-center gap-3">
                                <div className="w-16 h-16 rounded-xl bg-white border flex items-center justify-center">
                                    <img src={order.items[0].thumb} alt="" className="w-12 h-12 object-contain" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-900">{order.items[0].name}</p>
                                    <p className="text-xs text-gray-600">{order.items[0].qty}</p>
                                </div>
                            </div>

                            <div className="rounded-xl border" style={{ borderColor: 'var(--border-soft)' }}>
                                <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border-soft)' }}>
                                    <span className="text-sm font-semibold text-gray-800">Update Status</span>
                                    <div
                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.status].pill}`}
                                    >
                                        {order.status}
                                    </div>
                                </div>
                                <div className="relative">
                                    <select
                                        value={order.status}
                                        onChange={(e) => setStatus(order.id, e.target.value)}
                                        className="w-full appearance-none px-4 py-3 text-sm font-semibold text-gray-800 bg-white rounded-b-xl focus:outline-none"
                                        style={{ borderColor: 'transparent' }}
                                    >
                                        {statusOptions.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border rounded-xl p-3 flex gap-3 items-start" style={{ borderColor: 'var(--border-soft)' }}>
                            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
                                <MapPin size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Shipping Address</p>
                                <div className="text-sm text-gray-700 space-y-0.5">
                                    {order.address.map((line, idx) => (
                                        <p key={idx}>{line}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OrdersPage;
