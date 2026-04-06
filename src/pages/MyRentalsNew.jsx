import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserRentals, requestItemReturn } from "../firebase/rentalsNew";
import {
  getUserInAppNotifications,
  acknowledgeNotification,
} from "../services/rentalNotificationService";
import { runReminderScheduler } from "../services/reminderService";
import {
  checkAndUpdateOverdueStatus,
  getRentalWithPenalty,
} from "../services/penaltyService";
import PenaltyPaymentModal from "../components/PenaltyPaymentModal";

const MyRentals = () => {
  const { user } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("ongoing"); // ongoing, past
  const [markingReturn, setMarkingReturn] = useState({});
  const [reminders, setReminders] = useState([]);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [selectedPenaltyRental, setSelectedPenaltyRental] = useState(null);

  useEffect(() => {
    if (user) {
      loadUserRentals();
      // Run reminder scheduler first to create any missing notifications
      runReminderScheduler()
        .then(() => {
          // Then load reminders after scheduler has run
          setTimeout(() => {
            loadUserReminders();
          }, 1000);
        })
        .catch(console.error);
    }
  }, [user]);

  const loadUserRentals = async () => {
    try {
      setLoading(true);
      console.log("Loading rentals for user:", user.uid);

      const result = await getUserRentals(user.uid);

      if (result.success) {
        console.log("Rentals loaded:", result.rentals);

        // Check and update overdue status for each rental
        const rentalsWithPenalty = await Promise.all(
          result.rentals.map(async (rental) => {
            // Check if rental might be overdue
            const now = new Date();
            const endDate = new Date(rental.endDateTime);

            if (
              now > endDate &&
              (rental.status === "ongoing" ||
                rental.status === "active" ||
                rental.status === "due_soon" ||
                rental.status === "dueToday")
            ) {
              const overdueResult = await checkAndUpdateOverdueStatus(
                rental.id
              );
              return overdueResult.success ? overdueResult.rental : rental;
            }

            // Get updated penalty info for already overdue rentals
            if (rental.status === "overdue") {
              const penaltyResult = await getRentalWithPenalty(rental.id);
              return penaltyResult.success ? penaltyResult.rental : rental;
            }

            return rental;
          })
        );

        setRentals(rentalsWithPenalty);
      } else {
        console.error("Failed to load rentals:", result.error);
        setError(result.error || "Failed to load rentals");
      }
    } catch (err) {
      console.error("Error loading rentals:", err);
      setError("Failed to load rentals");
    } finally {
      setLoading(false);
    }
  };

  const loadUserReminders = async () => {
    if (!user) return;
    try {
      setLoadingReminders(true);
      console.log("Loading reminders for user:", user.uid);
      const result = await getUserInAppNotifications(user.uid);
      if (result.success) {
        console.log("Loaded reminders:", result.notifications);
        setReminders(result.notifications || []);
      } else {
        console.error("Failed to load reminders:", result.error);
      }
    } catch (error) {
      console.error("Error loading reminders:", error);
    } finally {
      setLoadingReminders(false);
    }
  };

  const handleDismissReminder = async (reminderId) => {
    try {
      const result = await acknowledgeNotification(reminderId);
      if (result.success) {
        setReminders((prev) => prev.filter((r) => r.id !== reminderId));
      }
    } catch (error) {
      console.error("Error dismissing reminder:", error);
    }
  };

  const dismissAllReminders = async () => {
    try {
      const promises = reminders.map((reminder) =>
        acknowledgeNotification(reminder.id)
      );
      await Promise.all(promises);
      setReminders([]);
    } catch (error) {
      console.error("Error dismissing all reminders:", error);
    }
  };

  const handleMarkReturn = async (rentalId) => {
    try {
      setMarkingReturn((prev) => ({ ...prev, [rentalId]: true }));

      const result = await requestItemReturn(rentalId, user.uid);

      if (result.success) {
        // Refresh rentals and reminders
        await Promise.all([loadUserRentals(), loadUserReminders()]);
        alert(result.message);
      } else {
        alert(result.error || "Failed to request return");
      }
    } catch (err) {
      console.error("Error requesting return:", err);
      alert("Failed to request return");
    } finally {
      setMarkingReturn((prev) => ({ ...prev, [rentalId]: false }));
    }
  };

  const handlePayPenalty = (rental) => {
    setSelectedPenaltyRental(rental);
    setShowPenaltyModal(true);
  };

  const handlePenaltyPaymentSuccess = async (result) => {
    console.log("Penalty payment successful:", result);
    alert(result.message);
    // Refresh rentals to show updated status
    await loadUserRentals();
    await loadUserReminders();
    setShowPenaltyModal(false);
    setSelectedPenaltyRental(null);
  };

  const handleViewDetails = (rental) => {
    setSelectedRental(rental);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedRental(null);
  };

  const getStatusInfo = (rental) => {
    const now = new Date();
    const endDate = rental.endDateTime
      ? new Date(rental.endDateTime)
      : new Date();
    const startDate = rental.startDateTime
      ? new Date(rental.startDateTime)
      : new Date();

    switch (rental.status) {
      case "ongoing":
        if (now > endDate) {
          return {
            status: "Overdue",
            color: "bg-gray-800 text-white",
            urgency: "high",
            reminderText: `Overdue by ${Math.ceil(
              (now - endDate) / (1000 * 60 * 60 * 24)
            )} day(s)`,
          };
        } else if (now.getTime() > endDate.getTime() - 24 * 60 * 60 * 1000) {
          return {
            status: "Due Soon",
            color: "bg-gray-600 text-white",
            urgency: "medium",
            reminderText: `Return in ${Math.ceil(
              (endDate - now) / (1000 * 60 * 60 * 24)
            )} day(s)`,
          };
        } else if (now >= startDate) {
          return {
            status: "Active",
            color: "bg-gray-500 text-white",
            urgency: "low",
            reminderText: `${Math.ceil(
              (endDate - now) / (1000 * 60 * 60 * 24)
            )} day(s) remaining`,
          };
        } else {
          return {
            status: "Upcoming",
            color: "bg-gray-400 text-white",
            urgency: "low",
            reminderText: `Starts in ${Math.ceil(
              (startDate - now) / (1000 * 60 * 60 * 24)
            )} day(s)`,
          };
        }
      case "return_requested":
        return {
          status: "Return Pending",
          color: "bg-gray-600 text-white",
          urgency: "medium",
          reminderText: "Awaiting confirmation",
        };
      case "completed":
        return {
          status: "Completed",
          color: "bg-gray-300 text-gray-800",
          urgency: "none",
          reminderText: "Rental completed",
        };
      case "cancelled":
        return {
          status: "Cancelled",
          color: "bg-gray-400 text-white",
          urgency: "none",
          reminderText: "Rental cancelled",
        };
      case "due_soon":
        return {
          status: "Due Soon",
          color: "bg-gray-600 text-white",
          urgency: "medium",
          reminderText: "Return soon",
        };
      case "dueToday":
        return {
          status: "Due Today",
          color: "bg-gray-700 text-white",
          urgency: "medium",
          reminderText: "Return today",
        };
      case "overdue":
        return {
          status: "Overdue",
          color: "bg-gray-800 text-white",
          urgency: "high",
          reminderText: "Overdue - return now",
        };
      default:
        return {
          status: rental.status || "Unknown",
          color: "bg-gray-400 text-white",
          urgency: "none",
          reminderText: "Status unknown",
        };
    }
  };

  // Helper function to determine if Mark Return button should be shown
  const shouldShowMarkReturnButton = (rental) => {
    const statusInfo = getStatusInfo(rental);

    // Don't show for return_requested status
    if (rental.status === "return_requested") {
      return false;
    }

    // Don't show for upcoming rentals
    if (statusInfo.status === "Upcoming") {
      return false;
    }

    // Show for these specific statuses (including dueToday)
    const allowedStatuses = ["ongoing", "due_soon", "dueToday", "overdue"];
    if (allowedStatuses.includes(rental.status)) {
      return true;
    }

    // Show for ongoing rentals that are active, due soon, or overdue
    if (rental.status === "ongoing") {
      const activeStatuses = ["Active", "Due Soon", "Overdue"];
      return activeStatuses.includes(statusInfo.status);
    }

    return false;
  };

  const filterRentals = (type) => {
    if (type === "ongoing") {
      return rentals.filter(
        (rental) =>
          rental.status === "ongoing" ||
          rental.status === "return_requested" ||
          rental.status === "due_soon" ||
          rental.status === "dueToday" ||
          rental.status === "overdue"
      );
    } else {
      return rentals.filter(
        (rental) =>
          rental.status === "completed" || rental.status === "cancelled"
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid Date";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading your rentals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white py-16 sm:py-20 md:py-24 lg:py-28 px-4 text-center">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 md:mb-8 tracking-tight leading-tight">
            My Rentals
          </h1>
          <p className="text-gray-300 font-medium text-base sm:text-lg">
            Track your ongoing and past rentals easily
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:py-8 lg:py-12 px-4">
        {error && (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-6">
            <p className="text-gray-800 font-medium">{error}</p>
            <button
              onClick={loadUserRentals}
              className="mt-2 text-black hover:text-gray-700 underline font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Notifications Section - Always show */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            {/* Notifications Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-black rounded-lg">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-5 5v-5zM4 7h16l-7 10H4V7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-black">
                      Notifications
                    </h3>
                    <p className="text-sm text-gray-600">
                      {reminders.length || 0}{" "}
                      {reminders.length === 1
                        ? "notification"
                        : "notifications"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      runReminderScheduler().then(() => {
                        setTimeout(() => {
                          loadUserReminders();
                        }, 500);
                      });
                    }}
                    disabled={loadingReminders}
                    className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    title="Refresh notifications"
                  >
                    {loadingReminders ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                    ) : (
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
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    )}
                  </button>
                  {reminders.length > 1 && (
                    <button
                      onClick={dismissAllReminders}
                      className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 border border-gray-300"
                    >
                      <span className="hidden sm:inline">Dismiss All</span>
                      <span className="sm:hidden">All</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowReminders(!showReminders)}
                    className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <svg
                      className={`w-5 h-5 transform transition-transform duration-200 ${
                        showReminders ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications Content */}
            {showReminders && (
              <div className="p-4 sm:p-6">
                {reminders.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-5 5v-5zM4 7h16l-7 10H4V7z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No notifications
                    </h3>
                    <p className="text-gray-500 text-sm">
                      You're all caught up! We'll notify you of any important
                      updates.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {reminders.map((reminder) => {
                      // Determine notification urgency and styling
                      const isHighPriority = reminder.priority === "high";
                      const isOverdue = reminder.type === "overdue_reminder";
                      const isDueToday = reminder.type === "due_today_reminder";

                      return (
                        <div
                          key={reminder.id}
                          className={`flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                            isHighPriority
                              ? "bg-gray-100 border-gray-800"
                              : isDueToday
                              ? "bg-gray-50 border-gray-600"
                              : "bg-gray-50 border-gray-400"
                          }`}
                        >
                          {/* Notification Icon */}
                          <div
                            className={`flex-shrink-0 p-2 rounded-lg ${
                              isHighPriority
                                ? "bg-black text-white"
                                : isDueToday
                                ? "bg-gray-700 text-white"
                                : "bg-gray-500 text-white"
                            }`}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 17h5l-5 5v-5zM4 7h16l-7 10H4V7z"
                              />
                            </svg>
                          </div>

                          {/* Notification Content */}
                          <div className="flex-grow min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                              <div className="flex-grow">
                                {/* Priority Badge and Timestamp - Mobile Responsive */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                  <span
                                    className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold w-fit ${
                                      isHighPriority
                                        ? "bg-black text-white"
                                        : isDueToday
                                        ? "bg-gray-700 text-white"
                                        : "bg-gray-500 text-white"
                                    }`}
                                  >
                                    {isHighPriority
                                      ? "OVERDUE"
                                      : isDueToday
                                      ? "DUE TODAY"
                                      : "REMINDER"}
                                  </span>
                                  {reminder.createdAt && (
                                    <span className="text-xs text-gray-500">
                                      {new Date(
                                        reminder.createdAt
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  )}
                                </div>

                                {/* Main Message */}
                                <p className="text-sm sm:text-base font-medium text-black leading-relaxed">
                                  {reminder.message}
                                </p>
                              </div>

                              {/* Dismiss Button */}
                              <button
                                onClick={() =>
                                  handleDismissReminder(reminder.id)
                                }
                                className="flex-shrink-0 p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors duration-200 self-start"
                                title="Dismiss notification"
                              >
                                <svg
                                  className="w-4 h-4"
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
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-center border-b border-gray-200">
            <button
              onClick={() => setActiveTab("ongoing")}
              className={`px-4 sm:px-6 py-3 font-semibold text-sm sm:text-base lg:text-lg transition-colors duration-200 border-b-2 ${
                activeTab === "ongoing"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Active Rentals ({filterRentals("ongoing").length})
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`px-4 sm:px-6 py-3 font-semibold text-sm sm:text-base lg:text-lg transition-colors duration-200 border-b-2 ${
                activeTab === "past"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Past Rentals ({filterRentals("past").length})
            </button>
          </div>
        </div>

        {/* Rentals List */}
        <div className="space-y-3 sm:space-y-4">
          {filterRentals(activeTab).length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white rounded-xl border border-gray-200 p-12 max-w-md mx-auto">
                <div className="mb-6">
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">
                  {activeTab === "ongoing"
                    ? "No Active Rentals"
                    : "No Past Rentals"}
                </h2>
                <p className="text-gray-600 mb-8 text-sm">
                  {activeTab === "ongoing"
                    ? "You don't have any active rentals at the moment."
                    : "You haven't completed any rentals yet."}
                </p>
                <a
                  href="/productList"
                  className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200"
                >
                  Browse Items
                </a>
              </div>
            </div>
          ) : (
            filterRentals(activeTab).map((rental) => {
              const statusInfo = getStatusInfo(rental);

              return (
                <div
                  key={rental.id}
                  className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  <div className="p-4 sm:p-6 lg:p-8">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8">
                      {/* Product Image */}
                      <div className="flex-shrink-0 self-center sm:self-start">
                        <img
                          src={
                            rental.itemImage ||
                            rental.image ||
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQwIiBoZWlnaHQ9IjE0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=="
                          }
                          alt={rental.itemName || rental.title || "Rental Item"}
                          className="w-24 h-24 sm:w-28 sm:h-28 lg:w-36 lg:h-36 object-cover rounded-xl bg-gray-100 border border-gray-100"
                          onError={(e) => {
                            e.target.src =
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQwIiBoZWlnaHQ9IjE0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yPC90ZXh0Pjwvc3ZnPg==";
                          }}
                        />
                      </div>

                      {/* Rental Details */}
                      <div className="flex-grow">
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                          <div className="flex-grow lg:pr-4">
                            {/* Status Badge and Title */}
                            <div className="flex items-center gap-3 mb-3">
                              <span
                                className={`inline-flex items-center px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold ${statusInfo.color}`}
                              >
                                {statusInfo.status}
                              </span>
                            </div>

                            {/* Product Info */}
                            <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">
                              {rental.itemName ||
                                rental.title ||
                                "Untitled Item"}
                            </h3>

                            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                              {rental.category || "Uncategorized"}
                              {rental.selectedSize &&
                                rental.selectedSize !== "N/A" &&
                                ` • Size ${rental.selectedSize}`}
                              {rental.selectedColor &&
                                rental.selectedColor !== "N/A" &&
                                ` • ${rental.selectedColor}`}
                            </p>

                            {/* Reminder Info */}
                            <div className="mb-3 sm:mb-4">
                              <p className="text-sm sm:text-base font-medium text-gray-800">
                                {statusInfo.reminderText}
                              </p>
                            </div>

                            {/* Overdue Penalty Info */}
                            {rental.status === "overdue" &&
                              rental.penaltyAmount &&
                              !rental.penaltyPaid && (
                                <div className="mb-3 sm:mb-4 bg-gray-50 border border-gray-300 rounded-lg p-3 sm:p-4">
                                  <div className="flex-1">
                                    <p className="text-sm font-bold text-black mb-1">
                                      Overdue by {rental.overdueDays} day
                                      {rental.overdueDays !== 1 ? "s" : ""}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-700">
                                      Penalty:{" "}
                                      <span className="font-bold text-base text-black">
                                        ${rental.penaltyAmount.toFixed(2)}
                                      </span>{" "}
                                      <span className="text-gray-600">
                                        (5% per day)
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              )}

                            {/* Rental Dates */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 lg:gap-8 text-sm sm:text-base text-gray-600">
                              <div className="flex justify-between sm:block">
                                <span className="font-medium">Start:</span>
                                <span className="ml-1 sm:ml-2">
                                  {formatDate(rental.startDateTime)}
                                </span>
                              </div>
                              <div className="flex justify-between sm:block">
                                <span className="font-medium">End:</span>
                                <span className="ml-1 sm:ml-2">
                                  {formatDate(rental.endDateTime)}
                                </span>
                              </div>
                              <div className="flex justify-between sm:block">
                                <span className="font-medium">Amount:</span>
                                <span className="ml-1 sm:ml-2 font-bold text-base sm:text-lg text-black">
                                  $
                                  {(
                                    rental.amountPaid ||
                                    rental.totalAmount ||
                                    0
                                  ).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-row sm:flex-col gap-3 lg:gap-4 w-full sm:w-[160px] lg:w-[200px] mt-4 lg:mt-0">
                            {/* Pay Penalty Button for Overdue Items */}
                            {activeTab === "ongoing" &&
                              rental.status === "overdue" &&
                              rental.penaltyAmount &&
                              !rental.penaltyPaid && (
                                <button
                                  onClick={() => handlePayPenalty(rental)}
                                  className="flex-1 sm:w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 text-sm sm:text-base font-semibold"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                  </svg>
                                  Pay Penalty & Return
                                </button>
                              )}

                            {/* Regular Return Button */}
                            {activeTab === "ongoing" &&
                              shouldShowMarkReturnButton(rental) &&
                              rental.status !== "overdue" && (
                                <button
                                  onClick={() => handleMarkReturn(rental.id)}
                                  disabled={markingReturn[rental.id]}
                                  className="flex-1 sm:w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {markingReturn[rental.id] ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                      Return Now
                                    </>
                                  )}
                                </button>
                              )}

                            {rental.status === "return_requested" && (
                              <div className="w-full flex items-center justify-center px-3 py-3 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold whitespace-nowrap">
                                Awaiting Confirmation
                              </div>
                            )}

                            <button
                              onClick={() => handleViewDetails(rental)}
                              className="flex-1 sm:w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors duration-200 text-sm sm:text-base font-semibold"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRental && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-black">
                  Rental Details
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Complete information about your rental
                </p>
              </div>
              <button
                onClick={closeDetailsModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-black"
              >
                <svg
                  className="w-6 h-6"
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

            {/* Modal Content */}
            <div className="p-8">
              {/* Item Image and Basic Info */}
              <div className="flex gap-8 mb-8">
                <div className="flex-shrink-0">
                  <img
                    src={
                      selectedRental.itemImage ||
                      selectedRental.image ||
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=="
                    }
                    alt={selectedRental.itemName || "Rental Item"}
                    className="w-40 h-40 object-cover rounded-2xl bg-gray-100 shadow-sm border border-gray-200"
                  />
                </div>
                <div className="flex-1">
                  <div className="mb-4">
                    <span
                      className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                        getStatusInfo(selectedRental).color
                      }`}
                    >
                      {getStatusInfo(selectedRental).status}
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-black mb-3">
                    {selectedRental.itemName ||
                      selectedRental.title ||
                      "Untitled Item"}
                  </h3>
                  <p className="text-lg text-gray-600 mb-4">
                    {selectedRental.category || "Uncategorized"}
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    {selectedRental.selectedSize &&
                      selectedRental.selectedSize !== "N/A" && (
                        <span className="bg-gray-100 text-black px-4 py-2 rounded-lg font-medium">
                          Size: {selectedRental.selectedSize}
                        </span>
                      )}
                    {selectedRental.selectedColor &&
                      selectedRental.selectedColor !== "N/A" && (
                        <span className="bg-gray-100 text-black px-4 py-2 rounded-lg font-medium">
                          Color: {selectedRental.selectedColor}
                        </span>
                      )}
                  </div>
                  <div className="mt-4">
                    <p className="text-gray-700 font-medium">
                      {getStatusInfo(selectedRental).reminderText}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rental Period Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Rental Timeline */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h4 className="font-bold text-black mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Rental Timeline
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        Start Date
                      </span>
                      <p className="text-black font-semibold">
                        {formatDateTime(selectedRental.startDateTime)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        End Date
                      </span>
                      <p className="text-black font-semibold">
                        {formatDateTime(selectedRental.endDateTime)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        Duration
                      </span>
                      <p className="text-black font-semibold">
                        {selectedRental.duration || "N/A"}{" "}
                        {selectedRental.unit || ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h4 className="font-bold text-black mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                    Payment Details
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        Amount Paid
                      </span>
                      <p className="text-2xl font-bold text-black">
                        $
                        {(
                          selectedRental.amountPaid ||
                          selectedRental.totalAmount ||
                          0
                        ).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        Payment Status
                      </span>
                      <p className="text-black font-semibold">✓ Completed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Return Request Information */}
              {selectedRental.status === "return_requested" && (
                <div className="mb-6">
                  <div className="bg-gray-50 border border-gray-300 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-gray-600 rounded-full p-3">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-bold text-black mb-3 text-lg">
                          Return Request Submitted
                        </h5>
                        <div className="space-y-3">
                          <p className="text-gray-700">
                            <span className="font-semibold">Requested on:</span>{" "}
                            {formatDateTime(selectedRental.returnRequestedAt)}
                          </p>
                          <p className="text-gray-600 leading-relaxed">
                            Your return request has been submitted successfully.
                            Our team will review and process it within 24 hours.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Information for Other Statuses */}
              {selectedRental.returnRequestedAt &&
                selectedRental.status !== "return_requested" && (
                  <div className="mb-6">
                    <div className="bg-gray-50 border border-gray-300 rounded-xl p-6">
                      <h4 className="font-bold text-black mb-3">
                        Return History
                      </h4>
                      <p className="text-gray-700">
                        <span className="font-semibold">
                          Previously returned on:
                        </span>{" "}
                        {formatDateTime(selectedRental.returnRequestedAt)}
                      </p>
                      <p className="text-gray-600 text-sm mt-2">
                        This item was successfully returned and processed
                      </p>
                    </div>
                  </div>
                )}

              {/* Rental ID */}
              <div className="bg-gray-100 rounded-xl p-4 border border-gray-300">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-black">Rental ID:</span>{" "}
                  <span className="font-mono text-black">
                    {selectedRental.id}
                  </span>
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Reference this ID for customer support inquiries
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Penalty Payment Modal */}
      {showPenaltyModal && selectedPenaltyRental && (
        <PenaltyPaymentModal
          rental={selectedPenaltyRental}
          isOpen={showPenaltyModal}
          onClose={() => {
            setShowPenaltyModal(false);
            setSelectedPenaltyRental(null);
          }}
          onSuccess={handlePenaltyPaymentSuccess}
        />
      )}
    </div>
  );
};

export default MyRentals;
