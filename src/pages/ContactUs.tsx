import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Clock, ArrowLeft, MessageCircle } from 'lucide-react';

export default function ContactUs() {
  return (
    <div className="min-h-screen font-sans selection:bg-[#ffdd66] selection:text-black" style={{ background: 'linear-gradient(135deg, #f8f9f4 0%, #f0ebd8 50%, #fefcf3 100%)' }}>
      <div className="max-w-4xl mx-auto px-6 py-16">

        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#1a1a1a]/50 hover:text-[#1a1a1a] transition-colors mb-10 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] flex items-center justify-center shadow-lg shadow-black/10">
            <MessageCircle className="w-6 h-6 text-[#ffdd66]" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-[#1a1a1a]">Contact <span className="font-semibold">Us</span></h1>
            <p className="text-sm text-[#1a1a1a]/40 font-bold mt-1">We're here to help</p>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

          {/* Email */}
          <div className="bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/40 shadow-sm p-8 hover:border-white/70 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Mail className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">Email</h3>
            <p className="text-sm text-[#1a1a1a]/50 mb-4">For general inquiries, support, or partnership opportunities.</p>
            <div className="space-y-2">
              <a href="mailto:[YOUR_SUPPORT_EMAIL]" className="block text-sm font-bold text-blue-500 hover:underline">[YOUR_SUPPORT_EMAIL]</a>
              <a href="mailto:[YOUR_BUSINESS_EMAIL]" className="block text-sm font-bold text-blue-500 hover:underline">[YOUR_BUSINESS_EMAIL]</a>
            </div>
          </div>

          {/* Phone */}
          <div className="bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/40 shadow-sm p-8 hover:border-white/70 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Phone className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">Phone</h3>
            <p className="text-sm text-[#1a1a1a]/50 mb-4">Reach us directly by phone during business hours.</p>
            <div className="space-y-2">
              <a href="tel:[YOUR_PHONE_NUMBER]" className="block text-sm font-bold text-emerald-600 hover:underline">[YOUR_PHONE_NUMBER]</a>
              <p className="text-xs text-[#1a1a1a]/40">(WhatsApp available on this number)</p>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/40 shadow-sm p-8 hover:border-white/70 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <MapPin className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">Registered Address</h3>
            <p className="text-sm text-[#1a1a1a]/50 mb-4">Our official business address for correspondence.</p>
            <address className="not-italic text-sm font-semibold text-[#1a1a1a]/70 leading-relaxed">
              [YOUR COMPANY/BUSINESS NAME]<br />
              [ADDRESS LINE 1]<br />
              [ADDRESS LINE 2]<br />
              [CITY, STATE — PIN CODE]<br />
              India
            </address>
          </div>

          {/* Support Hours */}
          <div className="bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/40 shadow-sm p-8 hover:border-white/70 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5 text-indigo-500" />
            </div>
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">Support Hours</h3>
            <p className="text-sm text-[#1a1a1a]/50 mb-4">Our team is available during the following hours (IST).</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#1a1a1a]/60 font-medium">Monday – Friday</span>
                <span className="font-bold text-[#1a1a1a]">10:00 AM – 7:00 PM</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#1a1a1a]/60 font-medium">Saturday</span>
                <span className="font-bold text-[#1a1a1a]">10:00 AM – 2:00 PM</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#1a1a1a]/60 font-medium">Sunday & Holidays</span>
                <span className="font-bold text-red-500">Closed</span>
              </div>
            </div>
          </div>

        </div>

        {/* Additional Info */}
        <div className="bg-[#1a1a1a] rounded-[2rem] p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#ffdd66]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-2xl font-light text-white mb-4">Need <span className="font-semibold">Urgent Help?</span></h2>
            <p className="text-white/60 leading-relaxed mb-6 max-w-lg">
              For urgent payment-related issues (failed transactions, double charges, etc.), please email us with your Razorpay payment/transaction ID for faster resolution. We aim to respond within <strong className="text-white">24 hours</strong> on business days.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="mailto:[YOUR_SUPPORT_EMAIL]" className="inline-flex items-center gap-2 px-8 py-4 bg-[#ffdd66] text-[#1a1a1a] rounded-full font-bold hover:bg-white transition-colors shadow-lg shadow-[#ffdd66]/10">
                <Mail className="w-4 h-4" /> Email Support
              </a>
              <Link to="/refund-policy" className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition-colors border border-white/10">
                View Refund Policy
              </Link>
            </div>
          </div>
        </div>

        {/* Legal Links */}
        <div className="mt-8 bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/30 shadow-sm p-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/40 mb-4">Legal Pages</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/privacy-policy" className="px-5 py-2.5 rounded-full text-xs font-bold bg-white/60 text-[#1a1a1a]/70 border border-white/50 hover:bg-white hover:text-[#1a1a1a] transition-all">Privacy Policy</Link>
            <Link to="/terms" className="px-5 py-2.5 rounded-full text-xs font-bold bg-white/60 text-[#1a1a1a]/70 border border-white/50 hover:bg-white hover:text-[#1a1a1a] transition-all">Terms & Conditions</Link>
            <Link to="/refund-policy" className="px-5 py-2.5 rounded-full text-xs font-bold bg-white/60 text-[#1a1a1a]/70 border border-white/50 hover:bg-white hover:text-[#1a1a1a] transition-all">Refund Policy</Link>
            <Link to="/disclaimer" className="px-5 py-2.5 rounded-full text-xs font-bold bg-white/60 text-[#1a1a1a]/70 border border-white/50 hover:bg-white hover:text-[#1a1a1a] transition-all">Disclaimer</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
