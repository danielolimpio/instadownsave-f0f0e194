## Objetivo
Corrigir três problemas específicos no downloader:
1. links públicos que hoje caem no aviso genérico de “post privado/removido”
2. thumbnail ausente em reels que já extraem corretamente
3. histórico da página `/downloads` que não está recebendo os downloads realizados

## O que vou implementar

### 1) Melhorar o diagnóstico e a extração no backend
- Ajustar `supabase/functions/instagram-download/index.ts` para distinguir melhor:
  - falha real de provider
  - resposta vazia/parcial
  - mídia pública encontrada mas em formato de resposta ainda não tratado
- Expandir o parser para cobrir formatos de carrossel e reel que os providers atuais estão retornando para:
  - `DYc8L94EXNr`
  - `DYckdKzllsw`
  - `DYcgSgCKdKH`
- Melhorar a mensagem final para não afirmar “pode ser privado” quando o problema for claramente limitação do provider.

### 2) Completar thumbnails no resultado
- Ajustar a montagem dos itens retornados pelo extractor para gerar thumbnail de fallback quando o provider só devolver a URL do vídeo.
- Garantir que a UI de `src/components/URLInput.tsx` consiga exibir preview do item mesmo quando a resposta vier incompleta.

### 3) Salvar corretamente no histórico de downloads
- Atualizar `src/components/URLInput.tsx` para persistir no `localStorage` cada download iniciado com os dados necessários para a página `/downloads`.
- Manter compatibilidade com a estrutura já lida por `src/pages/Downloads.tsx`.
- Se necessário, complementar o histórico com nome do arquivo/tipo para ele ficar consistente e útil.

### 4) Validar com os links reportados
- Testar novamente os links públicos que falham hoje.
- Confirmar que o reel `DYPgp-JM8Lp`:
  - exibe thumbnail
  - baixa corretamente
  - aparece no histórico `/downloads`

## Detalhes técnicos
- Arquivos alvo:
  - `supabase/functions/instagram-download/index.ts`
  - `src/components/URLInput.tsx`
  - possivelmente `src/pages/Downloads.tsx` se precisar ajustar a leitura do histórico
- Validação principal:
  - chamada direta da função `instagram-download`
  - conferência visual do preview
  - verificação do armazenamento local do histórico

## Resultado esperado
- links públicos deixam de cair em falso positivo de “privado” quando o problema é parser/provider
- reels com extração válida mostram thumbnail
- downloads feitos passam a aparecer na página de histórico