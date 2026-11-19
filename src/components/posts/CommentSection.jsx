import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertCircle, Check, Edit2, MessageSquare, Send, Trash2, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  createPostComment,
  deletePostComment,
  getPostComments,
  updatePostComment,
} from '../../services/commentsService';

export default function CommentSection({ postId }) {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [newBody, setNewBody] = useState('');
  const [posting, setPosting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingBody, setEditingBody] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const list = await getPostComments(postId);
      setComments(list);
    } catch (err) {
      setErrorMsg(err.message || 'Unable to load comments.');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  async function handleCreateComment(e) {
    e.preventDefault();
    if (!isAuthenticated || !user?.id || !newBody.trim()) return;

    setErrorMsg('');
    setPosting(true);
    try {
      const created = await createPostComment({
        postId,
        userId: user.id,
        body: newBody,
      });
      setComments((prev) => [...prev, created]);
      setNewBody('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to post comment.');
    } finally {
      setPosting(false);
    }
  }

  function startEditing(comment) {
    setEditingId(comment.id);
    setEditingBody(comment.body);
    setErrorMsg('');
  }

  async function handleSaveEdit(commentId) {
    if (!user?.id || !editingBody.trim()) return;
    setSavingEdit(true);
    setErrorMsg('');
    try {
      const updated = await updatePostComment({
        commentId,
        userId: user.id,
        body: editingBody,
      });
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
      setEditingId(null);
      setEditingBody('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update comment.');
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(commentId) {
    const ok = window.confirm('Delete this comment?');
    if (!ok) return;

    setErrorMsg('');
    try {
      await deletePostComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete comment.');
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="flex items-center gap-2 text-base font-bold">
        <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <span>Community Comments ({comments.length})</span>
      </h2>

      {errorMsg && (
        <div
          role="alert"
          className="mt-3 flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isAuthenticated ? (
        <form onSubmit={handleCreateComment} className="mt-4">
          <textarea
            rows={3}
            required
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="Share your feedback, question, or support for the barangay..."
            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={posting || !newBody.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-3.5 w-3.5" />
              {posting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          Want to join the discussion?{' '}
          <Link
            to="/login"
            state={{ from: location }}
            className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
          >
            Sign in
          </Link>{' '}
          or{' '}
          <Link
            to="/register"
            className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
          >
            create a resident account
          </Link>{' '}
          to post a comment.
        </div>
      )}

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-xs text-slate-500">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No comments yet. Be the first resident to share feedback.
          </p>
        ) : (
          comments.map((comment) => {
            const isOwner = user?.id === comment.user_id;
            const canDelete = isOwner || isAdmin;
            const authorName = comment.profiles?.full_name || 'Resident';
            const authorIsAdmin = comment.profiles?.role === 'admin';
            const isEdited =
              comment.updated_at &&
              comment.created_at &&
              new Date(comment.updated_at).getTime() - new Date(comment.created_at).getTime() > 2000;

            return (
              <div
                key={comment.id}
                className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {authorName}
                    </span>
                    {authorIsAdmin && (
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        Barangay Admin
                      </span>
                    )}
                    <span className="text-slate-500 dark:text-slate-400">
                      {new Date(comment.created_at).toLocaleString()}
                      {isEdited ? ' (edited)' : ''}
                    </span>
                  </div>

                  {(isOwner || canDelete) && editingId !== comment.id && (
                    <div className="flex items-center gap-1">
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => startEditing(comment)}
                          className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          title="Edit comment"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(comment.id)}
                          className="rounded p-1 text-rose-600 hover:bg-rose-100 dark:text-rose-400 dark:hover:bg-rose-950/60"
                          title="Delete comment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {editingId === comment.id ? (
                  <div className="mt-2.5 space-y-2">
                    <textarea
                      rows={3}
                      value={editingBody}
                      onChange={(e) => setEditingBody(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditingBody('');
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={savingEdit || !editingBody.trim()}
                        onClick={() => handleSaveEdit(comment.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {savingEdit ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">
                    {comment.body}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
