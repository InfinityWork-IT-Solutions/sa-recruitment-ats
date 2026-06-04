import { FileText, ArrowLeft, Mail, MapPin, Globe, CreditCard, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Back Link */}
                <Link 
                    to="/" 
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-bold mb-12 group transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>

                {/* Header */}
                <div className="bg-white rounded-[2.5rem] p-10 md:p-16 shadow-xl border border-gray-100 mb-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg">
                                <FileText className="text-white w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Terms of Service</h1>
                                <p className="text-gray-500 font-semibold uppercase tracking-widest text-xs mt-2">RecruitPro SA Platform</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 mt-10">
                            <div className="bg-gray-50 px-5 py-2.5 rounded-full border border-gray-100 flex items-center">
                                <span className="text-gray-500 text-sm font-bold mr-2">LAST UPDATED:</span>
                                <span className="text-blue-600 text-sm font-extrabold">April 2026</span>
                            </div>
                            <div className="bg-gray-50 px-5 py-2.5 rounded-full border border-gray-100 flex items-center">
                                <span className="text-gray-500 text-sm font-bold mr-2">VERSION:</span>
                                <span className="text-blue-600 text-sm font-extrabold">1.0</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-[2.5rem] p-10 md:p-16 shadow-xl border border-gray-100 prose prose-blue max-w-none prose-headings:font-extrabold prose-headings:tracking-tight prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600">
                    <section className="mb-16">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-8 border-b border-gray-100 pb-4">1. ACCEPTANCE OF TERMS</h2>
                        <p className="text-lg">
                            By accessing or using RecruitPro SA (www.recruitpro.co.za), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, you may not use our Platform.
                        </p>
                        
                        <div className="mt-8 bg-gray-50 p-8 rounded-3xl border border-gray-100">
                            <h4 className="text-gray-900 font-extrabold uppercase tracking-widest text-xs mb-6 px-1">Operated by:</h4>
                            <div className="grid sm:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <p className="font-bold text-gray-900">InfinityWork IT Solutions (Pty) Ltd</p>
                                    <div className="flex items-center text-gray-600 text-sm">
                                        <MapPin className="w-4 h-4 mr-3 text-gray-400" />
                                        Cape Town, South Africa
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center text-gray-600 text-sm">
                                        <Mail className="w-4 h-4 mr-3 text-gray-400" />
                                        support@recruitpro.co.za
                                    </div>
                                    <div className="flex items-center text-gray-600 text-sm">
                                        <Globe className="w-4 h-4 mr-3 text-gray-400" />
                                        www.recruitpro.co.za
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mb-16">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-8 border-b border-gray-100 pb-4">2. ELIGIBILITY & ACCOUNTS</h2>
                        <div className="grid sm:grid-cols-2 gap-8 mb-10">
                            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                <h4 className="font-extrabold text-blue-900 mb-4">You Must Be:</h4>
                                <ul className="space-y-2 list-none p-0 m-0">
                                    {['At least 18 years old', 'Legal capacity to contract', 'SA Resident/Business presence', 'Provide accurate info'].map((item) => (
                                        <li key={item} className="flex items-center text-sm font-medium text-gray-700">
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                <h4 className="font-extrabold text-gray-900 mb-4">Account Safety:</h4>
                                <ul className="space-y-2 list-none p-0 m-0">
                                    {['Keep password secure', 'Notify of unauthorized access', 'Do not share accounts', 'No impersonation'].map((item) => (
                                        <li key={item} className="flex items-center text-sm font-medium text-gray-700">
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3"></div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="mb-16">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-8 border-b border-gray-100 pb-4">3. COMPANY SUBSCRIPTIONS</h2>
                        <div className="bg-gray-900 rounded-[2rem] p-10 text-white mb-8">
                            <div className="flex items-center mb-8">
                                <CreditCard className="w-8 h-8 text-blue-400 mr-4" />
                                <h3 className="text-2xl font-bold m-0 text-white">Payment & Billing</h3>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-10">
                                <div>
                                    <h4 className="text-blue-400 font-extrabold uppercase tracking-widest text-xs mb-4">Billing Cycle</h4>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Subscriptions are billed monthly in advance via PayFast. Auto-renewal remains active unless cancelled via settings at least 24 hours before the period ends.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-blue-400 font-extrabold uppercase tracking-widest text-xs mb-4">Refund Policy</h4>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        We do not offer refunds for partial months or unused seats. Price changes will be notified at least 30 days in advance.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { name: 'Starter', price: 'R2,030', features: '2 seats, 50 jobs, 500 candidates' },
                                { name: 'Professional', price: 'R4,199', features: '5 seats, Unlimited jobs, 2000 candidates' },
                                { name: 'Enterprise', price: 'Custom', features: '10+ seats, Unlimited globally, Dedicated Support' }
                            ].map((plan) => (
                                <div key={plan.name} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm text-center">
                                    <p className="font-bold text-gray-500 uppercase text-xs mb-1">{plan.name}</p>
                                    <p className="text-2xl font-extrabold text-gray-900 mb-2">{plan.price}{plan.price !== 'Custom' && <span className="text-sm text-gray-400 font-medium">/mo</span>}</p>
                                    <p className="text-xs text-gray-500 font-medium">{plan.features}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 bg-blue-50/50 p-6 rounded-2xl border border-blue-100 text-center">
                            <p className="text-sm font-bold text-blue-900 m-0 leading-relaxed">
                                Zero hidden setup fees. Cancellations can be performed securely at any time.
                                Outstanding placement commissions remain payable after cancellation.
                            </p>
                        </div>
                    </section>

                    {/* Placement Fee Clause */}
                    <section className="mb-16">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-8 border-b border-gray-100 pb-4">4. PLACEMENT FEE & COMMISSION</h2>
                        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-8 mb-8">
                            <p className="text-amber-900 font-extrabold text-base mb-3">⚠ Important — Please read this clause carefully.</p>
                            <p className="text-amber-800 text-sm leading-relaxed mb-3">
                                If any candidate sourced, identified, or accessed through the RecruitPro SA platform is successfully
                                placed in a permanent, contract, or fixed-term position — whether during the free trial or at any
                                time after — a placement commission of{' '}
                                <strong>12% of the candidate's gross annual cost-to-company (CTC)</strong> is owed to RecruitPro SA.
                            </p>
                            <p className="text-amber-800 text-sm leading-relaxed font-semibold">
                                This obligation applies regardless of whether you are on a free trial, active subscription, or have
                                cancelled your subscription at the time of the placement.
                            </p>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-bold text-gray-900 mb-3">When Commission is Due</h4>
                                <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
                                    <li>The commission becomes payable upon the candidate successfully completing their <strong>standard 3-month probation period</strong>.</li>
                                    <li>An invoice will be issued at that point, payable within 30 days.</li>
                                    <li>If the candidate leaves before completing probation, no commission is owed for that placement.</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-3">Free Replacement Guarantee</h4>
                                <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
                                    <li>If a placed candidate leaves within probation, we provide <strong>one free replacement search</strong>.</li>
                                    <li>Client must notify us within 7 days of departure in writing.</li>
                                    <li>Client's subscription must remain active and original commission must be paid.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="mb-16">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-8 border-b border-gray-100 pb-4">5. INTELLECTUAL PROPERTY</h2>
                        <div className="flex flex-col md:flex-row gap-12">
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-900 mb-4">Our Rights:</h4>
                                <p className="text-sm">
                                    We own all rights to the RecruitPro SA name, branding, platform design, code, and AI matching algorithms. You may not reverse engineer or copy our functionality.
                                </p>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-900 mb-4">Your Content:</h4>
                                <p className="text-sm">
                                    You retain ownership of your uploaded CVs and job postings. By uploading, you grant us a license to process and display this content as part of our service.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="mb-16">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-8 border-b border-gray-100 pb-4">5. PROHIBITED CONDUCT</h2>
                        <div className="bg-red-50 border border-red-100 p-8 rounded-3xl">
                            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-4">
                                {[
                                    'Posting fake or misleading jobs',
                                    'Discriminating against candidates',
                                    'Scraping or data mining the platform',
                                    'Uploading malicious files/malware',
                                    'Spamming users or harassment',
                                    'Circumventing platform fees'
                                ].map((item) => (
                                    <div key={item} className="flex items-start text-sm font-medium text-red-900/80">
                                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full mr-3 mt-1.5 shrink-0"></div>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="mb-16">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-8 border-b border-gray-100 pb-4">6. DISCLAIMERS & LIABILITY</h2>
                        <div className="space-y-6">
                            <div className="bg-yellow-50/50 p-6 rounded-2xl border border-yellow-200">
                                <p className="text-sm font-medium text-gray-700 m-0">
                                    <strong>"As Is" Service:</strong> RecruitPro SA is provided without warranties of any kind. We do not guarantee job offers, candidate quality, or 100% error-free service.
                                </p>
                            </div>
                            <div className="flex items-start gap-4 p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                <Scale className="w-6 h-6 text-gray-400 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-2">Limitation of Liability</h4>
                                    <p className="text-sm m-0">Our total liability is limited to the fees you paid in the last 12 months, or R1,000 for free accounts. We are not liable for indirect or consequential damages.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mb-16">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-8 border-b border-gray-100 pb-4">7. GOVERNING LAW</h2>
                        <p>
                            These Terms are governed by the laws of the <strong className="text-gray-900">Republic of South Africa</strong>. Any disputes will be resolved in the courts of Cape Town, Western Cape. Parties agree to attempt mediation before litigation.
                        </p>
                    </section>

                    <section className="mt-20 pt-10 border-t border-gray-100 text-center">
                        <p className="text-base text-gray-900 font-extrabold mb-4 px-10 leading-tight">
                            BY USING RECRUITPRO SA, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS.
                        </p>
                        <div className="flex justify-center flex-wrap gap-8 text-xs font-bold text-gray-400 uppercase tracking-widest mt-8">
                            <span>InfinityWork IT Solutions</span>
                            <span>Secure Platform</span>
                            <span>SA Law Protected</span>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
