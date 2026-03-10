import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, categoriesAPI, productsAPI, emailAPI } from '../services/api';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { formatDate } from '../utils/dateUtils';
import { useToast } from '../components/common';
import { Loader2, Mail, Clock } from 'lucide-react';

const DashboardPage = () => {
    const toast = useToast();
    const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalCustomers: 0 });
    const [recentBills, setRecentBills] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [orderStatusCounts, setOrderStatusCounts] = useState({ pending: 0, confirmed: 0, delivered: 0, cancelled: 0 });
    const [categoryData, setCategoryData] = useState([]);
    const [productCount, setProductCount] = useState(0);
    const [lowStockAlerts, setLowStockAlerts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sendingSummary, setSendingSummary] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, billsRes, chartRes, alertsRes, categoriesRes, productsRes] = await Promise.all([
                dashboardAPI.getStats(),
                dashboardAPI.getRecentBills(6),
                dashboardAPI.getRevenueChart('month'),
                dashboardAPI.getLowStockAlerts(),
                categoriesAPI.getAll(),
                productsAPI.getAll({ limit: 1000 })
            ]);

            const statsData = statsRes.data.data || {};
            setStats(statsData);
            setRecentBills(billsRes.data.data || []);
            setRevenueData((chartRes.data.data || []).map(d => ({ date: d._id, revenue: d.revenue, orders: d.orders || 0 })));
            setLowStockAlerts(alertsRes.data.data || []);

            // order statuses from bills
            const statusCounts = (billsRes.data.data || []).reduce(
                (acc, b) => {
                    const status = (b.status || b.paymentStatus || '').toLowerCase();
                    if (status.includes('pending')) acc.pending += 1;
                    else if (status.includes('confirm')) acc.confirmed += 1;
                    else if (status.includes('deliver')) acc.delivered += 1;
                    else if (status.includes('cancel')) acc.cancelled += 1;
                    return acc;
                },
                { pending: 0, confirmed: 0, delivered: 0, cancelled: 0 }
            );
            setOrderStatusCounts(statusCounts);

            // derive categories from inventory (products) synced with categories API
            const products = productsRes.data?.data || productsRes.data?.products || productsRes.data || [];
            const apiCategories = categoriesRes.data?.data || categoriesRes.data?.categories || categoriesRes.data || [];
            setProductCount(products.length);
            setAllProducts(products);

            // Use actual category IDs from API (same as Inventory page)
            const catList = apiCategories.map(cat => {
                const catProducts = products.filter(p => {
                    const pCatId = p.category?._id || p.category;
                    return pCatId === cat._id;
                });
                return {
                    name: cat.name,
                    value: catProducts.length,
                    units: catProducts.reduce((sum, p) => sum + (p.stock || p.quantity || 0), 0)
                };
            });

            // Add uncategorized products if any
            const categorizedIds = new Set(apiCategories.map(c => c._id));
            const uncategorized = products.filter(p => {
                const pCatId = p.category?._id || p.category;
                return !categorizedIds.has(pCatId);
            });
            if (uncategorized.length > 0) {
                catList.push({
                    name: 'Uncategorized',
                    value: uncategorized.length,
                    units: uncategorized.reduce((sum, p) => sum + (p.stock || p.quantity || 0), 0)
                });
            }

            setCategories(catList.map((c) => ({ name: c.name })));
            setCategoryData(catList);
        } catch (error) {
            setStats({ totalRevenue: 0, totalOrders: 0, totalCustomers: 0 });
            setRecentBills([]);
            setRevenueData([]);
            setLowStockAlerts([]);
            setCategoryData([]);
            setOrderStatusCounts({ pending: 0, confirmed: 0, delivered: 0, cancelled: 0 });
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

    const handleSendSummary = async () => {
        try {
            setSendingSummary(true);
            await emailAPI.sendDailySummary();
            toast.success('Daily summary email sent');
        } catch (err) {
            toast.error('Failed to send summary');
        } finally {
            setSendingSummary(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#1f9b73', borderTopColor: 'transparent' }} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in" style={{ background: 'linear-gradient(180deg,#f6f9ff 0%, #eef3ff 100%)' }}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <div className="flex items-center gap-3">
                        <p className="text-sm text-gray-600">Here&apos;s what&apos;s happening with your store today.</p>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/80 border border-blue-100 rounded-full shadow-sm">
                            <Clock size={14} className="text-blue-500" />
                            <span className="text-xs font-semibold text-gray-700">
                                {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-xs text-gray-400">|</span>
                            <span className="text-xs font-bold text-blue-600">
                                {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleSendSummary}
                    disabled={sendingSummary}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-70"
                    style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}
                >
                    {sendingSummary ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                    {sendingSummary ? 'Sending...' : 'Email Daily Summary'}
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/95 border rounded-2xl p-4 shadow-md" style={{ borderColor: 'var(--border-soft)' }}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Revenue</p>
                    <div className="flex items-center justify-between mt-2">
                        <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                            This month
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{formatCurrency(stats.totalRevenue)}</p>
                </div>

                <div className="bg-white/95 border rounded-2xl p-4 shadow-md" style={{ borderColor: 'var(--border-soft)' }}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Orders</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">{orderStatusCounts.pending} pending</p>
                </div>

                <div className="bg-white/95 border rounded-2xl p-4 shadow-md" style={{ borderColor: 'var(--border-soft)' }}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Products</p>
                    <div className="flex items-center justify-between mt-2">
                        <p className="text-3xl font-bold text-gray-900">{productCount}</p>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{categories.length} categories</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Active in store</p>
                </div>

                <div className="bg-white/95 border rounded-2xl p-4 shadow-md" style={{ borderColor: 'var(--border-soft)' }}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customers</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCustomers || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">Registered users</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white/95 border rounded-2xl p-4 shadow-md lg:col-span-2" style={{ borderColor: 'var(--border-soft)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Last 6 months</span>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                            <YAxis stroke="#94a3b8" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                            <Line type="monotone" dataKey="orders" stroke="#60a5fa" strokeWidth={3} strokeDasharray="6 4" dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white/95 border rounded-2xl p-4 shadow-md" style={{ borderColor: 'var(--border-soft)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{lowStockAlerts.length} items</span>
                    </div>
                    {lowStockAlerts.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-10">No low stock items</p>
                    ) : (
                        <div className="space-y-2 max-h-56 overflow-auto pr-2">
                            {lowStockAlerts.map((item) => (
                                <div key={item._id} className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                                        <p className="text-xs text-gray-600">Stock {item.stock} / Min {item.lowStockThreshold}</p>
                                    </div>
                                    <span className="badge badge-warning">{item.stock}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white/95 border rounded-2xl p-4 shadow-md flex flex-col" style={{ borderColor: 'var(--border-soft)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">Products</h3>
                        <span className="text-xs text-gray-500">{allProducts.length} items</span>
                    </div>
                    <div className="flex-1 flex flex-col gap-2.5 overflow-auto max-h-72 pr-1">
                        {allProducts.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">No products in inventory</p>
                        ) : (
                            allProducts.map((p, idx) => {
                                const maxStock = Math.max(...allProducts.map(pr => pr.stock || 0), 1);
                                const PRODUCT_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#a855f7'];
                                const stock = p.stock || 0;
                                return (
                                    <div key={p._id || idx} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PRODUCT_COLORS[idx % PRODUCT_COLORS.length] }} />
                                                <span className="font-semibold truncate" style={{ maxWidth: '140px' }}>{p.name}</span>
                                            </div>
                                            <span className="font-bold text-gray-900">{stock.toLocaleString()} <span className="font-normal text-gray-500 text-xs">units</span></span>
                                        </div>
                                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${Math.min(100, (stock / maxStock) * 100)}%`,
                                                    backgroundColor: PRODUCT_COLORS[idx % PRODUCT_COLORS.length]
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="bg-white/95 border rounded-2xl p-4 shadow-md lg:col-span-2" style={{ borderColor: 'var(--border-soft)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                        <Link to="/dashboard/billing" className="text-sm font-semibold text-indigo-600 hover:underline">View All →</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-500">
                                    <th className="py-2 text-left font-semibold">Order</th>
                                    <th className="py-2 text-left font-semibold">Customer</th>
                                    <th className="py-2 text-left font-semibold">Amount</th>
                                    <th className="py-2 text-left font-semibold">Status</th>
                                    <th className="py-2 text-left font-semibold">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentBills.length === 0 ? (
                                    <tr><td colSpan="5" className="py-6 text-center text-gray-500">No recent orders</td></tr>
                                ) : (
                                    recentBills.map((bill) => (
                                        <tr key={bill._id} className="border-t" style={{ borderColor: 'var(--border-soft)' }}>
                                            <td className="py-2 font-semibold text-gray-900">{bill.billNumber}</td>
                                            <td className="py-2 text-gray-800">{bill.customer?.name || '-'}</td>
                                            <td className="py-2 font-semibold text-gray-900">{formatCurrency(bill.grandTotal)}</td>
                                            <td className="py-2">
                                                <span className={`badge ${bill.paymentStatus === 'paid' ? 'badge-success' : bill.paymentStatus === 'cancelled' ? 'badge-error' : 'badge-warning'}`}>
                                                    {bill.paymentStatus || 'pending'}
                                                </span>
                                            </td>
                                            <td className="py-2 text-gray-700">{formatDate(bill.date || bill.createdAt)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default DashboardPage;
