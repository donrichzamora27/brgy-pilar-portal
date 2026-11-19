import { supabase } from '../lib/supabase';

export async function getPostComments(postId) {
  const { data, error } = await supabase
    .from('post_comments')
    .select(`
      id,
      post_id,
      user_id,
      body,
      created_at,
      updated_at,
      profiles (
        id,
        full_name,
        avatar_url,
        role
      )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message || 'Failed to load comments.');
  return data ?? [];
}

export async function createPostComment({ postId, userId, body }) {
  const cleanBody = body.trim();
  if (!cleanBody) {
    throw new Error('Comment cannot be empty.');
  }

  const { data, error } = await supabase
    .from('post_comments')
    .insert({
      post_id: postId,
      user_id: userId,
      body: cleanBody,
    })
    .select(`
      id,
      post_id,
      user_id,
      body,
      created_at,
      updated_at,
      profiles (
        id,
        full_name,
        avatar_url,
        role
      )
    `)
    .single();

  if (error) throw new Error(error.message || 'Unable to post comment.');
  return data;
}

export async function updatePostComment({ commentId, userId, body }) {
  const cleanBody = body.trim();
  if (!cleanBody) {
    throw new Error('Comment cannot be empty.');
  }

  const { data, error } = await supabase
    .from('post_comments')
    .update({ body: cleanBody })
    .eq('id', commentId)
    .eq('user_id', userId)
    .select(`
      id,
      post_id,
      user_id,
      body,
      created_at,
      updated_at,
      profiles (
        id,
        full_name,
        avatar_url,
        role
      )
    `)
    .single();

  if (error) throw new Error(error.message || 'Unable to update comment.');
  return data;
}

export async function deletePostComment(commentId) {
  const { error } = await supabase
    .from('post_comments')
    .delete()
    .eq('id', commentId);

  if (error) throw new Error(error.message || 'Unable to delete comment.');
}
