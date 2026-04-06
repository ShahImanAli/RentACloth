import { useNavigate } from "react-router-dom";

export default function CallToActionBanner() {
  const navigate = useNavigate();

  return (
    <section className="w-full py-20 md:py-28 bg-gradient-to-br from-gray-900 via-black to-gray-800 relative overflow-hidden">
      {/* Animated decorative background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-gray-400 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gray-600 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "0.5s" }}
        ></div>
      </div>

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] opacity-30"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-10">
          {/* Main Heading */}
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight">
            Why Buy When You Can
            <span className="block mt-3 bg-gradient-to-r from-gray-100 via-white to-gray-200 bg-clip-text text-transparent animate-shimmer">
              Rent & Shine?
            </span>
          </h2>

          {/* Enhanced Subheading */}
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-light">
            Experience the luxury of designer fashion without the commitment.
            <span className="block mt-2 text-white font-medium">
              From red carpet events to everyday elegance, we've got you
              covered.
            </span>
          </p>

          {/* Enhanced CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center pt-12">
            <button
              onClick={() => navigate("/productList")}
              className="group relative px-6 sm:px-10 py-4 sm:py-5 bg-white text-black font-bold text-base sm:text-lg rounded-xl overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-[0_0_40px_rgba(255,255,255,0.6)] w-auto"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Start Renting Now
                <svg
                  className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-50 via-white to-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            <button
              onClick={() => navigate("/collections")}
              className="group px-6 sm:px-10 py-4 sm:py-5 bg-transparent text-white font-bold text-base sm:text-lg rounded-xl border-2 border-white/90 hover:bg-white hover:text-black transition-all duration-300 hover:scale-110 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] w-auto"
            >
              <span className="flex items-center justify-center gap-2">
                Browse Collections
                <svg
                  className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </span>
            </button>
          </div>

          {/* Trust badge */}
          <div className="pt-8">
            <p className="text-gray-400 text-sm font-medium">
              Join thousands who choose sustainable luxury
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-shimmer {
          background-size: 200% auto;
          animation: shimmer 3s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </section>
  );
}
