import { Helmet } from "react-helmet-async";
import PageLayout from "@/components/PageLayout";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const Configuracoes = () => {
  const [quality, setQuality] = useState("1080p");
  const [format, setFormat] = useState("mp4");
  const [autoDetect, setAutoDetect] = useState(true);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("instasave_settings");
    if (saved) {
      const settings = JSON.parse(saved);
      setQuality(settings.quality || "1080p");
      setFormat(settings.format || "mp4");
      setAutoDetect(settings.autoDetect ?? true);
      setNotifications(settings.notifications ?? true);
    }
  }, []);

  const saveSettings = () => {
    const settings = { quality, format, autoDetect, notifications };
    localStorage.setItem("instasave_settings", JSON.stringify(settings));
    toast.success("Configurações salvas com sucesso!");
  };

  const clearAllData = () => {
    localStorage.removeItem("instasave_downloads");
    localStorage.removeItem("instasave_settings");
    toast.success("Todos os dados foram limpos!");
  };

  return (
    <PageLayout>
      <Helmet>
        <title>Configurações - InstaSave</title>
        <meta name="description" content="Configure suas preferências de download do Instagram. Escolha qualidade padrão, formato e outras opções." />
        <link rel="canonical" href="https://baixarvideosinstagram.com/configuracoes" />
      </Helmet>

      <section className="py-10 lg:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground text-center leading-tight">
            <span className="instagram-gradient-text">Configurações</span>
          </h1>
          <p className="mt-4 text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto text-center">
            Personalize suas preferências de download e configure a ferramenta do seu jeito.
          </p>
        </div>
      </section>

      <section className="px-4 pb-12">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Quality */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Qualidade Padrão de Download</h2>
            <p className="text-sm text-muted-foreground mb-4">Escolha a qualidade padrão para downloads de vídeo. Você pode alterar a qualidade individualmente em cada download.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {["360p", "480p", "720p", "1080p"].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${quality === q ? "instagram-gradient text-primary-foreground" : "bg-secondary text-foreground hover:bg-muted"}`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Formato Padrão</h2>
            <p className="text-sm text-muted-foreground mb-4">Selecione o formato preferido para downloads.</p>
            <div className="grid grid-cols-3 gap-3">
              {["mp4", "mp3", "jpg"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`py-2 px-4 rounded-lg text-sm font-medium uppercase transition-all ${format === f ? "instagram-gradient text-primary-foreground" : "bg-secondary text-foreground hover:bg-muted"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground mb-2">Preferências</h2>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-foreground">Detecção automática de links</p>
                <p className="text-xs text-muted-foreground">Detectar automaticamente links do Instagram na área de transferência</p>
              </div>
              <button
                onClick={() => setAutoDetect(!autoDetect)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoDetect ? "instagram-gradient" : "bg-muted"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${autoDetect ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-foreground">Notificações</p>
                <p className="text-xs text-muted-foreground">Mostrar notificações quando o download for concluído</p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications ? "instagram-gradient" : "bg-muted"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${notifications ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </label>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={saveSettings} className="flex-1 h-12 instagram-gradient text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-opacity">
              Salvar Configurações
            </button>
            <button onClick={clearAllData} className="flex-1 h-12 border border-destructive text-destructive font-bold rounded-lg hover:bg-destructive/10 transition-colors">
              Limpar Todos os Dados
            </button>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">Sobre o InstaSave</h2>
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong className="text-foreground">Versão:</strong> 1.0.0</p>
              <p><strong className="text-foreground">Site:</strong> baixarvideosinstagram.com</p>
              <p>O InstaSave é uma ferramenta gratuita para baixar vídeos, Reels, Stories e fotos do Instagram sem marca d'água. Não somos afiliados ao Instagram ou Meta Platforms, Inc.</p>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Configuracoes;
