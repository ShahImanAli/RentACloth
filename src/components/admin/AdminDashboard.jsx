import { useState, useEffect } from "react";
import { getAllProducts, getCategories } from "../../firebase/products";
import { getRentalStatistics } from "../../firebase/rentalsNew";
import { useAdmin } from "../../context/AdminContext";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

const AdminDashboard = ({ onSectionChange }) => {
  const { adminData } = useAdmin();
  const [stats, setStats] = useState({
    totalRentalItems: 0,
    availableItems: 0,
    activeRentals: 0,
    overdueRentals: 0,
    dueSoonRentals: 0,
    returnRequests: 0,
    totalRentalRevenue: 0,
    totalPenaltyRevenue: 0,
    unpaidPenalties: 0,
    monthlyRevenue: 0,
    recentRentals: [],
    loading: true,
  });

  // Function to handle quick action navigation
  const handleQuickAction = (action) => {
    if (onSectionChange) {
      onSectionChange(action);
    } else {
      // Fallback to custom event for backward compatibility
      window.dispatchEvent(
        new CustomEvent("adminNavigation", { detail: action })
      );
    }
  };

  const fetchDashboardData = async () => {
    try {
      setStats((prev) => ({ ...prev, loading: true }));

      // Get rental items (products available for rent)
      const allProductsResult = await getAllProducts();
      const availableProductsResult = await getAllProducts({
        status: "active",
      });

      // Get rental statistics
      const rentalStatsResult = await getRentalStatistics();

      let totalRentalItems = 0;
      let availableItems = 0;
      let activeRentals = 0;
      let overdueRentals = 0;
      let dueSoonRentals = 0;
      let returnRequests = 0;
      let totalRentalRevenue = 0;
      let monthlyRevenue = 0;
      let recentRentals = [];

      if (allProductsResult.success) {
        totalRentalItems = allProductsResult.data.length;
      }

      if (availableProductsResult.success) {
        availableItems = availableProductsResult.data.length;
      }

      if (rentalStatsResult.success) {
        const stats = rentalStatsResult.statistics;
        activeRentals = stats.ongoing || 0;
        overdueRentals = stats.overdue || 0;
        dueSoonRentals = stats.dueSoon || 0;
        returnRequests = stats.returnRequested || 0;
        totalRentalRevenue = stats.totalRevenue || 0;
        monthlyRevenue = stats.monthlyRevenue || 0;
        recentRentals = stats.recentRentals || [];
      }

      setStats((prev) => ({
        ...prev,
        totalRentalItems,
        availableItems,
        activeRentals,
        overdueRentals,
        dueSoonRentals,
        returnRequests,
        totalRentalRevenue,
        totalPenaltyRevenue: rentalStatsResult.success
          ? rentalStatsResult.statistics.totalPenaltyRevenue || 0
          : 0,
        unpaidPenalties: 0,
        monthlyRevenue,
        recentRentals,
        loading: false,
      }));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (stats.loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Rental Items",
      value: stats.totalRentalItems,
      icon: "�",
      color: "bg-blue-500",
      description: "Total items available for rent",
    },
    {
      title: "Available Now",
      value: stats.availableItems,
      icon: "✅",
      color: "bg-green-500",
      description: "Items currently available",
    },
    {
      title: "Active Rentals",
      value: stats.activeRentals,
      icon: "🏃",
      color: "bg-purple-500",
      description: "Currently rented items",
    },
    {
      title: "Return Requests",
      value: stats.returnRequests,
      icon: "📦",
      color: "bg-orange-500",
      description: "Pending returns",
    },
    {
      title: "Overdue Items",
      value: stats.overdueRentals,
      icon: "⚠️",
      color: "bg-red-500",
      description: "Items past due date",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRentalRevenue.toFixed(2)}`,
      icon: "💰",
      color: "bg-indigo-500",
      description: "All-time rental income",
    },
    {
      title: "Penalty Revenue",
      value: `$${stats.totalPenaltyRevenue.toFixed(2)}`,
      icon: "⚡",
      color: "bg-yellow-500",
      description: "Revenue from penalties",
    },
  ];

  // Chart data preparation
  const rentalStatusData = [
    {
      name: "Active Rentals",
      value: stats.activeRentals,
      color: "#8B5CF6",
      fullName: "Currently Active Rentals",
    },
    {
      name: "Available Items",
      value: stats.availableItems,
      color: "#10B981",
      fullName: "Items Available for Rent",
    },
    {
      name: "Overdue Items",
      value: stats.overdueRentals,
      color: "#EF4444",
      fullName: "Overdue Returns",
    },
    {
      name: "Return Requests",
      value: stats.returnRequests,
      color: "#F59E0B",
      fullName: "Pending Return Requests",
    },
  ];

  const totalItems = stats.totalRentalItems;
  const itemsInUse =
    stats.activeRentals + stats.overdueRentals + stats.returnRequests;

  const inventoryData = [
    { name: "Total Items", count: stats.totalRentalItems, color: "#3B82F6" },
    { name: "In Use", count: itemsInUse, color: "#8B5CF6" },
    { name: "Available", count: stats.availableItems, color: "#10B981" },
  ];

  const revenueBreakdown = [
    {
      category: "Rental Revenue",
      amount: stats.totalRentalRevenue - stats.totalPenaltyRevenue,
      color: "#8B5CF6",
    },
    {
      category: "Penalty Revenue",
      amount: stats.totalPenaltyRevenue,
      color: "#F59E0B",
    },
  ];

  const COLORS = ["#8B5CF6", "#10B981", "#EF4444", "#F59E0B"];

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200">
          <p className="font-bold text-gray-900">{payload[0].name}</p>
          <p className="text-lg text-gray-700">
            {typeof payload[0].value === "number" && payload[0].value < 1000
              ? payload[0].value
              : `$${payload[0].value?.toFixed(2)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-black mb-3">Admin Dashboard</h1>
        <p className="text-lg text-gray-600">
          Welcome back! Here's your rental business overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              {/* Icon */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl sm:text-3xl">{card.icon}</span>
              </div>

              {/* Stats */}
              <div className="text-right flex-1 ml-4">
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-1">
                  {card.value}
                </p>
                <p className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wide">
                  {card.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">{card.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Rental Status Distribution - Donut Chart */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-200 hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-black">
              📊 Rental Status Distribution
            </h3>
            <div className="text-sm text-gray-500">Real-time data</div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={rentalStatusData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, value, percent }) =>
                  `${name}: ${value} (${(percent * 100).toFixed(1)}%)`
                }
                outerRadius={100}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {rentalStatusData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value, entry) => (
                  <span className="text-sm font-medium text-gray-700">
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Inventory Overview - Bar Chart */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-200 hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-black">
              📦 Inventory Overview
            </h3>
            <div className="text-sm text-gray-500">Items breakdown</div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={inventoryData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="colorInUse" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="colorAvailable" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#6B7280", fontWeight: 600 }}
                axisLine={{ stroke: "#D1D5DB" }}
              />
              <YAxis
                tick={{ fill: "#6B7280", fontWeight: 600 }}
                axisLine={{ stroke: "#D1D5DB" }}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="square" />
              <Bar
                dataKey="count"
                fill="url(#colorTotal)"
                name="Item Count"
                radius={[8, 8, 0, 0]}
                animationBegin={0}
                animationDuration={800}
              >
                {inventoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#${
                      index === 0
                        ? "colorTotal"
                        : index === 1
                        ? "colorInUse"
                        : "colorAvailable"
                    })`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue & Statistics Combined Chart */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-200 hover:shadow-2xl transition-all mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-black mb-2">
              Revenue & Rental Statistics
            </h3>
            <p className="text-sm text-gray-600">
              Comprehensive business overview
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600">
              ${stats.totalRentalRevenue.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rental Status Bar Chart */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">
              Rental Status Breakdown
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={rentalStatusData}
                layout="vertical"
                margin={{ left: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  horizontal={false}
                />
                <XAxis type="number" tick={{ fill: "#6B7280", fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#374151", fontSize: 12, fontWeight: 600 }}
                  width={120}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 8, 8, 0]}
                  animationBegin={0}
                  animationDuration={1000}
                >
                  {rentalStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Revenue Bar Chart with Penalty Breakdown */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">
              Revenue Breakdown
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueBreakdown}>
                <defs>
                  <linearGradient
                    id="rentalGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient
                    id="penaltyGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="category"
                  tick={{ fill: "#6B7280", fontWeight: 600 }}
                />
                <YAxis
                  tick={{ fill: "#6B7280", fontWeight: 600 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  formatter={(value) => `$${value.toFixed(2)}`}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                  cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                />
                <Bar
                  dataKey="amount"
                  name="Revenue"
                  radius={[8, 8, 0, 0]}
                  animationBegin={200}
                  animationDuration={1000}
                >
                  {revenueBreakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        index === 0
                          ? "url(#rentalGradient)"
                          : "url(#penaltyGradient)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-lg border border-gray-200 mb-8">
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <h3 className="text-lg sm:text-2xl font-bold text-black">
            Quick Actions
          </h3>
          <div className="w-6 sm:w-8 h-1 bg-black rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <button
            onClick={() => handleQuickAction("rentals")}
            className="group p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl sm:rounded-3xl hover:from-gray-100 hover:to-gray-200 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-lg border border-gray-200 touch-manipulation"
          >
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-600 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <p className="font-bold text-black text-sm sm:text-lg mb-1 sm:mb-2">
                Manage Rentals
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                View all rental bookings
              </p>
            </div>
          </button>

          <button
            onClick={() => handleQuickAction("inventory")}
            className="group p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl sm:rounded-3xl hover:from-gray-100 hover:to-gray-200 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-lg border border-gray-200 touch-manipulation"
          >
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-600 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <p className="font-bold text-gray-900 text-sm sm:text-lg mb-1 sm:mb-2">
                Add Item
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                Add new rental item
              </p>
            </div>
          </button>

          <button
            onClick={() => handleQuickAction("rentals")}
            className="group p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl sm:rounded-3xl hover:from-gray-100 hover:to-gray-200 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-lg border border-gray-200 touch-manipulation"
          >
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-600 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"
                  />
                </svg>
              </div>
              <p className="font-bold text-gray-900 text-sm sm:text-lg mb-1 sm:mb-2">
                Process Returns
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                Handle return requests
              </p>
            </div>
          </button>

          <button
            onClick={() => handleQuickAction("inventory")}
            className="group p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl sm:rounded-3xl hover:from-gray-100 hover:to-gray-200 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-lg border border-gray-200 touch-manipulation"
          >
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-600 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <p className="font-bold text-gray-900 text-sm sm:text-lg mb-1 sm:mb-2">
                Manage Inventory
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                View all rental items
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
