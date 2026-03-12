import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export default function Disclaimer() {
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
            <AlertTriangle className="w-6 h-6 text-[#ffdd66]" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-[#1a1a1a]"><span className="font-semibold">Disclaimer</span></h1>
            <p className="text-sm text-[#1a1a1a]/40 font-bold mt-1">Last updated: March 10, 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/40 shadow-sm p-8 md:p-12 space-y-8">

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">1. General Disclaimer</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              The information, products, and services provided on Oracle Contracts (the "Service"), operated by <span className="font-semibold">[YOUR COMPANY/BUSINESS NAME]</span>, are provided on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis without any warranties of any kind, whether express, implied, statutory, or otherwise. We expressly disclaim all implied warranties, including, without limitation, warranties of merchantability, fitness for a particular purpose, title, and non-infringement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">2. No Guarantee of Results</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              Oracle Contracts is a platform to connect Oracle professionals with businesses. We do not guarantee that using the Service will result in securing projects, contracts, or business engagements. The success of any professional relationship formed through the platform depends on various factors beyond our control.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">3. Accuracy of Information</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              While we strive to ensure that the information on the platform is accurate and up-to-date, we make no representations or warranties about the completeness, reliability, or accuracy of any information, including user profiles, project descriptions, bids, and applications. Users are responsible for verifying the information provided by other users before entering into any agreements or transactions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">4. Third-Party Services</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              The Service integrates with third-party services, including <strong>Razorpay</strong> (for payment processing) and <strong>Supabase</strong> (for authentication and data storage). We are not responsible for the availability, accuracy, or functionality of these third-party services. Your use of these services is governed by their respective terms and policies. Any issues related to payment processing should be directed to Razorpay or your bank.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">5. Service Availability</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              We do not warrant that the Service will be uninterrupted, timely, secure, or error-free. The Service may experience downtime for maintenance, updates, or due to circumstances beyond our control (including server failures, network issues, and force majeure events). We shall not be liable for any loss, damage, or inconvenience caused by temporary unavailability of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">6. User Content</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              Users are solely responsible for the content they post on the platform, including profile information, project listings, applications, and bids. We do not pre-screen or verify user-submitted content and are not liable for any claims arising from such content. We reserve the right to remove any content that violates our Terms and Conditions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">7. Financial Disclaimer</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              Any financial information displayed on the platform (project budgets, rates, bids) is provided for informational purposes only and does not constitute financial advice. Actual payments and compensation are subject to agreements between the parties involved. We do not guarantee the payment capability or financial standing of any user.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">8. Limitation of Responsibility</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              <span className="font-semibold">[YOUR COMPANY/BUSINESS NAME]</span> is not responsible for:
            </p>
            <ul className="list-disc list-inside text-[#1a1a1a]/70 leading-relaxed space-y-2 pl-2 mt-3">
              <li>Any misuse of the platform by its users</li>
              <li>Losses arising from reliance on information provided on the platform</li>
              <li>Disputes between contractors and startups or other users</li>
              <li>Unauthorized access to your account due to your failure to safeguard credentials</li>
              <li>Damages resulting from viruses, malware, or other harmful components that may affect your device</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">9. External Links</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              Our platform may contain links to external websites or resources. These links are provided for convenience only. We do not endorse, control, or assume responsibility for the content, privacy policies, or practices of any third-party sites.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">10. Changes to This Disclaimer</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              We reserve the right to update or modify this Disclaimer at any time. Changes will be effective immediately upon posting on this page. Your continued use of the Service after such changes constitutes your acceptance of the updated Disclaimer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">11. Contact</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              If you have any questions about this Disclaimer, please visit our{' '}
              <Link to="/contact" className="text-blue-500 hover:underline font-semibold">Contact page</Link>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
