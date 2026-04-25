import { Link } from 'react-router-dom';
import { Check, ArrowRight, Zap, Target, Search } from 'lucide-react';

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-12">
                
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto space-y-4">
                    <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
                        Simple, transparent pricing
                    </h1>
                    <p className="text-xl text-gray-600">
                        Choose the perfect plan for your hiring needs. All plans include a 14-day free trial.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
                    
                    {/* Lite Plan */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900">Lite</h2>
                            <div className="flex items-baseline text-5xl font-extrabold text-gray-900">
                                R0 <span className="text-xl font-medium text-gray-500 ml-2">/mo</span>
                            </div>
                            <p className="text-gray-500">Perfect for small businesses just getting started with hiring.</p>
                            
                            <ul className="space-y-4">
                                <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-2 shrink-0" /><span className="text-gray-600">Up to 3 Active Jobs</span></li>
                                <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-2 shrink-0" /><span className="text-gray-600">50 CV Parses / month</span></li>
                                <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-2 shrink-0" /><span className="text-gray-600">Basic Candidate Management</span></li>
                                <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-2 shrink-0" /><span className="text-gray-600">Email Support</span></li>
                            </ul>

                            <Link 
                                to="/register?type=company&plan=lite" 
                                className="block w-full py-3 px-4 border border-blue-600 text-blue-600 text-center rounded-lg font-bold hover:bg-blue-50 transition-colors"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>

                    {/* Premium Plan (Highlighted) */}
                    <div className="bg-blue-600 rounded-2xl shadow-xl transform scale-105 p-8 relative">
                        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                            <span className="bg-gradient-to-r from-green-400 to-green-500 text-white text-sm font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                                Most Popular
                            </span>
                        </div>
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white">Premium</h2>
                            <div className="flex items-baseline text-5xl font-extrabold text-white">
                                R999 <span className="text-xl font-medium text-blue-200 ml-2">/mo</span>
                            </div>
                            <p className="text-blue-100">Advanced AI features for growing teams and agencies.</p>
                            
                            <ul className="space-y-4 text-white">
                                <li className="flex items-start"><Zap className="h-5 w-5 text-yellow-300 mr-2 shrink-0" /><span>Unlimited Jobs</span></li>
                                <li className="flex items-start"><Target className="h-5 w-5 text-yellow-300 mr-2 shrink-0" /><span>1,000 CV Parses / month</span></li>
                                <li className="flex items-start"><Search className="h-5 w-5 text-yellow-300 mr-2 shrink-0" /><span>AI Candidate Matching</span></li>
                                <li className="flex items-start"><Check className="h-5 w-5 text-green-300 mr-2 shrink-0" /><span>Custom Branding & Logos</span></li>
                                <li className="flex items-start"><Check className="h-5 w-5 text-green-300 mr-2 shrink-0" /><span>Priority Support</span></li>
                            </ul>

                            <Link 
                                to="/register?type=company&plan=premium" 
                                className="block w-full py-3 px-4 bg-white text-blue-600 text-center rounded-lg font-bold hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                Start 14-Day Free Trial
                            </Link>
                        </div>
                    </div>

                    {/* Enterprise Plan */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900">Enterprise</h2>
                            <div className="flex items-baseline text-5xl font-extrabold text-gray-900">
                                Custom
                            </div>
                            <p className="text-gray-500">For high-volume recruitment agencies and large enterprises.</p>
                            
                            <ul className="space-y-4">
                                <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-2 shrink-0" /><span className="text-gray-600">Unlimited Everything</span></li>
                                <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-2 shrink-0" /><span className="text-gray-600">API Access</span></li>
                                <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-2 shrink-0" /><span className="text-gray-600">Custom Integrations</span></li>
                                <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-2 shrink-0" /><span className="text-gray-600">Dedicated Account Manager</span></li>
                            </ul>

                            <Link 
                                to="/contact-sales" 
                                className="block w-full py-3 px-4 border border-gray-300 text-gray-700 text-center rounded-lg font-bold hover:bg-gray-50 transition-colors"
                            >
                                Contact Sales
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
