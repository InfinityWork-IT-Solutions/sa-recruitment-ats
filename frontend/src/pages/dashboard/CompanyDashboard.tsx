import { useAuthStore } from '@/store/auth';
import { Users, Briefcase, TrendingUp, Plus, UserCheck, Zap, Mail, ChevronRight } from 'lucide-react';

export default function CompanyDashboard() {
  const user = useAuthStore((state) => state.user);

  const stats = [
    { label: 'Active Jobs', count: 5, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Applicants', count: 48, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Top Matches', count: 12, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-100' },
  ];

  const applicantFeed = [
    { name: 'Sizwe Khoza', role: 'DevOps Engineer', score: 98, status: 'New', time: '10 min ago' },
    { name: 'Lerato Mokoena', role: 'Fullstack Dev', score: 85, status: 'Reviewing', time: '1 hour ago' },
    { name: 'David Smith', role: 'Product Manager', score: 92, status: 'New', time: '3 hours ago' },
  ];

  return (
    <div className="space-y-8 p-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Employer Command Center</h1>
          <p className="text-gray-600 mt-1">Monitor hiring progress and candidate matching AI.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border text-gray-900 px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition border-gray-200">
            View Analytics
          </button>
          <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center shadow-lg shadow-blue-200">
            <Plus className="w-5 h-5 mr-2" />
            Post New Job
          </button>
        </div>
      </header>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-gray-100 transition-all duration-300">
            {/* Background design element */}
            <div className={`absolute -right-4 -bottom-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform`}>
              <stat.icon className={`w-32 h-32 ${stat.color}`} />
            </div>
            
            <div className="flex justify-between items-start relative z-10">
              <div className={`${stat.bg} p-3 rounded-xl`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-green-500 font-bold text-xs flex items-center bg-green-50 px-2 py-1 rounded-full">+12% <TrendingUp className="w-3 h-3 ml-1" /></span>
            </div>
            
            <div className="mt-4 relative z-10">
              <p className="text-sm font-bold text-gray-400 tracking-wide uppercase">{stat.label}</p>
              <p className="text-4xl font-black text-gray-900 mt-1">{stat.count}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Recruitment Pipeline / Activity */}
        <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Zap className="w-5 h-5 mr-3 text-amber-500 fill-amber-500" />
              AI Intelligent Feed
            </h2>
            <button className="text-blue-600 text-sm font-bold hover:underline">Refresh</button>
          </div>

          <div className="space-y-6">
            {applicantFeed.map((app, i) => (
              <div key={i} className="flex items-center justify-between group cursor-pointer border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg border-2 border-white shadow-md">
                    {app.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition">{app.name}</h4>
                    <p className="text-xs font-semibold text-gray-400">{app.role} • {app.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xl font-black text-blue-600">{app.score}%</p>
                    <p className="text-[9px] uppercase font-bold text-gray-300">Match score</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-8 py-3 bg-gray-50 rounded-xl text-gray-600 font-bold text-sm hover:bg-gray-100 transition flex items-center justify-center">
            Go to Applicant Tracking
          </button>
        </section>

        {/* AI Action Cards */}
        <section className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-2xl shadow-xl shadow-blue-100 text-white relative overflow-hidden group">
            <div className="absolute right-0 top-0 opacity-10 p-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
              <Zap className="w-40 h-40" />
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2">Automate Your Outreach</h3>
              <p className="text-blue-100 text-sm mb-6 leading-relaxed">Let our AI invite the top matches to interview automatically based on your criteria.</p>
              <button className="bg-white text-blue-600 px-6 py-2.5 rounded-xl font-bold hover:bg-blue-50 transition shadow-lg flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Configure AI Agent
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-purple-500">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Platform Suggestion</h3>
            <p className="text-sm text-gray-600 mb-4 font-medium">Candidates with <strong>React</strong> skills are currently in high demand. We suggest adjusting the salary range for your Senior Developer role to increase visibility.</p>
            <button className="text-purple-600 font-bold text-sm hover:underline">Apply Recommendation</button>
          </div>
        </section>
      </div>
    </div>
  );
}
