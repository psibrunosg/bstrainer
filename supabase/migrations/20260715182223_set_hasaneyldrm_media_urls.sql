update public.exercises
set media_url = '/exercise-media/bstrainer/' || external_id || '.gif'
where org_id is null
  and source = 'hasaneyldrm'
  and external_id is not null
  and media_url is distinct from '/exercise-media/bstrainer/' || external_id || '.gif';
