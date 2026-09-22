-- Corrige seed: nav/hero vazios deixavam o site público sem menu.
-- Idempotente: só actualiza se nav ainda estiver vazio.

update public.site_config
set
  nav = '[
    {"label":"Home","href":"/"},
    {"label":"Studio Space","href":"/studio-space"},
    {"label":"Multicam","href":"/multicam"},
    {"label":"Aftermovie","href":"/aftermovie"},
    {"label":"Photography","href":"/photography"},
    {"label":"FPV/Drone","href":"/fpv-drone"},
    {"label":"Social Media","href":"/social-media"},
    {"label":"Meet the Team","href":"/team"}
  ]'::jsonb,
  hero = coalesce(nullif(hero, '{}'::jsonb), '{
    "title":"PROIMAGEM.PT",
    "subtitleLines":[
      "MULTICAM | AFTERMOVIE | PHOTOGRAPHY",
      "FPV/DRONE | SOCIAL MEDIA | STUDIO SPACE"
    ],
    "buttonText":"VER TRABALHOS",
    "buttonLink":"/studio-space",
    "buttonStyle":"primary",
    "buttonVisible":true,
    "mediaType":"video",
    "visible":true,
    "titleSize":"large",
    "titleAlign":"center",
    "titleColor":"#ffffff"
  }'::jsonb),
  updated_at = now()
where id = 1
  and (
    nav is null
    or nav = '[]'::jsonb
    or jsonb_typeof(nav) <> 'array'
    or jsonb_array_length(nav) = 0
  );
