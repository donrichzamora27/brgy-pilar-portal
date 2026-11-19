import { supabase } from '../lib/supabase';

export const REACTION_OPTIONS = [
  { type: 'like', label: 'Like' },
  { type: 'support', label: 'Support' },
  { type: 'heart', label: 'Heart' },
];

export async function getPostReactions(postId) {
  const { data, error } = await supabase
    .from('post_reactions')
    .select('id, post_id, user_id, reaction_type, created_at')
    .eq('post_id', postId);

  if (error) throw new Error(error.message || 'Failed to load reactions.');
  return data ?? [];
}

export async function togglePostReaction({ postId, userId, reactionType, currentReaction }) {
  if (!userId) {
    throw new Error('Please sign in to react to this post.');
  }

  if (currentReaction && currentReaction.reaction_type === reactionType) {
    const { error } = await supabase
      .from('post_reactions')
      .delete()
      .eq('id', currentReaction.id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message || 'Unable to remove reaction.');
    return null;
  }

  const { data, error } = await supabase
    .from('post_reactions')
    .upsert(
      {
        post_id: postId,
        user_id: userId,
        reaction_type: reactionType,
      },
      { onConflict: 'post_id,user_id' }
    )
    .select()
    .single();

  if (error) throw new Error(error.message || 'Unable to save reaction.');
  return data;
}
