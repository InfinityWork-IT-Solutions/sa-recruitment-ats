import { Shield, ArrowLeft, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
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
                            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <Shield className="text-white w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Privacy Policy</h1>
                                <p className="text-gray-500 font-semibold uppercase tracking-widest text-xs mt-2">RecruitPro SA (Pty) Ltd</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 mt-10">
                            <div className="bg-gray-50 px-5 py-2.5 rounded-full border border-gray-100 flex items-center">
                                <span className="text-gray-500 text-sm font-bold mr-2">LAST UPDATED:</span>
                                <span className="text-blue-600 text-sm font-extrabold">April 2026</span>
                            </div>
                            <div className="bg-gray-50 px-5 py-2.5 rounded-full border border-gray-100 flex items-center">
                                <span className="text-gray-500 text-sm font-bold mr-2">EFFECTIVE DATE:</span>
                                <span className="text-blue-600 text-sm font-extrabold">April 2026</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-[2.5rem] p-10 md:p-16 shadow-xl border border-gray-100 prose prose-blue max-w-none prose-headings:font-extrabold prose-headings:tracking-tight prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600">
                    <section className="mb-16">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-8 border-b border-gray-100 pb-4">1. INTRODUCTION</h2>
                        <p>
                            RecruitPro SA (Pty) Ltd ("we," "our," or "us") operates the RecruitPro recruitment platform at www.recruitpro.co.za (the "Platform"). We are committed to protecting your privacy and complying with the Protection of Personal Information Act, 2013 (POPIA).
                        </p>
                        
                        <div className="mt-8 bg-blue-50/50 p-8 rounded-3xl border border-blue-100">
                            <h4 className="text-blue-900 font-extrabold uppercase tracking-widest text-sm mb-6">Our Information Officer:</h4>
                            <div className="grid sm:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center text-gray-700">
                                        <div className="bg-blue-100 p-2 rounded-lg mr-4">
                                            <Shield className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Information Officer</p>
                                            <p className="font-bold">Mpumelelo Magagula</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-gray-700">
                                        <div className="bg-blue-100 p-2 rounded-lg mr-4">
                                            <ExternalLink className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Company</p>
                                            <p className="font-bold">InfinityWork IT Solutions (Pty) Ltd</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center text-gray-700">
                                        <div className="bg-blue-100 p-2 rounded-lg mr-4">
                                            <Mail className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Email</p>
                                            <p className="font-bold">privacy@recruitpro.co.za</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-gray-700">
                                        <div className="bg-blue-100 p-2 rounded-lg mr-4">
                                            <MapPin className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Address</p>
                                            <p className="font-bold">Cape Town, South Africa</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mb-16">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-8 border-b border-gray-100 pb-4">2. INFORMATION WE COLLECT</h2>
                        
                        <div className="space-y-12">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                    <div className="w-2 h-8 bg-blue-600 rounded-full mr-4"></div>
                                    2.1 Personal Information from Candidates
                                </h3>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                        <h4 className="font-bold text-blue-700 mb-4 uppercase text-xs tracking-widest">Required Information:</h4>
                                        <ul className="space-y-2 list-none p-0">
                                            {['Full name and surname', 'Email address', 'Phone number', 'Location (city/province)', 'Years of experience', 'Highest qualification'].map((item) => (
                                                <li key={item} className="flex items-center text-gray-700">
                                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></div>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                        <h4 className="font-bold text-gray-500 mb-4 uppercase text-xs tracking-widest">Optional Information:</h4>
                                        <ul className="space-y-2 list-none p-0">
                                            {['Professional summary', 'CV/Resume (PDF, DOC, DOCX)', 'Skills and expertise', 'Work experience history', 'Salary expectations', 'Notice period'].map((item) => (
                                                <li key={item} className="flex items-center text-gray-600">
                                                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full mr-3"></div>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                    <div className="w-2 h-8 bg-blue-600 rounded-full mr-4"></div>
                                    2.2 Personal Information from Companies
                                </h3>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                        <h4 className="font-bold text-blue-700 mb-4 uppercase text-xs tracking-widest">Required Information:</h4>
                                        <ul className="space-y-2 list-none p-0">
                                            {['Company name', 'Registration number', 'Contact person name', 'Email address', 'Phone number', 'Physical address'].map((item) => (
                                                <li key={item} className="flex items-center text-gray-700">
                                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></div>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                        <h4 className="font-bold text-gray-500 mb-4 uppercase text-xs tracking-widest">Optional Information:</h4>
                                        <ul className="space-y-2 list-none p-0">
                                            {['Company logo', 'Company description', 'Website URL', 'Company size', 'Founded year', 'Team member details'].map((item) => (
                                                <li key={item} className="flex items-center text-gray-600">
                                                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full mr-3"></div>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-900 rounded-[2rem] p-10 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                <h3 className="text-2xl font-bold mb-6 text-white">2.3 Automatically Collected Information</h3>
                                <p className="text-gray-400 mb-8">We automatically collect data through your interactions with our interface:</p>
                                <div className="grid sm:grid-cols-2 gap-6">
                                    {[
                                        'IP address & Browser details',
                                        'Device type & OS',
                                        'Pages visited & Time spent',
                                        'Referring website',
                                        'Click patterns',
                                        'Search queries'
                                    ].map((item) => (
                                        <div key={item} className="flex items-center bg-white/5 border border-white/10 p-4 rounded-xl">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-4 shadow-sm shadow-blue-500"></div>
                                            <span className="font-medium text-sm">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mb-16">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-8 border-b border-gray-100 pb-4">3. HOW WE USE YOUR INFORMATION</h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h4 className="font-bold text-blue-700 uppercase tracking-widest text-sm">For Candidates:</h4>
                                <ul className="space-y-3 list-none p-0">
                                    {[
                                        'Create and manage your account',
                                        'Match with job opportunities',
                                        'Enable companies to view profile',
                                        'Send job alerts',
                                        'Facilitate communication',
                                        'Improve AI matching'
                                    ].map((item) => (
                                        <li key={item} className="flex items-start text-gray-700">
                                            <div className="bg-blue-100 rounded-md p-0.5 mr-3 mt-1 shrink-0"><Shield className="w-3.5 h-3.5 text-blue-600" /></div>
                                            <span className="font-medium">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-6">
                                <h4 className="font-bold text-purple-700 uppercase tracking-widest text-sm">For Companies:</h4>
                                <ul className="space-y-3 list-none p-0">
                                    {[
                                        'Manage job listings',
                                        'Review candidate applications',
                                        'Match with suitable candidates',
                                        'Process subscription payments',
                                        'Provide analytics',
                                        'Platform updates'
                                    ].map((item) => (
                                        <li key={item} className="flex items-start text-gray-700">
                                            <div className="bg-purple-100 rounded-md p-0.5 mr-3 mt-1 shrink-0"><Shield className="w-3.5 h-3.5 text-purple-600" /></div>
                                            <span className="font-medium">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="mb-16">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-8 border-b border-gray-100 pb-4">4. LEGAL BASIS (POPIA)</h2>
                        <div className="bg-yellow-50/50 border border-yellow-100 rounded-3xl p-8">
                            <p className="mb-8 font-medium">We process your personal information based on:</p>
                            <div className="grid sm:grid-cols-2 gap-6">
                                {[
                                    { title: 'Consent', desc: 'Explicit permission given' },
                                    { title: 'Contract', desc: 'Necessary for services' },
                                    { title: 'Legal Obligation', desc: 'Compliance with SA laws' },
                                    { title: 'Legitimate Interests', desc: 'Business interests/fraud prevention' }
                                ].map((item) => (
                                    <div key={item.title} className="bg-white p-5 rounded-2xl border border-yellow-100 shadow-sm">
                                        <p className="font-extrabold text-gray-900 mb-1">{item.title}</p>
                                        <p className="text-sm text-gray-500 font-medium">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="mb-16">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-8 border-b border-gray-100 pb-4">5. DATA SHARING</h2>
                        <div className="space-y-8">
                            <p>We share information only when necessary to fulfill the recruitment process:</p>
                            <div className="bg-red-50/50 border border-red-100 p-8 rounded-3xl mb-8">
                                <p className="text-red-700 font-extrabold mb-0 flex items-center">
                                    <Shield className="w-5 h-5 mr-2" />
                                    We NEVER sell your personal data to third parties for marketing.
                                </p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-900">Third-Party Partners:</h4>
                                    <ul className="space-y-3 list-none p-0">
                                        {[
                                            'PayFast (Payment processing)',
                                            'SendGrid (Transactional emails)',
                                            'Google Analytics (Anonymized data)',
                                            'AWS/Azure (Cloud Infrastructure)'
                                        ].map((item) => (
                                            <li key={item} className="flex items-center text-sm font-medium text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3"></div>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-900">Candidate Visibility:</h4>
                                    <ul className="space-y-3 list-none p-0">
                                        {[
                                            'Shared with companies ONLY when applying',
                                            'Contact details visible to hiring firms',
                                            'Full CV viewable by recruiters',
                                            'Skills & experience assessment'
                                        ].map((item) => (
                                            <li key={item} className="flex items-center text-sm font-medium text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3"></div>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mb-16">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-8 border-b border-gray-100 pb-4">6. YOUR RIGHTS (POPIA)</h2>
                        <div className="grid gap-4">
                            {[
                                { title: 'Access', desc: 'Request a copy of your personal data' },
                                { title: 'Correction', desc: 'Update incorrect or incomplete info' },
                                { title: 'Deletion', desc: 'Request removal of account and data' },
                                { title: 'Objection', desc: 'Object to certain processing' }
                            ].map((item) => (
                                <div key={item.title} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:border-blue-200 transition-colors">
                                    <p className="font-extrabold text-blue-900 mb-1 sm:mb-0">{item.title}</p>
                                    <p className="text-sm text-gray-500 font-medium">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-10 p-8 bg-blue-950 rounded-3xl text-white">
                            <h4 className="font-bold mb-4">Exercise Your Rights:</h4>
                            <p className="text-blue-100 mb-6">Email us with the subject "POPIA Data Request" at:</p>
                            <div className="flex items-center bg-white/10 p-4 rounded-xl border border-white/20">
                                <Mail className="w-5 h-5 mr-3 text-blue-400" />
                                <span className="font-bold">privacy@recruitpro.co.za</span>
                            </div>
                        </div>
                    </section>

                    <section className="mb-16">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-8 border-b border-gray-100 pb-4">7. SECURITY & STORAGE</h2>
                        <div className="grid sm:grid-cols-2 gap-6">
                            {[
                                { title: 'Encryption', desc: '256-bit SSL/TLS for all data' },
                                { title: 'Data Sovereignty', desc: 'Primary storage in South Africa' },
                                { title: 'Access Control', desc: 'Role-based & Multi-factor auth' },
                                { title: 'Incident Response', desc: '72-hour notification promise' }
                            ].map((item) => (
                                <div key={item.title} className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                    <p className="font-extrabold text-gray-900 mb-1">{item.title}</p>
                                    <p className="text-sm text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="mt-20 pt-10 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mb-6 px-10">
                            By using RecruitPro SA, you acknowledge that you have read and understood this Privacy Policy.
                        </p>
                        <div className="flex justify-center flex-wrap gap-8 text-xs font-bold text-gray-400">
                            <span>POPIA COMPLIANT</span>
                            <span>ENCRYPTED DATA</span>
                            <span>SA GOVERNED</span>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
