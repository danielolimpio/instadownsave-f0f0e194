import { useState } from "react";
import { Link, ClipboardPaste, Download, Loader2, Image, Film, X, Trash2 } from "lucide-react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface MediaItem {
  url: string;
  type: "video" | "image";
  thumbnail?: string;
  filename: string;
}

const getInvokeErrorMessage = async (error: unknown) => {
  if (error instanceof FunctionsHttpError && error.context instanceof Response) {
    try {
      const payload = await error.context.clone().json();
      if (payload && typeof payload === "object" && typeof payload.error === "string") {
        return payload.error;
      }
    } catch {
      try {
        const text = await error.context.clone().text();
        if (text.trim()) return text;
      } catch {
        return error.message;
      }
    }
  }

  return error instanceof Error ? error.message : "Erro ao processar o link. Tente novamente.";
};

const URLInput = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [downloading, setDownloading] = useState<Record<number, boolean>>({});

  const isValidInstagramUrl = (value: string) => {
    return /instagram\.com\/(p|reel|reels|tv|stories)\//i.test(value);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      if (isValidInstagramUrl(text)) {
        toast.success("Link do Instagram detectado!");
      }
    } catch {
      toast.error("Não foi possível acessar a área de transferência.");
    }
  };

  const handleClear = () => {
    setUrl("");
    setMediaItems([]);
  };

  const handleSubmit = async () => {
    if (!url.trim()) {
      toast.error("Cole um link do Instagram para continuar.");
      return;
    }
    if (!isValidInstagramUrl(url)) {
      toast.error("Link inválido. Verifique e tente novamente.");
      return;
    }

    setLoading(true);
    setMediaItems([]);

    try {
      const { data, error } = await supabase.functions.invoke("instagram-download", {
        body: { url: url.trim() },
      });

      if (error) {
        throw new Error(error.message || "Erro ao processar o link.");
      }

      if (!data?.success || !data?.items?.length) {
        throw new Error(data?.error || "Não foi possível encontrar mídia neste link.");
      }

      setMediaItems(data.items);
      toast.success(`${data.items.length} arquivo(s) encontrado(s)!`);
    } catch (err) {
      console.error("Error:", err);
      toast.error(await getInvokeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (item: MediaItem, index: number) => {
    setDownloading((prev) => ({ ...prev, [index]: true }));

    try {
      const { data, error } = await supabase.functions.invoke("instagram-proxy", {
        body: { url: item.url, filename: item.filename },
      });

      if (error) throw new Error("Erro ao baixar o arquivo.");

      const blob = data instanceof Blob ? data : new Blob([data]);
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = item.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      toast.success("Download iniciado!");
    } catch (err: any) {
      console.error("Download error:", err);
      toast.error(err.message || "Erro ao baixar. Tente novamente.");
    } finally {
      setDownloading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const clearResults = () => {
    setMediaItems([]);
    setUrl("");
  };

  return (
    <div className="max-w-[700px] mx-auto px-4">
      {/* Input */}
      <div className="relative flex items-center bg-card rounded-lg border border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
        <Link className="absolute left-3 sm:left-4 h-5 w-5 text-muted-foreground" />
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Cole o link do Instagram aqui..."
          className="w-full h-12 sm:h-14 pl-10 sm:pl-12 pr-28 sm:pr-36 bg-transparent text-foreground placeholder:text-muted-foreground text-sm sm:text-base outline-none rounded-lg"
        />
        <div className="absolute right-2 sm:right-3 flex items-center gap-1">
          {url && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              title="Limpar"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          )}
          <button
            onClick={handlePaste}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-sm font-medium text-primary hover:bg-secondary rounded-md transition-colors"
          >
            <ClipboardPaste className="h-4 w-4" />
            <span className="hidden sm:inline">Colar</span>
          </button>
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-3 sm:mt-4 w-full h-12 sm:h-14 instagram-gradient text-primary-foreground font-bold text-sm sm:text-base rounded-lg flex items-center justify-center gap-2 gradient-shadow hover:opacity-90 transition-opacity disabled:opacity-70"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Download className="h-5 w-5" />
        )}
        {loading ? "Processando..." : "Baixar Agora"}
      </button>

      {/* Results */}
      {mediaItems.length > 0 && (
        <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">
              {mediaItems.length} arquivo(s) encontrado(s)
            </h3>
            <button
              onClick={clearResults}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-3">
            {mediaItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-card rounded-lg border border-border"
              >
                {/* Thumbnail / Icon */}
                <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : item.type === "video" ? (
                    <Film className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                  ) : (
                    <Image className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                    {item.filename}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    {item.type === "video" ? (
                      <>
                        <Film className="h-3 w-3" /> Vídeo
                      </>
                    ) : (
                      <>
                        <Image className="h-3 w-3" /> Imagem
                      </>
                    )}
                  </p>
                </div>

                {/* Download button */}
                <button
                  onClick={() => handleDownload(item, index)}
                  disabled={downloading[index]}
                  className="flex-shrink-0 instagram-gradient text-primary-foreground px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 hover:opacity-90 transition-opacity disabled:opacity-70"
                >
                  {downloading[index] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{downloading[index] ? "..." : "Baixar"}</span>
                </button>
              </div>
            ))}
          </div>

          {/* Download all */}
          {mediaItems.length > 1 && (
            <button
              onClick={() => mediaItems.forEach((item, i) => handleDownload(item, i))}
              className="w-full py-3 border border-primary text-primary rounded-lg font-semibold text-sm hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Baixar Todos ({mediaItems.length} arquivos)
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default URLInput;
