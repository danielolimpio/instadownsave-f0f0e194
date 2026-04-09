import { Home, Video, Tv, Circle, Image, Download, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";

const navItems = [
  { icon: Home, label: "Início", path: "/" },
  { icon: Video, label: "Reels", path: "/reels" },
  { icon: Tv, label: "IGTV", path: "/igtv" },
  { icon: Circle, label: "Stories", path: "/stories" },
  { icon: Image, label: "Fotos", path: "/fotos" },
  { icon: Download, label: "Downloads", path: "/downloads" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[280px] bg-card border-r border-border z-40">
      <Link to="/" className="flex items-center gap-3 px-6 py-6">
        <img src={logo} alt="Baixar Vídeos Instagram" className="h-10 w-10 rounded-xl" />
        <span className="text-xl font-bold instagram-gradient-text">InstaSave</span>
      </Link>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 group ${
                isActive
                  ? "instagram-gradient text-primary-foreground"
                  : "text-foreground hover:bg-secondary"
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "" : "text-muted-foreground group-hover:text-foreground"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">InstaSave v1.0</p>
        <p className="text-xs text-muted-foreground">© 2024 Todos os direitos reservados</p>
      </div>
    </aside>
  );
};

export default AppSidebar;
