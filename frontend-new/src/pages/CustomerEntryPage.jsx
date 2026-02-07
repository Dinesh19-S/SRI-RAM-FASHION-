import { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit, Trash2, Download, X, Save } from 'lucide-react';
import { customersAPI } from '../services/api';

const CustomerEntryPage = () => {
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
    const [formData, setFormData] = useState({
        companyName: '',
        gstin: '',
        state: 'Tamilnadu',
        mobile: '',
        alternateNo: '',
        email: '',
        address: '',
        placeOfSupply: ''
    });

    useEffect(() => {
        fetchCustomers();
    }, [pagination.page, pagination.limit]);

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const response = await customersAPI.getAll({
                search: searchQuery,
                page: pagination.page,
                limit: pagination.limit
            });
            setCustomers(response.data.data || []);
            setPagination(prev => ({
                ...prev,
                total: response.data.pagination?.total || 0,
                pages: response.data.pagination?.pages || 0
            }));
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchCustomers();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            companyName: '',
            gstin: '',
            state: 'Tamilnadu',
            mobile: '',
            alternateNo: '',
            email: '',
            address: '',
            placeOfSupply: ''
        });
        setIsEditing(false);
        setSelectedCustomer(null);
    };

    const handleOpenModal = (customer = null) => {
        if (customer) {
            setFormData({
                companyName: customer.companyName || '',
                gstin: customer.gstin || '',
                state: customer.state || 'Tamilnadu',
                mobile: customer.mobile || '',
                alternateNo: customer.alternateNo || '',
                email: customer.email || '',
                address: customer.address || '',
                placeOfSupply: customer.placeOfSupply || ''
            });
            setSelectedCustomer(customer);
            setIsEditing(true);
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.companyName || !formData.mobile) {
            alert('Please fill Company Name and Mobile');
            return;
        }
        try {
            if (isEditing && selectedCustomer) {
                await customersAPI.update(selectedCustomer._id, formData);
            } else {
                await customersAPI.create(formData);
            }
            setShowModal(false);
            resetForm();
            fetchCustomers();
        } catch (error) {
            alert('Error saving customer: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteClick = (customer) => {
        setSelectedCustomer(customer);
        setShowDeleteConfirm(true);
    };

    const handleDelete = async () => {
        try {
            await customersAPI.delete(selectedCustomer._id);
            setShowDeleteConfirm(false);
            setSelectedCustomer(null);
            fetchCustomers();
        } catch (error) {
            alert('Error deleting customer: ' + (error.response?.data?.message || error.message));
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleLimitChange = (newLimit) => {
        setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                        <Users className="text-pink-600" size={20} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Customer Entry</h1>
                </div>
                <button
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium text-sm transition-colors"
                    style={{ backgroundColor: '#3b82f6' }}
                    onClick={() => handleOpenModal()}
                >
                    <Plus size={16} />
                    NEW CUSTOMER
                </button>
            </div>

            {/* Search Section */}
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-shrink-0 w-64">
                        <label className="form-label">Company Name</label>
                        <input
                            type="text"
                            placeholder="Enter company name"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="form-input"
                        />
                    </div>

                    <button
                        onClick={handleSearch}
                        disabled={isLoading}
                        className="btn btn-primary"
                    >
                        <Search size={16} />
                        Search
                    </button>
                    <button
                        onClick={() => { setSearchQuery(''); fetchCustomers(); }}
                        className="btn btn-ghost"
                    >
                        <X size={16} />
                        Clear
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-100 border-b-2 border-gray-300">
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">S No</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Company Name</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Mobile</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">GSTIN</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center">
                                        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#3b82f6', borderTopColor: 'transparent' }}></div>
                                    </td>
                                </tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-gray-500">
                                        No customers found. Click "NEW CUSTOMER" to add one.
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer, index) => (
                                    <tr key={customer._id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="py-3 px-4 text-gray-900">{(pagination.page - 1) * pagination.limit + index + 1}</td>
                                        <td className="py-3 px-4 text-blue-600 font-medium">{customer.companyName}</td>
                                        <td className="py-3 px-4 text-gray-900">{customer.mobile}</td>
                                        <td className="py-3 px-4 text-gray-900">{customer.email || '-'}</td>
                                        <td className="py-3 px-4 text-gray-900 font-mono text-sm">{customer.gstin || '-'}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                                    title="Download"
                                                >
                                                    <Download size={16} />
                                                </button>
                                                <button
                                                    className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                                    onClick={() => handleOpenModal(customer)}
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                    onClick={() => handleDeleteClick(customer)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50"
                            >
                                &lt;
                            </button>
                            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                const pageNum = Math.max(1, pagination.page - 2) + i;
                                if (pageNum > pagination.pages) return null;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`px-3 py-1 text-sm rounded ${pagination.page === pageNum ? 'text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                                        style={pagination.page === pageNum ? { backgroundColor: '#3b82f6' } : {}}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page >= pagination.pages}
                                className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50"
                            >
                                &gt;
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            {[10, 25, 50, 100].map(limit => (
                                <button
                                    key={limit}
                                    onClick={() => handleLimitChange(limit)}
                                    className={`px-3 py-1 text-sm rounded ${pagination.limit === limit ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {limit}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* New/Edit Customer Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 rounded-t-lg" style={{ backgroundColor: '#1e3a2f' }}>
                            <h3 className="text-lg font-semibold text-white">
                                {isEditing ? 'Edit Customer' : 'New Customer'}
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                                <input
                                    type="text"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    className="form-input w-full"
                                    placeholder="Enter company name"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                                    <input
                                        type="text"
                                        name="gstin"
                                        value={formData.gstin}
                                        onChange={handleInputChange}
                                        className="form-input w-full"
                                        placeholder="Enter GSTIN"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                        className="form-input w-full"
                                        placeholder="State"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone No *</label>
                                    <input
                                        type="text"
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={handleInputChange}
                                        className="form-input w-full"
                                        placeholder="Phone"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Alternate No</label>
                                    <input
                                        type="text"
                                        name="alternateNo"
                                        value={formData.alternateNo}
                                        onChange={handleInputChange}
                                        className="form-input w-full"
                                        placeholder="Alternate"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="form-input w-full"
                                        placeholder="Email"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className="form-input w-full resize-none"
                                    rows="2"
                                    placeholder="Enter address"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Place of Supply</label>
                                <input
                                    type="text"
                                    name="placeOfSupply"
                                    value={formData.placeOfSupply}
                                    onChange={handleInputChange}
                                    className="form-input w-full"
                                    placeholder="Enter place of supply"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium"
                                style={{ backgroundColor: '#3b82f6' }}
                            >
                                <Save size={16} />
                                SAVE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && selectedCustomer && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Customer</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete <strong>{selectedCustomer.companyName}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerEntryPage;
