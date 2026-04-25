import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Users, Briefcase, TrendingUp, Shield, Zap, Globe,
    Check, ArrowRight, Menu, X, BarChart3, FileText,
    Clock, Target, Star, Mail, Phone, Code, Award, Server
} from 'lucide-react';

export default function LandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-white">
            {/* Header/Navigation */}
            <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">R</span>
                            </div>
                            <div>
                                <div className="text-xl font-bold text-gray-900">RecruitPro SA</div>
                                <div className="text-xs text-gray-500">AI-Powered Recruitment</div>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Features</a>
                            <a href="#benefits" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Benefits</a>
                            <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Pricing</a>
                            <a href="#about" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">About</a>
                        </nav>

                        {/* CTA Buttons */}
                        <div className="hidden md:flex items-center space-x-4">
                            <a
                                href="/login"
                                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
                            >
                                Sign In
                            </a>
                            <a
                                href="/register"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-colors font-medium shadow-sm hover:shadow-md"
                            >
                                Get Started
                            </a>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden text-gray-600"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 bg-white shadow-xl">
                        <div className="px-4 py-4 space-y-3">
                            <a href="#features" className="block text-gray-600 hover:text-blue-600 font-medium py-2">Features</a>
                            <a href="#benefits" className="block text-gray-600 hover:text-blue-600 font-medium py-2">Benefits</a>
                            <a href="#pricing" className="block text-gray-600 hover:text-blue-600 font-medium py-2">Pricing</a>
                            <a href="#about" className="block text-gray-600 hover:text-blue-600 font-medium py-2">About</a>
                            <div className="pt-3 border-t border-gray-200 space-y-3 mt-4">
                                <a href="/login" className="block w-full text-center text-gray-600 hover:text-blue-600 font-medium py-2">
                                    Sign In
                                </a>
                                <a
                                    href="/register"
                                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-3 rounded-lg shadow-sm"
                                >
                                    Get Started
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* THREE PORTALS SECTION */}
            <section className="pt-36 pb-24 bg-gray-50 border-b border-gray-200 relative">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                    Built for Everyone in the Hiring Process
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Whether you're a recruiter filling roles, a company seeking talent, or a job seeker looking for your next opportunity — we've got you covered.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Job Seeker Portal */}
                  <div className="bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-all border-t-4 border-green-600 flex flex-col h-full group">
                    <div className="w-16 h-16 bg-green-50 group-hover:bg-green-100 transition-colors rounded-2xl flex items-center justify-center mb-8 border border-green-100">
                      <Target className="w-8 h-8 text-green-600" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">For Job Seekers</h3>
                    <p className="text-gray-600 mb-8 font-medium leading-relaxed flex-grow">
                      Build your profile, track applications automatically, and let AI bring the right opportunities directly to you.
                    </p>
                    
                    <ul className="space-y-4 mb-10">
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-gray-700 font-medium">Browse 500+ active jobs</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-gray-700 font-medium">Smart AI job recommendations</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-gray-700 font-medium">Transparent application tracking</span>
                      </li>
                    </ul>
                    
                    <a 
                      href="/jobs" 
                      className="block w-full text-center py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-md hover:shadow-lg mb-4"
                    >
                      Browse Available Jobs
                    </a>
                    
                    <div className="text-center">
                      <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-bold border border-green-200">
                        ✨ 100% FREE for Job Seekers
                      </span>
                    </div>
                  </div>
                  
                  {/* Company Portal */}
                  <div className="bg-white rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all border-t-4 border-blue-600 relative flex flex-col h-full transform md:-translate-y-4 ring-1 ring-black/5 group">
                    {/* Popular badge */}
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-1.5 rounded-full text-sm font-bold shadow-lg tracking-wider">
                      MOST POPULAR
                    </div>
                    
                    <div className="w-16 h-16 bg-blue-50 group-hover:bg-blue-100 transition-colors rounded-2xl flex items-center justify-center mb-8 border border-blue-100">
                      <Briefcase className="w-8 h-8 text-blue-600" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">For Companies</h3>
                    <p className="text-gray-600 mb-8 font-medium leading-relaxed flex-grow">
                      Post your open roles, review highly-qualified applicants, and collaborate closely with your recruitment team.
                    </p>
                    
                    <ul className="space-y-4 mb-10">
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                        <span className="text-gray-700 font-medium">Unlimited job postings</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                        <span className="text-gray-700 font-medium">Real-time candidate pipelines</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                        <span className="text-gray-700 font-medium">Advanced analytics & reporting</span>
                      </li>
                    </ul>
                    
                    <a 
                      href="/register?type=company" 
                      className="block w-full text-center py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                    >
                      Register Your Company
                    </a>
                  </div>
                  
                  {/* Recruiter Portal */}
                  <div className="bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-all border-t-4 border-purple-600 flex flex-col h-full group">
                    <div className="w-16 h-16 bg-purple-50 group-hover:bg-purple-100 transition-colors rounded-2xl flex items-center justify-center mb-8 border border-purple-100">
                      <Users className="w-8 h-8 text-purple-600" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">For Recruiters</h3>
                    <p className="text-gray-600 mb-8 font-medium leading-relaxed flex-grow">
                      Manage candidates, track applications, and close positions faster 
                      with AI-powered matching workflows.
                    </p>
                    
                    <ul className="space-y-4 mb-10">
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                        <span className="text-gray-700 font-medium">Kanban pipeline management</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                        <span className="text-gray-700 font-medium">AI candidate matching</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                        <span className="text-gray-700 font-medium">Bulk operations & automation</span>
                      </li>
                    </ul>
                    
                    <a 
                      href="/register?type=recruiter" 
                      className="block w-full text-center py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg"
                    >
                      Get Started as Recruiter
                    </a>
                  </div>
                </div>
              </div>
            </section>


            {/* HERO SECTION */}
            <section className="relative overflow-hidden py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 animate-gradient-xy text-white">
              {/* Subtle Overlay Pattern */}
              <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-4xl mx-auto">
                  {/* Founding Member Badge */}
                  <div className="inline-flex items-center space-x-2 bg-yellow-400 text-yellow-900 border border-yellow-300 px-5 py-2 rounded-full mb-8 font-semibold animate-pulse shadow-lg">
                    <span className="font-extrabold flex items-center"><span className="mr-1">🔥</span> LIMITED TIME</span>
                    <span className="opacity-50">•</span>
                    <span>First 20 companies get 30% OFF forever!</span>
                  </div>
                  
                  {/* Main Heading */}
                  <h1 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight tracking-tight">
                    Hire Top Talent 40% <span className="text-yellow-300 drop-shadow-sm">Faster</span>
                    <br />
                    With AI-Powered Matching
                  </h1>
                  
                  {/* Subheading */}
                  <p className="text-xl md:text-2xl mb-10 text-blue-50 max-w-3xl mx-auto font-medium leading-relaxed drop-shadow-sm">
                    The AI-powered recruitment platform that matches perfect candidates 
                    to your jobs in seconds. Say goodbye to manual CV screening.
                  </p>
                  
                  {/* CTAs */}
                  <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-5 mb-14">
                    <a 
                      href="/register" 
                      className="w-full sm:w-auto px-10 py-4 bg-white text-blue-700 rounded-xl font-bold text-lg hover:bg-gray-50 hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg flex items-center justify-center"
                    >
                      Start Free Trial
                      <ArrowRight className="ml-2 w-5 h-5 text-blue-600" />
                    </a>
                    <a 
                      href="#pricing" 
                      className="w-full sm:w-auto px-10 py-4 bg-transparent border-2 border-white/80 hover:border-white hover:bg-white/10 text-white rounded-xl font-bold text-lg transition-all backdrop-blur-sm shadow-sm"
                    >
                      View Pricing
                    </a>
                  </div>
                  
                  {/* Trust Indicators */}
                  <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-sm md:text-base font-medium text-white/90">
                    <div className="flex items-center space-x-2 drop-shadow-sm">
                      <div className="bg-white/20 p-1 rounded-full"><Check className="w-4 h-4 text-white" /></div>
                      <span>No credit card required</span>
                    </div>
                    <div className="flex items-center space-x-2 drop-shadow-sm">
                      <div className="bg-white/20 p-1 rounded-full"><Check className="w-4 h-4 text-white" /></div>
                      <span>14-day free trial</span>
                    </div>
                    <div className="flex items-center space-x-2 drop-shadow-sm">
                      <div className="bg-white/20 p-1 rounded-full"><Check className="w-4 h-4 text-white" /></div>
                      <span>Cancel anytime</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Stats Bar */}
              <div className="max-w-7xl mx-auto px-4 mt-20 relative z-10">
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/10">
                    <div className="px-4">
                      <div className="text-4xl md:text-5xl font-extrabold text-yellow-300 drop-shadow-md">40%</div>
                      <div className="text-sm md:text-base text-blue-50 mt-2 font-medium">Faster Hiring</div>
                    </div>
                    <div className="px-4">
                      <div className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-md">10K+</div>
                      <div className="text-sm md:text-base text-blue-50 mt-2 font-medium">Candidates Matched</div>
                    </div>
                    <div className="px-4">
                      <div className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-md">500+</div>
                      <div className="text-sm md:text-base text-blue-50 mt-2 font-medium">Active Jobs</div>
                    </div>
                    <div className="px-4">
                      <div className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-md">99.9%</div>
                      <div className="text-sm md:text-base text-blue-50 mt-2 font-medium">Uptime Guarantee</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                            Everything You Need to Hire Better
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Powerful enterprise-grade features built specifically for fast-growing agencies and ambitious teams.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Zap className="w-7 h-7" />,
                                title: 'AI-Powered Matching',
                                description: 'Smart algorithms match candidates to jobs based on skills, experience, and cultural fit to eliminate guesswork.'
                            },
                            {
                                icon: <FileText className="w-7 h-7" />,
                                title: 'Automated Resume Parsing',
                                description: 'Automatically extract candidate information from CVs and instantly populate standardized, searchable profiles.'
                            },
                            {
                                icon: <BarChart3 className="w-7 h-7" />,
                                title: 'Insights & Analytics',
                                description: 'Track hiring metrics, time-to-fill, source effectiveness, and team performance cleanly on visual dashboards.'
                            },
                            {
                                icon: <Globe className="w-7 h-7" />,
                                title: 'Global Operations',
                                description: 'Manage candidates seamlessly wherever you are with an optimized, lightning-fast global portal experience.'
                            },
                            {
                                icon: <Shield className="w-7 h-7" />,
                                title: 'Bank-Grade Security',
                                description: 'Rest easy with built-in POPIA & GDPR privacy consent management and enterprise-level data protection.'
                            },
                            {
                                icon: <Clock className="w-7 h-7" />,
                                title: 'Automated Workflows',
                                description: 'Set up automatic email notifications, interview reminders, and instant status updates without lifting a finger.'
                            },
                        ].map((feature, i) => (
                            <div key={i} className="bg-gray-50 rounded-2xl p-8 hover:shadow-xl transition-all border border-gray-100 group">
                                <div className="w-14 h-14 bg-white shadow-sm border border-gray-100 rounded-xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 group-hover:text-blue-700 group-hover:bg-blue-50 transition-all">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed font-medium">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About RecruitPro SA (The System) */}
            <section id="about" className="py-24 bg-gray-50 relative overflow-hidden border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    
                    <div className="text-center max-w-4xl mx-auto mb-16">
                        <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-blue-200">
                            <Server className="w-4 h-4" />
                            <span>The RecruitPro Platform</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">Built by Engineers, Powered by AI, Designed for You</h2>
                        <p className="text-xl text-gray-600 font-medium">Our mission is to make recruitment faster, fairer, and more efficient worldwide.</p>
                    </div>

                    <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-gray-100 relative">
                        {/* Decorative Background blob */}
                        <div className="absolute top-0 right-0 p-32 bg-blue-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                        
                        <div className="p-10 md:p-16 relative z-10">
                            <div className="grid md:grid-cols-2 gap-16">
                                
                                {/* Problem */}
                                <div className="space-y-6">
                                    <h3 className="text-3xl font-bold text-gray-900 flex items-center border-b border-gray-100 pb-4">
                                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mr-4 shadow-sm border border-red-100">
                                            <span className="text-red-500 font-bold text-xl">!</span>
                                        </div>
                                        The Problem
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed font-medium text-lg">
                                        Across the world, recruitment is broken. Companies drowning in unqualified applications, spending weeks screening CVs manually. Job seekers applying to dozens of positions with no feedback, no visibility, and no hope.
                                    </p>
                                    <p className="text-gray-600 leading-relaxed font-medium text-lg">
                                        The disconnect is staggering: companies can't find qualified candidates, yet talented professionals can't get noticed. Traditional recruitment agencies charge 20-30% placement fees but still rely on manual screening, gut feelings, and spreadsheets.
                                    </p>
                                    <div className="bg-gray-50 p-6 rounded-2xl border-l-4 border-gray-300 italic text-gray-800 font-semibold text-xl">
                                        "There had to be a better way."
                                    </div>
                                </div>

                                {/* Solution */}
                                <div className="space-y-6">
                                    <h3 className="text-3xl font-bold text-gray-900 flex items-center border-b border-gray-100 pb-4">
                                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mr-4 shadow-sm border border-green-100">
                                            <span className="text-green-500 font-bold text-xl">✓</span>
                                        </div>
                                        Our Solution
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed font-medium text-lg">
                                        We built RecruitPro SA to bring the power of AI and modern technology to recruitment worldwide. We took the same automation and AI we use to help companies scale their tech infrastructure and applied it to recruitment.
                                    </p>
                                    <p className="text-gray-900 font-bold mt-6 mb-4">The result is a platform that:</p>
                                    <ul className="space-y-4">
                                        {[
                                            "Matches candidates to jobs in seconds using intelligent AI algorithms",
                                            "Analyzes skills, experience, location, and salary to find perfect fits",
                                            "Sends companies only the best matches — no more drowning in CVs",
                                            "Gives job seekers real visibility into their application status",
                                            "Helps companies hire 40% faster at a fraction of traditional costs"
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-start bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                <div className="bg-green-100 rounded-lg p-1 mr-3 mt-0.5 shadow-sm">
                                                    <Check className="w-5 h-5 text-green-700" />
                                                </div>
                                                <span className="text-gray-700 font-medium">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            
                            {/* Differentiators */}
                            <div className="mt-16 pt-16 border-t border-gray-100">
                                <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">Why We're Different</h3>
                                <div className="grid md:grid-cols-3 gap-8">
                                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:-translate-y-1 transition-transform">
                                        <div className="text-3xl mb-4 p-3 bg-blue-50 rounded-xl inline-block">🔧</div>
                                        <h4 className="text-lg font-bold text-gray-900 mb-2">Built by Engineers</h4>
                                        <p className="text-gray-600 font-medium">We understand both the technical challenges companies face and the search struggles of professionals.</p>
                                    </div>
                                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:-translate-y-1 transition-transform">
                                        <div className="text-3xl mb-4 p-3 bg-purple-50 rounded-xl inline-block">🤖</div>
                                        <h4 className="text-lg font-bold text-gray-900 mb-2">AI-Powered Tech</h4>
                                        <p className="text-gray-600 font-medium">Our intelligent matching algorithm does in seconds exactly what takes recruiters painful days to complete manually.</p>
                                    </div>
                                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:-translate-y-1 transition-transform">
                                        <div className="text-3xl mb-4 p-3 bg-green-50 rounded-xl inline-block">🌍</div>
                                        <h4 className="text-lg font-bold text-gray-900 mb-2">Global & Local</h4>
                                        <p className="text-gray-600 font-medium">Designed to work anywhere in the world, with robust support for multiple regions, currencies, and compliance laws.</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </section>


            {/* PRICING SECTION */}
            <section id="pricing" className="py-24 bg-gray-50 border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Founding Member Alert */}
                <div className="max-w-4xl mx-auto mb-16 bg-white border border-gray-200 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-8 relative z-10">
                    <div className="text-7xl pt-2">🎁</div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">
                        Founding Member Offer: 30% OFF Forever!
                      </h3>
                      <p className="text-gray-600 mb-6 font-medium text-lg leading-relaxed">
                        Be one of the first 20 companies to join RecruitPro and automatically lock in a 30% discount 
                        for life. Once these beta spots are completely gone, prices increase permanently.
                      </p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                        <div className="flex items-center space-x-2 bg-yellow-50 px-5 py-2.5 rounded-full border border-yellow-200">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500"></div>
                          <span className="font-extrabold text-yellow-900">Only 13 Spots Remaining</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Section Header */}
                <div className="text-center mb-16">
                  <h2 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 tracking-tighter uppercase">
                    Simple, Transparent Pricing
                  </h2>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
                    Choose the exact plan that fits your hiring needs right now. Scaling is simple. All plans automatically include foundational AI matching.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                  {/* Starter Plan */}
                  <div className="bg-white rounded-[2rem] border border-gray-200 p-10 hover:shadow-xl transition-shadow relative flex flex-col group">
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">Starter</h3>
                    <div className="mb-8">
                      <div className="flex items-baseline mb-2">
                        <span className="text-gray-400 line-through text-2xl font-medium">R2,900</span>
                        <span className="text-5xl font-extrabold text-gray-900 ml-3 tracking-tight">R2,030</span>
                        <span className="text-gray-500 ml-1 font-medium">/mo</span>
                      </div>
                      <div className="text-sm text-green-700 font-bold bg-green-50 inline-block px-4 py-1.5 rounded-full border border-green-200">
                        🎉 Founding Member (30% off)
                      </div>
                    </div>
                    
                    <div className="h-px bg-gray-100 w-full mb-8"></div>
                    
                    <ul className="space-y-4 mb-10 flex-1">
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-500 mt-0.5" />
                        <span className="text-gray-700 font-medium"><strong>2 team seats</strong> included</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-500 mt-0.5" />
                        <span className="text-gray-700 font-medium"><strong>50 active jobs</strong> per month</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-500 mt-0.5" />
                        <span className="text-gray-700 font-medium">Manage <strong>500 candidates</strong></span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-500 mt-0.5" />
                        <span className="text-gray-700 font-medium">Basic AI matching</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-500 mt-0.5" />
                        <span className="text-gray-700 font-medium">Email support</span>
                      </li>
                    </ul>
                    
                    <a 
                      href="/register" 
                      className="block w-full text-center py-4 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-bold group-hover:bg-gray-100 transition-colors"
                    >
                      Start Free Trial
                    </a>
                  </div>
                  
                  {/* Professional Plan (Most Popular) */}
                  <div className="bg-gray-900 rounded-[2rem] p-10 text-white relative transform md:scale-105 shadow-2xl flex flex-col border border-gray-800">
                    <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 px-6 py-2 rounded-bl-2xl rounded-tr-[2rem] text-sm font-extrabold tracking-wider shadow-md">
                      MOST POPULAR
                    </div>
                    
                    <h3 className="text-3xl font-bold mb-2">Professional</h3>
                    <div className="mb-8">
                      <div className="flex items-baseline mb-2">
                        <span className="text-gray-500 line-through text-2xl font-medium">R5,999</span>
                        <span className="text-5xl font-extrabold ml-3 tracking-tight text-white">R4,199</span>
                        <span className="text-gray-400 ml-1 font-medium">/mo</span>
                      </div>
                      <div className="text-sm text-yellow-900 bg-yellow-400 font-bold inline-block px-4 py-1.5 rounded-full border border-yellow-300">
                        🎉 Founding Member (30% off)
                      </div>
                    </div>
                    
                    <div className="h-px bg-gray-800 w-full mb-8"></div>
                    
                    <ul className="space-y-4 mb-10 flex-1">
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-yellow-400 mt-0.5" />
                        <span className="font-medium text-gray-200"><strong className="text-white">5 team seats</strong> included</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-yellow-400 mt-0.5" />
                        <span className="font-medium text-gray-200"><strong className="text-white">Unlimited active jobs</strong></span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-yellow-400 mt-0.5" />
                        <span className="font-medium text-gray-200">Manage <strong className="text-white">2,000 candidates</strong></span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-yellow-400 mt-0.5" />
                        <span className="font-medium text-gray-200"><strong className="text-white">Advanced AI</strong> matching</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-yellow-400 mt-0.5" />
                        <span className="font-medium text-gray-200"><strong className="text-white">Priority 24/7 support</strong></span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-yellow-400 mt-0.5" />
                        <span className="font-medium text-gray-200">Custom agency branding</span>
                      </li>
                    </ul>
                    
                    <a 
                      href="/register" 
                      className="block w-full text-center py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/50 transition-colors"
                    >
                      Start Free Trial
                    </a>
                  </div>
                  
                  {/* Enterprise Plan */}
                  <div className="bg-white rounded-[2rem] border border-gray-200 p-10 hover:shadow-xl transition-shadow relative flex flex-col group">
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">Enterprise</h3>
                    <div className="mb-8">
                      <div className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4 mt-2">Custom</div>
                      <div className="text-sm text-gray-700 bg-gray-100 font-bold inline-block px-4 py-1.5 rounded-full border border-gray-200">
                        Let's build a custom plan
                      </div>
                    </div>
                    
                    <div className="h-px bg-gray-100 w-full mb-8"></div>
                    
                    <ul className="space-y-4 mb-10 flex-1">
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-gray-900 mt-0.5" />
                        <span className="text-gray-700 font-medium"><strong className="text-gray-900">10+ team seats</strong> locally</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-gray-900 mt-0.5" />
                        <span className="text-gray-700 font-medium"><strong className="text-gray-900">Unlimited</strong> everything globally</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-gray-900 mt-0.5" />
                        <span className="text-gray-700 font-medium">Custom AI feature training specs</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-gray-900 mt-0.5" />
                        <span className="text-gray-700 font-medium"><strong className="text-gray-900">Dedicated success manager</strong></span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-gray-900 mt-0.5" />
                        <span className="text-gray-700 font-medium">Advanced API access & Webhooks</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-gray-900 mt-0.5" />
                        <span className="text-gray-700 font-medium">Custom complex ERP integrations</span>
                      </li>
                    </ul>
                    
                    <a 
                      href="https://infinityworkitsolutions.com/#contact" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center py-4 bg-white border-2 border-gray-900 text-gray-900 rounded-xl font-bold hover:bg-gray-900 hover:text-white transition-colors"
                    >
                      Contact Sales
                    </a>
                  </div>
                </div>
                
                {/* Note about placement fees */}
                <div className="text-center mt-12 text-gray-500 bg-white py-4 px-6 rounded-2xl max-w-4xl mx-auto border border-gray-200 shadow-sm inline-block w-full">
                  <p className="text-sm font-bold flex items-center justify-center">
                    <span className="text-lg mr-2">💡</span>
                    * All basic plans automatically include standard 15-20% placement fees upon successful applicant hires. 
                    Absolutely zero hidden setup fees attached. Feel free to securely cancel anytime.
                  </p>
                </div>
              </div>
            </section>

            {/* CTA SECTION */}
            <section className="py-28 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient-xy text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              
              <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                <div className="inline-flex items-center space-x-2 bg-white/10 text-white px-5 py-2 rounded-full text-sm font-bold mb-8 border border-white/20 backdrop-blur-sm">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>Join 500+ Agile Agencies Today</span>
                </div>
                
                <h2 className="text-4xl md:text-6xl font-extrabold mb-8 tracking-tight">
                  Ready to Completely Transform Your Hiring Process?
                </h2>
                <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
                  Register correctly today and lock your entire agency into the exclusively affordable founding member pricing forever.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <a 
                    href="/register" 
                    className="w-full sm:w-auto px-10 py-5 bg-white text-blue-700 rounded-xl font-extrabold text-lg hover:bg-gray-50 hover:shadow-2xl hover:-translate-y-1 transition-all shadow-xl"
                  >
                    Start 14-Day Free Trial
                  </a>
                  <a 
                    href="https://infinityworkitsolutions.com/#contact" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-10 py-5 bg-black/20 border border-white/30 text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-md"
                  >
                    Schedule Platform Demo
                  </a>
                </div>
              </div>
            </section>

            {/* Meet the Founder Section */}
            <section className="py-24 bg-white relative overflow-hidden border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-16">
                        {/* Image Frame Column */}
                        <div className="w-full md:w-1/3 flex justify-center pb-8 md:pb-0">
                            <div className="relative group perspective">
                                <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition duration-500"></div>
                                <div className="relative bg-white p-4 rounded-[2rem] shadow-2xl border border-gray-100 transform rotate-[-2deg] hover:rotate-[0deg] transition duration-500 ease-out z-10 w-64 md:w-72">
                                    <div className="aspect-[4/5] rounded-[1.5rem] overflow-hidden bg-gray-100 relative">
                                        <img 
                                            src="/founder.jpg" 
                                            alt="Mpumelelo Magagula" 
                                            className="absolute inset-0 w-full h-full object-cover object-top"
                                            onError={(e) => {
                                                e.currentTarget.src = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                                            }}
                                        />
                                    </div>
                                    <div className="pt-6 pb-2 text-center">
                                        <h4 className="text-xl font-bold text-gray-900">Mpumelelo Magagula</h4>
                                        <p className="text-blue-600 font-semibold text-sm">Founder & CEO</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Founder Bio Column */}
                        <div className="w-full md:w-2/3">
                            <div className="inline-flex items-center space-x-2 bg-purple-50 text-purple-700 px-6 py-2 rounded-full text-base font-black mb-6 border border-purple-100 uppercase tracking-widest">
                                <Code className="w-5 h-5 text-purple-600" />
                                <span>Behind the Code</span>
                            </div>
                            
                            <h2 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 tracking-tighter">Meet the Founder</h2>
                            
                            <div className="space-y-6 text-xl text-gray-600 font-bold leading-relaxed">
                                <p>
                                    I'm Mpumelelo Magagula, founder of <strong className="text-blue-600">InfinityWork IT Solutions</strong> — a specialized technology company pioneering DevOps, scalable cloud infrastructure, and AI-powered automation.
                                </p>
                                <p>
                                    As a DevOps engineer, I've experienced the severe friction of the hiring process firsthand. Having been the job seeker sending endless applications into the void, I knew exactly how brilliant candidates were getting completely lost in the noise of manual screeners.
                                </p>
                                <p>
                                    In 2025, after launching my own business and while helping consulting clients automate their complex operations, the realization finally hit me: 
                                    <span className="block mt-6 pl-8 border-l-8 border-blue-500 text-gray-900 text-2xl font-black italic">
                                        "Why is recruitment still this manual?"
                                    </span>
                                </p>
                            </div>
                            
                            <div className="mt-12 pt-10 border-t border-gray-100">
                                <a 
                                    href="https://infinityworkitsolutions.com/" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-blue-600 font-black hover:text-blue-700 group text-xl uppercase tracking-widest"
                                >
                                    Visit InfinityWork IT Solutions
                                    <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-950 text-gray-300 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-12 mb-16">
                        <div className="md:col-span-1">
                            <div className="flex items-center space-x-3 mb-8">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <span className="text-white font-extrabold text-2xl">R</span>
                                </div>
                                <span className="text-white font-bold text-2xl tracking-tight">RecruitPro SA</span>
                            </div>
                            <p className="text-gray-400 leading-relaxed mb-8 font-medium">
                                The AI-powered recruitment software platform properly engineered for agile and wildly fast-growing agencies globally.
                            </p>
                            
                            <div id="contact" className="space-y-4 bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                                <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-4">Direct Contact</h4>
                                <a href="mailto:mpumelelo@infinityworkitsolutions.com" className="flex items-center text-gray-300 hover:text-white transition-colors group">
                                    <div className="bg-gray-800 p-2 rounded-lg mr-3 group-hover:bg-blue-600 transition-colors shrink-0">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium break-all">mpumelelo@infinityworkitsolutions.com</span>
                                </a>
                                <a href="tel:+27720614477" className="flex items-center text-gray-300 hover:text-white transition-colors group mt-4">
                                    <div className="bg-gray-800 p-2 rounded-lg mr-3 group-hover:bg-blue-600 transition-colors shrink-0">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium whitespace-nowrap">+27 72 061 4477</span>
                                </a>
                            </div>
                        </div>

                        <div className="md:mt-4">
                            <h3 className="text-white font-bold mb-6 tracking-wide uppercase text-sm">Product Platform</h3>
                            <ul className="space-y-4">
                                <li><a href="#features" className="hover:text-blue-400 font-medium transition-colors text-gray-400">Deep Features</a></li>
                                <li><a href="#pricing" className="hover:text-blue-400 font-medium transition-colors text-gray-400">Pricing Tier Matrix</a></li>
                                <li><a href="#demo" className="hover:text-blue-400 font-medium transition-colors text-gray-400">Live Demo Sandbox</a></li>
                                <li><a href="/api" className="hover:text-blue-400 font-medium transition-colors text-gray-400">Advanced Developer API</a></li>
                            </ul>
                        </div>

                        <div className="md:mt-4">
                            <h3 className="text-white font-bold mb-6 tracking-wide uppercase text-sm">Our Company</h3>
                            <ul className="space-y-4">
                                <li>
                                    <a href="https://infinityworkitsolutions.com/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 font-medium transition-colors text-gray-400">
                                        About Us
                                    </a>
                                </li>
                                <li><a href="#contact" className="hover:text-blue-400 font-medium transition-colors text-gray-400">Contact Network</a></li>
                                <li><a href="/blog" className="hover:text-blue-400 font-medium transition-colors text-gray-400">Technical Blog</a></li>
                                <li>
                                    <a href="#" onClick={(e) => { e.preventDefault(); alert("Not hiring at the moment!"); }} className="flex items-center hover:text-blue-400 font-medium transition-colors text-gray-400">
                                        Careers <span className="ml-2 bg-gray-800 text-xs px-2 py-0.5 rounded-full text-gray-500 border border-gray-700">Paused</span>
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div className="md:mt-4">
                            <h3 className="text-white font-bold mb-6 tracking-wide uppercase text-sm">Trust & Legal</h3>
                            <ul className="space-y-4">
                                <li><Link to="/privacy" className="hover:text-blue-400 font-medium transition-colors text-gray-400">Privacy Policy</Link></li>
                                <li><Link to="/terms" className="hover:text-blue-400 font-medium transition-colors text-gray-400">Terms of Service</Link></li>
                                <li><a href="/compliance" className="hover:text-blue-400 font-medium transition-colors text-gray-400">POPIA Compliance Center</a></li>
                                <li><a href="/security" className="hover:text-blue-400 font-medium transition-colors text-gray-400">Data Security Specs</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800/80 pt-10 text-center sm:flex sm:justify-between sm:text-left items-center">
                        <p className="text-gray-500 font-medium text-sm">© {(new Date()).getFullYear()} InfinityWork IT Solutions. All platform rights permanently reserved.</p>
                        <p className="mt-4 sm:mt-0 text-gray-500 text-sm font-medium flex items-center justify-center sm:justify-end">
                            Carefully built with <span className="text-red-500 mx-1.5 animate-pulse">❤️</span> for worldwide excellence
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
