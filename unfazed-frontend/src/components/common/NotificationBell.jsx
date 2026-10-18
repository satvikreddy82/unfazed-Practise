import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bell, CheckCheck, Calendar, CreditCard, MessageSquare, AlertCircle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const { latestNotification } = useSocket();

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Update when real-time socket notification arrives
  useEffect(() => {
    if (latestNotification) {
      setNotifications((prev) => [latestNotification, ...prev]);
      setUnreadCount((c) => c + 1);
    }
  }, [latestNotification]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {}
  };

  const getIcon = (type) => {
    switch (type) {
      case 'booking':
        return <Calendar className="w-4 h-4 text-primary" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-success" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-accent" />;
      default:
        return <AlertCircle className="w-4 h-4 text-text-muted" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications"
        className="relative p-2 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-text transition-colors shadow-subtle"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-danger rounded-full ring-2 ring-surface shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-surface border border-border rounded-xl shadow-card z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between p-3 border-b border-border bg-surface-elevated/40">
            <div>
              <p className="text-xs font-semibold text-text uppercase tracking-wider">Notifications</p>
              <p className="text-[10px] text-text-muted">{unreadCount} unread</p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-muted">
                No notifications yet.
              </div>
            ) : (
              notifications.slice(0, 15).map((notif) => (
                <div
                  key={notif._id || notif.id}
                  className={`p-3 text-left transition-colors flex items-start gap-2.5 ${
                    notif.isRead ? 'opacity-70 bg-surface' : 'bg-surface-elevated/50'
                  }`}
                >
                  <div className="mt-0.5 shrink-0 p-1 rounded-md bg-surface border border-border shadow-subtle">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text leading-tight">{notif.title}</p>
                    <p className="text-[11px] text-text-muted mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <p className="text-[9px] text-text-muted/80 mt-1">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
