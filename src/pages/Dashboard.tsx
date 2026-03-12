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

      // Check if user is admin (by email or profile role)
      const adminEmails = ['egisedge@tarakki.com', 'egisedge@gmail.com', 'anshukapil7770@gmail.com'];
      const userEmail = (session.user.email || '').toLowerCase();
      const isAdmin = adminEmails.some(e => e.toLowerCase() === userEmail) || userEmail.includes('egisedge');
      if (isAdmin) {
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

        // 1. Check user metadata (set during Signup with email)
        let determinedRole = session.user.user_metadata?.role;

        // 2. Check localStorage (set during Signup with Google)
        if (!determinedRole) {
          const pending = localStorage.getItem('pending_role');
          if (pending) {
            determinedRole = pending;
            // We'll leave it in localStorage for Profile.tsx to pick up if they go there next, 
            // but we use it here for the dashboard view.
          }
        }

        setRole(determinedRole || 'contractor');
      } else if (data) {
        setRole(data.role);
        // Clear pending garbage if they now have a real profile
        localStorage.removeItem('pending_role');
        localStorage.removeItem('pending_name');
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
