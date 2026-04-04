import { useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import HeroSection from "@/components/HeroSection";
import URLInput from "@/components/URLInput";
import ContentTypeTabs from "@/components/ContentTypeTabs";
import FeatureCards from "@/components/FeatureCards";
import HowItWorks from "@/components/HowItWorks";
import SupportedFormats from "@/components/SupportedFormats";
import FAQSection from "@/components/FAQSection";
import AppFooter from "@/components/AppFooter";

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      <AppSidebar />

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-[280px] flex flex-col min-h-screen">
        <AppHeader onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <main className="flex-1">
          <HeroSection />
          <URLInput />
          <ContentTypeTabs />
          <FeatureCards />
          <HowItWorks />
          <SupportedFormats />
          <FAQSection />
        </main>

        <AppFooter />
      </div>
    </div>
  );
};

export default Index;
