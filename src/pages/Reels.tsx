import { Helmet } from "react-helmet-async";
import PageLayout from "@/components/PageLayout";
import URLInput from "@/components/URLInput";

const Reels = () => {
  return (
    <PageLayout>
      <Helmet>
        <title>Baixar Reels do Instagram Grátis - InstaSave</title>
        <meta name="description" content="Baixe Reels do Instagram sem marca d'água em alta qualidade. Salve vídeos curtos do Instagram Reels gratuitamente no seu celular ou computador." />
        <link rel="canonical" href="https://baixarvideosinstagram.com/baixar-reels-instagram" />
        <meta property="og:title" content="Baixar Reels do Instagram Grátis - InstaSave" />
        <meta property="og:description" content="Ferramenta gratuita para baixar Reels do Instagram sem marca d'água em Full HD." />
        <meta property="og:url" content="https://baixarvideosinstagram.com/baixar-reels-instagram" />
      </Helmet>

      <section className="py-10 lg:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground text-center leading-tight">
            Baixar <span className="instagram-gradient-text">Reels do Instagram</span>
          </h1>
          <p className="mt-4 text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto text-center">
            Salve seus Reels favoritos do Instagram em alta qualidade, sem marca d'água e totalmente grátis. Funciona no celular e computador.
          </p>
        </div>
      </section>

      <URLInput />

      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">O Que São Reels do Instagram?</h2>
              <p className="text-muted-foreground mb-4">
                Os Reels do Instagram são vídeos curtos de até 90 segundos que permitem aos criadores compartilhar conteúdo criativo e envolvente. Lançado em 2020, o formato se tornou uma das funcionalidades mais populares da plataforma, competindo diretamente com o TikTok.
              </p>
              <p className="text-muted-foreground">
                Com os Reels, os usuários podem adicionar músicas, efeitos especiais, textos e filtros para criar vídeos dinâmicos e divertidos. O formato vertical (9:16) é otimizado para visualização em dispositivos móveis.
              </p>
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg">
              <img src="/images/baixar-do-instagram.jpg" alt="Baixar Reels do Instagram - Story, Reel, Carousel e Video" className="w-full h-auto" loading="lazy" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-8 mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Como Baixar Reels do Instagram</h2>
            <ol className="space-y-4 text-muted-foreground">
              <li className="flex gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full instagram-gradient text-primary-foreground font-bold text-sm shrink-0">1</span>
                <p><strong className="text-foreground">Abra o Instagram</strong> e encontre o Reel que deseja baixar. Toque no ícone de compartilhar (avião de papel) e selecione "Copiar link".</p>
              </li>
              <li className="flex gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full instagram-gradient text-primary-foreground font-bold text-sm shrink-0">2</span>
                <p><strong className="text-foreground">Cole o link</strong> no campo acima. Nossa ferramenta detectará automaticamente que é um Reel.</p>
              </li>
              <li className="flex gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full instagram-gradient text-primary-foreground font-bold text-sm shrink-0">3</span>
                <p><strong className="text-foreground">Clique em "Baixar Agora"</strong> e o vídeo será processado em segundos. Escolha a qualidade desejada e salve no seu dispositivo.</p>
              </li>
            </ol>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
            <div className="rounded-xl overflow-hidden shadow-lg order-2 md:order-1">
              <img src="/images/copy-ig-post-link.png" alt="Como copiar link de um Reel do Instagram" className="w-full h-auto" loading="lazy" />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-2xl font-bold text-foreground mb-4">Por Que Baixar Reels?</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li>✅ <strong className="text-foreground">Assistir offline:</strong> Salve seus Reels favoritos para assistir quando estiver sem internet.</li>
                <li>✅ <strong className="text-foreground">Compilação de conteúdo:</strong> Crie compilações dos melhores Reels para seu portfólio ou apresentações.</li>
                <li>✅ <strong className="text-foreground">Backup pessoal:</strong> Faça backup dos seus próprios Reels em alta qualidade.</li>
                <li>✅ <strong className="text-foreground">Compartilhar em outras plataformas:</strong> Reposte seus Reels favoritos em outras redes sociais.</li>
                <li>✅ <strong className="text-foreground">Sem marca d'água:</strong> Baixe vídeos limpos sem marca d'água do Instagram.</li>
              </ul>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Perguntas Sobre Reels</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground">Qual a qualidade dos Reels baixados?</h3>
                <p className="text-muted-foreground text-sm mt-1">Nosso serviço baixa os Reels na melhor qualidade disponível, geralmente em 1080p Full HD. A qualidade final depende da resolução original do vídeo enviado pelo criador.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Posso baixar o áudio de um Reel separadamente?</h3>
                <p className="text-muted-foreground text-sm mt-1">Sim! Oferecemos a opção de extrair o áudio dos Reels em formato MP3, perfeito para quem quer salvar músicas ou áudios específicos.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Funciona com Reels de contas privadas?</h3>
                <p className="text-muted-foreground text-sm mt-1">Não. Apenas Reels de contas públicas podem ser baixados. Contas privadas são protegidas pelas políticas do Instagram.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Reels;
