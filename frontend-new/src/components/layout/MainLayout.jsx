import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import {
    LayoutDashboard,
    Receipt,
    Package,
    BarChart3,
    Settings,
    Search,
    Bell,
    ChevronDown,
    Menu,
    X,
    LogOut,
    User,
    Store,
    Calculator,
    DollarSign,
    FileText,
    ShoppingCart,
    TrendingUp,
    Scale,
    Users,
    Hash,
    Truck
} from 'lucide-react';

const navigationSections = [
    {
        title: 'Main Menu',
        items: [
            { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        ]
    },
    {
        title: 'Purchase',
        items: [
            { name: 'Purchase Entry', href: '/purchase/entry', icon: Calculator },
            { name: 'Purchase Payments', href: '/purchase/payments', icon: DollarSign },
        ]
    },
    {
        title: 'Sales',
        items: [
            { name: 'Sales Entry', href: '/sales/entry', icon: ShoppingCart },
            { name: 'Sales Payments', href: '/sales/payments', icon: DollarSign },
        ]
    },
    {
        title: 'Main Menu',
        items: [
            { name: 'Billing', href: '/billing', icon: Receipt },
            { name: 'Inventory', href: '/inventory', icon: Package },
        ]
    },
    {
        title: 'Reports',
        items: [
            { name: 'Purchase Reports', href: '/reports/purchase', icon: TrendingUp },
            { name: 'Sales Reports', href: '/reports/sales', icon: TrendingUp },
            { name: 'Stock Reports', href: '/reports/stock', icon: Package },
            { name: 'Auditor - Purchase', href: '/auditor/purchase', icon: Scale },
            { name: 'Auditor - Sales', href: '/auditor/sales', icon: Scale },
        ]
    },
    {
        title: 'Master',
        items: [
            { name: 'Supplier Entry', href: '/master/suppliers', icon: Truck },
            { name: 'Customer Entry', href: '/master/customers', icon: Users },
            { name: 'Items', href: '/master/items', icon: Package },
        ]
    },
    {
        title: 'Main Menu',
        items: [
            { name: 'Settings', href: '/settings', icon: Settings },
        ]
    },
];

const MainLayout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const searchRef = useRef(null);

    // Search suggestions based on query
    const searchSuggestions = [
        { label: 'Dashboard', path: '/', keywords: ['dashboard', 'home', 'overview'] },
        { label: 'Purchase Entry', path: '/purchase/entry', keywords: ['purchase', 'buy', 'supplier', 'invoice'] },
        { label: 'Purchase Payments', path: '/purchase/payments', keywords: ['purchase', 'payment', 'pay'] },
        { label: 'Sales Entry', path: '/sales/entry', keywords: ['sales', 'sell', 'customer', 'invoice'] },
        { label: 'Sales Payments', path: '/sales/payments', keywords: ['sales', 'payment', 'pay'] },
        { label: 'Billing', path: '/billing', keywords: ['billing', 'bill', 'invoice', 'receipt'] },
        { label: 'Inventory', path: '/inventory', keywords: ['inventory', 'stock', 'product', 'item'] },
        { label: 'Purchase Reports', path: '/reports/purchase', keywords: ['purchase', 'report', 'analysis'] },
        { label: 'Sales Reports', path: '/reports/sales', keywords: ['sales', 'report', 'analysis'] },
        { label: 'Stock Reports', path: '/reports/stock', keywords: ['stock', 'report', 'inventory'] },
        { label: 'Auditor - Purchase', path: '/auditor/purchase', keywords: ['auditor', 'purchase', 'audit'] },
        { label: 'Auditor - Sales', path: '/auditor/sales', keywords: ['auditor', 'sales', 'audit'] },
        { label: 'Customer Entry', path: '/master/customers', keywords: ['customer', 'entry', 'master', 'company'] },
        { label: 'Items', path: '/master/items', keywords: ['items', 'hsn', 'product', 'master'] },
        { label: 'Supplier Entry', path: '/master/suppliers', keywords: ['supplier', 'vendor', 'entry', 'master'] },
        { label: 'Settings', path: '/settings', keywords: ['settings', 'config', 'preferences'] },
    ];

    const filteredSuggestions = searchQuery.trim()
        ? searchSuggestions.filter(s =>
            s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.keywords.some(k => k.includes(searchQuery.toLowerCase()))
        )
        : [];

    const handleSearchSelect = (path) => {
        navigate(path);
        setSearchQuery('');
        setShowSearchDropdown(false);
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter' && filteredSuggestions.length > 0) {
            handleSearchSelect(filteredSuggestions[0].path);
        }
        if (e.key === 'Escape') {
            setShowSearchDropdown(false);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        dispatch(logout());
    };

    return (
        <div className="flex min-h-screen" style={{ backgroundColor: '#f9f7f4' }}>
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ backgroundColor: '#1e3a5f' }}>
                <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: '#2d4a6a' }}>
                    <img
                        src="/assets/logo.png"
                        alt="Sri Ram Fashions"
                        className="w-14 h-14 object-contain rounded-lg bg-white/10 p-1"
                    />
                    <div>
                        <div className="text-lg font-bold uppercase tracking-wide" style={{ color: '#d4a853', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>Sri Ram Fashions</div>
                        <div className="text-xs font-medium" style={{ color: '#60a5fa' }}>Business Management</div>
                    </div>
                </div>

                <nav className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                    {navigationSections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className={sectionIndex > 0 ? 'mt-6' : ''}>
                            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#60a5fa' }}>
                                {section.title}
                            </div>
                            {section.items.map((item) => (
                                <NavLink
                                    key={item.name}
                                    to={item.href}
                                    end={item.href === '/'}
                                    className={({ isActive }) =>
                                        `nav-link ${isActive ? 'active' : ''}`
                                    }
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon size={20} />
                                    <span>{item.name}</span>
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>


            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                        <div className="hidden md:block relative" ref={searchRef}>
                            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-80 focus-within:ring-2 transition-all" style={{ '--tw-ring-color': '#3b82f6' }}>
                                <Search size={18} className="text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search bills, products, pages..."
                                    className="bg-transparent border-none outline-none text-sm text-gray-700 w-full"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowSearchDropdown(true);
                                    }}
                                    onFocus={() => setShowSearchDropdown(true)}
                                    onKeyDown={handleSearchKeyDown}
                                />
                            </div>
                            {showSearchDropdown && filteredSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-64 overflow-y-auto">
                                    {filteredSuggestions.map((suggestion, index) => (
                                        <div
                                            key={suggestion.path}
                                            className={`px-4 py-2 cursor-pointer flex items-center gap-3 ${index === 0 ? 'bg-blue-50' : 'hover:bg-blue-50'}`}
                                            onClick={() => handleSearchSelect(suggestion.path)}
                                        >
                                            <Search size={16} className="text-gray-400" />
                                            <span className="text-gray-700">{suggestion.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {showSearchDropdown && searchQuery && filteredSuggestions.length === 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-4 z-50 text-center text-gray-500">
                                    No results found for "{searchQuery}"
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>

                        <div className="relative">
                            <div
                                className="flex items-center gap-3 cursor-pointer"
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                            >
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-white" style={{ backgroundColor: '#3b82f6' }}>
                                    {user?.name?.charAt(0) || 'A'}
                                </div>
                                <div className="hidden md:block">
                                    <div className="text-sm font-medium text-gray-700">{user?.name || 'Admin'}</div>
                                    <div className="text-xs text-gray-500">{user?.role || 'Administrator'}</div>
                                </div>
                                <ChevronDown size={16} className="text-gray-400" />
                            </div>

                            {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                    <div className="px-4 py-2 flex items-center gap-2 text-gray-700 hover:bg-gray-50 cursor-pointer">
                                        <User size={18} />
                                        <span>Profile</span>
                                    </div>
                                    <div className="px-4 py-2 flex items-center gap-2 text-gray-700 hover:bg-gray-50 cursor-pointer">
                                        <Settings size={18} />
                                        <span>Settings</span>
                                    </div>
                                    <div className="border-t border-gray-200 my-1" />
                                    <div
                                        className="px-4 py-2 flex items-center gap-2 text-red-600 hover:bg-red-50 cursor-pointer"
                                        onClick={handleLogout}
                                    >
                                        <LogOut size={18} />
                                        <span>Logout</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
                    <Outlet />
                </main>
            </div >
        </div >
    );
};

export default MainLayout;
