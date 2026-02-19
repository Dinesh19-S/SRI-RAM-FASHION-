import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { logout } from '../../store/slices/authSlice';
import {
    LayoutDashboard,
    Receipt,
    Package,
    Settings,
    Search,
    Bell,
    ChevronDown,
    ChevronRight,
    Menu,
    X,
    LogOut,
    User,
    Store,
    Calculator,
    IndianRupee,
    ShoppingCart,
    TrendingUp,
    Users,
    Truck
} from 'lucide-react';

import logoImage from '../../assets/logo.jpg';

const navigationSections = [
    {
        title: 'DASHBOARD',
        items: [
            { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
            { name: 'Billing', href: '/dashboard/billing', icon: Receipt },
            { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
        ]
    },
    {
        title: 'PURCHASE',
        items: [
            { name: 'Purchase Entry', href: '/dashboard/purchase/entry', icon: Calculator },

        ]
    },
    {
        title: 'SALES',
        items: [
            { name: 'Sales Entry', href: '/dashboard/sales/entry', icon: ShoppingCart },

        ]
    },
    {
        title: 'REPORTS',
        items: [
            { name: 'Purchase Reports', href: '/dashboard/reports/purchase', icon: TrendingUp },
            { name: 'Sales Reports', href: '/dashboard/reports/sales', icon: TrendingUp },
            { name: 'Stock Reports', href: '/dashboard/reports/stock', icon: Package },
            { name: 'Auditor Purchase', href: '/dashboard/auditor/purchase', icon: TrendingUp },
            { name: 'Auditor Sales', href: '/dashboard/auditor/sales', icon: TrendingUp },
        ]
    },
    {
        title: 'MASTER',
        items: [
            { name: 'Suppliers', href: '/dashboard/master/suppliers', icon: Truck },
            { name: 'Customers', href: '/dashboard/master/customers', icon: Users },
            { name: 'Items', href: '/dashboard/master/items', icon: Package },
        ]
    },
    {
        title: 'SETTINGS',
        items: [
            { name: 'Settings', href: '/dashboard/settings', icon: Settings },
        ]
    },
];

const MainLayout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState({});
    const searchRef = useRef(null);

    // Page transition animation variants
    const pageVariants = {
        initial: {
            opacity: 0,
            x: 20,
        },
        in: {
            opacity: 1,
            x: 0,
        },
        out: {
            opacity: 0,
            x: -20,
        }
    };

    const pageTransition = {
        type: 'tween',
        ease: 'anticipate',
        duration: 0.7
    };

    const searchSuggestions = [
        { label: 'Dashboard', path: '/dashboard', keywords: ['dashboard', 'home', 'overview'] },
        { label: 'Purchase Entry', path: '/dashboard/purchase/entry', keywords: ['purchase', 'buy', 'supplier', 'invoice'] },

        { label: 'Purchase Reports', path: '/dashboard/reports/purchase', keywords: ['purchase', 'report', 'analysis'] },
        { label: 'Sales Entry', path: '/dashboard/sales/entry', keywords: ['sales', 'sell', 'customer', 'invoice'] },

        { label: 'Sales Reports', path: '/dashboard/reports/sales', keywords: ['sales', 'report', 'analysis'] },
        { label: 'Billing', path: '/dashboard/billing', keywords: ['billing', 'bill', 'invoice', 'receipt'] },
        { label: 'Products', path: '/dashboard/inventory', keywords: ['inventory', 'stock', 'product', 'item'] },
        { label: 'Stock Reports', path: '/dashboard/reports/stock', keywords: ['stock', 'report', 'inventory'] },
        { label: 'Suppliers', path: '/dashboard/master/suppliers', keywords: ['supplier', 'vendor', 'entry', 'master'] },
        { label: 'Customers', path: '/dashboard/master/customers', keywords: ['customer', 'entry', 'master', 'company'] },
        { label: 'Items', path: '/dashboard/master/items', keywords: ['items', 'hsn', 'product', 'master'] },
        { label: 'Settings', path: '/dashboard/settings', keywords: ['settings', 'config', 'preferences'] },
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

    const toggleSection = (sectionTitle) => {
        setCollapsedSections(prev => ({
            ...prev,
            [sectionTitle]: !prev[sectionTitle]
        }));
    };

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
        <div className="flex min-h-screen bg-gray-50">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 lg:hidden bg-black/20 backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
                style={{
                    background: 'linear-gradient(180deg, #1e3a5f 0%, #0f2744 50%, #0a1929 100%)',
                    borderRight: '1px solid rgba(255,255,255,0.1)'
                }}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <img
                        src={logoImage}
                        alt="Sri Ram Fashions"
                        className="w-10 h-10 rounded-lg object-cover shadow-lg ring-2 ring-white/20"
                    />
                    <div>
                        <div className="text-sm font-bold text-white">
                            Sri Ram Fashions
                        </div>
                        <div className="text-xs text-blue-200/70">Purchase & Sales</div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col py-4 px-3 space-y-1 overflow-y-auto h-[calc(100vh-140px)]">
                    {navigationSections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className={sectionIndex > 0 ? 'mt-4' : ''}>
                            <button
                                onClick={() => toggleSection(section.title)}
                                className="flex items-center justify-between w-full text-xs font-bold text-blue-200/60 uppercase tracking-wider mb-2 px-3 py-1 hover:text-blue-100 transition-colors"
                            >
                                {section.title}
                                <ChevronRight
                                    size={14}
                                    className={`transition-transform duration-200 ${!collapsedSections[section.title] ? 'rotate-90' : ''}`}
                                />
                            </button>

                            <AnimatePresence>
                                {!collapsedSections[section.title] && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden space-y-0.5"
                                    >
                                        {section.items.map((item) => (
                                            <NavLink
                                                key={item.name}
                                                to={item.href}
                                                end={item.href === '/dashboard'}
                                                className={({ isActive }) => `
                                                    flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group
                                                    ${isActive
                                                        ? 'bg-white/15 text-white shadow-lg'
                                                        : 'text-blue-100/80 hover:bg-white/10 hover:text-white'}
                                                `}
                                                onClick={() => setSidebarOpen(false)}
                                            >
                                                {({ isActive }) => (
                                                    <>
                                                        <item.icon
                                                            size={18}
                                                            className={`transition-colors ${isActive ? 'text-cyan-300' : 'text-blue-300/60 group-hover:text-cyan-300'}`}
                                                            strokeWidth={2}
                                                        />
                                                        <span className="text-sm font-medium">{item.name}</span>
                                                    </>
                                                )}
                                            </NavLink>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </nav>

                {/* Logout */}
                <div className="absolute bottom-0 left-0 right-0 px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors"
                    >
                        <LogOut size={18} />
                        <span className="text-sm font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen lg:ml-64 transition-all duration-300">
                {/* Header */}
                <header className="h-16 flex items-center justify-between px-4 lg:px-8 py-3 bg-white border-b border-gray-200 sticky top-0 z-30">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                        <div className="hidden md:block relative w-full max-w-md" ref={searchRef}>
                            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus-within:bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                                <Search size={18} className="text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search bills, products, pages..."
                                    className="bg-transparent border-none outline-none text-sm w-full text-gray-900 placeholder:text-gray-400"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowSearchDropdown(true);
                                    }}
                                    onFocus={() => setShowSearchDropdown(true)}
                                    onKeyDown={handleSearchKeyDown}
                                />
                            </div>

                            <AnimatePresence>
                                {showSearchDropdown && filteredSuggestions.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 4 }}
                                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50 max-h-64 overflow-y-auto"
                                    >
                                        {filteredSuggestions.map((suggestion, index) => (
                                            <div
                                                key={suggestion.path}
                                                className={`px-4 py-2.5 cursor-pointer flex items-center gap-3 hover:bg-gray-50 transition-colors ${index === 0 ? 'bg-blue-50/50' : ''}`}
                                                onClick={() => handleSearchSelect(suggestion.path)}
                                            >
                                                <Search size={16} className={index === 0 ? 'text-blue-500' : 'text-gray-400'} />
                                                <span className={index === 0 ? 'text-blue-700 font-medium' : 'text-gray-700'}>{suggestion.label}</span>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>

                        <div className="relative">
                            <div
                                className="flex items-center gap-3 cursor-pointer pl-2"
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                            >
                                <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm">
                                    {user?.name?.charAt(0) || 'A'}
                                </div>
                                <div className="hidden md:block">
                                    <div className="text-sm font-semibold text-gray-900 leading-tight">
                                        {user?.name || 'Admin User'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {user?.role || 'admin'}
                                    </div>
                                </div>
                                <ChevronDown
                                    size={16}
                                    className={`text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                                />
                            </div>

                            <AnimatePresence>
                                {userMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 8 }}
                                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 origin-top-right"
                                    >
                                        <div className="px-4 py-3 border-b border-gray-100 md:hidden">
                                            <p className="text-sm font-semibold text-gray-900">{user?.name || 'Admin User'}</p>
                                            <p className="text-xs text-gray-500">{user?.email || 'admin@example.com'}</p>
                                        </div>
                                        <button
                                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            onClick={() => navigate('/dashboard/settings')}
                                        >
                                            <User size={16} className="text-gray-400" />
                                            <span>Profile</span>
                                        </button>
                                        <button
                                            className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                            onClick={handleLogout}
                                        >
                                            <LogOut size={16} className="text-red-500" />
                                            <span>Logout</span>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
