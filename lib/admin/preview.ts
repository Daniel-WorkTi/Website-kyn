/**
 * URLs de pré-visualização do admin — sempre apontam para as rotas públicas do site
 * (mesmo layout, CSS e componentes que o visitante vê).
 */
export function buildSitePreviewUrl(path = "/", cacheBust?: number | string): string {
  const route = !path || path === "" ? "/" : path.startsWith("/") ? path : `/${path}`;
  const params = new URLSearchParams({ preview: "1" });

  if (cacheBust !== undefined) {
    params.set("t", String(cacheBust));
  }

  return `${route}?${params.toString()}`;
}
