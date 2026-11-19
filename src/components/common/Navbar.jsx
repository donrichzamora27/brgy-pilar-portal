import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Award,
  Building2,
  FileText,
  FolderKanban,
  LogIn,
  LogOut,
  Megaphone,
  PlusCircle,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DarkModeToggle from './DarkModeToggle';

export default function Navbar() {
  const { isAuthenticated, isAdmin, profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition ${
      isActive
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link
          to="/announcements"
          className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white"
        >
          <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <span>Barangay Transparency Portal</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1">
          <NavLink to="/announcements" className={navLinkClass}>
            <Megaphone className="h-4 w-4" />
            <span>Announcements</span>
          </NavLink>
          <NavLink to="/achievements" className={navLinkClass}>
            <Award className="h-4 w-4" />
            <span>Achievements</span>
          </NavLink>
          <NavLink to="/proposals" className={navLinkClass}>
            <FolderKanban className="h-4 w-4" />
            <span>Proposals</span>
          </NavLink>
          <NavLink to="/officials" className={navLinkClass}>
            <Users className="h-4 w-4" />
            <span>Officials</span>
          </NavLink>

          {isAdmin && (
            <>
              <NavLink to="/admin/posts" end className={navLinkClass}>
                <FileText className="h-4 w-4" />
                <span>Manage Posts</span>
              </NavLink>
              <NavLink to="/admin/posts/new" className={navLinkClass}>
                <PlusCircle className="h-4 w-4" />
                <span>New Post</span>
              </NavLink>
              <NavLink to="/admin/officials" className={navLinkClass}>
                <ShieldCheck className="h-4 w-4" />
                <span>Manage Officials</span>
              </NavLink>
            </>
          )}

          {!isAuthenticated ? (
            <>
              <NavLink to="/login" className={navLinkClass}>
                <LogIn className="h-4 w-4" />
                <span>Resident Login</span>
              </NavLink>
              <NavLink to="/admin/login" className={navLinkClass}>
                <ShieldCheck className="h-4 w-4" />
                <span>Admin</span>
              </NavLink>
            </>
          ) : (
            <div className="flex items-center gap-2 pl-2">
              <span className="hidden text-xs text-slate-500 xl:inline dark:text-slate-400">
                {profile?.full_name || 'Signed in'} ({isAdmin ? 'Admin' : 'Resident'})
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          <div className="pl-1">
            <DarkModeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}