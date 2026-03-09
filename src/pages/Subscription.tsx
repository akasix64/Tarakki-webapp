import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { fetchApi } from '../lib/api';
import { ShieldCheck, CheckCircle2, ArrowLeft, Loader2, Sparkles, Building2, User } from 'lucide-react';

export default function Subscription() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  const isMemberActive = (p: any) => {
    if (!p?.is_member) return false;
    // Strict check: Must have a subscription date to be considered active
    if (!p?.subscription_date) return false; 
    const subDate = new Date(p.subscription_date);
    const expDate = new Date(subDate);
    expDate.setFullYear(expDate.getFullYear() + 1);
    return new Date() < expDate;
  };

  const isActive = isMemberActive(profile);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      try {
        const data = await fetchApi(`/profiles/${session.user.id}`);
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleSubscribe = async () => {
    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      
      const userId = session.user.id;
      
      // 1. Update Profile (is_member = true)
      await fetchApi(`/profiles/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          is_member: true,
          subscription_date: new Date().toISOString()
        })
      });

      // 2. Fetch latest profile data to ensure log accuracy
      const { data: latestProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      // 3. Log the subscription event for Admin with detailed error catching
      try {
        const payload = {
          user_id: userId,
          full_name: latestProfile?.full_name || 'Admin/User',
          email: latestProfile?.email,
          plan_name: latestProfile?.role === 'startup' ? 'Startup Pro' : 'Contractor Pro',
          amount: latestProfile?.role === 'startup' ? '4999' : '999'
        };
        
        await fetchApi('/subscriptions/log', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        console.log('Successfully logged subscription');
      } catch (logErr: any) {
        console.error('CRITICAL: Failed to log subscription:', logErr);
        // Provide clear feedback so we can fix the SQL/RLS policies
        alert(`Log FAILED: ${logErr.message}\n\nThis is likely a Supabase RLS issue. Please ensure you have run the RLS POLICIES script in your Supabase SQL Editor.`);
      }

      // Update local state immediately
      setProfile((prev: any) => ({ ...prev, is_member: true, subscription_date: new Date().toISOString() }));
      
      alert('Congratulations! Profile updated. Check dashboard or logs.');
      
      // Give a tiny delay for visual effect
      setTimeout(() => {
        setProcessing(false);
        navigate(latestProfile?.role === 'startup' ? '/dashboard' : '/dashboard'); 
      }, 1500);
    } catch (err) {
      console.error('Failed to subscribe', err);
      setProcessing(false);
      alert('Subscription failed. Please try again later.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a1a1a]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans selection:bg-[#ffdd66] selection:text-black py-16 px-6" style={{ background: 'linear-gradient(135deg, #f8f9f4 0%, #f0ebd8 50%, #fefcf3 100%)' }}>
      
      {/* Navigation header */}
      <div className="max-w-6xl mx-auto mb-12 flex items-center justify-between">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 backdrop-blur-md shadow-sm border border-white/50 text-[#1a1a1a] font-bold text-sm hover:bg-white transition-all active:scale-95">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ffdd66]/20 border border-[#ffdd66]/50 text-[#1a1a1a] font-bold text-xs uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#ffdd66]" /> Unlock the full platform
          </div>
          <h1 className="text-5xl md:text-6xl font-light tracking-tight text-[#1a1a1a] mb-6">
            Upgrade to <span className="font-bold">Pro Member</span>
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto text-lg leading-relaxed">
            Get exclusive access to premium opportunities, top-tier AI matching algorithms, and unbounded application limits.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto perspective-1000">
          
          {/* Free Plan */}
          <div className="bg-white/60 border border-white/50 backdrop-blur-md rounded-[2.5rem] p-10 shadow-sm flex flex-col items-start transition-transform duration-500 hover:scale-[1.02]">
            <h3 className="text-xl font-bold text-slate-400 mb-2">Basic Plan</h3>
            <div className="flex items-end gap-2 mb-8">
              <span className="text-5xl font-light tracking-tighter text-[#1a1a1a]">Free</span>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              {['Standard AI matching', 'Limited monthly bids', 'Basic portfolio profile', 'Standard support'].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-500 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-slate-300" /> {feature}
                </li>
              ))}
            </ul>
            <button disabled className="w-full py-4 rounded-xl border-2 border-slate-200 text-slate-400 font-bold uppercase tracking-widest text-xs bg-slate-50/50">
              {profile?.is_member ? 'Downgrade' : 'Current Plan'}
            </button>
          </div>

          {/* Pro Plan (Billed Yearly) */}
          <div className="bg-[#1a1a1a] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden flex flex-col items-start transform transition-transform duration-500 hover:scale-[1.05] border border-white/10 group">
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#ffdd66]/20 rounded-full blur-3xl group-hover:bg-[#ffdd66]/30 transition-colors duration-700" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
            
            <div className="relative z-10 w-full">
              <div className="flex items-center justify-between w-full mb-2">
                <h3 className="text-xl font-bold text-[#ffdd66]">Pro Member</h3>
                <span className="text-[10px] font-bold text-black uppercase tracking-widest bg-[#ffdd66] px-3 py-1 rounded-full">Most Popular</span>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-6xl font-light tracking-tighter text-white">
                  {profile?.role === 'startup' ? '₹4,999' : '₹999'}
                </span>
                <span className="text-sm font-bold text-white/50 uppercase tracking-widest pb-1.5">/ yr</span>
              </div>
              <p className="text-sm text-white/50 mb-8 border-b border-white/10 pb-8">Billed annually securely through Oracle Contracts.</p>
              
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  'Unlimited project applications',
                  'Priority AI candidate matching',
                  'Highlight your profile with a Pro Badge',
                  'Access to Private Exclusive Contracts',
                  '24/7 Dedicated Support'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/80 font-medium">
                    <ShieldCheck className="w-5 h-5 text-[#ffdd66] shrink-0 mt-0.5" /> <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              {!isActive ? (
                <button 
                  onClick={handleSubscribe} 
                  disabled={processing}
                  className="w-full py-4 rounded-xl bg-[#ffdd66] text-[#1a1a1a] font-bold uppercase tracking-widest text-xs hover:bg-[#ffe077] hover:shadow-lg hover:shadow-[#ffdd66]/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-80 disabled:active:scale-100"
                >
                  {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : (profile?.subscription_date ? 'Renew Subscription' : 'Subscribe Now')}
                </button>
              ) : (
                <div className="w-full py-4 rounded-xl bg-white/10 text-white border border-white/20 font-bold uppercase tracking-widest text-xs text-center flex items-center justify-center gap-2 cursor-default">
                  <ShieldCheck className="w-4 h-4 text-[#10b981]" /> Active Pro Member
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Subscription Details Table */}
        {profile?.is_member && (
          <div className="mt-16 bg-white/60 backdrop-blur-md rounded-[2rem] p-8 border border-white/40 shadow-sm animate-in fade-in slide-in-from-bottom-8">
            <h3 className="text-xl font-bold text-[#1a1a1a] mb-6">Subscription Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Plan</th>
                    <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                    <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount Paid</th>
                    <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Purchase Date</th>
                    <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Expiry Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-5 px-4">
                      <span className="font-bold text-[#1a1a1a]">Pro Member ({profile?.role === 'startup' ? 'Startup' : 'Contractor'})</span>
                    </td>
                    <td className="py-5 px-4">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-100 text-xs font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" /> Expired
                        </span>
                      )}
                    </td>
                    <td className="py-5 px-4 text-sm font-semibold text-slate-600">
                      {profile?.role === 'startup' ? '₹4,999' : '₹999'}
                    </td>
                    <td className="py-5 px-4 text-sm font-medium text-slate-500">
                      {profile?.subscription_date ? new Date(profile.subscription_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-5 px-4 text-sm font-bold text-red-500/80">
                      {(() => {
                        const d = profile?.subscription_date ? new Date(profile.subscription_date) : new Date();
                        d.setFullYear(d.getFullYear() + 1);
                        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                      })()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
