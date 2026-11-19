import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { getPublishedPostsByType } from '../../services/publicPostsService';
import { useOfficials } from '../../hooks/useOfficials';
import PostFilters from './PostFilters';
import PostCard from './PostCard';

const INITIAL_FILTERS = {
  query: '',
  officialId: '',
  dateFrom: '',
  dateTo: '',
  proposalStatus: '',
  targetPurok: '',
};

export default function PublicFeedView({ type, badgeLabel, title, description, Icon }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const { officials } = useOfficials({ mode: 'public' });

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPublishedPostsByType(type);
      setPosts(data);
    } catch (err) {
      setError(err.message || 'Unable to load posts.');
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    const timeoutId = setTimeout(loadPosts, 0);
    return () => clearTimeout(timeoutId);
  }, [loadPosts]);

  const purokOptions = useMemo(() => {
    if (type !== 'proposal') return [];
    const unique = new Set(posts.map((p) => p.target_purok).filter(Boolean));
    return Array.from(unique).sort();
  }, [posts, type]);

  const filteredPosts = useMemo(() => {
    const q = filters.query.trim().toLowerCase();

    return posts.filter((post) => {
      if (q) {
        const inTitle = post.title.toLowerCase().includes(q);
        const inContent = post.content.toLowerCase().includes(q);
        const inPurok = post.target_purok?.toLowerCase().includes(q);
        if (!inTitle && !inContent && !inPurok) return false;
      }

      if (filters.officialId) {
        const matchesOfficial = post.officials?.some((o) => o.id === filters.officialId);
        if (!matchesOfficial) return false;
      }

      if (filters.dateFrom && post.event_or_target_date < filters.dateFrom) {
        return false;
      }

      if (filters.dateTo && post.event_or_target_date > filters.dateTo) {
        return false;
      }

      if (type === 'proposal' && filters.proposalStatus) {
        if (post.proposal_status !== filters.proposalStatus) return false;
      }

      if (type === 'proposal' && filters.targetPurok) {
        if (post.target_purok !== filters.targetPurok) return false;
      }

      return true;
    });
  }, [posts, filters, type]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {Icon && <Icon className="h-3.5 w-3.5" />}
          <span>{badgeLabel}</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </div>

      <div className="mt-6">
        <PostFilters
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(INITIAL_FILTERS)}
          officials={officials}
          showProposalFilters={type === 'proposal'}
          purokOptions={purokOptions}
        />
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
            onClick={loadPosts}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            No published entries matched your filters.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}
