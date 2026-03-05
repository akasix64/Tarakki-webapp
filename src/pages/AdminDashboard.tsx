import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Plus, Users, Briefcase, Activity, X, Check, Trash2,
  LayoutDashboard, FolderOpen, ChevronRight, Bell, Settings,
  UserCircle, Menu, TrendingUp, ShieldCheck, Phone, CreditCard, Mail
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'users' | 'applications' | 'profile'>('overview');
  const [stats, setStats] = useState({ contractors: 0, startups: 0, projects: 0, applications: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '' });
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '', description: '', location: '', type: 'Contract', budget: '', tags: ''
  });
  const navigate = useNavigate();

  const fetchData = async () => {
    const { data: profilesData } = await supabase
      .from('profiles').select('*').order('created_at', { ascending: false });
    if (profilesData) {
      setUsers(profilesData);
      setStats(prev => ({
        ...prev,
        contractors: profilesData.filter(p => p.role === 'contractor').length,
        startups: profilesData.filter(p => p.role === 'startup').length,
      }));
    }
    const { data: projectsData } = await supabase
      .from('projects').select('*').order('created_at', { ascending: false });
    if (projectsData) {
      setProjects(projectsData);
      setStats(prev => ({ ...prev, projects: projectsData.length }));
    }
    const { data: appsData } = await supabase
      .from('applications')
      .select('id');
    if (appsData) {
      setStats(prev => ({ ...prev, applications: appsData.length }));
    }
  };

  const fetchApplications = async () => {
    setApplicationsLoading(true);
    const { data: rawApps } = await supabase
      .from('applications').select('*').order('created_at', { ascending: false });
    if (!rawApps || rawApps.length === 0) {
      setApplications([]);
      setApplicationsLoading(false);
      return;
    }
    const enriched = await Promise.all(rawApps.map(async (app) => {
      let profiles = null;
      let projects = null;
      if (app.user_id) {
        const { data: prof } = await supabase.from('profiles').select('full_name, email, role').eq('id', app.user_id).maybeSingle();
        if (prof) profiles = prof;
      }
      if (app.project_id) {
        const { data: proj } = await supabase.from('projects').select('title').eq('id', app.project_id).maybeSingle();
        if (proj) projects = proj;
      }
      return { ...app, profiles, projects };
    }));
    setApplications(enriched);
    setStats(prev => ({ ...prev, applications: enriched.length }));
    setApplicationsLoading(false);
  };

  useEffect(() => {
    fetchData();
    fetchApplications();
    // Fetch admin's own profile
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle().then(({ data, error }) => {
          console.log('Admin profile fetch:', data, 'Error:', error);
          if (data) {
            setAdminProfile(data);
            setProfileForm({ full_name: data.full_name || '', phone: data.phone || '' });
          } else {
            // fallback: use session user metadata
            const meta = session.user.user_metadata;
            const fallback = { id: session.user.id, email: session.user.email, full_name: meta?.full_name || '', role: meta?.role || '', phone: '' };
            setAdminProfile(fallback);
            setProfileForm({ full_name: fallback.full_name, phone: '' });
          }
        });
      }
    });
    const ps = supabase.channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchData).subscribe();
    const pj = supabase.channel('projects-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchData).subscribe();
    const pa = supabase.channel('applications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, fetchData).subscribe();
    return () => { supabase.removeChannel(ps); supabase.removeChannel(pj); supabase.removeChannel(pa); };
  }, []);

  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault();
    const tagsArray = newProject.tags.split(',').map(t => t.trim()).filter(Boolean);
    const { error } = await supabase.from('projects').insert([{
      title: newProject.title, description: newProject.description,
      location: newProject.location, type: newProject.type,
      budget: newProject.budget, tags: tagsArray, status: 'Open'
    }]);
    if (error) { alert('Failed to create project.'); }
    else {
      setIsProjectModalOpen(false);
      setNewProject({ title: '', description: '', location: '', type: 'Contract', budget: '', tags: '' });
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm('Delete this project?')) await supabase.from('projects').delete().eq('id', id);
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!adminProfile?.id) {
      alert('No profile loaded. Please refresh.');
      return;
    }
    const { error } = await supabase.from('profiles').upsert({
      id: adminProfile.id,
      full_name: profileForm.full_name,
      phone: profileForm.phone,
      email: adminProfile.email,
      role: adminProfile.role || 'admin',
    }, { onConflict: 'id' });
    if (error) {
      alert('Failed to save profile: ' + error.message);
    } else {
      setAdminProfile({ ...adminProfile, full_name: profileForm.full_name, phone: profileForm.phone });
      setIsEditingProfile(false);
    }
  };

  const totalUsers = stats.contractors + stats.startups;

  const avatar = (name: string, email: string, isDark: boolean = false) => {
    const letter = (name || email || '?')[0].toUpperCase();
    return (
      <div className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isDark ? 'bg-white/10 text-white border border-white/20' : 'bg-[#1a1a1a]/5 text-[#1a1a1a] border border-[#1a1a1a]/10'}`}>
        {letter}
      </div>
    );
  };

  const modalInputCls = "w-full h-14 px-5 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent placeholder:text-slate-400 text-[#1a1a1a] transition-all";

  return (
    <div className="w-full max-w-7xl mx-auto py-8">
      <div className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto font-sans selection:bg-[#ffdd66] selection:text-black" style={{ background: 'linear-gradient(135deg, #f8f9f4 0%, #f0ebd8 50%, #fefcf3 100%)' }}>

        {/* ── Top Navigation Pill Bar ────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md rounded-full p-1.5 shadow-sm border border-white/40 overflow-x-auto hide-scrollbar">
            <button onClick={() => setActiveTab('overview')} className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-[#1a1a1a] text-white shadow-md' : 'text-slate-500 hover:bg-white/50 hover:text-[#1a1a1a]'}`}>Overview</button>
            <button onClick={() => setActiveTab('projects')} className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'projects' ? 'bg-[#1a1a1a] text-white shadow-md' : 'text-slate-500 hover:bg-white/50 hover:text-[#1a1a1a]'}`}>Projects</button>
            <button onClick={() => setActiveTab('users')} className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-[#1a1a1a] text-white shadow-md' : 'text-slate-500 hover:bg-white/50 hover:text-[#1a1a1a]'}`}>Users</button>
            <button onClick={() => setActiveTab('applications')} className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'applications' ? 'bg-[#1a1a1a] text-white shadow-md' : 'text-slate-500 hover:bg-white/50 hover:text-[#1a1a1a]'}`}>Applications</button>
            <button onClick={() => setActiveTab('profile')} className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'profile' ? 'bg-[#ffdd66] text-[#1a1a1a] shadow-md' : 'text-slate-500 hover:bg-white/50 hover:text-[#1a1a1a]'}`}>Profile</button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsProjectModalOpen(true)} className="hidden md:flex px-6 py-2.5 rounded-full text-sm font-bold bg-[#ffdd66] text-[#1a1a1a] hover:bg-[#ffe17a] transition-all shadow-sm items-center gap-2 active:scale-95">
              <Plus className="w-4 h-4" /> Post Project
            </button>
            <button className="w-11 h-11 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-sm text-slate-500 hover:text-black transition-all">
              <Settings className="w-4 h-4" />
            </button>
            <button className="w-11 h-11 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-sm text-slate-500 hover:text-black transition-all relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#ffdd66] border border-white"></span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-20">

          {/* ── Header ────────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10 pt-4">
            <div>
              <h1 className="text-5xl md:text-6xl tracking-tight text-[#1a1a1a]">
                Admin <span className="font-bold">{adminProfile?.full_name || 'Dashboard'}</span>
              </h1>
            </div>
            <div className="flex items-end gap-12 pb-2">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-5xl font-light tracking-tighter text-[#1a1a1a]">
                  <Users className="w-6 h-6 text-slate-400" />
                  {totalUsers}
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Users</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-5xl font-light tracking-tighter text-[#1a1a1a]">
                  <Briefcase className="w-6 h-6 text-[#ffdd66]" />
                  {stats.projects}
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Projects</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-5xl font-light tracking-tighter text-[#1a1a1a] cursor-pointer hover:text-[#ffdd66] transition-colors" onClick={() => navigate('/manage-applications')}>
                  {stats.applications}
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2 cursor-pointer hover:text-[#1a1a1a]" onClick={() => navigate('/manage-applications')}>Applications</span>
              </div>
            </div>
          </div>

          {activeTab === 'overview' && (
            <>
              {/* ── Tracker Strip ──────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="col-span-1 md:col-span-3 bg-white/40 backdrop-blur-md rounded-full p-2 flex items-center border border-white/50 shadow-sm relative overflow-hidden h-14">
                  <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #1a1a1a 25%, transparent 25%, transparent 75%, #1a1a1a 75%, #1a1a1a)', backgroundPosition: '0 0, 8px 8px', backgroundSize: '16px 16px' }} />
                  <div className="relative z-10 flex gap-1 w-full h-full">
                    <div className="bg-[#1a1a1a] text-white text-xs font-semibold px-5 h-full rounded-full flex items-center gap-2 shadow-md transition-all whitespace-nowrap" style={{ width: totalUsers > 0 ? `${Math.max((stats.contractors / totalUsers) * 100, 15)}%` : '50%' }}>
                      Contractors <span className="opacity-50 font-medium ml-auto">{stats.contractors}</span>
                    </div>
                    <div className="bg-[#ffdd66] text-[#1a1a1a] text-xs font-semibold px-5 h-full rounded-full flex items-center gap-2 shadow-md transition-all whitespace-nowrap" style={{ width: totalUsers > 0 ? `${Math.max((stats.startups / totalUsers) * 100, 15)}%` : '50%' }}>
                      Startups <span className="opacity-50 font-medium ml-auto">{stats.startups}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsProjectModalOpen(true)} className="col-span-1 md:hidden h-14 bg-[#1a1a1a] hover:bg-black text-white text-sm font-bold rounded-full transition-all shadow-md flex items-center justify-center gap-2 border border-[#1a1a1a]">
                  <Plus className="w-4 h-4 text-[#ffdd66]" /> New Project
                </button>
              </div>

              {/* ── Stat Cards ──────────────────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Live Card (Gold accent) */}
                <div className="bg-white/60 backdrop-blur-md rounded-[2rem] p-8 border border-white/40 shadow-sm flex flex-col hover:border-white/80 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-[#ffdd66]/20 flex items-center justify-center mb-6">
                    <Activity className="w-6 h-6 text-[#ffdd66]" />
                  </div>
                  <h3 className="text-4xl font-light text-[#1a1a1a] mb-2 tracking-tight">Active</h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">System Status</p>
                  <div className="mt-auto pt-6 flex items-center gap-2">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffdd66] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#ffdd66]"></span>
                    </span>
                    <span className="text-xs font-bold text-slate-500">All logic operational</span>
                  </div>
                </div>

                {/* Users Overview block */}
                <div className="sm:col-span-2 lg:col-span-3 bg-[#1a1a1a] rounded-[2rem] p-8 md:p-10 shadow-xl shadow-black/10 relative overflow-hidden group border border-white/5">
                  <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none transition-transform group-hover:scale-110 duration-700" />
                  <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#ffdd66]/5 rounded-full blur-3xl pointer-events-none transition-transform group-hover:scale-110 duration-700" />

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-white font-semibold text-lg flex items-center gap-3">
                        <Users className="w-5 h-5 text-[#ffdd66]" /> Recent Registrations
                      </h3>
                      <button onClick={() => setActiveTab('users')} className="text-[10px] font-bold uppercase tracking-widest text-[#ffdd66] hover:text-white transition-colors">View All</button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {users.slice(0, 4).map((user) => (
                        <div key={user.id} className="flex gap-4 group cursor-pointer hover:bg-white/5 rounded-2xl p-3 -mx-2 transition-colors border border-transparent hover:border-white/10">
                          {avatar(user.full_name, user.email, true)}
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#ffdd66] transition-colors">{user.full_name || user.email}</h4>
                            <p className="text-[11px] text-white/50 mt-1 uppercase tracking-widest">{user.role}</p>
                          </div>
                          <div className="flex items-center">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${user.role === 'startup' ? 'bg-[#ffdd66]/10 text-[#ffdd66] border border-[#ffdd66]/20' : 'bg-white/10 text-white/80 border border-white/20'}`}>
                              {user.role}
                            </span>
                          </div>
                        </div>
                      ))}
                      {users.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-8 text-white/40">
                          <Users className="w-8 h-8 mb-2 opacity-50" />
                          <span className="text-sm">No users found</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </>
          )}

          {/* ── PROJECTS TAB ──────────────────────────────────────── */}
          {activeTab === 'projects' && (
            <div className="bg-[#1a1a1a] rounded-[2rem] shadow-xl shadow-black/10 overflow-hidden mb-8 border border-white/5 relative group">
              <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none transition-transform group-hover:scale-110 duration-700" />
              <div className="relative z-10">
                <div className="px-6 md:px-8 py-8 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-3"><FolderOpen className="w-5 h-5 text-[#ffdd66]" /> Project Management</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">{projects.length} Total Projects</p>
                  </div>
                  <button onClick={() => setIsProjectModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-[#ffdd66] text-[#1a1a1a] hover:bg-[#ffe17a] transition-all active:scale-95 shadow-md">
                    <Plus className="w-4 h-4" /> New Project
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        {['Project Name', 'Type / Location', 'Budget', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-6 md:px-8 py-5 text-left text-[10px] font-bold uppercase tracking-widest text-white/50">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {projects.map(p => (
                        <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 md:px-8 py-5">
                            <p className="text-sm font-bold text-white">{p.title}</p>
                            {p.tags?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {p.tags.slice(0, 2).map((tag: string) => (
                                  <span key={tag} className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-white/10 text-white/50 rounded-md border border-white/10">{tag}</span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-6 md:px-8 py-5">
                            <p className="text-sm font-semibold text-white/80">{p.type}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">{p.location}</p>
                          </td>
                          <td className="px-6 md:px-8 py-5 text-sm font-bold text-[#ffdd66] whitespace-nowrap">{p.budget}</td>
                          <td className="px-6 md:px-8 py-5">
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${p.status === 'Open'
                              ? 'bg-[#ffdd66]/10 text-[#ffdd66] border-[#ffdd66]/20'
                              : 'bg-white/10 text-white/50 border-white/10'
                              }`}>
                              {p.status || 'Open'}
                            </span>
                          </td>
                          <td className="px-6 md:px-8 py-5">
                            <button onClick={() => handleDeleteProject(p.id)} className="opacity-0 group-hover:opacity-100 p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {projects.length === 0 && (
                    <div className="py-24 text-center">
                      <FolderOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
                      <p className="text-sm font-bold text-white/50">No projects yet</p>
                      <button onClick={() => setIsProjectModalOpen(true)} className="mt-4 px-6 py-2.5 bg-[#ffdd66] text-[#1a1a1a] rounded-full text-xs font-bold tracking-wide hover:scale-105 transition-transform">
                        Create your first project
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── USERS TAB ─────────────────────────────────────────── */}
          {activeTab === 'users' && (
            <div className="bg-[#1a1a1a] rounded-[2rem] shadow-xl shadow-black/10 overflow-hidden mb-8 border border-white/5 relative group">
              <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none transition-transform group-hover:scale-110 duration-700" />
              <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#ffdd66]/5 rounded-full blur-3xl pointer-events-none transition-transform group-hover:scale-110 duration-700" />

              <div className="relative z-10">
                <div className="px-6 md:px-8 py-8 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">Registered Users</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">{users.length} Total Accounts</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        {['User Identity', 'Account Type', 'Membership', 'Date Joined'].map(h => (
                          <th key={h} className="px-6 md:px-8 py-5 text-left text-[10px] font-bold uppercase tracking-widest text-white/50">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map(user => (
                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 md:px-8 py-5">
                            <div className="flex items-center gap-4">
                              {avatar(user.full_name, user.email, true)}
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-white truncate">{user.full_name || 'Anonymous User'}</p>
                                <p className="text-[11px] text-white/40 truncate mt-0.5">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 md:px-8 py-5">
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${user.role === 'startup' ? 'bg-[#ffdd66]/10 text-[#ffdd66] border border-[#ffdd66]/20' : 'bg-white/10 text-white border border-white/20'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 md:px-8 py-5">
                            {user.is_member ? (
                              <span className="flex items-center gap-1.5 text-xs font-bold text-[#ffdd66]">
                                <ShieldCheck className="w-4 h-4" /> Pro Member
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Free Plan</span>
                            )}
                          </td>
                          <td className="px-6 md:px-8 py-5 text-[11px] font-semibold text-white/60 tracking-wider">
                            {new Date(user.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && (
                    <div className="py-24 text-center">
                      <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
                      <p className="text-sm font-bold text-white/50">No users found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── APPLICATIONS TAB ─────────────────────────────────────────── */}
          {activeTab === 'applications' && (
            <div className="bg-[#1a1a1a] rounded-[2rem] shadow-xl shadow-black/10 overflow-hidden mb-8 border border-white/5 relative group">
              <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="px-6 md:px-8 py-8 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-3"><Briefcase className="w-5 h-5 text-[#ffdd66]" /> All Applications</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">{applications.length} Total Applications</p>
                  </div>
                  <button onClick={fetchApplications} className="text-[10px] font-bold uppercase tracking-widest text-[#ffdd66] hover:text-white transition-colors">Refresh</button>
                </div>
                {applicationsLoading ? (
                  <div className="py-24 text-center text-white/40 text-sm font-bold">Loading applications...</div>
                ) : applications.length === 0 ? (
                  <div className="py-24 text-center">
                    <Briefcase className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-sm font-bold text-white/50">No applications found</p>
                    <p className="text-xs text-white/30 mt-2">Applications from contractors and startups will appear here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                          {['Applicant', 'Project', 'Cover Letter', 'Status', 'Date', 'Actions'].map(h => (
                            <th key={h} className="px-6 md:px-8 py-5 text-left text-[10px] font-bold uppercase tracking-widest text-white/50">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {applications.map(app => (
                          <tr key={app.id} className="hover:bg-white/5 transition-colors group">
                            <td className="px-6 md:px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#ffdd66]/20 border border-[#ffdd66]/30 flex items-center justify-center text-sm font-bold text-[#ffdd66] shrink-0">
                                  {(app.profiles?.full_name || app.profiles?.email || '?')[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-white">{app.profiles?.full_name || 'Unknown'}</p>
                                  <p className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5">{app.profiles?.role || '—'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 md:px-8 py-5">
                              <p className="text-sm font-semibold text-white/80">{app.projects?.title || 'Unknown Project'}</p>
                            </td>
                            <td className="px-6 md:px-8 py-5 max-w-[200px]">
                              <p className="text-xs text-white/50 line-clamp-2">{app.cover_letter || '—'}</p>
                            </td>
                            <td className="px-6 md:px-8 py-5">
                              <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${app.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                app.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                  'bg-[#ffdd66]/10 text-[#ffdd66] border border-[#ffdd66]/20'
                                }`}>{app.status || 'Pending'}</span>
                            </td>
                            <td className="px-6 md:px-8 py-5 text-[11px] text-white/50">
                              {app.created_at ? new Date(app.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                            <td className="px-6 md:px-8 py-5">
                              {(!app.status || app.status === 'pending') ? (
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    title="Approve"
                                    onClick={async () => {
                                      // Optimistic update: change badge immediately in UI
                                      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'approved' } : a));
                                      const { error } = await supabase.from('applications').update({ status: 'approved' }).eq('id', app.id);
                                      if (error) {
                                        console.error('Update failed:', error.message);
                                        // Revert if failed
                                        setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: app.status } : a));
                                        alert('Failed to update: ' + error.message);
                                        return;
                                      }
                                      await supabase.from('notifications').insert({
                                        user_id: app.user_id,
                                        title: '🎉 Application Approved!',
                                        message: `Your application for "${app.projects?.title || 'a project'}" has been approved by the admin.`,
                                        type: 'approved',
                                        is_read: false,
                                      });
                                    }}
                                    className="p-2 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                                  ><Check className="w-4 h-4" /></button>
                                  <button
                                    title="Reject"
                                    onClick={async () => {
                                      // Optimistic update: change badge immediately in UI
                                      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'rejected' } : a));
                                      const { error } = await supabase.from('applications').update({ status: 'rejected' }).eq('id', app.id);
                                      if (error) {
                                        console.error('Update failed:', error.message);
                                        // Revert if failed
                                        setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: app.status } : a));
                                        alert('Failed to update: ' + error.message);
                                        return;
                                      }
                                      await supabase.from('notifications').insert({
                                        user_id: app.user_id,
                                        title: '❌ Application Rejected',
                                        message: `Unfortunately, your application for "${app.projects?.title || 'a project'}" has been rejected.`,
                                        type: 'rejected',
                                        is_read: false,
                                      });
                                    }}
                                    className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                  ><X className="w-4 h-4" /></button>
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PROFILE TAB ─────────────────────────────────────────── */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Profile Card */}
              <div className="md:col-span-1 bg-[#1a1a1a] rounded-[2rem] p-8 shadow-xl shadow-black/10 flex flex-col items-center text-center border border-white/5 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#ffdd66]/5 rounded-full blur-3xl pointer-events-none" />
                <div className="w-24 h-24 rounded-full bg-[#ffdd66]/20 border-2 border-[#ffdd66]/40 flex items-center justify-center text-4xl font-bold text-[#ffdd66] mb-4 relative z-10 overflow-hidden">
                  {adminProfile?.avatar_url
                    ? <img src={adminProfile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    : (adminProfile?.full_name || 'A')[0].toUpperCase()}
                </div>
                <h3 className="text-xl font-bold text-white relative z-10">{adminProfile?.full_name || 'Admin User'}</h3>
                <span className="mt-2 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#ffdd66]/10 text-[#ffdd66] border border-[#ffdd66]/20 relative z-10">
                  {adminProfile?.role || 'admin'}
                </span>
                <p className="text-sm text-white/50 mt-3 relative z-10">{adminProfile?.email || '—'}</p>
              </div>

              {/* Details Panel */}
              <div className="md:col-span-2 bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/40 shadow-sm p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#1a1a1a]">Admin Details</h2>
                  {!isEditingProfile ? (
                    <button onClick={() => setIsEditingProfile(true)} className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#1a1a1a] text-white hover:bg-black transition-all flex items-center gap-2 active:scale-95">
                      <Settings className="w-3.5 h-3.5" /> Edit Profile
                    </button>
                  ) : (
                    <button onClick={() => setIsEditingProfile(false)} className="px-5 py-2.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all active:scale-95">
                      Cancel
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  <form id="profile-edit-form" onSubmit={handleSaveProfile} className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2 pl-2">Full Name</label>
                      <input type="text" value={profileForm.full_name} onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })} className={modalInputCls} placeholder="Your full name" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2 pl-2">Mobile Number</label>
                      <input type="tel" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className={modalInputCls} placeholder="+91 9XXXXXXXXX" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2 pl-2">Employee ID <span className="normal-case font-normal text-slate-400">(auto-generated)</span></label>
                      <div className={`${modalInputCls} bg-slate-100 text-slate-500 cursor-not-allowed font-mono flex items-center`}>
                        {adminProfile?.id?.slice(0, 8).toUpperCase() || '—'}
                      </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button type="submit" className="px-8 py-3 text-sm font-bold text-[#1a1a1a] bg-[#ffdd66] rounded-full hover:bg-[#ffe17a] hover:scale-105 active:scale-95 transition-all shadow-md flex items-center gap-2">
                        <Check className="w-4 h-4" /> Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Username */}
                      <div className="bg-white/70 rounded-2xl p-5 border border-white/60">
                        <div className="flex items-center gap-2 mb-3">
                          <UserCircle className="w-4 h-4 text-slate-400" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Full Name</span>
                        </div>
                        <p className="text-lg font-bold text-[#1a1a1a]">{adminProfile?.full_name || '—'}</p>
                      </div>

                      {/* Role */}
                      <div className="bg-white/70 rounded-2xl p-5 border border-white/60">
                        <div className="flex items-center gap-2 mb-3">
                          <ShieldCheck className="w-4 h-4 text-slate-400" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Role</span>
                        </div>
                        <p className="text-lg font-bold text-[#1a1a1a] capitalize">{adminProfile?.role || 'Admin'}</p>
                      </div>

                      {/* Mobile */}
                      <div className="bg-white/70 rounded-2xl p-5 border border-white/60">
                        <div className="flex items-center gap-2 mb-3">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mobile Number</span>
                        </div>
                        <p className="text-lg font-bold text-[#1a1a1a]">{adminProfile?.phone || '—'}</p>
                      </div>

                      {/* Employee ID */}
                      <div className="bg-white/70 rounded-2xl p-5 border border-white/60">
                        <div className="flex items-center gap-2 mb-3">
                          <CreditCard className="w-4 h-4 text-slate-400" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Employee ID</span>
                        </div>
                        <p className="text-lg font-bold text-[#1a1a1a] font-mono">{adminProfile?.employee_id || adminProfile?.id?.slice(0, 8).toUpperCase() || '—'}</p>
                      </div>

                      {/* Email */}
                      <div className="col-span-1 sm:col-span-2 bg-white/70 rounded-2xl p-5 border border-white/60">
                        <div className="flex items-center gap-2 mb-3">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email Address</span>
                        </div>
                        <p className="text-lg font-bold text-[#1a1a1a]">{adminProfile?.email || '—'}</p>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-[#1a1a1a]/5 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Member Since</p>
                        <p className="text-sm font-bold text-[#1a1a1a] mt-1">
                          {adminProfile?.created_at ? new Date(adminProfile.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                        </p>
                      </div>
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffdd66] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#ffdd66]"></span>
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Modal ───────────────────────────────────────────────────────── */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#1a1a1a]/40 backdrop-blur-md">
          <div className="bg-white w-full sm:max-w-xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[95dvh] sm:max-h-[90vh]">

            {/* Modal header */}
            <div className="px-8 pt-8 pb-6 border-b border-[#1a1a1a]/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center shadow-lg shadow-black/10">
                  <Plus className="w-5 h-5 text-[#ffdd66]" />
                </div>
                <div>
                  <h2 className="text-2xl font-light tracking-tight text-[#1a1a1a]">Post Project</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Admin Creation</p>
                </div>
              </div>
              <button onClick={() => setIsProjectModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-[#1a1a1a] transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="overflow-y-auto flex-1 p-8">
              <form id="project-form" onSubmit={handleCreateProject} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2 pl-2">Project Title</label>
                  <input required type="text" value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })} className={modalInputCls} placeholder="e.g. Oracle Cloud Migration" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2 pl-2">Description</label>
                  <textarea required value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} rows={4} className={`${modalInputCls} resize-none h-auto py-4`} placeholder="Describe the project requirements..." />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2 pl-2">Location</label>
                    <input required type="text" value={newProject.location} onChange={e => setNewProject({ ...newProject, location: e.target.value })} className={modalInputCls} placeholder="Remote, Bangalore…" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2 pl-2">Type</label>
                    <select value={newProject.type} onChange={e => setNewProject({ ...newProject, type: e.target.value })} className={`${modalInputCls} cursor-pointer`}>
                      <option>Contract</option><option>Full-time</option><option>Part-time</option><option>Project-based</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2 pl-2">Budget / Rate</label>
                  <input required type="text" value={newProject.budget} onChange={e => setNewProject({ ...newProject, budget: e.target.value })} className={modalInputCls} placeholder="₹50,000/month or ₹5,00,000 fixed" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2 pl-2">Tags <span className="normal-case font-normal">(comma-separated)</span></label>
                  <input type="text" value={newProject.tags} onChange={e => setNewProject({ ...newProject, tags: e.target.value })} className={modalInputCls} placeholder="Oracle DBA, OCI, Migration" />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-[#1a1a1a]/5 flex justify-end gap-3 shrink-0 bg-slate-50/80 backdrop-blur-sm">
              <button onClick={() => setIsProjectModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-[#1a1a1a] transition-colors rounded-full">
                Cancel
              </button>
              <button type="submit" form="project-form" className="px-8 py-3 text-sm font-bold text-[#1a1a1a] bg-[#ffdd66] rounded-full hover:bg-[#ffe17a] hover:scale-105 active:scale-95 transition-all shadow-md">
                Post Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}