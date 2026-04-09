import { Bell, User, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

interface AppHeaderProps {
  onMenuToggle?: () => void;
}

const AppHeader = ({ onMenuToggle }: AppHeaderProps) => {
  return (
    <header className="sticky top-0 z-30 h-[60px] bg-card border-b border-border flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors">
          <Menu className="h-5 w-5 text-foreground" />
        </button>
        <Link to="/" className="flex items-center gap-2 lg:hidden">
          <img src={logo} alt="Baixar Vídeos Instagram" className="h-8 w-8 rounded-lg" />
          <span className="text-lg font-bold instagram-gradient-text">InstaSave</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-full hover:bg-secondary transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </button>
        <button className="p-2 rounded-full hover:bg-secondary transition-colors">
          <User className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
