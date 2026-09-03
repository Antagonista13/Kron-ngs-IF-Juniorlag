# Bilder i Senaste nytt

Bildstödet använder migrationen `supabase/migrations/202609030001_team_post_images.sql`.

Om Supabase-projektet inte kör migrationer automatiskt behöver innehållet i den filen köras i Supabase SQL Editor en gång. Den lägger till kolumnen `image_url`, skapar den publika Storage-bucketen `team-post-images` och begränsar uppladdning/radering till coach/admin i respektive användarmapp.
