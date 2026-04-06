import HeroCarousel from "../components/home/HeroCarousel.jsx";
import SecondSectionGrid from "../components/home/SecondSectionGrid.jsx";
import ShopByCategory from "../components/home/ShopByCategory.jsx";
import TrendingNow from "../components/home/TrendingNow.jsx";
import BestSellingCarousel from "../components/home/BestSellingCarousel.jsx";
import CallToActionBanner from "../components/home/CallToActionBanner.jsx";
import FAQ from "../components/home/FAQ.jsx";
import HowToOrder from "../components/home/HowToOrder.jsx";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <HeroCarousel />
      <SecondSectionGrid />
      <TrendingNow />
      <ShopByCategory />
      <BestSellingCarousel />
      <CallToActionBanner />
      <FAQ />
      <HowToOrder />
    </div>
  );
}
