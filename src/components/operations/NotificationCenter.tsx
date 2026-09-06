import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  ExternalLink,
  X,
  Filter
} from 'lucide-react';
import { ProjectNotification, NotificationSeverity } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface NotificationCenterProps {
  projectId: string;
  onNavigateToTab?: (tab: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  projectId,
  onNavigateToTab,
}) => {
  const { idToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<ProjectNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!projectId || !idToken) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/notifications`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('[NotificationCenter] Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, idToken]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Polling every 15s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/notifications/mark-all-read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const displayedNotifications = filterUnreadOnly
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const getSeverityBadge = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1">
            <AlertCircle className="w-2.5 h-2.5" />
            <span>CRITICAL</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>WARNING</span>
          </span>
        );
      case 'ACTION_REQUIRED':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            <span>ACTION</span>
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30 flex items-center gap-1">
            <Info className="w-2.5 h-2.5" />
            <span>INFO</span>
          </span>
        );
    }
  };

  const handleNotificationClick = (notification: ProjectNotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    if (!onNavigateToTab) return;

    if (notification.relatedRecordType === 'NCR' || notification.type.includes('NCR')) {
      onNavigateToTab('ncrs');
    } else if (notification.relatedRecordType === 'RFI' || notification.type.includes('RFI')) {
      onNavigateToTab('rfis');
    } else if (notification.relatedRecordType === 'PROJECT_DECISION' || notification.type.includes('PROJECT_DECISION')) {
      onNavigateToTab('decisions');
    } else if (notification.relatedRecordType === 'QA_QC_INSPECTION' || notification.type.includes('QA_QC')) {
      onNavigateToTab('qaqc');
    } else if (notification.relatedRecordType === 'OWNER_DECISION' || notification.type.includes('OWNER')) {
      onNavigateToTab('owner_decision');
    } else if (notification.relatedRecordType === 'MILESTONE' || notification.type.includes('SUBMISSION') || notification.type.includes('TECHNICAL_REVIEW')) {
      onNavigateToTab('milestones');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <button
        id="notification-center-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition flex items-center justify-center"
        aria-label="Project Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-[#0c1624] shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          id="notification-center-dropdown"
          className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-[#0e1a2b] border border-slate-700/80 shadow-2xl z-50 overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Project Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[10px]">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  title="Mark all as read"
                  className="text-xs text-slate-400 hover:text-amber-400 transition flex items-center gap-1 p-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="text-[10px]">All read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/80 flex items-center justify-between text-xs">
            <button
              onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg font-medium transition text-[11px] ${
                filterUnreadOnly
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>{filterUnreadOnly ? 'Showing Unread' : 'Showing All'}</span>
            </button>
            <span className="text-[10px] text-slate-400">
              {displayedNotifications.length} items
            </span>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : displayedNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  {filterUnreadOnly ? 'No unread notifications' : 'No notifications yet'}
                </p>
              </div>
            ) : (
              displayedNotifications.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 transition cursor-pointer hover:bg-white/5 flex items-start justify-between gap-3 ${
                    !item.isRead ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getSeverityBadge(item.severity)}
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {!item.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      )}
                    </div>
                    <p className={`text-xs font-semibold leading-snug ${!item.isRead ? 'text-white' : 'text-slate-300'}`}>
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                  </div>

                  {!item.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(item.id);
                      }}
                      title="Mark as read"
                      className="text-slate-500 hover:text-amber-400 p-1 shrink-0 rounded hover:bg-white/5 transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-900/80 border-t border-slate-800 text-center text-[10px] text-slate-400">
            Scoped to your assigned project authority
          </div>
        </div>
      )}
    </div>
  );
};
