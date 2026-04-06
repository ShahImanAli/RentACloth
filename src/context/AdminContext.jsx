import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { checkAdminStatus } from "../firebase/admin";

const AdminContext = createContext({});

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const { user, authInitialized } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (authInitialized && user?.uid) {
        try {
          setAdminLoading(true);
          const result = await checkAdminStatus(user.uid);

          if (result.success) {
            setIsAdmin(result.isAdmin);
            if (result.isAdmin) {
              setAdminData({
                role: result.role,
                permissions: result.permissions,
              });
            } else {
              setAdminData(null);
            }
          } else {
            setIsAdmin(false);
            setAdminData(null);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
          setAdminData(null);
        } finally {
          setAdminLoading(false);
        }
      } else if (authInitialized && !user) {
        setIsAdmin(false);
        setAdminData(null);
        setAdminLoading(false);
      }
    };

    checkAdmin();
  }, [user, authInitialized]);

  // Check if admin has specific permission
  const hasPermission = (permission) => {
    if (!isAdmin || !adminData?.permissions) return false;
    return (
      adminData.permissions.includes(permission) ||
      adminData.permissions.includes("*")
    );
  };

  // Check if user is super admin
  const isSuperAdmin = () => {
    return isAdmin && adminData?.role === "super_admin";
  };

  const value = {
    isAdmin,
    adminData,
    adminLoading,
    hasPermission,
    isSuperAdmin,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};

export default AdminContext;
