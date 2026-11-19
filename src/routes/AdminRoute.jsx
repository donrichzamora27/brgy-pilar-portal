import { Link, Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AdminRoute({ children }) {
  const { loading, isAuthenticated, isAdmin, profile, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Verifying admin credentials...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto my-12 max-w-md rounded-xl border border-amber-300 bg-amber-50 p-6 text-slate-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-slate-100">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <h2 className="text-base font-semibold">Admin Access Required</h2>
        </div>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
          Your account ({profile?.full_name || 'Resident'}) does not have administrator privileges for this workspace.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            to="/"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            Back to Portal
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return children;
}
