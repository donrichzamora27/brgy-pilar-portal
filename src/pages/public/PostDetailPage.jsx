import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Download,
  FileText,
  MapPin,
  UserCheck,
} from 'lucide-react';
import { getPublishedPostBySlug } from '../../services/publicPostsService';
import ShareButtons from '../../components/posts/ShareButtons';
import ReactionBar from '../../components/posts/ReactionBar';
import CommentSection from '../../components/posts/CommentSection';

const TYPE_BACK_LINKS = {
  announcement: { to: '/announcements', label: 'Back to Announcements' },
  achievement: { to: '/achievements', label: 'Back to Achievements' },
  proposal: { to: '/proposals', label: 'Back to Proposals' },
};

export default function PostDetailPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDetail() {
      setLoading(true);
      setError('');
      try {
        const data = await getPublishedPostBySlug(slug);
        if (active) setPost(data);
      } catch (err) {
        if (active) setError(err.message || 'Unable to load this post.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDetail();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-slate-500">
        Loading post details...
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto my-12 max-w-2xl px-4">
        <div
          role="alert"
          className="flex items-start gap-2 rounded-2xl border border-rose-300 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Post Unavailable</p>
            <p className="mt-1">{error || 'This post may still be in draft or does not exist.'}</p>
            <Link to="/announcements" className="mt-3 inline-block font-semibold underline">
              Return to Announcements
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const backMeta = TYPE_BACK_LINKS[post.type] || TYPE_BACK_LINKS.announcement;
  const isProposal = post.type === 'proposal';
  const formattedBudget =
    isProposal && post.budget !== null && post.budget !== undefined
      ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(
          Number(post.budget)
        )
      : null;

  return (
    <article className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={backMeta.to}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {backMeta.label}
        </Link>

        <ShareButtons slug={post.slug} title={post.title} />
      </div>

      <header className="mt-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-semibold capitalize text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {post.type}
          </span>
          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Calendar className="h-3.5 w-3.5" />
            {post.event_or_target_date}
          </span>
          {isProposal && post.proposal_status && (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 font-semibold capitalize text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              Stage: {post.proposal_status.replace('_', ' ')}
            </span>
          )}
          {isProposal && post.target_purok && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <MapPin className="h-3 w-3" />
              {post.target_purok}
            </span>
          )}
        </div>

        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>

        {formattedBudget && (
          <p className="mt-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            Budget Allocation: {formattedBudget}
          </p>
        )}
      </header>

      {post.cover_image_url && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="max-h-112 w-full object-cover"
          />
        </div>
      )}

      <div className="mt-6 whitespace-pre-line rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-800 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
        {post.content}
      </div>

      {post.officials?.length > 0 && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            In-Charge / Proponent Officials
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {post.officials.map((off) => (
              <div
                key={off.id}
                className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {off.full_name}
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  {off.position}
                  {off.committee ? ` · ${off.committee}` : ''}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {post.attachments?.length > 0 && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Supporting Documents &amp; Media ({post.attachments.length})
          </h2>
          <ul className="mt-3 space-y-2 text-xs">
            {post.attachments.map((att) => (
              <li
                key={att.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-900 dark:text-slate-100">
                    {att.file_name}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    {(att.file_size_bytes / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
                <a
                  href={att.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  Open / Download
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ReactionBar postId={post.id} initialReactions={post.post_reactions ?? []} />
      <CommentSection postId={post.id} />
    </article>
  );
}
