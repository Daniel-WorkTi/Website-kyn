# Proimagem.pt — Guia do site e do painel

## Para o Kym (uso diário)

1. Abre **`https://website-kyn.vercel.app/admin`**
2. Entra com **utilizador** e **palavra-passe** (não precisa de GitHub)
3. Escolhe a página na barra lateral
4. Vês as fotos tal como estão no site
5. Edita, adiciona, remove ou reordena
6. Clica **Guardar alterações** — o site atualiza em ~1 minuto

---

## Configuração no Vercel (programador — 1 vez)

No projeto Vercel → **Settings → Environment Variables**, adiciona:

| Variável | O que é | Exemplo |
|---|---|---|
| `ADMIN_USERNAME` | Utilizador do painel | `kym` |
| `ADMIN_PASSWORD` | Palavra-passe (forte!) | `Proimagem2026!` |
| `SESSION_SECRET` | Chave secreta aleatória (32+ caracteres) | `a8f3k2m9x7p1q4w6z0b5n8j2h7` |
| `GITHUB_TOKEN` | Token do GitHub (só o servidor usa — invisível ao Kym) | `ghp_xxxx...` |

Depois faz **Redeploy** no Vercel.

### Como criar o GITHUB_TOKEN
1. GitHub → **Settings → Developer settings → Personal access tokens**
2. **Generate new token (classic)** ou fine-grained com acesso ao repo `Website-kyn`
3. Permissão: **repo** (leitura + escrita)
4. Copia o token e cola em `GITHUB_TOKEN` no Vercel

> O Kym **nunca vê** este token. Serve só para o servidor publicar alterações no site.

### Segurança
- Usa palavra-passe forte (mín. 12 caracteres, letras + números + símbolos)
- Não partilhes as credenciais por WhatsApp sem encriptação
- Podes mudar a palavra-passe a qualquer momento no Vercel → Environment Variables → Redeploy

---

## Estrutura

```
content/            → conteúdo editável
admin/              → painel visual (português)
api/                → login + gravação segura
lib/                → autenticação (servidor)
```
