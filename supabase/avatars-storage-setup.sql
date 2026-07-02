-- À exécuter une seule fois dans le SQL Editor de ton projet Supabase
-- (Dashboard → SQL Editor → New query → coller → Run)

-- 1. Créer le bucket "avatars" (public en lecture)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2. Tout le monde peut voir les avatars (bucket public)
create policy "Avatar images are publicly accessible"
on storage.objects for select
using (bucket_id = 'avatars');

-- 3. Un utilisateur connecté peut uploader UNIQUEMENT dans son propre dossier
--    (le code stocke les fichiers sous la forme "<user_id>/avatar.jpg")
create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Un utilisateur connecté peut remplacer son propre avatar
create policy "Users can update their own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. (optionnel) Un utilisateur peut supprimer son propre avatar
create policy "Users can delete their own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
