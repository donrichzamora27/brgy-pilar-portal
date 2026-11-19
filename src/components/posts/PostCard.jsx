import { Link } from 'react-router-dom';
import { Calendar, MapPin, MessageSquare, Paperclip, ThumbsUp, UserCheck } from 'lucide-react';
import ShareButtons from './ShareButtons';

const PROPOSAL_STAGE_BADGES = {
  proposed: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  under_review: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  ongoing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
};

export default function PostCard({ post }) {
  const isProposal = post.type === 'proposal';
  const formattedBudget =
    isProposal && post.budget !== null && post.budget !== undefined
      ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(
          Number(post.budget)
        )
      : null;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700">
      {post.cover_image_url && (
        <Link to={`/posts/${post.slug}`} className="block overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="h-48 w-full object-cover transition duration-300 hover:scale-[1.02]"
          />
        </Link>
      )}

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
              {post.event_or_target_date}
            </span>

            {isProposal && post.proposal_status && (
              <span
                className={`rounded-full px-2.5 py-0.5 font-semibold capitalize ${
                  PROPOSAL_STAGE_BADGES[post.proposal_status] || PROPOSAL_STAGE_BADGES.proposed
                }`}
              >
                {post.proposal_status.replace('_', ' ')}
              </span>
            )}

            {isProposal && post.target_purok && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <MapPin className="h-3 w-3" />
                {post.target_purok}
              </span>
            )}
          </div>

          <Link to={`/posts/${post.slug}`}>
            <h2 className="mt-2 line-clamp-2 text-lg font-bold text-slate-900 hover:text-emerald-600 dark:text-slate-100 dark:hover:text-emerald-400">
              {post.title}
            </h2>
          </Link>

          {formattedBudget && (
            <p className="mt-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Allocated / Estimated Budget: {formattedBudget}
            </p>
          )}

          <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-400">
            {post.content}
          </p>

          {post.officials?.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <UserCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{post.officials.map((o) => o.full_name).join(', ')}</span>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5 dark:border-slate-800">
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <ThumbsUp className="h-3.5 w-3.5" />
              {post.reactionCount ?? 0}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {post.commentCount ?? 0}
            </span>
            {post.attachments?.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <Paperclip className="h-3.5 w-3.5" />
                {post.attachments.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ShareButtons slug={post.slug} title={post.title} />
            <Link
              to={`/posts/${post.slug}`}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              Read More
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
