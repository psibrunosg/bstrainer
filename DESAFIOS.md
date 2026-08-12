# DESAFIOS — atritos operacionais recorrentes

> **O que entra aqui:** problemas de **ambiente, ferramenta ou processo** que já custaram tempo e
> tendem a se repetir — não bugs de código (esses viram issue) nem dívidas técnicas (essas vão em
> `docs/manutencao.md` §4). Se um item aqui puder ser corrigido de vez no repo, corrija e remova.
>
> **Última atualização:** 2026-08-12

---

## 1. Build do Next falha com `ENOENT` quando dois processos buildam em paralelo

**Sintoma:** `pnpm build` quebra com `ENOENT` apontando para algo em `apps/web/.next/server/...`,
ou com erro de `rename` em `apps/web/.next/export/500.html`.

**Causa:** dois processos buildando o **mesmo** `apps/web` ao mesmo tempo. Acontece com agentes
concorrentes, ou com um `next dev` esquecido em background. No Windows é mais fácil de disparar
porque o SO trava arquivos abertos, e o rename falha em vez de sobrescrever.

**Não é erro de código.** Não saia caçando o commit que "quebrou o build".

**Correção:**

```bash
# garanta que nenhum outro build/dev está rodando, então:
rm -rf apps/web/.next apps/web/out apps/web/.turbo
pnpm build
```

**Prevenção:** um build por vez neste diretório. Se precisar de paralelismo real, use uma git
worktree separada (com seu próprio `node_modules`), não o mesmo `apps/web`.

---

## 2. `supabase db reset` colide com outro projeto Supabase local

**Sintoma:** o reset falha ou sobe no container errado porque as portas **54322** (Postgres) e
**54323** (Studio) já estão ocupadas por outro projeto Supabase na máquina.

**O que NÃO fazer:** derrubar a stack do outro projeto. É destrutivo para um trabalho que não é o
seu e você provavelmente vai esquecer de subir de volta.

**Alternativa não destrutiva:** suba um Postgres descartável em outra porta e aponte o reset para
ele com `--db-url`:

```bash
supabase db reset --db-url postgresql://postgres:postgres@localhost:<porta-livre>/postgres
```

Serve bem para validar migrations e seeds. Note que não é um ambiente Supabase completo — ver
item 4 abaixo.

---

## 3. Como validar refactor de dados SQL sem confiar no agente

Quando um refactor **move** dados (o caso da D5: migration de ~1MB → JSON + gerador), revisar o
diff não prova nada — o diff é justamente gigante demais para ser lido.

**Método que funciona — comparação por hash de conteúdo:**

1. Aplique as migrations do **HEAD** num banco `baseline`.
2. Aplique as migrations + seeds do **working tree** num banco `refactored`.
3. Compare o conteúdo das tabelas afetadas com um hash agregado e determinístico:

```sql
select md5(string_agg(t::text, '|' order by t.id)) from public.exercises t;
```

4. Hashes iguais → o refactor preserva os dados **exatamente**. Diferentes → tem diferença real,
   e aí sim vale investigar.

Foi assim que se provou que o refactor da D5 não perdeu nem alterou nenhum dos 1324 exercícios.
O `order by` explícito é obrigatório: sem ele o `string_agg` não é determinístico e o hash muda
entre execuções sem que nada tenha mudado.

---

## 4. As migrations do repo não rodam num Postgres "puro"

As migrations dependem de objetos que **só existem numa stack Supabase completa**:

- schema e tabela `auth.users` (referenciada por FKs)
- função `auth.uid()` (usada nas policies de RLS)
- publication `supabase_realtime`

**A escolha da imagem muda tudo — e é o atalho que economiza mais tempo:**

| Imagem | O que acontece |
|---|---|
| `postgres:17` (oficial) | Precisa de stub manual: `create schema auth`, tabela `auth.users` mínima, função `auth.uid()`. Mesmo assim, `20260717140000_messages.sql` **falha** por falta da publication `supabase_realtime`. |
| `public.ecr.aws/supabase/postgres:17.6.1.141` | Já traz o schema `auth` com `users`, `uid()`, `role()`, `email()` e a publication. As **18 migrations aplicam com 0 falhas**. |

Prefira a imagem do Supabase: é a mesma que o `supabase start` usa, então o ambiente descartável
fica fiel ao real.

**Pegadinha ao usar a imagem do Supabase:** o schema `auth` **já existe**. Um stub escrito como
`create table auth.users (...)` falha com `relation already exists` e, sob `-v ON_ERROR_STOP=1`,
aborta o script inteiro — inclusive as linhas seguintes que você achava que tinham rodado. Escreva
sempre `create schema if not exists` / `create table if not exists`.

---

## 5. `localhost` não alcança o host de dentro de um container

**Sintoma:** você roda `psql` dentro de um container apontando para um banco que está na **sua
máquina** (ex.: o Postgres descartável publicado em `localhost:55433`) e a conexão é recusada.

**Causa:** dentro do container, `localhost` é o **próprio container**, não o host.

**Correção (Docker Desktop no Windows/macOS):** use `host.docker.internal`.

```bash
# errado, de dentro do container:
postgresql://postgres:postgres@localhost:55433/postgres
# certo:
postgresql://postgres:postgres@host.docker.internal:55433/postgres
```

Só importa para alvo local. Apontar para um Supabase remoto (`db.<ref>.supabase.co`) funciona
normalmente, porque aí o host é externo aos dois.

---

## 6. `git check-ignore` dá falso negativo em diretório que não existe no disco

**Sintoma:** `git check-ignore apps/web/.next` responde que o caminho **não** está ignorado, mesmo
com `.next/` no `.gitignore`. Leva a concluir que o `.gitignore` está errado — não está.

**Causa:** a regra é `.next/`, **com barra final**, então ela só casa com diretórios. O git só
consegue classificar o caminho como diretório se ele existir no disco. Depois de um
`rm -rf apps/web/.next` (item 1), o caminho some e a regra deixa de casar.

**Como testar corretamente:** use um caminho de **arquivo dentro** do diretório.

```bash
git check-ignore -v packages/engine/.next          # exit 1 — "não ignorado" (falso negativo)
git check-ignore -v packages/engine/.next/BUILD_ID # exit 0 — .gitignore:2:.next/  ✅
```
