import React, { useEffect, useState, useRef, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import {
    User, Building2, Upload, CheckCircle2, AlertCircle,
    Briefcase, Phone, MapPin, Globe, FileText, Hash,
    Save, Loader2, X, Settings, Bell, Camera, Sparkles, Zap
} from 'lucide-react';
import { fetchApi } from '../lib/api';

// ─── Shared input style ──────────────────────────────────────────────────────
const inp = "w-full h-14 px-5 text-sm bg-white/40 backdrop-blur-md border border-white/50 rounded-full focus:outline-none focus:ring-2 focus:ring-[#ffdd66] focus:border-transparent placeholder:text-slate-400 text-[#1a1a1a] transition-all shadow-sm";

interface Toast { type: 'success' | 'error'; msg: string }

export default function Profile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [toast, setToast] = useState<Toast | null>(null);
    const [role, setRole] = useState<string>('contractor');
    const [avatarUrl, setAvatarUrl] = useState<string>('');
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // ── Form state ─────────────────────────────────────────────────────────────
    const [form, setForm] = useState({
        full_name: '',
        email: '',
        phone: '',
        location: '',
        website: '',
        about: '',
        // Contractor
        resume_url: '',
        experience_years: '',
        skills: '',
        // Startup
        gst_number: '',
        company_size: '',
        industry: '',
        founded_year: '',
    });

    const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(f => ({ ...f, [k]: e.target.value }));

    // ── Load existing profile ──────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            try {
                const data = await fetchApi(`/profiles/${session.user.id}`);

                if (data) {
                    setRole(data.role || 'contractor');
                    setAvatarUrl(data.avatar_url || '');
                    setAvatarPreview(data.avatar_url || '');
                    setForm({
                        full_name: data.full_name || '',
                        email: data.email || session.user.email || '',
                        phone: data.phone || '',
                        location: data.location || '',
                        website: data.website || '',
                        about: data.about || '',
                        resume_url: data.resume_url || '',
                        experience_years: data.experience_years ? String(data.experience_years) : '',
                        skills: Array.isArray(data.skills) ? data.skills.join(', ') : (data.skills || ''),
                        gst_number: data.gst_number || '',
                        company_size: data.company_size || '',
                        industry: data.industry || '',
                        founded_year: data.founded_year ? String(data.founded_year) : '',
                    });
                }
            } catch (err) {
                // Not found - use fallbacks from Metadata or LocalStorage
                const meta = session.user.user_metadata;
                const pendRole = localStorage.getItem('pending_role');
                const pendName = localStorage.getItem('pending_name');
                const pendGst = localStorage.getItem('pending_gst');

                const initialRole = meta?.role || pendRole || 'contractor';
                const initialName = meta?.full_name || pendName || '';
                const initialGst = meta?.gst_number || pendGst || '';

                setRole(initialRole);
                setForm(f => ({
                    ...f,
                    email: session.user.email || '',
                    full_name: initialName,
                    gst_number: initialGst
                }));

                // Clear temporary storage once picked up
                if (pendRole) localStorage.removeItem('pending_role');
                if (pendName) localStorage.removeItem('pending_name');
                if (pendGst) localStorage.removeItem('pending_gst');
            }
            setLoading(false);
        })();
    }, []);

    // ── Show toast ─────────────────────────────────────────────────────────────
    const showToast = (t: Toast) => {
        setToast(t);
        setTimeout(() => setToast(null), 3500);
    };

    // ── Resume upload ──────────────────────────────────────────────────────────
    const handleResumeUpload = async (file: File) => {
        if (!file) return;
        const allowed = ['application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowed.includes(file.type)) {
            showToast({ type: 'error', msg: 'Only PDF or Word files are allowed.' });
            return;
        }

        setUploading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const path = `${session?.user.id}/${Date.now()}_${file.name}`;

        const { error } = await supabase.storage.from('resumes').upload(path, file, { upsert: true });
        if (error) {
            showToast({ type: 'error', msg: 'Upload failed. Make sure the resumes bucket exists in Supabase Storage.' });
            setUploading(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(path);
        setForm(f => ({ ...f, resume_url: publicUrl }));
        showToast({ type: 'success', msg: 'Resume uploaded! You can now auto-fill your profile with AI.' });
        setUploading(false);
    };

    // ── AI Resume Parse (Gemini) ─────────────────────────────────────────────
    const handleAIParse = async () => {
        if (!form.resume_url) {
            showToast({ type: 'error', msg: 'Please upload a resume first.' });
            return;
        }

        setParsing(true);
        try {
            const result = await fetchApi('/parse-resume', {
                method: 'POST',
                body: JSON.stringify({
                    resume_url: form.resume_url,
                    role: role,
                }),
            });

            if (result?.parsed) {
                const p = result.parsed;
                setForm(f => ({
                    ...f,
                    full_name: p.full_name || f.full_name,
                    email: p.email || f.email,
                    phone: p.phone || f.phone,
                    location: p.location || f.location,
                    website: p.website || f.website,
                    about: p.about || f.about,
                    // Contractor fields
                    experience_years: p.experience_years || f.experience_years,
                    skills: p.skills || f.skills,
                    // Startup fields
                    gst_number: p.gst_number || f.gst_number,
                    industry: p.industry || f.industry,
                    company_size: p.company_size || f.company_size,
                    founded_year: p.founded_year || f.founded_year,
                }));
                showToast({ type: 'success', msg: 'Profile auto-filled from your document! Review and save.' });
            } else {
                showToast({ type: 'error', msg: 'Could not parse the document. Please fill in manually.' });
            }
        } catch (err) {
            showToast({ type: 'error', msg: (err as Error).message || 'AI parsing failed.' });
        }
        setParsing(false);
    };

    // ── Avatar upload ──────────────────────────────────────────────────────
    const handleAvatarUpload = async (file: File) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showToast({ type: 'error', msg: 'Only image files are allowed.' });
            return;
        }
        // Local preview instantly
        const previewUrl = URL.createObjectURL(file);
        setAvatarPreview(previewUrl);
        setAvatarUploading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const ext = file.name.split('.').pop();
        const path = `${session?.user.id}/avatar.${ext}`;
        const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
        if (error) {
            showToast({ type: 'error', msg: 'Avatar upload failed. Make sure the "avatars" bucket exists in Supabase Storage.' });
            setAvatarUploading(false);
            return;
        }
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
        setAvatarUrl(publicUrl);
        // Save to profiles immediately
        if (session) {
            try {
                await fetchApi(`/profiles/${session.user.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ avatar_url: publicUrl })
                });
            } catch (e) {
                console.error("Failed to update avatar in DB:", e);
            }
        }
        showToast({ type: 'success', msg: 'Profile photo updated!' });
        setAvatarUploading(false);
    };

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setSaving(false); return; }

        const payload: Record<string, any> = {
            id: session.user.id,
            role,
            full_name: form.full_name,
            email: form.email,
            phone: form.phone || null,
            location: form.location || null,
            website: form.website || null,
            about: form.about || null,
            avatar_url: avatarUrl || null,
        };

        if (role === 'contractor') {
            payload.resume_url = form.resume_url || null;
            payload.experience_years = form.experience_years ? parseInt(form.experience_years) : null;
            payload.skills = form.skills
                ? form.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
                : null;
        } else {
            payload.gst_number = form.gst_number || null;
            payload.company_size = form.company_size || null;
            payload.industry = form.industry || null;
            payload.founded_year = form.founded_year ? parseInt(form.founded_year) : null;
        }

        try {
            await fetchApi(`/profiles/${session.user.id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            showToast({ type: 'success', msg: 'Profile saved successfully!' });
        } catch (err) {
            showToast({ type: 'error', msg: (err as Error).message });
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-[#f8f9f4]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1a1a1a]" />
            </div>
        );
    }

    const isContractor = role === 'contractor';

    return (
        <div className="w-full max-w-7xl mx-auto py-8">
            <div className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto font-sans selection:bg-[#ffdd66] selection:text-black" style={{ background: 'linear-gradient(135deg, #f8f9f4 0%, #f0ebd8 50%, #fefcf3 100%)' }}>

                {/* ── Top Navigation Pill Bar ────────────────────────────────────────── */}
                <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md rounded-full p-1.5 shadow-sm border border-white/40">
                        <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 rounded-full text-sm font-semibold text-slate-500 hover:bg-white/50 hover:text-[#1a1a1a] transition-all">Dashboard</button>
                        <button onClick={() => navigate('/projects')} className="px-6 py-2.5 rounded-full text-sm font-semibold text-slate-500 hover:bg-white/50 hover:text-[#1a1a1a] transition-all">Projects</button>
                        <button className="px-6 py-2.5 rounded-full text-sm font-semibold bg-[#1a1a1a] text-white">Profile</button>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="w-11 h-11 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-sm text-slate-500 hover:text-black transition-all">
                            <Settings className="w-4 h-4" />
                        </button>
                        <button className="w-11 h-11 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-sm text-slate-500 hover:text-black transition-all relative">
                            <Bell className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-6 pb-24">

                    {/* Toast */}
                    {toast && (
                        <div className={`fixed top-36 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-sm font-bold transition-all ${toast.type === 'success' ? 'bg-[#ffdd66] text-black border border-[#e6c75c]' : 'bg-[#1a1a1a] text-white'}`}>
                            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
                            <span>{toast.msg}</span>
                            <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100 transition">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Page header */}
                    <div className="mb-10 pt-4 flex items-center gap-6">
                        {/* Clickable Avatar */}
                        <div className="relative shrink-0 group/avatar" onClick={() => avatarInputRef.current?.click()} style={{ cursor: 'pointer' }}>
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-[#1a1a1a] flex items-center justify-center shadow-lg shadow-black/10 border-4 border-white">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    isContractor ? <User className="w-9 h-9 text-[#ffdd66]" /> : <Building2 className="w-9 h-9 text-[#ffdd66]" />
                                )}
                            </div>
                            {/* Camera overlay */}
                            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                {avatarUploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#ffdd66] border-2 border-white flex items-center justify-center shadow-md">
                                <Camera className="w-3.5 h-3.5 text-[#1a1a1a]" />
                            </div>
                        </div>
                        {/* Hidden file input */}
                        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }} />
                        <div>
                            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-[#1a1a1a]">My Profile</h1>
                            <p className="text-sm font-bold tracking-[0.2em] text-slate-400 uppercase mt-2">
                                {role === 'contractor' ? 'Contractor Account' : role === 'startup' ? 'Startup Account' : `${role} Account`}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">Click the photo to update your avatar</p>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">

                        {/* ── Basic Info ──────────────────────────────────────────────────── */}
                        <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/50 shadow-sm p-8 md:p-10">
                            <h2 className="text-xl font-bold text-[#1a1a1a] mb-8">General Information</h2>

                            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2 pl-2">
                                        {isContractor ? 'Full Name' : 'Company Name'} *
                                    </label>
                                    <div className="relative">
                                        {isContractor
                                            ? <User className="absolute left-5 top-[18px] w-5 h-5 text-slate-400" />
                                            : <Building2 className="absolute left-5 top-[18px] w-5 h-5 text-slate-400" />
                                        }
                                        <input required type="text" value={form.full_name} onChange={set('full_name')}
                                            className={`${inp} pl-14`} placeholder={isContractor ? 'e.g. Rahul Sharma' : 'e.g. TechVentures Pvt Ltd'} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2 pl-2">Email *</label>
                                    <input required type="email" value={form.email} onChange={set('email')}
                                        className={inp} placeholder="you@example.com" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2 pl-2">Phone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-5 top-[18px] w-5 h-5 text-slate-400" />
                                        <input type="tel" value={form.phone} onChange={set('phone')}
                                            className={`${inp} pl-14`} placeholder="+91 98765 43210" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2 pl-2">Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-5 top-[18px] w-5 h-5 text-slate-400" />
                                        <input type="text" value={form.location} onChange={set('location')}
                                            className={`${inp} pl-14`} placeholder="Mumbai, India" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2 pl-2">Website / LinkedIn</label>
                                    <div className="relative">
                                        <Globe className="absolute left-5 top-[18px] w-5 h-5 text-slate-400" />
                                        <input type="url" value={form.website} onChange={set('website')}
                                            className={`${inp} pl-14`} placeholder="https://linkedin.com/in/you" />
                                    </div>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2 pl-2">
                                        {isContractor ? 'About You' : 'Company Description'}
                                    </label>
                                    <textarea value={form.about} onChange={set('about')} rows={4}
                                        className={`${inp} resize-none h-auto py-4 rounded-3xl`}
                                        placeholder={isContractor
                                            ? 'Tell startups about your background and expertise…'
                                            : 'Describe what your startup does, its mission and vision…'} />
                                </div>
                            </div>
                        </div>

                        {/* ── CONTRACTOR section (Dark Theme) ─────────────────────────────── */}
                        {isContractor && (
                            <div className="bg-[#1a1a1a] rounded-[2rem] shadow-xl shadow-black/10 p-8 md:p-10 relative overflow-hidden group border border-white/5">
                                {/* Glow effects */}
                                <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none transition-transform group-hover:scale-110 duration-700" />
                                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#ffdd66]/5 rounded-full blur-3xl pointer-events-none transition-transform group-hover:scale-110 duration-700" />

                                <div className="relative z-10">
                                    <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                                        <Briefcase className="w-5 h-5 text-[#ffdd66]" /> Contractor Details
                                    </h2>

                                    <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2 pl-2">Years of Experience</label>
                                            <input type="number" min="0" max="60" value={form.experience_years} onChange={set('experience_years')}
                                                className="w-full h-14 px-5 text-sm bg-white/5 border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-[#ffdd66] focus:border-transparent placeholder:text-slate-500 text-white transition-all shadow-sm" placeholder="e.g. 5" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2 pl-2">
                                                Skills <span className="normal-case font-normal">(comma-separated)</span>
                                            </label>
                                            <input type="text" value={form.skills} onChange={set('skills')}
                                                className="w-full h-14 px-5 text-sm bg-white/5 border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-[#ffdd66] focus:border-transparent placeholder:text-slate-500 text-white transition-all shadow-sm" placeholder="Oracle DBA, Cloud, Python" />
                                        </div>

                                        {/* Resume Upload */}
                                        <div className="sm:col-span-2 mt-4">
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-3 pl-2">Resume / CV</label>

                                            {/* Upload area */}
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border border-dashed border-white/20 bg-white/5 rounded-3xl p-8 text-center cursor-pointer hover:border-[#ffdd66] hover:bg-white/10 transition-all group/upload"
                                            >
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    className="hidden"
                                                    accept=".pdf,.doc,.docx"
                                                    onChange={e => e.target.files?.[0] && handleResumeUpload(e.target.files[0])}
                                                />
                                                {uploading ? (
                                                    <div className="flex flex-col items-center gap-3">
                                                        <Loader2 className="w-8 h-8 text-[#ffdd66] animate-spin" />
                                                        <p className="text-sm text-white/70 font-bold uppercase tracking-widest">Uploading…</p>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="w-14 h-14 rounded-full bg-white/10 group-hover/upload:bg-[#ffdd66] flex items-center justify-center transition-colors">
                                                            <Upload className="w-5 h-5 text-white/60 group-hover/upload:text-black transition-colors" />
                                                        </div>
                                                        <p className="text-lg font-light text-white tracking-tight">Click to upload your resume</p>
                                                        <p className="text-xs font-bold text-white/40 uppercase tracking-widest">PDF or Word · Max 5MB</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Current file link + AI Parse button */}
                                            {form.resume_url && (
                                                <div className="mt-4 space-y-3">
                                                    <div className="flex items-center gap-3 px-5 py-3.5 bg-[#ffdd66]/10 rounded-2xl border border-[#ffdd66]/20">
                                                        <FileText className="w-5 h-5 text-[#ffdd66] shrink-0" />
                                                        <a href={form.resume_url} target="_blank" rel="noopener noreferrer"
                                                            className="text-sm text-white font-medium hover:text-[#ffdd66] hover:underline truncate flex-1 transition-colors">
                                                            {form.resume_url.split('/').pop() || 'View uploaded resume'}
                                                        </a>
                                                        <CheckCircle2 className="w-5 h-5 text-[#ffdd66] shrink-0" />
                                                    </div>
                                                    {/* AI Auto-Fill Button */}
                                                    <button
                                                        type="button"
                                                        onClick={handleAIParse}
                                                        disabled={parsing}
                                                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#ffdd66] to-[#ffcc33] text-[#1a1a1a] font-bold text-sm rounded-2xl hover:shadow-lg hover:shadow-[#ffdd66]/20 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0"
                                                    >
                                                        {parsing ? (
                                                            <><Loader2 className="w-5 h-5 animate-spin" /> Parsing with AI…</>
                                                        ) : (
                                                            <><Sparkles className="w-5 h-5" /> Auto-Fill Profile with AI<Zap className="w-4 h-4" /></>
                                                        )}
                                                    </button>
                                                </div>
                                            )}

                                            {/* Or paste URL */}
                                            <div className="mt-6">
                                                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 pl-2">Or paste a link (Drive, Dropbox…)</label>
                                                <input type="url" value={form.resume_url} onChange={set('resume_url')}
                                                    className="w-full h-14 px-5 text-sm bg-white/5 border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-[#ffdd66] focus:border-transparent placeholder:text-slate-500 text-white transition-all shadow-sm" placeholder="https://drive.google.com/…" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── STARTUP section (Dark Theme) ────────────────────────────────── */}
                        {!isContractor && (
                            <div className="bg-[#1a1a1a] rounded-[2rem] shadow-xl shadow-black/10 p-8 md:p-10 relative overflow-hidden group border border-white/5">
                                {/* Glow effects */}
                                <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none transition-transform group-hover:scale-110 duration-700" />
                                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#ffdd66]/5 rounded-full blur-3xl pointer-events-none transition-transform group-hover:scale-110 duration-700" />

                                <div className="relative z-10">
                                    <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                                        <Building2 className="w-5 h-5 text-[#ffdd66]" /> Startup Details
                                    </h2>
                                    <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2 pl-2">GST Number</label>
                                            <div className="relative">
                                                <Hash className="absolute left-5 top-[18px] w-5 h-5 text-slate-500" />
                                                <input type="text" value={form.gst_number} onChange={set('gst_number')}
                                                    maxLength={15}
                                                    className="w-full h-14 pl-14 pr-5 text-sm bg-white/5 border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-[#ffdd66] focus:border-transparent placeholder:text-slate-500 text-white transition-all shadow-sm uppercase"
                                                    placeholder="22AAAAA0000A1Z5" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2 pl-2">Industry</label>
                                            <input type="text" value={form.industry} onChange={set('industry')}
                                                className="w-full h-14 px-5 text-sm bg-white/5 border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-[#ffdd66] focus:border-transparent placeholder:text-slate-500 text-white transition-all shadow-sm" placeholder="e.g. SaaS, FinTech, Healthcare" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2 pl-2">Company Size</label>
                                            <select value={form.company_size} onChange={set('company_size')} className="w-full h-14 px-5 text-sm bg-white/5 border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-[#ffdd66] focus:border-transparent text-white transition-all shadow-sm cursor-pointer [&>option]:text-black">
                                                <option value="">Select size…</option>
                                                <option>1–10</option>
                                                <option>11–50</option>
                                                <option>51–200</option>
                                                <option>201–500</option>
                                                <option>500+</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2 pl-2">Founded Year</label>
                                            <input type="number" min="1990" max={new Date().getFullYear()} value={form.founded_year} onChange={set('founded_year')}
                                                className="w-full h-14 px-5 text-sm bg-white/5 border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-[#ffdd66] focus:border-transparent placeholder:text-slate-500 text-white transition-all shadow-sm" placeholder="e.g. 2021" />
                                        </div>

                                        {/* Company Documents Upload */}
                                        <div className="sm:col-span-2 mt-4">
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-3 pl-2">Company Documents</label>
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border border-dashed border-white/20 bg-white/5 rounded-3xl p-8 text-center cursor-pointer hover:border-[#ffdd66] hover:bg-white/10 transition-all group/upload"
                                            >
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    className="hidden"
                                                    accept=".pdf,.doc,.docx"
                                                    onChange={e => e.target.files?.[0] && handleResumeUpload(e.target.files[0])}
                                                />
                                                {uploading ? (
                                                    <div className="flex flex-col items-center gap-3">
                                                        <Loader2 className="w-8 h-8 text-[#ffdd66] animate-spin" />
                                                        <p className="text-sm text-white/70 font-bold uppercase tracking-widest">Uploading…</p>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="w-14 h-14 rounded-full bg-white/10 group-hover/upload:bg-[#ffdd66] flex items-center justify-center transition-colors">
                                                            <Upload className="w-5 h-5 text-white/60 group-hover/upload:text-black transition-colors" />
                                                        </div>
                                                        <p className="text-lg font-light text-white tracking-tight">Click to upload company documents</p>
                                                        <p className="text-xs font-bold text-white/40 uppercase tracking-widest">PDF or Word · Max 5MB</p>
                                                    </div>
                                                )}
                                            </div>
                                            {form.resume_url && (
                                                <div className="mt-4 space-y-3">
                                                    <div className="flex items-center gap-3 px-5 py-3.5 bg-[#ffdd66]/10 rounded-2xl border border-[#ffdd66]/20">
                                                        <FileText className="w-5 h-5 text-[#ffdd66] shrink-0" />
                                                        <a href={form.resume_url} target="_blank" rel="noopener noreferrer"
                                                            className="text-sm text-white font-medium hover:text-[#ffdd66] hover:underline truncate flex-1 transition-colors">
                                                            {form.resume_url.split('/').pop() || 'View uploaded document'}
                                                        </a>
                                                        <CheckCircle2 className="w-5 h-5 text-[#ffdd66] shrink-0" />
                                                    </div>
                                                    {/* AI Auto-Fill Button */}
                                                    <button
                                                        type="button"
                                                        onClick={handleAIParse}
                                                        disabled={parsing}
                                                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#ffdd66] to-[#ffcc33] text-[#1a1a1a] font-bold text-sm rounded-2xl hover:shadow-lg hover:shadow-[#ffdd66]/20 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0"
                                                    >
                                                        {parsing ? (
                                                            <><Loader2 className="w-5 h-5 animate-spin" /> Parsing with AI…</>
                                                        ) : (
                                                            <><Sparkles className="w-5 h-5" /> Auto-Fill Profile with AI<Zap className="w-4 h-4" /></>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                            <div className="mt-6">
                                                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 pl-2">Or paste a link (Drive, Dropbox…)</label>
                                                <input type="url" value={form.resume_url} onChange={set('resume_url')}
                                                    className="w-full h-14 px-5 text-sm bg-white/5 border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-[#ffdd66] focus:border-transparent placeholder:text-slate-500 text-white transition-all shadow-sm" placeholder="https://drive.google.com/…" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Save button */}
                        <div className="flex justify-end pt-6">
                            <button
                                type="submit"
                                disabled={saving || uploading}
                                className="flex items-center justify-center gap-3 px-10 h-16 bg-[#1a1a1a] text-white text-base font-bold rounded-full hover:bg-black hover:-translate-y-1 transition-all shadow-xl shadow-black/10 disabled:opacity-60 disabled:hover:translate-y-0 min-w-[200px]"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 text-[#ffdd66]" />}
                                {saving ? 'Saving…' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
