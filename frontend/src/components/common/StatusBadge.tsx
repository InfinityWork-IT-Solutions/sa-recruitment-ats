import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const norm = status?.toLowerCase() || '';

  let colorClass = 'bg-gray-100 text-gray-800 border-gray-200';
  let dotColor = 'bg-gray-400';
  let label = status?.toUpperCase() || 'UNKNOWN';

  if (['active', 'activated', 'approved', 'success'].includes(norm)) {
    colorClass = 'bg-green-50 text-green-700 border-green-200';
    dotColor = 'bg-green-500';
    label = 'ACTIVE';
  } else if (['pending', 'applied', 'new'].includes(norm)) {
    colorClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';
    dotColor = 'bg-yellow-500';
    label = 'PENDING';
  } else if (['closed', 'filled', 'expired', 'rejected', 'blacklisted', 'cancelled', 'failed'].includes(norm)) {
    colorClass = 'bg-red-50 text-red-700 border-red-200';
    dotColor = 'bg-red-500';
    label = norm === 'rejected' ? 'REJECTED' : 'CLOSED';
  } else if (['draft', 'paused', 'passive', 'inactive'].includes(norm)) {
    colorClass = 'bg-gray-50 text-gray-600 border-gray-200';
    dotColor = 'bg-gray-500';
    label = 'DRAFT';
  } else if (['reviewing', 'shortlisted', 'placed', 'interviewing', 'interview'].includes(norm)) {
    colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
    dotColor = 'bg-blue-500';
    label = 'REVIEWING';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider border ${colorClass} ${className}`}>
      <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
      <span>{label}</span>
    </span>
  );
}
