# TODO

## Renomear a tabela `vinagre_posts` (registado a 01/11/2026)

A tabela guarda todas as peças do Exclusivo (Notícias, Curtas, Pimenta, Lendas de Portugal, Mente Aberta…), mas o nome vem do primeiro programa, o Vinagre, que já acabou. O nome engana quem lê o código e a base de dados.

- Proposta: `exclusivo_posts` (ou `especiais_posts`).
- Alcance (contado a 01/11/2026): 29 ficheiros no admin (SQL, hooks, editor) e 5 no site (`middleware.ts`, `api/sitemap.ts`, `scripts/generate-sitemap.mjs`, `useVinagrePosts.ts`, `useExclusivePrograms.ts`). A app mobile não usa a tabela.
- Sem queda: migração `ALTER TABLE vinagre_posts RENAME TO exclusivo_posts` e, ao mesmo tempo, uma view `vinagre_posts` para compatibilidade, para que o site e a app continuem a funcionar até ao deploy do código novo. Remover a view no fim. Rever as políticas RLS, os triggers, os grants e o bucket/storage se o nome aparecer neles.
- Custo: médio (uma sessão do developer + qa). Não é urgente.
