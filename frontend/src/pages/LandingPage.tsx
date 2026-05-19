import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Target, Briefcase, Users, Zap, TrendingUp,
  Shield, Check, ArrowRight, Star, Gift,
  Globe, BarChart3, FileText, Clock
} from 'lucide-react';

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div className="min-h-screen text-slate-100 selection:bg-blue-500/30 relative">
      {/* ========================================
          GLOBAL DYNAMIC AI BACKGROUND
      ======================================== */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Cinematic Cyborg Background with slow zoom animation */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] ease-linear"
          style={{
            backgroundImage: 'url("/landing-bg.png")',
            animation: 'ken-burns 40s infinite alternate ease-in-out'
          }}
        ></div>

        {/* Dynamic Dark Overlay for readability - Lightened for better visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/40 to-slate-950/70 backdrop-blur-[1px]"></div>

        {/* Subtle Grid Pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:48px_48px] opacity-[0.05]"></div>
        
        {/* Glow Blobs adjusted for cyborg theme */}
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 rounded-full blur-[160px] animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[140px]"></div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ken-burns {
          0% { transform: scale(1); }
          100% { transform: scale(1.15); }
        }
      `}} />

      {/* ========================================
          NAVIGATION
      ======================================== */}
      <nav className="bg-slate-950/50 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-xl">R</span>
              </div>
              <div>
                <div className="font-bold text-white text-lg leading-none">RecruitPro SA</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">AI-Powered Recruitment</div>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-semibold text-slate-300 hover:text-blue-400 transition">Features</a>
              <a href="#pricing" className="text-sm font-semibold text-slate-300 hover:text-blue-400 transition">Pricing</a>
              <a href="/about" className="text-sm font-semibold text-slate-300 hover:text-blue-400 transition">About</a>
              <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-blue-400 transition">Sign In</Link>
              <Link 
                to="/register" 
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition shadow-lg shadow-blue-900/20"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>


      {/* ========================================
          INTEGRATED HERO + 3 CARDS
      ======================================== */}
      <section className="relative pt-12 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative">
          
          {/* 2 Action Cards (Top) - DARK GLASS */}
          <div className="grid md:grid-cols-2 gap-8 mb-24 max-w-5xl mx-auto">
            {/* Job Seekers Card */}
            <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-500 group flex flex-col">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center mb-8 group-hover:rotate-6 transition-transform shadow-lg shadow-emerald-900/50">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-black text-white mb-4 tracking-tight">For Job Seekers</h3>
              <p className="text-slate-400 mb-8 font-medium leading-relaxed">
                Build your profile, track applications automatically, and let AI bring the right
                opportunities directly to you.
              </p>
              <ul className="space-y-4 mb-10 flex-grow">
                {[
                  "Browse 500+ active jobs",
                  "Smart AI job recommendations",
                  "Transparent tracking"
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-sm font-bold text-slate-300">
                    <div className="w-6 h-6 bg-emerald-500/10 rounded-full flex items-center justify-center mr-3 shrink-0">
                      <Check className="w-4 h-4 text-emerald-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link 
                to="/job-board" 
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 font-black transition shadow-lg shadow-emerald-900/50 text-center uppercase tracking-widest text-sm"
              >
                Browse Jobs
              </Link>
              <div className="mt-6 flex items-center justify-center space-x-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">
                  100% Free Forever
                </p>
              </div>
            </div>

            {/* Companies Card */}
            <div className="bg-white/10 backdrop-blur-3xl rounded-[2.5rem] p-8 border-2 border-blue-500/20 shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/30 hover:border-blue-500 transition-all duration-500 group flex flex-col relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black px-6 py-2 rounded-full tracking-[0.2em] uppercase shadow-xl z-10">
                Most Popular
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mb-8 group-hover:rotate-6 transition-transform shadow-lg shadow-blue-900/50">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-black text-white mb-4 tracking-tight">For Companies</h3>
              <p className="text-slate-400 mb-8 font-medium leading-relaxed">
                Post your open roles, review highly-qualified applicants, and collaborate
                closely with your recruitment team.
              </p>
              <ul className="space-y-4 mb-10 flex-grow">
                {[
                  "Unlimited job postings",
                  "Real-time pipelines",
                  "Advanced analytics"
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-sm font-bold text-slate-300">
                    <div className="w-6 h-6 bg-blue-500/10 rounded-full flex items-center justify-center mr-3 shrink-0">
                      <Check className="w-4 h-4 text-blue-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-3">
                <Link 
                  to="/register?type=company" 
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 font-black transition shadow-lg shadow-blue-900/50 text-center uppercase tracking-widest text-xs"
                >
                  Register Company
                </Link>
                <Link 
                  to="/login?type=company" 
                  className="text-white/40 hover:text-white text-xs font-bold transition-colors text-center"
                >
                  Already have an account? Log in
                </Link>
              </div>
            </div>
          </div>

          {/* Hero Content */}
          <div className="text-center mb-24 max-w-5xl mx-auto">
            <div className="inline-flex items-center space-x-3 bg-white/5 backdrop-blur-md px-6 py-2.5 rounded-full text-xs font-black mb-10 border border-white/10 shadow-sm text-blue-400 uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span>Next-Gen Hiring, Simplified by AI</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tight leading-[0.95]">
              Hiring built for<br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Agile Teams.
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-bold leading-relaxed mb-12">
              Whether you're a company seeking talent, or a job seeker looking for your next opportunity — we've got you covered.
            </p>
          </div>

          {/* Quick Stats Bar */}
          <div className="max-w-4xl mx-auto py-12 px-8 bg-white/5 backdrop-blur-3xl rounded-[2rem] border border-white/10 shadow-2xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              <div className="text-center">
                <div className="text-5xl font-black text-white mb-2">40%</div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Faster Hiring</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-black text-white mb-2">10K+</div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">AI Matches</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-black text-white mb-2">500+</div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Active Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-black text-white mb-2">99.9</div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ========================================
          TOP 3 FEATURES
      ======================================== */}
      <section id="features" className="py-32 relative px-6 border-y border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-3xl -z-10"></div>
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
              Everything You Need to Hire Better
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium">
              Powerful enterprise-grade features built specifically for ambitious teams.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {/* Feature 1: AI Matching */}
            <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/10 shadow-xl hover:bg-white/10 transition group">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition">
                <Zap className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">AI-Powered Matching</h3>
              <p className="text-slate-400 font-medium leading-relaxed">
                Smart algorithms match candidates to jobs based on skills, experience, and
                cultural fit to eliminate guesswork. Get scored matches in seconds.
              </p>
            </div>

            {/* Feature 2: Automation */}
            <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/10 shadow-xl hover:bg-white/10 transition group">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition">
                <TrendingUp className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Automated Workflows</h3>
              <p className="text-slate-400 font-medium leading-relaxed">
                Set up automatic email notifications, interview reminders, and instant status
                updates without lifting a finger. Save hours every single week.
              </p>
            </div>

            {/* Feature 3: Security */}
            <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/10 shadow-xl hover:bg-white/10 transition group">
              <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition">
                <Shield className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Bank-Grade Security</h3>
              <p className="text-slate-400 font-medium leading-relaxed">
                Rest easy with built-in POPIA & GDPR privacy consent management and
                enterprise-level data protection for all your candidate information.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Why We're Different */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-16 tracking-tight">Why We're Different</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/10 hover:border-blue-500/30 transition-all group">
              <div className="text-blue-500 font-black text-6xl mb-6 opacity-20 group-hover:opacity-100 transition-opacity">01</div>
              <h3 className="text-2xl font-black mb-4">Built for Teams</h3>
              <p className="text-slate-400 font-medium leading-relaxed">Not a generic HR tool. Built specifically for the high-velocity world of recruitment and headhunting.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/10 hover:border-purple-500/30 transition-all group">
              <div className="text-purple-500 font-black text-6xl mb-6 opacity-20 group-hover:opacity-100 transition-opacity">02</div>
              <h3 className="text-2xl font-black mb-4">Ethical AI</h3>
              <p className="text-slate-400 font-medium leading-relaxed">Our AI is built to reduce bias, not automate it. We ensure fair matching for every candidate, every time.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/10 hover:border-emerald-500/30 transition-all group">
              <div className="text-emerald-500 font-black text-6xl mb-6 opacity-20 group-hover:opacity-100 transition-opacity">03</div>
              <h3 className="text-2xl font-black mb-4">SA Compliance</h3>
              <p className="text-slate-400 font-medium leading-relaxed">Fully POPIA compliant from day one. Your data stays safe, secure, and resides within South African frameworks.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-orange-600 to-yellow-600 rounded-[2.5rem] p-12 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center shrink-0 shadow-inner">
                <Gift className="w-12 h-12 text-white" />
              </div>
              <div>
                <h3 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">
                  Founding Member Offer: 30% OFF Forever!
                </h3>
                <p className="text-xl text-orange-50 font-medium mb-8 leading-relaxed">
                  Be one of the first 20 companies to join RecruitPro and automatically lock in a
                  30% discount for life.
                </p>
                <div className="inline-flex items-center space-x-3 bg-white text-orange-600 px-6 py-3 rounded-full font-black uppercase tracking-widest shadow-lg">
                  <span className="w-2.5 h-2.5 bg-orange-600 rounded-full animate-pulse"></span>
                  <span>Only 13 Spots Remaining</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ========================================
          PRICING SECTION (CENTERED)
      ======================================== */}
      <section id="pricing" className="py-24 bg-white/5 backdrop-blur-3xl px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium mb-10">
              Choose the exact plan that fits your hiring needs right now.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-slate-900/50 rounded-2xl p-1.5 border border-white/10 shadow-inner">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${billingCycle === 'monthly'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${billingCycle === 'annual'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                Annual
                <span className="ml-2 text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-10 border border-white/10 shadow-xl hover:bg-white/10 transition-all flex flex-col">
              <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
              <p className="text-slate-500 font-medium mb-8">Perfect for small teams</p>
              <div className="mb-10 text-white font-black text-5xl tracking-tighter">
                {billingCycle === 'monthly' ? 'R2,030' : 'R20,300'}
                <span className="text-lg text-slate-500 ml-2 font-bold">{billingCycle === 'monthly' ? '/mo' : '/yr'}</span>
              </div>
              <ul className="space-y-4 mb-10 text-left flex-grow">
                {[
                  "2 team seats included",
                  "50 active job listings",
                  "Manage 500 candidates",
                  "Foundational AI matching",
                  "Standard email support",
                  "Basic reporting dashboard"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center text-sm font-bold text-slate-300">
                    <Check className="w-5 h-5 text-emerald-400 mr-3" /> {feature}
                  </li>
                ))}
              </ul>
              <Link 
                to="/register?type=company&plan=starter" 
                state={{ selectedPlan: 'starter', billingCycle }}
                className="w-full py-4 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-all font-bold text-center"
              >
                Start Trial
              </Link>
            </div>

            {/* Professional Plan */}
            <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white relative transform md:scale-105 shadow-2xl flex flex-col">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 text-[10px] font-black px-5 py-1.5 rounded-full uppercase tracking-widest">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">Professional</h3>
              <div className="mb-10 text-white font-black text-5xl tracking-tighter">
                {billingCycle === 'monthly' ? 'R4,199' : 'R41,990'}
              </div>
              <ul className="space-y-4 mb-10 text-left flex-grow">
                {[
                  "5 team seats included",
                  "Unlimited active jobs",
                  "Manage 2,000 candidates",
                  "Advanced AI matching",
                  "Priority 24/7 support",
                  "Custom company branding"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center text-sm font-bold text-white">
                    <Check className="w-5 h-5 text-yellow-400 mr-3" /> {feature}
                  </li>
                ))}
              </ul>
              <Link 
                to="/register?type=company&plan=professional" 
                state={{ selectedPlan: 'professional', billingCycle }}
                className="w-full py-4 bg-white text-blue-600 rounded-xl font-bold shadow-xl text-center"
              >
                Start Trial
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-10 border border-white/10 shadow-xl hover:bg-white/10 transition-all flex flex-col">
              <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
              <p className="text-slate-500 font-medium mb-8">For organizations</p>
              <div className="mb-10 text-white font-black text-5xl tracking-tighter">Custom</div>
              <ul className="space-y-4 mb-10 text-left flex-grow">
                {[
                  "Unlimited team seats",
                  "Unlimited candidates",
                  "Custom AI training models",
                  "Dedicated success manager",
                  "White-label portal access",
                  "Full API & Webhook access"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center text-sm font-bold text-slate-300">
                    <Check className="w-5 h-5 text-slate-300 mr-3" /> {feature}
                  </li>
                ))}
              </ul>
              <Link to="/register?type=company&plan=enterprise" className="w-full py-4 bg-white/10 border border-white/20 text-white rounded-xl font-bold">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* ========================================
          FINAL CTA
      ======================================== */}
      <section className="py-24 bg-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 -z-10"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10 px-6">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">
            Ready to Transform Your Hiring?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/register" className="w-full sm:w-auto px-10 py-5 bg-white text-blue-700 rounded-xl font-black text-xl shadow-2xl">
              Start Trial
            </Link>
            <Link to="#" className="w-full sm:w-auto px-10 py-5 bg-white/10 border-2 border-white/30 text-white rounded-xl font-black text-xl backdrop-blur-md">
              Request Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================
          FOOTER
      ======================================== */}
      <footer className="bg-black/80 backdrop-blur-3xl text-white py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            {/* Company Info */}
            <div className="space-y-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">R</span>
                </div>
                <div>
                  <div className="font-black text-xl tracking-tight text-white">RecruitPro SA</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Global AI Solutions</div>
                </div>
              </div>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                The AI-powered recruitment software platform properly engineered for agile
                and wildly fast-growing companies globally.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-black text-xs uppercase tracking-[0.2em] mb-8 text-slate-500">Platform</h3>
              <ul className="space-y-4 text-sm font-bold text-slate-400">
                <li><a href="#features" className="hover:text-blue-400 transition-colors">Key Features</a></li>
                <li><Link to="/job-board" className="hover:text-blue-400 transition-colors">Browse Jobs</Link></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Sandbox Demo</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Developer API</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-black text-xs uppercase tracking-[0.2em] mb-8 text-slate-500">Company</h3>
              <ul className="space-y-4 text-sm font-bold text-slate-400">
                <li><Link to="/about" className="hover:text-blue-400 transition-colors">About Us</Link></li>
                <li><a href="https://infinityworkitsolutions.com/" target="_blank" className="hover:text-blue-400 transition-colors">InfinityWork</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Technical Blog</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Careers</a></li>
              </ul>
            </div>

            {/* Trust & Legal */}
            <div>
              <h3 className="font-black text-xs uppercase tracking-[0.2em] mb-8 text-slate-500">Legal</h3>
              <ul className="space-y-4 text-sm font-bold text-slate-400">
                <li><Link to="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
                <li><Link to="/compliance" className="hover:text-blue-400 transition-colors">Compliance</Link></li>
                <li><Link to="/security" className="hover:text-blue-400 transition-colors">Security Specs</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">
              © {new Date().getFullYear()} InfinityWork IT Solutions. All rights reserved.
            </p>
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
              <span>Carefully built with</span>
              <span className="text-red-500 animate-pulse">❤️</span>
              <span>for worldwide excellence</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
