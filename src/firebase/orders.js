import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  limit,
  startAfter,
} from "firebase/firestore";
import { db } from "./config";

// Order status constants
export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
};

// Order Operations

// Create a new order
export const createOrder = async (orderData) => {
  try {
    const order = {
      ...orderData,
      status: ORDER_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, "orders"), order);

    return {
      success: true,
      orderId: docRef.id,
      message: "Order created successfully!",
    };
  } catch (error) {
    console.error("Error creating order:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to create order",
    };
  }
};

// Get all orders (Admin)
export const getAllOrders = async (options = {}) => {
  try {
    const {
      status = null,
      userId = null,
      orderByField = "createdAt",
      orderDirection = "desc",
      limitCount = null,
      lastDoc = null,
    } = options;

    let q = collection(db, "orders");
    const constraints = [];

    // Add status filter
    if (status) {
      constraints.push(where("status", "==", status));
    }

    // Add userId filter
    if (userId) {
      constraints.push(where("userId", "==", userId));
    }

    // Add ordering
    constraints.push(orderBy(orderByField, orderDirection));

    // Add pagination
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    q = query(q, ...constraints);

    const querySnapshot = await getDocs(q);
    const orders = [];

    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return {
      success: true,
      data: orders,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
    };
  } catch (error) {
    console.error("Error getting orders:", error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

// Get single order
export const getOrder = async (orderId) => {
  try {
    const orderDoc = await getDoc(doc(db, "orders", orderId));

    if (orderDoc.exists()) {
      return {
        success: true,
        data: {
          id: orderDoc.id,
          ...orderDoc.data(),
        },
      };
    } else {
      return {
        success: false,
        message: "Order not found",
      };
    }
  } catch (error) {
    console.error("Error getting order:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Update order status
export const updateOrderStatus = async (
  orderId,
  newStatus,
  updateData = {}
) => {
  try {
    const orderRef = doc(db, "orders", orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      return {
        success: false,
        message: "Order not found",
      };
    }

    const updatedOrder = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
      ...updateData,
    };

    // Add status-specific fields
    switch (newStatus) {
      case ORDER_STATUS.CONFIRMED:
        updatedOrder.confirmedAt = new Date().toISOString();
        break;
      case ORDER_STATUS.SHIPPED:
        updatedOrder.shippedAt = new Date().toISOString();
        if (updateData.trackingNumber) {
          updatedOrder.trackingNumber = updateData.trackingNumber;
        }
        break;
      case ORDER_STATUS.DELIVERED:
        updatedOrder.deliveredAt = new Date().toISOString();
        break;
      case ORDER_STATUS.CANCELLED:
        updatedOrder.cancelledAt = new Date().toISOString();
        if (updateData.cancellationReason) {
          updatedOrder.cancellationReason = updateData.cancellationReason;
        }
        break;
    }

    await updateDoc(orderRef, updatedOrder);

    return {
      success: true,
      message: "Order status updated successfully!",
    };
  } catch (error) {
    console.error("Error updating order status:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to update order status",
    };
  }
};

// Delete order (Admin only)
export const deleteOrder = async (orderId) => {
  try {
    const orderRef = doc(db, "orders", orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      return {
        success: false,
        message: "Order not found",
      };
    }

    await deleteDoc(orderRef);

    return {
      success: true,
      message: "Order deleted successfully!",
    };
  } catch (error) {
    console.error("Error deleting order:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to delete order",
    };
  }
};

// Get user orders
export const getUserOrders = async (userId) => {
  try {
    const q = query(
      collection(db, "orders"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const orders = [];

    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return {
      success: true,
      data: orders,
    };
  } catch (error) {
    console.error("Error getting user orders:", error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

// Get order statistics (for admin dashboard)
export const getOrderStatistics = async () => {
  try {
    const ordersRef = collection(db, "orders");
    const allOrdersQuery = query(ordersRef);
    const allOrdersSnapshot = await getDocs(allOrdersQuery);

    const stats = {
      total: 0,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
    };

    allOrdersSnapshot.forEach((doc) => {
      const order = doc.data();
      stats.total++;

      // Count by status
      switch (order.status) {
        case ORDER_STATUS.PENDING:
          stats.pending++;
          break;
        case ORDER_STATUS.CONFIRMED:
          stats.confirmed++;
          break;
        case ORDER_STATUS.PROCESSING:
          stats.processing++;
          break;
        case ORDER_STATUS.SHIPPED:
          stats.shipped++;
          break;
        case ORDER_STATUS.DELIVERED:
          stats.delivered++;
          break;
        case ORDER_STATUS.CANCELLED:
          stats.cancelled++;
          break;
      }

      // Calculate revenue (exclude cancelled orders)
      if (order.status !== ORDER_STATUS.CANCELLED) {
        // Try different possible field names for the total amount
        let totalAmount =
          order.total ||
          order.totalAmount ||
          order.price ||
          order.amount ||
          order.orderValue;

        // Also try to calculate from subtotal + tax + shipping if total is missing
        if (!totalAmount && order.subtotal) {
          const subtotal = parseFloat(order.subtotal) || 0;
          const tax = parseFloat(order.tax) || 0;
          const shipping = parseFloat(order.shippingCost) || 0;
          const discount = parseFloat(order.discount) || 0;
          totalAmount = subtotal + tax + shipping - discount;
        }

        if (totalAmount) {
          const parsedAmount =
            typeof totalAmount === "string"
              ? parseFloat(totalAmount)
              : totalAmount;
          if (!isNaN(parsedAmount) && parsedAmount > 0) {
            stats.totalRevenue += parsedAmount;
          }
        }
      }
    });

    // Calculate average order value
    const revenueGeneratingOrders = stats.total - stats.cancelled;
    stats.averageOrderValue =
      revenueGeneratingOrders > 0
        ? stats.totalRevenue / revenueGeneratingOrders
        : 0;

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error("Error getting order statistics:", error);
    return {
      success: false,
      error: error.message,
      data: {},
    };
  }
};

// Migration function to fix orders without total field
export const fixOrdersWithoutTotal = async () => {
  try {
    const ordersRef = collection(db, "orders");
    const allOrdersQuery = query(ordersRef);
    const allOrdersSnapshot = await getDocs(allOrdersQuery);

    const updatePromises = [];

    allOrdersSnapshot.forEach((docSnapshot) => {
      const order = docSnapshot.data();

      // If order doesn't have a total field, calculate it
      if (order.total === undefined || order.total === null) {
        let calculatedTotal = 0;

        // Try to calculate from available fields
        if (order.subtotal || order.tax || order.shippingCost) {
          const subtotal = parseFloat(order.subtotal) || 0;
          const tax = parseFloat(order.tax) || 0;
          const shipping = parseFloat(order.shippingCost) || 0;
          const discount = parseFloat(order.discount) || 0;
          calculatedTotal = subtotal + tax + shipping - discount;
        }
        // If no components available, try to calculate from items
        else if (order.items && Array.isArray(order.items)) {
          calculatedTotal = order.items.reduce((sum, item) => {
            const price = parseFloat(item.price) || 0;
            const quantity = parseInt(item.quantity) || 1;
            return sum + price * quantity;
          }, 0);
        }

        // Only update if we have a valid total
        if (calculatedTotal > 0) {
          const updatePromise = updateDoc(doc(db, "orders", docSnapshot.id), {
            total: Number(calculatedTotal.toFixed(2)),
            updatedAt: new Date().toISOString(),
          });
          updatePromises.push(updatePromise);
        }
      }
    });

    await Promise.all(updatePromises);

    return {
      success: true,
      message: `Fixed ${updatePromises.length} orders`,
      updatedCount: updatePromises.length,
    };
  } catch (error) {
    console.error("Error fixing orders:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Search orders by order ID, customer name, or email
export const searchOrders = async (searchTerm) => {
  try {
    // Note: Firestore doesn't support full-text search natively
    // This is a basic implementation that fetches all orders and filters client-side
    const allOrdersResult = await getAllOrders();

    if (!allOrdersResult.success) {
      return allOrdersResult;
    }

    const searchLower = searchTerm.toLowerCase();
    const filteredOrders = allOrdersResult.data.filter((order) => {
      return (
        order.orderId?.toLowerCase().includes(searchLower) ||
        order.customerDetails?.firstName?.toLowerCase().includes(searchLower) ||
        order.customerDetails?.lastName?.toLowerCase().includes(searchLower) ||
        order.customerDetails?.email?.toLowerCase().includes(searchLower) ||
        order.id?.toLowerCase().includes(searchLower)
      );
    });

    return {
      success: true,
      data: filteredOrders,
    };
  } catch (error) {
    console.error("Error searching orders:", error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

// Update order details (Admin)
export const updateOrder = async (orderId, updateData) => {
  try {
    const orderRef = doc(db, "orders", orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      return {
        success: false,
        message: "Order not found",
      };
    }

    const updatedOrder = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(orderRef, updatedOrder);

    return {
      success: true,
      message: "Order updated successfully!",
    };
  } catch (error) {
    console.error("Error updating order:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to update order",
    };
  }
};
