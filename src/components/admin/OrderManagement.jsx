import { useState, useEffect } from "react";
import {
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
  searchOrders,
  ORDER_STATUS,
} from "../../firebase/orders";
import { useAdmin } from "../../context/AdminContext";

const OrderManagement = () => {
  const { hasPermission } = useAdmin();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const canWrite = hasPermission("orders:write");
  const canDelete = hasPermission("orders:delete");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const result = await getAllOrders({
        orderByField: "createdAt",
        orderDirection: "desc",
      });

      if (result.success) {
        setOrders(result.data);
      } else {
        console.error("Failed to fetch orders:", result.error);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchOrders();
      return;
    }

    try {
      setLoading(true);
      const result = await searchOrders(searchTerm);
      if (result.success) {
        setOrders(result.data);
      }
    } catch (error) {
      console.error("Error searching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (!canWrite) {
      alert("You do not have permission to update orders");
      return;
    }

    try {
      setUpdateLoading(true);
      const result = await updateOrderStatus(orderId, newStatus);

      if (result.success) {
        // Update the order in local state
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  status: newStatus,
                  updatedAt: new Date().toISOString(),
                }
              : order
          )
        );

        // Update selected order if it's the one being updated
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) => ({
            ...prev,
            status: newStatus,
            updatedAt: new Date().toISOString(),
          }));
        }

        alert("Order status updated successfully!");
      } else {
        alert(result.message || "Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Error updating order status");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!canDelete) {
      alert("You do not have permission to delete orders");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this order? This action cannot be undone."
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setUpdateLoading(true);
      const result = await deleteOrder(orderId);

      if (result.success) {
        // Remove the order from local state
        setOrders((prev) => prev.filter((order) => order.id !== orderId));

        // Close order details if the deleted order was selected
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(null);
          setShowOrderDetails(false);
        }

        alert("Order deleted successfully!");
      } else {
        alert(result.message || "Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Error deleting order");
    } finally {
      setUpdateLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case ORDER_STATUS.CONFIRMED:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case ORDER_STATUS.PROCESSING:
        return "bg-purple-100 text-purple-800 border-purple-200";
      case ORDER_STATUS.SHIPPED:
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case ORDER_STATUS.DELIVERED:
        return "bg-green-100 text-green-800 border-green-200";
      case ORDER_STATUS.CANCELLED:
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return "⏳";
      case ORDER_STATUS.CONFIRMED:
        return "✅";
      case ORDER_STATUS.PROCESSING:
        return "⚙️";
      case ORDER_STATUS.SHIPPED:
        return "🚚";
      case ORDER_STATUS.DELIVERED:
        return "📦";
      case ORDER_STATUS.CANCELLED:
        return "❌";
      default:
        return "📋";
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === "all") return true;
    return order.status === statusFilter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const OrderDetailsModal = ({ order, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
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
        </div>

        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Order Information
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Order ID:</span> {order.orderId}
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs border ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusIcon(order.status)}{" "}
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Created:</span>{" "}
                  {formatDate(order.createdAt)}
                </div>
                <div>
                  <span className="font-medium">Total:</span> $
                  {order.total?.toFixed(2)}
                </div>
                <div>
                  <span className="font-medium">Payment:</span>{" "}
                  {order.paymentMethod}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Customer Details
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Name:</span>{" "}
                  {order.customerDetails?.firstName}{" "}
                  {order.customerDetails?.lastName}
                </div>
                <div>
                  <span className="font-medium">Email:</span>{" "}
                  {order.customerDetails?.email}
                </div>
                <div>
                  <span className="font-medium">Phone:</span>{" "}
                  {order.customerDetails?.phone}
                </div>
                <div>
                  <span className="font-medium">Address:</span>{" "}
                  {order.customerDetails?.address},{" "}
                  {order.customerDetails?.city}
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Order Items
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {order.items?.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 bg-white p-3 rounded-lg"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity}
                    </p>
                    <p className="text-sm text-gray-600">
                      Price: ${item.price?.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${(item.price * item.quantity)?.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Update */}
          {canWrite && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Update Status
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.values(ORDER_STATUS).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(order.id, status)}
                    disabled={updateLoading || order.status === status}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      order.status === status
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    }`}
                  >
                    {getStatusIcon(status)}{" "}
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Delete Order */}
          {canDelete && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-red-700 mb-3">
                Danger Zone
              </h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-red-800">
                      Delete Order
                    </h4>
                    <p className="text-sm text-red-600">
                      Permanently remove this order from the system.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      handleDeleteOrder(order.id);
                      onClose();
                    }}
                    disabled={updateLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Delete Order
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-4 lg:p-8 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-gray-200 h-20 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Order Management
        </h1>
        <p className="text-gray-600">View and manage customer orders</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by order ID, customer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Status Filter */}
          <div className="lg:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              {Object.values(ORDER_STATUS).map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Search
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Orders Found
            </h3>
            <p className="text-gray-600">
              {orders.length === 0
                ? "No orders have been placed yet."
                : "No orders match your current filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.orderId}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.items?.length || 0} items
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.customerDetails?.firstName}{" "}
                        {order.customerDetails?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customerDetails?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}{" "}
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${order.total?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderDetails(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View Details
                      </button>
                      {canDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOrder(order.id);
                          }}
                          className="text-red-600 hover:text-red-900 font-medium ml-3"
                          disabled={updateLoading}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setShowOrderDetails(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

export default OrderManagement;
