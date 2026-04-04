import { ClipboardPaste, ListChecks, Download } from "lucide-react";

const steps = [
  { icon: ClipboardPaste, num: "1", title: "Cole o link", desc: "Copie o link do vídeo, Reel ou Story do Instagram e cole no campo acima." },
  { icon: ListChecks, num: "2", title: "Escolha o formato", desc: "Selecione a qualidade e o formato desejado: MP4, MP3 ou foto." },
  { icon: Download, num: "3", title: "Faça o download", desc: "Clique em Baixar e salve o conteúdo no seu dispositivo." },
];

const HowItWorks = () => {
  return (
    <section className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground text-center mb-10">
          Como Baixar do Instagram
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.num} className="text-center">
              <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full instagram-gradient mb-4">
                <step.icon className="h-7 w-7 text-primary-foreground" />
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-card border-2 border-border rounded-full flex items-center justify-center text-xs font-bold text-foreground">
                  {step.num}
                </span>
              </div>
              <h3 className="font-semibold text-foreground text-lg">{step.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
