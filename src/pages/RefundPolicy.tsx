import { Link } from 'react-router-dom';
import { RotateCcw, ArrowLeft } from 'lucide-react';

export default function RefundPolicy() {
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
            <RotateCcw className="w-6 h-6 text-[#ffdd66]" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-[#1a1a1a]">Refund & <span className="font-semibold">Return Policy</span></h1>
            <p className="text-sm text-[#1a1a1a]/40 font-bold mt-1">Last updated: March 10, 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/40 shadow-sm p-8 md:p-12 space-y-8">

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">1. Overview</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              This Refund and Return Policy ("Policy") applies to all purchases made through Oracle Contracts ("we", "our", or "us"), accessible at <span className="font-semibold">[YOUR WEBSITE URL]</span>. Our platform offers digital services, including subscription plans and one-time digital purchases. Since these are digital products and services, they are non-tangible and cannot be "returned" in the traditional sense. All payments are processed securely through <strong>Razorpay Software Private Limited</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">2. Subscription Plans</h2>
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-[#1a1a1a] mb-1">a) Cancellation</h3>
                <p className="text-sm text-[#1a1a1a]/60">You may cancel your subscription at any time. Upon cancellation, you will continue to have access to the subscribed features until the end of your current billing cycle. No pro-rated refund will be issued for the remaining period of the billing cycle after cancellation.</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-[#1a1a1a] mb-1">b) Auto-Renewal</h3>
                <p className="text-sm text-[#1a1a1a]/60">Subscriptions automatically renew at the end of each billing cycle unless cancelled before the renewal date. It is your responsibility to cancel the subscription before the next billing cycle if you no longer wish to continue.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">3. Refund Eligibility</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed mb-3">
              As a digital product platform, all sales are generally considered final. However, we may issue refunds under the following exceptional circumstances:
            </p>

            <div className="space-y-3">
              <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                <h3 className="text-sm font-bold text-emerald-700 mb-2">✓ Refund May Be Granted</h3>
                <ul className="list-disc list-inside text-sm text-emerald-600 space-y-1.5">
                  <li><strong>Duplicate Payment:</strong> If the same transaction was charged multiple times due to a technical error</li>
                  <li><strong>Failed Transaction:</strong> If payment was debited but the service/subscription was not activated</li>
                  <li><strong>Overcharge:</strong> If an amount higher than the listed price was debited</li>
                  <li><strong>Service Not Provided:</strong> If the subscribed features were not made available within 48 hours of successful payment</li>
                </ul>
              </div>

              <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
                <h3 className="text-sm font-bold text-red-700 mb-2">✗ Refund Will NOT Be Granted</h3>
                <ul className="list-disc list-inside text-sm text-red-600 space-y-1.5">
                  <li>Change of mind after purchasing a subscription or digital service</li>
                  <li>Not using the Service after purchase or subscription activation</li>
                  <li>Dissatisfaction with features that were clearly described before purchase</li>
                  <li>Account suspension or termination due to violation of our Terms and Conditions</li>
                  <li>Partial use of subscription period (no pro-rated refunds)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">4. How to Request a Refund</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed mb-3">To request a refund, please follow these steps:</p>
            <ol className="list-decimal list-inside text-[#1a1a1a]/70 leading-relaxed space-y-2 pl-2">
              <li>Email us at <span className="font-semibold">[YOUR SUPPORT EMAIL]</span> with the subject line "Refund Request"</li>
              <li>Include your registered email address, transaction/payment ID, date of transaction, and reason for the refund request</li>
              <li>Our team will review your request within <strong>5-7 business days</strong></li>
              <li>If approved, the refund will be processed to the original payment method within <strong>7-10 business days</strong> via Razorpay</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">5. Refund Processing</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              All approved refunds will be processed through <strong>Razorpay</strong> and credited back to the original payment method (credit/debit card, UPI, net banking, etc.). The time taken for the refund to reflect in your account depends on your bank or payment provider and typically takes 5-10 business days after processing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">6. Chargebacks</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              We encourage you to contact us before initiating a chargeback with your bank or payment provider. Filing a chargeback without prior contact may result in suspension of your account pending investigation. We reserve the right to dispute any chargeback that we believe is unwarranted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">7. Changes to This Policy</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              We may update this Refund and Return Policy from time to time. Any changes will be posted on this page with an updated "Last updated" date. Your continued use of the Service constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3">8. Contact Us</h2>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              For any refund-related queries, please contact us at{' '}
              <Link to="/contact" className="text-blue-500 hover:underline font-semibold">our Contact page</Link> or email us at <span className="font-semibold">[YOUR SUPPORT EMAIL]</span>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
