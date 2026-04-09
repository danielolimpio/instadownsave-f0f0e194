import { Video, Tv, Circle, LayoutGrid, Image } from "lucide-react";
import { useState } from "react";

const tabs = [
  { icon: Video, label: "Reels" },
  { icon: Tv, label: "IGTV" },
  { icon: Circle, label: "Stories" },
  { icon: LayoutGrid, label: "Feed" },
  { icon: Image, label: "Fotos" },
];

const ContentTypeTabs = () => {
  const [active, setActive] = useState(0);

  return (
    <div className="flex items-center justify-center gap-1 mt-6 sm:mt-8 px-4 overflow-x-auto scrollbar-hide">
      <div className="flex items-center gap-1 min-w-0">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              active === i
                ? "instagram-gradient text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ContentTypeTabs;
