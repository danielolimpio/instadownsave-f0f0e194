import { useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout = ({ children }: PageLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <AppSidebar />
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <div className="flex-1 lg:ml-[280px] flex flex-col min-h-screen w-full overflow-x-hidden">
        <AppHeader onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="flex-1">{children}</main>
        <AppFooter />
      </div>
    </div>
  );
};

export default PageLayout;
