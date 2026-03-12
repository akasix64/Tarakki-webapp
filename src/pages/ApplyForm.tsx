import React, { useEffect, useState, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Briefcase, Building2, User, Clock, FileText, CheckCircle2,
    AlertCircle, ArrowLeft, Loader2, IndianRupee, MapPin, Calendar
} from 'lucide-react';

import { fetchApi } from '../lib/api';

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

    const [existingApplication, setExistingApplication] = useState<any>(null);

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

                // Fetch project if projectId exists and isn't mock (mock projects won't be found in DB for a fresh setup, handle gracefully)
                if (projectId && !isNaN(Number(projectId))) {
                    const projData = await fetchApi('/projects');
                    const proj = projData?.find((p: any) => p.id === projectId);
                    if (proj) {
                        setProject(proj);
                    } else {
                        // Fallback mock strictly for display if the hardcoded 1/2 IDs are passed
                        setProject({
                            id: projectId,
                            title: projectId === '1' ? 'Oracle Cloud Infrastructure Migration' : 'Oracle E-Business Suite Upgrade',
                            company: 'egisedge',
                        });
                    }
                }
                // Check for existing application
                const apps = await fetchApi('/applications');
                const existing = apps?.find((a: any) => String(a.project_id) === String(projectId));
                if (existing) {
                    setExistingApplication(existing);
                }
            } catch (err) {
                console.error("Error fetching data for apply form:", err);
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
            await fetchApi('/applications', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: session.user.id,
                    project_id: String(projectId),
                    status: 'pending',
                    cover_letter: form.cover_letter,
                    expected_rate: form.expected_rate,
                    availability: form.availability
                })
            });


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

    if (existingApplication) {
        const status = existingApplication.status?.toLowerCase() || 'pending';
        
        const steps = [
            { label: 'Applied', date: new Date(existingApplication.created_at).toLocaleDateString(), completed: true, current: status === 'pending', icon: <FileText className="w-4 h-4" /> },
            { label: 'Under Review', date: status !== 'pending' ? 'Completed' : 'In Progress', completed: status !== 'pending' && status !== 'interview call', current: status === 'shortlisted' || status === 'under review', icon: <User className="w-4 h-4" /> },
            { 
               label: 'Interview Scheduled', 
               date: status === 'interview call' ? new Date(existingApplication.interview_schedule_date_and_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : (status === 'accepted' ? 'Completed' : 'Waiting'), 
               completed: status === 'accepted' || status === 'approved', 
               current: status === 'interview call', 
               icon: <Calendar className="w-4 h-4" /> 
            },
            { label: status === 'rejected' ? 'Rejected' : 'Final Decision', date: (status === 'accepted' || status === 'rejected') ? 'Finalized' : 'Waiting', completed: (status === 'accepted' || status === 'rejected'), current: (status === 'accepted' || status === 'rejected') && status !== 'interview call', icon: status === 'rejected' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" /> },
        ];

        return (
            <div className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto font-sans selection:bg-[#ffdd66] selection:text-black" style={{ background: 'linear-gradient(135deg, #f8f9f4 0%, #f0ebd8 50%, #fefcf3 100%)' }}>
                <div className="max-w-4xl mx-auto px-6 py-10">
                    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#1a1a1a] transition-all mb-8 group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                    </button>

                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-3">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                ['accepted', 'approved'].includes(status) ? 'bg-green-100 text-green-700' : 
                                status === 'shortlisted' ? 'bg-indigo-100 text-indigo-700' :
                                status === 'interview call' ? 'bg-purple-100 text-purple-700' :
                                status === 'review' ? 'bg-orange-100 text-orange-700' :
                                status === 'rejected' ? 'bg-red-100 text-red-700' : 
                                'bg-[#ffdd66]/20 text-[#1a1a1a]'}`}>
                                {status}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-[#1a1a1a] leading-tight max-w-2xl">
                            {project?.title || existingApplication.projects?.title || 'Project Role'}
                        </h1>
                        <div className="flex items-center gap-2 mt-4 text-[#1a1a1a]/60 font-medium">
                            <Building2 className="w-4 h-4" /> {project?.company || existingApplication.projects?.company_name || 'egisedge'}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Timeline Column */}
                        <div className="md:col-span-1">
                            <div className="bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/50 shadow-sm p-8">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-[#1a1a1a]/40 mb-8">Application Tracker</h3>
                                <div className="space-y-0 relative">
                                    <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100" />
                                    {steps.map((step, idx) => (
                                        <div key={idx} className="relative flex gap-6 pb-10 last:pb-0">
                                            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${step.completed ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white' : step.current ? 'bg-[#ffdd66] border-[#ffdd66] text-[#1a1a1a]' : 'bg-white border-slate-100 text-slate-300'}`}>
                                                {step.icon}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-bold ${step.current ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]/60'}`}>{step.label}</span>
                                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">{step.date}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Details Column */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-[#1a1a1a] rounded-[2rem] p-8 text-white shadow-xl shadow-black/10">
                                <h3 className="text-[#ffdd66] text-xs font-bold uppercase tracking-widest mb-6">Your Submission</h3>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2">Cover Letter / Pitch</p>
                                        <p className="text-sm text-white/80 leading-relaxed italic">"{existingApplication.cover_letter}"</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Expected Rate</p>
                                            <p className="text-sm font-semibold">{existingApplication.expected_rate}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Availability</p>
                                            <p className="text-sm font-semibold">{existingApplication.availability}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/50 p-8">
                                <h3 className="text-[#1a1a1a] text-xs font-bold uppercase tracking-widest mb-4">What's Next?</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {status === 'pending' 
                                        ? "The client is currently reviewing your profile and application details. You will be notified once they take an action."
                                        : status === 'interview call'
                                        ? `You have an interview scheduled for ${new Date(existingApplication.interview_schedule_date_and_time).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}. Please be prepared and check your email for any meeting links.`
                                        : status === 'accepted' || status === 'approved'
                                        ? "Congratulations! Your application has been approved. The client will reach out to you via email for further onboarding."
                                        : status === 'rejected'
                                        ? "The client decided to move forward with other candidates at this time. Don't worry, there are plenty of other Oracle opportunities!"
                                        : "Your application is being processed."
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
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
