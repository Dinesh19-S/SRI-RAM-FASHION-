import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchCategories, updateProductStock, createCategory, deleteProduct } from '../store/slices/productsSlice';
import { Package, Plus, Search, ArrowUpCircle, ArrowDownCircle, AlertTriangle, Box, TrendingUp, X, FolderPlus, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const InventoryPage = () => {
    const dispatch = useDispatch();
    const { items: products, categories, isLoading } = useSelector((state) => state.products);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [showStockModal, setShowStockModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [stockType, setStockType] = useState('in');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [stockQuantity, setStockQuantity] = useState(1);
    const [stockReason, setStockReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // New category form state
    const [newCategory, setNewCategory] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        dispatch(fetchProducts());
        dispatch(fetchCategories());
    }, [dispatch]);

    const handleStockUpdate = async () => {
        if (!selectedProduct || !stockQuantity || !stockReason) return;
        await dispatch(updateProductStock({ id: selectedProduct._id, data: { type: stockType, quantity: stockQuantity, reason: stockReason } }));
        setShowStockModal(false);
        setSelectedProduct(null);
        setStockQuantity(1);
        setStockReason('');
        dispatch(fetchProducts());
    };

    const handleAddCategory = async () => {
        if (!newCategory.name.trim()) {
            alert('Please enter a category name');
            return;
        }

        setIsSubmitting(true);
        try {
            await dispatch(createCategory({
                name: newCategory.name.trim(),
                description: newCategory.description.trim()
            })).unwrap();

            setShowCategoryModal(false);
            setNewCategory({ name: '', description: '' });
            dispatch(fetchCategories());
        } catch (error) {
            alert('Failed to add category: ' + (error || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (product) => {
        setProductToDelete(product);
        setShowDeleteConfirm(true);
    };

    const handleDeleteProduct = async () => {
        if (!productToDelete) return;
        setIsDeleting(true);
        try {
            await dispatch(deleteProduct(productToDelete._id)).unwrap();
            setShowDeleteConfirm(false);
            setProductToDelete(null);
        } catch (error) {
            alert('Failed to delete product: ' + (error || 'Unknown error'));
        } finally {
            setIsDeleting(false);
        }
    };

    const stats = {
        totalProducts: products.length,
        totalStock: products.reduce((s, p) => s + (p.stock || 0), 0),
        lowStock: products.filter(p => p.stock <= (p.lowStockThreshold || 5)).length,
        inventoryValue: products.reduce((s, p) => s + ((p.stock || 0) * (p.sellingPrice || 0)), 0)
    };

    const categoryData = categories.map(c => ({ name: c.name, value: products.filter(p => p.category?._id === c._id || p.category === c._id).reduce((s, p) => s + (p.stock || 0), 0) }));
    const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
    const formatCurrency = (a) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(a);

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
        const catId = p.category?._id || p.category;
        const matchesCategory = filterCategory === 'all' || catId === filterCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
                <button
                    className="btn btn-new-entry flex items-center gap-2"
                    onClick={() => setShowCategoryModal(true)}
                >
                    <FolderPlus size={18} />Add Category
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stats-card"><div className="p-3 rounded-xl" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}><Package size={24} /></div><div><p className="text-sm text-gray-500">Total Products</p><p className="text-xl font-bold text-gray-900">{stats.totalProducts}</p></div></div>
                <div className="stats-card"><div className="p-3 rounded-xl bg-blue-100 text-blue-600"><Box size={24} /></div><div><p className="text-sm text-gray-500">Total Stock</p><p className="text-xl font-bold text-gray-900">{stats.totalStock}</p></div></div>
                <div className="stats-card"><div className="p-3 rounded-xl bg-red-100 text-red-600"><AlertTriangle size={24} /></div><div><p className="text-sm text-gray-500">Low Stock</p><p className="text-xl font-bold text-gray-900">{stats.lowStock}</p></div></div>
                <div className="stats-card"><div className="p-3 rounded-xl bg-green-100 text-green-600"><TrendingUp size={24} /></div><div><p className="text-sm text-gray-500">Inventory Value</p><p className="text-xl font-bold text-gray-900">{formatCurrency(stats.inventoryValue)}</p></div></div>
            </div>

            {products.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock by Category</h3>
                        <ResponsiveContainer width="100%" height={200}><BarChart data={categoryData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
                    </div>
                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution</h3>
                        <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={categoryData.filter(c => c.value > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value">{categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="flex gap-4">
                <div className="relative flex-1"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" className="form-input pl-10" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                <select className="form-input w-40" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}><option value="all">All Categories</option>{categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select>
            </div>

            <div className="card overflow-hidden p-0">
                {isLoading ? (
                    <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#3b82f6', borderTopColor: 'transparent' }} /></div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500"><Package size={48} className="mx-auto mb-2 opacity-50" /><p>No products found</p></div>
                ) : (
                    <table className="table">
                        <thead><tr className="bg-gray-50"><th>Product</th><th>SKU</th><th>Category</th><th>Stock</th><th>Price</th><th>Status</th><th className="text-right">Stock Actions</th></tr></thead>
                        <tbody>
                            {filteredProducts.map(p => (
                                <tr key={p._id}>
                                    <td className="font-medium">{p.name}</td><td className="text-gray-500">{p.sku}</td><td>{p.category?.name || 'N/A'}</td><td className="font-semibold">{p.stock}</td><td>{formatCurrency(p.sellingPrice)}</td>
                                    <td><span className={`badge ${p.stock <= (p.lowStockThreshold || 5) ? 'badge-error' : 'badge-success'}`}>{p.stock <= (p.lowStockThreshold || 5) ? 'Low' : 'In Stock'}</span></td>
                                    <td>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                                onClick={() => { setSelectedProduct(p); setStockType('in'); setShowStockModal(true); }}
                                                title="Stock In"
                                            >
                                                <ArrowUpCircle size={18} />
                                            </button>
                                            <button
                                                className="p-2 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
                                                onClick={() => { setSelectedProduct(p); setStockType('out'); setShowStockModal(true); }}
                                                title="Stock Out"
                                            >
                                                <ArrowDownCircle size={18} />
                                            </button>
                                            <button
                                                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                onClick={() => handleDeleteClick(p)}
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Stock Update Modal */}
            {showStockModal && selectedProduct && (
                <div className="modal-overlay" onClick={() => setShowStockModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h3 className="text-lg font-semibold text-gray-900">{stockType === 'in' ? 'Stock In' : 'Stock Out'}</h3><button className="btn btn-ghost btn-icon" onClick={() => setShowStockModal(false)}><X size={20} /></button></div>
                        <div className="modal-body space-y-4">
                            <p className="font-medium">{selectedProduct.name} (Current: {selectedProduct.stock})</p>
                            <div><label className="form-label">Quantity</label><input type="number" className="form-input" min="1" value={stockQuantity} onChange={(e) => setStockQuantity(Number(e.target.value))} /></div>
                            <div><label className="form-label">Reason</label><select className="form-input" value={stockReason} onChange={(e) => setStockReason(e.target.value)}><option value="">Select reason</option>{stockType === 'in' ? <><option value="purchase">Purchase</option><option value="return">Return</option></> : <><option value="sale">Sale</option><option value="damage">Damaged</option></>}<option value="adjustment">Adjustment</option></select></div>
                        </div>
                        <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowStockModal(false)}>Cancel</button><button className={`btn ${stockType === 'in' ? 'bg-green-600' : 'bg-orange-500'} text-white`} onClick={handleStockUpdate}>Update</button></div>
                    </div>
                </div>
            )}

            {/* Add Category Modal */}
            {showCategoryModal && (
                <div className="modal-overlay" onClick={() => { setShowCategoryModal(false); setNewCategory({ name: '', description: '' }); }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 rounded-t-2xl" style={{ backgroundColor: '#1e3a5f' }}>
                            <h3 className="text-lg font-semibold text-white">Add New Category</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="form-label">Category Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter category name"
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-input"
                                    rows="3"
                                    placeholder="Category description (optional)"
                                    value={newCategory.description}
                                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-2xl">
                            <button className="btn btn-secondary" onClick={() => { setShowCategoryModal(false); setNewCategory({ name: '', description: '' }); }}>Cancel</button>
                            <button
                                className="btn btn-primary flex items-center gap-2"
                                onClick={handleAddCategory}
                                disabled={isSubmitting}
                            >
                                <Plus size={18} />
                                {isSubmitting ? 'Adding...' : 'Add Category'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && productToDelete && (
                <div className="modal-overlay" onClick={() => { setShowDeleteConfirm(false); setProductToDelete(null); }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Product</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete <strong>{productToDelete.name}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => { setShowDeleteConfirm(false); setProductToDelete(null); }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn bg-red-600 text-white hover:bg-red-700"
                                    onClick={handleDeleteProduct}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryPage;
