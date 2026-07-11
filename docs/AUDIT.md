# Auditoria técnica — Proimagem.pt

Data: Julho 2026  
Objetivo: testar, limpar e preparar para produção **sem alterar layout visual**.

## Comandos executados

| Comando | Resultado |
|---------|-----------|
| `npm install` | OK (108 packages) |
| `npx tsc --noEmit` | OK — sem erros TypeScript |
| `npm run build` | OK — 22 rotas compiladas |
| `npm run lint` | OK — `.eslintrc.json` + ESLint 8 / eslint-config-next@15 (warnings `no-img-element` no site — intencional, Cloudinary URLs) |

## Mapa de fluxos

### Site público (`app/(site)/`)
- Páginas **dinâmicas** (`force-dynamic` no layout)
- Leitura via `lib/content.ts` → `lib/content-store.ts`
- Prioridade: GitHub (`GITHUB_TOKEN`) → fallback disco local

### Admin (`/admin`)
- `AdminApp` → `Workspace` → `ContentWorkspace` ou `MediaLibraryPage`
- Preview: `LiveSitePreview` (site real, sem Nav)
- Editores: `HomeEditor`, `GalleryEditor`, `TeamEditor`, `PartnersEditor`
- Estado: `hooks/useAdmin.tsx` (sessão, secções, auto-save, mídias)

### Guardar conteúdo
```
Editor → useAdmin.save() → POST /api/content
  → writeContentFile (GitHub + local)
  → revalidateContentPaths (cache Next.js)
```

### Mídias
```
Upload → POST /api/cloudinary/sign → Cloudinary direct upload
Biblioteca → GET /api/media (Cloudinary) + URLs do JSON
Delete → DELETE /api/media
```

### Auth
```
POST /api/login → cookie proimagem_session (7 dias, HMAC)
GET /api/session → validação
Settings → private/admin.json (GitHub) ou env vars
```

## Problemas encontrados e acções

### 1. Código legado do editor visual (removido)
Ficheiros **não ligados** ao fluxo activo (`ContentWorkspace`). Eram restos de iteração WYSIWYG anterior.

**Removidos (~70 KB):**
- `Visual*Canvas.tsx`, `VisualEditorFrame`, `EditorShell`, `SitePreviewFrame`
- `RightEditorPanel`, `EditableZone`, `FloatingEditPanel`, `EditableElement`
- `SectionVisualShell`, `VisualMediaControls`, `visual-editor-constants`
- Campos só usados pelo painel visual: `ImageField`, `VideoField`, `TextField`, etc.
- `lib/admin/editor-types.ts` (292 linhas)
- `MediaDetailsPanel.tsx` (nunca importado)

**Mantido:** `MediaPickerField.tsx` (fluxo actual dos editores).

### 2. `useEditorStore` simplificado
Antes: 100 linhas com histórico undo, pageData, seleção de elementos (só usado pelo visual editor).  
Agora: preview desktop/mobile + stub `undo`/`canUndo` para a topbar **sem mudar UI**.

### 3. ESLint não configurado
`npm run lint` abria prompt interactivo. Adicionado `.eslintrc.json` + devDependencies.

### 4. Sync admin → site (já corrigido antes desta auditoria)
Conteúdo guardado no GitHub; site lê via `content-store`; `revalidatePath` após save.

### 5. API `/api/upload` deprecated
Retorna 410 — upload correcto é via `/api/cloudinary/sign`. Mantido para mensagem clara a clientes antigos.

## Riscos conhecidos (não alterados — fora de scope visual)

| Risco | Notas |
|-------|-------|
| Sem rate-limit no login | Aceitável para admin interno; considerar depois |
| `GITHUB_TOKEN` com scope repo | Necessário para CMS; manter secreto na Vercel |
| Resend opcional | Recuperação de palavra-passe falha sem `RESEND_API_KEY` |
| 2 vulnerabilidades npm moderate | Dependências transitivas; `npm audit fix` pode breaking |

## O que NÃO foi alterado (por regra)

- Layout / CSS do site público
- Layout / UI do admin (sidebar, topbar, editores, modais)
- Textos, fluxos de utilizador, regras de galeria
- Bibliotecas ou stack

## Estrutura activa pós-limpeza

```
components/admin/
├── AdminApp, AdminSidebar, Workspace, SettingsModal, LoginForm
├── editor/
│   ├── ContentWorkspace, ContentEditorPanel, LiveSitePreview
│   ├── EditorTopbar
│   └── fields/MediaPickerField.tsx   ← único field activo
├── editors/   Home, Gallery, Team, Partners
├── media/     MediaLibrary, MediaGrid, MediaPickerModal…
└── shared/    DropZone, MediaCard, MediaLibrary, Toast

hooks/
├── useAdmin.tsx      ← estado principal
└── useEditorStore.tsx ← preview mobile/desktop

lib/
├── content-store.ts  ← GitHub + local
├── content.ts        ← leitura site público
├── revalidate-content.ts
├── auth.ts, admin-store.ts, cloudinary.ts, gallery-utils.ts
└── admin/sections.ts, device-preview.ts, api.ts
```

## Verificação pós-refactor

Após alterações, correr:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Testar manualmente:
1. Login admin
2. Editar Home → guardar → ver site público
3. Upload mídia → usar numa galeria
4. Definições → alterar utilizador
