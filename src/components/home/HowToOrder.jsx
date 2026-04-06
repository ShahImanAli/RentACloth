export default function HowToOrder() {
  const steps = [
    {
      title: "Browse",
      desc: "Explore categories and best sellers.",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
          />
        </svg>
      ),
    },
    {
      title: "Select Dates",
      desc: "Choose rental period that suits you.",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      title: "Checkout",
      desc: "Secure payment and confirmation.",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 10h18M7 15h.01M11 15h2m4 0h.01M3 6h18v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6z"
          />
        </svg>
      ),
    },
    {
      title: "Receive & Enjoy",
      desc: "We deliver on time to your door.",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 7h13v10H3zM16 7h3l2 3v7h-5zM7 17h6"
          />
        </svg>
      ),
    },
  ];

  return (
    <section className="w-full py-14 md:py-20 bg-white border-t border-gray-200">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
        <h2 className="text-center text-3xl md:text-4xl font-extrabold tracking-tight text-black mb-10">
          How to Order
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {steps.map((s) => (
            <div
              key={s.title}
              className="group relative bg-white border border-gray-200 rounded-2xl p-5 md:p-6 flex items-start gap-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-gray-300"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-900">
                  {s.icon}
                </div>
              </div>
              <div className="pr-6">
                <h3 className="text-base md:text-lg font-semibold text-black mb-1">
                  {s.title}
                </h3>
                <p className="text-sm text-gray-600">{s.desc}</p>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 group-hover:text-gray-600">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
