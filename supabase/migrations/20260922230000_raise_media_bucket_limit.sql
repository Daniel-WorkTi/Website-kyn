-- Aumentar limite do bucket media (alinhado com uploads TUS de vídeo).
-- NOTA: o limite GLOBAL em Storage Settings também tem de ser ≥ este valor.

update storage.buckets
set file_size_limit = 524288000 -- 500 MB
where id = 'media';
