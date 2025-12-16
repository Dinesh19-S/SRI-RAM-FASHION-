import { useState, useEffect } from 'react';
import { Hash, Plus, Search, Edit, Trash2, X, Save } from 'lucide-react';
import { hsnAPI } from '../services/api';

const HSNPage = () => {
    const [hsnList, setHsnList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedHSN, setSelectedHSN] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
    const [formData, setFormData] = useState({
        hsnCode: '',
        gstRate: ''
    });

    useEffect(() => {
        fetchHSN();
    }, [pagination.page, pagination.limit]);

    const fetchHSN = async () => {
        setIsLoading(true);
        try {
            const response = await hsnAPI.getAll({
                search: searchQuery,
                page: pagination.page,
                limit: pagination.limit
            });
            setHsnList(response.data.data || []);
            setPagination(prev => ({
                ...prev,
                total: response.data.pagination?.total || 0,
                pages: response.data.pagination?.pages || 0
            }));
        } catch (error) {
            console.error('Error fetching HSN:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchHSN();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({ hsnCode: '', gstRate: '' });
        setIsEditing(false);
        setSelectedHSN(null);
    };

    const handleOpenModal = (hsn = null) => {
        if (hsn) {
            setFormData({
                hsnCode: hsn.hsnCode || '',
                gstRate: hsn.gstRate !== undefined ? hsn.gstRate : ''
            });
            setSelectedHSN(hsn);
            setIsEditing(true);
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.hsnCode) {
            alert('Please enter HSN Code');
            return;
        }
        try {
            if (isEditing && selectedHSN) {
                await hsnAPI.update(selectedHSN._id, formData);
            } else {
                await hsnAPI.create(formData);
            }
            setShowModal(false);
            resetForm();
            fetchHSN();
        } catch (error) {
            alert('Error saving HSN: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteClick = (hsn) => {
        setSelectedHSN(hsn);
        setShowDeleteConfirm(true);
    };

    const handleDelete = async () => {
        try {
            await hsnAPI.delete(selectedHSN._id);
            setShowDeleteConfirm(false);
            setSelectedHSN(null);
            fetchHSN();
        } catch (error) {
            alert('Error deleting HSN: ' + (error.response?.data?.message || error.message));
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
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#dbeafe' }}>
                        <Hash style={{ color: '#1e40af' }} size={20} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">HSN</h1>
                </div>
                <button
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium text-sm transition-colors"
                    style={{ backgroundColor: '#d4a853' }}
                    onClick={() => handleOpenModal()}
                >
                    <Plus size={16} />
                    NEW HSN
                </button>
            </div>

            {/* Search Section */}
            <div className="card py-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-shrink-0">
                        <label className="block text-xs font-medium text-gray-600 mb-1">HSN Code</label>
                        <input
                            type="text"
                            placeholder="Enter HSN code"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="form-input w-48 text-sm py-1.5"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                        style={{ backgroundColor: '#3b82f6' }}
                    >
                        <Search size={14} />
                        SEARCH
                    </button>
                    <button
                        onClick={() => { setSearchQuery(''); fetchHSN(); }}
                        className="px-3 py-1.5 text-gray-500 hover:text-gray-700 font-medium text-sm"
                    >
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
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">HSN Code</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">GST</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="py-8 text-center">
                                        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#3b82f6', borderTopColor: 'transparent' }}></div>
                                    </td>
                                </tr>
                            ) : hsnList.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-8 text-center text-gray-500">
                                        No HSN codes found. Click "NEW HSN" to add one.
                                    </td>
                                </tr>
                            ) : (
                                hsnList.map((hsn, index) => (
                                    <tr key={hsn._id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="py-3 px-4 text-gray-900">{(pagination.page - 1) * pagination.limit + index + 1}</td>
                                        <td className="py-3 px-4 text-gray-900 font-mono">{hsn.hsnCode}</td>
                                        <td className="py-3 px-4 text-gray-900">{hsn.gstRate}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                                    onClick={() => handleOpenModal(hsn)}
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                    onClick={() => handleDeleteClick(hsn)}
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

            {/* New/Edit HSN Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 rounded-t-lg" style={{ backgroundColor: '#1e3a5f' }}>
                            <h3 className="text-lg font-semibold text-white">
                                {isEditing ? 'Edit HSN' : 'New HSN'}
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
                                <input
                                    type="text"
                                    name="hsnCode"
                                    value={formData.hsnCode}
                                    onChange={handleInputChange}
                                    className="form-input w-full"
                                    placeholder="Enter HSN code"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">GST %</label>
                                <input
                                    type="number"
                                    name="gstRate"
                                    value={formData.gstRate}
                                    onChange={handleInputChange}
                                    className="form-input w-full"
                                    placeholder="Enter GST rate"
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
            {showDeleteConfirm && selectedHSN && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete HSN</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete HSN <strong>{selectedHSN.hsnCode}</strong>? This action cannot be undone.
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

export default HSNPage;
