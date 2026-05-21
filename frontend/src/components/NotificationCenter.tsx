
import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Trash2, Info, CheckCircle, AlertTriangle, AlertCircle, Briefcase, CreditCard } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/lib/api-client';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

interface MockStatus {
  is_read: boolean;
  deleted: boolean;
}

type MockStatusMap = Record<string, MockStatus>;

// Helper to get mock notifications with dynamic created_at dates relative to current time
const getMockNotifications = () => [
  {
    id: 'mock_new_company',
    title: 'New company registered',
    message: 'A new company account has registered and is pending approval.',
    type: 'success',
    link: '/admin/companies',
    created_at: new Date(Date.now() - 2 * 60000).toISOString(),
  },
  {
    id: 'mock_payment_failed',
    title: 'Payment failed for TechCorp',
    message: 'Subscription renewal payment failed. Retrying in 24 hours.',
    type: 'error',
    link: '/settings/billing',
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: 'mock_new_apps',
    title: '12 new applications',
    message: 'New candidates have applied for recent postings.',
    type: 'application',
    link: '/admin/applications',
    created_at: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    id: 'mock_video_pending',
    title: 'Video review pending',
    message: 'A candidate has submitted screening video for review.',
    type: 'warning',
    link: '/company/video-screenings',
    created_at: new Date(Date.now() - 60 * 60000).toISOString(),
  },
  {
    id: 'mock_sub_expiring',
    title: 'Subscription expiring',
    message: 'TechCorp subscription is expiring in 2 hours.',
    type: 'billing',
    link: '/settings/billing',
    created_at: new Date(Date.now() - 120 * 60000).toISOString(),
  }
];

const getMockStatusMap = (): MockStatusMap => {
  try {
    const data = localStorage.getItem('sa_mock_notifications');
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

const saveMockStatusMap = (map: MockStatusMap) => {
  localStorage.setItem('sa_mock_notifications', JSON.stringify(map));
};

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      
      // Fetch backend notifications
      let backendNotifications: Notification[] = [];
      let backendUnread = 0;
      try {
        const response = await apiClient.get('/notifications');
        backendNotifications = response.data.notifications || [];
        backendUnread = response.data.unread_count || 0;
      } catch (err) {
        console.error('Failed to fetch backend notifications:', err);
      }

      // Process mock notifications
      const statusMap = getMockStatusMap();
      const updatedStatusMap = { ...statusMap };
      let mockUnreadCount = 0;
      const visibleMocks: Notification[] = [];

      getMockNotifications().forEach(mock => {
        if (updatedStatusMap[mock.id] === undefined) {
          updatedStatusMap[mock.id] = { is_read: false, deleted: false };
        }
        const state = updatedStatusMap[mock.id];
        if (!state.deleted) {
          visibleMocks.push({
            ...mock,
            is_read: state.is_read
          });
          if (!state.is_read) {
            mockUnreadCount++;
          }
        }
      });
      saveMockStatusMap(updatedStatusMap);

      // Combine both. Mock notifications will be shown first (newest)
      const allNotifications = [...visibleMocks, ...backendNotifications];
      setNotifications(allNotifications);
      setUnreadCount(mockUnreadCount + backendUnread);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    if (id.startsWith('mock_')) {
      const statusMap = getMockStatusMap();
      if (statusMap[id]) {
        statusMap[id].is_read = true;
        saveMockStatusMap(statusMap);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      return;
    }

    try {
      await apiClient.put(`/notifications/${id}`, { is_read: true });
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllRead = async () => {
    // Mark mock ones as read
    const statusMap = getMockStatusMap();
    Object.keys(statusMap).forEach(key => {
      if (!statusMap[key].deleted) {
        statusMap[key].is_read = true;
      }
    });
    saveMockStatusMap(statusMap);

    // Mark backend ones as read
    try {
      await apiClient.post('/notifications/mark-all-read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }

    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = async (id: string) => {
    if (id.startsWith('mock_')) {
      const statusMap = getMockStatusMap();
      if (statusMap[id]) {
        statusMap[id].deleted = true;
        saveMockStatusMap(statusMap);
        const wasUnread = !statusMap[id].is_read;
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
      }
      return;
    }

    try {
      await apiClient.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
      const n = notifications.find(n => n.id === id);
      if (n && !n.is_read) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'application': return <Briefcase className="w-5 h-5 text-blue-500" />;
      case 'billing': return <CreditCard className="w-5 h-5 text-purple-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full shadow-[0_0_8px_rgba(220,38,38,0.5)]">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-bold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading alerts...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">All caught up!</p>
                <p className="text-xs text-gray-400 mt-1">No new notifications at the moment.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50/80 transition-colors cursor-pointer group relative ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3 pr-6">
                      <div className="mt-1 shrink-0">{getIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-bold truncate ${!notification.is_read ? 'text-blue-900' : 'text-gray-900'}`}>
                            {notification.title}
                          </p>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2 mt-0.5 leading-relaxed">
                          {notification.message}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all bg-white rounded-md border border-gray-100 shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {!notification.is_read && (
                      <div className="absolute top-4 left-1.5 w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 text-center bg-gray-50/50">
              <button 
                onClick={() => {
                  setIsOpen(false);
                  navigate('/settings');
                }}
                className="text-xs text-gray-500 hover:text-blue-600 font-semibold"
              >
                View all configurations
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
