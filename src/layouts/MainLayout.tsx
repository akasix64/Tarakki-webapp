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
            <span className="font-bold text-xl tracking-tight text-neutral-900">Oracle Contracts</span>
          </Link>
          <nav className="flex items-center space-x-7">
            {/* <Link to="/projects" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">Projects</Link> */}
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

      <footer className="bg-white border-t border-neutral-100 mt-auto">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-16 mb-12">
            
            {/* Column 1: Logo & Social */}
            <div className="col-span-1 flex flex-col items-start gap-6">
              <Link to="/" className="flex items-center space-x-2">
                <Briefcase className="h-8 w-8 text-[#0066cc]" />
                <span className="font-bold text-2xl tracking-tighter text-[#0066cc]">Oracle Contracts</span>
              </Link>
              
              <div className="flex flex-col gap-3">
                <span className="text-sm font-bold text-neutral-800">Connect with us</span>
                <div className="flex gap-4 items-center">
                  <a href="#" className="w-8 h-8 rounded border border-neutral-300 flex items-center justify-center text-neutral-400 hover:text-[#0066cc] hover:border-[#0066cc] transition-colors">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a href="#" className="w-8 h-8 rounded border border-neutral-300 flex items-center justify-center text-neutral-400 hover:text-[#0066cc] hover:border-[#0066cc] transition-colors">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </a>
                  <a href="#" className="w-8 h-8 rounded border border-neutral-300 flex items-center justify-center text-neutral-400 hover:text-[#0066cc] hover:border-[#0066cc] transition-colors">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                  </a>
                  <a href="#" className="w-8 h-8 rounded border border-neutral-300 flex items-center justify-center text-neutral-400 hover:text-[#0066cc] hover:border-[#0066cc] transition-colors">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Column 2: Links */}
            <div className="col-span-1 flex flex-col gap-5 pt-2">
              <Link to="/contact" className="text-sm font-medium text-neutral-600 hover:text-[#0066cc] transition-colors">About us</Link>
              <Link to="/" className="text-sm font-medium text-neutral-600 hover:text-[#0066cc] transition-colors">Careers</Link>
              <Link to="/" className="text-sm font-medium text-neutral-600 hover:text-[#0066cc] transition-colors">Employer home</Link>
              <Link to="/" className="text-sm font-medium text-neutral-600 hover:text-[#0066cc] transition-colors">Sitemap</Link>
              <Link to="/" className="text-sm font-medium text-neutral-600 hover:text-[#0066cc] transition-colors">Credits</Link>
            </div>

            {/* Column 3: Help */}
            <div className="col-span-1 flex flex-col gap-5 pt-2">
              <Link to="/contact" className="text-sm font-medium text-neutral-600 hover:text-[#0066cc] transition-colors">Help center</Link>
              <Link to="/" className="text-sm font-medium text-neutral-600 hover:text-[#0066cc] transition-colors">Summons/Notices</Link>
              <Link to="/" className="text-sm font-medium text-neutral-600 hover:text-[#0066cc] transition-colors">Grievances</Link>
              <Link to="/contact" className="text-sm font-medium text-neutral-600 hover:text-[#0066cc] transition-colors">Report issue</Link>
            </div>

            {/* Column 4: Legal & Policies */}
            <div className="col-span-1 flex flex-col gap-5 pt-2">
              <Link to="/privacy-policy" className="text-sm font-medium text-neutral-600 hover:text-[#0066cc] transition-colors">Privacy policy</Link>
              <Link to="/terms" className="text-sm font-medium text-neutral-600 hover:text-[#0066cc] transition-colors">Terms & conditions</Link>
              <Link to="/refund-policy" className="text-sm font-medium text-neutral-600 hover:text-[#0066cc] transition-colors">Refund & Return Policy</Link>
              <Link to="/disclaimer" className="text-sm font-medium text-neutral-600 hover:text-[#0066cc] transition-colors">Disclaimer</Link>
              <Link to="/" className="text-sm font-medium text-neutral-600 hover:text-[#0066cc] transition-colors">Trust & safety</Link>
            </div>

          </div>

          <div className="pt-8 border-t border-neutral-100 flex flex-col md:flex-row justify-center items-center gap-4">
            <p className="text-center text-sm font-medium text-neutral-500">
              Oracle Contracts © {new Date().getFullYear()}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
