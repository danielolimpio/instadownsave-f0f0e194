import { Video, Tv, Circle, Film, Image, Layers, Music, ImageIcon } from "lucide-react";

const formats = [
  { icon: Video, title: "Reels", desc: "Vídeos curtos verticais" },
  { icon: Tv, title: "IGTV", desc: "Vídeos longos" },
  { icon: Circle, title: "Stories", desc: "Conteúdo de 24 horas" },
  { icon: Film, title: "Vídeos do Feed", desc: "Vídeos do feed principal" },
  { icon: Image, title: "Fotos", desc: "Imagens em alta resolução" },
  { icon: Layers, title: "Carrossel", desc: "Múltiplas fotos e vídeos" },
  { icon: Music, title: "Áudio/MP3", desc: "Extrair áudio de vídeos" },
  { icon: ImageIcon, title: "Capas", desc: "Thumbnails e capas" },
];

const SupportedFormats = () => {
  return (
    <section className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground text-center mb-8">
          O Que Você Pode Baixar
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {formats.map((f) => (
            <div
              key={f.title}
              className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow group"
            >
              <div className="w-10 h-10 rounded-lg instagram-gradient flex items-center justify-center mb-3">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SupportedFormats;
