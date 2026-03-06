import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowRight, CheckCircle, Briefcase, Zap, Star } from 'lucide-react';

export default function Landing() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(4); // Only fetch top 4 recent projects for the landing page

        if (error) throw error;

        // If we have live data, use it, otherwise fall back to empty state seamlessly
        if (data && data.length > 0) {
          setProjects(data);
        } else {
          // Mock fallback only if DB is literally empty during setup
          setProjects([
            { id: 1, title: 'Oracle Cloud Infrastructure Migration', type: 'Contract', location: 'Remote', description: 'Looking for an experienced Oracle DBA to migrate our on-premise databases to OCI.', budget: '₹50,000 - ₹80,000 / month' },
            { id: 2, title: 'Oracle E-Business Suite Upgrade', type: 'Project', location: 'Hybrid - Bangalore', description: 'Need a team to upgrade our Oracle EBS from 12.1 to 12.2. Startup teams preferred.', budget: '₹5,00,000 fixed' }
          ]);
        }
      } catch (err) {
        console.error("Error fetching projects for landing page:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="flex flex-col min-h-screen font-sans selection:bg-[#ffdd66] selection:text-black overflow-hidden" style={{ background: 'linear-gradient(135deg, #f8f9f4 0%, #f0ebd8 50%, #fefcf3 100%)' }}>

      {/* ── Hero Section ────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center w-full">
        {/* Decorative subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ffdd66]/40 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/60 backdrop-blur-md border border-white/80 text-sm font-bold tracking-wide text-[#1a1a1a] mb-8 shadow-sm"
        >
          <Star className="w-4 h-4 text-[#ffdd66] fill-[#ffdd66]" />
          The Premium Network for Oracle Professionals
        </motion.div>

        <motion.h1
          className="text-6xl md:text-8xl font-light tracking-tighter text-[#1a1a1a] mb-8 leading-[1.1] max-w-5xl relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Innovating Enterprise Solutions <span className="font-medium inline-block relative">
            {['O','r','a','c','l','e'].map((letter, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.12 }}
                className="inline-block"
                style={{ marginRight: i < 5 ? '0.05em' : 0 }}
              >
                {letter}
              </motion.span>
            ))}
            {' '}{['j','o','u','r','n','e','y','.'].map((letter, i) => (
              <motion.span
                key={`j${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.22 + i * 0.1 }}
                className="inline-block"
              >
                {letter}
              </motion.span>
            ))}
            <svg className="absolute -bottom-2 left-0 w-full h-3 text-[#ffdd66]" viewBox="0 0 100 12" preserveAspectRatio="none">
              <path d="M0,10 Q50,0 100,10" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round" />
            </svg>
          </span> <br />
        </motion.h1>

        <motion.p
          className="text-xl md:text-2xl text-[#1a1a1a]/60 mb-12 max-w-2xl mx-auto font-light leading-relaxed relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Exclusive projects. High-value contracts. Direct access to <span className="font-medium text-[#1a1a1a]">Oracle contracts</span>.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link
            to="/signup"
            className="group inline-flex items-center justify-center px-10 h-16 text-lg font-bold rounded-full text-black bg-[#ffdd66] hover:bg-[#ffcc00] transition-all shadow-xl shadow-[#ffdd66]/20 hover:-translate-y-1"
          >
            Join the Network <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/projects"
            className="inline-flex items-center justify-center px-10 h-16 text-lg font-bold rounded-full text-[#1a1a1a] bg-white/60 backdrop-blur-xl border border-white/80 hover:bg-white/90 transition-all shadow-sm hover:-translate-y-1"
          >
            Explore Projects
          </Link>
        </motion.div>
      </section>

      {/* ── Featured Projects ──────────────────────────────────────── */}
      <section className="py-24 w-full relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center mb-16 flex flex-col items-center">
          <span className="inline-block px-4 py-1.5 bg-[#1a1a1a]/5 rounded-full text-xs font-bold tracking-[0.2em] uppercase text-[#1a1a1a]/40 mb-6">Opportunities</span>
          <h2 className="text-4xl md:text-5xl font-light tracking-tight text-[#1a1a1a]">Featured <span className="font-semibold">Projects</span></h2>
          <p className="mt-4 text-xl text-[#1a1a1a]/60 max-w-xl">Preview the exclusive Oracle projects available right now on <span className="font-medium text-[#1a1a1a]">Oracle contracts</span>.</p>
        </div>

        <div
          className="relative w-full flex overflow-hidden group min-h-[350px]"
          style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}
        >
          {loading ? (
            <div className="flex w-full justify-center items-center opacity-50"><p>Loading live projects...</p></div>
          ) : projects.length > 0 ? (
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ ease: "linear", duration: Math.max(20, projects.length * 6), repeat: Infinity }}
              className="flex gap-6 w-max px-6 group-hover:[animation-play-state:paused]"
            >
              {[...Array(2)].map((_, arrayIndex) => (
                <div key={arrayIndex} className="flex gap-6 shrink-0">
                  {projects.map((project, idx) => {
                    // Alternate styles for visual interest
                    const isDark = idx % 2 === 0;
                    return (
                      <div key={`${arrayIndex}-${project.id}`} className={`group/card w-[350px] md:w-[450px] shrink-0 p-8 md:p-10 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[300px] hover:-translate-y-1 transition-all ${isDark ? 'bg-[#1a1a1a] text-white shadow-xl' : 'bg-white/60 backdrop-blur-xl border border-white/80 text-[#1a1a1a] shadow-sm hover:bg-white'}`}>
                        {isDark && <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[50px] pointer-events-none group-hover/card:scale-110 transition-transform duration-700" />}

                        <div className="relative z-10 mb-8">
                          <div className="flex items-center gap-3 mb-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${isDark ? 'bg-[#ffdd66]/10 text-[#ffdd66] border-[#ffdd66]/20' : 'bg-[#1a1a1a]/5 text-[#1a1a1a] border-[#1a1a1a]/10'}`}>{project.type || 'Contract'}</span>
                            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-[#1a1a1a]/40'}`}>{project.location || 'Remote'}</span>
                          </div>
                          <h3 className={`text-2xl leading-tight mb-3 line-clamp-2 ${isDark ? 'font-light' : 'font-semibold'}`}>{project.title}</h3>
                          <p className={`text-sm leading-relaxed line-clamp-3 ${isDark ? 'text-white/60' : 'text-[#1a1a1a]/60'}`}>{project.description}</p>
                        </div>

                        <div className={`relative z-10 flex items-end justify-between border-t pt-6 ${isDark ? 'border-white/10' : 'border-[#1a1a1a]/10'}`}>
                          <div>
                            <p className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${isDark ? 'text-white/40' : 'text-[#1a1a1a]/40'}`}>Budget / Rate</p>
                            <p className={`text-xl ${isDark ? 'font-medium text-[#ffdd66]' : 'font-bold text-[#1a1a1a]'}`}>{project.budget || 'Negotiable'}</p>
                          </div>
                          <Link to="/signup" className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-white/10 group-hover/card:bg-[#ffdd66] group-hover/card:text-black' : 'bg-[#1a1a1a]/5 group-hover/card:bg-[#1a1a1a] group-hover/card:text-white'}`}>
                            <ArrowRight className="w-5 h-5" />
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </motion.div>
          ) : (
            <div className="flex w-full justify-center items-center"><p className="text-[#1a1a1a]/50">No opportunities available at the moment.</p></div>
          )}
        </div>

        <div className="mt-12 text-center relative z-10">
          <Link to="/projects" className="inline-flex items-center gap-2 text-sm font-bold text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition-colors group">
            View all available roles <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ── Features Bento Box ─────────────────────────────────────── */}
      <section className="py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="md:col-span-2 bg-[#1a1a1a] rounded-[2.5rem] p-10 md:p-14 relative overflow-hidden group shadow-xl shadow-black/5"
          >
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#ffdd66]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 group-hover:bg-[#ffdd66]/20 transition-colors duration-700" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-[#ffdd66] rounded-2xl flex items-center justify-center mb-10 shadow-lg shadow-[#ffdd66]/20 group-hover:scale-105 transition-transform">
                <Briefcase className="h-8 w-8 text-[#1a1a1a]" />
              </div>
              <h3 className="text-3xl md:text-5xl font-light tracking-tight text-white mb-6">Exclusive <span className="font-medium">Projects</span></h3>
              <p className="text-white/60 text-lg leading-relaxed max-w-md">Access massive, high-value Oracle implementations and migrations directly from Oracle Contracts. No middlemen, just tier-1 work.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-10 md:p-12 shadow-sm hover:bg-white/60 transition-colors group"
          >
            <div className="w-14 h-14 bg-[#1a1a1a] rounded-2xl flex items-center justify-center mb-8 group-hover:rotate-[10deg] transition-transform">
              <Zap className="h-6 w-6 text-[#ffdd66]" />
            </div>
            <h3 className="text-2xl font-semibold text-[#1a1a1a] mb-4">Precision Matching</h3>
            <p className="text-[#1a1a1a]/70 leading-relaxed font-medium">Our system analyzes your specific Oracle expertise to pair you with the perfect role.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-10 md:p-12 shadow-sm hover:bg-white/60 transition-colors group"
          >
            <div className="w-14 h-14 bg-[#1a1a1a] rounded-2xl flex items-center justify-center mb-8 group-hover:rotate-[10deg] transition-transform">
              <CheckCircle className="h-6 w-6 text-[#ffdd66]" />
            </div>
            <h3 className="text-2xl font-semibold text-[#1a1a1a] mb-4">Premium Status</h3>
            <p className="text-[#1a1a1a]/70 leading-relaxed font-medium">Stand out to the employer with prioritized profiles and instant application routing.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }}
            className="md:col-span-2 bg-[#ffdd66] rounded-[2.5rem] p-10 md:p-14 flex flex-col justify-center relative overflow-hidden group shadow-lg shadow-[#ffdd66]/10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
            <h3 className="text-4xl md:text-5xl font-light tracking-tight text-[#1a1a1a] mb-6 relative z-10">Stop hunting.<br /><span className="font-semibold">Start building.</span></h3>
            <p className="text-[#1a1a1a]/80 text-xl leading-relaxed max-w-lg relative z-10 mb-10 font-medium">Focus on delivering world-class Oracle solutions while we bring the best opportunities directly to your dashboard.</p>
            <Link to="/signup" className="relative z-10 w-fit inline-flex items-center gap-3 px-10 py-5 bg-[#1a1a1a] text-white rounded-full font-bold hover:bg-black hover:-translate-y-1 transition-all shadow-xl shadow-black/10">
              Create Profile <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>



      {/* ── Pricing Section ────────────────────────────────────────── */}
      <section className="py-24 px-6 max-w-5xl mx-auto w-full">
        <div className="text-center mb-20 flex flex-col items-center">
          <span className="inline-block px-4 py-1.5 bg-[#1a1a1a]/5 rounded-full text-xs font-bold tracking-[0.2em] uppercase text-[#1a1a1a]/40 mb-6">Membership</span>
          <h2 className="text-5xl md:text-6xl font-light tracking-tight text-[#1a1a1a]">Select your <span className="font-semibold">Tier</span></h2>
          <p className="mt-6 text-xl text-[#1a1a1a]/60 max-w-xl">Maximize your visibility and project access directly with Oracle Contracts.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ffdd66]/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Contractor Plan */}
          <motion.div
            initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="bg-white/50 backdrop-blur-xl border border-white/80 rounded-[2.5rem] p-12 flex flex-col shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative z-10"
          >
            <div className="mb-10">
              <span className="inline-block px-5 py-2 bg-[#1a1a1a]/5 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase text-[#1a1a1a] mb-8">Individual</span>
              <h3 className="text-4xl font-light text-[#1a1a1a] mb-4">Contractor <span className="font-medium">Pro</span></h3>
              <p className="text-[#1a1a1a]/60 text-lg font-medium">For solo Oracle professionals.</p>
            </div>
            <div className="mb-12">
              <span className="text-6xl font-light tracking-tighter text-[#1a1a1a]">₹999</span>
              <span className="text-[#1a1a1a]/40 font-bold ml-2 text-xl">/yr</span>
            </div>
            <ul className="space-y-6 mb-12 flex-1">
              <li className="flex items-center text-[#1a1a1a]/80 font-bold text-lg"><CheckCircle className="h-6 w-6 text-[#ffdd66] fill-[#1a1a1a] border border-[#1a1a1a] rounded-full mr-4 shrink-0" /> Priority matching</li>
              <li className="flex items-center text-[#1a1a1a]/80 font-bold text-lg"><CheckCircle className="h-6 w-6 text-[#ffdd66] fill-[#1a1a1a] border border-[#1a1a1a] rounded-full mr-4 shrink-0" /> Highlighted profile visibility</li>
              <li className="flex items-center text-[#1a1a1a]/80 font-bold text-lg"><CheckCircle className="h-6 w-6 text-[#ffdd66] fill-[#1a1a1a] border border-[#1a1a1a] rounded-full mr-4 shrink-0" /> Instant notifications</li>
            </ul>
            <Link to="/signup?role=contractor" className="w-full py-5 bg-[#1a1a1a] text-white rounded-full font-bold text-lg text-center hover:bg-black transition-colors shadow-xl shadow-black/10 hover:-translate-y-1">
              Join as Contractor
            </Link>
          </motion.div>

          {/* Startup Plan */}
          <motion.div
            initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="bg-[#1a1a1a] rounded-[2.5rem] p-12 flex flex-col relative overflow-hidden shadow-2xl shadow-black/20 hover:-translate-y-2 transition-all duration-300 group z-10"
          >
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#ffdd66]/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-[#ffdd66]/20 transition-colors duration-500" />
            <div className="absolute top-8 right-8 bg-[#ffdd66] text-black px-5 py-2 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase shadow-lg shadow-[#ffdd66]/20">Most Popular</div>

            <div className="mb-10 relative z-10">
              <span className="inline-block px-5 py-2 bg-white/10 border border-white/5 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase text-white/70 mb-8">Agency</span>
              <h3 className="text-4xl font-light text-white mb-4">Startup <span className="font-medium text-[#ffdd66]">Enterprise</span></h3>
              <p className="text-white/50 text-lg font-medium">For specialized Oracle teams.</p>
            </div>
            <div className="mb-12 relative z-10">
              <span className="text-6xl font-light tracking-tighter text-white">₹4,999</span>
              <span className="text-white/40 font-bold ml-2 text-xl">/yr</span>
            </div>
            <ul className="space-y-6 mb-12 flex-1 relative z-10">
              <li className="flex items-center text-white/90 font-bold text-lg"><CheckCircle className="h-6 w-6 text-black fill-[#ffdd66] mr-4 shrink-0" /> Top-tier large project access</li>
              <li className="flex items-center text-white/90 font-bold text-lg"><CheckCircle className="h-6 w-6 text-black fill-[#ffdd66] mr-4 shrink-0" /> Complete team portfolio</li>
              <li className="flex items-center text-white/90 font-bold text-lg"><CheckCircle className="h-6 w-6 text-black fill-[#ffdd66] mr-4 shrink-0" /> Dedicated engagement support</li>
            </ul>
            <Link to="/signup?role=startup" className="relative z-10 w-full py-5 bg-[#ffdd66] text-[#1a1a1a] rounded-full font-bold text-lg text-center hover:bg-white transition-colors shadow-xl shadow-[#ffdd66]/20 hover:-translate-y-1">
              Join as Startup
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="py-12 border-t border-[#1a1a1a]/5 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-[#ffdd66] fill-[#ffdd66]" />
            <span className="text-[#1a1a1a] font-bold tracking-tight text-2xl">Tarakki</span>
          </div>
          <p className="text-sm text-[#1a1a1a]/40 font-bold tracking-wide">© {new Date().getFullYear()} Tarakki. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
