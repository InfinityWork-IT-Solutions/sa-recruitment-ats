// frontend/src/components/CompanySidebar.tsx
import { 
  Home, Briefcase, FileText, Users, Settings, LogOut,
  Building, DollarSign
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

export default function CompanySidebar({ 
  companyLogo, 
  companyName, 
  companyEmail,
  subscription 
}: CompanySidebarProps) {
  const location = useLocation();
  
  const navigation = [
    { name: 'Company Profile', href: '/company/profile', icon: Building },
    { name: 'Dashboard', href: '/company/dashboard', icon: Home },
    { name: 'Jobs', href: '/company/jobs', icon: Briefcase },
    { name: 'Applications', href: '/company/applications', icon: FileText },
    { name: 'Team', href: '/company/team', icon: Users },
    { name: 'Billing', href: '/company/billing', icon: DollarSign },
  ];
  
  // Get company initials for fallback
  const getInitials = () => {
    const words = companyName.split(' ');
    return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
  };
  
  const isActive = (path: string) => location.pathname === path;
  
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
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
              isActive(item.href)
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
      
      {/* Company Profile Section - Logo appears here! */}
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
          {/* Company Logo - appears in sidebar */}
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
