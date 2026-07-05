import { Helmet } from "react-helmet-async";
import PageLayout from "@/components/PageLayout";
import URLInput from "@/components/URLInput";

const IGTV = () => {
  return (
    <PageLayout>
      <Helmet>
        <title>Baixar Vídeos IGTV do Instagram Grátis - InstaSave</title>
        <meta name="description" content="Baixe vídeos IGTV do Instagram em alta qualidade. Salve vídeos longos do IGTV sem marca d'água gratuitamente." />
        <link rel="canonical" href="https://baixarvideosinstagram.com/baixar-igtv-instagram" />
        <meta property="og:title" content="Baixar Vídeos IGTV do Instagram - InstaSave" />
        <meta property="og:description" content="Baixe vídeos IGTV do Instagram sem marca d'água. Suporte a vídeos de até 60 minutos." />
        <meta property="og:url" content="https://baixarvideosinstagram.com/baixar-igtv-instagram" />
      </Helmet>

      <section className="py-10 lg:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground text-center leading-tight">
            Baixar <span className="instagram-gradient-text">Vídeos IGTV</span> do Instagram
          </h1>
          <p className="mt-4 text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto text-center">
            Salve vídeos longos do IGTV do Instagram em alta qualidade. Suporte a vídeos de até 60 minutos, sem marca d'água e 100% grátis.
          </p>
        </div>
      </section>

      <URLInput />

      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">O Que É o IGTV?</h2>
              <p className="text-muted-foreground mb-4">
                O IGTV (Instagram TV) é uma funcionalidade do Instagram que permite aos usuários publicar vídeos mais longos, com duração de até 60 minutos para contas verificadas. Diferente dos Reels que focam em conteúdo curto, o IGTV é ideal para tutoriais, vlogs, entrevistas e conteúdo educacional.
              </p>
              <p className="text-muted-foreground">
                Embora o Instagram tenha integrado os vídeos IGTV ao feed principal, muitos criadores continuam usando o formato para conteúdo mais elaborado. Os vídeos IGTV podem ser horizontais (16:9) ou verticais (9:16), oferecendo flexibilidade aos criadores.
              </p>
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg">
              <img src="/images/download-instagram.webp" alt="Baixar IGTV do Instagram no celular" className="w-full h-auto" loading="lazy" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-8 mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Como Baixar Vídeos IGTV</h2>
            <ol className="space-y-4 text-muted-foreground">
              <li className="flex gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full instagram-gradient text-primary-foreground font-bold text-sm shrink-0">1</span>
                <p><strong className="text-foreground">Encontre o vídeo IGTV</strong> que deseja baixar no Instagram. Abra o vídeo e toque nos três pontos (⋯) ou no ícone de compartilhar.</p>
              </li>
              <li className="flex gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full instagram-gradient text-primary-foreground font-bold text-sm shrink-0">2</span>
                <p><strong className="text-foreground">Copie o link</strong> do vídeo IGTV e cole no campo de download acima.</p>
              </li>
              <li className="flex gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full instagram-gradient text-primary-foreground font-bold text-sm shrink-0">3</span>
                <p><strong className="text-foreground">Escolha a qualidade</strong> (1080p, 720p, 480p) e clique em "Baixar Agora" para salvar o vídeo.</p>
              </li>
            </ol>
          </div>

          <div className="bg-card rounded-xl border border-border p-8 mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Vantagens de Baixar IGTV</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">📺 Assistir Offline</h3>
                <p className="text-sm text-muted-foreground">Salve tutoriais e vlogs para assistir em viagens ou locais sem internet. Ideal para conteúdo educacional.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">🎓 Conteúdo Educacional</h3>
                <p className="text-sm text-muted-foreground">Baixe aulas, cursos e tutoriais em vídeo para estudar no seu próprio ritmo, sem depender de conexão.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">🎬 Qualidade Full HD</h3>
                <p className="text-sm text-muted-foreground">Downloads em até 1080p, mantendo toda a qualidade original do vídeo publicado pelo criador.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">⚡ Download Rápido</h3>
                <p className="text-sm text-muted-foreground">Mesmo vídeos longos de até 60 minutos são processados rapidamente pelo nosso sistema otimizado.</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Perguntas Sobre IGTV</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground">Qual o tamanho máximo de vídeo IGTV suportado?</h3>
                <p className="text-muted-foreground text-sm mt-1">Nossa ferramenta suporta vídeos IGTV de até 60 minutos de duração, sem limite de tamanho de arquivo.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Posso baixar a capa do vídeo IGTV?</h3>
                <p className="text-muted-foreground text-sm mt-1">Sim! Além do vídeo, você pode baixar a imagem de capa (thumbnail) do IGTV separadamente.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default IGTV;
