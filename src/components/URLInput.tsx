import { useState } from "react";
import { Link, ClipboardPaste, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

const URLInput = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = () => {
    if (!url.trim()) {
      toast.error("Cole um link do Instagram para continuar.");
      return;
    }
    if (!isValidInstagramUrl(url)) {
      toast.error("Link inválido. Verifique e tente novamente.");
      return;
    }
    setLoading(true);
    // Simulate processing
    setTimeout(() => {
      setLoading(false);
      toast.success("Vídeo pronto para download!");
    }, 2000);
  };

  return (
    <div className="max-w-[700px] mx-auto px-4">
      {/* Input */}
      <div className="relative flex items-center bg-card rounded-lg border border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
        <Link className="absolute left-4 h-5 w-5 text-muted-foreground" />
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Cole o link do Instagram aqui..."
          className="w-full h-14 pl-12 pr-24 bg-transparent text-foreground placeholder:text-muted-foreground text-base outline-none rounded-lg"
        />
        <button
          onClick={handlePaste}
          className="absolute right-3 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-secondary rounded-md transition-colors"
        >
          <ClipboardPaste className="h-4 w-4" />
          Colar
        </button>
      </div>

      {/* Download button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-4 w-full h-14 instagram-gradient text-primary-foreground font-bold text-base rounded-lg flex items-center justify-center gap-2 gradient-shadow hover:opacity-90 transition-opacity disabled:opacity-70"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Download className="h-5 w-5" />
        )}
        {loading ? "Processando..." : "Baixar Agora"}
      </button>
    </div>
  );
};

export default URLInput;
