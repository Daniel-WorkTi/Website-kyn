# Proimagem.pt

Site de portfólio da **Proimagem.pt** com CMS próprio integrado. O cliente edita conteúdo no painel `/admin` e o site público reflete as alterações após guardar.

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
- **Cloudinary** — imagens e vídeos
- **GitHub API** — persistência do conteúdo JSON
- **Vercel** — hosting e deploy automático

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

Cria `.env.local` na raiz do projeto:

```env
# Login do painel
ADMIN_USERNAME=teu_utilizador
ADMIN_PASSWORD=tua_palavra_passe
SESSION_SECRET=string_aleatoria_longa

# GitHub — gravar e ler conteúdo
GITHUB_TOKEN=ghp_...

# Cloudinary — upload de mídias
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME

# Email — recuperação de palavra-passe (opcional)
RESEND_API_KEY=re_...
EMAIL_FROM=Proimagem.pt <hello@proimagem.pt>
ADMIN_EMAIL=hello@proimagem.pt
```

> **Nunca** commits `.env.local` — já está no `.gitignore`.

## Estrutura do projeto

```
├── app/
│   ├── (site)/          # Site público
│   ├── admin/           # Painel de gestão
│   ├── api/             # APIs (auth, conteúdo, mídia, cloudinary)
│   ├── content/         # Rota pública para ler JSON
│   └── assets/          # Ficheiros estáticos legacy
├── components/
│   ├── site/            # UI do site (Hero, galerias, Nav…)
│   └── admin/           # UI do painel (editores, sidebar, modais)
├── content/             # Dados do site em JSON
├── hooks/               # useAdmin — estado global do admin
├── lib/                 # Auth, content-store, cloudinary, gallery-utils…
└── private/             # Config admin (gitignored localmente)
```

## Site público

Páginas dinâmicas — leem o conteúdo mais recente em cada pedido.

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

| Secção | Ficheiro JSON |
|--------|---------------|
| Home | `content/site.json` |
| Studio Space | `content/galleries/studio-space.json` |
| Multicam | `content/galleries/multicam.json` |
| Aftermovie | `content/galleries/aftermovie.json` |
| Photography | `content/galleries/photography.json` |
| FPV / Drone | `content/galleries/fpv-drone.json` |
| Social Media | `content/galleries/social-media.json` |
| Equipa | `content/team.json` |
| Parceiros | `content/partners.json` |
| Mídias | Biblioteca Cloudinary (sem JSON próprio) |

### Funcionalidades

- **Auto-save** — guarda automaticamente ~1,2s após cada edição
- **Preview ao vivo** — scroll completo do site real, sem Nav
- **Status de gravação** — verde (guardado), vermelho (por guardar), âmbar (a processar)
- **Biblioteca de mídias** — só aparece ao clicar para trocar imagem/vídeo (modal)
- **Definições** — alterar utilizador; recuperar palavra-passe por código enviado ao email

## Fluxo de dados

```
Admin (editores)
    │
    ▼ POST /api/content
GitHub (content/*.json)  ◄────  lib/content-store.ts  ────►  Site público
    │                              (leitura unificada)
    ▼
Disco local (dev)

Upload de mídias
    │
    ▼ POST /api/cloudinary/sign → upload directo
Cloudinary (imagens e vídeos)
```

1. O admin edita e guarda → JSON vai para o **GitHub** (e disco local em dev).
2. Após guardar, o Next.js **invalida o cache** das páginas afectadas (`revalidatePath`).
3. O site público lê sempre o JSON mais recente via `GITHUB_TOKEN`.
4. Imagens e vídeos são enviados para o **Cloudinary** e referenciados por URL no JSON.

## APIs

| Endpoint | Função |
|----------|--------|
| `POST /api/login` | Iniciar sessão (cookie 7 dias) |
| `GET /api/session` | Verificar sessão |
| `POST /api/logout` | Terminar sessão |
| `GET/POST /api/content` | Ler/gravar JSON (admin) |
| `GET /content/[...path]` | Ler JSON (público, para o admin) |
| `GET/DELETE /api/media` | Listar/apagar ficheiros Cloudinary |
| `POST /api/cloudinary/sign` | Assinatura para upload directo |
| `GET/PUT /api/admin/settings` | Perfil do utilizador admin |
| `POST/PATCH /api/admin/settings/password` | Nova palavra-passe com verificação por email |

## Autenticação

- Login com `ADMIN_USERNAME` + `ADMIN_PASSWORD` (variáveis de ambiente ou `private/admin.json` no GitHub).
- Sessão em cookie `proimagem_session`, assinado com `SESSION_SECRET`.
- Palavra-passe guardada com hash **scrypt** — nunca em texto simples.
- Recuperação de palavra-passe: código de 6 dígitos enviado por email (requer `RESEND_API_KEY`).

## Mídias (Cloudinary)

- Upload directo do browser para o Cloudinary (signed upload).
- Compressão automática de vídeos grandes antes do envio.
- Biblioteca global no admin: listar, enviar, apagar, copiar URL.
- URLs no formato `https://res.cloudinary.com/zk5df6k0/...`

## Deploy

Push para `main` no GitHub → deploy automático na **Vercel**.

```bash
npm run build   # verificar build localmente
git push origin main
```

Confirma na Vercel (**Settings → Environment Variables**) que todas as variáveis de `.env.local` estão definidas para **Production**.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server com Turbopack (porta 3000; limpa cache ao arrancar) |
| `npm run dev:webpack` | Dev server legado Webpack (só se Turbopack falhar) |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção |
| `npm run lint` | ESLint |

## Ficheiros de conteúdo

| Ficheiro | Conteúdo |
|----------|----------|
| `content/site.json` | Home, navegação, hero, homeStack |
| `content/galleries/*.json` | Galerias (título, items, layout) |
| `content/team.json` | Membros da equipa |
| `content/partners.json` | Logótipos de parceiros |

Layouts de galeria suportados: `default`, `studio`, `multicam`, `reels` — processados em `lib/gallery-utils.ts`.

## Documentação adicional

- [GUIA-CMS.md](./GUIA-CMS.md) — guia para o cliente editar conteúdo no painel

---

**Proimagem.pt** — Multicam · Aftermovie · Photography · FPV/Drone · Social Media · Studio Space
