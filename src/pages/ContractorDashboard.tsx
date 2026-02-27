import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Briefcase, CheckCircle, Clock } from 'lucide-react';

export default function ContractorDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);

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

        // Mock applications for now
        setApplications([
          { id: 1, title: 'Oracle Cloud Migration', status: 'Pending', date: '2026-02-20' },
          { id: 2, title: 'Database Optimization', status: 'Accepted', date: '2026-02-15' },
        ]);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-900">Contractor Dashboard</h1>
        {profile?.is_member ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-4 h-4 mr-1" /> Pro Member
          </span>
        ) : (
          <button className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors">
            Upgrade to Pro (₹999/mo)
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Total Applications</h3>
            <Briefcase className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-neutral-900">{applications.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Pending</h3>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-neutral-900">
            {applications.filter(a => a.status === 'Pending').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Accepted</h3>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-neutral-900">
            {applications.filter(a => a.status === 'Accepted').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">Recent Applications</h3>
        </div>
        <ul className="divide-y divide-neutral-200">
          {applications.map((app) => (
            <li key={app.id} className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
              <div>
                <p className="text-sm font-medium text-neutral-900">{app.title}</p>
                <p className="text-sm text-neutral-500">Applied on {app.date}</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                app.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {app.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
