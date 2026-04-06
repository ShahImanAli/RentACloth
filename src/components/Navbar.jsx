import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useAuth } from "../context/AuthContext";
import { useAdmin } from "../context/AdminContext";
import { logOut } from "../firebase/auth";
import { getUserInAppNotifications } from "../services/rentalNotificationService";
import MobileMenu from "./MobileMenu";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [reminderCount, setReminderCount] = useState(0);
  const items = useSelector((state) => state.cart.items || []);
  const wishlistItems = useSelector((state) => state.wishlist.items || []);
  const { user, displayName, loading: authLoading } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  // Close profile dropdown on outside click
  useEffect(() => {
    if (!profileDropdownOpen) return;
    const handleClick = (e) => {
      if (!e.target.closest(".profile-dropdown-parent")) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileDropdownOpen]);

  useEffect(() => {
    if (user) {
      loadReminderCount();
      // Check for reminders every 5 minutes
      const interval = setInterval(loadReminderCount, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadReminderCount = async () => {
    if (!user) return;
    try {
      const result = await getUserInAppNotifications(user.uid);
      if (result.success) {
        setReminderCount(result.notifications?.length || 0);
      }
    } catch (error) {
      console.error("Error loading reminder count:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Calculate total items with quantities
  const totalItems = items.reduce(
    (total, item) => total + (item.quantity || 1),
    0
  );

  const totalWishlistItems = wishlistItems.length;

  const renderProfileIcon = () => (
    <svg
      className="w-6 h-6 text-gray-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d="M20 21a8 8 0 10-16 0"
      />
      <circle cx="12" cy="8" r="4" strokeWidth="1.8" />
    </svg>
  );

  return (
    <nav className="w-full bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Main Navbar Content */}
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <path
                  d="M6 6h15l-1.5 9h-13.5z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="9" cy="20" r="1" fill="currentColor" />
                <circle cx="18" cy="20" r="1" fill="currentColor" />
              </svg>
            </div>
            <Link
              className="text-gray-900 text-2xl font-bold tracking-tight hover:text-gray-700 transition-colors"
              to="/"
            >
              RentACloth
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              className="text-gray-700 hover:text-gray-900 font-medium text-xl px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-300"
              to="/"
            >
              Home
            </Link>
            <Link
              className="text-gray-700 hover:text-gray-900 font-medium text-xl px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-300"
              to="/collections"
            >
              Collections
            </Link>
            <div className="relative group">
              <Link
                className="text-gray-700 hover:text-gray-900 font-medium text-xl px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-300 flex items-center gap-1"
                to="/productList"
              >
                Shop
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
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </Link>
              {/* Dropdown */}
              <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                <div className="p-2">
                  <Link
                    to="/productList?gender=men"
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="font-medium">Men</div>
                    <div className="text-gray-500 text-xs">
                      Men's clothing & accessories
                    </div>
                  </Link>
                  <Link
                    to="/productList?gender=women"
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="font-medium">Women</div>
                    <div className="text-gray-500 text-xs">
                      Women's clothing & accessories
                    </div>
                  </Link>
                  <Link
                    to="/productList?gender=kids"
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="font-medium">Kids</div>
                    <div className="text-gray-500 text-xs">
                      Kids' clothing & accessories
                    </div>
                  </Link>
                </div>
              </div>
            </div>
            {user && (
              <Link
                className="text-gray-700 hover:text-gray-900 font-medium text-xl px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-300"
                to="/myRentals"
              >
                My Rentals
              </Link>
            )}
            <Link
              className="text-gray-700 hover:text-gray-900 font-medium text-xl px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-300"
              to="/about"
            >
              About
            </Link>

            {isAdmin && (
              <Link
                className="text-gray-900 font-medium text-xl px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-300 border border-gray-300"
                to="/admin"
              >
                Admin
              </Link>
            )}
          </div>

          {/* Right Side - Wishlist + Cart + User Actions + Mobile Menu */}
          <div className="flex items-center gap-3">
            {/* Wishlist Icon */}
            <button
              onClick={() => navigate("/wishlist")}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-300 group"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transition-all duration-300"
              >
                <path
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill={
                    totalWishlistItems > 0 ? "rgba(239, 68, 68, 0.1)" : "none"
                  }
                />
              </svg>
              {totalWishlistItems > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalWishlistItems > 9 ? "9+" : totalWishlistItems}
                </div>
              )}
            </button>

            {/* Cart Icon */}
            <button
              onClick={() => navigate("/cart")}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-300 group"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transition-all duration-300"
              >
                <path
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 3H3m4 10v6a1 1 0 001 1h9a1 1 0 001-1v-6m-10 0h10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {totalItems > 0 && (
                <div className="absolute -top-1 -right-1 bg-gray-900 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems > 9 ? "9+" : totalItems}
                </div>
              )}
            </button>

            {/* User Profile & Actions */}
            {user && (
              <div className="hidden md:flex items-center gap-3 ml-4 pl-4 border-l border-gray-200 profile-dropdown-parent relative">
                <button
                  className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center border border-gray-300 hover:ring-2 hover:ring-gray-300 transition-all relative"
                  onClick={() => setProfileDropdownOpen((v) => !v)}
                  aria-label="Open profile menu"
                >
                  {renderProfileIcon()}
                </button>
                {/* Profile Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 top-12 min-w-[240px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 flex flex-col py-5 px-6 animate-fade-in">
                    <div className="flex items-center gap-3 pb-4 mb-3 border-b border-gray-100">
                      {user?.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt="Profile"
                          className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {renderProfileIcon()}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 text-base leading-tight">
                          {displayName}
                        </span>
                        <span className="text-xs text-gray-500">Profile</span>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-700 font-semibold px-4 py-2 rounded-lg transition-all duration-200 text-base mt-1 shadow-sm border border-gray-200"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Login/Signup for non-users */}
            {!user && (
              <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-gray-900 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-all duration-300 text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-4 py-2 rounded-lg transition-all duration-300 text-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              className="md:hidden flex items-center justify-center p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-300 ml-2"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                className="text-gray-700 transition-transform duration-300"
                style={{
                  transform: menuOpen ? "rotate(90deg)" : "rotate(0deg)",
                }}
              >
                {menuOpen ? (
                  <path
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Component */}
        <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      </div>
    </nav>
  );
}
