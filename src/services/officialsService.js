import { supabase } from '../lib/supabase';

export async function getActiveOfficials() {
  const { data, error } = await supabase
    .from('officials')
    .select('id, full_name, position, committee, photo_url, term_start, term_end, display_order, is_active')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('full_name', { ascending: true });

  if (error) throw new Error(error.message || 'Failed to load active officials.');
  return data ?? [];
}

export async function getAllOfficialsForAdmin() {
  const { data, error } = await supabase
    .from('officials')
    .select(`
      id,
      full_name,
      position,
      committee,
      photo_url,
      term_start,
      term_end,
      display_order,
      is_active,
      created_at,
      post_officials (post_id)
    `)
    .order('display_order', { ascending: true })
    .order('full_name', { ascending: true });

  if (error) throw new Error(error.message || 'Failed to load officials.');

  return (data ?? []).map((item) => ({
    ...item,
    linkedPostCount: item.post_officials?.length ?? 0,
  }));
}

export async function createOfficial(payload) {
  const record = {
    full_name: payload.full_name.trim(),
    position: payload.position.trim(),
    committee: payload.committee?.trim() || null,
    photo_url: payload.photo_url?.trim() || null,
    term_start: payload.term_start || null,
    term_end: payload.term_end || null,
    display_order: Number(payload.display_order) || 0,
    is_active: Boolean(payload.is_active),
  };

  const { data, error } = await supabase
    .from('officials')
    .insert(record)
    .select()
    .single();

  if (error) throw new Error(error.message || 'Failed to create official.');
  return data;
}

export async function updateOfficial(id, payload) {
  const updates = {
    full_name: payload.full_name.trim(),
    position: payload.position.trim(),
    committee: payload.committee?.trim() || null,
    photo_url: payload.photo_url?.trim() || null,
    term_start: payload.term_start || null,
    term_end: payload.term_end || null,
    display_order: Number(payload.display_order) || 0,
    is_active: Boolean(payload.is_active),
  };

  const { data, error } = await supabase
    .from('officials')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message || 'Failed to update official.');
  return data;
}

export async function getLinkedPostsForOfficial(officialId) {
  const { data, error } = await supabase
    .from('post_officials')
    .select(`
      post_id,
      posts (
        id,
        title,
        type,
        publish_status,
        event_or_target_date
      )
    `)
    .eq('official_id', officialId);

  if (error) throw new Error(error.message || 'Failed to check linked posts.');

  return (data ?? [])
    .map((row) => row.posts)
    .filter(Boolean);
}

export async function reassignPostsAndDeleteOfficial({ fromOfficialId, toOfficialId }) {
  const { data: existingLinks, error: fetchErr } = await supabase
    .from('post_officials')
    .select('post_id')
    .eq('official_id', fromOfficialId);

  if (fetchErr) throw new Error(fetchErr.message || 'Failed to read linked posts.');

  const postIds = (existingLinks ?? []).map((row) => row.post_id);

  if (postIds.length > 0 && toOfficialId) {
    const upsertRows = postIds.map((postId) => ({
      post_id: postId,
      official_id: toOfficialId,
    }));

    const { error: upsertErr } = await supabase
      .from('post_officials')
      .upsert(upsertRows, { onConflict: 'post_id,official_id', ignoreDuplicates: true });

    if (upsertErr) {
      throw new Error(upsertErr.message || 'Failed to assign posts to replacement official.');
    }
  }

  if (postIds.length > 0) {
    const { error: unlinkErr } = await supabase
      .from('post_officials')
      .delete()
      .eq('official_id', fromOfficialId);

    if (unlinkErr) {
      throw new Error(unlinkErr.message || 'Failed to unlink posts from official.');
    }
  }

  const { error: deleteErr } = await supabase
    .from('officials')
    .delete()
    .eq('id', fromOfficialId);

  if (deleteErr) {
    throw new Error(deleteErr.message || 'Failed to delete official after reassignment.');
  }
}

export async function deleteOfficialDirectly(officialId) {
  const { error } = await supabase
    .from('officials')
    .delete()
    .eq('id', officialId);

  if (error) {
    if (error.code === '23503') {
      throw new Error('This official is still linked to existing posts. Please reassign their posts first.');
    }
    throw new Error(error.message || 'Failed to delete official.');
  }
}
