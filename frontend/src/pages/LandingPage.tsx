import { useState } from 'react';
import {
    Users, Briefcase, TrendingUp, Shield, Zap, Globe,
    Check, ArrowRight, Menu, X, BarChart3, FileText,
    Clock, Target, Star, Award, ChevronDown
} from 'lucide-react';

export default function LandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeFAQ, setActiveFAQ] = useState<number | null>(null);

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
                            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
                            <a href="#benefits" className="text-gray-600 hover:text-blue-600 transition-colors">Benefits</a>
                            <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</a>
                            <a href="#about" className="text-gray-600 hover:text-blue-600 transition-colors">About</a>
                        </nav>

                        {/* CTA Buttons */}
                        <div className="hidden md:flex items-center space-x-4">
                            <a
                                href="/login"
                                className="text-gray-600 hover:text-blue-600 transition-colors"
                            >
                                Sign In
                            </a>
                            <a
                                href="/register"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
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
                    <div className="md:hidden border-t border-gray-200 bg-white">
                        <div className="px-4 py-4 space-y-3">
                            <a href="#features" className="block text-gray-600 hover:text-blue-600">Features</a>
                            <a href="#benefits" className="block text-gray-600 hover:text-blue-600">Benefits</a>
                            <a href="#pricing" className="block text-gray-600 hover:text-blue-600">Pricing</a>
                            <a href="#about" className="block text-gray-600 hover:text-blue-600">About</a>
                            <div className="pt-3 border-t border-gray-200 space-y-2">
                                <a href="/login" className="block text-center text-gray-600 hover:text-blue-600 py-2">
                                    Sign In
                                </a>
                                <a
                                    href="/register"
                                    className="block text-center bg-blue-600 text-white px-4 py-2 rounded-lg"
                                >
                                    Get Started
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Hero Section */}
            <section className="pt-24 pb-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <div className="inline-block mb-4">
                            <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-1 rounded-full">
                                🇿🇦 Built for South African Recruitment Agencies
                            </span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                            Hire <span className="text-blue-600">Faster.</span><br />
                            Recruit <span className="text-purple-600">Smarter.</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8">
                            AI-powered Applicant Tracking System designed for Cape Town recruitment agencies.
                            Streamline your hiring process, manage candidates effortlessly, and close positions 40% faster.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                            <a
                                href="/register"
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                            >
                                <span>Start Free Trial</span>
                                <ArrowRight className="w-5 h-5" />
                            </a>
                            <a
                                href="#demo"
                                className="w-full sm:w-auto border-2 border-gray-300 hover:border-blue-600 text-gray-700 hover:text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
                            >
                                Watch Demo
                            </a>
                        </div>
                        <p className="mt-4 text-sm text-gray-500">
                            ✨ No credit card required • 14-day free trial • Cancel anytime
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                        {[
                            { number: '40%', label: 'Faster Hiring' },
                            { number: '10K+', label: 'Candidates Placed' },
                            { number: '500+', label: 'Active Jobs' },
                            { number: '99.9%', label: 'Uptime SLA' },
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-3xl font-bold text-blue-600 mb-1">{stat.number}</div>
                                <div className="text-sm text-gray-600">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* User Portals Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Built for Everyone in the Hiring Process
                        </h2>
                        <p className="text-xl text-gray-600">
                            Whether you're a recruiter, hiring manager, or job seeker — we've got you covered
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Recruiter Portal */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 hover:shadow-xl transition-shadow">
                            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                                <Users className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">For Recruiters</h3>
                            <p className="text-gray-600 mb-6">
                                Manage candidates, track applications, and close positions faster with AI-powered matching
                            </p>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center text-gray-700">
                                    <Check className="w-5 h-5 text-blue-600 mr-2" />
                                    <span>Kanban pipeline management</span>
                                </li>
                                <li className="flex items-center text-gray-700">
                                    <Check className="w-5 h-5 text-blue-600 mr-2" />
                                    <span>AI candidate matching</span>
                                </li>
                                <li className="flex items-center text-gray-700">
                                    <Check className="w-5 h-5 text-blue-600 mr-2" />
                                    <span>Bulk operations & workflows</span>
                                </li>
                            </ul>
                            <a
                                href="/register?type=recruiter"
                                className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center px-6 py-3 rounded-lg font-semibold transition-colors"
                            >
                                Get Started as Recruiter
                            </a>
                        </div>

                        {/* Client/Company Portal */}
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 hover:shadow-xl transition-shadow">
                            <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                                <Briefcase className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">For Companies</h3>
                            <p className="text-gray-600 mb-6">
                                Post jobs, review candidates, and collaborate with your recruitment team
                            </p>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center text-gray-700">
                                    <Check className="w-5 h-5 text-purple-600 mr-2" />
                                    <span>Unlimited job postings</span>
                                </li>
                                <li className="flex items-center text-gray-700">
                                    <Check className="w-5 h-5 text-purple-600 mr-2" />
                                    <span>Real-time candidate updates</span>
                                </li>
                                <li className="flex items-center text-gray-700">
                                    <Check className="w-5 h-5 text-purple-600 mr-2" />
                                    <span>Analytics & reporting</span>
                                </li>
                            </ul>
                            <a
                                href="/register?type=client"
                                className="block w-full bg-purple-600 hover:bg-purple-700 text-white text-center px-6 py-3 rounded-lg font-semibold transition-colors"
                            >
                                Register Your Company
                            </a>
                        </div>

                        {/* Applicant Portal */}
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 hover:shadow-xl transition-shadow">
                            <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center mb-6">
                                <Target className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">For Job Seekers</h3>
                            <p className="text-gray-600 mb-6">
                                Find your dream job, track applications, and get matched with opportunities
                            </p>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center text-gray-700">
                                    <Check className="w-5 h-5 text-green-600 mr-2" />
                                    <span>Browse 500+ active jobs</span>
                                </li>
                                <li className="flex items-center text-gray-700">
                                    <Check className="w-5 h-5 text-green-600 mr-2" />
                                    <span>AI job recommendations</span>
                                </li>
                                <li className="flex items-center text-gray-700">
                                    <Check className="w-5 h-5 text-green-600 mr-2" />
                                    <span>Application tracking</span>
                                </li>
                            </ul>
                            <a
                                href="/apply"
                                className="block w-full bg-green-600 hover:bg-green-700 text-white text-center px-6 py-3 rounded-lg font-semibold transition-colors"
                            >
                                Find Jobs & Apply
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Everything You Need to Hire Better
                        </h2>
                        <p className="text-xl text-gray-600">
                            Powerful features built for South African recruitment agencies
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Zap className="w-6 h-6" />,
                                title: 'AI-Powered Matching',
                                description: 'Smart algorithms match candidates to jobs based on skills, experience, and cultural fit'
                            },
                            {
                                icon: <FileText className="w-6 h-6" />,
                                title: 'Resume Parsing',
                                description: 'Automatically extract candidate information from CVs and populate profiles instantly'
                            },
                            {
                                icon: <BarChart3 className="w-6 h-6" />,
                                title: 'Analytics Dashboard',
                                description: 'Track hiring metrics, time-to-fill, source effectiveness, and team performance'
                            },
                            {
                                icon: <Globe className="w-6 h-6" />,
                                title: 'Multi-Province Support',
                                description: 'Manage candidates across all 9 SA provinces with location-based filtering'
                            },
                            {
                                icon: <Shield className="w-6 h-6" />,
                                title: 'POPIA Compliant',
                                description: 'Built-in consent management and data protection for South African privacy laws'
                            },
                            {
                                icon: <Clock className="w-6 h-6" />,
                                title: 'Automated Workflows',
                                description: 'Set up automatic email notifications, reminders, and status updates'
                            },
                        ].map((feature, i) => (
                            <div key={i} className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                                Why Cape Town Agencies Choose RecruitPro SA
                            </h2>
                            <div className="space-y-6">
                                {[
                                    {
                                        title: 'Save 15+ Hours Per Week',
                                        description: 'Automate repetitive tasks like resume screening, email follow-ups, and status updates'
                                    },
                                    {
                                        title: 'Close Positions 40% Faster',
                                        description: 'Streamlined workflows and AI matching help you fill roles in record time'
                                    },
                                    {
                                        title: 'Reduce Cost-Per-Hire by 30%',
                                        description: 'More efficient processes mean lower recruitment costs and higher margins'
                                    },
                                    {
                                        title: 'Better Candidate Experience',
                                        description: 'Keep candidates informed with automated updates and a professional portal'
                                    },
                                ].map((benefit, i) => (
                                    <div key={i} className="flex items-start space-x-4">
                                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Check className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                                            <p className="text-gray-600">{benefit.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 h-96 flex items-center justify-center">
                            <div className="text-center">
                                <TrendingUp className="w-24 h-24 text-blue-600 mx-auto mb-4" />
                                <p className="text-2xl font-bold text-gray-900">📈 Average ROI</p>
                                <p className="text-5xl font-bold text-blue-600 my-2">320%</p>
                                <p className="text-gray-600">in the first 6 months</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Simple, Transparent Pricing
                        </h2>
                        <p className="text-xl text-gray-600">
                            Choose the plan that fits your agency. All prices in ZAR.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Starter */}
                        <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-blue-500 transition-all">
                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                                <p className="text-gray-600 mb-4">Perfect for small agencies</p>
                                <div className="text-4xl font-bold text-gray-900">
                                    R2,499
                                    <span className="text-lg font-normal text-gray-600">/month</span>
                                </div>
                            </div>
                            <ul className="space-y-3 mb-8">
                                {[
                                    'Up to 50 active jobs',
                                    '500 candidates',
                                    '3 team members',
                                    'Basic analytics',
                                    'Email support',
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center text-gray-700">
                                        <Check className="w-5 h-5 text-blue-600 mr-3" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <a
                                href="/register?plan=starter"
                                className="block w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white text-center px-6 py-3 rounded-lg font-semibold transition-colors"
                            >
                                Start Free Trial
                            </a>
                        </div>

                        {/* Professional - Most Popular */}
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white transform scale-105 shadow-2xl">
                            <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-2xl">
                                MOST POPULAR
                            </div>
                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold mb-2">Professional</h3>
                                <p className="text-blue-100 mb-4">For growing agencies</p>
                                <div className="text-4xl font-bold">
                                    R4,999
                                    <span className="text-lg font-normal text-blue-100">/month</span>
                                </div>
                            </div>
                            <ul className="space-y-3 mb-8">
                                {[
                                    'Unlimited jobs',
                                    '2,000 candidates',
                                    '10 team members',
                                    'Advanced analytics',
                                    'AI matching',
                                    'Priority support',
                                    'API access',
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center">
                                        <Check className="w-5 h-5 text-blue-200 mr-3" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <a
                                href="/register?plan=professional"
                                className="block w-full bg-white text-blue-600 hover:bg-blue-50 text-center px-6 py-3 rounded-lg font-semibold transition-colors"
                            >
                                Start Free Trial
                            </a>
                        </div>

                        {/* Enterprise */}
                        <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-blue-500 transition-all">
                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                                <p className="text-gray-600 mb-4">For large agencies</p>
                                <div className="text-4xl font-bold text-gray-900">
                                    Custom
                                </div>
                            </div>
                            <ul className="space-y-3 mb-8">
                                {[
                                    'Everything in Professional',
                                    'Unlimited candidates',
                                    'Unlimited team members',
                                    'Custom workflows',
                                    'Dedicated account manager',
                                    'SLA guarantee',
                                    'Custom integrations',
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center text-gray-700">
                                        <Check className="w-5 h-5 text-blue-600 mr-3" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <a
                                href="#contact"
                                className="block w-full border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white text-center px-6 py-3 rounded-lg font-semibold transition-colors"
                            >
                                Contact Sales
                            </a>
                        </div>
                    </div>

                    <p className="text-center mt-8 text-gray-600">
                        All plans include 14-day free trial • No credit card required • Cancel anytime
                    </p>
                </div>
            </section>

            {/* Social Proof / Testimonials */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Trusted by Cape Town's Top Agencies
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                quote: "RecruitPro SA cut our time-to-fill by 45%. The AI matching is incredible!",
                                author: "Sarah Johnson",
                                role: "Recruitment Manager",
                                company: "TalentHub CT"
                            },
                            {
                                quote: "Best investment we made. The analytics helped us identify and fix bottlenecks.",
                                author: "Michael Chen",
                                role: "CEO",
                                company: "Elite Recruitment"
                            },
                            {
                                quote: "POPIA compliance built-in saved us so much time. Highly recommend!",
                                author: "Thandiwe Nkosi",
                                role: "Operations Director",
                                company: "ProStaff SA"
                            },
                        ].map((testimonial, i) => (
                            <div key={i} className="bg-gray-50 rounded-xl p-6">
                                <div className="flex items-center mb-4">
                                    {[...Array(5)].map((_, j) => (
                                        <Star key={j} className="w-5 h-5 text-yellow-400 fill-current" />
                                    ))}
                                </div>
                                <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                                <div>
                                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                                    <p className="text-sm text-gray-600">{testimonial.role}, {testimonial.company}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">
                        Ready to Transform Your Recruitment Process?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Join 500+ South African agencies using RecruitPro SA to hire faster and smarter
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <a
                            href="/register"
                            className="w-full sm:w-auto bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center justify-center space-x-2"
                        >
                            <span>Start Your 14-Day Free Trial</span>
                            <ArrowRight className="w-5 h-5" />
                        </a>
                        <a
                            href="#contact"
                            className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
                        >
                            Schedule a Demo
                        </a>
                    </div>
                    <p className="mt-6 text-blue-100 text-sm">
                        ✨ No credit card required • Setup in 5 minutes • Cancel anytime
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold">R</span>
                                </div>
                                <span className="text-white font-bold">RecruitPro SA</span>
                            </div>
                            <p className="text-sm text-gray-400">
                                AI-powered recruitment software for South African agencies
                            </p>
                        </div>

                        <div>
                            <h3 className="text-white font-semibold mb-4">Product</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                                <li><a href="#demo" className="hover:text-white transition-colors">Demo</a></li>
                                <li><a href="/api" className="hover:text-white transition-colors">API</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-white font-semibold mb-4">Company</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                                <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
                                <li><a href="/careers" className="hover:text-white transition-colors">Careers</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-white font-semibold mb-4">Legal</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                                <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                                <li><a href="/popia" className="hover:text-white transition-colors">POPIA Compliance</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-8 text-center text-sm">
                        <p>© 2026 InfinityWork IT Solutions (Pty) Ltd • Cape Town, South Africa</p>
                        <p className="mt-2 text-gray-500">
                            Built with ❤️ in Cape Town • Infinite Tech. Limitless Solutions.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
