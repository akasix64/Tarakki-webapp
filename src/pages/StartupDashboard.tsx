import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard, FolderOpen, Users, ChevronRight,
  CheckCircle, Clock, Plus, Bell, Settings, UserCircle,
  TrendingUp, Menu, Star, Building2, ArrowUpRight, Briefcase, ArrowRight
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

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Fetch notifications
        const fetchCombinedData = async () => {
          try {
            const [profileData, projectsData, appsData, bidsData, notifsData] = await Promise.all([
              fetchApi(`/profiles/${session.user.id}`),
              fetchApi('/projects'),
              fetchApi('/applications'),
              fetchApi('/bids'),
              fetchApi('/notifications')
            ]);
            if (profileData) setProfile(profileData);
            const sId = profileData?.id || session.user.id;
            const myProj = (projectsData || []).filter((p: any) => p.startup_id === sId);
            setProjects(myProj.map((p: any) => ({ ...p, teamSize: p.team_size || 0, posted: new Date(p.created_at).toLocaleDateString() })));
            const sProjIds = myProj.map((p: any) => p.id);
            if (appsData) setApplications(appsData.filter((a: any) => sProjIds.includes(a.project_id)));
            if (bidsData) {
              setBids(bidsData.filter((b: any) => b.user_id === session.user.id));
              setReceivedBids(bidsData.filter((b: any) => sProjIds.includes(b.project_id)));
            }
            if (notifsData) setNotifications(notifsData);
          } catch (e) {
            console.error('Error fetching combined dashboard data:', e);
          }
        };

        const fetchNotifs = async () => {
          try {
            const notifsData = await fetchApi('/notifications');
            if (notifsData) setNotifications(notifsData);
          } catch (e) {
            console.error(e);
          }
        };

        fetchCombinedData();

        // Real-time subscriptions
        const notifCh = supabase.channel('notifs-startup').on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` },
          () => fetchNotifs()).subscribe();

        const bidsCh = supabase.channel('bids-startup').on('postgres_changes',
          { event: '*', schema: 'public', table: 'bids', filter: `user_id=eq.${session.user.id}` },
          () => fetchData()).subscribe();

        const projCh = supabase.channel('proj-startup').on('postgres_changes',
          { event: '*', schema: 'public', table: 'projects', filter: `startup_id=eq.${session.user.id}` },
          () => fetchData()).subscribe();

        return () => { 
          supabase.removeChannel(notifCh); 
          supabase.removeChannel(bidsCh);
          supabase.removeChannel(projCh);
        };
      }
    };
    fetchData();
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

  const totalAppsCount = applications.length;
  const pendingAppsCount = applications.filter(a => {
    const s = a.status?.toLowerCase();
    return !s || s === 'pending';
  }).length;
  const acceptedAppsCount = applications.filter(a => {
    const s = a.status?.toLowerCase();
    return ['accepted', 'approved', 'shortlisted'].includes(s);
  }).length;

  const hiringRate = total > 0 ? Math.round((hiring / total) * 100) : 0;
  const activeRate = total > 0 ? Math.round((inProgress / total) * 100) : 0;

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
      <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
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

      <div className="max-w-7xl mx-auto px-6 pb-20">

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
                <FolderOpen className="w-6 h-6 text-slate-400" />
                {total}
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Roles</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-5xl font-light tracking-tighter text-[#1a1a1a]">
                <Clock className="w-6 h-6 text-[#ffdd66]" />
                {inProgress}
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Active</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-6xl font-light tracking-tighter text-[#1a1a1a]">
                {totalAppsCount}
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Incoming</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-6xl font-light tracking-tighter text-[#1a1a1a]">
                {bids.length}
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">My Bids</span>
            </div>
          </div>
        </div>

        {/* ── Tracker Strip (Like the striped progress in ref) ──────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="col-span-1 md:col-span-3 bg-white/60 backdrop-blur-md rounded-full p-2 flex items-center border border-white/50 shadow-sm relative overflow-hidden h-14">
            <div className="relative z-10 flex gap-1 w-full h-full">
              <div className="bg-[#1a1a1a] text-white text-xs font-semibold px-5 h-full rounded-full flex items-center gap-2 shadow-md transition-all whitespace-nowrap" style={{ width: `${Math.max(activeRate, 15)}%` }}>
                Active <span className="opacity-50 font-medium ml-auto">{activeRate}%</span>
              </div>
              <div className="bg-[#ffdd66] text-[#1a1a1a] text-xs font-semibold px-5 h-full rounded-full flex items-center gap-2 shadow-md transition-all whitespace-nowrap" style={{ width: `${Math.max(hiringRate, 15)}%` }}>
                Hiring <span className="opacity-50 font-medium ml-auto">{hiringRate}%</span>
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

            {/* Profile Photo Card — like reference image */}
            <div className="lg:col-span-1 rounded-[2rem] shadow-2xl shadow-black/10 relative overflow-hidden h-[380px] group cursor-pointer" onClick={() => navigate('/profile')}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile?.full_name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="absolute inset-0 bg-[#1a1a1a] flex items-center justify-center">
                  <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
                  <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#ffdd66]/10 rounded-full blur-3xl" />
                  <span className="text-[120px] font-light text-white/10 select-none leading-none">
                    {(profile?.full_name || '?')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                <h2 className="text-2xl font-bold text-white leading-tight mb-1">
                  {profile?.full_name || 'My Company'}
                </h2>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/70">{profile?.industry || 'Startup'}</p>
                  {profile?.is_member && (
                    <span className="px-4 py-1.5 rounded-full bg-[#ffdd66] text-[#1a1a1a] text-xs font-bold shadow-lg">Pro</span>
                  )}
                </div>
              </div>
              {!profile?.avatar_url && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white/50" />
                  </div>
                  <p className="text-xs text-white/50 font-semibold tracking-wide">Add profile photo</p>
                </div>
              )}
            </div>

            {/* Center Column: Interest / Analytics Chart */}
            <div className="col-span-1 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col h-[380px] hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-[#1a1a1a] font-semibold text-lg">Bidding Pipeline</h3>
                <button className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-black hover:border-slate-300 hover:bg-slate-50 transition-all">
                  <ArrowRight className="w-4 h-4 -rotate-45" />
                </button>
              </div>

              <div className="flex items-end gap-3 mb-10">
                <span className="text-6xl font-light tracking-tighter text-[#1a1a1a] leading-none">+{bids.length}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-tight mb-1.5 flex flex-col gap-0.5"><span>Total</span><span>Bids Placed</span></span>
              </div>

              {/* Dynamic bar chart based on bids over the last 7 days */}
              <div className="mt-auto flex items-end justify-between h-36 px-2">
                {last7DaysBids.map((dayData, i) => {
                  const heightPercent = (dayData.count / maxBidCount) * 100;
                  const isHighlight = i === 6; // Today
                  const isDark = i % 2 !== 0 && !isHighlight;
                  
                  return (
                    <div key={i} className="flex flex-col items-center gap-3 w-4 h-full relative group">
                      <div className="w-full flex-1 bg-slate-50 rounded-full relative flex items-end overflow-hidden">
                        <div
                          className={`w-full rounded-full transition-all duration-500 ease-out 
                          ${isHighlight ? 'bg-[#ffdd66]' : isDark ? 'bg-[#1a1a1a]' : 'bg-slate-200 group-hover:bg-slate-300'}`}
                          style={{ height: `${Math.max(heightPercent, 10)}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-bold ${isHighlight ? 'text-[#1a1a1a]' : 'text-slate-400'}`}>{dayData.dayShort}</span>
                      
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 scale-0 origin-bottom group-hover:scale-100 transition-transform bg-[#1a1a1a] text-[#ffdd66] text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-20">
                        {dayData.count} Bids
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Dark Modern List (Bids Tracker) */}
            {/* <div className="col-span-1 bg-[#2c2c2e] rounded-[2rem] p-7 shadow-xl shadow-black/5 flex flex-col text-white h-[380px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-semibold">Bids Received</h3>
                <span className="text-4xl font-light tracking-tighter text-white/50">{Math.min(receivedBids.length, 5)}<span className="text-2xl">/{receivedBids.length}</span></span>
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 space-y-2.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {receivedBids.length > 0 ? receivedBids.map((bid, i) => {
                  const isAccepted = bid.status === 'Accepted';
                  // Lookup project name
                  const project = projects.find(p => p.id === bid.project_id);

                  return (
                    <div key={bid.id} className="flex gap-4 group cursor-pointer hover:bg-white/5 rounded-2xl p-3 -mx-2 transition-colors">
                      {(() => {
                        const s = bid.status?.toLowerCase();
                        const isSelected = ['accepted', 'approved', 'shortlisted'].includes(s);
                        const isRejected = s === 'rejected';
                        const isReview = s === 'review';

                        let iconBoxCls = 'bg-white/10 text-white/60 border border-white/5';
                        if (isSelected) iconBoxCls = 'bg-[#ffdd66] text-black';
                        else if (isRejected) iconBoxCls = 'bg-red-500/20 text-red-400 border border-red-500/20';
                        else if (isReview) iconBoxCls = 'bg-orange-500/20 text-orange-400 border border-orange-500/20';

                        let textCls = 'text-white/50';
                        if (isSelected) textCls = 'text-[#ffdd66]';
                        else if (isRejected) textCls = 'text-red-400';
                        else if (isReview) textCls = 'text-orange-400';

                        return (
                          <>
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-inner ${iconBoxCls}`}>
                              {isSelected ? <Users className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#ffdd66] transition-colors">{project?.title || 'Unknown Role'}</h4>
                              <p className={`text-[11px] mt-1 truncate tracking-wide font-bold uppercase ${textCls}`}>
                                {bid.status || 'Pending Review'}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-cyan-400 shrink-0">{bid.bid_amount}</span>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors
                                ${isSelected ? 'border-[#ffdd66] bg-[#ffdd66]'
                                  : isRejected ? 'border-red-500/40' : 'border-white/20 group-hover:border-white/40'}`}>
                                {isSelected && <CheckCircle className="w-3.5 h-3.5 text-black" />}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  );
                }) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-50">
                    <Users className="w-8 h-8 mb-3 text-white/50" />
                    <p className="text-sm font-medium">No bids incoming</p>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-auto">
                <button onClick={() => navigate('/projects')} className="w-full py-3.5 bg-white/5 hover:bg-white/10 transition-colors rounded-xl text-sm font-bold text-white tracking-wide border border-white/10">Manage Roles</button>
              </div>
            </div> */}

            {/* NEW: My Bids Sent to Others (Dark Theme) */}
            <div className="col-span-1 bg-[#2c2c2e] rounded-[2rem] p-7 shadow-xl shadow-black/5 flex flex-col text-white h-[380px] hover:shadow-2xl transition-shadow">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-semibold">My Project Bids</h3>
                <span className="text-sm font-bold text-white/50 capitalize">{bids.length} Submitted</span>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {bids.length > 0 ? bids.map((bid) => (
                  <div key={bid.id} className="p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-bold text-white truncate pr-2 group-hover:text-[#ffdd66] transition-colors">{bid.projects?.title || 'Unknown Project'}</h4>
                      <span className="text-xs font-bold text-cyan-400 shrink-0">{bid.bid_amount}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {bid.delivery_time}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border
                        ${bid.status?.toLowerCase() === 'accepted' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 
                          bid.status?.toLowerCase() === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/20' : 'bg-blue-500/20 text-blue-400 border-blue-500/20'}`}>
                        {bid.status}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-50">
                    <Briefcase className="w-8 h-8 mb-3 text-white/50" />
                    <p className="text-sm font-medium">No bids placed yet</p>
                  </div>
                )}
              </div>
              
              <div className="pt-4 mt-auto">
                <button onClick={() => navigate('/projects')} className="w-full py-3.5 bg-white/5 text-white rounded-xl text-sm font-bold tracking-wide border border-white/10 hover:bg-white/10 transition-colors">Explore Projects</button>
              </div>
            </div>

          </div>
        )
        }


      </div >
    </div >
  );
}
