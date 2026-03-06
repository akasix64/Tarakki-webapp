import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { fetchApi } from '../lib/api';
import {
    Briefcase,
    ChevronLeft,
    Search,
    Check,
    X,
    UserCircle
} from 'lucide-react';

export default function ManageApplications() {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const navigate = useNavigate();

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const data = await fetchApi('/applications');
            setApplications(data || []);
        } catch (err: any) {
            console.error('Error fetching applications:', err);
            alert('Failed to fetch applications: ' + err.message);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchApplications();
        const pa = supabase.channel('applications-changes-manage')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, fetchApplications).subscribe();
        return () => { supabase.removeChannel(pa); };
    }, []);

    const handleUpdateStatus = async (appId: string, newStatus: string) => {
        try {
            await fetchApi(`/applications/${appId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });

            // Optimistically update the local state
            setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
        } catch (err: any) {
            console.error(err);
            alert('Failed to update status: ' + err.message);
        }
    };

    const avatar = (name: string, email: string) => {
        const letter = (name || email || '?')[0].toUpperCase();
        return (
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-[#1a1a1a]/5 text-[#1a1a1a] border border-[#1a1a1a]/10">
                {letter}
            </div>
        );
    };

    const filteredApps = applications.filter(app => {
        const matchesSearch =
            app.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.projects?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.project_id?.toLowerCase().includes(searchQuery.toLowerCase());

        const appStatusLower = app.status?.toLowerCase() || 'pending';
        const filterLower = statusFilter.toLowerCase();

        const matchesStatus = filterLower === 'all' || appStatusLower === filterLower;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="w-full max-w-7xl mx-auto py-8">
            <div className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto font-sans selection:bg-[#ffdd66] selection:text-black bg-slate-50/50">

                <div className="max-w-7xl mx-auto px-6 py-8">

                    {/* ── Header ────────────────────────────────────────────── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm text-slate-500 hover:text-[#1a1a1a] hover:border-slate-300 transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-light tracking-tight text-[#1a1a1a]">
                                    Manage <span className="font-bold">Applications</span>
                                </h1>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                                    Global Overview
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Filter / Search Bar ───────────────────────────────── */}
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-4 mb-8 flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search candidates or projects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                            {['All', 'Pending', 'Accepted', 'Rejected'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === status
                                        ? 'bg-[#1a1a1a] text-[#ffdd66] shadow-md'
                                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-[#1a1a1a]'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Applications Table ────────────────────────────────── */}
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                        {['Applicant', 'Project', 'Proposed Rate', 'Cover Letter', 'Status', 'Actions'].map(h => (
                                            <th key={h} className="px-6 py-5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center">
                                                <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-[#1a1a1a] animate-spin mx-auto mb-4"></div>
                                                <p className="text-sm font-bold text-slate-500">Loading applications...</p>
                                            </td>
                                        </tr>
                                    ) : filteredApps.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center">
                                                <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                                <p className="text-sm font-bold text-slate-500">No applications found matching your criteria</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredApps.map(app => (
                                            <tr key={app.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        {avatar(app.profiles?.full_name, app.profiles?.email)}
                                                        <div>
                                                            <p className="text-sm font-bold text-[#1a1a1a]">{app.profiles?.full_name || 'Anonymous'}</p>
                                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{app.profiles?.role}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-sm font-semibold text-[#1a1a1a]/80 max-w-[200px] truncate" title={app.projects?.title || app.project_id}>
                                                        {app.projects?.title || `Project ID: ${app.project_id}`}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-sm font-bold text-[#1a1a1a] whitespace-nowrap">
                                                        {app.expected_rate || <span className="text-slate-400 text-xs italic font-normal">Not specified</span>}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-xs text-slate-500 max-w-[250px] line-clamp-2" title={app.cover_letter}>
                                                        {app.cover_letter || <span className="italic">No cover letter</span>}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${app.status?.toLowerCase() === 'pending' ? 'bg-[#ffdd66]/20 text-[#1a1a1a] border border-[#ffdd66]/50' :
                                                        app.status?.toLowerCase() === 'accepted' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                                            'bg-slate-100 text-slate-600 border border-slate-200'
                                                        }`}>
                                                        {app.status || 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    {app.status?.toLowerCase() === 'pending' && (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleUpdateStatus(app.id, 'accepted')}
                                                                className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                                                                title="Accept Application"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateStatus(app.id, 'rejected')}
                                                                className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors"
                                                                title="Reject Application"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {app.status?.toLowerCase() !== 'pending' && (
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                            Resolved
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
