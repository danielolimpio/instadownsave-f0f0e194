import { Helmet } from "react-helmet-async";
import PageLayout from "@/components/PageLayout";
import URLInput from "@/components/URLInput";

const Stories = () => {
  return (
    <PageLayout>
      <Helmet>
        <title>Baixar Stories do Instagram Grátis - InstaSave</title>
        <meta name="description" content="Baixe Stories do Instagram antes que expirem. Salve stories, destaques e vídeos de 24 horas em alta qualidade, sem marca d'água." />
        <link rel="canonical" href="https://baixarvideosinstagram.com/stories" />
        <meta property="og:title" content="Baixar Stories do Instagram - InstaSave" />
        <meta property="og:description" content="Salve Stories do Instagram antes que desapareçam. Download gratuito em alta qualidade." />
        <meta property="og:url" content="https://baixarvideosinstagram.com/stories" />
      </Helmet>

      <section className="py-10 lg:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground text-center leading-tight">
            Baixar <span className="instagram-gradient-text">Stories do Instagram</span>
          </h1>
          <p className="mt-4 text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto text-center">
            Salve Stories do Instagram antes que desapareçam em 24 horas. Baixe fotos e vídeos de Stories e Destaques em alta qualidade.
          </p>
        </div>
      </section>

      <URLInput />

      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">O Que São Stories do Instagram?</h2>
              <p className="text-muted-foreground mb-4">
                Os Stories do Instagram são conteúdos temporários que desaparecem automaticamente após 24 horas. Criados em 2016, os Stories se tornaram uma das funcionalidades mais usadas da plataforma, com mais de 500 milhões de usuários ativos diariamente.
              </p>
              <p className="text-muted-foreground mb-4">
                Os Stories podem incluir fotos, vídeos curtos de até 60 segundos, enquetes, perguntas, músicas, GIFs, stickers e muito mais. Eles aparecem no topo do feed do Instagram em formato circular.
              </p>
              <p className="text-muted-foreground">
                Os criadores também podem salvar Stories como "Destaques" em seu perfil, mantendo-os permanentemente visíveis. Nossa ferramenta permite baixar tanto Stories ativos quanto Destaques.
              </p>
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg">
              <img src="/images/baixar-video-instagram-stories.png" alt="Baixar Stories do Instagram - Interface com post" className="w-full h-auto" loading="lazy" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-8 mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Como Baixar Stories do Instagram</h2>
            <ol className="space-y-4 text-muted-foreground">
              <li className="flex gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full instagram-gradient text-primary-foreground font-bold text-sm shrink-0">1</span>
                <p><strong className="text-foreground">Acesse o perfil</strong> da pessoa cujos Stories você deseja baixar e copie o link do perfil ou do Story específico.</p>
              </li>
              <li className="flex gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full instagram-gradient text-primary-foreground font-bold text-sm shrink-0">2</span>
                <p><strong className="text-foreground">Cole o link</strong> no campo de download acima. Nossa ferramenta identificará todos os Stories disponíveis.</p>
              </li>
              <li className="flex gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full instagram-gradient text-primary-foreground font-bold text-sm shrink-0">3</span>
                <p><strong className="text-foreground">Baixe individualmente</strong> ou use "Baixar Tudo" para salvar todos os Stories de uma vez. Fotos e vídeos são organizados automaticamente.</p>
              </li>
            </ol>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
            <div className="rounded-xl overflow-hidden shadow-lg order-2 md:order-1">
              <img src="/images/pt-ins-step-1.png" alt="Passo a passo para copiar link do Story" className="w-full h-auto" loading="lazy" />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-2xl font-bold text-foreground mb-4">Tipos de Stories Suportados</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li>📸 <strong className="text-foreground">Fotos:</strong> Salve fotos de Stories em resolução original, incluindo filtros e efeitos aplicados.</li>
                <li>🎬 <strong className="text-foreground">Vídeos:</strong> Baixe vídeos de até 60 segundos com áudio original e qualidade HD.</li>
                <li>⭐ <strong className="text-foreground">Destaques:</strong> Baixe Stories salvos nos Destaques do perfil, que ficam disponíveis permanentemente.</li>
                <li>🎵 <strong className="text-foreground">Com Música:</strong> Stories com músicas são baixados com o áudio completo incluído.</li>
                <li>📍 <strong className="text-foreground">Com Localização:</strong> Todas as informações visuais do Story são preservadas no download.</li>
              </ul>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Dicas Importantes Sobre Stories</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground">⏰ Stories expiram em 24 horas</h3>
                <p className="text-muted-foreground text-sm mt-1">Os Stories desaparecem após 24 horas. Se você viu um Story interessante, baixe-o o mais rápido possível antes que expire. Destaques ficam disponíveis permanentemente.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">🔒 Apenas contas públicas</h3>
                <p className="text-muted-foreground text-sm mt-1">Só é possível baixar Stories de contas públicas. Stories de contas privadas são protegidos e não podem ser acessados por ferramentas externas.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">👁️ Visualização anônima</h3>
                <p className="text-muted-foreground text-sm mt-1">Ao baixar Stories usando nossa ferramenta, o criador do conteúdo não será notificado de que você baixou o Story.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Stories;
