import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ContractorDashboard from './ContractorDashboard';
import StartupDashboard from './StartupDashboard';
import AdminDashboard from './AdminDashboard';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      // Check if user is admin (egisedge)
      if (session.user.email === 'egisedge@tarakki.com' || session.user.email?.includes('egisedge')) {
        setRole('admin');
        setLoading(false);
        return;
      }

      // Fetch role from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Fallback or handle error
        // If no profile, maybe they signed up with Google and need to complete profile
        // For now, default to contractor if not found
        setRole(session.user.user_metadata?.role || 'contractor');
      } else if (data) {
        setRole(data.role);
      }
      
      setLoading(false);
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (role === 'admin') return <AdminDashboard />;
  if (role === 'startup') return <StartupDashboard />;
  return <ContractorDashboard />;
}
