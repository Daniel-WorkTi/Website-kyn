-- Plano Free: máximo global = 50 MB. Não dá para 500 MB sem Pro.
-- Alinha o bucket media a 50 MB (ou ao Global que tiveres no dashboard).

update storage.buckets
set file_size_limit = 52428800 -- 50 MB
where id = 'media';
