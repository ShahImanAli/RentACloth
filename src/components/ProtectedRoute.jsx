import { useAuth } from "../context/AuthContext";
import { useAdmin } from "../context/AdminContext";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, loading } = useAuth();
  const { isAdmin, adminLoading } = useAdmin();
  const location = useLocation();

  // Show loading while authentication and admin status are being checked
  if (loading || adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If this is an admin-only route and user is not admin, show access denied
  if (adminOnly && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Admin Access Required
          </h1>
          <p className="text-gray-600 mb-6">
            You need admin privileges to access this area.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // If user is admin and trying to access non-admin routes, redirect to admin panel
  if (isAdmin && !adminOnly && location.pathname !== "/admin") {
    return <Navigate to="/admin" replace />;
  }

  // If authenticated and authorized, render the protected content
  return children;
};

export default ProtectedRoute;
