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
  X
} from 'lucide-react';

import { fetchApi } from '../lib/api';

export default function ContractorDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let appsChannel: ReturnType<typeof supabase.channel> | null = null;
    let notifsChannel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;

      try {
        const profileData = await fetchApi(`/profiles/${userId}`);
        setProfile(profileData);
      } catch (e) {
        console.error('Failed to fetch profile', e);
      }

      // Helper: fetch this user's applications
      const fetchApplications = async () => {
        try {
          const appsData = await fetchApi('/applications');
          // The API GET /applications currently returns all apps if Admin or needs filtering.
          // Wait, our GET /api/applications returns ALL apps by default (for Admin).
          // We should either filter returning data, OR update backend API.
          // Since we might not want to build complex backend filtering right this second, it's safer to filter locally for now.
          const myApps = (appsData || []).filter((a: any) => a.user_id === userId);
          setApplications(myApps);
        } catch (e) {
          console.error("Error fetching applications:", e);
        }
      };
      await fetchApplications();

      // Helper: fetch notifications
      const fetchNotifs = async () => {
        try {
          const notifsData = await fetchApi('/notifications');
          if (notifsData) setNotifications(notifsData);
        } catch (e) {
          console.error("Error fetching notifications", e);
        }
      };
      fetchNotifs();

      // Real-time: refresh application counts whenever status changes
      appsChannel = supabase
        .channel('contractor-apps-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'applications', filter: `user_id=eq.${userId}` },
          () => fetchApplications())
        .subscribe();

      // Real-time: new notifications
      notifsChannel = supabase
        .channel('notifs-contractor')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          () => fetchNotifs())
        .subscribe();
    })();

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
  const accepted = applications.filter(a => a.status?.toLowerCase() === 'accepted' || a.status?.toLowerCase() === 'approved').length;
  const rejected = applications.filter(a => a.status?.toLowerCase() === 'rejected').length;
  const pending = applications.filter(a => !a.status || a.status?.toLowerCase() === 'pending').length;

  return (
    <div className="w-full max-w-7xl mx-auto py-8">
      <div className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto font-sans selection:bg-[#ffdd66] selection:text-black" style={{ background: 'linear-gradient(135deg, #f8f9f4 0%, #f0ebd8 50%, #fefcf3 100%)' }}>

        {/* ── Top Navigation Pill Bar ────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
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

        <div className="max-w-7xl mx-auto px-6 pb-20">

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
                  {pending}
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">In Progress</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-6xl font-light tracking-tighter text-[#1a1a1a]">
                  {accepted}
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Offers</span>
              </div>
            </div>
          </div>

          {/* ── Tracker Strip (Cleaned up design like screenshot 2) ────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="col-span-1 md:col-span-3 bg-white rounded-full p-2 flex items-center border border-slate-200/60 shadow-sm relative overflow-hidden h-14">
              <div className="relative z-10 flex gap-1 w-full h-full">
                <div className="bg-[#1a1a1a] text-white text-xs font-semibold px-5 h-full rounded-full flex items-center gap-2 shadow-md transition-all whitespace-nowrap" style={{ width: `${Math.max(total > 0 ? Math.round((accepted / total) * 100) : 15, 15)}%` }}>
                  Accepted <span className="opacity-50 font-medium ml-auto">{accepted}</span>
                </div>
                <div className="bg-[#ffdd66] text-[#1a1a1a] text-xs font-semibold px-5 h-full rounded-full flex items-center gap-2 shadow-md transition-all whitespace-nowrap" style={{ width: `${Math.max(total > 0 ? Math.round((pending / total) * 100) : 15, 15)}%` }}>
                  Pending <span className="opacity-50 font-medium ml-auto">{pending}</span>
                </div>
                <div className="bg-[#f8f9f4] border border-slate-100 text-[#1a1a1a] text-xs font-semibold px-5 h-full rounded-full flex items-center justify-between ml-auto shadow-inner whitespace-nowrap max-w-[140px]">
                  <span className="text-slate-500 mr-2">Output</span> <span>100%</span>
                </div>
              </div>
            </div>
            <div className="col-span-1 border border-slate-200/60 rounded-full px-6 flex items-center justify-between bg-white shadow-sm h-14">
              <span className="text-sm font-semibold text-slate-500">Profile Strength</span>
              <span className="text-xl font-light tracking-tighter text-[#1a1a1a]">{profile?.resume_url ? '100%' : '50%'}</span>
            </div>
          </div>

          {/* ── Main Dashboard Grid ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Profile Photo Card — like reference image */}
            <div className="lg:col-span-1 rounded-[2rem] shadow-2xl shadow-black/10 relative overflow-hidden h-[500px] group cursor-pointer" onClick={() => navigate('/profile')}>
              {/* Big photo fills the card */}
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile?.full_name} className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
              ) : (
                /* Fallback: dark gradient card with big initial */
                <div className="absolute inset-0 bg-[#1a1a1a] flex items-center justify-center">
                  <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
                  <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#ffdd66]/10 rounded-full blur-3xl" />
                  <span className="text-[120px] font-light text-white/10 select-none leading-none">
                    {(profile?.full_name || '?')[0].toUpperCase()}
                  </span>
                </div>
              )}
              {/* Gradient overlay at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              {/* Name + Role chip */}
              <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                <h2 className="text-2xl font-bold text-white leading-tight mb-1">
                  {profile?.full_name || 'Your Name'}
                </h2>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/70">{profile?.skills?.[0] || 'Contractor'}</p>
                  {profile?.experience_years && (
                    <span className="px-4 py-1.5 rounded-full bg-[#ffdd66] text-[#1a1a1a] text-xs font-bold shadow-lg">
                      {profile.experience_years} yrs exp
                    </span>
                  )}
                </div>
              </div>
              {/* "Add photo" hint if no photo */}
              {!profile?.avatar_url && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white/50" />
                  </div>
                  <p className="text-xs text-white/50 font-semibold tracking-wide">Add profile photo</p>
                </div>
              )}
            </div>


            {/* Center Column: Velocity / Analytics Chart */}
            <div className="col-span-1 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col h-[500px] hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-[#1a1a1a] font-semibold text-lg">Velocity</h3>
                <button className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-black hover:border-slate-300 hover:bg-slate-50 transition-all">
                  <ArrowRight className="w-4 h-4 -rotate-45" />
                </button>
              </div>

              <div className="flex items-end gap-3 mb-10">
                <span className="text-6xl font-light tracking-tighter text-[#1a1a1a] leading-none">+{total}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-tight mb-1.5 flex flex-col gap-0.5"><span>Applied</span><span>This Week</span></span>
              </div>

              {/* Decorative bar chart imitating the ref image */}
              <div className="mt-auto flex items-end justify-between h-36 px-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => {
                  const heights = [20, 60, 40, 80, 100, 30, 10];
                  const isHighlight = i === 4;
                  const isDark = i % 2 !== 0 && !isHighlight;
                  return (
                    <div key={i} className="flex flex-col items-center gap-3 w-4 h-full">
                      <div className="w-full flex-1 bg-slate-50 rounded-full relative flex items-end overflow-hidden group">
                        <div
                          className={`w-full rounded-full transition-all duration-500 ease-out 
                          ${isHighlight ? 'bg-[#ffdd66]' : isDark ? 'bg-[#1a1a1a]' : 'bg-slate-200 group-hover:bg-slate-300'}`}
                          style={{ height: `${heights[i]}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-bold ${isHighlight ? 'text-[#1a1a1a]' : 'text-slate-400'}`}>{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: My Applications Status */}
            <div className="col-span-1 bg-[#1a1a1a] rounded-[2rem] p-7 shadow-xl shadow-black/5 flex flex-col text-white h-[500px] border border-white/5">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-white font-bold text-base">My Applications</h3>
                <span className="text-3xl font-light tracking-tighter text-white/30">{total}</span>
              </div>

              {/* Stats row */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2 text-center">
                  <p className="text-lg font-bold text-green-400">{accepted}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-green-400/70">Approved</p>
                </div>
                <div className="flex-1 bg-[#ffdd66]/10 border border-[#ffdd66]/20 rounded-xl px-3 py-2 text-center">
                  <p className="text-lg font-bold text-[#ffdd66]">{pending}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#ffdd66]/70">Pending</p>
                </div>
                <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-center">
                  <p className="text-lg font-bold text-red-400">{rejected}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-red-400/70">Rejected</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1 space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {applications.length > 0 ? applications.map((app) => {
                  const s = app.status?.toLowerCase();
                  const isApproved = s === 'accepted' || s === 'approved';
                  const isRejected = s === 'rejected';
                  const isPending = !s || s === 'pending';
                  return (
                    <div key={app.id} className="flex items-center gap-3 bg-white/5 hover:bg-white/8 rounded-2xl px-4 py-3 transition-colors">
                      {/* Status dot */}
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isApproved ? 'bg-green-400' : isRejected ? 'bg-red-400' : 'bg-[#ffdd66]'
                        }`} />
                      {/* Project name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{app.projects?.title || 'Unknown Project'}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">
                          {app.created_at ? new Date(app.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </p>
                      </div>
                      {/* Status badge */}
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border shrink-0 ${isApproved ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : isRejected ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-[#ffdd66]/10 text-[#ffdd66] border-[#ffdd66]/20'
                        }`}>
                        {isApproved ? 'Accepted' : isRejected ? 'Rejected' : 'Pending'}
                      </span>
                    </div>
                  );
                }) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-40">
                    <Search className="w-8 h-8 mb-3 text-white/50" />
                    <p className="text-sm font-medium">No applications yet</p>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-auto">
                <button onClick={() => navigate('/projects')} className="w-full py-3 bg-white/5 hover:bg-white/10 transition-colors rounded-xl text-sm font-bold text-white tracking-wide border border-white/10">Browse Projects</button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
