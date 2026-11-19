import { useMemo, useState } from 'react';
import { AlertCircle, RefreshCw, Search, Shield, Users } from 'lucide-react';
import { useOfficials } from '../../hooks/useOfficials';

export default function OfficialsPage() {
  const { officials, loading, error, refetch } = useOfficials({ mode: 'public' });
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOfficials = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return officials;
    return officials.filter(
      (o) =>
        o.full_name.toLowerCase().includes(q) ||
        o.position.toLowerCase().includes(q) ||
        (o.committee && o.committee.toLowerCase().includes(q))
    );
  }, [officials, searchQuery]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <Users className="h-3.5 w-3.5" />
            <span>Current Term Directory</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Barangay Officials
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Meet the currently serving officials and committee chairs of our barangay.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, position, committee..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
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

      {loading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      ) : filteredOfficials.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {searchQuery
              ? 'No active officials matched your search.'
              : 'No active barangay officials have been published yet.'}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOfficials.map((official) => (
            <article
              key={official.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700"
            >
              <div className="flex items-start gap-4">
                {official.photo_url ? (
                  <img
                    src={official.photo_url}
                    alt={official.full_name}
                    className="h-16 w-16 shrink-0 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {official.full_name
                      .split(' ')
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join('')
                      .toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <Shield className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    {official.position}
                  </span>
                  <h2 className="mt-1.5 truncate text-base font-bold">{official.full_name}</h2>
                  {official.committee && (
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      {official.committee}
                    </p>
                  )}
                </div>
              </div>

              {(official.term_start || official.term_end) && (
                <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  Term: {official.term_start || 'Present'} — {official.term_end || 'Present'}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
