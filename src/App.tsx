import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Reels from "./pages/Reels";
import IGTV from "./pages/IGTV";
import Stories from "./pages/Stories";
import Fotos from "./pages/Fotos";
import Downloads from "./pages/Downloads";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/baixar-reels-instagram" element={<Reels />} />
            <Route path="/baixar-igtv-instagram" element={<IGTV />} />
            <Route path="/baixar-stories-instagram" element={<Stories />} />
            <Route path="/baixar-fotos-instagram" element={<Fotos />} />
            <Route path="/downloads" element={<Downloads />} />
            {/* Legacy redirects (301-style via SPA) para preservar SEO das URLs antigas */}
            <Route path="/reels" element={<Navigate to="/baixar-reels-instagram" replace />} />
            <Route path="/igtv" element={<Navigate to="/baixar-igtv-instagram" replace />} />
            <Route path="/stories" element={<Navigate to="/baixar-stories-instagram" replace />} />
            <Route path="/fotos" element={<Navigate to="/baixar-fotos-instagram" replace />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
