-- Paste ONLY this file into a completely blank Supabase SQL query.
-- It allows a student to remove their own note from the Bondly app.

create policy "bondly_note_owner_delete_v1"
on public.notes
for delete
to authenticated
using (uploader_id = auth.uid());
