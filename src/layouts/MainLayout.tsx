import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Briefcase, LogOut, User } from 'lucide-react';

export default function MainLayout() {
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans text-neutral-900">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="flex justify-between h-16 items-center px-6 pr-10">
          <Link to="/" className="flex items-center space-x-2">
            <Briefcase className="h-6 w-6 text-emerald-600" />
            <span className="font-bold text-xl tracking-tight text-neutral-900">Tarakki</span>
          </Link>
          <nav className="flex items-center space-x-7">
            <Link to="/projects" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">Projects</Link>
            {session ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">Dashboard</Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 text-sm font-medium text-neutral-600 hover:text-neutral-900"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">Log in</Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-neutral-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} Tarakki. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
