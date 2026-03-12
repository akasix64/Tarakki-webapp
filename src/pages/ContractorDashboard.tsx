import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Briefcase,
  CheckCircle,
  Clock,
  ArrowRight,
  MapPin,
  Settings,
  Bell,
  Search,
  Check,
  X,
  Bookmark,
  Calendar,
  TrendingUp,
  FolderCheck,
  CreditCard,
  AlertCircle,
  ChevronRight,
  Zap
} from 'lucide-react';

import { fetchApi } from '../lib/api';

export default function ContractorDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [aiMatches, setAiMatches] = useState<any[] | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [savedProjects, setSavedProjects] = useState<any[]>([]);

  // Load saved projects from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('saved_projects');
    if (saved) {
      try { setSavedProjects(JSON.parse(saved)); } catch(e) {}
    }
  }, []);

  const isMemberActive = (p: any) => {
    if (!p?.is_member) return false;
    // Strict check: Only active if a date exists (prevents bulk activation errors)
    if (!p?.subscription_date) return false; 
    const subDate = new Date(p.subscription_date);
    const expDate = new Date(subDate);
    expDate.setFullYear(expDate.getFullYear() + 1);
    return new Date() < expDate;
  };

  const isActive = isMemberActive(profile);

  // ─── Caching & Hydration ──────────────────────────────────────────────────
  const CACHE_KEY = `contractor_cache_${profile?.id || 'anonymous'}`;

  // Initial Load from LocalStorage
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { profile, applications, notifications } = JSON.parse(cached);
        if (profile) setProfile(profile);
        if (applications) setApplications(applications);
        if (notifications) setNotifications(notifications);
      } catch (e) { console.error("Cache Hydration Error:", e); }
    }
  }, [CACHE_KEY]);

  const saveToCache = (data: any) => {
    const current = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...current, ...data }));
  };

  useEffect(() => {
    let appsChannel: ReturnType<typeof supabase.channel> | null = null;
    let notifsChannel: ReturnType<typeof supabase.channel> | null = null;

    const initDashboard = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;

      const fetchProfile = async () => {
        const profileData = await fetchApi(`/profiles/${userId}`);
        if (profileData) {
          setProfile(profileData);
          saveToCache({ profile: profileData });
        }
      };

      const fetchApplications = async () => {
        const appsData = await fetchApi('/applications');
        if (appsData) {
          const myApps = appsData.filter((a: any) => a.user_id === userId);
          setApplications(myApps);
          saveToCache({ applications: myApps });
        }
      };

      const fetchNotifs = async () => {
        const notifsData = await fetchApi('/notifications');
        if (notifsData) {
          setNotifications(notifsData);
          saveToCache({ notifications: notifsData });
        }
      };

      // Initial Refresh in background
      fetchProfile();
      fetchApplications();
      fetchNotifs();

      // Real-time: refresh application counts whenever status changes
      appsChannel = supabase
        .channel('contractor-apps-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'applications', filter: `user_id=eq.${userId}` },
          () => fetchApplications())
        .subscribe();

      notifsChannel = supabase
        .channel('contractor-notifs-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          () => fetchNotifs())
        .subscribe();
    };

    initDashboard();

    return () => {
      if (appsChannel) supabase.removeChannel(appsChannel);
      if (notifsChannel) supabase.removeChannel(notifsChannel);
    };
  }, []);

  // Close notification panel when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const total = applications.length;
  const accepted = applications.filter(a => ['accepted', 'approved'].includes(a.status?.toLowerCase())).length;
  const shortlisted = applications.filter(a => a.status?.toLowerCase() === 'shortlisted').length;
  const review = applications.filter(a => a.status?.toLowerCase() === 'review').length;
  const interviews = applications.filter(a => a.status?.toLowerCase() === 'interview call').length;
  const rejected = applications.filter(a => a.status?.toLowerCase() === 'rejected').length;
  const pending = applications.filter(a => !a.status || a.status?.toLowerCase() === 'pending').length;

  const activeContracts = applications.filter(a => ['accepted', 'approved'].includes(a.status?.toLowerCase()));
  const incomingInterviews = applications.filter(a => ['shortlisted', 'interview call'].includes(a.status?.toLowerCase()));
  
  // Market trends data based on Oracle Ecosystem
  const marketTrends = [
    { skill: 'Oracle OCI', demand: '+42%', projects: 124 },
    { skill: 'Oracle Cloud ERP', demand: '+28%', projects: 89 },
    { skill: 'NetSuite Admin', demand: '+15%', projects: 56 }
  ];

  const handleAiMatch = async () => {
    if (!profile?.id) return;
    setIsMatching(true);
    setAiMatches(null);
    try {
      const resp = await fetchApi(`/ai-match/${profile.id}`, {
        method: 'POST',
        body: JSON.stringify({ role: 'contractor' })
      });
      if (resp?.matches) {
        setAiMatches(resp.matches);
      } else {
        setAiMatches([]);
      }
    } catch (e) {
      console.error(e);
      setAiMatches([]);
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="w-full mx-auto py-8">
      <div className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto font-sans selection:bg-[#ffdd66] selection:text-black" style={{ background: 'linear-gradient(135deg, #f8f9f4 0%, #f0ebd8 50%, #fefcf3 100%)' }}>

        {/* ── Top Navigation Pill Bar ────────────────────────────────────────── */}
        <div className="w-full max-w-[96%] mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md rounded-full p-1.5 shadow-sm border border-white/40">
            <button className="px-6 py-2.5 rounded-full text-sm font-semibold bg-[#1a1a1a] text-white">Dashboard</button>
            <button onClick={() => navigate('/projects')} className="px-6 py-2.5 rounded-full text-sm font-semibold text-slate-500 hover:bg-white/50 hover:text-[#1a1a1a] transition-all">Projects</button>
            <button onClick={() => navigate('/profile')} className="px-6 py-2.5 rounded-full text-sm font-semibold text-slate-500 hover:bg-white/50 hover:text-[#1a1a1a] transition-all">Profile</button>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-11 h-11 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-sm text-slate-500 hover:text-black transition-all">
              <Settings className="w-4 h-4" />
            </button>
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button onClick={() => setShowNotifications(v => !v)} className="w-11 h-11 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-sm text-slate-500 hover:text-black transition-all relative">
                <Bell className="w-4 h-4" />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-14 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#1a1a1a]">Notifications</h3>
                    {notifications.length > 0 && (
                      <button onClick={async () => {
                        try {
                          await fetchApi('/notifications/clear-all', { method: 'DELETE' });
                          setNotifications([]);
                        } catch (e) {
                          console.error("Failed to clear all notifications");
                        }
                      }} className="text-[10px] font-bold text-slate-400 hover:text-[#1a1a1a] uppercase tracking-widest">Clear all</button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center text-sm text-slate-400">No notifications yet</div>
                    ) : notifications.map(n => (
                      <div key={n.id} className={`px-5 py-4 flex gap-3 items-start cursor-pointer hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-[#fffbea]' : ''}`}
                        onClick={async () => {
                          try {
                            await fetchApi('/notifications/read-all', { method: 'PUT' });
                            setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
                          } catch (e) {
                            console.error("Failed to read");
                          }
                        }}>
                        <span className={`mt-0.5 shrink-0 w-2 h-2 rounded-full ${n.type === 'approved' ? 'bg-green-400' : 'bg-red-400'}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#1a1a1a] leading-snug">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1.5">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full max-w-[96%] mx-auto px-6 pb-20">

          {/* ── Header & Big Stats ────────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10 pt-4">
            <div>
              <h1 className="text-5xl md:text-6xl tracking-tight text-[#1a1a1a]">
                Welcome back, <span className="font-medium">{profile?.full_name || 'Contractor'}</span>
              </h1>
            </div>
            <div className="flex items-end gap-12 pb-2">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-5xl font-light tracking-tighter text-[#1a1a1a]">
                  <Briefcase className="w-6 h-6 text-slate-400" />
                  {total}
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Applications</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-5xl font-light tracking-tighter text-[#1a1a1a]">
                  <Clock className="w-6 h-6 text-[#ffdd66]" />
                  {pending + review}
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">In Review</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-6xl font-light tracking-tighter text-[#1a1a1a]">
                  {accepted + shortlisted + interviews}
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Active Pursuits</span>
              </div>
            </div>
          </div>

          {/* ── Tracker Strip (Cleaned up design like screenshot 2) ────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="col-span-1 md:col-span-3 bg-white/60 backdrop-blur-md rounded-full p-2 flex items-center border border-white/50 shadow-sm relative overflow-hidden h-14">
              <div className="relative z-10 flex gap-1 w-full h-full">
                <div className="bg-[#1a1a1a] text-white text-xs font-semibold px-5 h-full rounded-full flex items-center gap-2 shadow-md transition-all whitespace-nowrap" style={{ width: `${Math.max(total > 0 ? Math.round(((accepted + shortlisted + interviews) / total) * 100) : 15, 15)}%` }}>
                  Engaged <span className="opacity-50 font-medium ml-auto">{accepted + shortlisted + interviews}</span>
                </div>
                <div className="bg-[#ffdd66] text-[#1a1a1a] text-xs font-semibold px-5 h-full rounded-full flex items-center gap-2 shadow-md transition-all whitespace-nowrap" style={{ width: `${Math.max(total > 0 ? Math.round(((pending + review) / total) * 100) : 15, 15)}%` }}>
                  In Review <span className="opacity-50 font-medium ml-auto">{pending + review}</span>
                </div>
                <div className="bg-[#f8f9f4] border border-slate-100 text-[#1a1a1a] text-xs font-semibold px-5 h-full rounded-full flex items-center justify-between ml-auto shadow-inner whitespace-nowrap max-w-[140px]">
                  <span className="text-slate-500 mr-2">Output</span> <span>100%</span>
                </div>
              </div>
            </div>
            <div 
              onClick={() => !isActive && navigate('/subscription')}
              className={`col-span-1 border border-slate-200/60 rounded-full px-6 flex items-center justify-between bg-white shadow-sm h-14 ${!isActive ? 'cursor-pointer hover:border-[#ffdd66] hover:bg-slate-50 transition-colors' : ''}`}
            >
              <span className="text-sm font-semibold text-slate-500">Plan</span>
              <span className="text-xl font-light tracking-tighter text-[#1a1a1a] flex items-center">
                {isActive ? <><CheckCircle className="w-5 h-5 text-emerald-500 mr-1" /> Pro</> : <span className="bg-[#ffdd66] text-[#1a1a1a] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(255,221,102,0.6)] animate-pulse border border-[#e6c75c]">{profile?.subscription_date ? 'Expired — Renew' : 'Free — Upgrade'}</span>}
              </span>
            </div>
          </div>

          {/* ── AI Matcher Section ────────────────────────────────────────────── */}
          <div className="mb-8">
            <button 
              onClick={handleAiMatch} 
              disabled={isMatching}
              className="w-full relative overflow-hidden rounded-[2rem] p-6 text-left group bg-white shadow-sm hover:shadow-lg transition-all border border-slate-200 hover:border-[#ffdd66]"
            >
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-[#ffdd66]/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#1a1a1a] flex items-center gap-2">
                    <span className="bg-[#1a1a1a] text-white p-2 rounded-xl">✨</span>
                    Find Best Fit Projects
                  </h3>
                  <p className="text-sm text-slate-500 mt-2 max-w-xl">
                    Our AI analyzes your skills, experience, and profile to find the top active projects perfectly suited for you.
                  </p>
                </div>
                <div className="bg-[#ffdd66] px-6 py-3 rounded-full font-bold text-[#1a1a1a] shadow-sm group-hover:bg-[#1a1a1a] group-hover:text-[#ffdd66] transition-colors">
                  {isMatching ? 'Scanning...' : 'Find Matches'}
                </div>
              </div>
            </button>

            {/* AI Matches Display */}
            {aiMatches && (
              <div className="mt-6 bg-[#1a1a1a] p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden animate-in slide-in-from-top-4 duration-500">
                <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#ffdd66]/10 rounded-full blur-3xl"></div>
                <h3 className="text-xl font-bold mb-6 relative z-10 text-[#ffdd66]">AI Top Recommended Roles</h3>
                
                {aiMatches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                    {aiMatches.map((match: any, i: number) => (
                      <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-lg truncate pr-4">{match.project?.title || 'Unknown Project'}</h4>
                          <span className="bg-[#ffdd66] text-[#1a1a1a] text-xs font-bold px-3 py-1 rounded-full shrink-0">
                            {match.match_score}% Match
                          </span>
                        </div>
                        <p className="text-sm text-white/70 leading-relaxed mb-4">{match.reason}</p>
                        <button 
                          onClick={() => navigate(`/apply/${match.project_id}`)}
                          className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold transition-colors"
                        >
                          Review Projects
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60 relative z-10">We couldn't find any perfect matches right now. Check back later!</p>
                )}
              </div>
            )}
          </div>

          {/* ── Main Dashboard Grid ───────────────────────────────────────────── */}
          {/* ── Dashboard Grid 1: Profile & Active Contracts ───────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            
            {/* Profile Photo Card - Redesigned to match Screenshot 1 */}
            <div className="lg:col-span-1 bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 flex flex-col items-center h-auto min-h-[420px]">
              
              {/* Profile Image with 100% Progress Ring */}
              <div className="relative w-32 h-32 mb-4">
                <div className="absolute inset-0 rounded-full border-[3px] border-emerald-500" />
                <div className="absolute inset-1 rounded-full overflow-hidden border-2 border-white shadow-md">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile?.full_name} className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-3xl font-bold">
                      {(profile?.full_name || '?')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white border border-slate-100 px-2.5 py-0.5 rounded-full shadow-sm text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                  100%
                </div>
              </div>

              <h2 className="text-xl font-bold text-[#1a1a1a] mb-1">{profile?.full_name || 'Your Name'}</h2>
              <p className="text-sm text-slate-500 text-center leading-tight mb-4 px-4">
                {profile?.skills?.[0] || 'Oracle Consultant'} @ {profile?.industry || 'Oracle Contracts'}
              </p>
              
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Last updated 1d ago</p>

              <button 
                onClick={() => navigate('/profile')}
                className="w-full py-3 px-6 bg-[#4477ff] text-white rounded-full font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-600 hover:-translate-y-0.5 transition-all mb-8"
              >
                View profile
              </button>

            </div>

            {/* Active Contracts Card */}
            <div className="lg:col-span-2 bg-[#1a1a1a] rounded-[2rem] p-7 shadow-xl shadow-black/5 flex flex-col text-white h-[420px] border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><FolderCheck className="w-48 h-48" /></div>
              <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className="text-white font-bold text-lg flex items-center gap-2"><CreditCard className="w-5 h-5 text-[#ffdd66]" /> Active Contracts & Projects</h3>
                <span className="text-3xl font-light tracking-tighter text-white/30">{activeContracts.length}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 relative z-10 pr-2">
                {activeContracts.length > 0 ? activeContracts.map(app => (
                  <div key={app.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-white text-base">{app.projects?.title || 'Unknown Project'}</h4>
                      <div className="flex items-center gap-3 mt-1.5 opacity-60 text-xs font-medium">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {app.projects?.location || 'Remote'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> Ongoing</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-black/20 px-4 py-2 rounded-xl border border-white/5">
                      <div className="text-right">
                        <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Client</p>
                        <p className="text-sm font-semibold text-[#ffdd66]">{app.projects?.company_name || 'Confidential'}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-40">
                    <FolderCheck className="w-8 h-8 mb-3 text-white/50" />
                    <p className="text-sm font-medium">No active contracts yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Dashboard Grid 2: Applications, Interviews, Saved ──────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            
            {/* My Applications */}
            <div className="col-span-1 bg-white rounded-[2rem] p-7 shadow-sm border border-slate-100 flex flex-col h-[400px]">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-[#1a1a1a] font-bold text-base">Application Status</h3>
                <span className="text-3xl font-light tracking-tighter text-slate-200">{total}</span>
              </div>
              <div className="grid grid-cols-6 gap-1.5 mb-4">
                <div className="bg-green-50 border border-green-100 rounded-xl px-1 py-2 text-center text-green-600"><p className="text-base font-bold">{accepted}</p><p className="text-[6px] font-bold uppercase tracking-widest opacity-70">Appr.</p></div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-1 py-2 text-center text-indigo-600"><p className="text-base font-bold">{shortlisted}</p><p className="text-[6px] font-bold uppercase tracking-widest opacity-70">Short.</p></div>
                <div className="bg-purple-50 border border-purple-100 rounded-xl px-1 py-2 text-center text-purple-600"><p className="text-base font-bold">{interviews}</p><p className="text-[6px] font-bold uppercase tracking-widest opacity-70">Call</p></div>
                <div className="bg-orange-50 border border-orange-100 rounded-xl px-1 py-2 text-center text-orange-600"><p className="text-base font-bold">{review}</p><p className="text-[6px] font-bold uppercase tracking-widest opacity-70">Rev.</p></div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-1 py-2 text-center text-slate-600"><p className="text-base font-bold">{pending}</p><p className="text-[6px] font-bold uppercase tracking-widest opacity-70">Pend.</p></div>
                <div className="bg-red-50 border border-red-100 rounded-xl px-1 py-2 text-center text-red-600"><p className="text-base font-bold">{rejected}</p><p className="text-[6px] font-bold uppercase tracking-widest opacity-70">Rej.</p></div>
              </div>
              <div className="flex-1 space-y-2 pr-1">
                {applications.slice(0, 4).map(app => (
                  <div key={app.id} 
                       onClick={() => navigate(`/apply/${app.project_id}`)}
                       className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50 px-2 rounded-xl transition-colors">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      ['accepted', 'approved'].includes(app.status?.toLowerCase()) ? 'bg-green-400' : 
                      app.status?.toLowerCase() === 'shortlisted' ? 'bg-indigo-400' :
                      app.status?.toLowerCase() === 'interview call' ? 'bg-purple-400' :
                      app.status?.toLowerCase() === 'review' ? 'bg-orange-400' :
                      app.status?.toLowerCase() === 'rejected' ? 'bg-red-400' : 'bg-[#ffdd66]'}`} />
                    <div className="flex-1 min-w-0 flex justify-between items-center">
                      <p className="text-sm font-semibold text-[#1a1a1a] truncate pr-4">{app.projects?.title}</p>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{app.status || 'Pending'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Interviews */}
            <div className="col-span-1 bg-indigo-50/50 rounded-[2rem] p-7 shadow-sm border border-indigo-100/50 flex flex-col h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[#1a1a1a] font-bold text-base flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-500" /> Interviews</h3>
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">{incomingInterviews.length} Scheduled</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {incomingInterviews.length > 0 ? incomingInterviews.map(app => (
                  <div key={app.id} className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/apply/${app.project_id}`)}>
                    <p className="text-xs font-bold text-indigo-500 mb-1 uppercase tracking-widest">
                      {app.status?.toLowerCase() === 'interview call' ? 'Interview Scheduled' : 'Shortlisted'}
                    </p>
                    <h4 className="font-bold text-[#1a1a1a] text-sm leading-tight mb-2">{app.projects?.title}</h4>
                    {app.interview_schedule_date_and_time ? (
                      <div className="flex items-center gap-2 mt-2">
                         <div className="bg-indigo-500 text-white p-1 rounded-md">
                           <Calendar className="w-3 h-3" />
                         </div>
                         <p className="text-[11px] font-bold text-slate-700">
                           {new Date(app.interview_schedule_date_and_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                         </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 font-medium italic">Awaiting scheduling from client.</p>
                    )}
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-50">
                    <Calendar className="w-8 h-8 mb-3 text-slate-400" />
                    <p className="text-sm font-medium text-slate-500 text-center">No interviews scheduled yet.<br/>Keep applying!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Saved Projects */}
            <div className="col-span-1 bg-white rounded-[2rem] p-7 shadow-sm border border-slate-100 flex flex-col h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[#1a1a1a] font-bold text-base flex items-center gap-2"><Bookmark className="w-5 h-5 text-emerald-500" /> Saved</h3>
                <span className="text-sm font-semibold text-slate-400">{savedProjects.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {savedProjects.length > 0 ? savedProjects.map((proj: any) => (
                  <div key={proj.id} className="group p-3 -mx-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/apply/${proj.id}`)}>
                    <h4 className="font-bold text-[#1a1a1a] text-sm group-hover:text-emerald-600 transition-colors">{proj.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{proj.company_name} • {proj.location}</p>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-50">
                    <Bookmark className="w-8 h-8 mb-3 text-slate-400" />
                    <p className="text-sm font-medium text-slate-500 text-center">You haven't saved any<br/>projects for later.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── Dashboard Grid 3: Market Trends & Activity Chart ───────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Skill Gap & Market Trends */}
            <div className="col-span-2 bg-[#f8f9f4] rounded-[2rem] p-8 shadow-sm border border-[#e2e4d8] flex flex-col group relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-[#ffdd66]/20 rounded-full blur-3xl opacity-50"></div>
              <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className="text-[#1a1a1a] font-bold text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#ffdd66]" /> Skill Gap & Market Demand</h3>
              </div>
              <p className="text-sm text-slate-600 mb-6 max-w-lg relative z-10">Based on recent project postings on Oracle Contracts, these Oracle skills are currently in high demand. Adding these to your profile can unlock more matching opportunities.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-auto relative z-10">
                {marketTrends.map((trend, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:-translate-y-1 transition-transform cursor-default">
                    <span className="text-emerald-500 text-sm font-bold bg-emerald-50 px-2.5 py-1 rounded-full">{trend.demand}</span>
                    <h4 className="text-base font-bold text-[#1a1a1a] mt-3">{trend.skill}</h4>
                    <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-widest">{trend.projects} Active Roles</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Activities Chart */}
            <div className="col-span-1 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-[#1a1a1a] font-bold text-base">Application Velocity</h3>
              </div>
              <div className="flex items-end gap-3 mb-6">
                <span className="text-5xl font-light tracking-tighter text-[#1a1a1a] leading-none">+{total}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight mb-1 flex flex-col gap-0.5"><span>This</span><span>Week</span></span>
              </div>
              <div className="mt-auto flex items-end justify-between h-28 px-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => {
                  const heights = [20, 60, 40, 80, 100, 30, 10];
                  const isHighlight = i === 4;
                  return (
                    <div key={i} className="flex flex-col items-center gap-2 w-4 h-full">
                      <div className="w-full flex-1 bg-slate-50 rounded-full relative flex items-end overflow-hidden">
                        <div className={`w-full rounded-full transition-all duration-500 ${isHighlight ? 'bg-[#ffdd66]' : 'bg-slate-200'}`} style={{ height: `${heights[i]}%` }} />
                      </div>
                      <span className={`text-[9px] font-bold ${isHighlight ? 'text-[#1a1a1a]' : 'text-slate-400'}`}>{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
