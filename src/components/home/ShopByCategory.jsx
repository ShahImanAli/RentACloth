import { Link } from "react-router-dom";

const categories = [
  {
    id: "men",
    label: "Men",
    image:
      "https://images.unsplash.com/photo-1740362308272-7f17ea68dd1b?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDE0fHx8ZW58MHx8fHx8&auto=format&fit=crop&q=60&w=500", // Stylish men clothing
    to: "/men",
  },
  {
    id: "women",
    label: "Women",
    image:
      "https://images.unsplash.com/photo-1733311156460-bb9cce46b106?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDN8fHxlbnwwfHx8fHw%3D&auto=format&fit=crop&q=60&w=500", // Trendy women clothing
    to: "/women",
  },
  {
    id: "kids",
    label: "Kids",
    image:
      "https://images.unsplash.com/photo-1632232963262-0e5cd712d44c?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D&auto=format&fit=crop&q=60&w=500", // Fun kids clothing
    to: "/kids",
  },
];

export default function ShopByCategory() {
  return (
    <section className="w-full py-10 md:py-14">
      <div className="w-full px-2 sm:px-3 md:px-4 lg:px-6">
        <h2 className="text-center text-3xl md:text-4xl font-extrabold tracking-tight text-black mb-8">
          Shop by Category
        </h2>
        <div className="grid grid-cols-3 gap-6 sm:gap-8 md:gap-12 lg:gap-16">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={c.to}
              className="flex flex-col items-center group"
            >
              <div className="w-full sm:w-11/12 md:w-full lg:w-full aspect-square mx-auto rounded-full overflow-hidden ring-2 ring-gray-200 group-hover:ring-black transition-all duration-300">
                <img
                  src={c.image}
                  alt={c.label}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="mt-5 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 group-hover:text-black transition-all">
                {c.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
