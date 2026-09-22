# Proimagem.pt

Site de portfólio da **Proimagem.pt** com CMS integrado. O cliente edita conteúdo no painel `/admin` e o site público reflete as alterações após guardar.

| | |
|---|---|
| **Produção** | https://website-kyn.vercel.app |
| **Admin** | https://website-kyn.vercel.app/admin |
| **Repositório** | [Daniel-WorkTi/Website-kyn](https://github.com/Daniel-WorkTi/Website-kyn) |

## Stack

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Supabase** — Auth, PostgreSQL (CMS) e Storage (imagens/vídeos)
- **Vercel** — hosting e deploy automático
- **GitHub** — código-fonte (já não é a base de dados operacional do CMS)

Setup detalhado: [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md).

## Arranque local

```bash
# Opção 1 — script Windows (recomendado)
# PowerShell:
.\start-dev.bat
# CMD:
start-dev.bat

# Opção 2 — manual (requer Node.js no PATH)
npm install
npm run dev
```

O dev server corre em **http://localhost:3000**. O `npm run dev` usa **Turbopack**, encerra servidores antigos na porta 3000 e limpa a cache `.next` ao arrancar (evita erros `Cannot find module './XXX.js'`).

**Boas práticas em desenvolvimento:**
- Usa sempre `start-dev.bat` ou `npm run dev` — não abras vários servidores em paralelo.
- Não corras `npm run build` enquanto o dev server está activo (o build bloqueia automaticamente se a porta 3000 estiver ocupada).
- Se algo falhar, fecha todos os terminais com Node e volta a correr `start-dev.bat`.

### Variáveis de ambiente

Cria `.env.local` na raiz (ver `.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://vnpslhbjlrhfuqajeuqx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # só scripts / server — NUNCA no browser
```

> **Nunca** commits `.env.local` — já está no `.gitignore`.

Após configurar Supabase (migration + admin), migra o JSON:

```bash
npm run migrate:supabase
```

## Estrutura do projeto

```
├── app/
│   ├── (site)/          # Site público
│   ├── admin/           # Painel de gestão
│   ├── api/             # APIs legadas (auth cookie / content — em transição)
│   ├── content/         # Rota pública para ler JSON (fallback)
│   └── assets/          # Ficheiros estáticos legacy
├── components/
│   ├── site/            # UI do site (Hero, galerias, Nav…)
│   └── admin/           # UI do painel (editores, sidebar, modais)
├── content/             # JSON de fallback / seed (não é a DB operacional)
├── hooks/               # useAdmin — estado global do admin
├── lib/
│   ├── cms/             # compose / persist / upload (Supabase)
│   ├── supabase/        # clients browser/server/admin + types
│   └── …                # content, gallery-utils, admin helpers
├── supabase/migrations/ # SQL versionado (Postgres + RLS + Storage)
├── scripts/             # migrate-json-to-supabase, etc.
└── docs/                # SUPABASE_SETUP.md
```

## Site público

Páginas dinâmicas — leem do Supabase (com fallback para `content/*.json` se o DB não estiver disponível).

| Rota | Conteúdo |
|------|----------|
| `/` | Home — hero com vídeos + stack de mídias |
| `/studio-space` | Galeria studio (vídeos no topo + grid de fotos) |
| `/multicam` | Vídeos verticais 9:16 |
| `/aftermovie` | Vídeos tipo Reels |
| `/photography` | Fotos com destaque wide |
| `/fpv-drone` | Galeria padrão |
| `/social-media` | Galeria padrão |
| `/team` | Equipa + parceiros |
| `/parceiros` | Secção parceiros |

**Componentes principais:** `Hero`, `HomeStack`, `GalleryView`, `StudioGalleryView`, `MulticamGalleryView`, `ReelsGalleryView`, `TeamView`, `Nav`, `Lightbox`, `SiteChrome`.

**Estilos:** `app/site.css` — visual minimalista (fundo preto, tipografia Inter).

## Painel admin (`/admin`)

### Layout de edição

```
┌─────────────────────────────┬──────────────────┐
│  LiveSitePreview (esquerda) │  Editor (direita)│
│  Site real com scroll       │  Formulários     │
│  Sem menu Nav               │  por secção      │
└─────────────────────────────┴──────────────────┘
```

### Secções editáveis

| Secção | Origem operacional |
|--------|--------------------|
| Home | `site_config` + `media_items` (secção `home`) |
| Studio Space | `sections` + `media_items` |
| Multicam | idem |
| Aftermovie | idem |
| Photography | idem |
| FPV / Drone | idem |
| Social Media | idem |
| Equipa | `team_members` |
| Parceiros | `partners` |
| Mídias | Biblioteca via Storage + `media_items` |

Os ficheiros `content/*.json` servem de **seed/fallback** até a migração e como recuperação.

### Funcionalidades

- **Auto-save** — guarda automaticamente ~1,2s após cada edição
- **Preview ao vivo** — scroll completo do site real, sem Nav
- **Status de gravação** — verde (guardado), vermelho (por guardar), âmbar (a processar)
- **Biblioteca de mídias** — só aparece ao clicar para trocar imagem/vídeo (modal)
- **Definições** — alterar email/password via Supabase Auth

## Fluxo de dados

```
Admin (editores autenticados)
    │
    ▼ Supabase Auth + is_admin()
PostgreSQL (sections, media_items, …)
    │
    ▼
Storage bucket `media`  ◄──── upload browser (direct / TUS)
    │
    ▼
Site público (lib/content.ts)  ──── fallback ────► content/*.json
```

1. Login no `/admin` com email/password (Supabase Auth + linha em `admin_profiles`).
2. Upload de mídia → Storage + metadata em `media_items`.
3. Guardar secção → `persist` actualiza Postgres (e mantém ordem com `sort_order`).
4. Site público lê Postgres; se falhar, usa JSON local.

## Autenticação

- **Supabase Auth** (email + password).
- Autorização admin: tabela `admin_profiles` + função SQL `is_admin()`.
- RLS: anónimos só leem conteúdo publicado; escrita só para admins.
- Middleware refresca a sessão nos requests.

## Mídias (Supabase Storage)

- Upload autenticado do browser para o bucket `media`.
- Vídeos grandes: upload resumable (TUS) com progresso.
- Thumbnails/posters: `thumbnail_path` + `<video poster>`.
- Compressão local de imagens antes do upload (substitui transforms Cloudinary no upload).
- URLs Cloudinary antigas em `legacy_*` continuam a renderizar até reupload.

## Deploy

Push para `main` no GitHub → deploy automático na **Vercel**.

```bash
npm run build   # verificar build localmente
git push origin main
```

Confirma na Vercel (**Settings → Environment Variables**) as variáveis Supabase para **Production** e **Preview**.

**Não** cries `NEXT_PUBLIC_` para `SUPABASE_SERVICE_ROLE_KEY`.

## Scripts úteis

```bash
npm run typecheck
npm run lint
npm run build
npm run migrate:supabase
```
