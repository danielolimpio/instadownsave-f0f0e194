import { useState } from "react";
import { Helmet } from "react-helmet-async";
import PageLayout from "@/components/PageLayout";
import HeroSection from "@/components/HeroSection";
import URLInput from "@/components/URLInput";
import ContentTypeTabs from "@/components/ContentTypeTabs";
import FeatureCards from "@/components/FeatureCards";
import HowItWorks from "@/components/HowItWorks";
import SupportedFormats from "@/components/SupportedFormats";
import FAQSection from "@/components/FAQSection";

const Index = () => {
  return (
    <PageLayout>
      <Helmet>
        <title>Baixar Vídeos do Instagram Sem Marca d'Água - InstaSave</title>
        <meta name="description" content="Baixe vídeos do Instagram sem marca d'água em alta qualidade. Reels, IGTV, Stories e fotos. Ferramenta 100% grátis e ilimitada." />
        <link rel="canonical" href="https://baixarvideosinstagram.com" />
      </Helmet>

      <HeroSection />
      <URLInput />
      <ContentTypeTabs />
      <FeatureCards />

      {/* SEO Content Section 1 */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">A Melhor Ferramenta Para Baixar Vídeos do Instagram</h2>
              <p className="text-muted-foreground mb-4">
                O InstaSave é a ferramenta mais completa e confiável para baixar vídeos do Instagram sem marca d'água. Com milhões de downloads realizados, nossa plataforma oferece uma experiência rápida, segura e totalmente gratuita para salvar seus conteúdos favoritos do Instagram.
              </p>
              <p className="text-muted-foreground mb-4">
                Diferente de outras ferramentas, o InstaSave suporta todos os tipos de conteúdo do Instagram: Reels, IGTV, Stories, vídeos do feed, fotos individuais e até carrosséis completos com múltiplas imagens e vídeos. Tudo isso sem necessidade de cadastro ou instalação de software.
              </p>
              <p className="text-muted-foreground">
                Nossa tecnologia avançada identifica automaticamente o tipo de conteúdo e oferece as melhores opções de qualidade para download, incluindo Full HD 1080p para vídeos e resolução original para fotos.
              </p>
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg">
              <img src="/images/como-baixar-videos.webp" alt="Como baixar vídeos do Instagram - Guia completo" className="w-full h-auto" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content Section 2 */}
      <section className="py-12 px-4 bg-card border-y border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">Por Que Escolher o InstaSave?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <article className="text-center">
              <h3 className="font-semibold text-foreground text-lg mb-2">🔒 100% Seguro e Privado</h3>
              <p className="text-sm text-muted-foreground">Não armazenamos nenhum dado pessoal, vídeo ou informação de conta. Seu download é processado em tempo real e nenhum arquivo fica salvo em nossos servidores. Sua privacidade é nossa prioridade.</p>
            </article>
            <article className="text-center">
              <h3 className="font-semibold text-foreground text-lg mb-2">⚡ Velocidade Máxima</h3>
              <p className="text-sm text-muted-foreground">Nossos servidores são otimizados para processar downloads em segundos. Mesmo vídeos longos do IGTV são baixados rapidamente, sem filas de espera ou limites artificiais de velocidade.</p>
            </article>
            <article className="text-center">
              <h3 className="font-semibold text-foreground text-lg mb-2">📱 Funciona em Todos os Dispositivos</h3>
              <p className="text-sm text-muted-foreground">Use o InstaSave em qualquer dispositivo: celular Android, iPhone, iPad, computador Windows, Mac ou Linux. Não precisa instalar nenhum aplicativo — funciona diretamente no navegador.</p>
            </article>
          </div>
        </div>
      </section>

      <HowItWorks />

      {/* SEO Content Section 3 - with images */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
            <div className="rounded-xl overflow-hidden shadow-lg">
              <img src="/images/download-instagram.webp" alt="Baixar vídeos e fotos do Instagram no celular" className="w-full h-auto" loading="lazy" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Como Funciona o Download de Vídeos do Instagram</h2>
              <p className="text-muted-foreground mb-4">
                O processo de download é simples e direto. Quando você cola um link do Instagram no InstaSave, nossa ferramenta acessa a página pública do conteúdo e extrai a URL do vídeo ou imagem na melhor qualidade disponível.
              </p>
              <p className="text-muted-foreground mb-4">
                Todo o processamento acontece em nossos servidores, o que significa que você não precisa ter uma conta no Instagram para baixar conteúdos públicos. Basta ter o link do post, Reel, Story ou IGTV.
              </p>
              <p className="text-muted-foreground">
                O InstaSave identifica automaticamente se o link é de um Reel, vídeo do feed, IGTV, Story ou foto, e oferece as opções de download adequadas para cada tipo de conteúdo.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Baixe Conteúdo do Instagram Para Usar Offline</h2>
              <p className="text-muted-foreground mb-4">
                Uma das principais vantagens de baixar vídeos do Instagram é poder assistir offline. Seja em uma viagem de avião, no metrô ou em qualquer lugar sem conexão à internet, seus vídeos favoritos estarão sempre disponíveis no seu dispositivo.
              </p>
              <p className="text-muted-foreground mb-4">
                Para criadores de conteúdo, o InstaSave é uma ferramenta essencial para fazer backup dos próprios posts. Muitos influenciadores usam nossa plataforma para salvar seus vídeos em alta qualidade antes de repostá-los em outras redes sociais como TikTok, YouTube Shorts ou Twitter.
              </p>
              <p className="text-muted-foreground">
                Profissionais de marketing digital também utilizam o InstaSave para análise de conteúdo, criação de relatórios e curadoria de conteúdo para apresentações e propostas comerciais.
              </p>
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg">
              <img src="/images/instagram-download-media.png" alt="Download de mídia social do Instagram" className="w-full h-auto" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* Guia Completo SEO */}
      <section className="py-12 px-4 bg-card border-y border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">Guia Completo: Baixar Vídeos do Instagram em 2024</h2>
          
          <div className="space-y-8">
            <article>
              <h3 className="text-xl font-semibold text-foreground mb-3">O Que Você Pode Baixar do Instagram?</h3>
              <p className="text-muted-foreground mb-3">O Instagram oferece diversos tipos de conteúdo, e o InstaSave suporta o download de todos eles:</p>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Reels:</strong> Vídeos curtos de até 90 segundos no formato vertical (9:16). Perfeitos para entretenimento rápido e conteúdo viral.</li>
                <li><strong className="text-foreground">IGTV:</strong> Vídeos longos de até 60 minutos. Ideais para tutoriais, vlogs e conteúdo educacional aprofundado.</li>
                <li><strong className="text-foreground">Stories:</strong> Conteúdo temporário que desaparece em 24 horas. Fotos e vídeos de até 60 segundos com filtros e stickers.</li>
                <li><strong className="text-foreground">Fotos do Feed:</strong> Imagens publicadas no perfil em alta resolução. Suporte a formatos quadrado, paisagem e retrato.</li>
                <li><strong className="text-foreground">Carrosséis:</strong> Posts com múltiplas fotos e vídeos (até 10 itens). Baixe todos de uma vez ou selecione individualmente.</li>
              </ul>
            </article>

            <article>
              <h3 className="text-xl font-semibold text-foreground mb-3">Qualidade dos Downloads</h3>
              <p className="text-muted-foreground mb-3">O InstaSave sempre busca a melhor qualidade disponível para cada tipo de conteúdo:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="text-left p-3 text-foreground font-semibold">Tipo</th>
                      <th className="text-left p-3 text-foreground font-semibold">Resolução Máx.</th>
                      <th className="text-left p-3 text-foreground font-semibold">Formatos</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-t border-border"><td className="p-3">Reels</td><td className="p-3">1080p HD</td><td className="p-3">MP4, MP3</td></tr>
                    <tr className="border-t border-border"><td className="p-3">IGTV</td><td className="p-3">1080p HD</td><td className="p-3">MP4, MP3</td></tr>
                    <tr className="border-t border-border"><td className="p-3">Stories</td><td className="p-3">1080p HD</td><td className="p-3">MP4, JPG</td></tr>
                    <tr className="border-t border-border"><td className="p-3">Fotos</td><td className="p-3">Original</td><td className="p-3">JPG, PNG</td></tr>
                    <tr className="border-t border-border"><td className="p-3">Carrosséis</td><td className="p-3">Original</td><td className="p-3">MP4, JPG</td></tr>
                  </tbody>
                </table>
              </div>
            </article>

            <article>
              <h3 className="text-xl font-semibold text-foreground mb-3">Dicas Para Melhores Downloads</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-background rounded-lg p-4 border border-border">
                  <h4 className="font-semibold text-foreground mb-2">✅ Use links diretos</h4>
                  <p className="text-sm text-muted-foreground">Sempre copie o link diretamente do post para garantir que o conteúdo correto seja baixado.</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-border">
                  <h4 className="font-semibold text-foreground mb-2">✅ Verifique se a conta é pública</h4>
                  <p className="text-sm text-muted-foreground">Apenas conteúdos de contas públicas podem ser baixados. Contas privadas são protegidas.</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-border">
                  <h4 className="font-semibold text-foreground mb-2">✅ Respeite direitos autorais</h4>
                  <p className="text-sm text-muted-foreground">Dê crédito aos criadores originais ao compartilhar conteúdo baixado em outras plataformas.</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-border">
                  <h4 className="font-semibold text-foreground mb-2">✅ Escolha a qualidade certa</h4>
                  <p className="text-sm text-muted-foreground">Para economizar espaço, use 720p. Para máxima qualidade, selecione 1080p Full HD.</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <SupportedFormats />

      {/* More SEO content */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="rounded-xl overflow-hidden shadow-lg">
              <img src="/images/baixar-do-instagram.jpg" alt="Baixar Reels, Stories e vídeos do Instagram" className="w-full h-auto" loading="lazy" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Compatível Com Todos os Dispositivos</h2>
              <p className="text-muted-foreground mb-4">
                O InstaSave funciona perfeitamente em qualquer dispositivo com acesso à internet. Não importa se você está usando um smartphone Android, iPhone, iPad, notebook ou computador desktop — nossa ferramenta se adapta automaticamente ao tamanho da sua tela.
              </p>
              <p className="text-muted-foreground mb-4">
                Para dispositivos móveis, recomendamos usar o navegador Chrome, Safari ou Firefox para a melhor experiência de download. Em computadores, todos os navegadores modernos são suportados.
              </p>
              <p className="text-muted-foreground">
                Após o download, os arquivos são salvos automaticamente na pasta de downloads do seu dispositivo. No celular, você pode encontrar os vídeos na galeria ou no gerenciador de arquivos.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FAQSection />

      {/* Legal disclaimer */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">Aviso Legal e Direitos Autorais</h2>
          <p className="text-sm text-muted-foreground mb-3">
            O InstaSave (baixarvideosinstagram.com) é uma ferramenta independente e não é afiliada, endossada ou patrocinada pelo Instagram, Meta Platforms, Inc. ou qualquer uma de suas subsidiárias. Instagram é uma marca registrada da Meta Platforms, Inc.
          </p>
          <p className="text-sm text-muted-foreground mb-3">
            Esta ferramenta permite o download de conteúdo público do Instagram para uso pessoal. Os usuários são responsáveis por respeitar os direitos autorais e os termos de uso do Instagram ao baixar e compartilhar conteúdo de terceiros.
          </p>
          <p className="text-sm text-muted-foreground">
            Recomendamos sempre dar crédito aos criadores originais ao reutilizar conteúdo baixado. Se você é um criador de conteúdo e deseja que seu conteúdo seja removido, entre em contato conosco através da nossa página de DMCA.
          </p>
        </div>
      </section>
    </PageLayout>
  );
};

export default Index;
