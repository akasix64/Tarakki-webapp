import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, CheckCircle, Users } from 'lucide-react';

export default function StartupDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(profileData);

        // Mock projects for now
        setProjects([
          { id: 1, title: 'Enterprise Oracle Implementation', status: 'In Progress', teamSize: 5 },
          { id: 2, title: 'Data Warehouse Migration', status: 'Completed', teamSize: 3 },
        ]);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-900">Startup Dashboard</h1>
        {profile?.is_member ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-4 h-4 mr-1" /> Enterprise Member
          </span>
        ) : (
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
            Upgrade to Enterprise (₹4999/mo)
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Active Projects</h3>
            <Building2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-neutral-900">
            {projects.filter(p => p.status === 'In Progress').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Completed</h3>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-neutral-900">
            {projects.filter(p => p.status === 'Completed').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Team Members</h3>
            <Users className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold text-neutral-900">
            {projects.reduce((acc, curr) => acc + curr.teamSize, 0)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">Your Projects</h3>
        </div>
        <ul className="divide-y divide-neutral-200">
          {projects.map((project) => (
            <li key={project.id} className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
              <div>
                <p className="text-sm font-medium text-neutral-900">{project.title}</p>
                <p className="text-sm text-neutral-500">Team Size: {project.teamSize}</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                project.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {project.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
