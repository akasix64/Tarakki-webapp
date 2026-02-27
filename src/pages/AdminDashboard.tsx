import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Users, Briefcase, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ contractors: 0, startups: 0, projects: 0 });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      // Mock data for now
      setStats({
        contractors: 12,
        startups: 5,
        projects: 8
      });

      setRecentUsers([
        { id: 1, name: 'John Doe', role: 'contractor', joined: '2026-02-25' },
        { id: 2, name: 'Tech Solutions Inc', role: 'startup', joined: '2026-02-24' },
      ]);
    };
    fetchAdminData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard (egisedge)</h1>
        <button className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4 mr-2" /> Post New Project
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Contractors</h3>
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-neutral-900">{stats.contractors}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Startups</h3>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-neutral-900">{stats.startups}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Active Projects</h3>
            <Briefcase className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-neutral-900">{stats.projects}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Platform Activity</h3>
            <Activity className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold text-neutral-900">High</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-neutral-900">Recent Registrations</h3>
          <button className="text-sm text-emerald-600 font-medium hover:text-emerald-700">View All</button>
        </div>
        <ul className="divide-y divide-neutral-200">
          {recentUsers.map((user) => (
            <li key={user.id} className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
              <div>
                <p className="text-sm font-medium text-neutral-900">{user.name}</p>
                <p className="text-sm text-neutral-500">Joined on {user.joined}</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                user.role === 'startup' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {user.role}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
