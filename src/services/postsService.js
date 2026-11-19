import { supabase } from '../lib/supabase';
import { generatePostSlug } from '../utils/slugify';
import { deleteMediaByUrl } from './storageService';

export async function getAllPostsForAdmin({ statusFilter = 'all', typeFilter = 'all' } = {}) {
  let query = supabase
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
        officials (id, full_name, position, is_active)
      ),
      post_attachments (id, file_name, file_url, file_type, file_size_bytes)
    `)
    .order('updated_at', { ascending: false });

  if (statusFilter !== 'all') {
    query = query.eq('publish_status', statusFilter);
  }
  if (typeFilter !== 'all') {
    query = query.eq('type', typeFilter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message || 'Failed to load admin posts.');

  return (data ?? []).map((post) => ({
    ...post,
    officials: (post.post_officials ?? []).map((po) => po.officials).filter(Boolean),
    officialIds: (post.post_officials ?? []).map((po) => po.official_id),
    attachments: post.post_attachments ?? [],
  }));
}

export async function getPostByIdForAdmin(postId) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      post_officials (official_id),
      post_attachments (id, file_name, file_url, file_type, file_size_bytes, uploaded_at)
    `)
    .eq('id', postId)
    .single();

  if (error) throw new Error(error.message || 'Failed to load post details.');

  return {
    ...data,
    officialIds: (data.post_officials ?? []).map((po) => po.official_id),
    attachments: data.post_attachments ?? [],
  };
}

export async function savePostWithRelations({
  postId = null,
  payload,
  officialIds = [],
  newAttachments = [],
}) {
  const isProposal = payload.type === 'proposal';
  const targetStatus = payload.publish_status || 'draft';

  const postRecord = {
    type: payload.type,
    title: payload.title.trim(),
    content: payload.content.trim(),
    cover_image_url: payload.cover_image_url || null,
    event_or_target_date: payload.event_or_target_date,
    publish_status: targetStatus,
    budget: isProposal && payload.budget !== '' && payload.budget !== null
      ? Number(payload.budget)
      : null,
    target_purok: isProposal ? payload.target_purok?.trim() || null : null,
    proposal_status: isProposal ? payload.proposal_status || 'proposed' : null,
  };

  let savedPost;

  if (postId) {
    const { data, error } = await supabase
      .from('posts')
      .update(postRecord)
      .eq('id', postId)
      .select()
      .single();

    if (error) throw new Error(error.message || 'Failed to update post.');
    savedPost = data;

    const { error: delLinksErr } = await supabase
      .from('post_officials')
      .delete()
      .eq('post_id', postId);

    if (delLinksErr) throw new Error(delLinksErr.message || 'Failed to update assigned officials.');
  } else {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        ...postRecord,
        slug: generatePostSlug(payload.title),
      })
      .select()
      .single();

    if (error) throw new Error(error.message || 'Failed to create post.');
    savedPost = data;
  }

  const uniqueOfficialIds = [...new Set(officialIds.filter(Boolean))];
  if (uniqueOfficialIds.length > 0) {
    const officialLinks = uniqueOfficialIds.map((officialId) => ({
      post_id: savedPost.id,
      official_id: officialId,
    }));

    const { error: linkErr } = await supabase.from('post_officials').insert(officialLinks);
    if (linkErr) throw new Error(linkErr.message || 'Failed to assign officials to post.');
  }

  if (newAttachments.length > 0) {
    const attachmentRows = newAttachments.map((att) => ({
      post_id: savedPost.id,
      file_name: att.fileName,
      file_url: att.fileUrl,
      file_type: att.fileType,
      file_size_bytes: att.fileSizeBytes,
    }));

    const { error: attErr } = await supabase.from('post_attachments').insert(attachmentRows);
    if (attErr) throw new Error(attErr.message || 'Failed to save attachment metadata.');
  }

  return savedPost;
}

export async function updatePostPublishStatus(postId, nextStatus) {
  const updates = { publish_status: nextStatus };
  if (nextStatus === 'published') {
    updates.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', postId)
    .select()
    .single();

  if (error) throw new Error(error.message || 'Failed to update post status.');
  return data;
}

export async function removePostAttachment(attachment) {
  await deleteMediaByUrl(attachment.file_url);
  const { error } = await supabase
    .from('post_attachments')
    .delete()
    .eq('id', attachment.id);

  if (error) throw new Error(error.message || 'Failed to delete attachment.');
}

export async function deletePostAndMedia(post) {
  if (post.cover_image_url) {
    await deleteMediaByUrl(post.cover_image_url);
  }
  if (Array.isArray(post.attachments)) {
    for (const att of post.attachments) {
      await deleteMediaByUrl(att.file_url);
    }
  }

  const { error } = await supabase.from('posts').delete().eq('id', post.id);
  if (error) throw new Error(error.message || 'Failed to delete post.');
}