-- Secção biblioteca: uploads do admin ficam listáveis sem depender do save da galeria.
insert into public.sections (id, type, title, layout, page_path, sort_order)
values ('library', 'gallery', 'Biblioteca de mídia', null, null, 90)
on conflict (id) do update set title = excluded.title;
