import { useEffect, useMemo, useRef, useState } from "react";

// Auto-sliding hero carousel showing only images from assets/Hero Images in numeric order
export default function HeroCarousel() {
  // Import all hero images eagerly
  const images = useMemo(() => {
    const modules = import.meta.glob(
      "../../assets/Hero Images/*.{png,jpg,jpeg,webp}",
      {
        eager: true,
        import: "default",
      }
    );
    // Convert to [{path, url}] and sort by numeric filename
    const entries = Object.entries(modules).map(([path, url]) => ({
      path,
      url,
    }));
    const re = /(\/|\\)(\d+)\.[a-z]+$/i; // capture trailing number in filename before extension
    entries.sort((a, b) => {
      const na = parseInt(a.path.match(re)?.[2] || "0", 10);
      const nb = parseInt(b.path.match(re)?.[2] || "0", 10);
      return na - nb;
    });
    return entries.map((e) => e.url);
  }, []);

  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  // Function to go to next slide
  const nextSlide = () => {
    setIndex((prev) => (prev + 1) % images.length);
  };

  // Function to go to previous slide
  const prevSlide = () => {
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Function to go to specific slide
  const goToSlide = (slideIndex) => {
    setIndex(slideIndex);
  };

  useEffect(() => {
    if (images.length === 0) return;
    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 2000); 
    return () => clearInterval(timerRef.current);
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden" aria-label="Hero">
      {/* Mobile: auto height based on image */}
      <div className="relative w-full sm:hidden max-h-[85vh]">
        {images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={"Hero " + (i + 1)}
            className={`w-full object-cover transition-opacity duration-700 ${
              i === index ? "opacity-100" : "opacity-0 absolute inset-0"
            }`}
            style={{ maxHeight: "85vh" }}
            loading={i === 0 ? "eager" : "lazy"}
          />
        ))}

        {/* Mobile Previous Button */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 z-10"
          aria-label="Previous slide"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Mobile Next Button */}
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 z-10"
          aria-label="Next slide"
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Mobile Dot Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                i === index
                  ? "bg-white scale-125"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Desktop: fixed height with object-cover */}
      <div className="relative w-full h-[75vh] md:h-[78vh] lg:h-[88vh] hidden sm:block">
        {images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={"Hero " + (i + 1)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            loading={i === 0 ? "eager" : "lazy"}
          />
        ))}

        {/* Previous Button */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 z-10"
          aria-label="Previous slide"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Next Button */}
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 z-10"
          aria-label="Next slide"
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Dot Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                i === index
                  ? "bg-white scale-125"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
