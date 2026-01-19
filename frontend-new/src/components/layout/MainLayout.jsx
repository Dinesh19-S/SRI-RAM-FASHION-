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
import AIChatWidget from '../AIChatWidget';
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
            { name: 'Purchase Payments', href: '/dashboard/purchase/payments', icon: IndianRupee },
        ]
    },
    {
        title: 'SALES',
        items: [
            { name: 'Sales Entry', href: '/dashboard/sales/entry', icon: ShoppingCart },
            { name: 'Sales Payments', href: '/dashboard/sales/payments', icon: IndianRupee },
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
        { label: 'Purchase Payments', path: '/dashboard/purchase/payments', keywords: ['purchase', 'payment', 'pay'] },
        { label: 'Purchase Reports', path: '/dashboard/reports/purchase', keywords: ['purchase', 'report', 'analysis'] },
        { label: 'Sales Entry', path: '/dashboard/sales/entry', keywords: ['sales', 'sell', 'customer', 'invoice'] },
        { label: 'Sales Payments', path: '/dashboard/sales/payments', keywords: ['sales', 'payment', 'pay'] },
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
        <div
            className="flex min-h-screen"
            style={{ background: 'linear-gradient(180deg, #0B1023 0%, #0E153A 100%)' }}
        >
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 lg:hidden"
                        style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
                style={{
                    background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(11, 16, 35, 0.98) 100%)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)'
                }}
            >
                {/* Logo */}
                <div
                    className="flex items-center gap-3 px-5 py-5 border-b"
                    style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
                >
                    <img
                        src={logoImage}
                        alt="Sri Ram Fashions"
                        className="w-12 h-12 rounded-xl object-cover"
                        style={{
                            boxShadow: '0 4px 15px rgba(30, 79, 255, 0.35)'
                        }}
                    />
                    <div>
                        <div
                            className="text-sm font-bold"
                            style={{ color: '#ffffff' }}
                        >
                            Sri Ram Fashions
                        </div>
                        <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Purchase & Sales</div>
                    </div>
                </div>

                {/* Navigation */}
                <nav
                    className="flex flex-col py-4 px-3 space-y-1 overflow-y-auto"
                    style={{ height: 'calc(100vh - 140px)' }}
                >
                    {navigationSections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className={sectionIndex > 0 ? 'mt-2' : ''}>
                            <button
                                onClick={() => toggleSection(section.title)}
                                className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider mb-2 px-3 py-1 rounded-lg transition-all duration-200 hover:bg-white/5"
                                style={{ color: 'rgba(255, 255, 255, 0.4)' }}
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
                                        className="overflow-hidden"
                                    >
                                        {section.items.map((item) => (
                                            <NavLink
                                                key={item.name}
                                                to={item.href}
                                                end={item.href === '/dashboard'}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 mb-1"
                                                style={({ isActive }) => ({
                                                    background: isActive
                                                        ? 'linear-gradient(135deg, rgba(30, 79, 255, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%)'
                                                        : 'transparent',
                                                    color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                                                    boxShadow: isActive ? '0 0 20px rgba(30, 79, 255, 0.15)' : 'none',
                                                    border: isActive ? '1px solid rgba(30, 79, 255, 0.3)' : '1px solid transparent'
                                                })}
                                                onClick={() => setSidebarOpen(false)}
                                            >
                                                {({ isActive }) => (
                                                    <>
                                                        <div
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                            style={{
                                                                background: isActive
                                                                    ? 'linear-gradient(135deg, #1E4FFF 0%, #3B82F6 100%)'
                                                                    : 'rgba(255, 255, 255, 0.05)',
                                                                boxShadow: isActive ? '0 4px 10px rgba(30, 79, 255, 0.3)' : 'none'
                                                            }}
                                                        >
                                                            <item.icon size={16} style={{ color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.5)' }} />
                                                        </div>
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
                <div
                    className="absolute bottom-0 left-0 right-0 px-3 py-4 border-t"
                    style={{ borderColor: 'rgba(255, 255, 255, 0.08)', background: 'rgba(15, 23, 42, 0.95)' }}
                >
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200"
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#EF4444'
                        }}
                    >
                        <LogOut size={18} />
                        <span className="text-sm font-medium">Logout</span>
                    </motion.button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
                {/* Header */}
                <header
                    className="h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30"
                    style={{
                        background: 'rgba(11, 16, 35, 0.85)',
                        backdropFilter: 'blur(20px)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                >
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden p-2 rounded-xl"
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                color: 'rgba(255, 255, 255, 0.7)'
                            }}
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                        <div className="hidden md:block relative" ref={searchRef}>
                            <div
                                className="flex items-center gap-2 rounded-xl px-4 py-2.5 w-72"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)'
                                }}
                            >
                                <Search size={18} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="bg-transparent border-none outline-none text-sm w-full"
                                    style={{ color: '#ffffff' }}
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
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full left-0 right-0 mt-2 rounded-xl py-2 z-50 max-h-64 overflow-y-auto"
                                        style={{
                                            background: 'rgba(15, 23, 42, 0.95)',
                                            backdropFilter: 'blur(20px)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
                                        }}
                                    >
                                        {filteredSuggestions.map((suggestion, index) => (
                                            <div
                                                key={suggestion.path}
                                                className="px-4 py-2.5 cursor-pointer flex items-center gap-3 transition-all duration-200"
                                                style={{ color: index === 0 ? '#3B82F6' : 'rgba(255, 255, 255, 0.7)' }}
                                                onClick={() => handleSearchSelect(suggestion.path)}
                                            >
                                                <Search size={16} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                                                <span>{suggestion.label}</span>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            className="relative p-2.5 rounded-xl"
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.08)'
                            }}
                        >
                            <Bell size={18} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                        </button>

                        <div className="relative">
                            <div
                                className="flex items-center gap-3 cursor-pointer p-2 rounded-xl"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)'
                                }}
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                            >
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm"
                                    style={{
                                        background: 'linear-gradient(135deg, #1E4FFF 0%, #3B82F6 100%)',
                                        color: '#ffffff'
                                    }}
                                >
                                    {user?.name?.charAt(0) || 'A'}
                                </div>
                                <div className="hidden md:block">
                                    <div className="text-sm font-medium" style={{ color: '#ffffff' }}>
                                        {user?.name || 'Admin'}
                                    </div>
                                </div>
                                <ChevronDown
                                    size={16}
                                    style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                                    className={`transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                                />
                            </div>

                            <AnimatePresence>
                                {userMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute right-0 mt-2 w-48 rounded-xl py-2 z-50"
                                        style={{
                                            background: 'rgba(15, 23, 42, 0.95)',
                                            backdropFilter: 'blur(20px)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
                                        }}
                                    >
                                        <div
                                            className="px-4 py-2.5 flex items-center gap-3 cursor-pointer"
                                            style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                            onClick={() => navigate('/dashboard/settings')}
                                        >
                                            <User size={18} />
                                            <span>Profile</span>
                                        </div>
                                        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '4px 12px' }} />
                                        <div
                                            className="px-4 py-2.5 flex items-center gap-3 cursor-pointer"
                                            style={{ color: '#EF4444' }}
                                            onClick={handleLogout}
                                        >
                                            <LogOut size={18} />
                                            <span>Logout</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* Page Content with Slide Animation */}
                <main className="flex-1 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial="initial"
                            animate="in"
                            exit="out"
                            variants={pageVariants}
                            transition={pageTransition}
                            className="h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* AI Chat Widget */}
            <AIChatWidget />
        </div>
    );
};

export default MainLayout;
