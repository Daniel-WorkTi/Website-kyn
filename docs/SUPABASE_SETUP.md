# Supabase — setup Proimagem.pt

Project URL: `https://vnpslhbjlrhfuqajeuqx.supabase.co`

## 1. Variáveis de ambiente

Copia `.env.example` → `.env.local` e preenche:

```env
NEXT_PUBLIC_SUPABASE_URL=https://vnpslhbjlrhfuqajeuqx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...          # ou PUBLISHABLE_KEY
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...   # preferível se disponível
SUPABASE_SERVICE_ROLE_KEY=...              # só server / scripts — NUNCA no browser
```

Chaves: Dashboard Supabase → **Project Settings → API**.

## 2. Aplicar migration

No SQL Editor do Supabase (ou CLI):

1. Abre `supabase/migrations/20260922120000_init_cms.sql`
2. Executa o SQL completo
3. Confirma: tabelas `sections`, `media_items`, `team_members`, `partners`, `site_config`, `admin_profiles`
4. Confirma bucket Storage `media` (público)

## 3. Criar primeiro admin

1. Authentication → Users → **Add user** (email + password)
2. Copia o `user_id` (UUID)
3. SQL Editor:

```sql
insert into public.admin_profiles (user_id, display_name)
values ('UUID-DO-UTILIZADOR', 'Admin Proimagem');
```

Sem esta linha, o login funciona no Auth mas o painel rejeita (não é admin).

## 4. Migrar conteúdo JSON → Postgres

Com a migration aplicada e `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`:

```bash
node scripts/migrate-json-to-supabase.mjs
```

Isto:
- Copia site / galerias / equipa / parceiros
- Guarda URLs Cloudinary em `legacy_url` / `photo_legacy_url` / etc.
- **Não** apaga nem migra binários do Cloudinary (conta pode estar inacessível)

## 5. Testar localmente

```bash
.\start-dev.bat
```

1. http://localhost:3000 — site (lê Supabase; fallback JSON se falhar)
2. http://localhost:3000/admin — login com email/password do passo 3
3. Upload de uma imagem numa galeria
4. Confirmar ficheiro em Storage → `media/{section}/images/...`
5. Confirmar linha em `media_items`

## 6. Vercel

Project → Settings → Environment Variables — mesmas keys (Production + Preview).

**Nunca** exponhas `SUPABASE_SERVICE_ROLE_KEY` com prefixo `NEXT_PUBLIC_`.

Redeploy após guardar vars.

## 7. Storage paths

```
media/
  {sectionId}/images/{uuid}.ext
  {sectionId}/videos/{uuid}.ext
  {sectionId}/thumbnails/{uuid}.ext
```

Ex.: `studio-space/images/a1b2c3d4.webp`

### Limite de tamanho (vídeos)

| Plano Supabase | Máx. por ficheiro |
|----------------|-------------------|
| **Free** | **50 MB** (não dá para subir) |
| Pro / Team | até 500 GB |

No plano Free o admin **comprime** qualquer vídeo grande para ~45 MB antes do envio.

SQL (bucket alinhado a 50 MB):

```sql
update storage.buckets
set file_size_limit = 52428800
where id = 'media';
```

Dashboard: **Storage → Configuration → Global file size limit** = `50` MB (máximo no Free).

Para vídeos maiores com menos compressão: upgrade para **Pro** e sobe `VIDEO_STORAGE_LIMIT_MB` em `lib/admin/sections.ts`.

## 8. Auth / RLS (resumo)

| Quem | Pode |
|------|------|
| Anónimo | Ler `site_config`, secções publicadas, media, team, partners; ler Storage público |
| Authenticated + `admin_profiles` | CRUD total via `is_admin()` |
| Authenticated sem profile | Sem escrita; login admin é rejeitado |

## 9. Remoção Cloudinary

Código operacional Cloudinary removido (`lib/cloudinary*`, `/api/cloudinary/sign`, package `cloudinary`).

URLs `res.cloudinary.com` **permanecem nos dados** (`legacy_*`) até reuploadares no admin.

## 10. Rollback básico

- Site: se Supabase falhar, `lib/content.ts` faz fallback para `content/*.json`
- Admin: requer Supabase Auth + DB — sem fallback JSON para escrita
- Restaurar package `cloudinary` só se precisares de emergência (não recomendado)

## 11. Password no admin

- **Dentro do painel:** Definições → alterar email / nova palavra-passe (`updateUser`).
- **Esqueci a password (login):** link no formulário → email Supabase → `/auth/callback` → `/admin/reset-password`.

### Redirect URLs (obrigatório)

No Supabase → **Authentication → URL Configuration**:

**Site URL:** `https://website-kyn.vercel.app` (produção)

**Redirect URLs** (adicionar todas):

```
http://localhost:3000/auth/callback
http://localhost:3000/admin/reset-password
https://website-kyn.vercel.app/auth/callback
https://website-kyn.vercel.app/admin/reset-password
```

Sem isto, o link do email de recuperação falha.
