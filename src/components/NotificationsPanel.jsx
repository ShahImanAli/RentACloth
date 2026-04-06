import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  getUserInAppNotifications,
  acknowledgeNotification,
} from "../services/rentalNotificationService";
import { useAuth } from "../context/AuthContext";

const NotificationsPanel = ({ isOpen, onClose, onNotificationCount }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadNotifications();
    }
  }, [isOpen, user]);

  useEffect(() => {
    // Update parent component with notification count
    if (onNotificationCount) {
      onNotificationCount(notifications.length);
    }
  }, [notifications.length, onNotificationCount]);

  const loadNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await getUserInAppNotifications(user.uid);
      if (result.success) {
        setNotifications(result.notifications || []);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (notificationId) => {
    try {
      const result = await acknowledgeNotification(notificationId);
      if (result.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      }
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  const dismissAll = async () => {
    const promises = notifications.map((notif) =>
      acknowledgeNotification(notif.id)
    );
    try {
      await Promise.all(promises);
      setNotifications([]);
    } catch (error) {
      console.error("Error dismissing all notifications:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "overdue_reminder":
        return "🚨";
      case "due_today_reminder":
        return "⏰";
      case "due_soon_reminder":
        return "📅";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "overdue_reminder":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          text: "text-red-800",
          badge: "bg-red-500",
        };
      case "due_today_reminder":
        return {
          bg: "bg-orange-50",
          border: "border-orange-200",
          text: "text-orange-800",
          badge: "bg-orange-500",
        };
      case "due_soon_reminder":
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-800",
          badge: "bg-blue-500",
        };
      default:
        return {
          bg: "bg-gray-50",
          border: "border-gray-200",
          text: "text-gray-800",
          badge: "bg-gray-500",
        };
    }
  };

  const getNotificationTitle = (type) => {
    switch (type) {
      case "overdue_reminder":
        return "Item Overdue";
      case "due_today_reminder":
        return "Due Today";
      case "due_soon_reminder":
        return "Due Soon";
      default:
        return "Notification";
    }
  };

  if (!isOpen) return null;

  const panelContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-transparent"
        style={{ zIndex: 999999 }}
        onClick={onClose}
      ></div>

      {/* Dropdown Panel */}
      <div
        className="fixed top-20 right-4 w-96 max-w-sm bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden"
        style={{
          zIndex: 1000000,
          isolation: "isolate",
          position: "fixed",
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">🔔 Notifications</h2>
              <p className="text-indigo-100 text-xs mt-1">
                {notifications.length} active reminder
                {notifications.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {notifications.length > 0 && (
            <button
              onClick={dismissAll}
              className="mt-2 text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded-full transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-3 max-h-80">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-sm text-gray-600">Loading...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">
                All caught up!
              </h3>
              <p className="text-xs text-gray-600">No pending reminders</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const colors = getNotificationColor(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={`${colors.bg} ${colors.border} border rounded-lg p-3 transition-all duration-200 hover:shadow-sm`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div
                          className={`${colors.badge} w-8 h-8 rounded-full flex items-center justify-center text-white text-sm`}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>

                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4
                              className={`font-semibold ${colors.text} text-xs`}
                            >
                              {getNotificationTitle(notification.type)}
                            </h4>
                            <p
                              className={`${colors.text} text-xs mt-1 opacity-90 line-clamp-2`}
                            >
                              {notification.message}
                            </p>

                            {notification.itemName && (
                              <div className="mt-1 text-xs text-gray-600 truncate">
                                <span className="font-medium">Item:</span>{" "}
                                {notification.itemName}
                              </div>
                            )}

                            <div className="text-xs text-gray-500 mt-1">
                              {notification.createdAt
                                ? new Date(
                                    notification.createdAt
                                  ).toLocaleDateString()
                                : "Today"}
                            </div>
                          </div>

                          <button
                            onClick={() => handleDismiss(notification.id)}
                            className="ml-2 p-1 hover:bg-gray-200 hover:bg-opacity-50 rounded-full transition-colors text-gray-400 hover:text-gray-600 flex-shrink-0"
                            title="Dismiss"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t bg-gray-50 p-3">
            <div className="text-center">
              <p className="text-xs text-gray-500">
                💡 Reminders based on return dates
              </p>
              <button
                onClick={loadNotifications}
                className="mt-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  // Render the panel using a portal to ensure it's at the document body level
  return createPortal(panelContent, document.body);
};

export default NotificationsPanel;
