import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./config";

// Admin user management

// Check if user is admin
export const checkAdminStatus = async (userId) => {
  try {
    const adminDoc = await getDoc(doc(db, "admins", userId));

    if (adminDoc.exists()) {
      const adminData = adminDoc.data();
      return {
        success: true,
        isAdmin: adminData.status === "active",
        role: adminData.role || "admin",
        permissions: adminData.permissions || [],
      };
    }

    return {
      success: true,
      isAdmin: false,
    };
  } catch (error) {
    console.error("Error checking admin status:", error);
    return {
      success: false,
      isAdmin: false,
      error: error.message,
    };
  }
};

// Add admin user
export const addAdminUser = async (userId, adminData) => {
  try {
    const admin = {
      userId,
      email: adminData.email,
      role: adminData.role || "admin",
      permissions: adminData.permissions || [
        "products:read",
        "products:write",
        "products:delete",
        "orders:read",
        "users:read",
      ],
      status: "active",
      createdAt: new Date().toISOString(),
      createdBy: adminData.createdBy || "system",
    };

    await setDoc(doc(db, "admins", userId), admin);

    return {
      success: true,
      message: "Admin user added successfully!",
    };
  } catch (error) {
    console.error("Error adding admin user:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to add admin user",
    };
  }
};

// Update admin permissions
export const updateAdminPermissions = async (userId, permissions) => {
  try {
    await updateDoc(doc(db, "admins", userId), {
      permissions,
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: "Admin permissions updated successfully!",
    };
  } catch (error) {
    console.error("Error updating admin permissions:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to update admin permissions",
    };
  }
};

// Remove admin access
export const removeAdminAccess = async (userId) => {
  try {
    await updateDoc(doc(db, "admins", userId), {
      status: "inactive",
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: "Admin access removed successfully!",
    };
  } catch (error) {
    console.error("Error removing admin access:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to remove admin access",
    };
  }
};

// Check specific permission
export const hasPermission = (adminData, permission) => {
  if (!adminData || !adminData.permissions) return false;
  return (
    adminData.permissions.includes(permission) ||
    adminData.permissions.includes("*")
  );
};

// Initialize super admin (call this once to create the first admin)
export const initializeSuperAdmin = async (userId, email) => {
  try {
    // Only allow specific email to become admin
    const allowedAdminEmail = "shahimanali1211@gmail.com";

    if (email !== allowedAdminEmail) {
      return {
        success: false,
        message: "Access denied. Only authorized users can become admin.",
      };
    }

    // Check if super admin already exists
    const existingAdmin = await getDoc(doc(db, "admins", userId));

    if (!existingAdmin.exists()) {
      const superAdmin = {
        userId,
        email,
        role: "super_admin",
        permissions: ["*"], // All permissions
        status: "active",
        createdAt: new Date().toISOString(),
        createdBy: "system",
      };

      await setDoc(doc(db, "admins", userId), superAdmin);

      return {
        success: true,
        message: "Super admin initialized successfully!",
      };
    }

    return {
      success: true,
      message: "Super admin already exists",
    };
  } catch (error) {
    console.error("Error initializing super admin:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to initialize super admin",
    };
  }
};
