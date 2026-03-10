import React, { useEffect, useState, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Briefcase, Building2, User, Clock, FileText, CheckCircle2,
    AlertCircle, ArrowLeft, Loader2, IndianRupee, MapPin, Send
} from 'lucide-react';

import { fetchApi } from '../lib/api';

// ─── Shared input style ──────────────────────────────────────────────────────
const inp = "w-full min-h-[56px] px-5 text-sm bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#ffdd66] focus:border-transparent placeholder:text-slate-400 text-[#1a1a1a] transition-all shadow-sm";
const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2 pl-2";

export default function BidForm() {
    const { projectId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [project, setProject] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);

    const [form, setForm] = useState({
        bid_amount: '',
        delivery_time: '',
        proposal: ''
    });

    useEffect(() => {
        (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            try {
                // Fetch profile
                const profData = await fetchApi(`/profiles/${session.user.id}`);
                setProfile(profData);
                
                // Safety check: if they are a contractor, they should use Apply form
                if (profData?.role === 'contractor') {
                    navigate(`/apply/${projectId}`);
                    return;
                }

                // Fetch project
                const projData = await fetchApi('/projects');
                const proj = (projData || []).find((p: any) => String(p.id) === String(projectId));
                if (proj) {
                    setProject(proj);
                }
            } catch (err) {
                console.error("Error fetching data for bid form:", err);
            }

            setLoading(false);
        })();
    }, [projectId, navigate]);

    const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        try {
            // Using /applications to be compatible with existing table for now, or new endpoint
            // The user requested a new table 'bids', so let's hit a /bids endpoint
            await fetchApi('/bids', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: session.user.id,
                    project_id: String(projectId),
                    status: 'pending',
                    bid_amount: form.bid_amount,
                    delivery_time: form.delivery_time,
                    proposal: form.proposal
                })
            });

            alert("Bid submitted successfully!");
            navigate('/dashboard');
        } catch (error: any) {
            console.error("Error bidding:", error);
            // If the /bids endpoint doesn't exist yet, we can try /applications as fallback for now
            // But we'll implement /bids in backend
            alert("Failed to submit bid. Please ensure the system is updated.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-[#f8f9f4]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1a1a1a]" />
            </div>
        );
    }

    return (
        <div className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto font-sans selection:bg-[#ffdd66] selection:text-black" style={{ background: 'linear-gradient(135deg, #f8f9f4 0%, #f0ebd8 50%, #fefcf3 100%)' }}>

            <div className="max-w-4xl mx-auto px-6 py-10">
                {/* ── Back Button ──────────────────────────────────────────────── */}
                <button onClick={() => navigate('/projects')} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#1a1a1a] transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Projects
                </button>

                {/* ── Header ───────────────────────────────────────────────────── */}
                <div className="mb-10">
                    <p className="text-sm font-bold tracking-[0.2em] text-cyan-600 uppercase mb-2">Startup Project Bid</p>
                    <h1 className="text-4xl md:text-5xl font-light tracking-tight text-[#1a1a1a] leading-tight max-w-2xl">
                        Place a <span className="font-medium text-cyan-700">Strategic Bid</span> for {project?.title || 'this project'}
                    </h1>
                    <div className="flex items-center gap-2 mt-4 text-[#1a1a1a]/60 font-medium">
                        <Building2 className="w-4 h-4" /> {project?.company || 'egisedge'}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 pb-20">

                    {/* ── Startup Details (Read-only aesthetic) ──────────── */}
                    <div className="bg-[#1a1a1a] rounded-[2rem] shadow-xl shadow-black/10 p-8 md:p-10 relative overflow-hidden flex flex-col md:flex-row gap-8 text-white">
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <Building2 className="w-5 h-5 text-cyan-400" /> Startup Credentials
                            </h2>
                            <p className="text-sm text-white/50 mb-8 max-w-sm">
                                Your startup's professional profile will be submitted alongside this financial bid.
                            </p>

                            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Company Name</p>
                                    <p className="text-sm font-medium text-white/90">{profile?.full_name || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Contact Email</p>
                                    <p className="text-sm font-medium text-white/90">{profile?.email}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">GST/Registration</p>
                                    <p className="text-sm font-medium text-white/90 uppercase">{profile?.gst_number || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Industry</p>
                                    <p className="text-sm font-medium text-white/90">{profile?.industry || '—'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Edit Nudge */}
                        <div className="md:w-64 bg-cyan-400/[0.03] border border-cyan-400/20 rounded-3xl p-6 flex flex-col justify-center items-start">
                            <AlertCircle className="w-6 h-6 text-cyan-400/30 mb-4" />
                            <p className="text-xs text-white/60 mb-4 leading-relaxed">
                                Ensure your portfolio and GST details are up to date to increase your winning chances.
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate('/profile')}
                                className="w-full py-2.5 rounded-full border border-white/20 text-xs font-bold text-white hover:bg-white/10 transition-colors"
                            >
                                Update Startup Profile
                            </button>
                        </div>
                    </div>

                    {/* ── Bid Specifics ────────────────────────────────────── */}
                    <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/50 shadow-sm p-8 md:p-10">
                        <h2 className="text-xl font-bold text-[#1a1a1a] mb-8">Financial & Timeline Bid</h2>

                        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">

                            {/* Bid Amount */}
                            <div>
                                <label className={labelCls}>Proposed Bid Amount *</label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-5 top-[18px] w-5 h-5 text-slate-400" />
                                    <input
                                        required
                                        type="text"
                                        value={form.bid_amount}
                                        onChange={set('bid_amount')}
                                        className={`${inp} pl-14 font-bold text-lg`}
                                        placeholder="e.g. ₹2,50,000 Total"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 px-2">Specify your total project quotation including taxes.</p>
                            </div>

                            {/* Delivery Time */}
                            <div>
                                <label className={labelCls}>Target Completion Time *</label>
                                <div className="relative">
                                    <Clock className="absolute left-5 top-[18px] w-5 h-5 text-slate-400" />
                                    <input
                                        required
                                        type="text"
                                        value={form.delivery_time}
                                        onChange={set('delivery_time')}
                                        className={`${inp} pl-14`}
                                        placeholder="e.g. 4 Weeks / 2 Months"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 px-2">Estimated duration to deliver final deliverables.</p>
                            </div>

                            {/* Proposal / Cover Letter */}
                            <div className="sm:col-span-2 mt-2">
                                <label className={labelCls}>Strategic Proposal & Execution Plan *</label>
                                <textarea
                                    required
                                    value={form.proposal}
                                    onChange={set('proposal')}
                                    rows={8}
                                    className={`${inp} resize-none h-auto py-5 leading-relaxed`}
                                    placeholder="Explain your startup's methodology, past project successes, and why you are uniquely qualified to execute this Oracle project..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Submit Button ────────────────────────────────────────────── */}
                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center justify-center gap-3 px-10 h-16 bg-[#1a1a1a] text-white text-lg font-bold rounded-full hover:bg-black hover:-translate-y-1 transition-all shadow-xl shadow-black/10 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed min-w-[220px]"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 text-cyan-400" />}
                            {saving ? 'Processing Bid…' : 'Submit Project Bid'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
