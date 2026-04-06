export default function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-black py-16 sm:py-20 md:py-24 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-gray-900 to-black opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 md:mb-8 tracking-tight leading-tight">
              About RentACloth
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed px-2">
              Your premier destination for premium fashion rentals - wear
              designer clothes without the commitment
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Our Story Section */}
        <div className="mb-16 sm:mb-20 lg:mb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <div className="group">
              <div className="flex items-center mb-6 sm:mb-8">
                <div className="w-1 h-8 sm:h-10 lg:h-12 bg-black mr-4 sm:mr-6"></div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black">
                  Our Story
                </h2>
              </div>
              <div className="space-y-4 sm:space-y-6 text-gray-700">
                <div className="relative pl-6 sm:pl-8 border-l-2 border-gray-200">
                  <div className="absolute w-3 h-3 sm:w-4 sm:h-4 bg-black rounded-full -left-1.5 sm:-left-2 top-1 sm:top-2"></div>
                  <p className="text-base sm:text-lg leading-relaxed">
                    Founded in 2018, RentACloth revolutionized the fashion
                    industry with a simple yet powerful idea: everyone deserves
                    access to designer clothing without the hefty price tag. We
                    believe fashion should be sustainable, accessible, and fun.
                  </p>
                </div>
                <div className="relative pl-6 sm:pl-8 border-l-2 border-gray-200">
                  <div className="absolute w-3 h-3 sm:w-4 sm:h-4 bg-gray-400 rounded-full -left-1.5 sm:-left-2 top-1 sm:top-2"></div>
                  <p className="text-base sm:text-lg leading-relaxed">
                    Today, we're the leading clothing rental platform, serving
                    fashion enthusiasts who want to look their best for every
                    occasion. From wedding guests to business professionals, our
                    curated collection ensures you always have the perfect
                    outfit.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 sm:p-8 lg:p-10 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 mt-8 lg:mt-0">
              <h3 className="text-xl sm:text-2xl font-bold text-black mb-6 sm:mb-8 text-center">
                Our Impact
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                <div className="text-center group cursor-pointer">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-200">
                    15,000+
                  </div>
                  <div className="text-gray-600 font-medium text-sm sm:text-base">
                    Happy Renters
                  </div>
                  <div className="w-full h-1.5 sm:h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-black rounded-full w-4/5 group-hover:w-full transition-all duration-1000"></div>
                  </div>
                </div>
                <div className="text-center group cursor-pointer">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-200">
                    5,000+
                  </div>
                  <div className="text-gray-600 font-medium text-sm sm:text-base">
                    Designer Pieces
                  </div>
                  <div className="w-full h-1.5 sm:h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-black rounded-full w-3/5 group-hover:w-full transition-all duration-1000"></div>
                  </div>
                </div>
                <div className="text-center group cursor-pointer">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-200">
                    7
                  </div>
                  <div className="text-gray-600 font-medium text-sm sm:text-base">
                    Years of Fashion
                  </div>
                  <div className="w-full h-1.5 sm:h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-black rounded-full w-2/3 group-hover:w-full transition-all duration-1000"></div>
                  </div>
                </div>
                <div className="text-center group cursor-pointer">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-200">
                    4.9/5
                  </div>
                  <div className="text-gray-600 font-medium text-sm sm:text-base">
                    Customer Rating
                  </div>
                  <div className="w-full h-1.5 sm:h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-black rounded-full w-5/6 group-hover:w-full transition-all duration-1000"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16 sm:mb-20 lg:mb-24">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-4 sm:mb-6 px-4">
              Why Choose RentACloth
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              The values that make fashion rental simple and sustainable
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            <div className="text-center group hover:bg-gray-50 p-8 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl cursor-pointer border border-gray-100">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-black text-white rounded-2xl mx-auto flex items-center justify-center group-hover:bg-gray-800 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110">
                  <svg
                    className="w-10 h-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <div className="absolute inset-0 w-20 h-20 mx-auto bg-black/10 rounded-2xl scale-110 group-hover:scale-125 transition-transform duration-300 -z-10"></div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-black mb-3 sm:mb-4 group-hover:text-gray-800 transition-colors">
                Sustainable Fashion
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Reduce fashion waste by renting instead of buying - wear more,
                own less, help the planet
              </p>
              <div className="mt-4 sm:mt-6 flex justify-center">
                <div className="w-12 sm:w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="w-0 h-full bg-black rounded-full group-hover:w-full transition-all duration-500"></div>
                </div>
              </div>
            </div>
            <div className="text-center group hover:bg-gray-50 p-8 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl cursor-pointer border border-gray-100">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-black text-white rounded-2xl mx-auto flex items-center justify-center group-hover:bg-gray-800 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110">
                  <svg
                    className="w-10 h-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <div className="absolute inset-0 w-20 h-20 mx-auto bg-black/10 rounded-2xl scale-110 group-hover:scale-125 transition-transform duration-300 -z-10"></div>
              </div>
              <h3 className="text-xl font-bold text-black mb-4 group-hover:text-gray-800 transition-colors">
                Affordable Luxury
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Access designer brands at a fraction of the retail price -
                luxury made accessible for everyone
              </p>
              <div className="mt-6 flex justify-center">
                <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="w-0 h-full bg-black rounded-full group-hover:w-full transition-all duration-500 delay-100"></div>
                </div>
              </div>
            </div>
            <div className="text-center group hover:bg-gray-50 p-8 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl cursor-pointer border border-gray-100">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-black text-white rounded-2xl mx-auto flex items-center justify-center group-hover:bg-gray-800 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110">
                  <svg
                    className="w-10 h-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="absolute inset-0 w-20 h-20 mx-auto bg-black/10 rounded-2xl scale-110 group-hover:scale-125 transition-transform duration-300 -z-10"></div>
              </div>
              <h3 className="text-xl font-bold text-black mb-4 group-hover:text-gray-800 transition-colors">
                Perfect Fit Guarantee
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Professional cleaning and quality checks ensure every piece
                looks and feels perfect when it arrives
              </p>
              <div className="mt-6 flex justify-center">
                <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="w-0 h-full bg-black rounded-full group-hover:w-full transition-all duration-500 delay-200"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How We Work Section */}
        <div className="mb-16 sm:mb-20 lg:mb-24 bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 lg:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 sm:w-48 lg:w-64 h-32 sm:h-48 lg:h-64 bg-black/5 rounded-full -translate-y-16 sm:-translate-y-24 lg:-translate-y-32 translate-x-16 sm:translate-x-24 lg:translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-gray-100 rounded-full translate-y-24 sm:translate-y-36 lg:translate-y-48 -translate-x-24 sm:-translate-x-36 lg:-translate-x-48"></div>
          <div className="relative z-10">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-4 sm:mb-6">
                How Rental Works
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
                Rent designer fashion in 4 simple steps - it's that easy!
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 relative">
              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-6 sm:top-8 left-8 sm:left-12 right-8 sm:right-12 h-0.5 bg-gray-200"></div>

              <div className="text-center group cursor-pointer">
                <div className="relative mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-black text-white rounded-2xl mx-auto mb-3 sm:mb-4 flex items-center justify-center font-bold text-lg sm:text-xl group-hover:bg-gray-800 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 relative z-10">
                    1
                  </div>
                  <div className="absolute inset-0 w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-black/20 rounded-2xl scale-125 group-hover:scale-150 transition-transform duration-300 -z-10"></div>
                </div>
                <h4 className="font-bold text-black mb-2 sm:mb-3 text-base sm:text-lg group-hover:text-gray-800 transition-colors">
                  Browse & Select
                </h4>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Choose from our curated collection of designer pieces for any
                  occasion
                </p>
                <div className="mt-4 w-8 h-1 bg-gray-200 mx-auto rounded-full overflow-hidden">
                  <div className="w-0 h-full bg-black rounded-full group-hover:w-full transition-all duration-500"></div>
                </div>
              </div>

              <div className="text-center group cursor-pointer">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-black text-white rounded-2xl mx-auto mb-4 flex items-center justify-center font-bold text-xl group-hover:bg-gray-800 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 relative z-10">
                    2
                  </div>
                  <div className="absolute inset-0 w-16 h-16 mx-auto bg-black/20 rounded-2xl scale-125 group-hover:scale-150 transition-transform duration-300 -z-10"></div>
                </div>
                <h4 className="font-bold text-black mb-3 text-lg group-hover:text-gray-800 transition-colors">
                  Book Your Dates
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  Select your rental period and we'll deliver it fresh and
                  perfectly cleaned
                </p>
                <div className="mt-4 w-8 h-1 bg-gray-200 mx-auto rounded-full overflow-hidden">
                  <div className="w-0 h-full bg-black rounded-full group-hover:w-full transition-all duration-500 delay-100"></div>
                </div>
              </div>

              <div className="text-center group cursor-pointer">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-black text-white rounded-2xl mx-auto mb-4 flex items-center justify-center font-bold text-xl group-hover:bg-gray-800 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 relative z-10">
                    3
                  </div>
                  <div className="absolute inset-0 w-16 h-16 mx-auto bg-black/20 rounded-2xl scale-125 group-hover:scale-150 transition-transform duration-300 -z-10"></div>
                </div>
                <h4 className="font-bold text-black mb-3 text-lg group-hover:text-gray-800 transition-colors">
                  Wear & Enjoy
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  Look amazing at your event - no dry cleaning or maintenance
                  required
                </p>
                <div className="mt-4 w-8 h-1 bg-gray-200 mx-auto rounded-full overflow-hidden">
                  <div className="w-0 h-full bg-black rounded-full group-hover:w-full transition-all duration-500 delay-200"></div>
                </div>
              </div>

              <div className="text-center group cursor-pointer">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-black text-white rounded-2xl mx-auto mb-4 flex items-center justify-center font-bold text-xl group-hover:bg-gray-800 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 relative z-10">
                    4
                  </div>
                  <div className="absolute inset-0 w-16 h-16 mx-auto bg-black/20 rounded-2xl scale-125 group-hover:scale-150 transition-transform duration-300 -z-10"></div>
                </div>
                <h4 className="font-bold text-black mb-3 text-lg group-hover:text-gray-800 transition-colors">
                  Return Easy
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  Send it back with our prepaid shipping label - simple and
                  hassle-free
                </p>
                <div className="mt-4 w-8 h-1 bg-gray-200 mx-auto rounded-full overflow-hidden">
                  <div className="w-0 h-full bg-black rounded-full group-hover:w-full transition-all duration-500 delay-300"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="text-center">
          <div className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-4 sm:mb-6 px-4">
              Need Help?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Our fashion experts are here to help you find the perfect rental
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <div className="group bg-white border-2 border-gray-100 rounded-2xl p-8 hover:border-black hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-300 group-hover:scale-110">
                  <svg
                    className="w-8 h-8 text-gray-600 group-hover:text-white transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="absolute inset-0 w-16 h-16 mx-auto bg-gray-200/50 rounded-2xl scale-125 group-hover:scale-150 transition-transform duration-300 -z-10"></div>
              </div>
              <h3 className="font-bold text-black mb-2 sm:mb-3 text-lg sm:text-xl group-hover:text-gray-800 transition-colors">
                Email Support
              </h3>
              <p className="text-gray-600 mb-2 sm:mb-3 font-medium text-sm sm:text-base">
                help@rentacloth.com
              </p>
              <div className="bg-gray-50 group-hover:bg-black group-hover:text-white rounded-lg px-3 sm:px-4 py-2 transition-all duration-300">
                <p className="text-xs sm:text-sm">Response within 4 hours</p>
              </div>
              <div className="mt-4 w-12 h-1 bg-gray-200 mx-auto rounded-full overflow-hidden">
                <div className="w-0 h-full bg-black rounded-full group-hover:w-full transition-all duration-500"></div>
              </div>
            </div>

            <div className="group bg-white border-2 border-gray-100 rounded-2xl p-8 hover:border-black hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-300 group-hover:scale-110">
                  <svg
                    className="w-8 h-8 text-gray-600 group-hover:text-white transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <div className="absolute inset-0 w-16 h-16 mx-auto bg-gray-200/50 rounded-2xl scale-125 group-hover:scale-150 transition-transform duration-300 -z-10"></div>
              </div>
              <h3 className="font-bold text-black mb-3 text-xl group-hover:text-gray-800 transition-colors">
                Style Chat
              </h3>
              <p className="text-gray-600 mb-3 font-medium">
                Personal styling advice
              </p>
              <div className="bg-gray-50 group-hover:bg-black group-hover:text-white rounded-lg px-4 py-2 transition-all duration-300">
                <p className="text-sm">Available during business hours</p>
              </div>
              <div className="mt-4 w-12 h-1 bg-gray-200 mx-auto rounded-full overflow-hidden">
                <div className="w-0 h-full bg-black rounded-full group-hover:w-full transition-all duration-500 delay-100"></div>
              </div>
            </div>

            <div className="group bg-white border-2 border-gray-100 rounded-2xl p-8 hover:border-black hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer md:col-span-2 lg:col-span-1">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-300 group-hover:scale-110">
                  <svg
                    className="w-8 h-8 text-gray-600 group-hover:text-white transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <div className="absolute inset-0 w-16 h-16 mx-auto bg-gray-200/50 rounded-2xl scale-125 group-hover:scale-150 transition-transform duration-300 -z-10"></div>
              </div>
              <h3 className="font-bold text-black mb-3 text-xl group-hover:text-gray-800 transition-colors">
                Phone Support
              </h3>
              <p className="text-gray-600 mb-3 font-medium">1-800-RENTALS</p>
              <div className="bg-gray-50 group-hover:bg-black group-hover:text-white rounded-lg px-4 py-2 transition-all duration-300">
                <p className="text-sm">Mon-Sat, 9 AM - 8 PM EST</p>
              </div>
              <div className="mt-4 w-12 h-1 bg-gray-200 mx-auto rounded-full overflow-hidden">
                <div className="w-0 h-full bg-black rounded-full group-hover:w-full transition-all duration-500 delay-200"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
