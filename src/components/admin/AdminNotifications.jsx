import { useState, useEffect } from "react";
import { getNotificationStatistics } from "../../services/rentalNotificationService";

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, high, medium, normal

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const result = await getNotificationStatistics();
      if (result.success) {
        // Use recent notifications from the statistics
        setNotifications(result.stats.recentNotifications || []);
      }
    } catch (error) {
      console.error("Error loading admin notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredNotifications = () => {
    if (filter === "all") return notifications;
    return notifications.filter(
      (n) =>
        n.priority === filter ||
        n.status === filter ||
        (filter === "high" && n.type === "overdue_reminder") ||
        (filter === "medium" &&
          (n.type === "due_today_reminder" ||
            n.type === "due_soon_reminder")) ||
        (filter === "normal" &&
          (n.type === "booking_confirmation" ||
            n.type === "booking_completion"))
    );
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      high: "bg-red-100 text-red-800 border-red-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      normal: "bg-gray-100 text-gray-800 border-gray-200",
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
          styles[priority] || styles.normal
        }`}
      >
        {priority || "normal"}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const styles = {
      sent: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      failed: "bg-red-100 text-red-800 border-red-200",
      acknowledged: "bg-gray-100 text-gray-800 border-gray-200",
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
          styles[status] || styles.pending
        }`}
      >
        {status || "pending"}
      </span>
    );
  };

  const getNotificationIcon = (type) => {
    const icons = {
      booking_confirmation: "🎉",
      booking_completion: "✅",
      due_soon_reminder: "📅",
      due_today_reminder: "⏰",
      overdue_reminder: "⚠️",
      RENTAL_BOOKED: "🎉",
      RETURN_REQUESTED: "📦",
      ITEM_OVERDUE: "⚠️",
      PAYMENT_RECEIVED: "💰",
      NEW_USER: "👤",
      SYSTEM_ALERT: "🔔",
    };

    return icons[type] || "📢";
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-center mt-4 text-gray-600">
          Loading notifications...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Notifications
        </h1>
        <p className="text-gray-600">
          Stay updated with rental activity and system alerts
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">
            Filter by priority:
          </label>
          <div className="flex space-x-2">
            {["all", "high", "medium", "normal"].map((priority) => (
              <button
                key={priority}
                onClick={() => setFilter(priority)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === priority
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={loadNotifications}
            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {getFilteredNotifications().length > 0 ? (
          getFilteredNotifications().map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow-sm border-l-4 p-6 hover:shadow-md transition-shadow ${
                notification.priority === "high"
                  ? "border-red-400"
                  : notification.priority === "medium"
                  ? "border-yellow-400"
                  : "border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {notification.type?.replace(/_/g, " ") ||
                          "Notification"}
                      </h3>
                      {getPriorityBadge(notification.priority)}
                      {getStatusBadge(notification.status)}
                    </div>
                    <p className="text-gray-700 mb-2">{notification.message}</p>

                    {/* Additional data display for new notification structure */}
                    <div className="bg-gray-50 rounded-lg p-3 mt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Details:
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {notification.bookingId && (
                          <div>
                            <span className="font-medium">Booking ID:</span>{" "}
                            {notification.bookingId}
                          </div>
                        )}
                        {notification.itemName && (
                          <div>
                            <span className="font-medium">Item:</span>{" "}
                            {notification.itemName}
                          </div>
                        )}
                        {notification.userName && (
                          <div>
                            <span className="font-medium">User:</span>{" "}
                            {notification.userName}
                          </div>
                        )}
                        {notification.userEmail && (
                          <div>
                            <span className="font-medium">Email:</span>{" "}
                            {notification.userEmail}
                          </div>
                        )}
                        {notification.totalAmount && (
                          <div>
                            <span className="font-medium">Amount:</span> $
                            {notification.totalAmount}
                          </div>
                        )}
                        {notification.endDate && (
                          <div>
                            <span className="font-medium">End Date:</span>{" "}
                            {new Date(
                              notification.endDate
                            ).toLocaleDateString()}
                          </div>
                        )}
                        {notification.isEmailNotification !== undefined && (
                          <div>
                            <span className="font-medium">Email:</span>{" "}
                            {notification.isEmailNotification ? "Yes" : "No"}
                          </div>
                        )}
                        {notification.isInAppNotification !== undefined && (
                          <div>
                            <span className="font-medium">In-App:</span>{" "}
                            {notification.isInAppNotification ? "Yes" : "No"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {formatTimeAgo(notification.createdAt)}
                  </p>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 ml-auto"></div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              {(notification.type === "booking_confirmation" ||
                notification.type === "booking_completion") && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200">
                      View Booking
                    </button>
                    <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200">
                      Contact User
                    </button>
                  </div>
                </div>
              )}

              {notification.type === "overdue_reminder" && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200">
                      Send Reminder
                    </button>
                    <button className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200">
                      View Booking
                    </button>
                  </div>
                </div>
              )}

              {/* Legacy quick actions for backward compatibility */}
              {notification.type === "RETURN_REQUESTED" && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200">
                      View Rental
                    </button>
                    <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200">
                      Contact User
                    </button>
                  </div>
                </div>
              )}

              {notification.type === "ITEM_OVERDUE" && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200">
                      Send Reminder
                    </button>
                    <button className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200">
                      View Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No notifications
            </h3>
            <p className="text-gray-500">
              {filter === "all"
                ? "You're all caught up! No new notifications."
                : `No ${filter} priority notifications found.`}
            </p>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {notifications.length > 0 && (
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Total: {notifications.length} notifications</span>
            <span>Showing: {getFilteredNotifications().length} filtered</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
