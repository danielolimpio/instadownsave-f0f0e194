import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "É grátis para baixar?", a: "Sim! Nossa ferramenta é 100% gratuita. Você pode baixar quantos vídeos quiser sem nenhum custo." },
  { q: "Preciso fazer login no Instagram?", a: "Não, você não precisa fazer login. Basta colar o link do conteúdo público que deseja baixar." },
  { q: "Os vídeos têm marca d'água?", a: "Não! Todos os vídeos são baixados na qualidade original, sem nenhuma marca d'água adicional." },
  { q: "Qual a qualidade dos downloads?", a: "Oferecemos download na melhor qualidade disponível, até 1080p Full HD para vídeos e resolução original para fotos." },
  { q: "Funciona em contas privadas?", a: "Não, só é possível baixar conteúdo de contas públicas. Contas privadas são protegidas pela política de privacidade do Instagram." },
  { q: "É seguro usar?", a: "Sim, nossa ferramenta é 100% segura. Não armazenamos nenhum dado pessoal ou vídeo baixado em nossos servidores." },
];

const FAQSection = () => {
  return (
    <section className="py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground text-center mb-8">
          Perguntas Frequentes
        </h2>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="bg-card border border-border rounded-xl px-6 data-[state=open]:shadow-sm"
            >
              <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-4">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
