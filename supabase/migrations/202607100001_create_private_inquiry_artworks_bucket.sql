-- TRRY Rev 3 private artwork upload foundation.
-- Creates a private bucket for customer inquiry artwork files.
-- Uploads and downloads should be authorized through server routes or signed URLs.
-- This migration intentionally does not add broad anonymous read/list policies.
-- This migration intentionally does not allow anonymous listing of files.

insert into storage.buckets (id, name, public)
values ('inquiry-artworks', 'inquiry-artworks', false)
on conflict (id) do update
set public = false;