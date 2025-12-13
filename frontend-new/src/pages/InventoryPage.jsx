import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchCategories, updateProductStock, createProduct, updateProduct, deleteProduct } from '../store/slices/productsSlice';
import { Package, Plus, Search, ArrowUpCircle, ArrowDownCircle, Edit, Trash2, AlertTriangle, Box, TrendingUp, X, Save } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const InventoryPage = () => {
    const dispatch = useDispatch();
    const { items: products, categories, isLoading } = useSelector((state) => state.products);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [showStockModal, setShowStockModal] = useState(false);
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [showEditProductModal, setShowEditProductModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [stockType, setStockType] = useState('in');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [stockQuantity, setStockQuantity] = useState(1);
    const [stockReason, setStockReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New product form state
    const [newProduct, setNewProduct] = useState({
        name: '',
        sku: '',
        category: '',
        costPrice: '',
        sellingPrice: '',
        stock: '',
        lowStockThreshold: '5',
        hsn: '',
        gstRate: '5',
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

    const resetNewProductForm = () => {
        setNewProduct({
            name: '',
            sku: '',
            category: '',
            costPrice: '',
            sellingPrice: '',
            stock: '',
            lowStockThreshold: '5',
            hsn: '',
            gstRate: '5',
            description: ''
        });
    };

    const handleAddProduct = async () => {
        // Validation
        if (!newProduct.name || !newProduct.sku || !newProduct.category || !newProduct.sellingPrice || !newProduct.stock) {
            alert('Please fill in all required fields (Name, SKU, Category, Selling Price, Stock)');
            return;
        }

        setIsSubmitting(true);
        try {
            await dispatch(createProduct({
                name: newProduct.name,
                sku: newProduct.sku,
                category: newProduct.category,
                costPrice: Number(newProduct.costPrice) || 0,
                sellingPrice: Number(newProduct.sellingPrice),
                stock: Number(newProduct.stock),
                lowStockThreshold: Number(newProduct.lowStockThreshold) || 5,
                hsn: newProduct.hsn,
                gstRate: Number(newProduct.gstRate) || 5,
                description: newProduct.description
            })).unwrap();

            setShowAddProductModal(false);
            resetNewProductForm();
            dispatch(fetchProducts());
        } catch (error) {
            alert('Failed to add product: ' + (error || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (product) => {
        setSelectedProduct(product);
        setNewProduct({
            name: product.name || '',
            sku: product.sku || '',
            category: product.category?._id || product.category || '',
            costPrice: product.costPrice?.toString() || '',
            sellingPrice: product.sellingPrice?.toString() || '',
            stock: product.stock?.toString() || '',
            lowStockThreshold: product.lowStockThreshold?.toString() || '5',
            hsn: product.hsn || '',
            gstRate: product.gstRate?.toString() || '5',
            description: product.description || ''
        });
        setShowEditProductModal(true);
    };

    const handleEditProduct = async () => {
        if (!selectedProduct || !newProduct.name || !newProduct.sku || !newProduct.category || !newProduct.sellingPrice) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            await dispatch(updateProduct({
                id: selectedProduct._id,
                data: {
                    name: newProduct.name,
                    sku: newProduct.sku,
                    category: newProduct.category,
                    costPrice: Number(newProduct.costPrice) || 0,
                    sellingPrice: Number(newProduct.sellingPrice),
                    stock: Number(newProduct.stock) || 0,
                    lowStockThreshold: Number(newProduct.lowStockThreshold) || 5,
                    hsn: newProduct.hsn,
                    gstRate: Number(newProduct.gstRate) || 5,
                    description: newProduct.description
                }
            })).unwrap();

            setShowEditProductModal(false);
            setSelectedProduct(null);
            resetNewProductForm();
            dispatch(fetchProducts());
        } catch (error) {
            alert('Failed to update product: ' + (error || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (product) => {
        setSelectedProduct(product);
        setShowDeleteConfirm(true);
    };

    const handleDeleteProduct = async () => {
        if (!selectedProduct) return;

        setIsSubmitting(true);
        try {
            await dispatch(deleteProduct(selectedProduct._id)).unwrap();
            setShowDeleteConfirm(false);
            setSelectedProduct(null);
        } catch (error) {
            alert('Failed to delete product: ' + (error || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
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
                    onClick={() => setShowAddProductModal(true)}
                >
                    <Plus size={18} />Add Product
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stats-card"><div className="p-3 rounded-xl bg-purple-100 text-purple-600"><Package size={24} /></div><div><p className="text-sm text-gray-500">Total Products</p><p className="text-xl font-bold text-gray-900">{stats.totalProducts}</p></div></div>
                <div className="stats-card"><div className="p-3 rounded-xl bg-blue-100 text-blue-600"><Box size={24} /></div><div><p className="text-sm text-gray-500">Total Stock</p><p className="text-xl font-bold text-gray-900">{stats.totalStock}</p></div></div>
                <div className="stats-card"><div className="p-3 rounded-xl bg-red-100 text-red-600"><AlertTriangle size={24} /></div><div><p className="text-sm text-gray-500">Low Stock</p><p className="text-xl font-bold text-gray-900">{stats.lowStock}</p></div></div>
                <div className="stats-card"><div className="p-3 rounded-xl bg-green-100 text-green-600"><TrendingUp size={24} /></div><div><p className="text-sm text-gray-500">Inventory Value</p><p className="text-xl font-bold text-gray-900">{formatCurrency(stats.inventoryValue)}</p></div></div>
            </div>

            {products.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock by Category</h3>
                        <ResponsiveContainer width="100%" height={200}><BarChart data={categoryData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
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
                    <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500"><Package size={48} className="mx-auto mb-2 opacity-50" /><p>No products found</p></div>
                ) : (
                    <table className="table">
                        <thead><tr className="bg-gray-50"><th>Product</th><th>SKU</th><th>Category</th><th>Stock</th><th>Price</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
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
                                                className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                                onClick={() => handleEditClick(p)}
                                                title="Edit"
                                            >
                                                <Edit size={18} />
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

            {/* Add Product Modal */}
            {showAddProductModal && (
                <div className="modal-overlay" onClick={() => { setShowAddProductModal(false); resetNewProductForm(); }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="text-lg font-semibold text-gray-900">Add New Product</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => { setShowAddProductModal(false); resetNewProductForm(); }}><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Product Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter product name"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">SKU *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., SAR001"
                                        value={newProduct.sku}
                                        onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Category *</label>
                                    <select
                                        className="form-input"
                                        value={newProduct.category}
                                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                    >
                                        <option value="">Select category</option>
                                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">HSN Code</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., 6106"
                                        value={newProduct.hsn}
                                        onChange={(e) => setNewProduct({ ...newProduct, hsn: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="form-label">Cost Price (₹)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0"
                                        value={newProduct.costPrice}
                                        onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Selling Price (₹) *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0"
                                        value={newProduct.sellingPrice}
                                        onChange={(e) => setNewProduct({ ...newProduct, sellingPrice: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">GST Rate (%)</label>
                                    <select
                                        className="form-input"
                                        value={newProduct.gstRate}
                                        onChange={(e) => setNewProduct({ ...newProduct, gstRate: e.target.value })}
                                    >
                                        <option value="0">0%</option>
                                        <option value="5">5%</option>
                                        <option value="12">12%</option>
                                        <option value="18">18%</option>
                                        <option value="28">28%</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Initial Stock *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0"
                                        min="0"
                                        value={newProduct.stock}
                                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Low Stock Threshold</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="5"
                                        min="0"
                                        value={newProduct.lowStockThreshold}
                                        onChange={(e) => setNewProduct({ ...newProduct, lowStockThreshold: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-input"
                                    rows="3"
                                    placeholder="Product description (optional)"
                                    value={newProduct.description}
                                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => { setShowAddProductModal(false); resetNewProductForm(); }}>Cancel</button>
                            <button
                                className="btn btn-primary flex items-center gap-2"
                                onClick={handleAddProduct}
                                disabled={isSubmitting}
                            >
                                <Save size={18} />
                                {isSubmitting ? 'Adding...' : 'Add Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Product Modal */}
            {showEditProductModal && selectedProduct && (
                <div className="modal-overlay" onClick={() => { setShowEditProductModal(false); setSelectedProduct(null); resetNewProductForm(); }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="text-lg font-semibold text-gray-900">Edit Product</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => { setShowEditProductModal(false); setSelectedProduct(null); resetNewProductForm(); }}><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Product Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">SKU *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={newProduct.sku}
                                        onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Category *</label>
                                    <select
                                        className="form-input"
                                        value={newProduct.category}
                                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                    >
                                        <option value="">Select category</option>
                                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">HSN Code</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={newProduct.hsn}
                                        onChange={(e) => setNewProduct({ ...newProduct, hsn: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="form-label">Cost Price (₹)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={newProduct.costPrice}
                                        onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Selling Price (₹) *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={newProduct.sellingPrice}
                                        onChange={(e) => setNewProduct({ ...newProduct, sellingPrice: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">GST Rate (%)</label>
                                    <select
                                        className="form-input"
                                        value={newProduct.gstRate}
                                        onChange={(e) => setNewProduct({ ...newProduct, gstRate: e.target.value })}
                                    >
                                        <option value="0">0%</option>
                                        <option value="5">5%</option>
                                        <option value="12">12%</option>
                                        <option value="18">18%</option>
                                        <option value="28">28%</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Stock</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        min="0"
                                        value={newProduct.stock}
                                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Low Stock Threshold</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        min="0"
                                        value={newProduct.lowStockThreshold}
                                        onChange={(e) => setNewProduct({ ...newProduct, lowStockThreshold: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-input"
                                    rows="3"
                                    value={newProduct.description}
                                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => { setShowEditProductModal(false); setSelectedProduct(null); resetNewProductForm(); }}>Cancel</button>
                            <button
                                className="btn btn-primary flex items-center gap-2"
                                onClick={handleEditProduct}
                                disabled={isSubmitting}
                            >
                                <Save size={18} />
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && selectedProduct && (
                <div className="modal-overlay" onClick={() => { setShowDeleteConfirm(false); setSelectedProduct(null); }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Product</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete <strong>{selectedProduct.name}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => { setShowDeleteConfirm(false); setSelectedProduct(null); }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn bg-red-600 text-white hover:bg-red-700"
                                    onClick={handleDeleteProduct}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Deleting...' : 'Delete'}
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

