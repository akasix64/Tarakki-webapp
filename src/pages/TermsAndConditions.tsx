import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TermsAndConditions() {
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
            <FileText className="w-6 h-6 text-[#ffdd66]" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-[#1a1a1a]">Terms & <span className="font-semibold">Conditions</span></h1>
            <p className="text-sm text-[#1a1a1a]/40 font-bold mt-1">Last updated: March 10, 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/40 shadow-sm p-8 md:p-12 space-y-8">

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">1. Acceptance of Terms</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              By accessing or using Oracle Contracts ("we", "our", "us"), accessible at <span className="font-semibold">[YOUR WEBSITE URL]</span>, you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree with any part of these Terms, you must not use the Service. These Terms constitute a legally binding agreement between you and <span className="font-semibold">[YOUR COMPANY/BUSINESS NAME]</span>, governed by the laws of India.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">2. Description of Service</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              Oracle Contracts is a digital platform that connects Oracle professionals (Contractors) with businesses (Startups) seeking Oracle-related services. The platform facilitates project discovery, applications, bidding, and professional networking. We may offer subscription-based premium features that unlock additional capabilities.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">3. User Accounts</h2>
            <ul className="list-disc list-inside text-[#1a1a1a]/70 leading-relaxed space-y-2 pl-2">
              <li>You must be at least 18 years of age to create an account</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You agree to provide accurate, current, and complete information during registration</li>
              <li>You are solely responsible for all activity that occurs under your account</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
              <li>You must not create multiple accounts or impersonate another person or entity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">4. Payments & Subscriptions</h2>
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-[#1a1a1a] mb-1">a) Payment Processing</h3>
                <p className="text-sm text-[#1a1a1a]/60">All payments on the platform are processed through <strong>Razorpay Software Private Limited</strong>. By making a payment, you agree to Razorpay's <a href="https://razorpay.com/terms/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Terms of Service</a>. All prices are listed in Indian Rupees (INR) and include applicable taxes unless stated otherwise.</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-[#1a1a1a] mb-1">b) Subscription Plans</h3>
                <p className="text-sm text-[#1a1a1a]/60">Premium features are available through paid subscription plans. Subscriptions auto-renew unless cancelled before the next billing cycle. Pricing and features are subject to change with prior notice.</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-[#1a1a1a] mb-1">c) Refunds</h3>
                <p className="text-sm text-[#1a1a1a]/60">Refunds are handled in accordance with our <Link to="/refund-policy" className="text-blue-500 hover:underline font-semibold">Refund & Return Policy</Link>.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">5. User Conduct</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed mb-3">You agree not to:</p>
            <ul className="list-disc list-inside text-[#1a1a1a]/70 leading-relaxed space-y-2 pl-2">
              <li>Use the Service for any unlawful purpose or in violation of any applicable law</li>
              <li>Post false, misleading, or fraudulent content on your profile or in applications</li>
              <li>Harass, abuse, or threaten other users of the platform</li>
              <li>Attempt to gain unauthorized access to any portion of the Service</li>
              <li>Scrape, crawl, or use automated tools to collect data from the platform</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Use the platform to send unsolicited messages or spam</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">6. Intellectual Property</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              All content, trademarks, logos, designs, source code, and materials on the platform are the property of <span className="font-semibold">[YOUR COMPANY/BUSINESS NAME]</span> or its licensors and are protected by Indian and international intellectual property laws. You may not reproduce, modify, distribute, or create derivative works from any content on the platform without our prior written consent. Content you upload (profile information, project descriptions, etc.) remains your property, but you grant us a non-exclusive, royalty-free license to display, store, and process such content to operate the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">7. Platform Role & Liability</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              Oracle Contracts serves as an intermediary platform to connect professionals and businesses. We do not guarantee the quality, reliability, or accuracy of any project listing, user profile, application, or bid. Any engagement or contract between contractors and startups is solely between the respective parties. We are not liable for any disputes, losses, or damages arising from such engagements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">8. Limitation of Liability</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              To the maximum extent permitted by applicable law, <span className="font-semibold">[YOUR COMPANY/BUSINESS NAME]</span> shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from or in connection with your use of the Service. Our total aggregate liability to you for any claim arising from or relating to the Service shall not exceed the amount paid by you for the Service in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">9. Indemnification</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              You agree to indemnify, defend, and hold harmless <span className="font-semibold">[YOUR COMPANY/BUSINESS NAME]</span>, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses arising out of or in connection with your use of the Service, your violation of these Terms, or your violation of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">10. Termination</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              We reserve the right to suspend or terminate your account at any time, with or without notice, for any reason, including (but not limited to) violation of these Terms. Upon termination, your right to use the Service will immediately cease. Any provisions of these Terms that by their nature should survive termination (including, without limitation, intellectual property provisions, warranty disclaimers, indemnity, and limitations of liability) shall survive.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">11. Governing Law & Dispute Resolution</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the courts in <span className="font-semibold">[YOUR CITY, STATE]</span>, India. Before initiating any legal proceedings, the parties agree to attempt resolution through good-faith negotiation for a period of 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">12. Changes to Terms</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              We may modify these Terms at any time. Material changes will be communicated via email or a prominent notice on the platform. Your continued use of the Service following the posting of changes constitutes your acceptance of such changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">13. Contact</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              For any questions about these Terms, please visit our{' '}
              <Link to="/contact" className="text-blue-500 hover:underline font-semibold">Contact page</Link>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
