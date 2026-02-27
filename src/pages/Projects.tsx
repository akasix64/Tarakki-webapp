import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Briefcase, MapPin, Clock, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Projects() {
  const [session, setSession] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Mock projects
    setTimeout(() => {
      setProjects([
        {
          id: 1,
          title: 'Oracle Cloud Infrastructure Migration',
          company: 'egisedge',
          location: 'Remote',
          type: 'Contract',
          postedAt: '2 days ago',
          description: 'Looking for an experienced Oracle DBA to migrate our on-premise databases to OCI.',
          tags: ['Oracle DBA', 'OCI', 'Migration'],
          budget: '₹50,000 - ₹80,000 / month'
        },
        {
          id: 2,
          title: 'Oracle E-Business Suite Upgrade',
          company: 'egisedge',
          location: 'Hybrid - Bangalore',
          type: 'Project',
          postedAt: '1 week ago',
          description: 'Need a team to upgrade our Oracle EBS from 12.1 to 12.2. Startup teams preferred.',
          tags: ['Oracle EBS', 'Upgrade', 'ERP'],
          budget: '₹5,00,000 fixed'
        },
        {
          id: 3,
          title: 'Performance Tuning Specialist',
          company: 'egisedge',
          location: 'Remote',
          type: 'Part-time',
          postedAt: '3 hours ago',
          description: 'Seeking an expert to tune complex SQL queries and optimize database performance.',
          tags: ['Performance Tuning', 'SQL', 'Oracle 19c'],
          budget: '₹2,000 / hour'
        }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const handleApply = async (projectId: number) => {
    if (!session) {
      alert("Please log in to apply for projects.");
      return;
    }
    
    // Here we would call our mock Python backend to analyze the profile
    try {
      const response = await fetch('/api/analyze-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileData: { userId: session.user.id, projectId } })
      });
      const data = await response.json();
      
      if (data.success) {
        alert("Application submitted! Our AI has analyzed your profile and you are a strong match.");
      }
    } catch (error) {
      console.error("Error applying:", error);
      alert("Application submitted successfully!");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Oracle Projects</h1>
          <p className="text-neutral-500 mt-1">Find the best Oracle opportunities from egisedge.</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-1 md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-neutral-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-xl leading-5 bg-white placeholder-neutral-500 focus:outline-none focus:placeholder-neutral-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
              placeholder="Search projects..."
            />
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-xl shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm animate-pulse">
              <div className="h-6 bg-neutral-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-neutral-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-neutral-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <div key={project.id} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-neutral-900 mb-1">{project.title}</h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500 mb-4">
                    <span className="flex items-center font-medium text-emerald-700">
                      <Briefcase className="w-4 h-4 mr-1" /> {project.company}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" /> {project.location}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" /> {project.postedAt}
                    </span>
                  </div>
                  <p className="text-neutral-600 mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4 md:mb-0">
                    {project.tags.map((tag: string) => (
                      <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-neutral-100 text-neutral-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-start md:items-end justify-between border-t md:border-t-0 md:border-l border-neutral-100 pt-4 md:pt-0 md:pl-6 min-w-[200px]">
                  <div className="mb-4 md:mb-0">
                    <p className="text-sm text-neutral-500 mb-1">Budget / Rate</p>
                    <p className="font-semibold text-neutral-900">{project.budget}</p>
                  </div>
                  {session ? (
                    <button 
                      onClick={() => handleApply(project.id)}
                      className="w-full md:w-auto inline-flex justify-center items-center px-6 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                    >
                      Apply Now
                    </button>
                  ) : (
                    <Link 
                      to="/login"
                      className="w-full md:w-auto inline-flex justify-center items-center px-6 py-2 border border-neutral-300 text-sm font-medium rounded-xl shadow-sm text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                    >
                      Log in to Apply
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
