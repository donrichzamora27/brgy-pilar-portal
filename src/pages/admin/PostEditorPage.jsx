import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  ImagePlus,
  Paperclip,
  Send,
  Trash2,
} from 'lucide-react';
import { POST_TYPES, PROPOSAL_STAGES } from '../../constants/postConfig';
import { useOfficials } from '../../hooks/useOfficials';
import {
  getPostByIdForAdmin,
  removePostAttachment,
  savePostWithRelations,
} from '../../services/postsService';
import { deleteMediaByUrl, uploadMediaFile } from '../../services/storageService';
import { validateUploadFile } from '../../utils/validators';

export default function PostEditorPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const { officials, loading: officialsLoading } = useOfficials({ mode: 'public' });

  const [loadingPost, setLoadingPost] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    type: 'announcement',
    title: '',
    content: '',
    event_or_target_date: new Date().toISOString().split('T')[0],
    publish_status: 'draft',
    budget: '',
    target_purok: '',
    proposal_status: 'proposed',
    cover_image_url: '',
  });

  const [selectedOfficialIds, setSelectedOfficialIds] = useState([]);
  const [coverFile, setCoverFile] = useState(null);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [queuedFiles, setQueuedFiles] = useState([]);

  useEffect(() => {
    if (!isEditMode) return;
    let active = true;

    async function loadPost() {
      setLoadingPost(true);
      setErrorMsg('');
      try {
        const post = await getPostByIdForAdmin(id);
        if (!active) return;
        setForm({
          type: post.type,
          title: post.title,
          content: post.content,
          event_or_target_date: post.event_or_target_date,
          publish_status: post.publish_status,
          budget: post.budget ?? '',
          target_purok: post.target_purok ?? '',
          proposal_status: post.proposal_status ?? 'proposed',
          cover_image_url: post.cover_image_url ?? '',
        });
        setSelectedOfficialIds(post.officialIds ?? []);
        setExistingAttachments(post.attachments ?? []);
      } catch (err) {
        if (active) setErrorMsg(err.message || 'Unable to load post.');
      } finally {
        if (active) setLoadingPost(false);
      }
    }

    loadPost();
    return () => {
      active = false;
    };
  }, [id, isEditMode]);

  function toggleOfficial(officialId) {
    setSelectedOfficialIds((prev) =>
      prev.includes(officialId)
        ? prev.filter((item) => item !== officialId)
        : [...prev, officialId]
    );
  }

  function handleCoverChange(e) {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    const check = validateUploadFile(file, { imagesOnly: true });
    if (!check.valid) {
      setErrorMsg(check.error);
      e.target.value = '';
      return;
    }
    setCoverFile(file);
  }

  function handleAttachmentsSelect(e) {
    setErrorMsg('');
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    for (const f of files) {
      const check = validateUploadFile(f, { imagesOnly: false });
      if (!check.valid) {
        setErrorMsg(check.error);
        e.target.value = '';
        return;
      }
    }

    setQueuedFiles((prev) => [...prev, ...files]);
    e.target.value = '';
  }

  async function handleRemoveExistingAttachment(att) {
    setErrorMsg('');
    try {
      await removePostAttachment(att);
      setExistingAttachments((prev) => prev.filter((item) => item.id !== att.id));
    } catch (err) {
      setErrorMsg(err.message || 'Failed to remove attachment.');
    }
  }

  async function handleSaveWithStatus(nextStatus) {
    setErrorMsg('');

    if (!form.title.trim() || !form.content.trim()) {
      setErrorMsg('Title and description/content are required.');
      return;
    }

    setSubmitting(true);
    try {
      let finalCoverUrl = form.cover_image_url;

      if (coverFile) {
        const uploadedCover = await uploadMediaFile(coverFile, {
          folder: 'covers',
          imagesOnly: true,
        });
        if (form.cover_image_url) {
          await deleteMediaByUrl(form.cover_image_url);
        }
        finalCoverUrl = uploadedCover.fileUrl;
      }

      const uploadedAttachments = [];
      for (const file of queuedFiles) {
        const uploaded = await uploadMediaFile(file, {
          folder: 'attachments',
          imagesOnly: false,
        });
        uploadedAttachments.push(uploaded);
      }

      await savePostWithRelations({
        postId: isEditMode ? id : null,
        payload: {
          ...form,
          cover_image_url: finalCoverUrl,
          publish_status: nextStatus,
        },
        officialIds: selectedOfficialIds,
        newAttachments: uploadedAttachments,
      });

      navigate('/admin/posts', { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save post.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingPost) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-slate-500">
        Loading post editor...
      </div>
    );
  }

  const isProposal = form.type === 'proposal';

  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/posts"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Content &amp; Approval Queue
          </Link>
          <h1 className="mt-2 text-2xl font-bold">
            {isEditMode ? 'Edit Barangay Post' : 'Create Barangay Post'}
          </h1>
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Category & Date */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Post Category *
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              {POST_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              {isProposal ? 'Target / Filing Date *' : 'Event / Post Date *'}
            </label>
            <input
              type="date"
              required
              value={form.event_or_target_date}
              onChange={(e) => setForm({ ...form, event_or_target_date: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Title *
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., Purok 3 Drainage Rehabilitation Proposal"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </div>

        {/* Proposal-Specific Fields */}
        {isProposal && (
          <div className="grid gap-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4 sm:grid-cols-3 dark:border-blue-900/60 dark:bg-blue-950/30">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                Estimated Budget (PHP)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                placeholder="150000.00"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                Target Purok / Sitio
              </label>
              <input
                type="text"
                value={form.target_purok}
                onChange={(e) => setForm({ ...form, target_purok: e.target.value })}
                placeholder="Purok 3"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                Proposal Status
              </label>
              <select
                value={form.proposal_status}
                onChange={(e) => setForm({ ...form, proposal_status: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                {PROPOSAL_STAGES.map((stage) => (
                  <option key={stage.value} value={stage.value}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Description / Content */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Description / Full Content *
          </label>
          <textarea
            rows={6}
            required
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Write the full details for residents..."
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </div>

        {/* Multi-Official Assignment */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            In-Charge / Proponent Officials (Select one or more)
          </label>
          {officialsLoading ? (
            <p className="mt-2 text-xs text-slate-500">Loading active officials...</p>
          ) : officials.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              No active officials found. Add active officials in Manage Officials first.
            </p>
          ) : (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {officials.map((off) => {
                const checked = selectedOfficialIds.includes(off.id);
                return (
                  <label
                    key={off.id}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 text-xs transition ${
                      checked
                        ? 'border-emerald-600 bg-emerald-50/70 dark:border-emerald-500 dark:bg-emerald-950/40'
                        : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOfficial(off.id)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                    />
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{off.full_name}</div>
                      <div className="truncate text-slate-500 dark:text-slate-400">
                        {off.position}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Cover Image Upload (Max 5 MB) */}
        <div className="grid gap-6 border-t border-slate-200 pt-5 sm:grid-cols-2 dark:border-slate-800">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              <ImagePlus className="h-4 w-4" />
              Cover Image (JPG/PNG/WEBP, Max 5 MB)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCoverChange}
              className="mt-2 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-800 hover:file:bg-slate-200 dark:text-slate-400 dark:file:bg-slate-800 dark:file:text-slate-200"
            />
            {coverFile && (
              <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                Selected: {coverFile.name}
              </p>
            )}
            {!coverFile && form.cover_image_url && (
              <div className="mt-2 flex items-center gap-2">
                <img
                  src={form.cover_image_url}
                  alt="Current cover"
                  className="h-12 w-20 rounded object-cover"
                />
                <button
                  type="button"
                  onClick={async () => {
                    await deleteMediaByUrl(form.cover_image_url);
                    setForm({ ...form, cover_image_url: '' });
                  }}
                  className="text-xs text-rose-600 hover:underline dark:text-rose-400"
                >
                  Remove cover
                </button>
              </div>
            )}
          </div>

          {/* Attachments Upload (Images + PDFs, Max 5 MB each) */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              <Paperclip className="h-4 w-4" />
              Attachments (PDF / Photos, Max 5 MB each)
            </label>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleAttachmentsSelect}
              className="mt-2 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-800 hover:file:bg-slate-200 dark:text-slate-400 dark:file:bg-slate-800 dark:file:text-slate-200"
            />

            {(existingAttachments.length > 0 || queuedFiles.length > 0) && (
              <ul className="mt-2.5 space-y-1.5 text-xs">
                {existingAttachments.map((att) => (
                  <li
                    key={att.id}
                    className="flex items-center justify-between rounded bg-slate-100 px-2.5 py-1.5 dark:bg-slate-800"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{att.file_name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingAttachment(att)}
                      className="text-rose-600 hover:text-rose-700 dark:text-rose-400"
                      title="Delete attachment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}

                {queuedFiles.map((file, idx) => (
                  <li
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between rounded bg-emerald-50 px-2.5 py-1.5 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                  >
                    <span className="truncate">+ {file.name} (ready to upload)</span>
                    <button
                      type="button"
                      onClick={() =>
                        setQueuedFiles((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-rose-600 hover:text-rose-700"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Approval Workflow Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSaveWithStatus('draft')}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {submitting ? 'Saving...' : 'Save as Draft'}
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSaveWithStatus('pending_approval')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {submitting ? 'Submitting...' : 'Submit for Approval'}
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSaveWithStatus('published')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" />
            {submitting ? 'Publishing...' : 'Approve & Publish'}
          </button>
        </div>
      </div>
    </section>
  );
}