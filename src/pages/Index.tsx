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
      <section className="py-8 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">A Melhor Ferramenta Para Baixar Vídeos do Instagram</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                O InstaSave é a ferramenta mais completa e confiável para baixar vídeos do Instagram sem marca d'água. Com milhões de downloads realizados, nossa plataforma oferece uma experiência rápida, segura e totalmente gratuita para salvar seus conteúdos favoritos do Instagram.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                Diferente de outras ferramentas, o InstaSave suporta todos os tipos de conteúdo do Instagram: Reels, IGTV, Stories, vídeos do feed, fotos individuais e até carrosséis completos com múltiplas imagens e vídeos. Tudo isso sem necessidade de cadastro ou instalação de software.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground">
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
      <section className="py-8 sm:py-12 px-4 bg-card border-y border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center mb-6 sm:mb-8">Por Que Escolher o InstaSave?</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <article className="text-center">
              <h3 className="font-semibold text-foreground text-base sm:text-lg mb-2">🔒 100% Seguro e Privado</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Não armazenamos nenhum dado pessoal, vídeo ou informação de conta. Seu download é processado em tempo real e nenhum arquivo fica salvo em nossos servidores.</p>
            </article>
            <article className="text-center">
              <h3 className="font-semibold text-foreground text-base sm:text-lg mb-2">⚡ Velocidade Máxima</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Nossos servidores são otimizados para processar downloads em segundos. Mesmo vídeos longos do IGTV são baixados rapidamente.</p>
            </article>
            <article className="text-center sm:col-span-2 md:col-span-1">
              <h3 className="font-semibold text-foreground text-base sm:text-lg mb-2">📱 Todos os Dispositivos</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Use o InstaSave em qualquer dispositivo: celular Android, iPhone, iPad, computador. Funciona diretamente no navegador.</p>
            </article>
          </div>
        </div>
      </section>

      <HowItWorks />

      {/* SEO Content Section 3 */}
      <section className="py-8 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center mb-8 sm:mb-12">
            <div className="rounded-xl overflow-hidden shadow-lg order-2 md:order-1">
              <img src="/images/download-instagram.webp" alt="Baixar vídeos e fotos do Instagram no celular" className="w-full h-auto" loading="lazy" />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">Como Funciona o Download</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                Quando você cola um link do Instagram no InstaSave, nossa ferramenta acessa a página pública do conteúdo e extrai a URL do vídeo ou imagem na melhor qualidade disponível.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                Todo o processamento acontece em nossos servidores, o que significa que você não precisa ter uma conta no Instagram para baixar conteúdos públicos.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground">
                O InstaSave identifica automaticamente se o link é de um Reel, vídeo do feed, IGTV, Story ou foto, e oferece as opções de download adequadas.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">Baixe Para Usar Offline</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                Uma das principais vantagens de baixar vídeos do Instagram é poder assistir offline. Seja em uma viagem de avião, no metrô ou em qualquer lugar sem conexão.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                Para criadores de conteúdo, o InstaSave é uma ferramenta essencial para fazer backup dos próprios posts e repostá-los em outras redes sociais.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground">
                Profissionais de marketing digital também utilizam o InstaSave para análise de conteúdo e curadoria.
              </p>
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg">
              <img src="/images/instagram-download-media.png" alt="Download de mídia social do Instagram" className="w-full h-auto" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* Guia Completo SEO */}
      <section className="py-8 sm:py-12 px-4 bg-card border-y border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center mb-6 sm:mb-8">Guia Completo: Baixar Vídeos do Instagram em 2024</h2>
          
          <div className="space-y-6 sm:space-y-8">
            <article>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3">O Que Você Pode Baixar do Instagram?</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-3">O Instagram oferece diversos tipos de conteúdo, e o InstaSave suporta o download de todos eles:</p>
              <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
                <li><strong className="text-foreground">Reels:</strong> Vídeos curtos de até 90 segundos no formato vertical.</li>
                <li><strong className="text-foreground">IGTV:</strong> Vídeos longos de até 60 minutos.</li>
                <li><strong className="text-foreground">Stories:</strong> Conteúdo temporário que desaparece em 24 horas.</li>
                <li><strong className="text-foreground">Fotos do Feed:</strong> Imagens em alta resolução.</li>
                <li><strong className="text-foreground">Carrosséis:</strong> Posts com múltiplas fotos e vídeos.</li>
              </ul>
            </article>

            <article>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3">Qualidade dos Downloads</h3>
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-xs sm:text-sm border border-border rounded-lg overflow-hidden min-w-[320px]">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="text-left p-2 sm:p-3 text-foreground font-semibold">Tipo</th>
                      <th className="text-left p-2 sm:p-3 text-foreground font-semibold">Resolução</th>
                      <th className="text-left p-2 sm:p-3 text-foreground font-semibold">Formatos</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-t border-border"><td className="p-2 sm:p-3">Reels</td><td className="p-2 sm:p-3">1080p HD</td><td className="p-2 sm:p-3">MP4</td></tr>
                    <tr className="border-t border-border"><td className="p-2 sm:p-3">IGTV</td><td className="p-2 sm:p-3">1080p HD</td><td className="p-2 sm:p-3">MP4</td></tr>
                    <tr className="border-t border-border"><td className="p-2 sm:p-3">Stories</td><td className="p-2 sm:p-3">1080p HD</td><td className="p-2 sm:p-3">MP4, JPG</td></tr>
                    <tr className="border-t border-border"><td className="p-2 sm:p-3">Fotos</td><td className="p-2 sm:p-3">Original</td><td className="p-2 sm:p-3">JPG, PNG</td></tr>
                    <tr className="border-t border-border"><td className="p-2 sm:p-3">Carrosséis</td><td className="p-2 sm:p-3">Original</td><td className="p-2 sm:p-3">MP4, JPG</td></tr>
                  </tbody>
                </table>
              </div>
            </article>

            <article>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3">Dicas Para Melhores Downloads</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-background rounded-lg p-3 sm:p-4 border border-border">
                  <h4 className="font-semibold text-foreground text-sm mb-1 sm:mb-2">✅ Use links diretos</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">Sempre copie o link diretamente do post para garantir que o conteúdo correto seja baixado.</p>
                </div>
                <div className="bg-background rounded-lg p-3 sm:p-4 border border-border">
                  <h4 className="font-semibold text-foreground text-sm mb-1 sm:mb-2">✅ Conta pública</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">Apenas conteúdos de contas públicas podem ser baixados.</p>
                </div>
                <div className="bg-background rounded-lg p-3 sm:p-4 border border-border">
                  <h4 className="font-semibold text-foreground text-sm mb-1 sm:mb-2">✅ Direitos autorais</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">Dê crédito aos criadores originais ao compartilhar conteúdo baixado.</p>
                </div>
                <div className="bg-background rounded-lg p-3 sm:p-4 border border-border">
                  <h4 className="font-semibold text-foreground text-sm mb-1 sm:mb-2">✅ Qualidade certa</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">Para economizar espaço, use 720p. Para máxima qualidade, 1080p Full HD.</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <SupportedFormats />

      {/* More SEO content */}
      <section className="py-8 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
            <div className="rounded-xl overflow-hidden shadow-lg order-2 md:order-1">
              <img src="/images/baixar-do-instagram.jpg" alt="Baixar Reels, Stories e vídeos do Instagram" className="w-full h-auto" loading="lazy" />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">Compatível Com Todos os Dispositivos</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                O InstaSave funciona perfeitamente em qualquer dispositivo com acesso à internet. Não importa se você está usando um smartphone Android, iPhone, iPad, notebook ou computador desktop.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                Para dispositivos móveis, recomendamos usar o navegador Chrome, Safari ou Firefox para a melhor experiência de download.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground">
                Após o download, os arquivos são salvos automaticamente na pasta de downloads do seu dispositivo.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FAQSection />

      {/* Legal disclaimer */}
      <section className="py-6 sm:py-8 px-4">
        <div className="max-w-4xl mx-auto bg-card rounded-xl border border-border p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">Aviso Legal e Direitos Autorais</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
            O InstaSave (baixarvideosinstagram.com) é uma ferramenta independente e não é afiliada, endossada ou patrocinada pelo Instagram, Meta Platforms, Inc. ou qualquer uma de suas subsidiárias.
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
            Esta ferramenta permite o download de conteúdo público do Instagram para uso pessoal. Os usuários são responsáveis por respeitar os direitos autorais e os termos de uso do Instagram.
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Recomendamos sempre dar crédito aos criadores originais. Se você deseja que seu conteúdo seja removido, entre em contato através da nossa página de DMCA.
          </p>
        </div>
      </section>
    </PageLayout>
  );
};

export default Index;
