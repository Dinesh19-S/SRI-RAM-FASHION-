import { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import { BarChart3, TrendingUp, Download, Calendar, IndianRupee, ShoppingBag, Package } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ReportsPage = () => {
    const [dateRange, setDateRange] = useState({ start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] });
    const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, totalTax: 0 });
    const [salesTrend, setSalesTrend] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [categoryPerformance, setCategoryPerformance] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchReports(); }, [dateRange]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = { startDate: dateRange.start, endDate: dateRange.end };
            const [summaryRes, trendRes, productsRes, categoryRes, paymentsRes] = await Promise.all([
                reportsAPI.getSalesSummary(params),
                reportsAPI.getSalesTrend({ ...params, period: 'daily' }),
                reportsAPI.getTopProducts({ ...params, limit: 5 }),
                reportsAPI.getCategoryPerformance(params),
                reportsAPI.getPaymentMethods(params)
            ]);
            setStats(summaryRes.data.data || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, totalTax: 0 });
            setSalesTrend((trendRes.data.data || []).map(d => ({ date: d._id, revenue: d.revenue, orders: d.orders })));
            setTopProducts(productsRes.data.data || []);
            setCategoryPerformance(categoryRes.data.data || []);
            setPaymentMethods((paymentsRes.data.data || []).map(p => ({ name: p._id, value: p.count, total: p.total })));
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally { setLoading(false); }
    };

    const COLORS = ['#8b5cf6', '#10b981', '#06b6d4', '#f59e0b'];
    const formatCurrency = (a) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(a || 0);
    const totalPayments = paymentMethods.reduce((s, p) => s + p.value, 0);

    const statsCards = [
        { title: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: IndianRupee, color: 'purple' },
        { title: 'Total Orders', value: stats.totalOrders || 0, icon: ShoppingBag, color: 'blue' },
        { title: 'Avg Order Value', value: formatCurrency(stats.avgOrderValue), icon: TrendingUp, color: 'green' },
        { title: 'Total Tax Collected', value: formatCurrency(stats.totalTax), icon: Package, color: 'orange' }
    ];

    const colorClasses = {
        purple: 'bg-purple-100 text-purple-600',
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        orange: 'bg-orange-100 text-orange-600'
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                        <Calendar size={18} className="text-gray-400" />
                        <input type="date" className="bg-transparent border-none text-sm" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
                        <span className="text-gray-400">to</span>
                        <input type="date" className="bg-transparent border-none text-sm" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
                    </div>
                    <button className="btn btn-primary"><Download size={18} />Export</button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map((stat, i) => (
                    <div key={i} className="stats-card"><div className={`p-3 rounded-xl ${colorClasses[stat.color]}`}><stat.icon size={24} /></div><div><p className="text-sm text-gray-500">{stat.title}</p><p className="text-xl font-bold text-gray-900">{stat.value}</p></div></div>
                ))}
            </div>

            <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
                {salesTrend.length === 0 ? <p className="text-gray-500 text-center py-8">No sales data for this period</p> : (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={salesTrend}>
                            <defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="date" stroke="#9ca3af" /><YAxis stroke="#9ca3af" tickFormatter={(v) => `₹${v / 1000}K`} />
                            <Tooltip formatter={(v) => formatCurrency(v)} /><Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="url(#colorRev)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
                    {topProducts.length === 0 ? <p className="text-gray-500 text-center py-8">No product data</p> : (
                        <div className="space-y-4">
                            {topProducts.map((p, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-semibold">{i + 1}</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1"><span className="font-medium text-gray-900">{p._id}</span><span className="text-purple-600 font-semibold">{formatCurrency(p.totalRevenue)}</span></div>
                                        <div className="flex items-center gap-2"><div className="flex-1 h-2 bg-gray-100 rounded-full"><div className="h-2 bg-purple-500 rounded-full" style={{ width: `${topProducts[0]?.totalRevenue ? (p.totalRevenue / topProducts[0].totalRevenue) * 100 : 0}%` }} /></div><span className="text-xs text-gray-500">{p.totalQuantity} units</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
                    {categoryPerformance.length === 0 ? <p className="text-gray-500 text-center py-8">No category data</p> : (
                        <div className="space-y-4">
                            {categoryPerformance.map((c, i) => {
                                const total = categoryPerformance.reduce((s, cat) => s + (cat.revenue || 0), 0);
                                const percent = total > 0 ? Math.round((c.revenue / total) * 100) : 0;
                                return (
                                    <div key={i}>
                                        <div className="flex justify-between mb-1"><span className="font-medium text-gray-900">{c._id}</span><span className="text-gray-500">{formatCurrency(c.revenue)} ({percent}%)</span></div>
                                        <div className="h-3 bg-gray-100 rounded-full"><div className="h-3 bg-purple-500 rounded-full" style={{ width: `${percent}%` }} /></div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
                {paymentMethods.length === 0 ? <p className="text-gray-500 text-center py-8">No payment data</p> : (
                    <div className="flex items-center gap-8">
                        <ResponsiveContainer width="40%" height={200}>
                            <PieChart><Pie data={paymentMethods} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value">{paymentMethods.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie></PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-3">
                            {paymentMethods.map((p, i) => (
                                <div key={i} className="flex items-center gap-3"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="text-gray-600 capitalize">{p.name}</span><span className="font-semibold text-gray-900">{totalPayments > 0 ? Math.round((p.value / totalPayments) * 100) : 0}%</span><span className="text-gray-500 text-sm">({formatCurrency(p.total)})</span></div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsPage;
