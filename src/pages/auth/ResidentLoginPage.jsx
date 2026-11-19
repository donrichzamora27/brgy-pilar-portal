import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function ResidentLoginPage() {
  const { signInWithPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const redirectTo = location.state?.from?.pathname || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    setSubmitting(true);
    const { error } = await signInWithPassword({ email, password });
    setSubmitting(false);

    if (error) {
      setErrorMsg(error.message || 'Unable to sign in. Please check your credentials.');
      return;
    }

    navigate(redirectTo, { replace: true });
  }

  return (
    <div className="mx-auto my-12 max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <LogIn className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        <h1 className="text-xl font-bold">Resident Sign In</h1>
      </div>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Sign in to react and comment on published announcements, achievements, and proposals.
      </p>

      {errorMsg && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="resident-email" className="block text-sm font-medium">
            Email Address
          </label>
          <input
            id="resident-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            placeholder="resident@example.com"
          />
        </div>

        <div>
          <label htmlFor="resident-password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="resident-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
        <span>
          New resident?{' '}
          <Link to="/register" className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
            Create an account
          </Link>
        </span>
        <Link to="/admin/login" className="hover:underline">
          Admin Login
        </Link>
      </div>
    </div>
  );
}
