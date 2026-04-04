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
    <div className="flex items-center justify-center gap-1 mt-8 px-4">
      {tabs.map((tab, i) => (
        <button
          key={tab.label}
          onClick={() => setActive(i)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
            active === i
              ? "instagram-gradient text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          <tab.icon className="h-4 w-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default ContentTypeTabs;
