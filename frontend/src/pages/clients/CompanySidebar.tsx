// frontend/src/components/CompanySidebar.tsx
import {
  Home, Briefcase, FileText, Users, Settings, LogOut,
  Building, DollarSign, Calendar, Gift, BarChart2,
  Globe, Mail, LayoutTemplate, UserSquare2, Puzzle,
  Video, Cpu, Link2
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface CompanySidebarProps {
  companyLogo: string | null;
  companyName: string;
  companyEmail: string;
  subscription: {
    plan: string;
    seatsUsed: number;
    seatsTotal: number;
  };
}

const SECTIONS = [
  {
    label: null,
    items: [
      { name: 'Dashboard', href: '/company/dashboard', icon: Home },
      { name: 'Company Profile', href: '/company/profile', icon: Building },
    ],
  },
  {
    label: 'Recruitment',
    items: [
      { name: 'Jobs', href: '/company/jobs', icon: Briefcase },
      { name: 'Templates', href: '/company/templates', icon: LayoutTemplate },
      { name: 'Applications', href: '/company/applications', icon: FileText },
      { name: 'Candidates', href: '/company/candidates', icon: UserSquare2 },
      { name: 'Talent Pool', href: '/company/talent-pool', icon: Users },
      { name: 'Interviews', href: '/company/interviews', icon: Calendar },
      { name: 'Offers', href: '/company/offers', icon: Gift },
    ],
  },
  {
    label: 'AI & Screening',
    items: [
      { name: 'Video Reviews', href: '/company/video-screening', icon: Video },
      { name: 'AI Decision Queue', href: '/company/ai-decisions', icon: Cpu },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { name: 'Analytics', href: '/company/analytics', icon: BarChart2 },
    ],
  },
  {
    label: 'Settings',
    items: [
      { name: 'Integrations', href: '/company/settings/integrations', icon: Link2 },
      { name: 'Career Page', href: '/company/settings/career-page', icon: Globe },
      { name: 'Email Sequences', href: '/company/settings/email-sequences', icon: Mail },
      { name: 'Team', href: '/company/team', icon: Users },
      { name: 'Billing', href: '/company/settings/billing', icon: DollarSign },
      { name: 'Settings', href: '/company/settings', icon: Settings },
    ],
  },
];

export default function CompanySidebar({
  companyLogo,
  companyName,
  companyEmail,
  subscription
}: CompanySidebarProps) {
  const location = useLocation();

  const getInitials = () => {
    const words = companyName.split(' ');
    return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="flex flex-col h-screen w-64 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center space-x-2 px-6 py-4 border-b">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl">R</span>
        </div>
        <span className="text-xl font-bold text-gray-900">RecruitPro</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 overflow-y-auto space-y-4">
        {SECTIONS.map((section, si) => (
          <div key={si}>
            {section.label && (
              <p className="px-4 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50 font-medium'
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        {/* Subscription Info */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 mb-3 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-600 uppercase">{subscription.plan}</span>
            <span className="text-xs text-gray-600">{subscription.seatsUsed}/{subscription.seatsTotal} seats</span>
          </div>
          <div className="w-full bg-white rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ width: `${(subscription.seatsUsed / subscription.seatsTotal) * 100}%` }}
            />
          </div>
        </div>

        {/* Company Info with Logo */}
        <div className="flex items-center space-x-3 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
          {companyLogo ? (
            <img
              src={companyLogo}
              alt={companyName}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
              className="w-10 h-10 rounded-lg object-cover bg-white text-[10px] overflow-hidden"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              {getInitials()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{companyName}</p>
            <p className="text-xs text-gray-500 truncate">{companyEmail}</p>
          </div>
        </div>

        <button className="w-full flex items-center space-x-2 px-4 py-2 mt-2 text-red-600 hover:bg-red-50 rounded-lg transition-all">
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
