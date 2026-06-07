import { Helmet } from "react-helmet-async";
import PageLayout from "@/components/PageLayout";
import { Download, Trash2, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";

interface DownloadItem {
  id: string;
  url: string;
  type: string;
  date: string;
}

const Downloads = () => {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("instasave_downloads");
    if (saved) {
      setDownloads(JSON.parse(saved));
    }
  }, []);

  const clearHistory = () => {
    localStorage.removeItem("instasave_downloads");
    setDownloads([]);
  };

  const removeItem = (id: string) => {
    const updated = downloads.filter((d) => d.id !== id);
    setDownloads(updated);
    localStorage.setItem("instasave_downloads", JSON.stringify(updated));
  };

  return (
    <PageLayout>
      <Helmet>
        <title>Histórico de Downloads - InstaSave</title>
        <meta name="description" content="Veja seu histórico de downloads do Instagram. Acesse novamente vídeos, Reels, Stories e fotos baixados recentemente." />
        <link rel="canonical" href="https://baixarvideosinstagram.com/downloads" />
        <meta property="og:title" content="Histórico de Downloads - InstaSave" />
        <meta property="og:description" content="Veja seu histórico de downloads do Instagram. Acesse novamente vídeos, Reels, Stories e fotos baixados." />
        <meta property="og:url" content="https://baixarvideosinstagram.com/downloads" />
        <meta property="og:type" content="website" />
      </Helmet>

      <section className="py-10 lg:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground text-center leading-tight">
            Histórico de <span className="instagram-gradient-text">Downloads</span>
          </h1>
          <p className="mt-4 text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto text-center">
            Veja seus downloads recentes. O histórico é salvo localmente no seu navegador para sua conveniência.
          </p>
        </div>
      </section>

      <section className="px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          {downloads.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-muted-foreground">{downloads.length} item(ns) no histórico</p>
                <button onClick={clearHistory} className="text-sm text-destructive hover:underline flex items-center gap-1">
                  <Trash2 className="h-4 w-4" /> Limpar histórico
                </button>
              </div>
              <div className="space-y-3">
                {downloads.map((item) => (
                  <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.url}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.type} • {item.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-secondary transition-colors">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                      <button onClick={() => removeItem(item.id)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary mb-6">
                <Download className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Nenhum download ainda</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Quando você baixar vídeos, Reels, Stories ou fotos do Instagram, eles aparecerão aqui para fácil acesso. O histórico é salvo automaticamente no seu navegador.
              </p>
            </div>
          )}

          <div className="mt-12 bg-card rounded-xl border border-border p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">Sobre o Histórico de Downloads</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>O histórico de downloads é armazenado localmente no seu navegador usando localStorage. Isso significa que:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-foreground">Privacidade total:</strong> Nenhum dado é enviado para nossos servidores. Seu histórico fica apenas no seu dispositivo.</li>
                <li><strong className="text-foreground">Limite de 50 itens:</strong> Armazenamos os últimos 50 downloads para manter o desempenho do navegador.</li>
                <li><strong className="text-foreground">Limpeza fácil:</strong> Você pode limpar todo o histórico a qualquer momento clicando em "Limpar histórico".</li>
                <li><strong className="text-foreground">Por dispositivo:</strong> O histórico é individual por navegador e dispositivo. Se trocar de navegador, o histórico não será transferido.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Downloads;
