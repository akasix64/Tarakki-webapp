import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
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
            <Shield className="w-6 h-6 text-[#ffdd66]" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-[#1a1a1a]">Privacy <span className="font-semibold">Policy</span></h1>
            <p className="text-sm text-[#1a1a1a]/40 font-bold mt-1">Last updated: March 10, 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/40 shadow-sm p-8 md:p-12 space-y-8">

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">1. Introduction</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              Oracle Contracts ("we", "our", or "us") operates the Oracle Contracts platform (the "Service"), accessible at <span className="font-semibold">[YOUR WEBSITE URL]</span>. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our Service. By accessing or using the Service, you consent to the practices described in this policy. This policy is compliant with the Information Technology Act, 2000 and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 of India.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">2. Information We Collect</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed mb-3">We may collect the following types of information:</p>
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-[#1a1a1a] mb-1">a) Personal Information</h3>
                <p className="text-sm text-[#1a1a1a]/60">Full name, email address, phone number, company name, role, location, skills, experience, and profile photo — provided during account registration and profile setup.</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-[#1a1a1a] mb-1">b) Payment Information</h3>
                <p className="text-sm text-[#1a1a1a]/60">When you make a payment through our platform, payment processing is handled by <strong>Razorpay Software Private Limited</strong> ("Razorpay"). We do not store your credit/debit card numbers, UPI IDs, or banking details on our servers. Razorpay collects and processes your payment information in accordance with their <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Privacy Policy</a> and PCI-DSS compliance standards.</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-[#1a1a1a] mb-1">c) Usage Data</h3>
                <p className="text-sm text-[#1a1a1a]/60">We automatically collect information about how you interact with the Service, including IP address, browser type, device information, pages visited, time spent, and referral sources.</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-[#1a1a1a] mb-1">d) Cookies & Tracking Technologies</h3>
                <p className="text-sm text-[#1a1a1a]/60">We use cookies, local storage, and similar technologies to maintain your session, remember preferences, and analyze Service usage. You can manage cookie preferences through your browser settings.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-[#1a1a1a]/70 leading-relaxed space-y-2 pl-2">
              <li>To create, manage, and authenticate your user account</li>
              <li>To process payments, subscriptions, and billing through Razorpay</li>
              <li>To match contractors and startups with relevant Oracle projects</li>
              <li>To send transactional notifications (application updates, subscription confirmations)</li>
              <li>To improve the Service through analytics and usage patterns</li>
              <li>To comply with legal obligations and enforce our Terms and Conditions</li>
              <li>To prevent fraud, abuse, and unauthorized access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">4. Data Sharing & Disclosure</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed mb-3">We do not sell your personal data. We may share information with:</p>
            <ul className="list-disc list-inside text-[#1a1a1a]/70 leading-relaxed space-y-2 pl-2">
              <li><strong>Razorpay:</strong> For payment processing and subscription management</li>
              <li><strong>Supabase:</strong> For secure data storage and authentication services</li>
              <li><strong>Other Users:</strong> Your profile information (name, skills, experience) may be visible to project posters and admins on the platform</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government authority under applicable Indian laws</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">5. Data Security</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              We implement reasonable security measures to protect your personal information, including encrypted data transmission (SSL/TLS), secure authentication via Supabase, and role-based access controls. However, no method of electronic storage or transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">6. Data Retention</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide the Service. Upon account deletion, we will delete or anonymize your data within 90 days, except where retention is required by law or for legitimate business purposes (e.g., financial records, dispute resolution).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">7. Your Rights</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed mb-3">Under applicable Indian law and our policy, you have the right to:</p>
            <ul className="list-disc list-inside text-[#1a1a1a]/70 leading-relaxed space-y-2 pl-2">
              <li>Access and review your personal data stored on our platform</li>
              <li>Correct or update inaccurate personal information</li>
              <li>Request deletion of your account and associated data</li>
              <li>Withdraw consent for data processing (which may limit Service functionality)</li>
              <li>Lodge a complaint with the appropriate data protection authority</li>
            </ul>
            <p className="text-[#1a1a1a]/70 leading-relaxed mt-3">
              To exercise these rights, contact us at <span className="font-semibold">[YOUR EMAIL ADDRESS]</span>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">8. Third-Party Links</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              The Service may contain links to third-party websites or services. We are not responsible for the privacy practices of these external sites. We encourage you to read the privacy policy of every website you visit.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">9. Children's Privacy</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              The Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from minors. If we become aware that we have collected data from a person under 18, we will take steps to delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">10. Changes to This Policy</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last updated" date. Continued use of the Service after changes constitutes your acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">11. Grievance Officer</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              In accordance with the Information Technology Act, 2000 and rules made thereunder, the Grievance Officer for the purpose of this Privacy Policy is:
            </p>
            <div className="bg-slate-50 rounded-2xl p-5 mt-3">
              <p className="text-sm font-bold text-[#1a1a1a]">[GRIEVANCE OFFICER NAME]</p>
              <p className="text-sm text-[#1a1a1a]/60">Email: <span className="font-semibold">[GRIEVANCE OFFICER EMAIL]</span></p>
              <p className="text-sm text-[#1a1a1a]/60">Address: <span className="font-semibold">[YOUR REGISTERED ADDRESS]</span></p>
              <p className="text-sm text-[#1a1a1a]/60 mt-1">We shall address your concerns within 30 days of receiving the grievance.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">12. Contact Us</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <Link to="/contact" className="text-blue-500 hover:underline font-semibold">our Contact page</Link>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
