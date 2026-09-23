-- Restaura o menu do header se estiver vazio (causa página preta sem links).
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
  updated_at = now()
where id = 1
  and (
    nav is null
    or nav = '[]'::jsonb
    or jsonb_typeof(nav) <> 'array'
    or jsonb_array_length(nav) = 0
  );
