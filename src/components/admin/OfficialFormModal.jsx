import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

const EMPTY_FORM = {
  full_name: '',
  position: '',
  committee: '',
  photo_url: '',
  term_start: '',
  term_end: '',
  display_order: 0,
  is_active: true,
};

export default function OfficialFormModal({ open, initialData, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!open) return undefined;

    const resetTimer = window.setTimeout(() => {
      setErrorMsg('');
      if (initialData) {
        setForm({
          full_name: initialData.full_name || '',
          position: initialData.position || '',
          committee: initialData.committee || '',
          photo_url: initialData.photo_url || '',
          term_start: initialData.term_start || '',
          term_end: initialData.term_end || '',
          display_order: initialData.display_order ?? 0,
          is_active: Boolean(initialData.is_active),
        });
      } else {
        setForm(EMPTY_FORM);
      }
    }, 0);

    return () => window.clearTimeout(resetTimer);
  }, [open, initialData]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!form.full_name.trim() || !form.position.trim()) {
      setErrorMsg('Full name and position are required.');
      return;
    }

    setSubmitting(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Unable to save official.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {initialData ? 'Edit Barangay Official' : 'Add Barangay Official'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Hon. Maria Santos"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                Position *
              </label>
              <input
                type="text"
                required
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="Punong Barangay / Kagawad"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Committee (Optional)
            </label>
            <input
              type="text"
              value={form.committee}
              onChange={(e) => setForm({ ...form, committee: e.target.value })}
              placeholder="Committee on Infrastructure & Public Works"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Photo URL (Optional)
            </label>
            <input
              type="url"
              value={form.photo_url}
              onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                Term Start
              </label>
              <input
                type="date"
                value={form.term_start}
                onChange={(e) => setForm({ ...form, term_start: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                Term End
              </label>
              <input
                type="date"
                value={form.term_end}
                onChange={(e) => setForm({ ...form, term_end: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                Display Order
              </label>
              <input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 pt-1 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
            />
            <span>Active official (visible on the public Barangay Officials directory)</span>
          </label>

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
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? 'Saving...' : initialData ? 'Save Changes' : 'Add Official'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
