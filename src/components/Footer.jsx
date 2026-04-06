import { Link } from "react-router-dom";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white relative overflow-hidden">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-black to-gray-800/95"></div>
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/5 via-transparent to-gray-300/5"></div>
      </div>

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 32 0 L 0 0 0 32"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                opacity="0.3"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div className="text-center md:text-left md:col-span-1">
            <div className="flex items-center gap-3 mb-6 justify-center md:justify-start">
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
              <h3 className="text-2xl font-bold text-white tracking-tight">
                RentACloth
              </h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-8">
              Your premium fashion rental destination. Experience sustainable
              fashion with designer collections for every occasion.
            </p>

            {/* Enhanced Social Links */}
            <div className="flex justify-center md:justify-start gap-3">
              <a
                href="#"
                className="group w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-2xl flex items-center justify-center transition-all duration-500 transform hover:scale-110 hover:-translate-y-1 shadow-xl border border-gray-600/30"
              >
                <svg
                  className="w-5 h-5 text-gray-200 group-hover:text-white group-hover:rotate-12 transition-all duration-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
              <a
                href="#"
                className="group w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-2xl flex items-center justify-center transition-all duration-500 transform hover:scale-110 hover:-translate-y-1 shadow-xl border border-gray-600/30"
              >
                <svg
                  className="w-5 h-5 text-gray-200 group-hover:text-white group-hover:rotate-12 transition-all duration-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="#"
                className="group w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-2xl flex items-center justify-center transition-all duration-500 transform hover:scale-110 hover:-translate-y-1 shadow-xl border border-gray-600/30"
              >
                <svg
                  className="w-5 h-5 text-gray-200 group-hover:text-white group-hover:rotate-12 transition-all duration-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Collections */}
          <div className="text-center md:text-left">
            <h4 className="text-lg font-semibold mb-6 text-white">
              Collections
            </h4>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/productList?category=men"
                  className="group text-gray-300 hover:text-white transition-all duration-300 text-sm flex items-center justify-center md:justify-start hover:translate-x-1"
                >
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-3 group-hover:bg-white transition-all duration-300 group-hover:scale-125"></span>
                  Men's Wear
                </Link>
              </li>
              <li>
                <Link
                  to="/productList?category=women"
                  className="group text-gray-300 hover:text-white transition-all duration-300 text-sm flex items-center justify-center md:justify-start hover:translate-x-1"
                >
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-3 group-hover:bg-white transition-all duration-300 group-hover:scale-125"></span>
                  Women's Wear
                </Link>
              </li>
              <li>
                <Link
                  to="/productList?category=kids"
                  className="group text-gray-300 hover:text-white transition-all duration-300 text-sm flex items-center justify-center md:justify-start hover:translate-x-1"
                >
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-3 group-hover:bg-white transition-all duration-300 group-hover:scale-125"></span>
                  Kids' Wear
                </Link>
              </li>
              <li>
                <Link
                  to="/productList"
                  className="group text-gray-300 hover:text-white transition-all duration-300 text-sm flex items-center justify-center md:justify-start hover:translate-x-1"
                >
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-3 group-hover:bg-white transition-all duration-300 group-hover:scale-125"></span>
                  All Collections
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-left">
            <h4 className="text-lg font-semibold mb-6 text-white">
              Quick Links
            </h4>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/about"
                  className="text-gray-300 hover:text-blue-400 transition-colors duration-300 text-sm hover:underline underline-offset-4"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-blue-400 transition-colors duration-300 text-sm hover:underline underline-offset-4"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  to="/signup"
                  className="text-gray-300 hover:text-blue-400 transition-colors duration-300 text-sm hover:underline underline-offset-4"
                >
                  Create Account
                </Link>
              </li>
              <li>
                <Link
                  to="/cart"
                  className="text-gray-300 hover:text-blue-400 transition-colors duration-300 text-sm hover:underline underline-offset-4"
                >
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="text-center md:text-left">
            <h4 className="text-lg font-semibold mb-6 text-white">Support</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-all duration-300 text-sm hover:underline underline-offset-4 hover:translate-x-1"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-all duration-300 text-sm hover:underline underline-offset-4 hover:translate-x-1"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-all duration-300 text-sm hover:underline underline-offset-4 hover:translate-x-1"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-all duration-300 text-sm hover:underline underline-offset-4 hover:translate-x-1"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-gray-700 pt-12 mb-12">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-6">
              <h4 className="text-2xl font-bold mb-3 text-white">
                Stay in Style
              </h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                Get exclusive access to new collections and special rental
                offers.
              </p>
            </div>
            <div className="relative">
              <input
                type="email"
                placeholder="Enter your email address"
                className="w-full px-6 py-4 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
              />
              <button className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white px-6 rounded-lg transition-all duration-300 text-sm font-semibold transform hover:scale-105 shadow-lg">
                Subscribe
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-3">
              By subscribing, you agree to receive marketing emails. Unsubscribe
              anytime.
            </p>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              &copy; {currentYear} RentACloth. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a
                href="#"
                className="hover:text-white transition-colors duration-300"
              >
                Privacy
              </a>
              <a
                href="#"
                className="hover:text-white transition-colors duration-300"
              >
                Terms
              </a>
              <a
                href="#"
                className="hover:text-white transition-colors duration-300"
              >
                Cookies
              </a>
            </div>
            <p className="text-gray-500 text-sm">
              Built 
              by{" "}
              <span className="text-blue-400 font-medium">Shah Iman Ali</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
