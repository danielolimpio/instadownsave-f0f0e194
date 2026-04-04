import { CheckCircle, Star, Infinity, Gift, Zap } from "lucide-react";

const features = [
  { icon: CheckCircle, title: "Sem Marca d'Água", desc: "Vídeos limpos e originais" },
  { icon: Star, title: "Alta Qualidade", desc: "Até 1080p Full HD" },
  { icon: Infinity, title: "Download Ilimitado", desc: "Sem limite de downloads" },
  { icon: Gift, title: "100% Grátis", desc: "Sem cadastro necessário" },
  { icon: Zap, title: "Rápido", desc: "Download instantâneo" },
];

const FeatureCards = () => {
  return (
    <section className="py-12 px-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
        {features.map((f) => (
          <div
            key={f.title}
            className="bg-card rounded-xl border border-border p-5 text-center hover:shadow-lg transition-shadow duration-300 group"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full instagram-gradient mb-3">
              <f.icon className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeatureCards;
