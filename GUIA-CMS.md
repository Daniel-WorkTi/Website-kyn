# Proimagem.pt — Guia do site e do painel de conteúdo

Este site tem **duas partes**:

1. **O site** (o que os visitantes veem) — páginas `.html` + `css/` + `js/`.
2. **O conteúdo** (o que o Kym edita) — ficheiros na pasta `content/` e as mídias em `assets/uploads/`.

O Kym **nunca precisa de mexer em código**. Ele entra no painel visual em `proimagem.pt/admin`, arrasta fotos/vídeos, escreve textos e clica em publicar. O site atualiza-se sozinho.

---

## Como o Kym usa o painel (dia a dia)

1. Ir a **`teu-site.vercel.app/admin`** (ou `proimagem.pt/admin`).
2. Clicar em **"Login with GitHub"** e autorizar (só na primeira vez).
3. Escolher a secção na barra lateral:
   - **Site (geral)** — nome, menu, cabeçalho da Home, redes sociais
   - **Galerias** — Studio Space, Multicam, Aftermovie, Photography, FPV/Drone, Social Media
   - **Equipa** — destaques + lista de membros e os filtros a que pertencem
   - **Parceiros** — principais e secundários
4. **Adicionar mídia:** dentro de uma galeria, clicar em **"Add Mídias"**, escolher tipo (imagem/vídeo), arrastar o ficheiro, escrever a descrição. Marcar **"Destaque"** para ocupar a largura toda.
5. **Remover:** clicar no lixo ao lado do item.
6. **Reordenar:** arrastar os itens.
7. Clicar em **"Publish" → "Publish now"**. Em ~1 minuto o site fica atualizado.

---

## Configuração inicial (feita 1 vez pelo programador)

### 1. Pôr o código no GitHub
- Criar um repositório em [github.com/new](https://github.com/new) (ex.: `proimagem-site`).
- Enviar este projeto para lá:
  ```bash
  git init
  git add .
  git commit -m "Site Proimagem.pt + painel CMS"
  git branch -M main
  git remote add origin https://github.com/OWNER/proimagem-site.git
  git push -u origin main
  ```

### 2. Publicar no Vercel
- Entrar em [vercel.com](https://vercel.com) com a conta GitHub.
- **Add New → Project → Import** o repositório.
- Framework: **Other** (é um site estático). Clicar **Deploy**.
- Fica online em `https://proimagem-site.vercel.app` (o domínio próprio `proimagem.pt` liga-se depois em Settings → Domains).

### 3. Criar a app OAuth do GitHub (para o login do painel)
- Ir a **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**.
- Preencher:
  - **Homepage URL:** `https://proimagem-site.vercel.app`
  - **Authorization callback URL:** `https://proimagem-site.vercel.app/api/callback`
- Guardar o **Client ID** e gerar um **Client Secret**.

### 4. Ligar as chaves no Vercel
- No projeto Vercel → **Settings → Environment Variables**, adicionar:
  - `OAUTH_GITHUB_CLIENT_ID` = (o Client ID)
  - `OAUTH_GITHUB_CLIENT_SECRET` = (o Client Secret)
- Fazer **Redeploy**.

### 5. Ligar o painel ao repositório
Editar **`admin/config.yml`** e substituir:
- `OWNER/REPO` → ex.: `kymwiller/proimagem-site`
- `https://SEU-SITE.vercel.app` → o domínio real do site

Fazer commit/push. Pronto — o painel funciona em `/admin`.

---

## Mídias: importante para o site não ficar lento

- **Fotos:** exportar em ~2000px de largura e comprimir (ex.: [squoosh.app](https://squoosh.app)). Manda para o painel diretamente.
- **Vídeos:** o GitHub **não** é bom para vídeos grandes (limite 100 MB por ficheiro).
  O painel já está preparado para o **Cloudinary** (grátis, otimiza e serve por CDN).

### Ligar o Cloudinary (1 vez)
1. Criar conta grátis em [cloudinary.com](https://cloudinary.com).
2. No **Dashboard**, copiar o **Cloud name** e a **API Key**.
3. Em `admin/config.yml`, na secção `media_library`, substituir:
   - `CLOUD_NAME` → o cloud name
   - `API_KEY` → a API key
   (Não pôr aqui o *API Secret* — não é necessário e é privado.)
4. Commit/push. A partir daí, ao adicionar mídia no painel, o Kym envia para o
   Cloudinary e o site recebe o link otimizado automaticamente — vídeo incluído.

---

## Estrutura das pastas

```
content/            → o conteúdo editável (JSON)
  site.json           definições gerais + Home
  team.json           equipa
  partners.json       parceiros
  galleries/          uma por secção
assets/uploads/     → fotos/vídeos enviados pelo painel
admin/              → o painel de gestão (Decap CMS)
api/                → login seguro do painel (Vercel)
css/ js/            → design e comportamento (não mexer)
*.html              → páginas (cascas que carregam o conteúdo)
```
