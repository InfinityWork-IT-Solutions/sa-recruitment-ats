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
                    
                    {/* Starter Plan */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900">Starter</h2>
                            <div className="flex items-baseline text-5xl font-extrabold text-gray-900">
                                R2,030 <span className="text-xl font-medium text-gray-500 ml-2">/mo</span>
                            </div>
                            <p className="text-gray-500">Perfect for small businesses just getting started with hiring.</p>
                            
                            <ul className="space-y-4">
                                <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-2 shrink-0" /><span className="text-gray-600">2 team seats included</span></li>
                                <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-2 shrink-0" /><span className="text-gray-600">50 active jobs per month</span></li>
                                <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-2 shrink-0" /><span className="text-gray-600">Manage 500 candidates</span></li>
                                <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-2 shrink-0" /><span className="text-gray-600">Basic AI matching</span></li>
                                <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-2 shrink-0" /><span className="text-gray-600">Email support</span></li>
                            </ul>

                            <Link 
                                to="/register?type=company&plan=starter" 
                                className="block w-full py-3 px-4 border border-blue-600 text-blue-600 text-center rounded-lg font-bold hover:bg-blue-50 transition-colors"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>

                    {/* Professional Plan (Highlighted) */}
                    <div className="bg-blue-600 rounded-2xl shadow-xl transform scale-105 p-8 relative">
                        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                            <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 text-sm font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                                Most Popular
                            </span>
                        </div>
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white">Professional</h2>
                            <div className="flex items-baseline text-5xl font-extrabold text-white">
                                R4,199 <span className="text-xl font-medium text-blue-200 ml-2">/mo</span>
                            </div>
                            <p className="text-blue-100">Advanced AI features for growing teams and agencies.</p>
                            
                            <ul className="space-y-4 text-white">
                                <li className="flex items-start"><Check className="h-5 w-5 text-yellow-300 mr-2 shrink-0" /><span>5 team seats included</span></li>
                                <li className="flex items-start"><Check className="h-5 w-5 text-yellow-300 mr-2 shrink-0" /><span>Unlimited active jobs</span></li>
                                <li className="flex items-start"><Check className="h-5 w-5 text-yellow-300 mr-2 shrink-0" /><span>Manage 2,000 candidates</span></li>
                                <li className="flex items-start"><Check className="h-5 w-5 text-yellow-300 mr-2 shrink-0" /><span>Advanced AI matching</span></li>
                                <li className="flex items-start"><Check className="h-5 w-5 text-yellow-300 mr-2 shrink-0" /><span>Priority 24/7 support</span></li>
                            </ul>

                            <Link 
                                to="/register?type=company&plan=professional" 
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
                                <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-2 shrink-0" /><span className="text-gray-600">10+ team seats locally</span></li>
                                <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-2 shrink-0" /><span className="text-gray-600">Unlimited everything globally</span></li>
                                <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-2 shrink-0" /><span className="text-gray-600">Custom AI training</span></li>
                                <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-2 shrink-0" /><span className="text-gray-600">Dedicated success manager</span></li>
                            </ul>

                            <a 
                                href="https://infinityworkitsolutions.com/#contact" 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full py-3 px-4 border border-gray-300 text-gray-700 text-center rounded-lg font-bold hover:bg-gray-50 transition-colors"
                            >
                                Contact Sales
                            </a>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
