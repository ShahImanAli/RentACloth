import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAdmin } from "../context/AdminContext";
import { logOut } from "../firebase/auth";
import { useNavigate } from "react-router-dom";

export default function MobileMenu({ isOpen, onClose }) {
  const { user, displayName } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logOut();
      onClose();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLinkClick = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 flex">
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black opacity-50"
        onClick={onClose}
      ></div>

      {/* Sliding Menu from Left - Solid White Background, Full Height */}
      <div className="relative flex flex-col w-72 bg-white shadow-2xl animate-slide-in-from-left min-h-screen">
        {/* Header - White background */}
        <div className="flex items-center justify-between px-6 py-6 bg-white border-b-2 border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shadow-sm border border-gray-200">
              <svg
                className="w-7 h-7 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-gray-900 font-bold text-xl">Menu</h1>
              <p className="text-gray-600 text-sm">Navigate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-3 rounded-xl transition-colors border border-gray-200"
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

        {/* Navigation Links - White background with spacing */}
        <nav className="flex-1 px-6 py-8 bg-white space-y-3">
          <Link
            to="/"
            onClick={handleLinkClick}
            className="w-full flex items-center px-5 py-4 text-left rounded-xl transition-all duration-200 text-gray-800 hover:bg-gray-100 font-medium border border-gray-200 shadow-sm"
          >
            <svg
              className="w-6 h-6 mr-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-lg">Home</span>
          </Link>
          <Link
            to="/collections"
            onClick={handleLinkClick}
            className="w-full flex items-center px-5 py-4 text-left rounded-xl transition-all duration-200 text-gray-800 hover:bg-gray-100 font-medium border border-gray-200 shadow-sm"
          >
            <svg
              className="w-6 h-6 mr-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <span className="text-lg">Collections</span>
          </Link>
          <Link
            to="/productList"
            onClick={handleLinkClick}
            className="w-full flex items-center px-5 py-4 text-left rounded-xl transition-all duration-200 text-gray-800 hover:bg-gray-100 font-medium border border-gray-200 shadow-sm"
          >
            <svg
              className="w-6 h-6 mr-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <span className="text-lg">Shop</span>
          </Link>
          {user && (
            <Link
              to="/myRentals"
              onClick={handleLinkClick}
              className="w-full flex items-center px-5 py-4 text-left rounded-xl transition-all duration-200 text-gray-800 hover:bg-gray-100 font-medium border border-gray-200 shadow-sm"
            >
              <svg
                className="w-6 h-6 mr-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <span className="text-lg">My Rentals</span>
            </Link>
          )}
          <Link
            to="/about"
            onClick={handleLinkClick}
            className="w-full flex items-center px-5 py-4 text-left rounded-xl transition-all duration-200 text-gray-800 hover:bg-gray-100 font-medium border border-gray-200 shadow-sm"
          >
            <svg
              className="w-6 h-6 mr-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-lg">About</span>
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              onClick={handleLinkClick}
              className="w-full flex items-center px-5 py-4 text-left rounded-xl transition-all duration-200 text-white bg-gray-900 hover:bg-gray-800 font-semibold shadow-lg"
            >
              <svg
                className="w-6 h-6 mr-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <span className="text-lg">Admin Panel</span>
            </Link>
          )}
        </nav>

        {/* User Section - White background */}
        <div className="border-t-2 border-gray-200 px-6 py-6 bg-white space-y-4">
          {user ? (
            <>
              <div className="flex items-center space-x-4 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-12 h-12 rounded-full border-2 border-gray-300 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center border border-gray-300">
                    <svg
                      className="w-6 h-6 text-gray-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {displayName}
                  </p>
                  <p className="text-sm text-gray-600">Logged in</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-6 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium shadow-lg border-2 border-gray-300"
              >
                <svg
                  className="w-5 h-5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="text-lg">Sign Out</span>
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <Link
                to="/login"
                onClick={handleLinkClick}
                className="w-full flex items-center justify-center px-6 py-4 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition-colors font-medium border-2 border-gray-300 shadow-sm"
              >
                <span className="text-lg">Sign In</span>
              </Link>
              <Link
                to="/signup"
                onClick={handleLinkClick}
                className="w-full flex items-center justify-center px-6 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium shadow-lg"
              >
                <span className="text-lg">Sign Up</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
