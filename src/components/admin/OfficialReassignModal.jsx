import { useState } from 'react';
import { AlertTriangle, ArrowRightLeft, FileText, X } from 'lucide-react';

export default function OfficialReassignModal({
  open,
  targetOfficial,
  linkedPosts,
  replacementOptions,
  onClose,
  onConfirmReassignAndDelete,
}) {
  if (!open || !targetOfficial) return null;

  return (
    <OfficialReassignModalContent
      targetOfficial={targetOfficial}
      linkedPosts={linkedPosts}
      replacementOptions={replacementOptions}
      onClose={onClose}
      onConfirmReassignAndDelete={onConfirmReassignAndDelete}
    />
  );
}

function OfficialReassignModalContent({
  targetOfficial,
  linkedPosts,
  replacementOptions,
  onClose,
  onConfirmReassignAndDelete,
}) {
  const [selectedReplacementId, setSelectedReplacementId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (replacementOptions.length > 0 && !selectedReplacementId) {
      setErrorMsg('Please select a replacement official before deleting.');
      return;
    }

    setSubmitting(true);
    try {
      await onConfirmReassignAndDelete({
        fromOfficialId: targetOfficial.id,
        toOfficialId: selectedReplacementId || null,
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reassign posts and delete official.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Reassign Linked Posts First
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          <strong>{targetOfficial.full_name}</strong> ({targetOfficial.position}) is currently
          assigned to <strong>{linkedPosts.length}</strong>{' '}
          {linkedPosts.length === 1 ? 'post' : 'posts'}. Reassign these posts to another active
          official before removing this record.
        </p>

        <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
          <ul className="space-y-2 text-xs">
            {linkedPosts.map((post) => (
              <li key={post.id} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="line-clamp-1">{post.title}</span>
                </span>
                <span className="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-[11px] capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {post.type} · {post.publish_status.replace('_', ' ')}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mt-3 rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200"
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {replacementOptions.length > 0 ? (
            <div>
              <label
                htmlFor="replacement-official"
                className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400"
              >
                Reassign Posts To
              </label>
              <select
                id="replacement-official"
                required
                value={selectedReplacementId}
                onChange={(e) => setSelectedReplacementId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {replacementOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.full_name} — {opt.position}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              No other active officials are available. Confirming will unlink{' '}
              {targetOfficial.full_name} from these posts before deleting.
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
            >
              <ArrowRightLeft className="h-4 w-4" />
              {submitting ? 'Reassigning & Deleting...' : 'Reassign & Delete Official'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
