import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>Página Não Encontrada - InstaSave</title>
        <meta name="description" content="A página que você procurou não foi encontrada. Volte para a página inicial do InstaSave e baixe vídeos do Instagram grátis." />
        <link rel="canonical" href="https://baixarvideosinstagram.com" />
        <meta property="og:title" content="Página Não Encontrada - InstaSave" />
        <meta property="og:description" content="A página que você procurou não foi encontrada. Volte para a página inicial do InstaSave." />
        <meta property="og:url" content="https://baixarvideosinstagram.com" />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">404</h1>
          <p className="mb-4 text-xl text-muted-foreground">Oops! Página não encontrada</p>
          <a href="/" className="text-primary underline hover:text-primary/90">
            Voltar para a Página Inicial
          </a>
        </div>
      </div>
    </>
  );
};

export default NotFound;
