import { Home, Video, Tv, Circle, Image, Download, Settings, Camera } from "lucide-react";
import { useState } from "react";

const navItems = [
  { icon: Home, label: "Início", active: true },
  { icon: Video, label: "Reels" },
  { icon: Tv, label: "IGTV" },
  { icon: Circle, label: "Stories" },
  { icon: Image, label: "Fotos" },
  { icon: Download, label: "Downloads" },
  { icon: Settings, label: "Configurações" },
];

const AppSidebar = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[280px] bg-card border-r border-border z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="instagram-gradient rounded-xl p-2">
          <Camera className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold instagram-gradient-text">InstaSave</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item, index) => (
          <button
            key={item.label}
            onClick={() => setActiveIndex(index)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 group ${
              activeIndex === index
                ? "instagram-gradient text-primary-foreground"
                : "text-foreground hover:bg-secondary"
            }`}
          >
            <item.icon className={`h-5 w-5 ${activeIndex === index ? "" : "text-muted-foreground group-hover:text-foreground"}`} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-6 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">InstaSave v1.0</p>
        <p className="text-xs text-muted-foreground">© 2024 Todos os direitos reservados</p>
      </div>
    </aside>
  );
};

export default AppSidebar;
