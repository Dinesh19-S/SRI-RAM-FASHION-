import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import {
    TrendingUp,
    ShoppingBag,
    Users,
    IndianRupee,
    ArrowUpRight,
    ArrowDownRight,
    AlertTriangle
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { formatDate } from '../utils/dateUtils';

const DashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [recentBills, setRecentBills] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [lowStockAlerts, setLowStockAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, billsRes, chartRes, alertsRes] = await Promise.all([
                dashboardAPI.getStats(),
                dashboardAPI.getRecentBills(5),
                dashboardAPI.getRevenueChart('month'),
                dashboardAPI.getLowStockAlerts()
            ]);
            setStats(statsRes.data.data || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, totalCustomers: 0, revenueGrowth: 0, ordersGrowth: 0 });
            setRecentBills(billsRes.data.data || []);
            setRevenueData((chartRes.data.data || []).map(d => ({ date: d._id, revenue: d.revenue })));
            setLowStockAlerts(alertsRes.data.data || []);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            setStats({ totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, totalCustomers: 0, revenueGrowth: 0, ordersGrowth: 0 });
            setRecentBills([]);
            setRevenueData([]);
            setLowStockAlerts([]);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    // Format today's date as dd/mm/yyyy
    const getTodayFormatted = () => {
        const today = new Date();
        const day = today.getDate().toString().padStart(2, '0');
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const year = today.getFullYear();
        const weekday = today.toLocaleDateString('en-IN', { weekday: 'long' });
        return `${weekday}, ${day}/${month}/${year}`;
    };

    const statsCards = [
        {
            title: 'Total Revenue',
            value: formatCurrency(stats?.totalRevenue || 0),
            change: stats?.revenueGrowth || 0,
            icon: IndianRupee,
            color: 'purple'
        },
        {
            title: 'Total Orders',
            value: stats?.totalOrders || 0,
            change: stats?.ordersGrowth || 0,
            icon: ShoppingBag,
            color: 'blue'
        },
        {
            title: 'Avg Order Value',
            value: formatCurrency(stats?.avgOrderValue || 0),
            change: 5.2,
            icon: TrendingUp,
            color: 'green'
        },
        {
            title: 'Total Customers',
            value: stats?.totalCustomers || 0,
            change: 10.5,
            icon: Users,
            color: 'orange'
        }
    ];

    const colorClasses = {
        purple: 'bg-purple-100 text-purple-600',
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        orange: 'bg-orange-100 text-orange-600'
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 font-medium">
                    {getTodayFormatted()}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map((stat, index) => (
                    <div key={index} className="stats-card">
                        <div className={`p-3 rounded-xl ${colorClasses[stat.color]}`}>
                            <stat.icon size={24} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                            <div className={`flex items-center gap-1 text-xs font-semibold ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {stat.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                <span>{Math.abs(stat.change)}% vs last month</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 card">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Overview</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={revenueData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" stroke="#4b5563" tick={{ fontSize: 12, fill: '#374151' }} />
                            <YAxis stroke="#4b5563" tick={{ fontSize: 12, fill: '#374151' }} tickFormatter={(v) => `₹${v / 1000}K`} />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                fill="url(#colorRevenue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Low Stock Alerts */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Low Stock Alerts</h3>
                        <span className="badge badge-error">{lowStockAlerts.length}</span>
                    </div>
                    <div className="space-y-3">
                        {lowStockAlerts.length === 0 ? (
                            <p className="text-gray-600 text-center py-4 font-medium">No low stock alerts</p>
                        ) : (
                            lowStockAlerts.map((item) => (
                                <div key={item._id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                                    <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                        <AlertTriangle size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                                        <p className="text-xs font-medium text-gray-600">{item.stock} left (min: {item.lowStockThreshold})</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Bills */}
            <div className="card p-0">
                <div className="flex items-center justify-between p-6 pb-4">
                    <h3 className="text-lg font-bold text-gray-900">Recent Bills</h3>
                    <a href="/billing" className="text-sm font-semibold text-purple-600 hover:text-purple-700">View All</a>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-y border-gray-200">
                                <th className="text-left p-4 text-sm font-bold text-gray-900">Bill No</th>
                                <th className="text-left p-4 text-sm font-bold text-gray-900">Date</th>
                                <th className="text-left p-4 text-sm font-bold text-gray-900">Customer</th>
                                <th className="text-left p-4 text-sm font-bold text-gray-900">Amount</th>
                                <th className="text-left p-4 text-sm font-bold text-gray-900">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentBills.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-600 font-medium">
                                        No recent bills found
                                    </td>
                                </tr>
                            ) : (
                                recentBills.map((bill) => (
                                    <tr key={bill._id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="p-4 text-sm font-semibold text-gray-900">{bill.billNumber}</td>
                                        <td className="p-4 text-sm font-medium text-gray-900">{formatDate(bill.createdAt)}</td>
                                        <td className="p-4 text-sm font-medium text-gray-900">{bill.customer?.name || '-'}</td>
                                        <td className="p-4 text-sm font-bold text-gray-900">{formatCurrency(bill.grandTotal)}</td>
                                        <td className="p-4">
                                            <span className={`badge ${bill.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                                                {bill.paymentStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
