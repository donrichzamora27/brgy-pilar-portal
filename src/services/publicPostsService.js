import { supabase } from '../lib/supabase';

function normalizePublicPost(post) {
  return {
    ...post,
    officials: (post.post_officials ?? []).map((po) => po.officials).filter(Boolean),
    attachments: post.post_attachments ?? [],
    reactionCount: post.post_reactions?.length ?? 0,
    commentCount: post.post_comments?.length ?? 0,
  };
}

export async function getPublishedPostsByType(type) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      type,
      title,
      slug,
      content,
      cover_image_url,
      event_or_target_date,
      publish_status,
      budget,
      target_purok,
      proposal_status,
      published_at,
      created_at,
      post_officials (
        official_id,
        officials (id, full_name, position, photo_url, is_active)
      ),
      post_attachments (id, file_name, file_url, file_type, file_size_bytes),
      post_reactions (id),
      post_comments (id)
    `)
    .eq('type', type)
    .eq('publish_status', 'published')
    .order('event_or_target_date', { ascending: false })
    .order('published_at', { ascending: false });

  if (error) throw new Error(error.message || `Failed to load ${type}s.`);
  return (data ?? []).map(normalizePublicPost);
}

export async function getPublishedPostBySlug(slug) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      type,
      title,
      slug,
      content,
      cover_image_url,
      event_or_target_date,
      publish_status,
      budget,
      target_purok,
      proposal_status,
      published_at,
      created_at,
      updated_at,
      post_officials (
        official_id,
        officials (id, full_name, position, committee, photo_url, is_active)
      ),
      post_attachments (id, file_name, file_url, file_type, file_size_bytes, uploaded_at),
      post_reactions (id, user_id, reaction_type),
      post_comments (id)
    `)
    .eq('slug', slug)
    .eq('publish_status', 'published')
    .single();

  if (error) throw new Error(error.message || 'Post not found or not yet published.');
  return normalizePublicPost(data);
}
