import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Edit2,
  Plus,
  RefreshCw,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useOfficials } from '../../hooks/useOfficials';
import {
  createOfficial,
  deleteOfficialDirectly,
  getLinkedPostsForOfficial,
  reassignPostsAndDeleteOfficial,
  updateOfficial,
} from '../../services/officialsService';
import OfficialFormModal from '../../components/admin/OfficialFormModal';
import OfficialReassignModal from '../../components/admin/OfficialReassignModal';

export default function OfficialsAdminPage() {
  const { officials, loading, error, refetch } = useOfficials({ mode: 'admin' });

  const [formOpen, setFormOpen] = useState(false);
  const [editingOfficial, setEditingOfficial] = useState(null);

  const [reassignTarget, setReassignTarget] = useState(null);
  const [linkedPosts, setLinkedPosts] = useState([]);
  const [checkingDeleteId, setCheckingDeleteId] = useState(null);

  const [actionAlert, setActionAlert] = useState({ type: '', text: '' });

  function openCreateModal() {
    setEditingOfficial(null);
    setFormOpen(true);
  }

  function openEditModal(official) {
    setEditingOfficial(official);
    setFormOpen(true);
  }

  async function handleSaveOfficial(formData) {
    setActionAlert({ type: '', text: '' });
    if (editingOfficial) {
      await updateOfficial(editingOfficial.id, formData);
      setActionAlert({ type: 'success', text: `Updated ${formData.full_name}.` });
    } else {
      await createOfficial(formData);
      setActionAlert({ type: 'success', text: `Added ${formData.full_name}.` });
    }
    await refetch();
  }

  async function handleToggleActive(official) {
    setActionAlert({ type: '', text: '' });
    try {
      await updateOfficial(official.id, {
        ...official,
        is_active: !official.is_active,
      });
      setActionAlert({
        type: 'success',
        text: `${official.full_name} marked as ${!official.is_active ? 'Active' : 'Inactive'}.`,
      });
      await refetch();
    } catch (err) {
      setActionAlert({ type: 'error', text: err.message });
    }
  }

  async function handleDeleteClick(official) {
    setActionAlert({ type: '', text: '' });
    setCheckingDeleteId(official.id);

    try {
      const posts = await getLinkedPostsForOfficial(official.id);
      if (posts.length > 0) {
        setReassignTarget(official);
        setLinkedPosts(posts);
        return;
      }

      const confirmed = window.confirm(
        `Delete ${official.full_name} (${official.position})? This cannot be undone.`
      );
      if (!confirmed) return;

      await deleteOfficialDirectly(official.id);
      setActionAlert({ type: 'success', text: `Deleted ${official.full_name}.` });
      await refetch();
    } catch (err) {
      setActionAlert({ type: 'error', text: err.message });
    } finally {
      setCheckingDeleteId(null);
    }
  }

  async function handleConfirmReassignAndDelete({ fromOfficialId, toOfficialId }) {
    await reassignPostsAndDeleteOfficial({ fromOfficialId, toOfficialId });
    setActionAlert({
      type: 'success',
      text: `Reassigned posts and removed ${reassignTarget?.full_name}.`,
    });
    setReassignTarget(null);
    setLinkedPosts([]);
    await refetch();
  }

  const activeReplacementOptions = officials.filter(
    (o) => o.is_active && o.id !== reassignTarget?.id
  );

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Manage Barangay Officials</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Only officials marked <strong>Active</strong> appear on the public portal. Officials
            linked to posts must have their posts reassigned before deletion.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Add Official
        </button>
      </div>

      {actionAlert.text && (
        <div
          role="status"
          className={`mt-5 flex items-center gap-2 rounded-xl border p-3.5 text-sm ${
            actionAlert.type === 'error'
              ? 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200'
              : 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
          }`}
        >
          {actionAlert.type === 'error' ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          <span>{actionAlert.text}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={refetch}
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
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Official</th>
              <th className="px-4 py-3">Committee</th>
              <th className="px-4 py-3">Linked Posts</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Loading officials...
                </td>
              </tr>
            ) : officials.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No officials added yet. Click &ldquo;Add Official&rdquo; to begin.
                </td>
              </tr>
            ) : (
              officials.map((official) => (
                <tr key={official.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {official.display_order}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{official.full_name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {official.position}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                    {official.committee || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {official.linkedPostCount}{' '}
                      {official.linkedPostCount === 1 ? 'post' : 'posts'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(official)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        official.is_active
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {official.is_active ? (
                        <>
                          <UserCheck className="h-3.5 w-3.5" />
                          Active
                        </>
                      ) : (
                        <>
                          <UserX className="h-3.5 w-3.5" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(official)}
                        className="rounded-lg border border-slate-300 p-1.5 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        title="Edit official"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={checkingDeleteId === official.id}
                        onClick={() => handleDeleteClick(official)}
                        className="rounded-lg border border-rose-300 p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/50"
                        title="Delete official"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <OfficialFormModal
        open={formOpen}
        initialData={editingOfficial}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveOfficial}
      />

      <OfficialReassignModal
        open={Boolean(reassignTarget)}
        targetOfficial={reassignTarget}
        linkedPosts={linkedPosts}
        replacementOptions={activeReplacementOptions}
        onClose={() => {
          setReassignTarget(null);
          setLinkedPosts([]);
        }}
        onConfirmReassignAndDelete={handleConfirmReassignAndDelete}
      />
    </section>
  );
}
