import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, Clock, Search, Filter, ArrowRight, Briefcase, Calendar } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { supabase } from '../lib/supabase';

export default function Bids() {
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [interviewModal, setInterviewModal] = useState<{ bidId: string; visible: boolean }>({ bidId: '', visible: false });
  const [interviewDateTime, setInterviewDateTime] = useState('');

  useEffect(() => {
    const fetchUserAndBids = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const profile = await fetchApi(`/profiles/${session.user.id}`);
          setUserRole(profile?.role?.toLowerCase() || '');
        }

        const data = await fetchApi('/bids');
        if (data) setBids(data);
      } catch (err) {
        console.error('Error fetching bids:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndBids();
  }, []);

  const updateStatus = async (bidId: string, newStatus: string, metadata?: any) => {
    // Optimistic update
    setBids(prev => prev.map(b => b.id === bidId ? { ...b, status: newStatus, ...metadata } : b));
    try {
      const body: any = { status: newStatus };
      if (metadata) {
        Object.assign(body, metadata);
      }
      await fetchApi(`/bids/${bidId}/status`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
    } catch (err) {
      console.error('Update failed:', err);
      // Refresh to sync state
      const data = await fetchApi('/bids');
      if (data) setBids(data);
      alert('Failed to update status');
    }
  };

  const handleScheduleInterview = () => {
    if (!interviewDateTime) {
      alert('Please select a date and time');
      return;
    }
    updateStatus(interviewModal.bidId, 'interview call', { interview_schedule_date_and_time: interviewDateTime });
    setInterviewModal({ bidId: '', visible: false });
    setInterviewDateTime('');
  };

  return (
    <div className="min-h-screen bg-[#f8f9f4] py-12 px-4 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-bold text-[#1a1a1a] mb-2 tracking-tight">Startup Bids</h1>
            <p className="text-slate-500 font-medium">
              {userRole === 'admin' ? 'Review and manage project bids from startups' : 'Track the status of your project bids'}
            </p>
          </motion.div>
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-3xl px-6 py-4 shadow-sm border border-slate-100 flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Bids</span>
                <span className="text-2xl font-bold text-[#1a1a1a]">{bids.length}</span>
              </div>
              <div className="w-[1px] h-10 bg-slate-100" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">In Review</span>
                <span className="text-2xl font-bold text-cyan-500">
                  {bids.filter(b => b.status === 'pending' || b.status === 'review').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Activity className="w-12 h-12 text-[#ffdd66]" />
            </motion.div>
            <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Processing Data...</p>
          </div>
        ) : bids.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[3rem] p-24 text-center border border-slate-100 shadow-sm"
          >
            <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-8 border border-slate-100">
              <Activity className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-2xl font-bold text-[#1a1a1a] mb-3">No Active Bids</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-8 text-lg">
              {userRole === 'admin' ? "The bids table is currently empty." : "You haven't submitted any bids yet. Head to Projects to get started!"}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {bids.map((bid, idx) => (
              <motion.div
                key={bid.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 hover:shadow-2xl transition-all group relative overflow-hidden"
              >
                {/* Background Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffdd66]/5 rounded-bl-[5rem] -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-500" />
                
                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] flex items-center justify-center text-[#ffdd66] text-2xl font-bold shadow-xl">
                      {bid.projects?.title ? bid.projects.title[0].toUpperCase() : 'B'}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[#1a1a1a] text-xl leading-tight mb-1">
                        {bid.projects?.title || 'Unknown Project'}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#ffdd66]" />
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                          By {bid.profiles?.full_name || 'Anonymous Startup'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {userRole === 'admin' ? (
                    <select
                      value={bid.status || 'pending'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'interview call') {
                          setInterviewModal({ bidId: bid.id, visible: true });
                        } else {
                          updateStatus(bid.id, val);
                        }
                      }}
                      className="bg-slate-50 border border-slate-200 text-[#1a1a1a] text-[10px] font-bold uppercase tracking-widest rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ffdd66]/20 cursor-pointer hover:bg-white transition-all shadow-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="review">Under Review</option>
                      <option value="interview call">Interview Call</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  ) : (
                    <div className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border shadow-sm ${
                      ['accepted', 'approved'].includes(bid.status?.toLowerCase()) ? 'bg-green-50 text-green-600 border-green-100' :
                      bid.status?.toLowerCase() === 'shortlisted' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                      bid.status?.toLowerCase() === 'interview call' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                      bid.status?.toLowerCase() === 'review' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                      bid.status?.toLowerCase() === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                      'bg-[#ffdd66]/10 text-[#1a1a1a] border-[#ffdd66]/20'
                    }`}>
                      {bid.status || 'pending'}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100 group-hover:bg-white transition-colors duration-300">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                       Bid Amount
                    </p>
                    <p className="text-2xl font-black text-[#1a1a1a]">{bid.bid_amount}</p>
                  </div>
                  <div className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100 group-hover:bg-white transition-colors duration-300">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                       Timeline
                    </p>
                    <p className="text-2xl font-black text-[#1a1a1a]">{bid.delivery_time}</p>
                  </div>
                </div>

                {bid.interview_schedule_date_and_time && (
                  <div className="mb-8 p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">Bidding Scheduled</p>
                      <p className="text-sm font-bold text-[#1a1a1a]">
                        {new Date(bid.interview_schedule_date_and_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-200" />
                  </div>
                )}

                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {new Date(bid.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <button className="flex items-center gap-3 text-sm font-bold text-[#1a1a1a] hover:text-cyan-600 transition-all">
                    View Proposal <ArrowRight className="w-4 h-4 text-[#ffdd66]" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Interview Modal */}
      {interviewModal.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[3rem] shadow-2xl p-10 max-w-md w-full border border-white"
          >
            <h3 className="text-2xl font-black text-[#1a1a1a] mb-2 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-[#ffdd66]" /> Schedule Call
            </h3>
            <p className="text-sm text-slate-500 mb-8 font-medium italic">Set the date and time for the interview call with the startup.</p>
            
            <div className="space-y-4 mb-10">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 pl-2">Date & Time</label>
              <input 
                type="datetime-local" 
                value={interviewDateTime}
                onChange={(e) => setInterviewDateTime(e.target.value)}
                className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#ffdd66]/10 transition-all font-bold text-[#1a1a1a]"
              />
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setInterviewModal({ bidId: '', visible: false })}
                className="flex-1 py-4 rounded-2xl bg-slate-50 text-slate-400 font-bold text-sm hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleScheduleInterview}
                className="flex-1 py-4 rounded-2xl bg-[#1a1a1a] text-[#ffdd66] font-bold text-sm shadow-xl shadow-black/10 hover:-translate-y-1 transition-all"
              >
                Schedule Now
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
