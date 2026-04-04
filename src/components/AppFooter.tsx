const AppFooter = () => {
  return (
    <footer className="border-t border-border bg-card py-8 px-4 mt-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground mb-4">
          <a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a>
          <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
          <a href="#" className="hover:text-foreground transition-colors">DMCA</a>
          <a href="#" className="hover:text-foreground transition-colors">Contato</a>
          <a href="#" className="hover:text-foreground transition-colors">Sobre</a>
          <a href="#" className="hover:text-foreground transition-colors">Blog</a>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          © 2024 Baixar Vídeos Instagram. Não somos afiliados ao Instagram.
        </p>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Este site não é afiliado, endossado ou patrocinado pelo Instagram ou Meta Platforms, Inc.
        </p>
      </div>
    </footer>
  );
};

export default AppFooter;
