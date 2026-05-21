import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
      <Link to="/admin/dashboard" className="flex items-center gap-1 hover:text-gray-900 transition-colors">
        <Home className="w-4 h-4" />
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {item.href ? (
            <Link 
              to={item.href}
              className="hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              {item.icon && <span>{item.icon}</span>}
              <span>{item.label}</span>
            </Link>
          ) : (
            <span className={index === items.length - 1 ? 'text-gray-900 font-semibold' : ''}>
              {item.icon && <span className="inline mr-1">{item.icon}</span>}
              {item.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
