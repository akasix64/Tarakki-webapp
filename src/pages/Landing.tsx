import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Code, Briefcase, Zap } from 'lucide-react';

export default function Landing() {
  return (
    <div className="flex flex-col gap-16">
      {/* Hero Section */}
      <section className="text-center py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <motion.h1 
          className="text-5xl md:text-6xl font-extrabold tracking-tight text-neutral-900 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Accelerate your <span className="text-emerald-600">Oracle</span> journey with Tarakki.
        </motion.h1>
        <motion.p 
          className="text-xl text-neutral-600 mb-10 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          The premier platform for startups and contractors to find high-quality Oracle projects from egisedge.
        </motion.p>
        <motion.div 
          className="flex flex-col sm:flex-row justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link
            to="/signup"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all"
          >
            Get Started <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link
            to="/projects"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all"
          >
            View Projects
          </Link>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white rounded-3xl shadow-sm border border-neutral-100 px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-900">Why choose Tarakki?</h2>
          <p className="mt-4 text-lg text-neutral-600">Designed specifically for Oracle professionals and startups.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-neutral-50 rounded-2xl">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <Briefcase className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Exclusive Projects</h3>
            <p className="text-neutral-600">Access high-value Oracle projects directly from egisedge, the sole employer on the platform.</p>
          </div>
          <div className="p-6 bg-neutral-50 rounded-2xl">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">AI-Powered Matching</h3>
            <p className="text-neutral-600">Our Python backend analyzes your resume and interests to recommend the perfect projects.</p>
          </div>
          <div className="p-6 bg-neutral-50 rounded-2xl">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Priority Membership</h3>
            <p className="text-neutral-600">Upgrade to a premium membership to get priority access and stand out to the employer.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-900">Membership Plans</h2>
          <p className="mt-4 text-lg text-neutral-600">Get priority access to projects and boost your visibility.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Contractor Plan */}
          <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 p-8 flex flex-col">
            <h3 className="text-2xl font-semibold text-neutral-900 mb-2">Contractor Pro</h3>
            <p className="text-neutral-500 mb-6">For individual Oracle professionals.</p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-neutral-900">₹999</span>
              <span className="text-neutral-500">/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start"><CheckCircle className="h-5 w-5 text-emerald-500 mr-2 shrink-0" /><span className="text-neutral-600">Priority project matching</span></li>
              <li className="flex items-start"><CheckCircle className="h-5 w-5 text-emerald-500 mr-2 shrink-0" /><span className="text-neutral-600">Highlighted profile for employer</span></li>
              <li className="flex items-start"><CheckCircle className="h-5 w-5 text-emerald-500 mr-2 shrink-0" /><span className="text-neutral-600">Direct email notifications</span></li>
            </ul>
            <Link to="/signup?role=contractor" className="w-full py-3 px-4 bg-neutral-900 text-white rounded-xl font-medium text-center hover:bg-neutral-800 transition-colors">
              Join as Contractor
            </Link>
          </div>

          {/* Startup Plan */}
          <div className="bg-emerald-600 rounded-3xl shadow-md border border-emerald-500 p-8 flex flex-col text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-500 px-4 py-1 rounded-bl-xl text-sm font-medium">Most Popular</div>
            <h3 className="text-2xl font-semibold mb-2">Startup Enterprise</h3>
            <p className="text-emerald-100 mb-6">For agencies and startup teams.</p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold">₹4999</span>
              <span className="text-emerald-200">/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start"><CheckCircle className="h-5 w-5 text-emerald-300 mr-2 shrink-0" /><span className="text-emerald-50">Top priority for large projects</span></li>
              <li className="flex items-start"><CheckCircle className="h-5 w-5 text-emerald-300 mr-2 shrink-0" /><span className="text-emerald-50">Team profile and portfolio</span></li>
              <li className="flex items-start"><CheckCircle className="h-5 w-5 text-emerald-300 mr-2 shrink-0" /><span className="text-emerald-50">Dedicated support</span></li>
            </ul>
            <Link to="/signup?role=startup" className="w-full py-3 px-4 bg-white text-emerald-700 rounded-xl font-medium text-center hover:bg-neutral-50 transition-colors">
              Join as Startup
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
