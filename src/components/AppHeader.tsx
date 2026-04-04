import { Bell, User, Menu, Camera } from "lucide-react";

interface AppHeaderProps {
  onMenuToggle?: () => void;
}

const AppHeader = ({ onMenuToggle }: AppHeaderProps) => {
  return (
    <header className="sticky top-0 z-30 h-[60px] bg-card border-b border-border flex items-center justify-between px-4 lg:px-8">
      {/* Mobile logo + hamburger */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors">
          <Menu className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex items-center gap-2 lg:hidden">
          <div className="instagram-gradient rounded-lg p-1.5">
            <Camera className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold instagram-gradient-text">InstaSave</span>
        </div>
      </div>

      {/* Right actions */}
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
