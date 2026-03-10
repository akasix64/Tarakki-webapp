import React, { useMemo } from 'react';
import { FileText, DollarSign, Activity, GitCommit, ShieldCheck, XCircle } from 'lucide-react';
import { fetchApi } from '../lib/api';

interface AdminFinanceLogsProps {
  projects: any[];
  applications: any[];
  users: any[];
  subscriptionLogs?: any[];
}

export default function AdminFinanceLogs({ projects, applications, users, subscriptionLogs = [] }: AdminFinanceLogsProps) {

  // Generate Financials from projects
  const financials = useMemo(() => {
    let totalFixedBudget = 0;
    const projectFinancials = projects.map(p => {
      let numericBudget = 0;
      if (p.budget) {
        // Strip non-numeric characters to get an approximate budget amount
        const stripped = p.budget.replace(/[^0-9.]/g, '');
        if (stripped) {
          numericBudget = parseFloat(stripped);
          totalFixedBudget += numericBudget;
        }
      }
      return {
        id: p.id,
        title: p.title,
        type: p.type,
        budget: p.budget || '—',
        hourly: p.hourly_rate || '—',
        monthly: p.monthly_rate || '—',
        numericBudget,
        created_at: p.created_at,
        status: p.status || 'Open'
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Calculate Subscription Revenue
    let subRevenue = 0;
    subscriptionLogs.forEach(s => {
      const amt = s.amount?.replace(/[^0-9.]/g, '');
      if (amt) subRevenue += parseFloat(amt);
    });

    return { data: projectFinancials, totalFixedBudget, subRevenue };
  }, [projects, subscriptionLogs]);

  // Generate Audit Logs by combining all events
  const auditLogs = useMemo(() => {
    const logs: any[] = [];
    
    // User registrations
    users.forEach(u => {
      logs.push({
        id: `u-${u.id}`,
        timestamp: new Date(u.created_at).getTime(),
        dateStr: new Date(u.created_at).toLocaleString(),
        type: 'User',
        action: `New ${u.role} registered`,
        details: u.full_name || u.email,
        icon: <Activity className="w-4 h-4 text-blue-500" />,
        color: 'bg-blue-500/10 border-blue-500/20 text-blue-500'
      });
    });

    // Project postings
    projects.forEach(p => {
      logs.push({
        id: `p-${p.id}`,
        timestamp: new Date(p.created_at).getTime(),
        dateStr: new Date(p.created_at).toLocaleString(),
        type: 'Project',
        action: 'New project posted',
        details: p.title,
        icon: <FileText className="w-4 h-4 text-[#ffdd66]" />,
        color: 'bg-[#ffdd66]/10 border-[#ffdd66]/20 text-[#ffdd66]'
      });
    });

    // Applications submitted/updated
    applications.forEach(a => {
      logs.push({
        id: `a-${a.id}`,
        timestamp: new Date(a.created_at).getTime(),
        dateStr: new Date(a.created_at).toLocaleString(),
        type: 'Application',
        action: `Application ${a.status || 'submitted'}`,
        details: `${a.profiles?.full_name || 'User'} applied to ${a.projects?.title || 'Project'}`,
        icon: <GitCommit className="w-4 h-4 text-emerald-500" />,
        color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
      });
    });

    // Subscriptions
    subscriptionLogs.forEach(s => {
      logs.push({
        id: `s-${s.id}`,
        timestamp: new Date(s.created_at).getTime(),
        dateStr: new Date(s.created_at).toLocaleString(),
        type: 'Subscription',
        action: 'New Pro Plan',
        details: `${s.full_name || s.email} subscribed to ${s.plan_name} (${s.amount})`,
        icon: <ShieldCheck className="w-4 h-4 text-indigo-500" />,
        color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500'
      });
    });

    // Sort descending by timestamp
    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }, [users, projects, applications, subscriptionLogs]);

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* ── TOP STATS ROW ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 border border-white/40 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Confirmed Revenue</p>
          <div className="flex items-center justify-between">
            <h4 className="text-2xl font-bold text-[#1a1a1a]">₹{financials.subRevenue.toLocaleString()}</h4>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <p className="text-[9px] text-emerald-600 font-bold mt-2 uppercase tracking-tight">from subscriptions</p>
        </div>

        <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 border border-white/40 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Project Estimates</p>
          <div className="flex items-center justify-between">
            <h4 className="text-2xl font-bold text-[#1a1a1a]">₹{financials.totalFixedBudget.toLocaleString()}</h4>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <p className="text-[9px] text-blue-500 font-bold mt-2 uppercase tracking-tight">total platform volume</p>
        </div>

        <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 border border-white/40 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Active Projects</p>
          <div className="flex items-center justify-between">
            <h4 className="text-2xl font-bold text-[#1a1a1a]">{projects.length}</h4>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <p className="text-[9px] text-orange-600 font-bold mt-2 uppercase tracking-tight">posted opportunities</p>
        </div>

        <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 border border-white/40 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total Users</p>
          <div className="flex items-center justify-between">
            <h4 className="text-2xl font-bold text-[#1a1a1a]">{users.length}</h4>
            <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-slate-500" />
            </div>
          </div>
          <p className="text-[9px] text-slate-500 font-bold mt-2 uppercase tracking-tight">platform growth</p>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Project Financials */}
        <div className="bg-white/60 backdrop-blur-md rounded-[2rem] p-8 border border-white/40 shadow-sm flex flex-col hover:border-white/80 transition-all max-h-[500px]">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1a1a1a]">Project Estimates</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Estimated platform volume</p>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Title', 'Budget', 'Status'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {financials.data.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 py-4">
                      <p className="text-sm font-bold text-[#1a1a1a]">{p.title}</p>
                      <p className="text-[9px] font-bold uppercase tracking-tight text-slate-400">{p.type}</p>
                    </td>
                    <td className="px-3 py-4 text-xs font-bold text-emerald-600">{p.budget}</td>
                    <td className="px-3 py-4">
                      <span className={`text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                        p.status === 'Open' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                      }`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subscription History */}
        <div className="bg-white/60 backdrop-blur-md rounded-[2rem] p-8 border border-white/40 shadow-sm flex flex-col hover:border-white/80 transition-all max-h-[500px]">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1a1a1a]">Subscription History</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Confirmed payment logs</p>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['User', 'Plan', 'Amount', 'Date'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {subscriptionLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-10 text-center">
                      <ShieldCheck className="w-8 h-8 text-slate-100 mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No subscription transactions found</p>
                    </td>
                  </tr>
                ) : (
                  subscriptionLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-4">
                        <p className="text-sm font-bold text-[#1a1a1a] truncate max-w-[120px]">{log.full_name || 'User'}</p>
                        <p className="text-[9px] text-slate-400 truncate max-w-[120px]">{log.email}</p>
                      </td>
                      <td className="px-3 py-4">
                        <span className="text-[9px] font-bold uppercase tracking-tight text-indigo-600">{log.plan_name}</span>
                      </td>
                      <td className="px-3 py-4 text-[10px] font-bold text-emerald-600">
                        ₹{log.amount}
                      </td>
                      <td className="px-3 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                        {new Date(log.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subscriptions Table (User Management) */}
        <div className="bg-white/60 backdrop-blur-md rounded-[2rem] p-8 border border-white/40 shadow-sm flex flex-col hover:border-white/80 transition-all max-h-[500px]">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-5">
            <div className="w-10 h-10 rounded-xl bg-[#ffdd66]/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#ffdd66]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1a1a1a]">Member Management</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Track and update active plans</p>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['User', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 py-4">
                      <p className="text-sm font-bold text-[#1a1a1a]">{u.full_name || u.role}</p>
                      <p className="text-[9px] text-slate-400 truncate max-w-[120px]">{u.email}</p>
                    </td>
                    <td className="px-3 py-4">
                      {u.is_member && u.subscription_date ? (
                        <span className="text-[9px] font-bold uppercase tracking-tight text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Pro</span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase tracking-tight text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">Free</span>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      {u.is_member ? (
                        <span className="text-[9px] font-bold text-emerald-500 px-2 py-1 rounded uppercase tracking-widest border border-emerald-100 bg-emerald-50 cursor-default inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <button 
                          onClick={async () => {
                            if (!confirm(`Promote ${u.email} to Pro Member?`)) return;
                            try {
                              await fetchApi(`/profiles/${u.id}`, {
                                method: 'PUT',
                                body: JSON.stringify({ is_member: true, subscription_date: new Date().toISOString() })
                              });
                              window.location.reload(); 
                            } catch (err) { alert('Error: ' + (err as Error).message); }
                          }}
                          className="text-[9px] font-bold text-blue-500 hover:bg-blue-50 px-2 py-1 rounded transition-colors uppercase tracking-widest border border-blue-100"
                        >
                          Promote
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Audit Logs */}
        <div className="bg-white/60 backdrop-blur-md rounded-[2rem] p-8 border border-white/40 shadow-sm flex flex-col hover:border-white/80 transition-all max-h-[500px]">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-5">
            <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1a1a1a]">Event Feed</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Real-time system activity</p>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Event', 'Details', 'Time'].map(h => (
                    <th key={h} className="px-2 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {auditLogs.slice(0, 50).map(log => (
                  <tr key={`${log.id}-${log.timestamp}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-2 py-3">
                      <span className={`text-[8px] font-bold uppercase tracking-tight px-2 py-0.5 rounded border ${log.color}`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-[10px] font-medium text-slate-600 truncate max-w-[120px]">{log.details}</td>
                    <td className="px-2 py-3 text-[9px] font-bold text-slate-400 whitespace-nowrap">{log.dateStr.split(',')[1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
