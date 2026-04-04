import { Helmet } from "react-helmet-async";
import PageLayout from "@/components/PageLayout";
import URLInput from "@/components/URLInput";

const Fotos = () => {
  return (
    <PageLayout>
      <Helmet>
        <title>Baixar Fotos do Instagram em Alta Resolução - InstaSave</title>
        <meta name="description" content="Baixe fotos do Instagram em resolução original. Salve imagens de posts, carrossel e perfil em alta qualidade sem perda de qualidade." />
        <link rel="canonical" href="https://baixarvideosinstagram.com/fotos" />
        <meta property="og:title" content="Baixar Fotos do Instagram em Alta Resolução" />
        <meta property="og:description" content="Salve fotos do Instagram em qualidade original. Download de posts, carrosséis e fotos de perfil." />
        <meta property="og:url" content="https://baixarvideosinstagram.com/fotos" />
      </Helmet>

      <section className="py-10 lg:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground text-center leading-tight">
            Baixar <span className="instagram-gradient-text">Fotos do Instagram</span>
          </h1>
          <p className="mt-4 text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto text-center">
            Salve fotos do Instagram em resolução original. Download de posts individuais, carrosséis completos e fotos de perfil em alta qualidade.
          </p>
        </div>
      </section>

      <URLInput />

      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Download de Fotos em Alta Resolução</h2>
              <p className="text-muted-foreground mb-4">
                O Instagram comprime automaticamente as fotos enviadas pelos usuários, reduzindo a qualidade. Nossa ferramenta busca a versão com a maior resolução disponível, garantindo que você obtenha a melhor qualidade possível.
              </p>
              <p className="text-muted-foreground mb-4">
                Suportamos o download de todos os tipos de imagens do Instagram: fotos individuais do feed, todas as imagens de um carrossel (post com múltiplas fotos), fotos de perfil em tamanho completo e imagens de Stories.
              </p>
              <p className="text-muted-foreground">
                As fotos são baixadas em formato JPEG com a resolução original, normalmente 1080x1080 pixels para fotos quadradas ou até 1080x1350 para fotos verticais.
              </p>
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg">
              <img src="/images/instagram-smartphone.png" alt="Fotos do Instagram em smartphone" className="w-full h-auto" loading="lazy" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-8 mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Tipos de Fotos Que Você Pode Baixar</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">📷 Fotos do Feed</h3>
                <p className="text-sm text-muted-foreground">Baixe qualquer foto publicada no feed do Instagram em resolução máxima. Posts antigos e recentes são suportados.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">🎠 Carrosséis</h3>
                <p className="text-sm text-muted-foreground">Baixe todas as fotos de um carrossel de uma vez. Suporte a posts com até 10 fotos e vídeos combinados.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">👤 Foto de Perfil</h3>
                <p className="text-sm text-muted-foreground">Amplie e baixe fotos de perfil em tamanho completo, incluindo avatares de contas públicas.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">📐 Todos os Formatos</h3>
                <p className="text-sm text-muted-foreground">Quadradas (1:1), paisagem (16:9), retrato (4:5) - suportamos todos os formatos de imagem do Instagram.</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
            <div className="rounded-xl overflow-hidden shadow-lg order-2 md:order-1">
              <img src="/images/download-from-instagram.webp" alt="Interface de download de fotos do Instagram" className="w-full h-auto" loading="lazy" />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-2xl font-bold text-foreground mb-4">Como Baixar Fotos do Instagram</h2>
              <ol className="space-y-3 text-muted-foreground">
                <li>1️⃣ Abra a foto que deseja salvar no Instagram</li>
                <li>2️⃣ Toque nos três pontos (⋯) e selecione "Copiar link"</li>
                <li>3️⃣ Cole o link no campo de download acima</li>
                <li>4️⃣ Clique em "Baixar Agora" para salvar a foto</li>
                <li>5️⃣ Para carrosséis, escolha baixar todas ou selecionar individualmente</li>
              </ol>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Dicas Para Fotos</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground">Qualidade das fotos</h3>
                <p className="text-muted-foreground text-sm mt-1">A qualidade da foto baixada depende da resolução original enviada pelo criador. Recomendamos usar a opção "Qualidade Original" para obter a melhor imagem possível.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Respeite os direitos autorais</h3>
                <p className="text-muted-foreground text-sm mt-1">Ao baixar fotos de outros usuários, lembre-se de respeitar os direitos autorais. Dê crédito ao criador original se compartilhar a imagem em outras plataformas.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Fotos;
