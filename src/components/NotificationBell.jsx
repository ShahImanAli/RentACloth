import React, { useState, useEffect } from "react";
import { getUserInAppNotifications } from "../services/rentalNotificationService";
import { useAuth } from "../context/AuthContext";
import NotificationsPanel from "./NotificationsPanel";

const NotificationBell = () => {
  const { user } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotificationCount();
      // Check for new notifications every 5 minutes
      const interval = setInterval(loadNotificationCount, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotificationCount = async () => {
    if (!user) return;

    try {
      const result = await getUserInAppNotifications(user.uid);
      if (result.success) {
        const count = result.notifications?.length || 0;
        const hasNew = count > notificationCount && notificationCount > 0;

        setNotificationCount(count);
        if (hasNew) {
          setHasNewNotifications(true);
          // Auto-clear the "new" indicator after 3 seconds
          setTimeout(() => setHasNewNotifications(false), 3000);
        }
      }
    } catch (error) {
      console.error("Error loading notification count:", error);
    }
  };

  const handleBellClick = () => {
    setShowPanel(true);
    setHasNewNotifications(false);
  };

  const handleNotificationCountUpdate = (count) => {
    setNotificationCount(count);
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={handleBellClick}
        className={`relative p-2 rounded-full transition-all duration-200 ${
          notificationCount > 0
            ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
            : "text-gray-600 hover:text-gray-700 hover:bg-gray-100"
        } ${hasNewNotifications ? "animate-bounce" : ""}`}
        title={`${notificationCount} notification${
          notificationCount !== 1 ? "s" : ""
        }`}
      >
        {/* Bell Icon */}
        <svg
          className={`w-6 h-6 ${hasNewNotifications ? "animate-pulse" : ""}`}
          fill={notificationCount > 0 ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={notificationCount > 0 ? 0 : 2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Notification Badge */}
        {notificationCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 ${
              hasNewNotifications
                ? "bg-red-500 animate-pulse"
                : notificationCount >= 5
                ? "bg-red-500"
                : "bg-orange-500"
            } text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]`}
          >
            {notificationCount > 9 ? "9+" : notificationCount}
          </span>
        )}

        {/* Pulse animation for new notifications */}
        {hasNewNotifications && (
          <span className="absolute -top-1 -right-1 bg-red-500 rounded-full h-5 w-5 animate-ping"></span>
        )}
      </button>

      {/* Notifications Panel positioned as dropdown */}
      <NotificationsPanel
        isOpen={showPanel}
        onClose={() => setShowPanel(false)}
        onNotificationCount={handleNotificationCountUpdate}
      />
    </div>
  );
};

export default NotificationBell;
