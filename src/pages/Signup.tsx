import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Briefcase, Building2, User, Zap, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Shared Styles ────────────────────────────────────────────────────────────
const inp = "w-full h-14 px-5 text-sm bg-white/5 border border-[#1a1a1a]/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#ffdd66] focus:border-transparent placeholder:text-[#1a1a1a]/40 text-[#1a1a1a] font-medium transition-all shadow-sm";
const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-2 pl-2";

export default function Signup() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'contractor';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: name,
          }
        }
      });

      if (authError) throw authError;

      // 2. Create profile entry based on role
      if (authData.user) {
        const profileData = {
          id: authData.user.id,
          role,
          full_name: name,
          email,
          ...(role === 'contractor' ? { resume_url: resumeUrl } : {}),
          ...(role === 'startup' ? { gst_number: gstNumber } : {}),
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([profileData]);

        if (profileError) {
          console.error("Profile creation error:", profileError);
          // We don't throw here to not block the user if they signed up successfully
        }
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'An error occurred with Google signup');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#ffdd66] selection:text-black relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f8f9f4 0%, #f0ebd8 50%, #fefcf3 100%)' }}>

      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#ffdd66]/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/40 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl z-10"
      >
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#1a1a1a]/50 hover:text-[#1a1a1a] transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back Home
        </Link>

        <div className="bg-white/60 backdrop-blur-xl p-10 md:p-14 rounded-[2.5rem] shadow-xl border border-white/80 w-full relative overflow-hidden">

          <div className="mb-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-[#1a1a1a] rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-3">
              <Zap className="w-8 h-8 text-[#ffdd66] fill-[#ffdd66]" />
            </div>
            <h2 className="text-4xl font-light tracking-tight text-[#1a1a1a]">
              Join the <span className="font-semibold">Network</span>
            </h2>
            <p className="mt-3 text-[#1a1a1a]/60 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-[#1a1a1a] font-bold hover:text-[#d4b341] transition-colors underline decoration-[#ffdd66]/50 decoration-2 underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>

          {/* Role Selection */}
          <div className="flex gap-4 mb-10 bg-white/40 p-2 rounded-2xl border border-white/50 relative z-10">
            <button
              type="button"
              onClick={() => setRole('contractor')}
              className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 font-bold ${role === 'contractor'
                  ? 'bg-[#1a1a1a] text-white shadow-lg scale-[1.02]'
                  : 'text-[#1a1a1a]/50 hover:bg-white/50 hover:text-[#1a1a1a]'
                }`}
            >
              <User className={`h-6 w-6 mb-2 ${role === 'contractor' ? 'text-[#ffdd66]' : ''}`} />
              <span className="text-xs uppercase tracking-wider">Contractor</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('startup')}
              className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 font-bold ${role === 'startup'
                  ? 'bg-[#1a1a1a] text-white shadow-lg scale-[1.02]'
                  : 'text-[#1a1a1a]/50 hover:bg-white/50 hover:text-[#1a1a1a]'
                }`}
            >
              <Building2 className={`h-6 w-6 mb-2 ${role === 'startup' ? 'text-[#ffdd66]' : ''}`} />
              <span className="text-xs uppercase tracking-wider">Startup</span>
            </button>
          </div>

          <form className="space-y-6 relative z-10" onSubmit={handleSignup}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-2xl text-sm font-bold text-center">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label htmlFor="name" className={labelCls}>{role === 'startup' ? "Company Name *" : "Full Name *"}</label>
                <input
                  id="name"
                  type="text"
                  required
                  className={inp}
                  placeholder={role === 'startup' ? "Eg. TechCorp Inc." : "Eg. Jane Dow"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="email-address" className={labelCls}>Email address *</label>
                <input
                  id="email-address"
                  type="email"
                  autoComplete="email"
                  required
                  className={inp}
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className={labelCls}>Password *</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={inp}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Role specific fields */}
              {role === 'contractor' && (
                <div>
                  <label htmlFor="resume" className={labelCls}>Resume Link *</label>
                  <input
                    id="resume"
                    type="url"
                    required
                    className={inp}
                    placeholder="https://drive.google.com/..."
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                  />
                  <p className="text-[10px] text-[#1a1a1a]/40 mt-2 font-medium px-2">* Please provide a public link to your current resume.</p>
                </div>
              )}

              {role === 'startup' && (
                <div>
                  <label htmlFor="gst" className={labelCls}>GST Number *</label>
                  <input
                    id="gst"
                    type="text"
                    required
                    className={inp}
                    placeholder="e.g. 29ABCDE1234F1Z5"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-[#ffdd66] text-[#1a1a1a] flex items-center justify-center font-bold text-base rounded-full hover:bg-black hover:text-[#ffdd66] transition-all shadow-xl shadow-[#ffdd66]/20 disabled:opacity-50 mt-8 group"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 relative z-10">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1a1a1a]/10" />
              </div>
              <span className="relative bg-[#f6f2e6] px-4 text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/40 rounded-full">
                Or connect
              </span>
            </div>

            <button
              onClick={handleGoogleSignup}
              className="mt-8 w-full h-14 bg-white text-[#1a1a1a] flex items-center justify-center gap-3 font-bold rounded-full hover:bg-[#1a1a1a] hover:text-white transition-all shadow-sm border border-[#1a1a1a]/5"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign up with Google
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
