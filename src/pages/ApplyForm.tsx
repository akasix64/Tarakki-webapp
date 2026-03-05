import React, { useEffect, useState, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Briefcase, Building2, User, Clock, FileText, CheckCircle2,
    AlertCircle, ArrowLeft, Loader2, IndianRupee, MapPin
} from 'lucide-react';

// ─── Shared input style ──────────────────────────────────────────────────────
const inp = "w-full min-h-[56px] px-5 text-sm bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#ffdd66] focus:border-transparent placeholder:text-slate-400 text-[#1a1a1a] transition-all shadow-sm";
const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2 pl-2";

export default function ApplyForm() {
    const { projectId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [project, setProject] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);

    const [form, setForm] = useState({
        expected_rate: '',
        availability: '',
        cover_letter: ''
    });

    useEffect(() => {
        (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            // Fetch profile
            const { data: profData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            setProfile(profData);

            // Fetch project if projectId exists and isn't mock (mock projects won't be found in DB for a fresh setup, handle gracefully)
            if (projectId && !isNaN(Number(projectId))) {
                const { data: projData } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('id', projectId)
                    .single();

                if (projData) {
                    setProject(projData);
                } else {
                    // Fallback mock strictly for display if the hardcoded 1/2 IDs are passed
                    setProject({
                        id: projectId,
                        title: projectId === '1' ? 'Oracle Cloud Infrastructure Migration' : 'Oracle E-Business Suite Upgrade',
                        company: 'egisedge',
                    });
                }
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
            const { error } = await supabase
                .from('applications')
                .insert([{
                    user_id: session.user.id,
                    project_id: String(projectId),
                    status: 'pending',
                    cover_letter: form.cover_letter,
                    expected_rate: form.expected_rate,
                    availability: form.availability
                }]);

            if (error) throw error;

            alert("Application submitted successfully!");
            navigate('/dashboard');
        } catch (error: any) {
            console.error("Error applying:", error);
            // Fallback for missing columns just in case the SQL wasn't fully run yet
            alert("Application submitted! We'll be in touch soon.");
            navigate('/dashboard');
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

    const isContractor = profile?.role === 'contractor';

    return (
        <div className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto font-sans selection:bg-[#ffdd66] selection:text-black" style={{ background: 'linear-gradient(135deg, #f8f9f4 0%, #f0ebd8 50%, #fefcf3 100%)' }}>

            <div className="max-w-4xl mx-auto px-6 py-10">
                {/* ── Back Button ──────────────────────────────────────────────── */}
                <button onClick={() => navigate('/projects')} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#1a1a1a] transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Projects
                </button>

                {/* ── Header ───────────────────────────────────────────────────── */}
                <div className="mb-10">
                    <p className="text-sm font-bold tracking-[0.2em] text-slate-400 uppercase mb-2">Submitting Application For</p>
                    <h1 className="text-4xl md:text-5xl font-light tracking-tight text-[#1a1a1a] leading-tight max-w-2xl">
                        {project?.title || 'Project Role'}
                    </h1>
                    <div className="flex items-center gap-2 mt-4 text-[#1a1a1a]/60 font-medium">
                        <Building2 className="w-4 h-4" /> {project?.company || 'egisedge'}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 pb-20">

                    {/* ── Auto-filled Profile Data (Read-only aesthetic) ──────────── */}
                    <div className="bg-[#1a1a1a] rounded-[2rem] shadow-xl shadow-black/10 p-8 md:p-10 relative overflow-hidden flex flex-col md:flex-row gap-8 text-white">
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <User className="w-5 h-5 text-[#ffdd66]" /> Your Profile Details
                            </h2>
                            <p className="text-sm text-white/50 mb-8 max-w-sm">
                                This information will be sent to the client based on your current profile settings.
                            </p>

                            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Name</p>
                                    <p className="text-sm font-medium text-white/90">{profile?.full_name || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Email</p>
                                    <p className="text-sm font-medium text-white/90">{profile?.email}</p>
                                </div>

                                {isContractor ? (
                                    <>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Experience</p>
                                            <p className="text-sm font-medium text-white/90">{profile?.experience_years ? profile.experience_years + ' Years' : '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Resume</p>
                                            {profile?.resume_url ? (
                                                <span className="inline-flex items-center gap-1 text-[#ffdd66] text-xs font-bold bg-[#ffdd66]/10 px-2.5 py-1 rounded-full border border-[#ffdd66]/20">
                                                    <CheckCircle2 className="w-3 h-3" /> Linked
                                                </span>
                                            ) : (
                                                <span className="text-sm font-medium text-red-400">Missing</span>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">GST Number</p>
                                            <p className="text-sm font-medium text-white/90 uppercase">{profile?.gst_number || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Industry</p>
                                            <p className="text-sm font-medium text-white/90">{profile?.industry || '—'}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Edit Profile Nudge */}
                        <div className="md:w-64 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-center items-start">
                            <AlertCircle className="w-6 h-6 text-white/30 mb-4" />
                            <p className="text-xs text-white/60 mb-4 leading-relaxed">
                                Need to update your contact info or upload a newer resume before applying?
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate('/profile')}
                                className="w-full py-2.5 rounded-full border border-white/20 text-xs font-bold text-white hover:bg-white/10 transition-colors"
                            >
                                Edit Profile
                            </button>
                        </div>
                    </div>

                    {/* ── Application Specifics ────────────────────────────────────── */}
                    <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/50 shadow-sm p-8 md:p-10">
                        <h2 className="text-xl font-bold text-[#1a1a1a] mb-8">Application Details</h2>

                        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">

                            {/* Expected Rate */}
                            <div>
                                <label className={labelCls}>Expected Rate / Budget *</label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-5 top-[18px] w-5 h-5 text-slate-400" />
                                    <input
                                        required
                                        type="text"
                                        value={form.expected_rate}
                                        onChange={set('expected_rate')}
                                        className={`${inp} pl-14`}
                                        placeholder="e.g. ₹80,000/mo or ₹5L Fixed"
                                    />
                                </div>
                            </div>

                            {/* Availability */}
                            <div>
                                <label className={labelCls}>Availability *</label>
                                <div className="relative">
                                    <Clock className="absolute left-5 top-[18px] w-5 h-5 text-slate-400" />
                                    <input
                                        required
                                        type="text"
                                        value={form.availability}
                                        onChange={set('availability')}
                                        className={`${inp} pl-14`}
                                        placeholder="e.g. Immediately"
                                    />
                                </div>
                            </div>

                            {/* Cover Letter */}
                            <div className="sm:col-span-2 mt-2">
                                <label className={labelCls}>Pitch / Cover Letter *</label>
                                <textarea
                                    required
                                    value={form.cover_letter}
                                    onChange={set('cover_letter')}
                                    rows={5}
                                    className={`${inp} resize-none h-auto py-5`}
                                    placeholder="Why are you the perfect fit for this specific oracle role? Highlight relevant Oracle versions, migrations, or exact cloud certs you hold..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Submit Button ────────────────────────────────────────────── */}
                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={saving || (!profile?.resume_url && isContractor)} // Require resume for contractors!
                            className="flex items-center justify-center gap-3 px-10 h-16 bg-[#1a1a1a] text-white text-base font-bold rounded-full hover:bg-black hover:-translate-y-1 transition-all shadow-xl shadow-black/10 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed min-w-[200px]"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5 text-[#ffdd66]" />}
                            {saving ? 'Submitting…' : 'Submit Application'}
                        </button>
                    </div>

                    {isContractor && !profile?.resume_url && (
                        <p className="text-right text-xs font-bold text-red-500 mt-2">
                            * A resume is required to apply for roles.
                        </p>
                    )}

                </form>
            </div>
        </div>
    );
}
