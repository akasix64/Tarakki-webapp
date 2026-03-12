import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard, FolderOpen, Users, ChevronRight,
  CheckCircle, Clock, Plus, Bell, Settings, UserCircle,
  TrendingUp, Menu, Star, Building2, ArrowUpRight, Briefcase, ArrowRight, Calendar as CalendarIcon
} from 'lucide-react';
import { fetchApi } from '../lib/api';

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
];

export default function StartupDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'applications' | 'community' | 'profile' | 'finance_logs'>('overview');
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [receivedBids, setReceivedBids] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiMatches, setAiMatches] = useState<any[] | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
  const CACHE_KEY = `startup_cache_${profile?.id || 'anonymous'}`;

  // Initial Load from LocalStorage
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { profile, projects, applications, bids, receivedBids, notifications } = JSON.parse(cached);
        if (profile) setProfile(profile);
        if (projects) setProjects(projects);
        if (applications) setApplications(applications);
        if (bids) setBids(bids);
        if (receivedBids) setReceivedBids(receivedBids);
        if (notifications) setNotifications(notifications);
      } catch (e) { console.error("Cache Hydration Error:", e); }
    }
  }, [CACHE_KEY]);

  const saveToCache = (data: any) => {
    const current = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...current, ...data }));
  };

  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;

      // ─── Atomic Fetchers ───────────────────────────────────────────────────
      const fetchProfile = async () => {
        const data = await fetchApi(`/profiles/${userId}`);
        if (data) {
          setProfile(data);
          saveToCache({ profile: data });
        }
        return data;
      };

      const fetchProjectsAndRelated = async (currentProfile?: any) => {
        const [projectsData, appsData, bidsData] = await Promise.all([
          fetchApi('/projects'),
          fetchApi('/applications'),
          fetchApi('/bids')
        ]);

        const sId = currentProfile?.id || userId;
        const myProj = (projectsData || []).filter((p: any) => p.startup_id === sId);
        const processedProj = myProj.map((p: any) => ({ ...p, teamSize: p.team_size || 0, posted: new Date(p.created_at).toLocaleDateString() }));
        const sProjIds = myProj.map((p: any) => p.id);
        
        const myApps = (appsData || []).filter((a: any) => sProjIds.includes(a.project_id));
        const myBids = (bidsData || []).filter((b: any) => b.user_id === userId);
        const rBids = (bidsData || []).filter((b: any) => sProjIds.includes(b.project_id));

        setProjects(processedProj);
        setApplications(myApps);
        setBids(myBids);
        setReceivedBids(rBids);

        saveToCache({ projects: processedProj, applications: myApps, bids: myBids, receivedBids: rBids });
      };

      const fetchNotifs = async () => {
        const data = await fetchApi('/notifications');
        if (data) {
          setNotifications(data);
          saveToCache({ notifications: data });
        }
      };

      // ─── Initial Full Fetch ────────────────────────────────────────────────
      const profile = await fetchProfile();
      fetchProjectsAndRelated(profile);
      fetchNotifs();

      // ─── Real-time Subscriptions ───────────────────────────────────────────
      const notifCh = supabase.channel('notifs-startup').on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => fetchNotifs()).subscribe();

      const bidsCh = supabase.channel('bids-startup').on('postgres_changes',
        { event: '*', schema: 'public', table: 'bids' },
        () => fetchProjectsAndRelated()).subscribe(); // Bids affect project metrics

      const projCh = supabase.channel('proj-startup').on('postgres_changes',
        { event: '*', schema: 'public', table: 'projects', filter: `startup_id=eq.${userId}` },
        () => fetchProjectsAndRelated()).subscribe();

      return () => { 
        supabase.removeChannel(notifCh); 
        supabase.removeChannel(bidsCh);
        supabase.removeChannel(projCh);
      };
    };

    initSession();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const total = projects.length;
  const inProgress = projects.filter(p => p.status === 'In Progress').length;
  const hiring = projects.filter(p => p.status !== 'Completed' && p.status !== 'In Progress').length;
  const completed = projects.filter(p => p.status === 'Completed').length;
  const totalTeam = projects.reduce((a, p) => a + (p.teamSize || 0), 0);

  const totalBidsCount = bids.length;
  const totalReceivedApps = applications.length;
  const totalReceivedBids = receivedBids.length;

  // Consolidate all activity (Sent Bids + Received Apps + Received Bids) for the dashboard overview
  const allActivity = useMemo(() => {
    const combined = [
      ...bids.map(b => ({ ...b, activityType: 'personal_bid' })),
      ...receivedBids.map(b => ({ ...b, activityType: 'received_bid' })),
      ...applications.map(a => ({ ...a, activityType: 'received_app' }))
    ];
    return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [bids, receivedBids, applications]);

  // Enrich projects with the 'most advanced' status from their received bids/apps
  const enrichedProjects = useMemo(() => {
    return projects.map(p => {
      const related = allActivity.filter(a => a.project_id === p.id);
      if (related.length === 0) return p;
      
      const statusOrder = ['accepted', 'approved', 'shortlisted', 'interview call', 'review', 'pending'];
      let bestStatus = p.status?.toLowerCase() || 'pending';
      
      for (const s of statusOrder) {
        if (related.some(r => r.status?.toLowerCase() === s)) {
          bestStatus = s;
          break;
        }
      }
      return { 
        ...p, 
        status: bestStatus === 'interview call' ? 'Interview Call' : bestStatus.charAt(0).toUpperCase() + bestStatus.slice(1) 
      };
    });
  }, [projects, allActivity]);

  const acceptedCount = allActivity.filter(a => ['accepted', 'approved'].includes(a.status?.toLowerCase())).length;
  const shortlistedCount = allActivity.filter(a => a.status?.toLowerCase() === 'shortlisted').length;
  const reviewCount = allActivity.filter(a => a.status?.toLowerCase() === 'review').length;
  const interviewsCount = allActivity.filter(a => a.status?.toLowerCase() === 'interview call').length;
  const rejectedCount = allActivity.filter(a => a.status?.toLowerCase() === 'rejected').length;
  const pendingCount = allActivity.filter(a => !a.status || a.status?.toLowerCase() === 'pending').length;

  const totalActivity = allActivity.length;
  const inReviewTotal = pendingCount + reviewCount;
  const activePursuitsTotal = acceptedCount + shortlistedCount + interviewsCount;

  const incomingInterviews = allActivity.filter(a => ['shortlisted', 'interview call'].includes(a.status?.toLowerCase()));

  // Project health based on enriched status
  const hiringCount = enrichedProjects.filter(p => !['Completed', 'In Progress'].includes(p.status)).length;
  const activeCount = enrichedProjects.filter(p => p.status === 'In Progress').length;
  const totalProjCount = projects.length;

  const hiringRate = totalProjCount > 0 ? Math.round((hiringCount / totalProjCount) * 100) : 0;
  const activeRate = totalProjCount > 0 ? Math.round((activeCount / totalProjCount) * 100) : 0;

  // Compute bids over the last 7 days
  const last7DaysBids = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return { 
        date: d, 
        dayShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()],
        count: 0
      };
    });

    bids.forEach(bid => {
      if (!bid.created_at) return;
      const bDate = new Date(bid.created_at);
      bDate.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - bDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        const idx = 6 - diffDays;
        days[idx].count += 1;
      }
    });

    return days;
  }, [bids]);

  const maxBidCount = Math.max(...last7DaysBids.map(d => d.count), 1);

  const avatarInitial = (profile?.full_name || profile?.email || '?')[0].toUpperCase();

  const statusStyle = (s: string) => {
    if (s === 'Completed') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (s === 'In Progress') return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    return 'bg-[#ffdd66]/10 text-[#ffdd66] border border-[#ffdd66]/20';
  };

  const handleAiMatch = async () => {
    if (!profile?.id) return;
    setIsMatching(true);
    setAiMatches(null);
    try {
      const resp = await fetchApi(`/ai-match/${profile.id}`, {
        method: 'POST',
        body: JSON.stringify({ role: 'startup' })
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
    <div className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto font-sans selection:bg-[#ffdd66] selection:text-black" style={{ background: 'linear-gradient(135deg, #f8f9f4 0%, #f0ebd8 50%, #fefcf3 100%)' }}>

      {/* ── Top Navigation Pill Bar ────────────────────────────────────────── */}
      <div className="w-full max-w-[96%] mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md rounded-full p-1.5 shadow-sm border border-white/40">
          <button onClick={() => setActiveTab('overview')} className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${activeTab === 'overview' ? 'bg-[#1a1a1a] text-white' : 'text-slate-500 hover:bg-white/50 hover:text-[#1a1a1a]'}`}>Dashboard</button>
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
              Welcome, <span className="font-medium">{profile?.full_name || 'Startup'}</span>
            </h1>
          </div>
          <div className="flex items-end gap-12 pb-2">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-5xl font-light tracking-tighter text-[#1a1a1a]">
                <Briefcase className="w-6 h-6 text-slate-400" />
                {totalActivity}
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Total Activity</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-5xl font-light tracking-tighter text-[#1a1a1a]">
                <Clock className="w-6 h-6 text-[#ffdd66]" />
                {inReviewTotal}
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">In Review</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-6xl font-light tracking-tighter text-[#1a1a1a]">
                {activePursuitsTotal}
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Active Pursuits</span>
            </div>
          </div>
        </div>

        {/* ── Tracker Strip (Like the striped progress in ref) ──────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="col-span-1 md:col-span-3 bg-white/60 backdrop-blur-md rounded-full p-2 flex items-center border border-white/50 shadow-sm relative overflow-hidden h-14">
            <div className="relative z-10 flex gap-1 w-full h-full">
              <div className="bg-[#1a1a1a] text-white text-xs font-semibold px-5 h-full rounded-full flex items-center gap-2 shadow-md transition-all whitespace-nowrap" style={{ width: `${Math.max(totalActivity > 0 ? Math.round((activePursuitsTotal / totalActivity) * 100) : 15, 15)}%` }}>
                Engaged <span className="opacity-50 font-medium ml-auto">{activePursuitsTotal}</span>
              </div>
              <div className="bg-[#ffdd66] text-[#1a1a1a] text-xs font-semibold px-5 h-full rounded-full flex items-center gap-2 shadow-md transition-all whitespace-nowrap" style={{ width: `${Math.max(totalActivity > 0 ? Math.round((inReviewTotal / totalActivity) * 100) : 15, 15)}%` }}>
                In Review <span className="opacity-50 font-medium ml-auto">{inReviewTotal}</span>
              </div>
              <div className="bg-white/80 border border-slate-200 text-[#1a1a1a] text-xs font-semibold px-5 h-full rounded-full flex items-center justify-between ml-auto shadow-sm whitespace-nowrap max-w-[120px]">
                Portfolio <span>100%</span>
              </div>
            </div>
          </div>
          <div 
            onClick={() => !isActive && navigate('/subscription')}
            className={`col-span-1 border border-white/50 rounded-full px-6 flex items-center justify-between bg-white/40 backdrop-blur-md shadow-sm h-14 ${!isActive ? 'cursor-pointer hover:border-[#ffdd66] hover:bg-white/60 transition-colors' : ''}`}
          >
            <span className="text-sm font-semibold text-slate-600">Plan</span>
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
                  Find Best Fit Contractors
                </h3>
                <p className="text-sm text-slate-500 mt-2 max-w-xl">
                  Our AI scans thousands of contractors to find the perfect matches for your active open roles.
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
              <h3 className="text-xl font-bold mb-6 relative z-10 text-[#ffdd66]">AI Top Recommended Contractors</h3>
              
              {aiMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                  {aiMatches.map((match: any, i: number) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-lg truncate pr-4">{match.contractor?.name || 'Contractor'}</h4>
                        <span className="bg-[#ffdd66] text-[#1a1a1a] text-xs font-bold px-3 py-1 rounded-full shrink-0">
                          {match.match_score}% Match
                        </span>
                      </div>
                      <p className="text-xs text-[#ffdd66]/80 font-bold mb-2 break-words">Role: {match.project?.title}</p>
                      <p className="text-sm text-white/70 leading-relaxed">{match.reason}</p>
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
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Profile Photo Card */}
            <div className="lg:col-span-1 bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 flex flex-col items-center h-auto min-h-[420px]">
              <div className="relative w-32 h-32 mb-4">
                <div className="absolute inset-0 rounded-full border-[3px] border-emerald-500" />
                <div className="absolute inset-1 rounded-full overflow-hidden border-2 border-white shadow-md">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile?.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-3xl font-bold">
                      {avatarInitial}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white border border-slate-100 px-2.5 py-0.5 rounded-full shadow-sm text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                  100%
                </div>
              </div>

              <h2 className="text-xl font-bold text-[#1a1a1a] mb-1">{profile?.full_name || 'Your Company'}</h2>
              <p className="text-sm text-slate-500 text-center leading-tight mb-4 px-4">
                {profile?.industry || 'Oracle Startup'} @ {profile?.location || 'Oracle Network'}
              </p>
              
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Partner since 2024</p>

              <button 
                onClick={() => navigate('/profile')}
                className="w-full py-3 px-6 bg-[#1a1a1a] text-white rounded-full font-bold text-sm shadow-xl hover:bg-black transition-all mb-4"
              >
                Company Profile
              </button>
            </div>

            {/* Bid Status Tracker (Match Contractor Dashboard design) */}
            <div className="col-span-1 bg-white rounded-[2rem] p-7 shadow-sm border border-slate-100 flex flex-col h-[420px]">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-[#1a1a1a] font-bold text-base">Pipeline Status</h3>
                <span className="text-3xl font-light tracking-tighter text-slate-200">{totalActivity}</span>
              </div>
              <div className="grid grid-cols-6 gap-1.5 mb-4">
                <div className="bg-green-50 border border-green-100 rounded-xl px-1 py-2 text-center text-green-600"><p className="text-base font-bold">{acceptedCount}</p><p className="text-[6px] font-bold uppercase tracking-widest opacity-70">Appr.</p></div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-1 py-2 text-center text-indigo-600"><p className="text-base font-bold">{shortlistedCount}</p><p className="text-[6px] font-bold uppercase tracking-widest opacity-70">Short.</p></div>
                <div className="bg-purple-50 border border-purple-100 rounded-xl px-1 py-2 text-center text-purple-600"><p className="text-base font-bold">{interviewsCount}</p><p className="text-[6px] font-bold uppercase tracking-widest opacity-70">Call</p></div>
                <div className="bg-orange-50 border border-orange-100 rounded-xl px-1 py-2 text-center text-orange-600"><p className="text-base font-bold">{reviewCount}</p><p className="text-[6px] font-bold uppercase tracking-widest opacity-70">Rev.</p></div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-1 py-2 text-center text-slate-600"><p className="text-base font-bold">{pendingCount}</p><p className="text-[6px] font-bold uppercase tracking-widest opacity-70">Pend.</p></div>
                <div className="bg-red-50 border border-red-100 rounded-xl px-1 py-2 text-center text-red-600"><p className="text-base font-bold">{rejectedCount}</p><p className="text-[6px] font-bold uppercase tracking-widest opacity-70">Rej.</p></div>
              </div>
              <div className="flex-1 space-y-2 pr-1 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                {allActivity.slice(0, 6).map((item, idx) => (
                  <div key={idx} 
                       className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0 px-2 rounded-xl">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      ['accepted', 'approved'].includes(item.status?.toLowerCase()) ? 'bg-green-400' : 
                      item.status?.toLowerCase() === 'shortlisted' ? 'bg-indigo-400' :
                      item.status?.toLowerCase() === 'interview call' ? 'bg-purple-400' :
                      item.status?.toLowerCase() === 'review' ? 'bg-orange-400' :
                      item.status?.toLowerCase() === 'rejected' ? 'bg-red-400' : 'bg-[#ffdd66]'}`} />
                    <div className="flex-1 min-w-0 flex justify-between items-center">
                      <div className="flex flex-col min-w-0">
                        <p className="text-sm font-semibold text-[#1a1a1a] truncate pr-2">{item.projects?.title || 'Project Activity'}</p>
                        <p className="text-[8px] uppercase tracking-widest text-slate-400 font-bold">
                          {item.activityType === 'received_app' ? 'Application' : item.activityType === 'received_bid' ? 'Incoming Bid' : 'Your Bid'}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-widest shrink-0">{item.status || 'Pending'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scheduled Interviews Card */}
            <div className="col-span-1 bg-indigo-50/50 rounded-[2rem] p-7 shadow-sm border border-indigo-100/50 flex flex-col h-[420px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[#1a1a1a] font-bold text-base flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-indigo-500" /> Mid-term Calls</h3>
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">{incomingInterviews.length} Scheduled</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 [&::-webkit-scrollbar]:hidden">
                {incomingInterviews.length > 0 ? incomingInterviews.map(bid => (
                  <div key={bid.id} className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-50 hover:shadow-md transition-shadow">
                    <p className="text-xs font-bold text-indigo-500 mb-1 uppercase tracking-widest">
                      {bid.status?.toLowerCase() === 'interview call' ? 'Interview Scheduled' : 'Shortlisted'}
                    </p>
                    <h4 className="font-bold text-[#1a1a1a] text-sm leading-tight mb-2">{bid.projects?.title}</h4>
                    {bid.interview_schedule_date_and_time ? (
                      <div className="flex items-center gap-2 mt-2">
                         <div className="bg-indigo-500 text-white p-1 rounded-md">
                           <CalendarIcon className="w-3 h-3" />
                         </div>
                         <p className="text-[11px] font-bold text-slate-700">
                           {new Date(bid.interview_schedule_date_and_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                         </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 font-medium italic">Awaiting scheduling from admin.</p>
                    )}
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-50">
                    <CalendarIcon className="w-8 h-8 mb-3 text-slate-400" />
                    <p className="text-sm font-medium text-slate-500 text-center">No calls scheduled.<br/>Check back later!</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Bottom Analytics Section */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col group relative overflow-hidden h-[340px]">
              <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-[#ffdd66]/5 rounded-full blur-3xl opacity-50"></div>
              <div className="mb-4">
                <h3 className="text-[#1a1a1a] font-bold text-xl flex items-center gap-2 mb-2"><TrendingUp className="w-6 h-6 text-[#ffdd66]" /> Market Velocity</h3>
                <p className="text-sm text-slate-500 max-w-lg leading-relaxed">Track your bidding performance and market demand for startups in the Oracle ecosystem.</p>
              </div>
              
              <div className="flex-1 w-full -ml-8">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={last7DaysBids} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBids" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffdd66" stopOpacity={1}/>
                        <stop offset="95%" stopColor="#ffdd66" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="dayShort" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 700 }} 
                      dy={10}
                    />
                    <YAxis hideDomain hide />
                    <Tooltip 
                      cursor={{ stroke: '#ffdd66', strokeWidth: 1, strokeDasharray: '4 4' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#1a1a1a] text-white px-4 py-2 rounded-xl shadow-2xl border border-white/10 text-[11px] font-bold">
                              {payload[0].value} Projects Applied
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#ccae4d" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorBids)" 
                      animationDuration={1500}
                      label={{ 
                        position: 'top', 
                        fill: '#1a1a1a', 
                        fontSize: 11, 
                        fontWeight: 800,
                        offset: 10,
                        formatter: (val: number) => val > 0 ? val : '' 
                      }}
                      dot={{ r: 4, fill: '#1a1a1a', strokeWidth: 2, stroke: '#ffdd66' }}
                      activeDot={{ r: 6, fill: '#1a1a1a', strokeWidth: 2, stroke: 'white' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-span-1 bg-[#1a1a1a] rounded-[2rem] p-8 shadow-2xl flex flex-col h-[340px] text-white overflow-hidden relative border border-white/5">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#ffdd66]/10 rounded-full blur-3xl"></div>
              <div className="mb-6">
                <h3 className="font-bold text-xl mb-1">Project Efficiency</h3>
                <p className="text-white/40 text-xs font-medium">Core performance metrics across your active stack.</p>
              </div>
              
              <div className="space-y-8 flex-1 flex flex-col justify-center">
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3">
                    <span>Active Projects</span>
                    <span className="text-[#ffdd66]">{activeRate}%</span>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${activeRate}%` }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      className="h-full bg-gradient-to-r from-[#ccae4d] to-[#ffdd66] rounded-full shadow-[0_0_10px_rgba(255,221,102,0.3)]" 
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3">
                    <span>Hiring Momentum</span>
                    <span className="text-blue-400">{hiringRate}%</span>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${hiringRate}%` }}
                      transition={{ duration: 1.5, ease: "circOut", delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.3)]" 
                    />
                  </div>
                </div>
              </div>
              
              <button onClick={() => navigate('/projects')} className="mt-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 transition-all rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase active:scale-95">
                 Manage Portfolio
              </button>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
