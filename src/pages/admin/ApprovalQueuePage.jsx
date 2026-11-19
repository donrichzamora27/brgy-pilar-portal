import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Edit2,
  Plus,
  RefreshCw,
  Send,
  Trash2,
} from 'lucide-react';
import { POST_TYPES, PUBLISH_STATUSES } from '../../constants/postConfig';
import {
  deletePostAndMedia,
  getAllPostsForAdmin,
  updatePostPublishStatus,
} from '../../services/postsService';

export default function ApprovalQueuePage() {
  const [posts, setPosts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alertMsg, setAlertMsg] = useState('');

  const loadPosts = useCallback(async () => {
    try {
      const list = await getAllPostsForAdmin({ statusFilter, typeFilter });
      setPosts(list);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load posts.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) loadPosts();
    });

    return () => {
      active = false;
    };
  }, [loadPosts]);

  async function handleStatusTransition(post, nextStatus) {
    setAlertMsg('');
    setError('');
    try {
      await updatePostPublishStatus(post.id, nextStatus);
      setAlertMsg(
        `"${post.title}" moved to ${PUBLISH_STATUSES[nextStatus]?.label || nextStatus}.`
      );
      await loadPosts();
    } catch (err) {
      setError(err.message || 'Unable to update post status.');
    }
  }

  async function handleDelete(post) {
    setAlertMsg('');
    setError('');
    const ok = window.confirm(`Delete "${post.title}" and all its uploaded files?`);
    if (!ok) return;

    try {
      await deletePostAndMedia(post);
      setAlertMsg(`Deleted "${post.title}".`);
      await loadPosts();
    } catch (err) {
      setError(err.message || 'Unable to delete post.');
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Content &amp; Approval Queue</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Review drafts and pending submissions before approving them for public residents.
          </p>
        </div>

        <Link
          to="/admin/posts/new"
          className="inline-flex items-center gap-2 self-start rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="all">All Categories</option>
          {POST_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {alertMsg && (
        <div
          role="status"
          className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{alertMsg}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadPosts}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Post</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Assigned Officials</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Workflow &amp; Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Loading posts...
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No posts match the current filter.
                </td>
              </tr>
            ) : (
              posts.map((post) => {
                const statusMeta = PUBLISH_STATUSES[post.publish_status] || PUBLISH_STATUSES.draft;
                return (
                  <tr key={post.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{post.title}</div>
                      <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Date: {post.event_or_target_date}
                        {post.type === 'proposal' && post.target_purok
                          ? ` · ${post.target_purok}`
                          : ''}
                        {post.type === 'proposal' && post.proposal_status
                          ? ` · Stage: ${post.proposal_status.replace('_', ' ')}`
                          : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize">{post.type}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                      {post.officials.length > 0
                        ? post.officials.map((o) => o.full_name).join(', ')
                        : 'Unassigned'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusMeta.badgeClass}`}
                      >
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-2">
                        {post.publish_status === 'draft' && (
                          <button
                            type="button"
                            onClick={() => handleStatusTransition(post, 'pending_approval')}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                          >
                            <Send className="h-3.5 w-3.5" />
                            Submit
                          </button>
                        )}

                        {(post.publish_status === 'draft' ||
                          post.publish_status === 'pending_approval' ||
                          post.publish_status === 'archived') && (
                          <button
                            type="button"
                            onClick={() => handleStatusTransition(post, 'published')}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Publish
                          </button>
                        )}

                        {post.publish_status === 'published' && (
                          <button
                            type="button"
                            onClick={() => handleStatusTransition(post, 'archived')}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <Archive className="h-3.5 w-3.5" />
                            Archive
                          </button>
                        )}

                        <Link
                          to={`/admin/posts/${post.id}/edit`}
                          className="rounded-lg border border-slate-300 p-1.5 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          title="Edit post"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(post)}
                          className="rounded-lg border border-rose-300 p-1.5 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/50"
                          title="Delete post"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}