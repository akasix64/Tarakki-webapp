import React, { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { fetchApi } from '../lib/api';
import {
  Plus, Users, Briefcase, Activity, X, Check, Trash2,
  LayoutDashboard, FolderOpen, ChevronRight, Bell, Settings,
  UserCircle, Menu, TrendingUp, ShieldCheck, Phone, CreditCard, Mail,
  MapPin, Globe, FileText, Building2, Calendar, Star, Hash, Search, SlidersHorizontal, ArrowRight, Send
} from 'lucide-react';
import AdminAnalytics from '../components/AdminAnalytics';
import AdminFinanceLogs from '../components/AdminFinanceLogs';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'users' | 'applications' | 'bids' | 'profile' | 'finance_logs'>('overview');
  const [interviewModal, setInterviewModal] = useState<{ id: string, type: 'app' | 'bid', visible: boolean }>({ id: '', type: 'app', visible: false });
  const [interviewDateTime, setInterviewDateTime] = useState('');
  const [stats, setStats] = useState({ contractors: 0, startups: 0, projects: 0, applications: 0, bids: 0 });
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [subscriptionLogs, setSubscriptionLogs] = useState<any[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '' });
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '', description: '', location: '', type: 'Contract', budget: '', tags: '', hourly_rate: '', monthly_rate: '', deadline: ''
  });
  const [loading, setLoading] = useState(true);
  const [emailSending, setEmailSending] = useState<Record<string, boolean>>({});
  const [emailSent, setEmailSent] = useState<Record<string, boolean>>({});
  
  // Profile Match Search State
  const [showUserFilters, setShowUserFilters] = useState(false);
  const [userFilters, setUserFilters] = useState({
    roleSkills: '',
    location: '',
    experience: ''
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      // 1. Check if email is admin email
      const adminEmails = ['egisedge@tarakki.com', 'egisedge@gmail.com', 'anshukapil7770@gmail.com'];
      const userEmail = (session.user.email || '').toLowerCase();
      const isAdminEmail = adminEmails.some(e => e.toLowerCase() === userEmail) || userEmail.includes('egisedge');
      
      // 2. Check if user is in profiles table with admin role
      let isAdminRole = false;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (profile && profile.role?.toLowerCase() === 'admin') {
        isAdminRole = true;
      }

      if (!isAdminEmail && !isAdminRole) {
        // Kick them back to their appropriate dashboard switcher
        navigate('/dashboard');
        return;
      }

      setLoading(false);
    };

    checkAdmin();
  }, [navigate]);

  // ─── Caching & Hydration ──────────────────────────────────────────────────
  const ADMIN_CACHE_KEY = 'admin_dashboard_cache_v2';

  // Load from Cache on mount
  useEffect(() => {
    const cached = localStorage.getItem(ADMIN_CACHE_KEY);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (data.stats) setStats(data.stats);
        if (data.users) setUsers(data.users);
        if (data.projects) setProjects(data.projects);
        if (data.applications) setApplications(data.applications);
        if (data.bids) setBids(data.bids);
        if (data.notifications) setNotifications(data.notifications);
        if (data.subscriptionLogs) setSubscriptionLogs(data.subscriptionLogs);
        if (data.adminProfile) {
           setAdminProfile(data.adminProfile);
           setProfileForm({ full_name: data.adminProfile.full_name || '', phone: data.adminProfile.phone || '' });
        }
      } catch (e) { console.error("Admin Hydration Error:", e); }
    }
  }, []);

  const saveToAdminCache = (update: any) => {
    const current = JSON.parse(localStorage.getItem(ADMIN_CACHE_KEY) || '{}');
    localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify({ ...current, ...update }));
  };

  const fetchData = async () => {
    try {
      const profilesData = await fetchApi('/profiles');
      if (profilesData) {
        setUsers(profilesData);
        const newStats = {
          contractors: profilesData.filter((p: any) => p.role === 'contractor').length,
          startups: profilesData.filter((p: any) => p.role === 'startup').length,
        };
        setStats(prev => ({ ...prev, ...newStats }));
        saveToAdminCache({ users: profilesData, stats: { ...stats, ...newStats } });
      }

      const projectsData = await fetchApi('/projects');
      if (projectsData) {
        setProjects(projectsData);
        setStats(prev => ({ ...prev, projects: projectsData.length }));
        saveToAdminCache({ projects: projectsData, stats: { ...stats, projects: projectsData.length } });
      }
    } catch (err) { console.error('Error fetching dashboard data:', err); }
  };

  const fetchApplications = async () => {
    setApplicationsLoading(true);
    try {
      const enriched = await fetchApi('/applications');
      if (enriched) {
        setApplications(enriched);
        setStats(prev => ({ ...prev, applications: enriched.length }));
        saveToAdminCache({ applications: enriched, stats: { ...stats, applications: enriched.length } });
      }
    } catch (err) { console.error('Error fetching applications:', err); }
    finally { setApplicationsLoading(false); }
  };

  const fetchBids = async () => {
    setBidsLoading(true);
    try {
      const data = await fetchApi('/bids');
      if (data) {
        setBids(data);
        setStats(prev => ({ ...prev, bids: data.length }));
        saveToAdminCache({ bids: data, stats: { ...stats, bids: data.length } });
      }
    } catch (err) { console.error('Error fetching bids:', err); }
    finally { setBidsLoading(false); }
  };

  const fetchNotifications = async () => {
    try {
      const notifs = await fetchApi('/notifications');
      if (notifs) {
        setNotifications(notifs);
        saveToAdminCache({ notifications: notifs });
      }
    } catch (err) { console.error('Error fetching notifications:', err); }
  };

  const fetchSubscriptionLogs = async () => {
    try {
      const logs = await fetchApi('/subscriptions/logs');
      if (logs) {
        setSubscriptionLogs(logs);
        saveToAdminCache({ subscriptionLogs: logs });
      }
    } catch (err) { console.error('Error fetching subscription logs:', err); }
  };

  const handleScheduleInterviewAdmin = async () => {
    if (!interviewDateTime) {
      alert('Please select a date and time');
      return;
    }
    const { id, type } = interviewModal;
    const path = type === 'app' ? `/applications/${id}/status` : `/bids/${id}/status`;
    try {
      await fetchApi(path, {
        method: 'PUT',
        body: JSON.stringify({ 
          status: 'interview call', 
          interview_schedule_date_and_time: interviewDateTime 
        })
      });
      if (type === 'app') {
        setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'interview call', interview_schedule_date_and_time: interviewDateTime } : a));
      } else {
        setBids(prev => prev.map(b => b.id === id ? { ...b, status: 'interview call', interview_schedule_date_and_time: interviewDateTime } : b));
      }
      setInterviewModal({ id: '', type: 'app', visible: false });
      setInterviewDateTime('');
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to update status');
    }
  };

  useEffect(() => {
    if (loading) return;

    // 1. Initial background refresh
    const refreshDashboard = async () => {
      fetchData();
      fetchApplications();
      fetchBids();
      fetchNotifications();
      fetchSubscriptionLogs();
    };
    refreshDashboard();

    // 2. Fetch admin profile
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const profile = await fetchApi(`/profiles/${session.user.id}`);
        if (profile) {
          setAdminProfile(profile);
          setProfileForm({ full_name: profile.full_name || '', phone: profile.phone || '' });
          saveToAdminCache({ adminProfile: profile });
        }
      }
    });

    // 3. Real-time setup
    const ps = supabase.channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchData).subscribe();
    const pj = supabase.channel('projects-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchData).subscribe();
    const pa = supabase.channel('applications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, fetchApplications).subscribe();
    const pb = supabase.channel('bids-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bids' }, fetchBids).subscribe();

    let notifsChannel: any;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        notifsChannel = supabase.channel('admin-notifications')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, () => {
             fetchNotifications();
          }).subscribe();
      }
    });

    return () => {
      supabase.removeChannel(ps);
      supabase.removeChannel(pj);
      supabase.removeChannel(pa);
      supabase.removeChannel(pb);
      if (notifsChannel) supabase.removeChannel(notifsChannel);
    };
  }, [loading]);

  // Close notification panel when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault();
    const tagsArray = newProject.tags.split(',').map(t => t.trim()).filter(Boolean);
    try {
      await fetchApi('/projects', {
        method: 'POST',
        body: JSON.stringify({
          ...newProject,
          tags: tagsArray
        })
      });
      setIsProjectModalOpen(false);
      setNewProject({ title: '', description: '', location: '', type: 'Contract', budget: '', tags: '', hourly_rate: '', monthly_rate: '', deadline: '' });
      fetchData(); // refresh list
    } catch (err) {
      alert('Failed to create project: ' + (err as Error).message);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm('Delete this project?')) {
      try {
        await fetchApi(`/projects/${id}`, { method: 'DELETE' });
        fetchData(); // refresh list
      } catch (err) {
        alert('Failed to delete project: ' + (err as Error).message);
      }
    }
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!adminProfile?.id) {
      alert('No profile loaded. Please refresh.');
      return;
    }

    try {
      await fetchApi(`/profiles/${adminProfile.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          full_name: profileForm.full_name,
          phone: profileForm.phone,
        })
      });
      setAdminProfile({ ...adminProfile, full_name: profileForm.full_name, phone: profileForm.phone });
      setIsEditingProfile(false);
    } catch (err) {
      alert('Failed to save profile: ' + (err as Error).message);
    }
  };

  const handleSendEmailBlast = async (projectId: string, projectTitle: string) => {
    if (!confirm(`Send email notification for "${projectTitle}" to all contractors and startups?`)) return;
    
    setEmailSending(prev => ({ ...prev, [projectId]: true }));
    try {
      const result = await fetchApi('/emails/send-project', {
        method: 'POST',
        body: JSON.stringify({ project_id: projectId })
      });
      
      setEmailSent(prev => ({ ...prev, [projectId]: true }));
      alert(`✅ Email sent successfully!\n\nSent: ${result.sent}\nFailed: ${result.failed}${result.errors?.length ? '\n\nErrors:\n' + result.errors.join('\n') : ''}`);
      
      // Reset sent status after 10 seconds
      setTimeout(() => setEmailSent(prev => ({ ...prev, [projectId]: false })), 10000);
    } catch (err) {
      alert('❌ Failed to send emails: ' + (err as Error).message);
    } finally {
      setEmailSending(prev => ({ ...prev, [projectId]: false }));
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
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f9f4]">
        <Activity className="w-10 h-10 animate-spin text-[#1a1a1a]" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen py-8">
      <div className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto font-sans selection:bg-[#ffdd66] selection:text-black" style={{ background: 'linear-gradient(135deg, #f8f9f4 0%, #f0ebd8 50%, #fefcf3 100%)' }}>

        {/* ── Top Navigation Pill Bar ────────────────────────────────────────── */}
        <div className="w-full px-4 md:px-8 lg:px-12 py-6 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 relative z-[5000]">
          <motion.div 
            className="flex items-center gap-2 bg-white/60 backdrop-blur-xl rounded-full p-2 shadow-sm border border-white/40 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full xl:w-auto z-10"
          >
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'projects', label: 'Projects' },
              { id: 'users', label: 'Users' },
              { id: 'applications', label: 'Applications', badge: stats.applications > 0 ? stats.applications : null, badgeClass: 'bg-[#ffdd66] text-[#1a1a1a]' },
              { id: 'bids', label: 'Startup Bids', badge: stats.bids > 0 ? stats.bids : null, badgeClass: 'bg-cyan-400 text-white' },
              { id: 'finance_logs', label: 'Finance & Logs' },
              { id: 'profile', label: 'Profile', isGold: true }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              
              // Text color
              let textClass = 'text-slate-500 hover:text-[#1a1a1a]';
              if (isActive) {
                textClass = tab.isGold ? 'text-[#1a1a1a]' : 'text-white';
              }

              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as keyof typeof activeTab)}
                  className={`relative px-5 md:px-6 py-2.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap outline-none ${textClass}`}
                  whileHover={{ 
                    scale: 1.12, 
                    y: -2,
                    zIndex: 50,
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="admin-active-tab"
                      className={`absolute inset-0 rounded-full shadow-md -z-10 ${tab.isGold ? 'bg-[#ffdd66]' : 'bg-[#1a1a1a]'}`}
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                  {tab.badge && (
                    <span className={`absolute -top-1 -right-1 w-5 h-5 ${tab.badgeClass} text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white/80 z-20`}>
                      {tab.badge}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
          <div className="flex items-center gap-2 w-full xl:w-auto pb-2 xl:pb-0 relative z-[2100]">
            <button 
              onClick={() => {
                setActiveTab('users');
                setShowUserFilters(true);
              }}
              className="flex px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold bg-white text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#ffdd66] border border-white/60 transition-all shadow-sm items-center gap-1.5 md:gap-2 active:scale-95 whitespace-nowrap"
            >
              <Search className="w-3.5 h-3.5 md:w-4 md:h-4" /> Perfect Profile Match
            </button>
            <button onClick={() => setIsProjectModalOpen(true)} className="hidden md:flex px-6 py-2.5 rounded-full text-sm font-bold bg-[#ffdd66] text-[#1a1a1a] hover:bg-[#ffe17a] transition-all shadow-sm items-center gap-2 active:scale-95">
              <Plus className="w-4 h-4" /> Post Project
            </button>
            <button className="w-11 h-11 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-sm text-slate-500 hover:text-black transition-all">
              <Settings className="w-4 h-4" />
            </button>
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  console.log('Bell clicked, current state:', showNotifications);
                  setShowNotifications(!showNotifications);
                }}
                className="w-11 h-11 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-sm text-slate-500 hover:text-black hover:bg-white transition-all relative z-10"
              >
                <Bell className="w-4 h-4" />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#ffdd66] border border-white animate-pulse"></span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-80 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-2 border-[#1a1a1a] z-[1000] overflow-hidden origin-top-right"
                  >
                    {/* Dark arrow pointing to bell with border */}
                    <div className="absolute top-0 right-4 w-4 h-4 bg-[#1a1a1a] rotate-45 -translate-y-2 z-[999] border-l-2 border-t-2 border-[#1a1a1a]" />
                    
                    <div className="px-5 py-4 flex items-center justify-between bg-[#1a1a1a] border-b border-[#ffdd66]/20">
                      <h3 className="text-sm font-bold text-[#ffdd66] tracking-tight">Notifications</h3>
                      {notifications.length > 0 && (
                        <button onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await fetchApi('/notifications/clear-all', { method: 'DELETE' });
                            setNotifications([]);
                          } catch (err) {
                            console.error('Failed to clear notifications', err);
                          }
                        }} className="text-[10px] font-black text-[#ffdd66]/60 hover:text-[#ffdd66] uppercase tracking-[0.15em]">Clear</button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="py-16 text-center">
                          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Bell className="w-5 h-5 text-slate-300" />
                          </div>
                          <p className="text-sm text-slate-400 font-medium">No new alerts</p>
                        </div>
                      ) : notifications.map(n => (
                        <div key={n.id} className={`px-5 py-4 flex gap-3 items-start cursor-pointer hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-[#fffbeb]' : ''}`}
                          onClick={async () => {
                            if (!n.is_read) {
                              try {
                                await fetchApi('/notifications/read-all', { method: 'PUT' });
                                setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
                              } catch (e) { }
                            }
                            if (n.type === 'application') {
                              setActiveTab('applications');
                              setShowNotifications(false);
                            }
                          }}>
                          <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!n.is_read ? 'bg-[#ffdd66]' : 'bg-transparent border border-slate-200'}`} />
                          <div className="flex-1">
                            <p className={`text-sm leading-tight ${!n.is_read ? 'text-[#1a1a1a] font-bold' : 'text-slate-600 font-medium'}`}>{n.title}</p>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                              {new Date(n.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>


        <div className="w-full px-4 md:px-8 lg:px-12 pb-20 relative z-0">

          {/* ── Header ────────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10 pt-4">
            <div>
              <h1 className="text-5xl md:text-6xl tracking-tight text-[#1a1a1a]">
                Admin <span className="font-bold">{adminProfile?.full_name || 'Dashboard'}</span>
              </h1>
            </div>
            <div className="flex items-end gap-12 pb-2">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-4xl md:text-5xl font-light tracking-tighter text-[#1a1a1a]">
                  <Users className="w-6 h-6 text-slate-400" />
                  {totalUsers}
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Users</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-4xl md:text-5xl font-light tracking-tighter text-[#1a1a1a]">
                  <Briefcase className="w-6 h-6 text-[#ffdd66]" />
                  {stats.projects}
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Projects</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-4xl md:text-5xl font-light tracking-tighter text-[#1a1a1a] cursor-pointer hover:text-[#ffdd66] transition-colors" onClick={() => navigate('/manage-applications')}>
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
                <div className="col-span-1 md:col-span-3 bg-white/60 backdrop-blur-md rounded-full p-2 flex items-center border border-white/50 shadow-sm relative overflow-hidden h-14">
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

                {/* Employees Card */}
                <div className="bg-white/60 backdrop-blur-md rounded-[2rem] p-8 border border-white/40 shadow-sm flex flex-col hover:border-white/80 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-[#1a1a1a]/5 flex items-center justify-center mb-6">
                    <Users className="w-6 h-6 text-[#1a1a1a]" />
                  </div>
                  <h3 className="text-4xl font-light text-[#1a1a1a] mb-2 tracking-tight">{totalUsers}</h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Employees</p>
                </div>

                {/* Contractors Card */}
                <div className="bg-white/60 backdrop-blur-md rounded-[2rem] p-8 border border-white/40 shadow-sm flex flex-col hover:border-white/80 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-[#1a1a1a]/5 flex items-center justify-center mb-6">
                    <Briefcase className="w-6 h-6 text-[#1a1a1a]" />
                  </div>
                  <h3 className="text-4xl font-light text-[#1a1a1a] mb-2 tracking-tight">{stats.contractors}</h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Contractors</p>
                </div>

                {/* Startups Card */}
                <div className="bg-white/60 backdrop-blur-md rounded-[2rem] p-8 border border-white/40 shadow-sm flex flex-col hover:border-white/80 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-[#ffdd66]/20 flex items-center justify-center mb-6">
                    <Building2 className="w-6 h-6 text-[#ffdd66]" />
                  </div>
                  <h3 className="text-4xl font-light text-[#1a1a1a] mb-2 tracking-tight">{stats.startups}</h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Startups</p>
                </div>
              </div>

              {/* ── Additional Analytics & Recent Registrations ─────────────────────────── */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                <div className="xl:col-span-2">
                  <AdminAnalytics projects={projects} applications={applications} users={users} />
                </div>

                {/* Users Overview block */}
                <div className="xl:col-span-1 bg-[#1a1a1a] rounded-[2rem] p-8 md:p-10 shadow-xl shadow-black/10 relative overflow-hidden group border border-white/5 h-full">
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
                        <div key={user.id} onClick={() => setSelectedUser(user)} className="flex gap-4 group cursor-pointer hover:bg-white/5 rounded-2xl p-3 -mx-2 transition-colors border border-transparent hover:border-white/10">
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
                        {['Project Name', 'Type / Location', 'Budget', 'Status / Deadline', 'Actions'].map(h => (
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
                          <td className="px-6 md:px-8 py-5 text-sm font-bold text-[#ffdd66] whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              {p.budget && <span>Fixed: {p.budget}</span>}
                              {p.hourly_rate && <span>Hourly: {p.hourly_rate}</span>}
                              {p.monthly_rate && <span>Monthly: {p.monthly_rate}</span>}
                              {(!p.budget && !p.hourly_rate && !p.monthly_rate) && <span>—</span>}
                            </div>
                          </td>
                          <td className="px-6 md:px-8 py-5">
                            <div className="flex flex-col gap-2 items-start">
                              <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border inline-block ${p.status === 'Open'
                                ? 'bg-[#ffdd66]/10 text-[#ffdd66] border-[#ffdd66]/20'
                                : 'bg-white/10 text-white/50 border-white/10'
                                }`}>
                                {p.status || 'Open'}
                              </span>
                              {p.deadline && <span className="text-[10px] font-medium text-red-300">Due: {new Date(p.deadline).toLocaleDateString()}</span>}
                            </div>
                          </td>
                          <td className="px-6 md:px-8 py-5">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleSendEmailBlast(p.id, p.title)} 
                                disabled={emailSending[p.id]}
                                className={`opacity-0 group-hover:opacity-100 p-2 rounded-xl transition-all ${
                                  emailSent[p.id] 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : emailSending[p.id]
                                      ? 'bg-[#ffdd66]/10 text-[#ffdd66] animate-pulse'
                                      : 'bg-[#ffdd66]/10 text-[#ffdd66] hover:bg-[#ffdd66]/20'
                                }`}
                                title={emailSent[p.id] ? 'Email sent!' : 'Send email blast to all contractors & startups'}
                              >
                                {emailSending[p.id] ? (
                                  <Activity className="w-4 h-4 animate-spin" />
                                ) : emailSent[p.id] ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </button>
                              <button onClick={() => handleDeleteProject(p.id)} className="opacity-0 group-hover:opacity-100 p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
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
                <div className="px-6 md:px-8 py-8 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Registered Users</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">{users.length} Total Accounts</p>
                  </div>
                  <button 
                    onClick={() => setShowUserFilters(!showUserFilters)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-[#ffdd66] text-[#1a1a1a] hover:bg-[#ffe17a] transition-all active:scale-95 shadow-md"
                  >
                    <Search className="w-4 h-4" /> Perfect Profile Match
                  </button>
                </div>

                {/* Profile Match Filters */}
                {showUserFilters && (
                  <div className="px-6 md:px-8 py-6 bg-white/5 border-b border-white/10 flex flex-col md:flex-row gap-4 items-end animate-in fade-in slide-in-from-top-2">
                    <div className="flex-1 w-full">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2 pl-2">Role / Skills (e.g. HCM, SCM, Oracle Apex)</label>
                      <input 
                        type="text" 
                        value={userFilters.roleSkills} 
                        onChange={(e) => setUserFilters({...userFilters, roleSkills: e.target.value})}
                        className="w-full h-12 px-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#ffdd66] transition-colors"
                        placeholder="Search roles or skills..."
                      />
                    </div>
                    <div className="flex-1 w-full">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2 pl-2">Location</label>
                      <input 
                        type="text" 
                        value={userFilters.location} 
                        onChange={(e) => setUserFilters({...userFilters, location: e.target.value})}
                        className="w-full h-12 px-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#ffdd66] transition-colors"
                        placeholder="e.g. Remote, India..."
                      />
                    </div>
                    <div className="w-full md:w-48">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2 pl-2">Min. Experience (Yrs)</label>
                      <input 
                        type="number" 
                        value={userFilters.experience} 
                        onChange={(e) => setUserFilters({...userFilters, experience: e.target.value})}
                        className="w-full h-12 px-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#ffdd66] transition-colors"
                        placeholder="e.g. 3"
                        min="0"
                      />
                    </div>
                    <button 
                      onClick={() => setUserFilters({roleSkills: '', location: '', experience: ''})}
                      className="h-12 px-6 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        {['User Identity', 'Account Details', 'Membership', 'Date Joined'].map(h => (
                          <th key={h} className="px-6 md:px-8 py-5 text-left text-[10px] font-bold uppercase tracking-widest text-white/50">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(() => {
                        const filteredUsers = users.filter((u: any) => {
                          if (!showUserFilters) return true;
                          
                          const roleQ = userFilters.roleSkills.toLowerCase().trim();
                          const matchRole = !roleQ ||
                            u.role?.toLowerCase().includes(roleQ) ||
                            (u.skills && u.skills.some((s: string) => s.toLowerCase().includes(roleQ))) ||
                            u.full_name?.toLowerCase().includes(roleQ);

                          const locQ = userFilters.location.toLowerCase().trim();
                          const matchLoc = !locQ || (u.location && u.location.toLowerCase().includes(locQ));

                          const expQ = parseInt(userFilters.experience);
                          const userExp = u.experience_years ? parseInt(u.experience_years) : 0;
                          const matchExp = isNaN(expQ) || userExp >= expQ;

                          return matchRole && matchLoc && matchExp;
                        });

                        if (filteredUsers.length === 0) {
                          return (
                            <tr>
                              <td colSpan={4}>
                                <div className="py-24 text-center">
                                  <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                  <p className="text-sm font-bold text-white/50">No users found</p>
                                  {showUserFilters && <p className="text-xs text-white/30 mt-2">Try adjusting your profile match filters.</p>}
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return filteredUsers.map((user: any) => (
                          <tr key={user.id} onClick={() => setSelectedUser(user)} className="hover:bg-white/5 transition-colors cursor-pointer group">
                            <td className="px-6 md:px-8 py-5">
                              <div className="flex items-center gap-4">
                                {avatar(user.full_name, user.email, true)}
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-white truncate group-hover:text-[#ffdd66] transition-colors">{user.full_name || 'Anonymous User'}</p>
                                  <p className="text-[11px] text-white/40 truncate mt-0.5">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 md:px-8 py-5">
                              <div className="flex flex-col gap-1.5">
                                <span className={`w-fit text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${user.role === 'startup' ? 'bg-[#ffdd66]/10 text-[#ffdd66] border border-[#ffdd66]/20' : 'bg-white/10 text-white border border-white/20'}`}>
                                  {user.role}
                                </span>
                                {(user.skills?.length > 0 || user.experience_years) && (
                                  <div className="text-[10px] text-white/60">
                                    {user.experience_years && <span className="mr-2">{user.experience_years} yrs exp.</span>}
                                    {user.skills?.length > 0 && <span>{user.skills[0]}{user.skills.length > 1 ? ` +${user.skills.length - 1}` : ''}</span>}
                                  </div>
                                )}
                              </div>
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
                        ));
                      })()}
                    </tbody>
                  </table>
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
                          {['Applicant', 'Project', 'Status', 'Interview', 'Date', 'Actions'].map(h => (
                            <th key={h} className="px-6 md:px-8 py-5 text-left text-[10px] font-bold uppercase tracking-widest text-white/50">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {applications.map(app => (
                          <tr key={app.id} onClick={() => setSelectedApplication(app)} className="hover:bg-white/5 transition-colors group cursor-pointer">
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
                            <td className="px-6 md:px-8 py-5">
                               {app.interview_schedule_date_and_time ? (
                                 <div className="flex flex-col gap-1">
                                   <div className="flex items-center gap-2 text-[10px] font-bold text-[#ffdd66]">
                                     <Calendar className="w-3 h-3" /> 
                                     {new Date(app.interview_schedule_date_and_time).toLocaleDateString()}
                                   </div>
                                   <div className="text-[9px] text-white/40 uppercase font-medium">
                                     {new Date(app.interview_schedule_date_and_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </div>
                                 </div>
                               ) : (
                                 <span className="text-white/20 text-[10px] italic">Not Scheduled</span>
                               )}
                            </td>
                            <td className="px-6 md:px-8 py-5">
                              {(() => {
                                const statusColors: Record<string, string> = {
                                  'approved': 'bg-green-500/10 text-green-400 border-green-500/20',
                                  'rejected': 'bg-red-500/10 text-red-400 border-red-500/20',
                                  'shortlisted': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                                  'interview call': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                                  'review': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                                  'pending': 'bg-[#ffdd66]/10 text-[#ffdd66] border border-[#ffdd66]/20'
                                };
                                return (
                                  <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${statusColors[app.status] || statusColors['pending']}`}>
                                    {app.status || 'Pending'}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="px-6 md:px-8 py-5 text-[11px] text-white/50">
                              {app.created_at ? new Date(app.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                            <td className="px-6 md:px-8 py-5" onClick={(e) => e.stopPropagation()}>
                              <select 
                                value={app.status || 'pending'}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  const val = e.target.value;
                                  if (val === 'interview call') {
                                    setInterviewModal({ id: app.id, type: 'app', visible: true });
                                  } else {
                                    (async () => {
                                      // Optimistic update
                                      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: val } : a));
                                      try {
                                        await fetchApi(`/applications/${app.id}/status`, {
                                          method: 'PUT',
                                          body: JSON.stringify({ status: val })
                                        });
                                      } catch (err) {
                                        console.error('Update failed:', err);
                                        fetchApplications(); // Revert
                                        alert('Failed to update: ' + (err as Error).message);
                                      }
                                    })();
                                  }
                                }}
                                className="bg-black/40 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#ffdd66] cursor-pointer"
                              >
                                <option value="pending">Pending</option>
                                <option value="accepted">Accepted</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="review">Application Review</option>
                                <option value="interview call">Interview Call</option>
                                <option value="rejected">Rejected</option>
                              </select>
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

          {/* ── BIDS TAB ──────────────────────────────────────── */}
          {activeTab === 'bids' && (
            <div className="bg-[#1a1a1a] rounded-[2rem] shadow-xl shadow-black/10 overflow-hidden mb-8 border border-white/5 relative group">
              <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#ffdd66]/5 rounded-full blur-3xl pointer-events-none transition-transform group-hover:scale-110 duration-700" />
              <div className="relative z-10">
                <div className="px-6 md:px-8 py-8 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-3"><Users className="w-5 h-5 text-[#ffdd66]" /> Startup Bids</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#ffdd66] mt-1">{bids.length} Total Bids</p>
                  </div>
                </div>

                {bidsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Activity className="w-8 h-8 text-[#ffdd66] animate-spin mb-4" />
                    <p className="text-sm font-bold text-white/50 uppercase tracking-widest">Loading Bids...</p>
                  </div>
                ) : bids.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                      <Users className="w-6 h-6 text-white/30" />
                    </div>
                    <p className="text-sm font-bold text-white/50">No bids tracked yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                          {['Startup ID', 'Project', 'Bid Info', 'Status', 'Interview', 'Date', 'Actions'].map(h => (
                            <th key={h} className="px-6 md:px-8 py-5 text-left text-[10px] font-bold uppercase tracking-widest text-white/50">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {bids.map(bid => (
                          <tr key={bid.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                            <td className="px-6 md:px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#ffdd66]/20 border border-[#ffdd66]/30 flex items-center justify-center text-sm font-bold text-[#ffdd66] shrink-0">
                                  {(bid.profiles?.full_name || bid.profiles?.email || '?')[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-white">{bid.profiles?.full_name || 'Unknown'}</p>
                                  <p className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5" title={bid.user_id}>User ID: {bid.user_id?.substring(0,8)}...</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 md:px-8 py-5">
                              <p className="text-sm font-semibold text-white/80">{bid.projects?.title || 'Unknown Project'}</p>
                              <p className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5" title={bid.project_id}>Project ID: {bid.project_id?.substring(0,8)}...</p>
                            </td>
                            <td className="px-6 md:px-8 py-5">
                              <p className="text-sm font-bold text-[#ffdd66] mb-1">{bid.bid_amount}</p>
                              <p className="text-[11px] text-white/50">{bid.delivery_time}</p>
                            </td>
                            <td className="px-6 md:px-8 py-5">
                               {bid.interview_schedule_date_and_time ? (
                                 <div className="flex flex-col gap-1">
                                   <div className="flex items-center gap-2 text-[10px] font-bold text-[#ffdd66]">
                                     <Calendar className="w-3 h-3" /> 
                                     {new Date(bid.interview_schedule_date_and_time).toLocaleDateString()}
                                   </div>
                                   <div className="text-[9px] text-white/40 uppercase font-medium">
                                     {new Date(bid.interview_schedule_date_and_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </div>
                                 </div>
                               ) : (
                                 <span className="text-white/20 text-[10px] italic">Not Scheduled</span>
                               )}
                            </td>
                            <td className="px-6 md:px-8 py-5">
                              {(() => {
                                const statusColors: Record<string, string> = {
                                  'accepted': 'bg-green-500/10 text-green-400 border-green-500/20',
                                  'approved': 'bg-green-500/10 text-green-400 border-green-500/20',
                                  'rejected': 'bg-red-500/10 text-red-400 border-red-500/20',
                                  'shortlisted': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                                  'interview call': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                                  'review': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                                  'pending': 'bg-[#ffdd66]/10 text-[#ffdd66] border border-[#ffdd66]/20'
                                };
                                return (
                                  <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${statusColors[bid.status] || statusColors['pending']}`}>
                                    {bid.status || 'Pending'}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="px-6 md:px-8 py-5 text-[11px] text-white/50">
                              {bid.created_at ? new Date(bid.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                            <td className="px-6 md:px-8 py-5" onClick={(e) => e.stopPropagation()}>
                              <select 
                                value={bid.status || 'pending'}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  const val = e.target.value;
                                  if (val === 'interview call') {
                                    setInterviewModal({ id: bid.id, type: 'bid', visible: true });
                                  } else {
                                    (async () => {
                                      // Optimistic update
                                      setBids(prev => prev.map(b => b.id === bid.id ? { ...b, status: val } : b));
                                      try {
                                        await fetchApi(`/bids/${bid.id}/status`, {
                                          method: 'PUT',
                                          body: JSON.stringify({ status: val })
                                        });
                                      } catch (err) {
                                        console.error('Update failed:', err);
                                        fetchBids(); // Revert
                                        alert('Failed to update: ' + (err as Error).message);
                                      }
                                    })();
                                  }
                                }}
                                className="bg-black/40 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#ffdd66] cursor-pointer"
                              >
                                <option value="pending">Pending</option>
                                <option value="accepted">Accepted</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="review">Under Review</option>
                                <option value="interview call">Interview Call</option>
                                <option value="rejected">Rejected</option>
                              </select>
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

          {/* ── FINANCE & LOGS TAB ───────────────────────────────────────── */}
          {activeTab === 'finance_logs' && (
            <AdminFinanceLogs 
              projects={projects} 
              applications={applications} 
              users={users} 
              subscriptionLogs={subscriptionLogs}
            />
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
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#1a1a1a]/40 backdrop-blur-md">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2 pl-2">Fixed Budget</label>
                    <input type="text" value={newProject.budget} onChange={e => setNewProject({ ...newProject, budget: e.target.value })} className={modalInputCls} placeholder="e.g. ₹5,00,000 fixed" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2 pl-2">Hourly Rate</label>
                    <input type="text" value={newProject.hourly_rate} onChange={e => setNewProject({ ...newProject, hourly_rate: e.target.value })} className={modalInputCls} placeholder="e.g. ₹500/hr" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2 pl-2">Monthly Rate</label>
                    <input type="text" value={newProject.monthly_rate} onChange={e => setNewProject({ ...newProject, monthly_rate: e.target.value })} className={modalInputCls} placeholder="e.g. ₹50,000/mo" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2 pl-2">Tags <span className="normal-case font-normal">(comma-separated)</span></label>
                    <input type="text" value={newProject.tags} onChange={e => setNewProject({ ...newProject, tags: e.target.value })} className={modalInputCls} placeholder="Oracle DBA, OCI, Migration" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2 pl-2">Last Applied Date</label>
                    <input type="date" value={newProject.deadline} onChange={e => setNewProject({ ...newProject, deadline: e.target.value })} className={modalInputCls} />
                  </div>
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
      {/* ── APPLICATION DETAIL DIALOG ────────────────────────────────────── */}
      {selectedApplication && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedApplication(null)}>
          <div className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

            {/* Close */}
            <button onClick={() => setSelectedApplication(null)} className="absolute top-5 right-5 z-10 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-slate-600" />
            </button>

            {/* Header */}
            <div className="bg-[#1a1a1a] px-8 pt-10 pb-7 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#ffdd66]/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Application for</p>
                <h2 className="text-2xl font-bold text-white leading-tight">{selectedApplication.projects?.title || 'Unknown Project'}</h2>
                <div className="flex items-center gap-3 mt-4">
                  <div className="w-10 h-10 rounded-xl bg-[#ffdd66]/10 border border-[#ffdd66]/20 flex items-center justify-center text-sm font-bold text-[#ffdd66]">
                    {(selectedApplication.profiles?.full_name || selectedApplication.profiles?.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{selectedApplication.profiles?.full_name || 'Unknown'}</p>
                    <p className="text-[11px] text-white/50 uppercase tracking-widest">{selectedApplication.profiles?.role}</p>
                  </div>
                  <span className={`ml-auto text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${(() => {
                        const colors: Record<string, string> = {
                          'accepted': 'bg-green-500/10 text-green-400 border-green-500/20',
                          'approved': 'bg-green-500/10 text-green-400 border-green-500/20',
                          'rejected': 'bg-red-500/10 text-red-400 border-red-500/20',
                          'shortlisted': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                          'review': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                          'pending': 'bg-[#ffdd66]/10 text-[#ffdd66] border border-[#ffdd66]/20'
                        };
                        return colors[selectedApplication.status] || colors['pending'];
                      })()}`}>{selectedApplication.status || 'Pending'}</span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="max-h-[55vh] overflow-y-auto">
              <div className="px-8 py-6 space-y-4">

                {/* Application fields */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Application Details</p>
                  <div className="space-y-3">
                    {selectedApplication.cover_letter && (
                      <div className="p-4 bg-slate-50 rounded-2xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Cover Letter</p>
                        <p className="text-sm text-[#1a1a1a] leading-relaxed whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {selectedApplication.expected_rate && (
                        <div className="p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expected Rate</p>
                          <p className="text-sm font-semibold text-[#1a1a1a]">₹{selectedApplication.expected_rate}</p>
                        </div>
                      )}
                      {selectedApplication.availability && (
                        <div className="p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Availability</p>
                          <p className="text-sm font-semibold text-[#1a1a1a]">{selectedApplication.availability}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Applicant profile snapshot */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Applicant Profile</p>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedApplication.profiles?.phone && (
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div><p className="text-[10px] text-slate-400">Phone</p><p className="text-xs font-semibold text-[#1a1a1a]">{selectedApplication.profiles.phone}</p></div>
                      </div>
                    )}
                    {selectedApplication.profiles?.location && (
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div><p className="text-[10px] text-slate-400">Location</p><p className="text-xs font-semibold text-[#1a1a1a]">{selectedApplication.profiles.location}</p></div>
                      </div>
                    )}
                    {selectedApplication.profiles?.experience_years && (
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                        <Star className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div><p className="text-[10px] text-slate-400">Experience</p><p className="text-xs font-semibold text-[#1a1a1a]">{selectedApplication.profiles.experience_years} yrs</p></div>
                      </div>
                    )}
                    {selectedApplication.profiles?.website && (
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl col-span-2">
                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div className="min-w-0"><p className="text-[10px] text-slate-400">Website</p>
                          <a href={selectedApplication.profiles.website} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-500 hover:underline truncate block">{selectedApplication.profiles.website}</a>
                        </div>
                      </div>
                    )}
                    {selectedApplication.profiles?.skills?.length > 0 && (
                      <div className="col-span-2 p-3 bg-slate-50 rounded-xl">
                        <p className="text-[10px] text-slate-400 mb-1.5">Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedApplication.profiles.skills.map((s: string) => (
                            <span key={s} className="px-2.5 py-1 text-[10px] font-bold bg-[#1a1a1a] text-white rounded-full">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedApplication.profiles?.resume_url && (
                      <div className="col-span-2 p-3 bg-slate-50 rounded-xl">
                        <p className="text-[10px] text-slate-400 mb-1">Resume / Documents</p>
                        <a href={selectedApplication.profiles.resume_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-semibold text-blue-500 hover:underline">
                          <FileText className="w-3.5 h-3.5" /> View Document
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Applied on</span>
                  <span className="text-xs font-semibold text-slate-600">
                    {selectedApplication.created_at ? new Date(selectedApplication.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                  </span>
                </div>

              </div>
            </div>

            {/* Footer — approve / reject */}
            {/* Footer — status management */}
            <div className="px-8 py-5 border-t border-slate-100 flex flex-col gap-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Update Application Status</p>
              <div className="flex gap-2">
                {['pending', 'accepted', 'shortlisted', 'review', 'rejected'].map((s) => (
                  <button
                    key={s}
                    onClick={async () => {
                      // Optimistic update
                      setApplications(prev => prev.map(a => a.id === selectedApplication.id ? { ...a, status: s } : a));
                      setSelectedApplication((prev: any) => ({ ...prev, status: s }));
                      try {
                        await fetchApi(`/applications/${selectedApplication.id}/status`, {
                          method: 'PUT',
                          body: JSON.stringify({ status: s })
                        });
                      } catch (err) {
                        console.error('Update failed', err);
                        alert('Failed to update status');
                      }
                    }}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                      selectedApplication.status === s 
                        ? 'bg-[#1a1a1a] text-[#ffdd66] border-[#1a1a1a]' 
                        : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── USER PROFILE DIALOG ───────────────────────────────────────────── */}
      {selectedUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
          <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

            {/* Close button */}
            <button onClick={() => setSelectedUser(null)} className="absolute top-5 right-5 z-10 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-slate-600" />
            </button>

            {/* Header / Avatar section */}
            <div className="bg-[#1a1a1a] px-8 pt-10 pb-8 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#ffdd66]/10 rounded-full blur-3xl" />
              <div className="relative z-10 flex items-center gap-5">
                {selectedUser.avatar_url ? (
                  <img src={selectedUser.avatar_url} alt={selectedUser.full_name} className="w-20 h-20 rounded-2xl object-cover border-2 border-white/10 shadow-xl" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-[#ffdd66]/10 border border-[#ffdd66]/20 flex items-center justify-center shadow-xl">
                    <span className="text-3xl font-light text-[#ffdd66]">{(selectedUser.full_name || selectedUser.email || '?')[0].toUpperCase()}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold text-white leading-tight truncate">{selectedUser.full_name || 'No Name'}</h2>
                  <p className="text-white/50 text-sm mt-1 truncate">{selectedUser.email}</p>
                  <span className={`inline-block mt-2 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${selectedUser.role === 'startup' ? 'bg-[#ffdd66]/10 text-[#ffdd66] border-[#ffdd66]/20'
                    : selectedUser.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-white/10 text-white/80 border-white/20'
                    }`}>{selectedUser.role}</span>
                </div>
              </div>
            </div>

            {/* Body - scrollable */}
            <div className="max-h-[60vh] overflow-y-auto">
              <div className="px-8 py-6 space-y-5">

                {/* General Info */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">General Information</p>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedUser.phone && (
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <div><p className="text-[10px] text-slate-400 uppercase tracking-widest">Phone</p><p className="text-sm font-semibold text-[#1a1a1a]">{selectedUser.phone}</p></div>
                      </div>
                    )}
                    {selectedUser.location && (
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <div><p className="text-[10px] text-slate-400 uppercase tracking-widest">Location</p><p className="text-sm font-semibold text-[#1a1a1a]">{selectedUser.location}</p></div>
                      </div>
                    )}
                    {selectedUser.website && (
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                        <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                        <div><p className="text-[10px] text-slate-400 uppercase tracking-widest">Website / LinkedIn</p>
                          <a href={selectedUser.website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-500 hover:underline truncate block">{selectedUser.website}</a>
                        </div>
                      </div>
                    )}
                    {(selectedUser.about || selectedUser.bio) && (
                      <div className="p-4 bg-slate-50 rounded-2xl">
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">About</p>
                        <p className="text-sm text-[#1a1a1a] leading-relaxed">{selectedUser.about || selectedUser.bio}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contractor-specific */}
                {selectedUser.role === 'contractor' && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Contractor Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedUser.experience_years && (
                        <div className="p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Experience</p>
                          <p className="text-sm font-semibold text-[#1a1a1a] mt-0.5">{selectedUser.experience_years} yrs</p>
                        </div>
                      )}
                      {selectedUser.skills?.length > 0 && (
                        <div className="col-span-2 p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedUser.skills.map((s: string) => (
                              <span key={s} className="px-3 py-1 text-xs font-bold bg-[#1a1a1a] text-white rounded-full">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedUser.resume_url && (
                        <div className="col-span-2 p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Resume / CV</p>
                          <a href={selectedUser.resume_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-semibold text-blue-500 hover:underline">
                            <FileText className="w-4 h-4" /> View Resume
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Startup-specific */}
                {selectedUser.role === 'startup' && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Startup Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedUser.industry && (
                        <div className="p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Industry</p>
                          <p className="text-sm font-semibold text-[#1a1a1a] mt-0.5">{selectedUser.industry}</p>
                        </div>
                      )}
                      {selectedUser.company_size && (
                        <div className="p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Company Size</p>
                          <p className="text-sm font-semibold text-[#1a1a1a] mt-0.5">{selectedUser.company_size}</p>
                        </div>
                      )}
                      {selectedUser.founded_year && (
                        <div className="p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Founded</p>
                          <p className="text-sm font-semibold text-[#1a1a1a] mt-0.5">{selectedUser.founded_year}</p>
                        </div>
                      )}
                      {selectedUser.gst_number && (
                        <div className="p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">GST Number</p>
                          <p className="text-sm font-semibold text-[#1a1a1a] mt-0.5 uppercase">{selectedUser.gst_number}</p>
                        </div>
                      )}
                      {selectedUser.resume_url && (
                        <div className="col-span-2 p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Company Documents</p>
                          <a href={selectedUser.resume_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-semibold text-blue-500 hover:underline">
                            <FileText className="w-4 h-4" /> View Document
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Meta info */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Joined</span>
                  <span className="text-xs font-semibold text-slate-600">{new Date(selectedUser.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Interview Scheduling Form Modal */}
      {interviewModal.visible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[3rem] shadow-2xl p-10 max-w-md w-full border border-white relative overflow-hidden"
          >
            {/* Background elements to match admin aesthetic */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#ffdd66]/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <h3 className="text-2xl font-black text-[#1a1a1a] mb-2 flex items-center gap-3">
                <Calendar className="w-7 h-7 text-[#ffdd66]" /> Schedule {interviewModal.type === 'app' ? 'Application' : 'Bid'} Call
              </h3>
              <p className="text-sm text-slate-500 mb-8 font-medium">Set the formal interview date and time. This will notify the user and update their status to "Interview call".</p>
              
              <div className="space-y-6 mb-10">
                <div className="relative group">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2.5 pl-1">Choose Date & Time</label>
                  <div className="relative">
                    <input 
                      type="datetime-local" 
                      value={interviewDateTime}
                      onChange={(e) => setInterviewDateTime(e.target.value)}
                      className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#ffdd66]/20 focus:border-[#ffdd66] transition-all font-bold text-[#1a1a1a] appearance-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setInterviewModal({ id: '', type: 'app', visible: false });
                    setInterviewDateTime('');
                  }}
                  className="flex-1 py-4 rounded-2xl bg-white border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all"
                >
                  Discard
                </button>
                <button 
                  onClick={handleScheduleInterviewAdmin}
                  className="flex-1 py-4 rounded-2xl bg-[#1a1a1a] text-[#ffdd66] font-bold text-sm shadow-xl shadow-black/20 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                >
                  Confirm Call <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}