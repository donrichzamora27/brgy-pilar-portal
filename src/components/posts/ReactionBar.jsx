import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertCircle, HandHeart, Heart, ThumbsUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getPostReactions,
  REACTION_OPTIONS,
  togglePostReaction,
} from '../../services/reactionsService';

const ICONS = {
  like: ThumbsUp,
  support: HandHeart,
  heart: Heart,
};

export default function ReactionBar({ postId, initialReactions = [] }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const [reactions, setReactions] = useState(initialReactions);
  const [submittingType, setSubmittingType] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const refreshReactions = useCallback(async () => {
    try {
      const list = await getPostReactions(postId);
      setReactions(list);
    } catch (err) {
      setErrorMsg(err.message || 'Unable to refresh reactions.');
    }
  }, [postId]);

  useEffect(() => {
    refreshReactions();
  }, [refreshReactions]);

  const userReaction = useMemo(
    () => (user?.id ? reactions.find((r) => r.user_id === user.id) ?? null : null),
    [reactions, user?.id]
  );

  const countsByType = useMemo(() => {
    const counts = { like: 0, support: 0, heart: 0 };
    for (const r of reactions) {
      if (counts[r.reaction_type] !== undefined) {
        counts[r.reaction_type] += 1;
      }
    }
    return counts;
  }, [reactions]);

  async function handleToggle(type) {
    if (!isAuthenticated || !user?.id) return;
    setErrorMsg('');
    setSubmittingType(type);

    try {
      await togglePostReaction({
        postId,
        userId: user.id,
        reactionType: type,
        currentReaction: userReaction,
      });
      await refreshReactions();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update reaction.');
    } finally {
      setSubmittingType('');
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {REACTION_OPTIONS.map(({ type, label }) => {
            const Icon = ICONS[type] || ThumbsUp;
            const active = userReaction?.reaction_type === type;
            const count = countsByType[type] ?? 0;

            return (
              <button
                key={type}
                type="button"
                disabled={!isAuthenticated || Boolean(submittingType)}
                onClick={() => handleToggle(type)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-75 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                    active
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400">
          {reactions.length} {reactions.length === 1 ? 'total reaction' : 'total reactions'}
        </span>
      </div>

      {!isAuthenticated && (
        <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
          <Link
            to="/login"
            state={{ from: location }}
            className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
          >
            Sign in as a resident
          </Link>{' '}
          to react to this post.
        </p>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="mt-3 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </section>
  );
}
