import { Mail, Phone, Trash2, UserRound, Pencil } from 'lucide-react';

const users = [
    { name: 'Dharani', role: 'user', email: 'rockingtamilanda@gmail.com', phone: '8825629104', joined: '05/03/2026' },
    { name: 'Arun', role: 'user', email: 'test@example.com', phone: '9876543210', joined: '02/03/2026' },
    { name: 'Dharani', role: 'user', email: 'bharanidharanb.24mca@kongu.edu', phone: '8825629104', joined: '01/03/2026' },
    { name: 'UMAPATHY A', role: 'user', email: 'umapathy6990@gmail.com', phone: '9965784888', joined: '06/02/2026' },
    { name: 'INIYAN B', role: 'user', email: 'iniyanb.24mca@kongu.edu', phone: '6381738601', joined: '06/02/2026' },
    { name: 'Admin User', role: 'admin', email: 'arunum.24mca@kongu.edu', phone: '6379777230', joined: 'Invalid Date' },
];

const avatarBg = ['bg-amber-500', 'bg-slate-500', 'bg-emerald-500', 'bg-blue-500', 'bg-rose-500', 'bg-indigo-500'];

const UsersPage = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col gap-1">
                <p className="text-sm text-gray-600">Manage your customer database</p>
                <h1 className="text-2xl font-bold text-gray-900">Registered Users</h1>
            </div>

            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden" style={{ borderColor: 'var(--border-soft)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead style={{ backgroundColor: '#dbeafe' }} className="text-left">
                            <tr className="text-xs uppercase tracking-wide text-blue-900">
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Contact Info</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Joined Date</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, idx) => (
                                <tr key={user.email} className="border-b last:border-b-0 hover:bg-[#eff6ff]" style={{ borderColor: 'var(--border-soft)' }}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center font-bold ${avatarBg[idx % avatarBg.length]}`}>
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                                                <p className="text-xs text-gray-600">{user.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col text-sm text-gray-700 gap-1">
                                            <span className="flex items-center gap-2 text-gray-800"><Mail size={14} /> {user.email}</span>
                                            <span className="flex items-center gap-2 text-gray-800"><Phone size={14} /> {user.phone}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
                                            <UserRound size={16} className="text-gray-600" />
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                                        {user.joined}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="action-btn action-btn-blue" aria-label="Edit user">
                                                <Pencil size={16} />
                                            </button>
                                            <button className="action-btn action-btn-red" aria-label="Delete user">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UsersPage;
