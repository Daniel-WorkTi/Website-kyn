# Proimagem.pt — Guia do site e do painel

## Para o Kym (uso diário)

1. Abre **`https://website-kyn.vercel.app/admin`**
2. Clica **Entrar com GitHub** e autoriza (só na primeira vez)
3. Escolhe a página na barra lateral (Multicam, Photography, Equipa, etc.)
4. Vês **as fotos tal como estão no site** — cada cartão mostra a pré-visualização
5. Para alterar: edita o texto, cola um novo link, ou clica **Carregar ficheiro**
6. Para remover: botão **Remover**
7. Para reordenar: **↑ Subir** / **↓ Descer**
8. Clica **Guardar alterações** — o site atualiza em ~1 minuto

### Dicas
- **Destaque** = a mídia ocupa a largura toda no site
- Fotos: comprimir antes de enviar (ex. [squoosh.app](https://squoosh.app))
- Vídeos grandes: usar link externo (YouTube/Vimeo) ou Cloudinary

---

## Configuração técnica (já feita)

| Item | Valor |
|---|---|
| Repositório | `Daniel-WorkTi/Website-kyn` |
| Site | `https://website-kyn.vercel.app` |
| Painel | `https://website-kyn.vercel.app/admin` |
| OAuth callback | `https://website-kyn.vercel.app/api/callback` |

---

## Estrutura

```
content/            → conteúdo editável (JSON)
  site.json           página inicial
  team.json           equipa
  partners.json       parceiros
  galleries/          uma pasta por secção
assets/uploads/     → ficheiros enviados pelo painel
admin/              → painel visual (português)
api/                → login GitHub + gravação
```

O design (`css/`, `js/`, `*.html`) não precisa de ser mexido para alterar conteúdo.
