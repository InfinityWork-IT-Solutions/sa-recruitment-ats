import { useAuthStore } from '@/store/auth';
import { Briefcase, FileText, CheckCircle, Search, MapPin, DollarSign, Clock } from 'lucide-react';

export default function CandidateDashboard() {
  const user = useAuthStore((state) => state.user);

  // Mock data for UI demonstration
  const stats = [
    { label: 'Applied Jobs', count: 12, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Interviews', count: 2, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Saved Jobs', count: 8, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  const matchedJobs = [
    { title: 'Frontend Developer', company: 'TechSolutions', location: 'Cape Town', salary: 'R45k - R60k', score: 95, time: '2 hours ago' },
    { title: 'Fullstack Engineer', company: 'GlobalDev', location: 'Johannesburg', salary: 'R55k - R75k', score: 88, time: '1 day ago' },
    { title: 'React Expert', company: 'InnoHire', location: 'Remote', salary: 'R50k - R70k', score: 82, time: '3 days ago' },
  ];

  return (
    <div className="space-y-8 p-6 animate-in fade-in duration-700">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.first_name}!</h1>
          <p className="text-gray-600 mt-1">Check out your latest career opportunities.</p>
        </div>
        <button className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition flex items-center shadow-md active:transform active:scale-95">
          <Search className="w-4 h-4 mr-2" />
          Find More Jobs
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <div className={`${stat.bg} p-3 rounded-lg`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Matched Jobs Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <span className="bg-green-500 w-2 h-8 rounded-full mr-3"></span>
            AI Recommendations for You
          </h2>
          <span className="text-green-600 font-semibold cursor-pointer hover:underline">See all matches</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {matchedJobs.map((job, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:border-green-300 transition-all hover:translate-x-1 group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-400 group-hover:bg-green-100 group-hover:text-green-600 transition">
                    {job.company[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition">{job.title}</h3>
                    <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-gray-400" /> {job.location}</span>
                      <span className="flex items-center"><Briefcase className="w-4 h-4 mr-1 text-gray-400" /> {job.company}</span>
                      <span className="flex items-center"><DollarSign className="w-4 h-4 mr-1 text-gray-400" /> {job.salary}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-black text-green-600">{job.score}%</p>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">AI Match</p>
                  </div>
                  <button className="bg-gray-900 text-white px-5 py-2 rounded-lg font-medium hover:bg-green-600 transition-all shadow-sm">
                    View & Apply
                  </button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> Posted {job.time}</span>
                <span className="uppercase bg-gray-100 px-2 py-0.5 rounded">Full Time</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
