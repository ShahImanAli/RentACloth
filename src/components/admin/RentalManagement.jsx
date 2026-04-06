import { useState, useEffect } from "react";
import {
  getAllRentalBookings,
  updateRentalStatus,
  confirmItemReturn,
  deleteRentalBooking,
  getRentalStatistics,
  BOOKING_STATUS,
} from "../../firebase/rentalsNew";

const RentalBookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statistics, setStatistics] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Actions
  const [actionLoading, setActionLoading] = useState({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load all bookings
      const bookingsResult = await getAllRentalBookings();
      if (bookingsResult.success) {
        setBookings(bookingsResult.bookings);
      } else {
        setError(bookingsResult.error);
      }

      // Load statistics
      const statsResult = await getRentalStatistics();
      if (statsResult.success) {
        setStatistics(statsResult.statistics);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load rental data");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus, adminNotes = "") => {
    try {
      setActionLoading((prev) => ({ ...prev, [bookingId]: true }));

      const result = await updateRentalStatus(bookingId, newStatus, adminNotes);

      if (result.success) {
        await loadData(); // Refresh data
        alert(result.message);
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    } finally {
      setActionLoading((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleConfirmReturn = async (bookingId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [bookingId]: true }));

      const adminNotes = prompt("Add any notes about the return (optional):");

      const result = await confirmItemReturn(
        bookingId,
        "admin",
        adminNotes || ""
      );

      if (result.success) {
        await loadData(); // Refresh data
        alert(result.message);
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error("Error confirming return:", err);
      alert("Failed to confirm return");
    } finally {
      setActionLoading((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (
      !confirm(
        "Are you sure you want to delete this booking? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setActionLoading((prev) => ({ ...prev, [bookingId]: true }));

      const result = await deleteRentalBooking(bookingId, "admin");

      if (result.success) {
        await loadData(); // Refresh data
        alert(result.message);
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error("Error deleting booking:", err);
      alert("Failed to delete booking");
    } finally {
      setActionLoading((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      [BOOKING_STATUS.ONGOING]: {
        color: "bg-green-100 text-green-800",
        label: "Ongoing",
      },
      [BOOKING_STATUS.COMPLETED]: {
        color: "bg-gray-100 text-gray-800",
        label: "Completed",
      },
      [BOOKING_STATUS.CANCELLED]: {
        color: "bg-red-100 text-red-800",
        label: "Cancelled",
      },
      [BOOKING_STATUS.RETURN_REQUESTED]: {
        color: "bg-orange-100 text-orange-800",
        label: "Return Requested",
      },
      [BOOKING_STATUS.OVERDUE]: {
        color: "bg-red-100 text-red-800",
        label: "Overdue",
      },
      [BOOKING_STATUS.DUE_SOON]: {
        color: "bg-yellow-100 text-yellow-800",
        label: "Due Soon",
      },
    };

    const config = statusConfig[status] || {
      color: "bg-gray-100 text-gray-800",
      label: status,
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const getFilteredBookings = () => {
    let filtered = bookings;

    // Status filter
    if (statusFilter === "unpaid_penalty") {
      filtered = filtered.filter(
        (booking) => booking.penaltyAmount > 0 && !booking.penaltyPaid
      );
    } else if (statusFilter === "paid_penalty") {
      filtered = filtered.filter(
        (booking) => booking.penaltyAmount > 0 && booking.penaltyPaid
      );
    } else if (statusFilter !== "all") {
      filtered = filtered.filter((booking) => booking.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (booking) =>
          booking.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getPaginatedBookings = () => {
    const filtered = getFilteredBookings();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(getFilteredBookings().length / itemsPerPage);

  // Calculate penalty statistics
  const calculatePenaltyStats = () => {
    const stats = {
      totalPenaltyRevenue: 0,
      pendingPenalties: 0,
      paidPenalties: 0,
      unpaidPenaltyAmount: 0,
      rentalsWithUnpaidPenalties: 0,
    };

    bookings.forEach((booking) => {
      if (booking.penaltyAmount && booking.penaltyAmount > 0) {
        if (booking.penaltyPaid) {
          stats.paidPenalties += booking.penaltyAmount;
          stats.totalPenaltyRevenue += booking.penaltyAmount;
        } else {
          stats.unpaidPenaltyAmount += booking.penaltyAmount;
          stats.rentalsWithUnpaidPenalties++;
        }
        stats.pendingPenalties = stats.unpaidPenaltyAmount;
      }
    });

    return stats;
  };

  const penaltyStats = calculatePenaltyStats();

  const formatDate = (dateString) => {
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

  const isOverdueBasedOnDate = (endDateTime, currentStatus) => {
    if (!endDateTime) return false;
    const endDate = new Date(endDateTime);
    const today = new Date();
    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endDateOnly = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
    );

    return (
      endDateOnly.getTime() < todayOnly.getTime() &&
      currentStatus === BOOKING_STATUS.ONGOING
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-center mt-4 text-gray-600">
          Loading rental bookings...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
          Rental Management
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600">
          Manage all rental bookings and their statuses
        </p>
      </div>

      {error && (
        <div className="bg-gray-100 border border-gray-300 rounded-xl sm:rounded-2xl p-4 mb-6">
          <p className="text-gray-700 font-medium text-sm sm:text-base">
            {error}
          </p>
          <button
            onClick={loadData}
            className="mt-2 text-gray-900 hover:text-black underline font-medium text-sm sm:text-base touch-manipulation"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-xl">📋</span>
              </div>
              <div className="text-right flex-1 ml-3">
                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                  {statistics.total}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">
                  Total Bookings
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-xl">🏃</span>
              </div>
              <div className="text-right flex-1 ml-3">
                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                  {statistics.ongoing}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">
                  Ongoing
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-xl">✅</span>
              </div>
              <div className="text-right flex-1 ml-3">
                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                  {statistics.completed}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">
                  Completed
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-xl">📦</span>
              </div>
              <div className="text-right flex-1 ml-3">
                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                  {statistics.returnRequested}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">
                  Return Requests
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-xl">⚠️</span>
              </div>
              <div className="text-right flex-1 ml-3">
                <div className="text-lg sm:text-2xl font-bold text-red-600">
                  {statistics.overdue}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">
                  Overdue
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-xl">💰</span>
              </div>
              <div className="text-right flex-1 ml-3">
                <div className="text-sm sm:text-2xl font-bold text-green-600">
                  ${statistics.totalRevenue.toFixed(2)}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">
                  Total Revenue
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Penalty Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl sm:rounded-3xl shadow-lg border border-green-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-200 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-lg sm:text-xl">✅</span>
            </div>
            <div className="text-right flex-1 ml-3">
              <div className="text-sm sm:text-2xl font-bold text-green-700">
                ${penaltyStats.totalPenaltyRevenue.toFixed(2)}
              </div>
              <div className="text-xs sm:text-sm text-green-700 font-medium">
                Penalty Revenue
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl sm:rounded-3xl shadow-lg border border-red-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-200 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-lg sm:text-xl">⏰</span>
            </div>
            <div className="text-right flex-1 ml-3">
              <div className="text-sm sm:text-2xl font-bold text-red-700">
                ${penaltyStats.unpaidPenaltyAmount.toFixed(2)}
              </div>
              <div className="text-xs sm:text-sm text-red-700 font-medium">
                Pending Penalties
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl sm:rounded-3xl shadow-lg border border-orange-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-200 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-lg sm:text-xl">📋</span>
            </div>
            <div className="text-right flex-1 ml-3">
              <div className="text-sm sm:text-2xl font-bold text-orange-700">
                {penaltyStats.rentalsWithUnpaidPenalties}
              </div>
              <div className="text-xs sm:text-sm text-orange-700 font-medium">
                Unpaid Penalties
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl sm:rounded-3xl shadow-lg border border-blue-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-lg sm:text-xl">💵</span>
            </div>
            <div className="text-right flex-1 ml-3">
              <div className="text-sm sm:text-2xl font-bold text-blue-700">
                ${penaltyStats.paidPenalties.toFixed(2)}
              </div>
              <div className="text-xs sm:text-sm text-blue-700 font-medium">
                Collected Penalties
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl sm:rounded-lg shadow p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm sm:text-base touch-manipulation"
            >
              <option value="all">All Statuses</option>
              <option value={BOOKING_STATUS.ONGOING}>Ongoing</option>
              <option value={BOOKING_STATUS.RETURN_REQUESTED}>
                Return Requested
              </option>
              <option value={BOOKING_STATUS.COMPLETED}>Completed</option>
              <option value={BOOKING_STATUS.OVERDUE}>Overdue</option>
              <option value={BOOKING_STATUS.CANCELLED}>Cancelled</option>
              <option value="unpaid_penalty">Unpaid Penalties</option>
              <option value="paid_penalty">Paid Penalties</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by item name, user name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item & User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rental Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Penalty Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getPaginatedBookings().map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={
                          booking.itemImage ||
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyOEMxNC40NzcyIDI4IDEwIDIzLjUyMjggMTAgMThDMTAgMTIuNDc3MiAxNC40NzcyIDggMjAgOEMyNS41MjI4IDggMzAgMTIuNDc3MiAzMCAxOEMzMCAyMy41MjI4IDI1LjUyMjggMjggMjAgMjhaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K"
                        }
                        alt={booking.itemName}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.itemName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.userName} ({booking.userEmail})
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">
                        Start: {formatDate(booking.startDateTime)}
                      </div>
                      <div>End: {formatDate(booking.endDateTime)}</div>
                      <div className="text-xs text-gray-500">
                        {booking.duration} {booking.unit}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(booking.status)}
                      {isOverdueBasedOnDate(
                        booking.endDateTime,
                        booking.status
                      ) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                          🔄 Auto-updating...
                        </span>
                      )}
                    </div>
                    {booking.returnRequestedAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        Requested: {formatDate(booking.returnRequestedAt)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {booking.penaltyAmount && booking.penaltyAmount > 0 ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold ${
                              booking.penaltyPaid
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            ${booking.penaltyAmount.toFixed(2)}
                          </span>
                          {booking.penaltyPaid ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Unpaid
                            </span>
                          )}
                        </div>
                        {booking.overdueDays > 0 && (
                          <div className="text-xs text-gray-600">
                            {booking.overdueDays} day
                            {booking.overdueDays !== 1 ? "s" : ""} overdue
                          </div>
                        )}
                        {booking.penaltyPaid && booking.penaltyPaidAt && (
                          <div className="text-xs text-gray-500">
                            Paid: {formatDate(booking.penaltyPaidAt)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No penalty</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${(booking.amountPaid || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {booking.status === BOOKING_STATUS.RETURN_REQUESTED && (
                        <button
                          onClick={() => handleConfirmReturn(booking.id)}
                          disabled={actionLoading[booking.id]}
                          className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded text-xs font-medium disabled:opacity-50"
                        >
                          {actionLoading[booking.id]
                            ? "Processing..."
                            : "Confirm Return"}
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteBooking(booking.id)}
                        disabled={actionLoading[booking.id]}
                        className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded text-xs font-medium disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(
                      currentPage * itemsPerPage,
                      getFilteredBookings().length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">
                    {getFilteredBookings().length}
                  </span>{" "}
                  results
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>

                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? "z-10 bg-gray-100 border-black text-black"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {getFilteredBookings().length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No bookings found</div>
          <p className="text-gray-400 mt-2">
            {statusFilter !== "all" || searchTerm
              ? "Try adjusting your filters"
              : "Bookings will appear here once users start renting items"}
          </p>
        </div>
      )}
    </div>
  );
};

export default RentalBookingManagement;
