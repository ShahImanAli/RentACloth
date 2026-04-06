import { useMemo } from "react";

export default function SecondSectionGrid() {
  // Import images from Second Section folder
  const images = useMemo(() => {
    const modules = import.meta.glob(
      "../../assets/Second Section/*.{png,jpg,jpeg,webp}",
      {
        eager: true,
        import: "default",
      }
    );
    const entries = Object.entries(modules).map(([path, url]) => ({
      path,
      url,
    }));
    const re = /(\/|\\)(\d+)\.[a-z]+$/i;
    entries.sort((a, b) => {
      const na = parseInt(a.path.match(re)?.[2] || "0", 10);
      const nb = parseInt(b.path.match(re)?.[2] || "0", 10);
      return na - nb;
    });
    return entries.map((e) => e.url);
  }, []);

  if (images.length < 2) return null;

  const rows = [];
  for (let i = 0; i < images.length; i += 2) {
    rows.push(images.slice(i, i + 2));
  }

  return (
    <section className="w-full mt-4 sm:mt-4">
      <div className="space-y-2 sm:space-y-2">
        {rows.map((pair, idx) => (
          <div
            key={idx}
            className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2"
          >
            {pair.map((src, j) => (
              <div key={src} className="w-full overflow-hidden">
                <img
                  src={src}
                  alt={`Second Section ${idx * 2 + j + 1}`}
                  className="w-full h-64 sm:h-80 md:h-[24rem] lg:h-[28rem] xl:h-[32rem] object-cover"
                  loading={idx === 0 && j === 0 ? "eager" : "lazy"}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
