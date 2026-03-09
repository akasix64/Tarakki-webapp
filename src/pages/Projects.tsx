import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Briefcase, MapPin, Clock, Search, SlidersHorizontal, ArrowRight, CheckCircle2, X, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchApi } from '../lib/api';

const LOCATIONS = ['Remote', 'Hybrid', 'On-site'];
const TYPES = ['Contract', 'Project', 'Full-time', 'Part-time'];

export default function Projects() {
  const [session, setSession] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ── Search & filter state ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);

  const activeFilterCount = selectedLocations.length + selectedTypes.length;

  // Close filter panel when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleFilter = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  };

  const clearAllFilters = () => {
    setSelectedLocations([]);
    setSelectedTypes([]);
    setSearchQuery('');
  };

  // ── Data fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchApplications(session.user.id);
    }).catch(err => console.error('Supabase connection error:', err));

    const fetchApplications = async (userId: string) => {
      try {
        const appsData = await fetchApi('/applications');
        // Filter applications for the current user
        const myApps = (appsData || []).filter((a: any) => a.user_id === userId);
        setApplications(myApps);
      } catch (err) {
        console.error('Error fetching applications:', err);
      }
    };

    const fetchProjects = async () => {
      try {
        const data = await fetchApi('/projects');
        if (data && data.length > 0) {
          setProjects(data.map((p: any) => ({
            ...p,
            company: p.company || 'egisedge',
            postedAt: new Date(p.created_at).toLocaleDateString()
          })));
        } else {
          setProjects([
            { id: 1, title: 'Oracle Cloud Infrastructure Migration', company: 'egisedge', location: 'Remote', type: 'Contract', postedAt: '2 days ago', description: 'Looking for an experienced Oracle DBA to migrate our on-premise databases to OCI.', tags: ['Oracle DBA', 'OCI', 'Migration'], budget: '₹50,000 - ₹80,000 / month' },
            { id: 2, title: 'Oracle E-Business Suite Upgrade', company: 'egisedge', location: 'Hybrid', type: 'Project', postedAt: '1 week ago', description: 'Need a team to upgrade our Oracle EBS from 12.1 to 12.2. Startup teams preferred.', tags: ['Oracle EBS', 'Upgrade', 'ERP'], budget: '₹5,00,000 fixed' },
          ]);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();

    const subscription = supabase.channel('public:projects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchProjects)
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, []);

  // ── Filtered projects ──────────────────────────────────────────────────────
  const filteredProjects = projects.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || [p.title, p.description, p.location, ...(p.tags || [])]
      .some(field => field?.toLowerCase().includes(q));

    const matchesLocation = selectedLocations.length === 0 ||
      selectedLocations.some(loc => p.location?.toLowerCase().includes(loc.toLowerCase()));

    const matchesType = selectedTypes.length === 0 ||
      selectedTypes.some(t => p.type?.toLowerCase().includes(t.toLowerCase()));

    return matchesSearch && matchesLocation && matchesType;
  });

  const handleApply = (projectId: string | number) => {
    if (!session) { alert('Please log in to apply for projects.'); return; }
    navigate(`/apply/${projectId}`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-8">
      <div className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto font-sans selection:bg-[#ffdd66] selection:text-black" style={{ background: 'linear-gradient(135deg, #f8f9f4 0%, #f0ebd8 50%, #fefcf3 100%)' }}>

        {/* ── Top Navigation ──────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md rounded-full p-1.5 shadow-sm border border-white/40">
            <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 rounded-full text-sm font-semibold text-slate-500 hover:bg-white/50 hover:text-[#1a1a1a] transition-all">Dashboard</button>
            <button className="px-6 py-2.5 rounded-full text-sm font-semibold bg-[#1a1a1a] text-white">Projects</button>
            <button onClick={() => navigate('/profile')} className="px-6 py-2.5 rounded-full text-sm font-semibold text-slate-500 hover:bg-white/50 hover:text-[#1a1a1a] transition-all">Profile</button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-20">

          {/* ── Header & Search ─────────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-6 pt-4">
            <div>
              <h1 className="text-5xl md:text-6xl tracking-tight text-[#1a1a1a]">
                Available <span className="font-medium">Projects</span>
              </h1>
              <p className="text-[#1a1a1a]/60 text-lg mt-4 max-w-xl">Find the best Oracle opportunities from egisedge. Filter by skills, location, and apply directly.</p>
            </div>

            <div className="flex w-full md:w-auto gap-3 items-center">
              {/* Search Input */}
              <div className="relative flex-1 md:w-96 h-14">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-full pl-12 pr-10 bg-white/60 backdrop-blur-md border border-white/50 rounded-full shadow-sm text-[#1a1a1a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ffdd66] focus:border-transparent transition-all"
                  placeholder="Search roles, skills, location..."
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1a1a1a] transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Button */}
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setShowFilters(v => !v)}
                  className={`h-14 px-6 flex items-center gap-2 rounded-full shadow-sm font-semibold transition-all border relative whitespace-nowrap
                    ${showFilters || activeFilterCount > 0
                      ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                      : 'bg-white/60 backdrop-blur-md border-white/50 text-[#1a1a1a] hover:bg-white/80'}`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-1 w-5 h-5 rounded-full bg-[#ffdd66] text-[#1a1a1a] text-[10px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                {/* ── Filter Dropdown Panel ──────────────────────────────── */}
                {showFilters && (
                  <div className="absolute right-0 top-16 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 p-6 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-sm font-bold text-[#1a1a1a]">Filter Projects</h3>
                      {activeFilterCount > 0 && (
                        <button onClick={clearAllFilters} className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors">
                          Clear all
                        </button>
                      )}
                    </div>

                    {/* Location */}
                    <div className="mb-5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Location</p>
                      <div className="flex flex-wrap gap-2">
                        {LOCATIONS.map(loc => (
                          <button
                            key={loc}
                            onClick={() => toggleFilter(selectedLocations, setSelectedLocations, loc)}
                            className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${selectedLocations.includes(loc)
                              ? 'bg-[#1a1a1a] text-[#ffdd66] border-[#1a1a1a]'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                              }`}
                          >
                            {loc}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Type */}
                    <div className="mb-5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Project Type</p>
                      <div className="flex flex-wrap gap-2">
                        {TYPES.map(type => (
                          <button
                            key={type}
                            onClick={() => toggleFilter(selectedTypes, setSelectedTypes, type)}
                            className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${selectedTypes.includes(type)
                              ? 'bg-[#1a1a1a] text-[#ffdd66] border-[#1a1a1a]'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                              }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setShowFilters(false)}
                      className="w-full py-3 bg-[#1a1a1a] text-white text-sm font-bold rounded-2xl hover:bg-black transition-colors"
                    >
                      Apply Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedLocations.map(loc => (
                <button key={loc} onClick={() => toggleFilter(selectedLocations, setSelectedLocations, loc)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1a1a1a] text-[#ffdd66] text-xs font-bold border border-[#1a1a1a] hover:bg-red-600 hover:text-white hover:border-red-600 transition-all">
                  <MapPin className="w-3 h-3" />{loc}<X className="w-3 h-3" />
                </button>
              ))}
              {selectedTypes.map(type => (
                <button key={type} onClick={() => toggleFilter(selectedTypes, setSelectedTypes, type)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1a1a1a] text-[#ffdd66] text-xs font-bold border border-[#1a1a1a] hover:bg-red-600 hover:text-white hover:border-red-600 transition-all">
                  <Briefcase className="w-3 h-3" />{type}<X className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}

          {/* Results count */}
          {!loading && (
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              {filteredProjects.length} {filteredProjects.length === 1 ? 'role' : 'roles'} found
            </p>
          )}

          {/* ── Project List ─────────────────────────────────────────────── */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/40 backdrop-blur-md p-8 rounded-[2rem] border border-white/50 shadow-sm animate-pulse flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="h-8 bg-black/10 rounded-full w-1/3"></div>
                    <div className="h-4 bg-black/5 rounded-full w-1/4"></div>
                    <div className="h-4 bg-black/5 rounded-full w-full"></div>
                  </div>
                  <div className="w-48 h-12 bg-black/10 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            /* ── Empty State ──────────────────────────────────────────── */
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-20 h-20 rounded-3xl bg-[#1a1a1a] flex items-center justify-center mb-6 shadow-xl">
                <Search className="w-8 h-8 text-[#ffdd66]" />
              </div>
              <h3 className="text-2xl font-light text-[#1a1a1a] mb-2">No roles found</h3>
              <p className="text-slate-400 text-sm max-w-sm mb-8">
                No projects match{searchQuery ? ` "${searchQuery}"` : ''}{activeFilterCount > 0 ? ' with selected filters' : ''}. Try adjusting your search.
              </p>
              <button onClick={clearAllFilters} className="px-8 py-3 bg-[#1a1a1a] text-white text-sm font-bold rounded-full hover:bg-black transition-colors">
                Clear search & filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map(project => (
                <div key={project.id} className="group bg-[#1a1a1a] p-8 rounded-[2rem] shadow-xl shadow-black/5 flex flex-col md:flex-row justify-between gap-8 relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
                  <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none transition-transform group-hover:scale-110 duration-700" />
                  <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#ffdd66]/5 rounded-full blur-3xl pointer-events-none transition-transform group-hover:scale-110 duration-700" />

                  <div className="flex-1 relative z-10 text-white">
                    <h2 className="text-3xl font-light tracking-tight mb-2 leading-tight">{project.title}</h2>

                    <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-white/50 mb-6">
                      <span className="flex items-center text-[#ffdd66]">
                        <Briefcase className="w-4 h-4 mr-1.5" /> {project.company}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1.5" /> {project.location}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1.5" /> {project.postedAt}
                      </span>
                      {project.type && (
                        <span className="px-3 py-0.5 rounded-full bg-white/10 text-white/70 text-xs font-bold border border-white/10">
                          {project.type}
                        </span>
                      )}
                      {project.deadline && (
                        <span className="flex items-center text-red-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2"></span>
                          Due: {new Date(project.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <p className="text-white/70 text-sm leading-relaxed mb-6 max-w-3xl">{project.description}</p>

                    <div className="flex flex-wrap gap-2">
                      {(project.tags || []).map((tag: string) => (
                        <span key={tag} className="px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/10 text-white/90 border border-white/5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end justify-between relative z-10 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8 min-w-[240px]">
                    <div className="mb-6 md:mb-0 flex flex-col items-start md:items-end w-full">
                      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 mb-2">Compensation</p>
                      
                      {project.budget && (
                        <div className="flex border border-[#ffdd66]/20 bg-[#ffdd66]/5 rounded-xl px-4 py-2 mb-2 w-full justify-between md:justify-end gap-4 items-center">
                          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Fixed</span>
                          <span className="text-xl font-light tracking-tighter text-[#ffdd66]">{project.budget}</span>
                        </div>
                      )}
                      
                      {project.hourly_rate && (
                        <div className="flex border border-[#ffdd66]/20 bg-[#ffdd66]/5 rounded-xl px-4 py-2 mb-2 w-full justify-between md:justify-end gap-4 items-center">
                          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Hourly</span>
                          <span className="text-xl font-light tracking-tighter text-[#ffdd66]">{project.hourly_rate}</span>
                        </div>
                      )}

                      {project.monthly_rate && (
                        <div className="flex border border-[#ffdd66]/20 bg-[#ffdd66]/5 rounded-xl px-4 py-2 w-full justify-between md:justify-end gap-4 items-center">
                          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Monthly</span>
                          <span className="text-xl font-light tracking-tighter text-[#ffdd66]">{project.monthly_rate}</span>
                        </div>
                      )}
                      
                      {(!project.budget && !project.hourly_rate && !project.monthly_rate) && (
                        <p className="text-xl font-light tracking-tighter text-white/50 mb-2">—</p>
                      )}
                    </div>

                    {session ? (
                      (() => {
                        const applied = applications.find(a => String(a.project_id) === String(project.id));
                        if (applied) {
                          return (
                            <button disabled className={`w-full h-14 rounded-full text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed border ${['accepted', 'approved'].includes(applied.status?.toLowerCase())
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : applied.status?.toLowerCase() === 'rejected'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-[#ffdd66]/10 text-[#ffdd66] border-[#ffdd66]/20'
                              }`}>
                              <CheckCircle2 className="w-4 h-4 opacity-70" />
                              <span className="capitalize">
                                {['accepted', 'approved'].includes(applied.status?.toLowerCase()) ? 'Accepted' :
                                  applied.status?.toLowerCase() === 'rejected' ? 'Rejected' : 'Pending'}
                              </span>
                            </button>
                          );
                        }
                        return (
                          <button onClick={() => handleApply(project.id)} className="w-full h-14 rounded-full bg-white text-[#1a1a1a] hover:bg-[#ffdd66] hover:text-black transition-colors text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-white/5">
                            Apply Now <ArrowRight className="w-4 h-4 opacity-70" />
                          </button>
                        );
                      })()
                    ) : (
                      <Link to="/login" className="w-full h-14 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors text-sm font-bold flex items-center justify-center gap-2">
                        Log in to Apply
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
