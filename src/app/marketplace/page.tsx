"use client";

export const dynamic = "force-dynamic";


import { useState } from "react";
import Header from "@/components/Header";
import BrandStories from "@/components/BrandStories";
import TrendingTicker from "@/components/TrendingTicker";
import TrendingNowBanner from "@/components/TrendingNowBanner";
import UrgencyBanner from "@/components/UrgencyBanner";
import PromoCodeBanner from "@/components/PromoCodeBanner";
import HeroCarousel from "@/components/HeroCarousel";
import TrustBadges from "@/components/TrustBadges";
import CategoriesSection from "@/components/CategoriesSection";
import CollectionsSection from "@/components/CollectionsSection";
import TodaySteals from "@/components/TodaySteals";
import BrandCarousel from "@/components/BrandCarousel";
import DealsSection from "@/components/DealsSection";
import Testimonials from "@/components/Testimonials";
import EditorsPicks from "@/components/EditorsPicks";
import ShopByMovement from "@/components/ShopByMovement";
import Community from "@/components/Community";
import FAQ from "@/components/FAQ";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import WishlistSheet from "@/components/WishlistSheet";
import ProductModal from "@/components/ProductModal";
import SearchModal from "@/components/SearchModal";
import CheckoutModal from "@/components/CheckoutModal";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import LiveChatWidget from "@/components/LiveChatWidget";
import BackToTop from "@/components/BackToTop";
import RecentlyViewed from "@/components/RecentlyViewed";
import CompareProducts from "@/components/CompareProducts";
import { addToRecentlyViewed } from "@/components/RecentlyViewed";
import { Product } from "@/types/product";
import AIStylist from "@/components/AIStylist";
import ProblemAlignment from "@/components/ProblemAlignment";

export default function Home() {
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleProductClick = (product: Product) => {
    addToRecentlyViewed(product);
    setSelectedProduct(product);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onCartOpen={() => setCartOpen(true)}
        onWishlistOpen={() => setWishlistOpen(true)}
        onSearchOpen={() => setSearchOpen(true)}
      />
      
      <main id="main-content" tabIndex={-1} className="outline-none">
        <BrandStories />
        <UrgencyBanner />
        <TrendingTicker />
        <TrendingNowBanner />
        <HeroCarousel />
        <ProblemAlignment />
        <PromoCodeBanner />
        <TrustBadges />
        <CategoriesSection />
        <CollectionsSection />
        <TodaySteals onProductClick={handleProductClick} />
        <BrandCarousel />
        <DealsSection onProductClick={handleProductClick} />
        <Testimonials />
        <EditorsPicks />
        <ShopByMovement />
        <RecentlyViewed onProductClick={handleProductClick} />
        <Community />
        <FAQ />
        <Newsletter />
      </main>

      <Footer />

      {/* Modals and Sheets */}
      <ShoppingCart
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => setCheckoutOpen(true)}
      />
      <WishlistSheet
        open={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        onProductClick={handleProductClick}
      />
      <ProductModal
        product={selectedProduct}
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onProductSelect={handleProductClick}
      />
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />

      {/* Conversion Optimization Components */}
      <ExitIntentPopup />
      <LiveChatWidget />
      <BackToTop />
      <CompareProducts onProductClick={handleProductClick} />
      <AIStylist />
    </div>
  );
}